const fs = require('fs');
const csvParser = require('csv-parser');
const ExcelJS = require('exceljs');
const { Student, Mentor, User, StudentRecord, StaffRecord } = require('../models');
const AuthService = require('./authService');
const AcademicService = require('./academicService');
const AuditService = require('./auditService');
const { AUDIT_ACTIONS, ROLES } = require('../config/constants');

function extractField(row, aliases) {
  const keys = Object.keys(row);
  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const key of keys) {
      const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanKey === cleanAlias && row[key] !== undefined && row[key] !== null) {
        return String(row[key]).trim();
      }
    }
  }
  return '';
}

class ImportService {
  /**
   * Standardized single pipeline to import students from CSV or Excel with robust cohort support
   */
  static async importStudents(filePath, hodUser, fileType = 'csv') {
    const rows = [];
    const errors = [];
    const duplicates = [];
    let createdCount = 0;
    let updatedCount = 0;
    let duplicateCount = 0;
    let failureCount = 0;

    if (fileType === 'xlsx' || fileType === 'excel' || filePath.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];
      const headers = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => headers.push(cell.value ? cell.value.toString().trim() : ''));
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              const val = cell.value;
              rowData[header] = typeof val === 'object' && val?.text ? val.text : val;
            }
          });
          rows.push(rowData);
        }
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rows.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // header is row 1
      const row = rows[i];

      const name = extractField(row, ['name', 'full name', 'fullname', 'student name']);
      const email = extractField(row, ['email', 'student email', 'email address', 'email id']).toLowerCase();
      const usn = extractField(row, ['usn', 'student id', 'studentid', 'university seat number', 'student usn']).toUpperCase();
      const phone = extractField(row, ['phone', 'phone number', 'mobile', 'contact', 'mobile number']);
      const department = extractField(row, ['department', 'dept', 'branch']) || hodUser.department || 'CSE';
      const program = extractField(row, ['program', 'course', 'degree']) || 'B.E.';
      const admissionYearRaw = extractField(row, ['admission year', 'admissionyear', 'year of admission', 'adm year']);
      const batchRaw = extractField(row, ['batch', 'academic batch', 'cohort']);
      const entryTypeRaw = extractField(row, ['entry type', 'entrytype', 'admission type', 'type']);
      const academicYearRaw = extractField(row, ['current academic year', 'academic year', 'academicyear', 'curr academic year']);
      const semesterRaw = extractField(row, ['current semester', 'semester', 'sem', 'current sem']);
      const section = (extractField(row, ['section', 'sec']) || 'A').toUpperCase();
      const statusRaw = extractField(row, ['status', 'current status', 'student status']);

      // Validation 1: Required fields
      if (!name || !email || !usn) {
        failureCount++;
        const missingField = !usn ? 'USN' : (!name ? 'Full Name' : 'Email');
        errors.push({
          row: rowNum,
          usn: usn || 'N/A',
          field: missingField.toLowerCase(),
          reason: `Missing required field: ${missingField}`,
        });
        continue;
      }

      // Validation 2: Email format
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        failureCount++;
        errors.push({
          row: rowNum,
          usn,
          field: 'email',
          reason: 'Invalid email format',
        });
        continue;
      }

      // Validation 3: Semester
      if (semesterRaw) {
        const sNum = Number(semesterRaw);
        if (isNaN(sNum) || sNum < 1 || sNum > 8) {
          failureCount++;
          errors.push({
            row: rowNum,
            usn,
            field: 'semester',
            reason: 'Invalid semester (must be between 1 and 8)',
          });
          continue;
        }
      }

      // Validation 4: Entry Type
      if (entryTypeRaw) {
        const uEntry = entryTypeRaw.toUpperCase();
        if (uEntry !== 'REGULAR' && uEntry !== 'LATERAL') {
          failureCount++;
          errors.push({
            row: rowNum,
            usn,
            field: 'entryType',
            reason: 'Invalid entry type (must be REGULAR or LATERAL)',
          });
          continue;
        }
      }

      // Validation 5: Status
      if (statusRaw) {
        const uStatus = statusRaw.toUpperCase();
        if (!['ACTIVE', 'GRADUATED', 'INACTIVE', 'DROPPED'].includes(uStatus)) {
          failureCount++;
          errors.push({
            row: rowNum,
            usn,
            field: 'status',
            reason: 'Invalid status (must be ACTIVE, GRADUATED, INACTIVE, or DROPPED)',
          });
          continue;
        }
      }

      // Duplicate Check: USN primary identifier
      const existingStudent = await Student.findOne({ usn }).populate('userId');
      if (existingStudent) {
        duplicateCount++;
        duplicates.push({ row: rowNum, usn, reason: 'Student with this USN already exists in database' });

        // Safe non-destructive update if academic state changes (never overwrite admissionYear, batch, mentorId)
        let modified = false;
        if (semesterRaw && Number(semesterRaw) !== existingStudent.semester) {
          existingStudent.semester = Number(semesterRaw);
          modified = true;
        }
        if (academicYearRaw && academicYearRaw !== existingStudent.academicYear) {
          existingStudent.academicYear = academicYearRaw;
          modified = true;
        }
        if (statusRaw && statusRaw.toUpperCase() !== existingStudent.status) {
          existingStudent.status = statusRaw.toUpperCase();
          modified = true;
        }
        if (modified) {
          await existingStudent.save();
          updatedCount++;
        }
        continue;
      }

      // Check if email belongs to another user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        failureCount++;
        errors.push({
          row: rowNum,
          usn,
          field: 'email',
          reason: `Email ${email} is already registered to another account`,
        });
        continue;
      }

      // Determine cohort parameters
      let admissionYear = admissionYearRaw ? Number(admissionYearRaw) : null;
      if (!admissionYear && batchRaw) {
        const match = String(batchRaw).match(/\d{4}/);
        if (match) admissionYear = Number(match[0]);
      }
      if (!admissionYear) {
        const usnYearMatch = usn.match(/^[0-9][A-Z]{2}(\d{2})/);
        if (usnYearMatch) {
          admissionYear = 2000 + Number(usnYearMatch[1]);
        } else {
          admissionYear = new Date().getFullYear();
        }
      }

      const entryType = entryTypeRaw
        ? entryTypeRaw.toUpperCase()
        : (Number(semesterRaw) === 3 ? 'LATERAL' : 'REGULAR');
      const batch = batchRaw
        ? String(batchRaw).trim()
        : (entryType === 'LATERAL' ? `${admissionYear}-LATERAL` : `${admissionYear}`);
      const semester = semesterRaw
        ? Number(semesterRaw)
        : (entryType === 'LATERAL' ? 3 : 1);
      const status = statusRaw ? statusRaw.toUpperCase() : 'ACTIVE';
      const academicYear = academicYearRaw || '2025-2026';

      try {
        const StudentRecord = require('../models/StudentRecord');
        await StudentRecord.create({
          usn,
          email,
          name,
          department,
          batch,
          semester,
          section,
          phone,
          isActivated: false,
          createdBy: hodUser._id,
        });

        const emailService = require('./emailService');
        const activationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate?tab=student`;
        emailService.sendActivationEmail(email, name, 'student', activationUrl).catch(e => console.error('Email error:', e.message));

        createdCount++;
      } catch (err) {
        failureCount++;
        errors.push({ row: rowNum, usn, field: 'registration', reason: err.message });
      }
    }

    // Clean up uploaded temp file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {
      // Ignore unlink error
    }

    const successCount = createdCount + updatedCount;

    await AuditService.logAction({
      actorId: hodUser._id,
      actorRole: hodUser.role,
      actorName: hodUser.name,
      action: AUDIT_ACTIONS.BULK_IMPORT,
      entity: 'Student',
      newValue: { createdCount, updatedCount, duplicateCount, failureCount },
      description: `Bulk imported students: ${createdCount} created, ${updatedCount} updated, ${duplicateCount} duplicate, ${failureCount} failed`,
    });

    return {
      totalProcessed: rows.length,
      createdCount,
      updatedCount,
      duplicateCount,
      failureCount,
      successCount,
      errors,
      duplicates,
    };
  }

  static async importStudentsCSV(filePath, hodUser) {
    return this.importStudents(filePath, hodUser, 'csv');
  }

  /**
   * Bulk import marks from CSV or Excel file
   */
  static async importMarks(filePath, user, fileType = 'csv') {
    let rawRecords = [];

    if (fileType === 'xlsx' || fileType === 'excel' || filePath.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) rowData[key] = cell.value;
        });
        rawRecords.push(rowData);
      });
    } else {
      // CSV parse
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const errors = [];
    let successCount = 0;
    let failureCount = 0;

    // Group records by student USN & semester
    const grouped = new Map();

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const usn = (row.usn || row.USN || '').trim().toUpperCase();
      const semNum = Number(row.semesterNumber || row.semester || row.Semester || 1);
      const subjectCode = (row.subjectCode || row.SubjectCode || '').trim().toUpperCase();
      const subjectName = (row.subjectName || row.SubjectName || subjectCode).trim();
      const credits = Number(row.credits || row.Credits || 3);
      const cie1 = Number(row.cie1 || row.CIE1 || 0);
      const cie2 = Number(row.cie2 || row.CIE2 || 0);
      const cie3 = Number(row.cie3 || row.CIE3 || 0);
      const finalMarks = Number(row.finalMarks || row.FinalMarks || row.SEE || 0);

      if (!usn || !subjectCode) {
        failureCount++;
        errors.push({ row: i + 2, usn: usn || 'N/A', reason: 'Missing USN or SubjectCode' });
        continue;
      }

      const key = `${usn}_${semNum}`;
      if (!grouped.has(key)) {
        grouped.set(key, { usn, semesterNumber: semNum, subjects: [] });
      }

      grouped.get(key).subjects.push({
        subjectCode,
        subjectName,
        credits,
        cie1,
        cie2,
        cie3,
        finalMarks,
      });
    }

    // Process each student semester update
    let mentorDoc = null;
    if (user.role === 'mentor') {
      mentorDoc = await Mentor.findOne({ userId: user._id });
    }

    for (const item of grouped.values()) {
      try {
        const student = await Student.findOne({ usn: item.usn });
        if (!student) {
          failureCount += item.subjects.length;
          errors.push({ usn: item.usn, reason: `Student with USN ${item.usn} not found` });
          continue;
        }

        // Enforce Mentor authorization: Must be assigned mentee
        if (user.role === 'mentor') {
          if (!mentorDoc || !student.mentorId || student.mentorId.toString() !== mentorDoc._id.toString()) {
            failureCount += item.subjects.length;
            errors.push({ usn: item.usn, reason: `Student ${item.usn} is not your assigned mentee` });
            continue;
          }
        }

        await AcademicService.updateStudentMarks({
          studentId: student._id,
          semesterNumber: item.semesterNumber,
          subjects: item.subjects,
          updatedByUser: user,
          reason: 'Bulk Academic Marks Import',
        });

        successCount += item.subjects.length;
      } catch (err) {
        failureCount += item.subjects.length;
        errors.push({ usn: item.usn, reason: err.message });
      }
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {
      // Ignore unlink error
    }

    return {
      successCount,
      failureCount,
      errors,
    };
  }

  /**
   * Bulk import attendance records from CSV or Excel file
   * Mapped via USN + Subject Code + Semester
   */
  static async importAttendance(filePath, user, fileType = 'csv') {
    let rawRecords = [];

    if (fileType === 'xlsx' || fileType === 'excel' || filePath.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) rowData[key] = cell.value;
        });
        rawRecords.push(rowData);
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const errors = [];
    let successCount = 0;
    let failureCount = 0;
    const Attendance = require('../models/Attendance');

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const usn = (row.usn || row.USN || '').trim().toUpperCase();
      const subjectCode = (row.subjectCode || row.SubjectCode || '').trim().toUpperCase();
      const subjectName = (row.subjectName || row.SubjectName || subjectCode).trim();
      const semester = Number(row.semester || row.Semester || 1);
      const totalClasses = Number(row.totalClasses || row.TotalClasses || 40);
      const classesAttended = Number(row.classesAttended || row.ClassesAttended || 0);

      if (!usn || !subjectCode) {
        failureCount++;
        errors.push({ row: i + 2, usn: usn || 'N/A', reason: 'Missing USN or SubjectCode' });
        continue;
      }

      try {
        const student = await Student.findOne({ usn });
        if (!student) {
          failureCount++;
          errors.push({ row: i + 2, usn, reason: `Student with USN ${usn} not found` });
          continue;
        }

        const percentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100) : 0;

        await Attendance.findOneAndUpdate(
          { studentId: student._id, subjectCode, semester },
          {
            usn,
            subjectName,
            totalClasses,
            classesAttended,
            attendancePercentage: percentage,
            academicYear: new Date().getFullYear().toString(),
          },
          { upsert: true, new: true }
        );

        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({ row: i + 2, usn, reason: err.message });
      }
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {
      // Ignore
    }

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: AUDIT_ACTIONS.ATTENDANCE_IMPORT || 'ATTENDANCE_IMPORT',
      entity: 'Attendance',
      newValue: { successCount, failureCount },
      description: `Bulk imported attendance: ${successCount} updated, ${failureCount} failed`,
    });

    return {
      totalProcessed: rawRecords.length,
      successCount,
      failureCount,
      errors,
    };
  }
  static normalizeKey(key) {
    if (!key) return '';
    return String(key).trim().toLowerCase().replace(/[\s_-]+/g, '');
  }

  static getRowValue(row, ...aliases) {
    for (const alias of aliases) {
      if (row[alias] !== undefined && row[alias] !== null && row[alias] !== '') {
        return row[alias];
      }
      const normAlias = ImportService.normalizeKey(alias);
      for (const [k, v] of Object.entries(row)) {
        if (ImportService.normalizeKey(k) === normAlias && v !== undefined && v !== null && v !== '') {
          return v;
        }
      }
    }
    return undefined;
  }

  static async previewCIEImport(filePath, user) {
    let rawRecords = [];
    const isExcel = filePath.endsWith('.xlsx') || filePath.endsWith('.xls');

    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) {
            const val = cell.value;
            rowData[key] = typeof val === 'object' && val?.text ? val.text : val;
          }
        });
        if (Object.keys(rowData).length > 0) {
          rawRecords.push(rowData);
        }
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    let warnings = [];
    let errors = [];
    let preview = [];
    const seenKeys = new Map();

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rawUsn = ImportService.getRowValue(row, 'usn', 'USN', 'studentUsn', 'Student USN');
      const usn = rawUsn ? String(rawUsn).trim().toUpperCase() : '';

      const rawSemester = ImportService.getRowValue(row, 'semester', 'Semester', 'semesterNumber', 'Sem', 'SEM');
      const semester = rawSemester !== undefined && rawSemester !== '' ? Number(rawSemester) : 1;

      const rawSubCode = ImportService.getRowValue(row, 'subjectCode', 'SubjectCode', 'subject_code', 'Subject Code', 'subCode');
      const subjectCode = rawSubCode ? String(rawSubCode).trim().toUpperCase() : '';

      const rawSubName = ImportService.getRowValue(row, 'subjectName', 'SubjectName', 'subject_name', 'Subject Name');
      const subjectName = rawSubName ? String(rawSubName).trim() : subjectCode;

      const rawCredits = ImportService.getRowValue(row, 'credits', 'Credits', 'credit', 'Credit');
      const credits = rawCredits !== undefined && !isNaN(Number(rawCredits)) ? Number(rawCredits) : 3;

      const rawCie1 = ImportService.getRowValue(row, 'cie1', 'CIE1', 'CIE 1', 'cie_1', 'CIE-1');
      const rawCie2 = ImportService.getRowValue(row, 'cie2', 'CIE2', 'CIE 2', 'cie_2', 'CIE-2');
      const rawCie3 = ImportService.getRowValue(row, 'cie3', 'CIE3', 'CIE 3', 'cie_3', 'CIE-3');

      let cie1 = 0;
      let cie2 = 0;
      let cie3 = 0;
      let invalidMark = false;

      if (rawCie1 !== undefined && rawCie1 !== '') {
        const num = Number(rawCie1);
        if (isNaN(num) || num < 0 || num > 50) invalidMark = true;
        else cie1 = num;
      }
      if (rawCie2 !== undefined && rawCie2 !== '') {
        const num = Number(rawCie2);
        if (isNaN(num) || num < 0 || num > 50) invalidMark = true;
        else cie2 = num;
      }
      if (rawCie3 !== undefined && rawCie3 !== '') {
        const num = Number(rawCie3);
        if (isNaN(num) || num < 0 || num > 50) invalidMark = true;
        else cie3 = num;
      }

      let status = 'valid';
      let rowReasons = [];

      if (!usn) {
        status = 'error';
        rowReasons.push('Missing student USN');
      }
      if (!subjectCode) {
        status = 'error';
        rowReasons.push('Missing subject code');
      }
      if (isNaN(semester) || semester < 1 || semester > 8) {
        status = 'error';
        rowReasons.push('Invalid semester (must be between 1 and 8)');
      }
      if (invalidMark) {
        status = 'error';
        rowReasons.push('CIE marks must be valid numbers between 0 and 50');
      }

      // Check in-file duplicates
      if (usn && subjectCode && !isNaN(semester)) {
        const fileKey = `${usn}_${semester}_${subjectCode}`;
        if (seenKeys.has(fileKey)) {
          status = 'duplicate';
          rowReasons.push(`Duplicate record for USN ${usn} in Semester ${semester} for subject ${subjectCode}`);
        } else {
          seenKeys.set(fileKey, true);
        }
      }

      let studentName = '';
      let student = null;
      if (usn) {
        student = await Student.findOne({ usn }).populate('userId', 'name email');
        if (!student) {
          status = 'error';
          rowReasons.push(`Student with USN ${usn} not found in system`);
        } else {
          studentName = student.userId?.name || 'Student';

          // Check if record already exists in database for this student & subject (warning: will be updated)
          if (status === 'valid') {
            const sem = student.academics.find((s) => s.semesterNumber === semester);
            const existingSub = sem?.subjects?.find((s) => s.subjectCode.toUpperCase() === subjectCode);
            if (existingSub) {
              status = 'warning';
              rowReasons.push(`Existing record found in database; confirming will update official CIE marks`);
            } else if ((rawCie1 !== undefined && rawCie1 !== '') && (rawCie2 === undefined || rawCie2 === '') && (rawCie3 === undefined || rawCie3 === '')) {
              status = 'warning';
              rowReasons.push('Partial CIE record: only CIE 1 marks provided');
            }
          }
        }
      }

      if (status === 'error') {
        errors.push({ row: i + 2, usn: usn || 'N/A', subjectCode: subjectCode || 'N/A', reason: rowReasons.join('; ') });
      } else if (status === 'warning') {
        warnings.push({ row: i + 2, usn, subjectCode, reason: rowReasons.join('; ') });
      }

      preview.push({
        row: i + 2,
        usn,
        studentName,
        subjectCode,
        subjectName,
        semester,
        credits,
        cie1,
        cie2,
        cie3,
        status,
        reason: rowReasons.join('; '),
      });
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {}

    const validRows = preview.filter((r) => r.status === 'valid').length;
    const warningRows = preview.filter((r) => r.status === 'warning').length;
    const errorRows = preview.filter((r) => r.status === 'error').length;
    const duplicateRows = preview.filter((r) => r.status === 'duplicate').length;
    const readyToImport = validRows + warningRows;

    return {
      totalRows: preview.length,
      validRows,
      warningRows,
      errorRows,
      duplicateRows,
      readyToImport,
      summary: {
        totalRows: preview.length,
        validRows,
        warningRows,
        errorRows,
        duplicateRows,
        readyToImport,
      },
      warnings,
      errors,
      preview,
    };
  }

  static async confirmCIEImport(previewData, user, io) {
    let successCount = 0;
    let failureCount = 0;
    let errors = [];

    const Notification = require('../models/Notification');
    const eligibleRows = previewData.filter((r) => r.status === 'valid' || r.status === 'warning');

    const grouped = new Map();
    for (const row of eligibleRows) {
      const key = `${row.usn}_${row.semester}`;
      if (!grouped.has(key)) {
        grouped.set(key, { usn: row.usn, semesterNumber: row.semester, subjects: [] });
      }
      grouped.get(key).subjects.push({
        subjectCode: row.subjectCode,
        subjectName: row.subjectName || row.subjectCode,
        credits: row.credits || 3,
        cie1: row.cie1 || 0,
        cie2: row.cie2 || 0,
        cie3: row.cie3 || 0,
      });
    }

    for (const item of grouped.values()) {
      try {
        const student = await Student.findOne({ usn: item.usn }).populate('userId', 'name email');
        if (!student) {
          failureCount += item.subjects.length;
          errors.push({ usn: item.usn, reason: `Student with USN ${item.usn} not found` });
          continue;
        }

        await AcademicService.updateStudentMarks({
          studentId: student._id,
          semesterNumber: item.semesterNumber,
          subjects: item.subjects,
          updatedByUser: user,
          reason: 'Bulk CIE Import',
        });

        if (io && student.userId?._id) {
          io.to(student.userId._id.toString()).emit('marks:updated', { message: 'CIE marks updated' });
        }

        if (Notification && Notification.create && student.userId?._id) {
          await Notification.create({
            recipientId: student.userId._id,
            senderId: user._id,
            title: 'CIE Marks Updated',
            message: `Your official CIE marks for Semester ${item.semesterNumber} have been updated.`,
            category: 'academic',
            link: '/student/academics',
          }).catch(() => null);

          if (student.mentorId) {
            const mentor = await Mentor.findById(student.mentorId).populate('userId', 'name email');
            if (mentor?.userId?._id) {
              await Notification.create({
                recipientId: mentor.userId._id,
                senderId: user._id,
                title: 'Mentee Marks Updated',
                message: `CIE marks for mentee ${student.usn} (${student.userId?.name || ''}) have been imported.`,
                category: 'academic',
                link: '/mentor/students',
              }).catch(() => null);
            }
          }
        }

        successCount += item.subjects.length;
      } catch (err) {
        failureCount += item.subjects.length;
        errors.push({ usn: item.usn, reason: err.message });
      }
    }

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: AUDIT_ACTIONS.CIE_IMPORT || 'CIE_IMPORT',
      entity: 'Student',
      newValue: {
        importType: 'CIE',
        totalRows: previewData.length,
        validRows: previewData.filter((r) => r.status === 'valid').length,
        warningRows: previewData.filter((r) => r.status === 'warning').length,
        errorRows: previewData.filter((r) => r.status === 'error').length,
        duplicateRows: previewData.filter((r) => r.status === 'duplicate').length,
        importedRows: successCount,
        failedRows: failureCount,
        status: failureCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
        department: user.department || 'ALL',
      },
      description: `Confirmed CIE import: ${successCount} successful, ${failureCount} failed`,
    });

    return {
      successCount,
      failureCount,
      importedRecords: successCount,
      errors,
    };
  }

  static async previewAttendanceImport(filePath, user) {
    let rawRecords = [];
    const isExcel = filePath.endsWith('.xlsx') || filePath.endsWith('.xls');

    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) {
            const val = cell.value;
            rowData[key] = typeof val === 'object' && val?.text ? val.text : val;
          }
        });
        if (Object.keys(rowData).length > 0) {
          rawRecords.push(rowData);
        }
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    let warnings = [];
    let errors = [];
    let preview = [];
    const seenKeys = new Map();
    const Attendance = require('../models/Attendance');

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rawUsn = ImportService.getRowValue(row, 'usn', 'USN', 'studentUsn', 'Student USN');
      const usn = rawUsn ? String(rawUsn).trim().toUpperCase() : '';

      const rawSubCode = ImportService.getRowValue(row, 'subjectCode', 'SubjectCode', 'subject_code', 'Subject Code', 'subCode');
      const subjectCode = rawSubCode ? String(rawSubCode).trim().toUpperCase() : '';

      const rawSubName = ImportService.getRowValue(row, 'subjectName', 'SubjectName', 'subject_name', 'Subject Name');
      const subjectName = rawSubName ? String(rawSubName).trim() : subjectCode;

      const rawSemester = ImportService.getRowValue(row, 'semester', 'Semester', 'semesterNumber', 'Sem', 'SEM');
      const semester = rawSemester !== undefined && rawSemester !== '' ? Number(rawSemester) : 1;

      const rawYear = ImportService.getRowValue(row, 'academicYear', 'AcademicYear', 'year', 'Year');
      const academicYear = (rawYear ? String(rawYear).trim() : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`);

      const rawTotal = ImportService.getRowValue(row, 'totalClasses', 'TotalClasses', 'total_classes', 'Total Classes', 'total');
      const rawAttended = ImportService.getRowValue(row, 'classesAttended', 'ClassesAttended', 'classes_attended', 'Classes Attended', 'attended');

      let totalClasses = 0;
      let classesAttended = 0;
      let invalidNumbers = false;

      if (rawTotal === undefined || rawTotal === '' || isNaN(Number(rawTotal))) {
        invalidNumbers = true;
      } else {
        totalClasses = Number(rawTotal);
      }

      if (rawAttended === undefined || rawAttended === '' || isNaN(Number(rawAttended))) {
        invalidNumbers = true;
      } else {
        classesAttended = Number(rawAttended);
      }

      let status = 'valid';
      let rowReasons = [];

      if (!usn) {
        status = 'error';
        rowReasons.push('Missing student USN');
      }
      if (!subjectCode) {
        status = 'error';
        rowReasons.push('Missing subject code');
      }
      if (isNaN(semester) || semester < 1 || semester > 8) {
        status = 'error';
        rowReasons.push('Invalid semester (must be between 1 and 8)');
      }
      if (invalidNumbers || totalClasses < 0 || classesAttended < 0) {
        status = 'error';
        rowReasons.push('Total classes and classes attended must be non-negative numbers');
      } else if (classesAttended > totalClasses) {
        status = 'error';
        rowReasons.push(`Classes attended (${classesAttended}) cannot exceed total classes (${totalClasses})`);
      }

      const percentage = totalClasses > 0 ? Math.round((classesAttended / totalClasses) * 100 * 10) / 10 : 0;

      // In-file duplicate check
      if (usn && subjectCode && !isNaN(semester)) {
        const fileKey = `${usn}_${semester}_${subjectCode}`;
        if (seenKeys.has(fileKey)) {
          status = 'duplicate';
          rowReasons.push(`Duplicate attendance record for USN ${usn} in Semester ${semester} for subject ${subjectCode}`);
        } else {
          seenKeys.set(fileKey, true);
        }
      }

      let studentName = '';
      if (usn) {
        const student = await Student.findOne({ usn }).populate('userId', 'name email');
        if (!student) {
          status = 'error';
          rowReasons.push(`Student with USN ${usn} not found in system`);
        } else {
          studentName = student.userId?.name || 'Student';

          if (status === 'valid') {
            const existing = await Attendance.findOne({ studentId: student._id, subjectCode, semester });
            if (existing) {
              status = 'warning';
              rowReasons.push(`Existing attendance record found; confirming will update official attendance`);
            } else if (totalClasses === 0) {
              status = 'warning';
              rowReasons.push('Total classes is 0; attendance percentage recorded as 0%');
            } else if (percentage < 75) {
              status = 'warning';
              rowReasons.push(`Low attendance (${percentage}%) - below statutory 75% threshold`);
            }
          }
        }
      }

      if (status === 'error') {
        errors.push({ row: i + 2, usn: usn || 'N/A', subjectCode: subjectCode || 'N/A', reason: rowReasons.join('; ') });
      } else if (status === 'warning') {
        warnings.push({ row: i + 2, usn, subjectCode, reason: rowReasons.join('; ') });
      }

      preview.push({
        row: i + 2,
        usn,
        studentName,
        subjectCode,
        subjectName,
        semester,
        academicYear,
        totalClasses,
        classesAttended,
        attendancePercentage: percentage,
        status,
        reason: rowReasons.join('; '),
      });
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {}

    const validRows = preview.filter((r) => r.status === 'valid').length;
    const warningRows = preview.filter((r) => r.status === 'warning').length;
    const errorRows = preview.filter((r) => r.status === 'error').length;
    const duplicateRows = preview.filter((r) => r.status === 'duplicate').length;
    const readyToImport = validRows + warningRows;

    return {
      totalRows: preview.length,
      validRows,
      warningRows,
      errorRows,
      duplicateRows,
      readyToImport,
      summary: {
        totalRows: preview.length,
        validRows,
        warningRows,
        errorRows,
        duplicateRows,
        readyToImport,
      },
      warnings,
      errors,
      preview,
    };
  }

  static async confirmAttendanceImport(previewData, user, importBatchId) {
    let successCount = 0;
    let failureCount = 0;
    let errors = [];
    const validRows = previewData.filter((r) => r.status === 'valid' || r.status === 'warning');

    const Attendance = require('../models/Attendance');
    const Notification = require('../models/Notification');

    for (const row of validRows) {
      try {
        const student = await Student.findOne({ usn: row.usn }).populate('userId', 'name email');
        if (!student) {
          failureCount++;
          errors.push({ usn: row.usn, reason: `Student with USN ${row.usn} not found` });
          continue;
        }

        const percentage = row.totalClasses > 0 ? Math.round((row.classesAttended / row.totalClasses) * 100 * 10) / 10 : 0;

        await Attendance.findOneAndUpdate(
          { studentId: student._id, subjectCode: row.subjectCode, semester: row.semester },
          {
            studentId: student._id,
            usn: row.usn,
            subjectCode: row.subjectCode,
            subjectName: row.subjectName || row.subjectCode,
            semester: row.semester,
            academicYear: row.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            totalClasses: row.totalClasses,
            classesAttended: row.classesAttended,
            attendancePercentage: percentage,
            importedBy: user._id,
            importBatchId: importBatchId || `ATT_${Date.now()}`,
          },
          { upsert: true, new: true }
        );

        if (Notification && Notification.create && student.userId?._id) {
          await Notification.create({
            recipientId: student.userId._id,
            senderId: user._id,
            title: 'Attendance Records Updated',
            message: `Official attendance for ${row.subjectCode} (Sem ${row.semester}) has been updated (${percentage}%).`,
            category: 'attendance',
            link: '/student/overview',
          }).catch(() => null);

          if (percentage < 75) {
            await Notification.create({
              recipientId: student.userId._id,
              senderId: user._id,
              title: 'Low Attendance Alert',
              message: `Your attendance in ${row.subjectCode} is below statutory 75% (${percentage}%). Please meet your faculty mentor.`,
              category: 'attendance',
              link: '/student/overview',
            }).catch(() => null);
          }

          if (student.mentorId) {
            const mentor = await Mentor.findById(student.mentorId).populate('userId', 'name email');
            if (mentor?.userId?._id) {
              await Notification.create({
                recipientId: mentor.userId._id,
                senderId: user._id,
                title: 'Mentee Attendance Updated',
                message: `Attendance for mentee ${student.usn} (${row.subjectCode}) is recorded at ${percentage}%.`,
                category: 'attendance',
                link: '/mentor/students',
              }).catch(() => null);
            }
          }
        }

        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({ usn: row.usn, reason: err.message });
      }
    }

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: AUDIT_ACTIONS.ATTENDANCE_IMPORT || 'ATTENDANCE_IMPORT',
      entity: 'Attendance',
      newValue: {
        importType: 'ATTENDANCE',
        totalRows: previewData.length,
        validRows: previewData.filter((r) => r.status === 'valid').length,
        warningRows: previewData.filter((r) => r.status === 'warning').length,
        errorRows: previewData.filter((r) => r.status === 'error').length,
        duplicateRows: previewData.filter((r) => r.status === 'duplicate').length,
        importedRows: successCount,
        failedRows: failureCount,
        status: failureCount === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS',
        department: user.department || 'ALL',
      },
      description: `Confirmed attendance import: ${successCount} successful, ${failureCount} failed`,
    });

    return {
      successCount,
      failureCount,
      importedRecords: successCount,
      errors,
    };
  }

  static async previewMentorImport(filePath, user) {
    let rawRecords = [];
    const isExcel = filePath.endsWith('.xlsx') || filePath.endsWith('.xls');

    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) {
            const val = cell.value;
            rowData[key] = typeof val === 'object' && val?.text ? val.text : val;
          }
        });
        if (Object.keys(rowData).length > 0) {
          rawRecords.push(rowData);
        }
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    let warnings = [];
    let errors = [];
    let preview = [];
    const seenEmpIds = new Set();
    const seenEmails = new Set();

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const rawEmpId = ImportService.getRowValue(row, 'mentorId', 'Mentor ID', 'employeeId', 'Employee ID', 'empId', 'Emp ID', 'id');
      const employeeId = rawEmpId ? String(rawEmpId).trim().toUpperCase() : '';

      const rawName = ImportService.getRowValue(row, 'mentorName', 'Mentor Name', 'name', 'Name', 'fullName', 'Full Name', 'facultyName');
      const name = rawName ? String(rawName).trim() : '';

      const rawEmail = ImportService.getRowValue(row, 'email', 'Email', 'mentorEmail', 'Mentor Email', 'emailAddress', 'officialEmail');
      const email = rawEmail ? String(rawEmail).trim().toLowerCase() : '';

      const rawDept = ImportService.getRowValue(row, 'department', 'Department', 'dept', 'Dept', 'branch');
      const department = rawDept ? String(rawDept).trim().toUpperCase() : (user.department || 'CSE');

      const rawDesig = ImportService.getRowValue(row, 'designation', 'Designation', 'role', 'post');
      const designation = rawDesig ? String(rawDesig).trim() : 'Assistant Professor';

      const rawPhone = ImportService.getRowValue(row, 'phone', 'Phone', 'mobile', 'Mobile', 'contact');
      const phone = rawPhone ? String(rawPhone).trim() : '';

      const rawMax = ImportService.getRowValue(row, 'maxMentees', 'Max Mentees', 'capacity', 'Capacity', 'quota');
      const maxMentees = rawMax !== undefined && !isNaN(Number(rawMax)) && Number(rawMax) > 0 ? Number(rawMax) : 20;

      const rawStatus = ImportService.getRowValue(row, 'status', 'Status', 'mentorStatus');
      const statusValue = rawStatus ? String(rawStatus).trim().toUpperCase() : 'ACTIVE';

      let status = 'valid';
      let rowReasons = [];

      if (!employeeId) {
        status = 'error';
        rowReasons.push('Missing Mentor ID / Employee ID');
      }
      if (!name) {
        status = 'error';
        rowReasons.push('Missing Mentor Name');
      }
      if (!email) {
        status = 'error';
        rowReasons.push('Missing Email');
      } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        status = 'error';
        rowReasons.push('Invalid Email format');
      }

      // In-file duplicate check
      if (employeeId && seenEmpIds.has(employeeId)) {
        status = 'duplicate';
        rowReasons.push(`Duplicate Mentor ID ${employeeId} in file`);
      } else if (employeeId) {
        seenEmpIds.add(employeeId);
      }

      if (email && seenEmails.has(email)) {
        status = 'duplicate';
        rowReasons.push(`Duplicate Email ${email} in file`);
      } else if (email) {
        seenEmails.add(email);
      }

      // Check DB existing records
      if (status === 'valid') {
        const [existingStaff, existingUser, existingMentor] = await Promise.all([
          StaffRecord.findOne({ $or: [{ employeeId }, { email }] }),
          User.findOne({ email }),
          Mentor.findOne({ employeeId }),
        ]);

        if (existingStaff) {
          if (existingStaff.isActivated) {
            status = 'warning';
            rowReasons.push('Staff record already exists and is activated; confirm will refresh designation/quota');
          } else {
            status = 'warning';
            rowReasons.push('Staff record already exists pending activation; will update details');
          }
        } else if (existingUser && existingUser.isActivated) {
          status = 'warning';
          rowReasons.push('User account already active for this email');
        } else if (existingMentor) {
          status = 'warning';
          rowReasons.push('Mentor profile already exists with this ID; will sync');
        }
      }

      if (status === 'error') {
        errors.push({ row: i + 2, employeeId: employeeId || 'N/A', name: name || 'N/A', reason: rowReasons.join('; ') });
      } else if (status === 'warning') {
        warnings.push({ row: i + 2, employeeId, name, reason: rowReasons.join('; ') });
      }

      preview.push({
        row: i + 2,
        employeeId,
        name,
        email,
        department,
        designation,
        phone,
        maxMentees,
        mentorStatus: statusValue,
        status,
        reason: rowReasons.join('; '),
      });
    }

    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (_err) {}

    const validRows = preview.filter((r) => r.status === 'valid').length;
    const warningRows = preview.filter((r) => r.status === 'warning').length;
    const errorRows = preview.filter((r) => r.status === 'error').length;
    const duplicateRows = preview.filter((r) => r.status === 'duplicate').length;
    const readyToImport = validRows + warningRows;

    return {
      totalRows: preview.length,
      validRows,
      warningRows,
      errorRows,
      duplicateRows,
      readyToImport,
      summary: {
        totalRows: preview.length,
        validRows,
        warningRows,
        errorRows,
        duplicateRows,
        readyToImport,
      },
      warnings,
      errors,
      preview,
    };
  }

  static async confirmMentorImport(previewData, user) {
    const crypto = require('crypto');
    let successCount = 0;
    let failureCount = 0;
    let errors = [];
    const validRows = previewData.filter((r) => r.status === 'valid' || r.status === 'warning');

    for (const row of validRows) {
      try {
        const empId = row.employeeId.toUpperCase();
        const email = row.email.toLowerCase();

        // 1. Create or Update StaffRecord
        let staff = await StaffRecord.findOne({
          $or: [{ employeeId: empId }, { email }],
        });

        if (!staff) {
          staff = await StaffRecord.create({
            employeeId: empId,
            email,
            name: row.name,
            role: ROLES.MENTOR,
            department: row.department,
            designation: row.designation,
            phone: row.phone || '',
            isActivated: false,
            createdBy: user._id,
          });
        } else {
          staff.name = row.name;
          staff.department = row.department;
          staff.designation = row.designation;
          if (row.phone) staff.phone = row.phone;
          staff.role = ROLES.MENTOR;
          await staff.save();
        }

        // 2. Create or Update User (unactivated if new)
        let targetUser = await User.findOne({ email });
        if (!targetUser) {
          const tempPlainPassword = crypto.randomBytes(16).toString('hex');
          targetUser = await User.create({
            name: row.name,
            email,
            password: tempPlainPassword, // pre-save hook hashes this
            role: ROLES.MENTOR,
            department: row.department,
            phone: row.phone || '',
            isActivated: false,
            isActive: false,
            isEmailVerified: true,
          });
        } else {
          targetUser.name = row.name;
          targetUser.department = row.department;
          if (row.phone) targetUser.phone = row.phone;
          targetUser.role = ROLES.MENTOR;
          await targetUser.save();
        }

        // 3. Create or Update Mentor profile
        let mentor = await Mentor.findOne({
          $or: [{ employeeId: empId }, { userId: targetUser._id }],
        });

        if (!mentor) {
          mentor = await Mentor.create({
            userId: targetUser._id,
            employeeId: empId,
            department: row.department,
            designation: row.designation,
            maxMentees: Number(row.maxMentees) || 20,
            isActive: true,
          });
        } else {
          mentor.userId = targetUser._id;
          mentor.employeeId = empId;
          mentor.department = row.department;
          mentor.designation = row.designation;
          mentor.maxMentees = Number(row.maxMentees) || mentor.maxMentees || 20;
          await mentor.save();
        }

        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({ employeeId: row.employeeId, reason: err.message });
      }
    }

    await AuditService.logAction({
      actorId: user._id,
      actorRole: user.role,
      actorName: user.name,
      action: 'MENTOR_IMPORT',
      entity: 'Mentor',
      newValue: {
        totalRows: previewData.length,
        importedCount: successCount,
        failedCount: failureCount,
        department: user.department || 'ALL',
      },
      description: `Confirmed mentor master import: ${successCount} processed, ${failureCount} failed`,
    });

    return {
      successCount,
      failureCount,
      importedRecords: successCount,
      errors,
    };
  }

  static async previewMentorImport(filePath, hodUser) {
    let rawRecords = [];
    const isExcel = filePath.endsWith('.xlsx') || filePath.endsWith('.xls');
    const csvParser = require('csv-parser');
    const ExcelJS = require('exceljs');

    if (isExcel) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];
      const headers = [];
      sheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || '').trim();
      });

      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          const key = headers[colNumber];
          if (key) rowData[key] = typeof cell.value === 'object' && cell.value?.text ? cell.value.text : cell.value;
        });
        if (Object.keys(rowData).length > 0) rawRecords.push(rowData);
      });
    } else {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => rawRecords.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    let validRows = 0;
    let errorRows = 0;
    let preview = [];
    const { StaffRecord, User } = require('../models');

    for (let i = 0; i < rawRecords.length; i++) {
      const row = rawRecords[i];
      const employeeId = ImportService.getRowValue(row, 'employeeId', 'Employee ID', 'EmpID', 'id');
      const name = ImportService.getRowValue(row, 'name', 'Name');
      const email = ImportService.getRowValue(row, 'email', 'Email');
      const department = ImportService.getRowValue(row, 'department', 'Dept', 'Department');
      const designation = ImportService.getRowValue(row, 'designation', 'Designation');
      const rawRole = ImportService.getRowValue(row, 'role', 'Role');

      let status = 'valid';
      let rowReasons = [];

      if (!employeeId) { status = 'error'; rowReasons.push('Missing Employee ID'); }
      if (!name) { status = 'error'; rowReasons.push('Missing Name'); }
      if (!email) { status = 'error'; rowReasons.push('Missing Email'); }
      if (!department) { status = 'error'; rowReasons.push('Missing Department'); }
      
      const role = rawRole ? String(rawRole).toLowerCase() : 'mentor';
      if (!['mentor', 'mentoring_coordinator', 'exam_coordinator', 'tpo'].includes(role)) {
         status = 'error'; rowReasons.push('Invalid role (must be mentor, mentoring_coordinator, exam_coordinator, or tpo)');
      }

      if (status === 'valid') {
        const existingStaff = await StaffRecord.findOne({ $or: [{ employeeId: String(employeeId).toUpperCase() }, { email: String(email).toLowerCase() }] });
        if (existingStaff) {
          status = 'duplicate';
          rowReasons.push('StaffRecord with this Employee ID or Email already exists');
        } else {
           const existingUser = await User.findOne({ email: String(email).toLowerCase() });
           if (existingUser) {
             status = 'error';
             rowReasons.push('Email is already registered to another account');
           }
        }
      }

      if (status === 'error') errorRows++;
      if (status === 'valid' || status === 'duplicate') validRows++;

      preview.push({
        row: i + 2,
        employeeId: employeeId ? String(employeeId).toUpperCase() : '',
        name,
        email: email ? String(email).toLowerCase() : '',
        department,
        designation: designation || 'Faculty',
        role,
        status,
        reason: rowReasons.join('; ')
      });
    }

    try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch(e) {}

    return { totalProcessed: rawRecords.length, validRows, errorRows, preview };
  }

  static async confirmMentorImport(previewData, hodUser) {
    let successCount = 0;
    let failureCount = 0;
    let duplicates = [];
    let errors = [];
    const { StaffRecord, User } = require('../models');
    const emailService = require('./emailService');
    const AuditService = require('./auditService');

    for (const item of previewData) {
      if (item.status === 'error' || item.status === 'duplicate') continue;
      
      try {
        await StaffRecord.create({
          employeeId: item.employeeId,
          email: item.email,
          name: item.name,
          department: item.department,
          designation: item.designation,
          role: item.role,
          isActivated: false,
          createdBy: hodUser._id
        });

        // Also create User with isActivated: false so they can request activation link if needed
        await User.create({
          name: item.name,
          email: item.email,
          role: item.role,
          department: item.department,
          isActive: true,
          isActivated: false,
          isEmailVerified: false
        });

        const activationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/activate?tab=staff`;
        emailService.sendActivationEmail(item.email, item.name, 'staff', activationUrl).catch(e => console.error('Email err:', e.message));

        successCount++;
      } catch (err) {
        failureCount++;
        errors.push({ employeeId: item.employeeId, reason: err.message });
      }
    }

    await AuditService.logAction({
      actorId: hodUser._id,
      actorRole: hodUser.role,
      actorName: hodUser.name,
      action: 'MENTOR_IMPORT',
      entity: 'StaffRecord',
      newValue: { successCount, failureCount },
      description: `Bulk imported mentors: ${successCount} created, ${failureCount} failed`
    });

    return { successCount, failureCount, errors };
  }
}

module.exports = ImportService;


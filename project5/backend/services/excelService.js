const ExcelJS = require('exceljs');
const { Student, Mentor } = require('../models');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');

class ExcelService {
  /**
   * Export Department / Institutional Students Roster to styled Excel Buffer
   */
  static async exportStudentsExcel(department = 'ALL') {
    const query = department === 'ALL' ? {} : { department };
    const students = await Student.find(query)
      .populate('userId', 'name email phone')
      .populate({ path: 'mentorId', populate: { path: 'userId', select: 'name email' } });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MentorConnect Academic System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Student Directory & Performance');

    // Title Block
    sheet.mergeCells('A1:L1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `MENTORCONNECT — STUDENT ACADEMIC ROSTER (${department === 'ALL' ? 'ALL DEPARTMENTS' : department})`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Headers
    const headers = [
      'USN',
      'Student Name',
      'Email',
      'Phone',
      'Department',
      'Semester',
      'Section',
      'Mentor Name',
      'Current SGPA',
      'Cumulative CGPA',
      'Active Backlogs',
      'Risk Level',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Data Rows
    students.forEach((s) => {
      const { cgpa, totalActiveBacklogs, semesters } = calculateCumulativeCGPA(s.academics);
      const latestSem = semesters.length > 0 ? semesters[semesters.length - 1] : null;
      const sgpa = latestSem ? latestSem.sgpa : 0;

      const row = sheet.addRow([
        s.usn,
        s.userId?.name || 'N/A',
        s.userId?.email || 'N/A',
        s.userId?.phone || 'N/A',
        s.department,
        s.semester,
        s.section,
        s.mentorId?.userId?.name ? `Prof. ${s.mentorId.userId.name}` : 'Unassigned',
        sgpa,
        cgpa,
        totalActiveBacklogs,
        s.riskProfile?.riskLevel || 'Low',
      ]);

      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9 };
        cell.alignment = { vertical: 'middle', horizontal: colNumber >= 6 && colNumber <= 11 ? 'center' : 'left' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // Auto-fit column widths
    sheet.columns.forEach((column) => {
      let maxLen = 12;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const val = String(cell.value || '');
        if (val.length > maxLen) maxLen = Math.min(val.length + 3, 35);
      });
      column.width = maxLen;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  /**
   * Export Faculty Mentors Roster to styled Excel Buffer
   */
  static async exportMentorsExcel(department = 'ALL') {
    const query = department === 'ALL' ? {} : { department };
    const mentors = await Mentor.find(query).populate('userId', 'name email phone');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Faculty Mentors Directory');

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'MENTORCONNECT — FACULTY MENTORS DIRECTORY';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    const headers = [
      'Employee ID',
      'Faculty Name',
      'Email',
      'Department',
      'Designation',
      'Mentees Assigned',
      'Max Capacity',
      'Rating Average (1-5)',
    ];

    const headerRow = sheet.addRow(headers);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    for (const m of mentors) {
      const menteeCount = await Student.countDocuments({ mentorId: m._id });
      sheet.addRow([
        m.employeeId,
        m.userId?.name || 'N/A',
        m.userId?.email || 'N/A',
        m.department,
        m.designation,
        menteeCount,
        m.maxMentees || 30,
        m.ratingAverage || '0.0',
      ]);
    }

    sheet.columns.forEach((col) => {
      col.width = 20;
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = ExcelService;

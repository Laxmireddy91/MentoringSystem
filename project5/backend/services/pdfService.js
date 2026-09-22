const PDFDocument = require('pdfkit');
const { Student } = require('../models');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');
const AppError = require('../utils/AppError');

class PdfService {
  /**
   * Generate official Student Academic Report Card as a PDF Buffer
   */
  static async generateReportCardPDF(studentId, semesterNumber) {
    const student = await Student.findById(studentId)
      .populate('userId', 'name email')
      .populate({
        path: 'mentorId',
        populate: { path: 'userId', select: 'name email designation' },
      });

    if (!student) throw new AppError('Student record not found', 404);

    const semNum = Number(semesterNumber) || student.semester || 1;
    const semester = student.academics.find((s) => s.semesterNumber === semNum) || {
      semesterNumber: semNum,
      sgpa: 0,
      totalCredits: 0,
      backlogsCount: 0,
      subjects: [],
    };

    const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(student.academics);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // --- Header ---
      doc
        .fillColor('#1e1b4b')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('MENTORCONNECT ACADEMIC PLATFORM', { align: 'center' });

      doc
        .fillColor('#4f46e5')
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('OFFICIAL STUDENT PERFORMANCE REPORT CARD', { align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(`Generated on: ${new Date().toLocaleDateString()} | Semester: ${semNum}`, { align: 'center' });

      doc.moveDown(1);
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
      doc.moveDown(0.8);

      // --- Student Information Grid ---
      const infoTop = doc.y;
      doc.rect(40, infoTop, 515, 75).fillAndStroke('#f8fafc', '#e2e8f0');

      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold');
      doc.text('Student Name:', 55, infoTop + 10);
      doc.font('Helvetica').text(student.userId?.name || 'N/A', 140, infoTop + 10);

      doc.font('Helvetica-Bold').text('USN:', 330, infoTop + 10);
      doc.font('Helvetica').text(student.usn, 420, infoTop + 10);

      doc.font('Helvetica-Bold').text('Department:', 55, infoTop + 30);
      doc.font('Helvetica').text(student.department, 140, infoTop + 30);

      doc.font('Helvetica-Bold').text('Section / Batch:', 330, infoTop + 30);
      doc.font('Helvetica').text(`${student.section} (${student.batch})`, 420, infoTop + 30);

      doc.font('Helvetica-Bold').text('Assigned Mentor:', 55, infoTop + 50);
      doc.font('Helvetica').text(student.mentorId?.userId?.name ? `Prof. ${student.mentorId.userId.name}` : 'Not Assigned', 140, infoTop + 50);

      doc.font('Helvetica-Bold').text('Academic Risk:', 330, infoTop + 50);
      const riskLevel = student.riskProfile?.riskLevel || 'Low';
      const riskColor = riskLevel === 'Critical' ? '#ef4444' : riskLevel === 'High' ? '#f97316' : riskLevel === 'Medium' ? '#f59e0b' : '#10b981';
      doc.fillColor(riskColor).font('Helvetica-Bold').text(riskLevel, 420, infoTop + 50);

      doc.y = infoTop + 90;

      // --- Subjects Table Header ---
      const tableTop = doc.y;
      doc.rect(40, tableTop, 515, 22).fill('#4f46e5');

      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('CODE', 48, tableTop + 6);
      doc.text('SUBJECT NAME', 110, tableTop + 6);
      doc.text('CR', 260, tableTop + 6);
      doc.text('CIE1', 290, tableTop + 6);
      doc.text('CIE2', 325, tableTop + 6);
      doc.text('CIE3', 360, tableTop + 6);
      doc.text('FINAL', 395, tableTop + 6);
      doc.text('TOTAL', 435, tableTop + 6);
      doc.text('GRADE', 475, tableTop + 6);
      doc.text('RESULT', 515, tableTop + 6);

      let currentY = tableTop + 24;

      // --- Subject Rows ---
      if (semester.subjects && semester.subjects.length > 0) {
        semester.subjects.forEach((subj, idx) => {
          const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
          doc.rect(40, currentY, 515, 20).fill(rowBg);

          doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica');
          doc.text(subj.subjectCode, 48, currentY + 5);
          doc.text(subj.subjectName.substring(0, 26), 110, currentY + 5);
          doc.text(String(subj.credits || 3), 265, currentY + 5);
          doc.text(String(subj.cie1 || 0), 295, currentY + 5);
          doc.text(String(subj.cie2 || 0), 330, currentY + 5);
          doc.text(String(subj.cie3 || 0), 365, currentY + 5);
          doc.text(String(subj.finalMarks || 0), 400, currentY + 5);
          doc.font('Helvetica-Bold').text(String(subj.totalMarks || 0), 440, currentY + 5);
          doc.text(subj.grade || 'F', 480, currentY + 5);

          const isPass = subj.result === 'PASS' && !subj.isBacklog;
          doc.fillColor(isPass ? '#10b981' : '#ef4444').text(isPass ? 'PASS' : 'FAIL', 515, currentY + 5);

          currentY += 20;
        });
      } else {
        doc.rect(40, currentY, 515, 25).fill('#ffffff');
        doc.fillColor('#64748b').fontSize(9).font('Helvetica-Oblique').text('No academic assessment records registered for this semester yet.', 50, currentY + 7);
        currentY += 25;
      }

      doc.strokeColor('#cbd5e1').lineWidth(0.5).rect(40, tableTop, 515, currentY - tableTop).stroke();

      // --- Academic Summary Box ---
      currentY += 15;
      doc.rect(40, currentY, 515, 45).fillAndStroke('#eef2ff', '#c7d2fe');

      doc.fillColor('#312e81').fontSize(10).font('Helvetica-Bold');
      doc.text(`Semester ${semNum} SGPA: ${semester.sgpa || '0.00'}`, 55, currentY + 10);
      doc.text(`Cumulative CGPA: ${cgpa || '0.00'}`, 210, currentY + 10);
      doc.text(`Semester Credits: ${semester.totalCredits || 0}`, 370, currentY + 10);

      doc.fontSize(9).font('Helvetica');
      doc.text(`Active Backlogs: ${totalActiveBacklogs}`, 55, currentY + 28);
      doc.text(`Badges Earned: ${student.badges?.length > 0 ? student.badges.join(', ') : 'None'}`, 210, currentY + 28);

      // --- Footer Signatures ---
      currentY += 75;
      doc.strokeColor('#94a3b8').lineWidth(1);
      doc.moveTo(60, currentY).lineTo(200, currentY).stroke();
      doc.moveTo(380, currentY).lineTo(520, currentY).stroke();

      doc.fillColor('#475569').fontSize(9).font('Helvetica');
      doc.text('Faculty Mentor Signature', 75, currentY + 5);
      doc.text('Head of Department (HOD)', 395, currentY + 5);

      doc.fontSize(7.5).fillColor('#94a3b8').text('MentorConnect System Generated Document — Verified for Institutional Records', 40, 770, { align: 'center', width: 515 });

      doc.end();
    });
  }
}

module.exports = PdfService;

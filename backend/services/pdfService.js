import PDFDocument from 'pdfkit';

function createDoc() {
  return new PDFDocument({ margin: 40, size: 'A4' });
}

function header(doc, title, department) {
  doc.fontSize(20).font('Helvetica-Bold').text('MentorConnect', { align: 'center' });
  doc.fontSize(14).font('Helvetica').text(title, { align: 'center' });
  if (department) doc.fontSize(10).text(`Department: ${department}`, { align: 'center' });
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown();
}

export function generatePerformancePDF(students = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const doc = createDoc();
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Performance Report', opts.department);

    students.forEach((s, i) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${s.name} (${s.usn || 'N/A'})`, { continued: false });
      doc.fontSize(10).font('Helvetica')
        .text(`  CGPA: ${s.cgpa || 0}  |  SGPA: ${s.sgpa || 0}  |  Backlogs: ${s.backlog || 0}`)
        .text(`  Year: ${s.year || ''}  |  Section: ${s.section || ''}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

export function generateAllocationPDF(batch) {
  return new Promise((resolve, reject) => {
    const doc = createDoc();
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Allocation Report', batch.department);
    doc.fontSize(10).text(`Status: ${batch.status}  |  Total Students: ${batch.totalStudents}  |  Total Mentors: ${batch.totalMentors}`);
    doc.moveDown();

    (batch.allocations || []).forEach(a => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').text(`Mentor: ${a.mentorName} (${a.studentCount} students)`);
      doc.fontSize(10).font('Helvetica');
      (a.studentIds || []).forEach(s => {
        doc.text(`  - ${s.name || s} (${s.usn || ''})`);
      });
      doc.moveDown();
    });

    doc.end();
  });
}

export function generateRiskPDF(students = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const doc = createDoc();
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    header(doc, 'Risk Analysis Report', opts.department);

    const highRisk = students.filter(s => s.riskLevel === 'High');
    const medRisk = students.filter(s => s.riskLevel === 'Medium');

    doc.fontSize(11).font('Helvetica-Bold').text(`High Risk: ${highRisk.length}  |  Medium Risk: ${medRisk.length}  |  Total: ${students.length}`);
    doc.moveDown();

    students.forEach((s, i) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(11).font('Helvetica-Bold').text(`${i + 1}. ${s.name} — Risk: ${s.riskLevel || 'Low'}`);
      doc.fontSize(10).font('Helvetica').text(`  USN: ${s.usn || 'N/A'}  CGPA: ${s.cgpa || 0}  Backlogs: ${s.backlog || 0}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

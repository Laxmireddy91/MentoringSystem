import fs from 'fs/promises';
import path from 'path';
import Report from '../models/Report.js';
import Student from '../models/Student.js';
import AllocationBatch from '../models/AllocationBatch.js';
import { getRiskSettings, classifyStudentRisk } from './riskService.js';
import { generatePerformancePDF, generateAllocationPDF, generateRiskPDF } from './pdfService.js';

const REPORT_DIR = 'uploads/reports';

async function ensureReportDir() {
  await fs.mkdir(REPORT_DIR, { recursive: true });
}

export async function listReports(department) {
  return Report.find({ department }).sort({ createdAt: -1 }).populate('generatedBy', 'name email').lean();
}

export async function generateReport(type, department, filters = {}, actorId) {
  const report = await Report.create({
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${department}`,
    department,
    generatedBy: actorId,
    type,
    filters,
    status: 'pending',
  });

  setImmediate(async () => {
    try {
      await ensureReportDir();
      let buffer;
      const students = await Student.find({ dept: department }).lean();

      if (type === 'performance') {
        buffer = await generatePerformancePDF(students, { department });
      } else if (type === 'allocation') {
        const batch = await AllocationBatch.findOne({ department, status: 'confirmed' })
          .sort({ confirmedAt: -1 })
          .populate('allocations.studentIds', 'name usn')
          .lean();
        buffer = await generateAllocationPDF(batch || { department, allocations: [], totalStudents: 0, totalMentors: 0 });
      } else if (type === 'risk') {
        const settings = await getRiskSettings(department);
        const enriched = students.map(s => ({ ...s, ...classifyStudentRisk(s, settings), riskLevel: classifyStudentRisk(s, settings).level }));
        buffer = await generateRiskPDF(enriched, { department });
      } else {
        buffer = await generatePerformancePDF(students, { department });
      }

      const filename = `report_${report._id}_${Date.now()}.pdf`;
      const filePath = path.join(REPORT_DIR, filename);
      await fs.writeFile(filePath, buffer);

      report.fileUrl = `/uploads/reports/${filename}`;
      report.status = 'ready';
      await report.save();
    } catch (err) {
      console.error('Report generation error:', err);
      report.status = 'failed';
      await report.save();
    }
  });

  return report;
}

export async function getReportById(id) {
  return Report.findById(id).lean();
}

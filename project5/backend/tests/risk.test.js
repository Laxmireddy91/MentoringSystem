const mongoose = require('mongoose');
const RiskService = require('../services/riskService');
const { RISK_LEVELS } = require('../config/constants');

describe('Rule-Based Student Risk Analysis Service Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_mentoring_system_test');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('should evaluate low risk for a high-performing student with no backlogs and good CIE scores', async () => {
    const student = {
      department: 'CSE',
      academics: [
        {
          semesterNumber: 1,
          subjects: [
            { subjectCode: 'CS101', cie1: 45, cie2: 45, cie3: 45, finalMarks: 45, totalMarks: 90, gradePoint: 10, isBacklog: false },
            { subjectCode: 'CS102', cie1: 40, cie2: 42, cie3: 44, finalMarks: 40, totalMarks: 83, gradePoint: 9, isBacklog: false },
          ],
        },
      ],
    };

    const res = await RiskService.evaluateStudentRisk(student);
    expect(res.riskLevel).toBe(RISK_LEVELS.LOW);
    expect(res.riskScore).toBeLessThan(30);
    expect(res.recommendations).toBeDefined();
  });

  it('should flag Critical Risk for a student with multiple backlogs and low CIE marks', async () => {
    const student = {
      department: 'CSE',
      academics: [
        {
          semesterNumber: 1,
          subjects: [
            { subjectCode: 'CS101', cie1: 15, cie2: 12, cie3: 10, finalMarks: 10, totalMarks: 23, gradePoint: 0, isBacklog: true },
            { subjectCode: 'CS102', cie1: 10, cie2: 10, cie3: 10, finalMarks: 12, totalMarks: 22, gradePoint: 0, isBacklog: true },
            { subjectCode: 'CS103', cie1: 14, cie2: 12, cie3: 15, finalMarks: 10, totalMarks: 24, gradePoint: 0, isBacklog: true },
          ],
        },
      ],
    };

    const res = await RiskService.evaluateStudentRisk(student);
    expect(res.riskLevel).toBe(RISK_LEVELS.CRITICAL);
    expect(res.riskScore).toBeGreaterThanOrEqual(70);
    expect(res.reasons.some((r) => r.includes('backlog') || r.includes('CIE'))).toBe(true);
  });

  it('should detect score decline pattern across CIE tests', async () => {
    const student = {
      department: 'CSE',
      academics: [
        {
          semesterNumber: 1,
          subjects: [
            { subjectCode: 'CS101', cie1: 45, cie2: 30, cie3: 18, finalMarks: 35, totalMarks: 65, isBacklog: false },
            { subjectCode: 'CS102', cie1: 42, cie2: 28, cie3: 15, finalMarks: 35, totalMarks: 62, isBacklog: false },
          ],
        },
      ],
    };

    const res = await RiskService.evaluateStudentRisk(student);
    expect(res.reasons.some((r) => r.includes('decline'))).toBe(true);
  });
});

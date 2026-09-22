const {
  calculateGrade,
  calculateSubjectMarks,
  calculateSemesterSGPA,
  calculateCumulativeCGPA,
  evaluateBadges,
} = require('../utils/academicCalculations');

describe('Academic Calculations Engine Unit Tests', () => {
  describe('calculateGrade', () => {
    it('should assign correct letter grade and grade points', () => {
      expect(calculateGrade(95)).toEqual({ grade: 'O', gradePoint: 10, result: 'PASS' });
      expect(calculateGrade(82)).toEqual({ grade: 'A+', gradePoint: 9, result: 'PASS' });
      expect(calculateGrade(74)).toEqual({ grade: 'A', gradePoint: 8, result: 'PASS' });
      expect(calculateGrade(65)).toEqual({ grade: 'B+', gradePoint: 7, result: 'PASS' });
      expect(calculateGrade(56)).toEqual({ grade: 'B', gradePoint: 6, result: 'PASS' });
      expect(calculateGrade(51)).toEqual({ grade: 'C', gradePoint: 5, result: 'PASS' });
      expect(calculateGrade(42)).toEqual({ grade: 'P', gradePoint: 4, result: 'PASS' });
      expect(calculateGrade(35)).toEqual({ grade: 'F', gradePoint: 0, result: 'FAIL' });
    });
  });

  describe('calculateSubjectMarks', () => {
    it('should compute best 2 of 3 CIE average and combine with final marks', () => {
      // CIE1=40, CIE2=45, CIE3=35 -> Best 2 = 45, 40 -> Avg = 42.5
      // Final = 45 -> Total = 42.5 + 45 = 87.5 => 88
      const res = calculateSubjectMarks({
        cie1: 40,
        cie2: 45,
        cie3: 35,
        finalMarks: 45,
        credits: 4,
      });

      expect(res.cieAverage).toBe(42.5);
      expect(res.totalMarks).toBe(88);
      expect(res.grade).toBe('A+');
      expect(res.gradePoint).toBe(9);
      expect(res.isBacklog).toBe(false);
    });

    it('should flag subject as backlog if marks are below passing threshold', () => {
      const res = calculateSubjectMarks({
        cie1: 15,
        cie2: 10,
        cie3: 12,
        finalMarks: 15, // final < 18
        credits: 3,
      });

      expect(res.result).toBe('FAIL');
      expect(res.grade).toBe('F');
      expect(res.gradePoint).toBe(0);
      expect(res.isBacklog).toBe(true);
    });
  });

  describe('calculateSemesterSGPA', () => {
    it('should accurately calculate weighted SGPA for a semester', () => {
      const subjects = [
        { subjectCode: 'CS501', subjectName: 'DBMS', credits: 4, cie1: 45, cie2: 45, cie3: 45, finalMarks: 45 }, // Grade O (10) -> 40 pts
        { subjectCode: 'CS502', subjectName: 'CN', credits: 4, cie1: 35, cie2: 35, cie3: 35, finalMarks: 35 },   // Grade A (8) -> 32 pts
        { subjectCode: 'CS503', subjectName: 'OS', credits: 3, cie1: 40, cie2: 40, cie3: 40, finalMarks: 40 },   // Grade A+ (9) -> 27 pts
      ];

      const res = calculateSemesterSGPA(subjects);
      // Total credits = 11. Total points = 40 + 32 + 27 = 99. SGPA = 99 / 11 = 9.0
      expect(res.totalCredits).toBe(11);
      expect(res.sgpa).toBe(9.0);
      expect(res.backlogsCount).toBe(0);
    });
  });

  describe('calculateCumulativeCGPA', () => {
    it('should accurately calculate CGPA across multiple semesters', () => {
      const semesters = [
        {
          semesterNumber: 1,
          subjects: [
            { subjectCode: 'MAT101', credits: 4, cie1: 45, cie2: 45, cie3: 45, finalMarks: 45 }, // GP 10 -> 40
            { subjectCode: 'PHY101', credits: 4, cie1: 35, cie2: 35, cie3: 35, finalMarks: 35 }, // GP 8 -> 32
          ], // SGPA = 72/8 = 9.0
        },
        {
          semesterNumber: 2,
          subjects: [
            { subjectCode: 'MAT201', credits: 4, cie1: 40, cie2: 40, cie3: 40, finalMarks: 40 }, // GP 9 -> 36
            { subjectCode: 'CHE201', credits: 4, cie1: 35, cie2: 35, cie3: 35, finalMarks: 35 }, // GP 8 -> 32
          ], // SGPA = 68/8 = 8.5
        },
      ];

      const res = calculateCumulativeCGPA(semesters);
      // Total points = 72 + 68 = 140. Total credits = 16. CGPA = 140 / 16 = 8.75
      expect(res.totalEarnedCredits).toBe(16);
      expect(res.cgpa).toBe(8.75);
      expect(res.totalActiveBacklogs).toBe(0);
    });
  });

  describe('evaluateBadges', () => {
    it('should award appropriate badges for exemplary academic standing', () => {
      const badges = evaluateBadges({
        academics: [
          {
            semesterNumber: 1,
            subjects: [{ subjectCode: 'CS101', credits: 4, cie1: 48, cie2: 48, cie3: 48, finalMarks: 48 }],
          },
        ],
        completedGoalsCount: 4,
        sessionsCount: 6,
      });

      expect(badges).toContain('No Backlogs');
      expect(badges).toContain('High Performer');
      expect(badges).toContain('Goal Achiever');
      expect(badges).toContain('Active Mentee');
    });
  });
});

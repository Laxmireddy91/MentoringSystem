/**
 * Academic Calculations Engine - Single Source of Truth
 * Standardized VTU / Autonomous Engineering College Grading & Performance Logic
 */

/**
 * Calculate grade and grade points based on total percentage marks
 * @param {number} totalMarks - Total marks scored (0-100)
 * @param {number} minPassingMarks - Minimum passing score (default 40)
 * @returns {{ grade: string, gradePoint: number, result: 'PASS'|'FAIL' }}
 */
const calculateGrade = (totalMarks, minPassingMarks = 40) => {
  const marks = Math.round(Number(totalMarks) || 0);

  if (marks < minPassingMarks) {
    return { grade: 'F', gradePoint: 0, result: 'FAIL' };
  }

  if (marks >= 90) return { grade: 'O', gradePoint: 10, result: 'PASS' };
  if (marks >= 80) return { grade: 'A+', gradePoint: 9, result: 'PASS' };
  if (marks >= 70) return { grade: 'A', gradePoint: 8, result: 'PASS' };
  if (marks >= 60) return { grade: 'B+', gradePoint: 7, result: 'PASS' };
  if (marks >= 55) return { grade: 'B', gradePoint: 6, result: 'PASS' };
  if (marks >= 50) return { grade: 'C', gradePoint: 5, result: 'PASS' };
  return { grade: 'P', gradePoint: 4, result: 'PASS' };
};

/**
 * Calculate subject total from CIE tests and Final marks
 * CIE components: CIE1 (out of 50 or 25), CIE2, CIE3
 * Standard model: Best 2 out of 3 CIEs scaled to 50 + Final Examination scaled to 50 = Total 100
 * Or Direct Sum: CIE scaled (50) + Final (50) = 100
 */
const calculateSubjectMarks = ({ cie1 = 0, cie2 = 0, cie3 = 0, finalMarks = 0, semesterExamMarks = 0, credits = 3 }) => {
  const c1 = Number(cie1) || 0;
  const c2 = Number(cie2) || 0;
  const c3 = Number(cie3) || 0;
  const fin = Number(finalMarks) || Number(semesterExamMarks) || 0;

  // Best 2 of 3 CIE scores
  const cieScores = [c1, c2, c3].sort((a, b) => b - a);
  const cieAverage = (cieScores[0] + cieScores[1]) / 2; // Average of best 2
  
  // Total marks = CIE Average (max 50) + Final Marks (max 50) => Total max 100
  const totalMarks = Math.min(100, Math.round(cieAverage + fin));
  const percentage = totalMarks;

  // Individual passing threshold: CIE avg >= 20 and Final >= 18 and Total >= 40
  const isCiePass = cieAverage >= 20;
  const isFinalPass = fin >= 18;
  const { grade, gradePoint, result } = calculateGrade(totalMarks, 40);

  const isBacklog = result === 'FAIL' || !isCiePass || !isFinalPass;

  return {
    cie1: c1,
    cie2: c2,
    cie3: c3,
    cieAverage: Math.round(cieAverage * 10) / 10,
    finalMarks: fin,
    totalMarks,
    percentage,
    grade: isBacklog ? 'F' : grade,
    gradePoint: isBacklog ? 0 : gradePoint,
    result: isBacklog ? 'FAIL' : 'PASS',
    isBacklog,
    credits: Number(credits) || 3,
  };
};

/**
 * Calculate Semester SGPA and Backlogs
 * SGPA = sum(credits * gradePoint) / sum(credits)
 */
const calculateSemesterSGPA = (subjects = []) => {
  if (!subjects || subjects.length === 0) {
    return { sgpa: 0, totalCredits: 0, backlogsCount: 0, subjects: [] };
  }

  let totalCreditPoints = 0;
  let totalCredits = 0;
  let backlogsCount = 0;

  const calculatedSubjects = subjects.map((subj) => {
    const calculated = calculateSubjectMarks(subj);
    const subCredits = calculated.credits;
    
    totalCredits += subCredits;
    totalCreditPoints += subCredits * calculated.gradePoint;
    
    if (calculated.isBacklog) {
      backlogsCount++;
    }

    return {
      ...subj,
      ...calculated,
    };
  });

  const sgpa = totalCredits > 0 ? Math.round((totalCreditPoints / totalCredits) * 100) / 100 : 0;

  return {
    sgpa,
    totalCredits,
    backlogsCount,
    subjects: calculatedSubjects,
  };
};

/**
 * Calculate Student Cumulative CGPA across all completed semesters
 * CGPA = sum(semesterSGPA * semesterCredits) / sum(semesterCredits)
 */
const calculateCumulativeCGPA = (semesters = []) => {
  if (!semesters || semesters.length === 0) {
    return { cgpa: 0, totalEarnedCredits: 0, totalActiveBacklogs: 0, semesters: [] };
  }

  let totalWeightedSGPA = 0;
  let totalCredits = 0;
  let totalActiveBacklogs = 0;

  const processedSemesters = semesters.map((sem) => {
    const semCalc = calculateSemesterSGPA(sem.subjects);
    
    totalCredits += semCalc.totalCredits;
    totalWeightedSGPA += semCalc.sgpa * semCalc.totalCredits;
    totalActiveBacklogs += semCalc.backlogsCount;

    return {
      ...sem,
      semesterNumber: sem.semesterNumber,
      sgpa: semCalc.sgpa,
      totalCredits: semCalc.totalCredits,
      backlogsCount: semCalc.backlogsCount,
      subjects: semCalc.subjects,
    };
  });

  const cgpa = totalCredits > 0 ? Math.round((totalWeightedSGPA / totalCredits) * 100) / 100 : 0;

  return {
    cgpa,
    totalEarnedCredits: totalCredits,
    totalActiveBacklogs,
    semesters: processedSemesters,
  };
};

/**
 * Determine badges based on academic and mentoring history
 */
const evaluateBadges = ({ academics = [], completedGoalsCount = 0, sessionsCount = 0 }) => {
  const badges = [];

  const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(academics);

  if (totalActiveBacklogs === 0 && academics.length > 0) {
    badges.push('No Backlogs');
  }

  if (cgpa >= 9.0) {
    badges.push('High Performer');
  } else if (cgpa >= 8.0) {
    badges.push('Consistent Performer');
  }

  if (completedGoalsCount >= 3) {
    badges.push('Goal Achiever');
  }

  if (sessionsCount >= 5) {
    badges.push('Active Mentee');
  }

  // CIE Improvement detection across consecutive semesters
  if (academics.length >= 2) {
    const lastSem = academics[academics.length - 1];
    const prevSem = academics[academics.length - 2];
    if (lastSem.sgpa > prevSem.sgpa + 0.5) {
      badges.push('CIE Improvement');
    }
  }

  return [...new Set(badges)];
};

module.exports = {
  calculateGrade,
  calculateSubjectMarks,
  calculateSemesterSGPA,
  calculateCumulativeCGPA,
  evaluateBadges,
};

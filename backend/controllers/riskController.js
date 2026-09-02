import Student from "../models/Student.js";

/*
 * Calculate a transparent academic risk score.
 *
 * Higher score = higher academic risk.
 */
function calculateRisk(student) {
  let riskScore = 0;
  const reasons = [];

  const cie1 = Number(student.cie1 || 0);
  const cie2 = Number(student.cie2 || 0);
  const cie3 = Number(student.cie3 || 0);
  const finalMark = Number(student.final || 0);
  const total = Number(student.total || 0);
  const backlogs = Number(student.backlog || 0);

  const hasAcademicData =
  cie1 > 0 ||
  cie2 > 0 ||
  cie3 > 0 ||
  finalMark > 0 ||
  total > 0;

  if (!hasAcademicData && backlogs === 0) {
  return {
    riskScore: 0,
    level: "Low",
    color: "green",
    reasons: [
      "No academic performance data has been entered yet."
    ],
    recommendation:
      "Enter the student's academic records to begin risk analysis.",
    cieAverage: 0,
  };
}

  /*
   * Average CIE performance
   */
  const cieAverage =
    (cie1 + cie2 + cie3) / 3;

  /*
   * 1. Overall performance
   */
  if (total < 50) {
    riskScore += 35;

    reasons.push(
      "Overall academic performance is very low."
    );
  } else if (total < 65) {
    riskScore += 20;

    reasons.push(
      "Overall academic performance needs improvement."
    );
  } else if (total < 75) {
    riskScore += 10;
  }

  /*
   * 2. Recent CIE performance
   */
  if (cieAverage < 50) {
    riskScore += 25;

    reasons.push(
      "Recent CIE performance is below the expected level."
    );
  } else if (cieAverage < 65) {
    riskScore += 15;

    reasons.push(
      "Recent CIE performance shows weakness."
    );
  }

  /*
   * 3. Declining performance
   */
  if (
    cie1 > 0 &&
    cie2 > 0 &&
    cie3 > 0 &&
    cie3 < cie2 &&
    cie2 < cie1
  ) {
    riskScore += 20;

    reasons.push(
      "Performance has declined across consecutive CIE assessments."
    );
  }

  /*
   * 4. Backlogs
   */
  if (backlogs >= 3) {
    riskScore += 25;

    reasons.push(
      `${backlogs} active backlogs require immediate attention.`
    );
  } else if (backlogs > 0) {
    riskScore += 15;

    reasons.push(
      `${backlogs} active backlog(s) detected.`
    );
  }

  /*
   * 5. Final examination performance
   */
  if (
    finalMark > 0 &&
    finalMark < 50
  ) {
    riskScore += 15;

    reasons.push(
      "Final examination performance is below the expected level."
    );
  }

  /*
   * Keep score between 0 and 100.
   */
  riskScore = Math.min(
    Math.max(riskScore, 0),
    100
  );

  /*
   * Determine risk level.
   */
  let level = "Low";
  let color = "green";

  if (riskScore >= 70) {
    level = "High";
    color = "red";
  } else if (riskScore >= 40) {
    level = "Medium";
    color = "orange";
  }

  /*
   * Positive message when no risk factors exist.
   */
  if (reasons.length === 0) {
    reasons.push(
      "Student performance is currently stable."
    );
  }

  /*
   * Recommended mentor intervention.
   */
  let recommendation =
    "Continue regular mentoring and monitor academic progress.";

  if (level === "High") {
    recommendation =
      "Schedule an immediate mentoring session, identify the main academic difficulties, and create a recovery plan.";
  } else if (level === "Medium") {
    recommendation =
      "Schedule a follow-up mentoring session and monitor the student's upcoming academic performance.";
  }

  return {
    riskScore,
    level,
    color,
    reasons,
    recommendation,
    cieAverage: Number(
      cieAverage.toFixed(2)
    ),
  };
}


/*
 * Analyze one student
 */
export async function analyzeStudentRisk(
  req,
  res,
  next
) {
  try {
    const student =
      await Student.findById(
        req.params.id
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const analysis =
      calculateRisk(student);

    return res.json({
      success: true,

      student: {
        id: student._id,
        usn: student.usn,
        name: student.name,
        department: student.dept,
        year: student.year,
        mentor: student.mentor,
      },

      analysis,
    });
  } catch (error) {
    console.error(
      "Risk analysis error:",
      error
    );

    next(error);
  }
}


/*
 * Analyze all students
 */
export async function analyzeAllStudents(
  req,
  res,
  next
) {
  try {
    const students =
      await Student.find()
        .sort({ name: 1 });

    const results =
      students.map((student) => {
        const analysis =
          calculateRisk(student);

        return {
          id: student._id,
          usn: student.usn,
          name: student.name,
          department: student.dept,
          year: student.year,
          mentor: student.mentor,

          total: student.total || 0,
          backlog: student.backlog || 0,

          ...analysis,
        };
      });

    return res.json({
      success: true,
      count: results.length,
      students: results,
    });
  } catch (error) {
    console.error(
      "All student risk analysis error:",
      error
    );

    next(error);
  }
}
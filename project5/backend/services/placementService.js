const { PlacementDrive, PlacementApplication, PlacementProfile, Student, Mentor, Notification, AuditLog } = require('../models');
const { PLACEMENT_DRIVE_STATUS, PLACEMENT_APPLICATION_STATUS, NOTIFICATION_CATEGORIES, AUDIT_ACTIONS } = require('../config/constants');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');
const AppError = require('../utils/AppError');

class PlacementService {
  /**
   * Create a new Placement Drive (TPO)
   */
  static async createDrive(driveData, tpoUser) {
    const drive = await PlacementDrive.create({
      ...driveData,
      createdBy: tpoUser?._id,
      status: driveData.status || PLACEMENT_DRIVE_STATUS.ACTIVE,
    });

    await AuditLog.create({
      actorId: tpoUser._id,
      actorRole: tpoUser.role,
      actorName: tpoUser.name,
      action: 'PLACEMENT_DRIVE_CREATED',
      entity: 'PlacementDrive',
      entityId: drive._id,
      newValue: { company: drive.company, role: drive.role, ctc: drive.ctc },
      description: `Created placement drive for ${drive.company} (${drive.role}).`,
    });

    return drive;
  }

  /**
   * Get all Placement Drives with optional filtering
   */
  static async getDrives(filter = {}) {
    const query = {};
    if (filter.status) query.status = filter.status;
    if (filter.department && filter.department !== 'ALL') {
      query.eligibleDepartments = filter.department;
    }
    return PlacementDrive.find(query).sort({ driveDate: -1, createdAt: -1 });
  }

  /**
   * Get single drive by ID
   */
  static async getDriveById(driveId) {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);
    return drive;
  }

  /**
   * Rule-based Eligibility Calculation Engine
   * Evaluates students against drive criteria using actual database records.
   * Returns explicit reasons for eligibility/ineligibility. No fake AI.
   */
  static async calculateDriveEligibility(driveId, department = 'ALL') {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);

    const studentQuery = {};
    if (department && department !== 'ALL') {
      studentQuery.department = department;
    } else if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
      studentQuery.department = { $in: drive.eligibleDepartments };
    }

    const students = await Student.find(studentQuery).populate('userId', 'name email');
    const existingApplications = await PlacementApplication.find({ driveId });
    const appliedStudentIds = new Set(existingApplications.map((a) => a.studentId.toString()));

    const results = [];
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const student of students) {
      const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(student.academics);
      const studentPlacementProfile = await PlacementProfile.findOne({ studentId: student._id });
      const studentSkills = studentPlacementProfile?.skills || [];

      const reasons = [];
      let isEligible = true;

      // 1. Department Check
      if (drive.eligibleDepartments && drive.eligibleDepartments.length > 0) {
        if (!drive.eligibleDepartments.includes(student.department)) {
          isEligible = false;
          reasons.push(`Department ${student.department} is not in eligible list (${drive.eligibleDepartments.join(', ')})`);
        } else {
          reasons.push(`Department ${student.department} matches criteria`);
        }
      }

      // 2. CGPA Check
      const minCGPA = drive.minCGPA || 0;
      if (cgpa < minCGPA) {
        isEligible = false;
        reasons.push(`CGPA (${cgpa.toFixed(2)}) is below required minimum (${minCGPA.toFixed(2)})`);
      } else {
        reasons.push(`CGPA (${cgpa.toFixed(2)}) satisfies requirement (>= ${minCGPA.toFixed(2)})`);
      }

      // 3. Backlogs Check
      const maxBacklogs = drive.maxBacklogs || 0;
      if (totalActiveBacklogs > maxBacklogs) {
        isEligible = false;
        reasons.push(`Active backlogs (${totalActiveBacklogs}) exceed allowed maximum (${maxBacklogs})`);
      } else {
        reasons.push(`Active backlogs (${totalActiveBacklogs}) within acceptable limit (<= ${maxBacklogs})`);
      }

      // 4. Skills Match Check (if required skills specified)
      if (drive.requiredSkills && drive.requiredSkills.length > 0) {
        const matchedSkills = drive.requiredSkills.filter((reqSkill) =>
          studentSkills.some((s) => s.toLowerCase() === reqSkill.toLowerCase())
        );
        reasons.push(`Matched skills: ${matchedSkills.length}/${drive.requiredSkills.length} (${matchedSkills.join(', ') || 'None'})`);
      }

      if (isEligible) eligibleCount++;
      else ineligibleCount++;

      results.push({
        studentId: student._id,
        usn: student.usn,
        name: student.userId?.name || 'Student',
        email: student.userId?.email || '',
        department: student.department,
        semester: student.semester,
        cgpa: Math.round(cgpa * 100) / 100,
        activeBacklogs: totalActiveBacklogs,
        hasApplied: appliedStudentIds.has(student._id.toString()),
        isEligible,
        reasons,
      });
    }

    return {
      drive: {
        _id: drive._id,
        company: drive.company,
        role: drive.role,
        ctc: drive.ctc,
        minCGPA: drive.minCGPA,
        maxBacklogs: drive.maxBacklogs,
        eligibleDepartments: drive.eligibleDepartments,
      },
      summary: {
        totalEvaluated: students.length,
        eligibleCount,
        ineligibleCount,
        appliedCount: appliedStudentIds.size,
      },
      students: results,
    };
  }

  /**
   * Student applies for a drive
   */
  static async applyForDrive(studentId, driveId) {
    const drive = await PlacementDrive.findById(driveId);
    if (!drive) throw new AppError('Placement drive not found', 404);

    if (drive.status !== PLACEMENT_DRIVE_STATUS.ACTIVE) {
      throw new AppError('This drive is not currently accepting applications', 400);
    }

    const existing = await PlacementApplication.findOne({ studentId, driveId });
    if (existing) throw new AppError('You have already applied for this placement drive', 400);

    const application = await PlacementApplication.create({
      studentId,
      driveId,
      status: PLACEMENT_APPLICATION_STATUS.APPLIED,
      roundsCleared: ['Application Submitted'],
    });

    return application;
  }

  /**
   * Get applications for a drive (TPO view)
   */
  static async getDriveApplications(driveId) {
    return PlacementApplication.find({ driveId })
      .populate({
        path: 'studentId',
        select: 'usn department semester academics mentorId',
        populate: [
          { path: 'userId', select: 'name email phone avatar' },
          { path: 'mentorId', select: 'employeeId', populate: { path: 'userId', select: 'name' } },
        ],
      })
      .sort({ createdAt: -1 });
  }

  /**
   * Update application status (TPO)
   */
  static async updateApplicationStatus(applicationId, { status, roundsCleared, remarks, ctcOffered }, tpoUser) {
    const application = await PlacementApplication.findById(applicationId).populate('driveId');
    if (!application) throw new AppError('Application not found', 404);

    const previousStatus = application.status;
    application.status = status;
    if (roundsCleared) application.roundsCleared = roundsCleared;
    if (remarks) application.remarks = remarks;
    if (ctcOffered) application.ctcOffered = ctcOffered;
    await application.save();

    // If offer/placed, update PlacementProfile status
    if (status === PLACEMENT_APPLICATION_STATUS.OFFER || status === PLACEMENT_APPLICATION_STATUS.PLACED) {
      await PlacementProfile.findOneAndUpdate(
        { studentId: application.studentId },
        {
          placementStatus: 'Placed',
          $addToSet: { offers: { company: application.driveId?.company, ctc: ctcOffered || application.driveId?.ctc } },
        },
        { upsert: true }
      );
    }

    // Notify student and mentor
    const student = await Student.findById(application.studentId).populate('userId', 'name').populate('mentorId');
    if (student?.userId?._id) {
      await Notification.create({
        recipientId: student.userId._id,
        title: `Placement Update: ${application.driveId?.company}`,
        message: `Your application status for ${application.driveId?.company} (${application.driveId?.role}) has been updated to "${status.toUpperCase()}".`,
        category: NOTIFICATION_CATEGORIES.PLACEMENT,
      }).catch(() => null);
    }

    // Notify assigned mentor so placement info reaches department mentor
    if (student?.mentorId?.userId) {
      await Notification.create({
        recipientId: student.mentorId.userId,
        title: `Mentee Placement Update: ${student.userId?.name}`,
        message: `Mentee ${student.usn} (${student.userId?.name}) updated to "${status.toUpperCase()}" for ${application.driveId?.company}.`,
        category: NOTIFICATION_CATEGORIES.PLACEMENT,
      }).catch(() => null);
    }

    return application;
  }

  /**
   * Mentor view of mentee placement readiness (TPO -> Department -> Mentor flow)
   */
  static async getMenteePlacementReadiness(mentorId) {
    const mentees = await Student.find({ mentorId }).populate('userId', 'name email phone avatar');

    const readinessRoster = await Promise.all(
      mentees.map(async (student) => {
        const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(student.academics);
        const profile = await PlacementProfile.findOne({ studentId: student._id });
        const applications = await PlacementApplication.find({ studentId: student._id }).populate('driveId', 'company role ctc');

        const activeDrives = await PlacementDrive.find({
          status: PLACEMENT_DRIVE_STATUS.ACTIVE,
          eligibleDepartments: student.department,
          minCGPA: { $lte: cgpa },
          maxBacklogs: { $gte: totalActiveBacklogs },
        });

        const offers = applications.filter((a) => a.status === PLACEMENT_APPLICATION_STATUS.OFFER || a.status === PLACEMENT_APPLICATION_STATUS.PLACED);
        const shortlisted = applications.filter((a) => a.status === PLACEMENT_APPLICATION_STATUS.SHORTLISTED || a.status === PLACEMENT_APPLICATION_STATUS.INTERVIEW);

        return {
          studentId: student._id,
          usn: student.usn,
          name: student.userId?.name || 'Student',
          email: student.userId?.email || '',
          department: student.department,
          semester: student.semester,
          cgpa: Math.round(cgpa * 100) / 100,
          activeBacklogs: totalActiveBacklogs,
          resumeAvailable: !!profile?.resumeUrl,
          linkedinAvailable: !!profile?.linkedinUrl,
          githubAvailable: !!profile?.githubUrl,
          skillsCount: profile?.skills?.length || 0,
          skills: profile?.skills || [],
          projectsCount: profile?.projects?.length || 0,
          certificationsCount: profile?.certifications?.length || 0,
          eligibleDrivesCount: activeDrives.length,
          totalApplications: applications.length,
          shortlistedCount: shortlisted.length,
          offersCount: offers.length,
          placementStatus: profile?.placementStatus || (offers.length > 0 ? 'Placed' : 'Seeking'),
          applications: applications.map((a) => ({
            applicationId: a._id,
            company: a.driveId?.company,
            role: a.driveId?.role,
            status: a.status,
            appliedDate: a.createdAt,
          })),
        };
      })
    );

    return readinessRoster;
  }

  /**
   * TPO Placement Analytics
   */
  static async getPlacementAnalytics(department = 'ALL') {
    const studentQuery = department !== 'ALL' ? { department } : {};
    const totalStudents = await Student.countDocuments(studentQuery);
    const totalDrives = await PlacementDrive.countDocuments({});
    const activeDrives = await PlacementDrive.countDocuments({ status: PLACEMENT_DRIVE_STATUS.ACTIVE });

    const allApplications = await PlacementApplication.find({}).populate('studentId', 'department');
    const filteredApps = department !== 'ALL'
      ? allApplications.filter((a) => a.studentId?.department === department)
      : allApplications;

    const appliedCount = new Set(filteredApps.map((a) => a.studentId?._id?.toString())).size;
    const shortlistedCount = new Set(filteredApps.filter((a) => a.status === 'shortlisted' || a.status === 'interview').map((a) => a.studentId?._id?.toString())).size;
    const placedCount = new Set(filteredApps.filter((a) => a.status === 'offer' || a.status === 'placed').map((a) => a.studentId?._id?.toString())).size;

    return {
      department,
      metrics: {
        totalStudents,
        totalDrives,
        activeDrives,
        appliedStudentsCount: appliedCount,
        shortlistedStudentsCount: shortlistedCount,
        placedStudentsCount: placedCount,
        placementPercentage: totalStudents > 0 ? Math.round((placedCount / totalStudents) * 100) : 0,
      },
    };
  }
}

module.exports = PlacementService;

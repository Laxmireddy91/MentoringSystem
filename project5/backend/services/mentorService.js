const { Mentor, Student, Session, Feedback } = require('../models');
const AppError = require('../utils/AppError');
const { calculateCumulativeCGPA } = require('../utils/academicCalculations');

class MentorService {
  /**
   * Get Mentor Dashboard Overview with mentee metrics and risk counts
   */
  static async getMentorDashboard(userId) {
    const mentor = await Mentor.findOne({ userId }).populate('userId', 'name email avatar phone department');
    if (!mentor) {
      throw new AppError('Mentor profile not found', 404);
    }

    const mentees = await Student.find({ mentorId: mentor._id }).populate('userId', 'name email avatar');

    const totalMentees = mentees.length;
    let lowRiskCount = 0;
    let mediumRiskCount = 0;
    let highRiskCount = 0;
    let criticalRiskCount = 0;
    let totalBacklogs = 0;

    mentees.forEach((student) => {
      const risk = student.riskProfile?.riskLevel || 'Low';
      if (risk === 'Critical') criticalRiskCount++;
      else if (risk === 'High') highRiskCount++;
      else if (risk === 'Medium') mediumRiskCount++;
      else lowRiskCount++;

      const { totalActiveBacklogs } = calculateCumulativeCGPA(student.academics);
      totalBacklogs += totalActiveBacklogs;
    });

    const upcomingSessions = await Session.find({
      mentorId: mentor._id,
      startTime: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    })
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'name email' } })
      .sort({ startTime: 1 })
      .limit(5);

    const recentFeedbacks = await Feedback.find({ mentorId: mentor._id })
      .populate('studentId', 'usn')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      mentor,
      metrics: {
        totalMentees,
        maxMentees: mentor.maxMentees,
        capacityPercentage: Math.round((totalMentees / (mentor.maxMentees || 30)) * 100),
        lowRiskCount,
        mediumRiskCount,
        highRiskCount,
        criticalRiskCount,
        totalBacklogs,
        ratingAverage: mentor.ratingAverage,
        totalRatings: mentor.totalRatings,
      },
      upcomingSessions,
      recentFeedbacks,
    };
  }

  /**
   * Get paginated and filtered assigned mentees list for this mentor
   */
  static async getAssignedStudents(userId, { page = 1, limit = 20, search = '', riskLevel = '', semester = '', sort = 'name', order = 'asc' }) {
    const mentor = await Mentor.findOne({ userId });
    if (!mentor) {
      throw new AppError('Mentor record not found', 404);
    }

    const query = { mentorId: mentor._id };

    if (riskLevel) {
      query['riskProfile.riskLevel'] = riskLevel;
    }

    if (semester) {
      query.semester = Number(semester);
    }

    const students = await Student.find(query)
      .populate('userId', 'name email phone avatar')
      .lean();

    let filtered = students;
    if (search) {
      const s = search.toLowerCase();
      filtered = students.filter((item) => {
        const name = item.userId?.name?.toLowerCase() || '';
        const email = item.userId?.email?.toLowerCase() || '';
        const usn = item.usn?.toLowerCase() || '';
        return name.includes(s) || email.includes(s) || usn.includes(s);
      });
    }

    // Attach computed CGPA & Backlogs to each student
    const enhanced = filtered.map((st) => {
      const { cgpa, totalActiveBacklogs } = calculateCumulativeCGPA(st.academics);
      return {
        ...st,
        computedCGPA: cgpa,
        computedBacklogs: totalActiveBacklogs,
      };
    });

    // Sort
    enhanced.sort((a, b) => {
      let valA = a.userId?.name || '';
      let valB = b.userId?.name || '';
      if (sort === 'usn') {
        valA = a.usn;
        valB = b.usn;
      } else if (sort === 'risk') {
        valA = a.riskProfile?.riskScore || 0;
        valB = b.riskProfile?.riskScore || 0;
      } else if (sort === 'cgpa') {
        valA = a.computedCGPA;
        valB = b.computedCGPA;
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = enhanced.slice(startIndex, startIndex + limitNum);

    return {
      students: paginated,
      pagination: {
        total: enhanced.length,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(enhanced.length / limitNum),
      },
    };
  }

  /**
   * Update Mentor Office Hours availability slots
   */
  static async updateOfficeHours(userId, officeHours) {
    const mentor = await Mentor.findOne({ userId });
    if (!mentor) throw new AppError('Mentor record not found', 404);

    mentor.officeHours = officeHours;
    await mentor.save();

    return mentor.officeHours;
  }

  /**
   * Get Office hours for a given mentor
   */
  static async getOfficeHours(mentorId) {
    const mentor = await Mentor.findById(mentorId).populate('userId', 'name email avatar department');
    if (!mentor) throw new AppError('Mentor not found', 404);

    return {
      mentor: {
        _id: mentor._id,
        name: mentor.userId?.name,
        email: mentor.userId?.email,
        department: mentor.department,
        designation: mentor.designation,
      },
      officeHours: mentor.officeHours.filter((slot) => slot.isActive),
    };
  }

  /**
   * Get list of student feedbacks
   */
  static async getMentorFeedbacks(userId) {
    const mentor = await Mentor.findOne({ userId });
    if (!mentor) throw new AppError('Mentor record not found', 404);

    const feedbacks = await Feedback.find({ mentorId: mentor._id })
      .populate('sessionId', 'title sessionType topic startTime')
      .populate({
        path: 'studentId',
        select: 'usn semester userId',
        populate: { path: 'userId', select: 'name email avatar' },
      })
      .sort({ createdAt: -1 });

    return {
      ratingAverage: mentor.ratingAverage || 0,
      totalRatings: mentor.totalRatings || feedbacks.length,
      feedbacks: feedbacks.map((f) => {
        if (f.isAnonymous) {
          return {
            ...f.toObject(),
            studentId: { usn: 'Anonymous Student', name: 'Anonymous Student' },
          };
        }
        return {
          ...f.toObject(),
          studentId: {
            _id: f.studentId?._id,
            usn: f.studentId?.usn,
            name: f.studentId?.userId?.name || f.studentId?.usn || 'Verified Student',
          },
        };
      }),
    };
  }
}

module.exports = MentorService;

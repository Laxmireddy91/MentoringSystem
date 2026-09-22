const { Student, Mentor, User, AllocationBatch, AuditLog, Notification } = require('../models');
const { ROLES, ALLOCATION_STATUS, ASSIGNMENT_TYPE, AUDIT_ACTIONS, NOTIFICATION_CATEGORIES } = require('../config/constants');
const AppError = require('../utils/AppError');

class AllocationService {
  /**
   * Helper to check if a mentor is active for allocation
   */
  static isMentorActive(mentor) {
    if (!mentor) return false;
    // Mentor document flag
    if (mentor.isActive === false) return false;
    // Associated User active flag
    if (mentor.userId && mentor.userId.isActive === false) return false;
    return true;
  }

  /**
   * Get Coordinator Dashboard Metrics and Mentor Workload Overview
   */
  static async getCoordinatorMetrics(department = 'ALL') {
    const activeStatusFilter = { status: { $nin: ['GRADUATED', 'INACTIVE', 'DROPPED'] } };
    const studentQuery = department && department !== 'ALL'
      ? { department, ...activeStatusFilter }
      : { ...activeStatusFilter };
    const mentorQuery = department && department !== 'ALL' ? { department } : {};

    const [totalStudents, unassignedStudents, mentors, batches] = await Promise.all([
      Student.countDocuments(studentQuery),
      Student.countDocuments({ ...studentQuery, $or: [{ mentorId: null }, { mentorId: { $exists: false } }] }),
      Mentor.find(mentorQuery).populate('userId', 'name email isActive avatar department'),
      AllocationBatch.find(department !== 'ALL' ? { department } : {}).sort({ createdAt: -1 }).limit(10),
    ]);

    let totalCapacity = 0;
    let totalAssignedMentees = 0;

    const mentorWorkload = await Promise.all(
      mentors.map(async (m) => {
        const menteeCount = await Student.countDocuments({ mentorId: m._id, ...activeStatusFilter });
        const maxCapacity = m.maxMentees || 30;
        const remainingCapacity = Math.max(0, maxCapacity - menteeCount);
        const isActive = AllocationService.isMentorActive(m);

        if (isActive) {
          totalCapacity += maxCapacity;
        }
        totalAssignedMentees += menteeCount;

        return {
          _id: m._id,
          mentorId: m._id,
          name: m.userId?.name || 'Faculty Mentor',
          email: m.userId?.email || '',
          employeeId: m.employeeId || '',
          department: m.department,
          designation: m.designation,
          maxMentees: maxCapacity,
          maxCapacity,
          assignedCount: menteeCount,
          currentMentees: menteeCount,
          availableSlots: remainingCapacity,
          remainingCapacity,
          utilizationPercentage: maxCapacity > 0 ? Math.round((menteeCount / maxCapacity) * 100) : 0,
          isActive,
        };
      })
    );

    const activeMentors = mentorWorkload.filter((m) => m.isActive);
    const avgMenteesPerMentor =
      activeMentors.length > 0 ? Math.round((totalAssignedMentees / activeMentors.length) * 10) / 10 : 0;
    const availableCapacity = Math.max(0, totalCapacity - totalAssignedMentees);
    const capacityUtilization = totalCapacity > 0 ? Math.round((totalAssignedMentees / totalCapacity) * 100) : 0;
    const isShortage = unassignedStudents > availableCapacity;
    const shortageAmount = isShortage ? unassignedStudents - availableCapacity : 0;

    return {
      department: department || 'ALL',
      students: {
        total: totalStudents,
        assigned: totalAssignedMentees,
        unassigned: unassignedStudents,
      },
      mentors: {
        total: mentors.length,
        active: activeMentors.length,
      },
      capacity: {
        totalStudents,
        totalAssigned: totalAssignedMentees,
        totalCapacity,
        availableCapacity,
        utilizationPercentage: capacityUtilization,
      },
      shortage: {
        isShortage,
        shortageAmount,
      },
      metrics: {
        totalStudents,
        totalMentors: mentors.length,
        activeMentorsCount: activeMentors.length,
        unassignedStudents,
        totalAssignedMentees,
        totalCapacity,
        availableCapacity,
        avgMenteesPerMentor,
        batchesCount: batches.length,
      },
      mentorWorkload,
      recentBatches: batches,
    };
  }

  /**
   * Capacity calculation and validation before allocation
   */
  static async calculateCapacity({ department = 'ALL', batch, semester }) {
    const activeStatusFilter = { status: { $nin: ['GRADUATED', 'INACTIVE', 'DROPPED'] } };
    const studentQuery = {
      $or: [{ mentorId: null }, { mentorId: { $exists: false } }],
      ...activeStatusFilter,
    };
    if (department && department !== 'ALL') studentQuery.department = department;
    if (batch) studentQuery.batch = batch;
    if (semester) studentQuery.semester = Number(semester);

    const totalStudentsInDept = await Student.countDocuments({
      ...(department && department !== 'ALL' ? { department } : {}),
      ...activeStatusFilter,
    });
    const unassignedStudents = await Student.find(studentQuery).populate('userId', 'name email');

    const mentorQuery = department && department !== 'ALL' ? { department } : {};
    const mentors = await Mentor.find(mentorQuery).populate('userId', 'name email isActive');
    const activeMentors = mentors.filter(AllocationService.isMentorActive);

    let totalCapacity = 0;
    let totalAssigned = 0;
    let totalAvailableCapacity = 0;

    const mentorList = await Promise.all(
      mentors.map(async (m) => {
        const currentCount = await Student.countDocuments({ mentorId: m._id, ...activeStatusFilter });
        const max = m.maxMentees || 30;
        const available = Math.max(0, max - currentCount);
        const isActive = AllocationService.isMentorActive(m);

        if (isActive) {
          totalCapacity += max;
          totalAvailableCapacity += available;
        }
        totalAssigned += currentCount;

        return {
          _id: m._id,
          mentorId: m._id,
          name: m.userId?.name || 'Faculty Mentor',
          email: m.userId?.email || '',
          employeeId: m.employeeId || '',
          department: m.department,
          designation: m.designation,
          maxMentees: max,
          maxCapacity: max,
          assignedCount: currentCount,
          currentMentees: currentCount,
          availableSlots: available,
          remainingCapacity: available,
          availableCapacity: available,
          utilizationPercentage: max > 0 ? Math.round((currentCount / max) * 100) : 0,
          isActive,
        };
      })
    );

    const requiredCapacity = unassignedStudents.length;
    const capacityShortage = Math.max(0, requiredCapacity - totalAvailableCapacity);
    const isShortage = capacityShortage > 0;
    const utilizationPercentage = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0;

    return {
      department: department || 'ALL',
      summary: {
        totalStudents: totalStudentsInDept,
        assignedStudents: totalAssigned,
        unassignedStudents: requiredCapacity,
        totalCapacity,
        availableCapacity: totalAvailableCapacity,
        utilizationPercentage,
      },
      capacity: {
        totalStudents: totalStudentsInDept,
        totalAssigned,
        totalCapacity,
        availableCapacity: totalAvailableCapacity,
        utilizationPercentage,
      },
      shortage: {
        isShortage,
        shortageAmount: capacityShortage,
      },
      requiredCapacity,
      totalAvailableCapacity,
      capacityShortage,
      isSufficient: !isShortage,
      unassignedCount: requiredCapacity,
      activeMentorsCount: activeMentors.length,
      mentors: mentorList,
      mentorCapacities: mentorList.filter((m) => m.isActive),
    };
  }

  /**
   * Deterministic, balanced automatic allocation preview
   * Hard constraints: Department, Batch, Semester, Active Mentor, Available Capacity.
   * Section is ONLY a preference (preferred matching, never rejects or leaves unassigned).
   * Preview does NOT modify the database.
   */
  static async generateAllocationPreview({
    department,
    batch,
    semester,
    academicYear = '2025-2026',
    mode = 'incremental',
    sectionPreference = true,
  }) {
    // 1. Determine student query based on mode
    const studentQuery = {
      status: { $nin: ['GRADUATED', 'INACTIVE', 'DROPPED'] },
    };
    if (department && department !== 'ALL') studentQuery.department = department;
    if (batch) studentQuery.batch = batch;
    if (semester) studentQuery.semester = Number(semester);

    if (mode === 'incremental') {
      // Only unassigned and late admissions
      studentQuery.$or = [{ mentorId: null }, { mentorId: { $exists: false } }];
    }

    const students = await Student.find(studentQuery)
      .populate('userId', 'name email')
      .populate('mentorId', 'employeeId userId');

    if (students.length === 0) {
      return {
        mode,
        academicYear,
        department: department || 'ALL',
        semester: semester ? Number(semester) : null,
        batch: batch || 'Current',
        summary: {
          totalStudentsInBatch: 0,
          studentsAllocated: 0,
          studentsUnallocated: 0,
          capacityShortage: 0,
          mentorsInvolved: 0,
          autoAssigned: 0,
          manualAssigned: 0,
        },
        assignments: [],
        allocationsByMentor: [],
        unallocatedStudents: [],
        message: 'No eligible students found for the specified allocation parameters.',
      };
    }

    // 2. Fetch eligible active mentors in the department
    const mentorQuery = department && department !== 'ALL' ? { department } : {};
    const mentors = await Mentor.find(mentorQuery).populate('userId', 'name email isActive');
    const activeMentors = mentors.filter(AllocationService.isMentorActive);

    if (activeMentors.length === 0) {
      throw new AppError('No active mentors available in this department for allocation', 400);
    }

    // Calculate live workloads and available capacities
    const mentorWorkloads = await Promise.all(
      activeMentors.map(async (m) => {
        // If mode === 'full', current count will be recomputed from zero
        const currentMentees = mode === 'full' ? 0 : await Student.countDocuments({
          mentorId: m._id,
          status: { $nin: ['GRADUATED', 'INACTIVE', 'DROPPED'] },
        });
        const max = m.maxMentees || 30;
        const remainingCapacity = Math.max(0, max - currentMentees);
        return {
          mentorDoc: m,
          mentorId: m._id.toString(),
          employeeId: m.employeeId || '',
          name: m.userId?.name || 'Faculty Mentor',
          maxCapacity: max,
          currentMentees,
          remainingCapacity,
          newAllocations: [],
          sections: new Set(),
        };
      })
    );

    // Filter to mentors with remaining capacity
    const eligibleMentors = mentorWorkloads.filter((m) => m.remainingCapacity > 0);
    const totalRemainingCapacity = eligibleMentors.reduce((sum, m) => sum + m.remainingCapacity, 0);
    const capacityShortage = Math.max(0, students.length - totalRemainingCapacity);

    // 3. Section-preferred balanced distribution algorithm
    // Group students by section (preference only)
    let studentsToAllocate = [...students];
    if (sectionPreference) {
      studentsToAllocate.sort((a, b) => (a.section || 'A').localeCompare(b.section || 'A'));
    }

    const flatAssignments = [];
    const unallocated = [];

    for (const student of studentsToAllocate) {
      // Find mentors that still have capacity for this batch
      const availableMentors = eligibleMentors.filter(
        (m) => m.newAllocations.length < m.remainingCapacity
      );

      if (availableMentors.length === 0) {
        unallocated.push({
          studentId: student._id,
          usn: student.usn,
          name: student.userId?.name || 'Student',
          section: student.section || 'A',
          semester: student.semester,
          reason: 'Insufficient mentor capacity',
        });
        continue;
      }

      // Section Preference: Prefer mentor already assigned to this section
      let targetMentor = null;
      if (sectionPreference && student.section) {
        const sameSectionMentors = availableMentors.filter((m) =>
          m.sections.has(student.section)
        );
        if (sameSectionMentors.length > 0) {
          // Pick the one with lowest total load
          sameSectionMentors.sort(
            (a, b) =>
              a.currentMentees + a.newAllocations.length - (b.currentMentees + b.newAllocations.length)
          );
          targetMentor = sameSectionMentors[0];
        }
      }

      // If no same-section mentor available or section preference didn't match,
      // pick available mentor with lowest load (hard constraint: capacity + active only)
      if (!targetMentor) {
        availableMentors.sort(
          (a, b) =>
            a.currentMentees + a.newAllocations.length - (b.currentMentees + b.newAllocations.length)
        );
        targetMentor = availableMentors[0];
      }

      targetMentor.sections.add(student.section || 'A');

      const previousMentorId = student.mentorId?._id || student.mentorId || null;
      let previousMentorName = '';
      if (student.mentorId?.userId?.name) {
        previousMentorName = student.mentorId.userId.name;
      }

      const allocationEntry = {
        studentId: student._id,
        studentUsn: student.usn,
        usn: student.usn,
        studentName: student.userId?.name || 'Student',
        studentSection: student.section || 'A',
        section: student.section || 'A',
        studentSemester: student.semester,
        semester: student.semester,
        assignedMentorId: targetMentor.mentorId,
        assignedMentorName: targetMentor.name,
        currentMentorId: previousMentorId,
        currentMentorName: previousMentorName || null,
        assignmentType: ASSIGNMENT_TYPE.AUTOMATIC,
        isNewAllocation: !student.mentorId,
      };

      targetMentor.newAllocations.push(allocationEntry);
      flatAssignments.push(allocationEntry);
    }

    const allocationsByMentor = eligibleMentors
      .filter((m) => m.newAllocations.length > 0)
      .map((m) => ({
        mentorId: m.mentorId,
        mentorName: m.name,
        currentMentees: m.currentMentees,
        maxCapacity: m.maxCapacity,
        newCount: m.newAllocations.length,
        projectedTotal: m.currentMentees + m.newAllocations.length,
        students: m.newAllocations,
      }));

    return {
      mode,
      academicYear,
      department: department || 'ALL',
      batch: batch || 'Current',
      semester: semester ? Number(semester) : null,
      summary: {
        totalStudentsInBatch: students.length,
        studentsAllocated: flatAssignments.length,
        studentsUnallocated: unallocated.length,
        capacityShortage,
        mentorsInvolved: allocationsByMentor.length,
        autoAssigned: flatAssignments.length,
        manualAssigned: 0,
      },
      assignments: flatAssignments,
      allocationsByMentor,
      unallocatedStudents: unallocated,
    };
  }

  /**
   * Confirm generated allocation and persist mentor-mentee assignments
   * Supports both flat `assignments` list and grouped `allocationsByMentor`.
   * Enforces atomicity, duplicate submission prevention, active mentor check, and capacity safety.
   */
  static async confirmAllocation({
    allocationData,
    assignments: directAssignments,
    coordinatorUser,
    notes = '',
    academicYear = '2025-2026',
    mode = 'incremental',
    department,
    semester,
    batch,
  }) {
    // Standardize assignment entries
    let rawList = [];

    if (directAssignments && Array.isArray(directAssignments) && directAssignments.length > 0) {
      rawList = directAssignments;
    } else if (allocationData?.assignments && Array.isArray(allocationData.assignments)) {
      rawList = allocationData.assignments;
    } else if (allocationData?.allocationsByMentor && Array.isArray(allocationData.allocationsByMentor)) {
      for (const group of allocationData.allocationsByMentor) {
        for (const st of group.students || []) {
          rawList.push({
            studentId: st.studentId,
            studentUsn: st.studentUsn || st.usn,
            studentName: st.studentName,
            studentSection: st.studentSection,
            mentorId: st.assignedMentorId || group.mentorId,
            mentorName: st.assignedMentorName || group.mentorName,
            assignmentType: st.assignmentType || ASSIGNMENT_TYPE.AUTOMATIC,
            manualOverride: st.manualOverride || false,
          });
        }
      }
    }

    if (rawList.length === 0) {
      // Before throwing the generic error, check whether this looks like a duplicate submission:
      // i.e., the coordinator is re-confirming a batch for a dept/batch/semester that already
      // has confirmed allocations (all students were already assigned so preview returned empty).
      const deptForCheck = department || allocationData?.department;
      const batchForCheck = batch || allocationData?.batch;
      const semesterForCheck = semester || allocationData?.semester;
      if (deptForCheck) {
        const duplicateQuery = { department: deptForCheck, status: 'confirmed' };
        if (batchForCheck) duplicateQuery.batch = batchForCheck;
        if (semesterForCheck) duplicateQuery.semester = Number(semesterForCheck);
        const existingBatch = await AllocationBatch.findOne(duplicateQuery);
        if (existingBatch) {
          throw new AppError(
            'Duplicate confirmation: All students in this allocation batch have already been allocated to these mentors.',
            400
          );
        }
      }
      throw new AppError('No valid allocation assignments provided for confirmation', 400);
    }

    // 1. Duplicate confirmation detection
    // If all students in this allocation list are already assigned to these exact mentors, reject as duplicate!
    const studentIds = rawList.map((a) => a.studentId);
    const existingStudents = await Student.find({ _id: { $in: studentIds } }).populate('userId', 'name email');

    const existingMap = new Map(existingStudents.map((s) => [s._id.toString(), s]));
    let alreadyMatchedCount = 0;

    for (const item of rawList) {
      const current = existingMap.get(item.studentId?.toString());
      const targetMentorId = (item.mentorId || item.assignedMentorId)?.toString();
      if (current && current.mentorId && current.mentorId.toString() === targetMentorId) {
        alreadyMatchedCount++;
      }
    }

    if (alreadyMatchedCount === rawList.length && rawList.length > 0) {
      throw new AppError(
        'Duplicate confirmation: All students in this allocation batch have already been allocated to these mentors.',
        400
      );
    }

    // 2. Validate target mentors (active status & capacity constraints)
    const mentorAssignmentsCount = new Map();
    for (const item of rawList) {
      const mId = (item.mentorId || item.assignedMentorId)?.toString();
      if (!mId) throw new AppError(`Missing mentor assignment for student ${item.studentUsn || item.studentId}`, 400);
      mentorAssignmentsCount.set(mId, (mentorAssignmentsCount.get(mId) || 0) + 1);
    }

    const mentorIds = Array.from(mentorAssignmentsCount.keys());
    const mentorDocs = await Mentor.find({ _id: { $in: mentorIds } }).populate('userId', 'name email isActive');
    const mentorMap = new Map(mentorDocs.map((m) => [m._id.toString(), m]));

    for (const [mId, newCount] of mentorAssignmentsCount.entries()) {
      const mentor = mentorMap.get(mId);
      if (!mentor) {
        throw new AppError(`Target mentor ${mId} not found`, 404);
      }

      if (!AllocationService.isMentorActive(mentor)) {
        throw new AppError(
          `Cannot allocate to mentor ${mentor.userId?.name || mentor.employeeId} because this mentor is currently inactive`,
          400
        );
      }

      // Check capacity
      const currentMentees = await Student.countDocuments({ mentorId: mentor._id });
      const max = mentor.maxMentees || 30;
      if (currentMentees + newCount > max) {
        throw new AppError(
          `Allocation exceeds capacity for mentor ${mentor.userId?.name || mentor.employeeId}. Max: ${max}, Current: ${currentMentees}, New: ${newCount}`,
          400
        );
      }
    }

    // 3. Persist assignments atomically and build batch record
    const flattenedAllocations = [];
    const studentUpdatePromises = [];
    const notificationPromises = [];

    const finalDept = department || allocationData?.department || coordinatorUser.department || 'CSE';
    const finalBatch = batch || allocationData?.batch || 'Current';
    const finalSemester = semester || allocationData?.semester || 1;
    const finalAcademicYear = academicYear || allocationData?.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

    for (const item of rawList) {
      const currentStudent = existingMap.get(item.studentId?.toString());
      if (!currentStudent) continue;

      const targetMentorId = item.mentorId || item.assignedMentorId;
      const targetMentor = mentorMap.get(targetMentorId?.toString());
      const targetMentorName = item.mentorName || item.assignedMentorName || targetMentor?.userId?.name || 'Faculty Mentor';

      const prevMentorId = currentStudent.mentorId || null;
      let prevMentorName = '';
      if (prevMentorId) {
        const prevDoc = await Mentor.findById(prevMentorId).populate('userId', 'name');
        prevMentorName = prevDoc?.userId?.name || '';
      }

      const assignedType =
        item.manualOverride || item.assignmentType === ASSIGNMENT_TYPE.MANUAL
          ? ASSIGNMENT_TYPE.MANUAL
          : ASSIGNMENT_TYPE.AUTOMATIC;

      flattenedAllocations.push({
        studentId: currentStudent._id,
        studentUsn: currentStudent.usn,
        studentName: currentStudent.userId?.name || item.studentName || 'Student',
        studentSection: currentStudent.section || item.studentSection || 'A',
        mentorId: targetMentor._id,
        mentorName: targetMentorName,
        previousMentorId: prevMentorId,
        previousMentorName: prevMentorName,
        assignmentType: assignedType,
      });

      // Update student record and record mentor history
      const historyEntry = {
        mentorId: targetMentor._id,
        mentorName: targetMentorName,
        assignedAt: new Date(),
        academicYear: finalAcademicYear,
        semester: currentStudent.semester || 1,
        reason: notes || `Batch allocation (${assignedType})`,
      };

      studentUpdatePromises.push(
        Student.findByIdAndUpdate(
          currentStudent._id,
          {
            mentorId: targetMentor._id,
            $push: { mentorHistory: historyEntry },
          },
          { new: true }
        )
      );

      // Notify student using recipientId
      if (currentStudent.userId?._id || currentStudent.userId) {
        notificationPromises.push(
          Notification.create({
            recipientId: currentStudent.userId._id || currentStudent.userId,
            senderId: coordinatorUser._id,
            title: 'Mentor Allocated',
            message: `You have been assigned to faculty mentor ${targetMentorName}.`,
            category: NOTIFICATION_CATEGORIES.ALLOCATION,
            link: '/student/overview',
          }).catch(() => null)
        );
      }
    }

    // Persist all student updates
    await Promise.all(studentUpdatePromises);

    // Notify mentors of newly assigned mentees
    for (const [mId, newCount] of mentorAssignmentsCount.entries()) {
      const mentor = mentorMap.get(mId);
      if (mentor?.userId?._id) {
        notificationPromises.push(
          Notification.create({
            recipientId: mentor.userId._id,
            senderId: coordinatorUser._id,
            title: 'New Mentees Assigned',
            message: `${newCount} mentee(s) have been assigned to you by Mentoring Coordinator ${coordinatorUser.name}.`,
            category: NOTIFICATION_CATEGORIES.ALLOCATION,
            link: '/mentor/students',
          }).catch(() => null)
        );
      }
    }

    // 4. Create AllocationBatch record
    const autoCount = flattenedAllocations.filter((a) => a.assignmentType === ASSIGNMENT_TYPE.AUTOMATIC).length;
    const manualCount = flattenedAllocations.filter((a) => a.assignmentType === ASSIGNMENT_TYPE.MANUAL).length;

    const allocationBatch = await AllocationBatch.create({
      department: finalDept,
      batch: finalBatch,
      semester: Number(finalSemester) || 1,
      academicYear: finalAcademicYear,
      allocatedBy: coordinatorUser._id,
      allocatedByName: coordinatorUser.name,
      status: ALLOCATION_STATUS.CONFIRMED,
      summary: {
        totalStudentsInBatch: flattenedAllocations.length,
        studentsAllocated: flattenedAllocations.length,
        studentsUnallocated: 0,
        capacityShortage: 0,
        mentorsInvolved: mentorIds.length,
        autoAssigned: autoCount,
        manualAssigned: manualCount,
      },
      allocations: flattenedAllocations,
      confirmedAt: new Date(),
      notes: notes || `Confirmed ${mode} allocation by ${coordinatorUser.name}`,
    });

    // 5. Create AuditLog
    await AuditLog.create({
      actorId: coordinatorUser._id,
      actorRole: coordinatorUser.role,
      actorName: coordinatorUser.name,
      action: AUDIT_ACTIONS.ALLOCATION_CONFIRMED,
      entity: 'AllocationBatch',
      entityId: allocationBatch._id,
      newValue: {
        batchId: allocationBatch._id,
        department: allocationBatch.department,
        allocatedCount: flattenedAllocations.length,
        mentorsCount: mentorIds.length,
      },
      description: `Confirmed mentor allocation for ${flattenedAllocations.length} students across ${mentorIds.length} mentors in ${finalDept}.`,
    });

    // Fire notifications asynchronously
    Promise.all(notificationPromises).catch(() => null);

    return allocationBatch;
  }

  /**
   * Manual adjustment / reassignment of an individual student
   */
  static async reassignStudent({ studentId, newMentorId, reason = '', coordinatorUser }) {
    const student = await Student.findById(studentId).populate('userId', 'name email');
    if (!student) throw new AppError('Student record not found', 404);

    if (student.status && ['GRADUATED', 'INACTIVE', 'DROPPED'].includes(student.status)) {
      throw new AppError('Cannot reassign mentor for a graduated or inactive student', 400);
    }

    const newMentor = await Mentor.findById(newMentorId).populate('userId', 'name email isActive');
    if (!newMentor) throw new AppError('Target mentor not found', 404);

    if (!AllocationService.isMentorActive(newMentor)) {
      throw new AppError('Target mentor is currently inactive and cannot receive students', 400);
    }

    // Verify mentor capacity
    const currentMentees = await Student.countDocuments({
      mentorId: newMentor._id,
      status: { $nin: ['GRADUATED', 'INACTIVE', 'DROPPED'] },
    });
    const maxCapacity = newMentor.maxMentees != null ? newMentor.maxMentees : 30;
    if (currentMentees >= maxCapacity) {
      throw new AppError(
        `Mentor ${newMentor.userId?.name || newMentor.employeeId} has reached maximum capacity (${maxCapacity} mentees).`,
        400
      );
    }

    const previousMentorId = student.mentorId;
    let previousMentorName = '';
    if (previousMentorId) {
      const prev = await Mentor.findById(previousMentorId).populate('userId', 'name');
      previousMentorName = prev?.userId?.name || '';
    }

    // Preserve historical mentor relationship
    if (!student.mentorHistory) student.mentorHistory = [];
    student.mentorHistory.push({
      mentorId: newMentor._id,
      mentorName: newMentor.userId?.name || 'Faculty Mentor',
      assignedAt: new Date(),
      academicYear: student.academicYear || '2025-2026',
      semester: student.semester || 1,
      reason: reason || 'Coordinator manual adjustment',
    });

    student.mentorId = newMentor._id;
    await student.save();

    // AuditLog
    await AuditLog.create({
      actorId: coordinatorUser._id,
      actorRole: coordinatorUser.role,
      actorName: coordinatorUser.name,
      action: AUDIT_ACTIONS.ALLOCATION_REASSIGNED,
      entity: 'Student',
      entityId: student._id,
      previousValue: { mentorId: previousMentorId, mentorName: previousMentorName },
      newValue: { mentorId: newMentor._id, mentorName: newMentor.userId?.name, reason },
      description: `Reassigned student ${student.usn} (${student.userId?.name}) from ${previousMentorName || 'None'} to ${newMentor.userId?.name}. Reason: ${reason || 'Coordinator manual adjustment'}`,
    });

    // Notifications
    if (student.userId?._id) {
      await Notification.create({
        recipientId: student.userId._id,
        senderId: coordinatorUser._id,
        title: 'Mentor Reassigned',
        message: `Your faculty mentor has been updated to ${newMentor.userId?.name}.`,
        category: NOTIFICATION_CATEGORIES.ALLOCATION,
        link: '/student/overview',
      }).catch(() => null);
    }

    if (newMentor.userId?._id) {
      await Notification.create({
        recipientId: newMentor.userId._id,
        senderId: coordinatorUser._id,
        title: 'New Mentee Reassigned',
        message: `Student ${student.usn} (${student.userId?.name}) has been assigned to your mentorship list.`,
        category: NOTIFICATION_CATEGORIES.ALLOCATION,
        link: '/mentor/students',
      }).catch(() => null);
    }

    return {
      studentId: student._id,
      usn: student.usn,
      newMentorId: newMentor._id,
      newMentorName: newMentor.userId?.name,
      previousMentorName,
      message: `Successfully reassigned student ${student.usn} to ${newMentor.userId?.name}`,
    };
  }

  /**
   * Toggle mentor active status (Coordinator / HOD control)
   * Inactive mentors cannot receive new mentees. Existing mentees remain visible.
   */
  static async toggleMentorStatus(mentorId, isActive, coordinatorUser) {
    const mentor = await Mentor.findById(mentorId).populate('userId', 'name email');
    if (!mentor) throw new AppError('Mentor not found', 404);

    mentor.isActive = Boolean(isActive);
    await mentor.save();

    await AuditLog.create({
      actorId: coordinatorUser._id,
      actorRole: coordinatorUser.role,
      actorName: coordinatorUser.name,
      action: 'MENTOR_STATUS_TOGGLED',
      entity: 'Mentor',
      entityId: mentor._id,
      newValue: { isActive: mentor.isActive },
      description: `Mentor ${mentor.employeeId} (${mentor.userId?.name}) active status set to ${mentor.isActive} by ${coordinatorUser.name}`,
    });

    return {
      mentorId: mentor._id,
      employeeId: mentor.employeeId,
      name: mentor.userId?.name,
      isActive: mentor.isActive,
      message: `Mentor ${mentor.userId?.name} is now ${mentor.isActive ? 'Active' : 'Inactive'} for allocations.`,
    };
  }

  /**
   * Retrieve allocation history
   */
  static async getAllocationHistory(department = 'ALL') {
    const query = department && department !== 'ALL' ? { department } : {};
    return AllocationBatch.find(query).sort({ createdAt: -1 });
  }

  /**
   * Retrieve single allocation batch details
   */
  static async getAllocationBatchById(batchId) {
    const batch = await AllocationBatch.findById(batchId);
    if (!batch) throw new AppError('Allocation batch record not found', 404);
    return batch;
  }
}

module.exports = AllocationService;

import Student from '../models/Student.js';
import Mentor from '../models/Mentor.js';
import AllocationBatch from '../models/AllocationBatch.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';
import { ALLOCATION_DEFAULTS } from '../config/constants.js';

export async function computeDraftAllocation(department, rules = {}, actorId) {
  const maxMentees = rules.maxMenteesPerMentor || ALLOCATION_DEFAULTS.MAX_MENTEES_PER_MENTOR;
  const evenDistribution = rules.evenDistribution !== false;

  const unallocated = await Student.find({ dept: department, mentorId: null }).lean();
  const mentors = await Mentor.find().populate('user', 'department').lean();

  if (mentors.length === 0) {
    throw new AppError('No mentors available for allocation. Please add mentors first.', 400);
  }

  const capacityMap = {};
  for (const mentor of mentors) {
    const current = await Student.countDocuments({ mentorId: mentor._id });
    const remaining = Math.max(0, maxMentees - current);
    capacityMap[String(mentor._id)] = { mentor, current, remaining };
  }

  const unallocatedStudents = [...unallocated];
  const overflow = [];

  const sortedMentors = mentors.slice().sort((a, b) =>
    capacityMap[String(b._id)].remaining - capacityMap[String(a._id)].remaining
  );

  const allocationMap = {};
  for (const m of mentors) {
    allocationMap[String(m._id)] = [];
  }

  if (evenDistribution && sortedMentors.length > 0) {
    let i = 0;
    for (const student of unallocatedStudents) {
      let assigned = false;
      for (let attempt = 0; attempt < sortedMentors.length; attempt++) {
        const mentorIdx = (i + attempt) % sortedMentors.length;
        const m = sortedMentors[mentorIdx];
        const mid = String(m._id);
        if (capacityMap[mid].remaining > 0) {
          allocationMap[mid].push(student._id);
          capacityMap[mid].remaining--;
          i = (mentorIdx + 1) % sortedMentors.length;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        overflow.push(student._id);
      }
    }
  } else {
    for (const student of unallocatedStudents) {
      let assigned = false;
      for (const m of sortedMentors) {
        const mid = String(m._id);
        if (capacityMap[mid].remaining > 0) {
          allocationMap[mid].push(student._id);
          capacityMap[mid].remaining--;
          assigned = true;
          break;
        }
      }
      if (!assigned) overflow.push(student._id);
    }
  }

  const allocations = mentors.map(m => ({
    mentorId: m._id,
    mentorName: m.name,
    studentIds: allocationMap[String(m._id)],
    studentCount: allocationMap[String(m._id)].length,
  })).filter(a => a.studentCount > 0);

  await AllocationBatch.deleteMany({ department, status: 'draft' });

  const batch = await AllocationBatch.create({
    department,
    status: 'draft',
    rules: { maxMenteesPerMentor: maxMentees, ...rules },
    allocations,
    unallocatedStudentIds: overflow,
    totalStudents: unallocatedStudents.length,
    totalMentors: mentors.length,
    computedBy: actorId,
  });

  await AuditLog.create({
    actorId,
    actorRole: 'mentoring_coordinator',
    action: 'allocation.compute',
    entityType: 'AllocationBatch',
    entityId: batch._id,
    department,
    metadata: { totalStudents: unallocatedStudents.length, overflow: overflow.length },
  });

  return batch;
}

export async function confirmAllocation(batchId, actorId) {
  const batch = await AllocationBatch.findById(batchId);
  if (!batch) throw new AppError('Allocation batch not found', 404);
  if (batch.status !== 'draft') throw new AppError(`Cannot confirm a batch with status: ${batch.status}`, 400);

  for (const allocation of batch.allocations) {
    await Student.updateMany(
      { _id: { $in: allocation.studentIds } },
      { $set: { mentorId: allocation.mentorId } }
    );
    await Mentor.findByIdAndUpdate(allocation.mentorId, { $set: { students: allocation.studentCount } });
  }

  batch.status = 'confirmed';
  batch.confirmedBy = actorId;
  batch.confirmedAt = new Date();
  await batch.save();

  await AuditLog.create({
    actorId,
    actorRole: 'mentoring_coordinator',
    action: 'allocation.confirm',
    entityType: 'AllocationBatch',
    entityId: batch._id,
    department: batch.department,
    metadata: { allocations: batch.allocations.length },
  });

  return batch;
}

export async function reassignStudent({ studentId, toMentorId, reason, actorId }) {
  const student = await Student.findById(studentId);
  if (!student) throw new AppError('Student not found', 404);

  const toMentor = await Mentor.findById(toMentorId);
  if (!toMentor) throw new AppError('Target mentor not found', 404);

  const fromMentorId = student.mentorId;

  student.mentorId = toMentorId;
  await student.save();

  if (fromMentorId) {
    const fromCount = await Student.countDocuments({ mentorId: fromMentorId });
    await Mentor.findByIdAndUpdate(fromMentorId, { students: fromCount });
  }
  const toCount = await Student.countDocuments({ mentorId: toMentorId });
  await Mentor.findByIdAndUpdate(toMentorId, { students: toCount });

  const batch = await AllocationBatch.findOne({ department: student.dept, status: 'confirmed' }).sort({ confirmedAt: -1 });
  if (batch) {
    batch.reassignments.push({ studentId, fromMentorId, toMentorId, reason, actor: actorId, timestamp: new Date() });
    await batch.save();
  }

  await AuditLog.create({
    actorId,
    actorRole: 'mentoring_coordinator',
    action: 'allocation.reassign',
    entityType: 'Student',
    entityId: studentId,
    department: student.dept,
    metadata: { fromMentorId, toMentorId, reason },
  });

  return { student, fromMentorId, toMentorId };
}

export async function getBatchList(department) {
  return AllocationBatch.find({ department })
    .sort({ createdAt: -1 })
    .populate('computedBy', 'name email')
    .populate('confirmedBy', 'name email')
    .lean();
}

export async function getBatchById(batchId) {
  return AllocationBatch.findById(batchId)
    .populate('allocations.mentorId', 'name email mentorId')
    .populate('allocations.studentIds', 'name usn dept year section cgpa backlog')
    .populate('computedBy', 'name email')
    .populate('confirmedBy', 'name email')
    .lean();
}

export async function getMentorCapacity(department) {
  const mentors = await Mentor.find().populate('user', 'name email department').lean();
  const result = await Promise.all(mentors.map(async m => {
    const assigned = await Student.countDocuments({ mentorId: m._id });
    return {
      _id: m._id,
      name: m.name,
      email: m.email,
      mentorCode: m.mentorId,
      assigned,
      status: m.status,
    };
  }));
  return result;
}

import Task from '../models/Task.js';
import Mentor from '../models/Mentor.js';

export async function getDeptTaskStats(department) {
  const mentors = await Mentor.find().lean();
  const byMentor = await Promise.all(mentors.map(async m => {
    const tasks = await Task.find({ mentorId: m._id }).lean();
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    return {
      mentorId: m._id,
      mentorName: m.name,
      total,
      completed: done,
      pending: total - done,
      completionRate: total ? Math.round((done / total) * 100) : 0,
    };
  }));

  const overall = byMentor.reduce((acc, s) => {
    acc.total += s.total;
    acc.completed += s.completed;
    return acc;
  }, { total: 0, completed: 0 });

  return {
    byMentor,
    overall: {
      ...overall,
      completionRate: overall.total ? Math.round((overall.completed / overall.total) * 100) : 0,
    },
  };
}

export async function createDeptTemplate(data, actorId) {
  const task = await Task.create({
    ...data,
    assignedBy: actorId,
    isTemplate: true,
  });
  return task;
}

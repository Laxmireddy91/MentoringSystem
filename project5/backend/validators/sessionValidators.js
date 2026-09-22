const { z } = require('zod');
const { SESSION_TYPES, SESSION_STATUS } = require('../config/constants');

const createSessionSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  title: z.string().min(3, 'Session title must be at least 3 characters'),
  description: z.string().optional(),
  sessionType: z.enum(Object.values(SESSION_TYPES)).default(SESSION_TYPES.ACADEMIC),
  startTime: z.string().datetime({ message: 'Valid ISO startTime required' }),
  endTime: z.string().datetime({ message: 'Valid ISO endTime required' }),
  meetingType: z.enum(['offline', 'online']).default('offline'),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  agenda: z.string().optional(),
});

const bookSlotSchema = z.object({
  mentorId: z.string().min(1, 'Mentor ID is required'),
  title: z.string().min(3, 'Title is required').default('Mentoring Discussion'),
  description: z.string().optional(),
  sessionType: z.enum(Object.values(SESSION_TYPES)).default(SESSION_TYPES.ACADEMIC),
  startTime: z.string().datetime({ message: 'Valid ISO startTime required' }),
  endTime: z.string().datetime({ message: 'Valid ISO endTime required' }),
  meetingType: z.enum(['offline', 'online']).default('offline'),
  location: z.string().optional(),
  meetingLink: z.string().url().optional().or(z.literal('')),
  agenda: z.string().optional(),
});

const updateSessionStatusSchema = z.object({
  status: z.enum(Object.values(SESSION_STATUS)),
  mentorNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
  actionItems: z
    .array(
      z.object({
        task: z.string().min(1),
        completed: z.boolean().default(false),
        dueDate: z.string().optional().nullable(),
      })
    )
    .optional(),
});

module.exports = {
  createSessionSchema,
  bookSlotSchema,
  updateSessionStatusSchema,
};

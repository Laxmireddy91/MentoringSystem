const { z } = require('zod');

const createStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8).default('Student@123'),
  usn: z.string().min(3, 'USN is required').toUpperCase(),
  department: z.string().min(2, 'Department is required'),
  program: z.string().default('B.E.'),
  admissionYear: z.coerce.number().optional(),
  academicYear: z.string().default('2025-2026'),
  entryType: z.enum(['REGULAR', 'LATERAL']).default('REGULAR'),
  status: z.enum(['ACTIVE', 'GRADUATED', 'INACTIVE', 'DROPPED']).default('ACTIVE'),
  semester: z.coerce.number().min(1).max(8).default(1),
  section: z.string().default('A'),
  batch: z.string().default('2022-2026'),
  mentorId: z.string().optional().nullable(),
  phone: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().optional(),
  parentRelation: z.string().optional(),
  parentDetails: z
    .object({
      fatherName: z.string().optional(),
      motherName: z.string().optional(),
      guardianPhone: z.string().optional(),
      guardianEmail: z.string().optional(),
    })
    .optional(),
});

const updateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  program: z.string().optional(),
  admissionYear: z.coerce.number().optional(),
  academicYear: z.string().optional(),
  entryType: z.enum(['REGULAR', 'LATERAL']).optional(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'INACTIVE', 'DROPPED']).optional(),
  semester: z.coerce.number().min(1).max(8).optional(),
  section: z.string().optional(),
  batch: z.string().optional(),
  mentorId: z.string().optional().nullable(),
  phone: z.string().optional(),
  parentDetails: z.record(z.any()).optional(),
});

const createMentorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8).default('Mentor@123'),
  employeeId: z.string().min(2, 'Employee ID is required').toUpperCase(),
  department: z.string().min(2, 'Department is required'),
  designation: z.string().default('Assistant Professor'),
  specialization: z.array(z.string()).optional(),
  maxMentees: z.coerce.number().min(1).max(100).default(30),
  phone: z.string().optional(),
});

const updateMentorSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  maxMentees: z.coerce.number().min(1).max(100).optional(),
  phone: z.string().optional(),
});

const assignMentorSchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1, 'At least one student ID must be provided'),
  mentorId: z.string().min(1, 'Mentor ID is required'),
});

const officeHourSlotSchema = z.object({
  dayOfWeek: z.coerce.number().min(0).max(6),
  dayName: z.enum(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:MM'),
  slotDurationMinutes: z.coerce.number().min(15).max(120).default(30),
  location: z.string().default('Faculty Cabin / Online'),
  isActive: z.boolean().default(true),
});

const updateOfficeHoursSchema = z.object({
  officeHours: z.array(officeHourSlotSchema),
});

const riskSettingsSchema = z.object({
  cieThresholdPercentage: z.coerce.number().min(0).max(100),
  backlogThresholdCount: z.coerce.number().min(0).max(10),
  weights: z.object({
    cie: z.coerce.number().min(0).max(1),
    backlogs: z.coerce.number().min(0).max(1),
    trend: z.coerce.number().min(0).max(1),
  }),
});

module.exports = {
  createStudentSchema,
  updateStudentSchema,
  createMentorSchema,
  updateMentorSchema,
  assignMentorSchema,
  updateOfficeHoursSchema,
  riskSettingsSchema,
};

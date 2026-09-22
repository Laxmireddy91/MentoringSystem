const { z } = require('zod');
const { ROLES } = require('../config/constants');

const loginSchema = z.object({
  email: z.string().min(1, 'Email or USN/EmployeeID is required'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum([ROLES.STUDENT, ROLES.MENTOR, ROLES.HOD, ROLES.PARENT]),
  department: z.string().min(2, 'Department is required'),
  phone: z.string().optional(),
  // Conditional fields
  usn: z.string().optional(),
  semester: z.coerce.number().min(1).max(8).optional(),
  section: z.string().optional(),
  batch: z.string().optional(),
  admissionYear: z.coerce.number().optional(),
  academicYear: z.string().optional(),
  entryType: z.enum(['REGULAR', 'LATERAL']).optional(),
  program: z.string().optional(),
  status: z.enum(['ACTIVE', 'GRADUATED', 'INACTIVE', 'DROPPED']).optional(),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  studentUsn: z.string().optional(),
  relation: z.string().optional(),
  parentName: z.string().optional(),
  parentEmail: z.string().optional(),
  parentRelation: z.string().optional(),
  parentDetails: z.record(z.any()).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'New password must contain at least one special character'),
});

const twoFactorVerifySchema = z.object({
  code: z.string().length(6, '2FA Code must be 6 digits'),
});

module.exports = {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  twoFactorVerifySchema,
};

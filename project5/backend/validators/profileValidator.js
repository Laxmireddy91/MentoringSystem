const { z } = require('zod');

// Helper schemas
const skillSchema = z.object({
  name: z.string().min(1, { message: 'Skill name is required' }),
  proficiency: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']).optional(),
});

const socialLinkSchema = z.object({
  linkedIn: z.string().url().optional(),
  gitHub: z.string().url().optional(),
  portfolio: z.string().url().optional(),
  personalWebsite: z.string().url().optional(),
  googleScholar: z.string().url().optional(),
  other: z.array(z.object({ platform: z.string().min(1), url: z.string().url() })).optional(),
});

const educationSchema = z.object({
  qualification: z.string().optional(),
  institution: z.string().optional(),
  field: z.string().optional(),
  startYear: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  endYear: z.number().int().min(1900).max(new Date().getFullYear() + 10).optional(),
  grade: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.startYear && data.endYear) return data.startYear <= data.endYear;
  return true;
}, { message: 'Start year must be less than or equal to end year', path: ['startYear', 'endYear'] });

const experienceSchema = z.object({
  organization: z.string().optional(),
  role: z.string().optional(),
  startDate: z.string().optional(), // ISO date string validated later
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  description: z.string().optional(),
}).refine((data) => {
  if (data.currentlyWorking) return true;
  if (data.startDate && data.endDate) return new Date(data.startDate) <= new Date(data.endDate);
  return true;
}, { message: 'Start date must be before end date unless currently working', path: ['startDate', 'endDate'] });

const projectSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  projectUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
  demoUrl: z.string().url().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) return new Date(data.startDate) <= new Date(data.endDate);
  return true;
}, { message: 'Project start date must be before end date', path: ['startDate', 'endDate'] });

const certificationSchema = z.object({
  name: z.string().optional(),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
  description: z.string().optional(),
  documentRef: z.string().uuid().optional(), // will be validated as ObjectId elsewhere
}).refine((data) => {
  if (data.issueDate && data.expiryDate) return new Date(data.issueDate) <= new Date(data.expiryDate);
  return true;
}, { message: 'Issue date must be before expiry date', path: ['issueDate', 'expiryDate'] });

const additionalInfoSchema = z.object({
  category: z.string().min(1),
  title: z.string().min(1),
  value: z.string().min(1),
});

// Main profile schema – only fields that are allowed to be updated by the user
const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const mongoId = z.string().regex(objectIdRegex, 'Must be a valid MongoDB ObjectId');

const profileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  fullName: z.string().min(1).max(100).optional(),
  bio: z.string().max(1000).optional(),
  visibility: z.enum(['private', 'institution', 'mentor', 'placement']).optional(),
  phone: z.string().max(20).optional(),
  avatarDocumentId: mongoId.nullable().optional(),
  skills: z.array(skillSchema).optional(),
  social: socialLinkSchema.optional(),
  education: z.array(educationSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  projects: z.array(projectSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  additionalInfo: z.array(additionalInfoSchema).optional(),
  resumeReference: mongoId.nullable().optional(),
});

module.exports = { profileSchema };

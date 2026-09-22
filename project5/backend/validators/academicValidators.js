const { z } = require('zod');

const subjectMarkEntrySchema = z.object({
  subjectCode: z.string().min(1, 'Subject code is required').toUpperCase(),
  subjectName: z.string().min(1, 'Subject name is required'),
  credits: z.coerce.number().min(1).max(10).default(3),
  cie1: z.coerce.number().min(0).max(50).default(0),
  cie2: z.coerce.number().min(0).max(50).default(0),
  cie3: z.coerce.number().min(0).max(50).default(0),
  finalMarks: z.coerce.number().min(0).max(100).default(0),
});

const updateStudentMarksSchema = z.object({
  semesterNumber: z.coerce.number().min(1).max(8),
  subjects: z.array(subjectMarkEntrySchema).min(1, 'At least one subject must be provided'),
  reason: z.string().optional(),
});

const bulkMarksImportSchema = z.object({
  semesterNumber: z.coerce.number().min(1).max(8),
  records: z.array(
    z.object({
      usn: z.string().min(1, 'USN is required').toUpperCase(),
      subjectCode: z.string().min(1, 'Subject code is required').toUpperCase(),
      subjectName: z.string().min(1, 'Subject name is required'),
      credits: z.coerce.number().min(1).max(10).default(3),
      cie1: z.coerce.number().min(0).max(50).default(0),
      cie2: z.coerce.number().min(0).max(50).default(0),
      cie3: z.coerce.number().min(0).max(50).default(0),
      finalMarks: z.coerce.number().min(0).max(100).default(0),
    })
  ).min(1, 'Records array cannot be empty'),
});

module.exports = {
  subjectMarkEntrySchema,
  updateStudentMarksSchema,
  bulkMarksImportSchema,
};

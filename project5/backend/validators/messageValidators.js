const { z } = require('zod');

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content cannot be empty').max(2000),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string().min(1),
        fileType: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .optional(),
});

module.exports = {
  sendMessageSchema,
};

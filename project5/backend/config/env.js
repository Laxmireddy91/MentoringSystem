const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5001),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/smart_mentoring_system'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars').default(process.env.NODE_ENV === 'test' ? 'testsecret' : 'mentor_connect_super_secret_jwt_key_2026_production_ready'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars').default(process.env.NODE_ENV === 'test' ? 'testrefresh' : 'mentor_connect_refresh_secret_key_2026_secure'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173'),
  SMTP_HOST: z.string().default('smtp.ethereal.email'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('MentorConnect <noreply@mentorconnect.edu>'),
  MAX_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  LOCK_TIME_MINUTES: z.coerce.number().default(15),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
});

const rawEnv = {
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_ACCESS_EXPIRES_IN,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

module.exports = parsedEnv.data;

const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback using ethereal test account or mock transport
    logger.info('📧 Using test mock email transporter');
    transporter = {
      sendMail: async (options) => {
        logger.info(`📧 [Mock Email Sent] To: ${options.to} | Subject: ${options.subject}`);
        if (env.NODE_ENV === 'development') {
          logger.debug(`📧 [Mock Email Content]:\n${options.text || options.html}`);
        }
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text: text || '',
      html: html || text,
    });
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Return mock error without breaking flow in development
    return { error: error.message };
  }
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Welcome to MentorConnect!</h2>
      <p>Please click the button below to verify your academic email address:</p>
      <a href="${verifyUrl}" style="display:inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
      <p>Or paste this link into your browser: <br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This verification link will expire in 24 hours.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Verify Your MentorConnect Email', html });
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your MentorConnect account. Click the button below to choose a new password:</p>
      <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background-color: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
      <p>Or paste this link into your browser: <br/><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This password reset link will expire in 1 hour. If you did not request this, please ignore this email.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Password Reset Request - MentorConnect', html });
};

const sendSessionNotificationEmail = async ({ to, mentorName, studentName, title, startTime, meetingLink }) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Mentoring Session Update</h2>
      <p>A mentoring session has been scheduled between <strong>${mentorName}</strong> and <strong>${studentName}</strong>.</p>
      <p><strong>Session:</strong> ${title}</p>
      <p><strong>Scheduled Time:</strong> ${new Date(startTime).toLocaleString()}</p>
      ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
    </div>
  `;
  return sendEmail({ to, subject: `Mentoring Session: ${title}`, html });
};

const sendWeeklyRiskDigestEmail = async (mentorEmail, mentorName, studentList) => {
  const rows = studentList
    .map(
      (s) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.name} (${s.usn})</td>
        <td style="padding: 8px; border: 1px solid #ddd; color: ${s.riskLevel === 'Critical' ? '#ef4444' : '#f97316'}; font-weight: bold;">${s.riskLevel}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${s.reasons.join(', ')}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h2>Weekly Academic Risk Digest</h2>
      <p>Hello Prof. ${mentorName},</p>
      <p>Here is your weekly summary of mentees flagged for academic attention or intervention:</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Student</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Risk Level</th>
            <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Key Reasons</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="margin-top: 20px;">Please consider scheduling mentoring appointments with high and critical risk students.</p>
    </div>
  `;
  return sendEmail({ to: mentorEmail, subject: 'Weekly Academic Risk Summary - MentorConnect', html });
};

const sendActivationEmail = async (email, name, role, activationUrl) => {
  const roleName = role === 'student' ? 'Student' : 'Staff/Faculty';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: center;">
      <h2 style="color: #2563eb;">Welcome to MentorConnect, ${name}</h2>
      <p style="font-size: 16px; color: #4b5563;">Your official ${roleName} account has been pre-registered by the institution.</p>
      <p style="font-size: 16px; color: #4b5563;">Please click the button below to activate your account and set up your secure password.</p>
      <a href="${activationUrl}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Activate Account</a>
      <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">If you didn't expect this invitation, please contact your department coordinator.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: 'Action Required: Activate your MentorConnect Account', html });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendSessionNotificationEmail,
  sendWeeklyRiskDigestEmail,
  sendActivationEmail,
};

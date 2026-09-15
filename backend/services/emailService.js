import nodemailer from "nodemailer";

export async function sendSecurityEmail({ to, subject, text, html }) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n========== DEVELOPMENT EMAIL ==========");
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log(text);
      console.log("=======================================\n");
      return { delivered: false, development: true };
    }
    throw new Error("SMTP is not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass },
  });

  await transporter.verify();
  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || user,
    to,
    subject,
    text,
    html,
  });
  console.log("Security email sent:", info.messageId);
  return { delivered: true, messageId: info.messageId };
}

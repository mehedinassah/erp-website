import nodemailer from "nodemailer";

// Email via Gmail SMTP — no custom domain required.
// Set these env vars (Vercel + local .env):
//   SMTP_USER = your-gmail@gmail.com
//   SMTP_PASS = 16-char Gmail App Password (Google Account → Security → App passwords)
// Emails are sent "from" SMTP_USER.

export function emailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  if (!emailConfigured()) throw new Error("Email is not configured (SMTP_USER / SMTP_PASS missing).");
  await getTransporter().sendMail({
    from: `PERICO ERP <${process.env.SMTP_USER}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text ?? opts.html.replace(/<[^>]+>/g, " "),
    html: opts.html,
  });
}

/** Branded password-reset email. */
export function resetEmailHtml(name: string, link: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1c1917">
    <h2 style="margin:0 0 4px;font-size:20px">Reset your PERICO password</h2>
    <p style="color:#78716c;font-size:14px;margin:0 0 20px">Hi ${name || "there"}, we received a request to reset your password.</p>
    <a href="${link}" style="display:inline-block;background:#a16207;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-weight:600;font-size:14px">Reset password</a>
    <p style="color:#78716c;font-size:12px;margin:20px 0 0">This link expires in 1 hour and can be used once. If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#a8a29e;font-size:12px;margin:12px 0 0;word-break:break-all">Or paste this link: ${link}</p>
  </div>`;
}

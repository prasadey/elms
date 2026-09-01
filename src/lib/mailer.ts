import nodemailer from "nodemailer";

/**
 * Sends mail via Google Workspace SMTP (smtp.gmail.com) using an App
 * Password. Requires SMTP_USER, SMTP_PASS, and optionally SMTP_FROM in env.
 * Falls back to logging instead of sending when those aren't configured
 * (e.g. local dev without a mailbox set up).
 */
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer:stub] To: ${to}\nSubject: ${subject}\n${body}\n`);
    return;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
  });
}

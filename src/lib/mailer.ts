/**
 * Email transport stub. No SMTP/transactional-email credentials are
 * configured for this build, so outbound mail is logged instead of sent.
 *
 * To wire in real email (PRD 6.3): install `nodemailer`, read
 * SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS from env, and replace the body of
 * `sendMail` below with an actual transporter.sendMail call. Every call site
 * in the app already goes through this one function.
 */
export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  console.log(`[mailer:stub] To: ${to}\nSubject: ${subject}\n${body}\n`);
}

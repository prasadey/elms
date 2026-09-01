import { getDb } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import type { User } from "@/lib/types";

// Template set transcribed verbatim from PRD 6.2 + Manager Approval Notice.
const TEMPLATES = {
  SUBMITTED_EMPLOYEE:
    "Your {leave_type} request for {from_date} to {to_date} ({days} days) has been submitted. Request ID: {request_id}. It is awaiting approval from {current_approver_name}.",
  SUBMITTED_APPROVER:
    "{employee_name} ({department}) has applied for {leave_type} from {from_date} to {to_date} ({days} days). Reason: {reason}. Please review: {link}",
  STAGE1_APPROVED_EMPLOYEE:
    "{approver_name} has approved your leave request {request_id} for {from_date} to {to_date}. It is now awaiting HR approval from {next_approver_name}.",
  FINAL_APPROVED_EMPLOYEE:
    "{approver_name} has approved your leave. Request {request_id} for {leave_type}, {from_date} to {to_date} ({days} days), is now confirmed. Remaining {leave_type} balance: {balance} days.",
  FINAL_APPROVED_MANAGER:
    "Leave request {request_id} for {employee_name} ({leave_type}, {from_date} to {to_date}) has received final HR approval from {approver_name}.",
  REJECTED_EMPLOYEE:
    "{approver_name} has rejected your leave request {request_id} for {from_date} to {to_date}. Reason given: {comment}.",
  CANCELLED_APPROVER:
    "{employee_name} has cancelled request {request_id}.",
  REMINDER_APPROVER:
    "Request {request_id} from {employee_name} has been pending for {days_pending} days.",
  REVOKED_NOTICE:
    "HR ({hr_name}) has revoked approved leave {request_id}. Reason: {comment}. Your balance has been restored.",
} as const;

export type TemplateKey = keyof typeof TEMPLATES;

function render(key: TemplateKey, vars: Record<string, string | number>): string {
  let text: string = TEMPLATES[key];
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** Writes an in-app notification row and fires the email for the
 * same event, using rendered text on both channels. */
export async function notify(
  recipient: User,
  templateKey: TemplateKey,
  vars: Record<string, string | number>,
  requestId: number | null,
  subject: string
): Promise<void> {
  const db = getDb();
  const text = render(templateKey, vars);

  db.prepare(
    `INSERT INTO notifications (user_id, request_id, template_key, channel, payload) VALUES (?, ?, ?, 'IN_APP', ?)`
  ).run(recipient.id, requestId, templateKey, text);

  db.prepare(
    `INSERT INTO notifications (user_id, request_id, template_key, channel, payload) VALUES (?, ?, ?, 'EMAIL', ?)`
  ).run(recipient.id, requestId, templateKey, text);

  await sendMail(recipient.email, subject, text);
}

export { render as renderTemplate };

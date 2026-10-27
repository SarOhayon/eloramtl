import nodemailer from "nodemailer";
import { INBOX_EMAIL } from "@/data/building";

export type Attachment = { filename: string; content: Buffer; contentType: string };
export type Mail = { subject: string; text: string; html?: string; replyTo?: string; to?: string; fromName?: string; attachments?: Attachment[] };

// Sends a website form to `to` (or MAIL_TO, or INBOX_EMAIL) through the company mailbox (GreenGeeks SMTP).
// Needs SMTP_HOST, SMTP_USER and SMTP_PASS (and optionally SMTP_PORT, MAIL_TO).
// Returns false when the email could not be sent.
export async function sendMail(mail: Mail): Promise<boolean> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info(`[mail] SMTP not configured. Would send to ${mail.to || MAIL_TO || INBOX_EMAIL}: ${mail.subject}\n${mail.text}`);
    // Lets forms be tried locally; a live site without SMTP reports the failure instead.
    return process.env.NODE_ENV !== "production";
  }

  const port = Number(SMTP_PORT || 465);
  try {
    await nodemailer
      .createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
      .sendMail({ from: `"${mail.fromName ?? "Elora website"}" <${SMTP_USER}>`, to: mail.to || MAIL_TO || INBOX_EMAIL, replyTo: mail.replyTo, subject: mail.subject, text: mail.text, html: mail.html, attachments: mail.attachments });
    return true;
  } catch (err) {
    console.error("[mail] Sending failed", err);
    return false;
  }
}

/**
 * Email service
 *
 * Thin wrapper around nodemailer. Configuration is driven by SMTP_* env vars,
 * so the same code works with Mailhog locally and any SMTP provider in prod.
 */

import nodemailer from "nodemailer";
import { createServiceLogger } from "@/lib/services/logging";

const log = createServiceLogger("email");

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const from = process.env.SMTP_FROM ?? "noreply@myfaves.local";

  try {
    const transport = createTransport();
    await transport.sendMail({ from, ...opts });
    log.info(
      { method: "sendEmail", to: opts.to, subject: opts.subject },
      "Email sent"
    );
  } catch (err) {
    log.error(
      { method: "sendEmail", to: opts.to, err },
      "Failed to send email"
    );
    throw err;
  }
}

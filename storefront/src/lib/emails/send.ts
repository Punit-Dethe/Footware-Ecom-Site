import "server-only";

import fs from "node:fs";
import path from "node:path";
import type { ReactElement } from "react";
import { render } from "react-email";
import {
  getStoreEmailFrom,
  getStoreTestRecipient,
  isStoreEmailFromFallback,
} from "@/lib/store";

export interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  from?: string;
  idempotencyKey?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  react,
  from,
  idempotencyKey,
}: SendEmailOptions): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return await sendEmailDev({ to, subject, react, from, idempotencyKey });
  }

  return await sendEmailResend({ to, subject, react, from, idempotencyKey });
}

/**
 * Dev mode without API key: render email to HTML, log summary to console,
 * and write the HTML file to .next/emails/ for browser preview.
 */
async function sendEmailDev({
  to,
  subject,
  react,
}: SendEmailOptions): Promise<SendEmailResult> {
  const html = await render(react);

  const dir = path.join(process.cwd(), ".next", "emails");
  fs.mkdirSync(dir, { recursive: true });

  const slug = subject.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  const timestamp = Date.now();
  const filename = `${slug}-${timestamp}.html`;
  const filepath = path.join(dir, filename);

  fs.writeFileSync(filepath, html);

  console.log("\n╭──────────────────────────────────────────────");
  console.log("│ 📧 Email Preview (local dev — not sent)");
  console.log("├──────────────────────────────────────────────");
  console.log(`│ To:      ${to}`);
  console.log(`│ Subject: ${subject}`);
  console.log(`│ Preview: file://${filepath}`);
  console.log("╰──────────────────────────────────────────────\n");

  return { success: true, id: `dev-${timestamp}` };
}

/**
 * Production / live send via Resend API.
 * Supports recipient redirection in test mode and deterministic idempotency.
 */
async function sendEmailResend({
  to,
  subject,
  react,
  from,
  idempotencyKey,
}: SendEmailOptions): Promise<SendEmailResult> {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromAddress = from || getStoreEmailFrom();

  if (!from && isStoreEmailFromFallback()) {
    console.warn(
      "[email] EMAIL_FROM is not set — using fallback which may be rejected by Resend",
    );
  }

  const testRecipient = getStoreTestRecipient();

  // If using the onboarding domain, Resend strictly allows sends only to the account owner
  if (fromAddress.includes("onboarding@resend.dev") && !testRecipient) {
    const errorMsg =
      "EMAIL_TEST_RECIPIENT is required when sending from onboarding@resend.dev";
    console.warn(`[email] ${errorMsg}. Outgoing email not sent.`);
    return { success: false, error: errorMsg };
  }

  const targetRecipient = testRecipient || to;
  if (testRecipient && testRecipient !== to) {
    console.log(
      `[email] Test recipient redirection: '${to}' -> '${testRecipient}'`,
    );
  }

  try {
    const { data, error } = await resend.emails.send(
      {
        from: fromAddress,
        to: targetRecipient,
        subject,
        react,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );

    if (error) {
      console.error("[email] Failed to send via Resend:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] Resend exception:", message);
    return { success: false, error: message };
  }
}

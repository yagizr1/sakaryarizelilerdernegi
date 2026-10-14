import nodemailer from "nodemailer";
import { env } from "../config/env";

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendMailResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function resolveFrom() {
  if (env.MAIL_FROM) return env.MAIL_FROM;
  const user = env.SMTP_USER || "noreply@localhost";
  const name = env.MAIL_FROM_NAME || "Dernek Yönetim";
  return `"${name}" <${user}>`;
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const to = input.to.trim();
  if (!to) return { ok: false, error: "Alıcı e-posta gerekli" };

  if (!env.MAIL_ENABLED || !isSmtpConfigured()) {
    console.log(`[mail mock] To: ${to}\nSubject: ${input.subject}\n${input.text}`);
    return { ok: true, messageId: `mock-${Date.now()}` };
  }

  try {
    const port = env.SMTP_PORT;
    const transport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: env.SMTP_SECURE ?? port === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
    const info = await transport.sendMail({
      from: resolveFrom(),
      to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${input.text.replace(/\n/g, "<br/>")}</p>`,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Mail gönderilemedi" };
  }
}

export function getMailStatus() {
  return {
    enabled: env.MAIL_ENABLED,
    configured: isSmtpConfigured(),
    from: env.MAIL_FROM || env.SMTP_USER || null,
    mock: !env.MAIL_ENABLED || !isSmtpConfigured(),
  };
}

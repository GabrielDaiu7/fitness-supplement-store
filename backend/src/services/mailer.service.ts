import nodemailer from 'nodemailer';

function smtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransport() {
  if (smtpConfigured()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE ?? 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
}

export async function sendEmail(input: { to: string; subject: string; text: string; html?: string }) {
  const transport = createTransport();
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'no-reply@fusion.store',
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export function isRealEmailEnabled() {
  return smtpConfigured();
}


// @ts-nocheck
// Simple email helper for Supabase Edge Functions using HTTP providers

type EmailResult = { ok: boolean; provider?: string; id?: string; error?: unknown };

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || Deno.env.get('SENDGRID_FROM') || 'AutoSaaz <noreply@example.com>';

function verificationHtml(name: string, code: string) {
  const safeName = name || 'there';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;padding:20px;color:#111">
    <h2 style="margin-bottom:8px">Verify your AutoSaaz account</h2>
    <p style="margin-top:0;color:#555">Hi ${safeName}, use the code below to verify your email. This code expires in 10 minutes.</p>
    <div style="margin:16px 0;padding:16px;border:1px dashed #e5e7eb;border-radius:8px;text-align:center">
      <div style="font-size:32px;letter-spacing:6px;font-weight:700">${code}</div>
    </div>
    <p style="color:#6b7280;font-size:12px">If you didn't request this, you can ignore this email.</p>
  </div>`;
}

async function sendWithSendGrid(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!SENDGRID_API_KEY) return { ok: false };
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: EMAIL_FROM.replace(/.*<([^>]+)>.*/, '$1'), name: EMAIL_FROM.replace(/\s*<[^>]+>.*/, '') },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, provider: 'sendgrid', error: text };
  }
  const id = res.headers.get('x-message-id') || undefined;
  return { ok: true, provider: 'sendgrid', id };
}

async function sendWithResend(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!RESEND_API_KEY) return { ok: false };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, provider: 'resend', error: json };
  return { ok: true, provider: 'resend', id: json?.id };
}

export async function sendVerificationEmail(to: string, code: string, name?: string): Promise<EmailResult> {
  const subject = 'Your AutoSaaz verification code';
  const html = verificationHtml(name || '', code);
  // Try SendGrid first, then Resend
  const sg = await sendWithSendGrid(to, subject, html);
  if (sg.ok) return sg;
  const rs = await sendWithResend(to, subject, html);
  return rs;
}

// src/app/api/contact/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;

const CONTACT_COOLDOWN_COOKIE = 'contact-cooldown';
const CONTACT_COOLDOWN_MINUTES = Number(process.env.CONTACT_COOLDOWN_MINUTES ?? 2);

// ---------- utils ----------
function envTrue(name: string) {
  return (process.env[name] ?? '').toLowerCase() === 'true';
}

// ---------- schema ----------
const BodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  budget: z.string().optional(),
  locale: z.string().min(2).optional(),
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional(),
});
type Body = z.infer<typeof BodySchema>;

// ---------- turnstile ----------
async function verifyTurnstile(token: string, ip?: string | null) {
  // Dev bypass: เปิดเฉพาะนอก production เมื่อ CONTACT_BYPASS_VERIFICATION=true
  const BYPASS =
    process.env.NODE_ENV !== 'production' && envTrue('CONTACT_BYPASS_VERIFICATION');
  if (BYPASS) return true;

  // อนุญาต test key ของ Turnstile ใน non-production (ค่าเริ่มต้น 1x... คือ test)
  if (process.env.NODE_ENV !== 'production' && TURNSTILE_SECRET_KEY?.startsWith('1x')) {
    return true;
  }

  if (!TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  const payload = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) payload.append('remoteip', ip);

  try {
    const response = await fetch(TURNSTILE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: payload,
    });
    if (!response.ok) return false;

    const result = (await response.json()) as { success?: boolean };
    return Boolean(result.success);
  } catch (error) {
    console.error('Failed to verify Turnstile', error);
    return false;
  }
}

// ---------- cooldown ----------
function cooldownOk(now = Date.now()) {
  const cookieStore = cookies();
  const raw = cookieStore.get(CONTACT_COOLDOWN_COOKIE)?.value;

  if (!raw) return { ok: true, cookieStore };

  const last = Number(raw);
  if (Number.isNaN(last)) return { ok: true, cookieStore };

  const elapsed = now - last;
  if (elapsed < CONTACT_COOLDOWN_MINUTES * 60 * 1000) {
    return { ok: false, cookieStore };
  }
  return { ok: true, cookieStore };
}

// ---------- email ----------
async function sendEmail({ name, email, phone, message, budget }: Body) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  // อนุญาตตั้งค่า secure ผ่าน ENV (ถ้าไม่ตั้ง จะเดาจากพอร์ต: 465=true อื่นๆ=false)
  const secure =
    typeof process.env.SMTP_SECURE === 'string' ? envTrue('SMTP_SECURE') : port === 465;

  const fromAddress =
    process.env.SMTP_FROM ||
    (user ? `ZomZom Property <${user}>` : 'ZomZom Property <noreply@zomzomproperty.com>');

  const recipient =
    process.env.CONTACT_RECIPIENT_EMAIL ||
    process.env.SMTP_TO ||
    'zomzomproperty@gmail.com';

  const sanitizedMessage = message.replace(/<[^>]*>/g, '').slice(0, 2000);

  if (!host || !user || !pass) {
    console.error('SMTP configuration is incomplete');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}
Email: ${email}
Phone: ${phone ?? '-'}
Budget: ${budget ?? '-'}
Message: ${sanitizedMessage}`,
      replyTo: email,
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact email', error);
    return false;
  }
}

// ---------- route ----------
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please review the form and try again.' },
      { status: 400 },
    );
  }

  const body = parsed.data;

  // honeypot
  if (body.honeypot) {
    return NextResponse.json({
      message: 'We received your message! Our team will reply shortly.',
    });
  }

  // cooldown
  const { ok, cookieStore } = cooldownOk();
  if (!ok) {
    return NextResponse.json(
      {
        message:
          'Thanks! You just contacted us. Give us a moment before submitting another message.',
      },
      { status: 429 },
    );
  }

  // turnstile
  const forwardedFor = request.headers.get('x-forwarded-for');
  const turnstileOk = await verifyTurnstile(body.turnstileToken, forwardedFor);
  if (!turnstileOk) {
    return NextResponse.json(
      { message: 'The verification failed. Please refresh and try again.' },
      { status: 400 },
    );
  }

  // email
  const delivered = await sendEmail(body);
  if (!delivered) {
    return NextResponse.json(
      {
        message:
          'We couldn’t send your message right now. Please email us directly at hello@zomzomproperty.com.',
      },
      { status: 500 },
    );
  }

  // ตั้งคู๊กกี้ cooldown
  cookieStore.set(CONTACT_COOLDOWN_COOKIE, Date.now().toString(), {
    maxAge: CONTACT_COOLDOWN_MINUTES * 60, // วินาที
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // ให้ dev ใช้ http ได้
    path: '/',
  });

  return NextResponse.json({
    message: 'We received your message! Our team will reply shortly.',
  });
}

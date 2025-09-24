import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
import nodemailer from 'nodemailer';
import {z} from 'zod';

const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;

const CONTACT_COOLDOWN_COOKIE = 'contact-cooldown';
const CONTACT_COOLDOWN_MINUTES = 2;

const BodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  budget: z.string().optional(),
  locale: z.string().min(2).optional(),
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional()
});

type Body = z.infer<typeof BodySchema>;

async function verifyTurnstile(token: string, ip?: string | null) {
  // Dev/test bypass: Cloudflare test keys start with "1x"
  if (process.env.NODE_ENV !== 'production' && TURNSTILE_SECRET_KEY?.startsWith('1x')) {
    return true;
  }
  if (!TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  const payload = new URLSearchParams({secret: TURNSTILE_SECRET_KEY, response: token});
  if (ip) payload.append('remoteip', ip);

  try {
    const response = await fetch(TURNSTILE_ENDPOINT, {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body: payload
    });
    if (!response.ok) return false;
    const result = await response.json();
    return Boolean(result.success);
  } catch (err) {
    console.error('Failed to verify Turnstile', err);
    return false;
  }
}

function cooldownOk(now = Date.now()) {
  const cookieStore = cookies();
  const cookieValue = cookieStore.get(CONTACT_COOLDOWN_COOKIE)?.value;

  if (!cookieValue) return {ok: true};
  const lastAttempt = Number(cookieValue);
  if (Number.isNaN(lastAttempt)) return {ok: true};

  const elapsed = now - lastAttempt;
  if (elapsed < CONTACT_COOLDOWN_MINUTES * 60 * 1000) return {ok: false};
  return {ok: true};
}

async function sendEmail({name, email, phone, message, budget}: Body) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const fromAddress =
    process.env.SMTP_FROM || (user ? `ZomZom Property <${user}>` : 'ZomZom Property <noreply@zomzomproperty.com>');
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL || process.env.SMTP_TO || 'zomzomproperty@gmail.com';

  const sanitizedMessage = message.replace(/<[^>]*>/g, '').slice(0, 2000);

  // Developer-friendly bypass: ไม่มี SMTP ครบใน non-prod → log แล้วถือว่าส่งสำเร็จ
  const smtpConfigured = Boolean(host && user && pass);
  if (process.env.NODE_ENV !== 'production' && !smtpConfigured) {
    console.log('[DEV EMAIL BYPASS] Simulating email delivery:\n', {
      from: fromAddress,
      to: recipient,
      subject: `New inquiry from ${name}`,
      body: {
        name,
        email,
        phone: phone ?? '-',
        budget: budget ?? '-',
        message: sanitizedMessage
      }
    });
    return true;
  }

  if (!smtpConfigured) {
    console.error('SMTP configuration is incomplete');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 || String(process.env.SMTP_SECURE).toLowerCase() === 'true',
    auth: {user, pass}
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone ?? '-'}\nBudget: ${budget ?? '-'}\nMessage: ${sanitizedMessage}`,
      replyTo: email
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact email', error);
    return false;
  }
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({message: 'Please review the form and try again.'}, {status: 400});
  }

  const body = parsed.data;

  // Honeypot → รับไว้เงียบ ๆ ตอบสำเร็จ
  if (body.honeypot) {
    return NextResponse.json({message: 'We received your message! Our team will reply shortly.'});
  }

  const {ok} = cooldownOk();
  if (!ok) {
    return NextResponse.json(
      {message: 'Thanks! You just contacted us. Give us a moment before submitting another message.'},
      {status: 429}
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const turnstileOk = await verifyTurnstile(body.turnstileToken, forwardedFor);
  if (!turnstileOk) {
    return NextResponse.json(
      {message: 'The verification failed. Please refresh and try again.'},
      {status: 400}
    );
  }

  const delivered = await sendEmail(body);
  if (!delivered) {
    return NextResponse.json(
      {message: 'We couldn’t send your message right now. Please email us directly at hello@zomzomproperty.com.'},
      {status: 500}
    );
  }

  const res = NextResponse.json({message: 'We received your message! Our team will reply shortly.'});
  res.cookies.set(CONTACT_COOLDOWN_COOKIE, Date.now().toString(), {
    // ระวัง: เวลา cookie ใช้ millisecond → แปลงเป็น Date
    expires: new Date(Date.now() + CONTACT_COOLDOWN_MINUTES * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/'
  });
  return res;
}

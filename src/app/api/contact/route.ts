import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { ContactApiSchema, type ContactApiBody } from '@/lib/schemas/contact';
import { formatApproxTHB, tryToTHB } from '@/lib/forex';

const TURNSTILE_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_SECRET_KEY =
  process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;

const CONTACT_COOLDOWN_COOKIE = 'contact-cooldown';
const CONTACT_COOLDOWN_MINUTES = Number.parseFloat(
  process.env.CONTACT_COOLDOWN_MINUTES ?? '',
);
const COOLDOWN_MINUTES = Number.isFinite(CONTACT_COOLDOWN_MINUTES)
  ? Math.max(0, CONTACT_COOLDOWN_MINUTES)
  : 2;
const COOLDOWN_MS = COOLDOWN_MINUTES * 60 * 1000;
const COOLDOWN_MAX_AGE = Math.max(1, Math.round(COOLDOWN_MINUTES * 60));

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB per request

const rateBucket = new Map<string, { hits: number; expires: number }>();
const isEdgeRuntime =
  typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime !== 'undefined';

let phoneModule: Promise<typeof import('libphonenumber-js') | null> | null = null;
async function getPhoneParser() {
  if (!phoneModule) {
    phoneModule = import('libphonenumber-js')
      .then((mod) => mod)
      .catch((error) => {
        console.warn('[contact] libphonenumber-js unavailable, falling back', error);
        return null;
      });
  }
  return phoneModule;
}

async function composePhoneE164(
  parts:
    | {
        country?: string | null;
        dialCode?: string | null;
        national?: string | null;
      }
    | undefined,
  rawE164?: string | null,
) {
  if (rawE164 && /^\+\d{7,15}$/.test(rawE164)) {
    return rawE164;
  }
  if (!parts) return undefined;
  const national = parts.national?.replace(/[^\d]/g, '') ?? '';
  const country = parts.country?.toUpperCase();
  if (!national || !country) {
    return undefined;
  }
  const parser = await getPhoneParser();
  if (parser?.parsePhoneNumberFromString) {
    try {
      const parsed = parser.parsePhoneNumberFromString(national, country as never);
      if (parsed?.isValid()) {
        return parsed.number;
      }
    } catch (error) {
      console.warn('[contact] Phone parsing failed', error);
    }
  }
  const dial = parts.dialCode?.startsWith('+')
    ? parts.dialCode
    : `+${parts.dialCode ?? ''}`;
  const raw = `${dial ?? ''}${national}`.replace(/[^\d+]/g, '');
  if (/^\+\d{7,15}$/.test(raw)) {
    return raw;
  }
  return undefined;
}

async function verifyTurnstile(token: string, ip?: string | null) {
  if (process.env.NODE_ENV !== 'production' && TURNSTILE_SECRET_KEY?.startsWith('1x')) {
    return true;
  }
  if (!TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return false;
  }

  const payload = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
  if (ip) payload.append('remoteip', ip);

  try {
    const response = await fetch(TURNSTILE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: payload,
    });
    if (!response.ok) return false;
    const result = await response.json();
    return Boolean(result.success);
  } catch (err) {
    console.error('Failed to verify Turnstile', err);
    return false;
  }
}

function checkCooldown(now = Date.now()) {
  const cookieStore = cookies();
  const cookieValue = cookieStore.get(CONTACT_COOLDOWN_COOKIE)?.value;

  if (!cookieValue) return { ok: true };
  const lastAttempt = Number(cookieValue);
  if (Number.isNaN(lastAttempt)) return { ok: true };

  const elapsed = now - lastAttempt;
  if (elapsed < COOLDOWN_MS) return { ok: false };
  return { ok: true };
}

function checkIpRateLimit(ip: string | null | undefined) {
  if (isEdgeRuntime || !ip) return true;
  const now = Date.now();
  const bucket = rateBucket.get(ip) ?? { hits: 0, expires: now + 60_000 };
  if (bucket.expires < now) {
    bucket.hits = 0;
    bucket.expires = now + 60_000;
  }
  bucket.hits += 1;
  rateBucket.set(ip, bucket);
  return bucket.hits <= 5;
}

async function sendEmail(
  body: ContactApiBody,
  attachments: Array<{ filename: string; content: Buffer; contentType?: string }>,
) {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
  const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 465);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
  const fromAddress =
    process.env.SMTP_FROM ||
    (user ? `ZomZom Property <${user}>` : 'ZomZom Property <noreply@zomzomproperty.com>');
  const recipient =
    process.env.CONTACT_RECIPIENT_EMAIL ||
    process.env.SMTP_TO ||
    'zomzomproperty@gmail.com';

  const sanitizedMessage = body.message.replace(/<[^>]*>/g, '').slice(0, 2000);
  const budgetText = body.budget
    ? `${body.budget.currency} ${body.budget.amount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : '-';
  const thbApproxNumber = body.budget
    ? tryToTHB(body.budget.currency, body.budget.amount)
    : null;
  const thbApprox =
    thbApproxNumber !== null ? formatApproxTHB(thbApproxNumber, body.locale) : null;

  const smtpConfigured = Boolean(host && user && pass);
  if (process.env.NODE_ENV !== 'production' && !smtpConfigured) {
    console.log('[DEV EMAIL BYPASS] Simulating email delivery:\n', {
      from: fromAddress,
      to: recipient,
      subject: `New inquiry from ${body.name}`,
      body: {
        name: body.name,
        email: body.email,
        phone: body.phoneE164 ?? '-',
        budget: budgetText,
        budgetApproxThb: thbApprox ?? '-',
        message: sanitizedMessage,
        attachments: attachments.map((file) => file.filename),
      },
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
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: `New inquiry from ${body.name}`,
      text: `Name: ${body.name}\nEmail: ${body.email}\nPhone: ${body.phoneE164 ?? '-'}\nBudget: ${budgetText}${
        thbApprox ? ` (${thbApprox})` : ''
      }\nMessage: ${sanitizedMessage}`,
      replyTo: body.email,
      attachments: attachments.length ? attachments : undefined,
    });
    return true;
  } catch (error) {
    console.error('Failed to send contact email', error);
    return false;
  }
}

async function parseMultipart(request: Request) {
  const formData = await request.formData();
  const text: Record<string, string> = {};
  const files: File[] = [];

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      text[key] = value;
    } else if (value instanceof File) {
      files.push(value);
    }
  }

  const phoneParts = {
    country: text['phone.country'],
    dialCode: text['phone.dialCode'],
    national: text['phone.national'],
  };
  const phoneE164 = await composePhoneE164(phoneParts, text.phoneE164);

  const budgetCurrency = text['budget.currency']?.toUpperCase();
  const budgetAmount = text['budget.amount'] ? Number(text['budget.amount']) : undefined;

  const candidate: ContactApiBody = {
    name: text.name ?? '',
    email: text.email ?? '',
    phoneE164: phoneE164,
    budget:
      budgetCurrency && typeof budgetAmount === 'number' && Number.isFinite(budgetAmount)
        ? { currency: budgetCurrency, amount: budgetAmount }
        : undefined,
    message: text.message ?? '',
    locale: text.locale ?? undefined,
    turnstileToken: text.turnstileToken ?? '',
    honeypot: text.honeypot ?? text.website ?? undefined,
  };

  return { candidate, files };
}

async function parseJson(request: Request) {
  const json = await request.json().catch(() => null);
  if (!json) {
    return { error: NextResponse.json({ error: 'invalid' }, { status: 400 }) };
  }
  const parsed = ContactApiSchema.safeParse(json);
  if (!parsed.success) {
    return { error: NextResponse.json({ error: 'invalid' }, { status: 400 }) };
  }
  return { body: parsed.data };
}

function sanitizeFilename(name: string) {
  const trimmed = name?.trim() || 'attachment';
  const clean = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
  return clean.slice(0, 100) || 'attachment';
}

async function collectAttachments(files: File[]) {
  let total = 0;
  const attachments: Array<{ filename: string; content: Buffer; contentType?: string }> =
    [];

  for (const file of files) {
    const size = Number(file.size ?? 0);
    if (size > MAX_FILE_SIZE) {
      return {
        error: NextResponse.json(
          { error: 'file_too_large', message: 'Each attachment must be 5MB or smaller.' },
          { status: 400 },
        ),
      };
    }
    if (total + size > MAX_TOTAL_SIZE) {
      return {
        error: NextResponse.json(
          {
            error: 'attachments_too_large',
            message: 'Attachments exceed the 10MB total limit.',
          },
          { status: 400 },
        ),
      };
    }
    total += size;
    const buffer = Buffer.from(await file.arrayBuffer());
    attachments.push({
      filename: sanitizeFilename(file.name),
      content: buffer,
      contentType: file.type || undefined,
    });
  }

  return { attachments };
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';
  let body: ContactApiBody | null = null;
  let files: File[] = [];

  if (contentType.includes('multipart/form-data')) {
    const parsed = await parseMultipart(request);
    files = parsed.files;
    const validated = ContactApiSchema.safeParse(parsed.candidate);
    if (!validated.success) {
      return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
    body = validated.data;
  } else if (contentType.includes('application/json')) {
    const { body: parsedBody, error } = await parseJson(request);
    if (error) return error;
    body = parsedBody ?? null;
  } else {
    const { body: parsedBody, error } = await parseJson(request);
    if (error) return error;
    body = parsedBody ?? null;
  }

  if (!body) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  if (body.honeypot) {
    return NextResponse.json({
      message: 'We received your message! Our team will reply shortly.',
    });
  }

  const cooldown = checkCooldown();
  if (!cooldown.ok) {
    return NextResponse.json({ error: 'cooldown' }, { status: 429 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  if (!checkIpRateLimit(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const turnstileOk = await verifyTurnstile(body.turnstileToken, forwardedFor);
  if (!turnstileOk) {
    return NextResponse.json({ error: 'turnstile_failed' }, { status: 400 });
  }

  const { attachments = [], error: attachmentError } = await collectAttachments(files);
  if (attachmentError) return attachmentError;

  const delivered = await sendEmail(body, attachments);
  if (!delivered) {
    return NextResponse.json(
      {
        error: 'email_failed',
        message:
          'We couldn’t send your message right now. Please email us directly at hello@zomzomproperty.com.',
      },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    message: 'We received your message! Our team will reply shortly.',
  });
  res.cookies.set(CONTACT_COOLDOWN_COOKIE, Date.now().toString(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: COOLDOWN_MAX_AGE,
  });
  return res;
}

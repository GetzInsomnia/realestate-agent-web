import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactFormSchema } from "@/lib/data/schemas";
import { createAppTranslator, fallbackLocale } from "@/lib/i18n";
import { getCookieExpiry } from "@/lib/utils";

const TURNSTILE_ENDPOINT = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY ?? "";
const COOLDOWN_MINUTES = 2;

async function verifyTurnstile(token: string, ip?: string | null) {
  if (!TURNSTILE_SECRET_KEY) {
    return false;
  }
  const payload = new URLSearchParams({
    secret: TURNSTILE_SECRET_KEY,
    response: token,
  });
  if (ip) {
    payload.append("remoteip", ip);
  }
  const response = await fetch(TURNSTILE_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: payload,
  });
  const result = await response.json();
  return Boolean(result.success);
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error("SMTP credentials are not configured");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function POST(request: Request) {
  const raw = await request.json().catch(() => null);
  const parsed = contactFormSchema.safeParse(raw);
  const locale = parsed.success ? parsed.data.locale : fallbackLocale;
  const translator = await createAppTranslator(locale);

  if (!parsed.success) {
    return NextResponse.json(
      { message: translator("contact.api.invalid") },
      { status: 400 },
    );
  }

  const { name, email, phone, message, budget, honeypot, turnstileToken } = parsed.data;

  if (honeypot) {
    return NextResponse.json({ message: translator("contact.api.success") });
  }

  const cookieStore = cookies();
  const existing = cookieStore.get("contact-cooldown");
  if (existing) {
    const last = Number(existing.value);
    if (!Number.isNaN(last) && Date.now() - last < COOLDOWN_MINUTES * 60 * 1000) {
      return NextResponse.json(
        { message: translator("contact.api.cooldown") },
        { status: 429 },
      );
    }
  }

  if (!turnstileToken) {
    return NextResponse.json(
      { message: translator("contact.api.turnstileMissing") },
      { status: 400 },
    );
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const isValid = await verifyTurnstile(turnstileToken, forwarded);
  if (!isValid) {
    return NextResponse.json(
      { message: translator("contact.api.turnstileFailed") },
      { status: 400 },
    );
  }

  try {
    const transporter = createTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? "ZomZom Property <noreply@zomzomproperty.com>",
      to: "zomzomproperty@gmail.com",
      subject: `New inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone ?? "-"}\nBudget: ${budget ?? "-"}\nMessage: ${message}`,
      replyTo: email,
    });
  } catch (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json(
      { message: translator("contact.api.emailFailed") },
      { status: 500 },
    );
  }

  cookieStore.set("contact-cooldown", Date.now().toString(), {
    expires: getCookieExpiry(COOLDOWN_MINUTES),
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
  });

  return NextResponse.json({ message: translator("contact.api.success") });
}

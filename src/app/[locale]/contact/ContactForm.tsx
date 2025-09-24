'use client';

import { useState, useTransition } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

export type ContactCopy = {
  intro: string;
  fields: {
    name: string;
    email: string;
    phone: string;
    budget: string;
    message: string;
  };
  submit: string;
  sending: string;
  success: string;
  error: string;
  cooldown: string;
  honeypot: string;
};

export default function ContactForm({
  locale,
  copy,
  turnstileSiteKey,
}: {
  locale: string;
  copy: ContactCopy;
  turnstileSiteKey: string;
}) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setStatus('idle');
    setMessage('');

    const payload = {
      name: formData.get('name')?.toString() ?? '',
      email: formData.get('email')?.toString() ?? '',
      phone: formData.get('phone')?.toString() ?? '',
      budget: formData.get('budget')?.toString() ?? '',
      message: formData.get('message')?.toString() ?? '',
      locale,
      turnstileToken: token,
      honeypot: formData.get('website')?.toString() ?? '',
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatus('error');
        setMessage(result.message ?? copy.error);
        return;
      }
      setStatus('success');
      setMessage(result.message ?? copy.success);
    } catch {
      setStatus('error');
      setMessage(copy.error);
    }
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await handleSubmit(formData);
        })
      }
      className="space-y-4"
    >
      <p className="text-sm text-slate-600">{copy.intro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          {copy.fields.name}
          <input
            name="name"
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder={copy.fields.name}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {copy.fields.email}
          <input
            type="email"
            name="email"
            required
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="name@example.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {copy.fields.phone}
          <input
            name="phone"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="+66"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {copy.fields.budget}
          <input
            name="budget"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="USD 1,000,000"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        {copy.fields.message}
        <textarea
          name="message"
          required
          rows={4}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      </label>
      <label className="sr-only">
        {copy.honeypot}
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      </label>
      <div className="flex flex-col gap-3">
        <Turnstile
          siteKey={turnstileSiteKey}
          options={{ theme: 'light' }}
          onSuccess={(value) => setToken(value ?? '')}
          onExpire={() => setToken('')}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          disabled={isPending}
        >
          {isPending ? copy.sending : copy.submit}
        </button>
      </div>
      {status !== 'idle' && (
        <p
          className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}

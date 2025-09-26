'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { Controller } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  defaultCurrencyForCountry,
  getDefaultCountryForLocale,
  type Country,
} from '@/lib/countries';
import { SUPPORTED_CURRENCIES, tryToTHB, type CurrencyCode } from '@/lib/forex';
import {
  ContactFormSchema,
  type ContactApiBody,
  type ContactFormInput,
} from '@/lib/schemas/contact';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

const PaperclipIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path
      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L10 16a2 2 0 11-2.83-2.83l7.07-7.07"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

async function composeClientPhone(phone: NonNullable<ContactFormInput['phone']>) {
  const national = phone.national?.replace(/[^\d]/g, '') ?? '';
  if (!national) return undefined;
  try {
    const lib = await import('libphonenumber-js');
    const parsed = lib.parsePhoneNumberFromString(national, phone.country as never);
    if (parsed?.isValid()) {
      return parsed.number;
    }
  } catch (error) {
    console.warn('[contact] libphonenumber-js unavailable on client', error);
  }
  const fallback = `${phone.dialCode ?? ''}${national}`.replace(/[^\d+]/g, '');
  return /^\+\d{7,15}$/.test(fallback) ? fallback : undefined;
}

function parseBudgetInput(
  value: string,
  decimalSymbol: string,
  groupSymbols: string[],
): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  let normalized = trimmed;
  for (const group of groupSymbols) {
    if (group) {
      normalized = normalized.split(group).join('');
    }
  }
  if (decimalSymbol && decimalSymbol !== '.') {
    const regex = new RegExp(`\\${decimalSymbol}`, 'g');
    normalized = normalized.replace(regex, '.');
  }
  normalized = normalized.replace(/[^0-9.]/g, '');
  const segments = normalized.split('.');
  if (segments.length > 2) return null;
  if (segments[1]?.length > 10) {
    segments[1] = segments[1].slice(0, 10);
    normalized = segments.join('.');
  }
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) return null;
  return amount;
}

export default function ContactForm({
  locale,
  copy,
  turnstileSiteKey,
}: {
  locale: string;
  copy: ContactCopy;
  turnstileSiteKey: string;
}) {
  const t = useTranslations('contact');
  const sortedCountries = useMemo(
    () => [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    [],
  );
  const defaultCountry = React.useMemo(
    () => getDefaultCountryForLocale(locale),
    [locale],
  );
  const defaultCurrency = React.useMemo(
    () => defaultCurrencyForCountry(defaultCountry.code),
    [defaultCountry],
  );
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [turnstileNonce, setTurnstileNonce] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<CurrencyCode>(defaultCurrency);
  const [budgetAmount, setBudgetAmount] = useState<number | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryTriggerRef = useRef<HTMLButtonElement>(null);
  const countryOptionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryActiveIndex, setCountryActiveIndex] = useState(() => {
    const index = sortedCountries.findIndex((c) => c.code === defaultCountry.code);
    return index >= 0 ? index : 0;
  });
  const countryActiveIndexRef = useRef(countryActiveIndex);

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale ?? 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );
  const decimalSymbol = useMemo(() => {
    const parts = numberFormatter.formatToParts(1.1);
    return parts.find((part) => part.type === 'decimal')?.value ?? '.';
  }, [numberFormatter]);
  const groupSymbols = useMemo(() => {
    const parts = numberFormatter.formatToParts(1000);
    return parts.filter((part) => part.type === 'group').map((part) => part.value);
  }, [numberFormatter]);

  useEffect(() => {
    const index = sortedCountries.findIndex((c) => c.code === defaultCountry.code);
    if (index >= 0) {
      setCountryActiveIndex(index);
    }
  }, [defaultCountry, sortedCountries]);

  const {
    control,
    handleSubmit,
    register,
    reset,
    setError,
    clearErrors,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: {
        country: defaultCountry.code,
        dialCode: defaultCountry.dialCode,
        national: '',
      },
      budget: undefined,
      message: '',
      locale,
      turnstileToken: '',
      honeypot: '',
    },
  });

  useEffect(() => {
    register('turnstileToken');
    register('locale');
  }, [register]);

  useEffect(() => {
    setValue('locale', locale);
  }, [locale, setValue]);

  useEffect(() => {
    setValue('turnstileToken', token, { shouldValidate: true });
  }, [token, setValue]);

  useEffect(() => {
    const currentCurrency = getValues('budget.currency') as CurrencyCode | undefined;
    if (!currentCurrency) {
      setBudgetCurrency(defaultCurrency);
      setValue('budget.currency', defaultCurrency);
    } else {
      setBudgetCurrency(currentCurrency);
    }
  }, [defaultCurrency, getValues, setValue]);

  useEffect(() => {
    const currentCountry = getValues('phone.country');
    if (!currentCountry) {
      setValue('phone.country', defaultCountry.code);
      setValue('phone.dialCode', defaultCountry.dialCode);
    }
  }, [defaultCountry, getValues, setValue]);

  const focusOption = useCallback(
    (index: number, { scroll }: { scroll?: boolean } = {}) => {
      const node = countryOptionRefs.current[index];
      if (!node) return;
      if (scroll) {
        node.focus();
        node.scrollIntoView({ block: 'nearest' });
      } else {
        node.focus({ preventScroll: true });
      }
    },
    [],
  );

  useEffect(() => {
    countryActiveIndexRef.current = countryActiveIndex;
  }, [countryActiveIndex]);

  useEffect(() => {
    function onDocPointerDown(event: PointerEvent) {
      if (!countryDropdownOpen) return;
      const container = countryDropdownRef.current;
      if (container && !container.contains(event.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }

    document.addEventListener('pointerdown', onDocPointerDown, true);
    return () => document.removeEventListener('pointerdown', onDocPointerDown, true);
  }, [countryDropdownOpen]);

  useEffect(() => {
    if (!countryDropdownOpen) return;
    const frame = requestAnimationFrame(() =>
      focusOption(countryActiveIndexRef.current, { scroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [countryDropdownOpen, focusOption]);

  const namePlaceholder = t('placeholders.name');
  const phonePlaceholder = t('placeholders.phone');
  const budgetPlaceholder = t('placeholders.budget');

  const approxThbNumber =
    budgetAmount !== null ? tryToTHB(budgetCurrency, budgetAmount) : null;
  const approxThbDisplay =
    approxThbNumber !== null
      ? t('hints.budgetThb', {
          amount: numberFormatter.format(approxThbNumber),
        })
      : null;

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected);
    const nextFiles = [...files];
    let totalSize = nextFiles.reduce((sum, file) => sum + file.size, 0);
    let error: string | null = null;

    for (const file of incoming) {
      if (file.size > MAX_FILE_SIZE) {
        error = 'Each file must be 5MB or smaller.';
        continue;
      }
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        error = 'Attachments exceed the 10MB total limit.';
        continue;
      }
      const exists = nextFiles.some(
        (existing) => existing.name === file.name && existing.size === file.size,
      );
      if (!exists) {
        nextFiles.push(file);
        totalSize += file.size;
      }
    }

    setFiles(nextFiles);
    setFileError(error);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function submitForm(values: ContactFormInput) {
    setStatus('idle');
    setFeedback('');
    setFileError(null);

    const nationalDigits = values.phone?.national?.replace(/[^\d]/g, '') ?? '';
    let phoneE164: string | undefined;
    if (values.phone && nationalDigits) {
      const composed = await composeClientPhone({
        country: values.phone.country,
        dialCode: values.phone.dialCode,
        national: nationalDigits,
      });
      if (!composed) {
        setError('phone', {
          type: 'manual',
          message: 'Please enter a valid phone number.',
        });
        return;
      }
      clearErrors('phone');
      phoneE164 = composed;
    }

    const budgetPayload: ContactApiBody['budget'] =
      values.budget && Number.isFinite(values.budget.amount)
        ? { currency: values.budget.currency, amount: values.budget.amount }
        : undefined;

    const turnstileValue = values.turnstileToken || token;

    const basePayload: ContactApiBody = {
      name: values.name,
      email: values.email,
      message: values.message,
      locale: values.locale ?? locale,
      turnstileToken: turnstileValue,
      honeypot: values.honeypot || undefined,
      phoneE164,
      budget: budgetPayload,
    };

    try {
      let response: Response;
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('name', basePayload.name);
        formData.append('email', basePayload.email);
        formData.append('message', basePayload.message);
        if (basePayload.locale) formData.append('locale', basePayload.locale);
        formData.append('turnstileToken', basePayload.turnstileToken);
        if (basePayload.honeypot) formData.append('honeypot', basePayload.honeypot);
        if (values.phone) {
          formData.append('phone.country', values.phone.country);
          formData.append('phone.dialCode', values.phone.dialCode);
          if (nationalDigits) {
            formData.append('phone.national', nationalDigits);
          }
        }
        if (basePayload.budget) {
          formData.append('budget.currency', basePayload.budget.currency);
          formData.append('budget.amount', String(basePayload.budget.amount));
        }
        for (const file of files) {
          formData.append('files[]', file, file.name);
        }
        response = await fetch('/api/contact', {
          method: 'POST',
          body: formData,
        });
      } else {
        const wirePayload: ContactApiBody = basePayload;
        response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wirePayload),
        });
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus('error');
        if (result?.error === 'cooldown') {
          setFeedback(copy.cooldown);
        } else if (result?.message) {
          setFeedback(result.message);
        } else {
          setFeedback(copy.error);
        }
        return;
      }

      setStatus('success');
      setFeedback(result?.message ?? copy.success);
      reset({
        name: '',
        email: '',
        phone: {
          country: defaultCountry.code,
          dialCode: defaultCountry.dialCode,
          national: '',
        },
        budget: undefined,
        message: '',
        locale,
        turnstileToken: '',
        honeypot: '',
      });
      setFiles([]);
      setBudgetCurrency(defaultCurrency);
      setBudgetAmount(null);
      setBudgetInput('');
      setToken('');
      setTurnstileNonce((nonce) => nonce + 1);
    } catch (error) {
      console.error('Failed to submit contact form', error);
      setStatus('error');
      setFeedback(copy.error);
    }
  }

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      void submitForm(values);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <p className="text-sm text-slate-600">{copy.intro}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>{copy.fields.name}</span>
          <input
            {...register('name')}
            required
            maxLength={100}
            aria-invalid={errors.name ? 'true' : 'false'}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder={namePlaceholder}
          />
          {errors.name && (
            <span className="text-xs text-rose-600">{errors.name.message}</span>
          )}
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>{copy.fields.email}</span>
          <input
            type="email"
            {...register('email')}
            required
            aria-invalid={errors.email ? 'true' : 'false'}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="name@example.com"
          />
          {errors.email && (
            <span className="text-xs text-rose-600">{errors.email.message}</span>
          )}
        </label>
        <Controller
          control={control}
          name="phone"
          render={({ field, fieldState }) => {
            const current: NonNullable<ContactFormInput['phone']> = field.value ?? {
              country: defaultCountry.code,
              dialCode: defaultCountry.dialCode,
              national: '',
            };
            const country: Country = COUNTRY_BY_CODE[current.country] ?? defaultCountry;
            countryOptionRefs.current = new Array(sortedCountries.length);
            return (
              <div
                className="flex flex-col gap-1 text-sm"
                role="group"
                aria-labelledby="phone-label"
              >
                <label id="phone-label" htmlFor="phone-national" className="text-sm">
                  {copy.fields.phone}
                </label>
                <div className="flex gap-2">
                  <div
                    ref={countryDropdownRef}
                    className="relative w-48 min-w-[8rem]"
                    onBlur={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                        setCountryDropdownOpen(false);
                      }
                    }}
                  >
                    <button
                      id="phone-country"
                      type="button"
                      ref={countryTriggerRef}
                      className="flex w-full items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      aria-haspopup="listbox"
                      aria-expanded={countryDropdownOpen}
                      aria-labelledby="phone-label phone-country"
                      onClick={() => {
                        const index = sortedCountries.findIndex(
                          (c) => c.code === country.code,
                        );
                        const nextIndex = index >= 0 ? index : 0;
                        setCountryActiveIndex(nextIndex);
                        setCountryDropdownOpen((open) => !open);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                          event.preventDefault();
                          const index = sortedCountries.findIndex(
                            (c) => c.code === country.code,
                          );
                          const nextIndex = index >= 0 ? index : 0;
                          setCountryActiveIndex(nextIndex);
                          setCountryDropdownOpen(true);
                        } else if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          const index = sortedCountries.findIndex(
                            (c) => c.code === country.code,
                          );
                          const nextIndex = index >= 0 ? index : 0;
                          if (countryDropdownOpen) {
                            setCountryDropdownOpen(false);
                          } else {
                            setCountryActiveIndex(nextIndex);
                            setCountryDropdownOpen(true);
                          }
                        } else if (event.key === 'Escape') {
                          if (countryDropdownOpen) {
                            event.preventDefault();
                            setCountryDropdownOpen(false);
                          }
                        }
                      }}
                    >
                      <div className="grid w-full grid-cols-[1.75rem_2.5rem_3.5rem_1fr] items-center gap-2 text-left">
                        <span
                          className={`fi fi-${country.code.toLowerCase()} block h-4 w-6 rounded-sm`}
                          aria-hidden="true"
                        />
                        <span className="w-10 text-xs uppercase text-slate-500">
                          {country.code}
                        </span>
                        <span className="w-14 font-mono tabular-nums text-slate-700">
                          {country.dialCode}
                        </span>
                        <span className="truncate text-slate-700">{country.name}</span>
                      </div>
                    </button>
                    {countryDropdownOpen && (
                      <div
                        role="listbox"
                        tabIndex={-1}
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg focus:outline-none"
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setCountryActiveIndex((index) => {
                              const nextIndex =
                                index + 1 < sortedCountries.length ? index + 1 : 0;
                              requestAnimationFrame(() =>
                                focusOption(nextIndex, { scroll: true }),
                              );
                              return nextIndex;
                            });
                          } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setCountryActiveIndex((index) => {
                              const nextIndex =
                                index - 1 >= 0 ? index - 1 : sortedCountries.length - 1;
                              requestAnimationFrame(() =>
                                focusOption(nextIndex, { scroll: true }),
                              );
                              return nextIndex;
                            });
                          } else if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            const next = sortedCountries[countryActiveIndex];
                            if (next) {
                              field.onChange({
                                country: next.code,
                                dialCode: next.dialCode,
                                national: current.national ?? '',
                              });
                              setCountryDropdownOpen(false);
                              setCountryActiveIndex(sortedCountries.indexOf(next));
                              requestAnimationFrame(() => {
                                countryTriggerRef.current?.focus();
                              });
                              field.onBlur();
                            }
                          } else if (event.key === 'Escape') {
                            event.preventDefault();
                            setCountryDropdownOpen(false);
                            countryTriggerRef.current?.focus();
                          }
                        }}
                      >
                        {sortedCountries.map((option, index) => {
                          const isSelected = option.code === country.code;
                          const isActive = index === countryActiveIndex;
                          return (
                            <button
                              key={option.code}
                              type="button"
                              ref={(element) => {
                                countryOptionRefs.current[index] = element;
                              }}
                              role="option"
                              aria-selected={isSelected}
                              className={`w-full px-3 py-2 text-left text-sm focus:outline-none ${
                                isActive ? 'bg-slate-100' : ''
                              } ${isSelected ? 'text-brand-600' : 'text-slate-700'}`}
                              onMouseEnter={() => setCountryActiveIndex(index)}
                              onClick={() => {
                                field.onChange({
                                  country: option.code,
                                  dialCode: option.dialCode,
                                  national: current.national ?? '',
                                });
                                setCountryDropdownOpen(false);
                                field.onBlur();
                                countryTriggerRef.current?.focus();
                              }}
                            >
                              <div className="grid grid-cols-[1.75rem_2.5rem_3.5rem_1fr] items-center gap-2">
                                <span
                                  className={`fi fi-${option.code.toLowerCase()} block h-4 w-6 rounded-sm`}
                                  aria-hidden="true"
                                />
                                <span
                                  className={`w-10 text-xs uppercase ${
                                    isSelected ? 'text-brand-600' : 'text-slate-500'
                                  }`}
                                >
                                  {option.code}
                                </span>
                                <span
                                  className={`w-14 font-mono tabular-nums ${
                                    isSelected ? 'text-brand-600' : 'text-slate-700'
                                  }`}
                                >
                                  {option.dialCode}
                                </span>
                                <span
                                  className={`truncate ${
                                    isSelected ? 'text-brand-600' : 'text-slate-700'
                                  }`}
                                >
                                  {option.name}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      id="phone-national"
                      type="tel"
                      inputMode="numeric"
                      aria-invalid={fieldState.error ? 'true' : 'false'}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder={phonePlaceholder}
                      value={current.national ?? ''}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/[^\d]/g, '');
                        field.onChange({
                          country: country.code,
                          dialCode: country.dialCode,
                          national: digits,
                        });
                      }}
                      onBlur={field.onBlur}
                    />
                  </div>
                </div>
                {fieldState.error && (
                  <span className="text-xs text-rose-600">
                    {fieldState.error.message}
                  </span>
                )}
              </div>
            );
          }}
        />
        <Controller
          control={control}
          name="budget"
          render={({ field, fieldState }) => (
            <label className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span>{copy.fields.budget}</span>
                {approxThbDisplay && budgetAmount !== null && (
                  <span className="text-xs text-slate-500">{approxThbDisplay}</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  className="w-20 min-w-[84px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 md:w-24"
                  value={budgetCurrency}
                  onChange={(event) => {
                    const next = event.target.value as CurrencyCode;
                    setBudgetCurrency(next);
                    if (budgetAmount !== null) {
                      field.onChange({ currency: next, amount: budgetAmount });
                    } else {
                      field.onChange(undefined);
                    }
                  }}
                >
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-invalid={fieldState.error ? 'true' : 'false'}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                  placeholder={budgetPlaceholder}
                  value={budgetInput}
                  onChange={(event) => {
                    const raw = event.target.value;
                    setBudgetInput(raw);
                    if (!raw.trim()) {
                      setBudgetAmount(null);
                      field.onChange(undefined);
                      return;
                    }
                    const parsed = parseBudgetInput(raw, decimalSymbol, groupSymbols);
                    if (parsed === null) {
                      setBudgetAmount(null);
                      field.onChange(undefined);
                      return;
                    }
                    setBudgetAmount(parsed);
                    field.onChange({ currency: budgetCurrency, amount: parsed });
                  }}
                  onFocus={() => {
                    if (budgetAmount !== null) {
                      setBudgetInput(budgetAmount.toString());
                    }
                  }}
                  onBlur={(event) => {
                    if (!event.target.value.trim()) {
                      setBudgetAmount(null);
                      field.onChange(undefined);
                      return;
                    }
                    if (budgetAmount !== null) {
                      setBudgetInput(numberFormatter.format(budgetAmount));
                    }
                    field.onBlur();
                  }}
                />
              </div>
              {fieldState.error && (
                <span className="text-xs text-rose-600">{fieldState.error.message}</span>
              )}
            </label>
          )}
        />
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span>{copy.fields.message}</span>
        <div className="relative">
          <textarea
            {...register('message')}
            required
            maxLength={1000}
            aria-invalid={errors.message ? 'true' : 'false'}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100"
            aria-label="Attach files"
          >
            <PaperclipIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(event) => handleFiles(event.target.files)}
          />
        </div>
        {fileError && <span className="text-xs text-rose-600">{fileError}</span>}
        {errors.message && (
          <span className="text-xs text-rose-600">{errors.message.message}</span>
        )}
        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-700 shadow-sm"
              >
                <span className="flex items-center gap-1 truncate">
                  <PaperclipIcon className="h-3 w-3" aria-hidden="true" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 transition hover:bg-slate-100"
                  aria-label={`Remove ${file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              aria-label="Add more attachments"
            >
              <span className="text-base leading-none">+</span>
            </button>
          </div>
        )}
      </label>
      <label className="sr-only">
        {copy.honeypot}
        <input
          {...register('honeypot')}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
        />
      </label>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <Turnstile
            key={turnstileNonce}
            siteKey={turnstileSiteKey}
            options={{ theme: 'light' }}
            onSuccess={(value) => {
              const nextValue = value ?? '';
              setToken(nextValue);
            }}
            onExpire={() => {
              setToken('');
            }}
          />
        </div>
        <button
          type="submit"
          className="mx-auto w-full rounded-full bg-brand-600 px-6 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 md:w-auto"
          disabled={isPending}
        >
          {isPending ? copy.sending : copy.submit}
        </button>
      </div>
      {status !== 'idle' && (
        <p
          className={`text-sm ${status === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}
        >
          {feedback}
        </p>
      )}
    </form>
  );
}

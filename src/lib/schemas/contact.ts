import { z } from 'zod';

/** Primitive helpers */
const trimmedString = z.string().transform((s) => s.trim());

/** --- Client-side form model (richer UI controls) --- */
export const ContactFormSchema = z.object({
  name: trimmedString.pipe(z.string().min(1).max(100)), // any Unicode incl. emoji
  email: z.string().email(),
  // Split phone UI
  phone: z
    .object({
      country: z
        .string()
        .length(2)
        .transform((s) => s.toUpperCase()), // ISO2
      dialCode: z.string().regex(/^\+\d{1,4}$/),
      national: z
        .string()
        .regex(/^[0-9\s\-().]{0,30}$/)
        .optional(),
    })
    .optional(),
  // Split budget UI
  budget: z
    .object({
      currency: z
        .string()
        .length(3)
        .transform((s) => s.toUpperCase()),
      amount: z.number().finite().nonnegative(), // raw number, not string
    })
    .optional(),
  message: trimmedString.pipe(z.string().min(1).max(1000)),
  locale: z.string().min(2).optional(),
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional(),
});
export type ContactFormInput = z.infer<typeof ContactFormSchema>;

/** --- API wire schema (normalized payload) --- */
export const ContactApiSchema = z.object({
  name: trimmedString.pipe(z.string().min(1).max(100)),
  email: z.string().email(),
  phoneE164: z
    .string()
    .regex(/^\+\d{7,15}$/)
    .optional(),
  budget: z
    .object({
      currency: z.string().length(3),
      amount: z.number().nonnegative(),
    })
    .optional(),
  message: trimmedString.pipe(z.string().min(1).max(1000)),
  locale: z.string().min(2).optional(),
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional(),
});
export type ContactApiBody = z.infer<typeof ContactApiSchema>;

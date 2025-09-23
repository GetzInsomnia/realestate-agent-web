import { z } from "zod";

export const localizedKeySchema = z.string().min(1);

export const listingSchema = z.object({
  id: z.string(),
  titleKey: localizedKeySchema,
  descriptionKey: localizedKeySchema,
  locationKey: localizedKeySchema,
  price: z.number().nonnegative(),
  currency: z.string().min(1),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  area: z.number().positive(),
  tags: z.array(z.string()),
  image: z.string().min(1),
});

export const articleSchema = z.object({
  id: z.string(),
  slug: z.string(),
  titleKey: localizedKeySchema,
  excerptKey: localizedKeySchema,
  bodyKeys: z.array(localizedKeySchema).min(1),
  published: z.string(),
  readingMinutes: z.number().int().positive(),
  image: z.string().min(1),
});

export const highlightSchema = z.object({
  id: z.string(),
  labelKey: localizedKeySchema,
  value: z.string(),
});

export const faqSchema = z.object({
  id: z.string(),
  questionKey: localizedKeySchema,
  answerKey: localizedKeySchema,
});

export const testimonialSchema = z.object({
  id: z.string(),
  nameKey: localizedKeySchema,
  roleKey: localizedKeySchema,
  quoteKey: localizedKeySchema,
});

export const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
  budget: z.string().optional(),
  locale: z.string().min(2),
  turnstileToken: z.string().min(1),
  honeypot: z.string().optional(),
});

export type Listing = z.infer<typeof listingSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type Faq = z.infer<typeof faqSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type ContactFormPayload = z.infer<typeof contactFormSchema>;

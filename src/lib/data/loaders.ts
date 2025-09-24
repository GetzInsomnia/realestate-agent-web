import { z } from 'zod';
import listingsSource from './listings.json' assert { type: 'json' };
import articlesSource from './articles.json' assert { type: 'json' };
import highlightsSource from './highlights.json' assert { type: 'json' };
import faqsSource from './faqs.json' assert { type: 'json' };
import testimonialsSource from './testimonials.json' assert { type: 'json' };
import {
  articleSchema,
  faqSchema,
  highlightSchema,
  listingSchema,
  testimonialSchema,
  type Article,
  type Faq,
  type Highlight,
  type Listing,
  type Testimonial,
} from './schemas';

const defaultListings: Listing[] = [
  {
    id: 'harbor-view',
    titleKey: 'listings.fallback.title',
    descriptionKey: 'listings.fallback.description',
    locationKey: 'listings.fallback.location',
    price: 480000,
    currency: 'USD',
    bedrooms: 2,
    bathrooms: 2,
    area: 110,
    tags: ['turnkey'],
    image: '/images/fallback-listing.svg',
  },
];

const defaultArticles: Article[] = [
  {
    id: 'market-basics',
    slug: 'market-basics',
    titleKey: 'articles.fallback.title',
    excerptKey: 'articles.fallback.excerpt',
    bodyKeys: ['articles.fallback.body'],
    published: '2024-01-01',
    readingMinutes: 3,
    image: '/images/fallback-article.svg',
  },
];

const defaultHighlights: Highlight[] = [
  { id: 'default', labelKey: 'home.highlights.fallback', value: '--' },
];

const defaultFaqs: Faq[] = [
  { id: 'default', questionKey: 'home.faq.fallback.q', answerKey: 'home.faq.fallback.a' },
];

const defaultTestimonials: Testimonial[] = [
  {
    id: 'default',
    nameKey: 'home.testimonials.fallback.name',
    roleKey: 'home.testimonials.fallback.role',
    quoteKey: 'home.testimonials.fallback.quote',
  },
];

type LoadResult<T> = {
  items: T[];
  issues?: string[];
};

function parseArray<T>(schema: z.ZodType<T>, raw: unknown, fallback: T[]): LoadResult<T> {
  const parsed = z.array(schema).safeParse(raw);
  if (parsed.success) {
    return { items: parsed.data };
  }

  console.warn('Failed to validate data', parsed.error.flatten().fieldErrors);
  return {
    items: fallback,
    issues: ['data.validation'],
  };
}

export function loadListings(): LoadResult<Listing> {
  return parseArray(listingSchema, listingsSource, defaultListings);
}

export function loadArticles(): LoadResult<Article> {
  return parseArray(articleSchema, articlesSource, defaultArticles);
}

export function loadHighlights(): LoadResult<Highlight> {
  return parseArray(highlightSchema, highlightsSource, defaultHighlights);
}

export function loadFaqs(): LoadResult<Faq> {
  return parseArray(faqSchema, faqsSource, defaultFaqs);
}

export function loadTestimonials(): LoadResult<Testimonial> {
  return parseArray(testimonialSchema, testimonialsSource, defaultTestimonials);
}

# XRAY REPORT

_Generated: 2025-09-24T02:57:53.659Z_

## Table of Contents

1. [Inventory](#inventory)
2. [Package](#package)
3. [Structure](#structure)
4. [I18N](#i18n)
5. [Content](#content)
6. [Tests](#tests)
7. [Checks](#checks)

---

## Inventory

Total files: 74
Text files: 67
Binary files: 7
Total size: 620.53 KB

File Ext Size Type

---

eslint.config.mjs .mjs 908 text  
next-env.d.ts .ts 233 text  
next-sitemap.config.js .js 688 text  
next.config.mjs .mjs 517 text  
package-lock.json .json 404008 text  
package.json .json 1968 text  
postcss.config.mjs .mjs 113 text  
public/file.svg .svg 391 binary
public/globe.svg .svg 1035 binary
public/logo.svg .svg 261 binary
public/next.svg .svg 1375 binary
public/vercel.svg .svg 128 binary
public/window.svg .svg 385 binary
README.md .md 3035 text  
scripts/fill-missing-messages.mjs .mjs 2549 text  
scripts/i18n-audit.mjs .mjs 8100 text  
scripts/i18n-fill.mjs .mjs 3132 text  
scripts/xray-lite.mjs .mjs 36854 text  
src/**tests**/error-boundary.test.tsx .tsx 908 text  
src/**tests**/i18n.test.ts .ts 550 text  
src/**tests**/locale-switcher.test.tsx .tsx 1154 text  
src/app/[locale]/articles/[slug]/page.tsx .tsx 3513 text  
src/app/[locale]/articles/page.tsx .tsx 3607 text  
src/app/[locale]/components/ArticlesCarousel.tsx .tsx 2887 text  
src/app/[locale]/components/BackToTop.tsx .tsx 996 text  
src/app/[locale]/components/Breadcrumbs.tsx .tsx 4624 text  
src/app/[locale]/components/FaqAccordion.tsx .tsx 1681 text  
src/app/[locale]/components/Footer.tsx .tsx 989 text  
src/app/[locale]/components/Hero.tsx .tsx 3443 text  
src/app/[locale]/components/LayoutShell.tsx .tsx 898 text  
src/app/[locale]/components/ListingsGrid.tsx .tsx 5760 text  
src/app/[locale]/components/LocaleSwitcher.tsx .tsx 1867 text  
src/app/[locale]/components/Navigation.tsx .tsx 1398 text  
src/app/[locale]/components/SectionObserver.tsx .tsx 1984 text  
src/app/[locale]/components/Testimonials.tsx .tsx 1309 text  
src/app/[locale]/contact/ContactForm.tsx .tsx 5161 text  
src/app/[locale]/contact/page.tsx .tsx 2465 text  
src/app/[locale]/error.tsx .tsx 961 text  
src/app/[locale]/layout.tsx .tsx 2943 text  
src/app/[locale]/listings/ListingsSearchClient.tsx .tsx 674 text  
src/app/[locale]/listings/page.tsx .tsx 3614 text  
src/app/[locale]/loading.tsx .tsx 427 text  
src/app/[locale]/not-found.tsx .tsx 1250 text  
src/app/[locale]/page.tsx .tsx 5133 text  
src/app/[locale]/providers.tsx .tsx 699 text  
src/app/api/contact/route.ts .ts 5168 text  
src/app/global-error.tsx .tsx 890 text  
src/app/globals.css .css 1072 text  
src/app/icon.svg .svg 301 binary
src/app/layout.tsx .tsx 657 text  
src/app/not-found.tsx .tsx 173 text  
src/app/page.tsx .tsx 165 text  
src/lib/data/articles.json .json 1358 text  
src/lib/data/faqs.json .json 384 text  
src/lib/data/highlights.json .json 320 text  
src/lib/data/listings.json .json 1651 text  
src/lib/data/loaders.ts .ts 2896 text  
src/lib/data/schemas.ts .ts 1898 text  
src/lib/data/testimonials.json .json 357 text  
src/lib/i18n.ts .ts 2639 text  
src/lib/seo.ts .ts 4556 text  
src/lib/swr-config.ts .ts 560 text  
src/lib/utils.ts .ts 758 text  
src/messages/en.json .json 10386 text  
src/messages/my.json .json 21236 text  
src/messages/ru.json .json 13565 text  
src/messages/th.json .json 17660 text  
src/messages/zh-CN.json .json 8536 text  
src/messages/zh-TW.json .json 8458 text  
src/middleware.ts .ts 608 text  
tailwind.config.ts .ts 1467 text  
tsconfig.json .json 629 text  
vitest.config.ts .ts 455 text  
vitest.setup.ts .ts 44 text

## Package

Path: package.json
Name: real-estate-multilingual
Version: 0.1.0

### Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "xray": "node scripts/xray-lite.mjs --out reports",
  "xray:single": "node scripts/xray-lite.mjs --out reports/PROJECT-REPORT.md",
  "prepare": "husky",
  "i18n:audit": "node scripts/i18n-audit.mjs",
  "i18n:fill": "node scripts/i18n-fill.mjs"
}
```

### Dependencies

```json
{
  "@marsidev/react-turnstile": "^0.5.0",
  "@vercel/analytics": "^1.5.0",
  "clsx": "^2.1.1",
  "framer-motion": "^11.18.2",
  "next": "14.2.15",
  "next-intl": "^3.26.4",
  "next-sitemap": "^4.2.3",
  "nodemailer": "^6.9.16",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "swr": "^2.3.0",
  "zod": "^3.23.8",
  "tailwind-merge": "^2.5.3"
}
```

### Dev Dependencies

```json
{
  "@eslint/eslintrc": "^3.3.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/react": "^16.2.0",
  "@testing-library/user-event": "^14.5.2",
  "@types/node": "^20.17.10",
  "@types/nodemailer": "^6.4.15",
  "@types/react": "^18.3.12",
  "@types/react-dom": "^18.3.1",
  "@vitest/coverage-v8": "^1.6.0",
  "autoprefixer": "^10.4.20",
  "eslint": "^8.57.0",
  "eslint-config-next": "14.2.15",
  "eslint-config-prettier": "^9.1.0",
  "eslint-plugin-tailwindcss": "^3.15.3",
  "husky": "^9.1.7",
  "jsdom": "^26.0.0",
  "lint-staged": "^15.2.10",
  "postcss": "^8.4.49",
  "prettier": "^3.4.2",
  "prettier-plugin-tailwindcss": "^0.6.9",
  "tailwindcss": "^3.4.16",
  "typescript": "^5.7.3",
  "vitest": "^1.6.0",
  "@tailwindcss/forms": "^0.5.9"
}
```

## Structure

Frameworks: Next.js, React, next-intl, Testing Library, Tailwind CSS

Pages:

- src/app/[locale]/articles/[slug]/page.tsx
- src/app/[locale]/articles/page.tsx
- src/app/[locale]/contact/page.tsx
- src/app/[locale]/listings/page.tsx
- src/app/[locale]/page.tsx
- src/app/page.tsx

Layouts:

- src/app/[locale]/layout.tsx
- src/app/layout.tsx

API Routes:

- src/app/api/contact/route.ts

Metadata generators:

- src/app/[locale]/articles/[slug]/page.tsx
- src/app/[locale]/articles/page.tsx
- src/app/[locale]/contact/page.tsx
- src/app/[locale]/layout.tsx
- src/app/[locale]/listings/page.tsx

Client components:

- src/app/[locale]/components/ArticlesCarousel.tsx
- src/app/[locale]/components/BackToTop.tsx
- src/app/[locale]/components/Breadcrumbs.tsx
- src/app/[locale]/components/FaqAccordion.tsx
- src/app/[locale]/components/Hero.tsx
- src/app/[locale]/components/LayoutShell.tsx
- src/app/[locale]/components/ListingsGrid.tsx
- src/app/[locale]/components/LocaleSwitcher.tsx
- src/app/[locale]/components/Navigation.tsx
- src/app/[locale]/components/SectionObserver.tsx
- src/app/[locale]/components/Testimonials.tsx
- src/app/[locale]/contact/ContactForm.tsx
- src/app/[locale]/error.tsx
- src/app/[locale]/listings/ListingsSearchClient.tsx
- src/app/[locale]/providers.tsx
- src/app/global-error.tsx

Server components:

- (none)

## I18N

Base directory: src/messages

```json
{
  "en": {
    "file": "src/messages/en.json",
    "keys": 129
  },
  "my": {
    "file": "src/messages/my.json",
    "keys": 129
  },
  "ru": {
    "file": "src/messages/ru.json",
    "keys": 129
  },
  "th": {
    "file": "src/messages/th.json",
    "keys": 129
  },
  "zh-CN": {
    "file": "src/messages/zh-CN.json",
    "keys": 129
  },
  "zh-TW": {
    "file": "src/messages/zh-TW.json",
    "keys": 129
  }
}
```

## Content

Dynamic imports:

- scripts/xray-lite.mjs

Suspense usage:

- src/app/[locale]/listings/page.tsx

JSON-LD usage:

- scripts/xray-lite.mjs
- src/app/[locale]/components/Breadcrumbs.tsx
- src/app/[locale]/contact/ContactForm.tsx
- src/app/[locale]/layout.tsx
- src/app/[locale]/listings/page.tsx
- src/app/[locale]/page.tsx
- src/lib/seo.ts

Metadata generators:

- src/app/[locale]/articles/[slug]/page.tsx
- src/app/[locale]/articles/page.tsx
- src/app/[locale]/contact/page.tsx
- src/app/[locale]/layout.tsx
- src/app/[locale]/listings/page.tsx

next/image usage:

- (none)

## Tests

Vitest files:

- src/**tests**/error-boundary.test.tsx
- src/**tests**/i18n.test.ts
- src/**tests**/locale-switcher.test.tsx

Playwright files:

- (none)

Jest configs:

- (none)

## Checks

```json
{
  "core": [
    {
      "id": "error-boundary",
      "label": "Has app-level error boundary",
      "status": false
    },
    {
      "id": "global-error",
      "label": "Has global-error.tsx",
      "status": true
    },
    {
      "id": "loading-ui",
      "label": "Has loading.tsx fallback",
      "status": false
    },
    {
      "id": "contact-route",
      "label": "Contact API route implements Turnstile verification",
      "status": true,
      "file": "src/app/api/contact/route.ts"
    },
    {
      "id": "locale-switcher",
      "label": "Locale switcher preserves hash and scroll state",
      "status": true,
      "file": "src/app/[locale]/components/LocaleSwitcher.tsx"
    },
    {
      "id": "sitemap",
      "label": "Has sitemap configuration",
      "status": true
    }
  ],
  "localeGuards": {
    "totalIssues": 0,
    "hasIssues": false,
    "files": []
  },
  "nextConfig": {
    "totalFiles": 1,
    "filesWithFlags": 1,
    "totalFlagCount": 6,
    "uniqueFlags": [
      "compiler.removeConsole",
      "experimental.serverActions",
      "poweredByHeader: false",
      "productionBrowserSourceMaps: false",
      "reactStrictMode: true",
      "swcMinify: true"
    ],
    "files": [
      {
        "file": "next.config.mjs",
        "flags": [
          "compiler.removeConsole",
          "experimental.serverActions",
          "poweredByHeader: false",
          "productionBrowserSourceMaps: false",
          "reactStrictMode: true",
          "swcMinify: true"
        ]
      }
    ]
  },
  "middleware": {
    "total": 1,
    "withMatcher": 1,
    "withoutMatcher": 0,
    "entries": [
      {
        "file": "src/middleware.ts",
        "hasMatcher": true,
        "matchers": ["/:path*"]
      }
    ]
  },
  "seo": {
    "metadataFunctions": 5,
    "metadataExports": 0,
    "alternatesLanguages": 1,
    "structuredData": 7,
    "files": {
      "metadataFunctions": [
        "src/app/[locale]/articles/[slug]/page.tsx",
        "src/app/[locale]/articles/page.tsx",
        "src/app/[locale]/contact/page.tsx",
        "src/app/[locale]/layout.tsx",
        "src/app/[locale]/listings/page.tsx"
      ],
      "metadataExports": [],
      "alternatesLanguages": ["src/lib/seo.ts"],
      "structuredData": [
        "scripts/xray-lite.mjs",
        "src/app/[locale]/components/Breadcrumbs.tsx",
        "src/app/[locale]/contact/ContactForm.tsx",
        "src/app/[locale]/layout.tsx",
        "src/app/[locale]/listings/page.tsx",
        "src/app/[locale]/page.tsx",
        "src/lib/seo.ts"
      ]
    }
  },
  "security": {
    "envUsage": 4,
    "secureCookies": 1,
    "securityHeaders": 1,
    "protection": 14,
    "files": {
      "envUsage": [
        "next-sitemap.config.js",
        "src/app/[locale]/contact/page.tsx",
        "src/app/api/contact/route.ts",
        "src/lib/seo.ts"
      ],
      "secureCookies": ["src/app/api/contact/route.ts"],
      "securityHeaders": ["scripts/xray-lite.mjs"],
      "protection": [
        "README.md",
        "package-lock.json",
        "package.json",
        "scripts/xray-lite.mjs",
        "src/app/[locale]/contact/ContactForm.tsx",
        "src/app/[locale]/contact/page.tsx",
        "src/app/api/contact/route.ts",
        "src/lib/data/schemas.ts",
        "src/messages/en.json",
        "src/messages/my.json",
        "src/messages/ru.json",
        "src/messages/th.json",
        "src/messages/zh-CN.json",
        "src/messages/zh-TW.json"
      ]
    }
  },
  "robots": {
    "robotsHandlers": 0,
    "sitemapHandlers": 0,
    "nextSitemapConfigs": 1,
    "files": {
      "robots": [],
      "sitemap": [],
      "nextSitemapConfig": ["next-sitemap.config.js"]
    }
  },
  "i18nUsage": {
    "totalFiles": 10,
    "totalKeys": 69,
    "files": [
      {
        "file": "src/app/[locale]/articles/[slug]/page.tsx",
        "keys": ["articles.readTime"]
      },
      {
        "file": "src/app/[locale]/articles/page.tsx",
        "keys": [
          "articles.readMore",
          "articles.readTime",
          "articles.sectionSubtitle",
          "articles.sectionTitle",
          "articles.seo.description",
          "articles.seo.title",
          "seo.description",
          "seo.title"
        ]
      },
      {
        "file": "src/app/[locale]/components/ArticlesCarousel.tsx",
        "keys": ["articles.readMore", "articles.readTime"]
      },
      {
        "file": "src/app/[locale]/components/Breadcrumbs.tsx",
        "keys": [
          "articles.sectionTitle",
          "common.home",
          "contact.title",
          "listings.sectionTitle"
        ]
      },
      {
        "file": "src/app/[locale]/contact/page.tsx",
        "keys": [
          "contact.cooldown",
          "contact.error",
          "contact.fields.budget",
          "contact.fields.email",
          "contact.fields.message",
          "contact.fields.name",
          "contact.fields.phone",
          "contact.honeypot",
          "contact.intro",
          "contact.sending",
          "contact.seo.description",
          "contact.seo.title",
          "contact.submit",
          "contact.subtitle",
          "contact.success",
          "contact.title",
          "seo.description",
          "seo.title"
        ]
      },
      {
        "file": "src/app/[locale]/error.tsx",
        "keys": ["errors.description", "errors.title", "errors.tryAgain"]
      },
      {
        "file": "src/app/[locale]/layout.tsx",
        "keys": [
          "footer.legal",
          "footer.tagline",
          "nav.articles",
          "nav.contact",
          "nav.home",
          "nav.listings"
        ]
      },
      {
        "file": "src/app/[locale]/listings/page.tsx",
        "keys": [
          "listings.directorySubtitle",
          "listings.metrics.area",
          "listings.metrics.bathrooms",
          "listings.metrics.bedrooms",
          "listings.sectionTitle",
          "listings.seo.description",
          "listings.seo.title",
          "listings.tags.cityCore",
          "listings.tags.exclusive",
          "listings.tags.investmentReady",
          "listings.tags.panoramic",
          "listings.tags.privateDock",
          "listings.tags.resortLiving",
          "listings.tags.transit",
          "listings.tags.turnkey",
          "seo.description",
          "seo.title"
        ]
      },
      {
        "file": "src/app/[locale]/not-found.tsx",
        "keys": ["errors.backHome", "errors.notFoundDescription", "errors.notFoundTitle"]
      },
      {
        "file": "src/app/[locale]/page.tsx",
        "keys": [
          "articles.sectionSubtitle",
          "articles.sectionTitle",
          "articles.viewAll",
          "home.alerts.articlesFallback",
          "home.alerts.listingsFallback",
          "home.contactCTA.cta",
          "home.contactCTA.subtitle",
          "home.contactCTA.title",
          "home.faq.subtitle",
          "home.faq.title",
          "home.hero.ctaPrimary",
          "home.hero.ctaSecondary",
          "home.hero.eyebrow",
          "home.hero.subtitle",
          "home.hero.title",
          "home.testimonials.subtitle",
          "home.testimonials.title",
          "listings.metrics.area",
          "listings.metrics.bathrooms",
          "listings.metrics.bedrooms",
          "listings.sectionSubtitle",
          "listings.sectionTitle",
          "listings.tags.cityCore",
          "listings.tags.exclusive",
          "listings.tags.investmentReady",
          "listings.tags.panoramic",
          "listings.tags.privateDock",
          "listings.tags.resortLiving",
          "listings.tags.transit",
          "listings.tags.turnkey",
          "listings.viewAll"
        ]
      }
    ],
    "keys": [
      "articles.readMore",
      "articles.readTime",
      "articles.sectionSubtitle",
      "articles.sectionTitle",
      "articles.seo.description",
      "articles.seo.title",
      "articles.viewAll",
      "common.home",
      "contact.cooldown",
      "contact.error",
      "contact.fields.budget",
      "contact.fields.email",
      "contact.fields.message",
      "contact.fields.name",
      "contact.fields.phone",
      "contact.honeypot",
      "contact.intro",
      "contact.sending",
      "contact.seo.description",
      "contact.seo.title",
      "contact.submit",
      "contact.subtitle",
      "contact.success",
      "contact.title",
      "errors.backHome",
      "errors.description",
      "errors.notFoundDescription",
      "errors.notFoundTitle",
      "errors.title",
      "errors.tryAgain",
      "footer.legal",
      "footer.tagline",
      "home.alerts.articlesFallback",
      "home.alerts.listingsFallback",
      "home.contactCTA.cta",
      "home.contactCTA.subtitle",
      "home.contactCTA.title",
      "home.faq.subtitle",
      "home.faq.title",
      "home.hero.ctaPrimary",
      "home.hero.ctaSecondary",
      "home.hero.eyebrow",
      "home.hero.subtitle",
      "home.hero.title",
      "home.testimonials.subtitle",
      "home.testimonials.title",
      "listings.directorySubtitle",
      "listings.metrics.area",
      "listings.metrics.bathrooms",
      "listings.metrics.bedrooms",
      "listings.sectionSubtitle",
      "listings.sectionTitle",
      "listings.seo.description",
      "listings.seo.title",
      "listings.tags.cityCore",
      "listings.tags.exclusive",
      "listings.tags.investmentReady",
      "listings.tags.panoramic",
      "listings.tags.privateDock",
      "listings.tags.resortLiving",
      "listings.tags.transit",
      "listings.tags.turnkey",
      "listings.viewAll",
      "nav.articles",
      "nav.contact",
      "nav.home",
      "nav.listings",
      "seo.description",
      "seo.title"
    ]
  }
}
```

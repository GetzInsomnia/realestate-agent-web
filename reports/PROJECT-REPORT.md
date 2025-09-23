# XRAY REPORT
_Generated: 2025-09-23T17:03:09.160Z_

## Table of Contents
1. [Inventory](#inventory)
2. [Routes](#routes)
3. [I18N](#i18n)
4. [SEO](#seo)
5. [Performance](#performance)
6. [Security](#security)
7. [ENV](#env)
8. [Checks](#checks)

---

## Inventory
Total files: 70
Text files: 70
Binary files: 0
Total size: 806 KB

File                                              Size    Type
------------------------------------------------  ------  ----
eslint.config.mjs                                 908     text
next-sitemap.config.js                            688     text
next.config.mjs                                   380     text
package-lock.json                                 404008  text
package.json                                      1833    text
pnpm-lock.yaml                                    236865  text
postcss.config.mjs                                113     text
public/file.svg                                   391     text
public/globe.svg                                  1035    text
public/logo.svg                                   261     text
public/next.svg                                   1375    text
public/vercel.svg                                 128     text
public/window.svg                                 385     text
README.md                                         3035    text
scripts/xray-lite.mjs                             14208   text
src/app/api/contact/route.ts                      3826    text
src/app/global-error.tsx                          890     text
src/app/globals.css                               1072    text
src/app/icon.svg                                  301     text
src/app/layout.tsx                                657     text
src/app/not-found.tsx                             173     text
src/app/page.tsx                                  165     text
src/app/[locale]/articles/page.tsx                3267    text
src/app/[locale]/articles/[slug]/page.tsx         3386    text
src/app/[locale]/components/ArticlesCarousel.tsx  2887    text
src/app/[locale]/components/BackToTop.tsx         996     text
src/app/[locale]/components/Breadcrumbs.tsx       1210    text
src/app/[locale]/components/FaqAccordion.tsx      1681    text
src/app/[locale]/components/Footer.tsx            989     text
src/app/[locale]/components/Hero.tsx              3443    text
src/app/[locale]/components/LayoutShell.tsx       898     text
src/app/[locale]/components/ListingsGrid.tsx      4299    text
src/app/[locale]/components/LocaleSwitcher.tsx    1814    text
src/app/[locale]/components/Navigation.tsx        1398    text
src/app/[locale]/components/SectionObserver.tsx   1984    text
src/app/[locale]/components/Testimonials.tsx      1309    text
src/app/[locale]/contact/ContactForm.tsx          5161    text
src/app/[locale]/contact/page.tsx                 2262    text
src/app/[locale]/error.tsx                        961     text
src/app/[locale]/layout.tsx                       2925    text
src/app/[locale]/listings/page.tsx                3772    text
src/app/[locale]/loading.tsx                      427     text
src/app/[locale]/not-found.tsx                    930     text
src/app/[locale]/page.tsx                         4616    text
src/app/[locale]/providers.tsx                    699     text
src/lib/data/articles.json                        1358    text
src/lib/data/faqs.json                            384     text
src/lib/data/highlights.json                      320     text
src/lib/data/listings.json                        1651    text
src/lib/data/loaders.ts                           2896    text
src/lib/data/schemas.ts                           1898    text
src/lib/data/testimonials.json                    357     text
src/lib/i18n.ts                                   2449    text
src/lib/seo.ts                                    3470    text
src/lib/swr-config.ts                             560     text
src/lib/utils.ts                                  758     text
src/messages/en.json                              10386   text
src/messages/my.json                              21236   text
src/messages/ru.json                              13565   text
src/messages/th.json                              17660   text
src/messages/zh-CN.json                           8536    text
src/messages/zh-TW.json                           8458    text
src/middleware.ts                                 216     text
src/__tests__/error-boundary.test.tsx             908     text
src/__tests__/i18n.test.ts                        550     text
src/__tests__/locale-switcher.test.tsx            1071    text
tailwind.config.ts                                1467    text
tsconfig.json                                     629     text
vitest.config.ts                                  455     text
vitest.setup.ts                                   44      text


## Routes
Locales detected: (none)

```json
[]
```

## I18N
Base dir: src/messages

```json
{
  "th": {
    "keys": 129,
    "file": "src/messages/th.json"
  },
  "en": {
    "keys": 129,
    "file": "src/messages/en.json"
  },
  "zh-CN": {
    "keys": 129,
    "file": "src/messages/zh-CN.json"
  },
  "zh-TW": {
    "keys": 129,
    "file": "src/messages/zh-TW.json"
  },
  "my": {
    "keys": 129,
    "file": "src/messages/my.json"
  },
  "ru": {
    "keys": 129,
    "file": "src/messages/ru.json"
  }
}
```

### Missing vs en
```json
{
  "th": [],
  "zh-CN": [],
  "zh-TW": [],
  "my": [],
  "ru": []
}
```

## SEO
Pages with generateMetadata:
- (none)

Pages using JSON-LD:
- (none)

Pages defining alternates.languages:
- (none)

## Performance
Dynamic imports:
- scripts/xray-lite.mjs

Suspense usage:
- scripts/xray-lite.mjs

next/image imports:
- (none)

## Security
process.env usage:
- next-sitemap.config.js
- src/app/api/contact/route.ts
- src/app/[locale]/contact/page.tsx
- src/lib/seo.ts

Headers in next.config:
- (none)

Middleware files:
- src/middleware.ts

## ENV
```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_TURNSTILE_SITE_KEY
SMTP_FROM
SMTP_HOST
SMTP_PASS
SMTP_PORT
SMTP_USER
TURNSTILE_SECRET_KEY
```

## Checks
```json
{
  "exists": {
    "error.tsx": true,
    "global-error.tsx": true,
    "loading.tsx": true,
    "(components)/LocaleSwitcher.tsx": false,
    "(components)/SectionObserver.tsx": false,
    "(components)/BackToTop.tsx": false,
    "app/api/contact/route.ts": true,
    "src/app/api/contact/route.ts": true
  },
  "localePreserve": false,
  "hasTurnstile": false
}
```

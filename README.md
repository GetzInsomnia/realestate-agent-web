# ZomZom Property · Multilingual Real Estate Experience

This project is a Next.js 14 App Router application providing a multilingual real estate landing and lead-generation experience for ZomZom Property. It includes localized marketing pages, listings, articles, and a contact workflow with Turnstile verification and email delivery.

## Requirements

- Node.js 18+
- pnpm 8+
- SMTP credentials for outgoing mail
- Cloudflare Turnstile site & secret keys

## Getting started

```bash
pnpm install
pnpm dev
```

The development server is available at [http://localhost:3000](http://localhost:3000). The root route automatically redirects to the fallback locale (`/en`).

### Environment variables

Copy `.env.example` to `.env.local` and provide the required secrets:

- `NEXT_PUBLIC_SITE_URL` – canonical site URL used for metadata/sitemaps
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` – Cloudflare Turnstile client key
- `TURNSTILE_SECRET_KEY` – Cloudflare Turnstile secret key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – SMTP credentials for Nodemailer
- `SMTP_FROM` – optional friendly from address (defaults to `ZomZom Property <noreply@zomzomproperty.com>`)

The contact endpoint sends submissions to `zomzomproperty@gmail.com` and enforces a short cooldown via HTTP-only cookies.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | Lint the project with ESLint |
| `pnpm test` | Run Vitest unit tests |
| `pnpm xray` | Show a project summary (files, line counts) |
| `pnpm xray:single -- <path>` | Show details for a specific file |

## Testing

Vitest + Testing Library power unit tests. The suite covers i18n loaders, error boundaries, and locale switching behavior.

```bash
pnpm test
```

## Project structure

- `src/app/[locale]` – localized routes, components, and layouts
- `src/messages` – locale message catalogs consumed by `next-intl`
- `src/lib` – data loaders, schemas, SEO helpers, and utilities
- `src/lib/data` – JSON data sources and Zod validation
- `scripts/xray-lite.mjs` – utility for lightweight project reports

## Tooling highlights

- Tailwind CSS for styling with custom theme tokens
- `next-intl` for internationalized routing and translations
- SWR global configuration for client data consumption
- `framer-motion` for subtle UI animations
- Nodemailer + Turnstile-protected API route for contact form submissions
- Husky + lint-staged for formatting and lint automation
- Vitest, Testing Library, and Jest DOM matchers for smoke tests

## Additional notes

- `next-sitemap` is configured via `next-sitemap.config.js` to generate multilingual sitemaps.
- The application injects structured data (`JSON-LD`) for the organization and featured listings.
- Assets in `/public` are SVG-based placeholders and can be replaced with brand artwork.

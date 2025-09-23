#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import url from "node:url";

const projectRoot = process.cwd();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------- Args & helpers ------------------------- */
function parseArgs() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const out = outIdx !== -1 ? args[outIdx + 1] : "reports";
  const single = args.includes("--single") || (out && out.endsWith(".md"));
  return { out, single };
}

const TEXT_EXT = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md", ".css", ".scss", ".sass", ".html", ".yml", ".yaml"]);
const BINARY_EXT = new Set([".ico", ".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".pdf", ".ttf", ".woff", ".woff2", ".eot", ".zip", ".gz", ".mp4", ".mov"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "reports", "dist", "build", ".turbo", ".vercel"]);

async function walk(dir, results = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(p, results);
    } else {
      results.push(p);
    }
  }
  return results;
}

function rel(p) { return path.relative(projectRoot, p).replaceAll("\\", "/"); }
function isBinary(file) { return BINARY_EXT.has(path.extname(file).toLowerCase()); }
function isText(file) { return TEXT_EXT.has(path.extname(file).toLowerCase()); }

/* ------------------------- Collectors ------------------------- */
async function collectInventory() {
  const files = await walk(projectRoot, []);
  const rows = [];
  for (const f of files) {
    try {
      const st = await fs.stat(f);
      rows.push({ file: rel(f), size: st.size, binary: isBinary(f) });
    } catch {}
  }
  const summary = {
    totalFiles: rows.length,
    textFiles: rows.filter(r => !r.binary).length,
    binaryFiles: rows.filter(r => r.binary).length,
    totalSizeKB: +(rows.reduce((a,b)=>a+b.size,0) / 1024).toFixed(1)
  };
  return { rows, summary };
}

async function collectRoutes() {
  const roots = ["app", "src/app"].map(r => path.join(projectRoot, r));
  const pages = [];
  const locales = new Set();
  for (const root of roots) {
    let exists = false;
    try { await fs.access(root); exists = true; } catch {}
    if (!exists) continue;

    const files = await walk(root, []);
    const pageFiles = files.filter(f => /(?:^|\/)page\.tsx?$/.test(f));
    for (const f of pageFiles) {
      const seg = rel(f).replace(/^src\//, "");
      let route = seg.replace(/^app\//, "").replace(/\/page\.tsx?$/, "");
      if (!route) route = "/";
      pages.push({ file: rel(f), route });

      // locale guessing: first segment if bracket [locale] or known codes
      const first = route.split("/")[0];
      if (["th","en","zh-CN","zh-TW","my","ru"].includes(first)) locales.add(first);
    }
  }
  return { pages, locales: Array.from(locales).sort() };
}

function flattenJson(obj, prefix="") {
  let count = 0;
  for (const k of Object.keys(obj ?? {})) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) count += flattenJson(v, key);
    else count += 1;
  }
  return count;
}

async function collectI18n() {
  const candidates = [
    path.join(projectRoot, "i18n/messages"),
    path.join(projectRoot, "src/i18n/messages"),
    path.join(projectRoot, "src/messages")
  ];
  let dir = null;
  for (const c of candidates) { try { const st = await fs.stat(c); if (st.isDirectory()) { dir = c; break; } } catch {} }
  if (!dir) return { baseDir: null, perLocale: {}, missing: {} };

  const locales = ["th","en","zh-CN","zh-TW","my","ru"];
  const perLocale = {};
  const jsonByLocale = {};
  for (const lc of locales) {
    try {
      const p = path.join(dir, `${lc}.json`);
      const raw = await fs.readFile(p, "utf8");
      const json = JSON.parse(raw);
      perLocale[lc] = { keys: flattenJson(json), file: rel(p) };
      jsonByLocale[lc] = json;
    } catch {
      perLocale[lc] = { keys: 0, file: null };
      jsonByLocale[lc] = {};
    }
  }
  // diff vs en
  const missing = {};
  const en = jsonByLocale["en"] ?? {};
  function collectKeys(o, prefix="", bag=new Set()) {
    for (const k of Object.keys(o)) {
      const v = o[k];
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) collectKeys(v, key, bag);
      else bag.add(key);
    }
    return bag;
  }
  const baseKeys = Array.from(collectKeys(en));
  for (const lc of locales) {
    if (lc === "en") continue;
    const set = collectKeys(jsonByLocale[lc]);
    const miss = baseKeys.filter(k => !set.has(k));
    missing[lc] = miss;
  }
  return { baseDir: rel(dir), perLocale, missing };
}

async function collectSEO() {
  const files = await walk(projectRoot, []);
  const pages = files.filter(f => /(?:^|\/)page\.tsx?$/.test(f));
  const generateMetadata = [];
  const jsonLdUsage = [];
  const alternatesLang = [];
  for (const f of pages) {
    try {
      const src = await fs.readFile(f, "utf8");
      if (/export\s+async?\s*function\s+generateMetadata\s*\(/.test(src)) {
        generateMetadata.push(rel(f));
      }
      if (/(JsonLd|ld[A-Z][A-Za-z]+)/.test(src)) {
        jsonLdUsage.push(rel(f));
      }
      if (/alternates\s*:\s*{[^}]*languages\s*:/.test(src)) {
        alternatesLang.push(rel(f));
      }
    } catch {}
  }
  return { generateMetadata, jsonLdUsage, alternatesLang };
}

async function collectPerformance() {
  const files = await walk(projectRoot, []);
  const dynamicImports = [];
  const suspenseUsage = [];
  const nextImage = [];
  for (const f of files) {
    if (!isText(f)) continue;
    const src = await fs.readFile(f, "utf8");
    if (src.includes("next/dynamic")) dynamicImports.push(rel(f));
    if (/\bSuspense\b/.test(src)) suspenseUsage.push(rel(f));
    if (/\bfrom\s+['"]next\/image['"]/.test(src)) nextImage.push(rel(f));
  }
  return { dynamicImports, suspenseUsage, nextImage };
}

async function collectSecurity() {
  const files = await walk(projectRoot, []);
  const envUsage = [];
  const headersConfig = [];
  const middleware = [];
  for (const f of files) {
    if (!isText(f)) continue;
    const src = await fs.readFile(f, "utf8");
    if (/process\.env\./.test(src)) envUsage.push(rel(f));
    if (/headers\s*\(\)\s*{/.test(src) && /next\.config\.(js|mjs|ts)$/.test(f)) headersConfig.push(rel(f));
    if (/middleware\.(js|ts|mjs)$/.test(f)) middleware.push(rel(f));
  }
  return { envUsage, headersConfig, middleware };
}

async function collectEnvKeys() {
  const files = await walk(projectRoot, []);
  const keys = new Set();
  for (const f of files) {
    if (!isText(f)) continue;
    const src = await fs.readFile(f, "utf8");
    for (const m of src.matchAll(/process\.env\.([A-Z0-9_]+)/g)) keys.add(m[1]);
  }
  return { keys: Array.from(keys).sort() };
}

async function collectChecks() {
  const mustExist = [
    "error.tsx",
    "global-error.tsx",
    "loading.tsx",
    "(components)/LocaleSwitcher.tsx",
    "(components)/SectionObserver.tsx",
    "(components)/BackToTop.tsx",
    "app/api/contact/route.ts",
    "src/app/api/contact/route.ts"
  ];
  const files = await walk(projectRoot, []);
  const rels = files.map(rel);
  const exists = {};
  for (const m of mustExist) {
    exists[m] = rels.some(r => r.endsWith(m));
  }

  // Check LocaleSwitcher preserves hash & scroll:false
  const loc = files.find(f => /LocaleSwitcher\.tsx$/.test(f));
  let localePreserve = false;
  if (loc) {
    const src = await fs.readFile(loc, "utf8");
    localePreserve = /router\.replace\([^)]*scroll\s*:\s*false/m.test(src) && /location\.hash/.test(src);
  }

  // Check contact route Turnstile verify
  const contact = files.find(f => /app\/api\/contact\/route\.ts$/.test(f) || /src\/app\/api\/contact\/route\.ts$/.test(f));
  let hasTurnstile = false;
  if (contact) {
    const src = await fs.readFile(contact, "utf8");
    hasTurnstile = /turnstile/i.test(src) && /siteverify/.test(src);
  }

  return { exists, localePreserve, hasTurnstile };
}

/* ------------------------- Writers ------------------------- */
function table(rows, headers) {
  if (!rows?.length) return "_No data_\n";
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => String(r[i]).length)));
  const line = (arr) => arr.map((v, i) => String(v).padEnd(widths[i])).join("  ");
  const sep = widths.map(w => "-".repeat(w)).join("  ");
  return `${line(headers)}\n${sep}\n${rows.map(r => line(r)).join("\n")}\n`;
}

async function writeMulti(outDir, data) {
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "INVENTORY.md"),
`# INVENTORY
Total files: ${data.inventory.summary.totalFiles}
Text files: ${data.inventory.summary.textFiles}
Binary files: ${data.inventory.summary.binaryFiles}
Total size: ${data.inventory.summary.totalSizeKB} KB

${table(data.inventory.rows.map(r => [r.file, r.size, r.binary ? "binary" : "text"]), ["File","Size","Type"])}
`);
  await fs.writeFile(path.join(outDir, "ROUTES.md"),
`# ROUTES
Locales detected: ${data.routes.locales.join(", ") || "(none)"}

\`\`\`json
${JSON.stringify(data.routes.pages, null, 2)}
\`\`\`
`);
  await fs.writeFile(path.join(outDir, "I18N.md"),
`# I18N
Base dir: ${data.i18n.baseDir ?? "(not found)"}

\`\`\`json
${JSON.stringify(data.i18n.perLocale, null, 2)}
\`\`\`

## Missing vs en
\`\`\`json
${JSON.stringify(data.i18n.missing, null, 2)}
\`\`\`
`);
  await fs.writeFile(path.join(outDir, "SEO.md"),
`# SEO
Pages with generateMetadata:
- ${data.seo.generateMetadata.join("\n- ") || "(none)"}

Pages using JSON-LD:
- ${data.seo.jsonLdUsage.join("\n- ") || "(none)"}

Pages defining alternates.languages:
- ${data.seo.alternatesLang.join("\n- ") || "(none)"}
`);
  await fs.writeFile(path.join(outDir, "PERFORMANCE.md"),
`# PERFORMANCE
Dynamic imports:
- ${data.perf.dynamicImports.join("\n- ") || "(none)"}

Suspense usage:
- ${data.perf.suspenseUsage.join("\n- ") || "(none)"}

next/image imports:
- ${data.perf.nextImage.join("\n- ") || "(none)"}
`);
  await fs.writeFile(path.join(outDir, "SECURITY.md"),
`# SECURITY
process.env usage:
- ${data.sec.envUsage.join("\n- ") || "(none)"}

Headers in next.config:
- ${data.sec.headersConfig.join("\n- ") || "(none)"}

Middleware files:
- ${data.sec.middleware.join("\n- ") || "(none)"}
`);
  await fs.writeFile(path.join(outDir, "ENV.md"),
`# ENV
\`\`\`
${data.env.keys.join("\n") || "(none)"}
\`\`\`
`);
  await fs.writeFile(path.join(outDir, "CHECKS.md"),
`# CHECKS
\`\`\`json
${JSON.stringify(data.checks, null, 2)}
\`\`\`
`);
}

async function writeSingle(outFile, data) {
  const now = new Date().toISOString();
  const md =
`# XRAY REPORT
_Generated: ${now}_

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
Total files: ${data.inventory.summary.totalFiles}
Text files: ${data.inventory.summary.textFiles}
Binary files: ${data.inventory.summary.binaryFiles}
Total size: ${data.inventory.summary.totalSizeKB} KB

${table(data.inventory.rows.map(r => [r.file, r.size, r.binary ? "binary" : "text"]), ["File","Size","Type"])}

## Routes
Locales detected: ${data.routes.locales.join(", ") || "(none)"}

\`\`\`json
${JSON.stringify(data.routes.pages, null, 2)}
\`\`\`

## I18N
Base dir: ${data.i18n.baseDir ?? "(not found)"}

\`\`\`json
${JSON.stringify(data.i18n.perLocale, null, 2)}
\`\`\`

### Missing vs en
\`\`\`json
${JSON.stringify(data.i18n.missing, null, 2)}
\`\`\`

## SEO
Pages with generateMetadata:
- ${data.seo.generateMetadata.join("\n- ") || "(none)"}

Pages using JSON-LD:
- ${data.seo.jsonLdUsage.join("\n- ") || "(none)"}

Pages defining alternates.languages:
- ${data.seo.alternatesLang.join("\n- ") || "(none)"}

## Performance
Dynamic imports:
- ${data.perf.dynamicImports.join("\n- ") || "(none)"}

Suspense usage:
- ${data.perf.suspenseUsage.join("\n- ") || "(none)"}

next/image imports:
- ${data.perf.nextImage.join("\n- ") || "(none)"}

## Security
process.env usage:
- ${data.sec.envUsage.join("\n- ") || "(none)"}

Headers in next.config:
- ${data.sec.headersConfig.join("\n- ") || "(none)"}

Middleware files:
- ${data.sec.middleware.join("\n- ") || "(none)"}

## ENV
\`\`\`
${data.env.keys.join("\n") || "(none)"}
\`\`\`

## Checks
\`\`\`json
${JSON.stringify(data.checks, null, 2)}
\`\`\`
`;
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, md, "utf8");
}

/* ------------------------- Main ------------------------- */
(async function main() {
  const { out, single } = parseArgs();
  const [inventory, routes, i18n, seo, perf, sec, env, checks] = await Promise.all([
    collectInventory(), collectRoutes(), collectI18n(), collectSEO(),
    collectPerformance(), collectSecurity(), collectEnvKeys(), collectChecks()
  ]);
  const data = { inventory, routes, i18n, seo, perf, sec, env, checks };

  if (single) {
    const file = out.endsWith(".md") ? out : path.join(out, "REPORT.md");
    await writeSingle(file, data);
    console.log(`✔ XRAY single report -> ${rel(file)}`);
  } else {
    const dir = path.isAbsolute(out) ? out : path.join(projectRoot, out);
    await writeMulti(dir, data);
    console.log(`✔ XRAY reports directory -> ${rel(dir)}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });

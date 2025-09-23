#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const toPosix = (p) => p.split(path.sep).join("/");
const rel = (p) => toPosix(path.relative(projectRoot, p));

const TEXT_EXT = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".md",
  ".css",
  ".scss",
  ".sass",
  ".html",
  ".yml",
  ".yaml"
]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "reports",
  "dist",
  "build",
  ".turbo",
  ".vercel"
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const outIdx = args.indexOf("--out");
  const out = outIdx !== -1 ? args[outIdx + 1] : "reports";
  const single = args.includes("--single") || (out && out.endsWith(".md"));
  return { out, single };
}

async function walk(dir, bag = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return bag;
  }

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(abs, bag);
      continue;
    }
    bag.push(abs);
  }
  return bag;
}

function byFileAsc(a, b) {
  return a.file.localeCompare(b.file);
}

async function collectInventory() {
  const files = await walk(projectRoot, []);
  const entries = [];
  let totalSize = 0;
  for (const file of files) {
    let stat;
    try {
      stat = await fs.stat(file);
    } catch {
      continue;
    }
    totalSize += stat.size;
    const ext = path.extname(file) || "<none>";
    entries.push({
      file: rel(file),
      size: stat.size,
      ext,
      text: TEXT_EXT.has(ext.toLowerCase())
    });
  }

  entries.sort(byFileAsc);
  const textFiles = entries.filter((e) => e.text).length;
  const binaryFiles = entries.length - textFiles;

  return {
    summary: {
      totalFiles: entries.length,
      textFiles,
      binaryFiles,
      totalSizeKB: +(totalSize / 1024).toFixed(2)
    },
    entries
  };
}

async function collectPackageInfo() {
  const pkgPath = path.join(projectRoot, "package.json");
  try {
    const raw = await fs.readFile(pkgPath, "utf8");
    const pkg = JSON.parse(raw);
    return {
      path: rel(pkgPath),
      name: pkg.name ?? null,
      version: pkg.version ?? null,
      scripts: pkg.scripts ?? {},
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies ?? {}
    };
  } catch {
    return {
      path: null,
      name: null,
      version: null,
      scripts: {},
      dependencies: {},
      devDependencies: {}
    };
  }
}

function detectFramework(pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const frameworks = [];
  if (deps.next) frameworks.push("Next.js");
  if (deps.react) frameworks.push("React");
  if (deps["next-intl"]) frameworks.push("next-intl");
  if (deps["@tanstack/react-query"]) frameworks.push("TanStack Query");
  if (deps["@testing-library/react"]) frameworks.push("Testing Library");
  if (deps.tailwindcss) frameworks.push("Tailwind CSS");
  return frameworks;
}

async function collectStructure(pkg) {
  const files = await walk(projectRoot, []);
  const appFiles = [];
  const apiRoutes = [];
  const layouts = [];
  const metadataGenerators = [];
  const serverComponents = [];
  const clientComponents = [];

  for (const file of files) {
    const relFile = rel(file);
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;

    if (/\bapp\//.test(relFile) || /\bsrc\/app\//.test(relFile)) {
      if (/\/page\.tsx?$/.test(relFile)) appFiles.push(relFile);
      if (/\/layout\.tsx?$/.test(relFile)) layouts.push(relFile);
      if (/\/route\.ts$/.test(relFile)) apiRoutes.push(relFile);
    }

    let source;
    const getSource = async () => {
      if (source === undefined) {
        try {
          source = await fs.readFile(file, "utf8");
        } catch {
          source = null;
        }
      }
      return source;
    };

    const src = await getSource();
    if (src && /generateMetadata\s*\(/.test(src)) {
      metadataGenerators.push(relFile);
    }

    if (src && /['"]use client['"]/.test(src)) {
      clientComponents.push(relFile);
    } else if (src && /['"]use server['"]/.test(src)) {
      serverComponents.push(relFile);
    }
  }

  return {
    frameworks: detectFramework(pkg),
    pages: appFiles.sort(),
    layouts: layouts.sort(),
    apiRoutes: apiRoutes.sort(),
    metadataGenerators: metadataGenerators.sort(),
    serverComponents: serverComponents.sort(),
    clientComponents: clientComponents.sort()
  };
}

function flattenMessages(obj, prefix = "") {
  let total = 0;
  for (const key of Object.keys(obj ?? {})) {
    const next = obj[key];
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (next && typeof next === "object" && !Array.isArray(next)) {
      total += flattenMessages(next, nextKey);
    } else {
      total += 1;
    }
  }
  return total;
}

async function collectI18n() {
  const candidates = [
    "src/messages",
    "messages",
    "i18n/messages"
  ];

  let base = null;
  for (const candidate of candidates) {
    const abs = path.join(projectRoot, candidate);
    try {
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) {
        base = abs;
        break;
      }
    } catch {}
  }

  if (!base) {
    return {
      base: null,
      locales: {}
    };
  }

  const files = await fs.readdir(base);
  const locales = {};
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const abs = path.join(base, file);
    try {
      const raw = await fs.readFile(abs, "utf8");
      const json = JSON.parse(raw);
      const code = file.replace(/\.json$/, "");
      locales[code] = {
        file: rel(abs),
        keys: flattenMessages(json)
      };
    } catch {}
  }

  return {
    base: rel(base),
    locales
  };
}

async function collectContentSignals() {
  const files = await walk(projectRoot, []);
  const dynamicImports = [];
  const suspenseUsage = [];
  const jsonLd = [];
  const metadataFiles = [];
  const nextImageUsage = [];

  for (const file of files) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    const relFile = rel(file);
    if (source.includes("next/dynamic")) dynamicImports.push(relFile);
    if (/\bSuspense\b/.test(source)) suspenseUsage.push(relFile);
    if (/JsonLd/.test(source) || /ld\w+\s*=\s*{/.test(source)) jsonLd.push(relFile);
    if (/generateMetadata\s*\(/.test(source)) metadataFiles.push(relFile);
    if (/from\s+['"]next\/image['"]/.test(source)) nextImageUsage.push(relFile);
  }

  return {
    dynamicImports: [...new Set(dynamicImports)].sort(),
    suspenseUsage: [...new Set(suspenseUsage)].sort(),
    jsonLd: [...new Set(jsonLd)].sort(),
    metadataFiles: [...new Set(metadataFiles)].sort(),
    nextImageUsage: [...new Set(nextImageUsage)].sort()
  };
}

async function collectTests() {
  const files = await walk(projectRoot, []);
  const vitest = [];
  const playwright = [];
  const jest = [];

  for (const file of files) {
    const relFile = rel(file);
    if (/\.(test|spec)\.[cm]?[tj]sx?$/.test(relFile)) {
      vitest.push(relFile);
    }
    if (/\.e2e\.[cm]?[tj]sx?$/.test(relFile)) {
      playwright.push(relFile);
    }
    if (/jest\.config\./.test(relFile)) {
      jest.push(relFile);
    }
  }

  return {
    vitest: vitest.sort(),
    playwright: playwright.sort(),
    jest: jest.sort()
  };
}

async function collectLocalePages() {
  const files = await walk(projectRoot, []);
  const locales = new Set();
  const pages = [];

  const prefixes = ["app/", "src/app/"];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;

    const relFile = rel(file);
    const posix = toPosix(relFile);

    const prefix = prefixes.find((candidate) => posix.startsWith(candidate));
    if (!prefix) continue;

    if (!posix.startsWith(`${prefix}[`)) continue;

    const localeMatch = posix.slice(prefix.length).split("/")[0];
    if (!localeMatch || !/^\[[^/]+\]$/.test(localeMatch)) continue;

    locales.add(`${prefix}${localeMatch}`);

    if (!/\/page\.[cm]?[tj]sx?$/.test(posix)) continue;

    const routePath = `/${posix
      .slice(prefix.length)
      .replace(/\/page\.[^/]+$/, "")}`.replace(/\/+/g, "/");

    pages.push({
      file: relFile,
      route: routePath === "/" ? "/" : routePath
    });
  }

  pages.sort(byFileAsc);

  return {
    localeDirectories: [...locales].sort(),
    pages
  };
}

const CLIENT_ONLY_HOOKS = [
  "useRouter",
  "usePathname",
  "useSearchParams",
  "useParams",
  "useSelectedLayoutSegment",
  "useSelectedLayoutSegments"
];

async function collectClientHookMisuse() {
  const files = await walk(projectRoot, []);
  const issues = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;
    if (!/\.[cm]?[tj]sx?$/.test(ext)) continue;

    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    if (!/from\s+['"]next\/navigation['"]/.test(source)) {
      continue;
    }

    const trimmed = source.trimStart();
    const hasUseClient = /^(["'])use client\1;?/.test(trimmed);
    if (hasUseClient) continue;

    const hooks = CLIENT_ONLY_HOOKS.filter((hook) => new RegExp(`\\b${hook}\\b`).test(source));
    if (!hooks.length) continue;

    issues.push({
      file: rel(file),
      hooks: [...new Set(hooks)].sort()
    });
  }

  issues.sort(byFileAsc);
  return issues;
}

const NEXT_CONFIG_FILES = [
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
  "next.config.ts"
];

const NEXT_FLAG_PATTERNS = [
  { key: "reactStrictMode", label: "reactStrictMode: true", regex: /reactStrictMode\s*:\s*true/ },
  { key: "poweredByHeader", label: "poweredByHeader: false", regex: /poweredByHeader\s*:\s*false/ },
  { key: "productionBrowserSourceMaps", label: "productionBrowserSourceMaps: false", regex: /productionBrowserSourceMaps\s*:\s*false/ },
  { key: "swcMinify", label: "swcMinify: true", regex: /swcMinify\s*:\s*true/ },
  { key: "removeConsole", label: "compiler.removeConsole", regex: /removeConsole\s*:/ },
  { key: "serverActions", label: "experimental.serverActions", regex: /experimental[\s\S]*serverActions/ },
  { key: "typedRoutes", label: "experimental.typedRoutes", regex: /experimental[\s\S]*typedRoutes/ },
  { key: "optimizePackageImports", label: "experimental.optimizePackageImports", regex: /experimental[\s\S]*optimizePackageImports/ },
  { key: "strictNextHead", label: "experimental.strictNextHead", regex: /experimental[\s\S]*strictNextHead/ },
  { key: "headers", label: "headers() defined", regex: /headers\s*:\s*async\s*\(|export\s+async\s+function\s+headers/ }
];

async function collectNextConfigFlags() {
  const results = [];

  for (const candidate of NEXT_CONFIG_FILES) {
    const abs = path.join(projectRoot, candidate);
    let source;
    try {
      source = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    const flags = [];
    for (const { label, regex } of NEXT_FLAG_PATTERNS) {
      if (regex.test(source)) {
        flags.push(label);
      }
    }

    results.push({
      file: rel(abs),
      flags: flags.sort()
    });
  }

  return results;
}

async function collectMiddlewareChecks() {
  const files = await walk(projectRoot, []);
  const matches = [];

  for (const file of files) {
    const base = path.basename(file);
    if (!/^middleware\.[cm]?[tj]s$/.test(base)) continue;

    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    const matcherRegex = /matcher\s*:\s*\[([^\]]*)\]/;
    const matcherMatch = matcherRegex.exec(source);
    const matchers = matcherMatch
      ? matcherMatch[1]
          .split(",")
          .map((token) => token.replace(/['"`]/g, "").trim())
          .filter(Boolean)
      : [];

    matches.push({
      file: rel(file),
      hasMatcher: matcherMatch !== null,
      matchers
    });
  }

  matches.sort(byFileAsc);
  return matches;
}

async function collectSEO() {
  const files = await walk(projectRoot, []);
  const metadataFunctions = new Set();
  const metadataExports = new Set();
  const alternates = new Set();
  const jsonLd = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;

    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    const relFile = rel(file);

    if (/generateMetadata\s*\(/.test(source)) {
      metadataFunctions.add(relFile);
    }

    if (/export\s+const\s+metadata\s*=/.test(source)) {
      metadataExports.add(relFile);
    }

    if (/alternates\s*:\s*{[\s\S]*languages\s*:/m.test(source)) {
      alternates.add(relFile);
    }

    if (/JsonLd/.test(source) || /ld\w+\s*=\s*{/.test(source)) {
      jsonLd.add(relFile);
    }
  }

  const toSorted = (set) => [...set].sort();

  return {
    metadataFunctions: toSorted(metadataFunctions),
    metadataExports: toSorted(metadataExports),
    alternatesLanguages: toSorted(alternates),
    structuredData: toSorted(jsonLd)
  };
}

async function collectSecuritySignals() {
  const files = await walk(projectRoot, []);
  const envUsage = new Set();
  const secureCookies = new Set();
  const headerDefinitions = new Set();
  const protectionSignals = new Set();

  const headerRegex = /(content-security-policy|strict-transport-security|x-frame-options|x-content-type-options)/i;
  const cookieRegex = /(httpOnly|secure|sameSite)\s*:\s*(true|['"`][^'"`]+['"`])/;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!TEXT_EXT.has(ext)) continue;

    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    const relFile = rel(file);

    if (/process\.env/.test(source)) {
      envUsage.add(relFile);
    }

    if (cookieRegex.test(source)) {
      secureCookies.add(relFile);
    }

    if (headerRegex.test(source)) {
      headerDefinitions.add(relFile);
    }

    if (/csrf/i.test(source) || /turnstile/i.test(source) || /rateLimit/i.test(source)) {
      protectionSignals.add(relFile);
    }
  }

  const toSorted = (set) => [...set].sort();

  return {
    envUsage: toSorted(envUsage),
    secureCookies: toSorted(secureCookies),
    securityHeaders: toSorted(headerDefinitions),
    protection: toSorted(protectionSignals)
  };
}

async function collectRobotsSitemap() {
  const files = await walk(projectRoot, []);
  const robots = new Set();
  const sitemap = new Set();
  const configs = new Set();

  for (const file of files) {
    const base = path.basename(file);
    const relFile = rel(file);

    if (/^robots\.[cm]?[tj]sx?$/.test(base)) {
      robots.add(relFile);
    }

    if (/^sitemap\.[cm]?[tj]sx?$/.test(base)) {
      sitemap.add(relFile);
    }

    if (/next-sitemap\.config\.[cm]?js$/.test(base)) {
      configs.add(relFile);
    }
  }

  return {
    robots: [...robots].sort(),
    sitemap: [...sitemap].sort(),
    nextSitemapConfig: [...configs].sort()
  };
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = "";

  for (const char of value) {
    if (char === "(" || char === "{" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "}" || char === "]") {
      depth = Math.max(0, depth - 1);
    } else if (char === "," && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function extractTranslationKeys(content) {
  const translatorMap = new Map();

  const useTranslationsRegex = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*useTranslations\s*\(\s*(?:(['"`])([^'"`]+)\2)?\s*\)/g;
  let match;

  while ((match = useTranslationsRegex.exec(content)) !== null) {
    const variable = match[1];
    const namespace = match[3] ?? "";
    translatorMap.set(variable, namespace);
  }

  const getTranslationsRegex = /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:await\s*)?getTranslations\s*\(\s*\{([\s\S]*?)\}\s*\)/g;

  while ((match = getTranslationsRegex.exec(content)) !== null) {
    const variable = match[1];
    const options = match[2];
    const namespaceMatch = /namespace\s*:\s*['"`]([^'"`]+)['"`]/.exec(options);
    if (namespaceMatch) {
      translatorMap.set(variable, namespaceMatch[1]);
    }
  }

  const destructuredRegex = /const\s*\[\s*([^\]]+)\s*\]\s*=\s*await\s*Promise\.all\s*\(\s*\[([\s\S]*?)\]\s*\)/g;

  while ((match = destructuredRegex.exec(content)) !== null) {
    const variableList = splitTopLevel(match[1]);
    const expressionList = splitTopLevel(match[2]);

    expressionList.forEach((expression, index) => {
      const namespaceMatch = /getTranslations\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(expression);
      if (!namespaceMatch) return;

      const options = namespaceMatch[1];
      const namespace = /namespace\s*:\s*['"`]([^'"`]+)['"`]/.exec(options)?.[1];
      const variable = variableList[index]?.replace(/\s+/g, "");

      if (namespace && variable) {
        translatorMap.set(variable, namespace);
      }
    });
  }

  const keys = new Set();

  for (const [variable, namespace] of translatorMap) {
    const pattern = escapeRegex(variable) + "\\s*\\(\\s*(['\"`])([^'\"`]+)\\1";
    const callRegex = new RegExp(pattern, "g");
    let callMatch;

    while ((callMatch = callRegex.exec(content)) !== null) {
      const keyPart = callMatch[2];
      if (keyPart.includes("${")) continue;
      const key = namespace ? `${namespace}.${keyPart}` : keyPart;
      keys.add(key);
    }
  }

  const directRegex = /\bt\s*\(\s*(['"`])([^'"`]+)\1/g;

  while ((match = directRegex.exec(content)) !== null) {
    const fullKey = match[2];
    if (!fullKey.includes("${") && fullKey.includes(".")) {
      keys.add(fullKey);
    }
  }

  return keys;
}

async function collectI18nUsedKeys() {
  const files = await walk(projectRoot, []);
  const usage = [];
  const uniqueKeys = new Set();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!/\.[cm]?[tj]sx?$/.test(ext)) continue;

    const relFile = rel(file);
    const posix = toPosix(relFile);
    if (!posix.startsWith("src/")) continue;

    let source;
    try {
      source = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }

    const keys = extractTranslationKeys(source);
    if (keys.size === 0) continue;

    const sortedKeys = [...keys].sort();
    sortedKeys.forEach((key) => uniqueKeys.add(key));
    usage.push({
      file: relFile,
      keys: sortedKeys
    });
  }

  usage.sort(byFileAsc);

  return {
    files: usage,
    totalKeys: uniqueKeys.size,
    keys: [...uniqueKeys].sort()
  };
}

const CHECKS = [
  {
    id: "error-boundary",
    label: "Has app-level error boundary",
    patterns: ["app/error.tsx", "src/app/error.tsx"],
    type: "file"
  },
  {
    id: "global-error",
    label: "Has global-error.tsx",
    patterns: ["app/global-error.tsx", "src/app/global-error.tsx"],
    type: "file"
  },
  {
    id: "loading-ui",
    label: "Has loading.tsx fallback",
    patterns: ["app/loading.tsx", "src/app/loading.tsx"],
    type: "file"
  },
  {
    id: "contact-route",
    label: "Contact API route implements Turnstile verification",
    patterns: ["app/api/contact/route.ts", "src/app/api/contact/route.ts"],
    type: "turnstile"
  },
  {
    id: "locale-switcher",
    label: "Locale switcher preserves hash and scroll state",
    patterns: ["LocaleSwitcher.tsx"],
    type: "locale"
  },
  {
    id: "sitemap",
    label: "Has sitemap configuration",
    patterns: ["next-sitemap.config.js", "next-sitemap.config.mjs"],
    type: "file"
  }
];

async function collectChecks() {
  const files = await walk(projectRoot, []);
  const relFiles = files.map((file) => ({ abs: file, rel: rel(file) }));

  const results = [];
  for (const check of CHECKS) {
    if (check.type === "file") {
      const found = check.patterns.some((pattern) => {
        return relFiles.some(({ rel }) => rel.endsWith(pattern));
      });
      results.push({ id: check.id, label: check.label, status: found });
      continue;
    }

    if (check.type === "turnstile") {
      const match = relFiles.find(({ rel }) => check.patterns.some((pattern) => rel.endsWith(pattern)));
      if (!match) {
        results.push({ id: check.id, label: check.label, status: false });
        continue;
      }
      try {
        const source = await fs.readFile(match.abs, "utf8");
        const hasTurnstile = /turnstile/i.test(source) && /siteverify/.test(source);
        results.push({ id: check.id, label: check.label, status: hasTurnstile, file: match.rel });
      } catch {
        results.push({ id: check.id, label: check.label, status: false });
      }
      continue;
    }

    if (check.type === "locale") {
      const match = relFiles.find(({ rel }) => rel.endsWith(check.patterns[0]));
      if (!match) {
        results.push({ id: check.id, label: check.label, status: false });
        continue;
      }
      try {
        const source = await fs.readFile(match.abs, "utf8");
        const preservesHash = /location\.hash/.test(source);
        const preservesScroll = /scroll\s*:\s*false/.test(source);
        results.push({
          id: check.id,
          label: check.label,
          status: preservesHash && preservesScroll,
          file: match.rel
        });
      } catch {
        results.push({ id: check.id, label: check.label, status: false });
      }
    }
  }

  return results;
}

function mdTable(rows, headers) {
  if (!rows.length) return "_No data_\n";
  const widths = headers.map((header, index) => Math.max(header.length, ...rows.map((row) => String(row[index]).length)));
  const render = (row) => row.map((value, index) => String(value).padEnd(widths[index])).join("  ");
  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  return `${render(headers)}\n${separator}\n${rows.map(render).join("\n")}\n`;
}

async function writeDirectory(outDir, payload) {
  await fs.mkdir(outDir, { recursive: true });

  const inventoryRows = payload.inventory.entries.map((entry) => [entry.file, entry.ext, entry.size, entry.text ? "text" : "binary"]);
  const inventoryMd = `# INVENTORY\nTotal files: ${payload.inventory.summary.totalFiles}\nText files: ${payload.inventory.summary.textFiles}\nBinary files: ${payload.inventory.summary.binaryFiles}\nTotal size: ${payload.inventory.summary.totalSizeKB} KB\n\n${mdTable(inventoryRows, ["File", "Ext", "Size", "Type"])}\n`;
  await fs.writeFile(path.join(outDir, "INVENTORY.md"), inventoryMd, "utf8");

  const pkg = payload.package;
  const pkgMd = `# PACKAGE\nPath: ${pkg.path ?? "(missing)"}\nName: ${pkg.name ?? "(unknown)"}\nVersion: ${pkg.version ?? "(unknown)"}\n\n## Scripts\n\n\`\`\`json\n${JSON.stringify(pkg.scripts, null, 2)}\n\`\`\`\n\n## Dependencies\n\n\`\`\`json\n${JSON.stringify(pkg.dependencies, null, 2)}\n\`\`\`\n\n## Dev Dependencies\n\n\`\`\`json\n${JSON.stringify(pkg.devDependencies, null, 2)}\n\`\`\`\n`;
  await fs.writeFile(path.join(outDir, "PACKAGE.md"), pkgMd, "utf8");

  const structureRows = [
    ["Frameworks", payload.structure.frameworks.join(", ") || "(none)"],
    ["Pages", payload.structure.pages.length],
    ["Layouts", payload.structure.layouts.length],
    ["API Routes", payload.structure.apiRoutes.length],
    ["Metadata functions", payload.structure.metadataGenerators.length],
    ["Client components", payload.structure.clientComponents.length],
    ["Server components", payload.structure.serverComponents.length]
  ];
  const structureMd = `# STRUCTURE\n${mdTable(structureRows, ["Item", "Value"])}\n\n## Pages\n- ${payload.structure.pages.join("\n- ") || "(none)"}\n\n## Layouts\n- ${payload.structure.layouts.join("\n- ") || "(none)"}\n\n## API Routes\n- ${payload.structure.apiRoutes.join("\n- ") || "(none)"}\n`;
  await fs.writeFile(path.join(outDir, "STRUCTURE.md"), structureMd, "utf8");

  const intlMd = `# I18N\nBase directory: ${payload.i18n.base ?? "(not found)"}\n\n\`\`\`json\n${JSON.stringify(payload.i18n.locales, null, 2)}\n\`\`\`\n`;
  await fs.writeFile(path.join(outDir, "I18N.md"), intlMd, "utf8");

  const contentMd = `# CONTENT\nDynamic imports:\n- ${payload.content.dynamicImports.join("\n- ") || "(none)"}\n\nSuspense usage:\n- ${payload.content.suspenseUsage.join("\n- ") || "(none)"}\n\nJSON-LD usage:\n- ${payload.content.jsonLd.join("\n- ") || "(none)"}\n\nMetadata generators:\n- ${payload.content.metadataFiles.join("\n- ") || "(none)"}\n\nnext/image usage:\n- ${payload.content.nextImageUsage.join("\n- ") || "(none)"}\n`;
  await fs.writeFile(path.join(outDir, "CONTENT.md"), contentMd, "utf8");

  const testsMd = `# TESTS\nVitest files:\n- ${payload.tests.vitest.join("\n- ") || "(none)"}\n\nPlaywright files:\n- ${payload.tests.playwright.join("\n- ") || "(none)"}\n\nJest configs:\n- ${payload.tests.jest.join("\n- ") || "(none)"}\n`;
  await fs.writeFile(path.join(outDir, "TESTS.md"), testsMd, "utf8");

  const checksMd = `# CHECKS\n\`\`\`json\n${JSON.stringify(payload.checks, null, 2)}\n\`\`\`\n`;
  await fs.writeFile(path.join(outDir, "CHECKS.md"), checksMd, "utf8");

  const localeDirList = payload.localePages.localeDirectories.length
    ? payload.localePages.localeDirectories.map((dir) => `- ${dir}`).join("\n")
    : "- (none)";
  const localePageRows = payload.localePages.pages.map((entry) => [entry.file, entry.route]);
  const localeMd = `# LOCALE ROUTES\n## Locale Directories\n${localeDirList}\n\n## Pages\n${mdTable(localePageRows, ["File", "Route"])}`;
  await fs.writeFile(path.join(outDir, "LOCALE-ROUTES.md"), localeMd, "utf8");

  const guardRows = payload.clientHookMisuse.map((entry) => [entry.file, entry.hooks.join(", ")]);
  const guardsMd = `# MISSING GUARDS\nFiles using client-only hooks without a \\\"use client\\\" directive.\n\n${mdTable(guardRows, ["File", "Hooks"])}\n`;
  await fs.writeFile(path.join(outDir, "MISSING-GUARDS.md"), guardsMd, "utf8");

  const nextFlagRows = payload.nextConfigFlags.map((entry) => [entry.file, entry.flags.length ? entry.flags.join(", ") : "(none)"]);
  const securityUsageRows = [
    ["Environment variable usage", payload.security.envUsage.length],
    ["Secure cookie options", payload.security.secureCookies.length],
    ["Security header definitions", payload.security.securityHeaders.length],
    ["Protection signals", payload.security.protection.length]
  ];
  const securitySections = [
    { title: "Environment variable usage", values: payload.security.envUsage },
    { title: "Secure cookie options", values: payload.security.secureCookies },
    { title: "Security header definitions", values: payload.security.securityHeaders },
    { title: "Protection signals", values: payload.security.protection }
  ]
    .map(({ title, values }) => {
      const list = values.length ? values.map((value) => `- ${value}`).join("\n") : "- (none)";
      return `### ${title}\n${list}`;
    })
    .join("\n\n");
  const securityMd = `# SECURITY\n## Next Config Flags\n${mdTable(nextFlagRows, ["File", "Flags"])}\n## Usage Signals\n${mdTable(securityUsageRows, ["Signal", "Count"])}\n\n${securitySections}\n`;
  await fs.writeFile(path.join(outDir, "SECURITY.md"), securityMd, "utf8");

  const middlewareRows = payload.middleware.map((entry) => [entry.file, entry.hasMatcher ? "yes" : "no", entry.matchers.join(", ") || "(none)"]);
  const middlewareMd = `# MIDDLEWARE\n${mdTable(middlewareRows, ["File", "Has matcher", "Matchers"])}\n`;
  await fs.writeFile(path.join(outDir, "MIDDLEWARE.md"), middlewareMd, "utf8");

  const seoCountRows = [
    ["generateMetadata functions", payload.seo.metadataFunctions.length],
    ["metadata exports", payload.seo.metadataExports.length],
    ["alternate languages", payload.seo.alternatesLanguages.length],
    ["structured data snippets", payload.seo.structuredData.length]
  ];
  const seoDetails = [
    { title: "generateMetadata functions", values: payload.seo.metadataFunctions },
    { title: "metadata exports", values: payload.seo.metadataExports },
    { title: "alternate languages", values: payload.seo.alternatesLanguages },
    { title: "structured data snippets", values: payload.seo.structuredData }
  ]
    .map(({ title, values }) => {
      const list = values.length ? values.map((value) => `- ${value}`).join("\n") : "- (none)";
      return `### ${title}\n${list}`;
    })
    .join("\n\n");
  const seoMd = `# SEO\n${mdTable(seoCountRows, ["Signal", "Count"])}\n\n${seoDetails}\n`;
  await fs.writeFile(path.join(outDir, "SEO.md"), seoMd, "utf8");

  const robotsSections = [
    { title: "robots handlers", values: payload.robots.robots },
    { title: "sitemap handlers", values: payload.robots.sitemap },
    { title: "next-sitemap configs", values: payload.robots.nextSitemapConfig }
  ]
    .map(({ title, values }) => {
      const list = values.length ? values.map((value) => `- ${value}`).join("\n") : "- (none)";
      return `## ${title.charAt(0).toUpperCase()}${title.slice(1)}\n${list}`;
    })
    .join("\n\n");
  const robotsMd = `# ROBOTS & SITEMAP\n${robotsSections}\n`;
  await fs.writeFile(path.join(outDir, "ROBOTS.md"), robotsMd, "utf8");

  const i18nUsageRows = payload.i18nUsage.files.map((entry) => [entry.file, entry.keys.length]);
  const keysList = payload.i18nUsage.keys.length
    ? payload.i18nUsage.keys.map((key) => `- ${key}`).join("\n")
    : "- (none)";
  const perFileDetails = payload.i18nUsage.files
    .map((entry) => {
      const list = entry.keys.length ? entry.keys.map((key) => `- ${key}`).join("\n") : "- (none)";
      return `### ${entry.file}\n${list}`;
    })
    .join("\n\n");
  const i18nUsageMd = `# I18N KEY SUMMARY\nTotal unique keys: ${payload.i18nUsage.totalKeys}\nFiles with usage: ${payload.i18nUsage.files.length}\n\n## Usage by File\n${mdTable(i18nUsageRows, ["File", "Keys used"])}\n\n## All Keys\n${keysList}\n\n${perFileDetails}\n`;
  await fs.writeFile(path.join(outDir, "I18N-USAGE.md"), i18nUsageMd, "utf8");
}

function renderSingleReport(payload) {
  const now = new Date().toISOString();
  const inventoryRows = payload.inventory.entries.map((entry) => [entry.file, entry.ext, entry.size, entry.text ? "text" : "binary"]);

  return `# XRAY REPORT\n_Generated: ${now}_\n\n## Table of Contents\n1. [Inventory](#inventory)\n2. [Package](#package)\n3. [Structure](#structure)\n4. [I18N](#i18n)\n5. [Content](#content)\n6. [Tests](#tests)\n7. [Checks](#checks)\n\n---\n\n## Inventory\nTotal files: ${payload.inventory.summary.totalFiles}\nText files: ${payload.inventory.summary.textFiles}\nBinary files: ${payload.inventory.summary.binaryFiles}\nTotal size: ${payload.inventory.summary.totalSizeKB} KB\n\n${mdTable(inventoryRows, ["File", "Ext", "Size", "Type"])}\n\n## Package\nPath: ${payload.package.path ?? "(missing)"}\nName: ${payload.package.name ?? "(unknown)"}\nVersion: ${payload.package.version ?? "(unknown)"}\n\n### Scripts\n\n\`\`\`json\n${JSON.stringify(payload.package.scripts, null, 2)}\n\`\`\`\n\n### Dependencies\n\n\`\`\`json\n${JSON.stringify(payload.package.dependencies, null, 2)}\n\`\`\`\n\n### Dev Dependencies\n\n\`\`\`json\n${JSON.stringify(payload.package.devDependencies, null, 2)}\n\`\`\`\n\n## Structure\nFrameworks: ${payload.structure.frameworks.join(", ") || "(none)"}\n\nPages:\n- ${payload.structure.pages.join("\n- ") || "(none)"}\n\nLayouts:\n- ${payload.structure.layouts.join("\n- ") || "(none)"}\n\nAPI Routes:\n- ${payload.structure.apiRoutes.join("\n- ") || "(none)"}\n\nMetadata generators:\n- ${payload.structure.metadataGenerators.join("\n- ") || "(none)"}\n\nClient components:\n- ${payload.structure.clientComponents.join("\n- ") || "(none)"}\n\nServer components:\n- ${payload.structure.serverComponents.join("\n- ") || "(none)"}\n\n## I18N\nBase directory: ${payload.i18n.base ?? "(not found)"}\n\n\`\`\`json\n${JSON.stringify(payload.i18n.locales, null, 2)}\n\`\`\`\n\n## Content\nDynamic imports:\n- ${payload.content.dynamicImports.join("\n- ") || "(none)"}\n\nSuspense usage:\n- ${payload.content.suspenseUsage.join("\n- ") || "(none)"}\n\nJSON-LD usage:\n- ${payload.content.jsonLd.join("\n- ") || "(none)"}\n\nMetadata generators:\n- ${payload.content.metadataFiles.join("\n- ") || "(none)"}\n\nnext/image usage:\n- ${payload.content.nextImageUsage.join("\n- ") || "(none)"}\n\n## Tests\nVitest files:\n- ${payload.tests.vitest.join("\n- ") || "(none)"}\n\nPlaywright files:\n- ${payload.tests.playwright.join("\n- ") || "(none)"}\n\nJest configs:\n- ${payload.tests.jest.join("\n- ") || "(none)"}\n\n## Checks\n\`\`\`json\n${JSON.stringify(payload.checks, null, 2)}\n\`\`\`\n`;
}

async function writeSingle(outFile, payload) {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const report = renderSingleReport(payload);
  await fs.writeFile(outFile, report, "utf8");
}

async function main() {
  const { out, single } = parseArgs();

  const packageInfo = await collectPackageInfo();
  const [
    inventory,
    structure,
    i18n,
    content,
    tests,
    checks,
    localePages,
    clientHookMisuse,
    nextConfigFlags,
    middleware,
    seo,
    security,
    robots,
    i18nUsage
  ] = await Promise.all([
    collectInventory(),
    collectStructure(packageInfo),
    collectI18n(),
    collectContentSignals(),
    collectTests(),
    collectChecks(),
    collectLocalePages(),
    collectClientHookMisuse(),
    collectNextConfigFlags(),
    collectMiddlewareChecks(),
    collectSEO(),
    collectSecuritySignals(),
    collectRobotsSitemap(),
    collectI18nUsedKeys()
  ]);

  const payload = {
    inventory,
    package: packageInfo,
    structure,
    i18n,
    content,
    tests,
    checks,
    localePages,
    clientHookMisuse,
    nextConfigFlags,
    middleware,
    seo,
    security,
    robots,
    i18nUsage
  };

  if (single) {
    const outFile = out.endsWith(".md") ? out : path.join(out, "REPORT.md");
    await writeSingle(path.isAbsolute(outFile) ? outFile : path.join(projectRoot, outFile), payload);
    console.log(`✔ XRAY single report -> ${rel(path.isAbsolute(outFile) ? outFile : path.join(projectRoot, outFile))}`);
    return;
  }

  const outDir = path.isAbsolute(out) ? out : path.join(projectRoot, out);
  await writeDirectory(outDir, payload);
  console.log(`✔ XRAY reports directory -> ${rel(outDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

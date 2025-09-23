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
  const [inventory, structure, i18n, content, tests, checks] = await Promise.all([
    collectInventory(),
    collectStructure(packageInfo),
    collectI18n(),
    collectContentSignals(),
    collectTests(),
    collectChecks()
  ]);

  const payload = {
    inventory,
    package: packageInfo,
    structure,
    i18n,
    content,
    tests,
    checks
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

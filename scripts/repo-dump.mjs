#!/usr/bin/env node
import {promises as fs} from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const toPosix = (p) => p.split(path.sep).join('/');
const rel = (p) => toPosix(path.relative(projectRoot, p));
const nowIso = () => new Date().toISOString();

const DEFAULT_IGNORES = new Set([
  'node_modules', '.next', '.git', 'dist', 'build', '.turbo', '.vercel', 'coverage', 'reports'
]);

const TEXT_EXT = new Set([
  '.js','.mjs','.cjs','.ts','.tsx','.jsx',
  '.json','.md','.css','.scss','.sass','.less',
  '.html','.htm','.yml','.yaml','.env','.env.local','.env.example',
  '.txt','.svg','.gitignore','.gitattributes'
]);

const FENCE = {
  '.ts':'ts', '.tsx':'tsx', '.js':'js', '.jsx':'jsx', '.mjs':'js', '.cjs':'js',
  '.json':'json', '.md':'md', '.css':'css', '.scss':'scss', '.sass':'sass', '.less':'less',
  '.html':'html', '.htm':'html', '.yml':'yaml', '.yaml':'yaml', '.svg':'xml',
  '.sh':'bash', '.bat':'bat', '.ps1':'powershell', '.env':'ini', '.env.local':'ini', '.txt':''
};

function parseArgs() {
  const a = process.argv.slice(2);
  const get = (flag, def) => {
    const i = a.indexOf(flag);
    return i !== -1 ? a[i+1] : def;
  };
  const has = (flag) => a.includes(flag);

  const out = get('--out', 'reports'); // dir or single .md
  const single = has('--single') || (out && out.toLowerCase().endsWith('.md'));
  return {
    root: path.resolve(get('--root', projectRoot)),
    out,
    single,
    split: has('--split'),
    includeDotfiles: has('--include-dotfiles'),
    includeBinaries: has('--include-binaries'),
    b64Binaries: has('--b64-binaries'),
    includeEnv: has('--include-env'),
    includeAll: has('--include-all'), // disable default ignores
    maxBytes: Number(get('--max-bytes', '0')) || 0 // 0 = no limit
  };
}

async function walk(dir, opts, bag = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, {withFileTypes: true});
  } catch {
    return bag;
  }

  for (const entry of entries) {
    const name = entry.name;
    if (!opts.includeDotfiles && name.startsWith('.')) continue;

    if (!opts.includeAll && DEFAULT_IGNORES.has(name)) continue;

    const abs = path.join(dir, name);
    if (entry.isDirectory()) {
      await walk(abs, opts, bag);
    } else {
      bag.push(abs);
    }
  }
  return bag;
}

function isEnvPath(p) {
  const b = path.basename(p);
  return b === '.env' || b.startsWith('.env.');
}

function isTextLike(file) {
  const ext = path.extname(file).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  // treat unknown as text if size small (heuristic) — real binary handled later
  return false;
}

// crude binary detection by scanning null bytes in first chunk
async function isBinaryFile(abs) {
  try {
    const fd = await fs.open(abs, 'r');
    const buf = Buffer.alloc(1024);
    const {bytesRead} = await fd.read(buf, 0, buf.length, 0);
    await fd.close();
    const slice = buf.subarray(0, bytesRead);
    for (let i = 0; i < slice.length; i++) {
      const c = slice[i];
      if (c === 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}

function codeFenceFor(file) {
  const ext = path.extname(file).toLowerCase();
  return FENCE[ext] ?? '';
}

function mdEscape(text) {
  return text.replace(/\u0000/g, ''); // strip nulls if any
}

function renderTree(files, root) {
  // simple indented tree by directories
  const tree = {};
  for (const abs of files) {
    const r = rel(abs);
    const parts = r.split('/');
    let node = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] || {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = null;
  }

  function walkNode(node, prefix = '') {
    const keys = Object.keys(node).sort((a,b) => {
      const da = node[a] && typeof node[a] === 'object';
      const db = node[b] && typeof node[b] === 'object';
      if (da !== db) return da ? -1 : 1;
      return a.localeCompare(b);
    });

    let out = '';
    for (const k of keys) {
      const child = node[k];
      const isDir = child && typeof child === 'object';
      out += `${prefix}- ${k}${isDir ? '/' : ''}\n`;
      if (isDir) out += walkNode(child, prefix + '  ');
    }
    return out;
  }

  return `# Repository Tree\n_Root: ${root}_\n_Generated: ${nowIso()}_\n\n${walkNode(tree)}`;
}

async function buildDump(opts) {
  const files = await walk(opts.root, opts);
  files.sort((a,b) => rel(a).localeCompare(rel(b)));

  const rows = [];
  let totalSize = 0;

  const sections = []; // for ALL_FILES.md or single dump

  for (const abs of files) {
    let stat;
    try { stat = await fs.stat(abs); } catch { continue; }
    totalSize += stat.size;

    const r = rel(abs);
    const ext = path.extname(abs).toLowerCase();
    const textLike = isTextLike(abs);
    const envFile = isEnvPath(abs);

    let includeContent = true;
    let reason = '';

    if (envFile && !opts.includeEnv) {
      includeContent = false;
      reason = '(skipped content: .env by default — pass --include-env to include)';
    }

    let binary = false;
    if (!textLike) {
      binary = await isBinaryFile(abs);
      if (binary && !opts.includeBinaries) {
        includeContent = false;
        reason = '(skipped content: binary — pass --include-binaries to include; optionally --b64-binaries)';
      }
    }

    let header = `### ${r}\n_Size:_ ${stat.size} bytes\n`;
    if (!includeContent) {
      sections.push(`${header}${reason}\n`);
    } else {
      let contentBuf = await fs.readFile(abs);
      if (opts.maxBytes > 0 && contentBuf.length > opts.maxBytes) {
        contentBuf = contentBuf.subarray(0, opts.maxBytes);
        reason = `\n> NOTE: truncated to ${opts.maxBytes} bytes (pass --max-bytes 0 for full)`;
      }

      if (binary && opts.includeBinaries) {
        if (opts.b64Binaries) {
          const b64 = contentBuf.toString('base64');
          sections.push(`${header}_Encoding:_ base64\n\`\`\`\n${b64}\n\`\`\`\n`);
        } else {
          sections.push(`${header}_Binary file included as raw bytes preview disabled._\n`);
        }
      } else {
        const fence = codeFenceFor(abs);
        const text = mdEscape(contentBuf.toString('utf8'));
        sections.push(`${header}\`\`\`${fence}\n${text}\n\`\`\`\n${reason}\n`);
      }
    }

    rows.push([r, ext || '<none>', stat.size, includeContent ? 'included' : 'listed']);
  }

  const treeMd = renderTree(files, opts.root);
  const inventoryMd =
`# Inventory\nGenerated: ${nowIso()}

Total files: ${files.length}
Total size : ${(totalSize/1024).toFixed(2)} KB

| File | Ext | Bytes | Mode |
|------|-----|-------|------|
${rows.map(r => `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} |`).join('\n')}
`;

  return {treeMd, sections, inventoryMd};
}

async function writeOutputs(opts) {
  const {treeMd, sections, inventoryMd} = await buildDump(opts);

  const ensureDir = async (p) => fs.mkdir(p, {recursive: true});

  if (opts.single) {
    const outFile = path.isAbsolute(opts.out) ? opts.out : path.join(opts.root, opts.out);
    await ensureDir(path.dirname(outFile));
    const single =
`# REPOSITORY DUMP
_Generated: ${nowIso()}_

## 1) Tree
${treeMd}

## 2) Inventory
${inventoryMd}

## 3) Files (full contents)
${sections.join('\n')}
`;
    await fs.writeFile(outFile, single, 'utf8');
    console.log(`✔ Single dump -> ${rel(outFile)}`);
    return;
  }

  // Directory mode
  const outDir = path.isAbsolute(opts.out) ? opts.out : path.join(opts.root, opts.out);
  await ensureDir(outDir);
  await fs.writeFile(path.join(outDir, 'REPO-TREE.md'), treeMd + '\n', 'utf8');
  await fs.writeFile(path.join(outDir, 'ALL_FILES.md'),
    `# ALL FILES (Full contents)\n_Generated: ${nowIso()}_\n\n${sections.join('\n')}`, 'utf8');
  await fs.writeFile(path.join(outDir, 'INVENTORY.md'), inventoryMd, 'utf8');

  if (opts.split) {
    for (const section of sections) {
      // section starts with "### path"
      const m = /^### (.+)\n/m.exec(section);
      if (!m) continue;
      const fileRel = m[1];
      const target = path.join(outDir, 'files', fileRel + '.md');
      await ensureDir(path.dirname(target));
      await fs.writeFile(target, section, 'utf8');
    }
  }

  console.log(`✔ Wrote:\n- ${rel(path.join(outDir, 'REPO-TREE.md'))}\n- ${rel(path.join(outDir, 'ALL_FILES.md'))}\n- ${rel(path.join(outDir, 'INVENTORY.md'))}${'\n'}${opts.split ? `- ${rel(path.join(outDir, 'files/'))} (per-file .md)` : ''}`);
}

(async function main() {
  try {
    const opts = parseArgs();
    await writeOutputs(opts);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

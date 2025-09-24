#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const MESSAGES_DIR = path.join(SRC_DIR, 'messages');
const EN_LOCALE = 'en.json';

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&');
}

function splitTopLevel(value) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(' || char === '{' || char === '[') {
      depth += 1;
    } else if (char === ')' || char === '}' || char === ']') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

async function collectFiles(dir, matcher) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, matcher)));
    } else if (matcher(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function flatten(obj, prefix = '') {
  const result = {};

  for (const [key, value] of Object.entries(obj ?? {})) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, nextKey));
    } else {
      result[nextKey] = value;
    }
  }

  return result;
}

function unflatten(flat) {
  const result = {};

  for (const [compoundKey, value] of Object.entries(flat)) {
    const keys = compoundKey.split('.');
    let target = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        target[key] = value;
        return;
      }

      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }

      target = target[key];
    });
  }

  return result;
}

function sortObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, sortObject(val)]),
  );
}

function extractTranslationKeys(content) {
  const translatorMap = new Map();

  const useTranslationsRegex =
    /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*useTranslations\s*\(\s*(?:(['"`])([^'"`]+)\2)?\s*\)/g;
  let match;

  while ((match = useTranslationsRegex.exec(content)) !== null) {
    const variable = match[1];
    const namespace = match[3] ?? '';
    translatorMap.set(variable, namespace);
  }

  const getTranslationsRegex =
    /(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:await\s*)?getTranslations\s*\(\s*\{([\s\S]*?)\}\s*\)/g;

  while ((match = getTranslationsRegex.exec(content)) !== null) {
    const variable = match[1];
    const options = match[2];
    const namespaceMatch = /namespace\s*:\s*['"`]([^'"`]+)['"`]/.exec(options);

    if (namespaceMatch) {
      translatorMap.set(variable, namespaceMatch[1]);
    }
  }

  const destructuredRegex =
    /const\s*\[\s*([^\]]+)\s*\]\s*=\s*await\s*Promise\.all\s*\(\s*\[([\s\S]*?)\]\s*\)/g;

  while ((match = destructuredRegex.exec(content)) !== null) {
    const variableList = splitTopLevel(match[1]);
    const expressionList = splitTopLevel(match[2]);

    expressionList.forEach((expression, index) => {
      const namespaceMatch = /getTranslations\s*\(\s*\{([\s\S]*?)\}\s*\)/.exec(
        expression,
      );
      if (!namespaceMatch) {
        return;
      }

      const options = namespaceMatch[1];
      const namespace = /namespace\s*:\s*['"`]([^'"`]+)['"`]/.exec(options)?.[1];
      const variable = variableList[index]?.replace(/\s+/g, '');

      if (namespace && variable) {
        translatorMap.set(variable, namespace);
      }
    });
  }

  const keys = new Set();

  for (const [variable, namespace] of translatorMap) {
    const pattern = escapeRegex(variable) + '\\s*\\(\\s*([\'\\"`])([^\'\\"`]+)\\1';
    const callRegex = new RegExp(pattern, 'g');
    let callMatch;

    while ((callMatch = callRegex.exec(content)) !== null) {
      const keyPart = callMatch[2];

      if (keyPart.includes('${')) {
        continue;
      }

      const key = namespace ? `${namespace}.${keyPart}` : keyPart;
      keys.add(key);
    }
  }

  const directRegex = /\bt\s*\(\s*(['"`])([^'"`]+)\1/g;

  while ((match = directRegex.exec(content)) !== null) {
    const fullKey = match[2];
    if (!fullKey.includes('${') && fullKey.includes('.')) {
      keys.add(fullKey);
    }
  }

  return keys;
}

async function loadJson(filepath) {
  const raw = await fs.readFile(filepath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filepath, data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filepath, serialized, 'utf8');
}

async function main() {
  const sourceFiles = await collectFiles(SRC_DIR, (filepath) =>
    /\.(?:ts|tsx)$/.test(filepath),
  );
  const discoveredKeys = new Set();

  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf8');
    const keys = extractTranslationKeys(content);
    keys.forEach((key) => discoveredKeys.add(key));
  }

  const messageFiles = (await fs.readdir(MESSAGES_DIR))
    .filter((file) => file.endsWith('.json'))
    .sort();

  if (!messageFiles.includes(EN_LOCALE)) {
    console.error(`Missing base locale file: ${EN_LOCALE}`);
    process.exit(1);
  }

  const enPath = path.join(MESSAGES_DIR, EN_LOCALE);
  const enMessages = await loadJson(enPath);
  const originalEnFlat = flatten(enMessages);
  let currentEnFlat = { ...originalEnFlat };

  const allKeys = new Set([...discoveredKeys, ...Object.keys(originalEnFlat)]);
  const sortedKeys = [...allKeys].sort();

  const summaries = [];

  for (const filename of messageFiles) {
    const locale = filename.replace(/\.json$/, '');
    const filepath = path.join(MESSAGES_DIR, filename);
    const isEn = filename === EN_LOCALE;

    const messages = await loadJson(filepath);
    const flat = flatten(messages);

    let added = 0;
    let copied = 0;
    let fallback = 0;
    let changed = false;

    for (const key of sortedKeys) {
      const hasKey = Object.prototype.hasOwnProperty.call(flat, key);
      const value = flat[key];

      if (hasKey && value !== null && value !== undefined) {
        continue;
      }

      const baseValue = currentEnFlat[key];
      const hadOriginalEnValue = Object.prototype.hasOwnProperty.call(
        originalEnFlat,
        key,
      );

      let nextValue = baseValue;
      let usedFallback = false;

      if (nextValue === undefined) {
        nextValue = key;
        usedFallback = true;
      }

      flat[key] = nextValue;
      added += 1;
      changed = true;

      if (isEn) {
        currentEnFlat[key] = nextValue;
        if (!hadOriginalEnValue || usedFallback) {
          fallback += 1;
        }
      } else if (hadOriginalEnValue) {
        copied += 1;
      } else {
        fallback += 1;
      }
    }

    if (changed) {
      const nested = sortObject(unflatten(flat));
      await writeJson(filepath, nested);
    }

    summaries.push({ locale, added, copied, fallback });
  }

  console.log(`Discovered ${sortedKeys.length} unique translation keys.`);
  console.log('Locale summaries:');

  for (const { locale, added, copied, fallback } of summaries) {
    if (added === 0) {
      console.log(`- ${locale}: no missing keys`);
      continue;
    }

    const details = [];

    if (copied > 0) {
      details.push(`${copied} copied from en`);
    }

    if (fallback > 0) {
      details.push(`${fallback} fallback`);
    }

    const detailText = details.length > 0 ? ` (${details.join(', ')})` : '';
    console.log(`- ${locale}: added ${added}${detailText}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

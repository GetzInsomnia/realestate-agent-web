#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MESSAGES_DIR = path.resolve(process.cwd(), 'src/messages');
const EN_LOCALE = 'en.json';

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

async function loadJson(filepath) {
  const raw = await fs.readFile(filepath, 'utf8');
  return JSON.parse(raw);
}

async function writeJson(filepath, data) {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filepath, serialized, 'utf8');
}

async function main() {
  const files = (await fs.readdir(MESSAGES_DIR)).filter((file) => file.endsWith('.json')).sort();

  if (!files.includes(EN_LOCALE)) {
    console.error(`Missing base locale file: ${EN_LOCALE}`);
    process.exit(1);
  }

  const enPath = path.join(MESSAGES_DIR, EN_LOCALE);
  const enMessages = await loadJson(enPath);
  const enFlat = flatten(enMessages);

  const otherLocales = files.filter((file) => file !== EN_LOCALE);

  for (const filename of otherLocales) {
    const filepath = path.join(MESSAGES_DIR, filename);
    const locale = filename.replace(/\.json$/, '');
    const messages = await loadJson(filepath);
    const flat = flatten(messages);

    let changed = false;
    let filled = 0;

    for (const [key, value] of Object.entries(enFlat)) {
      const hasKey = Object.prototype.hasOwnProperty.call(flat, key);
      const needsValue =
        !hasKey ||
        flat[key] === null ||
        flat[key] === undefined ||
        (typeof flat[key] === 'string' && flat[key].trim().length === 0);

      if (!needsValue) {
        continue;
      }

      flat[key] = value ?? key;
      changed = true;
      filled += 1;
    }

    if (!changed) {
      console.log(`No changes for ${locale}`);
      continue;
    }

    const nested = sortObject(unflatten(flat));
    await writeJson(filepath, nested);
    console.log(`Filled ${filled} keys for ${locale}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

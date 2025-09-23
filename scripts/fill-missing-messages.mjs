#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MESSAGES_DIR = path.resolve(process.cwd(), 'src/messages');
const EN_LOCALE = 'en.json';

const flatten = (obj, prefix = '') => {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, nextKey));
    } else {
      result[nextKey] = value;
    }
  }

  return result;
};

const unflatten = (flat) => {
  const result = {};

  for (const [compoundKey, value] of Object.entries(flat)) {
    const keys = compoundKey.split('.');
    let target = result;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        target[key] = value;
        return;
      }

      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }

      target = target[key];
    });
  }

  return result;
};

const loadJson = async (filepath) => {
  const content = await fs.readFile(filepath, 'utf8');
  return JSON.parse(content);
};

const writeJson = async (filepath, data) => {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filepath, serialized, 'utf8');
};

async function main() {
  const files = await fs.readdir(MESSAGES_DIR);
  const localeFiles = files.filter((file) => file.endsWith('.json'));

  if (!localeFiles.includes(EN_LOCALE)) {
    console.error(`Missing base locale file: ${EN_LOCALE}`);
    process.exit(1);
  }

  const enPath = path.join(MESSAGES_DIR, EN_LOCALE);
  const enMessages = await loadJson(enPath);
  const enFlat = flatten(enMessages);

  const otherLocales = localeFiles.filter((file) => file !== EN_LOCALE);

  for (const locale of otherLocales) {
    const localePath = path.join(MESSAGES_DIR, locale);
    const localeMessages = await loadJson(localePath);
    const localeFlat = flatten(localeMessages);

    let changed = false;

    for (const [key, value] of Object.entries(enFlat)) {
      if (!(key in localeFlat)) {
        localeFlat[key] = value;
        changed = true;
      }
    }

    if (!changed) {
      console.log(`No missing keys in ${locale}`);
      continue;
    }

    const filledMessages = unflatten(localeFlat);
    await writeJson(localePath, filledMessages);
    console.log(`Filled missing keys in ${locale}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

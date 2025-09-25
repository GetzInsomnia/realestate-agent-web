#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const MESSAGES_DIR = path.resolve(process.cwd(), 'src/messages');
const BASE_LOCALE = 'en.json';

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

async function readJson(filepath) {
  const raw = await fs.readFile(filepath, 'utf8');
  return { raw, data: JSON.parse(raw) };
}

async function main() {
  const files = (await fs.readdir(MESSAGES_DIR))
    .filter((file) => file.endsWith('.json'))
    .sort();

  if (!files.includes(BASE_LOCALE)) {
    console.error(`Missing base locale file: ${BASE_LOCALE}`);
    process.exit(1);
  }

  const basePath = path.join(MESSAGES_DIR, BASE_LOCALE);
  const { data: baseMessages } = await readJson(basePath);
  const baseFlat = flatten(baseMessages);

  const locales = files.filter((file) => file !== BASE_LOCALE);

  let processed = 0;
  let updated = 0;
  let totalAdded = 0;
  let totalExtras = 0;

  for (const filename of locales) {
    const filepath = path.join(MESSAGES_DIR, filename);
    const locale = filename.replace(/\.json$/, '');
    const { raw, data } = await readJson(filepath);
    const flat = flatten(data);

    processed += 1;

    let added = 0;

    for (const [key, value] of Object.entries(baseFlat)) {
      if (!Object.prototype.hasOwnProperty.call(flat, key)) {
        flat[key] = value;
        added += 1;
      }
    }

    const extraKeys = Object.keys(flat)
      .filter((key) => !Object.prototype.hasOwnProperty.call(baseFlat, key))
      .sort();

    const sortedMessages = sortObject(unflatten(flat));
    const serialized = `${JSON.stringify(sortedMessages, null, 2)}\n`;
    const normalizedRaw = raw.endsWith('\n') ? raw : `${raw}\n`;
    const changed = serialized !== normalizedRaw;

    if (changed) {
      await fs.writeFile(filepath, serialized, 'utf8');
      updated += 1;
    }

    totalAdded += added;
    totalExtras += extraKeys.length;

    console.log(`\n${locale}`);
    if (added > 0) {
      console.log(`  added ${added} missing key${added === 1 ? '' : 's'}`);
    }
    if (extraKeys.length > 0) {
      console.log(`  extra keys (${extraKeys.length}):`);
      extraKeys.forEach((key) => console.log(`    - ${key}`));
    }
    if (!added && extraKeys.length === 0) {
      console.log(changed ? '  reordered keys' : '  up to date');
    } else if (changed && added === 0) {
      console.log('  reordered keys');
    }
  }

  console.log('\nSummary');
  console.log(`  locales processed: ${processed}`);
  console.log(`  files updated: ${updated}`);
  console.log(`  keys added: ${totalAdded}`);
  console.log(`  extra keys: ${totalExtras}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve('src/messages');
const canonical = JSON.parse(
  fs.readFileSync(path.join(MESSAGES_DIR, 'en.json'), 'utf8'),
);

const flatten = (obj, prefix = '') => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else out[key] = true;
  }
  return out;
};

const enKeys = Object.keys(flatten(canonical));

const files = fs
  .readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith('.json') && f !== 'en.json');

let missingTotal = 0;

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf8'));
  const keys = Object.keys(flatten(json));
  const missing = enKeys.filter((k) => !keys.includes(k));
  if (missing.length) {
    missingTotal += missing.length;
    console.log(`\n[${file}] missing ${missing.length} keys:`);
    for (const k of missing) console.log(` - ${k}`);
  }
}

if (missingTotal === 0) {
  console.log('All locales are in sync with en.json ✅');
}

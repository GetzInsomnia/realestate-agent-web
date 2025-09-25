import fs from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve('src/messages');
const canonicalPath = path.join(MESSAGES_DIR, 'en.json');

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJson = (p, obj) =>
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');

const deepFill = (target, source) => {
  for (const [key, val] of Object.entries(source)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepFill(target[key], val);
    } else {
      if (!(key in target)) target[key] = val;
    }
  }
};

const main = () => {
  const canonical = readJson(canonicalPath);
  const files = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith('.json') && f !== 'en.json');

  for (const file of files) {
    const p = path.join(MESSAGES_DIR, file);
    const data = readJson(p);
    deepFill(data, canonical);
    writeJson(p, data);
    console.log(`Filled missing keys in ${file}`);
  }
};

main();

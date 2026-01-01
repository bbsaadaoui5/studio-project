const fs = require('fs');
const path = require('path');
const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const arPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'ar.json');
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function collectKeys(obj, prefix = '') {
  const out = [];
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...collectKeys(v, p));
    } else {
      out.push(p);
    }
  }
  return out;
}

function collectValues(obj, prefix = '', map = new Map()) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      collectValues(v, p, map);
    } else {
      map.set(p, v);
    }
  }
  return map;
}

const enKeys = collectKeys(en);
const arValues = collectValues(ar);
const missing = [];
const empty = [];

for (const k of enKeys) {
  if (!arValues.has(k)) {
    missing.push(k);
  } else {
    const val = arValues.get(k);
    if (val === '') empty.push(k);
  }
}

console.log('Arabic locale scan summary');
console.log('--------------------------------');
console.log('Missing keys:', missing.length);
console.log('Empty values:', empty.length);
if (missing.length) {
  console.log('Sample missing (first 30):');
  console.log(missing.slice(0, 30));
}
if (empty.length) {
  console.log('Sample empty (first 30):');
  console.log(empty.slice(0, 30));
}

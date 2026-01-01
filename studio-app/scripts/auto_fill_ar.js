#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const enPath = path.join(root, 'src', 'i18n', 'locales', 'en.json');
const arPath = path.join(root, 'src', 'i18n', 'locales', 'ar.json');
const csvPath = path.join(root, 'src', 'i18n', 'empty-translation-keys.ar.csv');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function flatten(obj, prefix = '') {
  const res = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(res, flatten(v, key));
    } else {
      res[key] = v;
    }
  }
  return res;
}

function setDeep(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!(p in cur) || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function getDeep(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object' || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function isInvalidKey(k) {
  // heuristics for keys that look like file paths or accidental entries
  if (!k) return true;
  if (k.trim() === '' ) return true;
  if (k.startsWith('@/') || k.includes('firebase/') ) return true;
  if (k.length === 1) return true;
  if (k.includes(' ' ) && k.length > 30) return true; // long literal Arabic sentence
  return false;
}

function main() {
  const en = readJson(enPath);
  const ar = readJson(arPath);

  const flatEn = flatten(en);
  const flatAr = flatten(ar);

  const rows = [];
  let filled = 0;

  // More aggressive autofill: fill keys that are missing, empty, or appear English/Latin-like in ar.json
  for (const key of Object.keys(flatEn)) {
    const arVal = getDeep(ar, key);
    const enVal = flatEn[key];
    const shouldFill = (arVal === undefined) || (typeof arVal === 'string' && arVal.trim() === '');

    // treat Latin-like values in ar.json as candidates to overwrite
    const isLatinLike = (val) => {
      if (typeof val !== 'string' || val.trim() === '') return false;
      // contains ASCII letters or words like 'Settings' or 'Messages'
      return /[A-Za-z]/.test(val) || /Settings|Messages|Loading|Auth|Search|Stripe/.test(val);
    };

    if (!shouldFill && isLatinLike(arVal)) {
      // overwrite with English fallback (we keep fallback as English for now)
    }

    if (shouldFill || isLatinLike(arVal)) {
      if (typeof enVal === 'string') {
        setDeep(ar, key, enVal);
        rows.push(`${key},${JSON.stringify(enVal).replace(/(^\")|(\"$)/g,'')},auto-filled`);
        filled++;
      } else {
        rows.push(`${key},,skipped-nonstring`);
      }
    }
  }

  // remove some obviously-invalid keys at root if present
  const invalidCandidates = [' ', '-', '/', '/dashboard', '@/components/TimetableAdmin', '@/lib/firebase-client', '@/services/parentService', 'T', 'firebase/firestore'];
  for (const k of invalidCandidates) {
    if (k in ar) {
      delete ar[k];
    }
  }

  writeJson(arPath, ar);

  // write/update CSV
  const header = 'key,english_fallback,status';
  const csvContent = [header].concat(rows).join('\n') + '\n';
  fs.writeFileSync(csvPath, csvContent, 'utf8');

  console.log(`Auto-filled ${filled} keys in ${arPath}`);
  console.log(`Wrote CSV manifest to ${csvPath}`);
}

main();

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/i18n/locales/ar.json');
const raw = fs.readFileSync(filePath, 'utf8');
const json = JSON.parse(raw);

function removeDuplicates(obj) {
  if (Array.isArray(obj)) return obj.map(removeDuplicates);
  if (typeof obj !== 'object' || obj === null) return obj;
  const seen = new Set();
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!seen.has(key)) {
      seen.add(key);
      result[key] = removeDuplicates(obj[key]);
    }
  }
  return result;
}

const cleaned = removeDuplicates(json);
fs.writeFileSync(filePath, JSON.stringify(cleaned, null, 2), 'utf8');
console.log('Duplicate keys removed and ar.json cleaned.');

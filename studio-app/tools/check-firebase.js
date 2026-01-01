const fs = require('fs');
const path = require('path');

const candidates = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', 'studio-project', '.env.local'),
];

function readEnv(file) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    const m = content.match(/^\s*NEXT_PUBLIC_FIREBASE_PROJECT_ID\s*=\s*(.*)\s*$/m);
    if (m && m[1]) return m[1].trim();
    return null;
  } catch (e) {
    return null;
  }
}

console.log('Checking for local Firebase config (.env.local) in common locations...');
let found = false;
for (const file of candidates) {
  const exists = fs.existsSync(file);
  console.log(`\n- ${file}: ${exists ? 'FOUND' : 'missing'}`);
  if (exists) {
    const val = readEnv(file);
    if (val) {
      console.log(`  NEXT_PUBLIC_FIREBASE_PROJECT_ID=${val} (present)`);
      found = true;
    } else {
      console.log('  NEXT_PUBLIC_FIREBASE_PROJECT_ID not set or empty in this file');
    }
  }
}

if (!found) {
  console.log('\nNo usable .env.local with NEXT_PUBLIC_FIREBASE_PROJECT_ID found. Create one using .env.example and restart the dev server.');
} else {
  console.log('\nA .env.local with NEXT_PUBLIC_FIREBASE_PROJECT_ID was found. If data still appears empty, restart the dev server and check the browser console for auth/Firestore errors.');
}

const fs = require('fs');
const path = require('path');

function summarizeDir(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const summary = { totalFiles: files.length, totalViolations: 0, files: [], ruleCounts: {} };

  for (const f of files) {
    const p = path.join(dir, f);
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      const violations = j.violations || [];
      summary.totalViolations += violations.length;
      summary.files.push({ file: p, violations: violations.length });
      for (const v of violations) {
        const id = v.id || 'unknown';
        summary.ruleCounts[id] = (summary.ruleCounts[id] || 0) + 1;
      }
    } catch (err) {
      console.error('ERROR reading', p, err.message);
    }
  }

  // sort files by violations desc
  summary.files.sort((a,b)=>b.violations - a.violations);
  return summary;
}

function printSummary(name, s) {
  if (!s) {
    console.log(`No folder named: ${name}`);
    return;
  }
  console.log('\n=== Audit summary for folder:', name, '===');
  console.log('Files found:', s.totalFiles);
  console.log('Total violations:', s.totalViolations);
  console.log('\nTop files by violations:');
  for (const f of s.files.slice(0,10)) {
    console.log(` - ${f.file}: ${f.violations}`);
  }
  const rules = Object.entries(s.ruleCounts).sort((a,b)=>b[1]-a[1]);
  console.log('\nTop rules:');
  for (const [id,count] of rules.slice(0,10)) {
    console.log(` - ${id}: ${count}`);
  }
}

const dirs = ['audit', 'audit 2'];
for (const d of dirs) {
  const s = summarizeDir(d);
  printSummary(d, s);
}

console.log('\nDone.');

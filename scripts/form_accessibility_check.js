#!/usr/bin/env node
// Simple accessibility checker: lists <input> occurrences missing id/name attributes
// Usage: node scripts/form_accessibility_check.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_DIRS = ['src', 'app', 'pages', 'components'];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.html'];

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      // skip node_modules and .next
      if (file === 'node_modules' || file === '.next' || file === '.git') return;
      walk(fp, filelist);
    } else {
      if (EXTENSIONS.includes(path.extname(file))) filelist.push(fp);
    }
  });
  return filelist;
}

function findInputsMissingIds(content) {
  const results = [];
  const inputRegex = /<input\b([^>]*?)>/gi;
  let m;
  while ((m = inputRegex.exec(content)) !== null) {
    const attrs = m[1];
    const hasId = /\bid\s*=\s*["']/.test(attrs);
    const hasName = /\bname\s*=\s*["']/.test(attrs);
    const typeMatch = /\btype\s*=\s*["']?(\w+)["']?/.exec(attrs);
    const type = typeMatch ? typeMatch[1] : 'text';
    // ignore hidden and submit/button types
    if (type === 'hidden' || type === 'submit' || type === 'button') continue;
    if (!hasId || !hasName) {
      const snippet = m[0].replace(/\n/g, ' ');
      results.push({ snippet: snippet.trim(), hasId, hasName });
    }
  }
  return results;
}

function hasAssociatedLabel(content, id) {
  if (!id) return false;
  // look for <label for="id"> or <label ...>id text<input ...></label>
  const forRegex = new RegExp(`<label[^>]*for=["']${id}["'][^>]*>`, 'i');
  if (forRegex.test(content)) return true;
  // fallback: if input appears inside a label
  const insideLabelRegex = new RegExp(`<label[\s\S]*?<input[^>]*id=["']${id}["'][\s\S]*?</label>`, 'i');
  if (insideLabelRegex.test(content)) return true;
  return false;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const inputs = findInputsMissingIds(content);
  if (inputs.length === 0) return null;
  // also try to detect labeled inputs if id exists
  const labeledIssues = inputs.map((i) => {
    const idMatch = /\bid\s*=\s*["']([^"']+)["']/.exec(i.snippet);
    const id = idMatch ? idMatch[1] : null;
    const hasLabel = id ? hasAssociatedLabel(content, id) : false;
    return Object.assign({}, i, { id, hasLabel });
  });
  return labeledIssues;
}

function main() {
  const report = [];
  SEARCH_DIRS.forEach((d) => {
    const dir = path.join(ROOT, d);
    if (!fs.existsSync(dir)) return;
    const files = walk(dir, []);
    files.forEach((f) => {
      const res = analyzeFile(f);
      if (res) {
        report.push({ file: path.relative(ROOT, f), issues: res });
      }
    });
  });

  if (report.length === 0) {
    console.log('✅ No obvious <input> missing id/name found in scanned folders (src, app, pages, components).');
    return;
  }

  console.log('\nAccessibility check report: inputs missing id/name (or label)');
  console.log('-----------------------------------------------------------------');
  report.forEach((r) => {
    console.log(`\nFile: ${r.file}`);
    r.issues.forEach((issue, idx) => {
      console.log(`  ${idx + 1}. snippet: ${issue.snippet}`);
      console.log(`     - hasId: ${issue.hasId}, hasName: ${issue.hasName}, id: ${issue.id || '-'} , hasLabelNearby: ${issue.hasLabel}`);
    });
  });
  console.log('\nNext steps: open the listed files and add missing id/name attributes, then add a <label for="..."> or wrap input in a <label>.');
}

main();

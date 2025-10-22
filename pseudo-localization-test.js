#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all TypeScript/JavaScript files
function findFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(findFiles(fullPath, extensions));
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}`);
  }
  
  return files;
}

// Find hardcoded English strings
function findHardcodedStrings(content, filePath) {
  const hardcodedStrings = [];
  
  // Common patterns for hardcoded English text
  const patterns = [
    // JSX text content: >English Text<
    />([A-Z][a-zA-Z\s,.'!?-]{3,})</g,
    // String literals: "English Text" or 'English Text'
    /["']([A-Z][a-zA-Z\s,.'!?-]{3,})["']/g,
    // Template literals: `English Text`
    /`([A-Z][a-zA-Z\s,.'!?-]{3,})`/g,
    // Object properties: title: "English Text"
    /:\s*["']([A-Z][a-zA-Z\s,.'!?-]{3,})["']/g,
    // Placeholder text
    /placeholder\s*=\s*["']([A-Z][a-zA-Z\s,.'!?-]{3,})["']/g,
    // Labels and titles
    /(?:title|label|description|placeholder|alt)\s*:\s*["']([A-Z][a-zA-Z\s,.'!?-]{3,})["']/g
  ];
  
  const lines = content.split('\n');
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const text = match[1];
      
      // Skip if it's likely code, imports, or technical terms
      if (shouldSkipText(text)) {
        continue;
      }
      
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      
      hardcodedStrings.push({
        text,
        line: lineNumber,
        context: lines[lineNumber - 1]?.trim() || ''
      });
    }
  });
  
  return hardcodedStrings;
}

// Check if text should be skipped
function shouldSkipText(text) {
  const skipPatterns = [
    /^(import|export|from|const|let|var|function|class|interface|type)/i,
    /^(useState|useEffect|useCallback|useMemo)/i,
    /^(React|Component|JSX|HTML|CSS|JavaScript|TypeScript)/i,
    /^(true|false|null|undefined)/i,
    /^\d+$/,
    /^[A-Z_]+$/,  // Constants
    /^[a-z]+([A-Z][a-z]*)+$/,  // camelCase
    /^[a-z-]+$/,  // kebab-case
    /\.(tsx?|jsx?|css|json|html)$/i,
    /^(px|em|rem|vh|vw|%|\d+)$/,
    /^rgb|rgba|hex|#/i,
    /^(GET|POST|PUT|DELETE|PATCH)$/i
  ];
  
  return skipPatterns.some(pattern => pattern.test(text)) || text.length < 4;
}

// Main analysis function
function analyzeProject() {
  console.log('🔍 Pseudo-localization Analysis - Finding Missing Translations\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findFiles(srcDir);
  
  const results = [];
  let totalIssues = 0;
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hardcodedStrings = findHardcodedStrings(content, filePath);
      
      if (hardcodedStrings.length > 0) {
        const relativePath = path.relative(process.cwd(), filePath);
        results.push({
          file: relativePath,
          issues: hardcodedStrings
        });
        totalIssues += hardcodedStrings.length;
      }
    } catch (error) {
      console.warn(`Warning: Could not read file ${filePath}`);
    }
  }
  
  // Print results
  if (results.length === 0) {
    console.log('✅ No hardcoded English strings found! All text appears to be properly internationalized.');
    return;
  }
  
  console.log(`❌ Found ${totalIssues} potential hardcoded English strings in ${results.length} files:\n`);
  
  results.forEach(({ file, issues }) => {
    console.log(`📄 ${file}`);
    issues.forEach(({ text, line, context }) => {
      console.log(`   Line ${line}: "${text}"`);
      console.log(`   Context: ${context}`);
      console.log('');
    });
    console.log('');
  });
  
  console.log('💡 Recommendations:');
  console.log('1. Replace hardcoded strings with t("translation.key")');
  console.log('2. Add missing translations to src/i18n/locales/ar.json');
  console.log('3. Use pseudo-localization mode to test in browser');
  console.log('4. Run this tool again to verify fixes');
}

// Run the analysis
if (require.main === module) {
  analyzeProject();
}

module.exports = { analyzeProject, findFiles, findHardcodedStrings };
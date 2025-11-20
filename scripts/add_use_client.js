#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')

const ROOT = path.resolve(__dirname, '..')
const patterns = [
  'src/app/**/*.tsx',
  'src/components/**/*.tsx',
  'src/hooks/**/*.tsx',
]

const hookRegex = /\b(useState|useEffect|useRef|useCallback|useMemo|useLayoutEffect|useId|useContext|useReducer|React\.useState|React\.useEffect|React\.useRef|React\.useContext)\b/

let updated = []

for (const pattern of patterns) {
  const files = glob.sync(pattern, { cwd: ROOT, absolute: true })
  for (const file of files) {
    try {
      const src = fs.readFileSync(file, 'utf8')
      const firstLines = src.split(/\r?\n/).slice(0, 6).join('\n')
      if (/^\s*['"]use client['"];?/m.test(firstLines) || /^\s*['"]use server['"];?/m.test(firstLines)) {
        continue
      }
      if (hookRegex.test(src)) {
        // Insert "use client" as the very first line preserving any leading shebang
        let out = src
        if (src.startsWith('#!')) {
          const idx = src.indexOf('\n')
          out = src.slice(0, idx + 1) + '"use client";\n' + src.slice(idx + 1)
        } else {
          out = '"use client";\n' + src
        }
        fs.writeFileSync(file, out, 'utf8')
        updated.push(path.relative(ROOT, file))
      }
    } catch (e) {
      console.error('failed to process', file, e.message)
    }
  }
}

if (updated.length) {
  console.log('Added "use client" to', updated.length, 'files:')
  updated.forEach(f => console.log(' -', f))
} else {
  console.log('No files needed changes')
}

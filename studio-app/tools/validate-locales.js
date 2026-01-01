const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
let ok = true
for (const f of files) {
  const p = path.join(dir, f)
  const content = fs.readFileSync(p, 'utf8')
  try {
    JSON.parse(content)
    console.log(`${f}: OK`)
  } catch (e) {
    ok = false
    console.error(`${f}: ERROR -> ${e.message}`)
    // try to show a few lines around the error position if available
    const match = /position (\d+)/.exec(e.message)
    if (match) {
      const pos = Number(match[1])
      const before = Math.max(0, pos - 80)
      const after = Math.min(content.length, pos + 80)
      const snippet = content.slice(before, after)
      console.error('--- snippet around position ' + pos + ' ---')
      console.error(snippet)
      console.error('--- end snippet ---')
    }
  }
}
process.exit(ok ? 0 : 1)

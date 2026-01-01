import fs from 'fs'
import path from 'path'
import { chromium } from 'playwright'
import axeSource from 'axe-core'

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  const url = process.argv[2] || 'http://localhost:3000/login'
  console.log('Running axe on', url)
  await page.goto(url, { waitUntil: 'networkidle' })

  // Inject axe
  await page.addScriptTag({ content: axeSource.source })
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run()
  })

  const outDir = path.resolve(process.cwd(), 'audit')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  const outFile = path.join(outDir, 'axe-report.json')
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2))
  console.log('Wrote', outFile)

  // Print a brief summary
  console.log('Violations:', results.violations.length)
  for (const v of results.violations.slice(0, 5)) {
    console.log(`- ${v.id}: ${v.impact} — ${v.help} — ${v.nodes.length} node(s)`)
  }

  await browser.close()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

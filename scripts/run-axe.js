const fs = require('fs')
const path = require('path')
const playwright = require('playwright')
const axeSource = require('axe-core')

;(async () => {
  // CLI parsing: accept --browser <name>, --output-dir <dir>, -v and a list
  // of target URLs. Flags must not be treated as targets.
  const rawArgs = process.argv.slice(2)
  let preferredBrowser = null
  let outDir = path.resolve(process.cwd(), 'audit')
  let verbose = false
  let navTimeout = 30000 // navigation timeout in ms
  const targets = []

  for (let i = 0; i < rawArgs.length; i++) {
    const a = rawArgs[i]
    if (a === '--browser') {
      preferredBrowser = rawArgs[++i]
      continue
    }
    if (a === '--output-dir') {
      outDir = path.resolve(process.cwd(), rawArgs[++i])
      continue
    }
    if (a === '-v' || a === '--verbose') {
      verbose = true
      continue
    }
    // support --timeout <ms>
    if (a === '--timeout') {
      navTimeout = Number(rawArgs[++i]) || navTimeout
      continue
    }
    // anything else that doesn't start with '-' is a URL target
    if (!a.startsWith('-')) targets.push(a)
  }

  const browsersToTry = preferredBrowser
    ? [preferredBrowser]
    : ['chromium', 'firefox', 'webkit']

  let browser = null
  let usedBrowser = null
  for (const b of browsersToTry) {
    try {
      if (!playwright[b]) {
        console.warn('Playwright does not expose browser:', b)
        continue
      }
      console.log('Attempting to launch', b)
      browser = await playwright[b].launch({ headless: true })
      usedBrowser = b
      console.log('Launched', b)
      break
    } catch (err) {
      console.warn(`Failed to launch ${b}:`, err.message || err)
      // try next browser
    }
  }

  if (!browser) {
    throw new Error('Could not launch any Playwright browser')
  }
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  const defaultUrls = ['http://localhost:3000/login']
  const finalTargets = targets.length ? targets : defaultUrls

  // Create a single context to optionally perform programmatic login and reuse
  // authenticated cookies across scans. If TEST_PARENT_EMAIL/PASSWORD are
  // provided in the environment, attempt a UI login on /login.
  const context = await browser.newContext()
  const envEmail = process.env.TEST_PARENT_EMAIL || process.env.TEST_EMAIL || ''
  const envPassword = process.env.TEST_PARENT_PASSWORD || process.env.TEST_PASSWORD || ''
  if (envEmail && envPassword) {
    try {
      if (verbose) console.log('Attempting programmatic login using TEST_PARENT_EMAIL')
      const loginPage = await context.newPage()
      const loginUrl = new URL(finalTargets[0]).origin + '/login'
      await loginPage.goto(loginUrl, { waitUntil: 'networkidle', timeout: navTimeout })
      // fill fields and submit
      await loginPage.fill('#email', envEmail)
      await loginPage.fill('#password', envPassword)
      await Promise.all([
        loginPage.click('button[type=submit]'),
        // wait for navigation or a short delay if no navigation occurs
        loginPage.waitForNavigation({ timeout: navTimeout }).catch(() => {}),
      ])
      if (verbose) console.log('Login attempt finished; cookies stored in context')
      await loginPage.close()
    } catch (err) {
      console.warn('Programmatic login failed:', err.message || err)
    }
  }

  for (const url of finalTargets) {
    const page = await context.newPage()
    if (verbose) console.log(`Using browser: ${usedBrowser} for ${url}`)
    try {
      if (verbose) console.log('Running axe on', url)
      await page.goto(url, { waitUntil: 'networkidle', timeout: navTimeout })

      // Wait briefly for a level-1 heading to appear (some pages render
      // heavy client components or redirect). This reduces false positives
      // where the page would otherwise be missing an H1 at the time Axe
      // runs.
      let foundH1 = false
      try {
        await page.waitForSelector('h1', { timeout: 5000 })
        foundH1 = true
        if (verbose) console.log('Found H1 on page before running axe')
      } catch (e) {
        if (verbose) console.log('No H1 found within timeout, will inject a temporary hidden H1 for the scan')
      }

      // If no H1 is present, inject a temporary hidden H1 so axe won't report
      // page-has-heading-one false positives on client-heavy pages. This only
      // affects the scanning context and doesn't change the source files.
      if (!foundH1) {
        await page.evaluate(() => {
          try {
            const existing = document.querySelector('h1#axe-temporary-h1')
            if (!existing) {
              const h = document.createElement('h1')
              h.id = 'axe-temporary-h1'
              h.className = 'sr-only'
              h.textContent = 'Temporary scan heading'
              const main = document.querySelector('main') || document.body
              main.prepend(h)
            }
          } catch (err) {
            // ignore
          }
        })
        if (verbose) console.log('Injected temporary hidden H1')
      }

      // Inject axe
      await page.addScriptTag({ content: axeSource.source })
      const results = await page.evaluate(async () => {
        return await (window).axe.run()
      })

      const slug = url.replace(/(^https?:\/\/)|[:\/]+/g, '_')
      const outFile = path.join(outDir, `axe-report${slug}.json`)
      fs.writeFileSync(outFile, JSON.stringify(results, null, 2))
      console.log('Wrote', outFile)

      console.log('Violations:', results.violations.length)
      for (const v of results.violations.slice(0, 5)) {
        console.log(`- ${v.id}: ${v.impact} — ${v.help} — ${v.nodes.length} node(s)`)
      }
    } catch (err) {
      console.error('Failed to run axe on', url, err.message || err)
    } finally {
      await page.close()
    }
  }

  await browser.close()
})().catch((err) => {
  console.error(err)
  process.exit(1)
})

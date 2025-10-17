import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import axeSource from 'axe-core';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test('parent-dashboard-axe', async ({ page }, testInfo) => {
  const useDevAuth = process.env.TEST_USE_DEV_AUTH === '1';
  const emailRaw = process.env.TEST_PARENT_EMAIL;
  const passRaw = process.env.TEST_PARENT_PASSWORD;
  const email = typeof emailRaw === 'string' ? emailRaw : undefined;
  const pass = typeof passRaw === 'string' ? passRaw : undefined;

  if (!useDevAuth) {
    if (!email || !pass) {
      test.skip();
      return;
    }

    // Login flow
    await page.goto(`${BASE}/parent/login`);
    // Fill inputs - conservative selectors, adapt if your markup differs
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', pass);
    await Promise.all([
      page.waitForNavigation({ url: `${BASE}/parent/dashboard`, waitUntil: 'networkidle', timeout: 30000 }),
      page.click('button[type="submit"]'),
    ]);
  } else {
    // Dev bypass for tests: navigate directly to the dashboard (app no longer supports ?dev-auth)
    await page.goto(`${BASE}/parent/dashboard`);
  }

  // Ensure dashboard main content is visible
  await page.waitForSelector('main', { timeout: 15000 });
  // Page should provide semantic headings/landmarks for axe to evaluate.

  // Inject axe and run
  await page.addScriptTag({ content: axeSource.source });
  const results = await page.evaluate(async () => {
    // @ts-ignore
    return await (window as any).axe.run();
  });

  // Save results as an artifact in test output folder using TestInfo API
  const outFile = typeof testInfo.outputPath === 'function'
    ? testInfo.outputPath('axe-parent-dashboard.json')
    : path.join(process.cwd(), 'test-results', 'axe-parent-dashboard.json');
  const outDir = path.dirname(outFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  await testInfo.attach('axe-report', { path: outFile, contentType: 'application/json' });

  // Failing the test on any violations gives a clear CI signal
  expect(results.violations.length).toBe(0);
});

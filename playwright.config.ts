import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 20000,
    ignoreHTTPSErrors: true,
    video: 'off',
    // Keep traces when a test fails so we can triage in CI and locally
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      // Prefer system Chrome on macOS developer machines to avoid mismatched
      // bundled chromium binaries (dyld symbol errors). CI (linux) will use
      // the default bundled browser.
      use: process.platform === 'darwin'
        ? { ...devices['Desktop Chrome'], channel: 'chrome' }
        : { ...devices['Desktop Chrome'] }
    }
    ,
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ]
})


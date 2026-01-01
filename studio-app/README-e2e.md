E2E Test Guide

This project uses Playwright for end-to-end tests. The tests live in `tests/e2e`.

Run locally (recommended using Firefox on macOS if bundled Chromium fails):

```bash
# install deps
npm ci
npx playwright install

# build and start (Playwright will reuse this if configured)
npm run build
npm run start

# run tests (example: firefox)
npx playwright test --project=firefox --reporter=html

# open the HTML report
npx playwright show-report

# view a trace
npx playwright show-trace test-results/<test-name>/trace.zip
```

CI notes

- The GitHub Actions workflows `Playwright E2E + Axe` and `E2E Tests (Playwright)` are configured to run Playwright and upload the `playwright-report/` and `test-results/` artifacts.
- Ensure the repository secrets `TEST_PARENT_EMAIL` and `TEST_PARENT_PASSWORD` (or `E2E_EMAIL` / `E2E_PASSWORD`) are set for full end-to-end authentication flows.

Troubleshooting

- If Playwright Chromium fails on macOS with dyld errors, run tests with Firefox or configure Playwright to use your local Chrome binary (the repo's `playwright.config.ts` sets the Chromium project to use `channel: 'chrome'`).
- If tests time out waiting for `main`, ensure the server started correctly and/or examine `test-results/` trace zips and `playwright-report` HTML output.

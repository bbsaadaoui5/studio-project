ci: Playwright + axe e2e checks (ci/run-e2e)

Adds Playwright end-to-end tests with axe accessibility checks and a CI workflow.

What:
- `playwright.config.ts` updated (added `firefox` project for local dev).
- E2E test updates in `tests/e2e/`:
  - Robust, locale-tolerant navigation tests.
  - Parent dashboard axe test that writes an `axe` JSON artifact.
- Removed in-app `?dev-auth` dev-only behavior; tests use `TEST_USE_DEV_AUTH` for local runs.
- CI workflow (`.github/workflows/playwright-axe.yml`) runs Playwright + axe on ubuntu-latest and uploads artifacts.
- Helper bundle/script in `ci/` to simplify publishing.

Why:
- Ensure accessibility checks run reliably in CI and tests are stable across locales and developer machines.

Notes:
- For authenticated flows, configure secure test credentials in repo secrets (see `CI_SECRETS_TEMPLATE.md`).
- Local dev: run `TEST_USE_DEV_AUTH=1 npx playwright test --project=firefox` to run tests without real credentials.
- After CI passes, consider removing test-only fallbacks or keeping them behind dev/test-only flags.

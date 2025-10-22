E2E tests (Playwright)

How to run locally

1. Install deps and Playwright browsers:

```bash
npm install
npx playwright install --with-deps
```

2. Start the app (production server recommended):

```bash
npm run build
npm run start &
```

3. Run the tests:

```bash
# run smoke tests
npm run test:e2e

# run the auth tests (requires E2E credentials)
E2E_EMAIL=you@example.com E2E_PASSWORD=yourpass npm run test:e2e
```

Notes
- The auth tests will be skipped if `E2E_EMAIL` and `E2E_PASSWORD` are not provided.
- On macOS you may need to run Playwright in headed mode if headless browsers fail due to system library mismatch. Use `npm run test:e2e:headed`.
- In CI (GitHub Actions) set the credentials as encrypted secrets and expose them as environment variables for the workflow.

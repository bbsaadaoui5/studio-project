Deployment checklist for studio-project

Status (as of 2025-10-16):
- Production build: PASSED (ran `npm run build` locally; compiled successfully)
- Lint & Type checks: PASSED
- Static generation: PASSED (app routes prerendered)

Pre-deploy checks (must complete before pushing to production):
1. Environment variables
   - Ensure production environment variables are set in your deployment platform (Vercel/Netlify/Cloud).
   - Common envs used by the project (confirm in your CI or runtime):
     - FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_AUTH_DOMAIN, FIREBASE_DATABASE_URL, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
     - NEXT_PUBLIC_SENTRY_DSN (if used)
     - SENTRY_AUTH_TOKEN / other secret tokens
     - ANY third-party keys referenced in `found_api_keys.txt` or your `.env` files
2. Secrets & access
   - Confirm Firestore, Auth, and any external services have the correct production credentials and IAM permissions.
   - Rotate any test keys if they were used in production.
3. Build verification
   - Locally run:
     ```bash
     npm ci
     npm run build
     npm run lint
     ```
   - Ensure the build completes and lint passes as in the CI logs.
4. Static pages & routes check
   - Confirm that main routes render in preview builds: `/`, `/parent-portal/[token]`, `/communication/messages`, `/events/calendar`, `/finance/fees`, `/resources/inventory`, `/student-management/directory`.
5. Accessibility quick checks (recommended)
   - Use Lighthouse in Chrome DevTools on key pages (dashboard, parent portal, messages, directory). Look for PWA, accessibility, and performance regressions.
   - Optionally run accessibility testing (axe CLI or Pa11y) on staging.

Smoke tests (post-deploy, run on staging/preview URL):
- Basic navigation
  - Log in as admin, navigate to Dashboard, open Student Directory, open a student, go back.
  - Log in as parent (or use parent-portal preview token), open the Parent Portal and ensure it loads.
- Messaging
  - Open Communication → Messages, create a new message, send to a test recipient (or save as draft) and verify no errors in console.
- Payroll / Fees
  - Open Payroll or Fees pages and verify lists load without console errors.
- File uploads & downloads
  - Upload a small file (if the app supports uploads) and verify it's stored; try downloading a sample report.

Deployment steps (example for Vercel):
1. Push to main (or open a PR for review); ensure CI runs and passes.
2. Open Vercel preview deployment and run smoke tests.
3. When satisfied, promote preview to production or merge + let Vercel build production.

Rollback plan
- If issues appear after deploy, revert to the previous deployment in your hosting platform (Vercel: roll back via Deployments > Production > Rollback).
- If immediate front-end-only rollback is needed, you can disable the latest production deployment while investigating.

Follow-ups & recommendations
- Run an automated accessibility audit (axe) and fix any remaining WCAG issues.
- Add a small E2E test suite (Playwright or Cypress) for the critical flows above.
- Consider adding a staging Firebase project to avoid touching production data during testing.
- Monitor logs and error reporting (Sentry) after deployment.

Contact & notes
- Repo branch: `main`
- Last local verification: `npm run build` completed successfully on 2025-10-16


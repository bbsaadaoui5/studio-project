Deploy to Vercel — short guide

This file describes minimal, practical steps to deploy this Next.js app to Vercel and perform quick verification.

Prerequisites
- GitHub repository connected to Vercel (or use Vercel CLI).
- Vercel project created and linked to this repo branch (`main`).
- Production environment variables available (see list below).

Environment variables (common)
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID
- FIREBASE_DATABASE_URL
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID
- NEXT_PUBLIC_SENTRY_DSN (optional)
- SENTRY_AUTH_TOKEN (optional)
- Any 3rd-party keys used by the project

Add envs in Vercel
1. Open your project on Vercel
2. Go to Settings → Environment Variables
3. Add variables for Preview and Production (do not leak production secrets to preview if you don't want to)

Deploy flow (recommended)
1. Push a branch / open a PR against `main`
   - Vercel will create a Preview deployment automatically.
2. Run smoke tests against the Preview URL.
   - Verify Login (Admin / Parent / Teacher flows), Dashboard, Messages, Parent Portal (use token), Student directory, and Payroll/Fees pages.
3. Merge PR to `main` when satisfied.
   - Vercel will build production automatically.
4. After production build completes, visit the Production URL and run the same smoke tests.

Quick CLI (optional)
- Install Vercel CLI:
```bash
npm i -g vercel
```
- Link to your project and deploy a preview (interactive):
```bash
vercel link
vercel --prod  # deploy production (be careful; will publish)
```

Promote a Preview to Production
- Vercel supports promoting a Preview Deployment to Production from the Vercel dashboard.
- Alternatively, merge the PR to `main` and let Vercel do a production build.

Rollback
- In Vercel dashboard: Deployments → select the previous successful production deployment → More → Promote
- If necessary, revert the git commit and re-deploy.

Verification checklist (after production deploy)
- Build succeeded in Vercel (no errors)
- Key routes load (see `DEPLOYMENT_CHECKLIST.md` for a list)
- No new Sentry errors (if Sentry is configured)
- No critical accessibility regressions on parent portal pages

Notes
- This project uses Firebase; if you want to separate staging and production, create a separate Firebase project and add its credentials to Preview environment variables.
- For repeatable automated smoke tests, consider adding Playwright to the repo and running it in Vercel CI after each Preview build.


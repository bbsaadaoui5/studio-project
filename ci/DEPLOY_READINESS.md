Deploy readiness checklist

Summary:
This branch (`ci/run-e2e`) prepares Playwright + axe e2e tests and CI workflow to validate accessibility and E2E behavior. Local build and lint steps pass. The branch should be pushed and CI run to obtain authoritative results.

Checklist before deploy:
- [ ] `npm run build` passes (confirmed locally)
- [ ] TypeScript checks pass (`npx tsc --noEmit`) (confirmed locally)
- [ ] ESLint passes (`npm run lint`) (confirmed locally)
- [ ] Playwright E2E + axe run in CI (ubuntu-latest) completes with zero critical violations
  - If violations appear, triage and fix before deploy.
- [ ] Protected routes (parent dashboard, messages, settings) validated with authenticated CI tests or mocked flows
- [ ] No dev-only flags or query parameters remain in app code (e.g., `?dev-auth`) — confirmed
- [ ] Remove or archive `ci/ci-run-e2e.bundle` and `ci/push-run-e2e.sh` after PR merge (optional)

Known issues / constraints:
- Local macOS host's Playwright Chromium binary is incompatible; CI uses ubuntu-latest and will test Chromium there.
- Tests currently support a `TEST_USE_DEV_AUTH` local bypass; remove it after CI is configured with secrets.

Post-deploy monitoring:
- Watch Sentry/telemetry and review user-reported accessibility feedback.
- Run scheduled axe scans for production periodically.

If you'd like, I can prepare a short release note summarizing the changes for reviewers or the deploy checklist in your release process.

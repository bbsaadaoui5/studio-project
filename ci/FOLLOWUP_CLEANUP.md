Follow-up cleanup plan (apply after CI verifies tests/artifacts)

Goal
- Remove remaining test-only helpers and finalize code for production.

What to remove or adjust
1. Remove TEST_USE_DEV_AUTH usage in tests (optional)
   - Once CI has authenticated test coverage or you decide not to run authenticated flows in CI, remove the `TEST_USE_DEV_AUTH` bypass from tests so they always use the real login flow or real fixtures.
   - Files to inspect: `tests/e2e/parent-dashboard-axe.spec.ts` and any other tests that conditionally bypass auth.

2. Remove any temporary comments and helper scripts inside `ci/` if you want a lean repo now that CI is configured.
   - `ci/push-run-e2e.sh` and the bundle can be removed after the PR is merged (optional).

3. Audit tests for hard-coded selectors or debug artefacts and replace them with robust role-based selectors.
   - Prefer `getByRole`, accessible names, and test ids only where necessary.

4. Confirm there are no remaining development-only server flags or query params in app code.
   - We removed `?dev-auth` server behavior already; scan `src/` for `dev-auth` or similar flags.

How to apply (recommended small patch flow)
- Create a local branch for the cleanup:
  git checkout -b ci/cleanup-after-e2e

- Edit the tests to remove `TEST_USE_DEV_AUTH` branches and update the login flow to use CI-provided secrets or fixtures.

- Run the e2e suite locally with real credentials (or against a CI-only staging environment) to validate.

- Commit & push the branch and open a PR (small, focused) and request review after CI has passed for the feature branch.

Notes
- Keep test-only helpers behind explicit env flags if you want dev ergonomics, but avoid shipping server-side dev flags to production.
- If credentials are sensitive, prefer a test harness or mock auth server in CI rather than using real user credentials.

Example cleanup diff (template):

*** Begin Patch
*** Update File: tests/e2e/parent-dashboard-axe.spec.ts
@@
-  const useDevAuth = process.env.TEST_USE_DEV_AUTH === '1';
+  // remove TEST_USE_DEV_AUTH after CI validated authenticated flows; always use real login in tests
-  if (!useDevAuth) {
+  // always require credentials in CI runs
+  if (!process.env.TEST_PARENT_EMAIL || !process.env.TEST_PARENT_PASSWORD) {
+    test.skip('Test credentials not provided')
+    return
+  }
*** End Patch

Apply this only after CI has validated the branch and you have CI secrets configured.

CI & Branch Protection — quick guide

Purpose
This document shows exact steps you (a repository admin) should follow in GitHub to:
- Add repository secrets used by CI (E2E creds)
- Require Playwright E2E and Accessibility workflows as required status checks on `main`

1) Add repository secrets (E2E credentials)
- Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret
- Add the following secrets:
  - E2E_EMAIL — the test account email used for end-to-end tests
  - E2E_PASSWORD — the test account password
- For security, create a dedicated test user (not an admin) in your Firebase/Auth project and scope any test data appropriately.

2) Enable branch protection on `main`
- Go to Settings → Branches → Branch protection rules → Add rule
- Branch name pattern: `main`
- Select options:
  - Require status checks to pass before merging
  - Require branches to be up to date before merging (optional)
  - Require pull request reviews before merging (set number of required reviewers)
  - Dismiss stale pull request approvals when new commits are pushed (optional)

3) Add required status checks
- After you enable the rule and run the workflows once, find the workflows under 'Status checks found in the last week for this repository'.
- Add the following checks as required (names match workflow job names):
  - `E2E Tests (Playwright)` (this will appear as the workflow name)
  - `Accessibility Audit (Playwright + axe)`
- Save the branch protection rule.

4) Verify
- Open a new PR targeting `main`. The workflows will run automatically (Playwright e2e and accessibility). All required checks must pass before the PR can be merged.
- If the E2E auth tests require secrets, ensure the secrets are present in repository settings. For forked PRs, secrets are not available; configure the e2e tests to skip auth or rely on mocked responses for forks.

Notes & best practices
- Use a dedicated staging Firebase project and credentials for Preview deployments to avoid touching production data.
- Keep long-running or flaky tests out of required checks; keep a small smoke suite as required and move longer tests to nightly runs.
- Use the Playwright report artifacts and the accessibility PR comments (added by CI) to triage failures quickly.


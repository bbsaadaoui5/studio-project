#!/usr/bin/env bash
set -euo pipefail

# push-run-e2e.sh
# Helper script to fetch the prepared git bundle and push the ci/run-e2e branch to origin,
# then optionally open a PR with GitHub CLI.

BUNDLE_PATH="${1:-ci/ci-run-e2e.bundle}"
REMOTE="${2:-origin}"
BRANCH="${3:-ci/run-e2e}"
OPEN_PR="${4:-1}"

usage() {
  cat <<EOF
Usage: $0 [bundle-path] [remote] [branch] [open-pr]

bundle-path: path to the git bundle (default: ci/ci-run-e2e.bundle)
remote: git remote to push to (default: origin)
branch: branch name to create from the bundle (default: ci/run-e2e)
open-pr: 1 to open PR with gh, 0 to skip (default: 1)
EOF
}

if [[ "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  exit 0
fi

if [[ ! -f "$BUNDLE_PATH" ]]; then
  echo "ERROR: bundle not found at $BUNDLE_PATH"
  echo "Place the bundle file at that path or pass its path as the first argument."
  exit 2
fi

echo "Fetching bundle from: $BUNDLE_PATH"
# Fetch the bundle into the local repo as a branch
# This will create refs/heads/ci/run-e2e locally
git fetch "$BUNDLE_PATH" "refs/heads/ci/run-e2e:refs/heads/ci/run-e2e"

# Checkout the branch
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git checkout "$BRANCH"
else
  git checkout -b "$BRANCH"
fi

# Push to remote
echo "Pushing $BRANCH to $REMOTE"
git push "$REMOTE" "$BRANCH"

if [[ "$OPEN_PR" == "1" ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "Opening PR with gh..."
    gh pr create --base main --head "$BRANCH" --title "ci: Playwright + axe e2e checks (ci/run-e2e)" \
      --body "Adds Playwright e2e tests with axe accessibility checks and CI workflow.\n\nIncludes: playwright.config.ts, tests/e2e updates, CI workflow and bundle.\n\nPlease ensure CI secrets are configured for authenticated tests if needed." \
      || echo "gh pr create failed; open a PR manually on GitHub"
  else
    echo "gh CLI not found; please open a PR manually from branch $BRANCH"
  fi
fi

echo "Done. If the workflow doesn't trigger, open a PR manually or check your remote settings."

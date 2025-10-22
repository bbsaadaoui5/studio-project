How to push the `ci/run-e2e` branch from your machine

This repository contains a git bundle and patch for the local branch
`ci/run-e2e` created in the dev environment. Use either the bundle or
the patch to recreate the branch and push it to origin from your machine.

Using the bundle (recommended):

1. Copy `ci/ci-run-e2e.bundle` to your local machine (or download it from
   wherever you can access this repo workspace).

2. On your machine, fetch the bundle into your repository:

```bash
git fetch /path/to/ci-run-e2e.bundle ci/run-e2e:refs/heads/ci/run-e2e
```

3. Push the recreated branch to GitHub:

```bash
git checkout ci/run-e2e
git push --set-upstream origin ci/run-e2e
```

Using the patch (alternative):

1. Copy `ci/ci-run-e2e.patch` to your local repo directory.

2. Apply the patch:

```bash
git checkout -b ci/run-e2e origin/main
git am < ci/ci-run-e2e.patch
```

3. Push the branch:

```bash
git push --set-upstream origin ci/run-e2e
```

If you prefer to push from this environment, configure SSH on this machine or
use a personal access token (PAT). For security, it's better to perform the
push from your local machine.

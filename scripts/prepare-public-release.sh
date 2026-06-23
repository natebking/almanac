#!/usr/bin/env bash
#
# prepare-public-release.sh
#
# Builds a clean, single-commit orphan branch suitable for publishing Almanac as
# a public open-source repository. It does NOT push anywhere — it only creates a
# local branch you can review and then push to a brand-new GitHub repo.
#
# Why an orphan branch: the existing history contains a real operator email and
# infra ids in past commits. Publishing a fresh single commit avoids leaking any
# of that history. See docs/public-release-plan.md.
#
# Usage:
#   bash scripts/prepare-public-release.sh [branch-name]
# Then:
#   git remote add public git@github.com:natebking/almanac.git
#   git push public <branch-name>:main
#
set -euo pipefail

BRANCH="${1:-public-main}"
ORIGINAL_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

# Operator-internal files that must NOT ship in the public repo.
EXCLUDE=(
  "docs/almanac-deploy-readiness.md"
  "docs/almanac-alpha-testing-plan.md"
  "docs/almanac-vercel-auth-plan.md"
  "docs/almanac-prebuilt-systems-scan.md"
  "docs/open-source-release-plan.md"
  "docs/public-release-plan.md"
  "docs/market-positioning-research.md"
  "docs/superpowers"
)

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash your changes first" >&2
  echo "       (so the public snapshot is intentional), then re-run." >&2
  exit 1
fi

if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  echo "ERROR: branch '${BRANCH}' already exists. Delete it or pass another name." >&2
  exit 1
fi

echo "Creating clean orphan branch '${BRANCH}' from ${ORIGINAL_BRANCH}..."
git checkout --orphan "${BRANCH}" >/dev/null 2>&1
git add -A
for path in "${EXCLUDE[@]}"; do
  git rm -r --cached --quiet --ignore-unmatch "${path}" >/dev/null 2>&1 || true
done

# PII / secret guard over the staged set. Allows known placeholders.
echo "Scanning staged files for real PII, infra ids, and secrets..."
LEAKS="$(
  git diff --cached --name-only -z \
    | xargs -0 grep -lniE 'prj_[A-Za-z0-9]{8,}|[a-z0-9._%+-]+@(gmail|yahoo|hotmail|icloud|outlook|aol|proton)\.(com|me)' 2>/dev/null \
    | grep -v node_modules || true
)"
if [ -n "${LEAKS}" ]; then
  echo "ERROR: possible real PII/secret in files staged for public release:" >&2
  echo "${LEAKS}" >&2
  echo "Aborting. Scrub these, return to ${ORIGINAL_BRANCH}, and re-run." >&2
  git checkout -f "${ORIGINAL_BRANCH}" >/dev/null 2>&1
  git branch -D "${BRANCH}" >/dev/null 2>&1
  exit 1
fi

git commit -m "Almanac: initial public release" >/dev/null
echo
echo "Done. Branch '${BRANCH}' is a clean single commit with:"
git ls-files | wc -l | xargs echo "  files:"
echo
echo "Review it, then publish to a NEW empty GitHub repo:"
echo "  git remote add public git@github.com:natebking/almanac.git"
echo "  git push public ${BRANCH}:main"
echo
echo "Returning to ${ORIGINAL_BRANCH} (your working branch is untouched)."
git checkout "${ORIGINAL_BRANCH}" >/dev/null 2>&1

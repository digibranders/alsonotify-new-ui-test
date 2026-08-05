#!/usr/bin/env bash
#
# Vercel "Ignored Build Step".
#
# POLICY
#   - `main` (production)  -> always builds and deploys to app.alsonotify.com
#   - every other branch   -> skipped by default, no automatic preview deploy
#   - on demand            -> put [vercel deploy] anywhere in the commit message
#
# EXIT CODE SEMANTICS (Vercel's, and they are backwards from intuition):
#   exit 0  -> SKIP the build
#   exit 1  -> PROCEED with the build
#
# Vercel sets these for us:
#   VERCEL_ENV                  production | preview | development
#   VERCEL_GIT_COMMIT_REF       branch name
#   VERCEL_GIT_COMMIT_MESSAGE   full commit message
#
# Output from this script appears in the Vercel build log, so every decision
# below explains itself there.

set -uo pipefail

BRANCH="${VERCEL_GIT_COMMIT_REF:-unknown}"
ENVIRONMENT="${VERCEL_ENV:-unknown}"
MESSAGE="${VERCEL_GIT_COMMIT_MESSAGE:-}"

echo "Vercel ignore-build check"
echo "  branch:      ${BRANCH}"
echo "  environment: ${ENVIRONMENT}"

# 1. Production always builds. Never gate the main deploy behind anything
#    clever — a broken ignore script must not be able to block production.
if [ "${ENVIRONMENT}" = "production" ]; then
  echo "  -> BUILD (production deploy)"
  exit 1
fi

# 2. Explicit on-demand opt-in for any non-production branch.
case "${MESSAGE}" in
  *"[vercel deploy]"*)
    echo "  -> BUILD ([vercel deploy] found in commit message)"
    exit 1
    ;;
esac

# 3. Everything else is skipped.
echo "  -> SKIP (preview deploys are disabled by default)"
echo ""
echo "     To deploy this branch, either:"
echo "       * include [vercel deploy] in the commit message, or"
echo "       * run 'vercel deploy' from the Vercel CLI"
exit 0

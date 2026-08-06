#!/usr/bin/env bash
# Snapshot shipped JS size. Run before and after each optimisation task, so
# every claim in a perf commit is a measurement rather than an estimate.
#
# Usage: bash scripts/bundle-baseline.sh <label>
set -euo pipefail
cd "$(dirname "$0")/.."

LABEL="${1:-baseline}"
OUT="bundle-report-${LABEL}.txt"

echo "Building..."
pnpm run build > "/tmp/bundle-build-${LABEL}.log" 2>&1 || {
  echo "BUILD FAILED — see /tmp/bundle-build-${LABEL}.log" >&2
  tail -30 "/tmp/bundle-build-${LABEL}.log" >&2
  exit 1
}

{
  echo "=== Bundle report: ${LABEL} ==="
  echo

  echo "--- Total JS shipped (uncompressed) ---"
  find .next/static/chunks -name '*.js' -exec cat {} + | wc -c \
    | awk '{printf "%.1f KB\n", $1/1024}'

  echo
  echo "--- Total JS shipped (gzipped) ---"
  # Gzip each chunk separately: chunks are fetched separately, so a single
  # concatenated stream would overstate the sharing between them.
  find .next/static/chunks -name '*.js' -exec sh -c 'gzip -c "$1" | wc -c' _ {} \; \
    | awk '{s+=$1} END {printf "%.1f KB\n", s/1024}'

  echo
  echo "--- 15 largest chunks (KB, uncompressed) ---"
  find .next/static/chunks -name '*.js' -exec du -k {} + \
    | sort -rn | head -15

  echo
  echo "--- Chunk count ---"
  find .next/static/chunks -name '*.js' | wc -l | tr -d ' '
} | tee "$OUT"

echo
echo "Saved to ${OUT}"

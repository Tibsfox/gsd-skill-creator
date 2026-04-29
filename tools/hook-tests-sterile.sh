#!/usr/bin/env bash
# Hook self-test runner — runs every .claude/hooks/__tests__/*.test.sh
# under sterile execution. Authored 2026-04-29 in v1.49.586 component T2.2.
#
# Each individual test script ALSO wraps its node invocations in
# `env -i PATH=...` so PASS/FAIL never depends on the caller's env. This
# wrapper is the canonical "run all hook tests" entry point invoked by
# `npm run test:hooks` and any future CI step.
#
# Spec append: .planning/missions/v1-49-585-concerns-cleanup/work/specs/hook-conventions.md
#              → "Sterile execution convention" section (v1.49.586 T2.2).

set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
TESTS_DIR="$REPO_ROOT/.claude/hooks/__tests__"

if [ ! -d "$TESTS_DIR" ]; then
  echo "FAIL: tests dir not found: $TESTS_DIR" >&2
  exit 1
fi

shopt -s nullglob
TESTS=( "$TESTS_DIR"/*.test.sh )
if [ ${#TESTS[@]} -eq 0 ]; then
  echo "FAIL: no test scripts found in $TESTS_DIR" >&2
  exit 1
fi

TOTAL_PASS=0
TOTAL_FAIL=0
SUITE_FAIL=0

for t in "${TESTS[@]}"; do
  name="$(basename "$t")"
  echo "===> $name"
  output=$(bash "$t" 2>&1) || SUITE_FAIL=$((SUITE_FAIL + 1))
  echo "$output"
  summary=$(echo "$output" | tail -1)
  pass=$(echo "$summary" | grep -oE '^[0-9]+ passed' | head -1 | grep -oE '[0-9]+' || echo 0)
  fail=$(echo "$summary" | grep -oE '[0-9]+ failed' | head -1 | grep -oE '[0-9]+' || echo 0)
  TOTAL_PASS=$((TOTAL_PASS + pass))
  TOTAL_FAIL=$((TOTAL_FAIL + fail))
  echo ""
done

echo "===================================="
echo "hook-tests-sterile: $TOTAL_PASS passed, $TOTAL_FAIL failed across ${#TESTS[@]} suite(s)"
if [ $SUITE_FAIL -gt 0 ] || [ $TOTAL_FAIL -gt 0 ]; then
  exit 1
fi
exit 0

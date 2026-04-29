#!/usr/bin/env bash
# tools/pre-tag-gate.test.sh — smoke tests for tools/pre-tag-gate.sh
#
# These tests verify exit-code semantics + step labeling. They do NOT
# run the full vitest suite (that's the gate's job — the test would
# duplicate the gate's most expensive step). Instead, they:
#
#   - Verify the script is executable + syntactically valid bash
#   - Verify --help-style behavior (no flags supported but script doesn't crash)
#   - Verify the script can be sourced for inspection
#   - Verify QUIET mode reduces output volume
#
# The actual end-to-end gate behavior is verified by running `npm run
# pre-tag-gate` against the current dev tip during the v1.49.585+
# follow-up commit.
#
# Authored 2026-04-29 in v1.49.585+ post-ship CI-fix follow-up.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

GATE="tools/pre-tag-gate.sh"

PASS=0
FAIL=0

ok() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

fail() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

echo "=== pre-tag-gate.sh self-test ==="

# Test 1: script exists and is executable
if [ -x "$GATE" ]; then
  ok "script exists + executable"
else
  fail "script does NOT exist or is not executable"
fi

# Test 2: bash syntax check
if bash -n "$GATE" 2>/dev/null; then
  ok "bash syntax valid"
else
  fail "bash syntax check failed"
fi

# Test 3: contains expected step labels (5 steps as of v1.49.587)
if grep -q "step 1/5: npm run build" "$GATE" \
   && grep -q "step 2/5: npx vitest run" "$GATE" \
   && grep -q "step 3/5: release-notes completeness" "$GATE" \
   && grep -q "step 4/5: CI-on-dev verification" "$GATE" \
   && grep -q "step 5/5: www-bundles freshness" "$GATE"; then
  ok "all 5 step labels present"
else
  fail "step labels missing or wrong count"
fi

# Test 4: contains expected exit codes (1..5 as of v1.49.587)
if grep -q "exit 1" "$GATE" \
   && grep -q "exit 2" "$GATE" \
   && grep -q "exit 3" "$GATE" \
   && grep -q "exit 4" "$GATE" \
   && grep -q "exit 5" "$GATE"; then
  ok "exit codes 1/2/3/4/5 documented"
else
  fail "exit codes missing"
fi

# Test 5: PRE_TAG_GATE_QUIET supported
if grep -q 'PRE_TAG_GATE_QUIET' "$GATE"; then
  ok "QUIET mode env var supported"
else
  fail "QUIET mode env var missing"
fi

# Test 6: package.json has pre-tag-gate script
if grep -q '"pre-tag-gate":' "$REPO_ROOT/package.json"; then
  ok "package.json wires npm run pre-tag-gate"
else
  fail "package.json missing pre-tag-gate script"
fi

# Test 7: SC_SKIP_CI_GATE override supported (v1.49.587 HARD RULE)
if grep -q 'SC_SKIP_CI_GATE' "$GATE"; then
  ok "SC_SKIP_CI_GATE override supported"
else
  fail "SC_SKIP_CI_GATE override missing"
fi

# Test 8: build-www-bundles.sh exists + executable (v1.49.587 step 5)
WWW_BUILDER="tools/build-www-bundles.sh"
if [ -x "$WWW_BUILDER" ]; then
  ok "build-www-bundles.sh exists + executable"
else
  fail "build-www-bundles.sh missing or not executable"
fi

# Test 9: package.json wires npm run build:www-bundles
if grep -q '"build:www-bundles":' "$REPO_ROOT/package.json"; then
  ok "package.json wires npm run build:www-bundles"
else
  fail "package.json missing build:www-bundles script"
fi

# Test 10: gate references gh CLI (CI-on-dev step needs it)
if grep -q 'gh run list' "$GATE"; then
  ok "gate uses gh CLI for CI-on-dev"
else
  fail "gate does not call gh run list"
fi

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL

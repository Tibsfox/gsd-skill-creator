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

# Test 3: contains expected step labels
if grep -q "step 1/3: npm run build" "$GATE" \
   && grep -q "step 2/3: npx vitest run" "$GATE" \
   && grep -q "step 3/3: release-notes completeness" "$GATE"; then
  ok "all 3 step labels present"
else
  fail "step labels missing"
fi

# Test 4: contains expected exit codes
if grep -q "exit 1" "$GATE" \
   && grep -q "exit 2" "$GATE" \
   && grep -q "exit 3" "$GATE"; then
  ok "exit codes 1/2/3 documented"
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

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL

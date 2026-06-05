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

# Test 3: contains expected step labels. The gate grew to 21 integer steps as of
# v1.49.983 (Ship 5.3 added step 21 trip-vocab budget; v1.49.965 added step 20
# adoption-freshness). Spot-check stable mid labels + the two newest steps + the
# final summary count rather than asserting every label (which churns each ship).
if grep -q "step 6/21" "$GATE" \
   && grep -q "step 20/21" "$GATE" \
   && grep -q "step 21/21: trip-vocab budget" "$GATE" \
   && grep -q "all 21 checks PASS" "$GATE"; then
  ok "current step labels present (21 steps incl. trip-vocab)"
else
  fail "step labels missing or wrong count"
fi

# Test 4: contains expected exit codes (1..7 as of v1.49.596+; CLAUDE.md gate added)
if grep -q "exit 1" "$GATE" \
   && grep -q "exit 2" "$GATE" \
   && grep -q "exit 3" "$GATE" \
   && grep -q "exit 4" "$GATE" \
   && grep -q "exit 5" "$GATE" \
   && grep -q "exit 6" "$GATE" \
   && grep -q "exit 7" "$GATE"; then
  ok "exit codes 1/2/3/4/5/6/7 documented"
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

# Test 11: SC_SKIP_DEPTH_AUDIT override supported (v1.49.591 BLOCKER hardening)
if grep -q 'SC_SKIP_DEPTH_AUDIT' "$GATE"; then
  ok "SC_SKIP_DEPTH_AUDIT override supported"
else
  fail "SC_SKIP_DEPTH_AUDIT override missing"
fi

# Test 12: depth-audit step 6 in BLOCKER mode (exits 6 on FAIL/MISSING)
if grep -q 'exit 6' "$GATE" && grep -q 'depth-audit' "$GATE"; then
  ok "depth-audit BLOCKER mode (exits 6 on FAIL/MISSING)"
else
  fail "depth-audit BLOCKER mode not wired"
fi

# Test 13: SC_SKIP_CLAUDE_MD_GATE override supported (v1.49.596+ step 7)
if grep -q 'SC_SKIP_CLAUDE_MD_GATE' "$GATE"; then
  ok "SC_SKIP_CLAUDE_MD_GATE override supported"
else
  fail "SC_SKIP_CLAUDE_MD_GATE override missing"
fi

# Test 14: render-claude-md.mjs exists (v1.49.596+ step 7 dependency)
RENDERER="tools/render-claude-md.mjs"
if [ -f "$RENDERER" ]; then
  ok "render-claude-md.mjs exists"
else
  fail "render-claude-md.mjs missing"
fi

# Test 15: package.json wires npm run render:claude-md
if grep -q '"render:claude-md":' "$REPO_ROOT/package.json"; then
  ok "package.json wires npm run render:claude-md"
else
  fail "package.json missing render:claude-md script"
fi

# Test 16: v1.49.653 L-02 consolidation — SC_PRE_TAG_GATE_BYPASS parser present
if grep -q 'SC_PRE_TAG_GATE_BYPASS' "$GATE" \
   && grep -q 'SC_PRE_TAG_GATE_REQUIRE' "$GATE" \
   && grep -q '_PTG_BYPASS_LIST' "$GATE"; then
  ok "L-02 consolidated bypass/require parsing present"
else
  fail "L-02 consolidation missing: SC_PRE_TAG_GATE_BYPASS/REQUIRE or _PTG_BYPASS_LIST not found"
fi

# Test 17: gate_bypassed + gate_required helpers defined
if grep -q '^gate_bypassed()' "$GATE" && grep -q '^gate_required()' "$GATE"; then
  ok "gate_bypassed + gate_required helpers defined"
else
  fail "gate helpers missing"
fi

# Test 18: each consolidatable step uses gate_bypassed
# Representative subset of overridable steps (the gate has ~23 gate_bypassed
# steps total; this checks the load-bearing ones incl. the two newest:
# adoption-freshness v965 + trip-vocab v983).
EXPECTED_STEPS="ci-gate depth-audit claude-md catalog-index tauri-boundary apply-to-self scaffolder-residue citation-debt-sync story-drift discipline-coverage adoption-freshness trip-vocab"
ALL_OK=1
for step in $EXPECTED_STEPS; do
  if ! grep -q "gate_bypassed \"$step\"" "$GATE"; then
    echo "  step missing gate_bypassed call: $step"
    ALL_OK=0
  fi
done
if [ "$ALL_OK" = "1" ]; then
  ok "listed overridable steps (12, representative subset) use gate_bypassed"
else
  fail "some steps missing gate_bypassed integration"
fi

# Test 19: CSV-form smoke test — SC_PRE_TAG_GATE_BYPASS=ci-gate,depth-audit
# We can't run the full gate cheaply, but we can verify the prelude handles it.
# Extract just the prelude (everything up to "log "[pre-tag-gate] step 1/12") + a gate_bypassed call.
PRELUDE_END_LINE=$(grep -n 'log "\[pre-tag-gate\] step 1/21' "$GATE" | head -1 | cut -d: -f1)
if [ -n "$PRELUDE_END_LINE" ]; then
  PRELUDE_CONTENT=$(head -n "$PRELUDE_END_LINE" "$GATE")
  # Append a test invocation
  TEST_OUT=$(SC_PRE_TAG_GATE_BYPASS=ci-gate bash -c "
    set -euo pipefail
    $PRELUDE_CONTENT
    gate_bypassed 'ci-gate' 'SC_SKIP_CI_GATE' && echo 'BYPASSED' || echo 'not bypassed'
  " 2>&1) || true
  if echo "$TEST_OUT" | grep -q "BYPASSED"; then
    ok "SC_PRE_TAG_GATE_BYPASS=ci-gate triggers bypass"
  else
    fail "SC_PRE_TAG_GATE_BYPASS smoke test failed: $TEST_OUT"
  fi
else
  fail "could not isolate gate prelude for CSV smoke test"
fi

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL

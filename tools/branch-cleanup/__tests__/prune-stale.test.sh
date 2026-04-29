#!/usr/bin/env bash
# Self-test for tools/branch-cleanup/prune-stale.sh
#
# Creates an isolated temp git repo with mock branches and runs the script
# in dry-run + apply modes, asserting expected behavior.
#
# Authored 2026-04-28 in v1.49.585 component C10.

set -euo pipefail

# Resolve script-under-test ABSOLUTE path BEFORE we cd into the temp dir.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$(cd "$HERE/.." && pwd)/prune-stale.sh"
[ -x "$SCRIPT" ] || { echo "FAIL: script-under-test not executable: $SCRIPT"; exit 1; }

# Temp working dir
TMPDIR="$(mktemp -d)"
trap "rm -rf $TMPDIR" EXIT
cd "$TMPDIR"

# Setup mini git repo with mock branches
git init --quiet
git config user.email "test@test.local"
git config user.name "test"
git config commit.gpgsign false 2>/dev/null || true
echo "x" > foo
git add foo
git commit -q -m "initial"

# Rename initial branch to 'dev' for compat with script's --merged dev check
git branch -m dev

# Create main, v1.50 (PROTECTED), and 3 prune candidates (all merged-into-dev)
for b in main v1.50 artemis-ii pr30-cherry worktree-agent-deadbeef; do
  git branch "$b"
done

# Create custom allowlist matching repo state
mkdir -p .planning/missions/v1-49-585-concerns-cleanup/work/specs
cat > .planning/missions/v1-49-585-concerns-cleanup/work/specs/branch-prune-allowlist.txt <<'EOF'
# test allowlist
artemis-ii
pr30-cherry
worktree-agent-deadbeef
EOF

# Test runner helpers
PASS=0; FAIL=0
run_test() {
  local name="$1"; shift
  if "$@"; then
    echo "  PASS: $name"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $name"
    FAIL=$((FAIL+1))
  fi
}

# CF-C10-01: dry-run lists 3 candidates without deleting
test_dry_run() {
  local out
  out=$(bash "$SCRIPT" 2>&1)
  echo "$out" | grep -q "TO DELETE (3 branches)" || return 1
  # Branch count should be unchanged: dev, main, v1.50, artemis-ii, pr30-cherry, worktree-agent-deadbeef = 6
  local count
  count=$(git branch | wc -l)
  [ "$count" = "6" ] || { echo "    branch count = $count, expected 6"; return 1; }
  return 0
}

# CF-C10-02: apply mode prunes 3 candidates; protected survive
test_apply() {
  bash "$SCRIPT" --apply >/dev/null 2>&1 || return 1
  # Protected branches still present
  git show-ref --verify --quiet refs/heads/dev || return 1
  git show-ref --verify --quiet refs/heads/main || return 1
  git show-ref --verify --quiet refs/heads/v1.50 || return 1
  # Candidates deleted
  ! git show-ref --verify --quiet refs/heads/artemis-ii || return 1
  ! git show-ref --verify --quiet refs/heads/pr30-cherry || return 1
  ! git show-ref --verify --quiet refs/heads/worktree-agent-deadbeef || return 1
  return 0
}

# Defense-in-depth: allowlist with 'main' must FATAL exit 3
test_protected_fatal() {
  cat > .planning/missions/v1-49-585-concerns-cleanup/work/specs/branch-prune-allowlist.txt <<'EOF'
main
EOF
  # Disable -e for this test so we can capture the failing exit code
  set +e
  bash "$SCRIPT" >/dev/null 2>&1
  local exit_code=$?
  set -e
  if [ "$exit_code" = "0" ]; then
    echo "    script accepted protected branch — should have FAILED"
    return 1
  fi
  if [ "$exit_code" != "3" ]; then
    echo "    exit code = $exit_code, expected 3"
    return 1
  fi
  return 0
}

# Run tests
echo "=== prune-stale.sh self-test ==="
run_test "CF-C10-01: dry-run lists candidates without deleting" test_dry_run
run_test "CF-C10-02: --apply prunes candidates; protected survive" test_apply
run_test "Defense-in-depth: protected name in allowlist → FATAL exit 3" test_protected_fatal

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL

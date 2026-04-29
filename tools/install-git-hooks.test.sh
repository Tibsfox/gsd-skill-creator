#!/usr/bin/env bash
# Self-test for tools/install-git-hooks.sh
# Tests the 4-case algorithm: missing → install; identical → no-op; differs → warn-and-skip.
# Authored 2026-04-28 in v1.49.585 component C05.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER="$HERE/install-git-hooks.sh"

[ -x "$INSTALLER" ] || { echo "FAIL: installer not executable: $INSTALLER"; exit 1; }

# Create temp git repo with mock source hooks
TMPDIR="$(mktemp -d)"
trap "rm -rf $TMPDIR" EXIT
cd "$TMPDIR"
git init --quiet

# Mock the tools/git-hooks/ dir with a sample hook
mkdir -p tools/git-hooks
cat > tools/git-hooks/pre-push <<'EOF'
#!/bin/sh
echo "test hook"
EOF
chmod +x tools/git-hooks/pre-push

# Copy installer into temp tree
cp "$INSTALLER" tools/install-git-hooks.sh
chmod +x tools/install-git-hooks.sh

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

# Test 1: target missing → install
test_install_when_missing() {
  rm -f .git/hooks/pre-push
  bash tools/install-git-hooks.sh >/dev/null 2>&1
  [ -x .git/hooks/pre-push ]
}

# Test 2: target identical → no-op
test_noop_when_identical() {
  bash tools/install-git-hooks.sh >/dev/null 2>&1  # ensure installed
  local before_size
  before_size=$(wc -c < .git/hooks/pre-push)
  bash tools/install-git-hooks.sh >/dev/null 2>&1
  local after_size
  after_size=$(wc -c < .git/hooks/pre-push)
  [ "$before_size" = "$after_size" ]
}

# Test 3: target divergent → warn-and-skip (preserves existing)
test_skip_when_divergent() {
  echo "#!/bin/sh
echo 'OPERATOR-MODIFIED'
" > .git/hooks/pre-push
  chmod +x .git/hooks/pre-push
  local before_content
  before_content=$(cat .git/hooks/pre-push)
  bash tools/install-git-hooks.sh 2>&1 | grep -q "WARN" || return 1
  local after_content
  after_content=$(cat .git/hooks/pre-push)
  [ "$before_content" = "$after_content" ]
}

echo "=== install-git-hooks.sh self-test ==="
run_test "Case 1: target missing → install" test_install_when_missing
run_test "Case 2: identical → no-op" test_noop_when_identical
run_test "Case 3: divergent → warn-and-skip (target preserved)" test_skip_when_divergent

echo ""
echo "$PASS passed, $FAIL failed"
exit $FAIL

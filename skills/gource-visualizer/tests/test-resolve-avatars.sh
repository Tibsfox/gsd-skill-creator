#!/usr/bin/env bash
# =============================================================================
# test-resolve-avatars.sh -- Tests for resolve-avatars.sh
# =============================================================================
#
# Validates that resolve-avatars.sh fetches GitHub contributor avatars
# with proper naming, caching, rate limiting, and placeholder fallback.
#
# All tests use a mock curl to avoid real network access. The mock is
# prepended to PATH so the production script uses it transparently.
#
# Uses inline test harness (no external deps). All tests should FAIL when
# production script does not exist yet (RED phase).
#
# Phase 399-02 -- Generation
# =============================================================================

set -euo pipefail

PASS=0; FAIL=0; ERRORS=""
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/scripts/resolve-avatars.sh"

assert_eq() {
  if [[ "$1" == "$2" ]]; then
    ((PASS++))
  else
    ((FAIL++))
    ERRORS+="  FAIL: $3 -- expected '$2', got '$1'\n"
  fi
}

assert_true() {
  if eval "$1"; then
    ((PASS++))
  else
    ((FAIL++))
    ERRORS+="  FAIL: $2\n"
  fi
}

assert_false() {
  if ! eval "$1"; then
    ((PASS++))
  else
    ((FAIL++))
    ERRORS+="  FAIL: $2 (expected failure)\n"
  fi
}

assert_exit() {
  local expected=$1; shift
  local actual
  set +e; "$@" >/dev/null 2>&1; actual=$?; set -e
  if [[ "$actual" -eq "$expected" ]]; then
    ((PASS++))
  else
    ((FAIL++))
    ERRORS+="  FAIL: expected exit $expected, got $actual -- $*\n"
  fi
}

report() {
  echo ""
  echo "Results: $PASS passed, $FAIL failed"
  if [[ $FAIL -gt 0 ]]; then printf "%b" "$ERRORS"; exit 1; fi
}
trap report EXIT

# ---------------------------------------------------------------------------
# Mock curl setup
# ---------------------------------------------------------------------------

setup_mock_curl() {
  local mock_dir="$1"
  cat > "$mock_dir/curl" << 'MOCK_EOF'
#!/usr/bin/env bash
# Mock curl that returns canned GitHub API responses and logs calls

LOGFILE="${MOCK_CURL_LOG:-/dev/null}"

# Log all args for inspection
echo "CURL_CALL: $*" >> "$LOGFILE"

# Detect output file (-o flag)
output_file=""
prev=""
for arg in "$@"; do
  if [[ "$prev" == "-o" ]]; then
    output_file="$arg"
  fi
  prev="$arg"
done

for arg in "$@"; do
  case "$arg" in
    *api.github.com/search/users*)
      echo '{"items":[{"login":"alice","avatar_url":"https://avatars.example.com/alice.png"}]}'
      exit 0
      ;;
    *avatars.example.com*)
      # Write a tiny fake PNG to the output file or stdout
      if [[ -n "$output_file" ]]; then
        printf '\x89PNG\r\n\x1a\n' > "$output_file"
      else
        printf '\x89PNG\r\n\x1a\n'
      fi
      exit 0
      ;;
  esac
done

# Default: return empty search result
echo '{"items":[]}'
exit 0
MOCK_EOF
  chmod +x "$mock_dir/curl"
}

# Also mock jq if not available, to ensure tests work everywhere
setup_mock_jq() {
  local mock_dir="$1"
  # Only mock if jq is not installed
  if command -v jq &>/dev/null; then
    return 0
  fi
  cat > "$mock_dir/jq" << 'JQ_EOF'
#!/usr/bin/env bash
# Minimal jq mock for avatar_url extraction
input=$(cat)
case "$1" in
  *avatar_url*)
    url=$(echo "$input" | grep -oP '"avatar_url"\s*:\s*"\K[^"]+' || true)
    if [[ -n "$url" ]]; then
      echo "$url"
    fi
    ;;
  *items*)
    echo "$input"
    ;;
  *)
    echo "$input"
    ;;
esac
JQ_EOF
  chmod +x "$mock_dir/jq"
}

# ---------------------------------------------------------------------------
# Fixture: create a git repo with GitHub remote
# ---------------------------------------------------------------------------

create_github_repo() {
  local dir
  dir=$(mktemp -d)
  cd "$dir"
  git init -b main . >/dev/null 2>&1
  git config user.email "alice@example.com"
  git config user.name "Alice Developer"
  echo "v1" > file.txt
  git add file.txt
  git commit -m "initial" >/dev/null 2>&1
  # Add second contributor
  git config user.email "bob@example.com"
  git config user.name "Bob Builder"
  echo "v2" > file2.txt
  git add file2.txt
  git commit -m "bob's work" >/dev/null 2>&1
  # Set a GitHub remote
  git remote add origin "https://github.com/test/test-repo.git" 2>/dev/null
  echo "$dir"
}

create_local_repo() {
  local dir
  dir=$(mktemp -d)
  cd "$dir"
  git init -b main . >/dev/null 2>&1
  git config user.email "charlie@example.com"
  git config user.name "Charlie Local"
  echo "hello" > file.txt
  git add file.txt
  git commit -m "local commit" >/dev/null 2>&1
  # No remote
  echo "$dir"
}

create_empty_git_dir() {
  local dir
  dir=$(mktemp -d)
  cd "$dir"
  git init -b main . >/dev/null 2>&1
  git config user.email "test@example.com"
  git config user.name "Test"
  # No commits at all
  echo "$dir"
}

# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

echo "=== test-resolve-avatars.sh ==="

# -- test_creates_output_dir --
echo "  test_creates_output_dir"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>/dev/null || true
assert_true "[[ -d \"$OUT_DIR\" ]]" "test_creates_output_dir: output directory was created"
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR"

# -- test_avatar_naming --
echo "  test_avatar_naming"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>/dev/null || true
# Avatar files should be named after git contributor names
assert_true "[[ -f \"$OUT_DIR/Alice Developer.png\" ]]" "test_avatar_naming: Alice Developer.png exists"
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR"

# -- test_non_writable_dir_exits_2 --
echo "  test_non_writable_dir_exits_2"
REPO=$(create_github_repo)
assert_exit 2 "$SCRIPT" "$REPO" "/root/nope/avatars"
rm -rf "$REPO"

# -- test_no_contributors_exits_1 --
echo "  test_no_contributors_exits_1"
REPO=$(create_empty_git_dir)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
assert_exit 1 env PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR"
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR"

# -- test_caching_no_redownload --
echo "  test_caching_no_redownload"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
CURL_LOG=$(mktemp)
export MOCK_CURL_LOG="$CURL_LOG"
# First run
PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>/dev/null || true
first_calls=$(grep -c "CURL_CALL" "$CURL_LOG" || true)
# Second run -- should skip cached
echo "" > "$CURL_LOG"
stderr_output=$(PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>&1 >/dev/null || true)
has_cache_msg=$(echo "$stderr_output" | grep -ciE "cached|skipping|skip" || true)
assert_true "[[ $has_cache_msg -ge 1 ]]" "test_caching_no_redownload: stderr mentions cached/skipping"
unset MOCK_CURL_LOG
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR" "$CURL_LOG"

# -- test_github_token_header --
echo "  test_github_token_header"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
CURL_LOG=$(mktemp)
export MOCK_CURL_LOG="$CURL_LOG"
export GITHUB_TOKEN="test123"
PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>/dev/null || true
has_auth=$(grep -c "Authorization" "$CURL_LOG" || true)
assert_true "[[ $has_auth -ge 1 ]]" "test_github_token_header: curl called with Authorization header"
unset GITHUB_TOKEN MOCK_CURL_LOG
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR" "$CURL_LOG"

# -- test_non_github_repo_skips_api --
echo "  test_non_github_repo_skips_api"
REPO=$(create_local_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
CURL_LOG=$(mktemp)
export MOCK_CURL_LOG="$CURL_LOG"
stderr_output=$(PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>&1 >/dev/null || true)
api_calls=$(grep -c "api.github.com" "$CURL_LOG" || true)
has_skip_msg=$(echo "$stderr_output" | grep -ciE "non-github|skip|no github" || true)
assert_eq "$api_calls" "0" "test_non_github_repo_skips_api: no GitHub API calls"
assert_true "[[ $has_skip_msg -ge 1 ]]" "test_non_github_repo_skips_api: stderr mentions non-GitHub"
unset MOCK_CURL_LOG
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR" "$CURL_LOG"

# -- test_rate_limit_respected --
echo "  test_rate_limit_respected"
# We verify by checking the script source for a rate limit counter/mechanism
assert_true "grep -qE '(rate_limit|request_count|req_count|MAX_REQUESTS)' \"$SCRIPT\"" \
  "test_rate_limit_respected: script contains rate limiting logic"

# -- test_multiple_contributors --
echo "  test_multiple_contributors"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>/dev/null || true
png_count=$(find "$OUT_DIR" -name "*.png" 2>/dev/null | wc -l || true)
assert_true "[[ $png_count -ge 2 ]]" "test_multiple_contributors: at least 2 avatar files created (got $png_count)"
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR"

# -- test_hit_rate_report --
echo "  test_hit_rate_report"
REPO=$(create_github_repo)
MOCK_DIR=$(mktemp -d)
setup_mock_curl "$MOCK_DIR"
setup_mock_jq "$MOCK_DIR"
OUT_DIR=$(mktemp -d)/avatars
stderr_output=$(PATH="$MOCK_DIR:$PATH" "$SCRIPT" "$REPO" "$OUT_DIR" 2>&1 >/dev/null || true)
# Should contain "N/M avatars" format
has_report=$(echo "$stderr_output" | grep -cE "[0-9]+/[0-9]+ avatar" || true)
assert_true "[[ $has_report -ge 1 ]]" "test_hit_rate_report: stderr contains N/M avatars report"
rm -rf "$REPO" "$MOCK_DIR" "$OUT_DIR"

echo ""
echo "=== All avatar tests complete ==="

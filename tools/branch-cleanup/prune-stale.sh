#!/usr/bin/env bash
# tools/branch-cleanup/prune-stale.sh — paved-path local-branch cleanup
#
# Reads the explicit allowlist from
#   .planning/missions/v1-49-585-concerns-cleanup/work/specs/branch-prune-allowlist.txt
# and prunes each listed branch via `git branch -d`. Refuses to touch dev/main/v1.50
# even if (somehow) they appear in the allowlist (defense-in-depth).
#
# Default: dry-run. Use --apply to execute.
# Authored 2026-04-28 in v1.49.585 component C10.
#
# Exit codes:
#   0 = success (or dry-run completed cleanly)
#   1 = unknown arg
#   2 = allowlist not found
#   3 = allowlist contains protected branch (FATAL)
#   4 = some deletions failed during --apply

set -euo pipefail

# Resolve repo root (script may be invoked from anywhere)
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FATAL: not in a git repo" >&2
  exit 1
}
cd "$REPO_ROOT"

# Allow override via ALLOWLIST_PATH env (used by self-test)
DEFAULT_ALLOWLIST=".planning/missions/v1-49-585-concerns-cleanup/work/specs/branch-prune-allowlist.txt"
ALLOWLIST_PATH="${ALLOWLIST_PATH:-$DEFAULT_ALLOWLIST}"
PROTECTED=("dev" "main" "v1.50")
APPLY=0

for arg in "$@"; do
  case "$arg" in
    --apply)
      APPLY=1
      ;;
    -h|--help)
      cat <<EOF
Usage: $0 [--apply]

Reads ${ALLOWLIST_PATH} for the list of branches to prune.

Default: dry-run (lists candidates without deleting).
With --apply: invokes 'git branch -d <name>' for each candidate.

Protected branches (NEVER deleted): ${PROTECTED[*]}.
The script also refuses to delete the currently-checked-out branch.

Use 'git branch -D' manually if you want to force-delete an unmerged branch.
EOF
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 1
      ;;
  esac
done

# Verify allowlist exists
if [ ! -f "$ALLOWLIST_PATH" ]; then
  echo "ERROR: allowlist not found at $ALLOWLIST_PATH" >&2
  echo "       (this script depends on C00 — re-run W0)" >&2
  exit 2
fi

# Read allowlist (skip comments + blanks)
ALLOWLIST=()
while IFS= read -r line; do
  trimmed="${line%%#*}"          # strip inline comments
  trimmed="${trimmed#"${trimmed%%[![:space:]]*}"}"   # ltrim
  trimmed="${trimmed%"${trimmed##*[![:space:]]}"}"   # rtrim
  [ -z "$trimmed" ] && continue
  ALLOWLIST+=("$trimmed")
done < "$ALLOWLIST_PATH"

# Defense-in-depth: refuse if allowlist contains a protected name
for branch in "${ALLOWLIST[@]}"; do
  for protected in "${PROTECTED[@]}"; do
    if [ "$branch" = "$protected" ]; then
      echo "FATAL: allowlist contains protected branch name: $branch" >&2
      echo "       Refusing to proceed." >&2
      exit 3
    fi
  done
done

# Determine current branch
CURRENT_BRANCH="$(git branch --show-current)"

# Walk allowlist, classify
TO_DELETE=()
SKIP_NOT_PRESENT=()
SKIP_CURRENT=()
SKIP_UNMERGED=()

for branch in "${ALLOWLIST[@]}"; do
  if [ "$branch" = "$CURRENT_BRANCH" ]; then
    SKIP_CURRENT+=("$branch")
    continue
  fi
  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    SKIP_NOT_PRESENT+=("$branch")
    continue
  fi
  # Check merged status (-d would refuse anyway; we report it cleanly)
  if ! git branch --merged dev 2>/dev/null | grep -qE "^[ *]+${branch}\$"; then
    SKIP_UNMERGED+=("$branch")
    continue
  fi
  TO_DELETE+=("$branch")
done

# Report
echo "Branch prune plan (allowlist: $ALLOWLIST_PATH)"
echo ""
echo "  Protected (never touched): ${PROTECTED[*]}"
echo "  Current branch: $CURRENT_BRANCH"
echo ""
echo "  TO DELETE (${#TO_DELETE[@]} branches):"
for b in "${TO_DELETE[@]:-}"; do [ -n "$b" ] && echo "    - $b"; done
echo ""
if [ "${#SKIP_NOT_PRESENT[@]}" -gt 0 ]; then
  echo "  SKIPPED (not present locally — already deleted) (${#SKIP_NOT_PRESENT[@]}):"
  for b in "${SKIP_NOT_PRESENT[@]}"; do echo "    - $b"; done
  echo ""
fi
if [ "${#SKIP_CURRENT[@]}" -gt 0 ]; then
  echo "  SKIPPED (currently checked out) (${#SKIP_CURRENT[@]}):"
  for b in "${SKIP_CURRENT[@]}"; do echo "    - $b"; done
  echo ""
fi
if [ "${#SKIP_UNMERGED[@]}" -gt 0 ]; then
  echo "  SKIPPED (unmerged into dev — use 'git branch -D' manually if intentional) (${#SKIP_UNMERGED[@]}):"
  for b in "${SKIP_UNMERGED[@]}"; do echo "    - $b"; done
  echo ""
fi

if [ "$APPLY" -eq 0 ]; then
  echo "Dry-run mode. Re-run with --apply to execute the deletions."
  exit 0
fi

# Apply
if [ "${#TO_DELETE[@]}" -eq 0 ]; then
  echo "Nothing to delete."
  exit 0
fi

echo "Deleting ${#TO_DELETE[@]} branches..."
FAILED=()
for branch in "${TO_DELETE[@]}"; do
  if git branch -d "$branch" 2>&1; then
    echo "  ✓ deleted $branch"
  else
    echo "  ✗ failed to delete $branch (preserve and inspect manually)"
    FAILED+=("$branch")
  fi
done

if [ "${#FAILED[@]}" -gt 0 ]; then
  echo ""
  echo "WARNING: ${#FAILED[@]} branches failed to delete; inspect manually:" >&2
  for b in "${FAILED[@]}"; do echo "  - $b" >&2; done
  exit 4
fi

echo ""
echo "Done. ${#TO_DELETE[@]} branches deleted."

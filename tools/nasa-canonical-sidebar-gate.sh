#!/usr/bin/env bash
# nasa-canonical-sidebar-gate.sh — verify every NASA mission page in
# www/.../NASA/<ver>/index.html contains the canonical sidebar triple:
#   1. <div class="organism-card"> (primary plant/fungus/lichen card)
#   2. <h3>Bird:|Animal:|Plant:|Habitat: <name>   (SPS companion card)
#   3. S36 Pairing — <name>  OR  Dedicated to <name>  (S36 musician anchor)
#
# Wraps .planning/sps-s36-mapping/audit-canonical-conformance.sh and returns
# non-zero if any mission fails the canonical-sidebar audit. Designed for
# tools/pre-tag-gate.sh step 16. Companion to the existing layout gate at
# tools/nasa-canonical-layout-gate.sh (which checks the 12 main-column cards).
#
# Exit codes:
#   0  all missions PASS the canonical-sidebar audit
#   1  one or more missions fail (caller decides BLOCK vs WARN)
#   2  unexpected error (audit script missing, no NASA dir, etc.)
#
# Flags:
#   --json  emit JSON summary instead of human text
#
# Codified 2026-05-24 after the 169/169 PASS milestone closed the
# canonical-sidebar rollout campaign (handoff at
# .planning/HANDOFF-CANONICAL-SIDEBAR-V1.38-V1.49-2026-05-24.md). Locks in
# the gain: future ships that introduce a new NASA page without the
# canonical sidebar trio will be blocked before tag.

set -u

JSON=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FATAL: not in a git repo" >&2
  exit 2
}
cd "$REPO_ROOT"

AUDIT="$REPO_ROOT/.planning/sps-s36-mapping/audit-canonical-conformance.sh"
[[ -x "$AUDIT" ]] || [[ -f "$AUDIT" ]] || {
  echo "audit script missing: $AUDIT" >&2
  exit 2
}

# Run audit to a temp file (don't pollute audit-results.tsv)
tmp="$(mktemp -t nasa-canonical-sidebar-gate.XXXXXX)"
trap 'rm -f "$tmp"' EXIT

if ! bash "$AUDIT" > "$tmp" 2>/dev/null; then
  echo "audit script failed to run" >&2
  exit 2
fi

# Tally verdicts (column 6, skip header)
total=$(awk -F'\t' 'NR>1' "$tmp" | wc -l)
pass=$(awk -F'\t' 'NR>1 && $6=="PASS"' "$tmp" | wc -l)
fails=$(awk -F'\t' 'NR>1 && $6!="PASS" {print $1":"$6}' "$tmp")
fail_count=$(printf '%s\n' "$fails" | grep -c . || true)

if (( JSON )); then
  printf '{"total":%d,"pass":%d,"fail":%d,"failures":[' "$total" "$pass" "$fail_count"
  if [[ -n "$fails" ]]; then
    first=1
    while IFS= read -r line; do
      (( first )) || printf ','
      first=0
      printf '"%s"' "$line"
    done <<< "$fails"
  fi
  printf ']}\n'
else
  echo "NASA canonical-sidebar gate"
  echo "  checked: $total missions"
  echo "  PASS:    $pass"
  echo "  FAIL:    $fail_count"
  if (( fail_count > 0 )); then
    echo "  failures (degree:verdict):"
    printf '%s\n' "$fails" | head -20 | sed 's/^/    /'
    (( fail_count > 20 )) && echo "    ...(+$((fail_count - 20)) more)"
  fi
fi

(( fail_count > 0 )) && exit 1
exit 0

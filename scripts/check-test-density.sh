#!/usr/bin/env bash
#
# check-test-density.sh — Verify test LOC density against a minimum floor.
#
# Usage: scripts/check-test-density.sh <directory> [min_ratio]
#   directory  — path to scan for .ts files
#   min_ratio  — minimum test/deliverable ratio (default: 0.025 = 2.5%)
#
# Counts test LOC (*.test.ts, *.spec.ts) and deliverable LOC (all other *.ts)
# then computes the ratio and reports PASS/FAIL.

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <directory> [min_ratio]" >&2
    echo "  min_ratio defaults to 0.025 (2.5%)" >&2
    exit 1
fi

TARGET_DIR="$1"
MIN_RATIO="${2:-0.025}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: directory not found: $TARGET_DIR" >&2
    exit 1
fi

# Count test LOC — files matching *.test.ts or *.spec.ts
TEST_LOC=0
test_files="$(find "$TARGET_DIR" -type f \( -name '*.test.ts' -o -name '*.spec.ts' \) 2>/dev/null)" || true
if [ -n "$test_files" ]; then
    TEST_LOC="$(echo "$test_files" | xargs wc -l | tail -n 1 | awk '{print $1}')"
fi

# Count deliverable LOC — all *.ts files excluding tests
DELIV_LOC=0
deliv_files="$(find "$TARGET_DIR" -type f -name '*.ts' \
    ! -name '*.test.ts' \
    ! -name '*.spec.ts' 2>/dev/null)" || true
if [ -n "$deliv_files" ]; then
    DELIV_LOC="$(echo "$deliv_files" | xargs wc -l | tail -n 1 | awk '{print $1}')"
fi

# Compute ratio (avoid division by zero)
if [ "$DELIV_LOC" -eq 0 ]; then
    if [ "$TEST_LOC" -eq 0 ]; then
        RATIO="0.000"
    else
        RATIO="999.000"
    fi
else
    RATIO="$(awk "BEGIN { printf \"%.3f\", $TEST_LOC / $DELIV_LOC }")"
fi

# Determine PASS/FAIL
VERDICT="$(awk "BEGIN { print ($RATIO + 0 >= $MIN_RATIO + 0) ? \"PASS\" : \"FAIL\" }")"

# Output
echo "Directory:      $TARGET_DIR"
echo "Test LOC:       $TEST_LOC"
echo "Deliverable LOC: $DELIV_LOC"
echo "Ratio:          $RATIO"
echo "Floor:          $MIN_RATIO"
echo "Verdict:        $VERDICT"

if [ "$VERDICT" = "FAIL" ]; then
    exit 1
fi

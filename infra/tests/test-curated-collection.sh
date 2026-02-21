#!/usr/bin/env bash
# test-curated-collection.sh -- Validation test suite for curated Amiga collection
#
# Tests the YAML structure, entry counts, field completeness, and legal
# compliance of infra/amiga/curated-collection.yaml against the rules
# defined in infra/amiga/legal-guide.md.
#
# Usage: bash infra/tests/test-curated-collection.sh
#
# Follows test pattern from test-amiga-profiles.sh (assertion counting,
# pass/fail tracking, summary output).

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${INFRA_DIR:-${SCRIPT_DIR}/..}"
COLLECTION="${INFRA_DIR}/amiga/curated-collection.yaml"
LEGAL_GUIDE="${INFRA_DIR}/amiga/legal-guide.md"

assert_eq() {
    local description="$1" expected="$2" actual="$3"
    TESTS_RUN=$((TESTS_RUN + 1))
    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        printf "  PASS: %s\n" "${description}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILURES+=("${description}: expected '${expected}', got '${actual}'")
        printf "  FAIL: %s (expected '%s', got '%s')\n" "${description}" "${expected}" "${actual}"
    fi
}

assert_true() {
    local description="$1" condition="$2"
    TESTS_RUN=$((TESTS_RUN + 1))
    if eval "${condition}" >/dev/null 2>&1; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        printf "  PASS: %s\n" "${description}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILURES+=("${description}")
        printf "  FAIL: %s\n" "${description}"
    fi
}

assert_gt() {
    local description="$1" threshold="$2" actual="$3"
    TESTS_RUN=$((TESTS_RUN + 1))
    if [[ "${actual}" -gt "${threshold}" ]]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        printf "  PASS: %s (got %s)\n" "${description}" "${actual}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILURES+=("${description}: expected > ${threshold}, got ${actual}")
        printf "  FAIL: %s (expected > %s, got %s)\n" "${description}" "${threshold}" "${actual}"
    fi
}

# ---------------------------------------------------------------------------
# Helper: extract lines for a specific entry block
# Entry block: from "  - id: <id>" to next "  - id:" or end of section
# ---------------------------------------------------------------------------

entry_has_field() {
    local id="$1" field="$2"
    # Find line number of the id, then search forward for the field
    # within the next 20 lines (before the next entry starts)
    local id_line
    id_line=$(grep -n "^  - id: ${id}$" "${COLLECTION}" | head -1 | cut -d: -f1)
    if [[ -z "${id_line}" ]]; then
        return 1
    fi
    local end_line=$((id_line + 20))
    sed -n "${id_line},${end_line}p" "${COLLECTION}" | grep -q "    ${field}:" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Group 1: File existence and structure (5 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 1: File existence and structure ===\n\n"

assert_true "curated-collection.yaml exists" "[[ -f '${COLLECTION}' ]]"

# Check valid YAML-like structure: metadata, artworks, music, demos sections
assert_true "metadata section exists" "grep -q '^metadata:' '${COLLECTION}'"
assert_true "artworks section exists" "grep -q '^artworks:' '${COLLECTION}'"
assert_true "music section exists" "grep -q '^music:' '${COLLECTION}'"
assert_true "demos section exists" "grep -q '^demos:' '${COLLECTION}'"

# ---------------------------------------------------------------------------
# Group 1b: Metadata and legal guide reference (3 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 1b: Metadata integrity ===\n\n"

METADATA_VERSION=$(grep '  version:' "${COLLECTION}" | head -1 | awk '{print $2}')
assert_eq "metadata version is 1" "1" "${METADATA_VERSION}"

METADATA_TOTAL=$(grep '  total_items:' "${COLLECTION}" | head -1 | awk '{print $2}')
assert_eq "metadata total_items is 50" "50" "${METADATA_TOTAL}"

# Legal guide reference points to existing file
LEGAL_REF=$(grep '  legal_guide:' "${COLLECTION}" | head -1 | sed 's/.*"\(.*\)"/\1/')
assert_true "legal-guide.md reference points to existing file" "[[ -f '${INFRA_DIR}/../${LEGAL_REF}' ]] || [[ -f '${INFRA_DIR}/amiga/legal-guide.md' ]]"

# ---------------------------------------------------------------------------
# Group 2: Artwork entries (8 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 2: Artwork entries ===\n\n"

ART_COUNT=$(grep -c '^  - id: art-' "${COLLECTION}")
assert_eq "exactly 20 artwork entries" "20" "${ART_COUNT}"

# Check required fields on all artwork entries
ART_MISSING_FIELDS=0
for i in $(seq -w 1 20); do
    id="art-0${i}"
    # Adjust for entries 1-9 (art-001..009) vs 10-20 (art-010..020)
    if [[ ${i#0} -le 9 ]]; then
        id="art-00${i#0}"
    else
        id="art-0${i}"
    fi
    for field in title author format source_url license; do
        if ! entry_has_field "${id}" "${field}"; then
            ART_MISSING_FIELDS=$((ART_MISSING_FIELDS + 1))
        fi
    done
done
assert_eq "all artwork entries have required fields (id, title, author, format, source_url, license)" "0" "${ART_MISSING_FIELDS}"

# No abandonware or commercial license in artwork entries
ART_BAD_LICENSE=$(awk '/^artworks:/,/^music:/' "${COLLECTION}" | grep -c '    license: "abandonware"\|    license: "commercial"' || true)
assert_eq "no abandonware/commercial licenses in artworks" "0" "${ART_BAD_LICENSE}"

# All IDs follow art-NNN pattern
ART_BAD_IDS=$(grep '^  - id: art-' "${COLLECTION}" | grep -cv '^  - id: art-[0-9][0-9][0-9]$' || true)
assert_eq "all artwork IDs follow art-NNN pattern" "0" "${ART_BAD_IDS}"

# At least one OCS and one AGA entry
ART_OCS=$(awk '/^artworks:/,/^music:/' "${COLLECTION}" | grep -c '    chipset: "OCS"' || true)
assert_gt "at least one OCS artwork present" "0" "${ART_OCS}"

ART_AGA=$(awk '/^artworks:/,/^music:/' "${COLLECTION}" | grep -c '    chipset: "AGA"' || true)
assert_gt "at least one AGA artwork present" "0" "${ART_AGA}"

# Format field is always IFF/ILBM
ART_BAD_FORMAT=$(awk '/^artworks:/,/^music:/' "${COLLECTION}" | grep '    format:' | grep -cv '"IFF/ILBM"' || true)
assert_eq "all artwork format fields are IFF/ILBM" "0" "${ART_BAD_FORMAT}"

# Conversion target is always PNG
ART_BAD_TARGET=$(awk '/^artworks:/,/^music:/' "${COLLECTION}" | grep '      target_format:' | grep -cv '"PNG"' || true)
assert_eq "all artwork conversion targets are PNG" "0" "${ART_BAD_TARGET}"

# No duplicate IDs
ART_DUPES=$(grep '^  - id: art-' "${COLLECTION}" | sort | uniq -d | wc -l)
assert_eq "no duplicate artwork IDs" "0" "${ART_DUPES}"

# ---------------------------------------------------------------------------
# Group 3: Music entries (8 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 3: Music entries ===\n\n"

MUS_COUNT=$(grep -c '^  - id: mus-' "${COLLECTION}")
assert_eq "exactly 20 music entries" "20" "${MUS_COUNT}"

# Check required fields on all music entries
MUS_MISSING_FIELDS=0
for i in $(seq -w 1 20); do
    if [[ ${i#0} -le 9 ]]; then
        id="mus-00${i#0}"
    else
        id="mus-0${i}"
    fi
    for field in title author format source_url license; do
        if ! entry_has_field "${id}" "${field}"; then
            MUS_MISSING_FIELDS=$((MUS_MISSING_FIELDS + 1))
        fi
    done
done
assert_eq "all music entries have required fields (id, title, author, format, source_url, license)" "0" "${MUS_MISSING_FIELDS}"

# No abandonware or commercial license in music entries
MUS_BAD_LICENSE=$(awk '/^music:/,/^demos:/' "${COLLECTION}" | grep -c '    license: "abandonware"\|    license: "commercial"' || true)
assert_eq "no abandonware/commercial licenses in music" "0" "${MUS_BAD_LICENSE}"

# All IDs follow mus-NNN pattern
MUS_BAD_IDS=$(grep '^  - id: mus-' "${COLLECTION}" | grep -cv '^  - id: mus-[0-9][0-9][0-9]$' || true)
assert_eq "all music IDs follow mus-NNN pattern" "0" "${MUS_BAD_IDS}"

# Format field is MOD, MED, S3M, or XM
MUS_BAD_FORMAT=$(awk '/^music:/,/^demos:/' "${COLLECTION}" | grep '    format:' | grep -cvE '"(MOD|MED|S3M|XM)"' || true)
assert_eq "all music formats are MOD/MED/S3M/XM" "0" "${MUS_BAD_FORMAT}"

# At least one MOD and one MED entry present
MUS_MOD=$(awk '/^music:/,/^demos:/' "${COLLECTION}" | grep -c '    format: "MOD"' || true)
assert_gt "at least one MOD format present" "0" "${MUS_MOD}"

MUS_MED=$(awk '/^music:/,/^demos:/' "${COLLECTION}" | grep -c '    format: "MED"' || true)
assert_gt "at least one MED format present" "0" "${MUS_MED}"

# Conversion target is always FLAC
MUS_BAD_TARGET=$(awk '/^music:/,/^demos:/' "${COLLECTION}" | grep '      target_format:' | grep -cv '"FLAC"' || true)
assert_eq "all music conversion targets are FLAC" "0" "${MUS_BAD_TARGET}"

# No duplicate IDs
MUS_DUPES=$(grep '^  - id: mus-' "${COLLECTION}" | sort | uniq -d | wc -l)
assert_eq "no duplicate music IDs" "0" "${MUS_DUPES}"

# ---------------------------------------------------------------------------
# Group 4: Demo entries (9 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 4: Demo entries ===\n\n"

DEMO_COUNT=$(grep -c '^  - id: demo-' "${COLLECTION}")
assert_eq "exactly 10 demo entries" "10" "${DEMO_COUNT}"

# Check required fields on all demo entries
DEMO_MISSING_FIELDS=0
for i in $(seq -w 1 10); do
    if [[ ${i#0} -le 9 ]]; then
        id="demo-00${i#0}"
    else
        id="demo-0${i}"
    fi
    for field in title group source_url license; do
        if ! entry_has_field "${id}" "${field}"; then
            DEMO_MISSING_FIELDS=$((DEMO_MISSING_FIELDS + 1))
        fi
    done
done
assert_eq "all demo entries have required fields (id, title, group, source_url, license)" "0" "${DEMO_MISSING_FIELDS}"

# No abandonware or commercial license in demo entries
DEMO_BAD_LICENSE=$(awk '/^demos:/,0' "${COLLECTION}" | grep -c '    license: "abandonware"\|    license: "commercial"' || true)
assert_eq "no abandonware/commercial licenses in demos" "0" "${DEMO_BAD_LICENSE}"

# All IDs follow demo-NNN pattern
DEMO_BAD_IDS=$(grep '^  - id: demo-' "${COLLECTION}" | grep -cv '^  - id: demo-[0-9][0-9][0-9]$' || true)
assert_eq "all demo IDs follow demo-NNN pattern" "0" "${DEMO_BAD_IDS}"

# All entries have educational_value field
DEMO_EDU=0
for i in $(seq -w 1 10); do
    if [[ ${i#0} -le 9 ]]; then
        id="demo-00${i#0}"
    else
        id="demo-0${i}"
    fi
    if ! entry_has_field "${id}" "educational_value"; then
        DEMO_EDU=$((DEMO_EDU + 1))
    fi
done
assert_eq "all demo entries have educational_value field" "0" "${DEMO_EDU}"

# All entries have pouet_id field (integer or "pending")
DEMO_POUET=0
for i in $(seq -w 1 10); do
    if [[ ${i#0} -le 9 ]]; then
        id="demo-00${i#0}"
    else
        id="demo-0${i}"
    fi
    if ! entry_has_field "${id}" "pouet_id"; then
        DEMO_POUET=$((DEMO_POUET + 1))
    fi
done
assert_eq "all demo entries have pouet_id field" "0" "${DEMO_POUET}"

# License is always scene_production, freeware, or public_domain
DEMO_BAD_LICENSE_TYPE=$(awk '/^demos:/,0' "${COLLECTION}" | grep '    license:' | grep -cvE '"(scene_production|freeware|public_domain)"' || true)
assert_eq "all demo licenses are scene_production/freeware/public_domain" "0" "${DEMO_BAD_LICENSE_TYPE}"

# At least one OCS and one AGA demo present
DEMO_OCS=$(awk '/^demos:/,0' "${COLLECTION}" | grep -c '"Amiga OCS"' || true)
assert_gt "at least one OCS demo present" "0" "${DEMO_OCS}"

DEMO_AGA=$(awk '/^demos:/,0' "${COLLECTION}" | grep -c '"Amiga AGA"' || true)
assert_gt "at least one AGA demo present" "0" "${DEMO_AGA}"

# No duplicate IDs
DEMO_DUPES=$(grep '^  - id: demo-' "${COLLECTION}" | sort | uniq -d | wc -l)
assert_eq "no duplicate demo IDs" "0" "${DEMO_DUPES}"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

printf "\n=========================================\n"
printf "Results: %d/%d assertions passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"
printf "=========================================\n"

if [[ ${TESTS_FAILED} -gt 0 ]]; then
    printf "\nFailed assertions:\n"
    for failure in "${FAILURES[@]}"; do
        printf "  - %s\n" "${failure}"
    done
    printf "\n"
    exit 1
fi

printf "\nAll assertions passed.\n"
exit 0

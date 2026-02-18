#!/usr/bin/env bash
# test-amiga-corner.sh -- Validation test suite for Amiga Corner content files
#
# Tests all YAML catalogs (pixel art gallery, demo scene exhibit, tool evolution
# walkthrough, schematic spec), companion markdown guides, and the README.
# Verifies YAML parsing, content counts, required fields, and markdown completeness.
#
# Usage: bash infra/tests/test-amiga-corner.sh
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
CORNER_DIR="${INFRA_DIR}/knowledge-world/amiga-corner"

# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------

assert_eq() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected '${expected}', got '${actual}'")
        printf "  FAIL: %s (expected '%s', got '%s')\n" "${desc}" "${expected}" "${actual}"
    fi
}

assert_ge() {
    local desc="$1"
    local minimum="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${actual}" -ge "${minimum}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s (%s >= %s)\n" "${desc}" "${actual}" "${minimum}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected >= ${minimum}, got ${actual}")
        printf "  FAIL: %s (expected >= %s, got %s)\n" "${desc}" "${minimum}" "${actual}"
    fi
}

assert_file_exists() {
    local desc="$1"
    local filepath="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${filepath}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file '${filepath}' does not exist")
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${filepath}"
    fi
}

assert_yaml_valid() {
    local desc="$1"
    local filepath="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    local result
    if result=$(python3 -c "import yaml; yaml.safe_load(open('${filepath}')); print('valid')" 2>&1); then
        if [[ "${result}" == "valid" ]]; then
            TESTS_PASSED=$(( TESTS_PASSED + 1 ))
            printf "  PASS: %s\n" "${desc}"
        else
            TESTS_FAILED=$(( TESTS_FAILED + 1 ))
            FAILURES+=("${desc}: YAML parse returned unexpected: ${result}")
            printf "  FAIL: %s (%s)\n" "${desc}" "${result}"
        fi
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: YAML parse error: ${result}")
        printf "  FAIL: %s (parse error)\n" "${desc}"
    fi
}

assert_min_lines() {
    local desc="$1"
    local filepath="$2"
    local minimum="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ ! -f "${filepath}" ]]; then
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file '${filepath}' not found")
        printf "  FAIL: %s (file not found)\n" "${desc}"
        return
    fi
    local lines
    lines=$(wc -l < "${filepath}")
    if [[ "${lines}" -ge "${minimum}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s (%s lines >= %s)\n" "${desc}" "${lines}" "${minimum}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected >= ${minimum} lines, got ${lines}")
        printf "  FAIL: %s (%s lines < %s minimum)\n" "${desc}" "${lines}" "${minimum}"
    fi
}

assert_field_present() {
    local desc="$1"
    local filepath="$2"
    local field="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if grep -q "${field}" "${filepath}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: field '${field}' not found in ${filepath}")
        printf "  FAIL: %s ('%s' not found)\n" "${desc}" "${field}"
    fi
}

# ---------------------------------------------------------------------------
# Test Group 1: File existence (9 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 1: File Existence ===\n"

assert_file_exists "pixel-art-gallery.yaml exists" \
    "${CORNER_DIR}/pixel-art-gallery.yaml"

assert_file_exists "pixel-art-gallery.md exists" \
    "${CORNER_DIR}/pixel-art-gallery.md"

assert_file_exists "demo-scene-exhibit.yaml exists" \
    "${CORNER_DIR}/demo-scene-exhibit.yaml"

assert_file_exists "demo-scene-exhibit.md exists" \
    "${CORNER_DIR}/demo-scene-exhibit.md"

assert_file_exists "tool-evolution-walkthrough.yaml exists" \
    "${CORNER_DIR}/tool-evolution-walkthrough.yaml"

assert_file_exists "tool-evolution-walkthrough.md exists" \
    "${CORNER_DIR}/tool-evolution-walkthrough.md"

assert_file_exists "amiga-corner-schematic-spec.yaml exists" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml"

assert_file_exists "README.md exists" \
    "${CORNER_DIR}/README.md"

assert_file_exists "test-amiga-corner.sh exists (self-check)" \
    "${SCRIPT_DIR}/test-amiga-corner.sh"

# ---------------------------------------------------------------------------
# Test Group 2: Pixel art gallery content (6 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 2: Pixel Art Gallery Content ===\n"

assert_yaml_valid "pixel-art-gallery.yaml parses without error" \
    "${CORNER_DIR}/pixel-art-gallery.yaml"

ARTWORK_COUNT=$(grep -c "id: artwork-" "${CORNER_DIR}/pixel-art-gallery.yaml" || echo 0)
assert_ge "gallery has >= 5 artworks" 5 "${ARTWORK_COUNT}"

# Every artwork has legal_status
LEGAL_COUNT=$(grep -c "legal_status:" "${CORNER_DIR}/pixel-art-gallery.yaml" || echo 0)
assert_ge "every artwork has legal_status (${LEGAL_COUNT} >= ${ARTWORK_COUNT})" \
    "${ARTWORK_COUNT}" "${LEGAL_COUNT}"

# Every artwork has map_art section (match indented map_art: keys only, not map_art_notes:)
MAP_ART_COUNT=$(grep -c "^      map_art:" "${CORNER_DIR}/pixel-art-gallery.yaml" || echo 0)
assert_ge "every artwork has map_art section" \
    "${ARTWORK_COUNT}" "${MAP_ART_COUNT}"

# Every artwork has sign_text field
SIGN_COUNT=$(grep -c "sign_text:" "${CORNER_DIR}/pixel-art-gallery.yaml" || echo 0)
assert_ge "every artwork has sign_text" \
    "${ARTWORK_COUNT}" "${SIGN_COUNT}"

assert_min_lines "pixel-art-gallery.md has >= 80 lines" \
    "${CORNER_DIR}/pixel-art-gallery.md" 80

# ---------------------------------------------------------------------------
# Test Group 3: Demo scene exhibit content (6 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 3: Demo Scene Exhibit Content ===\n"

assert_yaml_valid "demo-scene-exhibit.yaml parses without error" \
    "${CORNER_DIR}/demo-scene-exhibit.yaml"

DEMO_COUNT=$(grep -c "id: demo-" "${CORNER_DIR}/demo-scene-exhibit.yaml" || echo 0)
assert_ge "exhibit has >= 5 productions" 5 "${DEMO_COUNT}"

# Every production has legal_status
DEMO_LEGAL=$(grep -c "legal_status:" "${CORNER_DIR}/demo-scene-exhibit.yaml" || echo 0)
assert_ge "every production has legal_status" \
    "${DEMO_COUNT}" "${DEMO_LEGAL}"

# Every production has technical_achievements
TECH_COUNT=$(grep -c "technical_achievements:" "${CORNER_DIR}/demo-scene-exhibit.yaml" || echo 0)
assert_ge "every production has technical_achievements" \
    "${DEMO_COUNT}" "${TECH_COUNT}"

# Every production has sign_text
DEMO_SIGN=$(grep -c "sign_text:" "${CORNER_DIR}/demo-scene-exhibit.yaml" || echo 0)
assert_ge "every production has sign_text" \
    "${DEMO_COUNT}" "${DEMO_SIGN}"

assert_min_lines "demo-scene-exhibit.md has >= 80 lines" \
    "${CORNER_DIR}/demo-scene-exhibit.md" 80

# ---------------------------------------------------------------------------
# Test Group 4: Tool evolution walkthrough content (6 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 4: Tool Evolution Walkthrough Content ===\n"

assert_yaml_valid "tool-evolution-walkthrough.yaml parses without error" \
    "${CORNER_DIR}/tool-evolution-walkthrough.yaml"

STATION_COUNT=$(grep -c "id: station-" "${CORNER_DIR}/tool-evolution-walkthrough.yaml" || echo 0)
assert_ge "walkthrough has >= 6 stations" 6 "${STATION_COUNT}"

# Every station has amiga_tool
AMIGA_TOOL_COUNT=$(grep -c "amiga_tool:" "${CORNER_DIR}/tool-evolution-walkthrough.yaml" || echo 0)
assert_ge "every station has amiga_tool" \
    "${STATION_COUNT}" "${AMIGA_TOOL_COUNT}"

# Every station has modern_equivalent
MODERN_COUNT=$(grep -c "modern_equivalent:" "${CORNER_DIR}/tool-evolution-walkthrough.yaml" || echo 0)
assert_ge "every station has modern_equivalent" \
    "${STATION_COUNT}" "${MODERN_COUNT}"

# Every station has sign_text
WALK_SIGN=$(grep -c "sign_text:" "${CORNER_DIR}/tool-evolution-walkthrough.yaml" || echo 0)
assert_ge "every station has sign_text" \
    "${STATION_COUNT}" "${WALK_SIGN}"

# Every station has build section
BUILD_COUNT=$(grep -c "^      build:" "${CORNER_DIR}/tool-evolution-walkthrough.yaml" || echo 0)
assert_ge "every station has build section" \
    "${STATION_COUNT}" "${BUILD_COUNT}"

assert_min_lines "tool-evolution-walkthrough.md has >= 100 lines" \
    "${CORNER_DIR}/tool-evolution-walkthrough.md" 100

# ---------------------------------------------------------------------------
# Test Group 5: Schematic specification (6 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 5: Schematic Specification ===\n"

assert_yaml_valid "amiga-corner-schematic-spec.yaml parses without error" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml"

ROOM_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${CORNER_DIR}/amiga-corner-schematic-spec.yaml'))
print(len(d['schematic']['rooms']))
" 2>/dev/null || echo 0)
assert_ge "schematic has >= 3 rooms" 3 "${ROOM_COUNT}"

assert_field_present "schematic has color_palette section" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml" "color_palette:"

assert_field_present "schematic has pathways section" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml" "pathways:"

assert_field_present "schematic has wayfinding section" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml" "wayfinding:"

assert_field_present "schematic has entry with gateway" \
    "${CORNER_DIR}/amiga-corner-schematic-spec.yaml" "gateway:"

# ---------------------------------------------------------------------------
# Test Group 6: README and cross-references (4 assertions)
# ---------------------------------------------------------------------------

printf "\n=== Group 6: README and Cross-References ===\n"

assert_min_lines "README.md has >= 40 lines" \
    "${CORNER_DIR}/README.md" 40

assert_field_present "README references pixel-art-gallery.yaml" \
    "${CORNER_DIR}/README.md" "pixel-art-gallery.yaml"

assert_field_present "README references demo-scene-exhibit.yaml" \
    "${CORNER_DIR}/README.md" "demo-scene-exhibit.yaml"

assert_field_present "README references tool-evolution-walkthrough.yaml" \
    "${CORNER_DIR}/README.md" "tool-evolution-walkthrough.yaml"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

printf "\n=== Results ===\n"
printf "%d/%d assertions passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"

if [[ ${TESTS_FAILED} -gt 0 ]]; then
    printf "\nFailures:\n"
    for failure in "${FAILURES[@]}"; do
        printf "  - %s\n" "${failure}"
    done
    exit 1
fi

printf "\nAll assertions passed.\n"
exit 0

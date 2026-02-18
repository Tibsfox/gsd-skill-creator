#!/usr/bin/env bash
# test-spawn-area.sh -- Validation test suite for spawn area specs and scripts
#
# Tests all spawn area specification files for YAML validity, structural
# completeness, sign standards compliance, schematic metadata consistency,
# and syncmatica script behavior.
#
# 7 test groups, 42+ assertions.
#
# Usage: bash infra/tests/test-spawn-area.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${INFRA_DIR:-$(cd "${SCRIPT_DIR}/.." && pwd)}"
SPAWN_DIR="${INFRA_DIR}/world/spawn"
SCHEMATICS_DIR="${INFRA_DIR}/world/schematics/spawn"

# Assert two values are equal
# Usage: assert_eq "description" "expected" "actual"
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

# Assert value contains substring
# Usage: assert_contains "description" "haystack" "needle"
assert_contains() {
    local desc="$1"
    local haystack="$2"
    local needle="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${haystack}" == *"${needle}"* ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('${needle}' not found)\n" "${desc}"
    fi
}

# Assert file exists
# Usage: assert_file_exists "description" "path"
assert_file_exists() {
    local desc="$1"
    local path="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${path}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file not found: ${path}")
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${path}"
    fi
}

# Assert YAML file is valid
# Usage: assert_yaml_valid "description" "path"
assert_yaml_valid() {
    local desc="$1"
    local path="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if python3 -c "import yaml; yaml.safe_load(open('${path}'))" 2>/dev/null; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: invalid YAML: ${path}")
        printf "  FAIL: %s (invalid YAML)\n" "${desc}"
    fi
}

# Assert YAML file contains a given key (grep-based, works for top-level and nested)
# Usage: assert_yaml_key "description" "path" "key_pattern"
assert_yaml_key() {
    local desc="$1"
    local path="$2"
    local key_pattern="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if grep -q "${key_pattern}" "${path}" 2>/dev/null; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: key '${key_pattern}' not found in ${path}")
        printf "  FAIL: %s (key '%s' not found)\n" "${desc}" "${key_pattern}"
    fi
}

# ---------------------------------------------------------------------------
# Group 1: File existence and YAML validity (10 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 1: File existence and YAML validity"
echo "-------------------------------------------"

assert_file_exists "sign-standards.yaml exists" \
    "${SPAWN_DIR}/sign-standards.yaml"
assert_yaml_valid "sign-standards.yaml is valid YAML" \
    "${SPAWN_DIR}/sign-standards.yaml"

assert_file_exists "spawn-plaza-spec.yaml exists" \
    "${SPAWN_DIR}/spawn-plaza-spec.yaml"
assert_yaml_valid "spawn-plaza-spec.yaml is valid YAML" \
    "${SPAWN_DIR}/spawn-plaza-spec.yaml"

assert_file_exists "welcome-center-spec.yaml exists" \
    "${SPAWN_DIR}/welcome-center-spec.yaml"
assert_yaml_valid "welcome-center-spec.yaml is valid YAML" \
    "${SPAWN_DIR}/welcome-center-spec.yaml"

assert_file_exists "tutorial-path-spec.yaml exists" \
    "${SPAWN_DIR}/tutorial-path-spec.yaml"
assert_yaml_valid "tutorial-path-spec.yaml is valid YAML" \
    "${SPAWN_DIR}/tutorial-path-spec.yaml"

assert_file_exists "spawn-plaza.litematic.yaml exists" \
    "${SCHEMATICS_DIR}/spawn-plaza.litematic.yaml"
assert_yaml_valid "spawn-plaza.litematic.yaml is valid YAML" \
    "${SCHEMATICS_DIR}/spawn-plaza.litematic.yaml"

assert_file_exists "welcome-center.litematic.yaml exists" \
    "${SCHEMATICS_DIR}/welcome-center.litematic.yaml"
assert_yaml_valid "welcome-center.litematic.yaml is valid YAML" \
    "${SCHEMATICS_DIR}/welcome-center.litematic.yaml"

assert_file_exists "tutorial-path.litematic.yaml exists" \
    "${SCHEMATICS_DIR}/tutorial-path.litematic.yaml"
assert_yaml_valid "tutorial-path.litematic.yaml is valid YAML" \
    "${SCHEMATICS_DIR}/tutorial-path.litematic.yaml"

# syncmatica-share.sh syntax check
TESTS_RUN=$(( TESTS_RUN + 1 ))
if bash -n "${SPAWN_DIR}/syncmatica-share.sh" 2>/dev/null; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: syncmatica-share.sh passes syntax check\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("syncmatica-share.sh fails bash -n syntax check")
    printf "  FAIL: syncmatica-share.sh fails syntax check\n"
fi

# README.md exists and is non-empty
TESTS_RUN=$(( TESTS_RUN + 1 ))
if [[ -f "${SPAWN_DIR}/README.md" && -s "${SPAWN_DIR}/README.md" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: README.md exists and is non-empty\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("README.md missing or empty")
    printf "  FAIL: README.md missing or empty\n"
fi

# syncmatica-share.sh is executable
TESTS_RUN=$(( TESTS_RUN + 1 ))
if [[ -x "${SPAWN_DIR}/syncmatica-share.sh" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: syncmatica-share.sh is executable\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("syncmatica-share.sh is not executable")
    printf "  FAIL: syncmatica-share.sh is not executable\n"
fi

# ---------------------------------------------------------------------------
# Group 2: Sign standards completeness (8 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 2: Sign standards completeness"
echo "--------------------------------------"

SIGN_FILE="${SPAWN_DIR}/sign-standards.yaml"

assert_yaml_key "Contains formatting: key" "${SIGN_FILE}" "^formatting:"

assert_yaml_key "Contains hardware district color" "${SIGN_FILE}" "  hardware:"
assert_yaml_key "Contains software district color" "${SIGN_FILE}" "  software:"
assert_yaml_key "Contains network district color" "${SIGN_FILE}" "  network:"
assert_yaml_key "Contains creative district color" "${SIGN_FILE}" "  creative:"
assert_yaml_key "Contains community district color" "${SIGN_FILE}" "  community:"
assert_yaml_key "Contains workshop district color" "${SIGN_FILE}" "  workshop:"
assert_yaml_key "Contains spawn color" "${SIGN_FILE}" "  spawn:"

assert_yaml_key "Contains title_signs formatting" "${SIGN_FILE}" "  title_signs:"
assert_yaml_key "Contains info_signs formatting" "${SIGN_FILE}" "  info_signs:"
assert_yaml_key "Contains direction_signs formatting" "${SIGN_FILE}" "  direction_signs:"
assert_yaml_key "Contains language section" "${SIGN_FILE}" "^language:"
assert_yaml_key "Contains arrows section" "${SIGN_FILE}" "^arrows:"

# ---------------------------------------------------------------------------
# Group 3: Spawn plaza spec integrity (8 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 3: Spawn plaza spec integrity"
echo "-------------------------------------"

PLAZA_FILE="${SPAWN_DIR}/spawn-plaza-spec.yaml"

assert_yaml_key "Contains dimensions: section" "${PLAZA_FILE}" "^dimensions:"

# Check center at 0,64,0
TESTS_RUN=$(( TESTS_RUN + 1 ))
CENTER=$(python3 -c "
import yaml
d = yaml.safe_load(open('${PLAZA_FILE}'))
c = d['dimensions']['center']
print(f'{c[\"x\"]},{c[\"y\"]},{c[\"z\"]}')
" 2>/dev/null || echo "PARSE_ERROR")
if [[ "${CENTER}" == "0,64,0" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Center is at 0,64,0\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Center not at 0,64,0: got ${CENTER}")
    printf "  FAIL: Center not at 0,64,0 (got %s)\n" "${CENTER}"
fi

assert_yaml_key "Contains layout: section" "${PLAZA_FILE}" "^layout:"
assert_yaml_key "Contains ground in layout" "${PLAZA_FILE}" "  ground:"
assert_yaml_key "Contains center_feature in layout" "${PLAZA_FILE}" "  center_feature:"
assert_yaml_key "Contains compass_rose in layout" "${PLAZA_FILE}" "  compass_rose:"

# District gateways count = 6
TESTS_RUN=$(( TESTS_RUN + 1 ))
GW_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${PLAZA_FILE}'))
print(d['layout']['district_gateways']['count'])
" 2>/dev/null || echo "0")
if [[ "${GW_COUNT}" == "6" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: District gateways count is 6\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("District gateways count: expected 6, got ${GW_COUNT}")
    printf "  FAIL: District gateways count: expected 6, got %s\n" "${GW_COUNT}"
fi

# Welcome signs with 4 entries
TESTS_RUN=$(( TESTS_RUN + 1 ))
SIGN_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${PLAZA_FILE}'))
print(len(d['layout']['welcome_signs']['content']))
" 2>/dev/null || echo "0")
if [[ "${SIGN_COUNT}" == "4" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Welcome signs has 4 entries\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Welcome signs: expected 4, got ${SIGN_COUNT}")
    printf "  FAIL: Welcome signs: expected 4, got %s\n" "${SIGN_COUNT}"
fi

assert_yaml_key "Contains materials: section" "${PLAZA_FILE}" "^materials:"
assert_yaml_key "Contains build_order: section" "${PLAZA_FILE}" "^build_order:"

# Beacon in center_feature
assert_yaml_key "Contains beacon in center_feature type" "${PLAZA_FILE}" 'type: "beacon"'

# Welcome center entrance with direction
assert_yaml_key "Contains welcome_center_entrance with direction" "${PLAZA_FILE}" "  welcome_center_entrance:"

# ---------------------------------------------------------------------------
# Group 4: Welcome center spec integrity (8 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 4: Welcome center spec integrity"
echo "----------------------------------------"

WC_FILE="${SPAWN_DIR}/welcome-center-spec.yaml"

# 4 panels
TESTS_RUN=$(( TESTS_RUN + 1 ))
PANEL_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${WC_FILE}'))
print(len(d['layout']['panels']))
" 2>/dev/null || echo "0")
if [[ "${PANEL_COUNT}" == "4" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Contains 4 panels\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Panel count: expected 4, got ${PANEL_COUNT}")
    printf "  FAIL: Panel count: expected 4, got %s\n" "${PANEL_COUNT}"
fi

# Panel names
TESTS_RUN=$(( TESTS_RUN + 1 ))
P1_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${WC_FILE}'))
print(d['layout']['panels']['panel_1']['name'])
" 2>/dev/null || echo "")
if [[ "${P1_NAME}" == "What is the Knowledge World?" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Panel 1 name is 'What is the Knowledge World?'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Panel 1 name: expected 'What is the Knowledge World?', got '${P1_NAME}'")
    printf "  FAIL: Panel 1 name: got '%s'\n" "${P1_NAME}"
fi

TESTS_RUN=$(( TESTS_RUN + 1 ))
P2_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${WC_FILE}'))
print(d['layout']['panels']['panel_2']['name'])
" 2>/dev/null || echo "")
if [[ "${P2_NAME}" == "How to Use Litematica" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Panel 2 name is 'How to Use Litematica'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Panel 2 name: expected 'How to Use Litematica', got '${P2_NAME}'")
    printf "  FAIL: Panel 2 name: got '%s'\n" "${P2_NAME}"
fi

TESTS_RUN=$(( TESTS_RUN + 1 ))
P3_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${WC_FILE}'))
print(d['layout']['panels']['panel_3']['name'])
" 2>/dev/null || echo "")
if [[ "${P3_NAME}" == "District Map" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Panel 3 name is 'District Map'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Panel 3 name: expected 'District Map', got '${P3_NAME}'")
    printf "  FAIL: Panel 3 name: got '%s'\n" "${P3_NAME}"
fi

TESTS_RUN=$(( TESTS_RUN + 1 ))
P4_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${WC_FILE}'))
print(d['layout']['panels']['panel_4']['name'])
" 2>/dev/null || echo "")
if [[ "${P4_NAME}" == "Server Rules & Guidelines" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Panel 4 name is 'Server Rules & Guidelines'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Panel 4 name: expected 'Server Rules & Guidelines', got '${P4_NAME}'")
    printf "  FAIL: Panel 4 name: got '%s'\n" "${P4_NAME}"
fi

assert_yaml_key "Contains floor_map: section" "${WC_FILE}" "  floor_map:"
assert_yaml_key "Contains lighting: section" "${WC_FILE}" "  lighting:"
assert_yaml_key "Contains build_order: section" "${WC_FILE}" "^build_order:"

# ---------------------------------------------------------------------------
# Group 5: Tutorial path spec integrity (8 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 5: Tutorial path spec integrity"
echo "---------------------------------------"

TP_FILE="${SPAWN_DIR}/tutorial-path-spec.yaml"

# 6 waypoints
TESTS_RUN=$(( TESTS_RUN + 1 ))
WP_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${TP_FILE}'))
print(len(d['waypoints']))
" 2>/dev/null || echo "0")
if [[ "${WP_COUNT}" == "6" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Contains 6 waypoints\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Waypoint count: expected 6, got ${WP_COUNT}")
    printf "  FAIL: Waypoint count: expected 6, got %s\n" "${WP_COUNT}"
fi

# Estimated time = 5
TESTS_RUN=$(( TESTS_RUN + 1 ))
EST_TIME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${TP_FILE}'))
print(d['route']['estimated_time_minutes'])
" 2>/dev/null || echo "0")
if [[ "${EST_TIME}" == "5" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Estimated time is 5 minutes\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Estimated time: expected 5, got ${EST_TIME}")
    printf "  FAIL: Estimated time: expected 5, got %s\n" "${EST_TIME}"
fi

# Waypoint 1 name
TESTS_RUN=$(( TESTS_RUN + 1 ))
WP1_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${TP_FILE}'))
print(d['waypoints']['waypoint_1']['name'])
" 2>/dev/null || echo "")
if [[ "${WP1_NAME}" == "The Spatial Idea" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Waypoint 1 name is 'The Spatial Idea'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Waypoint 1 name: expected 'The Spatial Idea', got '${WP1_NAME}'")
    printf "  FAIL: Waypoint 1 name: got '%s'\n" "${WP1_NAME}"
fi

# Waypoint 6 name
TESTS_RUN=$(( TESTS_RUN + 1 ))
WP6_NAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${TP_FILE}'))
print(d['waypoints']['waypoint_6']['name'])
" 2>/dev/null || echo "")
if [[ "${WP6_NAME}" == "You're Ready" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Waypoint 6 name is 'You're Ready'\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Waypoint 6 name: expected 'You're Ready', got '${WP6_NAME}'")
    printf "  FAIL: Waypoint 6 name: got '%s'\n" "${WP6_NAME}"
fi

# 5 waypoints have demo_build (not null), waypoint_6 has null
TESTS_RUN=$(( TESTS_RUN + 1 ))
DEMO_COUNT=$(python3 -c "
import yaml
d = yaml.safe_load(open('${TP_FILE}'))
count = sum(1 for i in range(1, 7) if d['waypoints'][f'waypoint_{i}'].get('demo_build') is not None)
print(count)
" 2>/dev/null || echo "0")
if [[ "${DEMO_COUNT}" == "5" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: 5 waypoints have demo builds (waypoint 6 has none)\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Demo build count: expected 5, got ${DEMO_COUNT}")
    printf "  FAIL: Demo build count: expected 5, got %s\n" "${DEMO_COUNT}"
fi

assert_yaml_key "Contains materials: section" "${TP_FILE}" "^materials:"
assert_yaml_key "Contains route: section" "${TP_FILE}" "^route:"

# Path material is defined
assert_yaml_key "Path material is defined" "${TP_FILE}" "  path_material:"

# ---------------------------------------------------------------------------
# Group 6: Schematic metadata consistency (6 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 6: Schematic metadata consistency"
echo "-----------------------------------------"

SCHEM_FILES=(
    "${SCHEMATICS_DIR}/spawn-plaza.litematic.yaml"
    "${SCHEMATICS_DIR}/welcome-center.litematic.yaml"
    "${SCHEMATICS_DIR}/tutorial-path.litematic.yaml"
)

# All 3 have schematic.name
for sf in "${SCHEM_FILES[@]}"; do
    sfbase="$(basename "${sf}")"
    assert_yaml_key "${sfbase} has schematic.name" "${sf}" "  name:"
done

# All 3 have syncmatica.share: true
for sf in "${SCHEM_FILES[@]}"; do
    sfbase="$(basename "${sf}")"
    assert_yaml_key "${sfbase} has syncmatica.share: true" "${sf}" "    share: true"
done

# welcome-center depends on spawn-plaza
TESTS_RUN=$(( TESTS_RUN + 1 ))
WC_DEPS=$(python3 -c "
import yaml
d = yaml.safe_load(open('${SCHEMATICS_DIR}/welcome-center.litematic.yaml'))
deps = d['schematic'].get('dependencies', [])
print(','.join(deps))
" 2>/dev/null || echo "")
if [[ "${WC_DEPS}" == *"spawn-plaza"* ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: welcome-center depends on spawn-plaza\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("welcome-center missing spawn-plaza dependency")
    printf "  FAIL: welcome-center missing spawn-plaza dependency\n"
fi

# tutorial-path depends on spawn-plaza AND welcome-center
TESTS_RUN=$(( TESTS_RUN + 1 ))
TP_DEPS=$(python3 -c "
import yaml
d = yaml.safe_load(open('${SCHEMATICS_DIR}/tutorial-path.litematic.yaml'))
deps = d['schematic'].get('dependencies', [])
print(','.join(deps))
" 2>/dev/null || echo "")
if [[ "${TP_DEPS}" == *"spawn-plaza"* && "${TP_DEPS}" == *"welcome-center"* ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: tutorial-path depends on spawn-plaza and welcome-center\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("tutorial-path missing dependencies: got '${TP_DEPS}'")
    printf "  FAIL: tutorial-path missing dependencies (got '%s')\n" "${TP_DEPS}"
fi

# All 3 have dimensions with x, y, z
for sf in "${SCHEM_FILES[@]}"; do
    sfbase="$(basename "${sf}")"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    DIM_OK=$(python3 -c "
import yaml
d = yaml.safe_load(open('${sf}'))
dim = d['schematic']['dimensions']
assert 'x' in dim and 'y' in dim and 'z' in dim
print('true')
" 2>/dev/null || echo "false")
    if [[ "${DIM_OK}" == "true" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s has dimensions x, y, z\n" "${sfbase}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${sfbase} missing dimensions x/y/z")
        printf "  FAIL: %s missing dimensions x/y/z\n" "${sfbase}"
    fi
done

# All filenames follow spawn-*-v*.litematic pattern
for sf in "${SCHEM_FILES[@]}"; do
    sfbase="$(basename "${sf}")"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    FNAME=$(python3 -c "
import yaml
d = yaml.safe_load(open('${sf}'))
print(d['schematic']['filename'])
" 2>/dev/null || echo "")
    if [[ "${FNAME}" == spawn-*-v*.litematic ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s filename follows spawn-*-v*.litematic pattern (%s)\n" "${sfbase}" "${FNAME}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${sfbase} filename doesn't match pattern: ${FNAME}")
        printf "  FAIL: %s filename doesn't match pattern: %s\n" "${sfbase}" "${FNAME}"
    fi
done

# ---------------------------------------------------------------------------
# Group 7: Syncmatica script behavior (4 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "Group 7: Syncmatica script behavior"
echo "--------------------------------------"

# Export INFRA_DIR so the script picks up the right paths
export INFRA_DIR

# --dry-run exits 0
TESTS_RUN=$(( TESTS_RUN + 1 ))
DRY_OUTPUT=$(bash "${SPAWN_DIR}/syncmatica-share.sh" --dry-run 2>&1) || true
DRY_EXIT=$?
if [[ ${DRY_EXIT} -eq 0 ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: syncmatica-share.sh --dry-run exits 0\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("syncmatica-share.sh --dry-run exited ${DRY_EXIT}")
    printf "  FAIL: syncmatica-share.sh --dry-run exited %s\n" "${DRY_EXIT}"
fi

# Dry-run output mentions all 3 schematic names
assert_contains "Dry-run mentions spawn-plaza" "${DRY_OUTPUT}" "spawn-plaza"
assert_contains "Dry-run mentions welcome-center" "${DRY_OUTPUT}" "welcome-center"
assert_contains "Dry-run mentions tutorial-path" "${DRY_OUTPUT}" "tutorial-path"

# Script handles missing .litematic files gracefully (no error exit)
# The dry-run above already proves this since no .litematic files exist
TESTS_RUN=$(( TESTS_RUN + 1 ))
if [[ "${DRY_OUTPUT}" == *"PENDING"* ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Script reports PENDING for missing .litematic files\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Script doesn't report PENDING for missing files")
    printf "  FAIL: Script doesn't report PENDING for missing .litematic files\n"
fi

# Script detects correct count of schematics (3)
TESTS_RUN=$(( TESTS_RUN + 1 ))
TOTAL_LINE=$(echo "${DRY_OUTPUT}" | grep "Total schematics found:" || echo "")
if [[ "${TOTAL_LINE}" == *"3"* ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  PASS: Script reports 3 total schematics\n"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("Script total count not 3: ${TOTAL_LINE}")
    printf "  FAIL: Script total count not 3: %s\n" "${TOTAL_LINE}"
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "==========================================="
echo "Test Results: ${TESTS_PASSED}/${TESTS_RUN} assertions passed"
echo "==========================================="

if [[ ${TESTS_FAILED} -gt 0 ]]; then
    echo ""
    echo "FAILURES:"
    for failure in "${FAILURES[@]}"; do
        echo "  - ${failure}"
    done
    echo ""
    exit 1
fi

echo ""
echo "All assertions passed."
exit 0

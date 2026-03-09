#!/usr/bin/env bash
# shellcheck disable=SC2154 # variables assigned in sourced test framework
# test-validate-world-layout.sh -- Test suite for world layout validator
#
# Tests validate-world-layout.sh against real YAML files and crafted
# broken fixtures to verify it catches constraint violations.
#
# Usage: bash infra/tests/test-validate-world-layout.sh

set -uo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

# Run a command and capture both output and exit code without set -e interference
# Usage: run_capture VARNAME_OUTPUT VARNAME_EXIT command [args...]
run_capture() {
    local _out_var="$1"
    local _exit_var="$2"
    shift 2
    local _output=""
    local _exit_code=0
    _output=$("$@" 2>&1) || _exit_code=$?
    printf -v "${_out_var}" '%s' "${_output}"
    printf -v "${_exit_var}" '%s' "${_exit_code}"
}

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VALIDATOR="${SCRIPT_DIR}/../scripts/validate-world-layout.sh"
REAL_YAML_DIR="${SCRIPT_DIR}/../minecraft/world-design"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap teardown EXIT

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

assert_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('${needle}' not found)\n" "${desc}"
    fi
}

assert_not_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qF "${needle}"; then
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' should not be in output")
        printf "  FAIL: %s ('${needle}' found but should not be)\n" "${desc}"
    else
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    fi
}

# ---------------------------------------------------------------------------
# Helper: copy real YAML files to temp dir for modification
# ---------------------------------------------------------------------------

copy_real_yaml() {
    cp "${REAL_YAML_DIR}/world-master-plan.yaml" "${TEMP_DIR}/"
    cp "${REAL_YAML_DIR}/district-palettes.yaml" "${TEMP_DIR}/"
    cp "${REAL_YAML_DIR}/wayfinding-system.yaml" "${TEMP_DIR}/"
    cp "${REAL_YAML_DIR}/sign-standards.yaml" "${TEMP_DIR}/"
    cp "${REAL_YAML_DIR}/README.md" "${TEMP_DIR}/"
}

# ---------------------------------------------------------------------------
# Test Group 1: Valid layout passes (5 assertions)
# ---------------------------------------------------------------------------

echo "=== Test Group 1: Valid Layout Passes ==="

setup

run_capture output exit_code bash "${VALIDATOR}" --yaml-dir "${REAL_YAML_DIR}"

assert_eq "Validator exits 0 on real YAML" "0" "${exit_code}"
assert_contains "Output contains 'All checks passed'" "All checks passed" "${output}"
assert_contains "Output contains summary line" "Passed:" "${output}"
assert_not_contains "No FAIL lines in output" "FAIL:" "${output}"
assert_contains "Output contains validation sections" "File Existence" "${output}"

teardown

# ---------------------------------------------------------------------------
# Test Group 2: Overlapping coordinates caught (3 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "=== Test Group 2: Overlapping Coordinates Caught ==="

setup
copy_real_yaml

# Create a master plan with overlapping districts (hardware and software share X range)
python3 -c "
import yaml
with open('${TEMP_DIR}/world-master-plan.yaml') as f:
    data = yaml.safe_load(f)

# Make software district overlap with hardware district
for d in data['districts']:
    if d['district_id'] == 'software':
        d['bounds']['min']['x'] = -200  # overlaps with hardware (-300 to -100)
        d['bounds']['max']['x'] = 0

with open('${TEMP_DIR}/world-master-plan.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
"

run_capture output exit_code bash "${VALIDATOR}" --yaml-dir "${TEMP_DIR}"

assert_eq "Validator exits 1 on overlapping coords" "1" "${exit_code}"
assert_contains "Reports overlap failure" "FAIL" "${output}"
assert_contains "Reports hardware-vs-software overlap" "hardware-vs-software" "${output}"

teardown

# ---------------------------------------------------------------------------
# Test Group 3: Distance violation caught (2 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "=== Test Group 3: Distance Violation Caught ==="

setup
copy_real_yaml

# Create a master plan with a distant district entrance
python3 -c "
import yaml
with open('${TEMP_DIR}/world-master-plan.yaml') as f:
    data = yaml.safe_load(f)

# Move creative district entrance far away
for d in data['districts']:
    if d['district_id'] == 'creative':
        d['entrance']['x'] = 400
        d['entrance']['z'] = 400
        d['bounds']['min']['x'] = 350
        d['bounds']['max']['x'] = 550
        d['bounds']['min']['z'] = 350
        d['bounds']['max']['z'] = 550

with open('${TEMP_DIR}/world-master-plan.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
"

run_capture output exit_code bash "${VALIDATOR}" --yaml-dir "${TEMP_DIR}"

assert_eq "Validator exits 1 on distance violation" "1" "${exit_code}"
assert_contains "Reports distance failure for creative" "FAIL" "${output}"

teardown

# ---------------------------------------------------------------------------
# Test Group 4: Missing district caught (2 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "=== Test Group 4: Missing District Caught ==="

setup
copy_real_yaml

# Remove network district from master plan
python3 -c "
import yaml
with open('${TEMP_DIR}/world-master-plan.yaml') as f:
    data = yaml.safe_load(f)

data['districts'] = [d for d in data['districts'] if d['district_id'] != 'network']

with open('${TEMP_DIR}/world-master-plan.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
"

run_capture output exit_code bash "${VALIDATOR}" --yaml-dir "${TEMP_DIR}"

assert_eq "Validator exits 1 on missing district" "1" "${exit_code}"
assert_contains "Reports network missing" "network" "${output}"

teardown

# ---------------------------------------------------------------------------
# Test Group 5: Palette collision caught (2 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "=== Test Group 5: Palette Collision Caught ==="

setup
copy_real_yaml

# Make two districts share the same color_family
python3 -c "
import yaml
with open('${TEMP_DIR}/district-palettes.yaml') as f:
    data = yaml.safe_load(f)

# Set software color_family to same as hardware
data['palettes']['software']['color_family'] = data['palettes']['hardware']['color_family']

with open('${TEMP_DIR}/district-palettes.yaml', 'w') as f:
    yaml.dump(data, f, default_flow_style=False)
"

run_capture output exit_code bash "${VALIDATOR}" --yaml-dir "${TEMP_DIR}"

assert_eq "Validator exits 1 on palette collision" "1" "${exit_code}"
assert_contains "Reports palette failure" "FAIL" "${output}"

teardown

# ---------------------------------------------------------------------------
# Test Group 6: Script argument handling (3 assertions)
# ---------------------------------------------------------------------------

echo ""
echo "=== Test Group 6: Script Argument Handling ==="

# --verbose produces more output than default
setup

run_capture verbose_output _unused bash "${VALIDATOR}" --verbose --yaml-dir "${REAL_YAML_DIR}"
run_capture default_output _unused bash "${VALIDATOR}" --yaml-dir "${REAL_YAML_DIR}"

verbose_lines=$(echo "${verbose_output}" | wc -l)
default_lines=$(echo "${default_output}" | wc -l)

if [[ ${verbose_lines} -gt ${default_lines} ]]; then
    assert_eq "Verbose produces more output" "true" "true"
else
    assert_eq "Verbose produces more output" "true" "false"
fi

# --yaml-dir /nonexistent fails gracefully
run_capture nonexist_output nonexist_code bash "${VALIDATOR}" --yaml-dir "/nonexistent/path"

assert_eq "Non-existent yaml-dir exits 1" "1" "${nonexist_code}"

# --help prints usage
run_capture help_output help_code bash "${VALIDATOR}" --help

assert_eq "Help exits 0" "0" "${help_code}"

teardown

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "==========================================="
echo "  Test Summary"
echo "==========================================="
echo "  ${TESTS_PASSED}/${TESTS_RUN} assertions passed"
echo "==========================================="

if [[ ${TESTS_FAILED} -gt 0 ]]; then
    echo ""
    echo "Failures:"
    for f in "${FAILURES[@]}"; do
        echo "  - ${f}"
    done
    exit 1
fi

echo ""
echo "All assertions passed."
exit 0

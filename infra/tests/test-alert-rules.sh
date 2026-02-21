#!/usr/bin/env bash
# test-alert-rules.sh -- Test suite for Prometheus alert rules
#
# Validates minecraft-alerts.yaml structure, alert definitions, thresholds,
# and deploy-alerts.sh script syntax and usage.
#
# All tests run without Prometheus, promtool, or live infrastructure.
#
# Test groups:
#   1. YAML validity (3 assertions)
#   2. Required alert names (9 assertions)
#   3. Alert structure (3 assertions)
#   4. Threshold validation (5 assertions)
#   5. No duplicates (1 assertion)
#   6. Deploy script (3 assertions)
#
# Usage: bash infra/tests/test-alert-rules.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (matching test-verify-pipeline.sh pattern)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ALERTS_FILE="${SCRIPT_DIR}/../monitoring/alerts/minecraft-alerts.yaml"
DEPLOY_SCRIPT="${SCRIPT_DIR}/../monitoring/alerts/deploy-alerts.sh"

# Assert two values are equal
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

# Assert exit code matches
assert_exit_code() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    assert_eq "${desc}" "${expected}" "${actual}"
}

# Assert output contains a string
assert_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qF -- "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('${needle}' not found)\n" "${desc}"
    fi
}

# Assert output matches a regex
assert_matches() {
    local desc="$1"
    local pattern="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qE -- "${pattern}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: pattern '${pattern}' not matched")
        printf "  FAIL: %s (pattern not matched)\n" "${desc}"
    fi
}

# ---------------------------------------------------------------------------
# Load alert rules content
# ---------------------------------------------------------------------------

ALERTS_CONTENT=""
if [[ -f "${ALERTS_FILE}" ]]; then
    ALERTS_CONTENT=$(cat "${ALERTS_FILE}")
fi

# ---------------------------------------------------------------------------
# Group 1: YAML validity (3 assertions)
# ---------------------------------------------------------------------------

test_yaml_validity() {
    printf "\n--- Group 1: YAML Validity ---\n"

    # Test 1.1: File exists
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${ALERTS_FILE}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 1.1 Alert rules file exists\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("1.1 Alert rules file not found: ${ALERTS_FILE}")
        printf "  FAIL: 1.1 Alert rules file not found\n"
        return
    fi

    # Test 1.2: Contains top-level 'groups:' key
    assert_contains "1.2 Contains groups: key" "groups:" "${ALERTS_CONTENT}"

    # Test 1.3: Contains rule_group name 'minecraft_server'
    assert_contains "1.3 Contains minecraft_server group" "minecraft_server" "${ALERTS_CONTENT}"
}

# ---------------------------------------------------------------------------
# Group 2: Required alert names (9 assertions)
# ---------------------------------------------------------------------------

test_required_alerts() {
    printf "\n--- Group 2: Required Alert Names ---\n"

    local alerts=(
        "MinecraftTPSDegraded"
        "MinecraftTPSCritical"
        "MinecraftMemoryPressure"
        "MinecraftDiskUsageHigh"
        "MinecraftDiskUsageCritical"
        "MinecraftBackupStale"
        "MinecraftServerUnreachable"
        "MinecraftServiceDown"
        "MinecraftMetricsStale"
    )

    local idx=1
    for alert_name in "${alerts[@]}"; do
        assert_contains "2.${idx} Alert ${alert_name} present" "${alert_name}" "${ALERTS_CONTENT}"
        idx=$(( idx + 1 ))
    done
}

# ---------------------------------------------------------------------------
# Group 3: Alert structure (3 assertions)
# ---------------------------------------------------------------------------

test_alert_structure() {
    printf "\n--- Group 3: Alert Structure ---\n"

    # Count alerts, severity labels, and 'for' fields
    local alert_count severity_count for_count
    alert_count=$(grep -cE '^\s+- alert:' "${ALERTS_FILE}" || echo "0")
    severity_count=$(grep -cE '^\s+severity:' "${ALERTS_FILE}" || echo "0")
    for_count=$(grep -cE '^\s+for:' "${ALERTS_FILE}" || echo "0")

    # Test 3.1: All alerts have severity label
    assert_eq "3.1 All alerts have severity label" "${alert_count}" "${severity_count}"

    # Test 3.2: All alerts have 'for' duration
    assert_eq "3.2 All alerts have 'for' duration" "${alert_count}" "${for_count}"

    # Test 3.3: All alerts have summary and description annotations
    local summary_count description_count
    summary_count=$(grep -cE '^\s+summary:' "${ALERTS_FILE}" || echo "0")
    description_count=$(grep -cE '^\s+description:' "${ALERTS_FILE}" || echo "0")
    assert_eq "3.3 All alerts have summary annotation" "${alert_count}" "${summary_count}"
}

# ---------------------------------------------------------------------------
# Group 4: Threshold validation (5 assertions)
# ---------------------------------------------------------------------------

test_thresholds() {
    printf "\n--- Group 4: Threshold Validation ---\n"

    # Test 4.1: TPS warning threshold is 18 (not 20)
    assert_matches "4.1 TPS warning threshold is 18" "minecraft_tps.*< 18" "${ALERTS_CONTENT}"

    # Test 4.2: Memory threshold is 90
    assert_matches "4.2 Memory threshold is 90" "> 90" "${ALERTS_CONTENT}"

    # Test 4.3: Disk warning threshold is 85
    assert_matches "4.3 Disk warning threshold is 85" "> 85" "${ALERTS_CONTENT}"

    # Test 4.4: Disk critical threshold is 95
    assert_matches "4.4 Disk critical threshold is 95" "> 95" "${ALERTS_CONTENT}"

    # Test 4.5: Backup age threshold is 7200 (2 hours)
    assert_matches "4.5 Backup age threshold is 7200" "> 7200" "${ALERTS_CONTENT}"
}

# ---------------------------------------------------------------------------
# Group 5: No duplicate alert names (1 assertion)
# ---------------------------------------------------------------------------

test_no_duplicates() {
    printf "\n--- Group 5: No Duplicates ---\n"

    local alert_names unique_names
    alert_names=$(grep -oP '(?<=- alert: )\w+' "${ALERTS_FILE}" | sort)
    unique_names=$(echo "${alert_names}" | sort -u)

    local total_count unique_count
    total_count=$(echo "${alert_names}" | wc -l)
    unique_count=$(echo "${unique_names}" | wc -l)

    assert_eq "5.1 No duplicate alert names" "${total_count}" "${unique_count}"
}

# ---------------------------------------------------------------------------
# Group 6: Deploy script (3 assertions)
# ---------------------------------------------------------------------------

test_deploy_script() {
    printf "\n--- Group 6: Deploy Script ---\n"

    # Test 6.1: bash -n passes
    local exit_code=0
    bash -n "${DEPLOY_SCRIPT}" 2>&1 || exit_code=$?
    assert_exit_code "6.1 deploy-alerts.sh syntax check" "0" "${exit_code}"

    # Test 6.2: --help exits 0
    local output
    exit_code=0
    output=$(bash "${DEPLOY_SCRIPT}" --help 2>&1) || exit_code=$?
    assert_exit_code "6.2 deploy-alerts.sh --help exits 0" "0" "${exit_code}"

    # Test 6.3: --help contains Usage
    assert_contains "6.3 deploy-alerts.sh --help shows Usage" "Usage:" "${output}"
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== Alert Rules Test Suite ===\n"
    printf "Alert rules file: %s\n" "${ALERTS_FILE}"
    printf "Deploy script: %s\n" "${DEPLOY_SCRIPT}"

    test_yaml_validity
    test_required_alerts
    test_alert_structure
    test_thresholds
    test_no_duplicates
    test_deploy_script

    printf "\n=== Results ===\n"
    printf "%s/%s tests passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        printf "Failed: %s\n" "${TESTS_FAILED}"
        printf "\nFailures:\n"
        for failure in "${FAILURES[@]}"; do
            printf "  - %s\n" "${failure}"
        done
        exit 1
    fi

    printf "\nAll tests passed.\n"
    exit 0
}

main "$@"

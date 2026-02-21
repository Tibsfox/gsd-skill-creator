#!/usr/bin/env bash
# test-health-check-extended.sh -- Test suite for extended health check
#
# Tests the 5 new health checks added to check-minecraft-health.sh:
#   8. Node exporter (port 9100)
#   9. JMX exporter (port 9404)
#  10. Backup freshness
#  11. Metrics freshness
#  12. Known failure patterns
#
# All tests run without live servers, services, or network connections.
# Uses mock files, mock journalctl output, and JSON output parsing.
#
# Test groups:
#   1. Backward compatibility (4 assertions)
#   2. Extended checks listed (3 assertions)
#   3. Argument parsing (3 assertions)
#   4. JSON output extended (2 assertions)
#   5. Backup freshness (3 assertions)
#   6. Metrics freshness (3 assertions)
#   7. Known failures (4 assertions)
#   8. No false positives scenario (3 assertions)
#
# Usage: bash infra/tests/test-health-check-extended.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (matching test-verify-pipeline.sh pattern)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}/../scripts"
HEALTH_CHECK="${SCRIPTS_DIR}/check-minecraft-health.sh"
TEMP_DIR=""

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

# Assert output does NOT contain a string
assert_not_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if ! echo "${haystack}" | grep -qF -- "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' was found but should not be present")
        printf "  FAIL: %s ('${needle}' should not be present)\n" "${desc}"
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
# Mock setup
# ---------------------------------------------------------------------------

setup_temp() {
    TEMP_DIR="$(mktemp -d)"
}

create_fresh_backup_status() {
    mkdir -p "${TEMP_DIR}/backups"
    local now_iso
    now_iso=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    cat > "${TEMP_DIR}/backups/last-backup-status.yaml" <<YAML
last_backup_time: "${now_iso}"
last_backup_type: "hourly"
last_backup_file: "minecraft-world-hourly-test.tar.gz"
last_backup_success: true
YAML
}

create_stale_backup_status() {
    mkdir -p "${TEMP_DIR}/backups"
    # 3 hours ago
    local old_iso
    old_iso=$(date -u -d "3 hours ago" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-3H +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || echo "2020-01-01T00:00:00Z")
    cat > "${TEMP_DIR}/backups/last-backup-status.yaml" <<YAML
last_backup_time: "${old_iso}"
last_backup_type: "hourly"
last_backup_file: "minecraft-world-hourly-old.tar.gz"
last_backup_success: true
YAML
}

create_fresh_metrics() {
    mkdir -p "${TEMP_DIR}/textfile"
    local now_epoch
    now_epoch=$(date +%s)
    cat > "${TEMP_DIR}/textfile/minecraft.prom" <<PROM
# HELP minecraft_metrics_update_time_seconds Unix timestamp of last collection
# TYPE minecraft_metrics_update_time_seconds gauge
minecraft_metrics_update_time_seconds ${now_epoch}
# HELP minecraft_tps Server ticks per second
# TYPE minecraft_tps gauge
minecraft_tps{server="knowledge-world"} 20.0
PROM
}

create_stale_metrics() {
    mkdir -p "${TEMP_DIR}/textfile"
    local old_epoch
    old_epoch=$(( $(date +%s) - 300 ))
    cat > "${TEMP_DIR}/textfile/minecraft.prom" <<PROM
# HELP minecraft_metrics_update_time_seconds Unix timestamp of last collection
# TYPE minecraft_metrics_update_time_seconds gauge
minecraft_metrics_update_time_seconds ${old_epoch}
PROM
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

# ---------------------------------------------------------------------------
# Group 1: Backward compatibility (4 assertions)
# ---------------------------------------------------------------------------

test_backward_compatibility() {
    printf "\n--- Group 1: Backward Compatibility ---\n"

    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --help 2>&1) || exit_code=$?

    # Test 1.1: --help exits 0
    assert_exit_code "1.1 --help exits 0" "0" "${exit_code}"

    # Test 1.2: --help still documents original 7 checks
    assert_contains "1.2 Documents systemd service check" "systemd service" "${output}"

    # Test 1.3: Exit codes unchanged
    assert_contains "1.3 Exit code 0 documented" "All checks pass" "${output}"

    # Test 1.4: Disk space check still documented
    assert_contains "1.4 Disk space check documented" "Disk space" "${output}"
}

# ---------------------------------------------------------------------------
# Group 2: Extended checks listed (3 assertions)
# ---------------------------------------------------------------------------

test_extended_checks_listed() {
    printf "\n--- Group 2: Extended Checks Listed ---\n"

    local output
    output=$(bash "${HEALTH_CHECK}" --help 2>&1)

    # Test 2.1: Documents node exporter check
    assert_contains "2.1 Node exporter check documented" "Node exporter" "${output}"

    # Test 2.2: Documents backup freshness check
    assert_contains "2.2 Backup freshness check documented" "Backup freshness" "${output}"

    # Test 2.3: Documents known failures check
    assert_contains "2.3 Known failures check documented" "Known failures" "${output}"
}

# ---------------------------------------------------------------------------
# Group 3: Argument parsing (3 assertions)
# ---------------------------------------------------------------------------

test_argument_parsing() {
    printf "\n--- Group 3: Argument Parsing ---\n"

    # Test 3.1: --backup-dir accepted
    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --help 2>&1) || exit_code=$?
    assert_contains "3.1 --backup-dir documented" "backup-dir" "${output}"

    # Test 3.2: --textfile-dir accepted
    assert_contains "3.2 --textfile-dir documented" "textfile-dir" "${output}"

    # Test 3.3: Unknown flag still exits 3
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --bogus 2>&1) || exit_code=$?
    assert_exit_code "3.3 Unknown flag exits 3" "3" "${exit_code}"
}

# ---------------------------------------------------------------------------
# Group 4: JSON output extended (2 assertions)
# ---------------------------------------------------------------------------

test_json_output() {
    printf "\n--- Group 4: JSON Output Extended ---\n"

    setup_temp
    create_fresh_backup_status
    create_fresh_metrics

    # Run health check in JSON mode (will fail many checks on dev machine, that's OK)
    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?

    # Test 4.1: JSON includes node_exporter key
    assert_contains "4.1 JSON includes node_exporter" "node_exporter" "${output}"

    # Test 4.2: JSON includes backup_freshness key
    assert_contains "4.2 JSON includes backup_freshness" "backup_freshness" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 5: Backup freshness (3 assertions)
# ---------------------------------------------------------------------------

test_backup_freshness() {
    printf "\n--- Group 5: Backup Freshness ---\n"

    # Test 5.1: Fresh backup -> pass
    setup_temp
    create_fresh_backup_status
    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    # Extract backup_freshness status from JSON
    local backup_status
    backup_status=$(echo "${output}" | grep -oP '"backup_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "5.1 Fresh backup reports pass" "pass" "${backup_status}"
    teardown

    # Test 5.2: Stale backup -> warn
    setup_temp
    create_stale_backup_status
    create_fresh_metrics
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    backup_status=$(echo "${output}" | grep -oP '"backup_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "5.2 Stale backup reports warn" "warn" "${backup_status}"
    teardown

    # Test 5.3: Missing backup status -> fail
    setup_temp
    create_fresh_metrics
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    backup_status=$(echo "${output}" | grep -oP '"backup_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "5.3 Missing backup status reports fail" "fail" "${backup_status}"
    teardown
}

# ---------------------------------------------------------------------------
# Group 6: Metrics freshness (3 assertions)
# ---------------------------------------------------------------------------

test_metrics_freshness() {
    printf "\n--- Group 6: Metrics Freshness ---\n"

    # Test 6.1: Fresh metrics -> pass
    setup_temp
    create_fresh_backup_status
    create_fresh_metrics
    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    local metrics_status
    metrics_status=$(echo "${output}" | grep -oP '"metrics_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "6.1 Fresh metrics reports pass" "pass" "${metrics_status}"
    teardown

    # Test 6.2: Stale metrics -> warn
    setup_temp
    create_fresh_backup_status
    create_stale_metrics
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    metrics_status=$(echo "${output}" | grep -oP '"metrics_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "6.2 Stale metrics reports warn" "warn" "${metrics_status}"
    teardown

    # Test 6.3: Missing metrics -> fail
    setup_temp
    create_fresh_backup_status
    # No metrics file created
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?
    metrics_status=$(echo "${output}" | grep -oP '"metrics_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "6.3 Missing metrics reports fail" "fail" "${metrics_status}"
    teardown
}

# ---------------------------------------------------------------------------
# Group 7: Known failures (4 assertions)
# ---------------------------------------------------------------------------

test_known_failures() {
    printf "\n--- Group 7: Known Failures ---\n"

    # Note: known_failures checks journalctl output, which we can't easily
    # mock from outside the script. We test what we can: that the check
    # runs without crashing and produces a result in JSON output.

    setup_temp
    create_fresh_backup_status
    create_fresh_metrics

    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?

    # Test 7.1: known_failures key exists in JSON output
    assert_contains "7.1 known_failures in JSON output" "known_failures" "${output}"

    # Test 7.2: known_failures has a status value
    local kf_status
    kf_status=$(echo "${output}" | grep -oP '"known_failures":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -n "${kf_status}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 7.2 known_failures has status: %s\n" "${kf_status}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("7.2 known_failures status not found in output")
        printf "  FAIL: 7.2 known_failures status not found\n"
    fi

    # Test 7.3: Health check script syntax valid
    exit_code=0
    bash -n "${HEALTH_CHECK}" 2>&1 || exit_code=$?
    assert_exit_code "7.3 Health check syntax valid" "0" "${exit_code}"

    # Test 7.4: Human output mentions known failures check
    local human_output
    human_output=$(bash "${HEALTH_CHECK}" --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>&1) || true
    assert_contains "7.4 Human output shows Known failures" "Known failures" "${human_output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 8: No false positives scenario (3 assertions)
# ---------------------------------------------------------------------------

test_no_false_positives() {
    printf "\n--- Group 8: No False Positives Scenario ---\n"

    # This tests that checks 10-11 (backup/metrics freshness) report
    # correctly when given fresh mock data. The other checks depend on
    # live services and will naturally fail/warn on a dev machine.
    # We verify that the checks we CAN control produce correct results.

    setup_temp
    create_fresh_backup_status
    create_fresh_metrics

    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --json --local \
        --backup-dir "${TEMP_DIR}/backups" \
        --textfile-dir "${TEMP_DIR}/textfile" 2>/dev/null) || exit_code=$?

    # Test 8.1: backup_freshness is pass with fresh data
    local backup_status
    backup_status=$(echo "${output}" | grep -oP '"backup_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "8.1 No false positive: backup_freshness pass" "pass" "${backup_status}"

    # Test 8.2: metrics_freshness is pass with fresh data
    local metrics_status
    metrics_status=$(echo "${output}" | grep -oP '"metrics_freshness":\s*\{[^}]*"status":\s*"\K[^"]+' || echo "")
    assert_eq "8.2 No false positive: metrics_freshness pass" "pass" "${metrics_status}"

    # Test 8.3: Total check count is at least 12 (may be more if game/rcon split)
    local total_checks
    total_checks=$(echo "${output}" | grep -oP '"total":\s*\K[0-9]+' || echo "0")
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${total_checks}" -ge 12 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 8.3 At least 12 checks executed (%s total)\n" "${total_checks}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("8.3 Expected at least 12 checks, got ${total_checks}")
        printf "  FAIL: 8.3 Expected at least 12 checks, got %s\n" "${total_checks}"
    fi

    teardown
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== Extended Health Check Test Suite ===\n"
    printf "Script under test: %s\n" "${HEALTH_CHECK}"

    test_backward_compatibility
    test_extended_checks_listed
    test_argument_parsing
    test_json_output
    test_backup_freshness
    test_metrics_freshness
    test_known_failures
    test_no_false_positives

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

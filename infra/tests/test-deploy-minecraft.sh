#!/usr/bin/env bash
# test-deploy-minecraft.sh -- Test suite for Minecraft deployment orchestrator
#
# Tests deploy-minecraft.sh argument parsing, JVM flag template rendering
# across all three hardware tiers (generous/comfortable/minimal),
# systemd service template rendering, dry-run output, and the health check
# script (check-minecraft-health.sh).
#
# All tests run on any dev machine without requiring a Minecraft server or VM.
# Uses render-pxe-menu.sh to render actual templates with tier fixtures.
#
# Test groups:
#   1. Argument validation (deploy-minecraft.sh)
#   2. JVM flag template rendering (3 tiers)
#   3. systemd service template rendering
#   4. Dry-run output validation
#   5. Health check script validation
#
# Usage: bash infra/tests/test-deploy-minecraft.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (matching test-vm-lifecycle.sh pattern)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
SCRIPTS_DIR="${SCRIPT_DIR}/../scripts"
DEPLOY_MC="${SCRIPTS_DIR}/deploy-minecraft.sh"
HEALTH_CHECK="${SCRIPTS_DIR}/check-minecraft-health.sh"
RENDER_SCRIPT="${SCRIPTS_DIR}/render-pxe-menu.sh"
TEMPLATE_DIR="${SCRIPT_DIR}/../templates/minecraft"
JVM_FLAGS_TEMPLATE="${TEMPLATE_DIR}/jvm-flags.conf.template"
SERVICE_TEMPLATE="${TEMPLATE_DIR}/minecraft.service.template"
TEMP_DIR=""

# Fixture paths
GENEROUS_FIXTURE="${FIXTURES_DIR}/minecraft-local-values-generous.yaml"
COMFORTABLE_FIXTURE="${FIXTURES_DIR}/minecraft-local-values-comfortable.yaml"
MINIMAL_FIXTURE="${FIXTURES_DIR}/minecraft-local-values-minimal.yaml"

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap 'teardown' EXIT

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

# Assert exit code matches
# Usage: assert_exit_code "description" expected_code actual_code
assert_exit_code() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    assert_eq "${desc}" "${expected}" "${actual}"
}

# Assert output contains a string
# Usage: assert_contains "description" "needle" "haystack"
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
        printf "  FAIL: %s ('%s' not found)\n" "${desc}" "${needle}"
    fi
}

# Assert output does NOT contain a string
# Usage: assert_not_contains "description" "needle" "haystack"
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
        printf "  FAIL: %s ('%s' should not be present)\n" "${desc}" "${needle}"
    fi
}

# ---------------------------------------------------------------------------
# Helper: render a template with a fixture file
# ---------------------------------------------------------------------------
render_template() {
    local template="$1"
    local values="$2"
    local output="$3"

    bash "${RENDER_SCRIPT}" \
        --template "${template}" \
        --values "${values}" \
        --output "${output}" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Group 1: Argument validation (8+ assertions)
# ---------------------------------------------------------------------------

test_argument_validation() {
    printf "\n--- Group 1: Argument Validation ---\n"
    setup

    # Test 1.1: --help exits 0
    local exit_code=0 output
    output=$(bash "${DEPLOY_MC}" --help 2>&1) || exit_code=$?
    assert_exit_code "1.1 --help exits 0" "0" "${exit_code}"

    # Test 1.2: No arguments exits with error (must specify --local or --target-host)
    exit_code=0
    output=$(bash "${DEPLOY_MC}" 2>&1) || exit_code=$?
    assert_exit_code "1.2 No arguments exits 2" "2" "${exit_code}"

    # Test 1.3: --local-values with nonexistent file produces error
    exit_code=0
    output=$(bash "${DEPLOY_MC}" --local --local-values "/nonexistent/path.yaml" 2>&1) || exit_code=$?
    # deploy-minecraft.sh continues with warnings if MC local-values not found, but
    # it will fail at prerequisites if templates are not reachable from wrong CWD
    # The important thing: it does NOT exit 0
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ ${exit_code} -ne 0 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "1.3 --local-values nonexistent causes non-zero exit"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("1.3: expected non-zero exit, got 0")
        printf "  FAIL: 1.3 --local-values nonexistent should cause non-zero exit\n"
    fi

    # Test 1.4: --skip-download flag is accepted (with --help to avoid actual deploy)
    exit_code=0
    output=$(bash "${DEPLOY_MC}" --help --skip-download 2>&1) || exit_code=$?
    # --help should take priority and exit 0
    assert_exit_code "1.4 --skip-download accepted (with --help)" "0" "${exit_code}"

    # Test 1.5: Unknown flag exits with error
    exit_code=0
    output=$(bash "${DEPLOY_MC}" --bogus-flag 2>&1) || exit_code=$?
    assert_exit_code "1.5 Unknown flag exits 2" "2" "${exit_code}"
    assert_contains "1.5 Error mentions unknown option" "Unknown option" "${output}"

    # Test 1.6: Help text mentions all 10 steps
    exit_code=0
    output=$(bash "${DEPLOY_MC}" --help 2>&1)
    assert_contains "1.6 Help mentions Step 1" "1." "${output}"
    assert_contains "1.6 Help mentions Step 10" "10." "${output}"

    # Test 1.7: Help text mentions --dry-run
    assert_contains "1.7 Help mentions --dry-run" "--dry-run" "${output}"

    # Test 1.8: Help text mentions systemd
    assert_contains "1.8 Help mentions systemd" "systemd" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 2: JVM flag template rendering (12+ assertions)
# ---------------------------------------------------------------------------

test_jvm_flag_rendering() {
    printf "\n--- Group 2: JVM Flag Template Rendering ---\n"
    setup

    # --- Generous tier ---
    local generous_output="${TEMP_DIR}/jvm-flags-generous.conf"
    render_template "${JVM_FLAGS_TEMPLATE}" "${GENEROUS_FIXTURE}" "${generous_output}"
    local generous_content
    generous_content=$(<"${generous_output}")

    # Test 2.1: Generous heap values
    assert_contains "2.1 Generous: -Xms4096m" "-Xms4096m" "${generous_content}"

    # Test 2.2: Generous max heap
    assert_contains "2.2 Generous: -Xmx15872m" "-Xmx15872m" "${generous_content}"

    # Test 2.3: Generous uses ZGC
    assert_contains "2.3 Generous: UseZGC" "UseZGC" "${generous_content}"

    # Test 2.4: Generous has ZGenerational
    assert_contains "2.4 Generous: ZGenerational" "ZGenerational" "${generous_content}"

    # --- Comfortable tier ---
    local comfortable_output="${TEMP_DIR}/jvm-flags-comfortable.conf"
    render_template "${JVM_FLAGS_TEMPLATE}" "${COMFORTABLE_FIXTURE}" "${comfortable_output}"
    local comfortable_content
    comfortable_content=$(<"${comfortable_output}")

    # Test 2.5: Comfortable heap values
    assert_contains "2.5 Comfortable: -Xms2048m" "-Xms2048m" "${comfortable_content}"

    # Test 2.6: Comfortable max heap
    assert_contains "2.6 Comfortable: -Xmx13824m" "-Xmx13824m" "${comfortable_content}"

    # Test 2.7: Comfortable uses G1GC
    assert_contains "2.7 Comfortable: UseG1GC" "UseG1GC" "${comfortable_content}"

    # Test 2.8: Comfortable JVM_FLAGS line does NOT contain UseZGC
    # (check the JVM_FLAGS= line only, not template comments which mention ZGC)
    local comfortable_flags_line
    comfortable_flags_line=$(grep "^JVM_FLAGS=" "${comfortable_output}" || echo "")
    assert_not_contains "2.8 Comfortable: JVM_FLAGS line has no UseZGC" "UseZGC" "${comfortable_flags_line}"

    # --- Minimal tier ---
    local minimal_output="${TEMP_DIR}/jvm-flags-minimal.conf"
    render_template "${JVM_FLAGS_TEMPLATE}" "${MINIMAL_FIXTURE}" "${minimal_output}"
    local minimal_content
    minimal_content=$(<"${minimal_output}")

    # Test 2.9: Minimal heap values
    assert_contains "2.9 Minimal: -Xms1024m" "-Xms1024m" "${minimal_content}"

    # Test 2.10: Minimal max heap
    assert_contains "2.10 Minimal: -Xmx5632m" "-Xmx5632m" "${minimal_content}"

    # Test 2.11: Minimal uses G1GC
    assert_contains "2.11 Minimal: UseG1GC" "UseG1GC" "${minimal_content}"

    # --- Cross-tier checks ---

    # Test 2.12: All tiers include Log4Shell mitigation
    assert_contains "2.12 Generous: Log4Shell mitigation" "log4j2.formatMsgNoLookups=true" "${generous_content}"
    assert_contains "2.12 Comfortable: Log4Shell mitigation" "log4j2.formatMsgNoLookups=true" "${comfortable_content}"
    assert_contains "2.12 Minimal: Log4Shell mitigation" "log4j2.formatMsgNoLookups=true" "${minimal_content}"

    # Test 2.13: All tiers include ParallelRefProcEnabled
    assert_contains "2.13 Generous: ParallelRefProcEnabled" "ParallelRefProcEnabled" "${generous_content}"
    assert_contains "2.13 Comfortable: ParallelRefProcEnabled" "ParallelRefProcEnabled" "${comfortable_content}"
    assert_contains "2.13 Minimal: ParallelRefProcEnabled" "ParallelRefProcEnabled" "${minimal_content}"

    # Test 2.14: Rendered output is valid shell (can be sourced without error)
    local exit_code=0
    bash -n "${generous_output}" 2>/dev/null || exit_code=$?
    assert_exit_code "2.14 Generous rendered is valid shell" "0" "${exit_code}"

    exit_code=0
    bash -n "${comfortable_output}" 2>/dev/null || exit_code=$?
    assert_exit_code "2.14 Comfortable rendered is valid shell" "0" "${exit_code}"

    exit_code=0
    bash -n "${minimal_output}" 2>/dev/null || exit_code=$?
    assert_exit_code "2.14 Minimal rendered is valid shell" "0" "${exit_code}"

    # Test 2.15: JVM_FLAGS variable is defined in rendered output
    assert_contains "2.15 Generous: JVM_FLAGS defined" "JVM_FLAGS=" "${generous_content}"
    assert_contains "2.15 Comfortable: JVM_FLAGS defined" "JVM_FLAGS=" "${comfortable_content}"
    assert_contains "2.15 Minimal: JVM_FLAGS defined" "JVM_FLAGS=" "${minimal_content}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 3: systemd service template rendering (8+ assertions)
# ---------------------------------------------------------------------------

test_service_template_rendering() {
    printf "\n--- Group 3: systemd Service Template Rendering ---\n"
    setup

    # Render service template with generous fixture
    # The service template needs: minecraft_home, server_jar, jvm_flags_path
    local service_output="${TEMP_DIR}/minecraft.service"
    render_template "${SERVICE_TEMPLATE}" "${GENEROUS_FIXTURE}" "${service_output}"
    local service_content
    service_content=$(<"${service_output}")

    # Test 3.1: User=minecraft
    assert_contains "3.1 User=minecraft" "User=minecraft" "${service_content}"

    # Test 3.2: Restart=on-failure
    assert_contains "3.2 Restart=on-failure" "Restart=on-failure" "${service_content}"

    # Test 3.3: RestartSec=10
    assert_contains "3.3 RestartSec=10" "RestartSec=10" "${service_content}"

    # Test 3.4: WantedBy=multi-user.target
    assert_contains "3.4 WantedBy=multi-user.target" "WantedBy=multi-user.target" "${service_content}"

    # Test 3.5: After=network-online.target
    assert_contains "3.5 After=network-online.target" "After=network-online.target" "${service_content}"

    # Test 3.6: Contains server JAR name
    assert_contains "3.6 Contains fabric-server-launch.jar" "fabric-server-launch.jar" "${service_content}"

    # Test 3.7: EnvironmentFile points to jvm-flags.conf
    assert_contains "3.7 EnvironmentFile references jvm-flags.conf" "jvm-flags.conf" "${service_content}"

    # Test 3.8: Security hardening - ProtectSystem=full
    assert_contains "3.8 ProtectSystem=full" "ProtectSystem=full" "${service_content}"

    # Test 3.9: Security hardening - NoNewPrivileges=true
    assert_contains "3.9 NoNewPrivileges=true" "NoNewPrivileges=true" "${service_content}"

    # Test 3.10: WorkingDirectory set to minecraft home
    assert_contains "3.10 WorkingDirectory set" "WorkingDirectory=/opt/minecraft/server" "${service_content}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 4: Dry-run output validation (8+ assertions)
# ---------------------------------------------------------------------------

test_dry_run_output() {
    printf "\n--- Group 4: Dry-Run Output Validation ---\n"
    setup

    # deploy-minecraft.sh --dry-run --local renders templates and shows
    # what would be done. It needs --local and valid templates/values.
    local exit_code=0 output

    output=$(bash "${DEPLOY_MC}" --dry-run --local \
        --local-values "${GENEROUS_FIXTURE}" 2>&1) || exit_code=$?

    # Test 4.1: Dry-run exits 0
    assert_exit_code "4.1 Dry-run exits 0" "0" "${exit_code}"

    # Test 4.2: Output contains DRY-RUN marker
    assert_contains "4.2 Output contains DRY-RUN" "DRY-RUN" "${output}"

    # Test 4.3: Output mentions Step 1
    assert_contains "4.3 Output mentions Step 1" "Step 1" "${output}"

    # Test 4.4: Output mentions Step 10
    assert_contains "4.4 Output mentions Step 10" "Step 10" "${output}"

    # Test 4.5: Output mentions Fabric installer
    assert_contains "4.5 Output mentions Fabric installer" "Fabric installer" "${output}"

    # Test 4.6: Output mentions JVM flags
    assert_contains "4.6 Output mentions JVM flags" "JVM flags" "${output}"

    # Test 4.7: Output mentions systemd
    assert_contains "4.7 Output mentions systemd" "systemd" "${output}"

    # Test 4.8: Output mentions firewall
    assert_contains "4.8 Output mentions firewall" "firewall" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 5: Health check script validation (8+ assertions)
# ---------------------------------------------------------------------------

test_health_check_script() {
    printf "\n--- Group 5: Health Check Script Validation ---\n"
    setup

    # Test 5.1: --help exits 0
    local exit_code=0 output
    output=$(bash "${HEALTH_CHECK}" --help 2>&1) || exit_code=$?
    assert_exit_code "5.1 --help exits 0" "0" "${exit_code}"

    # Test 5.2: --local on machine without Minecraft exits 1 (unhealthy)
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --local 2>&1) || exit_code=$?
    assert_exit_code "5.2 --local without MC exits 1 (unhealthy)" "1" "${exit_code}"

    # Test 5.3: --json --local produces output containing "status":
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local 2>/dev/null) || exit_code=$?
    assert_contains "5.3 JSON output contains status" "\"status\":" "${output}"

    # Test 5.4: --quiet --local produces no stdout
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --quiet --local 2>/dev/null) || exit_code=$?
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -z "${output}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 5.4 --quiet produces no stdout\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("5.4: --quiet should produce no stdout, got '${output}'")
        printf "  FAIL: 5.4 --quiet produces no stdout (got output)\n"
    fi

    # Test 5.5: --quiet --local exit code is 1 (no Minecraft running)
    exit_code=0
    bash "${HEALTH_CHECK}" --quiet --local 2>/dev/null || exit_code=$?
    assert_exit_code "5.5 --quiet --local exit code 1" "1" "${exit_code}"

    # Test 5.6: --json output is parseable by python3 json
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --json --local 2>/dev/null) || true
    local json_valid=0
    echo "${output}" | python3 -m json.tool >/dev/null 2>&1 || json_valid=1
    assert_exit_code "5.6 JSON is valid (parseable by python3)" "0" "${json_valid}"

    # Test 5.7: Unknown flag exits with error (exit code 3)
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --invalid-flag 2>&1) || exit_code=$?
    assert_exit_code "5.7 Unknown flag exits 3" "3" "${exit_code}"

    # Test 5.8: Help text mentions all check categories
    exit_code=0
    output=$(bash "${HEALTH_CHECK}" --help 2>&1) || exit_code=$?
    assert_contains "5.8 Help mentions systemd" "systemd" "${output}"
    assert_contains "5.8 Help mentions JVM" "JVM" "${output}"
    assert_contains "5.8 Help mentions Disk" "Disk" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== Minecraft Deployment & Health Check Test Suite ===\n"
    printf "Scripts:\n"
    printf "  deploy-minecraft.sh:       %s\n" "${DEPLOY_MC}"
    printf "  check-minecraft-health.sh: %s\n" "${HEALTH_CHECK}"
    printf "  render-pxe-menu.sh:        %s\n" "${RENDER_SCRIPT}"
    printf "Templates:\n"
    printf "  jvm-flags.conf.template:    %s\n" "${JVM_FLAGS_TEMPLATE}"
    printf "  minecraft.service.template: %s\n" "${SERVICE_TEMPLATE}"
    printf "Fixtures: %s\n" "${FIXTURES_DIR}"

    # Verify prerequisites
    for f in "${DEPLOY_MC}" "${HEALTH_CHECK}" "${RENDER_SCRIPT}" \
             "${JVM_FLAGS_TEMPLATE}" "${SERVICE_TEMPLATE}" \
             "${GENEROUS_FIXTURE}" "${COMFORTABLE_FIXTURE}" "${MINIMAL_FIXTURE}"; do
        if [[ ! -f "${f}" ]]; then
            printf "ERROR: Required file not found: %s\n" "${f}"
            exit 1
        fi
    done
    printf "All prerequisites found.\n"

    test_argument_validation
    test_jvm_flag_rendering
    test_service_template_rendering
    test_dry_run_output
    test_health_check_script

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

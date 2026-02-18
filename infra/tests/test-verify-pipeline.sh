#!/usr/bin/env bash
# test-verify-pipeline.sh -- Test suite for the integration verification script
#
# Tests verify-pipeline.sh argument parsing, dry-run output, output format,
# and exit code contracts using mock infrastructure directories.
#
# All tests run without VMs, network connections, or real infrastructure.
# The INFRA_DIR environment variable points verify-pipeline.sh at a
# temporary directory containing mock scripts and templates.
#
# Test groups:
#   1. Argument parsing (7 assertions)
#   2. Dry-run mode validation (7 assertions)
#   3. Output format validation (5 assertions)
#   4. Exit code contracts (5 assertions)
#
# Usage: bash infra/tests/test-verify-pipeline.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (matching test-vm-lifecycle.sh pattern)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}/../scripts"
VERIFY_PIPELINE="${SCRIPTS_DIR}/verify-pipeline.sh"
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
# Mock infrastructure setup
# ---------------------------------------------------------------------------

# Create a fully populated mock infrastructure directory so dry-run passes
setup_full_mock() {
    TEMP_DIR="$(mktemp -d)"

    # Create mock scripts (just need to exist and be executable)
    mkdir -p "${TEMP_DIR}/scripts"
    for script in provision-vm.sh vm-lifecycle.sh deploy-pxe.sh deploy-kickstart.sh; do
        cat > "${TEMP_DIR}/scripts/${script}" <<'MOCK'
#!/usr/bin/env bash
echo "mock ${0##*/}"
exit 0
MOCK
        chmod +x "${TEMP_DIR}/scripts/${script}"
    done

    # Create mock templates
    mkdir -p "${TEMP_DIR}/templates/kickstart"
    echo "# mock base template" > "${TEMP_DIR}/templates/kickstart/base.ks.template"
    echo "# mock minecraft template" > "${TEMP_DIR}/templates/kickstart/minecraft.ks.template"

    # Create mock PXE templates
    mkdir -p "${TEMP_DIR}/templates/dnsmasq"
    echo "# mock dnsmasq template" > "${TEMP_DIR}/templates/dnsmasq/pxe-boot.conf.template"
    mkdir -p "${TEMP_DIR}/templates/pxe"
    echo "# mock bios menu" > "${TEMP_DIR}/templates/pxe/pxelinux.cfg-default.template"
    echo "# mock uefi menu" > "${TEMP_DIR}/templates/pxe/grub.cfg.template"

    # Create mock local-values
    mkdir -p "${TEMP_DIR}/local"
    echo "vm_name: test" > "${TEMP_DIR}/local/vm-provisioning.local-values"

    # Create mock resource-budget.yaml
    cat > "${TEMP_DIR}/local/resource-budget.yaml" <<'YAML'
minecraft_vm:
  ram_gb: 8
  cores: 4
  storage_gb: 50
YAML

    # Create mock hardware-capabilities.yaml
    mkdir -p "${TEMP_DIR}/inventory"
    cat > "${TEMP_DIR}/inventory/hardware-capabilities.yaml" <<'YAML'
hypervisor:
  kvm: true
  vmware: false
capabilities:
  can_run_vms: true
YAML

    # Create mock VM template example
    mkdir -p "${TEMP_DIR}/templates/vm"
    echo "vm_name: example" > "${TEMP_DIR}/templates/vm/vm-provisioning.local-values.example"
}

# Create a minimal mock (missing some required files)
setup_partial_mock() {
    TEMP_DIR="$(mktemp -d)"

    # Create only some scripts (missing deploy-pxe.sh)
    mkdir -p "${TEMP_DIR}/scripts"
    for script in provision-vm.sh vm-lifecycle.sh deploy-kickstart.sh; do
        cat > "${TEMP_DIR}/scripts/${script}" <<'MOCK'
#!/usr/bin/env bash
echo "mock"
exit 0
MOCK
        chmod +x "${TEMP_DIR}/scripts/${script}"
    done

    # Create minimal templates
    mkdir -p "${TEMP_DIR}/templates/kickstart"
    echo "# mock" > "${TEMP_DIR}/templates/kickstart/minecraft.ks.template"
    echo "# mock" > "${TEMP_DIR}/templates/kickstart/base.ks.template"

    # Create empty directories for missing items
    mkdir -p "${TEMP_DIR}/local"
    mkdir -p "${TEMP_DIR}/inventory"
    mkdir -p "${TEMP_DIR}/templates/dnsmasq"
    mkdir -p "${TEMP_DIR}/templates/pxe"
    mkdir -p "${TEMP_DIR}/templates/vm"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

# ---------------------------------------------------------------------------
# Group 1: Argument parsing (7 assertions)
# ---------------------------------------------------------------------------

test_argument_parsing() {
    printf "\n--- Group 1: Argument Parsing ---\n"

    # Test 1.1: --help exits 0 and prints usage
    local exit_code=0 output
    output=$(bash "${VERIFY_PIPELINE}" --help 2>&1) || exit_code=$?
    assert_exit_code "1.1 --help exits 0" "0" "${exit_code}"
    assert_contains "1.1 --help shows usage" "Usage:" "${output}"

    # Test 1.2: No arguments defaults to --mode dry-run
    setup_full_mock
    exit_code=0
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" 2>&1) || exit_code=$?
    assert_contains "1.2 Default mode is dry-run" "dry-run" "${output}"
    teardown

    # Test 1.3: --mode invalid exits 2 (usage error)
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --mode invalid 2>&1) || exit_code=$?
    assert_exit_code "1.3 Invalid mode exits 2" "2" "${exit_code}"

    # Test 1.4: --mode performance without --server-ip or --server-name exits 2
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --mode performance 2>&1) || exit_code=$?
    assert_exit_code "1.4 Performance without server exits 2" "2" "${exit_code}"

    # Test 1.5: --timeout accepts numeric value
    setup_full_mock
    exit_code=0
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run --timeout 600 2>&1) || exit_code=$?
    assert_exit_code "1.5 Numeric --timeout accepted" "0" "${exit_code}"
    teardown

    # Test 1.6: --timeout rejects non-numeric value
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --timeout abc 2>&1) || exit_code=$?
    assert_exit_code "1.6 Non-numeric --timeout exits 2" "2" "${exit_code}"

    # Test 1.7: Unknown flag exits 2
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --bogus 2>&1) || exit_code=$?
    assert_exit_code "1.7 Unknown flag exits 2" "2" "${exit_code}"
}

# ---------------------------------------------------------------------------
# Group 2: Dry-run mode validation (7 assertions)
# ---------------------------------------------------------------------------

test_dry_run_validation() {
    printf "\n--- Group 2: Dry-Run Mode Validation ---\n"
    setup_full_mock

    local exit_code=0 output
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run 2>&1) || exit_code=$?

    # Test 2.1: Dry-run checks for required script existence
    assert_contains "2.1 Checks provision-vm.sh" "Required scripts" "${output}"

    # Test 2.2: Dry-run checks for template existence
    assert_contains "2.2 Checks templates" "Required templates" "${output}"

    # Test 2.3: Dry-run checks for hardware-capabilities.yaml
    assert_contains "2.3 Checks hardware capabilities" "Hardware capabilities" "${output}"

    # Test 2.4: Dry-run checks for resource-budget.yaml
    assert_contains "2.4 Checks resource budget" "Resource budget" "${output}"

    # Test 2.5: Dry-run output includes stage numbers and PASS/FAIL/SKIP
    assert_matches "2.5 Stages show PASS/FAIL/SKIP" "Stage.*PASS" "${output}"

    # Test 2.6: Dry-run output includes final summary with count
    assert_matches "2.6 Summary shows count" "RESULT:.*PASSED" "${output}"

    # Test 2.7: Dry-run reports how many prerequisites satisfied
    assert_contains "2.7 Reports prerequisites satisfied" "prerequisites satisfied" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 3: Output format validation (5 assertions)
# ---------------------------------------------------------------------------

test_output_format() {
    printf "\n--- Group 3: Output Format Validation ---\n"
    setup_full_mock

    local exit_code=0 output
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run 2>&1) || exit_code=$?

    # Test 3.1: Output contains header
    assert_contains "3.1 Contains results header" "INTEGRATION VERIFICATION RESULTS" "${output}"

    # Test 3.2: Output contains RESULT: summary line
    assert_contains "3.2 Contains RESULT: line" "RESULT:" "${output}"

    # Test 3.3: Output contains MC requirement labels (MC-11 for dry-run)
    assert_contains "3.3 Contains MC-11 reference" "MC-11" "${output}"

    # Test 3.4: Stage lines contain elapsed time in parentheses
    assert_matches "3.4 Stage lines have timing" "Stage.*\\([0-9]" "${output}"

    # Test 3.5: Mode is reported in output
    assert_contains "3.5 Mode reported in output" "Mode:     dry-run" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 4: Exit code contracts (5 assertions)
# ---------------------------------------------------------------------------

test_exit_codes() {
    printf "\n--- Group 4: Exit Code Contracts ---\n"

    # Test 4.1: Dry-run with all prerequisites present exits 0
    setup_full_mock
    local exit_code=0 output
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run 2>&1) || exit_code=$?
    assert_exit_code "4.1 Full mock dry-run exits 0" "0" "${exit_code}"
    teardown

    # Test 4.2: Dry-run with missing critical script exits 1
    setup_partial_mock
    exit_code=0
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run 2>&1) || exit_code=$?
    assert_exit_code "4.2 Partial mock dry-run exits 1" "1" "${exit_code}"
    teardown

    # Test 4.3: Performance mode without server exits 2 (usage error)
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --mode performance 2>&1) || exit_code=$?
    assert_exit_code "4.3 Performance without server exits 2" "2" "${exit_code}"

    # Test 4.4: Unknown flag exits 2
    exit_code=0
    output=$(bash "${VERIFY_PIPELINE}" --unknown-flag 2>&1) || exit_code=$?
    assert_exit_code "4.4 Unknown flag exits 2" "2" "${exit_code}"

    # Test 4.5: Dry-run with missing files reports specific failures
    setup_partial_mock
    exit_code=0
    output=$(INFRA_DIR="${TEMP_DIR}" bash "${VERIFY_PIPELINE}" --mode dry-run 2>&1) || exit_code=$?
    assert_contains "4.5 Reports missing deploy-pxe.sh" "deploy-pxe.sh" "${output}"
    teardown
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== Verify Pipeline Test Suite ===\n"
    printf "Script under test: %s\n" "${VERIFY_PIPELINE}"

    test_argument_parsing
    test_dry_run_validation
    test_output_format
    test_exit_codes

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

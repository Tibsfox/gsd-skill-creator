#!/usr/bin/env bash
# test-calculate-budget.sh -- Test suite for resource budget calculator
#
# Tests calculate-budget.sh against fixture hardware profiles to verify:
#   - Host OS always retains minimum 4GB RAM and 2 CPU cores
#   - VM allocations scale from minimal (16GB) to generous (64GB)
#   - Below-minimum hardware is rejected with informative error
#   - Output YAML is valid and machine-parseable
#
# Usage: bash infra/tests/test-calculate-budget.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
CALCULATOR="${SCRIPT_DIR}/../scripts/calculate-budget.sh"
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
    if echo "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('${needle}' not found in output)\n" "${desc}"
    fi
}

# Extract a YAML value by key (simple grep/awk, no yq dependency)
# Usage: yaml_val "key" "file"
yaml_val() {
    local key="$1"
    local file="$2"
    grep -E "^[[:space:]]*${key}:" "${file}" 2>/dev/null | head -1 | sed -E 's/^[^:]+:[[:space:]]*//' | sed 's/[[:space:]]*#.*//' | sed 's/^"//' | sed 's/"$//'
}

# ---------------------------------------------------------------------------
# Test: 64GB generous workstation
# ---------------------------------------------------------------------------

test_64gb_generous() {
    printf "\n--- Test: 64GB Generous Workstation ---\n"
    setup

    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-64gb.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    assert_exit_code "64GB: exit code 0" "0" "${exit_code}"

    local budget="${TEMP_DIR}/budget.yaml"
    if [[ ! -f "${budget}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("64GB: budget file not created at ${budget}")
        printf "  FAIL: budget file not created\n"
        teardown
        return
    fi

    # Host reserved
    assert_eq "64GB: host_reserved.ram_gb = 4" "4" "$(yaml_val "ram_gb" "${budget}" | head -1)"
    assert_eq "64GB: host_reserved.cores = 2" "2" "$(yaml_val "cores" "${budget}" | head -1)"

    # VM available: 64 - 4 = 60 RAM, 16 - 2 = 14 cores
    assert_eq "64GB: vm_available.ram_gb = 60" "60" "$(yaml_val "ram_gb" "${budget}" | sed -n '2p')"
    assert_eq "64GB: vm_available.cores = 14" "14" "$(yaml_val "cores" "${budget}" | sed -n '2p')"

    # Minecraft VM: min(60*0.5, 16) = 16 RAM (capped), min(14*0.5, 8) = 7 cores
    assert_eq "64GB: minecraft_vm.ram_gb = 16" "16" "$(yaml_val "ram_gb" "${budget}" | sed -n '3p')"
    assert_eq "64GB: minecraft_vm.cores = 7" "7" "$(yaml_val "cores" "${budget}" | sed -n '3p')"

    # Unallocated: 60 - 16 = 44 RAM, 14 - 7 = 7 cores
    assert_eq "64GB: unallocated.ram_gb = 44" "44" "$(yaml_val "ram_gb" "${budget}" | sed -n '4p')"
    assert_eq "64GB: unallocated.cores = 7" "7" "$(yaml_val "cores" "${budget}" | sed -n '4p')"

    # Tier
    assert_eq "64GB: tier = generous" "generous" "$(yaml_val "tier" "${budget}")"

    # Requirements met
    assert_eq "64GB: meets_requirements = true" "true" "$(yaml_val "meets_requirements" "${budget}")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: 32GB comfortable desktop
# ---------------------------------------------------------------------------

test_32gb_comfortable() {
    printf "\n--- Test: 32GB Comfortable Desktop ---\n"
    setup

    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-32gb.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    assert_exit_code "32GB: exit code 0" "0" "${exit_code}"

    local budget="${TEMP_DIR}/budget.yaml"
    if [[ ! -f "${budget}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("32GB: budget file not created at ${budget}")
        printf "  FAIL: budget file not created\n"
        teardown
        return
    fi

    # Host reserved
    assert_eq "32GB: host_reserved.ram_gb = 4" "4" "$(yaml_val "ram_gb" "${budget}" | head -1)"
    assert_eq "32GB: host_reserved.cores = 2" "2" "$(yaml_val "cores" "${budget}" | head -1)"

    # VM available: 32 - 4 = 28 RAM, 8 - 2 = 6 cores
    assert_eq "32GB: vm_available.ram_gb = 28" "28" "$(yaml_val "ram_gb" "${budget}" | sed -n '2p')"
    assert_eq "32GB: vm_available.cores = 6" "6" "$(yaml_val "cores" "${budget}" | sed -n '2p')"

    # Minecraft VM: min(28*0.5, 16) = 14 RAM, min(6*0.5, 8) = 3 cores
    assert_eq "32GB: minecraft_vm.ram_gb = 14" "14" "$(yaml_val "ram_gb" "${budget}" | sed -n '3p')"
    assert_eq "32GB: minecraft_vm.cores = 3" "3" "$(yaml_val "cores" "${budget}" | sed -n '3p')"

    # Unallocated: 28 - 14 = 14 RAM, 6 - 3 = 3 cores
    assert_eq "32GB: unallocated.ram_gb = 14" "14" "$(yaml_val "ram_gb" "${budget}" | sed -n '4p')"
    assert_eq "32GB: unallocated.cores = 3" "3" "$(yaml_val "cores" "${budget}" | sed -n '4p')"

    # Tier
    assert_eq "32GB: tier = comfortable" "comfortable" "$(yaml_val "tier" "${budget}")"

    # Requirements met
    assert_eq "32GB: meets_requirements = true" "true" "$(yaml_val "meets_requirements" "${budget}")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: 16GB minimal laptop
# ---------------------------------------------------------------------------

test_16gb_minimal() {
    printf "\n--- Test: 16GB Minimal Laptop ---\n"
    setup

    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-16gb.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    assert_exit_code "16GB: exit code 0" "0" "${exit_code}"

    local budget="${TEMP_DIR}/budget.yaml"
    if [[ ! -f "${budget}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("16GB: budget file not created at ${budget}")
        printf "  FAIL: budget file not created\n"
        teardown
        return
    fi

    # Host reserved
    assert_eq "16GB: host_reserved.ram_gb = 4" "4" "$(yaml_val "ram_gb" "${budget}" | head -1)"
    assert_eq "16GB: host_reserved.cores = 2" "2" "$(yaml_val "cores" "${budget}" | head -1)"

    # VM available: 16 - 4 = 12 RAM, 4 - 2 = 2 cores
    assert_eq "16GB: vm_available.ram_gb = 12" "12" "$(yaml_val "ram_gb" "${budget}" | sed -n '2p')"
    assert_eq "16GB: vm_available.cores = 2" "2" "$(yaml_val "cores" "${budget}" | sed -n '2p')"

    # Minecraft VM: min(12*0.5, 16) = 6 RAM, min(2*0.5, 8) = 1 core (min 1)
    assert_eq "16GB: minecraft_vm.ram_gb = 6" "6" "$(yaml_val "ram_gb" "${budget}" | sed -n '3p')"
    assert_eq "16GB: minecraft_vm.cores = 1" "1" "$(yaml_val "cores" "${budget}" | sed -n '3p')"

    # Unallocated: 12 - 6 = 6 RAM, 2 - 1 = 1 core
    assert_eq "16GB: unallocated.ram_gb = 6" "6" "$(yaml_val "ram_gb" "${budget}" | sed -n '4p')"
    assert_eq "16GB: unallocated.cores = 1" "1" "$(yaml_val "cores" "${budget}" | sed -n '4p')"

    # Tier
    assert_eq "16GB: tier = minimal" "minimal" "$(yaml_val "tier" "${budget}")"

    # Requirements met
    assert_eq "16GB: meets_requirements = true" "true" "$(yaml_val "meets_requirements" "${budget}")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: 8GB, no virtualization (rejected)
# ---------------------------------------------------------------------------

test_8gb_rejected() {
    printf "\n--- Test: 8GB No Virtualization (Rejected) ---\n"
    setup

    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-8gb-novirt.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    assert_exit_code "8GB: exit code 1 (rejected)" "1" "${exit_code}"

    # Output should contain specific rejection reasons
    assert_contains "8GB: reason includes insufficient RAM" "Insufficient RAM" "${output}"
    assert_contains "8GB: reason includes 8GB" "8GB" "${output}"
    assert_contains "8GB: reason includes need 16GB" "16GB" "${output}"
    assert_contains "8GB: reason includes no virtualization" "No hardware virtualization" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: Output YAML is machine-parseable
# ---------------------------------------------------------------------------

test_yaml_structure() {
    printf "\n--- Test: YAML Output Structure ---\n"
    setup

    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-64gb.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    local budget="${TEMP_DIR}/budget.yaml"
    if [[ ! -f "${budget}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("YAML structure: budget file not created")
        printf "  FAIL: budget file not created\n"
        teardown
        return
    fi

    # Verify required sections exist
    assert_contains "YAML: has host_reserved section" "host_reserved:" "$(cat "${budget}")"
    assert_contains "YAML: has vm_available section" "vm_available:" "$(cat "${budget}")"
    assert_contains "YAML: has minecraft_vm section" "minecraft_vm:" "$(cat "${budget}")"
    assert_contains "YAML: has unallocated section" "unallocated:" "$(cat "${budget}")"
    assert_contains "YAML: has meets_requirements" "meets_requirements:" "$(cat "${budget}")"
    assert_contains "YAML: has tier" "tier:" "$(cat "${budget}")"
    assert_contains "YAML: has storage_gb in minecraft_vm" "storage_gb:" "$(cat "${budget}")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: Host reservation is enforced (never less than 4GB/2cores)
# ---------------------------------------------------------------------------

test_host_reservation_floor() {
    printf "\n--- Test: Host Reservation Floor ---\n"
    setup

    # Test with 16GB (smallest viable) -- host must still get 4GB/2cores
    local output exit_code=0
    output="$(bash "${CALCULATOR}" "${FIXTURES_DIR}/profile-16gb.yaml" "${TEMP_DIR}/budget.yaml" 2>&1)" || exit_code=$?

    local budget="${TEMP_DIR}/budget.yaml"
    if [[ ! -f "${budget}" ]]; then
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Host floor: budget file not created")
        printf "  FAIL: budget file not created\n"
        teardown
        return
    fi

    local host_ram host_cores
    host_ram="$(yaml_val "ram_gb" "${budget}" | head -1)"
    host_cores="$(yaml_val "cores" "${budget}" | head -1)"

    # Host reserved must be >= 4GB RAM and >= 2 cores
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${host_ram}" -ge 4 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: Host RAM floor >= 4GB (got %s)\n" "${host_ram}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Host RAM floor: got ${host_ram}, need >= 4")
        printf "  FAIL: Host RAM floor (got %s, need >= 4)\n" "${host_ram}"
    fi

    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${host_cores}" -ge 2 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: Host cores floor >= 2 (got %s)\n" "${host_cores}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Host cores floor: got ${host_cores}, need >= 2")
        printf "  FAIL: Host cores floor (got %s, need >= 2)\n" "${host_cores}"
    fi

    teardown
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== Resource Budget Calculator Tests ===\n"
    printf "Calculator: %s\n" "${CALCULATOR}"
    printf "Fixtures: %s\n\n" "${FIXTURES_DIR}"

    test_64gb_generous
    test_32gb_comfortable
    test_16gb_minimal
    test_8gb_rejected
    test_yaml_structure
    test_host_reservation_floor

    printf "\n=== Results ===\n"
    printf "Tests run: %s\n" "${TESTS_RUN}"
    printf "Passed: %s\n" "${TESTS_PASSED}"
    printf "Failed: %s\n" "${TESTS_FAILED}"

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
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

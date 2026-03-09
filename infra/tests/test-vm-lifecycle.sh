#!/usr/bin/env bash
# shellcheck disable=SC2034,SC1090 # test variables used for assertion context
# test-vm-lifecycle.sh -- Test suite for VM lifecycle manager and provisioning orchestrator
#
# Tests vm-lifecycle.sh, provision-vm.sh, and vm-common.sh library against
# fixture capabilities files and using --dry-run mode (no actual VMs created).
#
# Test groups:
#   1. Parameter validation (vm_validate_params)
#   2. Backend detection (vm_detect_backend)
#   3. Idempotent operation contracts (--dry-run mode)
#   4. Provisioning orchestrator (provision-vm.sh)
#   5. Local-values loading (vm_load_values)
#
# All tests are safe to run on any machine without hypervisor installed.
#
# Usage: bash infra/tests/test-vm-lifecycle.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (matching test-calculate-budget.sh pattern)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
SCRIPTS_DIR="${SCRIPT_DIR}/../scripts"
VM_LIFECYCLE="${SCRIPTS_DIR}/vm-lifecycle.sh"
PROVISION_VM="${SCRIPTS_DIR}/provision-vm.sh"
VM_COMMON="${SCRIPTS_DIR}/lib/vm-common.sh"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}/bin"
    mkdir -p "${TEMP_DIR}/inventory"
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
        printf "  FAIL: %s ('${needle}' should not be present)\n" "${desc}"
    fi
}

# ---------------------------------------------------------------------------
# Group 1: Parameter validation (8+ assertions)
# ---------------------------------------------------------------------------

test_param_validation() {
    printf "\n--- Group 1: Parameter Validation ---\n"
    setup

    # Source the common library to get vm_validate_params
    source "${VM_COMMON}"

    # Test 1.1: Valid params accepted
    VM_NAME="test-vm" VM_RAM_MB=1024 VM_VCPUS=2 VM_DISK_GB=20
    local output exit_code=0
    output=$(vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.1 Valid params exit 0" "0" "${exit_code}"

    # Test 1.2: Missing VM_NAME rejected
    unset VM_NAME
    VM_RAM_MB=1024 VM_VCPUS=2 VM_DISK_GB=20
    exit_code=0
    output=$(VM_NAME="" vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.2 Missing VM_NAME exits 1" "1" "${exit_code}"
    assert_contains "1.2 Error mentions VM_NAME" "VM_NAME" "${output}"

    # Test 1.3: RAM < 512 rejected
    exit_code=0
    output=$(VM_NAME="test" VM_RAM_MB=256 VM_VCPUS=2 VM_DISK_GB=20 vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.3 RAM < 512 exits 1" "1" "${exit_code}"
    assert_contains "1.3 Error mentions 512" "512" "${output}"

    # Test 1.4: VCPUs < 1 rejected
    exit_code=0
    output=$(VM_NAME="test" VM_RAM_MB=1024 VM_VCPUS=0 VM_DISK_GB=20 vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.4 VCPUs < 1 exits 1" "1" "${exit_code}"
    assert_contains "1.4 Error mentions VCPUS" "VM_VCPUS" "${output}"

    # Test 1.5: Disk < 10 rejected
    exit_code=0
    output=$(VM_NAME="test" VM_RAM_MB=1024 VM_VCPUS=2 VM_DISK_GB=5 vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.5 Disk < 10 exits 1" "1" "${exit_code}"
    assert_contains "1.5 Error mentions 10" "10" "${output}"

    # Test 1.6: Invalid VM name (spaces) rejected
    exit_code=0
    output=$(VM_NAME="bad name" VM_RAM_MB=1024 VM_VCPUS=2 VM_DISK_GB=20 vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.6 VM name with spaces exits 1" "1" "${exit_code}"
    assert_contains "1.6 Error mentions alphanumeric" "alphanumeric" "${output}"

    # Test 1.7: Multiple validation errors all reported
    exit_code=0
    output=$(VM_NAME="" VM_RAM_MB=100 VM_VCPUS=0 VM_DISK_GB=1 vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.7 Multiple errors exit 1" "1" "${exit_code}"
    # Should report all 4 errors, not just first
    assert_contains "1.7 Reports VM_NAME error" "VM_NAME" "${output}"
    assert_contains "1.7 Reports RAM error" "VM_RAM_MB" "${output}"

    # Test 1.8: Empty string params rejected
    exit_code=0
    output=$(VM_NAME="" VM_RAM_MB="" VM_VCPUS="" VM_DISK_GB="" vm_validate_params 2>&1) || exit_code=$?
    assert_exit_code "1.8 All empty params exit 1" "1" "${exit_code}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 2: Backend detection (6+ assertions)
# ---------------------------------------------------------------------------

test_backend_detection() {
    printf "\n--- Group 2: Backend Detection ---\n"
    setup

    # Source common library
    source "${VM_COMMON}"

    # Create proper directory structure for detection
    mkdir -p "${TEMP_DIR}/infra/scripts/lib"
    mkdir -p "${TEMP_DIR}/infra/inventory"
    mkdir -p "${TEMP_DIR}/bin"

    # Create mock virsh in temp PATH
    cat > "${TEMP_DIR}/bin/virsh" <<'MOCK'
#!/usr/bin/env bash
echo "mock virsh"
exit 0
MOCK
    chmod +x "${TEMP_DIR}/bin/virsh"

    # Create mock vmrun in temp PATH
    cat > "${TEMP_DIR}/bin/vmrun" <<'MOCK'
#!/usr/bin/env bash
echo "mock vmrun"
exit 0
MOCK
    chmod +x "${TEMP_DIR}/bin/vmrun"

    # Helper: run detection in subshell and echo VM_BACKEND to stdout
    # so we can capture it without losing it to subshell scope
    _detect_and_report() {
        vm_detect_backend 2>/dev/null
        echo "${VM_BACKEND:-UNSET}"
    }

    # Test 2.1: KVM fixture with virsh mock -> selects "kvm"
    cp "${FIXTURES_DIR}/vm-capabilities-kvm.yaml" "${TEMP_DIR}/infra/inventory/hardware-capabilities.yaml"
    local exit_code=0 output detected
    detected=$(
        unset VM_BACKEND
        export PATH="${TEMP_DIR}/bin:${PATH}"
        _VM_LIB_DIR="${TEMP_DIR}/infra/scripts/lib"
        _detect_and_report
    ) || exit_code=$?
    assert_exit_code "2.1 KVM detection exits 0" "0" "${exit_code}"
    assert_eq "2.1 KVM backend selected" "kvm" "${detected}"

    # Test 2.2: VMware fixture with vmrun mock -> selects "vmware"
    exit_code=0
    cp "${FIXTURES_DIR}/vm-capabilities-vmware.yaml" "${TEMP_DIR}/infra/inventory/hardware-capabilities.yaml"
    # Remove virsh from path so KVM doesn't match first
    rm -f "${TEMP_DIR}/bin/virsh"
    detected=$(
        unset VM_BACKEND
        export PATH="${TEMP_DIR}/bin:${PATH}"
        _VM_LIB_DIR="${TEMP_DIR}/infra/scripts/lib"
        _detect_and_report
    ) || exit_code=$?
    assert_exit_code "2.2 VMware detection exits 0" "0" "${exit_code}"
    assert_eq "2.2 VMware backend selected" "vmware" "${detected}"

    # Test 2.3: No-hypervisor fixture -> exits with error
    exit_code=0
    cp "${FIXTURES_DIR}/vm-capabilities-none.yaml" "${TEMP_DIR}/infra/inventory/hardware-capabilities.yaml"
    output=$(
        unset VM_BACKEND
        export PATH="${TEMP_DIR}/bin:${PATH}"
        _VM_LIB_DIR="${TEMP_DIR}/infra/scripts/lib"
        vm_detect_backend 2>&1
    ) || exit_code=$?
    assert_exit_code "2.3 No backend exits 1" "1" "${exit_code}"

    # Test 2.4: KVM fixture without virsh command -> falls through
    exit_code=0
    cp "${FIXTURES_DIR}/vm-capabilities-kvm.yaml" "${TEMP_DIR}/infra/inventory/hardware-capabilities.yaml"
    # Remove vmrun too so neither command is available
    rm -f "${TEMP_DIR}/bin/vmrun"
    output=$(
        unset VM_BACKEND
        export PATH="${TEMP_DIR}/bin:${PATH}"
        _VM_LIB_DIR="${TEMP_DIR}/infra/scripts/lib"
        vm_detect_backend 2>&1
    ) || exit_code=$?
    assert_exit_code "2.4 KVM without virsh falls through (exits 1)" "1" "${exit_code}"
    assert_contains "2.4 Warns about virsh not found" "virsh not found" "${output}"

    # Test 2.5: VM_BACKEND env override honored
    exit_code=0
    detected=$(
        VM_BACKEND="vmware"
        _detect_and_report
    ) || exit_code=$?
    assert_exit_code "2.5 VM_BACKEND override exits 0" "0" "${exit_code}"
    assert_eq "2.5 VM_BACKEND override honored" "vmware" "${detected}"

    # Test 2.6: Unknown VM_BACKEND value handled by lifecycle
    exit_code=0
    output=$(VM_BACKEND=invalid bash "${VM_LIFECYCLE}" list --dry-run 2>&1) || exit_code=$?
    assert_exit_code "2.6 Invalid backend exits 3" "3" "${exit_code}"
    assert_contains "2.6 Error mentions invalid backend" "Invalid backend" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 3: Idempotent operation contracts (8+ assertions)
# ---------------------------------------------------------------------------

test_idempotent_operations() {
    printf "\n--- Group 3: Idempotent Operation Contracts (dry-run) ---\n"
    setup

    # Test 3.1: create --dry-run logs "Would create"
    local exit_code=0 output
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" create --name test-vm --ram-mb 2048 --vcpus 2 --disk-gb 20 --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.1 Dry-run create exits 0" "0" "${exit_code}"
    assert_contains "3.1 Dry-run create logs 'Would create'" "Would create" "${output}"

    # Test 3.2: start --dry-run logs "Would start"
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" start --name test-vm --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.2 Dry-run start exits 0" "0" "${exit_code}"
    assert_contains "3.2 Dry-run start logs 'Would start'" "Would start" "${output}"

    # Test 3.3: stop --dry-run logs "Would stop"
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" stop --name test-vm --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.3 Dry-run stop exits 0" "0" "${exit_code}"
    assert_contains "3.3 Dry-run stop logs 'Would stop'" "Would stop" "${output}"

    # Test 3.4: snapshot --dry-run logs "Would snapshot"
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" snapshot --name test-vm --snapshot golden-v1 --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.4 Dry-run snapshot exits 0" "0" "${exit_code}"
    assert_contains "3.4 Dry-run snapshot logs 'Would snapshot'" "Would snapshot" "${output}"

    # Test 3.5: clone --dry-run logs "Would clone"
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" clone --name test-clone --source test-vm --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.5 Dry-run clone exits 0" "0" "${exit_code}"
    assert_contains "3.5 Dry-run clone logs 'Would clone'" "Would clone" "${output}"

    # Test 3.6: destroy --dry-run --force logs appropriately
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" destroy --name test-vm --force --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.6 Dry-run destroy exits 0" "0" "${exit_code}"
    # The idempotent check finds the VM doesn't exist, so it logs "does not exist"
    assert_contains "3.6 Dry-run destroy logs idempotent message" "does not exist" "${output}"

    # Test 3.7: each --dry-run operation exits 0 (aggregated check)
    # Already verified above individually, but let's verify status and list too
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" status --name test-vm --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.7 Dry-run status exits 0" "0" "${exit_code}"

    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" list --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.8 Dry-run list exits 0" "0" "${exit_code}"

    # Test 3.9: --dry-run with missing params still validates and fails
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${VM_LIFECYCLE}" create --name test-vm --ram-mb 100 --vcpus 2 --disk-gb 20 --dry-run 2>&1) || exit_code=$?
    assert_exit_code "3.9 Dry-run with invalid RAM exits 1" "1" "${exit_code}"
    assert_contains "3.9 Reports validation error" "512" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 4: Provisioning orchestrator (6+ assertions)
# ---------------------------------------------------------------------------

test_provisioning_orchestrator() {
    printf "\n--- Group 4: Provisioning Orchestrator ---\n"
    setup

    # Test 4.1: provision-vm.sh --help exits 0
    local exit_code=0 output
    output=$(bash "${PROVISION_VM}" --help 2>&1) || exit_code=$?
    assert_exit_code "4.1 --help exits 0" "0" "${exit_code}"
    assert_contains "4.1 Help shows modes" "fresh" "${output}"

    # Test 4.2: provision-vm.sh without --mode exits with error
    exit_code=0
    output=$(bash "${PROVISION_VM}" 2>&1) || exit_code=$?
    assert_exit_code "4.2 No --mode exits 1" "1" "${exit_code}"
    assert_contains "4.2 Error mentions --mode" "--mode" "${output}"

    # Test 4.3: provision-vm.sh --mode invalid exits with error
    exit_code=0
    output=$(bash "${PROVISION_VM}" --mode invalid --name test 2>&1) || exit_code=$?
    assert_exit_code "4.3 Invalid mode exits 2" "2" "${exit_code}"
    assert_contains "4.3 Error mentions invalid" "Invalid mode" "${output}"

    # Test 4.4: provision-vm.sh --dry-run --mode fresh --name test logs all steps
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${PROVISION_VM}" --dry-run --mode fresh --name test-vm 2>&1) || exit_code=$?
    assert_exit_code "4.4 Dry-run fresh exits 0" "0" "${exit_code}"
    assert_contains "4.4 Fresh mode shows Step 1" "Step 1" "${output}"
    assert_contains "4.4 Fresh mode shows Create VM" "Create VM" "${output}"

    # Test 4.5: provision-vm.sh --dry-run --mode clone logs clone steps
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${PROVISION_VM}" --dry-run --mode clone --name test-clone --source test-vm 2>&1) || exit_code=$?
    assert_exit_code "4.5 Dry-run clone exits 0" "0" "${exit_code}"
    assert_contains "4.5 Clone mode shows source" "test-vm" "${output}"
    assert_contains "4.5 Clone mode shows Clone from" "Clone from" "${output}"

    # Test 4.6: provision-vm.sh --dry-run --mode destroy logs destroy steps
    exit_code=0
    output=$(VM_BACKEND=kvm bash "${PROVISION_VM}" --dry-run --mode destroy --name test-vm 2>&1) || exit_code=$?
    assert_exit_code "4.6 Dry-run destroy exits 0" "0" "${exit_code}"
    assert_contains "4.6 Destroy mode shows Destroy" "Destroy" "${output}"

    # Test 4.7: Clone without --source exits with error
    exit_code=0
    output=$(bash "${PROVISION_VM}" --mode clone --name test 2>&1) || exit_code=$?
    assert_exit_code "4.7 Clone without source exits 2" "2" "${exit_code}"
    assert_contains "4.7 Error mentions --source" "--source" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 5: Local-values loading (4+ assertions)
# ---------------------------------------------------------------------------

test_local_values_loading() {
    printf "\n--- Group 5: Local-Values Loading ---\n"
    setup

    # Source common library
    source "${VM_COMMON}"

    # Create a valid local-values file
    cat > "${TEMP_DIR}/valid-values.yaml" <<'YAML'
vm_name: test-server
vm_ram_mb: 4096
vm_vcpus: 4
vm_disk_gb: 50
vm_network: virbr0
vm_os_variant: centos-stream9
YAML

    # Note: vm_load_values sets global variables, so we must NOT call it
    # inside $() subshells. Instead, redirect stderr to a temp file.
    local exit_code=0 output

    # Point _VM_LIB_DIR to an isolated temp path (no resource-budget.yaml fallback)
    # to prevent accidental budget loading from the real project directory
    local _saved_lib_dir="${_VM_LIB_DIR}"
    mkdir -p "${TEMP_DIR}/isolated/lib"
    _VM_LIB_DIR="${TEMP_DIR}/isolated/lib"

    # Test 5.1: Valid local-values file parsed correctly
    VM_NAME="" VM_RAM_MB="" VM_VCPUS="" VM_DISK_GB=""
    exit_code=0
    vm_load_values "${TEMP_DIR}/valid-values.yaml" 2>"${TEMP_DIR}/5.1.err" || exit_code=$?
    output=$(<"${TEMP_DIR}/5.1.err")
    assert_exit_code "5.1 Valid values exits 0" "0" "${exit_code}"
    assert_eq "5.1 VM_NAME loaded" "test-server" "${VM_NAME}"
    assert_eq "5.1 VM_RAM_MB loaded" "4096" "${VM_RAM_MB}"
    assert_eq "5.1 VM_VCPUS loaded" "4" "${VM_VCPUS}"

    # Test 5.2: Missing local-values file reports error
    # vm_die calls exit, so we must run in subshell for this one
    exit_code=0
    output=$(vm_load_values "${TEMP_DIR}/nonexistent.yaml" 2>&1) || exit_code=$?
    assert_exit_code "5.2 Missing file exits 1" "1" "${exit_code}"
    assert_contains "5.2 Error mentions not found" "not found" "${output}"

    # Test 5.3: Partial values file (missing required keys) loads what's available
    cat > "${TEMP_DIR}/partial-values.yaml" <<'YAML'
vm_name: partial-vm
vm_ram_mb: 2048
YAML
    VM_NAME="" VM_RAM_MB="" VM_VCPUS="" VM_DISK_GB=""
    exit_code=0
    vm_load_values "${TEMP_DIR}/partial-values.yaml" 2>"${TEMP_DIR}/5.3.err" || exit_code=$?
    assert_exit_code "5.3 Partial values exits 0" "0" "${exit_code}"
    assert_eq "5.3 VM_NAME loaded from partial" "partial-vm" "${VM_NAME}"
    assert_eq "5.3 VM_RAM_MB loaded from partial" "2048" "${VM_RAM_MB}"
    # VM_VCPUS should still be empty (not in file, no budget fallback in temp)
    assert_eq "5.3 VM_VCPUS still empty" "" "${VM_VCPUS:-}"

    # Test 5.4: Values override resource-budget defaults
    # Create a fake resource-budget.yaml in the expected location
    local budget_dir="${TEMP_DIR}/infra/local"
    mkdir -p "${budget_dir}"
    cat > "${budget_dir}/resource-budget.yaml" <<'YAML'
minecraft_vm:
  ram_gb: 8
  cores: 4
  storage_gb: 50
YAML
    # Create partial values that don't set sizing
    cat > "${TEMP_DIR}/name-only.yaml" <<'YAML'
vm_name: override-test
YAML
    # Point _VM_LIB_DIR so it finds the budget file
    VM_NAME="" VM_RAM_MB="" VM_VCPUS="" VM_DISK_GB=""
    _VM_LIB_DIR="${TEMP_DIR}/infra/scripts/lib"
    mkdir -p "${_VM_LIB_DIR}"
    exit_code=0
    vm_load_values "${TEMP_DIR}/name-only.yaml" 2>"${TEMP_DIR}/5.4.err" || exit_code=$?
    assert_exit_code "5.4 Values with budget fallback exits 0" "0" "${exit_code}"
    assert_eq "5.4 VM_NAME from values file" "override-test" "${VM_NAME}"
    # RAM should be set from resource-budget.yaml (8GB = 8192 MB)
    assert_eq "5.4 VM_RAM_MB from budget fallback" "8192" "${VM_RAM_MB}"

    teardown
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== VM Lifecycle & Provisioning Test Suite ===\n"
    printf "Scripts:\n"
    printf "  vm-lifecycle.sh: %s\n" "${VM_LIFECYCLE}"
    printf "  provision-vm.sh: %s\n" "${PROVISION_VM}"
    printf "  vm-common.sh:    %s\n" "${VM_COMMON}"
    printf "Fixtures: %s\n" "${FIXTURES_DIR}"

    test_param_validation
    test_backend_detection
    test_idempotent_operations
    test_provisioning_orchestrator
    test_local_values_loading

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

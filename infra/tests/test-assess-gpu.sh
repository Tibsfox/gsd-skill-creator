#!/usr/bin/env bash
# test-assess-gpu.sh -- Test suite for GPU capability assessment module
#
# Tests assess-gpu.sh against fixture hardware capabilities to verify:
#   - NVIDIA GPUs get advanced compute, proprietary driver, vulkan display
#   - AMD GPUs get standard compute, opensource driver, vulkan display
#   - No-GPU systems get none/false classifications across the board
#   - IOMMU passthrough requires iommu + discrete GPU + KVM
#   - VRAM tiers are correctly classified
#
# Usage: bash infra/tests/test-assess-gpu.sh

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
ASSESSOR="${SCRIPT_DIR}/../scripts/assess-gpu.sh"
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
        printf "  FAIL: %s ('%s' not found in output)\n" "${desc}" "${needle}"
    fi
}

# Extract a YAML value from assessment output
# Usage: assess_val "key" "file"
assess_val() {
    local key="$1"
    local file="$2"
    grep -E "^[[:space:]]*${key}:" "${file}" 2>/dev/null \
        | head -1 \
        | sed -E 's/^[^:]+:[[:space:]]*//' \
        | sed 's/[[:space:]]*#.*//' \
        | sed 's/^"//' \
        | sed 's/"$//'
}

# ---------------------------------------------------------------------------
# Test: NVIDIA 64GB workstation
# ---------------------------------------------------------------------------

test_nvidia_64gb() {
    printf "\n--- Test: NVIDIA 64GB Workstation ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-64gb-nvidia.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "NVIDIA: exit code 0" "0" "${exit_code}"

    # Save output for field extraction
    echo "${output}" > "${TEMP_DIR}/gpu-assessment.yaml"

    # Core classifications
    assert_eq "NVIDIA: compute_capable = true" "true" "$(assess_val "compute_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NVIDIA: compute_level = advanced" "advanced" "$(assess_val "compute_level" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NVIDIA: rendering_capable = true" "true" "$(assess_val "rendering_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NVIDIA: rendering_backend = nvidia" "nvidia" "$(assess_val "rendering_backend" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Passthrough (IOMMU + discrete GPU + KVM = viable)
    assert_eq "NVIDIA: passthrough_viable = true" "true" "$(assess_val "passthrough_viable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NVIDIA: passthrough_method = vfio" "vfio" "$(assess_val "passthrough_method" "${TEMP_DIR}/gpu-assessment.yaml")"

    # VRAM tier (12GB = high)
    assert_eq "NVIDIA: vram_tier = high" "high" "$(assess_val "vram_tier" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Driver status
    assert_eq "NVIDIA: driver_status = proprietary" "proprietary" "$(assess_val "driver_status" "${TEMP_DIR}/gpu-assessment.yaml")"

    # UAE display backend
    assert_eq "NVIDIA: uae_display = vulkan" "vulkan" "$(assess_val "uae_display" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Verify output structure has the section header
    assert_contains "NVIDIA: output has gpu_assessment section" "gpu_assessment:" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: AMD 32GB desktop
# ---------------------------------------------------------------------------

test_amd_32gb() {
    printf "\n--- Test: AMD 32GB Desktop ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-32gb-amd.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "AMD: exit code 0" "0" "${exit_code}"

    echo "${output}" > "${TEMP_DIR}/gpu-assessment.yaml"

    # Core classifications
    assert_eq "AMD: compute_capable = true" "true" "$(assess_val "compute_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "AMD: compute_level = standard" "standard" "$(assess_val "compute_level" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "AMD: rendering_capable = true" "true" "$(assess_val "rendering_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "AMD: rendering_backend = amdgpu" "amdgpu" "$(assess_val "rendering_backend" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Passthrough (IOMMU + discrete AMD + KVM = viable)
    assert_eq "AMD: passthrough_viable = true" "true" "$(assess_val "passthrough_viable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "AMD: passthrough_method = vfio" "vfio" "$(assess_val "passthrough_method" "${TEMP_DIR}/gpu-assessment.yaml")"

    # VRAM tier (12GB = high)
    assert_eq "AMD: vram_tier = high" "high" "$(assess_val "vram_tier" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Driver status
    assert_eq "AMD: driver_status = opensource" "opensource" "$(assess_val "driver_status" "${TEMP_DIR}/gpu-assessment.yaml")"

    # UAE display backend
    assert_eq "AMD: uae_display = vulkan" "vulkan" "$(assess_val "uae_display" "${TEMP_DIR}/gpu-assessment.yaml")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: No GPU 16GB laptop
# ---------------------------------------------------------------------------

test_nogpu_16gb() {
    printf "\n--- Test: No GPU 16GB Laptop ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-16gb-nogpu.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "NoGPU: exit code 0" "0" "${exit_code}"

    echo "${output}" > "${TEMP_DIR}/gpu-assessment.yaml"

    # All classifications should be none/false
    assert_eq "NoGPU: compute_capable = false" "false" "$(assess_val "compute_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NoGPU: compute_level = none" "none" "$(assess_val "compute_level" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NoGPU: rendering_capable = false" "false" "$(assess_val "rendering_capable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NoGPU: rendering_backend = none" "none" "$(assess_val "rendering_backend" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Passthrough not viable (no discrete GPU, no IOMMU)
    assert_eq "NoGPU: passthrough_viable = false" "false" "$(assess_val "passthrough_viable" "${TEMP_DIR}/gpu-assessment.yaml")"
    assert_eq "NoGPU: passthrough_method = none" "none" "$(assess_val "passthrough_method" "${TEMP_DIR}/gpu-assessment.yaml")"

    # VRAM tier (0 = none)
    assert_eq "NoGPU: vram_tier = none" "none" "$(assess_val "vram_tier" "${TEMP_DIR}/gpu-assessment.yaml")"

    # Driver status
    assert_eq "NoGPU: driver_status = none" "none" "$(assess_val "driver_status" "${TEMP_DIR}/gpu-assessment.yaml")"

    # UAE display backend (software for no GPU)
    assert_eq "NoGPU: uae_display = software" "software" "$(assess_val "uae_display" "${TEMP_DIR}/gpu-assessment.yaml")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: All output fields present
# ---------------------------------------------------------------------------

test_output_fields() {
    printf "\n--- Test: Output Field Completeness ---\n"
    setup

    local output
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-64gb-nvidia.yaml" 2>/dev/null)"

    assert_contains "Fields: has compute_capable" "compute_capable:" "${output}"
    assert_contains "Fields: has compute_level" "compute_level:" "${output}"
    assert_contains "Fields: has rendering_capable" "rendering_capable:" "${output}"
    assert_contains "Fields: has rendering_backend" "rendering_backend:" "${output}"
    assert_contains "Fields: has passthrough_viable" "passthrough_viable:" "${output}"
    assert_contains "Fields: has passthrough_method" "passthrough_method:" "${output}"
    assert_contains "Fields: has vram_tier" "vram_tier:" "${output}"
    assert_contains "Fields: has driver_status" "driver_status:" "${output}"
    assert_contains "Fields: has uae_display" "uae_display:" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== GPU Capability Assessment Tests ===\n"
    printf "Assessor: %s\n" "${ASSESSOR}"
    printf "Fixtures: %s\n\n" "${FIXTURES_DIR}"

    test_nvidia_64gb
    test_amd_32gb
    test_nogpu_16gb
    test_output_fields

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

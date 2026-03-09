#!/usr/bin/env bash
# shellcheck disable=SC2034 # test variables used for assertion context
# test-distro-abstraction.sh -- Integration test for Phase 179 distro abstraction layer
#
# Validates all three Phase 179 library files work together correctly:
#   - pkg-names.sh      (package name mapping)
#   - pkg-abstraction.sh (package manager abstraction)
#   - fw-abstraction.sh  (firewall abstraction)
#
# Runs WITHOUT sudo -- uses mock-based or non-privileged checks where needed.
# CI-friendly: exit 0 if all pass, exit 1 if any fail.
#
# Usage: bash infra/tests/test-distro-abstraction.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../scripts/lib"

# Assert two values are equal
# Usage: assert_eq "description" "expected" "actual"
assert_eq() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected '${expected}', got '${actual}'")
        printf "  [FAIL] %s -> got \"%s\" expected \"%s\"\n" "${desc}" "${actual}" "${expected}"
    fi
}

# Assert exit code is 0
# Usage: assert_ok "description" exit_code
assert_ok() {
    local desc="$1"
    local code="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${code}" -eq 0 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected exit 0, got ${code}")
        printf "  [FAIL] %s (expected exit 0, got %s)\n" "${desc}" "${code}"
    fi
}

# Assert exit code is non-zero
# Usage: assert_fail "description" exit_code
assert_fail() {
    local desc="$1"
    local code="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${code}" -ne 0 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected non-zero exit, got 0")
        printf "  [FAIL] %s (expected non-zero exit, got 0)\n" "${desc}"
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
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  [FAIL] %s ('%s' not found in output)\n" "${desc}" "${needle}"
    fi
}

# Assert numeric comparison: actual >= expected
# Usage: assert_gte "description" min_value actual_value
assert_gte() {
    local desc="$1"
    local min_val="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${actual}" -ge "${min_val}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s (%s >= %s)\n" "${desc}" "${actual}" "${min_val}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: got ${actual}, need >= ${min_val}")
        printf "  [FAIL] %s (got %s, need >= %s)\n" "${desc}" "${actual}" "${min_val}"
    fi
}

# ---------------------------------------------------------------------------
# Source libraries
# ---------------------------------------------------------------------------

printf "=== Distribution Abstraction Layer Tests ===\n\n"
printf "Library directory: %s\n\n" "${LIB_DIR}"

# Source all Phase 179 libraries (order matters: discovery-common -> pkg-names -> pkg-abstraction -> fw-abstraction)
# Each library sources its own dependencies, but we verify they're all loadable
source "${LIB_DIR}/pkg-abstraction.sh" 2>/dev/null
source "${LIB_DIR}/fw-abstraction.sh" 2>/dev/null

# ---------------------------------------------------------------------------
# Test: pkg-names.sh -- Package name resolution
# ---------------------------------------------------------------------------

printf "\n--- pkg-names.sh: Package Name Resolution ---\n"

# Test 1: java-21-jdk on dnf
result="$(resolve_pkg_name "java-21-jdk" "dnf")"
assert_eq "resolve_pkg_name java-21-jdk dnf -> java-21-openjdk" "java-21-openjdk" "${result}"

# Test 2: java-21-jdk on apt
result="$(resolve_pkg_name "java-21-jdk" "apt")"
assert_eq "resolve_pkg_name java-21-jdk apt -> openjdk-21-jdk" "openjdk-21-jdk" "${result}"

# Test 3: java-21-jdk on pacman
result="$(resolve_pkg_name "java-21-jdk" "pacman")"
assert_eq "resolve_pkg_name java-21-jdk pacman -> jdk21-openjdk" "jdk21-openjdk" "${result}"

# Test 4: curl on dnf (passthrough -- no mapping needed)
result="$(resolve_pkg_name "curl" "dnf")"
assert_eq "resolve_pkg_name curl dnf -> curl (passthrough)" "curl" "${result}"

# Test 5: nonexistent-pkg on apt (fallback -- no mapping, returns as-is)
result="$(resolve_pkg_name "nonexistent-pkg" "apt")"
assert_eq "resolve_pkg_name nonexistent-pkg apt -> nonexistent-pkg (fallback)" "nonexistent-pkg" "${result}"

# Test 6: python3 on pacman
result="$(resolve_pkg_name "python3" "pacman")"
assert_eq "resolve_pkg_name python3 pacman -> python" "python" "${result}"

# Test 7: qemu-kvm on apt
result="$(resolve_pkg_name "qemu-kvm" "apt")"
assert_eq "resolve_pkg_name qemu-kvm apt -> qemu-system-x86" "qemu-system-x86" "${result}"

# Test 8: libvirt on apt
result="$(resolve_pkg_name "libvirt" "apt")"
assert_eq "resolve_pkg_name libvirt apt -> libvirt-daemon-system" "libvirt-daemon-system" "${result}"

# Test 9: list_known_packages has at least 7 entries (currently 8 defined in pkg-names.sh)
pkg_count="$(list_known_packages | wc -l)"
assert_gte "list_known_packages has >= 7 entries" 7 "${pkg_count}"

# ---------------------------------------------------------------------------
# Test: pkg-abstraction.sh -- Package manager detection
# ---------------------------------------------------------------------------

printf "\n--- pkg-abstraction.sh: Package Manager Detection ---\n"

# Test 10: pkg_detect_backend returns 0 and sets _PKG_BACKEND
_PKG_BACKEND=""
exit_code=0
pkg_detect_backend 2>/dev/null || exit_code=$?
assert_ok "pkg_detect_backend returns 0" "${exit_code}"

# Test 11: _PKG_BACKEND is non-empty after detection
TESTS_RUN=$(( TESTS_RUN + 1 ))
if [[ -n "${_PKG_BACKEND}" ]]; then
    TESTS_PASSED=$(( TESTS_PASSED + 1 ))
    printf "  [PASS] _PKG_BACKEND is non-empty ('%s')\n" "${_PKG_BACKEND}"
else
    TESTS_FAILED=$(( TESTS_FAILED + 1 ))
    FAILURES+=("_PKG_BACKEND is empty after pkg_detect_backend")
    printf "  [FAIL] _PKG_BACKEND is empty after detection\n"
fi

# Test 12: pkg_installed "bash" returns 0 (bash is always installed)
exit_code=0
pkg_installed "bash" 2>/dev/null || exit_code=$?
assert_ok "pkg_installed bash returns 0 (bash is always installed)" "${exit_code}"

# Test 13: unsupported backend produces error on pkg_install
exit_code=0
output="$(PKG_BACKEND=unsupported bash -c '
    source '"${LIB_DIR}"'/pkg-abstraction.sh 2>/dev/null
    pkg_detect_backend 2>&1 || true
    pkg_install curl 2>&1
' 2>&1)" || exit_code=$?
assert_fail "unsupported backend rejects pkg_install" "${exit_code}"

# ---------------------------------------------------------------------------
# Test: fw-abstraction.sh -- Firewall detection and validation
# ---------------------------------------------------------------------------

printf "\n--- fw-abstraction.sh: Firewall Detection ---\n"

# Test 14: fw_detect_backend returns 0 and sets _FW_BACKEND
_FW_BACKEND=""
exit_code=0
fw_detect_backend 2>/dev/null || exit_code=$?
assert_ok "fw_detect_backend returns 0" "${exit_code}"

# Test 15: _FW_BACKEND is one of the valid values
TESTS_RUN=$(( TESTS_RUN + 1 ))
case "${_FW_BACKEND}" in
    firewalld|ufw|iptables|nftables|none)
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] _FW_BACKEND is valid ('%s')\n" "${_FW_BACKEND}"
        ;;
    *)
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("_FW_BACKEND has unexpected value: '${_FW_BACKEND}'")
        printf "  [FAIL] _FW_BACKEND has unexpected value '%s' (expected: firewalld, ufw, iptables, nftables, none)\n" "${_FW_BACKEND}"
        ;;
esac

printf "\n--- fw-abstraction.sh: Input Validation ---\n"

# Test 16: fw_open_port 0 tcp returns non-zero (invalid port)
exit_code=0
fw_open_port 0 tcp 2>/dev/null || exit_code=$?
assert_fail "fw_open_port 0 tcp rejects invalid port" "${exit_code}"

# Test 17: fw_open_port 70000 tcp returns non-zero (invalid port)
exit_code=0
fw_open_port 70000 tcp 2>/dev/null || exit_code=$?
assert_fail "fw_open_port 70000 tcp rejects invalid port" "${exit_code}"

# Test 18: fw_open_port 80 ftp returns non-zero (invalid protocol)
exit_code=0
fw_open_port 80 ftp 2>/dev/null || exit_code=$?
assert_fail "fw_open_port 80 ftp rejects invalid protocol" "${exit_code}"

# Test 19: fw_open_port 80 tcp succeeds with valid input
exit_code=0
fw_open_port 80 tcp 2>/dev/null || exit_code=$?
assert_ok "fw_open_port 80 tcp succeeds with valid input" "${exit_code}"

# Test 20: fw_status returns 0 and prints output
exit_code=0
status_output="$(fw_status 2>/dev/null)" || exit_code=$?
assert_ok "fw_status returns 0" "${exit_code}"
assert_contains "fw_status prints backend" "backend:" "${status_output}"

# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

printf "\n=== Results: %s/%s passed ===\n" "${TESTS_PASSED}" "${TESTS_RUN}"

if [[ ${TESTS_FAILED} -gt 0 ]]; then
    printf "\nFailures:\n"
    for failure in "${FAILURES[@]}"; do
        printf "  - %s\n" "${failure}"
    done
    exit 1
fi

printf "\nAll tests passed.\n"
exit 0

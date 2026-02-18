#!/usr/bin/env bash
# test-install-fs-uae.sh -- Test suite for Phase 182 FS-UAE installation and AROS setup
#
# Validates:
#   - Package name mappings for fs-uae dependencies (6 assertions)
#   - Install script structure and capabilities (5 assertions)
#   - AROS setup script structure and capabilities (5 assertions)
#   - Base UAE configuration correctness (4 assertions)
#
# Runs WITHOUT sudo -- uses structural checks, not actual installation.
# CI-friendly: exit 0 if all pass, exit 1 if any fail.
#
# Usage: bash infra/tests/test-install-fs-uae.sh

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
SCRIPTS_DIR="${SCRIPT_DIR}/../scripts"
CONFIG_DIR="${SCRIPT_DIR}/../config"

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

# Assert a file contains a pattern (grep -q)
# Usage: assert_grep "description" "pattern" "file"
assert_grep() {
    local desc="$1"
    local pattern="$2"
    local file="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if grep -qE "${pattern}" "${file}" 2>/dev/null; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: pattern '${pattern}' not found in ${file}")
        printf "  [FAIL] %s (pattern '%s' not found)\n" "${desc}" "${pattern}"
    fi
}

# Assert a file exists
# Usage: assert_file_exists "description" "file"
assert_file_exists() {
    local desc="$1"
    local file="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${file}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  [PASS] %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file not found: ${file}")
        printf "  [FAIL] %s (file not found: %s)\n" "${desc}" "${file}"
    fi
}

# ---------------------------------------------------------------------------
# Source pkg-names.sh for mapping tests
# ---------------------------------------------------------------------------

printf "=== Phase 182 FS-UAE Installation Tests ===\n\n"

source "${LIB_DIR}/discovery-common.sh" 2>/dev/null
source "${LIB_DIR}/pkg-names.sh" 2>/dev/null

# ===========================================================================
# Test Group 1: Package mapping tests (6 assertions)
# ===========================================================================

printf "%s\n" "--- Package Name Mappings ---"

# Test 1: fs-uae on apt returns fs-uae
result="$(resolve_pkg_name "fs-uae" "apt")"
assert_eq "resolve_pkg_name fs-uae apt -> fs-uae" "fs-uae" "${result}"

# Test 2: fs-uae on pacman returns fs-uae
result="$(resolve_pkg_name "fs-uae" "pacman")"
assert_eq "resolve_pkg_name fs-uae pacman -> fs-uae" "fs-uae" "${result}"

# Test 3: fs-uae on dnf returns empty/fails (not in repos)
exit_code=0
result="$(resolve_pkg_name "fs-uae" "dnf" 2>/dev/null)" || exit_code=$?
assert_fail "resolve_pkg_name fs-uae dnf fails (not in repos)" "${exit_code}"

# Test 4: flatpak on dnf returns flatpak
result="$(resolve_pkg_name "flatpak" "dnf")"
assert_eq "resolve_pkg_name flatpak dnf -> flatpak" "flatpak" "${result}"

# Test 5: SDL2 on apt returns libsdl2-2.0-0
result="$(resolve_pkg_name "SDL2" "apt")"
assert_eq "resolve_pkg_name SDL2 apt -> libsdl2-2.0-0" "libsdl2-2.0-0" "${result}"

# Test 6: openal-soft on pacman returns openal
result="$(resolve_pkg_name "openal-soft" "pacman")"
assert_eq "resolve_pkg_name openal-soft pacman -> openal" "openal" "${result}"

# ===========================================================================
# Test Group 2: Install script structure tests (5 assertions)
# ===========================================================================

printf "\n--- Install Script Structure ---\n"

INSTALL_SCRIPT="${SCRIPTS_DIR}/install-fs-uae.sh"

# Test 7: File exists with proper shebang
assert_file_exists "install-fs-uae.sh exists" "${INSTALL_SCRIPT}"

# Test 8: Syntax check passes
exit_code=0
bash -n "${INSTALL_SCRIPT}" 2>/dev/null || exit_code=$?
assert_ok "install-fs-uae.sh syntax check passes" "${exit_code}"

# Test 9: Script sources pkg-abstraction.sh
assert_grep "install-fs-uae.sh sources pkg-abstraction.sh" "source.*pkg-abstraction" "${INSTALL_SCRIPT}"

# Test 10: Script has --dry-run flag handling
assert_grep "install-fs-uae.sh has dry-run handling" "(dry.run|DRY_RUN)" "${INSTALL_SCRIPT}"

# Test 11: Script has Flatpak fallback logic
assert_grep "install-fs-uae.sh has Flatpak fallback" "flatpak" "${INSTALL_SCRIPT}"

# ===========================================================================
# Test Group 3: AROS setup script structure tests (5 assertions)
# ===========================================================================

printf "\n--- AROS Setup Script Structure ---\n"

AROS_SCRIPT="${SCRIPTS_DIR}/setup-aros-rom.sh"

# Test 12: File exists with proper shebang
assert_file_exists "setup-aros-rom.sh exists" "${AROS_SCRIPT}"

# Test 13: Syntax check passes
exit_code=0
bash -n "${AROS_SCRIPT}" 2>/dev/null || exit_code=$?
assert_ok "setup-aros-rom.sh syntax check passes" "${exit_code}"

# Test 14: Script has idempotent ROM check (skip if already exists)
assert_grep "setup-aros-rom.sh has idempotent ROM check" "(already exists|Skipping download|Skip)" "${AROS_SCRIPT}"

# Test 15: Script has configurable URL variable
assert_grep "setup-aros-rom.sh has configurable URL" "AROS_ROM_URL" "${AROS_SCRIPT}"

# Test 16: Script creates expected directory structure
assert_grep "setup-aros-rom.sh creates directories" "mkdir -p" "${AROS_SCRIPT}"

# ===========================================================================
# Test Group 4: Base config tests (4 assertions)
# ===========================================================================

printf "\n--- Base UAE Configuration ---\n"

CONFIG_FILE="${CONFIG_DIR}/uae/base.fs-uae"

# Test 17: Config file exists
assert_file_exists "base.fs-uae config exists" "${CONFIG_FILE}"

# Test 18: Contains A1200 model
assert_grep "base.fs-uae has amiga_model = A1200" "amiga_model = A1200" "${CONFIG_FILE}"

# Test 19: Contains kickstart_rom_file pointing to AROS ROM
assert_grep "base.fs-uae has kickstart_rom_file for AROS" "kickstart_rom_file.*aros" "${CONFIG_FILE}"

# Test 20: Contains chip_memory setting
assert_grep "base.fs-uae has chip_memory setting" "chip_memory" "${CONFIG_FILE}"

# ===========================================================================
# Results
# ===========================================================================

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

#!/usr/bin/env bash
# shellcheck disable=SC2034 # BACKUP_SCRIPT reserved for future use
# test-restore-world.sh -- Test suite for restore-world.sh
#
# Tests the Minecraft world restore script with mock data:
#   - Argument parsing (--help, missing backup file, missing --force)
#   - Integrity verification (valid backup, corrupted backup, checksum)
#   - Restore correctness (world replaced, level.dat present, originals gone)
#   - Permission fix (mode bits on restored files)
#   - Safety backup (pre-restore backup creation)
#   - Dry-run mode (output but no filesystem changes)
#   - Edge cases (fresh VM with no existing world, checksum mismatch)
#
# All tests use --no-service to avoid needing systemd.
#
# Usage: bash infra/tests/test-restore-world.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESTORE_SCRIPT="${SCRIPT_DIR}/../scripts/restore-world.sh"
BACKUP_SCRIPT="${SCRIPT_DIR}/../scripts/backup-world.sh"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"

    # Create a source world directory with known files
    mkdir -p "${TEMP_DIR}/source-world/region"
    echo "ORIGINAL_LEVEL_DATA" > "${TEMP_DIR}/source-world/level.dat"
    echo "ORIGINAL_SESSION" > "${TEMP_DIR}/source-world/session.lock"
    dd if=/dev/urandom of="${TEMP_DIR}/source-world/region/r.0.0.mca" bs=1024 count=4 2>/dev/null

    # Create a valid backup archive from the source world
    mkdir -p "${TEMP_DIR}/backups"
    tar czf "${TEMP_DIR}/backups/test-backup.tar.gz" \
        -C "${TEMP_DIR}" "source-world" 2>/dev/null

    # Rename world dir inside archive: we need it to extract as "world"
    # Actually, let's create a proper archive with the right name
    mv "${TEMP_DIR}/source-world" "${TEMP_DIR}/world"
    tar czf "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        -C "${TEMP_DIR}" "world" 2>/dev/null

    # Create checksum sidecar
    (cd "${TEMP_DIR}/backups" && sha256sum "valid-backup.tar.gz" > "valid-backup.tar.gz.sha256")

    # Create a "current" world at the target location (to test overwrite)
    mkdir -p "${TEMP_DIR}/target/world/region"
    echo "CURRENT_LEVEL_DATA" > "${TEMP_DIR}/target/world/level.dat"
    echo "CURRENT_ONLY_FILE" > "${TEMP_DIR}/target/world/current-only.txt"

    # Restore the source-world name for other uses
    cp -r "${TEMP_DIR}/world" "${TEMP_DIR}/source-world"

    # Create minecraft home for safety backups
    mkdir -p "${TEMP_DIR}/mc-home/backups"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap teardown EXIT

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

assert_exit_code() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    assert_eq "${desc}" "${expected}" "${actual}"
}

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

assert_file_exists() {
    local desc="$1"
    local path="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${path}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file not found at ${path}")
        printf "  FAIL: %s (not found: %s)\n" "${desc}" "${path}"
    fi
}

assert_file_not_exists() {
    local desc="$1"
    local path="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ ! -f "${path}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file unexpectedly exists at ${path}")
        printf "  FAIL: %s (should not exist: %s)\n" "${desc}" "${path}"
    fi
}

assert_matches() {
    local desc="$1"
    local pattern="$2"
    local text="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${text}" | grep -qE "${pattern}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: pattern '${pattern}' not matched")
        printf "  FAIL: %s (pattern '%s' not matched)\n" "${desc}" "${pattern}"
    fi
}

# ---------------------------------------------------------------------------
# Test: --help exits 0
# ---------------------------------------------------------------------------

test_help_exit_code() {
    printf "\n--- Test: --help exits 0 ---\n"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" --help 2>&1) || exit_code=$?

    assert_exit_code "--help: exit code 0" "0" "${exit_code}"
    assert_contains "--help: shows usage" "Usage:" "${output}"
    assert_contains "--help: mentions --force" "--force" "${output}"
    assert_contains "--help: mentions backup-file" "backup-file" "${output}"
}

# ---------------------------------------------------------------------------
# Test: missing backup file exits 2
# ---------------------------------------------------------------------------

test_missing_backup_arg() {
    printf "\n--- Test: Missing Backup File Exits 2 ---\n"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" 2>&1) || exit_code=$?

    assert_exit_code "no args: exit code 2" "2" "${exit_code}"
    assert_contains "no args: error about no backup file" "No backup file" "${output}"
}

# ---------------------------------------------------------------------------
# Test: missing --force exits 1 with safety message
# ---------------------------------------------------------------------------

test_missing_force_flag() {
    printf "\n--- Test: Missing --force Exits 1 ---\n"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" /tmp/fake-backup.tar.gz 2>&1) || exit_code=$?

    assert_exit_code "no force: exit code 1" "1" "${exit_code}"
    assert_contains "no force: safety message" "destructive operation" "${output}"
    assert_contains "no force: mentions --force" "--force" "${output}"
}

# ---------------------------------------------------------------------------
# Test: valid backup passes integrity check
# ---------------------------------------------------------------------------

test_valid_backup_integrity() {
    printf "\n--- Test: Valid Backup Integrity ---\n"
    setup

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --no-backup-current \
        --world-dir "${TEMP_DIR}/target/world" 2>&1) || exit_code=$?

    assert_exit_code "valid backup: exit code 0" "0" "${exit_code}"
    assert_contains "valid backup: checksum verified" "Checksum verified" "${output}"
    assert_contains "valid backup: archive integrity" "Archive integrity verified" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: corrupted backup exits 3
# ---------------------------------------------------------------------------

test_corrupted_backup() {
    printf "\n--- Test: Corrupted Backup Exits 3 ---\n"
    setup

    # Create a corrupted backup (truncated)
    local corrupt="${TEMP_DIR}/backups/corrupt-backup.tar.gz"
    dd if=/dev/urandom of="${corrupt}" bs=512 count=2 2>/dev/null

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "${corrupt}" \
        --force \
        --no-service \
        --world-dir "${TEMP_DIR}/target/world" 2>&1) || exit_code=$?

    assert_exit_code "corrupted backup: exit code 3" "3" "${exit_code}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: checksum mismatch exits 3
# ---------------------------------------------------------------------------

test_checksum_mismatch() {
    printf "\n--- Test: Checksum Mismatch Exits 3 ---\n"
    setup

    # Create a backup with a mismatched checksum sidecar
    local backup="${TEMP_DIR}/backups/valid-backup.tar.gz"
    echo "0000000000000000000000000000000000000000000000000000000000000000  valid-backup.tar.gz" \
        > "${backup}.sha256"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "${backup}" \
        --force \
        --no-service \
        --world-dir "${TEMP_DIR}/target/world" 2>&1) || exit_code=$?

    assert_exit_code "checksum mismatch: exit code 3" "3" "${exit_code}"
    assert_contains "checksum mismatch: mentions verification failed" "Checksum verification failed" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: restore correctness (world replaced, level.dat present, originals gone)
# ---------------------------------------------------------------------------

test_restore_correctness() {
    printf "\n--- Test: Restore Correctness ---\n"
    setup

    # Verify current-only.txt exists BEFORE restore
    assert_file_exists "pre-restore: current-only.txt exists" "${TEMP_DIR}/target/world/current-only.txt"

    bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --no-backup-current \
        --world-dir "${TEMP_DIR}/target/world" >/dev/null 2>&1

    # level.dat should be from the backup (ORIGINAL_LEVEL_DATA)
    local level_content
    level_content=$(cat "${TEMP_DIR}/target/world/level.dat")
    assert_eq "restore: level.dat has backup content" "ORIGINAL_LEVEL_DATA" "${level_content}"

    # current-only.txt should be GONE (old world was removed)
    assert_file_not_exists "restore: current-only.txt removed" "${TEMP_DIR}/target/world/current-only.txt"

    # region data should exist
    assert_file_exists "restore: region/r.0.0.mca exists" "${TEMP_DIR}/target/world/region/r.0.0.mca"

    teardown
}

# ---------------------------------------------------------------------------
# Test: permission fix (mode bits)
# ---------------------------------------------------------------------------

test_permission_fix() {
    printf "\n--- Test: Permission Fix ---\n"
    setup

    bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --no-backup-current \
        --world-dir "${TEMP_DIR}/target/world" >/dev/null 2>&1

    # Check directory permissions (755)
    local dir_perms
    dir_perms=$(stat -c "%a" "${TEMP_DIR}/target/world")
    assert_eq "permissions: world dir is 755" "755" "${dir_perms}"

    # Check file permissions (644)
    local file_perms
    file_perms=$(stat -c "%a" "${TEMP_DIR}/target/world/level.dat")
    assert_eq "permissions: level.dat is 644" "644" "${file_perms}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: safety backup created
# ---------------------------------------------------------------------------

test_safety_backup() {
    printf "\n--- Test: Safety Backup ---\n"
    setup

    bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --minecraft-home "${TEMP_DIR}/mc-home" \
        --world-dir "${TEMP_DIR}/target/world" >/dev/null 2>&1

    # Check that a pre-restore backup was created
    local safety_count
    safety_count=$(find "${TEMP_DIR}/mc-home/backups" -name "pre-restore-*.tar.gz" -type f 2>/dev/null | wc -l)
    assert_eq "safety: pre-restore backup created" "1" "${safety_count}"

    # Verify the safety backup contains the old world data
    local safety_file
    safety_file=$(find "${TEMP_DIR}/mc-home/backups" -name "pre-restore-*.tar.gz" -type f | head -1)
    local safety_contents
    safety_contents=$(tar tzf "${safety_file}" 2>/dev/null)

    assert_contains "safety: contains level.dat" "level.dat" "${safety_contents}"
    assert_contains "safety: contains current-only.txt" "current-only.txt" "${safety_contents}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: --no-backup-current skips safety backup
# ---------------------------------------------------------------------------

test_no_backup_current() {
    printf "\n--- Test: --no-backup-current Skips Safety ---\n"
    setup

    bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --no-backup-current \
        --minecraft-home "${TEMP_DIR}/mc-home" \
        --world-dir "${TEMP_DIR}/target/world" >/dev/null 2>&1

    # No pre-restore backup should exist
    local safety_count
    safety_count=$(find "${TEMP_DIR}/mc-home/backups" -name "pre-restore-*.tar.gz" -type f 2>/dev/null | wc -l)
    assert_eq "no-backup-current: no safety backup" "0" "${safety_count}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: dry-run produces output but doesn't modify filesystem
# ---------------------------------------------------------------------------

test_dry_run() {
    printf "\n--- Test: Dry Run ---\n"
    setup

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --dry-run \
        --world-dir "${TEMP_DIR}/target/world" 2>&1) || exit_code=$?

    assert_exit_code "dry-run: exit code 0" "0" "${exit_code}"
    assert_contains "dry-run: shows DRY RUN" "DRY RUN" "${output}"

    # Current world should still exist unchanged
    assert_file_exists "dry-run: current world untouched" "${TEMP_DIR}/target/world/current-only.txt"

    local current_content
    current_content=$(cat "${TEMP_DIR}/target/world/level.dat")
    assert_eq "dry-run: level.dat unchanged" "CURRENT_LEVEL_DATA" "${current_content}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: fresh VM restore (no existing world)
# ---------------------------------------------------------------------------

test_fresh_vm_restore() {
    printf "\n--- Test: Fresh VM Restore ---\n"
    setup

    # Remove the target world to simulate a fresh VM
    rm -rf "${TEMP_DIR}/target/world"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "${TEMP_DIR}/backups/valid-backup.tar.gz" \
        --force \
        --no-service \
        --no-backup-current \
        --world-dir "${TEMP_DIR}/target/world" 2>&1) || exit_code=$?

    assert_exit_code "fresh VM: exit code 0" "0" "${exit_code}"
    assert_file_exists "fresh VM: level.dat created" "${TEMP_DIR}/target/world/level.dat"
    assert_file_exists "fresh VM: region data" "${TEMP_DIR}/target/world/region/r.0.0.mca"

    teardown
}

# ---------------------------------------------------------------------------
# Test: nonexistent backup file exits 1
# ---------------------------------------------------------------------------

test_nonexistent_backup() {
    printf "\n--- Test: Nonexistent Backup File ---\n"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" \
        "/nonexistent/backup.tar.gz" \
        --force \
        --no-service 2>&1) || exit_code=$?

    assert_exit_code "nonexistent: exit code 1" "1" "${exit_code}"
    assert_contains "nonexistent: error message" "not found" "${output}"
}

# ---------------------------------------------------------------------------
# Test: unknown flag exits 2
# ---------------------------------------------------------------------------

test_unknown_flag() {
    printf "\n--- Test: Unknown Flag Exits 2 ---\n"

    local exit_code=0
    local output
    output=$(bash "${RESTORE_SCRIPT}" backup.tar.gz --bogus 2>&1) || exit_code=$?

    assert_exit_code "unknown flag: exit code 2" "2" "${exit_code}"
    assert_contains "unknown flag: error message" "Unknown option" "${output}"
}

# ---------------------------------------------------------------------------
# Test: sources rcon-common.sh
# ---------------------------------------------------------------------------

test_sources_rcon_common() {
    printf "\n--- Test: Sources rcon-common.sh ---\n"

    local script_content
    script_content=$(cat "${RESTORE_SCRIPT}")

    assert_matches "sources rcon-common" "source.*rcon-common" "${script_content}"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== Restore World Script Tests ===\n"
    printf "Script: %s\n\n" "${RESTORE_SCRIPT}"

    test_help_exit_code
    test_missing_backup_arg
    test_missing_force_flag
    test_valid_backup_integrity
    test_corrupted_backup
    test_checksum_mismatch
    test_restore_correctness
    test_permission_fix
    test_safety_backup
    test_no_backup_current
    test_dry_run
    test_fresh_vm_restore
    test_nonexistent_backup
    test_unknown_flag
    test_sources_rcon_common

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

#!/usr/bin/env bash
# test-backup-world.sh -- Test suite for backup-world.sh
#
# Tests the Minecraft world backup script with mock world data:
#   - Argument parsing (--help, unknown flags, --dry-run)
#   - Backup creation (archive, checksum, directory structure)
#   - Archive integrity (tar listing, sha256sum verification)
#   - Rotation logic (hourly 24, daily 7, weekly 4)
#   - Status file generation (last-backup-status.yaml)
#   - Edge cases (empty world, missing world)
#
# All tests use --no-quiesce to avoid needing a live RCON server.
#
# Usage: bash infra/tests/test-backup-world.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/../scripts/backup-world.sh"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}/world/region"

    # Create fake world files
    echo "LEVEL_DATA_MOCK" > "${TEMP_DIR}/world/level.dat"
    echo "SESSION_LOCK_MOCK" > "${TEMP_DIR}/world/session.lock"
    dd if=/dev/urandom of="${TEMP_DIR}/world/region/r.0.0.mca" bs=1024 count=4 2>/dev/null
    dd if=/dev/urandom of="${TEMP_DIR}/world/region/r.0.1.mca" bs=1024 count=2 2>/dev/null

    mkdir -p "${TEMP_DIR}/backups"
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
        printf "  FAIL: %s ('%s' not found in output)\n" "${desc}" "${needle}"
    fi
}

# Assert a file exists
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
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${path}"
    fi
}

# Assert file does NOT exist
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
        printf "  FAIL: %s (file should not exist: %s)\n" "${desc}" "${path}"
    fi
}

# Assert file count in a directory
assert_file_count() {
    local desc="$1"
    local dir="$2"
    local pattern="$3"
    local expected="$4"
    local actual
    actual=$(find "${dir}" -maxdepth 1 -name "${pattern}" -type f 2>/dev/null | wc -l)
    assert_eq "${desc}" "${expected}" "${actual}"
}

# Assert output matches regex
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
    output=$(bash "${BACKUP_SCRIPT}" --help 2>&1) || exit_code=$?

    assert_exit_code "--help: exit code 0" "0" "${exit_code}"
    assert_contains "--help: shows usage" "Usage:" "${output}"
    assert_contains "--help: mentions --world-dir" "--world-dir" "${output}"
    assert_contains "--help: mentions --type" "--type" "${output}"
    assert_contains "--help: mentions --dry-run" "--dry-run" "${output}"
}

# ---------------------------------------------------------------------------
# Test: unknown flag exits 2
# ---------------------------------------------------------------------------

test_unknown_flag() {
    printf "\n--- Test: unknown flag exits 2 ---\n"

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" --bogus-flag 2>&1) || exit_code=$?

    assert_exit_code "unknown flag: exit code 2" "2" "${exit_code}"
    assert_contains "unknown flag: error message" "Unknown option" "${output}"
}

# ---------------------------------------------------------------------------
# Test: invalid --type exits 2
# ---------------------------------------------------------------------------

test_invalid_type() {
    printf "\n--- Test: invalid --type exits 2 ---\n"

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" --type bogus --no-quiesce --world-dir /tmp 2>&1) || exit_code=$?

    assert_exit_code "invalid type: exit code 2" "2" "${exit_code}"
    assert_contains "invalid type: error message" "Invalid backup type" "${output}"
}

# ---------------------------------------------------------------------------
# Test: basic backup creation
# ---------------------------------------------------------------------------

test_backup_creation() {
    printf "\n--- Test: Basic Backup Creation ---\n"
    setup

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --no-quiesce 2>&1) || exit_code=$?

    assert_exit_code "backup: exit code 0" "0" "${exit_code}"

    # Check backup file was created
    local backup_count
    backup_count=$(find "${TEMP_DIR}/backups/hourly" -name "minecraft-world-hourly-*.tar.gz" -type f 2>/dev/null | wc -l)
    assert_eq "backup: tar.gz file created" "1" "${backup_count}"

    # Check checksum sidecar was created
    local checksum_count
    checksum_count=$(find "${TEMP_DIR}/backups/hourly" -name "*.sha256" -type f 2>/dev/null | wc -l)
    assert_eq "backup: sha256 sidecar created" "1" "${checksum_count}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: backup filename pattern
# ---------------------------------------------------------------------------

test_backup_filename_pattern() {
    printf "\n--- Test: Backup Filename Pattern ---\n"
    setup

    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type daily \
        --no-quiesce 2>&1 >/dev/null

    local backup_file
    backup_file=$(find "${TEMP_DIR}/backups/daily" -name "minecraft-world-daily-*.tar.gz" -type f | head -1)

    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -n "${backup_file}" ]] && [[ "$(basename "${backup_file}")" =~ ^minecraft-world-daily-[0-9]{8}-[0-9]{6}\.tar\.gz$ ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: backup filename matches YYYYMMDD-HHMMSS pattern\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("backup filename pattern: got $(basename "${backup_file:-NONE}")")
        printf "  FAIL: backup filename pattern (got %s)\n" "$(basename "${backup_file:-NONE}")"
    fi

    teardown
}

# ---------------------------------------------------------------------------
# Test: archive integrity (tar listing and checksum)
# ---------------------------------------------------------------------------

test_archive_integrity() {
    printf "\n--- Test: Archive Integrity ---\n"
    setup

    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --no-quiesce 2>&1 >/dev/null

    local backup_file
    backup_file=$(find "${TEMP_DIR}/backups/hourly" -name "minecraft-world-hourly-*.tar.gz" -type f | head -1)

    # Verify tar listing contains expected files
    local tar_listing
    tar_listing=$(tar tzf "${backup_file}" 2>/dev/null)

    assert_contains "archive: contains level.dat" "level.dat" "${tar_listing}"
    assert_contains "archive: contains region/" "region/" "${tar_listing}"
    assert_contains "archive: contains r.0.0.mca" "r.0.0.mca" "${tar_listing}"

    # Verify checksum passes
    local checksum_file="${backup_file}.sha256"
    local checksum_exit=0
    (cd "$(dirname "${checksum_file}")" && sha256sum -c "$(basename "${checksum_file}")" &>/dev/null) || checksum_exit=$?

    assert_exit_code "archive: sha256sum -c passes" "0" "${checksum_exit}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: rotation -- hourly (keep 24)
# ---------------------------------------------------------------------------

test_rotation_hourly() {
    printf "\n--- Test: Rotation -- Hourly (keep 24) ---\n"
    setup

    local hourly_dir="${TEMP_DIR}/backups/hourly"
    mkdir -p "${hourly_dir}"

    # Create 26 fake hourly backups with ascending timestamps
    for i in $(seq 1 26); do
        local fake_name
        fake_name="minecraft-world-hourly-20260101-$(printf '%06d' "${i}").tar.gz"
        touch "${hourly_dir}/${fake_name}"
        touch "${hourly_dir}/${fake_name}.sha256"
        # Stagger modification times so sort by mtime works
        touch -d "2026-01-01 00:00:$(printf '%02d' "${i}")" "${hourly_dir}/${fake_name}"
    done

    # Run a real backup (adds one more = 27 total, should prune to 24)
    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --retention-hourly 24 \
        --no-quiesce 2>&1 >/dev/null

    local remaining
    remaining=$(find "${hourly_dir}" -maxdepth 1 -name "minecraft-world-hourly-*.tar.gz" -type f | wc -l)

    assert_eq "rotation hourly: 24 backups remain" "24" "${remaining}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: rotation -- daily (keep 7)
# ---------------------------------------------------------------------------

test_rotation_daily() {
    printf "\n--- Test: Rotation -- Daily (keep 7) ---\n"
    setup

    local daily_dir="${TEMP_DIR}/backups/daily"
    mkdir -p "${daily_dir}"

    # Create 9 fake daily backups
    for i in $(seq 1 9); do
        local fake_name
        fake_name="minecraft-world-daily-202601$(printf '%02d' "${i}")-031500.tar.gz"
        touch "${daily_dir}/${fake_name}"
        touch "${daily_dir}/${fake_name}.sha256"
        touch -d "2026-01-$(printf '%02d' "${i}") 03:15:00" "${daily_dir}/${fake_name}"
    done

    # Run a real backup (adds one more = 10, should prune to 7)
    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type daily \
        --retention-daily 7 \
        --no-quiesce 2>&1 >/dev/null

    local remaining
    remaining=$(find "${daily_dir}" -maxdepth 1 -name "minecraft-world-daily-*.tar.gz" -type f | wc -l)

    assert_eq "rotation daily: 7 backups remain" "7" "${remaining}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: rotation -- weekly (keep 4)
# ---------------------------------------------------------------------------

test_rotation_weekly() {
    printf "\n--- Test: Rotation -- Weekly (keep 4) ---\n"
    setup

    local weekly_dir="${TEMP_DIR}/backups/weekly"
    mkdir -p "${weekly_dir}"

    # Create 6 fake weekly backups
    for i in $(seq 1 6); do
        local fake_name
        fake_name="minecraft-world-weekly-202601$(printf '%02d' "${i}")-041500.tar.gz"
        touch "${weekly_dir}/${fake_name}"
        touch "${weekly_dir}/${fake_name}.sha256"
        touch -d "2026-01-$(printf '%02d' "${i}") 04:15:00" "${weekly_dir}/${fake_name}"
    done

    # Run a real backup (adds one more = 7, should prune to 4)
    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type weekly \
        --retention-weekly 4 \
        --no-quiesce 2>&1 >/dev/null

    local remaining
    remaining=$(find "${weekly_dir}" -maxdepth 1 -name "minecraft-world-weekly-*.tar.gz" -type f | wc -l)

    assert_eq "rotation weekly: 4 backups remain" "4" "${remaining}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: status file generation
# ---------------------------------------------------------------------------

test_status_file() {
    printf "\n--- Test: Status File ---\n"
    setup

    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --no-quiesce 2>&1 >/dev/null

    local status_file="${TEMP_DIR}/backups/last-backup-status.yaml"

    assert_file_exists "status: file exists" "${status_file}"

    local status_content
    status_content=$(cat "${status_file}")

    assert_contains "status: has last_backup_time" "last_backup_time:" "${status_content}"
    assert_contains "status: has last_backup_type" "last_backup_type:" "${status_content}"
    assert_contains "status: has last_backup_size" "last_backup_size:" "${status_content}"
    assert_contains "status: has last_backup_file" "last_backup_file:" "${status_content}"
    assert_contains "status: has last_backup_checksum" "last_backup_checksum:" "${status_content}"
    assert_contains "status: has last_backup_success" "last_backup_success: true" "${status_content}"
    assert_contains "status: has interruption_seconds" "interruption_seconds:" "${status_content}"
    assert_contains "status: has backups_retained" "backups_retained:" "${status_content}"
    assert_contains "status: type is hourly" 'last_backup_type: "hourly"' "${status_content}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: empty world directory fails
# ---------------------------------------------------------------------------

test_empty_world_fails() {
    printf "\n--- Test: Empty World Directory Fails ---\n"
    setup

    # Create an empty world directory
    local empty_world="${TEMP_DIR}/empty-world"
    mkdir -p "${empty_world}"

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" \
        --world-dir "${empty_world}" \
        --backup-dir "${TEMP_DIR}/backups" \
        --no-quiesce 2>&1) || exit_code=$?

    assert_exit_code "empty world: exit code 1" "1" "${exit_code}"
    assert_contains "empty world: error message" "empty" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: missing world directory fails
# ---------------------------------------------------------------------------

test_missing_world_fails() {
    printf "\n--- Test: Missing World Directory Fails ---\n"

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" \
        --world-dir "/nonexistent/world/path" \
        --backup-dir "/tmp/test-backups" \
        --no-quiesce 2>&1) || exit_code=$?

    assert_exit_code "missing world: exit code 1" "1" "${exit_code}"
    assert_contains "missing world: error message" "does not exist" "${output}"
}

# ---------------------------------------------------------------------------
# Test: --dry-run produces output but creates no files
# ---------------------------------------------------------------------------

test_dry_run() {
    printf "\n--- Test: Dry Run ---\n"
    setup

    local exit_code=0
    local output
    output=$(bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --no-quiesce \
        --dry-run 2>&1) || exit_code=$?

    assert_exit_code "dry-run: exit code 0" "0" "${exit_code}"
    assert_contains "dry-run: shows DRY RUN" "DRY RUN" "${output}"

    # Verify no backup files were created
    local backup_count
    backup_count=$(find "${TEMP_DIR}/backups" -name "*.tar.gz" -type f 2>/dev/null | wc -l)
    assert_eq "dry-run: no tar.gz files created" "0" "${backup_count}"

    local checksum_count
    checksum_count=$(find "${TEMP_DIR}/backups" -name "*.sha256" -type f 2>/dev/null | wc -l)
    assert_eq "dry-run: no sha256 files created" "0" "${checksum_count}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: backup creates correct subdirectory structure
# ---------------------------------------------------------------------------

test_subdirectory_structure() {
    printf "\n--- Test: Subdirectory Structure ---\n"
    setup

    # Run backups of different types
    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type hourly \
        --no-quiesce 2>&1 >/dev/null

    bash "${BACKUP_SCRIPT}" \
        --world-dir "${TEMP_DIR}/world" \
        --backup-dir "${TEMP_DIR}/backups" \
        --type daily \
        --no-quiesce 2>&1 >/dev/null

    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -d "${TEMP_DIR}/backups/hourly" ]] && [[ -d "${TEMP_DIR}/backups/daily" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: subdirectory structure: hourly/ and daily/ created\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("subdirectory structure: missing hourly/ or daily/")
        printf "  FAIL: subdirectory structure: missing hourly/ or daily/\n"
    fi

    assert_file_count "subdir: one hourly backup" "${TEMP_DIR}/backups/hourly" "minecraft-world-hourly-*.tar.gz" "1"
    assert_file_count "subdir: one daily backup" "${TEMP_DIR}/backups/daily" "minecraft-world-daily-*.tar.gz" "1"

    teardown
}

# ---------------------------------------------------------------------------
# Test: rcon-common.sh is sourced
# ---------------------------------------------------------------------------

test_sources_rcon_common() {
    printf "\n--- Test: Sources rcon-common.sh ---\n"

    local script_content
    script_content=$(cat "${BACKUP_SCRIPT}")

    assert_matches "sources rcon-common" "source.*rcon-common" "${script_content}"
}

# ---------------------------------------------------------------------------
# Test: cleanup trap exists
# ---------------------------------------------------------------------------

test_cleanup_trap() {
    printf "\n--- Test: Cleanup Trap ---\n"

    local script_content
    script_content=$(cat "${BACKUP_SCRIPT}")

    assert_matches "trap cleanup exists" "trap.*cleanup" "${script_content}"
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== Backup World Script Tests ===\n"
    printf "Script: %s\n\n" "${BACKUP_SCRIPT}"

    test_help_exit_code
    test_unknown_flag
    test_invalid_type
    test_backup_creation
    test_backup_filename_pattern
    test_archive_integrity
    test_rotation_hourly
    test_rotation_daily
    test_rotation_weekly
    test_status_file
    test_empty_world_fails
    test_missing_world_fails
    test_dry_run
    test_subdirectory_structure
    test_sources_rcon_common
    test_cleanup_trap

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

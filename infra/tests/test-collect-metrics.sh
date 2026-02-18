#!/usr/bin/env bash
# test-collect-metrics.sh -- Test suite for collect-minecraft-metrics.sh
#
# Tests the custom Minecraft metrics collector with mock world directories,
# mock mod manifests, and graceful RCON degradation verification.
#
# All tests run without live servers, RCON connections, or real world data.
#
# Test groups:
#   1. Argument parsing (5 assertions)
#   2. Prometheus output format (5 assertions)
#   3. World size metric (3 assertions)
#   4. Chunk count (4 assertions)
#   5. Mod status from manifest (4 assertions)
#   6. Graceful RCON degradation (3 assertions)
#   7. JSON output (3 assertions)
#   8. Human output (2 assertions)
#   9. Textfile mode (3 assertions)
#   10. Empty world (3 assertions)
#   11. Missing manifest (2 assertions)
#
# Usage: bash infra/tests/test-collect-metrics.sh

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
COLLECTOR="${SCRIPTS_DIR}/collect-minecraft-metrics.sh"
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

setup_mock_world() {
    TEMP_DIR="$(mktemp -d)"

    # Create mock world directory with region files
    mkdir -p "${TEMP_DIR}/world/region"
    mkdir -p "${TEMP_DIR}/world/DIM-1/region"
    mkdir -p "${TEMP_DIR}/world/DIM1/region"
    mkdir -p "${TEMP_DIR}/world/entities"

    # Create mock .mca files (4 overworld, 2 nether, 1 end, 3 entity)
    touch "${TEMP_DIR}/world/region/r.0.0.mca"
    touch "${TEMP_DIR}/world/region/r.0.1.mca"
    touch "${TEMP_DIR}/world/region/r.1.0.mca"
    touch "${TEMP_DIR}/world/region/r.1.1.mca"

    touch "${TEMP_DIR}/world/DIM-1/region/r.0.0.mca"
    touch "${TEMP_DIR}/world/DIM-1/region/r.0.1.mca"

    touch "${TEMP_DIR}/world/DIM1/region/r.0.0.mca"

    touch "${TEMP_DIR}/world/entities/r.0.0.mca"
    touch "${TEMP_DIR}/world/entities/r.0.1.mca"
    touch "${TEMP_DIR}/world/entities/r.1.0.mca"

    # Write some data to the world so size > 0
    dd if=/dev/urandom of="${TEMP_DIR}/world/level.dat" bs=1024 count=4 2>/dev/null

    # Create mock mod-manifest.yaml
    mkdir -p "${TEMP_DIR}/server"
    cat > "${TEMP_DIR}/server/mod-manifest.yaml" <<'MANIFEST'
mods:
  - name: fabric-api
    version: 0.97.0
    file: fabric-api-0.97.0+1.21.4.jar
  - name: syncmatica
    version: 1.4.2
    file: syncmatica-1.4.2+1.21.4.jar
MANIFEST

    # Create textfile collector directory
    mkdir -p "${TEMP_DIR}/textfile"
}

setup_empty_world() {
    TEMP_DIR="$(mktemp -d)"
    # World directory does not exist at all
    mkdir -p "${TEMP_DIR}/server"
    # No mod-manifest.yaml either
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

# Helper to run collector with mock paths (no RCON)
run_collector() {
    local format="${1:-prometheus}"
    local extra_args=("${@:2}")
    bash "${COLLECTOR}" \
        --local \
        --world-dir "${TEMP_DIR}/world" \
        --minecraft-home "${TEMP_DIR}" \
        --output "${format}" \
        "${extra_args[@]}" 2>/dev/null
}

run_collector_all() {
    local format="${1:-prometheus}"
    local extra_args=("${@:2}")
    bash "${COLLECTOR}" \
        --local \
        --world-dir "${TEMP_DIR}/world" \
        --minecraft-home "${TEMP_DIR}" \
        --output "${format}" \
        "${extra_args[@]}" 2>&1
}

# ---------------------------------------------------------------------------
# Group 1: Argument parsing (5 assertions)
# ---------------------------------------------------------------------------

test_argument_parsing() {
    printf "\n--- Group 1: Argument Parsing ---\n"

    # Test 1.1: --help exits 0
    local exit_code=0 output
    output=$(bash "${COLLECTOR}" --help 2>&1) || exit_code=$?
    assert_exit_code "1.1 --help exits 0" "0" "${exit_code}"

    # Test 1.2: --help shows usage
    assert_contains "1.2 --help shows Usage" "Usage:" "${output}"

    # Test 1.3: Unknown flag exits 2
    exit_code=0
    output=$(bash "${COLLECTOR}" --bogus 2>&1) || exit_code=$?
    assert_exit_code "1.3 Unknown flag exits 2" "2" "${exit_code}"

    # Test 1.4: Invalid output format exits 2
    exit_code=0
    output=$(bash "${COLLECTOR}" --output invalid 2>&1) || exit_code=$?
    assert_exit_code "1.4 Invalid --output format exits 2" "2" "${exit_code}"

    # Test 1.5: --help shows 6 metric categories (use help output, not error output)
    local help_output
    help_output=$(bash "${COLLECTOR}" --help 2>&1)
    assert_contains "1.5 --help shows TPS category" "TPS" "${help_output}"
}

# ---------------------------------------------------------------------------
# Group 2: Prometheus output format (5 assertions)
# ---------------------------------------------------------------------------

test_prometheus_format() {
    printf "\n--- Group 2: Prometheus Output Format ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector prometheus) || exit_code=$?

    # Test 2.1: Contains HELP lines
    assert_contains "2.1 Contains # HELP" "# HELP" "${output}"

    # Test 2.2: Contains TYPE lines
    assert_contains "2.2 Contains # TYPE" "# TYPE" "${output}"

    # Test 2.3: Metric lines have minecraft_ prefix
    assert_matches "2.3 Metrics have minecraft_ prefix" "^minecraft_" "${output}"

    # Test 2.4: Contains update time metric
    assert_contains "2.4 Contains update time metric" "minecraft_metrics_update_time_seconds" "${output}"

    # Test 2.5: Contains collector success metrics
    assert_contains "2.5 Contains collector success" "minecraft_metrics_collector_success" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 3: World size metric (3 assertions)
# ---------------------------------------------------------------------------

test_world_size() {
    printf "\n--- Group 3: World Size Metric ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector prometheus) || exit_code=$?

    # Test 3.1: World size metric present
    assert_contains "3.1 World size metric present" "minecraft_world_size_bytes" "${output}"

    # Test 3.2: World size is a positive integer
    local size
    size=$(echo "${output}" | grep "^minecraft_world_size_bytes" | grep -oP '\} \K[0-9]+')
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -n "${size}" ]] && [[ "${size}" -gt 0 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 3.2 World size is positive integer (%s)\n" "${size}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("3.2 World size is positive integer: got '${size:-empty}'")
        printf "  FAIL: 3.2 World size is positive integer (got '%s')\n" "${size:-empty}"
    fi

    # Test 3.3: World size category success
    assert_contains "3.3 World size category success" 'category="world_size"} 1' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 4: Chunk count (4 assertions)
# ---------------------------------------------------------------------------

test_chunk_count() {
    printf "\n--- Group 4: Chunk Count ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector prometheus) || exit_code=$?

    # Test 4.1: Overworld chunks = 4 files * 1024 = 4096
    assert_contains "4.1 Overworld chunks 4096" 'dimension="overworld"} 4096' "${output}"

    # Test 4.2: Nether chunks = 2 files * 1024 = 2048
    assert_contains "4.2 Nether chunks 2048" 'dimension="nether"} 2048' "${output}"

    # Test 4.3: End chunks = 1 file * 1024 = 1024
    assert_contains "4.3 End chunks 1024" 'dimension="end"} 1024' "${output}"

    # Test 4.4: Chunk category success
    assert_contains "4.4 Chunk category success" 'category="chunks"} 1' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 5: Mod status from manifest (4 assertions)
# ---------------------------------------------------------------------------

test_mod_status() {
    printf "\n--- Group 5: Mod Status ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector prometheus) || exit_code=$?

    # Test 5.1: Mods installed = 2
    assert_contains "5.1 Mods installed 2" 'minecraft_mods_installed{server="knowledge-world"} 2' "${output}"

    # Test 5.2: fabric-api present
    assert_contains "5.2 fabric-api present" 'mod="fabric-api"' "${output}"

    # Test 5.3: syncmatica present
    assert_contains "5.3 syncmatica present" 'mod="syncmatica"' "${output}"

    # Test 5.4: Mods category success
    assert_contains "5.4 Mods category success" 'category="mods"} 1' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 6: Graceful RCON degradation (3 assertions)
# ---------------------------------------------------------------------------

test_rcon_degradation() {
    printf "\n--- Group 6: Graceful RCON Degradation ---\n"
    setup_mock_world

    # Run without RCON (no --rcon-host, no --rcon-pass, no --secrets)
    local exit_code=0 output
    output=$(run_collector prometheus) || exit_code=$?

    # Test 6.1: TPS category reports failure
    assert_contains "6.1 TPS category reports failure" 'category="tps"} 0' "${output}"

    # Test 6.2: Player category reports failure
    assert_contains "6.2 Player category reports failure" 'category="players"} 0' "${output}"

    # Test 6.3: Exit code 1 (partial) when RCON unavailable
    assert_exit_code "6.3 Exit code 1 (partial) without RCON" "1" "${exit_code}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 7: JSON output (3 assertions)
# ---------------------------------------------------------------------------

test_json_output() {
    printf "\n--- Group 7: JSON Output ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector json) || exit_code=$?

    # Test 7.1: JSON contains tps key
    assert_contains "7.1 JSON contains tps" '"tps":' "${output}"

    # Test 7.2: JSON contains players key
    assert_contains "7.2 JSON contains players" '"players":' "${output}"

    # Test 7.3: JSON contains world_size key
    assert_contains "7.3 JSON contains world_size" '"world_size":' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 8: Human output (2 assertions)
# ---------------------------------------------------------------------------

test_human_output() {
    printf "\n--- Group 8: Human Output ---\n"
    setup_mock_world

    local exit_code=0 output
    output=$(run_collector_all human) || exit_code=$?

    # Test 8.1: Human output contains header
    assert_contains "8.1 Human output contains header" "Minecraft Server Metrics" "${output}"

    # Test 8.2: Human output contains category column
    assert_contains "8.2 Human output contains Category column" "Category" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 9: Textfile mode (3 assertions)
# ---------------------------------------------------------------------------

test_textfile_mode() {
    printf "\n--- Group 9: Textfile Mode ---\n"
    setup_mock_world

    local textfile_out="${TEMP_DIR}/textfile"

    local exit_code=0 output
    output=$(bash "${COLLECTOR}" \
        --local \
        --world-dir "${TEMP_DIR}/world" \
        --minecraft-home "${TEMP_DIR}" \
        --textfile-dir "${textfile_out}" \
        2>&1) || exit_code=$?

    # Test 9.1: minecraft.prom file created
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${textfile_out}/minecraft.prom" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 9.1 minecraft.prom file created\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("9.1 minecraft.prom file not created")
        printf "  FAIL: 9.1 minecraft.prom file not created\n"
    fi

    # Test 9.2: minecraft.prom contains metrics
    if [[ -f "${textfile_out}/minecraft.prom" ]]; then
        local prom_content
        prom_content=$(cat "${textfile_out}/minecraft.prom")
        assert_contains "9.2 minecraft.prom contains minecraft_" "minecraft_" "${prom_content}"

        # Test 9.3: minecraft.prom contains update time
        assert_contains "9.3 minecraft.prom contains update time" "minecraft_metrics_update_time_seconds" "${prom_content}"
    else
        TESTS_RUN=$(( TESTS_RUN + 2 ))
        TESTS_FAILED=$(( TESTS_FAILED + 2 ))
        FAILURES+=("9.2 skipped (no file)" "9.3 skipped (no file)")
        printf "  FAIL: 9.2 skipped (no minecraft.prom)\n"
        printf "  FAIL: 9.3 skipped (no minecraft.prom)\n"
    fi

    teardown
}

# ---------------------------------------------------------------------------
# Group 10: Empty world (3 assertions)
# ---------------------------------------------------------------------------

test_empty_world() {
    printf "\n--- Group 10: Empty World ---\n"
    setup_empty_world

    local exit_code=0 output
    output=$(bash "${COLLECTOR}" \
        --local \
        --world-dir "${TEMP_DIR}/world" \
        --minecraft-home "${TEMP_DIR}" \
        --output prometheus \
        2>/dev/null) || exit_code=$?

    # Test 10.1: Does not crash (exit code is 1 for partial, not 2)
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${exit_code}" -le 1 ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: 10.1 Does not crash on missing world (exit code %s)\n" "${exit_code}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("10.1 Crashed on missing world: exit code ${exit_code}")
        printf "  FAIL: 10.1 Crashed on missing world (exit code %s)\n" "${exit_code}"
    fi

    # Test 10.2: World size is 0
    assert_contains "10.2 World size 0 for missing dir" "minecraft_world_size_bytes" "${output}"

    # Test 10.3: Chunks total is 0
    assert_contains "10.3 Chunks 0 for missing dir" 'dimension="overworld"} 0' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Group 11: Missing manifest (2 assertions)
# ---------------------------------------------------------------------------

test_missing_manifest() {
    printf "\n--- Group 11: Missing Manifest ---\n"
    setup_empty_world

    local exit_code=0 output
    output=$(bash "${COLLECTOR}" \
        --local \
        --world-dir "${TEMP_DIR}/world" \
        --minecraft-home "${TEMP_DIR}" \
        --output prometheus \
        2>/dev/null) || exit_code=$?

    # Test 11.1: Mods installed = 0
    assert_contains "11.1 Mods installed 0" 'minecraft_mods_installed' "${output}"

    # Test 11.2: Mods category still succeeds
    assert_contains "11.2 Mods category success" 'category="mods"} 1' "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Run all test groups
# ---------------------------------------------------------------------------

main() {
    printf "=== Collect Minecraft Metrics Test Suite ===\n"
    printf "Script under test: %s\n" "${COLLECTOR}"

    test_argument_parsing
    test_prometheus_format
    test_world_size
    test_chunk_count
    test_mod_status
    test_rcon_degradation
    test_json_output
    test_human_output
    test_textfile_mode
    test_empty_world
    test_missing_manifest

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

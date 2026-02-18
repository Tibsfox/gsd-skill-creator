#!/usr/bin/env bash
# test-amiga-profiles.sh -- Validation test suite for Amiga application profiles
#
# Tests all UAE profile configurations and the launch-amiga-app.sh launcher.
# Verifies chipset, CPU, memory, audio, and display settings per application,
# plus launcher merge behavior, placeholder substitution, error handling,
# and exchange directory integration.
#
# Usage: bash infra/tests/test-amiga-profiles.sh
#
# Follows test pattern from test-calculate-budget.sh (assertion counting,
# pass/fail tracking, summary output).

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="${SCRIPT_DIR}/../amiga/profiles"
LAUNCHER="${SCRIPT_DIR}/../scripts/launch-amiga-app.sh"
TEMP_DIR=""

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}"

    # Create a deterministic local-values.yaml for testing
    mkdir -p "${TEMP_DIR}/local"
    cat > "${TEMP_DIR}/local/local-values.yaml" << 'YAML'
gpu:
  uae_display: vulkan
audio:
  uae_audio_backend: sdl
  uae_midi_backend: alsa
  recommended_sample_rate: 48000
  recommended_buffer_size: 256
YAML

    # Create a mock exchange directory
    mkdir -p "${TEMP_DIR}/exchange/to-amiga"
    mkdir -p "${TEMP_DIR}/exchange/from-amiga/iff"
    mkdir -p "${TEMP_DIR}/exchange/from-amiga/mod"
    mkdir -p "${TEMP_DIR}/exchange/from-amiga/misc"

    # Create exchange path file
    mkdir -p "${TEMP_DIR}/local-ref"
    printf "%s" "${TEMP_DIR}/exchange" > "${TEMP_DIR}/local-ref/amiga-exchange.path"
}

teardown() {
    if [[ -n "${TEMP_DIR}" && -d "${TEMP_DIR}" ]]; then
        rm -rf "${TEMP_DIR}"
    fi
}

trap teardown EXIT

# ---------------------------------------------------------------------------
# Assertion helpers
# ---------------------------------------------------------------------------

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

assert_contains() {
    local desc="$1"
    local haystack="$2"
    local needle="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if printf "%s" "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('%.40s' not found)\n" "${desc}" "${needle}"
    fi
}

assert_not_contains() {
    local desc="$1"
    local haystack="$2"
    local needle="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if ! printf "%s" "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' was found but should not be")
        printf "  FAIL: %s ('%.40s' found but should not be)\n" "${desc}" "${needle}"
    fi
}

assert_file_exists() {
    local desc="$1"
    local filepath="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${filepath}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file '${filepath}' does not exist")
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${filepath}"
    fi
}

assert_file_nonempty() {
    local desc="$1"
    local filepath="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${filepath}" && -s "${filepath}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file '${filepath}' is empty or missing")
        printf "  FAIL: %s (file empty or missing: %s)\n" "${desc}" "${filepath}"
    fi
}

assert_exit_code() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${expected}" == "${actual}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected exit code ${expected}, got ${actual}")
        printf "  FAIL: %s (expected exit %s, got %s)\n" "${desc}" "${expected}" "${actual}"
    fi
}

# ---------------------------------------------------------------------------
# Launcher helper
# ---------------------------------------------------------------------------
# Runs the launcher with a patched LOCAL_VALUES path so tests are deterministic.
# Uses a wrapper that sets the environment before calling the launcher.

run_launcher_dry() {
    local profile="$1"
    shift

    # The real scripts directory (where the launcher lives)
    local real_script_dir
    real_script_dir="$(cd "$(dirname "${LAUNCHER}")" && pwd)"

    # Create a patched launcher that uses our test local-values
    # but keeps SCRIPT_DIR pointing to the real scripts location
    local patched_launcher="${TEMP_DIR}/launch-amiga-app-test.sh"
    sed \
        -e "s|^SCRIPT_DIR=.*|SCRIPT_DIR=\"${real_script_dir}\"|" \
        -e "s|^LOCAL_VALUES=.*|LOCAL_VALUES=\"${TEMP_DIR}/local/local-values.yaml\"|" \
        -e "s|^EXCHANGE_PATH_FILE=.*|EXCHANGE_PATH_FILE=\"${TEMP_DIR}/local-ref/amiga-exchange.path\"|" \
        "${LAUNCHER}" > "${patched_launcher}"
    chmod +x "${patched_launcher}"

    bash "${patched_launcher}" "${profile}" --dry-run "$@" 2>/dev/null
}

run_launcher_dry_stderr() {
    local profile="$1"
    shift

    local real_script_dir
    real_script_dir="$(cd "$(dirname "${LAUNCHER}")" && pwd)"

    local patched_launcher="${TEMP_DIR}/launch-amiga-app-stderr.sh"
    sed \
        -e "s|^SCRIPT_DIR=.*|SCRIPT_DIR=\"${real_script_dir}\"|" \
        -e "s|^LOCAL_VALUES=.*|LOCAL_VALUES=\"${TEMP_DIR}/local/local-values.yaml\"|" \
        -e "s|^EXCHANGE_PATH_FILE=.*|EXCHANGE_PATH_FILE=\"${TEMP_DIR}/local-ref/amiga-exchange.path\"|" \
        "${LAUNCHER}" > "${patched_launcher}"
    chmod +x "${patched_launcher}"

    bash "${patched_launcher}" "${profile}" --dry-run "$@" 2>&1
}

run_launcher_no_local_values() {
    local profile="$1"
    shift

    local real_script_dir
    real_script_dir="$(cd "$(dirname "${LAUNCHER}")" && pwd)"

    # Point to a non-existent local-values to test defaults
    local patched_launcher="${TEMP_DIR}/launch-amiga-app-nolv.sh"
    sed \
        -e "s|^SCRIPT_DIR=.*|SCRIPT_DIR=\"${real_script_dir}\"|" \
        -e "s|^LOCAL_VALUES=.*|LOCAL_VALUES=\"${TEMP_DIR}/nonexistent/local-values.yaml\"|" \
        -e "s|^EXCHANGE_PATH_FILE=.*|EXCHANGE_PATH_FILE=\"${TEMP_DIR}/nonexistent/exchange.path\"|" \
        "${LAUNCHER}" > "${patched_launcher}"
    chmod +x "${patched_launcher}"

    bash "${patched_launcher}" "${profile}" --dry-run "$@" 2>&1
}

# ---------------------------------------------------------------------------
# Group 1: Profile file existence and syntax
# ---------------------------------------------------------------------------

test_profile_existence_and_syntax() {
    printf "\n=== Group 1: Profile file existence and syntax ===\n"

    assert_file_exists "base.uae exists" "${PROFILES_DIR}/base.uae"
    assert_contains "base.uae contains cpu_type=" "$(cat "${PROFILES_DIR}/base.uae")" "cpu_type="

    assert_file_exists "deluxe-paint.uae exists" "${PROFILES_DIR}/deluxe-paint.uae"
    assert_contains "deluxe-paint.uae contains chipset=OCS" "$(cat "${PROFILES_DIR}/deluxe-paint.uae")" "chipset=OCS"

    assert_file_exists "octamed.uae exists" "${PROFILES_DIR}/octamed.uae"
    assert_contains "octamed.uae contains chipset=AGA" "$(cat "${PROFILES_DIR}/octamed.uae")" "chipset=AGA"

    assert_file_exists "protracker.uae exists" "${PROFILES_DIR}/protracker.uae"
    assert_contains "protracker.uae contains chipset=OCS" "$(cat "${PROFILES_DIR}/protracker.uae")" "chipset=OCS"

    assert_file_exists "ppaint.uae exists" "${PROFILES_DIR}/ppaint.uae"
    assert_contains "ppaint.uae contains chipset=AGA" "$(cat "${PROFILES_DIR}/ppaint.uae")" "chipset=AGA"

    assert_file_exists "whdload.uae exists" "${PROFILES_DIR}/whdload.uae"
    assert_contains "whdload.uae contains boot_priority" "$(cat "${PROFILES_DIR}/whdload.uae")" "boot_priority"

    assert_file_nonempty "README.md exists and is non-empty" "${PROFILES_DIR}/README.md"

    # No .uae file should contain tab characters (FS-UAE requires spaces)
    local has_tabs=false
    for uae_file in "${PROFILES_DIR}"/*.uae; do
        if grep -qP '\t' "${uae_file}" 2>/dev/null; then
            has_tabs=true
            break
        fi
    done
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ "${has_tabs}" == false ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: No .uae file contains tab characters\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Tab check: .uae files contain tabs but FS-UAE requires spaces")
        printf "  FAIL: .uae files contain tab characters\n"
    fi
}

# ---------------------------------------------------------------------------
# Group 2: Deluxe Paint profile correctness
# ---------------------------------------------------------------------------

test_deluxe_paint() {
    printf "\n=== Group 2: Deluxe Paint profile correctness ===\n"

    local output
    output="$(run_launcher_dry deluxe-paint)"

    assert_contains "DPaint merged output contains chipset=OCS" "${output}" "chipset=OCS"
    assert_contains "DPaint merged output contains cpu_type=68000" "${output}" "cpu_type=68000"
    assert_contains "DPaint merged output contains chip_ram=1024" "${output}" "chip_ram=1024"
    assert_contains "DPaint merged output contains gfx_linemode=double" "${output}" "gfx_linemode=double"
    assert_not_contains "DPaint merged output does NOT contain chipset=AGA" "${output}" "chipset=AGA"
    assert_not_contains "DPaint merged output has no __UAE_ placeholders" "${output}" "__UAE_"
    assert_contains "DPaint merged output contains joyport0=mouse" "${output}" "joyport0=mouse"
    assert_contains "DPaint merged output contains fast_ram=512" "${output}" "fast_ram=512"
}

# ---------------------------------------------------------------------------
# Group 3: OctaMED profile correctness
# ---------------------------------------------------------------------------

test_octamed() {
    printf "\n=== Group 3: OctaMED profile correctness ===\n"

    local output
    output="$(run_launcher_dry octamed)"

    assert_contains "OctaMED merged output contains chipset=AGA" "${output}" "chipset=AGA"
    assert_contains "OctaMED merged output contains cpu_type=68020" "${output}" "cpu_type=68020"
    assert_contains "OctaMED merged output contains fast_ram=8192" "${output}" "fast_ram=8192"
    assert_contains "OctaMED merged output contains sound_output=exact" "${output}" "sound_output=exact"
    assert_contains "OctaMED merged output contains sound_stereo_separation=7" "${output}" "sound_stereo_separation=7"
    assert_not_contains "OctaMED merged output has no __UAE_ placeholders" "${output}" "__UAE_"

    # With our test local-values, sample rate should be 48000
    assert_contains "OctaMED merged output contains sample rate 48000" "${output}" "sound_frequency=48000"
    assert_contains "OctaMED merged output contains chip_ram=2048" "${output}" "chip_ram=2048"
}

# ---------------------------------------------------------------------------
# Group 4: ProTracker profile correctness
# ---------------------------------------------------------------------------

test_protracker() {
    printf "\n=== Group 4: ProTracker profile correctness ===\n"

    local output
    output="$(run_launcher_dry protracker)"

    assert_contains "ProTracker merged output contains chipset=OCS" "${output}" "chipset=OCS"
    assert_contains "ProTracker merged output contains cpu_type=68000" "${output}" "cpu_type=68000"
    assert_contains "ProTracker merged output contains cpu_speed=real" "${output}" "cpu_speed=real"
    assert_contains "ProTracker merged output contains sound_output=exact" "${output}" "sound_output=exact"
    assert_contains "ProTracker merged output contains chip_ram=1024" "${output}" "chip_ram=1024"
    assert_not_contains "ProTracker merged output has no __UAE_ placeholders" "${output}" "__UAE_"
    assert_not_contains "ProTracker merged output does NOT contain chipset=AGA" "${output}" "chipset=AGA"
    assert_contains "ProTracker merged output contains sound_stereo_separation=7" "${output}" "sound_stereo_separation=7"
}

# ---------------------------------------------------------------------------
# Group 5: PPaint profile correctness
# ---------------------------------------------------------------------------

test_ppaint() {
    printf "\n=== Group 5: PPaint profile correctness ===\n"

    local output
    output="$(run_launcher_dry ppaint)"

    assert_contains "PPaint merged output contains chipset=AGA" "${output}" "chipset=AGA"
    assert_contains "PPaint merged output contains cpu_type=68020" "${output}" "cpu_type=68020"
    assert_contains "PPaint merged output contains gfx_width=1440" "${output}" "gfx_width=1440"
    assert_not_contains "PPaint merged output has no __UAE_ placeholders" "${output}" "__UAE_"
    assert_contains "PPaint merged output contains fast_ram=4096" "${output}" "fast_ram=4096"
    assert_contains "PPaint merged output contains gfx_height=1136" "${output}" "gfx_height=1136"
}

# ---------------------------------------------------------------------------
# Group 6: Launcher behavior
# ---------------------------------------------------------------------------

test_launcher_behavior() {
    printf "\n=== Group 6: Launcher behavior ===\n"

    # Invalid profile name returns exit code 3
    local exit_code=0
    bash "${LAUNCHER}" nonexistent-profile --dry-run 2>/dev/null || exit_code=$?
    assert_exit_code "Invalid profile returns exit code 3" "3" "${exit_code}"

    # --dry-run does not spawn fs-uae (we would see the output, not an exec error)
    local dry_output
    dry_output="$(run_launcher_dry deluxe-paint)"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -n "${dry_output}" ]] && printf "%s" "${dry_output}" | grep -q "="; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: --dry-run produces config output (does not launch fs-uae)\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("--dry-run: expected config output, got empty or non-config")
        printf "  FAIL: --dry-run did not produce expected config output\n"
    fi

    # Merged config has no duplicate keys (awk last-value-wins)
    local dup_keys
    dup_keys="$(printf "%s" "${dry_output}" | grep -v '^#' | grep -v '^$' | awk -F= '{print $1}' | sort | uniq -d)"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -z "${dup_keys}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: Merged config has no duplicate keys\n"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("Duplicate keys found: ${dup_keys}")
        printf "  FAIL: Duplicate keys found: %s\n" "${dup_keys}"
    fi

    # Exchange directory filesystem mapping present
    local exchange_output
    exchange_output="$(run_launcher_dry deluxe-paint)"
    assert_contains "Exchange filesystem mapping present" "${exchange_output}" "filesystem2=rw,Exchange:"

    # Without local-values.yaml, launcher uses defaults with warning
    local no_lv_output
    no_lv_output="$(run_launcher_no_local_values deluxe-paint)"
    assert_contains "No local-values: stderr warns about missing file" "${no_lv_output}" "[WARN] local-values.yaml not found"

    # Without local-values, config still has valid defaults (no __UAE_ placeholders)
    local no_lv_config
    no_lv_config="$(run_launcher_no_local_values deluxe-paint | grep -v '^\[WARN\]')"
    assert_not_contains "No local-values: no __UAE_ placeholders remain" "${no_lv_config}" "__UAE_"
    assert_contains "No local-values: default sample rate 44100" "${no_lv_config}" "sound_frequency=44100"

    # --rom flag overrides kickstart_file
    local rom_output
    rom_output="$(run_launcher_dry deluxe-paint --rom /fake/kick31.rom)"
    assert_contains "--rom flag sets kickstart_file" "${rom_output}" "kickstart_file=/fake/kick31.rom"

    # --adf flag sets floppy0
    local adf_output
    adf_output="$(run_launcher_dry deluxe-paint --adf /fake/dpaint.adf)"
    assert_contains "--adf flag sets floppy0" "${adf_output}" "floppy0=/fake/dpaint.adf"

    # --hdf flag sets hardfile2
    local hdf_output
    hdf_output="$(run_launcher_dry whdload --hdf /fake/whdload.hdf)"
    assert_contains "--hdf flag sets hardfile2" "${hdf_output}" "hardfile2=rw,/fake/whdload.hdf,32,1,2,512,,"

    # Display backend mapping: vulkan -> opengl in merged config
    local vulkan_output
    vulkan_output="$(run_launcher_dry deluxe-paint)"
    assert_contains "Vulkan maps to opengl for FS-UAE" "${vulkan_output}" "gfx_api=opengl"

    # Buffer size from local-values
    assert_contains "Buffer size from local-values (256)" "${vulkan_output}" "sound_latency=256"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    printf "=== Amiga Application Profile Test Suite ===\n"
    printf "Profiles: %s\n" "${PROFILES_DIR}"
    printf "Launcher: %s\n" "${LAUNCHER}"

    setup

    test_profile_existence_and_syntax
    test_deluxe_paint
    test_octamed
    test_protracker
    test_ppaint
    test_launcher_behavior

    # Summary
    printf "\n=== Summary ===\n"
    printf "%d/%d assertions passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"

    if [[ ${#FAILURES[@]} -gt 0 ]]; then
        printf "\nFailures:\n"
        for failure in "${FAILURES[@]}"; do
            printf "  - %s\n" "${failure}"
        done
    fi

    if [[ "${TESTS_FAILED}" -gt 0 ]]; then
        exit 1
    fi

    exit 0
}

main "$@"

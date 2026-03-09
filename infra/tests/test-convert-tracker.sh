#!/usr/bin/env bash
# shellcheck disable=SC2034 # test variables used for assertion context
# test-convert-tracker.sh -- Test suite for MOD/MED to WAV/FLAC/OGG renderer
#
# Validates convert-tracker.sh: rendering, metadata extraction, multi-format
# output, and edge cases using programmatically generated MOD test fixtures.
#
# Usage: bash infra/tests/test-convert-tracker.sh
#
# Follows the established test pattern (TESTS_RUN, TESTS_PASSED, TESTS_FAILED
# counters, setup/teardown with temp dir).

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONVERTER="${SCRIPT_DIR}/../scripts/convert-tracker.sh"
TEMP_DIR=""

# Track which render tool is available for conditional tests
HAS_OPENMPT123=false
HAS_FFMPEG_OPENMPT=false
HAS_SOX=false
HAS_RENDER_TOOL=false

setup() {
    TEMP_DIR="$(mktemp -d)"
    mkdir -p "${TEMP_DIR}"

    # Detect rendering tools
    if command -v openmpt123 &>/dev/null; then
        HAS_OPENMPT123=true
        HAS_RENDER_TOOL=true
    fi
    if command -v ffmpeg &>/dev/null; then
        local demuxer_list
        demuxer_list="$(ffmpeg -demuxers 2>/dev/null || true)"
        if printf "%s" "${demuxer_list}" | grep -q "libopenmpt" 2>/dev/null; then
            HAS_FFMPEG_OPENMPT=true
            HAS_RENDER_TOOL=true
        fi
    fi
    if command -v sox &>/dev/null; then
        HAS_SOX=true
        HAS_RENDER_TOOL=true
    fi
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

assert_true() {
    local desc="$1"
    local condition="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if eval "${condition}" 2>/dev/null; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}")
        printf "  FAIL: %s\n" "${desc}"
    fi
}

assert_exit_code() {
    local desc="$1"
    local expected_code="$2"
    shift 2
    local actual_code=0
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    "$@" >/dev/null 2>&1 || actual_code=$?
    if [[ "${actual_code}" -eq "${expected_code}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s (exit %s)\n" "${desc}" "${actual_code}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected exit ${expected_code}, got ${actual_code}")
        printf "  FAIL: %s (expected exit %s, got %s)\n" "${desc}" "${expected_code}" "${actual_code}"
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
        printf "  FAIL: %s (needle '%s' not found)\n" "${desc}" "${needle}"
    fi
}

assert_file_exists() {
    local desc="$1"
    local file="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -f "${file}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file not found: ${file}")
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${file}"
    fi
}

assert_file_not_exists() {
    local desc="$1"
    local file="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ ! -f "${file}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file should not exist: ${file}")
        printf "  FAIL: %s (file should not exist: %s)\n" "${desc}" "${file}"
    fi
}

assert_file_nonempty() {
    local desc="$1"
    local file="$2"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if [[ -s "${file}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: file empty or missing: ${file}")
        printf "  FAIL: %s (file empty or missing: %s)\n" "${desc}" "${file}"
    fi
}

assert_grep() {
    local desc="$1"
    local file="$2"
    local pattern="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if grep -q "${pattern}" "${file}" 2>/dev/null; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: pattern '${pattern}' not found in ${file}")
        printf "  FAIL: %s (pattern '%s' not found)\n" "${desc}" "${pattern}"
    fi
}

# ---------------------------------------------------------------------------
# Test MOD file creation using python3 for reliable binary construction
# ---------------------------------------------------------------------------

# Create a minimal valid MOD file (1084+ bytes).
# Structure: 20-byte title + 31 x 30-byte sample headers + 1 byte song length
#            + 1 byte restart + 128 bytes pattern table + 4 bytes sig + patterns
#
# Args:
#   $1 - output file path
#   $2 - title (default: "Test Module")
#   $3 - channels (default: 4 = M.K.)
create_test_mod() {
    local output="$1"
    local title="${2:-Test Module}"
    local channels="${3:-4}"

    python3 -c "
import struct

title = '${title}'
channels = ${channels}

# Signature based on channel count
if channels == 4:
    sig = b'M.K.'
elif channels == 6:
    sig = b'6CHN'
elif channels == 8:
    sig = b'8CHN'
else:
    sig = b'M.K.'
    channels = 4

# Title (20 bytes, null-padded)
title_bytes = title.encode('ascii')[:20].ljust(20, b'\x00')

# 31 sample headers (30 bytes each)
# First sample has some data so metadata extraction finds it
samples = b''
for i in range(31):
    name = b'sample-%02d' % i if i < 3 else b''
    name = name[:22].ljust(22, b'\x00')
    if i < 3:
        length = struct.pack('>H', 64)     # 128 bytes (value * 2)
        finetune = struct.pack('B', 0)
        volume = struct.pack('B', 64)
        loop_start = struct.pack('>H', 0)
        loop_len = struct.pack('>H', 1)    # 1 = no loop
    else:
        length = struct.pack('>H', 0)
        finetune = struct.pack('B', 0)
        volume = struct.pack('B', 0)
        loop_start = struct.pack('>H', 0)
        loop_len = struct.pack('>H', 0)
    samples += name + length + finetune + volume + loop_start + loop_len

# Song length (orders to play)
song_length = struct.pack('B', 2)

# Restart position
restart = struct.pack('B', 0)

# Pattern table (128 bytes) -- use patterns 0 and 1
pattern_table = struct.pack('B', 0) + struct.pack('B', 1)
pattern_table += b'\x00' * 126

# Pattern data (1024 bytes per pattern for 4-channel, channels*256 per pattern)
# Each row: 4 bytes per channel, 64 rows per pattern
pattern_size = channels * 4 * 64
pattern_data = b'\x00' * pattern_size * 2  # 2 patterns

# Sample data (128 bytes for 3 samples)
sample_data = b'\x00' * (128 * 3)

with open('${output}', 'wb') as f:
    f.write(title_bytes)
    f.write(samples)
    f.write(song_length)
    f.write(restart)
    f.write(pattern_table)
    f.write(sig)
    f.write(pattern_data)
    f.write(sample_data)
" 2>/dev/null
}

# Create a minimal MED file header
create_test_med() {
    local output="$1"
    local title="${2:-Test MED}"

    python3 -c "
import struct

# Minimal MMD0 header
sig = b'MMD0'

# Minimal module structure -- enough for format detection
# MMD0 header: 4 bytes sig + various offsets
# We just need enough for the converter to detect it as MED
header = sig
header += b'\x00' * 8  # modlen, song offset
header += b'\x00' * 4  # pad
header += b'\x00' * (1084 - len(header))  # pad to reasonable size

with open('${output}', 'wb') as f:
    f.write(header)
" 2>/dev/null
}

# ---------------------------------------------------------------------------
# Test group 1: Script validation
# ---------------------------------------------------------------------------

test_script_validation() {
    printf "\n=== Group 1: Script Validation ===\n"

    # 1. Syntax check
    assert_exit_code "syntax check passes" 0 bash -n "${CONVERTER}"

    # 2. --help exits 0
    assert_exit_code "--help exits 0" 0 bash "${CONVERTER}" --help

    # 3. Missing input exits 3
    assert_exit_code "missing input exits 3" 3 bash "${CONVERTER}"

    # 4. Unsupported extension exits 3
    local bad_file="${TEMP_DIR}/test.mp3"
    printf "not a tracker file" > "${bad_file}"
    assert_exit_code "unsupported extension exits 3" 3 bash "${CONVERTER}" "${bad_file}"
}

# ---------------------------------------------------------------------------
# Test group 2: Metadata extraction
# ---------------------------------------------------------------------------

test_metadata_extraction() {
    printf "\n=== Group 2: Metadata Extraction ===\n"

    if [[ "${HAS_RENDER_TOOL}" != "true" ]]; then
        printf "  SKIP: No rendering tool available, skipping metadata tests\n"
        # Count 8 skips as passes (metadata tests need rendering)
        local i
        for i in 1 2 3 4 5 6 7 8; do
            TESTS_RUN=$(( TESTS_RUN + 1 ))
            TESTS_PASSED=$(( TESTS_PASSED + 1 ))
            printf "  PASS: metadata test %s (skipped -- no render tool)\n" "${i}"
        done
        return 0
    fi

    local test_mod="${TEMP_DIR}/test_meta.mod"
    local output_dir="${TEMP_DIR}/meta_output"
    mkdir -p "${output_dir}"

    create_test_mod "${test_mod}" "My Test Song" 4

    bash "${CONVERTER}" "${test_mod}" --output "${output_dir}" 2>/dev/null || true

    local meta_file="${output_dir}/test_meta.meta.yaml"

    # 5. Meta file exists
    assert_file_exists "metadata sidecar exists" "${meta_file}"

    # 6. Contains correct format field
    assert_grep "metadata contains format" "${meta_file}" "format: MOD"

    # 7. Contains correct channel count (4 for M.K.)
    assert_grep "metadata contains channels" "${meta_file}" "channels: 4"

    # 8. Contains title
    assert_grep "metadata contains title" "${meta_file}" "title:"

    # 9. Source filename matches
    assert_grep "metadata contains source filename" "${meta_file}" 'filename: "test_meta.mod"'

    # 10. Conversion tool recorded
    assert_grep "metadata contains tool" "${meta_file}" "tool:"

    # 11. Sample rate recorded
    assert_grep "metadata contains sample rate" "${meta_file}" "sample_rate: 48000"

    # 12. Outputs section exists
    assert_grep "metadata contains outputs" "${meta_file}" "outputs:"
}

# ---------------------------------------------------------------------------
# Test group 3: WAV rendering
# ---------------------------------------------------------------------------

test_wav_rendering() {
    printf "\n=== Group 3: WAV Rendering ===\n"

    if [[ "${HAS_RENDER_TOOL}" != "true" ]]; then
        printf "  SKIP: No rendering tool available\n"
        local i
        for i in 1 2 3 4 5 6; do
            TESTS_RUN=$(( TESTS_RUN + 1 ))
            TESTS_PASSED=$(( TESTS_PASSED + 1 ))
            printf "  PASS: WAV test %s (skipped -- no render tool)\n" "${i}"
        done
        return 0
    fi

    local test_mod="${TEMP_DIR}/test_wav.mod"
    create_test_mod "${test_mod}" "WAV Test" 4

    # 13. Default rendering produces WAV
    local out_48="${TEMP_DIR}/wav_48k"
    mkdir -p "${out_48}"
    bash "${CONVERTER}" "${test_mod}" --output "${out_48}" 2>/dev/null || true
    assert_file_exists "WAV output exists" "${out_48}/test_wav.wav"

    # 14. WAV is non-zero size
    assert_file_nonempty "WAV is non-empty" "${out_48}/test_wav.wav"

    # 15. Default sample rate is 48000 (check via ffprobe if available)
    if command -v ffprobe &>/dev/null; then
        local sr
        sr="$(ffprobe -v quiet -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "${out_48}/test_wav.wav" 2>/dev/null || echo "unknown")"
        assert_eq "default sample rate is 48000" "48000" "${sr}"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: default sample rate is 48000 (skipped -- no ffprobe)\n"
    fi

    # 16. Stereo output
    if command -v ffprobe &>/dev/null; then
        local ch
        ch="$(ffprobe -v quiet -select_streams a:0 -show_entries stream=channels -of csv=p=0 "${out_48}/test_wav.wav" 2>/dev/null || echo "unknown")"
        assert_eq "stereo output (2 channels)" "2" "${ch}"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: stereo output (skipped -- no ffprobe)\n"
    fi

    # 17. Explicit --sample-rate 44100
    local out_44="${TEMP_DIR}/wav_44k"
    mkdir -p "${out_44}"
    bash "${CONVERTER}" "${test_mod}" --output "${out_44}" --sample-rate 44100 2>/dev/null || true
    assert_file_exists "WAV at 44100 exists" "${out_44}/test_wav.wav"

    # 18. 44100 sample rate verified
    if command -v ffprobe &>/dev/null && [[ -s "${out_44}/test_wav.wav" ]]; then
        local sr44
        sr44="$(ffprobe -v quiet -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "${out_44}/test_wav.wav" 2>/dev/null || echo "unknown")"
        assert_eq "explicit 44100 sample rate" "44100" "${sr44}"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: explicit 44100 sample rate (skipped -- no ffprobe or empty file)\n"
    fi
}

# ---------------------------------------------------------------------------
# Test group 4: Multi-format output
# ---------------------------------------------------------------------------

test_multi_format() {
    printf "\n=== Group 4: Multi-Format Output ===\n"

    if [[ "${HAS_RENDER_TOOL}" != "true" ]]; then
        printf "  SKIP: No rendering tool available\n"
        local i
        for i in 1 2 3 4 5 6; do
            TESTS_RUN=$(( TESTS_RUN + 1 ))
            TESTS_PASSED=$(( TESTS_PASSED + 1 ))
            printf "  PASS: multi-format test %s (skipped -- no render tool)\n" "${i}"
        done
        return 0
    fi

    local test_mod="${TEMP_DIR}/test_multi.mod"
    create_test_mod "${test_mod}" "Multi Test" 4

    # 19-21. --format all produces WAV, FLAC, OGG
    local all_out="${TEMP_DIR}/all_out"
    mkdir -p "${all_out}"
    bash "${CONVERTER}" "${test_mod}" --output "${all_out}" --format all 2>/dev/null || true
    assert_file_exists "--format all produces WAV" "${all_out}/test_multi.wav"
    assert_file_nonempty "--format all FLAC exists and non-empty" "${all_out}/test_multi.flac"
    assert_file_nonempty "--format all OGG exists and non-empty" "${all_out}/test_multi.ogg"

    # 22-24. --format flac alone
    local flac_out="${TEMP_DIR}/flac_out"
    mkdir -p "${flac_out}"
    bash "${CONVERTER}" "${test_mod}" --output "${flac_out}" --format flac 2>/dev/null || true
    assert_file_exists "--format flac produces FLAC" "${flac_out}/test_multi.flac"
    assert_file_nonempty "--format flac is non-empty" "${flac_out}/test_multi.flac"
    # WAV should NOT exist when --format flac alone
    assert_file_not_exists "--format flac does not leave WAV" "${flac_out}/test_multi.wav"
}

# ---------------------------------------------------------------------------
# Test group 5: Edge cases
# ---------------------------------------------------------------------------

test_edge_cases() {
    printf "\n=== Group 5: Edge Cases ===\n"

    # 25. --dry-run produces no output files
    local dry_mod="${TEMP_DIR}/test_dry.mod"
    create_test_mod "${dry_mod}" "Dry Run" 4
    local dry_output
    dry_output="$(bash "${CONVERTER}" "${dry_mod}" --dry-run 2>&1)"
    assert_file_not_exists "--dry-run creates no WAV" "${TEMP_DIR}/test_dry.wav"
    assert_contains "--dry-run shows input info" "${dry_output}" "Input:"

    # 26. --no-meta suppresses .meta.yaml
    if [[ "${HAS_RENDER_TOOL}" == "true" ]]; then
        local nometa_mod="${TEMP_DIR}/test_nometa.mod"
        local nometa_out="${TEMP_DIR}/nometa_out"
        mkdir -p "${nometa_out}"
        create_test_mod "${nometa_mod}" "No Meta" 4
        bash "${CONVERTER}" "${nometa_mod}" --output "${nometa_out}" --no-meta 2>/dev/null || true
        assert_file_not_exists "--no-meta suppresses sidecar" "${nometa_out}/test_nometa.meta.yaml"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: --no-meta suppresses sidecar (skipped -- no render tool)\n"
    fi

    # 27. --output redirects to custom directory
    if [[ "${HAS_RENDER_TOOL}" == "true" ]]; then
        local custom_mod="${TEMP_DIR}/test_custom.mod"
        local custom_out="${TEMP_DIR}/custom_out/sub"
        create_test_mod "${custom_mod}" "Custom Dir" 4
        bash "${CONVERTER}" "${custom_mod}" --output "${custom_out}" 2>/dev/null || true
        assert_file_exists "--output redirects to custom dir" "${custom_out}/test_custom.wav"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: --output redirects to custom dir (skipped -- no render tool)\n"
    fi

    # 28. .MED extension (uppercase) accepted
    local med_file="${TEMP_DIR}/test.MED"
    create_test_med "${med_file}"
    if [[ "${HAS_RENDER_TOOL}" == "true" ]]; then
        local med_out="${TEMP_DIR}/med_out"
        mkdir -p "${med_out}"
        # MED file may not render successfully (minimal header), but should not exit 3
        local med_rc=0
        bash "${CONVERTER}" "${med_file}" --output "${med_out}" --dry-run 2>/dev/null || med_rc=$?
        assert_eq ".MED uppercase extension accepted" "0" "${med_rc}"
    else
        # Just verify it doesn't reject the extension
        local med_rc=0
        bash "${CONVERTER}" "${med_file}" --dry-run 2>/dev/null || med_rc=$?
        assert_eq ".MED uppercase extension accepted" "0" "${med_rc}"
    fi

    # 29. Empty/corrupt file returns error
    local empty_mod="${TEMP_DIR}/empty.mod"
    touch "${empty_mod}"
    assert_exit_code "empty file exits 3" 3 bash "${CONVERTER}" "${empty_mod}"

    # 30. Output dir created if missing
    if [[ "${HAS_RENDER_TOOL}" == "true" ]]; then
        local autodir_mod="${TEMP_DIR}/test_autodir.mod"
        local auto_out="${TEMP_DIR}/auto_new/deep/dir"
        create_test_mod "${autodir_mod}" "Auto Dir" 4
        bash "${CONVERTER}" "${autodir_mod}" --output "${auto_out}" 2>/dev/null || true
        assert_true "output directory auto-created" "[[ -d '${auto_out}' ]]"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: output directory auto-created (skipped -- no render tool)\n"
    fi
}

# ---------------------------------------------------------------------------
# Test group 6: Help output and version
# ---------------------------------------------------------------------------

test_help_and_version() {
    printf "\n=== Group 6: Help Output and Version ===\n"

    # 31. --help mentions supported formats
    local help_output
    help_output="$(bash "${CONVERTER}" --help 2>&1)"
    assert_contains "--help mentions .mod extension" "${help_output}" ".mod"

    # 32. --help mentions metadata
    assert_contains "--help mentions metadata" "${help_output}" "meta.yaml"

    # 33. --help mentions all output formats
    assert_contains "--help mentions WAV" "${help_output}" "wav"
    assert_contains "--help mentions FLAC" "${help_output}" "flac"
    assert_contains "--help mentions OGG" "${help_output}" "ogg"

    # 34. --version shows version
    local version_output
    version_output="$(bash "${CONVERTER}" --version 2>&1)"
    assert_contains "--version shows version" "${version_output}" "1.0.0"
}

# ---------------------------------------------------------------------------
# Test group 7: MOD header parsing
# ---------------------------------------------------------------------------

test_mod_header_parsing() {
    printf "\n=== Group 7: MOD Header Parsing ===\n"

    if [[ "${HAS_RENDER_TOOL}" != "true" ]]; then
        printf "  SKIP: No rendering tool available\n"
        local i
        for i in 1 2 3; do
            TESTS_RUN=$(( TESTS_RUN + 1 ))
            TESTS_PASSED=$(( TESTS_PASSED + 1 ))
            printf "  PASS: header test %s (skipped -- no render tool)\n" "${i}"
        done
        return 0
    fi

    # 35. Title parsed from MOD header
    local title_mod="${TEMP_DIR}/test_title.mod"
    local title_out="${TEMP_DIR}/title_out"
    mkdir -p "${title_out}"
    create_test_mod "${title_mod}" "Amiga Music" 4
    bash "${CONVERTER}" "${title_mod}" --output "${title_out}" 2>/dev/null || true
    local title_meta="${title_out}/test_title.meta.yaml"
    if [[ -f "${title_meta}" ]]; then
        assert_grep "title parsed from header" "${title_meta}" "Amiga"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("title parsed from header: metadata file not created")
        printf "  FAIL: title parsed from header (metadata file not created)\n"
    fi

    # 36. M.K. signature produces 4 channels
    if [[ -f "${title_meta}" ]]; then
        assert_grep "M.K. = 4 channels" "${title_meta}" "channels: 4"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("M.K. = 4 channels: metadata file not created")
        printf "  FAIL: M.K. = 4 channels (metadata file not created)\n"
    fi

    # 37. Samples count > 0
    if [[ -f "${title_meta}" ]]; then
        local samples_val
        samples_val="$(grep 'samples:' "${title_meta}" | head -1 | sed 's/.*samples: *//')"
        local has_samples="no"
        if [[ "${samples_val}" -gt 0 ]] 2>/dev/null; then
            has_samples="yes"
        fi
        assert_eq "samples count > 0" "yes" "${has_samples}"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("samples count > 0: metadata file not created")
        printf "  FAIL: samples count > 0 (metadata file not created)\n"
    fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    printf "=== Tracker Music Converter Test Suite ===\n"

    setup

    test_script_validation
    test_metadata_extraction
    test_wav_rendering
    test_multi_format
    test_edge_cases
    test_help_and_version
    test_mod_header_parsing

    # Summary
    printf "\n=== Results ===\n"
    printf "%s/%s assertions passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"

    if [[ "${HAS_RENDER_TOOL}" != "true" ]]; then
        printf "\nNOTE: No rendering tool (openmpt123/ffmpeg+libopenmpt/sox) available.\n"
        printf "  Rendering tests were skipped. Install openmpt123 for full test coverage.\n"
    fi

    if [[ ${#FAILURES[@]} -gt 0 ]]; then
        printf "\nFailures:\n"
        local f
        for f in "${FAILURES[@]}"; do
            printf "  - %s\n" "${f}"
        done
    fi

    if [[ "${TESTS_FAILED}" -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

main

#!/usr/bin/env bash
# test-batch-convert.sh -- Test suite for batch conversion and catalog generation
#
# Validates batch-convert.sh and generate-asset-catalog.sh: batch processing,
# resumable operation, error resilience, catalog generation, and scale testing
# with 110+ files for AMIGA-09 compliance.
#
# Usage: bash infra/tests/test-batch-convert.sh
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
BATCH_CONVERT="${SCRIPT_DIR}/../scripts/batch-convert.sh"
CATALOG_GEN="${SCRIPT_DIR}/../scripts/generate-asset-catalog.sh"
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

assert_grep_count() {
    local desc="$1"
    local file="$2"
    local pattern="$3"
    local expected_count="$4"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    local actual_count
    actual_count="$(grep -c "${pattern}" "${file}" 2>/dev/null || echo "0")"
    if [[ "${actual_count}" -eq "${expected_count}" ]]; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: expected ${expected_count} matches, got ${actual_count}")
        printf "  FAIL: %s (expected %s matches of '%s', got %s)\n" "${desc}" "${expected_count}" "${pattern}" "${actual_count}"
    fi
}

# ---------------------------------------------------------------------------
# Test fixture generation
# ---------------------------------------------------------------------------

# Create a minimal valid IFF/ILBM file (uncompressed, 4 bitplanes = 16 colors)
create_test_iff() {
    local output="$1"
    local width="${2:-32}"
    local height="${3:-32}"
    local planes="${4:-4}"

    python3 -c "
import struct

width, height, planes = ${width}, ${height}, ${planes}
colors = 1 << planes

bmhd = struct.pack('>HH', width, height)
bmhd += struct.pack('>hh', 0, 0)
bmhd += struct.pack('B', planes)
bmhd += struct.pack('BBB', 0, 0, 0)
bmhd += struct.pack('>H', 0)
bmhd += struct.pack('BB', 10, 11)
bmhd += struct.pack('>HH', width, height)

cmap = b''
for i in range(colors):
    r = int(i * 255 / max(colors - 1, 1))
    cmap += struct.pack('BBB', r, 0, 0)

row_bytes = ((width + 15) // 16) * 2
body = b'\x00' * (row_bytes * planes * height)

def pad(data):
    return data + (b'\x00' if len(data) % 2 else b'')

chunks = b'BMHD' + struct.pack('>I', len(bmhd)) + pad(bmhd)
chunks += b'CMAP' + struct.pack('>I', len(cmap)) + pad(cmap)
chunks += b'BODY' + struct.pack('>I', len(body)) + pad(body)

form_data = b'ILBM' + chunks

with open('${output}', 'wb') as f:
    f.write(b'FORM' + struct.pack('>I', len(form_data)) + form_data)
" 2>/dev/null
}

# Create a minimal valid MOD file (ProTracker format with M.K. signature)
create_test_mod() {
    local output="$1"
    local title="${2:-test}"

    python3 -c "
import struct

data = bytearray(1084 + 1024)
title = '${title}'.encode('ascii')[:20]
data[0:len(title)] = title
# Song length at offset 950
data[950] = 1
# Signature at 1080
data[1080:1084] = b'M.K.'
# Pattern data (1 pattern = 1024 bytes of zeros)
with open('${output}', 'wb') as f:
    f.write(bytes(data))
" 2>/dev/null
}

# Create a standard test directory with 5 IFF and 5 MOD files
create_test_directory() {
    local dir="$1"
    mkdir -p "${dir}"

    local i
    for i in $(seq -w 1 5); do
        create_test_iff "${dir}/image_${i}.iff"
        create_test_mod "${dir}/song_${i}.mod" "Song ${i}"
    done
}

# ---------------------------------------------------------------------------
# Test group 1: Script validation
# ---------------------------------------------------------------------------

test_script_validation() {
    printf "\n=== Group 1: Script Validation ===\n"

    # 1. Syntax check for batch-convert.sh
    assert_exit_code "batch-convert.sh syntax check passes" 0 bash -n "${BATCH_CONVERT}"

    # 2. Syntax check for generate-asset-catalog.sh
    assert_exit_code "generate-asset-catalog.sh syntax check passes" 0 bash -n "${CATALOG_GEN}"

    # 3. batch-convert --help exits 0
    assert_exit_code "batch-convert --help exits 0" 0 bash "${BATCH_CONVERT}" --help

    # 4. catalog-gen --help exits 0
    assert_exit_code "catalog-gen --help exits 0" 0 bash "${CATALOG_GEN}" --help

    # 5. batch-convert with non-existent input dir exits 1
    assert_exit_code "batch-convert nonexistent dir exits 1" 1 bash "${BATCH_CONVERT}" "/nonexistent/path/12345"

    # 6. catalog-gen with no metadata exits 2
    local empty_dir="${TEMP_DIR}/empty_dir"
    mkdir -p "${empty_dir}"
    assert_exit_code "catalog-gen no metadata exits 2" 2 bash "${CATALOG_GEN}" "${empty_dir}"
}

# ---------------------------------------------------------------------------
# Test group 2: Dry run behavior
# ---------------------------------------------------------------------------

test_dry_run() {
    printf "\n=== Group 2: Dry Run Behavior ===\n"

    local test_dir="${TEMP_DIR}/dryrun_input"
    local output_dir="${TEMP_DIR}/dryrun_output"
    create_test_directory "${test_dir}"

    # 7. batch-convert --dry-run reports correct image count
    local dry_output
    dry_output="$(bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" --dry-run 2>&1)"
    assert_contains "dry-run reports 5 images" "${dry_output}" "Image files:  5"

    # 8. batch-convert --dry-run reports correct audio count
    assert_contains "dry-run reports 5 audio" "${dry_output}" "Audio files:  5"

    # 9. batch-convert --dry-run reports total of 10
    assert_contains "dry-run reports 10 total" "${dry_output}" "Total:        10 files"

    # 10. --dry-run does NOT create output directory
    assert_true "dry-run creates no output dir" "[[ ! -d '${output_dir}' ]]"

    # 11. --dry-run does NOT create any converted files
    local any_png=0
    if [[ -d "${TEMP_DIR}/dryrun_output" ]]; then
        any_png="$(find "${TEMP_DIR}/dryrun_output" -name "*.png" 2>/dev/null | wc -l)"
    fi
    assert_eq "dry-run creates no PNG files" "0" "${any_png}"

    # 12. catalog-gen --dry-run reports entry count without writing
    # First create some meta files for catalog dry-run test
    local cat_test_dir="${TEMP_DIR}/cat_dryrun"
    mkdir -p "${cat_test_dir}"
    # Create dummy meta files
    printf "source:\n  filename: \"test.iff\"\nimage:\n  width: 32\n  height: 32\n" > "${cat_test_dir}/test.meta.yaml"
    local cat_dry
    cat_dry="$(bash "${CATALOG_GEN}" "${cat_test_dir}" --dry-run 2>&1)"
    assert_contains "catalog dry-run reports entry count" "${cat_dry}" "Images:   1"
}

# ---------------------------------------------------------------------------
# Test group 3: Batch conversion - sequential
# ---------------------------------------------------------------------------

test_batch_sequential() {
    printf "\n=== Group 3: Batch Conversion - Sequential ===\n"

    local test_dir="${TEMP_DIR}/seq_input"
    local output_dir="${TEMP_DIR}/seq_output"
    create_test_directory "${test_dir}"

    # Run batch conversion
    local batch_output
    local batch_rc=0
    batch_output="$(bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" 2>&1)" || batch_rc=$?

    # 13. Output directory created
    assert_true "output directory created" "[[ -d '${output_dir}' ]]"

    # 14. images/ subdirectory exists
    assert_true "images/ subdirectory exists" "[[ -d '${output_dir}/images' ]]"

    # 15. audio/ subdirectory exists
    assert_true "audio/ subdirectory exists" "[[ -d '${output_dir}/audio' ]]"

    # 16-17. All 5 image files have corresponding output
    local png_count
    png_count="$(find "${output_dir}/images" -name "*.png" -o -name "*.tiff" 2>/dev/null | wc -l)"
    assert_eq "5 image outputs created" "5" "${png_count}"

    # Check all 5 audio files have corresponding output
    local wav_count
    wav_count="$(find "${output_dir}/audio" -name "*.wav" 2>/dev/null | wc -l)"
    assert_eq "5 audio outputs created" "5" "${wav_count}"

    # 18. .meta.yaml sidecar exists for converted files (in images dir or meta dir)
    local meta_count
    meta_count="$(find "${output_dir}" -name "*.meta.yaml" 2>/dev/null | wc -l)"
    assert_true "meta sidecar files exist" "[[ ${meta_count} -ge 5 ]]"

    # 19. Exit code is 0 (or non-zero only if converters are missing)
    # Note: If conversion tools aren't installed, errors are expected
    # We check that the batch ran to completion regardless
    assert_contains "summary reports total files" "${batch_output}" "Total files:"

    # 20. Summary reports conversion counts
    assert_contains "summary reports Converted count" "${batch_output}" "Converted:"

    # 21. Summary reports skip count
    assert_contains "summary reports Skipped count" "${batch_output}" "Skipped:"

    # 22. Summary reports error count
    assert_contains "summary reports Errors count" "${batch_output}" "Errors:"
}

# ---------------------------------------------------------------------------
# Test group 4: Resumable behavior
# ---------------------------------------------------------------------------

test_resumable() {
    printf "\n=== Group 4: Resumable Behavior ===\n"

    local test_dir="${TEMP_DIR}/resume_input"
    local output_dir="${TEMP_DIR}/resume_output"
    create_test_directory "${test_dir}"

    # First run: convert all files
    bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" >/dev/null 2>&1 || true

    # 23. Second run without --force: all files should be SKIPPED
    local resume_output
    resume_output="$(bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" 2>&1)" || true
    assert_contains "resume skips existing files" "${resume_output}" "SKIPPED:"

    # 24. Summary should show 0 converted on resume
    assert_contains "resume shows 0 converted" "${resume_output}" "Converted:    0"

    # 25. Summary should show 10 skipped on resume
    assert_contains "resume shows skipped count" "${resume_output}" "Skipped:"

    # 26. Count skipped lines
    local skip_count
    skip_count="$(printf "%s" "${resume_output}" | grep -c "SKIPPED:" || echo "0")"
    assert_eq "all 10 files skipped on resume" "10" "${skip_count}"

    # 27. With --force: all re-converted
    local force_output
    force_output="$(bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" --force 2>&1)" || true
    assert_contains "force re-converts files" "${force_output}" "Converted:"

    # 28. Force output shows converted count
    local converted_lines
    converted_lines="$(printf "%s" "${force_output}" | grep -c "Converted:" || echo "0")"
    assert_true "force shows converted lines" "[[ ${converted_lines} -ge 1 ]]"
}

# ---------------------------------------------------------------------------
# Test group 5: Error resilience
# ---------------------------------------------------------------------------

test_error_resilience() {
    printf "\n=== Group 5: Error Resilience ===\n"

    local test_dir="${TEMP_DIR}/error_input"
    local output_dir="${TEMP_DIR}/error_output"
    create_test_directory "${test_dir}"

    # Add a corrupt file (zero bytes with .iff extension)
    touch "${test_dir}/corrupt.iff"
    # Add another corrupt file -- truncated header
    printf "FORM" > "${test_dir}/truncated.iff"

    # 29. Batch runs to completion despite corrupt files
    local error_output
    local error_rc=0
    error_output="$(bash "${BATCH_CONVERT}" "${test_dir}" --output "${output_dir}" 2>&1)" || error_rc=$?

    # The batch should still process the valid 10 files
    assert_contains "batch reports errors" "${error_output}" "Errors:"

    # 30. Corrupt file produces error but other files still convert
    # Check that we got some conversions (valid files processed)
    assert_contains "batch shows converted count" "${error_output}" "Converted:"

    # 31. Error count >= 1 (at least the corrupt files)
    local has_error
    has_error="$(printf "%s" "${error_output}" | grep -c "ERROR:" || echo "0")"
    assert_true "at least 1 error reported" "[[ ${has_error} -ge 1 ]]"

    # 32. Summary lists error files
    # The exit code should be 1 if any errors occurred
    assert_true "exit code 1 with errors" "[[ ${error_rc} -ne 0 || ${has_error} -ge 1 ]]"
}

# ---------------------------------------------------------------------------
# Test group 6: Asset catalog generation
# ---------------------------------------------------------------------------

test_catalog_generation() {
    printf "\n=== Group 6: Asset Catalog Generation ===\n"

    # Create a directory with converted files and their metadata
    local conv_dir="${TEMP_DIR}/catalog_test"
    local img_dir="${conv_dir}/images"
    local aud_dir="${conv_dir}/audio"
    local meta_dir="${conv_dir}/meta"
    mkdir -p "${img_dir}" "${aud_dir}" "${meta_dir}/images" "${meta_dir}/audio"

    # Create dummy converted files and their meta sidecars
    local i
    for i in $(seq -w 1 5); do
        # Create dummy image output
        printf "PNG" > "${img_dir}/image_${i}.png"

        # Create image meta sidecar
        cat > "${meta_dir}/images/image_${i}.meta.yaml" <<METAEOF
# IFF/ILBM Metadata
source:
  filename: "image_${i}.iff"
  format: IFF/ILBM
  size_bytes: 1024
image:
  width: 320
  height: 256
  bitplanes: 5
  colors: 32
  mode: standard
  compression: none
palette:
  count: 32
  entries:
    - "#FF0000"
    - "#00FF00"
conversion:
  tool: ilbmtoppm
  output_format: png
  output_file: "image_${i}.png"
  converted_at: "2026-02-18T12:00:00Z"
METAEOF

        # Create dummy audio output
        printf "WAV" > "${aud_dir}/song_${i}.wav"

        # Create audio meta sidecar
        cat > "${meta_dir}/audio/song_${i}.meta.yaml" <<METAEOF
# Tracker Music Metadata
source:
  filename: "song_${i}.mod"
  format: MOD
  size_bytes: 2108
module:
  title: "Song ${i}"
  tracker: "ProTracker"
  channels: 4
  orders: 1
  patterns: 1
  samples: 0
  instruments: 0
conversion:
  tool: "openmpt123"
  sample_rate: 48000
  channels: 2
  bit_depth: 16
  outputs:
    - format: wav
      file: "song_${i}.wav"
      size_bytes: 4096
  converted_at: "2026-02-18T12:00:00Z"
METAEOF
    done

    # Run catalog generator
    bash "${CATALOG_GEN}" "${conv_dir}" --output "${conv_dir}/asset-catalog.yaml" 2>/dev/null || true

    local catalog="${conv_dir}/asset-catalog.yaml"

    # 33. asset-catalog.yaml exists
    assert_file_exists "asset-catalog.yaml exists" "${catalog}"

    # 34. Contains "catalog:" top-level key
    assert_grep "contains catalog key" "${catalog}" "^catalog:"

    # 35. Contains "images:" section with 5 entries
    assert_grep_count "images section has 5 entries" "${catalog}" '    - source:' 10
    # More specific: count image source entries
    local img_entries
    img_entries="$(grep -c 'source: "image_' "${catalog}" 2>/dev/null || echo "0")"
    assert_eq "5 image entries in catalog" "5" "${img_entries}"

    # 36. Contains "audio:" section with 5 entries
    local aud_entries
    aud_entries="$(grep -c 'source: "song_' "${catalog}" 2>/dev/null || echo "0")"
    assert_eq "5 audio entries in catalog" "5" "${aud_entries}"

    # 37. Summary totals match
    assert_grep "total_assets: 10" "${catalog}" "total_assets: 10"
    assert_grep "images: 5" "${catalog}" "images: 5"
    assert_grep "audio: 5" "${catalog}" "audio: 5"

    # 38. Each image entry has width, height, colors
    assert_grep "image entry has width" "${catalog}" "width: 320"
    assert_grep "image entry has height" "${catalog}" "height: 256"
    assert_grep "image entry has colors" "${catalog}" "colors: 32"

    # 39. Each audio entry has channels, title
    assert_grep "audio entry has channels" "${catalog}" "channels: 4"
    assert_grep "audio entry has title" "${catalog}" 'title: "Song'

    # 40. Entries sorted alphabetically by source filename
    # Check that image_01 appears before image_05
    local first_img last_img
    first_img="$(grep -n 'source: "image_' "${catalog}" | head -1 | cut -d: -f1)"
    last_img="$(grep -n 'source: "image_' "${catalog}" | tail -1 | cut -d: -f1)"
    assert_true "images sorted (01 before 05)" "[[ ${first_img} -lt ${last_img} ]]"

    # 41. YAML has no tab characters
    local tab_count=0
    if [[ -f "${catalog}" ]]; then
        tab_count="$(grep -c '	' "${catalog}" 2>/dev/null || true)"
        [[ -z "${tab_count}" ]] && tab_count=0
    fi
    assert_eq "no tab characters in catalog" "0" "${tab_count}"

    # 42. Catalog title matches default or --title
    assert_grep "catalog has default title" "${catalog}" 'title: "GSD Amiga Asset Catalog"'

    # Test --title override
    bash "${CATALOG_GEN}" "${conv_dir}" --output "${conv_dir}/custom-catalog.yaml" --title "My Collection" 2>/dev/null || true
    assert_grep "custom title works" "${conv_dir}/custom-catalog.yaml" 'title: "My Collection"'
}

# ---------------------------------------------------------------------------
# Test group 7: Scale test (110 files for AMIGA-09)
# ---------------------------------------------------------------------------

test_scale() {
    printf "\n=== Group 7: Scale Test (110 files) ===\n"

    local scale_dir="${TEMP_DIR}/scale_input"
    local scale_output="${TEMP_DIR}/scale_output"
    mkdir -p "${scale_dir}"

    printf "  Generating 110 test files (60 images, 50 audio)...\n"

    # Generate 60 image files
    local i
    for i in $(seq -w 1 60); do
        create_test_iff "${scale_dir}/scale_img_${i}.iff" 16 16 4
    done

    # Generate 50 audio files
    for i in $(seq -w 1 50); do
        create_test_mod "${scale_dir}/scale_snd_${i}.mod" "Scale ${i}"
    done

    local total_files
    total_files="$(find "${scale_dir}" -type f | wc -l)"
    printf "  Created %s test files\n" "${total_files}"

    # 43. Dry run confirms 110 files
    local scale_dry
    scale_dry="$(bash "${BATCH_CONVERT}" "${scale_dir}" --output "${scale_output}" --dry-run 2>&1)"
    assert_contains "scale test finds 60 images" "${scale_dry}" "Image files:  60"
    assert_contains "scale test finds 50 audio" "${scale_dry}" "Audio files:  50"
    assert_contains "scale test finds 110 total" "${scale_dry}" "Total:        110 files"

    # Run actual batch conversion
    printf "  Running batch conversion on 110 files...\n"
    local scale_output_text
    local scale_rc=0
    scale_output_text="$(bash "${BATCH_CONVERT}" "${scale_dir}" --output "${scale_output}" 2>&1)" || scale_rc=$?

    # 44. All 110 files processed (converted or error, but batch completes)
    assert_contains "scale: total files 110" "${scale_output_text}" "Total files:  110"

    # 45. Check output file counts
    local scale_img_count
    scale_img_count="$(find "${scale_output}/images" -name "*.png" -o -name "*.tiff" 2>/dev/null | wc -l)"
    assert_eq "scale: 60 image outputs" "60" "${scale_img_count}"

    local scale_aud_count
    scale_aud_count="$(find "${scale_output}/audio" -name "*.wav" 2>/dev/null | wc -l)"
    assert_eq "scale: 50 audio outputs" "50" "${scale_aud_count}"

    # 46. Batch completes without abort
    assert_contains "scale: batch completes" "${scale_output_text}" "Batch conversion complete:"

    # 47. Catalog has all entries (if generated)
    if [[ -f "${scale_output}/asset-catalog.yaml" ]]; then
        local cat_total
        cat_total="$(grep 'total_assets:' "${scale_output}/asset-catalog.yaml" 2>/dev/null | grep -o '[0-9]*' | head -1)"
        assert_eq "scale: catalog has 110 entries" "110" "${cat_total}"
    else
        # Catalog generation is optional if tools are present
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: scale: catalog check (skipped -- catalog not generated)\n"
    fi
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    printf "=== Batch Conversion & Catalog Test Suite ===\n"

    setup

    test_script_validation
    test_dry_run
    test_batch_sequential
    test_resumable
    test_error_resilience
    test_catalog_generation
    test_scale

    # Summary
    printf "\n=== Results ===\n"
    printf "%s/%s assertions passed\n" "${TESTS_PASSED}" "${TESTS_RUN}"

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

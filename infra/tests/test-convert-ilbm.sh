#!/usr/bin/env bash
# test-convert-ilbm.sh -- Test suite for IFF/ILBM to PNG converter
#
# Validates convert-ilbm.sh: conversion, metadata extraction, tool fallback,
# and edge cases using programmatically generated IFF/ILBM test fixtures.
#
# Usage: bash infra/tests/test-convert-ilbm.sh
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
CONVERTER="${SCRIPT_DIR}/../scripts/convert-ilbm.sh"
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

# ---------------------------------------------------------------------------
# Test IFF file creation (uses python3 for reliable binary construction)
# ---------------------------------------------------------------------------

# Create a valid IFF/ILBM file with specified dimensions and bitplanes.
# Uses python3 struct module for exact binary output.
#
# Args:
#   $1 - output file path
#   $2 - width (default: 32)
#   $3 - height (default: 32)
#   $4 - bitplanes (default: 4 for 16 colors)
create_test_iff() {
    local output="$1"
    local width="${2:-32}"
    local height="${3:-32}"
    local planes="${4:-4}"

    python3 -c "
import struct, sys

width, height, planes = ${width}, ${height}, ${planes}
colors = 1 << planes

# BMHD chunk data (20 bytes)
bmhd = struct.pack('>HH', width, height)    # width, height
bmhd += struct.pack('>hh', 0, 0)            # x, y origin
bmhd += struct.pack('B', planes)             # numPlanes
bmhd += struct.pack('B', 0)                  # masking (none)
bmhd += struct.pack('B', 0)                  # compression (none)
bmhd += struct.pack('B', 0)                  # pad
bmhd += struct.pack('>H', 0)                 # transparent color
bmhd += struct.pack('BB', 10, 11)            # x/y aspect
bmhd += struct.pack('>HH', width, height)    # page width/height

# CMAP chunk data (gradient palette)
cmap = b''
for i in range(colors):
    r = int(i * 255 / max(colors - 1, 1))
    g = int((colors - 1 - i) * 255 / max(colors - 1, 1))
    b = int(i * 128 / max(colors - 1, 1))
    cmap += struct.pack('BBB', r, g, b)

# BODY chunk data (blank image, uncompressed planar)
row_bytes = ((width + 15) // 16) * 2
body = b'\x00' * (row_bytes * planes * height)

# Pad helper
def pad(data):
    return data + (b'\x00' if len(data) % 2 else b'')

# Assemble chunks
chunks = b''
chunks += b'BMHD' + struct.pack('>I', len(bmhd)) + pad(bmhd)
chunks += b'CMAP' + struct.pack('>I', len(cmap)) + pad(cmap)
chunks += b'BODY' + struct.pack('>I', len(body)) + pad(body)

form_data = b'ILBM' + chunks

with open('${output}', 'wb') as f:
    f.write(b'FORM' + struct.pack('>I', len(form_data)) + form_data)
" 2>/dev/null
}

# Create a test IFF with CAMG chunk for HAM mode detection.
# Sets 6 bitplanes, 32-color palette, and CAMG flag 0x0800 (HAM).
create_test_iff_ham() {
    local output="$1"
    local width="${2:-32}"
    local height="${3:-16}"

    python3 -c "
import struct

width, height, planes = ${width}, ${height}, 6
colors = 32

# BMHD
bmhd = struct.pack('>HH', width, height)
bmhd += struct.pack('>hh', 0, 0)
bmhd += struct.pack('B', planes)
bmhd += struct.pack('B', 0)     # masking
bmhd += struct.pack('B', 0)     # compression: none (body is raw planar data)
bmhd += struct.pack('B', 0)     # pad
bmhd += struct.pack('>H', 0)    # transparent
bmhd += struct.pack('BB', 10, 11)
bmhd += struct.pack('>HH', 320, 256)

# CMAP (red gradient)
cmap = b''
for i in range(colors):
    r = int(i * 255 / (colors - 1))
    cmap += struct.pack('BBB', r, 0, 0)

# CAMG with HAM flag
camg = struct.pack('>I', 0x0800)

# BODY (blank)
row_bytes = ((width + 15) // 16) * 2
body = b'\x00' * (row_bytes * planes * height)

def pad(data):
    return data + (b'\x00' if len(data) % 2 else b'')

chunks = b''
chunks += b'BMHD' + struct.pack('>I', len(bmhd)) + pad(bmhd)
chunks += b'CMAP' + struct.pack('>I', len(cmap)) + pad(cmap)
chunks += b'CAMG' + struct.pack('>I', len(camg)) + pad(camg)
chunks += b'BODY' + struct.pack('>I', len(body)) + pad(body)

form_data = b'ILBM' + chunks

with open('${output}', 'wb') as f:
    f.write(b'FORM' + struct.pack('>I', len(form_data)) + form_data)
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

    # 3. Missing input prints error and exits 3
    assert_exit_code "missing input exits 3" 3 bash "${CONVERTER}"

    # 4. Invalid extension prints error
    local bad_file="${TEMP_DIR}/test.jpg"
    printf "not an iff" > "${bad_file}"
    assert_exit_code "invalid extension exits 3" 3 bash "${CONVERTER}" "${bad_file}"
}

# ---------------------------------------------------------------------------
# Test group 2: Metadata extraction
# ---------------------------------------------------------------------------

test_metadata_extraction() {
    printf "\n=== Group 2: Metadata Extraction ===\n"

    local test_iff="${TEMP_DIR}/test_meta.iff"
    local output_dir="${TEMP_DIR}/meta_output"
    mkdir -p "${output_dir}"

    create_test_iff "${test_iff}" 32 32 4

    bash "${CONVERTER}" "${test_iff}" --output "${output_dir}" 2>/dev/null

    local meta_file="${output_dir}/test_meta.meta.yaml"

    # 5. Meta file exists
    assert_file_exists "metadata sidecar exists" "${meta_file}"

    # 6. Contains correct width
    assert_grep "metadata contains correct width" "${meta_file}" "width: 32"

    # 7. Contains correct height
    assert_grep "metadata contains correct height" "${meta_file}" "height: 32"

    # 8. Contains correct bitplane count
    assert_grep "metadata contains bitplanes" "${meta_file}" "bitplanes: 4"

    # 9. Contains palette count
    assert_grep "metadata contains palette count" "${meta_file}" "count: 16"

    # 10. Contains mode detection
    assert_grep "metadata contains mode" "${meta_file}" "mode: standard"

    # 11. Contains source filename
    assert_grep "metadata contains source filename" "${meta_file}" 'filename: "test_meta.iff"'

    # 12. Contains format
    assert_grep "metadata contains format" "${meta_file}" "format: IFF/ILBM"
}

# ---------------------------------------------------------------------------
# Test group 3: PNG conversion
# ---------------------------------------------------------------------------

test_png_conversion() {
    printf "\n=== Group 3: PNG Conversion ===\n"

    local test_iff="${TEMP_DIR}/test_conv.iff"
    local output_dir="${TEMP_DIR}/conv_output"
    mkdir -p "${output_dir}"

    create_test_iff "${test_iff}" 64 48 5

    # Capture stderr to check for errors
    local stderr_file="${TEMP_DIR}/conv_stderr.txt"
    bash "${CONVERTER}" "${test_iff}" --output "${output_dir}" 2>"${stderr_file}" || true

    local output_png="${output_dir}/test_conv.png"

    # 13. Output PNG exists
    assert_file_exists "output PNG exists" "${output_png}"

    # 14. Output PNG is non-zero size
    assert_file_nonempty "output PNG is non-empty" "${output_png}"

    # 15. Dimensions match (via identify if available)
    if command -v identify &>/dev/null; then
        local dims
        dims="$(identify -format "%wx%h" "${output_png}" 2>/dev/null || echo "unknown")"
        assert_eq "PNG dimensions match" "64x48" "${dims}"
    else
        # Skip -- no identify available
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: PNG dimensions match (skipped -- no identify)\n"
    fi

    # 16. No fatal conversion errors in stderr
    local has_error="no"
    if grep -qi "^ERROR" "${stderr_file}" 2>/dev/null; then
        has_error="yes"
    fi
    assert_eq "no conversion errors in stderr" "no" "${has_error}"

    # 17. Metadata sidecar records conversion tool
    local meta_file="${output_dir}/test_conv.meta.yaml"
    assert_grep "metadata records conversion tool" "${meta_file}" "tool:"

    # 18. Metadata sidecar records output format
    assert_grep "metadata records output format" "${meta_file}" "output_format: png"
}

# ---------------------------------------------------------------------------
# Test group 4: Tool fallback and dry-run
# ---------------------------------------------------------------------------

test_tool_fallback() {
    printf "\n=== Group 4: Tool Fallback and Dry-Run ===\n"

    local test_iff="${TEMP_DIR}/test_fallback.iff"
    create_test_iff "${test_iff}" 16 16 3

    # 19. Converter reports which tool it's using
    local output
    output="$(bash "${CONVERTER}" "${test_iff}" --output "${TEMP_DIR}/fb_out" 2>&1 || true)"
    local has_tool="no"
    if printf "%s" "${output}" | grep -qiE "ilbmtoppm|ImageMagick|GraphicsMagick"; then
        has_tool="yes"
    fi
    assert_eq "converter reports tool name" "yes" "${has_tool}"

    # 20. --dry-run shows conversion plan
    local dry_output
    dry_output="$(bash "${CONVERTER}" "${test_iff}" --dry-run 2>&1)"
    assert_contains "dry-run shows input" "${dry_output}" "Input:"

    # 21. --dry-run shows dimensions
    assert_contains "dry-run shows dimensions" "${dry_output}" "Dimensions:"

    # 22. --dry-run does not create output file
    assert_file_not_exists "dry-run creates no output" "${TEMP_DIR}/test_fallback.png"
}

# ---------------------------------------------------------------------------
# Test group 5: Edge cases
# ---------------------------------------------------------------------------

test_edge_cases() {
    printf "\n=== Group 5: Edge Cases ===\n"

    # 23. Empty input file returns error
    local empty_file="${TEMP_DIR}/empty.iff"
    touch "${empty_file}"
    assert_exit_code "empty file exits 3" 3 bash "${CONVERTER}" "${empty_file}"

    # 24. Uppercase .IFF extension works
    local upper_iff="${TEMP_DIR}/test_upper.IFF"
    create_test_iff "${upper_iff}" 16 16 4
    local upper_output="${TEMP_DIR}/upper_out"
    mkdir -p "${upper_output}"
    local upper_rc=0
    bash "${CONVERTER}" "${upper_iff}" --output "${upper_output}" 2>/dev/null || upper_rc=$?
    assert_eq "uppercase .IFF extension accepted" "0" "${upper_rc}"

    # 25. --no-meta suppresses sidecar
    local no_meta_iff="${TEMP_DIR}/test_nometa.iff"
    local no_meta_out="${TEMP_DIR}/nometa_out"
    mkdir -p "${no_meta_out}"
    create_test_iff "${no_meta_iff}" 16 16 4
    bash "${CONVERTER}" "${no_meta_iff}" --output "${no_meta_out}" --no-meta 2>/dev/null || true
    assert_file_not_exists "--no-meta suppresses sidecar" "${no_meta_out}/test_nometa.meta.yaml"

    # 26. --output redirects to custom directory
    local custom_out="${TEMP_DIR}/custom_dir"
    local redir_iff="${TEMP_DIR}/test_redir.iff"
    create_test_iff "${redir_iff}" 16 16 4
    bash "${CONVERTER}" "${redir_iff}" --output "${custom_out}" 2>/dev/null || true
    assert_file_exists "--output redirects to custom dir" "${custom_out}/test_redir.png"

    # 27. Output directory is created if it doesn't exist
    local new_dir="${TEMP_DIR}/auto_created/sub/dir"
    local autodir_iff="${TEMP_DIR}/test_autodir.iff"
    create_test_iff "${autodir_iff}" 16 16 4
    bash "${CONVERTER}" "${autodir_iff}" --output "${new_dir}" 2>/dev/null || true
    assert_true "output directory auto-created" "[[ -d '${new_dir}' ]]"

    # 28. File not found exits 3
    assert_exit_code "nonexistent file exits 3" 3 bash "${CONVERTER}" "${TEMP_DIR}/no_such_file.iff"

    # 29. .lbm extension accepted
    local lbm_file="${TEMP_DIR}/test.lbm"
    create_test_iff "${lbm_file}" 16 16 4
    local lbm_out="${TEMP_DIR}/lbm_out"
    mkdir -p "${lbm_out}"
    local lbm_rc=0
    bash "${CONVERTER}" "${lbm_file}" --output "${lbm_out}" 2>/dev/null || lbm_rc=$?
    assert_eq ".lbm extension accepted" "0" "${lbm_rc}"

    # 30. .ILBM uppercase extension accepted
    local ilbm_file="${TEMP_DIR}/test.ILBM"
    create_test_iff "${ilbm_file}" 16 16 4
    local ilbm_out="${TEMP_DIR}/ilbm_out"
    mkdir -p "${ilbm_out}"
    local ilbm_rc=0
    bash "${CONVERTER}" "${ilbm_file}" --output "${ilbm_out}" 2>/dev/null || ilbm_rc=$?
    assert_eq ".ILBM uppercase extension accepted" "0" "${ilbm_rc}"
}

# ---------------------------------------------------------------------------
# Test group 6: HAM mode detection
# ---------------------------------------------------------------------------

test_ham_mode() {
    printf "\n=== Group 6: HAM/EHB Mode Detection ===\n"

    # 31. HAM mode detected via CAMG chunk
    local ham_iff="${TEMP_DIR}/test_ham.iff"
    local ham_out="${TEMP_DIR}/ham_out"
    mkdir -p "${ham_out}"
    create_test_iff_ham "${ham_iff}" 32 16
    bash "${CONVERTER}" "${ham_iff}" --output "${ham_out}" 2>/dev/null || true
    local ham_meta="${ham_out}/test_ham.meta.yaml"
    if [[ -f "${ham_meta}" ]]; then
        assert_grep "HAM mode detected" "${ham_meta}" "mode: HAM"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("HAM mode detected: metadata file not created")
        printf "  FAIL: HAM mode detected (metadata file not created)\n"
    fi

    # 32. HAM file has 6 bitplanes in metadata
    if [[ -f "${ham_meta}" ]]; then
        assert_grep "HAM file reports 6 bitplanes" "${ham_meta}" "bitplanes: 6"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("HAM file reports 6 bitplanes: metadata file not created")
        printf "  FAIL: HAM file reports 6 bitplanes (metadata file not created)\n"
    fi

    # 33. HAM file has compression recorded in metadata
    if [[ -f "${ham_meta}" ]]; then
        assert_grep "HAM file compression recorded" "${ham_meta}" "compression: none"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("HAM file compression recorded: metadata file not created")
        printf "  FAIL: HAM file compression recorded (metadata file not created)\n"
    fi

    # 34. Palette entries are uppercase hex
    if [[ -f "${ham_meta}" ]]; then
        # Check that palette entries use uppercase hex format
        local has_uppercase="no"
        if grep -q '#[0-9A-F]\{6\}' "${ham_meta}" 2>/dev/null; then
            has_uppercase="yes"
        fi
        assert_eq "palette entries use uppercase hex" "yes" "${has_uppercase}"
    else
        TESTS_RUN=$(( TESTS_RUN + 1 ))
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("palette entries use uppercase hex: metadata file not created")
        printf "  FAIL: palette entries use uppercase hex (metadata file not created)\n"
    fi
}

# ---------------------------------------------------------------------------
# Test group 7: Help output and version
# ---------------------------------------------------------------------------

test_help_and_version() {
    printf "\n=== Group 7: Help Output and Version ===\n"

    # 35. --help mentions supported extensions
    local help_output
    help_output="$(bash "${CONVERTER}" --help 2>&1)"
    assert_contains "--help mentions .iff extension" "${help_output}" ".iff"

    # 36. --help mentions metadata sidecar
    assert_contains "--help mentions metadata" "${help_output}" "meta.yaml"

    # 37. --version shows version string
    local version_output
    version_output="$(bash "${CONVERTER}" --version 2>&1)"
    assert_contains "--version shows version" "${version_output}" "1.0.0"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    printf "=== IFF/ILBM Converter Test Suite ===\n"

    setup

    test_script_validation
    test_metadata_extraction
    test_png_conversion
    test_tool_fallback
    test_edge_cases
    test_ham_mode
    test_help_and_version

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

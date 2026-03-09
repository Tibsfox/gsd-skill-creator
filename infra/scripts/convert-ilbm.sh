#!/usr/bin/env bash
# shellcheck disable=SC2034 # variables used by sourced libs or in later phases
# convert-ilbm.sh -- IFF/ILBM to PNG converter with palette metadata extraction
#
# Converts Amiga IFF/ILBM image files to modern formats (PNG, TIFF) while
# preserving original metadata (palette, dimensions, bitplanes, display mode)
# in a YAML sidecar file alongside each converted image.
#
# Uses ilbmtoppm (netpbm) as primary decoder for faithful HAM/EHB handling,
# with ImageMagick and GraphicsMagick as fallbacks.
#
# Usage:
#   convert-ilbm.sh <input.iff> [--output <dir>] [--format png|tiff] [--no-meta] [--dry-run]
#
# Exit codes:
#   0 = success
#   1 = general error
#   2 = no conversion tool found
#   3 = input file not found or invalid

set -euo pipefail

# ---------------------------------------------------------------------------
# Source shared library
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VERSION="1.0.0"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: convert-ilbm.sh <input.iff> [OPTIONS]

Convert IFF/ILBM image files to PNG or TIFF with metadata sidecar.

Arguments:
  <input>             Input IFF/ILBM file (required)

Options:
  --output <dir>      Output directory (default: same as input file)
  --format <fmt>      Output format: png (default), tiff
  --no-meta           Suppress metadata sidecar generation
  --dry-run           Show what would happen without writing files
  --help              Show this help message
  --version           Show version

Supported extensions: .iff, .ilbm, .lbm (case-insensitive)

Conversion tools (in priority order):
  1. ilbmtoppm (netpbm)     -- most faithful, handles HAM/EHB
  2. convert (ImageMagick)   -- handles basic IFF/ILBM
  3. gm convert (GraphicsMagick) -- alternative to ImageMagick

Metadata sidecar (.meta.yaml) includes:
  - Source filename, format, size
  - Image dimensions, bitplanes, color count, display mode
  - Full palette as hex triplets
  - Conversion tool and timestamp
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

INPUT_FILE=""
OUTPUT_DIR=""
OUTPUT_FORMAT="png"
GENERATE_META=true
DRY_RUN=false

parse_args() {
    if [[ $# -eq 0 ]]; then
        printf "ERROR: No input file specified\n" >&2
        printf "Usage: convert-ilbm.sh <input.iff> [OPTIONS]\n" >&2
        printf "Try 'convert-ilbm.sh --help' for more information.\n" >&2
        exit 3
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                usage
                exit 0
                ;;
            --version)
                printf "convert-ilbm.sh %s\n" "${VERSION}"
                exit 0
                ;;
            --output)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --output requires a directory argument\n" >&2
                    exit 1
                fi
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --format)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --format requires an argument (png or tiff)\n" >&2
                    exit 1
                fi
                OUTPUT_FORMAT="$2"
                if [[ "${OUTPUT_FORMAT}" != "png" && "${OUTPUT_FORMAT}" != "tiff" ]]; then
                    printf "ERROR: Unsupported format '%s' (use png or tiff)\n" "${OUTPUT_FORMAT}" >&2
                    exit 1
                fi
                shift 2
                ;;
            --no-meta)
                GENERATE_META=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                printf "ERROR: Unknown option: %s\n" "$1" >&2
                exit 1
                ;;
            *)
                if [[ -z "${INPUT_FILE}" ]]; then
                    INPUT_FILE="$1"
                else
                    printf "ERROR: Unexpected argument: %s\n" "$1" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [[ -z "${INPUT_FILE}" ]]; then
        printf "ERROR: No input file specified\n" >&2
        exit 3
    fi
}

# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

validate_input() {
    # Check file exists
    if [[ ! -f "${INPUT_FILE}" ]]; then
        printf "ERROR: Input file not found: %s\n" "${INPUT_FILE}" >&2
        exit 3
    fi

    # Check file is not empty
    if [[ ! -s "${INPUT_FILE}" ]]; then
        printf "ERROR: Input file is empty: %s\n" "${INPUT_FILE}" >&2
        exit 3
    fi

    # Check extension (case-insensitive)
    local ext
    ext="${INPUT_FILE##*.}"
    ext="$(printf "%s" "${ext}" | tr '[:upper:]' '[:lower:]')"

    case "${ext}" in
        iff|ilbm|lbm)
            ;;
        *)
            printf "ERROR: Unsupported file extension '.%s' (expected .iff, .ilbm, or .lbm)\n" "${ext}" >&2
            exit 3
            ;;
    esac

    # Set default output directory
    if [[ -z "${OUTPUT_DIR}" ]]; then
        OUTPUT_DIR="$(dirname "${INPUT_FILE}")"
    fi
}

# ---------------------------------------------------------------------------
# Tool detection
# ---------------------------------------------------------------------------

CONVERT_TOOL=""
CONVERT_TOOL_NAME=""

detect_tool() {
    if has_command ilbmtoppm; then
        CONVERT_TOOL="ilbmtoppm"
        CONVERT_TOOL_NAME="ilbmtoppm"
        return 0
    fi

    if has_command convert; then
        CONVERT_TOOL="imagemagick"
        CONVERT_TOOL_NAME="ImageMagick"
        return 0
    fi

    if has_command gm; then
        CONVERT_TOOL="graphicsmagick"
        CONVERT_TOOL_NAME="GraphicsMagick"
        return 0
    fi

    printf "ERROR: No IFF/ILBM conversion tool found.\n" >&2
    printf "  Install one of:\n" >&2
    printf "    netpbm (provides ilbmtoppm) -- recommended, most faithful IFF decoder\n" >&2
    printf "    ImageMagick (provides convert) -- handles basic IFF/ILBM\n" >&2
    printf "    GraphicsMagick (provides gm convert) -- alternative to ImageMagick\n" >&2
    printf "\n" >&2
    printf "  Install commands:\n" >&2
    printf "    Fedora/RHEL: sudo dnf install netpbm-progs\n" >&2
    printf "    Debian/Ubuntu: sudo apt install netpbm\n" >&2
    printf "    Arch: sudo pacman -S netpbm\n" >&2
    exit 2
}

# ---------------------------------------------------------------------------
# IFF binary metadata extraction
# ---------------------------------------------------------------------------

# Parse metadata from an IFF/ILBM file using binary inspection.
# Gracefully handles truncated or corrupted files by returning partial
# metadata rather than crashing.
#
# Sets global variables: META_WIDTH, META_HEIGHT, META_BITPLANES, META_MASKING,
# META_COMPRESSION, META_TRANSPARENT, META_X_ASPECT, META_Y_ASPECT,
# META_MODE, META_PALETTE_COUNT, META_PALETTE_ENTRIES

META_WIDTH=0
META_HEIGHT=0
META_BITPLANES=0
META_MASKING=0
META_COMPRESSION=0
META_TRANSPARENT=0
META_X_ASPECT=0
META_Y_ASPECT=0
META_MODE="standard"
META_PALETTE_COUNT=0
META_PALETTE_ENTRIES=()
META_CAMG_FLAGS=0

parse_iff_metadata() {
    local file="$1"
    local file_size
    file_size="$(stat -c %s "${file}" 2>/dev/null || echo "0")"

    # Need at least 12 bytes for FORM header
    if [[ "${file_size}" -lt 12 ]]; then
        warn "IFF metadata: file too small (${file_size} bytes), skipping metadata extraction"
        return 1
    fi

    # Verify FORM header
    local form_tag
    form_tag="$(dd if="${file}" bs=1 count=4 skip=0 2>/dev/null | tr -d '\0')"
    if [[ "${form_tag}" != "FORM" ]]; then
        warn "IFF metadata: missing FORM header, skipping metadata extraction"
        return 1
    fi

    # Verify ILBM type
    local ilbm_tag
    ilbm_tag="$(dd if="${file}" bs=1 count=4 skip=8 2>/dev/null | tr -d '\0')"
    if [[ "${ilbm_tag}" != "ILBM" ]]; then
        warn "IFF metadata: not an ILBM file (type: ${ilbm_tag}), skipping metadata extraction"
        return 1
    fi

    # Walk chunks starting at offset 12
    local offset=12
    local chunk_id chunk_len

    while [[ $((offset + 8)) -le "${file_size}" ]]; do
        chunk_id="$(dd if="${file}" bs=1 count=4 skip="${offset}" 2>/dev/null | tr -d '\0')"
        # Read 4-byte big-endian chunk length
        chunk_len="$(_read_be32 "${file}" $((offset + 4)))"

        if [[ -z "${chunk_id}" || "${chunk_len}" -lt 0 ]] 2>/dev/null; then
            break
        fi

        case "${chunk_id}" in
            BMHD)
                _parse_bmhd "${file}" $((offset + 8)) "${chunk_len}"
                ;;
            CMAP)
                _parse_cmap "${file}" $((offset + 8)) "${chunk_len}"
                ;;
            CAMG)
                _parse_camg "${file}" $((offset + 8)) "${chunk_len}"
                ;;
        esac

        # Advance to next chunk (chunks are word-aligned, pad odd lengths)
        local padded_len=$(( chunk_len + (chunk_len % 2) ))
        offset=$(( offset + 8 + padded_len ))
    done

    # Determine display mode from CAMG flags and bitplane count
    if [[ "${META_CAMG_FLAGS}" -gt 0 ]]; then
        if [[ $(( META_CAMG_FLAGS & 0x800 )) -ne 0 ]]; then
            META_MODE="HAM"
        elif [[ $(( META_CAMG_FLAGS & 0x80 )) -ne 0 ]]; then
            META_MODE="EHB"
        fi
    elif [[ "${META_BITPLANES}" -eq 6 ]]; then
        # 6 bitplanes without CAMG -- could be HAM or EHB, default to HAM
        META_MODE="HAM"
        warn "IFF metadata: 6 bitplanes without CAMG chunk, assuming HAM mode"
    fi

    return 0
}

# Read a 4-byte big-endian unsigned integer from a file at a given offset.
_read_be32() {
    local file="$1"
    local offset="$2"
    local hex
    hex="$(od -A n -t x1 -j "${offset}" -N 4 "${file}" 2>/dev/null | tr -d ' \n')"
    if [[ ${#hex} -lt 8 ]]; then
        echo "0"
        return 1
    fi
    printf "%d" "0x${hex}" 2>/dev/null || echo "0"
}

# Read a 2-byte big-endian unsigned integer from a file at a given offset.
_read_be16() {
    local file="$1"
    local offset="$2"
    local hex
    hex="$(od -A n -t x1 -j "${offset}" -N 2 "${file}" 2>/dev/null | tr -d ' \n')"
    if [[ ${#hex} -lt 4 ]]; then
        echo "0"
        return 1
    fi
    printf "%d" "0x${hex}" 2>/dev/null || echo "0"
}

# Read a single byte from a file at a given offset.
_read_byte() {
    local file="$1"
    local offset="$2"
    local hex
    hex="$(od -A n -t x1 -j "${offset}" -N 1 "${file}" 2>/dev/null | tr -d ' \n')"
    if [[ ${#hex} -lt 2 ]]; then
        echo "0"
        return 1
    fi
    printf "%d" "0x${hex}" 2>/dev/null || echo "0"
}

# Parse BMHD (Bitmap Header) chunk data.
_parse_bmhd() {
    local file="$1"
    local offset="$2"
    local len="$3"

    if [[ "${len}" -lt 20 ]]; then
        warn "IFF metadata: BMHD chunk too small (${len} bytes)"
        return 1
    fi

    META_WIDTH="$(_read_be16 "${file}" "${offset}")"
    META_HEIGHT="$(_read_be16 "${file}" $((offset + 2)))"
    META_BITPLANES="$(_read_byte "${file}" $((offset + 8)))"
    META_MASKING="$(_read_byte "${file}" $((offset + 9)))"
    META_COMPRESSION="$(_read_byte "${file}" $((offset + 10)))"
    META_TRANSPARENT="$(_read_be16 "${file}" $((offset + 12)))"
    META_X_ASPECT="$(_read_byte "${file}" $((offset + 14)))"
    META_Y_ASPECT="$(_read_byte "${file}" $((offset + 15)))"
}

# Parse CMAP (Color Map) chunk data.
_parse_cmap() {
    local file="$1"
    local offset="$2"
    local len="$3"

    META_PALETTE_COUNT=$(( len / 3 ))
    META_PALETTE_ENTRIES=()

    local i r g b
    for (( i = 0; i < META_PALETTE_COUNT; i++ )); do
        r="$(od -A n -t x1 -j $((offset + i * 3)) -N 1 "${file}" 2>/dev/null | tr -d ' \n')"
        g="$(od -A n -t x1 -j $((offset + i * 3 + 1)) -N 1 "${file}" 2>/dev/null | tr -d ' \n')"
        b="$(od -A n -t x1 -j $((offset + i * 3 + 2)) -N 1 "${file}" 2>/dev/null | tr -d ' \n')"

        # Uppercase and zero-pad
        r="$(printf "%s" "${r}" | tr '[:lower:]' '[:upper:]')"
        g="$(printf "%s" "${g}" | tr '[:lower:]' '[:upper:]')"
        b="$(printf "%s" "${b}" | tr '[:lower:]' '[:upper:]')"

        # Ensure two digits
        [[ ${#r} -lt 2 ]] && r="0${r}"
        [[ ${#g} -lt 2 ]] && g="0${g}"
        [[ ${#b} -lt 2 ]] && b="0${b}"

        META_PALETTE_ENTRIES+=("#${r}${g}${b}")
    done
}

# Parse CAMG (Amiga Display Mode) chunk data.
_parse_camg() {
    local file="$1"
    local offset="$2"
    local len="$3"

    if [[ "${len}" -lt 4 ]]; then
        warn "IFF metadata: CAMG chunk too small (${len} bytes)"
        return 1
    fi

    META_CAMG_FLAGS="$(_read_be32 "${file}" "${offset}")"
}

# ---------------------------------------------------------------------------
# Conversion
# ---------------------------------------------------------------------------

convert_file() {
    local input="$1"
    local output="$2"
    local format="$3"

    case "${CONVERT_TOOL}" in
        ilbmtoppm)
            if [[ "${format}" == "png" ]]; then
                if has_command pnmtopng; then
                    ilbmtoppm "${input}" 2>/dev/null | pnmtopng > "${output}" 2>/dev/null
                else
                    # Fall back to ImageMagick or just ppmtopng
                    ilbmtoppm "${input}" 2>/dev/null | convert pnm:- "${output}" 2>/dev/null
                fi
            elif [[ "${format}" == "tiff" ]]; then
                if has_command pnmtotiff; then
                    ilbmtoppm "${input}" 2>/dev/null | pnmtotiff > "${output}" 2>/dev/null
                else
                    ilbmtoppm "${input}" 2>/dev/null | convert pnm:- "${output}" 2>/dev/null
                fi
            fi
            ;;
        imagemagick)
            convert "${input}" "${output}" 2>/dev/null
            ;;
        graphicsmagick)
            gm convert "${input}" "${output}" 2>/dev/null
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Output verification
# ---------------------------------------------------------------------------

verify_output() {
    local output="$1"
    local expected_w="$2"
    local expected_h="$3"

    if [[ ! -f "${output}" ]]; then
        printf "ERROR: Conversion failed -- output file not created: %s\n" "${output}" >&2
        return 1
    fi

    if [[ ! -s "${output}" ]]; then
        printf "ERROR: Conversion failed -- output file is empty: %s\n" "${output}" >&2
        rm -f "${output}"
        return 1
    fi

    # Optional dimension verification via identify (ImageMagick)
    if has_command identify && [[ "${expected_w}" -gt 0 && "${expected_h}" -gt 0 ]]; then
        local dims
        dims="$(identify -format "%wx%h" "${output}" 2>/dev/null || echo "")"
        if [[ -n "${dims}" ]]; then
            local actual_w actual_h
            actual_w="${dims%%x*}"
            actual_h="${dims##*x}"
            if [[ "${actual_w}" -ne "${expected_w}" || "${actual_h}" -ne "${expected_h}" ]]; then
                warn "Dimension mismatch: expected ${expected_w}x${expected_h}, got ${actual_w}x${actual_h}"
            fi
        fi
    fi

    return 0
}

# ---------------------------------------------------------------------------
# Metadata sidecar generation
# ---------------------------------------------------------------------------

generate_metadata() {
    local input="$1"
    local output="$2"
    local meta_file="$3"

    local input_basename
    input_basename="$(basename "${input}")"
    local output_basename
    output_basename="$(basename "${output}")"
    local input_size
    input_size="$(stat -c %s "${input}" 2>/dev/null || echo "0")"
    local timestamp
    timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    # Compute color count
    local color_count
    if [[ "${META_MODE}" == "HAM" ]]; then
        # HAM mode: palette is used as base colors, actual colors are computed
        color_count="${META_PALETTE_COUNT}"
    elif [[ "${META_MODE}" == "EHB" ]]; then
        # EHB: 32 base + 32 half-bright = 64
        color_count=$(( META_PALETTE_COUNT * 2 ))
    else
        color_count="${META_PALETTE_COUNT}"
    fi

    # Compression name
    local compression_name="none"
    case "${META_COMPRESSION}" in
        0) compression_name="none" ;;
        1) compression_name="byterun1" ;;
        *) compression_name="unknown(${META_COMPRESSION})" ;;
    esac

    # Aspect ratio string
    local aspect_str="1:1"
    if [[ "${META_X_ASPECT}" -gt 0 && "${META_Y_ASPECT}" -gt 0 ]]; then
        aspect_str="${META_X_ASPECT}:${META_Y_ASPECT}"
    fi

    {
        printf "# IFF/ILBM Metadata\n"
        printf "# Source: %s\n" "${input_basename}"
        printf "# Converted: %s\n" "${timestamp}"
        printf "source:\n"
        printf "  filename: \"%s\"\n" "${input_basename}"
        printf "  format: IFF/ILBM\n"
        printf "  size_bytes: %s\n" "${input_size}"
        printf "image:\n"
        printf "  width: %s\n" "${META_WIDTH}"
        printf "  height: %s\n" "${META_HEIGHT}"
        printf "  bitplanes: %s\n" "${META_BITPLANES}"
        printf "  colors: %s\n" "${color_count}"
        printf "  mode: %s\n" "${META_MODE}"
        printf "  compression: %s\n" "${compression_name}"
        printf "  aspect_ratio: \"%s\"\n" "${aspect_str}"
        printf "palette:\n"
        printf "  count: %s\n" "${META_PALETTE_COUNT}"
        printf "  entries:\n"
        local entry
        for entry in "${META_PALETTE_ENTRIES[@]}"; do
            printf "    - \"%s\"\n" "${entry}"
        done
        printf "conversion:\n"
        printf "  tool: %s\n" "${CONVERT_TOOL_NAME}"
        printf "  output_format: %s\n" "${OUTPUT_FORMAT}"
        printf "  output_file: \"%s\"\n" "${output_basename}"
        printf "  converted_at: \"%s\"\n" "${timestamp}"
    } > "${meta_file}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"
    validate_input
    detect_tool

    # Compute output paths
    local input_basename
    input_basename="$(basename "${INPUT_FILE}")"
    local name_no_ext="${input_basename%.*}"
    local output_file="${OUTPUT_DIR}/${name_no_ext}.${OUTPUT_FORMAT}"
    local meta_file="${OUTPUT_DIR}/${name_no_ext}.meta.yaml"

    # Extract metadata (best-effort, does not block conversion)
    parse_iff_metadata "${INPUT_FILE}" || true

    # Dry-run mode
    if [[ "${DRY_RUN}" == "true" ]]; then
        printf "DRY RUN -- convert-ilbm.sh\n"
        printf "  Input:      %s\n" "${INPUT_FILE}"
        printf "  Output:     %s\n" "${output_file}"
        printf "  Format:     %s\n" "${OUTPUT_FORMAT}"
        printf "  Tool:       %s\n" "${CONVERT_TOOL_NAME}"
        printf "  Dimensions: %sx%s\n" "${META_WIDTH}" "${META_HEIGHT}"
        printf "  Bitplanes:  %s\n" "${META_BITPLANES}"
        printf "  Mode:       %s\n" "${META_MODE}"
        printf "  Colors:     %s\n" "${META_PALETTE_COUNT}"
        if [[ "${GENERATE_META}" == "true" ]]; then
            printf "  Metadata:   %s\n" "${meta_file}"
        else
            printf "  Metadata:   (suppressed)\n"
        fi
        exit 0
    fi

    # Ensure output directory exists
    mkdir -p "${OUTPUT_DIR}"

    # Convert
    printf "Converting: %s -> %s (using %s)\n" "${input_basename}" "$(basename "${output_file}")" "${CONVERT_TOOL_NAME}"
    convert_file "${INPUT_FILE}" "${output_file}" "${OUTPUT_FORMAT}"
    verify_output "${output_file}" "${META_WIDTH}" "${META_HEIGHT}" || exit 1

    # Generate metadata sidecar
    if [[ "${GENERATE_META}" == "true" ]]; then
        generate_metadata "${INPUT_FILE}" "${output_file}" "${meta_file}"
    fi

    # Print summary
    printf "\n"
    printf "Conversion complete:\n"
    printf "  Input:      %s\n" "${INPUT_FILE}"
    printf "  Output:     %s\n" "${output_file}"
    printf "  Dimensions: %sx%s\n" "${META_WIDTH}" "${META_HEIGHT}"
    printf "  Bitplanes:  %s\n" "${META_BITPLANES}"
    printf "  Colors:     %s\n" "${META_PALETTE_COUNT}"
    printf "  Mode:       %s\n" "${META_MODE}"
    printf "  Tool:       %s\n" "${CONVERT_TOOL_NAME}"
    if [[ "${GENERATE_META}" == "true" ]]; then
        printf "  Metadata:   %s\n" "${meta_file}"
    fi
}

main "$@"

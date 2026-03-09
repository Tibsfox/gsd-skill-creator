#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2207 # SC2034: vars for later use; SC2207: IFS-split array assignment is intentional
# batch-convert.sh -- Batch conversion orchestrator for Amiga IFF and MOD files
#
# Recursively scans a directory tree for Amiga image (IFF/ILBM) and audio
# (MOD/MED/S3M/XM/IT) files, routes each to the correct converter, tracks
# progress with per-file status reporting, supports resumable operation
# (skip existing unless --force), and parallel execution.
#
# Usage:
#   batch-convert.sh <input-dir> [--output <dir>] [--format-image png|tiff]
#                    [--format-audio wav|flac|ogg|all] [--sample-rate 44100|48000]
#                    [--force] [--parallel <N>] [--dry-run]
#
# Exit codes:
#   0 = all files converted/skipped successfully
#   1 = one or more files had conversion errors (non-error files still processed)
#   2 = missing converter scripts
#   3 = invalid arguments or input directory

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

# Image extensions (case-insensitive matching via find -iname)
IMAGE_EXTENSIONS=("iff" "ilbm" "lbm")

# Audio extensions (case-insensitive matching via find -iname)
AUDIO_EXTENSIONS=("mod" "med" "med3" "med4" "oct" "okt" "s3m" "xm" "it")

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: batch-convert.sh <input-dir> [OPTIONS]

Batch convert Amiga IFF images and tracker music files to modern formats.

Arguments:
  <input-dir>            Input directory to scan recursively (required)

Options:
  --output <dir>         Output directory (default: <input-dir>/converted/)
  --format-image <fmt>   Image output format: png (default), tiff
  --format-audio <fmt>   Audio output format: wav (default), flac, ogg, all
  --sample-rate <rate>   Audio sample rate: 44100 or 48000 (default: 48000)
  --force                Re-convert even if output files already exist
  --parallel <N>         Concurrent conversions: 1-8 (default: 1, sequential)
  --dry-run              Show conversion plan without creating files
  --help                 Show this help message
  --version              Show version

Image formats supported: .iff, .ilbm, .lbm (routed to convert-ilbm.sh)
Audio formats supported: .mod, .med, .med3, .med4, .oct, .okt, .s3m, .xm, .it
                         (routed to convert-tracker.sh)

Behavior:
  - Resumable by default: existing output files are skipped (use --force to re-convert)
  - Individual file errors do NOT abort the batch -- all files are processed
  - Metadata sidecars collected in meta/ subdirectory for catalog generation
  - After conversion, generates an asset catalog via generate-asset-catalog.sh
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

INPUT_DIR=""
OUTPUT_DIR=""
FORMAT_IMAGE="png"
FORMAT_AUDIO="wav"
SAMPLE_RATE=48000
FORCE=false
PARALLEL=1
DRY_RUN=false

parse_args() {
    if [[ $# -eq 0 ]]; then
        printf "ERROR: No input directory specified\n" >&2
        printf "Usage: batch-convert.sh <input-dir> [OPTIONS]\n" >&2
        printf "Try 'batch-convert.sh --help' for more information.\n" >&2
        exit 3
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                usage
                exit 0
                ;;
            --version)
                printf "batch-convert.sh %s\n" "${VERSION}"
                exit 0
                ;;
            --output)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --output requires a directory argument\n" >&2
                    exit 3
                fi
                OUTPUT_DIR="$2"
                shift 2
                ;;
            --format-image)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --format-image requires an argument (png or tiff)\n" >&2
                    exit 3
                fi
                FORMAT_IMAGE="$2"
                if [[ "${FORMAT_IMAGE}" != "png" && "${FORMAT_IMAGE}" != "tiff" ]]; then
                    printf "ERROR: Unsupported image format '%s' (use png or tiff)\n" "${FORMAT_IMAGE}" >&2
                    exit 3
                fi
                shift 2
                ;;
            --format-audio)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --format-audio requires an argument (wav, flac, ogg, or all)\n" >&2
                    exit 3
                fi
                FORMAT_AUDIO="$2"
                case "${FORMAT_AUDIO}" in
                    wav|flac|ogg|all) ;;
                    *)
                        printf "ERROR: Unsupported audio format '%s' (use wav, flac, ogg, or all)\n" "${FORMAT_AUDIO}" >&2
                        exit 3
                        ;;
                esac
                shift 2
                ;;
            --sample-rate)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --sample-rate requires an argument (44100 or 48000)\n" >&2
                    exit 3
                fi
                SAMPLE_RATE="$2"
                case "${SAMPLE_RATE}" in
                    44100|48000) ;;
                    *)
                        printf "ERROR: Unsupported sample rate '%s' (use 44100 or 48000)\n" "${SAMPLE_RATE}" >&2
                        exit 3
                        ;;
                esac
                shift 2
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --parallel)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --parallel requires a number (1-8)\n" >&2
                    exit 3
                fi
                PARALLEL="$2"
                if ! [[ "${PARALLEL}" =~ ^[1-8]$ ]]; then
                    printf "ERROR: --parallel must be 1-8 (got '%s')\n" "${PARALLEL}" >&2
                    exit 3
                fi
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -*)
                printf "ERROR: Unknown option: %s\n" "$1" >&2
                exit 3
                ;;
            *)
                if [[ -z "${INPUT_DIR}" ]]; then
                    INPUT_DIR="$1"
                else
                    printf "ERROR: Unexpected argument: %s\n" "$1" >&2
                    exit 3
                fi
                shift
                ;;
        esac
    done

    if [[ -z "${INPUT_DIR}" ]]; then
        printf "ERROR: No input directory specified\n" >&2
        exit 3
    fi
}

# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------

validate_input() {
    if [[ ! -d "${INPUT_DIR}" ]]; then
        printf "ERROR: Input directory not found: %s\n" "${INPUT_DIR}" >&2
        exit 1
    fi

    # Resolve to absolute path
    INPUT_DIR="$(cd "${INPUT_DIR}" && pwd)"

    # Set default output directory
    if [[ -z "${OUTPUT_DIR}" ]]; then
        OUTPUT_DIR="${INPUT_DIR}/converted"
    fi
}

# ---------------------------------------------------------------------------
# Converter detection
# ---------------------------------------------------------------------------

CONVERT_ILBM=""
CONVERT_TRACKER=""
GENERATE_CATALOG=""

detect_converters() {
    CONVERT_ILBM="${SCRIPT_DIR}/convert-ilbm.sh"
    CONVERT_TRACKER="${SCRIPT_DIR}/convert-tracker.sh"
    GENERATE_CATALOG="${SCRIPT_DIR}/generate-asset-catalog.sh"

    if [[ ! -f "${CONVERT_ILBM}" || ! -x "${CONVERT_ILBM}" ]]; then
        printf "ERROR: Image converter not found or not executable: %s\n" "${CONVERT_ILBM}" >&2
        exit 2
    fi

    if [[ ! -f "${CONVERT_TRACKER}" || ! -x "${CONVERT_TRACKER}" ]]; then
        printf "ERROR: Audio converter not found or not executable: %s\n" "${CONVERT_TRACKER}" >&2
        exit 2
    fi

    # Catalog generator is optional at this point -- checked later
    if [[ ! -f "${GENERATE_CATALOG}" ]]; then
        GENERATE_CATALOG=""
        warn "Catalog generator not found: ${SCRIPT_DIR}/generate-asset-catalog.sh"
    fi
}

# ---------------------------------------------------------------------------
# File scanning
# ---------------------------------------------------------------------------

scan_files() {
    local dir="$1"
    local -n img_arr=$2
    local -n aud_arr=$3

    # Scan for image files
    local ext
    for ext in "${IMAGE_EXTENSIONS[@]}"; do
        while IFS= read -r -d '' file; do
            img_arr+=("${file}")
        done < <(find "${dir}" -iname "*.${ext}" -type f -print0 2>/dev/null)
    done

    # Scan for audio files
    for ext in "${AUDIO_EXTENSIONS[@]}"; do
        while IFS= read -r -d '' file; do
            aud_arr+=("${file}")
        done < <(find "${dir}" -iname "*.${ext}" -type f -print0 2>/dev/null)
    done

    # Sort for deterministic ordering
    if [[ ${#img_arr[@]} -gt 0 ]]; then
        IFS=$'\n' img_arr=($(printf "%s\n" "${img_arr[@]}" | LC_ALL=C sort))
        unset IFS
    fi
    if [[ ${#aud_arr[@]} -gt 0 ]]; then
        IFS=$'\n' aud_arr=($(printf "%s\n" "${aud_arr[@]}" | LC_ALL=C sort))
        unset IFS
    fi
}

# ---------------------------------------------------------------------------
# Print conversion plan
# ---------------------------------------------------------------------------

print_plan() {
    local image_count="$1"
    local audio_count="$2"
    local total_count="$3"
    local force_str="no (skipping existing)"
    if [[ "${FORCE}" == "true" ]]; then
        force_str="yes (re-converting all)"
    fi

    local img_format_str="${FORMAT_IMAGE^^}"
    local aud_format_str="${FORMAT_AUDIO^^}"

    printf "\nBatch conversion plan:\n"
    printf "  Input:        %s\n" "${INPUT_DIR}"
    printf "  Output:       %s\n" "${OUTPUT_DIR}"
    printf "  Image files:  %s (IFF/ILBM -> %s)\n" "${image_count}" "${img_format_str}"
    printf "  Audio files:  %s (MOD/MED -> %s)\n" "${audio_count}" "${aud_format_str}"
    printf "  Total:        %s files\n" "${total_count}"
    printf "  Force:        %s\n" "${force_str}"
    printf "  Parallel:     %s\n" "${PARALLEL}"
    printf "\n"
}

# ---------------------------------------------------------------------------
# Compute output path
# ---------------------------------------------------------------------------

# Compute the output path for a given input file.
# Images go under $OUTPUT_DIR/images/<relative_path>/
# Audio goes under $OUTPUT_DIR/audio/<relative_path>/
compute_output_path() {
    local input_file="$1"
    local category="$2"     # "images" or "audio"
    local output_ext="$3"   # "png", "tiff", "wav", etc.

    # Compute relative path from input dir
    local rel_path="${input_file#${INPUT_DIR}/}"
    local rel_dir
    rel_dir="$(dirname "${rel_path}")"
    local basename
    basename="$(basename "${input_file}")"
    local name_no_ext="${basename%.*}"

    local output_dir_full="${OUTPUT_DIR}/${category}"
    if [[ "${rel_dir}" != "." ]]; then
        output_dir_full="${OUTPUT_DIR}/${category}/${rel_dir}"
    fi

    printf "%s/%s.%s" "${output_dir_full}" "${name_no_ext}" "${output_ext}"
}

# Compute the meta output path for a given input file.
compute_meta_path() {
    local input_file="$1"
    local category="$2"  # "images" or "audio"

    local rel_path="${input_file#${INPUT_DIR}/}"
    local rel_dir
    rel_dir="$(dirname "${rel_path}")"
    local basename
    basename="$(basename "${input_file}")"
    local name_no_ext="${basename%.*}"

    local meta_dir="${OUTPUT_DIR}/meta/${category}"
    if [[ "${rel_dir}" != "." ]]; then
        meta_dir="${OUTPUT_DIR}/meta/${category}/${rel_dir}"
    fi

    printf "%s/%s.meta.yaml" "${meta_dir}" "${name_no_ext}"
}

# ---------------------------------------------------------------------------
# Single file conversion (for parallel support)
# ---------------------------------------------------------------------------

# Convert a single image file.
# Writes result status to a temp file for parallel aggregation.
convert_single_image() {
    local input_file="$1"
    local output_path="$2"
    local meta_dest="$3"
    local file_num="$4"
    local total="$5"
    local result_file="$6"

    local input_basename
    input_basename="$(basename "${input_file}")"
    local output_basename
    output_basename="$(basename "${output_path}")"

    # Check if output already exists (resumable)
    if [[ -f "${output_path}" && "${FORCE}" != "true" ]]; then
        printf "[%s/%s] SKIPPED: %s (exists)\n" "${file_num}" "${total}" "${output_basename}"
        printf "skipped\n" >> "${result_file}"
        return 0
    fi

    # Create output directory
    mkdir -p "$(dirname "${output_path}")"

    # Run converter
    local rc=0
    "${CONVERT_ILBM}" "${input_file}" --output "$(dirname "${output_path}")" --format "${FORMAT_IMAGE}" >/dev/null 2>&1 || rc=$?

    if [[ "${rc}" -eq 0 ]]; then
        printf "[%s/%s] Converted: %s -> %s\n" "${file_num}" "${total}" "${input_basename}" "${output_basename}"
        printf "converted\n" >> "${result_file}"

        # Move meta sidecar to meta/ directory (removes original to prevent duplicates)
        local source_meta
        source_meta="$(dirname "${output_path}")/$(basename "${input_file}" | sed 's/\.[^.]*$//').meta.yaml"
        if [[ -f "${source_meta}" ]]; then
            mkdir -p "$(dirname "${meta_dest}")"
            mv "${source_meta}" "${meta_dest}"
        fi
    else
        printf "[%s/%s] ERROR: %s (exit code %s)\n" "${file_num}" "${total}" "${input_basename}" "${rc}"
        printf "error:%s:convert-ilbm.sh exit code %s\n" "${input_basename}" "${rc}" >> "${result_file}"
    fi

    return 0
}

# Convert a single audio file.
convert_single_audio() {
    local input_file="$1"
    local output_path="$2"
    local meta_dest="$3"
    local file_num="$4"
    local total="$5"
    local result_file="$6"

    local input_basename
    input_basename="$(basename "${input_file}")"
    local output_basename
    output_basename="$(basename "${output_path}")"

    # Check if output already exists (resumable)
    if [[ -f "${output_path}" && "${FORCE}" != "true" ]]; then
        printf "[%s/%s] SKIPPED: %s (exists)\n" "${file_num}" "${total}" "${output_basename}"
        printf "skipped\n" >> "${result_file}"
        return 0
    fi

    # Create output directory
    mkdir -p "$(dirname "${output_path}")"

    # Run converter
    local rc=0
    "${CONVERT_TRACKER}" "${input_file}" --output "$(dirname "${output_path}")" \
        --format "${FORMAT_AUDIO}" --sample-rate "${SAMPLE_RATE}" >/dev/null 2>&1 || rc=$?

    if [[ "${rc}" -eq 0 ]]; then
        printf "[%s/%s] Converted: %s -> %s\n" "${file_num}" "${total}" "${input_basename}" "${output_basename}"
        printf "converted\n" >> "${result_file}"

        # Move meta sidecar to meta/ directory (removes original to prevent duplicates)
        local source_meta
        source_meta="$(dirname "${output_path}")/$(basename "${input_file}" | sed 's/\.[^.]*$//').meta.yaml"
        if [[ -f "${source_meta}" ]]; then
            mkdir -p "$(dirname "${meta_dest}")"
            mv "${source_meta}" "${meta_dest}"
        fi
    else
        printf "[%s/%s] ERROR: %s (exit code %s)\n" "${file_num}" "${total}" "${input_basename}" "${rc}"
        printf "error:%s:convert-tracker.sh exit code %s\n" "${input_basename}" "${rc}" >> "${result_file}"
    fi

    return 0
}

# ---------------------------------------------------------------------------
# Batch processing
# ---------------------------------------------------------------------------

process_batch() {
    local -n _image_files=$1
    local -n _audio_files=$2

    local image_count="${#_image_files[@]}"
    local audio_count="${#_audio_files[@]}"
    local total_count=$(( image_count + audio_count ))

    # Create output directory structure
    mkdir -p "${OUTPUT_DIR}/images" "${OUTPUT_DIR}/audio" "${OUTPUT_DIR}/meta"

    # Result tracking file
    local result_file
    result_file="$(mktemp)"

    local file_num=0
    local running=0

    # --- Process image files ---
    local file output_path meta_dest
    for file in "${_image_files[@]}"; do
        file_num=$(( file_num + 1 ))
        output_path="$(compute_output_path "${file}" "images" "${FORMAT_IMAGE}")"
        meta_dest="$(compute_meta_path "${file}" "images")"

        if [[ "${PARALLEL}" -le 1 ]]; then
            convert_single_image "${file}" "${output_path}" "${meta_dest}" "${file_num}" "${total_count}" "${result_file}"
        else
            convert_single_image "${file}" "${output_path}" "${meta_dest}" "${file_num}" "${total_count}" "${result_file}" &
            running=$(( running + 1 ))
            if [[ "${running}" -ge "${PARALLEL}" ]]; then
                wait -n 2>/dev/null || true
                running=$(( running - 1 ))
            fi
        fi
    done

    # --- Process audio files ---
    local aud_ext="${FORMAT_AUDIO}"
    if [[ "${aud_ext}" == "all" ]]; then
        aud_ext="wav"  # Primary extension for output path check
    fi

    for file in "${_audio_files[@]}"; do
        file_num=$(( file_num + 1 ))
        output_path="$(compute_output_path "${file}" "audio" "${aud_ext}")"
        meta_dest="$(compute_meta_path "${file}" "audio")"

        if [[ "${PARALLEL}" -le 1 ]]; then
            convert_single_audio "${file}" "${output_path}" "${meta_dest}" "${file_num}" "${total_count}" "${result_file}"
        else
            convert_single_audio "${file}" "${output_path}" "${meta_dest}" "${file_num}" "${total_count}" "${result_file}" &
            running=$(( running + 1 ))
            if [[ "${running}" -ge "${PARALLEL}" ]]; then
                wait -n 2>/dev/null || true
                running=$(( running - 1 ))
            fi
        fi
    done

    # Wait for remaining parallel jobs
    if [[ "${PARALLEL}" -gt 1 ]]; then
        wait
    fi

    # --- Tally results ---
    local converted=0 skipped=0 errors=0
    local error_files=()

    while IFS= read -r line; do
        case "${line}" in
            converted)
                converted=$(( converted + 1 ))
                ;;
            skipped)
                skipped=$(( skipped + 1 ))
                ;;
            error:*)
                errors=$(( errors + 1 ))
                error_files+=("${line#error:}")
                ;;
        esac
    done < "${result_file}"
    rm -f "${result_file}"

    # --- Generate asset catalog ---
    if [[ -n "${GENERATE_CATALOG}" && -x "${GENERATE_CATALOG}" ]]; then
        printf "\nGenerating asset catalog...\n"
        "${GENERATE_CATALOG}" "${OUTPUT_DIR}" --output "${OUTPUT_DIR}/asset-catalog.yaml" 2>/dev/null || {
            warn "Asset catalog generation failed (non-fatal)"
        }
    fi

    # --- Print final summary ---
    printf "\nBatch conversion complete:\n"
    printf "  Total files:  %s\n" "${total_count}"
    printf "  Converted:    %s\n" "${converted}"
    printf "  Skipped:      %s (already existed)\n" "${skipped}"
    printf "  Errors:       %s\n" "${errors}"
    if [[ -f "${OUTPUT_DIR}/asset-catalog.yaml" ]]; then
        printf "  Catalog:      %s\n" "${OUTPUT_DIR}/asset-catalog.yaml"
    fi

    if [[ "${errors}" -gt 0 ]]; then
        printf "\n  Error files:\n"
        local ef
        for ef in "${error_files[@]}"; do
            # Format: filename:description
            local err_name="${ef%%:*}"
            local err_desc="${ef#*:}"
            printf "    - %s (%s)\n" "${err_name}" "${err_desc}"
        done
    fi

    # Exit code: 0 if no errors, 1 if any errors
    if [[ "${errors}" -gt 0 ]]; then
        return 1
    fi
    return 0
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"
    validate_input
    detect_converters

    # Scan for files
    local image_files=()
    local audio_files=()
    scan_files "${INPUT_DIR}" image_files audio_files

    local image_count="${#image_files[@]}"
    local audio_count="${#audio_files[@]}"
    local total_count=$(( image_count + audio_count ))

    # No files found
    if [[ "${total_count}" -eq 0 ]]; then
        printf "No Amiga files found in %s\n" "${INPUT_DIR}"
        exit 0
    fi

    # Print conversion plan
    print_plan "${image_count}" "${audio_count}" "${total_count}"

    # Dry-run mode
    if [[ "${DRY_RUN}" == "true" ]]; then
        printf "Files that would be converted:\n\n"

        if [[ "${image_count}" -gt 0 ]]; then
            printf "  Images (%s):\n" "${image_count}"
            local f
            for f in "${image_files[@]}"; do
                printf "    %s\n" "${f}"
            done
        fi

        if [[ "${audio_count}" -gt 0 ]]; then
            printf "\n  Audio (%s):\n" "${audio_count}"
            local f
            for f in "${audio_files[@]}"; do
                printf "    %s\n" "${f}"
            done
        fi

        printf "\nDry run -- no files converted.\n"
        exit 0
    fi

    # Process the batch
    process_batch image_files audio_files
}

main "$@"

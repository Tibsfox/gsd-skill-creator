#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2207 # SC2034: vars for later use; SC2207: IFS-split array assignment is intentional
# generate-asset-catalog.sh -- Asset catalog YAML generator for converted Amiga files
#
# Reads .meta.yaml sidecar files produced by convert-ilbm.sh and convert-tracker.sh
# and assembles a unified YAML catalog with complete metadata for every converted
# asset. Supports both centralized (meta/) and distributed (alongside files) layouts.
#
# Usage:
#   generate-asset-catalog.sh <converted-dir> [--output <catalog.yaml>]
#                             [--title "Collection Name"] [--dry-run]
#
# Exit codes:
#   0 = success
#   1 = general error
#   2 = no metadata files found

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
Usage: generate-asset-catalog.sh <converted-dir> [OPTIONS]

Generate a unified YAML asset catalog from converted Amiga files.

Arguments:
  <converted-dir>       Directory containing converted files with .meta.yaml sidecars

Options:
  --output <file>       Output catalog file (default: <converted-dir>/asset-catalog.yaml)
  --title <string>      Catalog title (default: "GSD Amiga Asset Catalog")
  --dry-run             Show what the catalog would contain without writing
  --help                Show this help message
  --version             Show version

The catalog reads .meta.yaml sidecar files produced by convert-ilbm.sh and
convert-tracker.sh, extracts metadata, and produces a single YAML manifest
with per-file dimensions/colors for images and channels/duration for audio.
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

CONVERTED_DIR=""
OUTPUT_FILE=""
CATALOG_TITLE="GSD Amiga Asset Catalog"
DRY_RUN=false

parse_args() {
    if [[ $# -eq 0 ]]; then
        printf "ERROR: No converted directory specified\n" >&2
        printf "Usage: generate-asset-catalog.sh <converted-dir> [OPTIONS]\n" >&2
        printf "Try 'generate-asset-catalog.sh --help' for more information.\n" >&2
        exit 1
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                usage
                exit 0
                ;;
            --version)
                printf "generate-asset-catalog.sh %s\n" "${VERSION}"
                exit 0
                ;;
            --output)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --output requires a file path argument\n" >&2
                    exit 1
                fi
                OUTPUT_FILE="$2"
                shift 2
                ;;
            --title)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --title requires a string argument\n" >&2
                    exit 1
                fi
                CATALOG_TITLE="$2"
                shift 2
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
                if [[ -z "${CONVERTED_DIR}" ]]; then
                    CONVERTED_DIR="$1"
                else
                    printf "ERROR: Unexpected argument: %s\n" "$1" >&2
                    exit 1
                fi
                shift
                ;;
        esac
    done

    if [[ -z "${CONVERTED_DIR}" ]]; then
        printf "ERROR: No converted directory specified\n" >&2
        exit 1
    fi
}

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

validate_input() {
    if [[ ! -d "${CONVERTED_DIR}" ]]; then
        printf "ERROR: Converted directory not found: %s\n" "${CONVERTED_DIR}" >&2
        exit 1
    fi

    # Resolve to absolute path
    CONVERTED_DIR="$(cd "${CONVERTED_DIR}" && pwd)"

    # Set default output
    if [[ -z "${OUTPUT_FILE}" ]]; then
        OUTPUT_FILE="${CONVERTED_DIR}/asset-catalog.yaml"
    fi
}

# ---------------------------------------------------------------------------
# Meta YAML parser (awk-based flattened key=value extraction)
# ---------------------------------------------------------------------------

# Parse a .meta.yaml file and emit flattened "section.key=value" lines.
# Handles the nested structure produced by convert-ilbm.sh and convert-tracker.sh.
#
# Example output:
#   source.filename=artwork1.iff
#   image.width=320
#   conversion.tool=ilbmtoppm
parse_meta_yaml() {
    local file="$1"

    awk '
    BEGIN {
        section = ""
        subsection = ""
        in_list = 0
        list_key = ""
        list_idx = 0
    }
    /^#/ { next }
    /^[[:space:]]*$/ { next }
    {
        # Count leading spaces for indentation depth
        match($0, /^[[:space:]]*/)
        indent = RLENGTH

        # Strip leading/trailing whitespace
        gsub(/^[[:space:]]+/, "")
        gsub(/[[:space:]]+$/, "")

        # Skip empty after strip
        if (length($0) == 0) next

        # List item (starts with "- ")
        if ($0 ~ /^- /) {
            val = substr($0, 3)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            if (in_list && list_key != "") {
                printf "%s.%s.%d=%s\n", section, list_key, list_idx, val
                list_idx++
            }
            next
        }

        # Key: value pair
        if ($0 ~ /:/) {
            pos = index($0, ":")
            key = substr($0, 1, pos - 1)
            val = substr($0, pos + 1)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)

            if (indent == 0) {
                # Top-level section (source:, image:, module:, conversion:, palette:, catalog:)
                section = key
                subsection = ""
                in_list = 0
                list_key = ""
                list_idx = 0
                if (length(val) > 0) {
                    printf "%s=%s\n", section, val
                }
            } else if (indent <= 2 && length(val) == 0) {
                # Subsection or list header (entries:, outputs:)
                if (key == "entries" || key == "outputs") {
                    in_list = 1
                    list_key = key
                    list_idx = 0
                } else {
                    subsection = key
                    in_list = 0
                }
            } else if (indent <= 2 && length(val) > 0) {
                # Direct key under section
                in_list = 0
                printf "%s.%s=%s\n", section, key, val
            } else if (indent > 2 && subsection != "" && length(val) > 0) {
                # Key under subsection
                printf "%s.%s.%s=%s\n", section, subsection, key, val
            } else if (indent > 2 && length(val) > 0) {
                # Nested key without explicit subsection
                printf "%s.%s=%s\n", section, key, val
            }
        }
    }
    ' "${file}" 2>/dev/null
}

# Get a specific value from parsed metadata
get_meta_value() {
    local parsed="$1"
    local key="$2"

    local val
    val="$(printf "%s" "${parsed}" | grep "^${key}=" | head -1 | cut -d= -f2-)"
    printf "%s" "${val}"
}

# ---------------------------------------------------------------------------
# Metadata collection
# ---------------------------------------------------------------------------

# Classify a .meta.yaml file as image or audio based on its content.
classify_meta() {
    local file="$1"

    if grep -q "^image:" "${file}" 2>/dev/null; then
        printf "image"
    elif grep -q "^module:" "${file}" 2>/dev/null; then
        printf "audio"
    else
        printf "unknown"
    fi
}

# ---------------------------------------------------------------------------
# Catalog generation
# ---------------------------------------------------------------------------

generate_catalog() {
    local -n _meta_files=$1

    local timestamp
    timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    # Classify and parse all meta files
    local image_entries=()
    local audio_entries=()
    local total_size=0
    local parse_errors=0

    local meta_file parsed category
    for meta_file in "${_meta_files[@]}"; do
        category="$(classify_meta "${meta_file}")"
        parsed="$(parse_meta_yaml "${meta_file}")"

        if [[ -z "${parsed}" ]]; then
            parse_errors=$(( parse_errors + 1 ))
            warn "Failed to parse metadata: ${meta_file}"
            continue
        fi

        case "${category}" in
            image)
                image_entries+=("${parsed}")
                ;;
            audio)
                audio_entries+=("${parsed}")
                ;;
            *)
                warn "Unknown metadata type in ${meta_file}, skipping"
                parse_errors=$(( parse_errors + 1 ))
                ;;
        esac
    done

    local image_count="${#image_entries[@]}"
    local audio_count="${#audio_entries[@]}"
    local total_assets=$(( image_count + audio_count ))

    # Calculate total size from converted files
    local file_path size_acc=0
    for meta_file in "${_meta_files[@]}"; do
        local dir
        dir="$(dirname "${meta_file}")"
        local base
        base="$(basename "${meta_file}" .meta.yaml)"
        # Look for common output extensions
        local ext
        for ext in png tiff wav flac ogg; do
            file_path="${dir}/${base}.${ext}"
            if [[ -f "${file_path}" ]]; then
                local fsize
                fsize="$(stat -c %s "${file_path}" 2>/dev/null || echo "0")"
                size_acc=$(( size_acc + fsize ))
            fi
        done
        # Also check in parent directory's images/ and audio/ structures
        # (handles centralized meta/ layout)
    done
    total_size="${size_acc}"

    # Validate counts
    local expected_total="${#_meta_files[@]}"
    local actual_total=$(( total_assets + parse_errors ))
    if [[ "${actual_total}" -ne "${expected_total}" ]]; then
        warn "Entry count mismatch: ${actual_total} processed vs ${expected_total} .meta.yaml files"
    fi

    # --- Dry run ---
    if [[ "${DRY_RUN}" == "true" ]]; then
        printf "Asset catalog would contain:\n"
        printf "  Title:    %s\n" "${CATALOG_TITLE}"
        printf "  Images:   %s entries\n" "${image_count}"
        printf "  Audio:    %s entries\n" "${audio_count}"
        printf "  Total:    %s entries\n" "${total_assets}"
        if [[ "${parse_errors}" -gt 0 ]]; then
            printf "  Errors:   %s files could not be parsed\n" "${parse_errors}"
        fi
        printf "\nDry run -- catalog not written.\n"
        return 0
    fi

    # --- Generate YAML output ---
    {
        printf "# %s\n" "${CATALOG_TITLE}"
        printf "# Generated: %s\n" "${timestamp}"
        printf "# Source: %s\n" "${CONVERTED_DIR}"
        printf "\n"
        printf "catalog:\n"
        printf "  title: \"%s\"\n" "${CATALOG_TITLE}"
        printf "  generated_at: \"%s\"\n" "${timestamp}"
        printf "  source_directory: \"%s\"\n" "${CONVERTED_DIR}"
        printf "\n"
        printf "  summary:\n"
        printf "    total_assets: %s\n" "${total_assets}"
        printf "    images: %s\n" "${image_count}"
        printf "    audio: %s\n" "${audio_count}"
        printf "    total_size_bytes: %s\n" "${total_size}"
        printf "\n"

        # --- Image entries (sorted by source filename) ---
        printf "  images:\n"
        if [[ "${image_count}" -eq 0 ]]; then
            printf "    []\n"
        else
            # Sort image entries by source.filename
            local sorted_images=()
            local sort_keys=()
            local idx
            for idx in "${!image_entries[@]}"; do
                local src_name
                src_name="$(get_meta_value "${image_entries[${idx}]}" "source.filename")"
                sort_keys+=("${src_name}|${idx}")
            done

            # Sort by source filename
            IFS=$'\n' sort_keys=($(printf "%s\n" "${sort_keys[@]}" | LC_ALL=C sort))
            unset IFS

            local sk
            for sk in "${sort_keys[@]}"; do
                idx="${sk##*|}"
                local entry="${image_entries[${idx}]}"

                local src_filename width height colors bitplanes mode conv_tool conv_at output_file
                src_filename="$(get_meta_value "${entry}" "source.filename")"
                width="$(get_meta_value "${entry}" "image.width")"
                height="$(get_meta_value "${entry}" "image.height")"
                colors="$(get_meta_value "${entry}" "image.colors")"
                bitplanes="$(get_meta_value "${entry}" "image.bitplanes")"
                mode="$(get_meta_value "${entry}" "image.mode")"
                conv_tool="$(get_meta_value "${entry}" "conversion.tool")"
                conv_at="$(get_meta_value "${entry}" "conversion.converted_at")"
                output_file="$(get_meta_value "${entry}" "conversion.output_file")"

                # Default empty values
                [[ -z "${width}" ]] && width="0"
                [[ -z "${height}" ]] && height="0"
                [[ -z "${colors}" ]] && colors="0"
                [[ -z "${bitplanes}" ]] && bitplanes="0"
                [[ -z "${mode}" ]] && mode="standard"
                [[ -z "${conv_tool}" ]] && conv_tool="unknown"
                [[ -z "${conv_at}" ]] && conv_at="${timestamp}"

                printf "    - source: \"%s\"\n" "${src_filename}"
                if [[ -n "${output_file}" ]]; then
                    printf "      output: \"%s\"\n" "${output_file}"
                fi
                printf "      width: %s\n" "${width}"
                printf "      height: %s\n" "${height}"
                printf "      colors: %s\n" "${colors}"
                printf "      bitplanes: %s\n" "${bitplanes}"
                printf "      mode: %s\n" "${mode}"
                printf "      converted_with: %s\n" "${conv_tool}"
                printf "      converted_at: \"%s\"\n" "${conv_at}"
            done
        fi

        printf "\n"

        # --- Audio entries (sorted by source filename) ---
        printf "  audio:\n"
        if [[ "${audio_count}" -eq 0 ]]; then
            printf "    []\n"
        else
            local sorted_audio=()
            local sort_keys_a=()
            for idx in "${!audio_entries[@]}"; do
                local src_name
                src_name="$(get_meta_value "${audio_entries[${idx}]}" "source.filename")"
                sort_keys_a+=("${src_name}|${idx}")
            done

            IFS=$'\n' sort_keys_a=($(printf "%s\n" "${sort_keys_a[@]}" | LC_ALL=C sort))
            unset IFS

            for sk in "${sort_keys_a[@]}"; do
                idx="${sk##*|}"
                local entry="${audio_entries[${idx}]}"

                local src_filename title tracker channels samples patterns conv_tool conv_at
                src_filename="$(get_meta_value "${entry}" "source.filename")"
                title="$(get_meta_value "${entry}" "module.title")"
                tracker="$(get_meta_value "${entry}" "module.tracker")"
                channels="$(get_meta_value "${entry}" "module.channels")"
                samples="$(get_meta_value "${entry}" "module.samples")"
                patterns="$(get_meta_value "${entry}" "module.patterns")"
                conv_tool="$(get_meta_value "${entry}" "conversion.tool")"
                conv_at="$(get_meta_value "${entry}" "conversion.converted_at")"

                # Collect output formats from parsed data
                local formats_str=""
                local fi_idx=0
                while true; do
                    local fmt_val
                    fmt_val="$(get_meta_value "${entry}" "conversion.outputs.${fi_idx}")"
                    if [[ -z "${fmt_val}" ]]; then
                        break
                    fi
                    # Extract format from "format: wav" or just "wav"
                    local fmt_name="${fmt_val%%:*}"
                    fmt_name="$(printf "%s" "${fmt_name}" | tr -d '[:space:]')"
                    if [[ -n "${formats_str}" ]]; then
                        formats_str="${formats_str}, ${fmt_name}"
                    else
                        formats_str="${fmt_name}"
                    fi
                    fi_idx=$(( fi_idx + 1 ))
                done

                [[ -z "${title}" ]] && title=""
                [[ -z "${tracker}" ]] && tracker="unknown"
                [[ -z "${channels}" ]] && channels="0"
                [[ -z "${samples}" ]] && samples="0"
                [[ -z "${conv_tool}" ]] && conv_tool="unknown"
                [[ -z "${conv_at}" ]] && conv_at="${timestamp}"

                printf "    - source: \"%s\"\n" "${src_filename}"
                printf "      title: \"%s\"\n" "${title}"
                printf "      tracker: %s\n" "${tracker}"
                printf "      channels: %s\n" "${channels}"
                printf "      samples: %s\n" "${samples}"
                printf "      patterns: %s\n" "${patterns:-0}"
                printf "      converted_with: %s\n" "${conv_tool}"
                printf "      converted_at: \"%s\"\n" "${conv_at}"
            done
        fi
    } > "${OUTPUT_FILE}"

    # Validate output: no tab characters
    if grep -Pq '\t' "${OUTPUT_FILE}" 2>/dev/null; then
        warn "Catalog contains tab characters -- may not be valid YAML"
    fi

    # Print summary
    printf "\nAsset catalog generated:\n"
    printf "  File:     %s\n" "${OUTPUT_FILE}"
    printf "  Images:   %s entries\n" "${image_count}"
    printf "  Audio:    %s entries\n" "${audio_count}"
    printf "  Total:    %s entries\n" "${total_assets}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"
    validate_input

    # Collect all .meta.yaml files
    local meta_files=()
    while IFS= read -r -d '' file; do
        meta_files+=("${file}")
    done < <(find "${CONVERTED_DIR}" -name "*.meta.yaml" -type f -print0 2>/dev/null)

    # Sort for deterministic processing
    if [[ ${#meta_files[@]} -gt 0 ]]; then
        IFS=$'\n' meta_files=($(printf "%s\n" "${meta_files[@]}" | LC_ALL=C sort))
        unset IFS
    fi

    if [[ ${#meta_files[@]} -eq 0 ]]; then
        printf "ERROR: No .meta.yaml files found in %s\n" "${CONVERTED_DIR}" >&2
        exit 2
    fi

    generate_catalog meta_files
}

main "$@"

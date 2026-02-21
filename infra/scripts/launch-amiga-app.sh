#!/usr/bin/env bash
# launch-amiga-app.sh -- Amiga application profile launcher
#
# Merges base.uae + application-specific profile, substitutes runtime
# display/audio values from local-values.yaml, and launches FS-UAE.
#
# Usage:
#   launch-amiga-app.sh <profile-name> [--rom <path>] [--adf <path>] [--hdf <path>] [--dry-run]
#
# Profile names: deluxe-paint, octamed, protracker, ppaint, whdload
#   or a path to a custom .uae file.
#
# Exit codes:
#   0 = success
#   1 = general error
#   2 = fs-uae not found
#   3 = profile not found

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants and paths
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="${SCRIPT_DIR}/../amiga/profiles"
BASE_PROFILE="${PROFILES_DIR}/base.uae"
LOCAL_VALUES="${SCRIPT_DIR}/../local/local-values.yaml"
EXCHANGE_PATH_FILE="${SCRIPT_DIR}/../local/amiga-exchange.path"

# Default values when local-values.yaml is missing
DEFAULT_DISPLAY="opengl"
DEFAULT_SAMPLE_RATE="44100"
DEFAULT_BUFFER_SIZE="512"

# Temp file for merged config (cleaned up in trap)
MERGED_CONFIG=""

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

cleanup() {
    if [[ -n "${MERGED_CONFIG}" && -f "${MERGED_CONFIG}" ]]; then
        rm -f "${MERGED_CONFIG}"
    fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: launch-amiga-app.sh <profile-name> [OPTIONS]

Profile names:
  deluxe-paint    OCS/68000 pixel art (Deluxe Paint IV)
  octamed         AGA/68020 multi-channel tracker (OctaMED SoundStudio)
  protracker      OCS/68000 classic 4-channel tracker (ProTracker)
  ppaint          AGA/68020 hi-color pixel art (Personal Paint)
  whdload         AGA/68020 hard-drive software loading (WHDLoad)
  <path>          Path to a custom .uae profile file

Options:
  --rom <path>    Override kickstart ROM file
  --adf <path>    Mount floppy disk image (ADF)
  --hdf <path>    Mount hard disk file (HDF)
  --dry-run       Print merged config to stdout without launching
  --help          Show this help message

Exit codes:
  0  Success
  1  General error
  2  FS-UAE not found (skipped in --dry-run mode)
  3  Profile not found
USAGE
}

# ---------------------------------------------------------------------------
# Minimal YAML reader (section-aware awk parser)
# ---------------------------------------------------------------------------
# Reads a value from local-values.yaml given a dotted key path.
# Example: yaml_val "gpu.uae_display" reads the uae_display key under gpu section.
# Falls back gracefully if the file or key is missing.

yaml_val() {
    local dotted_key="$1"
    local file="${2:-${LOCAL_VALUES}}"

    if [[ ! -f "${file}" ]]; then
        return 1
    fi

    local section key
    section="${dotted_key%%.*}"
    key="${dotted_key#*.}"

    # If no dot in key, it's a top-level key
    if [[ "${section}" == "${key}" ]]; then
        awk -v key="${key}" '
            /^[[:space:]]*#/ { next }
            /^[a-zA-Z]/ && $1 ~ key":" {
                val = $0
                sub(/^[^:]+:[[:space:]]*/, "", val)
                gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
                gsub(/^["'"'"']|["'"'"']$/, "", val)
                print val
                exit
            }
        ' "${file}"
        return
    fi

    # Section-aware parsing: find the section, then the key within it
    awk -v section="${section}" -v key="${key}" '
        BEGIN { in_section = 0 }
        /^[[:space:]]*#/ { next }
        /^[a-zA-Z]/ {
            if ($0 ~ "^" section ":") {
                in_section = 1
                next
            } else if (in_section) {
                exit
            }
        }
        in_section && /^[[:space:]]/ {
            line = $0
            gsub(/^[[:space:]]+/, "", line)
            if (line ~ "^" key ":") {
                val = line
                sub(/^[^:]+:[[:space:]]*/, "", val)
                gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)
                gsub(/^["'"'"']|["'"'"']$/, "", val)
                print val
                exit
            }
        }
    ' "${file}"
}

# ---------------------------------------------------------------------------
# Profile merging
# ---------------------------------------------------------------------------
# Merge base profile with application profile. Later values for the same
# key override earlier ones (last-write-wins).

merge_profiles() {
    local base_file="$1"
    local app_file="$2"
    local output_file="$3"

    # Collect all key=value pairs from both files.
    # Use an associative approach: read base first, then app overrides.
    # Preserve comments from the app profile for context.
    {
        # Start with a header
        printf "# GSD Amiga Merged Configuration\n"
        printf "# Base: %s\n" "$(basename "${base_file}")"
        printf "# Profile: %s\n" "$(basename "${app_file}")"
        printf "# Generated: %s\n" "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
        printf "#\n"
    } > "${output_file}"

    # Use awk to merge: read both files, last value wins for duplicate keys
    awk '
        BEGIN { n = 0 }
        /^[[:space:]]*#/ { next }
        /^[[:space:]]*$/ { next }
        /=/ {
            # Extract key (everything before first =)
            key = $0
            sub(/=.*/, "", key)
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", key)

            # Extract value (everything after first =)
            val = $0
            sub(/[^=]*=/, "", val)
            gsub(/^[[:space:]]+|[[:space:]]+$/, "", val)

            if (!(key in order)) {
                order[key] = n++
                keys[order[key]] = key
            }
            values[key] = val
        }
        END {
            for (i = 0; i < n; i++) {
                k = keys[i]
                printf "%s=%s\n", k, values[k]
            }
        }
    ' "${base_file}" "${app_file}" >> "${output_file}"
}

# ---------------------------------------------------------------------------
# Display backend mapping
# ---------------------------------------------------------------------------
# Map local-values gpu.uae_display to FS-UAE gfx_api value.
# FS-UAE uses OpenGL internally; Vulkan maps to opengl, software to null.

map_display_backend() {
    local display="$1"
    case "${display}" in
        vulkan)   printf "opengl" ;;
        opengl)   printf "opengl" ;;
        software) printf "null" ;;
        *)        printf "opengl" ;;
    esac
}

# ---------------------------------------------------------------------------
# ROM detection
# ---------------------------------------------------------------------------
# Search standard kickstart ROM locations. Returns path to first found ROM
# or empty string if none found.

find_kickstart_rom() {
    local search_paths=(
        "${HOME}/.config/fs-uae/Kickstarts/kick31.rom"
        "${HOME}/.config/fs-uae/Kickstarts/kick13.rom"
        "${HOME}/.config/fs-uae/Kickstarts/amiga-os-310-a1200.rom"
        "/usr/share/fs-uae/kickstarts/kick31.rom"
        "/usr/share/fs-uae/kickstarts/kick13.rom"
    )

    for rom_path in "${search_paths[@]}"; do
        if [[ -f "${rom_path}" ]]; then
            printf "%s" "${rom_path}"
            return 0
        fi
    done

    # AROS fallback locations
    local aros_paths=(
        "${HOME}/.local/share/gsd-amiga/aros/aros-amiga-m68k-rom.bin"
        "/usr/share/aros/aros-amiga-m68k-rom.bin"
    )

    for rom_path in "${aros_paths[@]}"; do
        if [[ -f "${rom_path}" ]]; then
            printf "%s" "${rom_path}"
            return 0
        fi
    done

    return 1
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

PROFILE_NAME=""
ROM_PATH=""
ADF_PATH=""
HDF_PATH=""
DRY_RUN=false

parse_args() {
    if [[ $# -eq 0 ]]; then
        usage >&2
        exit 1
    fi

    PROFILE_NAME="$1"
    shift

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --rom)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --rom requires a path argument\n" >&2
                    exit 1
                fi
                ROM_PATH="$2"
                shift 2
                ;;
            --adf)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --adf requires a path argument\n" >&2
                    exit 1
                fi
                ADF_PATH="$2"
                shift 2
                ;;
            --hdf)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --hdf requires a path argument\n" >&2
                    exit 1
                fi
                HDF_PATH="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                printf "ERROR: Unknown option: %s\n" "$1" >&2
                usage >&2
                exit 1
                ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"

    # Resolve profile file path
    local profile_file=""

    if [[ -f "${PROFILE_NAME}" ]]; then
        # Absolute or relative path to a .uae file
        profile_file="${PROFILE_NAME}"
    elif [[ -f "${PROFILES_DIR}/${PROFILE_NAME}.uae" ]]; then
        profile_file="${PROFILES_DIR}/${PROFILE_NAME}.uae"
    else
        printf "ERROR: Profile not found: %s\n" "${PROFILE_NAME}" >&2
        printf "  Looked in: %s/%s.uae\n" "${PROFILES_DIR}" "${PROFILE_NAME}" >&2
        printf "  Available profiles: " >&2
        local available
        available="$(ls "${PROFILES_DIR}"/*.uae 2>/dev/null | xargs -I{} basename {} .uae | grep -v base | tr '\n' ' ')"
        printf "%s\n" "${available:-none}" >&2
        exit 3
    fi

    # Verify base profile exists
    if [[ ! -f "${BASE_PROFILE}" ]]; then
        printf "ERROR: Base profile not found: %s\n" "${BASE_PROFILE}" >&2
        exit 1
    fi

    # Create merged temp config
    MERGED_CONFIG="$(mktemp /tmp/gsd-amiga-XXXXXX.uae)"

    # Merge base + app profile
    merge_profiles "${BASE_PROFILE}" "${profile_file}" "${MERGED_CONFIG}"

    # --- Substitute runtime values from local-values.yaml ---

    local uae_display="${DEFAULT_DISPLAY}"
    local uae_sample_rate="${DEFAULT_SAMPLE_RATE}"
    local uae_buffer_size="${DEFAULT_BUFFER_SIZE}"

    if [[ -f "${LOCAL_VALUES}" ]]; then
        local lv_display lv_rate lv_buffer
        lv_display="$(yaml_val "gpu.uae_display" || true)"
        lv_rate="$(yaml_val "audio.recommended_sample_rate" || true)"
        lv_buffer="$(yaml_val "audio.recommended_buffer_size" || true)"

        [[ -n "${lv_display}" ]] && uae_display="${lv_display}"
        [[ -n "${lv_rate}" ]] && uae_sample_rate="${lv_rate}"
        [[ -n "${lv_buffer}" ]] && uae_buffer_size="${lv_buffer}"
    else
        printf "[WARN] local-values.yaml not found at %s\n" "${LOCAL_VALUES}" >&2
        printf "[WARN] Using defaults: display=%s, sample_rate=%s, buffer=%s\n" \
            "${DEFAULT_DISPLAY}" "${DEFAULT_SAMPLE_RATE}" "${DEFAULT_BUFFER_SIZE}" >&2
    fi

    # Map display backend to FS-UAE value
    local fsuae_display
    fsuae_display="$(map_display_backend "${uae_display}")"

    # Replace placeholders in merged config
    local temp_sub
    temp_sub="$(mktemp /tmp/gsd-amiga-sub-XXXXXX.uae)"

    sed \
        -e "s|__UAE_DISPLAY__|${fsuae_display}|g" \
        -e "s|__UAE_SAMPLE_RATE__|${uae_sample_rate}|g" \
        -e "s|__UAE_BUFFER_SIZE__|${uae_buffer_size}|g" \
        "${MERGED_CONFIG}" > "${temp_sub}"
    mv "${temp_sub}" "${MERGED_CONFIG}"

    # --- Set ROM ---
    if [[ -n "${ROM_PATH}" ]]; then
        printf "kickstart_file=%s\n" "${ROM_PATH}" >> "${MERGED_CONFIG}"
    else
        local found_rom=""
        found_rom="$(find_kickstart_rom 2>/dev/null || true)"
        if [[ -n "${found_rom}" ]]; then
            printf "kickstart_file=%s\n" "${found_rom}" >> "${MERGED_CONFIG}"
        fi
    fi

    # --- Set ADF (floppy image) ---
    if [[ -n "${ADF_PATH}" ]]; then
        printf "floppy0=%s\n" "${ADF_PATH}" >> "${MERGED_CONFIG}"
    fi

    # --- Set HDF (hard disk file) ---
    if [[ -n "${HDF_PATH}" ]]; then
        printf "hardfile2=rw,%s,32,1,2,512,,\n" "${HDF_PATH}" >> "${MERGED_CONFIG}"
    fi

    # --- Set exchange directory filesystem mapping ---
    local exchange_dir=""
    if [[ -f "${EXCHANGE_PATH_FILE}" ]]; then
        exchange_dir="$(cat "${EXCHANGE_PATH_FILE}" 2>/dev/null | tr -d '[:space:]')"
    fi
    if [[ -z "${exchange_dir}" ]]; then
        exchange_dir="${HOME}/.local/share/gsd-amiga/exchange"
    fi
    if [[ -d "${exchange_dir}" ]]; then
        printf "filesystem2=rw,Exchange:%s,0\n" "${exchange_dir}" >> "${MERGED_CONFIG}"
    fi

    # --- Dry run: print config and exit ---
    if [[ "${DRY_RUN}" == true ]]; then
        cat "${MERGED_CONFIG}"
        exit 0
    fi

    # --- Detect and launch FS-UAE ---
    local fsuae_bin=""
    if command -v fs-uae &>/dev/null; then
        fsuae_bin="fs-uae"
    elif command -v fs-uae-launcher &>/dev/null; then
        fsuae_bin="fs-uae-launcher"
    else
        printf "ERROR: FS-UAE not found in PATH\n" >&2
        printf "  Install FS-UAE: https://fs-uae.net/download\n" >&2
        printf "  Or run: infra/scripts/install-fs-uae.sh\n" >&2
        exit 2
    fi

    printf "Launching %s with profile: %s\n" "${fsuae_bin}" "${PROFILE_NAME}" >&2
    exec "${fsuae_bin}" "${MERGED_CONFIG}"
}

main "$@"

#!/usr/bin/env bash
# shellcheck disable=SC2034 # variables used by sourced libs or in later phases
# convert-tracker.sh -- MOD/MED to WAV/FLAC/OGG renderer with metadata extraction
#
# Renders Amiga tracker music files (MOD, MED, S3M, XM, IT) to modern audio
# formats (WAV, FLAC, OGG) while preserving original module metadata (title,
# tracker, channels, samples, patterns) in a YAML sidecar file.
#
# Uses openmpt123 (libopenmpt) as primary renderer for sample-accurate playback
# with correct Amiga filter emulation, with ffmpeg as fallback.
#
# Usage:
#   convert-tracker.sh <input.mod> [--output <dir>] [--format wav|flac|ogg|all]
#                      [--sample-rate 44100|48000] [--no-meta] [--dry-run]
#
# Exit codes:
#   0 = success
#   1 = general error
#   2 = no rendering tool found
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

# Supported extensions (case-insensitive)
SUPPORTED_EXTENSIONS="mod|med|med3|med4|oct|okt|s3m|xm|it"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: convert-tracker.sh <input.mod> [OPTIONS]

Render tracker music files to WAV, FLAC, or OGG with metadata sidecar.

Arguments:
  <input>                Input tracker file (required)

Options:
  --output <dir>         Output directory (default: same as input file)
  --format <fmt>         Output format: wav (default), flac, ogg, all
  --sample-rate <rate>   Sample rate: 44100 or 48000 (default: 48000)
  --no-meta              Suppress metadata sidecar generation
  --dry-run              Show what would happen without writing files
  --help                 Show this help message
  --version              Show version

Supported input formats (case-insensitive):
  .mod  -- Amiga ProTracker / NoiseTracker modules
  .med  -- OctaMED modules
  .med3, .med4 -- OctaMED v3/v4 modules
  .oct, .okt -- Oktalyzer modules
  .s3m  -- Scream Tracker 3 modules
  .xm   -- FastTracker II modules
  .it   -- Impulse Tracker modules

Rendering tools (in priority order):
  1. openmpt123 (libopenmpt)  -- highest quality, correct Amiga filter emulation
  2. ffmpeg with libopenmpt   -- uses same decoder, file-based workflow
  3. sox                      -- fallback, limited format support

Output formats:
  wav  -- Uncompressed PCM audio (highest quality, largest files)
  flac -- Lossless compressed (bit-perfect, ~50% size reduction)
  ogg  -- Lossy Vorbis (~192kbps VBR, good quality for tracker music)
  all  -- Produces WAV + FLAC + OGG from a single render

Metadata sidecar (.meta.yaml) includes:
  - Source filename, format, size
  - Module title, tracker name, channel count
  - Pattern count, sample count, instrument count
  - Conversion tool, sample rate, output files
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

INPUT_FILE=""
OUTPUT_DIR=""
OUTPUT_FORMAT="wav"
SAMPLE_RATE=48000
GENERATE_META=true
DRY_RUN=false

parse_args() {
    if [[ $# -eq 0 ]]; then
        printf "ERROR: No input file specified\n" >&2
        printf "Usage: convert-tracker.sh <input.mod> [OPTIONS]\n" >&2
        printf "Try 'convert-tracker.sh --help' for more information.\n" >&2
        exit 3
    fi

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --help)
                usage
                exit 0
                ;;
            --version)
                printf "convert-tracker.sh %s\n" "${VERSION}"
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
                    printf "ERROR: --format requires an argument (wav, flac, ogg, or all)\n" >&2
                    exit 1
                fi
                OUTPUT_FORMAT="$2"
                case "${OUTPUT_FORMAT}" in
                    wav|flac|ogg|all)
                        ;;
                    *)
                        printf "ERROR: Unsupported format '%s' (use wav, flac, ogg, or all)\n" "${OUTPUT_FORMAT}" >&2
                        exit 1
                        ;;
                esac
                shift 2
                ;;
            --sample-rate)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --sample-rate requires an argument (44100 or 48000)\n" >&2
                    exit 1
                fi
                SAMPLE_RATE="$2"
                case "${SAMPLE_RATE}" in
                    44100|48000)
                        ;;
                    *)
                        printf "ERROR: Unsupported sample rate '%s' (use 44100 or 48000)\n" "${SAMPLE_RATE}" >&2
                        exit 1
                        ;;
                esac
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

    if ! printf "%s" "${ext}" | grep -qE "^(${SUPPORTED_EXTENSIONS})$"; then
        printf "ERROR: Unsupported file extension '.%s'\n" "${ext}" >&2
        printf "  Supported: .mod, .med, .med3, .med4, .oct, .okt, .s3m, .xm, .it\n" >&2
        exit 3
    fi

    # Set default output directory
    if [[ -z "${OUTPUT_DIR}" ]]; then
        OUTPUT_DIR="$(dirname "${INPUT_FILE}")"
    fi
}

# ---------------------------------------------------------------------------
# Tool detection
# ---------------------------------------------------------------------------

RENDER_TOOL=""
RENDER_TOOL_NAME=""
HAS_FFMPEG=false
HAS_FLAC_CLI=false
HAS_OGGENC=false

detect_tool() {
    # Check transcoding tools availability (needed for FLAC/OGG from WAV)
    if has_command ffmpeg; then
        HAS_FFMPEG=true
    fi
    if has_command flac; then
        HAS_FLAC_CLI=true
    fi
    if has_command oggenc; then
        HAS_OGGENC=true
    fi

    # Primary: openmpt123
    if has_command openmpt123; then
        RENDER_TOOL="openmpt123"
        RENDER_TOOL_NAME="openmpt123"
        return 0
    fi

    # Secondary: ffmpeg with libopenmpt
    # Note: use a variable to capture demuxer list to avoid SIGPIPE with pipefail
    if [[ "${HAS_FFMPEG}" == "true" ]]; then
        local demuxer_list
        demuxer_list="$(ffmpeg -demuxers 2>/dev/null || true)"
        if printf "%s" "${demuxer_list}" | grep -q "libopenmpt" 2>/dev/null; then
            RENDER_TOOL="ffmpeg"
            RENDER_TOOL_NAME="ffmpeg (libopenmpt)"
            return 0
        fi
    fi

    # Tertiary: sox
    if has_command sox; then
        RENDER_TOOL="sox"
        RENDER_TOOL_NAME="sox"
        return 0
    fi

    printf "ERROR: No tracker music rendering tool found.\n" >&2
    printf "  Install one of:\n" >&2
    printf "    openmpt123 (libopenmpt) -- recommended, highest quality\n" >&2
    printf "    ffmpeg with libopenmpt  -- uses same decoder\n" >&2
    printf "    sox                     -- fallback, limited format support\n" >&2
    printf "\n" >&2
    printf "  Install commands:\n" >&2
    printf "    Fedora/RHEL: sudo dnf install libopenmpt-tools\n" >&2
    printf "    Debian/Ubuntu: sudo apt install openmpt123\n" >&2
    printf "    Arch: sudo pacman -S openmpt123\n" >&2
    exit 2
}

# ---------------------------------------------------------------------------
# Metadata extraction
# ---------------------------------------------------------------------------

META_TITLE=""
META_FORMAT=""
META_TRACKER=""
META_CHANNELS=0
META_ORDERS=0
META_PATTERNS=0
META_SAMPLES=0
META_INSTRUMENTS=0

extract_metadata() {
    local file="$1"

    # Detect format from extension
    local ext
    ext="${file##*.}"
    ext="$(printf "%s" "${ext}" | tr '[:upper:]' '[:lower:]')"
    META_FORMAT="$(printf "%s" "${ext}" | tr '[:lower:]' '[:upper:]')"

    # Try openmpt123 --info first (most complete)
    if has_command openmpt123; then
        _extract_via_openmpt123 "${file}"
        # If openmpt123 didn't fill all fields, supplement from header
        if [[ "${META_CHANNELS}" -eq 0 || "${META_SAMPLES}" -eq 0 ]]; then
            _extract_from_header "${file}" "${ext}"
        fi
        return 0
    fi

    # Always parse the binary header for module-specific metadata (channels, samples, patterns)
    # ffprobe only returns rendered audio stream info, not module structure
    _extract_from_header "${file}" "${ext}"

    # Supplement with ffprobe for title if not found from header
    if has_command ffprobe && [[ -z "${META_TITLE}" ]]; then
        _extract_via_ffprobe "${file}"
    fi
}

# Extract metadata using openmpt123 --info
_extract_via_openmpt123() {
    local file="$1"
    local info_output
    info_output="$(openmpt123 --info "${file}" 2>/dev/null)" || {
        warn "openmpt123 --info failed, falling back to header parsing"
        local ext
        ext="${file##*.}"
        ext="$(printf "%s" "${ext}" | tr '[:upper:]' '[:lower:]')"
        _extract_from_header "${file}" "${ext}"
        return 0
    }

    # Parse openmpt123 --info output (key: value format)
    local line key value
    while IFS= read -r line; do
        # Skip empty lines
        [[ -z "${line}" ]] && continue
        # Extract key: value pairs
        if [[ "${line}" =~ ^([^:]+):[[:space:]]*(.*) ]]; then
            key="$(printf "%s" "${BASH_REMATCH[1]}" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')"
            value="${BASH_REMATCH[2]}"
            case "${key}" in
                title|type.long|type|tracker|originaltracker)
                    [[ -z "${META_TITLE}" && "${key}" == "title" ]] && META_TITLE="${value}"
                    [[ "${key}" =~ tracker ]] && META_TRACKER="${value}"
                    ;;
                channels|numchannels)
                    META_CHANNELS="${value//[^0-9]/}"
                    ;;
                orders|numorders)
                    META_ORDERS="${value//[^0-9]/}"
                    ;;
                patterns|numpatterns)
                    META_PATTERNS="${value//[^0-9]/}"
                    ;;
                samples|numsamples)
                    META_SAMPLES="${value//[^0-9]/}"
                    ;;
                instruments|numinstruments)
                    META_INSTRUMENTS="${value//[^0-9]/}"
                    ;;
            esac
        fi
    done <<< "${info_output}"
}

# Extract metadata using ffprobe
_extract_via_ffprobe() {
    local file="$1"
    local probe_output
    probe_output="$(ffprobe -v quiet -show_format -show_streams "${file}" 2>/dev/null)" || {
        local ext
        ext="${file##*.}"
        ext="$(printf "%s" "${ext}" | tr '[:upper:]' '[:lower:]')"
        _extract_from_header "${file}" "${ext}"
        return 0
    }

    # Parse title from format tags
    local line
    while IFS= read -r line; do
        if [[ "${line}" =~ TAG:title=(.*) ]]; then
            META_TITLE="${BASH_REMATCH[1]}"
        fi
        if [[ "${line}" =~ channels=(.*) ]]; then
            local ch="${BASH_REMATCH[1]}"
            # ffprobe returns rendered channels (2 for stereo), not module channels
            # Keep module channels if already set
            if [[ "${META_CHANNELS}" -eq 0 ]]; then
                META_CHANNELS="${ch//[^0-9]/}"
            fi
        fi
    done <<< "${probe_output}"
}

# Extract basic metadata from file headers using binary inspection
_extract_from_header() {
    local file="$1"
    local ext="$2"
    local file_size
    file_size="$(stat -c %s "${file}" 2>/dev/null || echo "0")"

    case "${ext}" in
        mod)
            _parse_mod_header "${file}" "${file_size}"
            ;;
        med|med3|med4)
            _parse_med_header "${file}" "${file_size}"
            ;;
        s3m)
            _parse_s3m_header "${file}" "${file_size}"
            ;;
        xm)
            _parse_xm_header "${file}" "${file_size}"
            ;;
        *)
            # No header parser for this format
            META_TRACKER="unknown"
            ;;
    esac
}

# Parse MOD file header for metadata
_parse_mod_header() {
    local file="$1"
    local file_size="$2"

    # MOD title: first 20 bytes (ASCII, null-padded)
    if [[ "${file_size}" -ge 20 ]]; then
        META_TITLE="$(dd if="${file}" bs=1 count=20 skip=0 2>/dev/null | tr -d '\0' | tr -d '\n')"
        # Trim trailing spaces
        META_TITLE="$(printf "%s" "${META_TITLE}" | sed 's/[[:space:]]*$//')"
    fi

    # MOD signature at offset 1080 (4 bytes)
    if [[ "${file_size}" -ge 1084 ]]; then
        local sig
        sig="$(dd if="${file}" bs=1 count=4 skip=1080 2>/dev/null | tr -d '\0')"
        case "${sig}" in
            M.K.|M!K!|FLT4)
                META_CHANNELS=4
                META_TRACKER="ProTracker"
                ;;
            6CHN)
                META_CHANNELS=6
                META_TRACKER="ProTracker"
                ;;
            8CHN|FLT8)
                META_CHANNELS=8
                META_TRACKER="ProTracker"
                ;;
            CD81|OCTA)
                META_CHANNELS=8
                META_TRACKER="Oktalyzer"
                ;;
            *)
                # Check for xCHN pattern
                if [[ "${sig}" =~ ^[0-9]+CHN$ ]]; then
                    META_CHANNELS="${sig%%CHN}"
                    META_TRACKER="FastTracker"
                elif [[ "${sig}" =~ ^[0-9]+CH$ ]]; then
                    META_CHANNELS="${sig%%CH}"
                    META_TRACKER="FastTracker"
                else
                    # 15-sample MOD (no signature)
                    META_CHANNELS=4
                    META_TRACKER="Ultimate SoundTracker"
                fi
                ;;
        esac

        # Count samples from header (31 samples for M.K. format)
        # Each sample header is 30 bytes starting at offset 20
        if [[ "${file_size}" -ge 950 ]]; then
            local i sample_name sample_len
            META_SAMPLES=0
            for (( i = 0; i < 31; i++ )); do
                local offset=$(( 20 + i * 30 ))
                # Read sample length (2 bytes BE at offset+22 in sample entry)
                sample_len="$(od -A n -t u2 -j $((offset + 22)) -N 2 --endian=big "${file}" 2>/dev/null | tr -d ' ')"
                if [[ "${sample_len}" -gt 0 ]] 2>/dev/null; then
                    META_SAMPLES=$(( META_SAMPLES + 1 ))
                fi
            done
        fi
    fi

    # Song length (number of orders) at byte 950
    if [[ "${file_size}" -ge 951 ]]; then
        META_ORDERS="$(od -A n -t u1 -j 950 -N 1 "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Count unique patterns from pattern table (bytes 952-1079)
    if [[ "${file_size}" -ge 1080 ]]; then
        local max_pat=0
        local pat_val
        for (( i = 0; i < 128; i++ )); do
            pat_val="$(od -A n -t u1 -j $((952 + i)) -N 1 "${file}" 2>/dev/null | tr -d ' ')"
            if [[ "${pat_val}" -gt "${max_pat}" ]] 2>/dev/null; then
                max_pat="${pat_val}"
            fi
        done
        META_PATTERNS=$(( max_pat + 1 ))
    fi
}

# Parse MED file header for metadata
_parse_med_header() {
    local file="$1"
    local file_size="$2"

    if [[ "${file_size}" -lt 4 ]]; then
        return
    fi

    local sig
    sig="$(dd if="${file}" bs=1 count=4 skip=0 2>/dev/null)"
    case "${sig}" in
        MMD0) META_TRACKER="OctaMED" ;;
        MMD1) META_TRACKER="OctaMED" ;;
        MMD2) META_TRACKER="OctaMED" ;;
        MMD3) META_TRACKER="OctaMED SoundStudio" ;;
        *)    META_TRACKER="MED (unknown version)" ;;
    esac

    # MED channel count varies; default to 4
    if [[ "${META_CHANNELS}" -eq 0 ]]; then
        META_CHANNELS=4
    fi
}

# Parse S3M file header for metadata
_parse_s3m_header() {
    local file="$1"
    local file_size="$2"

    # S3M title: first 28 bytes
    if [[ "${file_size}" -ge 28 ]]; then
        META_TITLE="$(dd if="${file}" bs=1 count=28 skip=0 2>/dev/null | tr -d '\0' | tr -d '\n')"
        META_TITLE="$(printf "%s" "${META_TITLE}" | sed 's/[[:space:]]*$//')"
    fi

    META_TRACKER="Scream Tracker 3"

    # Orders at offset 32 (uint16 LE)
    if [[ "${file_size}" -ge 34 ]]; then
        META_ORDERS="$(od -A n -t u2 -j 32 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Instruments at offset 34 (uint16 LE)
    if [[ "${file_size}" -ge 36 ]]; then
        META_SAMPLES="$(od -A n -t u2 -j 34 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Patterns at offset 36 (uint16 LE)
    if [[ "${file_size}" -ge 38 ]]; then
        META_PATTERNS="$(od -A n -t u2 -j 36 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi
}

# Parse XM file header for metadata
_parse_xm_header() {
    local file="$1"
    local file_size="$2"

    # XM ID: "Extended Module: " at offset 0 (17 bytes)
    # XM title: 20 bytes at offset 17
    if [[ "${file_size}" -ge 37 ]]; then
        META_TITLE="$(dd if="${file}" bs=1 count=20 skip=17 2>/dev/null | tr -d '\0' | tr -d '\n')"
        META_TITLE="$(printf "%s" "${META_TITLE}" | sed 's/[[:space:]]*$//')"
    fi

    META_TRACKER="FastTracker II"

    # Header size at offset 60 (uint32 LE)
    # Song length (orders) at offset 64 (uint16 LE)
    if [[ "${file_size}" -ge 66 ]]; then
        META_ORDERS="$(od -A n -t u2 -j 64 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Channels at offset 68 (uint16 LE)
    if [[ "${file_size}" -ge 70 ]]; then
        META_CHANNELS="$(od -A n -t u2 -j 68 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Patterns at offset 70 (uint16 LE)
    if [[ "${file_size}" -ge 72 ]]; then
        META_PATTERNS="$(od -A n -t u2 -j 70 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi

    # Instruments at offset 72 (uint16 LE)
    if [[ "${file_size}" -ge 74 ]]; then
        META_INSTRUMENTS="$(od -A n -t u2 -j 72 -N 2 --endian=little "${file}" 2>/dev/null | tr -d ' ')"
    fi
}

# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

# Render input file to WAV using the detected tool.
# Returns 0 on success, 1 on failure.
render_to_wav() {
    local input="$1"
    local output="$2"
    local rate="$3"

    case "${RENDER_TOOL}" in
        openmpt123)
            openmpt123 --render --output "${output}" --samplerate "${rate}" \
                --channels 2 --float "${input}" 2>/dev/null || {
                warn "openmpt123 render failed, trying ffmpeg fallback"
                if [[ "${HAS_FFMPEG}" == "true" ]]; then
                    ffmpeg -y -i "${input}" -ar "${rate}" -ac 2 "${output}" 2>/dev/null
                else
                    return 1
                fi
            }
            ;;
        ffmpeg)
            ffmpeg -y -i "${input}" -ar "${rate}" -ac 2 "${output}" 2>/dev/null || return 1
            ;;
        sox)
            sox "${input}" -r "${rate}" -c 2 "${output}" 2>/dev/null || return 1
            ;;
    esac

    return 0
}

# Render directly to a specific format using ffmpeg (skips WAV intermediate)
render_direct() {
    local input="$1"
    local output="$2"
    local rate="$3"
    local format="$4"

    if [[ "${RENDER_TOOL}" == "ffmpeg" ]]; then
        case "${format}" in
            flac)
                ffmpeg -y -i "${input}" -ar "${rate}" -ac 2 -compression_level 8 "${output}" 2>/dev/null
                return $?
                ;;
            ogg)
                ffmpeg -y -i "${input}" -ar "${rate}" -ac 2 -c:a libvorbis -q:a 6 "${output}" 2>/dev/null
                return $?
                ;;
        esac
    fi

    return 1
}

# Transcode WAV to FLAC
transcode_to_flac() {
    local wav_input="$1"
    local flac_output="$2"

    if [[ "${HAS_FLAC_CLI}" == "true" ]]; then
        flac --best --silent "${wav_input}" -o "${flac_output}" 2>/dev/null && return 0
    fi

    if [[ "${HAS_FFMPEG}" == "true" ]]; then
        ffmpeg -y -i "${wav_input}" -c:a flac -compression_level 8 "${flac_output}" 2>/dev/null && return 0
    fi

    warn "Cannot transcode to FLAC: neither flac nor ffmpeg available"
    return 1
}

# Transcode WAV to OGG Vorbis
transcode_to_ogg() {
    local wav_input="$1"
    local ogg_output="$2"

    if [[ "${HAS_OGGENC}" == "true" ]]; then
        oggenc -q 6 "${wav_input}" -o "${ogg_output}" 2>/dev/null && return 0
    fi

    if [[ "${HAS_FFMPEG}" == "true" ]]; then
        ffmpeg -y -i "${wav_input}" -c:a libvorbis -q:a 6 "${ogg_output}" 2>/dev/null && return 0
    fi

    warn "Cannot transcode to OGG: neither oggenc nor ffmpeg available"
    return 1
}

# ---------------------------------------------------------------------------
# Output verification
# ---------------------------------------------------------------------------

verify_output() {
    local output="$1"
    local expected_rate="$2"

    if [[ ! -f "${output}" ]]; then
        printf "ERROR: Render failed -- output file not created: %s\n" "${output}" >&2
        return 1
    fi

    if [[ ! -s "${output}" ]]; then
        printf "ERROR: Render failed -- output file is empty: %s\n" "${output}" >&2
        rm -f "${output}"
        return 1
    fi

    # Optional sample rate / channel verification via ffprobe
    if has_command ffprobe; then
        local probe_sr
        probe_sr="$(ffprobe -v quiet -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "${output}" 2>/dev/null || echo "")"
        if [[ -n "${probe_sr}" && "${probe_sr}" != "${expected_rate}" ]]; then
            warn "Sample rate mismatch: expected ${expected_rate}, got ${probe_sr}"
        fi
    fi

    return 0
}

# ---------------------------------------------------------------------------
# Metadata sidecar generation
# ---------------------------------------------------------------------------

generate_metadata() {
    local input="$1"
    local meta_file="$2"
    shift 2
    # Remaining args are output file paths
    local output_files=("$@")

    local input_basename
    input_basename="$(basename "${input}")"
    local input_size
    input_size="$(stat -c %s "${input}" 2>/dev/null || echo "0")"
    local timestamp
    timestamp="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

    {
        printf "# Tracker Music Metadata\n"
        printf "# Source: %s\n" "${input_basename}"
        printf "# Converted: %s\n" "${timestamp}"
        printf "source:\n"
        printf "  filename: \"%s\"\n" "${input_basename}"
        printf "  format: %s\n" "${META_FORMAT}"
        printf "  size_bytes: %s\n" "${input_size}"
        printf "module:\n"
        if [[ -n "${META_TITLE}" ]]; then
            printf "  title: \"%s\"\n" "${META_TITLE}"
        else
            printf "  title: \"\"\n"
        fi
        if [[ -n "${META_TRACKER}" ]]; then
            printf "  tracker: \"%s\"\n" "${META_TRACKER}"
        else
            printf "  tracker: unknown\n"
        fi
        printf "  channels: %s\n" "${META_CHANNELS}"
        printf "  orders: %s\n" "${META_ORDERS}"
        printf "  patterns: %s\n" "${META_PATTERNS}"
        printf "  samples: %s\n" "${META_SAMPLES}"
        printf "  instruments: %s\n" "${META_INSTRUMENTS}"
        printf "conversion:\n"
        printf "  tool: \"%s\"\n" "${RENDER_TOOL_NAME}"
        printf "  sample_rate: %s\n" "${SAMPLE_RATE}"
        printf "  channels: 2\n"
        printf "  bit_depth: 16\n"
        printf "  outputs:\n"

        local out_file out_basename out_ext out_size
        for out_file in "${output_files[@]}"; do
            if [[ -f "${out_file}" ]]; then
                out_basename="$(basename "${out_file}")"
                out_ext="${out_basename##*.}"
                out_size="$(stat -c %s "${out_file}" 2>/dev/null || echo "0")"
                printf "    - format: %s\n" "${out_ext}"
                printf "      file: \"%s\"\n" "${out_basename}"
                printf "      size_bytes: %s\n" "${out_size}"
            fi
        done

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
    local wav_file="${OUTPUT_DIR}/${name_no_ext}.wav"
    local flac_file="${OUTPUT_DIR}/${name_no_ext}.flac"
    local ogg_file="${OUTPUT_DIR}/${name_no_ext}.ogg"
    local meta_file="${OUTPUT_DIR}/${name_no_ext}.meta.yaml"

    # Extract metadata (best-effort)
    extract_metadata "${INPUT_FILE}" || true

    # Dry-run mode
    if [[ "${DRY_RUN}" == "true" ]]; then
        printf "DRY RUN -- convert-tracker.sh\n"
        printf "  Input:       %s\n" "${INPUT_FILE}"
        printf "  Format:      %s\n" "${META_FORMAT}"
        printf "  Title:       %s\n" "${META_TITLE:-<untitled>}"
        printf "  Channels:    %s\n" "${META_CHANNELS}"
        printf "  Tool:        %s\n" "${RENDER_TOOL_NAME}"
        printf "  Sample rate: %s\n" "${SAMPLE_RATE}"
        printf "  Output format: %s\n" "${OUTPUT_FORMAT}"
        case "${OUTPUT_FORMAT}" in
            wav)  printf "  Output:      %s\n" "${wav_file}" ;;
            flac) printf "  Output:      %s\n" "${flac_file}" ;;
            ogg)  printf "  Output:      %s\n" "${ogg_file}" ;;
            all)
                printf "  Outputs:\n"
                printf "    WAV:  %s\n" "${wav_file}"
                printf "    FLAC: %s\n" "${flac_file}"
                printf "    OGG:  %s\n" "${ogg_file}"
                ;;
        esac
        if [[ "${GENERATE_META}" == "true" ]]; then
            printf "  Metadata:    %s\n" "${meta_file}"
        else
            printf "  Metadata:    (suppressed)\n"
        fi
        exit 0
    fi

    # Ensure output directory exists
    mkdir -p "${OUTPUT_DIR}"

    # Track output files for metadata
    local output_files=()

    printf "Rendering: %s (using %s at %sHz)\n" "${input_basename}" "${RENDER_TOOL_NAME}" "${SAMPLE_RATE}"

    case "${OUTPUT_FORMAT}" in
        wav)
            render_to_wav "${INPUT_FILE}" "${wav_file}" "${SAMPLE_RATE}" || {
                printf "ERROR: WAV rendering failed\n" >&2
                exit 1
            }
            verify_output "${wav_file}" "${SAMPLE_RATE}" || exit 1
            output_files+=("${wav_file}")
            ;;

        flac)
            # Try direct ffmpeg render to FLAC if using ffmpeg tool
            if render_direct "${INPUT_FILE}" "${flac_file}" "${SAMPLE_RATE}" "flac" 2>/dev/null; then
                verify_output "${flac_file}" "${SAMPLE_RATE}" || exit 1
            else
                # Render to WAV first, then transcode
                render_to_wav "${INPUT_FILE}" "${wav_file}" "${SAMPLE_RATE}" || {
                    printf "ERROR: WAV rendering failed\n" >&2
                    exit 1
                }
                transcode_to_flac "${wav_file}" "${flac_file}" || {
                    printf "ERROR: FLAC transcoding failed\n" >&2
                    exit 1
                }
                verify_output "${flac_file}" "${SAMPLE_RATE}" || exit 1
                # Remove intermediate WAV (single format mode)
                rm -f "${wav_file}"
            fi
            output_files+=("${flac_file}")
            ;;

        ogg)
            # Try direct ffmpeg render to OGG if using ffmpeg tool
            if render_direct "${INPUT_FILE}" "${ogg_file}" "${SAMPLE_RATE}" "ogg" 2>/dev/null; then
                verify_output "${ogg_file}" "${SAMPLE_RATE}" || exit 1
            else
                render_to_wav "${INPUT_FILE}" "${wav_file}" "${SAMPLE_RATE}" || {
                    printf "ERROR: WAV rendering failed\n" >&2
                    exit 1
                }
                transcode_to_ogg "${wav_file}" "${ogg_file}" || {
                    printf "ERROR: OGG transcoding failed\n" >&2
                    exit 1
                }
                verify_output "${ogg_file}" "${SAMPLE_RATE}" || exit 1
                # Remove intermediate WAV (single format mode)
                rm -f "${wav_file}"
            fi
            output_files+=("${ogg_file}")
            ;;

        all)
            # Render WAV first
            render_to_wav "${INPUT_FILE}" "${wav_file}" "${SAMPLE_RATE}" || {
                printf "ERROR: WAV rendering failed\n" >&2
                exit 1
            }
            verify_output "${wav_file}" "${SAMPLE_RATE}" || exit 1
            output_files+=("${wav_file}")

            # Transcode to FLAC
            if transcode_to_flac "${wav_file}" "${flac_file}"; then
                verify_output "${flac_file}" "${SAMPLE_RATE}" || true
                output_files+=("${flac_file}")
            else
                warn "FLAC transcoding failed -- skipping"
            fi

            # Transcode to OGG
            if transcode_to_ogg "${wav_file}" "${ogg_file}"; then
                verify_output "${ogg_file}" "${SAMPLE_RATE}" || true
                output_files+=("${ogg_file}")
            else
                warn "OGG transcoding failed -- skipping"
            fi
            ;;
    esac

    # Generate metadata sidecar
    if [[ "${GENERATE_META}" == "true" && ${#output_files[@]} -gt 0 ]]; then
        generate_metadata "${INPUT_FILE}" "${meta_file}" "${output_files[@]}"
    fi

    # Print summary
    printf "\n"
    printf "Rendering complete:\n"
    printf "  Input:       %s\n" "${INPUT_FILE}"
    printf "  Title:       %s\n" "${META_TITLE:-<untitled>}"
    printf "  Format:      %s\n" "${META_FORMAT}"
    printf "  Channels:    %s\n" "${META_CHANNELS}"
    printf "  Tool:        %s\n" "${RENDER_TOOL_NAME}"
    printf "  Sample rate: %s Hz\n" "${SAMPLE_RATE}"
    local f
    for f in "${output_files[@]}"; do
        printf "  Output:      %s (%s bytes)\n" "${f}" "$(stat -c %s "${f}" 2>/dev/null || echo "?")"
    done
    if [[ "${GENERATE_META}" == "true" ]]; then
        printf "  Metadata:    %s\n" "${meta_file}"
    fi
}

main "$@"

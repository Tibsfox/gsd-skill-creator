#!/usr/bin/env bash
# configure-uae-audio.sh -- Audio-adaptive configuration generator
#
# Reads audio section from local-values.yaml (produced by generate-local-values.sh)
# and outputs FS-UAE audio configuration lines to stdout.
#
# Usage:
#   configure-uae-audio.sh [--local-values <path>]
#
# Options:
#   --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)
#
# Input (from local-values.yaml audio section):
#   audio.uae_audio_backend        -- sdl, alsa, or none
#   audio.uae_midi_backend         -- alsa or none
#   audio.usable                   -- true or false
#   audio.recommended_sample_rate  -- 44100 or 48000
#   audio.recommended_buffer_size  -- 256, 512, or 1024
#
# Output: FS-UAE audio configuration lines to stdout
# Diagnostics: classification reasoning to stderr
#
# Exit codes:
#   0 -- success
#   1 -- error (missing local-values)
#   2 -- usage error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source shared library for YAML emission helpers
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

LOCAL_VALUES="${PROJECT_ROOT}/infra/local/local-values.yaml"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="$2"
            shift 2
            ;;
        -h|--help)
            printf "Usage: %s [--local-values <path>]\n" "$(basename "$0")"
            printf "\nAudio-adaptive configuration generator for FS-UAE.\n"
            printf "\nOptions:\n"
            printf "  --local-values <path>  Path to local-values.yaml (default: infra/local/local-values.yaml)\n"
            exit 0
            ;;
        *)
            printf "Error: Unknown argument: %s\n" "$1" >&2
            exit 2
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Validate inputs
# ---------------------------------------------------------------------------

if [[ ! -f "${LOCAL_VALUES}" ]]; then
    printf "Error: local-values.yaml not found: %s\n" "${LOCAL_VALUES}" >&2
    printf "Run 'infra/scripts/generate-local-values.sh' first.\n" >&2
    exit 1
fi

# ---------------------------------------------------------------------------
# Section-aware YAML parsing (awk-based, established pattern)
# ---------------------------------------------------------------------------

section_val() {
    local section="$1"
    local key="$2"
    local file="$3"
    awk -v sect="${section}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# ---------------------------------------------------------------------------
# Read audio section from local-values.yaml
# ---------------------------------------------------------------------------

UAE_AUDIO_BACKEND="$(section_val "audio" "uae_audio_backend" "${LOCAL_VALUES}")"
UAE_MIDI_BACKEND="$(section_val "audio" "uae_midi_backend" "${LOCAL_VALUES}")"
AUDIO_USABLE="$(section_val "audio" "usable" "${LOCAL_VALUES}")"
SAMPLE_RATE="$(section_val "audio" "recommended_sample_rate" "${LOCAL_VALUES}")"
BUFFER_SIZE="$(section_val "audio" "recommended_buffer_size" "${LOCAL_VALUES}")"

# Normalize defaults
UAE_AUDIO_BACKEND="${UAE_AUDIO_BACKEND:-none}"
UAE_MIDI_BACKEND="${UAE_MIDI_BACKEND:-none}"
AUDIO_USABLE="${AUDIO_USABLE:-false}"
SAMPLE_RATE="${SAMPLE_RATE:-44100}"
BUFFER_SIZE="${BUFFER_SIZE:-1024}"

printf "[INFO] Audio config input: backend=%s midi=%s usable=%s rate=%s buffer=%s\n" \
    "${UAE_AUDIO_BACKEND}" "${UAE_MIDI_BACKEND}" "${AUDIO_USABLE}" \
    "${SAMPLE_RATE}" "${BUFFER_SIZE}" >&2

# ---------------------------------------------------------------------------
# Generate FS-UAE audio configuration
# ---------------------------------------------------------------------------

printf "# Audio configuration (from local-values.yaml audio section)\n"
printf "# Backend: %s | MIDI: %s | Sample rate: %s | Buffer: %s\n" \
    "${UAE_AUDIO_BACKEND}" "${UAE_MIDI_BACKEND}" "${SAMPLE_RATE}" "${BUFFER_SIZE}"
printf "\n"

# Audio backend mapping
case "${UAE_AUDIO_BACKEND}" in
    sdl|alsa)
        # Sound output mode: exact for sample-accurate Amiga audio
        printf "sound_output = exact\n"

        # Frequency and buffer size
        printf "audio_frequency = %s\n" "${SAMPLE_RATE}"

        # Buffer target: stereo 16-bit = 4 bytes per sample
        BUFFER_BYTES=$(( BUFFER_SIZE * 4 ))
        printf "audio_buffer_target_bytes = %s\n" "${BUFFER_BYTES}"

        # Stereo output
        printf "sound_stereo = stereo\n"

        # Anti-aliased interpolation for clean output
        printf "sound_interpol = anti\n"

        # Emulate Amiga audio filter for authenticity
        printf "sound_filter = emulated\n"

        if [[ "${UAE_AUDIO_BACKEND}" == "sdl" ]]; then
            printf "[INFO] Audio backend: SDL -- routes through PipeWire/PulseAudio sound server\n" >&2
        else
            printf "[INFO] Audio backend: ALSA -- direct hardware access\n" >&2
        fi
        ;;
    none|*)
        # Disable audio entirely
        printf "sound_output = none\n"
        printf "[INFO] Audio backend: disabled -- no usable audio hardware\n" >&2
        ;;
esac

# MIDI configuration
case "${UAE_MIDI_BACKEND}" in
    alsa)
        printf "\n# MIDI output via ALSA (hardware detected)\n"
        printf "midi_out_device = default\n"
        printf "[INFO] MIDI: ALSA default device\n" >&2
        ;;
    none|*)
        # No MIDI lines emitted when no hardware detected
        printf "[INFO] MIDI: disabled (no MIDI hardware)\n" >&2
        ;;
esac

printf "\n[INFO] Audio configuration generated successfully\n" >&2

exit 0

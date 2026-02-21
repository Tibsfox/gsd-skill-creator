#!/usr/bin/env bash
# assess-audio.sh -- Audio subsystem assessment module
#
# Reads a hardware-capabilities YAML and produces an audio_assessment YAML
# section to stdout with server classification, routing recommendations,
# MIDI availability, and UAE audio/MIDI backend suggestions.
#
# Usage:
#   assess-audio.sh <hardware-capabilities.yaml>
#
# Input: Path to capabilities YAML (first argument).
#   Extracts from audio: section -- present, server, alsa card_count,
#   midi present/port_count, capabilities (has_audio_output, has_midi)
#
# Output (stdout): audio_assessment YAML section
# Diagnostics (stderr): classification reasoning
#
# Exit codes:
#   0 -- always (assessment of "no audio" is a valid result)
#   2 -- usage error (missing arguments, file not found)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source shared library for YAML emission helpers
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

if [[ $# -lt 1 ]]; then
    printf "Usage: %s <hardware-capabilities.yaml>\n" "$(basename "$0")" >&2
    exit 2
fi

INPUT_FILE="$1"

if [[ ! -f "${INPUT_FILE}" ]]; then
    printf "Error: Input file not found: %s\n" "${INPUT_FILE}" >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# Section-aware YAML parsing (awk-based, established pattern)
# ---------------------------------------------------------------------------

# Extract a value from a specific YAML section
# Usage: section_val "audio" "server" "$INPUT_FILE"
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

# Extract a value from a nested subsection within a section
# Usage: subsection_val "audio" "midi" "present" "$INPUT_FILE"
subsection_val() {
    local section="$1"
    local subsect="$2"
    local key="$3"
    local file="$4"
    awk -v sect="${section}" -v subsec="${subsect}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^  "subsec":" { in_sub=1; next }
        in_sect && /^  [a-zA-Z]/ && $0 !~ "^    " { in_sub=0 }
        in_sect && in_sub && $0 ~ "^[[:space:]]+"k":" {
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

# Extract a value from the capabilities subsection within audio
# Usage: audio_cap "has_audio_output" "$INPUT_FILE"
audio_cap() {
    local key="$1"
    local file="$2"
    subsection_val "audio" "capabilities" "${key}" "${file}"
}

# ---------------------------------------------------------------------------
# Read audio section values
# ---------------------------------------------------------------------------

AUDIO_PRESENT="$(section_val "audio" "present" "${INPUT_FILE}")"
AUDIO_SERVER="$(section_val "audio" "server" "${INPUT_FILE}")"
ALSA_CARD_COUNT="$(subsection_val "audio" "alsa" "card_count" "${INPUT_FILE}")"
MIDI_PRESENT="$(subsection_val "audio" "midi" "present" "${INPUT_FILE}")"
MIDI_PORT_COUNT="$(subsection_val "audio" "midi" "port_count" "${INPUT_FILE}")"
HAS_AUDIO_OUTPUT="$(audio_cap "has_audio_output" "${INPUT_FILE}")"
HAS_MIDI="$(audio_cap "has_midi" "${INPUT_FILE}")"

# ---------------------------------------------------------------------------
# Normalize values (handle null/empty/none as safe defaults)
# ---------------------------------------------------------------------------

# Normalize present flag
case "${AUDIO_PRESENT,,}" in
    true)  AUDIO_PRESENT="true" ;;
    *)     AUDIO_PRESENT="false" ;;
esac

# Normalize server
AUDIO_SERVER="${AUDIO_SERVER,,}"
case "${AUDIO_SERVER}" in
    pipewire|pulseaudio|alsa) ;; # valid
    null|"") AUDIO_SERVER="none" ;;
esac

# Normalize card count
case "${ALSA_CARD_COUNT,,}" in
    null|none|"") ALSA_CARD_COUNT=0 ;;
esac

# Normalize MIDI
case "${MIDI_PRESENT,,}" in
    true)  MIDI_PRESENT="true" ;;
    *)     MIDI_PRESENT="false" ;;
esac

case "${MIDI_PORT_COUNT,,}" in
    null|none|"") MIDI_PORT_COUNT=0 ;;
esac

# Normalize capabilities
case "${HAS_AUDIO_OUTPUT,,}" in
    true)  HAS_AUDIO_OUTPUT="true" ;;
    *)     HAS_AUDIO_OUTPUT="false" ;;
esac

case "${HAS_MIDI,,}" in
    true)  HAS_MIDI="true" ;;
    *)     HAS_MIDI="false" ;;
esac

printf "[INFO] Audio assessment input: present=%s server=%s cards=%s midi=%s/%s output=%s\n" \
    "${AUDIO_PRESENT}" "${AUDIO_SERVER}" "${ALSA_CARD_COUNT}" \
    "${MIDI_PRESENT}" "${MIDI_PORT_COUNT}" "${HAS_AUDIO_OUTPUT}" >&2

# ---------------------------------------------------------------------------
# Classification logic
# ---------------------------------------------------------------------------

# usable: true if audio present=true and has_audio_output=true
USABLE="false"
if [[ "${AUDIO_PRESENT}" == "true" && "${HAS_AUDIO_OUTPUT}" == "true" ]]; then
    USABLE="true"
fi

# server: passthrough the detected server (already normalized)
SERVER="${AUDIO_SERVER}"

# server_tier: none (no audio), basic (ALSA only), standard (PulseAudio), advanced (PipeWire)
SERVER_TIER="none"
if [[ "${AUDIO_PRESENT}" == "true" ]]; then
    case "${AUDIO_SERVER}" in
        pipewire)    SERVER_TIER="advanced" ;;
        pulseaudio)  SERVER_TIER="standard" ;;
        alsa|none)
            # ALSA only if cards are present, else none
            if [[ "${ALSA_CARD_COUNT}" -gt 0 ]] 2>/dev/null; then
                SERVER_TIER="basic"
            fi
            ;;
    esac
fi

# routing_method: pipewire | pulse | direct_alsa | none
ROUTING_METHOD="none"
case "${AUDIO_SERVER}" in
    pipewire)    ROUTING_METHOD="pipewire" ;;
    pulseaudio)  ROUTING_METHOD="pulse" ;;
    alsa|none)
        if [[ "${ALSA_CARD_COUNT}" -gt 0 ]] 2>/dev/null; then
            ROUTING_METHOD="direct_alsa"
        fi
        ;;
esac

# midi_available: true if midi present=true
MIDI_AVAILABLE="${MIDI_PRESENT}"

# uae_audio_backend: sdl if server present (auto-detects), alsa if ALSA only, none if no audio
UAE_AUDIO_BACKEND="none"
if [[ "${USABLE}" == "true" ]]; then
    case "${AUDIO_SERVER}" in
        pipewire|pulseaudio) UAE_AUDIO_BACKEND="sdl" ;;
        alsa|none)
            if [[ "${ALSA_CARD_COUNT}" -gt 0 ]] 2>/dev/null; then
                UAE_AUDIO_BACKEND="alsa"
            fi
            ;;
    esac
fi

# uae_midi_backend: alsa if midi present=true (ALSA MIDI is universal on Linux), none otherwise
UAE_MIDI_BACKEND="none"
if [[ "${MIDI_PRESENT}" == "true" ]]; then
    UAE_MIDI_BACKEND="alsa"
fi

# recommended_sample_rate: 48000 if PipeWire (native rate), 44100 if PulseAudio/ALSA
RECOMMENDED_SAMPLE_RATE=44100
if [[ "${AUDIO_SERVER}" == "pipewire" ]]; then
    RECOMMENDED_SAMPLE_RATE=48000
fi

# recommended_buffer_size: 256 if PipeWire, 512 if PulseAudio, 1024 if ALSA only
RECOMMENDED_BUFFER_SIZE=1024
case "${AUDIO_SERVER}" in
    pipewire)    RECOMMENDED_BUFFER_SIZE=256 ;;
    pulseaudio)  RECOMMENDED_BUFFER_SIZE=512 ;;
esac

printf "[INFO] Audio assessment result: usable=%s server=%s/%s routing=%s midi=%s/%s uae_audio=%s uae_midi=%s rate=%s buf=%s\n" \
    "${USABLE}" "${SERVER}" "${SERVER_TIER}" "${ROUTING_METHOD}" \
    "${MIDI_AVAILABLE}" "${MIDI_PORT_COUNT}" "${UAE_AUDIO_BACKEND}" \
    "${UAE_MIDI_BACKEND}" "${RECOMMENDED_SAMPLE_RATE}" "${RECOMMENDED_BUFFER_SIZE}" >&2

# ---------------------------------------------------------------------------
# Output YAML
# ---------------------------------------------------------------------------

yaml_section "" "audio_assessment"
yaml_bool "  " "usable" "${USABLE}"
yaml_key "  " "server" "${SERVER}"
yaml_key "  " "server_tier" "${SERVER_TIER}"
yaml_key "  " "routing_method" "${ROUTING_METHOD}"
yaml_bool "  " "midi_available" "${MIDI_AVAILABLE}"
yaml_int "  " "midi_port_count" "${MIDI_PORT_COUNT}"
yaml_key "  " "uae_audio_backend" "${UAE_AUDIO_BACKEND}"
yaml_key "  " "uae_midi_backend" "${UAE_MIDI_BACKEND}"
yaml_int "  " "recommended_sample_rate" "${RECOMMENDED_SAMPLE_RATE}"
yaml_int "  " "recommended_buffer_size" "${RECOMMENDED_BUFFER_SIZE}"

exit 0

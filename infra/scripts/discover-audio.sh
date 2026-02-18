#!/usr/bin/env bash
# discover-audio.sh -- Audio subsystem discovery module
#
# Detects ALSA devices, PulseAudio/PipeWire server status, and MIDI ports.
# Outputs structured YAML to stdout. Degrades gracefully when audio hardware
# is absent (emits present: false with zeroed counts).
#
# Exit code: always 0 (missing audio is a valid state, not an error)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

require_linux

# ---------------------------------------------------------------------------
# ALSA Discovery
# ---------------------------------------------------------------------------

discover_alsa() {
    local card_count=0
    ALSA_PRESENT="false"
    ALSA_CARDS=()
    HAS_OUTPUT="false"
    HAS_INPUT="false"

    # Try /proc/asound/cards first
    local cards_content
    cards_content="$(safe_read "/proc/asound/cards")"

    if [[ -n "${cards_content}" ]]; then
        # Parse /proc/asound/cards format:
        #  0 [PCH            ]: HDA-Intel - HDA Intel PCH
        #                       HDA Intel PCH at 0xf7210000 irq 32
        while IFS= read -r line; do
            # Match lines starting with a card number
            if [[ "${line}" =~ ^[[:space:]]*([0-9]+)[[:space:]]+\[([^]]+)\]:[[:space:]]+(.*)[[:space:]]-[[:space:]]+(.*) ]]; then
                local idx="${BASH_REMATCH[1]}"
                local driver="${BASH_REMATCH[3]}"
                local name="${BASH_REMATCH[4]}"
                # Trim whitespace
                driver="$(echo "${driver}" | sed 's/[[:space:]]*$//')"
                name="$(echo "${name}" | sed 's/[[:space:]]*$//')"
                ALSA_CARDS+=("${idx}|${name}|${driver}")
                card_count=$((card_count + 1))
            fi
        done <<< "${cards_content}"
    fi

    if [[ ${card_count} -gt 0 ]]; then
        ALSA_PRESENT="true"
    fi

    ALSA_CARD_COUNT="${card_count}"

    # Check for playback and capture devices
    if has_command aplay; then
        local playback_count
        playback_count="$(aplay -l 2>/dev/null | grep -c '^card' || echo "0")"
        if [[ "${playback_count}" -gt 0 ]]; then
            HAS_OUTPUT="true"
        fi
    elif [[ -d /proc/asound ]]; then
        # Fallback: check for pcm playback devices
        if ls /proc/asound/card*/pcm*p/info &>/dev/null; then
            HAS_OUTPUT="true"
        fi
    fi

    if has_command arecord; then
        local capture_count
        capture_count="$(arecord -l 2>/dev/null | grep -c '^card' || echo "0")"
        if [[ "${capture_count}" -gt 0 ]]; then
            HAS_INPUT="true"
        fi
    elif [[ -d /proc/asound ]]; then
        # Fallback: check for pcm capture devices
        if ls /proc/asound/card*/pcm*c/info &>/dev/null; then
            HAS_INPUT="true"
        fi
    fi
}

# ---------------------------------------------------------------------------
# Audio Server Detection
# ---------------------------------------------------------------------------

discover_audio_server() {
    AUDIO_SERVER="none"

    # Check PipeWire first (it can replace PulseAudio)
    if has_command pactl; then
        local pactl_info
        pactl_info="$(pactl info 2>/dev/null || echo "")"

        if [[ -n "${pactl_info}" ]]; then
            local server_name
            server_name="$(echo "${pactl_info}" | grep -i 'Server Name:' | head -1 || echo "")"

            if echo "${server_name}" | grep -qi 'pipewire'; then
                AUDIO_SERVER="pipewire"
            elif echo "${server_name}" | grep -qi 'pulseaudio'; then
                AUDIO_SERVER="pulseaudio"
            fi
        fi
    fi

    # If pactl did not detect a server, try PipeWire directly
    if [[ "${AUDIO_SERVER}" == "none" ]] && has_command pw-cli; then
        local pw_info
        pw_info="$(pw-cli info 0 2>/dev/null || echo "")"
        if [[ -n "${pw_info}" ]]; then
            AUDIO_SERVER="pipewire"
        fi
    fi

    # If still none, check for running processes as fallback
    if [[ "${AUDIO_SERVER}" == "none" ]]; then
        if pgrep -x pipewire &>/dev/null; then
            AUDIO_SERVER="pipewire"
        elif pgrep -x pulseaudio &>/dev/null; then
            AUDIO_SERVER="pulseaudio"
        elif [[ "${ALSA_PRESENT}" == "true" ]]; then
            AUDIO_SERVER="alsa-only"
        fi
    fi
}

# ---------------------------------------------------------------------------
# MIDI Discovery
# ---------------------------------------------------------------------------

discover_midi() {
    MIDI_PRESENT="false"
    MIDI_PORT_COUNT=0
    MIDI_PORTS=()

    # Try aplaymidi -l first
    if has_command aplaymidi; then
        local midi_output
        midi_output="$(aplaymidi -l 2>/dev/null || echo "")"

        if [[ -n "${midi_output}" ]]; then
            # Skip the header line, parse port entries
            # Format: " 14:0    Midi Through                     Midi Through Port-0"
            # The output has fixed-width columns: Port (6), Client name (33), Port name (rest)
            while IFS= read -r line; do
                # Match lines starting with a port number (skip header)
                if [[ "${line}" =~ ^[[:space:]]*([0-9]+:[0-9]+)[[:space:]]+ ]]; then
                    # Extract port name: take everything after column 40 (client name ends around there)
                    # Alternatively, use the last whitespace-delimited group after the client
                    local port_part
                    # The client name starts at column 9, port name at column 41 (0-indexed)
                    port_part="$(echo "${line}" | sed -E 's/^[[:space:]]*[0-9]+:[0-9]+[[:space:]]+//')"
                    # Now port_part is "Midi Through                     Midi Through Port-0"
                    # Collapse multiple spaces to single space for a clean name
                    port_part="$(echo "${port_part}" | sed -E 's/[[:space:]]{2,}/ - /; s/[[:space:]]*$//')"
                    if [[ -n "${port_part}" ]]; then
                        MIDI_PORTS+=("${port_part}")
                        MIDI_PORT_COUNT=$((MIDI_PORT_COUNT + 1))
                    fi
                fi
            done <<< "${midi_output}"
        fi
    fi

    # Fallback: check /proc/asound/seq/clients
    if [[ ${MIDI_PORT_COUNT} -eq 0 ]]; then
        local seq_clients
        seq_clients="$(safe_read "/proc/asound/seq/clients")"
        if [[ -n "${seq_clients}" ]]; then
            while IFS= read -r line; do
                if [[ "${line}" =~ ^Client[[:space:]]+([0-9]+)[[:space:]]+:[[:space:]]+\"(.+)\" ]]; then
                    local client_name="${BASH_REMATCH[2]}"
                    # Skip the System client (client 0)
                    local client_num="${BASH_REMATCH[1]}"
                    if [[ "${client_num}" -ne 0 ]]; then
                        MIDI_PORTS+=("${client_name}")
                        MIDI_PORT_COUNT=$((MIDI_PORT_COUNT + 1))
                    fi
                fi
            done <<< "${seq_clients}"
        fi
    fi

    if [[ ${MIDI_PORT_COUNT} -gt 0 ]]; then
        MIDI_PRESENT="true"
    fi
}

# ---------------------------------------------------------------------------
# YAML Output
# ---------------------------------------------------------------------------

emit_yaml() {
    local audio_present="false"
    if [[ "${ALSA_PRESENT}" == "true" || "${AUDIO_SERVER}" != "none" ]]; then
        audio_present="true"
    fi

    yaml_section "" "audio"
    yaml_bool "  " "present" "${audio_present}"
    yaml_key "  " "server" "${AUDIO_SERVER}"

    yaml_section "  " "alsa"
    yaml_int "    " "card_count" "${ALSA_CARD_COUNT}"

    if [[ ${ALSA_CARD_COUNT} -gt 0 ]]; then
        yaml_section "    " "cards"
        for card in "${ALSA_CARDS[@]}"; do
            local idx name driver
            idx="$(echo "${card}" | cut -d'|' -f1)"
            name="$(echo "${card}" | cut -d'|' -f2)"
            driver="$(echo "${card}" | cut -d'|' -f3)"
            printf "      - index: %s\n" "${idx}"
            yaml_key "        " "name" "${name}"
            yaml_key "        " "driver" "${driver}"
        done
    else
        printf "    cards: []\n"
    fi

    yaml_section "  " "midi"
    yaml_bool "    " "present" "${MIDI_PRESENT}"
    yaml_int "    " "port_count" "${MIDI_PORT_COUNT}"

    if [[ ${MIDI_PORT_COUNT} -gt 0 ]]; then
        yaml_section "    " "ports"
        for port in "${MIDI_PORTS[@]}"; do
            yaml_list_item "      " "${port}"
        done
    else
        printf "    ports: []\n"
    fi

    yaml_section "  " "capabilities"
    yaml_bool "    " "has_audio_output" "${HAS_OUTPUT}"
    yaml_bool "    " "has_audio_input" "${HAS_INPUT}"
    yaml_bool "    " "has_midi" "${MIDI_PRESENT}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    discover_alsa
    discover_audio_server
    discover_midi
    emit_yaml
    exit 0
}

main "$@"

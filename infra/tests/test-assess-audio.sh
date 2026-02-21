#!/usr/bin/env bash
# test-assess-audio.sh -- Test suite for audio subsystem assessment module
#
# Tests assess-audio.sh against fixture hardware capabilities to verify:
#   - PipeWire gets advanced tier, 48kHz, 256 buffer, SDL audio backend
#   - PulseAudio gets standard tier, 44.1kHz, 512 buffer, SDL audio backend
#   - ALSA-only gets basic tier, 44.1kHz, 1024 buffer, ALSA audio backend
#   - MIDI correctly gates UAE MIDI backend recommendation
#
# Usage: bash infra/tests/test-assess-audio.sh

set -euo pipefail

# ---------------------------------------------------------------------------
# Test framework (minimal, no external dependencies)
# ---------------------------------------------------------------------------

TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
FAILURES=()

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_DIR="${SCRIPT_DIR}/fixtures"
ASSESSOR="${SCRIPT_DIR}/../scripts/assess-audio.sh"
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

# Assert two values are equal
# Usage: assert_eq "description" "expected" "actual"
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

# Assert output contains a string
# Usage: assert_contains "description" "needle" "haystack"
assert_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    TESTS_RUN=$(( TESTS_RUN + 1 ))
    if echo "${haystack}" | grep -qF "${needle}"; then
        TESTS_PASSED=$(( TESTS_PASSED + 1 ))
        printf "  PASS: %s\n" "${desc}"
    else
        TESTS_FAILED=$(( TESTS_FAILED + 1 ))
        FAILURES+=("${desc}: '${needle}' not found in output")
        printf "  FAIL: %s ('%s' not found in output)\n" "${desc}" "${needle}"
    fi
}

# Extract a YAML value from assessment output
# Usage: assess_val "key" "file"
assess_val() {
    local key="$1"
    local file="$2"
    grep -E "^[[:space:]]*${key}:" "${file}" 2>/dev/null \
        | head -1 \
        | sed -E 's/^[^:]+:[[:space:]]*//' \
        | sed 's/[[:space:]]*#.*//' \
        | sed 's/^"//' \
        | sed 's/"$//'
}

# ---------------------------------------------------------------------------
# Test: PipeWire + MIDI (64GB NVIDIA fixture)
# ---------------------------------------------------------------------------

test_pipewire_midi() {
    printf "\n--- Test: PipeWire + MIDI (64GB NVIDIA) ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-64gb-nvidia.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "PipeWire: exit code 0" "0" "${exit_code}"

    echo "${output}" > "${TEMP_DIR}/audio-assessment.yaml"

    # Core classifications
    assert_eq "PipeWire: usable = true" "true" "$(assess_val "usable" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: server = pipewire" "pipewire" "$(assess_val "server" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: server_tier = advanced" "advanced" "$(assess_val "server_tier" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: routing_method = pipewire" "pipewire" "$(assess_val "routing_method" "${TEMP_DIR}/audio-assessment.yaml")"

    # MIDI
    assert_eq "PipeWire: midi_available = true" "true" "$(assess_val "midi_available" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: midi_port_count = 1" "1" "$(assess_val "midi_port_count" "${TEMP_DIR}/audio-assessment.yaml")"

    # UAE backends
    assert_eq "PipeWire: uae_audio_backend = sdl" "sdl" "$(assess_val "uae_audio_backend" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: uae_midi_backend = alsa" "alsa" "$(assess_val "uae_midi_backend" "${TEMP_DIR}/audio-assessment.yaml")"

    # Recommended settings
    assert_eq "PipeWire: sample_rate = 48000" "48000" "$(assess_val "recommended_sample_rate" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PipeWire: buffer_size = 256" "256" "$(assess_val "recommended_buffer_size" "${TEMP_DIR}/audio-assessment.yaml")"

    # Verify section header
    assert_contains "PipeWire: has audio_assessment section" "audio_assessment:" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Test: PulseAudio, no MIDI (32GB AMD fixture)
# ---------------------------------------------------------------------------

test_pulseaudio_no_midi() {
    printf "\n--- Test: PulseAudio, No MIDI (32GB AMD) ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-32gb-amd.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "PulseAudio: exit code 0" "0" "${exit_code}"

    echo "${output}" > "${TEMP_DIR}/audio-assessment.yaml"

    # Core classifications
    assert_eq "PulseAudio: usable = true" "true" "$(assess_val "usable" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PulseAudio: server = pulseaudio" "pulseaudio" "$(assess_val "server" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PulseAudio: server_tier = standard" "standard" "$(assess_val "server_tier" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PulseAudio: routing_method = pulse" "pulse" "$(assess_val "routing_method" "${TEMP_DIR}/audio-assessment.yaml")"

    # MIDI (not present)
    assert_eq "PulseAudio: midi_available = false" "false" "$(assess_val "midi_available" "${TEMP_DIR}/audio-assessment.yaml")"

    # UAE backends
    assert_eq "PulseAudio: uae_audio_backend = sdl" "sdl" "$(assess_val "uae_audio_backend" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PulseAudio: uae_midi_backend = none" "none" "$(assess_val "uae_midi_backend" "${TEMP_DIR}/audio-assessment.yaml")"

    # Recommended settings
    assert_eq "PulseAudio: sample_rate = 44100" "44100" "$(assess_val "recommended_sample_rate" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "PulseAudio: buffer_size = 512" "512" "$(assess_val "recommended_buffer_size" "${TEMP_DIR}/audio-assessment.yaml")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: ALSA only, no MIDI (16GB no-GPU fixture)
# ---------------------------------------------------------------------------

test_alsa_only() {
    printf "\n--- Test: ALSA Only, No MIDI (16GB No-GPU) ---\n"
    setup

    local output exit_code=0
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-16gb-nogpu.yaml" 2>"${TEMP_DIR}/stderr.log")" || exit_code=$?

    assert_eq "ALSA: exit code 0" "0" "${exit_code}"

    echo "${output}" > "${TEMP_DIR}/audio-assessment.yaml"

    # Core classifications
    assert_eq "ALSA: usable = true" "true" "$(assess_val "usable" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "ALSA: server = none" "none" "$(assess_val "server" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "ALSA: server_tier = basic" "basic" "$(assess_val "server_tier" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "ALSA: routing_method = direct_alsa" "direct_alsa" "$(assess_val "routing_method" "${TEMP_DIR}/audio-assessment.yaml")"

    # MIDI (not present)
    assert_eq "ALSA: midi_available = false" "false" "$(assess_val "midi_available" "${TEMP_DIR}/audio-assessment.yaml")"

    # UAE backends
    assert_eq "ALSA: uae_audio_backend = alsa" "alsa" "$(assess_val "uae_audio_backend" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "ALSA: uae_midi_backend = none" "none" "$(assess_val "uae_midi_backend" "${TEMP_DIR}/audio-assessment.yaml")"

    # Recommended settings (ALSA conservative defaults)
    assert_eq "ALSA: sample_rate = 44100" "44100" "$(assess_val "recommended_sample_rate" "${TEMP_DIR}/audio-assessment.yaml")"
    assert_eq "ALSA: buffer_size = 1024" "1024" "$(assess_val "recommended_buffer_size" "${TEMP_DIR}/audio-assessment.yaml")"

    teardown
}

# ---------------------------------------------------------------------------
# Test: All output fields present
# ---------------------------------------------------------------------------

test_output_fields() {
    printf "\n--- Test: Output Field Completeness ---\n"
    setup

    local output
    output="$(bash "${ASSESSOR}" "${FIXTURES_DIR}/capabilities-64gb-nvidia.yaml" 2>/dev/null)"

    assert_contains "Fields: has usable" "usable:" "${output}"
    assert_contains "Fields: has server" "server:" "${output}"
    assert_contains "Fields: has server_tier" "server_tier:" "${output}"
    assert_contains "Fields: has routing_method" "routing_method:" "${output}"
    assert_contains "Fields: has midi_available" "midi_available:" "${output}"
    assert_contains "Fields: has midi_port_count" "midi_port_count:" "${output}"
    assert_contains "Fields: has uae_audio_backend" "uae_audio_backend:" "${output}"
    assert_contains "Fields: has uae_midi_backend" "uae_midi_backend:" "${output}"
    assert_contains "Fields: has recommended_sample_rate" "recommended_sample_rate:" "${output}"
    assert_contains "Fields: has recommended_buffer_size" "recommended_buffer_size:" "${output}"

    teardown
}

# ---------------------------------------------------------------------------
# Run all tests
# ---------------------------------------------------------------------------

main() {
    printf "=== Audio Subsystem Assessment Tests ===\n"
    printf "Assessor: %s\n" "${ASSESSOR}"
    printf "Fixtures: %s\n\n" "${FIXTURES_DIR}"

    test_pipewire_midi
    test_pulseaudio_no_midi
    test_alsa_only
    test_output_fields

    printf "\n=== Results ===\n"
    printf "Tests run: %s\n" "${TESTS_RUN}"
    printf "Passed: %s\n" "${TESTS_PASSED}"
    printf "Failed: %s\n" "${TESTS_FAILED}"

    if [[ ${TESTS_FAILED} -gt 0 ]]; then
        printf "\nFailures:\n"
        for failure in "${FAILURES[@]}"; do
            printf "  - %s\n" "${failure}"
        done
        exit 1
    fi

    printf "\nAll tests passed.\n"
    exit 0
}

main "$@"

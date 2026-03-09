#!/usr/bin/env bash
# shellcheck disable=SC2034 # test variables used for assertion context
# test-uae-config.sh -- Test suite for Plan 182-02 scripts
#
# Tests: configure-uae-display.sh, configure-uae-audio.sh,
#        render-uae-config.sh, and scanline.fs-uae-shader
#
# 7 test groups, 28 assertions total:
#   1. Display config -- Vulkan tier (6 assertions)
#   2. Display config -- Software tier (4 assertions)
#   3. Display config -- Scanlines (3 assertions)
#   4. Audio config -- SDL tier (5 assertions)
#   5. Audio config -- No audio (3 assertions)
#   6. Render script -- Integration (5 assertions)
#   7. Shader file (2 assertions)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Scripts under test
DISPLAY_SCRIPT="${PROJECT_ROOT}/infra/scripts/configure-uae-display.sh"
AUDIO_SCRIPT="${PROJECT_ROOT}/infra/scripts/configure-uae-audio.sh"
RENDER_SCRIPT="${PROJECT_ROOT}/infra/scripts/render-uae-config.sh"
SHADER_FILE="${PROJECT_ROOT}/infra/config/uae/scanline.fs-uae-shader"

# Test input
EXAMPLE_VALUES="${PROJECT_ROOT}/infra/inventory/local-values.example.yaml"

# Test state
PASS=0
FAIL=0
TMPDIR=""

# ---------------------------------------------------------------------------
# Test helpers
# ---------------------------------------------------------------------------

cleanup() {
    if [[ -n "${TMPDIR}" && -d "${TMPDIR}" ]]; then
        rm -rf "${TMPDIR}"
    fi
}
trap cleanup EXIT

assert_eq() {
    local desc="$1"
    local expected="$2"
    local actual="$3"
    if [[ "${expected}" == "${actual}" ]]; then
        printf "  PASS: %s\n" "${desc}"
        PASS=$(( PASS + 1 ))
    else
        printf "  FAIL: %s\n" "${desc}"
        printf "    expected: %s\n" "${expected}"
        printf "    actual:   %s\n" "${actual}"
        FAIL=$(( FAIL + 1 ))
    fi
}

assert_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    if printf "%s" "${haystack}" | grep -q "${needle}"; then
        printf "  PASS: %s\n" "${desc}"
        PASS=$(( PASS + 1 ))
    else
        printf "  FAIL: %s (pattern '%s' not found)\n" "${desc}" "${needle}"
        FAIL=$(( FAIL + 1 ))
    fi
}

assert_not_contains() {
    local desc="$1"
    local needle="$2"
    local haystack="$3"
    if ! printf "%s" "${haystack}" | grep -q "${needle}"; then
        printf "  PASS: %s\n" "${desc}"
        PASS=$(( PASS + 1 ))
    else
        printf "  FAIL: %s (pattern '%s' was found but should not be)\n" "${desc}" "${needle}"
        FAIL=$(( FAIL + 1 ))
    fi
}

assert_ok() {
    local desc="$1"
    local exit_code="$2"
    if [[ "${exit_code}" -eq 0 ]]; then
        printf "  PASS: %s\n" "${desc}"
        PASS=$(( PASS + 1 ))
    else
        printf "  FAIL: %s (exit code: %s)\n" "${desc}" "${exit_code}"
        FAIL=$(( FAIL + 1 ))
    fi
}

assert_file_exists() {
    local desc="$1"
    local filepath="$2"
    if [[ -f "${filepath}" ]]; then
        printf "  PASS: %s\n" "${desc}"
        PASS=$(( PASS + 1 ))
    else
        printf "  FAIL: %s (file not found: %s)\n" "${desc}" "${filepath}"
        FAIL=$(( FAIL + 1 ))
    fi
}

# ---------------------------------------------------------------------------
# Pre-test setup
# ---------------------------------------------------------------------------

TMPDIR="$(mktemp -d)"

# Create no-GPU/no-audio local-values for software/disabled tests
cat > "${TMPDIR}/no-gpu-values.yaml" <<'YAML'
gpu:
  rendering_capable: false
  uae_display: software
  rendering_backend: none
  vram_tier: none
audio:
  usable: false
  uae_audio_backend: none
  uae_midi_backend: none
  recommended_sample_rate: 44100
  recommended_buffer_size: 1024
YAML

printf "%s\n" "========================================"
printf "%s\n" "  Test Suite: UAE Configuration (182-02)"
printf "%s\n" "========================================"
printf "\n"

# ---------------------------------------------------------------------------
# Group 1: Display config -- Vulkan tier (6 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 1: Display config -- Vulkan tier ---"

DISPLAY_OUT=""
DISPLAY_RC=0
DISPLAY_OUT="$(bash "${DISPLAY_SCRIPT}" --local-values "${EXAMPLE_VALUES}" 2>/dev/null)" || DISPLAY_RC=$?

assert_ok "Display script exits 0 with Vulkan input" "${DISPLAY_RC}"
assert_contains "Output contains video_sync" "video_sync" "${DISPLAY_OUT}"
assert_contains "Output contains texture_filter = linear (Vulkan)" "texture_filter = linear" "${DISPLAY_OUT}"
assert_contains "Output contains low_latency_vsync (Vulkan feature)" "low_latency_vsync" "${DISPLAY_OUT}"
assert_contains "Output contains scale_x (scaling for high VRAM)" "scale_x" "${DISPLAY_OUT}"
assert_not_contains "No sound_ lines in display output" "sound_" "${DISPLAY_OUT}"

printf "\n"

# ---------------------------------------------------------------------------
# Group 2: Display config -- Software tier (4 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 2: Display config -- Software tier ---"

SOFT_OUT=""
SOFT_RC=0
SOFT_OUT="$(bash "${DISPLAY_SCRIPT}" --local-values "${TMPDIR}/no-gpu-values.yaml" 2>/dev/null)" || SOFT_RC=$?

assert_ok "Display script exits 0 with software input" "${SOFT_RC}"
assert_contains "Output contains texture_filter = nearest (software)" "texture_filter = nearest" "${SOFT_OUT}"
assert_not_contains "No low_latency_vsync (no GPU)" "low_latency_vsync" "${SOFT_OUT}"
assert_not_contains "No shader line (no GPU)" "shader" "${SOFT_OUT}"

printf "\n"

# ---------------------------------------------------------------------------
# Group 3: Display config -- Scanlines (3 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 3: Display config -- Scanlines ---"

# Scanlines with GPU
SCAN_GPU_OUT=""
SCAN_GPU_OUT="$(bash "${DISPLAY_SCRIPT}" --local-values "${EXAMPLE_VALUES}" --scanlines 2>/dev/null)" || true
assert_contains "Scanlines with GPU: shader line present" "shader" "${SCAN_GPU_OUT}"

# Scanlines without GPU
SCAN_SOFT_OUT=""
SCAN_SOFT_STDERR=""
SCAN_SOFT_OUT="$(bash "${DISPLAY_SCRIPT}" --local-values "${TMPDIR}/no-gpu-values.yaml" --scanlines 2>"${TMPDIR}/scan-stderr.txt")" || true
SCAN_SOFT_STDERR="$(cat "${TMPDIR}/scan-stderr.txt")"

assert_not_contains "Scanlines without GPU: no shader line" "shader" "${SCAN_SOFT_OUT}"
assert_contains "Scanlines without GPU: stderr warning" "no GPU" "${SCAN_SOFT_STDERR}"

printf "\n"

# ---------------------------------------------------------------------------
# Group 4: Audio config -- SDL tier (5 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 4: Audio config -- SDL tier ---"

AUDIO_OUT=""
AUDIO_RC=0
AUDIO_OUT="$(bash "${AUDIO_SCRIPT}" --local-values "${EXAMPLE_VALUES}" 2>/dev/null)" || AUDIO_RC=$?

assert_ok "Audio script exits 0 with SDL input" "${AUDIO_RC}"
assert_contains "Output contains sound_output = exact" "sound_output = exact" "${AUDIO_OUT}"
assert_contains "Output contains audio_frequency = 48000" "audio_frequency = 48000" "${AUDIO_OUT}"
assert_contains "Output contains sound_stereo = stereo" "sound_stereo = stereo" "${AUDIO_OUT}"
assert_contains "Output contains sound_interpol = anti" "sound_interpol = anti" "${AUDIO_OUT}"

printf "\n"

# ---------------------------------------------------------------------------
# Group 5: Audio config -- No audio (3 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 5: Audio config -- No audio ---"

NOAUDIO_OUT=""
NOAUDIO_RC=0
NOAUDIO_OUT="$(bash "${AUDIO_SCRIPT}" --local-values "${TMPDIR}/no-gpu-values.yaml" 2>/dev/null)" || NOAUDIO_RC=$?

assert_ok "Audio script exits 0 with no-audio input" "${NOAUDIO_RC}"
assert_contains "Output contains sound_output = none" "sound_output = none" "${NOAUDIO_OUT}"
assert_not_contains "No audio_frequency when disabled" "audio_frequency" "${NOAUDIO_OUT}"

printf "\n"

# ---------------------------------------------------------------------------
# Group 6: Render script -- Integration (5 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 6: Render script -- Integration ---"

RENDER_OUTPUT="${TMPDIR}/test-output.fs-uae"
RENDER_RC=0
bash "${RENDER_SCRIPT}" \
    --local-values "${EXAMPLE_VALUES}" \
    --rom-dir "/tmp/test-roms" \
    --data-dir "/tmp/test-data" \
    --output "${RENDER_OUTPUT}" 2>/dev/null || RENDER_RC=$?

assert_file_exists "Rendered config file exists" "${RENDER_OUTPUT}"

if [[ -f "${RENDER_OUTPUT}" ]]; then
    RENDER_CONTENT="$(cat "${RENDER_OUTPUT}")"
    assert_contains "Rendered config contains /tmp/test-roms (ROM_DIR replaced)" "/tmp/test-roms" "${RENDER_CONTENT}"
    assert_contains "Rendered config contains /tmp/test-data (DATA_DIR replaced)" "/tmp/test-data" "${RENDER_CONTENT}"
    assert_contains "Rendered config contains display settings" "video_sync" "${RENDER_CONTENT}"
    assert_contains "Rendered config contains audio settings" "sound_output" "${RENDER_CONTENT}"
else
    # File missing -- fail remaining assertions
    assert_eq "Rendered config contains ROM_DIR" "file-exists" "file-missing"
    assert_eq "Rendered config contains DATA_DIR" "file-exists" "file-missing"
    assert_eq "Rendered config contains display" "file-exists" "file-missing"
    assert_eq "Rendered config contains audio" "file-exists" "file-missing"
fi

printf "\n"

# ---------------------------------------------------------------------------
# Group 7: Shader file (2 assertions)
# ---------------------------------------------------------------------------

printf "%s\n" "--- Group 7: Shader file ---"

assert_file_exists "Scanline shader file exists" "${SHADER_FILE}"

if [[ -f "${SHADER_FILE}" ]]; then
    SHADER_CONTENT="$(cat "${SHADER_FILE}")"
    assert_contains "Shader contains gl_FragColor (valid GLSL)" "gl_FragColor" "${SHADER_CONTENT}"
else
    assert_eq "Shader contains gl_FragColor" "file-exists" "file-missing"
fi

printf "\n"

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

TOTAL=$(( PASS + FAIL ))
printf "%s\n" "========================================"
printf "%s/%s assertions passed\n" "${PASS}" "${TOTAL}"
printf "%s\n" "========================================"

if [[ "${FAIL}" -gt 0 ]]; then
    exit 1
fi

exit 0

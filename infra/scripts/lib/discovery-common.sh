# discovery-common.sh -- Shared functions for hardware discovery modules
#
# Sourced by discover-audio.sh, discover-network.sh, discover-usb.sh, etc.
# Provides YAML emission helpers, tool detection, and graceful degradation.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.

set -euo pipefail

# ---------------------------------------------------------------------------
# YAML emission helpers
# ---------------------------------------------------------------------------

# Emit a YAML comment header with module name, date, and machine-safe note
yaml_header() {
    local module_name="$1"
    local date_str
    date_str="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    printf "# %s Discovery\n" "${module_name}"
    printf "# Generated on %s\n" "${date_str}"
    printf "# Machine-safe: no identifying information in default output\n"
}

# Emit a key-value pair with proper quoting for strings containing spaces
# Usage: yaml_key "  " "name" "My Device Name"
yaml_key() {
    local indent="$1"
    local key="$2"
    local value="$3"
    if [[ -z "${value}" ]]; then
        printf "%s%s: \"\"\n" "${indent}" "${key}"
    elif [[ "${value}" =~ [[:space:]] || "${value}" =~ [\"\'\:\#\[\]\{\}\,\&\*\!\|\>\<\%\@\`] ]]; then
        printf "%s%s: \"%s\"\n" "${indent}" "${key}" "${value}"
    else
        printf "%s%s: %s\n" "${indent}" "${key}" "${value}"
    fi
}

# Emit a boolean key-value pair
# Usage: yaml_bool "  " "present" "true"
yaml_bool() {
    local indent="$1"
    local key="$2"
    local bool="$3"
    printf "%s%s: %s\n" "${indent}" "${key}" "${bool}"
}

# Emit an integer key-value pair (no quotes)
# Usage: yaml_int "  " "count" 5
yaml_int() {
    local indent="$1"
    local key="$2"
    local value="$3"
    printf "%s%s: %s\n" "${indent}" "${key}" "${value}"
}

# Emit a YAML list item
# Usage: yaml_list_item "    " "item value"
yaml_list_item() {
    local indent="$1"
    local value="$2"
    if [[ "${value}" =~ [[:space:]] || "${value}" =~ [\"\'\:\#\[\]\{\}\,\&\*\!\|\>\<\%\@\`] ]]; then
        printf "%s- \"%s\"\n" "${indent}" "${value}"
    else
        printf "%s- %s\n" "${indent}" "${value}"
    fi
}

# Emit a YAML section header (key followed by colon)
# Usage: yaml_section "  " "capabilities"
yaml_section() {
    local indent="$1"
    local key="$2"
    printf "%s%s:\n" "${indent}" "${key}"
}

# ---------------------------------------------------------------------------
# Tool detection and graceful degradation
# ---------------------------------------------------------------------------

# Check if a command exists on the system
# Usage: has_command "pactl" && pactl info
has_command() {
    local cmd="$1"
    command -v "${cmd}" &>/dev/null
}

# Safely read a file, returning empty string if not readable
# Usage: result=$(safe_read "/proc/asound/cards")
safe_read() {
    local file="$1"
    if [[ -r "${file}" ]]; then
        cat "${file}" 2>/dev/null || echo ""
    else
        echo ""
    fi
}

# Print a warning to stderr (keeps stdout clean for YAML output)
# Usage: warn "PulseAudio not detected, falling back to ALSA"
warn() {
    local msg="$1"
    printf "[WARN] %s\n" "${msg}" >&2
}

# Verify we are running on Linux; exit 1 with message if not
# Usage: require_linux
require_linux() {
    local os
    os="$(uname -s)"
    if [[ "${os}" != "Linux" ]]; then
        printf "ERROR: This script requires Linux (detected: %s)\n" "${os}" >&2
        exit 1
    fi
}

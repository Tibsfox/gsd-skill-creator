# shellcheck disable=SC2034 # variables consumed by sourcing scripts
# pkg-abstraction.sh -- Package manager abstraction layer
#
# Provides distribution-agnostic package management operations that dispatch
# to the correct backend (dnf, apt, pacman) based on detected distribution.
#
# Usage:
#   source lib/pkg-abstraction.sh
#   pkg_install java-21-jdk curl tmux
#   pkg_installed bash && echo "bash is present"
#   pkg_available nonexistent-pkg || echo "not in repos"
#
# Detection strategy (in priority order):
#   1. PKG_BACKEND env var (allows override)
#   2. hardware-capabilities.yaml distro.package_manager field
#   3. discover-distro.sh inline execution
#   4. Runtime detection: check for dnf, apt, pacman commands
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables except _PKG_BACKEND (module state).
#
# Package abstraction v1.0.0

set -euo pipefail

# ---------------------------------------------------------------------------
# Source dependencies
# ---------------------------------------------------------------------------

_PKG_ABS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=discovery-common.sh
source "${_PKG_ABS_DIR}/discovery-common.sh"

# shellcheck source=pkg-names.sh
source "${_PKG_ABS_DIR}/pkg-names.sh"

# Module state -- detected package manager backend
_PKG_BACKEND="${PKG_BACKEND:-}"

# Track apt cache freshness (seconds since epoch of last update)
_PKG_APT_CACHE_UPDATED=0

# Supported backends for error messages
_PKG_SUPPORTED_BACKENDS="dnf, apt, pacman"

# ---------------------------------------------------------------------------
# Backend Detection
# ---------------------------------------------------------------------------

# Detect and set _PKG_BACKEND using the priority strategy.
# Prints the detected backend to stderr.
# Returns 1 with informative message if no supported backend found.
#
# Usage: pkg_detect_backend
pkg_detect_backend() {
    # Strategy 1: PKG_BACKEND env var override
    if [[ -n "${PKG_BACKEND:-}" ]]; then
        _PKG_BACKEND="${PKG_BACKEND}"
        _pkg_validate_backend || return 1
        warn "pkg-abstraction: using backend '${_PKG_BACKEND}' (from PKG_BACKEND env var)"
        return 0
    fi

    # Strategy 2: Read from hardware-capabilities.yaml
    local caps_file="${_PKG_ABS_DIR}/../../inventory/hardware-capabilities.yaml"
    if [[ -f "${caps_file}" ]]; then
        local yaml_pm
        yaml_pm="$(_pkg_parse_yaml_pm "${caps_file}")"
        if [[ -n "${yaml_pm}" && "${yaml_pm}" != "unknown" ]]; then
            _PKG_BACKEND="${yaml_pm}"
            _pkg_validate_backend || return 1
            warn "pkg-abstraction: using backend '${_PKG_BACKEND}' (from hardware-capabilities.yaml)"
            return 0
        fi
    fi

    # Strategy 3: Run discover-distro.sh inline and capture package_manager
    local distro_script="${_PKG_ABS_DIR}/../discover-distro.sh"
    if [[ -x "${distro_script}" ]]; then
        local distro_output
        distro_output="$("${distro_script}" 2>/dev/null)" || true
        if [[ -n "${distro_output}" ]]; then
            local distro_pm
            distro_pm="$(printf "%s" "${distro_output}" | _pkg_grep_yaml_key "package_manager")"
            if [[ -n "${distro_pm}" && "${distro_pm}" != "unknown" ]]; then
                _PKG_BACKEND="${distro_pm}"
                _pkg_validate_backend || return 1
                warn "pkg-abstraction: using backend '${_PKG_BACKEND}' (from discover-distro.sh)"
                return 0
            fi
        fi
    fi

    # Strategy 4: Runtime detection by checking available commands
    if has_command dnf; then
        _PKG_BACKEND="dnf"
        warn "pkg-abstraction: using backend 'dnf' (runtime detection)"
        return 0
    elif has_command apt-get; then
        _PKG_BACKEND="apt"
        warn "pkg-abstraction: using backend 'apt' (runtime detection)"
        return 0
    elif has_command pacman; then
        _PKG_BACKEND="pacman"
        warn "pkg-abstraction: using backend 'pacman' (runtime detection)"
        return 0
    fi

    # All strategies failed
    printf "ERROR: pkg-abstraction: no supported package manager found.\n" >&2
    printf "  Supported backends: %s\n" "${_PKG_SUPPORTED_BACKENDS}" >&2
    printf "  Tried: PKG_BACKEND env var, hardware-capabilities.yaml, discover-distro.sh, runtime detection\n" >&2
    return 1
}

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Validate that _PKG_BACKEND is a supported value.
# Returns 1 with error message if unsupported.
_pkg_validate_backend() {
    case "${_PKG_BACKEND}" in
        dnf|apt|pacman)
            return 0
            ;;
        *)
            printf "ERROR: pkg-abstraction: unsupported package manager backend '%s'\n" "${_PKG_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_PKG_SUPPORTED_BACKENDS}" >&2
            _PKG_BACKEND=""
            return 1
            ;;
    esac
}

# Ensure _PKG_BACKEND is set, calling pkg_detect_backend if needed.
_pkg_ensure_backend() {
    if [[ -z "${_PKG_BACKEND}" ]]; then
        pkg_detect_backend || return 1
    fi
}

# Parse package_manager from a YAML file (simple grep-based, no external deps).
# Handles both quoted and unquoted values.
# Usage: _pkg_parse_yaml_pm "/path/to/hardware-capabilities.yaml"
_pkg_parse_yaml_pm() {
    local file="$1"
    safe_read "${file}" | _pkg_grep_yaml_key "package_manager"
}

# Extract a YAML value by key from stdin (simple line-based parsing).
# Strips quotes and whitespace. Works for flat key: value lines.
# Usage: echo "$yaml" | _pkg_grep_yaml_key "package_manager"
_pkg_grep_yaml_key() {
    local key="$1"
    local line value
    while IFS= read -r line; do
        # Match lines like "  package_manager: dnf" or "  package_manager: \"dnf\""
        if [[ "${line}" =~ ^[[:space:]]*${key}:[[:space:]]*(.*) ]]; then
            value="${BASH_REMATCH[1]}"
            # Strip surrounding quotes
            value="${value#\"}"
            value="${value%\"}"
            value="${value#\'}"
            value="${value%\'}"
            # Strip trailing whitespace
            value="${value%"${value##*[![:space:]]}"}"
            printf "%s" "${value}"
            return 0
        fi
    done
    return 1
}

# Resolve one or more logical names to distro-specific names for the current backend.
# Prints resolved names space-separated. Returns 1 if any name is unavailable.
# Usage: resolved=$(_pkg_resolve_names "java-21-jdk" "curl")
_pkg_resolve_names() {
    local resolved_names=()
    local logical_name resolved

    for logical_name in "$@"; do
        if resolved="$(resolve_pkg_name "${logical_name}" "${_PKG_BACKEND}")"; then
            resolved_names+=("${resolved}")
        else
            printf "ERROR: pkg-abstraction: package '%s' is not available on backend '%s'\n" \
                "${logical_name}" "${_PKG_BACKEND}" >&2
            return 1
        fi
    done

    printf "%s" "${resolved_names[*]}"
    return 0
}

# Check if apt cache is stale (older than 1 hour) and refresh if needed.
_pkg_apt_refresh_if_stale() {
    if [[ "${_PKG_BACKEND}" != "apt" ]]; then
        return 0
    fi

    # Check timestamp of apt cache
    local cache_file="/var/lib/apt/lists/partial"
    local cache_dir="/var/lib/apt/lists"
    local cache_age=9999
    local now

    now="$(date +%s)"

    # Use the lists directory modification time as cache freshness indicator
    if [[ -d "${cache_dir}" ]]; then
        local cache_mtime
        cache_mtime="$(stat -c %Y "${cache_dir}" 2>/dev/null || echo "0")"
        cache_age=$(( now - cache_mtime ))
    fi

    # Also check our own tracking variable (in case we already refreshed this session)
    if [[ "${_PKG_APT_CACHE_UPDATED}" -gt 0 ]]; then
        local session_age=$(( now - _PKG_APT_CACHE_UPDATED ))
        if [[ "${session_age}" -lt 3600 ]]; then
            return 0
        fi
    fi

    # Refresh if cache is older than 1 hour (3600 seconds)
    if [[ "${cache_age}" -gt 3600 ]]; then
        warn "pkg-abstraction: apt cache is stale (${cache_age}s old), running apt-get update"
        sudo apt-get update -qq >/dev/null 2>&1 || {
            warn "pkg-abstraction: apt-get update failed (continuing with stale cache)"
        }
        _PKG_APT_CACHE_UPDATED="$(date +%s)"
    fi
}

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

# Install one or more packages by logical name.
# Resolves names via pkg-names.sh, then dispatches to the active backend.
# Returns non-zero on failure with the failing package name in error message.
#
# Usage: pkg_install java-21-jdk curl tmux
pkg_install() {
    _pkg_ensure_backend || return 1

    if [[ $# -eq 0 ]]; then
        warn "pkg-abstraction: pkg_install called with no arguments"
        return 1
    fi

    local resolved
    resolved="$(_pkg_resolve_names "$@")" || return 1

    case "${_PKG_BACKEND}" in
        dnf)
            sudo dnf install -y ${resolved} || {
                printf "ERROR: pkg-abstraction: dnf install failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
        apt)
            _pkg_apt_refresh_if_stale
            sudo apt-get install -y ${resolved} || {
                printf "ERROR: pkg-abstraction: apt-get install failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
        pacman)
            sudo pacman -S --noconfirm --needed ${resolved} || {
                printf "ERROR: pkg-abstraction: pacman install failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
    esac
}

# Remove one or more packages by logical name.
#
# Usage: pkg_remove java-21-jdk curl
pkg_remove() {
    _pkg_ensure_backend || return 1

    if [[ $# -eq 0 ]]; then
        warn "pkg-abstraction: pkg_remove called with no arguments"
        return 1
    fi

    local resolved
    resolved="$(_pkg_resolve_names "$@")" || return 1

    case "${_PKG_BACKEND}" in
        dnf)
            sudo dnf remove -y ${resolved} || {
                printf "ERROR: pkg-abstraction: dnf remove failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
        apt)
            sudo apt-get remove -y ${resolved} || {
                printf "ERROR: pkg-abstraction: apt-get remove failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
        pacman)
            sudo pacman -R --noconfirm ${resolved} || {
                printf "ERROR: pkg-abstraction: pacman remove failed for: %s (resolved from: %s)\n" \
                    "${resolved}" "$*" >&2
                return 1
            }
            ;;
    esac
}

# Check if a package is available in the repositories.
# Returns 0 if available, 1 if not.
#
# Usage: pkg_available java-21-jdk && echo "available"
pkg_available() {
    _pkg_ensure_backend || return 1

    local logical_name="$1"
    local resolved
    resolved="$(resolve_pkg_name "${logical_name}" "${_PKG_BACKEND}")" || {
        # Package explicitly marked as unavailable in mapping
        return 1
    }

    case "${_PKG_BACKEND}" in
        dnf)
            dnf list available "${resolved}" &>/dev/null
            ;;
        apt)
            apt-cache show "${resolved}" &>/dev/null
            ;;
        pacman)
            pacman -Ss "^${resolved}$" &>/dev/null
            ;;
    esac
}

# Check if a package is already installed.
# Returns 0 if installed, 1 if not.
#
# Usage: pkg_installed curl && echo "curl is installed"
pkg_installed() {
    _pkg_ensure_backend || return 1

    local logical_name="$1"
    local resolved
    resolved="$(resolve_pkg_name "${logical_name}" "${_PKG_BACKEND}")" || {
        # Package explicitly marked as unavailable in mapping -- can't be installed
        return 1
    }

    case "${_PKG_BACKEND}" in
        dnf)
            rpm -q "${resolved}" &>/dev/null
            ;;
        apt)
            dpkg -l "${resolved}" 2>/dev/null | grep -q "^ii"
            ;;
        pacman)
            pacman -Q "${resolved}" &>/dev/null
            ;;
    esac
}

# Update the package cache only (no upgrades).
#
# Usage: pkg_update
pkg_update() {
    _pkg_ensure_backend || return 1

    case "${_PKG_BACKEND}" in
        dnf)
            sudo dnf makecache || {
                warn "pkg-abstraction: dnf makecache failed"
                return 1
            }
            ;;
        apt)
            sudo apt-get update || {
                warn "pkg-abstraction: apt-get update failed"
                return 1
            }
            _PKG_APT_CACHE_UPDATED="$(date +%s)"
            ;;
        pacman)
            sudo pacman -Sy || {
                warn "pkg-abstraction: pacman -Sy failed"
                return 1
            }
            ;;
    esac
}

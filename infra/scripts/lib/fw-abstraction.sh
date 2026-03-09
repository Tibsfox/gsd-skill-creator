# shellcheck disable=SC2024 # sudo redirect pattern used intentionally with fallback
# fw-abstraction.sh -- Firewall abstraction layer
#
# Provides distribution-agnostic firewall management operations that dispatch
# to the correct backend (firewalld, ufw, iptables) based on detection.
#
# Usage:
#   source lib/fw-abstraction.sh
#   fw_detect_backend
#   fw_open_port 25565 tcp
#   fw_close_port 25565 tcp
#   fw_open_service http
#   fw_list_ports
#   fw_status
#
# Detection strategy (in priority order):
#   1. FW_BACKEND env var (allows override)
#   2. hardware-capabilities.yaml distro.firewall field
#   3. discover-distro.sh inline execution
#   4. Runtime detection: check for active firewalld, then ufw, then iptables
#
# Supported backends: firewalld, ufw, iptables, none
# "none" means no firewall detected -- ports are already accessible.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables except _FW_BACKEND (module state).
#
# Firewall abstraction v1.0.0

set -euo pipefail

# ---------------------------------------------------------------------------
# Source dependencies
# ---------------------------------------------------------------------------

_FW_ABS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=discovery-common.sh
source "${_FW_ABS_DIR}/discovery-common.sh"

# Module state -- detected firewall backend
_FW_BACKEND="${FW_BACKEND:-}"

# Supported backends for error messages
_FW_SUPPORTED_BACKENDS="firewalld, ufw, iptables, none"

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

# Validate that _FW_BACKEND is a supported value.
# Returns 1 with error message if unsupported.
_fw_validate_backend() {
    case "${_FW_BACKEND}" in
        firewalld|ufw|iptables|none)
            return 0
            ;;
        *)
            printf "ERROR: fw-abstraction: unsupported firewall backend '%s'\n" "${_FW_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_FW_SUPPORTED_BACKENDS}" >&2
            _FW_BACKEND=""
            return 1
            ;;
    esac
}

# Ensure _FW_BACKEND is set, calling fw_detect_backend if needed.
_fw_ensure_backend() {
    if [[ -z "${_FW_BACKEND}" ]]; then
        fw_detect_backend
    fi
}

# Parse firewall from a YAML file (simple grep-based, no external deps).
# Usage: _fw_parse_yaml_firewall "/path/to/hardware-capabilities.yaml"
_fw_parse_yaml_firewall() {
    local file="$1"
    local line value
    while IFS= read -r line; do
        if [[ "${line}" =~ ^[[:space:]]*firewall:[[:space:]]*(.*) ]]; then
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
    done < <(safe_read "${file}")
    return 1
}

# Validate port number is in range 1-65535.
# Returns 0 if valid, 1 with error message if not.
# Usage: _fw_validate_port 25565
_fw_validate_port() {
    local port="$1"

    # Check that port is a positive integer
    if ! [[ "${port}" =~ ^[0-9]+$ ]]; then
        printf "ERROR: fw-abstraction: invalid port '%s' -- must be a number between 1 and 65535\n" "${port}" >&2
        return 1
    fi

    # Check range
    if [[ "${port}" -lt 1 || "${port}" -gt 65535 ]]; then
        printf "ERROR: fw-abstraction: invalid port '%s' -- must be between 1 and 65535\n" "${port}" >&2
        return 1
    fi

    return 0
}

# Validate protocol is tcp or udp.
# Returns 0 if valid, 1 with error message if not.
# Usage: _fw_validate_protocol tcp
_fw_validate_protocol() {
    local proto="$1"
    case "${proto}" in
        tcp|udp)
            return 0
            ;;
        *)
            printf "ERROR: fw-abstraction: invalid protocol '%s' -- must be 'tcp' or 'udp'\n" "${proto}" >&2
            return 1
            ;;
    esac
}

# Check if a port is already open for the given protocol.
# Returns 0 if open, 1 if not.
# Usage: _fw_is_port_open 25565 tcp
_fw_is_port_open() {
    local port="$1"
    local proto="$2"

    case "${_FW_BACKEND}" in
        firewalld)
            sudo firewall-cmd --query-port="${port}/${proto}" &>/dev/null
            ;;
        ufw)
            sudo ufw status 2>/dev/null | grep -qE "${port}/${proto}[[:space:]]+ALLOW"
            ;;
        iptables)
            sudo iptables -L INPUT -n 2>/dev/null | grep -qE "ACCEPT.*${proto}.*dpt:${port}"
            ;;
        none)
            # No firewall -- all ports are "open"
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Resolve a service name to a port number using /etc/services.
# Returns the port number on stdout, or empty string if not found.
# Usage: port=$(_fw_resolve_service "http")
_fw_resolve_service() {
    local service_name="$1"
    local port=""

    if [[ -r /etc/services ]]; then
        # Match lines like "http            80/tcp" -- extract port number
        port="$(grep -E "^${service_name}[[:space:]]" /etc/services 2>/dev/null | head -1 | awk '{print $2}' | cut -d/ -f1)"
    fi

    printf "%s" "${port}"
}

# ---------------------------------------------------------------------------
# Backend Detection
# ---------------------------------------------------------------------------

# Detect and set _FW_BACKEND using the priority strategy.
# Prints the detected backend to stderr.
# If no firewall tool is found, sets to "none" and warns.
# Returns 0 always.
#
# Usage: fw_detect_backend
fw_detect_backend() {
    # Strategy 1: FW_BACKEND env var override
    if [[ -n "${FW_BACKEND:-}" ]]; then
        _FW_BACKEND="${FW_BACKEND}"
        if _fw_validate_backend; then
            warn "fw-abstraction: using backend '${_FW_BACKEND}' (from FW_BACKEND env var)"
            return 0
        fi
        # Invalid env var value -- fall through to other strategies
        _FW_BACKEND=""
    fi

    # Strategy 2: Read from hardware-capabilities.yaml
    local caps_file="${_FW_ABS_DIR}/../../inventory/hardware-capabilities.yaml"
    if [[ -f "${caps_file}" ]]; then
        local yaml_fw
        yaml_fw="$(_fw_parse_yaml_firewall "${caps_file}")" || true
        if [[ -n "${yaml_fw}" && "${yaml_fw}" != "none" ]]; then
            _FW_BACKEND="${yaml_fw}"
            if _fw_validate_backend; then
                warn "fw-abstraction: using backend '${_FW_BACKEND}' (from hardware-capabilities.yaml)"
                return 0
            fi
            _FW_BACKEND=""
        elif [[ "${yaml_fw}" == "none" ]]; then
            _FW_BACKEND="none"
            warn "fw-abstraction: no firewall detected (from hardware-capabilities.yaml)"
            return 0
        fi
    fi

    # Strategy 3: Run discover-distro.sh inline and capture firewall field
    local distro_script="${_FW_ABS_DIR}/../discover-distro.sh"
    if [[ -x "${distro_script}" ]]; then
        local distro_output
        distro_output="$("${distro_script}" 2>/dev/null)" || true
        if [[ -n "${distro_output}" ]]; then
            local distro_fw
            distro_fw="$(printf "%s" "${distro_output}" | while IFS= read -r line; do
                if [[ "${line}" =~ ^[[:space:]]*firewall:[[:space:]]*(.*) ]]; then
                    local val="${BASH_REMATCH[1]}"
                    val="${val#\"}"
                    val="${val%\"}"
                    val="${val#\'}"
                    val="${val%\'}"
                    val="${val%"${val##*[![:space:]]}"}"
                    printf "%s" "${val}"
                    break
                fi
            done)" || true
            if [[ -n "${distro_fw}" ]]; then
                _FW_BACKEND="${distro_fw}"
                if _fw_validate_backend; then
                    warn "fw-abstraction: using backend '${_FW_BACKEND}' (from discover-distro.sh)"
                    return 0
                fi
                _FW_BACKEND=""
            fi
        fi
    fi

    # Strategy 4: Runtime detection by checking active firewall tools
    if has_command firewall-cmd; then
        local fw_active
        fw_active="$(systemctl is-active firewalld 2>/dev/null || echo "inactive")"
        if [[ "${fw_active}" == "active" ]]; then
            _FW_BACKEND="firewalld"
            warn "fw-abstraction: using backend 'firewalld' (runtime detection)"
            return 0
        fi
    fi

    if has_command ufw; then
        local ufw_out
        ufw_out="$(ufw status 2>/dev/null || echo "")"
        if [[ -n "${ufw_out}" ]] && ! echo "${ufw_out}" | grep -qi 'inactive'; then
            _FW_BACKEND="ufw"
            warn "fw-abstraction: using backend 'ufw' (runtime detection)"
            return 0
        fi
    fi

    if has_command iptables; then
        local ipt_rules
        ipt_rules="$(iptables -L INPUT -n 2>/dev/null | tail -n +3 || echo "")"
        if [[ -n "${ipt_rules}" ]]; then
            _FW_BACKEND="iptables"
            warn "fw-abstraction: using backend 'iptables' (runtime detection)"
            return 0
        fi
    fi

    # No firewall found -- this is valid (some systems have no firewall)
    _FW_BACKEND="none"
    warn "fw-abstraction: no firewall detected -- ports are already accessible"
    return 0
}

# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

# Open a port for the given protocol (defaults to tcp).
# Idempotent: opening an already-open port succeeds silently.
#
# Usage: fw_open_port 25565 tcp
#        fw_open_port 25565       (defaults to tcp)
fw_open_port() {
    _fw_ensure_backend

    if [[ $# -lt 1 ]]; then
        printf "ERROR: fw-abstraction: fw_open_port requires at least 1 argument (port)\n" >&2
        return 1
    fi

    local port="$1"
    local proto="${2:-tcp}"

    _fw_validate_port "${port}" || return 1
    _fw_validate_protocol "${proto}" || return 1

    # Idempotency check
    if _fw_is_port_open "${port}" "${proto}"; then
        warn "fw-abstraction: port ${port}/${proto} is already open"
        return 0
    fi

    case "${_FW_BACKEND}" in
        firewalld)
            sudo firewall-cmd --permanent --add-port="${port}/${proto}" &>/dev/null && \
            sudo firewall-cmd --reload &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to open port %s/%s via firewalld\n" "${port}" "${proto}" >&2
                printf "  Ensure you have sudo privileges or run with sudo\n" >&2
                return 1
            }
            ;;
        ufw)
            sudo ufw allow "${port}/${proto}" &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to open port %s/%s via ufw\n" "${port}" "${proto}" >&2
                printf "  Ensure you have sudo privileges or run with sudo\n" >&2
                return 1
            }
            ;;
        iptables)
            sudo iptables -A INPUT -p "${proto}" --dport "${port}" -j ACCEPT 2>/dev/null || {
                printf "ERROR: fw-abstraction: failed to open port %s/%s via iptables\n" "${port}" "${proto}" >&2
                printf "  Ensure you have sudo privileges or run with sudo\n" >&2
                return 1
            }
            # Attempt to persist the rule
            if has_command iptables-save; then
                sudo iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
                sudo iptables-save > /etc/sysconfig/iptables 2>/dev/null || \
                warn "fw-abstraction: iptables rule added but could not persist (iptables-save target not writable)"
            else
                warn "fw-abstraction: iptables rule added but iptables-save not available -- rule will not persist across reboots"
            fi
            ;;
        none)
            warn "fw-abstraction: no firewall active -- port ${port}/${proto} is already accessible"
            return 0
            ;;
        *)
            printf "ERROR: fw-abstraction: unknown backend '%s'\n" "${_FW_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_FW_SUPPORTED_BACKENDS}" >&2
            return 1
            ;;
    esac
}

# Close a port for the given protocol (defaults to tcp).
# Idempotent: closing an already-closed port succeeds silently.
#
# Usage: fw_close_port 25565 tcp
#        fw_close_port 25565       (defaults to tcp)
fw_close_port() {
    _fw_ensure_backend

    if [[ $# -lt 1 ]]; then
        printf "ERROR: fw-abstraction: fw_close_port requires at least 1 argument (port)\n" >&2
        return 1
    fi

    local port="$1"
    local proto="${2:-tcp}"

    _fw_validate_port "${port}" || return 1
    _fw_validate_protocol "${proto}" || return 1

    # Idempotency check -- if port is not open, nothing to do
    if ! _fw_is_port_open "${port}" "${proto}"; then
        warn "fw-abstraction: port ${port}/${proto} is already closed"
        return 0
    fi

    case "${_FW_BACKEND}" in
        firewalld)
            sudo firewall-cmd --permanent --remove-port="${port}/${proto}" &>/dev/null && \
            sudo firewall-cmd --reload &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to close port %s/%s via firewalld\n" "${port}" "${proto}" >&2
                return 1
            }
            ;;
        ufw)
            sudo ufw delete allow "${port}/${proto}" &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to close port %s/%s via ufw\n" "${port}" "${proto}" >&2
                return 1
            }
            ;;
        iptables)
            # Ignore error if rule doesn't exist (idempotent)
            sudo iptables -D INPUT -p "${proto}" --dport "${port}" -j ACCEPT 2>/dev/null || true
            # Attempt to persist
            if has_command iptables-save; then
                sudo iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
                sudo iptables-save > /etc/sysconfig/iptables 2>/dev/null || true
            fi
            ;;
        none)
            warn "fw-abstraction: no firewall active -- port ${port}/${proto} cannot be closed (no firewall to close it on)"
            return 0
            ;;
        *)
            printf "ERROR: fw-abstraction: unknown backend '%s'\n" "${_FW_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_FW_SUPPORTED_BACKENDS}" >&2
            return 1
            ;;
    esac
}

# Open a well-known service by name (convenience wrapper).
# For firewalld and ufw, uses native service name support.
# For iptables, resolves service to port via /etc/services.
#
# Usage: fw_open_service http
#        fw_open_service ssh
fw_open_service() {
    _fw_ensure_backend

    if [[ $# -lt 1 ]]; then
        printf "ERROR: fw-abstraction: fw_open_service requires 1 argument (service name)\n" >&2
        return 1
    fi

    local service_name="$1"

    case "${_FW_BACKEND}" in
        firewalld)
            # Check if already added
            if sudo firewall-cmd --query-service="${service_name}" &>/dev/null; then
                warn "fw-abstraction: service '${service_name}' is already open"
                return 0
            fi
            sudo firewall-cmd --permanent --add-service="${service_name}" &>/dev/null && \
            sudo firewall-cmd --reload &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to open service '%s' via firewalld\n" "${service_name}" >&2
                return 1
            }
            ;;
        ufw)
            sudo ufw allow "${service_name}" &>/dev/null || {
                printf "ERROR: fw-abstraction: failed to open service '%s' via ufw\n" "${service_name}" >&2
                return 1
            }
            ;;
        iptables)
            # Resolve service name to port number
            local port
            port="$(_fw_resolve_service "${service_name}")"
            if [[ -z "${port}" ]]; then
                printf "ERROR: fw-abstraction: unknown service '%s' -- not found in /etc/services\n" "${service_name}" >&2
                return 1
            fi
            fw_open_port "${port}" tcp
            ;;
        none)
            warn "fw-abstraction: no firewall active -- service '${service_name}' is already accessible"
            return 0
            ;;
        *)
            printf "ERROR: fw-abstraction: unknown backend '%s'\n" "${_FW_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_FW_SUPPORTED_BACKENDS}" >&2
            return 1
            ;;
    esac
}

# List currently open ports.
# Output goes to stdout for parsing by callers.
#
# Usage: fw_list_ports
fw_list_ports() {
    _fw_ensure_backend

    case "${_FW_BACKEND}" in
        firewalld)
            local ports services
            ports="$(sudo firewall-cmd --list-ports 2>/dev/null || echo "")"
            services="$(sudo firewall-cmd --list-services 2>/dev/null || echo "")"
            if [[ -n "${ports}" ]]; then
                printf "ports: %s\n" "${ports}"
            fi
            if [[ -n "${services}" ]]; then
                printf "services: %s\n" "${services}"
            fi
            if [[ -z "${ports}" && -z "${services}" ]]; then
                printf "no open ports or services\n"
            fi
            ;;
        ufw)
            sudo ufw status numbered 2>/dev/null || {
                printf "ERROR: fw-abstraction: failed to list ufw rules\n" >&2
                return 1
            }
            ;;
        iptables)
            local rules
            rules="$(sudo iptables -L INPUT -n --line-numbers 2>/dev/null | grep ACCEPT || echo "")"
            if [[ -n "${rules}" ]]; then
                printf "%s\n" "${rules}"
            else
                printf "no open ports\n"
            fi
            ;;
        none)
            printf "no firewall active -- all ports are accessible\n"
            ;;
        *)
            printf "ERROR: fw-abstraction: unknown backend '%s'\n" "${_FW_BACKEND}" >&2
            printf "  Supported backends: %s\n" "${_FW_SUPPORTED_BACKENDS}" >&2
            return 1
            ;;
    esac
}

# Print firewall backend and active/inactive status.
#
# Usage: fw_status
fw_status() {
    _fw_ensure_backend

    printf "backend: %s\n" "${_FW_BACKEND}"

    case "${_FW_BACKEND}" in
        firewalld)
            local state
            state="$(systemctl is-active firewalld 2>/dev/null || echo "unknown")"
            printf "status: %s\n" "${state}"
            ;;
        ufw)
            local ufw_line
            ufw_line="$(ufw status 2>/dev/null | head -1 || echo "unknown")"
            printf "status: %s\n" "${ufw_line}"
            ;;
        iptables)
            local rule_count
            rule_count="$(iptables -L INPUT -n 2>/dev/null | tail -n +3 | wc -l || echo "0")"
            if [[ "${rule_count}" -gt 0 ]]; then
                printf "status: active (%s rules)\n" "${rule_count}"
            else
                printf "status: active (no rules)\n"
            fi
            ;;
        none)
            printf "status: no firewall detected\n"
            ;;
        *)
            printf "status: unknown backend '%s'\n" "${_FW_BACKEND}"
            ;;
    esac
}

#!/usr/bin/env bash
# rcon-common.sh -- Shared RCON communication library
#
# Provides reusable RCON functions for Minecraft server management scripts.
# Consolidates the three-tier RCON fallback pattern (mcrcon -> python3 -> skip)
# used across manage-whitelist.sh and verify-pipeline.sh into a single
# sourceable library.
#
# Functions provided:
#   resolve_rcon_password  -- Resolve RCON password from env/secrets/default
#   send_rcon              -- Send a single RCON command with three-tier fallback
#   rcon_available         -- Check if RCON is configured (host + password set)
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/rcon-common.sh"
#   RCON_HOST="localhost"
#   RCON_PORT="25575"
#   resolve_rcon_password --secrets /path/to/secrets.yaml
#   send_rcon "save-all flush"
#
# Module-level variables (set before calling functions):
#   RCON_HOST  -- RCON server hostname/IP
#   RCON_PORT  -- RCON port (default: 25575)
#   RCON_PASS  -- RCON password (set by resolve_rcon_password or directly)

set -euo pipefail

# ---------------------------------------------------------------------------
# Standalone logging (works without discovery-common.sh)
# ---------------------------------------------------------------------------

if ! declare -F info &>/dev/null; then
    if [[ -t 2 ]]; then
        _RCON_RED='\033[0;31m'
        _RCON_GREEN='\033[0;32m'
        _RCON_YELLOW='\033[1;33m'
        _RCON_BLUE='\033[0;34m'
        _RCON_NC='\033[0m'
    else
        _RCON_RED='' _RCON_GREEN='' _RCON_YELLOW='' _RCON_BLUE='' _RCON_NC=''
    fi
    info()  { echo -e "${_RCON_BLUE}[INFO]${_RCON_NC}  $*" >&2; }
    ok()    { echo -e "${_RCON_GREEN}[OK]${_RCON_NC}    $*" >&2; }
    warn()  { echo -e "${_RCON_YELLOW}[WARN]${_RCON_NC}  $*" >&2; }
    error() { echo -e "${_RCON_RED}[ERROR]${_RCON_NC} $*" >&2; }
fi

# ---------------------------------------------------------------------------
# Default module-level variables
# ---------------------------------------------------------------------------

RCON_HOST="${RCON_HOST:-}"
RCON_PORT="${RCON_PORT:-25575}"
RCON_PASS="${RCON_PASS:-}"

# ---------------------------------------------------------------------------
# resolve_rcon_password [--secrets PATH]
#
# Resolves the RCON password using a three-tier fallback:
#   1. RCON_PASS environment variable (already set)
#   2. --secrets file path argument -> read rcon_password from YAML
#   3. Default secrets at ${PROJECT_ROOT}/infra/local/minecraft-secrets.yaml
#
# Sets: RCON_PASS variable
# Returns: 0 if password found, 1 if not found
# ---------------------------------------------------------------------------

resolve_rcon_password() {
    local secrets_file=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --secrets)
                secrets_file="${2:?'--secrets requires a path'}"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    # Tier 1: Already set via RCON_PASS env var
    if [[ -n "${RCON_PASS}" ]]; then
        return 0
    fi

    # Tier 2: Explicit secrets file
    if [[ -n "${secrets_file}" && -f "${secrets_file}" ]]; then
        RCON_PASS="$(_extract_rcon_password "${secrets_file}")"
        if [[ -n "${RCON_PASS}" ]]; then
            info "RCON password loaded from: ${secrets_file}"
            return 0
        fi
    fi

    # Tier 3: Default secrets location
    local default_secrets=""
    if [[ -n "${PROJECT_ROOT:-}" ]]; then
        default_secrets="${PROJECT_ROOT}/infra/local/minecraft-secrets.yaml"
    fi

    if [[ -n "${default_secrets}" && -f "${default_secrets}" ]]; then
        RCON_PASS="$(_extract_rcon_password "${default_secrets}")"
        if [[ -n "${RCON_PASS}" ]]; then
            info "RCON password loaded from default: ${default_secrets}"
            return 0
        fi
    fi

    return 1
}

# Internal: extract rcon_password from a YAML file
_extract_rcon_password() {
    local file="$1"
    grep -E '^[[:space:]]*rcon_password[[:space:]]*:' "${file}" 2>/dev/null \
        | head -1 \
        | sed 's/^[^:]*:[[:space:]]*//' \
        | sed 's/^"//;s/"[[:space:]]*$//' \
        | sed 's/[[:space:]]*$//' || true
}

# ---------------------------------------------------------------------------
# send_rcon COMMAND
#
# Send a single RCON command to the Minecraft server.
# Three-tier fallback: mcrcon CLI -> python3 socket -> skip with warning.
#
# Uses module-level: RCON_HOST, RCON_PORT, RCON_PASS
# Args: command string
# Stdout: Command output (if any)
# Returns: 0 on success, 1 on failure
# ---------------------------------------------------------------------------

send_rcon() {
    local cmd="$1"

    if [[ -z "${RCON_HOST}" ]]; then
        warn "No RCON host set, skipping command: ${cmd}"
        return 1
    fi

    if [[ -z "${RCON_PASS}" ]]; then
        warn "No RCON password set, skipping command: ${cmd}"
        return 1
    fi

    info "RCON command: ${cmd}"

    # Strategy 1: mcrcon CLI tool
    if command -v mcrcon &>/dev/null; then
        local output=""
        if output=$(mcrcon -H "${RCON_HOST}" -P "${RCON_PORT}" -p "${RCON_PASS}" "${cmd}" 2>/dev/null); then
            if [[ -n "${output}" ]]; then
                echo "${output}"
            fi
            ok "RCON command sent via mcrcon"
            return 0
        else
            warn "mcrcon command failed, trying fallback"
        fi
    fi

    # Strategy 2: python3 socket RCON protocol
    if command -v python3 &>/dev/null; then
        local result=""
        local py_exit=0
        result=$(python3 -c "
import socket, struct, sys

def rcon_send(host, port, password, command):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    try:
        sock.connect((host, int(port)))

        # Login packet (type 3 = SERVERDATA_AUTH)
        payload = struct.pack('<ii', 0, 3) + password.encode('utf-8') + b'\x00\x00'
        length = struct.pack('<i', len(payload))
        sock.send(length + payload)

        # Read login response
        resp_len = struct.unpack('<i', sock.recv(4))[0]
        resp = sock.recv(resp_len)
        req_id = struct.unpack('<i', resp[:4])[0]
        if req_id == -1:
            print('RCON authentication failed', file=sys.stderr)
            return False

        # Command packet (type 2 = SERVERDATA_EXECCOMMAND)
        payload = struct.pack('<ii', 1, 2) + command.encode('utf-8') + b'\x00\x00'
        length = struct.pack('<i', len(payload))
        sock.send(length + payload)

        # Read command response
        resp_len = struct.unpack('<i', sock.recv(4))[0]
        resp = sock.recv(resp_len)
        body = resp[8:].decode('utf-8', errors='replace').rstrip('\x00')
        if body:
            print(body)
        return True
    except Exception as e:
        print(f'RCON error: {e}', file=sys.stderr)
        return False
    finally:
        sock.close()

success = rcon_send('${RCON_HOST}', '${RCON_PORT}', '${RCON_PASS}', '${cmd}')
sys.exit(0 if success else 1)
" 2>/dev/null) || py_exit=$?

        if [[ ${py_exit} -eq 0 ]]; then
            if [[ -n "${result}" ]]; then
                echo "${result}"
            fi
            ok "RCON command sent via python3"
            return 0
        else
            warn "Python3 RCON command failed"
        fi
    fi

    # Strategy 3: No RCON client available
    warn "No RCON client available (install mcrcon or python3 for RCON support)"
    return 1
}

# ---------------------------------------------------------------------------
# rcon_available
#
# Check if RCON is configured (host + password set).
# Returns: 0 if RCON is available, 1 if not
# ---------------------------------------------------------------------------

rcon_available() {
    if [[ -n "${RCON_HOST}" && -n "${RCON_PASS}" ]]; then
        return 0
    fi
    return 1
}

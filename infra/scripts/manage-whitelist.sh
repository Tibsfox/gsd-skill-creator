#!/usr/bin/env bash
# manage-whitelist.sh -- Minecraft server whitelist management
#
# Manages the Minecraft server whitelist with both file-based (offline) and
# RCON-based (live) operations. Supports adding players with Mojang UUID
# lookup, removing players, listing the current whitelist, and syncing
# changes to a live server via RCON.
#
# File operations always work. RCON operations are optional enhancements
# that gracefully degrade when tools (mcrcon/python3) are unavailable.
#
# Requirements satisfied:
#   MC-07: Whitelist enforcement with automated add/remove/list/sync
#
# Usage: manage-whitelist.sh <command> [args] [options]
#
# Exit codes:
#   0 -- Success
#   1 -- Error (file not found, API failure, RCON failure)
#   2 -- Usage error

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# --- Defaults ---
WHITELIST_PATH="/opt/minecraft/server/whitelist.json"
RCON_HOST=""
RCON_PORT="25575"
RCON_PASS=""
SECRETS_FILE="${PROJECT_ROOT}/infra/local/minecraft-secrets.yaml"
OFFLINE_UUID=false
COMMAND=""
PLAYER_NAME=""
PLAYER_UUID=""

# --- Colors (if terminal supports them) ---
if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# --- Helper functions (log to stderr) ---
info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <command> [args] [options]

Manage the Minecraft server whitelist with file-based and optional RCON operations.

Commands:
  add <player_name> [uuid]    Add a player to the whitelist
  remove <player_name>        Remove a player from the whitelist
  list                        Display current whitelist entries
  sync                        Reload whitelist on live server via RCON

Options:
  --whitelist PATH            Path to whitelist.json (default: /opt/minecraft/server/whitelist.json)
  --rcon-host HOST            RCON server hostname/IP (enables live RCON commands)
  --rcon-port PORT            RCON port (default: 25575)
  --rcon-pass PASS            RCON password (explicit)
  --secrets PATH              Path to minecraft-secrets.yaml for RCON password
                              (default: infra/local/minecraft-secrets.yaml)
  --offline-uuid              Generate offline-mode UUID instead of Mojang lookup
  --help                      Show this help message

UUID Resolution (for 'add' command):
  1. If UUID provided as argument, use it directly
  2. If --offline-uuid flag set, generate UUID v3 from "OfflinePlayer:<name>"
  3. Otherwise, fetch UUID from Mojang API (requires network)

RCON Password Resolution:
  1. --rcon-pass argument (explicit)
  2. --secrets PATH -> read rcon_password from YAML
  3. Default secrets: infra/local/minecraft-secrets.yaml -> read rcon_password
  4. If none found: RCON operations skipped, file operations proceed

JSON Handling:
  Uses jq if available, falls back to python3 for JSON manipulation.
  At least one of jq or python3 must be installed.

Examples:
  # Add a player (Mojang UUID lookup)
  ${SCRIPT_NAME} add Notch

  # Add a player with explicit UUID
  ${SCRIPT_NAME} add Notch 069a79f4-44e9-4726-a5be-fca90e38aaf5

  # Add a player in offline mode
  ${SCRIPT_NAME} add TestPlayer --offline-uuid

  # Remove a player
  ${SCRIPT_NAME} remove Notch

  # List current whitelist
  ${SCRIPT_NAME} list

  # List whitelist from a local staged file
  ${SCRIPT_NAME} list --whitelist infra/output/minecraft/whitelist.json

  # Sync whitelist to live server
  ${SCRIPT_NAME} sync --rcon-host mc-server-01 --rcon-pass mypassword

  # Add player to local file and sync to live server
  ${SCRIPT_NAME} add Notch --whitelist /opt/minecraft/server/whitelist.json --rcon-host localhost
EOF
}

# ============================================================
# JSON helpers (jq with python3 fallback)
# ============================================================

# Detect JSON tool
JSON_TOOL=""
if command -v jq &>/dev/null; then
    JSON_TOOL="jq"
elif command -v python3 &>/dev/null; then
    JSON_TOOL="python3"
else
    die "Neither jq nor python3 found. Install jq (dnf install jq) or python3."
fi

# Read whitelist JSON and output formatted entries
# Output: one line per entry as "uuid|name"
json_read_entries() {
    local file="$1"
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        jq -r '.[] | "\(.uuid)|\(.name)"' "${file}" 2>/dev/null || true
    else
        python3 -c "
import json, sys
with open('${file}') as f:
    data = json.load(f)
for entry in data:
    print(f\"{entry['uuid']}|{entry['name']}\")
" 2>/dev/null || true
    fi
}

# Check if a player name exists in the whitelist
# Returns 0 if found, 1 if not found
json_has_player() {
    local file="$1"
    local name="$2"
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        jq -e --arg n "${name}" 'any(.[]; .name == $n)' "${file}" &>/dev/null
    else
        python3 -c "
import json, sys
with open('${file}') as f:
    data = json.load(f)
sys.exit(0 if any(e['name'] == '${name}' for e in data) else 1)
" 2>/dev/null
    fi
}

# Add a player entry to the whitelist JSON
json_add_player() {
    local file="$1"
    local uuid="$2"
    local name="$3"
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        local tmp="${file}.tmp.$$"
        jq --arg u "${uuid}" --arg n "${name}" \
            '. + [{"uuid": $u, "name": $n}]' "${file}" > "${tmp}" && \
            mv "${tmp}" "${file}"
    else
        python3 -c "
import json
with open('${file}') as f:
    data = json.load(f)
data.append({'uuid': '${uuid}', 'name': '${name}'})
with open('${file}', 'w') as f:
    json.dump(data, f, indent=2)
"
    fi
}

# Remove a player entry from the whitelist JSON by name
json_remove_player() {
    local file="$1"
    local name="$2"
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        local tmp="${file}.tmp.$$"
        jq --arg n "${name}" '[.[] | select(.name != $n)]' "${file}" > "${tmp}" && \
            mv "${tmp}" "${file}"
    else
        python3 -c "
import json
with open('${file}') as f:
    data = json.load(f)
data = [e for e in data if e['name'] != '${name}']
with open('${file}', 'w') as f:
    json.dump(data, f, indent=2)
"
    fi
}

# Count entries in the whitelist
json_count() {
    local file="$1"
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        jq 'length' "${file}" 2>/dev/null || echo "0"
    else
        python3 -c "
import json
with open('${file}') as f:
    print(len(json.load(f)))
" 2>/dev/null || echo "0"
    fi
}

# ============================================================
# UUID helpers
# ============================================================

# Format a raw 32-char hex UUID into dashed format (8-4-4-4-12)
format_uuid() {
    local raw="$1"
    # Remove any existing dashes
    raw="${raw//-/}"
    if [[ ${#raw} -ne 32 ]]; then
        die "Invalid UUID hex string: ${raw} (expected 32 hex chars)"
    fi
    echo "${raw:0:8}-${raw:8:4}-${raw:12:4}-${raw:16:4}-${raw:20:12}"
}

# Fetch UUID from Mojang API for an online-mode player
fetch_mojang_uuid() {
    local name="$1"
    local api_url="https://api.mojang.com/users/profiles/minecraft/${name}"
    local response

    info "Fetching UUID from Mojang API for: ${name}"

    if ! response=$(curl -sf --max-time 10 "${api_url}" 2>/dev/null); then
        return 1
    fi

    if [[ -z "${response}" ]]; then
        return 1
    fi

    local raw_id
    if [[ "${JSON_TOOL}" == "jq" ]]; then
        raw_id=$(echo "${response}" | jq -r '.id // empty' 2>/dev/null)
    else
        raw_id=$(python3 -c "
import json, sys
data = json.loads('${response}')
print(data.get('id', ''))
" 2>/dev/null)
    fi

    if [[ -z "${raw_id}" ]]; then
        return 1
    fi

    format_uuid "${raw_id}"
}

# Generate an offline-mode UUID v3 from "OfflinePlayer:<name>"
# This matches Minecraft's offline UUID generation algorithm
generate_offline_uuid() {
    local name="$1"
    local input="OfflinePlayer:${name}"

    # Generate UUID v3 (MD5-based) from the input string
    # Minecraft uses the same algorithm as Java's UUID.nameUUIDFromBytes()
    local md5
    md5=$(echo -n "${input}" | md5sum | cut -d' ' -f1)

    # Set version to 3 (byte 6, high nibble = 0011)
    local byte6="${md5:12:2}"
    byte6=$(printf "%02x" $(( (0x${byte6} & 0x0f) | 0x30 )))

    # Set variant to IETF (byte 8, high bits = 10xx)
    local byte8="${md5:16:2}"
    byte8=$(printf "%02x" $(( (0x${byte8} & 0x3f) | 0x80 )))

    # Reconstruct the UUID with version and variant bits set
    local uuid_hex="${md5:0:12}${byte6}${md5:14:2}${byte8}${md5:18:14}"

    format_uuid "${uuid_hex}"
}

# ============================================================
# RCON helpers
# ============================================================

# Resolve RCON password from various sources
resolve_rcon_password() {
    # Already set via --rcon-pass
    if [[ -n "${RCON_PASS}" ]]; then
        return 0
    fi

    # Try secrets file
    if [[ -f "${SECRETS_FILE}" ]]; then
        RCON_PASS="$(grep -E '^rcon_password:' "${SECRETS_FILE}" 2>/dev/null \
            | head -1 \
            | sed 's/^rcon_password:[[:space:]]*//' \
            | sed 's/^"//;s/"[[:space:]]*$//' \
            | sed 's/[[:space:]]*$//' || true)"

        if [[ -n "${RCON_PASS}" ]]; then
            info "RCON password loaded from: ${SECRETS_FILE}"
            return 0
        fi
    fi

    return 1
}

# Send an RCON command to the server
# Tries mcrcon first, then python3 fallback
send_rcon_command() {
    local cmd="$1"

    if [[ -z "${RCON_HOST}" ]]; then
        warn "No RCON host specified, skipping live server command: ${cmd}"
        return 0
    fi

    if ! resolve_rcon_password; then
        warn "No RCON password available, skipping live server command: ${cmd}"
        return 0
    fi

    info "Sending RCON command: ${cmd}"

    # Try mcrcon first
    if command -v mcrcon &>/dev/null; then
        if mcrcon -H "${RCON_HOST}" -P "${RCON_PORT}" -p "${RCON_PASS}" "${cmd}" 2>/dev/null; then
            ok "RCON command sent via mcrcon"
            return 0
        else
            warn "mcrcon command failed"
            return 1
        fi
    fi

    # Try python3 RCON client
    if command -v python3 &>/dev/null; then
        local result
        result=$(python3 -c "
import socket, struct, sys

def rcon_send(host, port, password, command):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(10)
    try:
        sock.connect((host, int(port)))

        # Login packet (type 3)
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

        # Command packet (type 2)
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
" 2>/dev/null)

        if [[ $? -eq 0 ]]; then
            if [[ -n "${result}" ]]; then
                info "RCON response: ${result}"
            fi
            ok "RCON command sent via python3"
            return 0
        else
            warn "Python3 RCON command failed"
            return 1
        fi
    fi

    warn "No RCON client available (install mcrcon or python3 for live server commands)"
    warn "File operations completed; run 'whitelist reload' on the server console manually"
    return 0
}

# ============================================================
# Argument parsing
# ============================================================

# Extract command first (first non-option argument)
args=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --whitelist)
            WHITELIST_PATH="${2:?'--whitelist requires a path argument'}"
            shift 2
            ;;
        --rcon-host)
            RCON_HOST="${2:?'--rcon-host requires a hostname argument'}"
            shift 2
            ;;
        --rcon-port)
            RCON_PORT="${2:?'--rcon-port requires a port argument'}"
            shift 2
            ;;
        --rcon-pass)
            RCON_PASS="${2:?'--rcon-pass requires a password argument'}"
            shift 2
            ;;
        --secrets)
            SECRETS_FILE="${2:?'--secrets requires a path argument'}"
            shift 2
            ;;
        --offline-uuid)
            OFFLINE_UUID=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            die "Unknown option: $1 (use --help for usage)"
            ;;
        *)
            args+=("$1")
            shift
            ;;
    esac
done

# Parse positional arguments
if [[ ${#args[@]} -eq 0 ]]; then
    error "No command specified"
    echo "" >&2
    usage
    exit 2
fi

COMMAND="${args[0]}"

case "${COMMAND}" in
    add)
        if [[ ${#args[@]} -lt 2 ]]; then
            die "Usage: ${SCRIPT_NAME} add <player_name> [uuid]"
        fi
        PLAYER_NAME="${args[1]}"
        if [[ ${#args[@]} -ge 3 ]]; then
            PLAYER_UUID="${args[2]}"
        fi
        ;;
    remove)
        if [[ ${#args[@]} -lt 2 ]]; then
            die "Usage: ${SCRIPT_NAME} remove <player_name>"
        fi
        PLAYER_NAME="${args[1]}"
        ;;
    list|sync)
        # No additional arguments needed
        ;;
    *)
        die "Unknown command: ${COMMAND} (use --help for available commands)"
        ;;
esac

# ============================================================
# Validate whitelist file
# ============================================================

# For list/remove/add, the whitelist file must exist (or be creatable for add)
if [[ "${COMMAND}" != "sync" ]]; then
    if [[ ! -f "${WHITELIST_PATH}" ]]; then
        if [[ "${COMMAND}" == "add" ]]; then
            # Create a new empty whitelist
            info "Whitelist file not found, creating: ${WHITELIST_PATH}"
            mkdir -p "$(dirname "${WHITELIST_PATH}")"
            echo "[]" > "${WHITELIST_PATH}"
            ok "Empty whitelist created"
        else
            die "Whitelist file not found: ${WHITELIST_PATH}"
        fi
    fi
fi

# ============================================================
# Execute command
# ============================================================

case "${COMMAND}" in

    # --- ADD ---
    add)
        info "Adding player: ${PLAYER_NAME}"

        # Check if player already exists
        if json_has_player "${WHITELIST_PATH}" "${PLAYER_NAME}"; then
            ok "Player '${PLAYER_NAME}' is already in the whitelist (skipping)"
            exit 0
        fi

        # Resolve UUID
        if [[ -n "${PLAYER_UUID}" ]]; then
            # UUID provided explicitly
            info "Using provided UUID: ${PLAYER_UUID}"
        elif [[ "${OFFLINE_UUID}" == true ]]; then
            # Generate offline-mode UUID
            PLAYER_UUID=$(generate_offline_uuid "${PLAYER_NAME}")
            info "Generated offline UUID: ${PLAYER_UUID}"
        else
            # Fetch from Mojang API
            if PLAYER_UUID=$(fetch_mojang_uuid "${PLAYER_NAME}"); then
                ok "Mojang UUID: ${PLAYER_UUID}"
            else
                error "Failed to fetch UUID from Mojang API for: ${PLAYER_NAME}"
                error "Player may not have a premium Minecraft account."
                error "Options:"
                error "  - Provide UUID explicitly: ${SCRIPT_NAME} add ${PLAYER_NAME} <uuid>"
                error "  - Use offline mode UUID:   ${SCRIPT_NAME} add ${PLAYER_NAME} --offline-uuid"
                die "UUID resolution failed"
            fi
        fi

        # Add to whitelist file
        json_add_player "${WHITELIST_PATH}" "${PLAYER_UUID}" "${PLAYER_NAME}"
        ok "Player '${PLAYER_NAME}' (${PLAYER_UUID}) added to whitelist"

        # Optionally send RCON command for live servers
        send_rcon_command "whitelist add ${PLAYER_NAME}" || true
        ;;

    # --- REMOVE ---
    remove)
        info "Removing player: ${PLAYER_NAME}"

        # Check if player exists
        if ! json_has_player "${WHITELIST_PATH}" "${PLAYER_NAME}"; then
            ok "Player '${PLAYER_NAME}' is not in the whitelist (skipping)"
            exit 0
        fi

        # Remove from whitelist file
        json_remove_player "${WHITELIST_PATH}" "${PLAYER_NAME}"
        ok "Player '${PLAYER_NAME}' removed from whitelist"

        # Optionally send RCON command for live servers
        send_rcon_command "whitelist remove ${PLAYER_NAME}" || true
        ;;

    # --- LIST ---
    list)
        count=$(json_count "${WHITELIST_PATH}")

        if [[ "${count}" -eq 0 ]]; then
            echo "" >&2
            echo "Whitelist is empty (0 players)" >&2
            echo "File: ${WHITELIST_PATH}" >&2
            echo "" >&2
            echo "Add players with: ${SCRIPT_NAME} add <player_name>" >&2
        else
            echo "" >&2
            echo "Minecraft Server Whitelist" >&2
            echo "File: ${WHITELIST_PATH}" >&2
            echo "" >&2
            printf "%-38s  %s\n" "UUID" "Name" >&2
            printf "%-38s  %s\n" "$(printf '%.0s-' {1..36})" "$(printf '%.0s-' {1..20})" >&2

            json_read_entries "${WHITELIST_PATH}" | while IFS='|' read -r uuid name; do
                printf "%-38s  %s\n" "${uuid}" "${name}" >&2
            done

            echo "" >&2
            echo "Total: ${count} player(s)" >&2
        fi
        echo "" >&2
        ;;

    # --- SYNC ---
    sync)
        info "Syncing whitelist to live server..."

        if [[ -z "${RCON_HOST}" ]]; then
            die "RCON host required for sync. Use --rcon-host HOST"
        fi

        if send_rcon_command "whitelist reload"; then
            ok "Whitelist reloaded on live server"
        else
            die "Failed to sync whitelist to live server"
        fi
        ;;
esac

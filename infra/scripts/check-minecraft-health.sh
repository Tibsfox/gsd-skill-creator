#!/usr/bin/env bash
# check-minecraft-health.sh -- Minecraft server health check
#
# Validates all components of a running Minecraft deployment:
#   1. systemd service status (active + enabled)
#   2. Java process verification (correct JAR, correct user)
#   3. JVM heap usage vs configured max
#   4. Network ports (game port + RCON)
#   5. Firewall rules (game port accessible)
#   6. Server log analysis (startup complete, no fatal errors)
#   7. Disk space on /opt/minecraft
#
# Can run locally on the Minecraft VM or remotely via SSH.
#
# Usage: check-minecraft-health.sh [OPTIONS]
#
# Exit codes:
#   0 -- All checks pass (healthy)
#   1 -- Any check failed (unhealthy)
#   2 -- Mixed results (warnings, no failures)
#   3 -- Usage error

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Defaults ---
TARGET_HOST=""
LOCAL_CHECK=true
JSON_OUTPUT=false
QUIET_MODE=false
GAME_PORT=25565
RCON_PORT=25575
JVM_FLAGS_PATH="/opt/minecraft/server/jvm-flags.conf"
MINECRAFT_HOME="/opt/minecraft"

# --- Colors (if terminal supports them) ---
if [[ -t 2 ]] && [[ "${QUIET_MODE}" != true ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' BOLD='' NC=''
fi

# --- Result tracking ---
declare -A CHECK_STATUS
declare -A CHECK_DETAIL
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

record_result() {
    local name="$1"
    local status="$2"
    local detail="$3"
    CHECK_STATUS["${name}"]="${status}"
    CHECK_DETAIL["${name}"]="${detail}"
    case "${status}" in
        pass) PASS_COUNT=$((PASS_COUNT + 1)) ;;
        warn) WARN_COUNT=$((WARN_COUNT + 1)) ;;
        fail) FAIL_COUNT=$((FAIL_COUNT + 1)) ;;
    esac
}

# --- Run a command on the target (local or remote) ---
target_cmd() {
    if [[ "${LOCAL_CHECK}" == true ]]; then
        eval "$@" 2>/dev/null
    else
        ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
            "${TARGET_HOST}" "$@" 2>/dev/null
    fi
}

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Minecraft server health check. Validates systemd service, Java process,
JVM heap, network ports, firewall rules, server logs, and disk space.

Options:
  --target-host HOST   SSH to remote host for checks (e.g., gsd@mc-server-01)
  --local              Run checks on localhost (default)
  --json               Output results as JSON
  --quiet              Exit code only, no output (for scripted use)
  --game-port PORT     Game port to check (default: 25565)
  --rcon-port PORT     RCON port to check (default: 25575)
  --help               Show this help message

Exit Codes:
  0  All checks pass (healthy)
  1  Any check failed (unhealthy)
  2  Warnings present but no failures
  3  Usage error

Health Checks:
  1. systemd service   - minecraft.service active + enabled
  2. Java process      - Running as minecraft user with correct JAR
  3. JVM heap          - Actual usage vs configured maximum
  4. Network ports     - Game (25565) and RCON (25575) listening
  5. Firewall          - Game port open in firewall
  6. Server log        - "Done" message, no FATAL/crash/OOM errors
  7. Disk space        - /opt/minecraft filesystem free space

Examples:
  # Local check (on Minecraft VM)
  ${SCRIPT_NAME} --local

  # Remote check via SSH
  ${SCRIPT_NAME} --target-host gsd@mc-server-01

  # JSON output for monitoring integration
  ${SCRIPT_NAME} --json --local

  # Scripted health check (exit code only)
  ${SCRIPT_NAME} --quiet --local
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target-host)
            if [[ "${LOCAL_CHECK}" != true ]] || [[ -n "${TARGET_HOST}" ]]; then
                : # already set, will check mutual exclusion below
            fi
            TARGET_HOST="${2:?'--target-host requires a host argument'}"
            LOCAL_CHECK=false
            shift 2
            ;;
        --local)
            LOCAL_CHECK=true
            shift
            ;;
        --json)
            JSON_OUTPUT=true
            shift
            ;;
        --quiet)
            QUIET_MODE=true
            shift
            ;;
        --game-port)
            GAME_PORT="${2:?'--game-port requires a port number'}"
            shift 2
            ;;
        --rcon-port)
            RCON_PORT="${2:?'--rcon-port requires a port number'}"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $1 (use --help for usage)" >&2
            exit 3
            ;;
    esac
done

# Validate mutual exclusivity
if [[ "${LOCAL_CHECK}" != true ]] && [[ -z "${TARGET_HOST}" ]]; then
    echo "Error: --target-host requires a host argument" >&2
    exit 3
fi

# Disable colors when quiet or JSON mode
if [[ "${QUIET_MODE}" == true ]] || [[ "${JSON_OUTPUT}" == true ]]; then
    RED='' GREEN='' YELLOW='' BLUE='' BOLD='' NC=''
fi

# ============================================================
# Check 1: systemd service status
# ============================================================
check_systemd() {
    local is_active is_enabled

    is_active=$(target_cmd "systemctl is-active minecraft.service" || true)
    is_active="${is_active:-unknown}"
    is_enabled=$(target_cmd "systemctl is-enabled minecraft.service" || true)
    is_enabled="${is_enabled:-unknown}"

    if [[ "${is_active}" == "active" ]] && [[ "${is_enabled}" == "enabled" ]]; then
        record_result "systemd" "pass" "active + enabled"
    elif [[ "${is_active}" == "active" ]] && [[ "${is_enabled}" != "enabled" ]]; then
        record_result "systemd" "warn" "active but not enabled (won't survive reboot)"
    else
        record_result "systemd" "fail" "${is_active} / ${is_enabled}"
    fi
}

# ============================================================
# Check 2: Process verification
# ============================================================
check_process() {
    local pid cmd_line

    pid=$(target_cmd "pgrep -u minecraft java" | head -1 || echo "")

    if [[ -z "${pid}" ]]; then
        record_result "process" "fail" "no Java process running as minecraft user"
        return
    fi

    cmd_line=$(target_cmd "cat /proc/${pid}/cmdline" | tr '\0' ' ' || echo "")

    if echo "${cmd_line}" | grep -qE "(fabric-server-launch\.jar|server\.jar)"; then
        record_result "process" "pass" "PID ${pid} ($(echo "${cmd_line}" | grep -oE '(fabric-server-launch\.jar|server\.jar)' | head -1))"
    else
        record_result "process" "fail" "PID ${pid} found but no matching JAR in command line"
    fi
}

# ============================================================
# Check 3: JVM heap usage
# ============================================================
check_jvm_heap() {
    local pid configured_max_mb actual_rss_kb actual_rss_mb usage_pct

    pid=$(target_cmd "pgrep -u minecraft java" | head -1 || echo "")

    if [[ -z "${pid}" ]]; then
        record_result "jvm_heap" "fail" "cannot determine (process not running)"
        return
    fi

    # Read configured max from jvm-flags.conf (parse -Xmx value)
    configured_max_mb=""
    if target_cmd "test -f '${JVM_FLAGS_PATH}'" 2>/dev/null; then
        local flags_content
        flags_content=$(target_cmd "cat '${JVM_FLAGS_PATH}'" || echo "")
        # Extract -Xmx value (e.g., -Xmx15872m -> 15872)
        configured_max_mb=$(echo "${flags_content}" | grep -oP '\-Xmx\K[0-9]+' | head -1 || echo "")
    fi

    if [[ -z "${configured_max_mb}" ]]; then
        configured_max_mb="unknown"
    fi

    # Get actual RSS from /proc
    actual_rss_kb=$(target_cmd "awk '/VmRSS/ {print \$2}' /proc/${pid}/status" || echo "")

    if [[ -z "${actual_rss_kb}" ]]; then
        # Try ps as fallback
        actual_rss_kb=$(target_cmd "ps -o rss= -p ${pid}" | tr -d ' ' || echo "")
    fi

    if [[ -z "${actual_rss_kb}" ]] || [[ "${actual_rss_kb}" == "0" ]]; then
        record_result "jvm_heap" "warn" "cannot read memory usage for PID ${pid}"
        return
    fi

    actual_rss_mb=$((actual_rss_kb / 1024))

    if [[ "${configured_max_mb}" != "unknown" ]] && [[ "${configured_max_mb}" -gt 0 ]]; then
        usage_pct=$((actual_rss_mb * 100 / configured_max_mb))
        local detail="${actual_rss_mb}MB / ${configured_max_mb}MB (${usage_pct}%)"

        if [[ ${usage_pct} -ge 90 ]]; then
            record_result "jvm_heap" "warn" "${detail} -- memory pressure"
        else
            record_result "jvm_heap" "pass" "${detail}"
        fi
    else
        record_result "jvm_heap" "pass" "${actual_rss_mb}MB RSS (configured max unknown)"
    fi
}

# ============================================================
# Check 4: Network ports
# ============================================================
check_network_ports() {
    local game_listening rcon_listening

    game_listening=$(target_cmd "ss -tlnp | grep ':${GAME_PORT} '" || echo "")
    rcon_listening=$(target_cmd "ss -tlnp | grep ':${RCON_PORT} '" || echo "")

    if [[ -n "${game_listening}" ]] && [[ -n "${rcon_listening}" ]]; then
        record_result "game_port" "pass" "${GAME_PORT}/tcp listening"
        record_result "rcon_port" "pass" "${RCON_PORT}/tcp listening"
    elif [[ -n "${game_listening}" ]] && [[ -z "${rcon_listening}" ]]; then
        record_result "game_port" "pass" "${GAME_PORT}/tcp listening"
        record_result "rcon_port" "warn" "${RCON_PORT}/tcp not listening (no remote management)"
    else
        record_result "game_port" "fail" "${GAME_PORT}/tcp not listening"
        if [[ -n "${rcon_listening}" ]]; then
            record_result "rcon_port" "pass" "${RCON_PORT}/tcp listening"
        else
            record_result "rcon_port" "fail" "${RCON_PORT}/tcp not listening"
        fi
    fi
}

# ============================================================
# Check 5: Firewall rules
# ============================================================
check_firewall() {
    local fw_result

    # Try firewall-cmd first (firewalld)
    if target_cmd "command -v firewall-cmd" &>/dev/null; then
        fw_result=$(target_cmd "firewall-cmd --query-port=${GAME_PORT}/tcp" || echo "no")
        if [[ "${fw_result}" == "yes" ]]; then
            record_result "firewall" "pass" "port ${GAME_PORT}/tcp open (firewalld)"
        else
            record_result "firewall" "fail" "port ${GAME_PORT}/tcp blocked (firewalld)"
        fi
        return
    fi

    # Try ufw
    if target_cmd "command -v ufw" &>/dev/null; then
        fw_result=$(target_cmd "ufw status | grep '${GAME_PORT}/tcp'" || echo "")
        if echo "${fw_result}" | grep -qi "allow"; then
            record_result "firewall" "pass" "port ${GAME_PORT}/tcp open (ufw)"
        elif [[ -z "${fw_result}" ]]; then
            record_result "firewall" "fail" "port ${GAME_PORT}/tcp not in ufw rules"
        else
            record_result "firewall" "fail" "port ${GAME_PORT}/tcp blocked (ufw)"
        fi
        return
    fi

    # No firewall tool found
    record_result "firewall" "warn" "cannot determine (no firewall-cmd or ufw available)"
}

# ============================================================
# Check 6: Server log analysis
# ============================================================
check_server_log() {
    local log_output has_done has_fatal

    log_output=$(target_cmd "journalctl -u minecraft.service --no-pager -n 100" || echo "")

    if [[ -z "${log_output}" ]]; then
        record_result "server_log" "fail" "no journal entries for minecraft.service"
        return
    fi

    has_done=$(echo "${log_output}" | grep -ci "Done" || echo "0")
    has_fatal=$(echo "${log_output}" | grep -ciE "(FATAL|crash|OutOfMemoryError)" || echo "0")

    if [[ "${has_done}" -gt 0 ]] && [[ "${has_fatal}" -eq 0 ]]; then
        record_result "server_log" "pass" "started, no errors"
    elif [[ "${has_done}" -gt 0 ]] && [[ "${has_fatal}" -gt 0 ]]; then
        record_result "server_log" "warn" "started but ${has_fatal} error(s) in recent logs"
    elif [[ "${has_done}" -eq 0 ]] && [[ "${has_fatal}" -gt 0 ]]; then
        record_result "server_log" "fail" "${has_fatal} error(s) found, server may not have started"
    else
        record_result "server_log" "fail" "no 'Done' message found (server may not have started)"
    fi
}

# ============================================================
# Check 7: Disk space
# ============================================================
check_disk_space() {
    local available_kb available_mb available_gb

    available_kb=$(target_cmd "df --output=avail '${MINECRAFT_HOME}' 2>/dev/null | tail -1 | tr -d ' '" || echo "")

    if [[ -z "${available_kb}" ]] || [[ "${available_kb}" == "0" ]]; then
        record_result "disk_space" "fail" "cannot determine free space on ${MINECRAFT_HOME}"
        return
    fi

    available_mb=$((available_kb / 1024))
    available_gb=$((available_mb / 1024))

    if [[ ${available_gb} -ge 5 ]]; then
        record_result "disk_space" "pass" "${available_gb}GB free on ${MINECRAFT_HOME}"
    elif [[ ${available_gb} -ge 1 ]]; then
        record_result "disk_space" "warn" "${available_gb}GB free on ${MINECRAFT_HOME} (low)"
    else
        record_result "disk_space" "fail" "${available_mb}MB free on ${MINECRAFT_HOME} (critical)"
    fi
}

# ============================================================
# Output formatting
# ============================================================

# Map check key to display name
display_name() {
    case "$1" in
        systemd)    echo "systemd service" ;;
        process)    echo "Java process" ;;
        jvm_heap)   echo "JVM heap" ;;
        game_port)  echo "Game port" ;;
        rcon_port)  echo "RCON port" ;;
        firewall)   echo "Firewall" ;;
        server_log) echo "Server log" ;;
        disk_space) echo "Disk space" ;;
        *)          echo "$1" ;;
    esac
}

output_human() {
    local total=$((PASS_COUNT + WARN_COUNT + FAIL_COUNT))
    local overall

    if [[ ${FAIL_COUNT} -gt 0 ]]; then
        overall="UNHEALTHY"
    elif [[ ${WARN_COUNT} -gt 0 ]]; then
        overall="DEGRADED"
    else
        overall="HEALTHY"
    fi

    echo ""
    echo "Minecraft Server Health Check"
    echo "========================================"
    echo ""

    # Ordered output
    local check_order=(systemd process jvm_heap game_port rcon_port firewall server_log disk_space)

    for key in "${check_order[@]}"; do
        if [[ -v "CHECK_STATUS[${key}]" ]]; then
            local status="${CHECK_STATUS[${key}]}"
            local detail="${CHECK_DETAIL[${key}]}"
            local label
            label=$(display_name "${key}")

            case "${status}" in
                pass) printf "  ${GREEN}[PASS]${NC} %s: %s\n" "${label}" "${detail}" ;;
                warn) printf "  ${YELLOW}[WARN]${NC} %s: %s\n" "${label}" "${detail}" ;;
                fail) printf "  ${RED}[FAIL]${NC} %s: %s\n" "${label}" "${detail}" ;;
            esac
        fi
    done

    echo ""
    echo "Overall: ${overall} (${PASS_COUNT}/${total} checks passed, ${WARN_COUNT} warnings, ${FAIL_COUNT} failures)"
}

output_json() {
    local total=$((PASS_COUNT + WARN_COUNT + FAIL_COUNT))
    local overall

    if [[ ${FAIL_COUNT} -gt 0 ]]; then
        overall="unhealthy"
    elif [[ ${WARN_COUNT} -gt 0 ]]; then
        overall="degraded"
    else
        overall="healthy"
    fi

    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Build JSON manually (no jq dependency)
    local checks_json=""
    local check_order=(systemd process jvm_heap game_port rcon_port firewall server_log disk_space)
    local first=true

    for key in "${check_order[@]}"; do
        if [[ -v "CHECK_STATUS[${key}]" ]]; then
            local status="${CHECK_STATUS[${key}]}"
            local detail="${CHECK_DETAIL[${key}]}"
            # Escape for JSON: double quotes and newlines
            detail="${detail//\"/\\\"}"
            detail="${detail//$'\n'/\\n}"
            detail="${detail//$'\r'/}"

            if [[ "${first}" != true ]]; then
                checks_json="${checks_json},"
            fi
            checks_json="${checks_json}
    \"${key}\": {\"status\": \"${status}\", \"detail\": \"${detail}\"}"
            first=false
        fi
    done

    cat <<JSONEOF
{
  "status": "${overall}",
  "checks": {${checks_json}
  },
  "summary": {
    "total": ${total},
    "passed": ${PASS_COUNT},
    "warnings": ${WARN_COUNT},
    "failures": ${FAIL_COUNT}
  },
  "timestamp": "${timestamp}"
}
JSONEOF
}

# ============================================================
# Main
# ============================================================

# Run all checks (each is independent, all run even if some fail)
check_systemd
check_process
check_jvm_heap
check_network_ports
check_firewall
check_server_log
check_disk_space

# Determine exit code
exit_code=0
if [[ ${FAIL_COUNT} -gt 0 ]]; then
    exit_code=1
elif [[ ${WARN_COUNT} -gt 0 ]]; then
    exit_code=2
fi

# Output results (unless quiet mode)
if [[ "${QUIET_MODE}" != true ]]; then
    if [[ "${JSON_OUTPUT}" == true ]]; then
        output_json
    else
        output_human
    fi
fi

exit ${exit_code}

#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2294 # variables used by sourced libs or in later phases
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
#   8. Node exporter (port 9100, metrics endpoint)
#   9. JMX exporter (port 9404, JVM metrics)
#  10. Backup freshness (last-backup-status.yaml age)
#  11. Metrics freshness (textfile collector staleness)
#  12. Known failure patterns (OOM, JAR missing, port binding, etc.)
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
BACKUP_DIR="/opt/minecraft/backups"
TEXTFILE_DIR="/var/lib/node_exporter/textfile_collector"

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
JVM heap, network ports, firewall rules, server logs, disk space,
exporters, backup freshness, metrics freshness, and known failure patterns.

Options:
  --target-host HOST    SSH to remote host for checks (e.g., gsd@mc-server-01)
  --local               Run checks on localhost (default)
  --json                Output results as JSON
  --quiet               Exit code only, no output (for scripted use)
  --game-port PORT      Game port to check (default: 25565)
  --rcon-port PORT      RCON port to check (default: 25575)
  --backup-dir PATH     Backup directory for freshness check (default: /opt/minecraft/backups)
  --textfile-dir PATH   Textfile collector directory for metrics freshness (default: /var/lib/node_exporter/textfile_collector)
  --help                Show this help message

Exit Codes:
  0  All checks pass (healthy)
  1  Any check failed (unhealthy)
  2  Warnings present but no failures
  3  Usage error

Health Checks:
  1. systemd service     - minecraft.service active + enabled
  2. Java process        - Running as minecraft user with correct JAR
  3. JVM heap            - Actual usage vs configured maximum
  4. Network ports       - Game (25565) and RCON (25575) listening
  5. Firewall            - Game port open in firewall
  6. Server log          - "Done" message, no FATAL/crash/OOM errors
  7. Disk space          - /opt/minecraft filesystem free space
  8. Node exporter       - Port 9100 listening, metrics endpoint responding
  9. JMX exporter        - Port 9404 listening, JVM metrics available
  10. Backup freshness   - Last backup age < 2 hours
  11. Metrics freshness  - Textfile collector updated within 120 seconds
  12. Known failures     - Pattern match against OOM, JAR missing, port binding, etc.

Examples:
  # Local check (on Minecraft VM)
  ${SCRIPT_NAME} --local

  # Remote check via SSH
  ${SCRIPT_NAME} --target-host gsd@mc-server-01

  # JSON output for monitoring integration
  ${SCRIPT_NAME} --json --local

  # Scripted health check (exit code only)
  ${SCRIPT_NAME} --quiet --local

  # Custom backup and textfile directories
  ${SCRIPT_NAME} --local --backup-dir /mnt/backups --textfile-dir /tmp/textfile
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
        --backup-dir)
            BACKUP_DIR="${2:?'--backup-dir requires a path'}"
            shift 2
            ;;
        --textfile-dir)
            TEXTFILE_DIR="${2:?'--textfile-dir requires a path'}"
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
# Check 8: Node exporter
# ============================================================
check_node_exporter() {
    local port_listening

    port_listening=$(target_cmd "ss -tlnp | grep ':9100 '" || echo "")

    if [[ -n "${port_listening}" ]]; then
        # Port is listening, try metrics endpoint
        local metrics_response
        metrics_response=$(target_cmd "curl -s --connect-timeout 2 http://localhost:9100/metrics | head -1" || echo "")

        if [[ -n "${metrics_response}" ]]; then
            record_result "node_exporter" "pass" "port 9100 listening, metrics endpoint responding"
        else
            record_result "node_exporter" "warn" "port 9100 listening but metrics endpoint not responding"
        fi
    else
        record_result "node_exporter" "fail" "port 9100 not listening (node_exporter not running)"
    fi
}

# ============================================================
# Check 9: JMX exporter
# ============================================================
check_jmx_exporter() {
    local port_listening

    port_listening=$(target_cmd "ss -tlnp | grep ':9404 '" || echo "")

    if [[ -n "${port_listening}" ]]; then
        # Port is listening, try JVM metrics
        local metrics_response
        metrics_response=$(target_cmd "curl -s --connect-timeout 2 http://localhost:9404/metrics | head -1" || echo "")

        if [[ -n "${metrics_response}" ]]; then
            record_result "jmx_exporter" "pass" "port 9404 listening, JVM metrics available"
        else
            record_result "jmx_exporter" "warn" "port 9404 listening but JVM metrics not responding"
        fi
    else
        record_result "jmx_exporter" "warn" "port 9404 not listening (JMX exporter not attached -- restart minecraft.service)"
    fi
}

# ============================================================
# Check 10: Backup freshness
# ============================================================
check_backup_freshness() {
    local status_file="${BACKUP_DIR}/last-backup-status.yaml"

    if [[ ! -f "${status_file}" ]]; then
        # Try target_cmd for remote checks
        if ! target_cmd "test -f '${status_file}'" 2>/dev/null; then
            record_result "backup_freshness" "fail" "no backup status file found (backups may not be configured)"
            return
        fi
    fi

    # Parse last_backup_time from YAML using sed (awk -F splits on colons
    # inside the timestamp value, so use sed to extract everything after
    # the first ': ' and strip quotes)
    local backup_time_str
    if [[ -f "${status_file}" ]]; then
        backup_time_str=$(sed -n 's/^last_backup_time:[[:space:]]*//p' "${status_file}" 2>/dev/null | tr -d '"' | tr -d "'" | tr -d ' ' || echo "")
    else
        backup_time_str=$(target_cmd "sed -n 's/^last_backup_time:[[:space:]]*//p' '${status_file}'" | tr -d '"' | tr -d "'" | tr -d ' ' || echo "")
    fi

    if [[ -z "${backup_time_str}" ]]; then
        record_result "backup_freshness" "fail" "cannot parse backup time from status file"
        return
    fi

    # Convert to epoch and compute age
    local backup_epoch now_epoch age_seconds
    backup_epoch=$(date -d "${backup_time_str}" +%s 2>/dev/null || echo "")
    now_epoch=$(date +%s)

    if [[ -z "${backup_epoch}" ]]; then
        record_result "backup_freshness" "fail" "cannot parse backup timestamp: ${backup_time_str}"
        return
    fi

    age_seconds=$(( now_epoch - backup_epoch ))

    # Parse backup filename for detail
    local backup_filename
    if [[ -f "${status_file}" ]]; then
        backup_filename=$(sed -n 's/^last_backup_file:[[:space:]]*//p' "${status_file}" 2>/dev/null | tr -d '"' | tr -d "'" | tr -d ' ' || echo "unknown")
    else
        backup_filename="unknown"
    fi

    # Format age for display
    local age_display
    if [[ ${age_seconds} -ge 3600 ]]; then
        age_display="$(( age_seconds / 3600 ))h $(( (age_seconds % 3600) / 60 ))m"
    elif [[ ${age_seconds} -ge 60 ]]; then
        age_display="$(( age_seconds / 60 ))m"
    else
        age_display="${age_seconds}s"
    fi

    if [[ ${age_seconds} -lt 7200 ]]; then
        record_result "backup_freshness" "pass" "last backup ${age_display} ago (${backup_filename})"
    else
        record_result "backup_freshness" "warn" "last backup ${age_display} ago (stale, threshold: 2h)"
    fi
}

# ============================================================
# Check 11: Metrics freshness
# ============================================================
check_metrics_freshness() {
    local metrics_file="${TEXTFILE_DIR}/minecraft.prom"

    if [[ ! -f "${metrics_file}" ]]; then
        # Try target_cmd for remote checks
        if ! target_cmd "test -f '${metrics_file}'" 2>/dev/null; then
            record_result "metrics_freshness" "fail" "no metrics file found (collector may not be configured)"
            return
        fi
    fi

    # Parse minecraft_metrics_update_time_seconds from the metrics file
    local update_time
    if [[ -f "${metrics_file}" ]]; then
        update_time=$(awk '/^minecraft_metrics_update_time_seconds / {print $2}' "${metrics_file}" 2>/dev/null || echo "")
    else
        update_time=$(target_cmd "awk '/^minecraft_metrics_update_time_seconds / {print \$2}' '${metrics_file}'" || echo "")
    fi

    if [[ -z "${update_time}" ]]; then
        record_result "metrics_freshness" "fail" "cannot parse update time from metrics file"
        return
    fi

    # Remove decimal part if present
    update_time="${update_time%%.*}"

    local now_epoch age_seconds
    now_epoch=$(date +%s)
    age_seconds=$(( now_epoch - update_time ))

    if [[ ${age_seconds} -lt 120 ]]; then
        record_result "metrics_freshness" "pass" "metrics updated ${age_seconds}s ago"
    else
        record_result "metrics_freshness" "warn" "metrics last updated ${age_seconds}s ago (stale, threshold: 120s)"
    fi
}

# ============================================================
# Check 12: Known failure patterns
# ============================================================
check_known_failures() {
    local log_output
    log_output=$(target_cmd "journalctl -u minecraft.service --no-pager -n 200" || echo "")

    if [[ -z "${log_output}" ]]; then
        record_result "known_failures" "warn" "no journal entries available for pattern matching"
        return
    fi

    local failures=()
    local warnings=()

    # Check for OOM
    if echo "${log_output}" | grep -qi "java.lang.OutOfMemoryError"; then
        failures+=("OOM error detected in recent logs")
    fi

    # Check for missing JAR
    if echo "${log_output}" | grep -qi "Unable to access jarfile"; then
        failures+=("server JAR not found")
    fi

    # Check for port binding failure
    if echo "${log_output}" | grep -qi "FAILED TO BIND TO PORT"; then
        failures+=("port binding failure (another process using port?)")
    fi

    # Check for mod version mismatch
    if echo "${log_output}" | grep -i "Mismatch" | grep -qi "mod\|fabric\|forge"; then
        warnings+=("possible mod version mismatch")
    fi

    # Check for stuck save-off (save-off without subsequent save-on)
    local last_save_off last_save_on
    last_save_off=$(echo "${log_output}" | grep -n "save-off" | tail -1 | cut -d: -f1 || echo "0")
    last_save_on=$(echo "${log_output}" | grep -n "save-on" | tail -1 | cut -d: -f1 || echo "0")
    if [[ "${last_save_off}" -gt 0 ]] && [[ "${last_save_off}" -gt "${last_save_on}" ]]; then
        warnings+=("server may be in save-off state (check backup script)")
    fi

    # Check for ConcurrentModificationException
    if echo "${log_output}" | grep -qi "ConcurrentModificationException"; then
        warnings+=("concurrent modification (possible chunk corruption)")
    fi

    # Build result
    if [[ ${#failures[@]} -gt 0 ]]; then
        local fail_detail=""
        for f in "${failures[@]}"; do
            fail_detail="${fail_detail}${f}; "
        done
        # Also include warnings if any
        for w in "${warnings[@]}"; do
            fail_detail="${fail_detail}[WARN] ${w}; "
        done
        record_result "known_failures" "fail" "${fail_detail}"
    elif [[ ${#warnings[@]} -gt 0 ]]; then
        local warn_detail=""
        for w in "${warnings[@]}"; do
            warn_detail="${warn_detail}${w}; "
        done
        record_result "known_failures" "warn" "${warn_detail}"
    else
        record_result "known_failures" "pass" "no known failure patterns in recent logs"
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
        server_log)       echo "Server log" ;;
        disk_space)       echo "Disk space" ;;
        node_exporter)    echo "Node exporter" ;;
        jmx_exporter)     echo "JMX exporter" ;;
        backup_freshness) echo "Backup freshness" ;;
        metrics_freshness) echo "Metrics freshness" ;;
        known_failures)   echo "Known failures" ;;
        *)                echo "$1" ;;
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
    local check_order=(systemd process jvm_heap game_port rcon_port firewall server_log disk_space node_exporter jmx_exporter backup_freshness metrics_freshness known_failures)

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
    local check_order=(systemd process jvm_heap game_port rcon_port firewall server_log disk_space node_exporter jmx_exporter backup_freshness metrics_freshness known_failures)
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
# Original checks (1-7)
check_systemd
check_process
check_jvm_heap
check_network_ports
check_firewall
check_server_log
check_disk_space

# Extended monitoring checks (8-12)
check_node_exporter
check_jmx_exporter
check_backup_freshness
check_metrics_freshness
check_known_failures

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

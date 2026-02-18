#!/usr/bin/env bash
# collect-minecraft-metrics.sh -- Custom Minecraft metrics collector
#
# Gathers six metric categories from the Minecraft server and outputs them
# in Prometheus exposition format, JSON, or human-readable tables.
#
# Metric categories:
#   1. TPS (ticks per second) -- via RCON
#   2. Player count (online/max) -- via RCON
#   3. World size (bytes) -- via filesystem
#   4. Chunk count (per dimension) -- via filesystem
#   5. Entity regions (approximate) -- via filesystem
#   6. Mod status (from mod-manifest.yaml) -- via filesystem
#
# Each category is independently resilient -- failure to collect one metric
# does not prevent collecting others.
#
# Supports textfile collector mode for piggybacking on node_exporter port 9100.
#
# Requirements satisfied:
#   OPS-05: Track TPS, player count, world size, chunk count, entity count, mod status
#
# Usage: collect-minecraft-metrics.sh [OPTIONS]
#
# Exit codes:
#   0 -- All metrics collected successfully
#   1 -- Partial (some metrics unavailable)
#   2 -- Usage error

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ---------------------------------------------------------------------------
# Source shared RCON library
# ---------------------------------------------------------------------------

# shellcheck source=lib/rcon-common.sh
source "${SCRIPT_DIR}/lib/rcon-common.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

TARGET_HOST=""
LOCAL_CHECK=true
RCON_HOST="localhost"
RCON_PORT="25575"
RCON_PASS=""
SECRETS_FILE=""
WORLD_DIR="/opt/minecraft/server/world"
MINECRAFT_HOME="/opt/minecraft"
OUTPUT_FORMAT="prometheus"
TEXTFILE_DIR=""
SERVER_LABEL="knowledge-world"
MOD_MANIFEST="${MINECRAFT_HOME}/server/mod-manifest.yaml"

# ---------------------------------------------------------------------------
# Colors (if stderr is a terminal)
# ---------------------------------------------------------------------------

if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# ---------------------------------------------------------------------------
# Logging (override rcon-common defaults)
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Custom Minecraft metrics collector. Gathers six metric categories and
outputs in Prometheus exposition format, JSON, or human-readable tables.

Metric Categories:
  1. TPS         Ticks per second (20.0 = optimal) -- via RCON
  2. Players     Online and max player count -- via RCON
  3. World size  Total world directory size in bytes -- via filesystem
  4. Chunks      Region file count per dimension -- via filesystem
  5. Entities    Entity region file count -- via filesystem
  6. Mods        Installed mod count and status -- via mod-manifest.yaml

Options:
  --target-host HOST     SSH to remote host for checks
  --local                Run locally on the Minecraft VM (default)
  --rcon-host HOST       RCON host (default: localhost)
  --rcon-port PORT       RCON port (default: 25575)
  --rcon-pass PASS       RCON password (explicit)
  --secrets PATH         Secrets file for RCON password
  --world-dir PATH       World directory (default: /opt/minecraft/server/world)
  --minecraft-home PATH  Minecraft home (default: /opt/minecraft)
  --output FORMAT        Output format: prometheus|json|human (default: prometheus)
  --textfile-dir PATH    Write prometheus output to textfile collector directory
  --help                 Show this help message

Exit Codes:
  0  All metrics collected successfully
  1  Partial (some metrics unavailable)
  2  Usage error

Examples:
  # Collect metrics in Prometheus format
  ${SCRIPT_NAME} --local --rcon-host localhost --secrets /path/to/secrets.yaml

  # Write to node_exporter textfile collector (for cron)
  ${SCRIPT_NAME} --textfile-dir /var/lib/node_exporter/textfile_collector/

  # JSON output for integration
  ${SCRIPT_NAME} --output json --local

  # Human-readable table
  ${SCRIPT_NAME} --output human --local
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target-host)
            TARGET_HOST="${2:?'--target-host requires a host argument'}"
            LOCAL_CHECK=false
            shift 2
            ;;
        --local)
            LOCAL_CHECK=true
            shift
            ;;
        --rcon-host)
            RCON_HOST="${2:?'--rcon-host requires a hostname'}"
            shift 2
            ;;
        --rcon-port)
            RCON_PORT="${2:?'--rcon-port requires a port'}"
            shift 2
            ;;
        --rcon-pass)
            RCON_PASS="${2:?'--rcon-pass requires a password'}"
            shift 2
            ;;
        --secrets)
            SECRETS_FILE="${2:?'--secrets requires a path'}"
            shift 2
            ;;
        --world-dir)
            WORLD_DIR="${2:?'--world-dir requires a path'}"
            shift 2
            ;;
        --minecraft-home)
            MINECRAFT_HOME="${2:?'--minecraft-home requires a path'}"
            MOD_MANIFEST="${MINECRAFT_HOME}/server/mod-manifest.yaml"
            shift 2
            ;;
        --output)
            OUTPUT_FORMAT="${2:?'--output requires prometheus|json|human'}"
            shift 2
            ;;
        --textfile-dir)
            TEXTFILE_DIR="${2:?'--textfile-dir requires a path'}"
            OUTPUT_FORMAT="prometheus"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information." >&2
            exit 2
            ;;
    esac
done

# Validate output format
case "${OUTPUT_FORMAT}" in
    prometheus|json|human) ;;
    *)
        error "Invalid output format: ${OUTPUT_FORMAT} (must be prometheus, json, or human)"
        exit 2
        ;;
esac

# ---------------------------------------------------------------------------
# Target command execution (local or remote)
# ---------------------------------------------------------------------------

target_cmd() {
    if [[ "${LOCAL_CHECK}" == true ]]; then
        eval "$@" 2>/dev/null
    else
        ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
            "${TARGET_HOST}" "$@" 2>/dev/null
    fi
}

# ---------------------------------------------------------------------------
# Resolve RCON password
# ---------------------------------------------------------------------------

if [[ -n "${SECRETS_FILE}" ]]; then
    resolve_rcon_password --secrets "${SECRETS_FILE}" || true
else
    resolve_rcon_password || true
fi

# ---------------------------------------------------------------------------
# Metric collection state
# ---------------------------------------------------------------------------

declare -A METRIC_SUCCESS
COLLECTION_TIME=$(date +%s)
TOTAL_CATEGORIES=6
SUCCESSFUL_CATEGORIES=0

# Prometheus output buffer
PROM_OUTPUT=""

add_prom() {
    PROM_OUTPUT+="$1"$'\n'
}

# JSON data holders
JSON_TPS="null"
JSON_PLAYERS_ONLINE="null"
JSON_PLAYERS_MAX="null"
JSON_WORLD_SIZE="null"
JSON_CHUNKS_OVERWORLD="null"
JSON_CHUNKS_NETHER="null"
JSON_CHUNKS_END="null"
JSON_ENTITY_REGIONS="null"
JSON_MODS_INSTALLED="null"
JSON_MODS=()

# Human output buffer
HUMAN_OUTPUT=""

# ============================================================
# Category 1: TPS (ticks per second)
# ============================================================

collect_tps() {
    info "Collecting TPS..."
    METRIC_SUCCESS["tps"]=0

    if ! rcon_available; then
        warn "RCON not available -- TPS metric unavailable"
        add_prom "# HELP minecraft_tps Server ticks per second (20.0 = optimal)"
        add_prom "# TYPE minecraft_tps gauge"
        add_prom "# minecraft_tps unavailable (RCON not configured)"
        add_prom "minecraft_metrics_collector_success{category=\"tps\"} 0"
        return
    fi

    local tps_output=""
    local tps_value=""

    # Try Spark mod first
    tps_output=$(send_rcon "spark tps" 2>/dev/null) || true
    if [[ -n "${tps_output}" ]] && echo "${tps_output}" | grep -qE '[0-9]+\.[0-9]+'; then
        tps_value=$(echo "${tps_output}" | grep -oE '[0-9]+\.[0-9]+' | head -1)
    fi

    # Try Forge tps
    if [[ -z "${tps_value}" ]]; then
        tps_output=$(send_rcon "forge tps" 2>/dev/null) || true
        if [[ -n "${tps_output}" ]] && echo "${tps_output}" | grep -qE '[0-9]+\.[0-9]+'; then
            tps_value=$(echo "${tps_output}" | grep -oE '[0-9]+\.[0-9]+' | head -1)
        fi
    fi

    # Try vanilla/plugin tps
    if [[ -z "${tps_value}" ]]; then
        tps_output=$(send_rcon "tps" 2>/dev/null) || true
        if [[ -n "${tps_output}" ]] && echo "${tps_output}" | grep -qE '[0-9]+\.[0-9]+'; then
            tps_value=$(echo "${tps_output}" | grep -oE '[0-9]+\.[0-9]+' | head -1)
        fi
    fi

    add_prom "# HELP minecraft_tps Server ticks per second (20.0 = optimal)"
    add_prom "# TYPE minecraft_tps gauge"

    if [[ -n "${tps_value}" ]]; then
        add_prom "minecraft_tps{server=\"${SERVER_LABEL}\"} ${tps_value}"
        add_prom "minecraft_metrics_collector_success{category=\"tps\"} 1"
        METRIC_SUCCESS["tps"]=1
        JSON_TPS="${tps_value}"
        ok "TPS: ${tps_value}"
    else
        add_prom "# minecraft_tps unavailable (RCON command failed)"
        add_prom "minecraft_metrics_collector_success{category=\"tps\"} 0"
        warn "TPS metric unavailable (RCON command failed)"
    fi
}

# ============================================================
# Category 2: Player count
# ============================================================

collect_players() {
    info "Collecting player count..."
    METRIC_SUCCESS["players"]=0

    if ! rcon_available; then
        warn "RCON not available -- player count unavailable"
        add_prom "# HELP minecraft_players_online Current online player count"
        add_prom "# TYPE minecraft_players_online gauge"
        add_prom "# HELP minecraft_players_max Maximum player slots"
        add_prom "# TYPE minecraft_players_max gauge"
        add_prom "minecraft_metrics_collector_success{category=\"players\"} 0"
        return
    fi

    local list_output=""
    list_output=$(send_rcon "list" 2>/dev/null) || true

    add_prom "# HELP minecraft_players_online Current online player count"
    add_prom "# TYPE minecraft_players_online gauge"
    add_prom "# HELP minecraft_players_max Maximum player slots"
    add_prom "# TYPE minecraft_players_max gauge"

    if [[ -n "${list_output}" ]]; then
        # Parse "There are N of a max of M players online"
        local online max
        online=$(echo "${list_output}" | grep -oP 'There are \K[0-9]+' || echo "")
        max=$(echo "${list_output}" | grep -oP 'max of \K[0-9]+' || echo "")

        if [[ -n "${online}" && -n "${max}" ]]; then
            add_prom "minecraft_players_online{server=\"${SERVER_LABEL}\"} ${online}"
            add_prom "minecraft_players_max{server=\"${SERVER_LABEL}\"} ${max}"
            add_prom "minecraft_metrics_collector_success{category=\"players\"} 1"
            METRIC_SUCCESS["players"]=1
            JSON_PLAYERS_ONLINE="${online}"
            JSON_PLAYERS_MAX="${max}"
            ok "Players: ${online}/${max}"
        else
            add_prom "minecraft_metrics_collector_success{category=\"players\"} 0"
            warn "Player count parse failed from: ${list_output}"
        fi
    else
        add_prom "minecraft_metrics_collector_success{category=\"players\"} 0"
        warn "Player count unavailable (RCON command failed)"
    fi
}

# ============================================================
# Category 3: World size
# ============================================================

collect_world_size() {
    info "Collecting world size..."
    METRIC_SUCCESS["world_size"]=0

    add_prom "# HELP minecraft_world_size_bytes Total world directory size in bytes"
    add_prom "# TYPE minecraft_world_size_bytes gauge"

    if [[ ! -d "${WORLD_DIR}" ]]; then
        add_prom "minecraft_world_size_bytes{server=\"${SERVER_LABEL}\"} 0"
        add_prom "minecraft_metrics_collector_success{category=\"world_size\"} 1"
        METRIC_SUCCESS["world_size"]=1
        JSON_WORLD_SIZE="0"
        warn "World directory not found: ${WORLD_DIR} -- reporting 0"
        return
    fi

    local size_bytes
    size_bytes=$(du -sb "${WORLD_DIR}" 2>/dev/null | cut -f1 || echo "0")

    add_prom "minecraft_world_size_bytes{server=\"${SERVER_LABEL}\"} ${size_bytes}"
    add_prom "minecraft_metrics_collector_success{category=\"world_size\"} 1"
    METRIC_SUCCESS["world_size"]=1
    JSON_WORLD_SIZE="${size_bytes}"

    local size_mb=$(( size_bytes / 1048576 ))
    ok "World size: ${size_mb}MB (${size_bytes} bytes)"
}

# ============================================================
# Category 4: Chunk count
# ============================================================

collect_chunks() {
    info "Collecting chunk count..."
    METRIC_SUCCESS["chunks"]=0

    add_prom "# HELP minecraft_chunks_total Total chunks per dimension (each .mca = 1024 chunks)"
    add_prom "# TYPE minecraft_chunks_total gauge"

    # Count .mca files in region directories
    count_mca_files() {
        local dir="$1"
        if [[ -d "${dir}" ]]; then
            find "${dir}" -maxdepth 1 -name "*.mca" -type f 2>/dev/null | wc -l
        else
            echo "0"
        fi
    }

    local overworld_files nether_files end_files
    overworld_files=$(count_mca_files "${WORLD_DIR}/region")
    nether_files=$(count_mca_files "${WORLD_DIR}/DIM-1/region")
    end_files=$(count_mca_files "${WORLD_DIR}/DIM1/region")

    local overworld_chunks=$(( overworld_files * 1024 ))
    local nether_chunks=$(( nether_files * 1024 ))
    local end_chunks=$(( end_files * 1024 ))

    add_prom "minecraft_chunks_total{server=\"${SERVER_LABEL}\",dimension=\"overworld\"} ${overworld_chunks}"
    add_prom "minecraft_chunks_total{server=\"${SERVER_LABEL}\",dimension=\"nether\"} ${nether_chunks}"
    add_prom "minecraft_chunks_total{server=\"${SERVER_LABEL}\",dimension=\"end\"} ${end_chunks}"
    add_prom "minecraft_metrics_collector_success{category=\"chunks\"} 1"

    METRIC_SUCCESS["chunks"]=1
    JSON_CHUNKS_OVERWORLD="${overworld_chunks}"
    JSON_CHUNKS_NETHER="${nether_chunks}"
    JSON_CHUNKS_END="${end_chunks}"

    ok "Chunks: overworld=${overworld_chunks} nether=${nether_chunks} end=${end_chunks}"
}

# ============================================================
# Category 5: Entity count (approximate)
# ============================================================

collect_entities() {
    info "Collecting entity regions..."
    METRIC_SUCCESS["entities"]=0

    add_prom "# HELP minecraft_entity_regions Entity region file count (1.17+ entity storage)"
    add_prom "# TYPE minecraft_entity_regions gauge"

    local entity_dir="${WORLD_DIR}/entities"
    local entity_count=0

    if [[ -d "${entity_dir}" ]]; then
        entity_count=$(find "${entity_dir}" -maxdepth 1 -name "*.mca" -type f 2>/dev/null | wc -l)
    else
        # Pre-1.17 entity storage: entities embedded in region files
        add_prom "# entities directory not found (pre-1.17 or no entities)"
    fi

    add_prom "minecraft_entity_regions{server=\"${SERVER_LABEL}\"} ${entity_count}"
    add_prom "minecraft_metrics_collector_success{category=\"entities\"} 1"

    METRIC_SUCCESS["entities"]=1
    JSON_ENTITY_REGIONS="${entity_count}"

    ok "Entity regions: ${entity_count}"
}

# ============================================================
# Category 6: Mod status
# ============================================================

collect_mods() {
    info "Collecting mod status..."
    METRIC_SUCCESS["mods"]=0

    add_prom "# HELP minecraft_mods_installed Number of installed mods"
    add_prom "# TYPE minecraft_mods_installed gauge"
    add_prom "# HELP minecraft_mod_present Mod presence indicator (1 = installed)"
    add_prom "# TYPE minecraft_mod_present gauge"

    if [[ ! -f "${MOD_MANIFEST}" ]]; then
        add_prom "minecraft_mods_installed{server=\"${SERVER_LABEL}\"} 0"
        add_prom "minecraft_metrics_collector_success{category=\"mods\"} 1"
        METRIC_SUCCESS["mods"]=1
        JSON_MODS_INSTALLED="0"
        warn "Mod manifest not found: ${MOD_MANIFEST} -- reporting 0 mods"
        return
    fi

    # Parse mod-manifest.yaml using awk (no external YAML dependency)
    # Expected format:
    # mods:
    #   - name: fabric-api
    #     version: 0.97.0
    #     file: fabric-api-0.97.0+1.21.4.jar
    local mod_count=0
    local current_name="" current_version=""

    while IFS= read -r line; do
        # Skip comments and empty lines
        [[ -z "${line}" ]] && continue
        [[ "${line}" =~ ^[[:space:]]*# ]] && continue

        # Parse name field
        if echo "${line}" | grep -qE '^[[:space:]]+-?[[:space:]]*name:'; then
            current_name=$(echo "${line}" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | tr -d "'")
        fi

        # Parse version field
        if echo "${line}" | grep -qE '^[[:space:]]+version:'; then
            current_version=$(echo "${line}" | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | tr -d "'")
        fi

        # When we have both name and version, emit metric
        if [[ -n "${current_name}" && -n "${current_version}" ]]; then
            add_prom "minecraft_mod_present{server=\"${SERVER_LABEL}\",mod=\"${current_name}\",version=\"${current_version}\"} 1"
            JSON_MODS+=("${current_name}:${current_version}")
            mod_count=$(( mod_count + 1 ))
            current_name=""
            current_version=""
        fi
    done < "${MOD_MANIFEST}"

    add_prom "minecraft_mods_installed{server=\"${SERVER_LABEL}\"} ${mod_count}"
    add_prom "minecraft_metrics_collector_success{category=\"mods\"} 1"

    METRIC_SUCCESS["mods"]=1
    JSON_MODS_INSTALLED="${mod_count}"

    ok "Mods: ${mod_count} installed"
}

# ============================================================
# Output: Prometheus exposition format
# ============================================================

output_prometheus() {
    # Add collection metadata
    local timestamp
    timestamp=$(date +%s)

    local header=""
    header+="# HELP minecraft_metrics_update_time_seconds Unix timestamp of last collection"$'\n'
    header+="# TYPE minecraft_metrics_update_time_seconds gauge"$'\n'
    header+="minecraft_metrics_update_time_seconds ${timestamp}"$'\n'
    header+="# HELP minecraft_metrics_collector_success Per-category collection success (1=ok, 0=failed)"$'\n'
    header+="# TYPE minecraft_metrics_collector_success gauge"$'\n'

    # Add backup timestamp metric placeholder
    local backup_status="${MINECRAFT_HOME}/../backups/last-backup-status.yaml"
    if [[ -f "${backup_status}" ]]; then
        local backup_time_str
        backup_time_str=$(grep -E '^last_backup_time:' "${backup_status}" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' || echo "")
        if [[ -n "${backup_time_str}" ]]; then
            local backup_epoch
            backup_epoch=$(date -d "${backup_time_str}" +%s 2>/dev/null || echo "")
            if [[ -n "${backup_epoch}" ]]; then
                header+="# HELP minecraft_last_backup_timestamp Unix timestamp of last successful backup"$'\n'
                header+="# TYPE minecraft_last_backup_timestamp gauge"$'\n'
                header+="minecraft_last_backup_timestamp{server=\"${SERVER_LABEL}\"} ${backup_epoch}"$'\n'
            fi
        fi
    fi
    # Also check standard backup directory
    local backup_status_alt="${MINECRAFT_HOME}/backups/last-backup-status.yaml"
    if [[ -f "${backup_status_alt}" ]] && [[ ! -f "${backup_status}" ]]; then
        local backup_time_str
        backup_time_str=$(grep -E '^last_backup_time:' "${backup_status_alt}" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' || echo "")
        if [[ -n "${backup_time_str}" ]]; then
            local backup_epoch
            backup_epoch=$(date -d "${backup_time_str}" +%s 2>/dev/null || echo "")
            if [[ -n "${backup_epoch}" ]]; then
                header+="# HELP minecraft_last_backup_timestamp Unix timestamp of last successful backup"$'\n'
                header+="# TYPE minecraft_last_backup_timestamp gauge"$'\n'
                header+="minecraft_last_backup_timestamp{server=\"${SERVER_LABEL}\"} ${backup_epoch}"$'\n'
            fi
        fi
    fi

    echo "${header}${PROM_OUTPUT}"
}

# ============================================================
# Output: JSON
# ============================================================

output_json() {
    local mods_json="[]"
    if [[ ${#JSON_MODS[@]} -gt 0 ]]; then
        mods_json="["
        local first=true
        for mod_entry in "${JSON_MODS[@]}"; do
            local name="${mod_entry%%:*}"
            local version="${mod_entry#*:}"
            if [[ "${first}" != true ]]; then
                mods_json+=","
            fi
            mods_json+="{\"name\":\"${name}\",\"version\":\"${version}\"}"
            first=false
        done
        mods_json+="]"
    fi

    cat <<JSONEOF
{
  "collection_time": ${COLLECTION_TIME},
  "server": "${SERVER_LABEL}",
  "tps": ${JSON_TPS},
  "players": {
    "online": ${JSON_PLAYERS_ONLINE},
    "max": ${JSON_PLAYERS_MAX}
  },
  "world_size": ${JSON_WORLD_SIZE},
  "chunks": {
    "overworld": ${JSON_CHUNKS_OVERWORLD},
    "nether": ${JSON_CHUNKS_NETHER},
    "end": ${JSON_CHUNKS_END}
  },
  "entity_regions": ${JSON_ENTITY_REGIONS},
  "mods": {
    "installed": ${JSON_MODS_INSTALLED},
    "list": ${mods_json}
  },
  "categories_successful": ${SUCCESSFUL_CATEGORIES},
  "categories_total": ${TOTAL_CATEGORIES}
}
JSONEOF
}

# ============================================================
# Output: Human-readable
# ============================================================

output_human() {
    echo ""
    echo "Minecraft Server Metrics"
    echo "========================================"
    echo ""
    printf "  %-20s %s\n" "Server:" "${SERVER_LABEL}"
    printf "  %-20s %s\n" "Collection time:" "$(date -d @${COLLECTION_TIME} '+%Y-%m-%d %H:%M:%S' 2>/dev/null || date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "  Category            Value                    Status"
    echo "  --------            -----                    ------"

    local status
    status=$([[ "${METRIC_SUCCESS[tps]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "TPS" "${JSON_TPS}" "${status}"

    status=$([[ "${METRIC_SUCCESS[players]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "Players" "${JSON_PLAYERS_ONLINE:-0}/${JSON_PLAYERS_MAX:-0}" "${status}"

    local size_display="${JSON_WORLD_SIZE:-0}"
    if [[ "${size_display}" != "null" ]] && [[ "${size_display}" -gt 0 ]] 2>/dev/null; then
        size_display="$(( size_display / 1048576 ))MB"
    fi
    status=$([[ "${METRIC_SUCCESS[world_size]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "World size" "${size_display}" "${status}"

    status=$([[ "${METRIC_SUCCESS[chunks]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "Chunks (overworld)" "${JSON_CHUNKS_OVERWORLD:-0}" "${status}"
    printf "  %-20s %-24s %s\n" "Chunks (nether)" "${JSON_CHUNKS_NETHER:-0}" ""
    printf "  %-20s %-24s %s\n" "Chunks (end)" "${JSON_CHUNKS_END:-0}" ""

    status=$([[ "${METRIC_SUCCESS[entities]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "Entity regions" "${JSON_ENTITY_REGIONS:-0}" "${status}"

    status=$([[ "${METRIC_SUCCESS[mods]:-0}" -eq 1 ]] && echo "OK" || echo "UNAVAILABLE")
    printf "  %-20s %-24s %s\n" "Mods installed" "${JSON_MODS_INSTALLED:-0}" "${status}"

    echo ""
    echo "  ${SUCCESSFUL_CATEGORIES}/${TOTAL_CATEGORIES} categories collected successfully"
    echo ""
}

# ============================================================
# Main
# ============================================================

# Collect all categories (each is independent)
collect_tps
collect_players
collect_world_size
collect_chunks
collect_entities
collect_mods

# Count successful categories
for cat_key in tps players world_size chunks entities mods; do
    if [[ "${METRIC_SUCCESS[${cat_key}]:-0}" -eq 1 ]]; then
        SUCCESSFUL_CATEGORIES=$(( SUCCESSFUL_CATEGORIES + 1 ))
    fi
done

# Output based on format
case "${OUTPUT_FORMAT}" in
    prometheus)
        local_output=$(output_prometheus)
        if [[ -n "${TEXTFILE_DIR}" ]]; then
            mkdir -p "${TEXTFILE_DIR}"
            echo "${local_output}" > "${TEXTFILE_DIR}/minecraft.prom"
            ok "Metrics written to ${TEXTFILE_DIR}/minecraft.prom"
        else
            echo "${local_output}"
        fi
        ;;
    json)
        output_json
        ;;
    human)
        output_human
        ;;
esac

# Exit code: 0 if all categories successful, 1 if partial
if [[ ${SUCCESSFUL_CATEGORIES} -eq ${TOTAL_CATEGORIES} ]]; then
    exit 0
else
    exit 1
fi

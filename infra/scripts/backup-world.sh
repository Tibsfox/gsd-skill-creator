#!/usr/bin/env bash
# shellcheck disable=SC2034 # variables used by sourced libs or in later phases
# backup-world.sh -- Automated Minecraft world backup with RCON quiesce
#
# Creates tar.gz archives of the Minecraft world directory with:
#   - RCON-based server quiesce (save-all, save-off / save-on)
#   - SHA-256 checksum sidecar for integrity verification
#   - Time-based rotation (24 hourly, 7 daily, 4 weekly)
#   - ERR/EXIT trap guaranteeing save-on is always restored
#   - Status YAML written after each backup for monitoring
#
# Requirements satisfied:
#   OPS-01: Server quiesce with sub-5-second interruption window
#   OPS-02: Rotation retains exactly 24/7/4 backups by type
#
# Usage: backup-world.sh [OPTIONS]
#
# Exit codes:
#   0 -- Backup completed successfully
#   1 -- Error (backup failed)
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

WORLD_DIR="/opt/minecraft/server/world"
BACKUP_DIR="/opt/minecraft/backups"
RCON_HOST="localhost"
RCON_PORT="25575"
RCON_PASS=""
SECRETS_FILE=""
RETENTION_HOURLY=24
RETENTION_DAILY=7
RETENTION_WEEKLY=4
BACKUP_TYPE="hourly"
DRY_RUN=false
NO_QUIESCE=false
QUIESCED=false

# ---------------------------------------------------------------------------
# Colors (if terminal supports them)
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
# Logging helpers (override rcon-common defaults for consistent formatting)
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

# ---------------------------------------------------------------------------
# Cleanup trap: ALWAYS send save-on if we issued save-off
# ---------------------------------------------------------------------------

cleanup() {
    if [[ "${QUIESCED}" == true ]]; then
        send_rcon "save-on" 2>/dev/null || true
        warn "Emergency save-on sent during cleanup"
        QUIESCED=false
    fi
}
trap cleanup EXIT

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Automated Minecraft world backup with RCON quiesce, tar archive,
SHA-256 checksum verification, and time-based rotation.

Options:
  --world-dir PATH          Minecraft world directory (default: /opt/minecraft/server/world)
  --backup-dir PATH         Backup destination directory (default: /opt/minecraft/backups)
  --rcon-host HOST          RCON host for quiesce commands (default: localhost)
  --rcon-port PORT          RCON port (default: 25575)
  --rcon-pass PASS          RCON password (explicit)
  --secrets PATH            Path to minecraft-secrets.yaml for RCON password
  --retention-hourly N      Hourly backups to keep (default: 24)
  --retention-daily N       Daily backups to keep (default: 7)
  --retention-weekly N      Weekly backups to keep (default: 4)
  --type hourly|daily|weekly  Backup type (default: hourly)
  --dry-run                 Show what would happen without executing
  --no-quiesce              Skip RCON save-off/save-on (for offline backups)
  --help                    Show this help message

Exit Codes:
  0  Backup completed successfully
  1  Error (backup failed)
  2  Usage error

Backup Procedure:
  1. Validate world directory
  2. Create backup subdirectory
  3. Quiesce server (save-all flush, save-off) via RCON
  4. Create tar.gz archive with SHA-256 checksum
  5. Resume server (save-on) via RCON
  6. Verify archive integrity
  7. Rotate old backups beyond retention limit
  8. Write status YAML for monitoring

Examples:
  # Hourly backup with RCON quiesce
  ${SCRIPT_NAME} --rcon-host localhost --secrets /opt/minecraft/secrets.yaml

  # Daily backup to custom directory
  ${SCRIPT_NAME} --type daily --backup-dir /mnt/backups --rcon-host localhost

  # Offline backup (server stopped)
  ${SCRIPT_NAME} --no-quiesce --world-dir /opt/minecraft/server/world

  # Dry run to see what would happen
  ${SCRIPT_NAME} --dry-run --type weekly
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --world-dir)
            WORLD_DIR="${2:?'--world-dir requires a path'}"
            shift 2
            ;;
        --backup-dir)
            BACKUP_DIR="${2:?'--backup-dir requires a path'}"
            shift 2
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
        --retention-hourly)
            RETENTION_HOURLY="${2:?'--retention-hourly requires a number'}"
            shift 2
            ;;
        --retention-daily)
            RETENTION_DAILY="${2:?'--retention-daily requires a number'}"
            shift 2
            ;;
        --retention-weekly)
            RETENTION_WEEKLY="${2:?'--retention-weekly requires a number'}"
            shift 2
            ;;
        --type)
            BACKUP_TYPE="${2:?'--type requires hourly|daily|weekly'}"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --no-quiesce)
            NO_QUIESCE=true
            shift
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

# ---------------------------------------------------------------------------
# Validate arguments
# ---------------------------------------------------------------------------

case "${BACKUP_TYPE}" in
    hourly|daily|weekly) ;;
    *)
        error "Invalid backup type: ${BACKUP_TYPE} (must be hourly, daily, or weekly)"
        exit 2
        ;;
esac

# ---------------------------------------------------------------------------
# Resolve RCON password for quiesce operations
# ---------------------------------------------------------------------------

if [[ "${NO_QUIESCE}" != true ]]; then
    local_rcon_args=()
    if [[ -n "${SECRETS_FILE}" ]]; then
        local_rcon_args+=(--secrets "${SECRETS_FILE}")
    fi
    resolve_rcon_password "${local_rcon_args[@]}" || true
fi

# ---------------------------------------------------------------------------
# Get retention limit for current type
# ---------------------------------------------------------------------------

get_retention_limit() {
    case "${BACKUP_TYPE}" in
        hourly)  echo "${RETENTION_HOURLY}" ;;
        daily)   echo "${RETENTION_DAILY}" ;;
        weekly)  echo "${RETENTION_WEEKLY}" ;;
    esac
}

# ---------------------------------------------------------------------------
# Step 1: Validate world directory
# ---------------------------------------------------------------------------

info "Validating world directory: ${WORLD_DIR}"

if [[ ! -d "${WORLD_DIR}" ]]; then
    die "World directory does not exist: ${WORLD_DIR}"
fi

# Check if world directory is non-empty
if [[ -z "$(ls -A "${WORLD_DIR}" 2>/dev/null)" ]]; then
    die "World directory is empty: ${WORLD_DIR}"
fi

ok "World directory validated"

# ---------------------------------------------------------------------------
# Step 2: Create backup subdirectory
# ---------------------------------------------------------------------------

BACKUP_SUBDIR="${BACKUP_DIR}/${BACKUP_TYPE}"

if [[ "${DRY_RUN}" == true ]]; then
    info "[DRY RUN] Would create directory: ${BACKUP_SUBDIR}"
else
    mkdir -p "${BACKUP_SUBDIR}"
    ok "Backup directory ready: ${BACKUP_SUBDIR}"
fi

# ---------------------------------------------------------------------------
# Step 3: Generate backup filename
# ---------------------------------------------------------------------------

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILENAME="minecraft-world-${BACKUP_TYPE}-${TIMESTAMP}.tar.gz"
BACKUP_PATH="${BACKUP_SUBDIR}/${BACKUP_FILENAME}"
CHECKSUM_PATH="${BACKUP_PATH}.sha256"

info "Backup target: ${BACKUP_PATH}"

if [[ "${DRY_RUN}" == true ]]; then
    info "[DRY RUN] Would create backup: ${BACKUP_FILENAME}"
    info "[DRY RUN] Would create checksum: ${BACKUP_FILENAME}.sha256"

    # Show rotation info
    retention_limit=$(get_retention_limit)
    if [[ -d "${BACKUP_SUBDIR}" ]]; then
        current_count=$(find "${BACKUP_SUBDIR}" -maxdepth 1 -name "minecraft-world-${BACKUP_TYPE}-*.tar.gz" -type f 2>/dev/null | wc -l)
        info "[DRY RUN] Current ${BACKUP_TYPE} backups: ${current_count}, retention limit: ${retention_limit}"
        if [[ ${current_count} -ge ${retention_limit} ]]; then
            excess=$(( current_count - retention_limit + 1 ))
            info "[DRY RUN] Would prune ${excess} oldest backup(s)"
        fi
    fi

    info "[DRY RUN] No files created."
    exit 0
fi

# ---------------------------------------------------------------------------
# Step 4: QUIESCE server (save-all flush, save-off)
# ---------------------------------------------------------------------------

QUIESCE_START=0
QUIESCE_END=0

if [[ "${NO_QUIESCE}" != true ]] && rcon_available; then
    info "Quiescing server for backup..."

    # Force save all chunks to disk
    send_rcon "save-all flush" || warn "save-all flush failed (continuing anyway)"

    # Wait for flush to complete
    sleep 2

    # Disable auto-save during archive creation
    if send_rcon "save-off"; then
        QUIESCED=true
        QUIESCE_START=$(date +%s)
        ok "Server quiesced (save-off)"
    else
        warn "save-off failed -- continuing without quiesce (data may be inconsistent)"
    fi
elif [[ "${NO_QUIESCE}" == true ]]; then
    info "Quiesce skipped (--no-quiesce)"
else
    warn "RCON not available -- backup will proceed without quiesce"
fi

# ---------------------------------------------------------------------------
# Step 5: ARCHIVE world directory
# ---------------------------------------------------------------------------

WORLD_DIR_PARENT="$(dirname "${WORLD_DIR}")"
WORLD_DIR_NAME="$(basename "${WORLD_DIR}")"

info "Creating archive: ${BACKUP_FILENAME}"

if ! tar czf "${BACKUP_PATH}" -C "${WORLD_DIR_PARENT}" "${WORLD_DIR_NAME}"; then
    die "Archive creation failed"
fi

ok "Archive created: $(du -h "${BACKUP_PATH}" | cut -f1)"

# Generate SHA-256 checksum
info "Generating SHA-256 checksum..."
(cd "${BACKUP_SUBDIR}" && sha256sum "${BACKUP_FILENAME}" > "${BACKUP_FILENAME}.sha256")
ok "Checksum created: ${CHECKSUM_PATH}"

# ---------------------------------------------------------------------------
# Step 6: RESUME server (save-on)
# ---------------------------------------------------------------------------

if [[ "${QUIESCED}" == true ]]; then
    if send_rcon "save-on"; then
        QUIESCED=false
        QUIESCE_END=$(date +%s)
        ok "Server resumed (save-on)"

        # Calculate and report interruption duration
        interruption=$(( QUIESCE_END - QUIESCE_START ))
        info "Server interruption: ${interruption}s"

        if [[ ${interruption} -gt 5 ]]; then
            warn "Server interruption exceeded 5s target: ${interruption}s"
        fi
    else
        warn "save-on failed -- server may still have saving disabled!"
        warn "Manually run: save-on via RCON or server console"
    fi
fi

# ---------------------------------------------------------------------------
# Step 7: VERIFY archive
# ---------------------------------------------------------------------------

info "Verifying backup integrity..."

# Verify backup file exists and is non-zero
if [[ ! -s "${BACKUP_PATH}" ]]; then
    die "Backup file is empty or missing: ${BACKUP_PATH}"
fi

# Verify checksum
if ! (cd "${BACKUP_SUBDIR}" && sha256sum -c "${BACKUP_FILENAME}.sha256" &>/dev/null); then
    die "Checksum verification failed for: ${BACKUP_PATH}"
fi

# Test archive integrity
if ! tar tzf "${BACKUP_PATH}" &>/dev/null; then
    die "Archive integrity check failed for: ${BACKUP_PATH}"
fi

ok "Backup verified: checksum OK, archive intact"

# ---------------------------------------------------------------------------
# Step 8: ROTATE old backups
# ---------------------------------------------------------------------------

RETENTION_LIMIT=$(get_retention_limit)

info "Checking rotation for ${BACKUP_TYPE} backups (retention: ${RETENTION_LIMIT})"

# List existing backups sorted by modification time (oldest first)
mapfile -t EXISTING_BACKUPS < <(
    find "${BACKUP_SUBDIR}" -maxdepth 1 -name "minecraft-world-${BACKUP_TYPE}-*.tar.gz" -type f \
        -printf '%T@ %p\n' 2>/dev/null \
    | sort -n \
    | cut -d' ' -f2-
)

BACKUP_COUNT=${#EXISTING_BACKUPS[@]}
info "Current ${BACKUP_TYPE} backup count: ${BACKUP_COUNT}"

PRUNED_COUNT=0
if [[ ${BACKUP_COUNT} -gt ${RETENTION_LIMIT} ]]; then
    excess=$(( BACKUP_COUNT - RETENTION_LIMIT ))
    info "Pruning ${excess} oldest ${BACKUP_TYPE} backup(s)..."

    for (( i=0; i<excess; i++ )); do
        old_backup="${EXISTING_BACKUPS[${i}]}"
        old_name="$(basename "${old_backup}")"

        # Remove backup and its checksum sidecar
        rm -f "${old_backup}" "${old_backup}.sha256"
        info "  Pruned: ${old_name}"
        PRUNED_COUNT=$(( PRUNED_COUNT + 1 ))
    done

    ok "Rotation complete: pruned ${PRUNED_COUNT} backup(s)"
else
    ok "No rotation needed (${BACKUP_COUNT} <= ${RETENTION_LIMIT})"
fi

# ---------------------------------------------------------------------------
# Step 9: STATUS file
# ---------------------------------------------------------------------------

STATUS_FILE="${BACKUP_DIR}/last-backup-status.yaml"
BACKUP_SIZE=$(stat -c %s "${BACKUP_PATH}" 2>/dev/null || echo "0")
BACKUP_CHECKSUM=$(cut -d' ' -f1 "${CHECKSUM_PATH}" 2>/dev/null || echo "unknown")
BACKUP_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Count remaining backups per type
count_backups() {
    local type="$1"
    local type_dir="${BACKUP_DIR}/${type}"
    if [[ -d "${type_dir}" ]]; then
        find "${type_dir}" -maxdepth 1 -name "minecraft-world-${type}-*.tar.gz" -type f 2>/dev/null | wc -l
    else
        echo "0"
    fi
}

HOURLY_COUNT=$(count_backups "hourly")
DAILY_COUNT=$(count_backups "daily")
WEEKLY_COUNT=$(count_backups "weekly")

# Calculate interruption seconds
INTERRUPTION_SECS=0
if [[ ${QUIESCE_START} -gt 0 && ${QUIESCE_END} -gt 0 ]]; then
    INTERRUPTION_SECS=$(( QUIESCE_END - QUIESCE_START ))
fi

cat > "${STATUS_FILE}" <<YAML
# Minecraft world backup status
# Updated: ${BACKUP_TIME}
last_backup_time: "${BACKUP_TIME}"
last_backup_type: "${BACKUP_TYPE}"
last_backup_size: ${BACKUP_SIZE}
last_backup_file: "${BACKUP_FILENAME}"
last_backup_checksum: "${BACKUP_CHECKSUM}"
last_backup_success: true
interruption_seconds: ${INTERRUPTION_SECS}
backups_retained:
  hourly: ${HOURLY_COUNT}
  daily: ${DAILY_COUNT}
  weekly: ${WEEKLY_COUNT}
YAML

ok "Status written to: ${STATUS_FILE}"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo "" >&2
info "=========================================="
info "  Backup Complete"
info "  Type: ${BACKUP_TYPE}"
info "  File: ${BACKUP_FILENAME}"
info "  Size: $(du -h "${BACKUP_PATH}" | cut -f1)"
info "  Checksum: ${BACKUP_CHECKSUM:0:16}..."
if [[ ${INTERRUPTION_SECS} -gt 0 ]]; then
    info "  Server interruption: ${INTERRUPTION_SECS}s"
fi
if [[ ${PRUNED_COUNT} -gt 0 ]]; then
    info "  Pruned: ${PRUNED_COUNT} old backup(s)"
fi
info "=========================================="

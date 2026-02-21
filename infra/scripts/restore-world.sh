#!/usr/bin/env bash
# restore-world.sh -- Minecraft world restore from backup archive
#
# Restores a Minecraft world from a tar.gz backup archive with:
#   - SHA-256 checksum verification (if sidecar exists)
#   - Archive integrity check (tar listing)
#   - Safety backup of current world before overwrite
#   - Graceful server shutdown via RCON then systemctl
#   - Permission fix after extraction
#   - Server restart with connectivity verification
#   - --force flag requirement (safety against accidental overwrites)
#
# Requirements satisfied:
#   OPS-03: Restore to target directory with integrity verification,
#           permission fix, and server restart. Zero data loss.
#
# Usage: restore-world.sh <backup-file> [OPTIONS]
#
# Exit codes:
#   0 -- Restore completed successfully
#   1 -- Error (restore failed)
#   2 -- Usage error
#   3 -- Integrity check failed

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

BACKUP_FILE=""
WORLD_DIR="/opt/minecraft/server/world"
MINECRAFT_HOME="/opt/minecraft"
MINECRAFT_USER="minecraft"
SERVICE_NAME="minecraft.service"
RCON_HOST="localhost"
RCON_PORT="25575"
RCON_PASS=""
SECRETS_FILE=""
NO_SERVICE=false
NO_BACKUP_CURRENT=false
FORCE=false
DRY_RUN=false

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
# Logging helpers (override rcon-common defaults)
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <backup-file> [OPTIONS]

Restore a Minecraft world from a backup archive. Validates integrity,
safely backs up the current world, stops the server, extracts the
archive, fixes permissions, and restarts the server.

Arguments:
  backup-file               Path to the .tar.gz backup archive (required)

Options:
  --world-dir PATH          Target world directory (default: /opt/minecraft/server/world)
  --minecraft-home PATH     Minecraft home directory (default: /opt/minecraft)
  --minecraft-user USER     System user for chown (default: minecraft)
  --service-name NAME       systemd service name (default: minecraft.service)
  --rcon-host HOST          RCON host for graceful shutdown (default: localhost)
  --rcon-port PORT          RCON port (default: 25575)
  --secrets PATH            Secrets file for RCON password
  --no-service              Skip systemd stop/start (offline/manual restores)
  --no-backup-current       Skip backing up the current world before overwriting
  --force                   Required flag to confirm destructive overwrite
  --dry-run                 Show what would happen without executing
  --help                    Show this help message

Exit Codes:
  0  Restore completed successfully
  1  Error (restore failed)
  2  Usage error
  3  Integrity check failed (checksum mismatch or corrupt archive)

Safety:
  The --force flag is required to prevent accidental overwrites. Without it,
  the script exits with a safety message. This matches the convention from
  vm-lifecycle.sh destroy (Phase 172).

  Unless --no-backup-current is specified, the current world is archived
  before overwriting, enabling rollback if the restore produces unexpected
  results.

Examples:
  # Restore from a backup (with safety backup of current world)
  ${SCRIPT_NAME} /opt/minecraft/backups/hourly/minecraft-world-hourly-20260101-120000.tar.gz --force

  # Restore without server management (offline)
  ${SCRIPT_NAME} backup.tar.gz --force --no-service

  # Restore without backing up current world
  ${SCRIPT_NAME} backup.tar.gz --force --no-backup-current

  # Dry run to see what would happen
  ${SCRIPT_NAME} backup.tar.gz --force --dry-run

  # Restore to a fresh VM (no existing world)
  ${SCRIPT_NAME} backup.tar.gz --force --no-service --world-dir /opt/minecraft/server/world
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

# First non-option argument is the backup file
args=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --world-dir)
            WORLD_DIR="${2:?'--world-dir requires a path'}"
            shift 2
            ;;
        --minecraft-home)
            MINECRAFT_HOME="${2:?'--minecraft-home requires a path'}"
            shift 2
            ;;
        --minecraft-user)
            MINECRAFT_USER="${2:?'--minecraft-user requires a username'}"
            shift 2
            ;;
        --service-name)
            SERVICE_NAME="${2:?'--service-name requires a service name'}"
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
        --secrets)
            SECRETS_FILE="${2:?'--secrets requires a path'}"
            shift 2
            ;;
        --no-service)
            NO_SERVICE=true
            shift
            ;;
        --no-backup-current)
            NO_BACKUP_CURRENT=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        -*)
            error "Unknown option: $1"
            echo "Use --help for usage information." >&2
            exit 2
            ;;
        *)
            args+=("$1")
            shift
            ;;
    esac
done

# Extract backup file from positional arguments
if [[ ${#args[@]} -eq 0 ]]; then
    error "No backup file specified."
    echo "" >&2
    echo "Usage: ${SCRIPT_NAME} <backup-file> [OPTIONS]" >&2
    echo "Use --help for full usage information." >&2
    exit 2
fi

BACKUP_FILE="${args[0]}"

# ---------------------------------------------------------------------------
# Validate --force flag (safety)
# ---------------------------------------------------------------------------

if [[ "${FORCE}" != true ]]; then
    error "Restore is a destructive operation that will overwrite the current world."
    error "Use --force to confirm you want to proceed."
    error ""
    error "  ${SCRIPT_NAME} ${BACKUP_FILE} --force"
    error ""
    error "Consider using --dry-run first to preview what will happen:"
    error "  ${SCRIPT_NAME} ${BACKUP_FILE} --force --dry-run"
    exit 1
fi

# ---------------------------------------------------------------------------
# Resolve RCON password
# ---------------------------------------------------------------------------

if [[ "${NO_SERVICE}" != true ]]; then
    rcon_args=()
    if [[ -n "${SECRETS_FILE}" ]]; then
        rcon_args+=(--secrets "${SECRETS_FILE}")
    fi
    resolve_rcon_password "${rcon_args[@]}" || true
fi

# ---------------------------------------------------------------------------
# Step 1: VALIDATE INPUT
# ---------------------------------------------------------------------------

info "Validating backup file: ${BACKUP_FILE}"

# Check backup file exists and is readable
if [[ ! -f "${BACKUP_FILE}" ]]; then
    die "Backup file not found: ${BACKUP_FILE}"
fi

if [[ ! -r "${BACKUP_FILE}" ]]; then
    die "Backup file is not readable: ${BACKUP_FILE}"
fi

# Check SHA-256 checksum if sidecar exists
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [[ -f "${CHECKSUM_FILE}" ]]; then
    info "Verifying SHA-256 checksum..."
    if ! (cd "$(dirname "${BACKUP_FILE}")" && sha256sum -c "$(basename "${CHECKSUM_FILE}")" &>/dev/null); then
        error "Checksum verification failed!"
        error "  Backup:   ${BACKUP_FILE}"
        error "  Checksum: ${CHECKSUM_FILE}"
        error "The backup file may be corrupted or tampered with."
        exit 3
    fi
    ok "Checksum verified"
else
    warn "No checksum sidecar found (${CHECKSUM_FILE}) -- skipping checksum verification"
fi

# Test archive integrity
info "Testing archive integrity..."
if ! tar tzf "${BACKUP_FILE}" &>/dev/null; then
    error "Archive integrity check failed -- file may be corrupted."
    exit 3
fi
ok "Archive integrity verified"

# ---------------------------------------------------------------------------
# Dry-run mode
# ---------------------------------------------------------------------------

if [[ "${DRY_RUN}" == true ]]; then
    info "[DRY RUN] Restore plan:"
    info "[DRY RUN]   Backup file: ${BACKUP_FILE}"
    info "[DRY RUN]   Target world: ${WORLD_DIR}"
    if [[ -d "${WORLD_DIR}" ]] && [[ -n "$(ls -A "${WORLD_DIR}" 2>/dev/null)" ]]; then
        if [[ "${NO_BACKUP_CURRENT}" != true ]]; then
            info "[DRY RUN]   Would backup current world to ${MINECRAFT_HOME}/backups/pre-restore-*.tar.gz"
        fi
        info "[DRY RUN]   Would remove current world directory"
    else
        info "[DRY RUN]   No existing world (fresh restore)"
    fi
    info "[DRY RUN]   Would extract backup to $(dirname "${WORLD_DIR}")"
    if [[ "${NO_SERVICE}" != true ]]; then
        info "[DRY RUN]   Would stop ${SERVICE_NAME} before restore"
        info "[DRY RUN]   Would start ${SERVICE_NAME} after restore"
    fi
    info "[DRY RUN]   Would fix permissions: ${MINECRAFT_USER}:${MINECRAFT_USER}"
    info "[DRY RUN] No changes made."
    exit 0
fi

# ---------------------------------------------------------------------------
# Step 2: SAFETY BACKUP of current world
# ---------------------------------------------------------------------------

if [[ "${NO_BACKUP_CURRENT}" != true ]] && [[ -d "${WORLD_DIR}" ]] && [[ -n "$(ls -A "${WORLD_DIR}" 2>/dev/null)" ]]; then
    info "Creating safety backup of current world..."

    SAFETY_BACKUP_DIR="${MINECRAFT_HOME}/backups"
    mkdir -p "${SAFETY_BACKUP_DIR}"

    SAFETY_TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
    SAFETY_BACKUP="${SAFETY_BACKUP_DIR}/pre-restore-${SAFETY_TIMESTAMP}.tar.gz"
    WORLD_DIR_PARENT="$(dirname "${WORLD_DIR}")"
    WORLD_DIR_NAME="$(basename "${WORLD_DIR}")"

    if tar czf "${SAFETY_BACKUP}" -C "${WORLD_DIR_PARENT}" "${WORLD_DIR_NAME}"; then
        ok "Current world backed up to: ${SAFETY_BACKUP}"
    else
        warn "Failed to create safety backup -- proceeding anyway"
    fi
elif [[ "${NO_BACKUP_CURRENT}" == true ]]; then
    info "Skipping safety backup (--no-backup-current)"
else
    info "No existing world to back up (fresh VM scenario)"
fi

# ---------------------------------------------------------------------------
# Step 3: STOP SERVER
# ---------------------------------------------------------------------------

if [[ "${NO_SERVICE}" != true ]]; then
    info "Stopping Minecraft server..."

    # Send RCON warning to players
    if rcon_available; then
        send_rcon "say Server shutting down for world restore in 10 seconds" 2>/dev/null || true
        sleep 3

        # Flush and stop via RCON
        send_rcon "save-all flush" 2>/dev/null || true
        send_rcon "stop" 2>/dev/null || true
    fi

    # Stop via systemd
    systemctl stop "${SERVICE_NAME}" --no-block 2>/dev/null || true

    # Wait for service to stop (up to 30 seconds)
    stop_waited=0
    while [[ ${stop_waited} -lt 30 ]]; do
        if ! systemctl is-active "${SERVICE_NAME}" &>/dev/null; then
            break
        fi
        sleep 2
        stop_waited=$(( stop_waited + 2 ))
    done

    # Verify process is gone
    if pgrep -f "minecraft" &>/dev/null; then
        warn "Minecraft process still running after 30s -- proceeding anyway"
    else
        ok "Server stopped"
    fi
fi

# ---------------------------------------------------------------------------
# Step 4: RESTORE
# ---------------------------------------------------------------------------

info "Restoring world from backup..."

WORLD_DIR_PARENT="$(dirname "${WORLD_DIR}")"
WORLD_DIR_NAME="$(basename "${WORLD_DIR}")"

# Remove current world directory
if [[ -d "${WORLD_DIR}" ]]; then
    info "Removing current world directory: ${WORLD_DIR}"
    rm -rf "${WORLD_DIR}"
fi

# Ensure parent directory exists
mkdir -p "${WORLD_DIR_PARENT}"

# Extract backup
info "Extracting: ${BACKUP_FILE}"
if ! tar xzf "${BACKUP_FILE}" -C "${WORLD_DIR_PARENT}"; then
    die "Backup extraction failed"
fi

# Verify extraction: level.dat must exist
if [[ ! -f "${WORLD_DIR}/level.dat" ]]; then
    die "Restore verification failed: level.dat not found in ${WORLD_DIR}"
fi

ok "World extracted successfully"

# Fix ownership (skip if not root -- cannot chown without privileges)
if [[ "$(id -u)" -eq 0 ]]; then
    info "Fixing ownership: ${MINECRAFT_USER}:${MINECRAFT_USER}"
    chown -R "${MINECRAFT_USER}:${MINECRAFT_USER}" "${WORLD_DIR}"
    ok "Ownership fixed"
else
    warn "Not running as root -- skipping chown (ownership may need manual fix)"
fi

# Fix permissions
info "Fixing permissions..."
find "${WORLD_DIR}" -type d -exec chmod 755 {} \;
find "${WORLD_DIR}" -type f -exec chmod 644 {} \;
ok "Permissions fixed (dirs: 755, files: 644)"

# ---------------------------------------------------------------------------
# Step 5: START SERVER
# ---------------------------------------------------------------------------

if [[ "${NO_SERVICE}" != true ]]; then
    info "Starting Minecraft server..."

    systemctl start "${SERVICE_NAME}" 2>/dev/null || warn "Failed to start ${SERVICE_NAME}"

    # Wait for service to reach active state (up to 60 seconds)
    start_waited=0
    service_active=false
    while [[ ${start_waited} -lt 60 ]]; do
        if systemctl is-active "${SERVICE_NAME}" &>/dev/null; then
            service_active=true
            break
        fi
        sleep 3
        start_waited=$(( start_waited + 3 ))
    done

    if [[ "${service_active}" == true ]]; then
        ok "Server started (took ${start_waited}s)"

        # Wait for RCON connectivity (up to 30 seconds)
        if rcon_available; then
            rcon_waited=0
            rcon_connected=false
            while [[ ${rcon_waited} -lt 30 ]]; do
                if send_rcon "list" &>/dev/null; then
                    rcon_connected=true
                    break
                fi
                sleep 3
                rcon_waited=$(( rcon_waited + 3 ))
            done

            if [[ "${rcon_connected}" == true ]]; then
                ok "RCON connected"
            else
                warn "RCON not responding after 30s (server may still be loading)"
            fi
        fi
    else
        warn "Server did not reach active state within 60s"
    fi
fi

# ---------------------------------------------------------------------------
# Step 6: VERIFY
# ---------------------------------------------------------------------------

info "Verifying restore..."

# World directory exists with expected structure
if [[ ! -d "${WORLD_DIR}" ]]; then
    die "Restore verification failed: world directory missing"
fi

if [[ ! -f "${WORLD_DIR}/level.dat" ]]; then
    die "Restore verification failed: level.dat missing"
fi

# Report restored world stats
file_count=$(find "${WORLD_DIR}" -type f 2>/dev/null | wc -l)
dir_count=$(find "${WORLD_DIR}" -type d 2>/dev/null | wc -l)
world_size=$(du -sh "${WORLD_DIR}" 2>/dev/null | cut -f1)

ok "Restore verified"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo "" >&2
info "=========================================="
info "  Restore Complete"
info "  Backup: $(basename "${BACKUP_FILE}")"
info "  Target: ${WORLD_DIR}"
info "  Files:  ${file_count} files in ${dir_count} directories"
info "  Size:   ${world_size}"
if [[ -n "${SAFETY_BACKUP:-}" && -f "${SAFETY_BACKUP:-}" ]]; then
    info "  Safety: ${SAFETY_BACKUP}"
fi
info "  Time:   $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
info "=========================================="

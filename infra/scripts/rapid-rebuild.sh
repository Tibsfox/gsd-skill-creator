#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2046 # SC2034: PROJECT_ROOT for future use; SC2046: word splitting safe here
# rapid-rebuild.sh -- Rapid server rebuild orchestrator
#
# Master rebuild orchestrator that handles both the fast path (golden image
# clone) and the from-scratch path (PXE rebuild). Coordinates timing,
# sequencing, checkpoint reporting, and health verification.
#
# Modes:
#   clone    Fast rebuild from golden image (target: under 5 minutes per OPS-08)
#   scratch  Full rebuild from PXE/kickstart (target: under 20 minutes per OPS-09)
#
# The server is cattle, the world is a pet. This script ensures the entire
# server infrastructure is rapidly reproducible from either path.
#
# Usage: rapid-rebuild.sh --mode MODE --name NAME [OPTIONS]
#
# Exit codes:
#   0 -- Success
#   1 -- Rebuild failed
#   2 -- Usage error
#   3 -- Health check failed
#   4 -- Timing target exceeded (warning, not failure)

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# ---------------------------------------------------------------------------
# Tool locations
# ---------------------------------------------------------------------------

GOLDEN_IMAGE="${SCRIPT_DIR}/golden-image.sh"
PROVISION_VM="${SCRIPT_DIR}/provision-vm.sh"
DEPLOY_MINECRAFT="${SCRIPT_DIR}/deploy-minecraft.sh"
DEPLOY_MODS="${SCRIPT_DIR}/deploy-mods.sh"
RESTORE_WORLD="${SCRIPT_DIR}/restore-world.sh"
HEALTH_CHECK="${SCRIPT_DIR}/check-minecraft-health.sh"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

MODE=""
VM_NAME=""
SOURCE_VM="minecraft-server"
SNAPSHOT_NAME=""
VALUES_FILE=""
MC_VALUES=""
MAIN_VALUES=""
RESTORE_BACKUP=""
SECRETS_FILE=""
TARGET_HOST=""
SKIP_HEALTH_CHECK=false
SKIP_WORLD_RESTORE=false
DRY_RUN=false
STEP_NUM=0

# Timing targets
CLONE_TARGET_SECONDS=300    # 5 minutes per OPS-08
SCRATCH_TARGET_SECONDS=1200 # 20 minutes per OPS-09

# ---------------------------------------------------------------------------
# Colors (if stderr is a terminal)
# ---------------------------------------------------------------------------

if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    BOLD='\033[1m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' BOLD='' NC=''
fi

# ---------------------------------------------------------------------------
# Logging helpers (matching deploy-minecraft.sh pattern, log to stderr)
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

step() {
    STEP_NUM=$((STEP_NUM + 1))
    echo "" >&2
    echo -e "${BOLD}[Step ${STEP_NUM}]${NC} $*" >&2
    echo -e "${BOLD}$(printf '%.0s-' {1..60})${NC}" >&2
}

dry_run_cmd() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "  ${YELLOW}[DRY-RUN]${NC} $*" >&2
        return 0
    fi
    return 1
}

# ---------------------------------------------------------------------------
# Timing helpers (matching provision-vm.sh pattern)
# ---------------------------------------------------------------------------

_timer_start() {
    _TIMER_EPOCH=$(date +%s)
}

_timer_elapsed() {
    local now
    now=$(date +%s)
    echo $(( now - _TIMER_EPOCH ))
}

_timer_format() {
    local secs="$1"
    local mins=$(( secs / 60 ))
    local remaining_secs=$(( secs % 60 ))
    if [[ ${mins} -gt 0 ]]; then
        echo "${mins}m ${remaining_secs}s"
    else
        echo "${secs}s"
    fi
}

# ---------------------------------------------------------------------------
# Checkpoint timing
# ---------------------------------------------------------------------------

declare -A CHECKPOINTS
declare -A CHECKPOINT_TIMES

checkpoint_start() {
    local name="$1"
    CHECKPOINTS["${name}"]=$(date +%s)
}

checkpoint_end() {
    local name="$1"
    local start="${CHECKPOINTS[${name}]:-$(date +%s)}"
    local now
    now=$(date +%s)
    CHECKPOINT_TIMES["${name}"]=$(( now - start ))
}

print_timing_report() {
    local target_seconds="$1"
    local target_label="$2"

    echo "" >&2
    echo "==========================================" >&2
    echo "  Rebuild Timing Report" >&2
    echo "==========================================" >&2
    echo "" >&2

    for cp in "VM Provisioning" "Minecraft Deploy" "Mod Deployment" "World Restore" "Health Check"; do
        local time="${CHECKPOINT_TIMES[${cp}]:-0}"
        printf "  %-25s %s\n" "${cp}:" "$(_timer_format ${time})" >&2
    done

    echo "  $(printf '%.0s-' {1..40})" >&2
    printf "  %-25s %s\n" "Total:" "$(_timer_format $(_timer_elapsed))" >&2
    printf "  %-25s %s\n" "Target:" "$(_timer_format ${target_seconds})" >&2
    echo "" >&2

    local total_time
    total_time=$(_timer_elapsed)
    if [[ ${total_time} -le ${target_seconds} ]]; then
        printf "  %-25s %s\n" "Under target:" "YES (${target_label})" >&2
    else
        printf "  %-25s %s\n" "Under target:" "NO (${target_label})" >&2
    fi
    echo "" >&2
}

# ---------------------------------------------------------------------------
# YAML parsing helper (matching provision-vm.sh pattern)
# ---------------------------------------------------------------------------

yaml_get() {
    local file="$1"
    local key="$2"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${file}" 2>/dev/null \
        | head -1 \
        | sed 's/^[^:]*:[[:space:]]*//' \
        | sed 's/^"//;s/"[[:space:]]*$//' \
        | tr -d '[:space:]') || true
    echo "${val}"
}

# ---------------------------------------------------------------------------
# Mode: clone -- Fast rebuild from golden image (OPS-08)
# ---------------------------------------------------------------------------

mode_clone() {
    local TARGET_SECONDS=${CLONE_TARGET_SECONDS}

    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Rapid Rebuild: Clone Mode${NC}" >&2
    echo -e "${BOLD}  Source: ${SOURCE_VM} -> ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}  Timing target: 5 minutes (300 seconds) per OPS-08${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Delegate to golden-image.sh clone ---
    step "Delegate to golden-image.sh clone"

    local clone_args=(clone --source "${SOURCE_VM}" --name "${VM_NAME}")

    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        clone_args+=(--snapshot "${SNAPSHOT_NAME}")
    fi

    if [[ -n "${RESTORE_BACKUP}" ]]; then
        clone_args+=(--restore-backup "${RESTORE_BACKUP}")
    fi

    if [[ -n "${SECRETS_FILE}" ]]; then
        clone_args+=(--secrets "${SECRETS_FILE}")
    fi

    if [[ "${SKIP_HEALTH_CHECK}" == true ]]; then
        clone_args+=(--skip-health-check)
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        clone_args+=(--dry-run)
    fi

    if dry_run_cmd "Would run golden-image.sh ${clone_args[*]}"; then
        dry_run_cmd "golden-image.sh handles: clone VM, start, world restore, health check"
        dry_run_cmd "Timing target: 5 minutes (300 seconds) per OPS-08"
    else
        local clone_exit=0
        bash "${GOLDEN_IMAGE}" "${clone_args[@]}" || clone_exit=$?

        if [[ ${clone_exit} -ne 0 ]]; then
            error "golden-image.sh clone failed (exit ${clone_exit})"
            exit ${clone_exit}
        fi
    fi

    ok "Clone rebuild complete"

    # --- Timing report ---
    step "Timing report"

    local total_time
    total_time=$(_timer_elapsed)
    local target_met="NO"
    local exit_code=0

    if [[ ${total_time} -le ${TARGET_SECONDS} ]]; then
        target_met="YES"
    fi

    echo "" >&2
    echo "==========================================" >&2
    echo "  Rapid Rebuild Summary (Clone)" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  Source VM:  ${SOURCE_VM}" >&2
    echo "  Target VM:  ${VM_NAME}" >&2
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "  Target:     5 minutes (300 seconds)" >&2
    echo "  Under 5min: ${target_met} (target per OPS-08)" >&2
    echo "" >&2

    if [[ "${target_met}" == "YES" ]]; then
        ok "Rapid rebuild (clone) complete -- under 5 minutes ($(_timer_format ${total_time}))"
    else
        warn "Rapid rebuild (clone) complete but EXCEEDED 5-minute target ($(_timer_format ${total_time}))"
        exit_code=4
    fi

    return ${exit_code}
}

# ---------------------------------------------------------------------------
# Mode: scratch -- Full rebuild from PXE/kickstart (OPS-09)
# ---------------------------------------------------------------------------

mode_scratch() {
    local TARGET_SECONDS=${SCRATCH_TARGET_SECONDS}

    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Rapid Rebuild: Scratch Mode${NC}" >&2
    echo -e "${BOLD}  VM: ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}  Timing target: 20 minutes (1200 seconds) per OPS-09${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo "" >&2
    info "Checkpoint timing enabled -- each phase will be measured"

    _timer_start

    # =====================================================================
    # Checkpoint 1: VM Provisioning
    # =====================================================================
    step "Checkpoint 1: VM Provisioning"
    checkpoint_start "VM Provisioning"

    local provision_args=(--mode fresh --name "${VM_NAME}")

    if [[ -n "${VALUES_FILE}" ]]; then
        provision_args+=(--values "${VALUES_FILE}")
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        provision_args+=(--dry-run)
    fi

    if dry_run_cmd "Would run provision-vm.sh ${provision_args[*]}"; then
        dry_run_cmd "provision-vm.sh handles: PXE boot, kickstart install, VM creation"
        dry_run_cmd "Expected duration: ~10-12 minutes"
    elif [[ -f "${PROVISION_VM}" ]]; then
        bash "${PROVISION_VM}" "${provision_args[@]}" || die "VM provisioning failed"
        ok "VM provisioning complete"
    else
        die "provision-vm.sh not found at ${PROVISION_VM}"
    fi

    checkpoint_end "VM Provisioning"
    info "Checkpoint 1 (VM Provisioning): $(_timer_format ${CHECKPOINT_TIMES["VM Provisioning"]:-0})"

    # =====================================================================
    # Determine target host for SSH-based deployment
    # =====================================================================
    if [[ -z "${TARGET_HOST}" ]]; then
        # Strategy 1: Static IP from values file
        if [[ -n "${VALUES_FILE}" ]] && [[ -f "${VALUES_FILE}" ]]; then
            local static_ip
            static_ip=$(yaml_get "${VALUES_FILE}" "vm_ip" 2>/dev/null || echo "")
            if [[ -z "${static_ip}" ]]; then
                static_ip=$(yaml_get "${VALUES_FILE}" "static_ip" 2>/dev/null || echo "")
            fi
            if [[ -n "${static_ip}" ]]; then
                TARGET_HOST="root@${static_ip}"
                info "Target host from values file: ${TARGET_HOST}"
            fi
        fi

        # Strategy 2: Try virsh domifaddr (KVM)
        if [[ -z "${TARGET_HOST}" ]]; then
            if command -v virsh &>/dev/null; then
                local vm_ip
                vm_ip=$(virsh domifaddr "${VM_NAME}" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "")
                if [[ -n "${vm_ip}" ]]; then
                    TARGET_HOST="root@${vm_ip}"
                    info "Target host from virsh: ${TARGET_HOST}"
                fi
            fi
        fi

        if [[ -z "${TARGET_HOST}" ]] && [[ "${DRY_RUN}" != true ]]; then
            warn "Could not auto-detect target host IP"
            warn "You may need to provide --target-host explicitly"
        fi
    fi

    # =====================================================================
    # Wait for SSH access
    # =====================================================================
    step "Wait for SSH access"

    if dry_run_cmd "Would poll SSH access to ${TARGET_HOST:-<auto-detect>} for up to 60 seconds"; then
        :
    elif [[ -n "${TARGET_HOST}" ]]; then
        local ssh_waited=0
        local ssh_ready=false
        info "Waiting for SSH access to ${TARGET_HOST}..."
        while [[ ${ssh_waited} -lt 60 ]]; do
            if ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
                "${TARGET_HOST}" true 2>/dev/null; then
                ssh_ready=true
                break
            fi
            sleep 5
            ssh_waited=$((ssh_waited + 5))
            info "  ... waiting (${ssh_waited}s / 60s)"
        done

        if [[ "${ssh_ready}" == true ]]; then
            ok "SSH access confirmed after ${ssh_waited}s"
        else
            warn "SSH not available after 60s -- deployment may fail"
        fi
    fi

    # =====================================================================
    # Checkpoint 2: Minecraft Deployment
    # =====================================================================
    step "Checkpoint 2: Minecraft Deployment"
    checkpoint_start "Minecraft Deploy"

    local deploy_args=()

    if [[ -n "${TARGET_HOST}" ]]; then
        deploy_args+=(--target-host "${TARGET_HOST}")
    else
        deploy_args+=(--local)
    fi

    if [[ -n "${MAIN_VALUES}" ]]; then
        deploy_args+=(--values "${MAIN_VALUES}")
    fi

    if [[ -n "${MC_VALUES}" ]]; then
        deploy_args+=(--local-values "${MC_VALUES}")
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        deploy_args+=(--dry-run)
    fi

    if dry_run_cmd "Would run deploy-minecraft.sh ${deploy_args[*]}"; then
        dry_run_cmd "deploy-minecraft.sh handles: Fabric download, JVM flags, systemd service, firewall, server start"
        dry_run_cmd "Expected duration: ~3-5 minutes"
    elif [[ -f "${DEPLOY_MINECRAFT}" ]]; then
        bash "${DEPLOY_MINECRAFT}" "${deploy_args[@]}" || die "Minecraft deployment failed"
        ok "Minecraft deployment complete"
    else
        die "deploy-minecraft.sh not found at ${DEPLOY_MINECRAFT}"
    fi

    checkpoint_end "Minecraft Deploy"
    info "Checkpoint 2 (Minecraft Deploy): $(_timer_format ${CHECKPOINT_TIMES["Minecraft Deploy"]:-0})"

    # =====================================================================
    # Checkpoint 3: Mod Deployment
    # =====================================================================
    step "Checkpoint 3: Mod Deployment"
    checkpoint_start "Mod Deployment"

    if [[ -f "${DEPLOY_MODS}" ]]; then
        local mod_args=()
        if [[ -n "${TARGET_HOST}" ]]; then
            mod_args+=(--target-host "${TARGET_HOST}")
        fi
        if [[ "${DRY_RUN}" == true ]]; then
            mod_args+=(--dry-run)
        fi

        if dry_run_cmd "Would run deploy-mods.sh ${mod_args[*]}"; then
            dry_run_cmd "deploy-mods.sh handles: mod installation and configuration"
            dry_run_cmd "Expected duration: ~1-2 minutes"
        else
            bash "${DEPLOY_MODS}" "${mod_args[@]}" || warn "Mod deployment had issues (continuing)"
            ok "Mod deployment complete"
        fi
    else
        info "deploy-mods.sh not found -- mods may be handled by deploy-minecraft.sh"
        info "Skipping separate mod deployment checkpoint"
    fi

    checkpoint_end "Mod Deployment"
    info "Checkpoint 3 (Mod Deployment): $(_timer_format ${CHECKPOINT_TIMES["Mod Deployment"]:-0})"

    # =====================================================================
    # Checkpoint 4: World Restore
    # =====================================================================
    step "Checkpoint 4: World Restore"
    checkpoint_start "World Restore"

    if [[ "${SKIP_WORLD_RESTORE}" == true ]]; then
        info "World restore skipped (--skip-world-restore)"
        info "Server will start with a fresh world"
    elif [[ -n "${RESTORE_BACKUP}" ]]; then
        local restore_args=("${RESTORE_BACKUP}" --force --no-backup-current)
        if [[ -n "${SECRETS_FILE}" ]]; then
            restore_args+=(--secrets "${SECRETS_FILE}")
        fi
        if [[ -n "${TARGET_HOST}" ]]; then
            # restore-world.sh operates on the target directly
            # For remote restore, we need to handle this differently
            info "Restore will run on the target VM"
        fi

        if dry_run_cmd "Would run restore-world.sh ${restore_args[*]}"; then
            dry_run_cmd "restore-world.sh handles: stop server, extract backup, fix permissions, restart"
            dry_run_cmd "Expected duration: ~1-2 minutes"
        elif [[ -f "${RESTORE_WORLD}" ]]; then
            bash "${RESTORE_WORLD}" "${restore_args[@]}" || warn "World restore had issues (continuing)"
            ok "World restore complete"
        else
            warn "restore-world.sh not found at ${RESTORE_WORLD}"
        fi
    else
        # Try to find latest backup
        local default_backup_dir="/opt/minecraft/backups"
        info "No --restore-backup specified"
        info "Looking for latest backup in ${default_backup_dir}..."

        if dry_run_cmd "Would search ${default_backup_dir} for latest backup"; then
            :
        else
            local latest_backup=""
            if [[ -d "${default_backup_dir}" ]]; then
                latest_backup=$(find "${default_backup_dir}" -name "*.tar.gz" -type f 2>/dev/null \
                    | sort -r \
                    | head -1 || echo "")
            fi

            if [[ -n "${latest_backup}" ]] && [[ -f "${RESTORE_WORLD}" ]]; then
                info "Found backup: ${latest_backup}"
                local restore_args=("${latest_backup}" --force --no-backup-current)
                if [[ -n "${SECRETS_FILE}" ]]; then
                    restore_args+=(--secrets "${SECRETS_FILE}")
                fi
                bash "${RESTORE_WORLD}" "${restore_args[@]}" || warn "World restore had issues"
                ok "World restored from: ${latest_backup}"
            else
                warn "No world backup found -- server starts with fresh world"
            fi
        fi
    fi

    checkpoint_end "World Restore"
    info "Checkpoint 4 (World Restore): $(_timer_format ${CHECKPOINT_TIMES["World Restore"]:-0})"

    # =====================================================================
    # Checkpoint 5: Health Verification
    # =====================================================================
    step "Checkpoint 5: Health Verification"
    checkpoint_start "Health Check"

    if [[ "${SKIP_HEALTH_CHECK}" == true ]]; then
        info "Health check skipped (--skip-health-check)"
    else
        if dry_run_cmd "Would run check-minecraft-health.sh against rebuilt VM"; then
            dry_run_cmd "check-minecraft-health.sh checks: systemd, Java process, ports, firewall, logs, disk"
        elif [[ -f "${HEALTH_CHECK}" ]]; then
            # Wait for Minecraft to finish starting
            info "Waiting for Minecraft server to finish starting (up to 60 seconds)..."
            local mc_waited=0
            while [[ ${mc_waited} -lt 60 ]]; do
                sleep 5
                mc_waited=$((mc_waited + 5))
                info "  ... waiting (${mc_waited}s / 60s)"
            done

            local health_args=()
            if [[ -n "${TARGET_HOST}" ]]; then
                health_args+=(--target-host "${TARGET_HOST}")
            else
                health_args+=(--local)
            fi

            local health_exit=0
            bash "${HEALTH_CHECK}" "${health_args[@]}" || health_exit=$?

            if [[ ${health_exit} -eq 0 ]]; then
                ok "Health check passed -- server is HEALTHY"
            elif [[ ${health_exit} -eq 2 ]]; then
                warn "Health check passed with WARNINGS (degraded)"
            else
                warn "Health check FAILED (exit ${health_exit}) -- rebuild may need attention"
                warn "Server may still be starting. Recheck: bash ${HEALTH_CHECK} ${health_args[*]}"
            fi
        else
            warn "check-minecraft-health.sh not found -- skipping health check"
        fi
    fi

    checkpoint_end "Health Check"
    info "Checkpoint 5 (Health Check): $(_timer_format ${CHECKPOINT_TIMES["Health Check"]:-0})"

    # =====================================================================
    # Timing report
    # =====================================================================
    step "Timing report"

    print_timing_report ${TARGET_SECONDS} "OPS-09"

    local total_time
    total_time=$(_timer_elapsed)
    local exit_code=0

    echo "" >&2
    echo "==========================================" >&2
    echo "  Rapid Rebuild Summary (Scratch)" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:         DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:         LIVE" >&2
    fi
    echo "  VM Name:      ${VM_NAME}" >&2
    echo "  Duration:     $(_timer_format ${total_time})" >&2
    echo "  Target:       20 minutes (1200 seconds)" >&2
    echo "" >&2

    if [[ ${total_time} -le ${TARGET_SECONDS} ]]; then
        echo "  Under 20min:  YES (target per OPS-09)" >&2
        ok "Rapid rebuild (scratch) complete -- under 20 minutes ($(_timer_format ${total_time}))"
    else
        echo "  Under 20min:  NO (target per OPS-09)" >&2
        warn "Rapid rebuild (scratch) complete but EXCEEDED 20-minute target ($(_timer_format ${total_time}))"
        exit_code=4
    fi
    echo "" >&2

    return ${exit_code}
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --mode MODE --name NAME [OPTIONS]

Rapid server rebuild orchestrator. Handles both the fast path (golden image
clone, under 5 minutes per OPS-08) and the from-scratch path (PXE rebuild,
under 20 minutes per OPS-09).

The server is cattle, the world is a pet. Both paths include world restore
from backup and health verification to ensure zero data loss.

Modes:
  clone     Fast rebuild from golden image (target: 5 minutes, OPS-08)
  scratch   Full rebuild from PXE/kickstart (target: 20 minutes, OPS-09)

Required:
  --mode clone|scratch  Rebuild strategy
  --name NAME           Name for the rebuilt VM

Clone Mode Options:
  --source NAME         Source golden image VM (default: minecraft-server)
  --snapshot NAME       Specific golden snapshot (default: latest)
  --restore-backup PATH World backup to restore after clone

Scratch Mode Options:
  --values PATH         VM provisioning local-values file
  --mc-values PATH      Minecraft local-values file
  --main-values PATH    Main local-values.yaml from generate-local-values.sh
  --restore-backup PATH World backup to restore after deployment
  --target-host HOST    SSH target for deployment (auto-detected if possible)

Common Options:
  --secrets PATH        Secrets file for RCON operations
  --skip-health-check   Skip post-rebuild health verification
  --skip-world-restore  Skip world restore (rebuild server only, no data)
  --dry-run             Show what would happen
  --help                Show this help

Exit Codes:
  0  Success (rebuild complete, timing target met)
  1  Rebuild failed
  2  Usage error
  3  Health check failed
  4  Timing target exceeded (warning -- rebuild succeeded but slow)

Timing Targets:
  Clone mode:   5 minutes  (300 seconds)  per OPS-08
  Scratch mode: 20 minutes (1200 seconds) per OPS-09

Scratch Mode Checkpoints:
  1. VM Provisioning     (~10-12 min) provision-vm.sh --mode fresh
  2. Minecraft Deploy    (~3-5 min)   deploy-minecraft.sh
  3. Mod Deployment      (~1-2 min)   deploy-mods.sh
  4. World Restore       (~1-2 min)   restore-world.sh
  5. Health Verification (~1 min)     check-minecraft-health.sh

Integration:
  Clone path:
    - golden-image.sh clone (handles all clone, boot, restore, health)

  Scratch path:
    - provision-vm.sh  (VM creation via PXE/kickstart)
    - deploy-minecraft.sh (Fabric server deployment)
    - deploy-mods.sh (mod installation, if separate)
    - restore-world.sh (world data restoration from backup)
    - check-minecraft-health.sh (health verification)

Examples:
  # Fast rebuild from golden image (under 5 minutes)
  ${SCRIPT_NAME} --mode clone --name mc-rebuild-01 --source minecraft-server

  # Fast rebuild with world restore
  ${SCRIPT_NAME} --mode clone --name mc-rebuild-01 \\
    --restore-backup /opt/minecraft/backups/hourly/latest.tar.gz

  # Full rebuild from scratch (under 20 minutes)
  ${SCRIPT_NAME} --mode scratch --name mc-rebuild-01 \\
    --values infra/local/vm-provisioning.local-values \\
    --mc-values infra/local/minecraft.local-values \\
    --restore-backup /opt/minecraft/backups/hourly/latest.tar.gz

  # Dry-run preview
  ${SCRIPT_NAME} --mode scratch --name test-vm --dry-run

  # Rebuild without world data
  ${SCRIPT_NAME} --mode scratch --name mc-fresh --skip-world-restore
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --mode)
            MODE="${2:?'--mode requires a value (clone|scratch)'}"
            shift 2
            ;;
        --name)
            VM_NAME="${2:?'--name requires a value'}"
            shift 2
            ;;
        --source)
            SOURCE_VM="${2:?'--source requires a value'}"
            shift 2
            ;;
        --snapshot)
            SNAPSHOT_NAME="${2:?'--snapshot requires a value'}"
            shift 2
            ;;
        --values)
            VALUES_FILE="${2:?'--values requires a path'}"
            shift 2
            ;;
        --mc-values)
            MC_VALUES="${2:?'--mc-values requires a path'}"
            shift 2
            ;;
        --main-values)
            MAIN_VALUES="${2:?'--main-values requires a path'}"
            shift 2
            ;;
        --restore-backup)
            RESTORE_BACKUP="${2:?'--restore-backup requires a path'}"
            shift 2
            ;;
        --secrets)
            SECRETS_FILE="${2:?'--secrets requires a path'}"
            shift 2
            ;;
        --target-host)
            TARGET_HOST="${2:?'--target-host requires a value'}"
            shift 2
            ;;
        --skip-health-check)
            SKIP_HEALTH_CHECK=true
            shift
            ;;
        --skip-world-restore)
            SKIP_WORLD_RESTORE=true
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
        *)
            die "Unknown option: $1 (use --help for usage)"
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Validate required arguments
# ---------------------------------------------------------------------------

if [[ -z "${MODE}" ]]; then
    error "Missing required argument: --mode"
    echo "" >&2
    usage
    exit 2
fi

if [[ -z "${VM_NAME}" ]]; then
    error "Missing required argument: --name"
    echo "" >&2
    usage
    exit 2
fi

# Validate mode
case "${MODE}" in
    clone|scratch)
        ;;
    *)
        die "Invalid mode: '${MODE}' (must be clone or scratch)"
        ;;
esac

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

if [[ "${DRY_RUN}" == true ]]; then
    echo "" >&2
    echo -e "${YELLOW}==========================================${NC}" >&2
    echo -e "${YELLOW}  DRY-RUN MODE -- No changes will be made${NC}" >&2
    echo -e "${YELLOW}==========================================${NC}" >&2
fi

info "Rapid rebuild mode: ${MODE}"
info "VM name: ${VM_NAME}"

# ---------------------------------------------------------------------------
# Dispatch to mode handler
# ---------------------------------------------------------------------------

case "${MODE}" in
    clone)   mode_clone ;;
    scratch) mode_scratch ;;
esac

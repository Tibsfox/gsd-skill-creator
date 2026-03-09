#!/usr/bin/env bash
# shellcheck disable=SC2034,SC2155 # variables used by sourced libs or in later phases
# provision-vm.sh -- Master VM provisioning orchestrator
#
# Orchestrates the complete VM provisioning workflow following the
# deploy-pxe.sh pattern (numbered steps, dry-run, validation-before-action).
#
# Modes:
#   fresh    -- Full provisioning from scratch via PXE/kickstart
#   golden   -- Create golden image from a provisioned VM
#   clone    -- Clone from golden image (the <5 minute path)
#   destroy  -- Clean teardown of a VM
#
# Part of the infrastructure-level provisioning pipeline (Phase 172).
# Calls vm-lifecycle.sh for all VM operations (never calls backends directly).
#
# Usage: provision-vm.sh --mode MODE --name NAME [options]
#
# Exit codes:
#   0 -- Success
#   1 -- Prerequisite or validation failure
#   2 -- Provisioning step failure

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

VM_LIFECYCLE="${SCRIPT_DIR}/vm-lifecycle.sh"
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"

# ---------------------------------------------------------------------------
# Default values
# ---------------------------------------------------------------------------

MODE=""
VM_NAME=""
SOURCE_VM=""
SNAPSHOT_NAME=""
VALUES_FILE=""
DRY_RUN=false
FRESH_TIMEOUT=900     # 15 minutes for fresh install
CLONE_BOOT_TIMEOUT=120 # 2 minutes for clone boot
STEP_NUM=0

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
# Logging helpers (matching deploy-pxe.sh pattern, log to stderr)
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 2; }

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
# YAML parsing helper (same pattern as calculate-budget.sh)
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

# Section-aware YAML extraction for nested keys
yaml_section_get() {
    local file="$1"
    local section="$2"
    local key="$3"
    awk -v sec="${section}" -v k="${key}" '
        $0 ~ "^"sec":" { in_section=1; next }
        /^[a-z]/ && !/^[[:space:]]/ { in_section=0 }
        in_section && $0 ~ k":" {
            gsub(/.*:[[:space:]]*/, "")
            gsub(/[[:space:]]*#.*/, "")
            gsub(/^"/, ""); gsub(/"$/, "")
            print; exit
        }
    ' "${file}"
}

# ---------------------------------------------------------------------------
# Timing helpers
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
# vm-lifecycle.sh wrapper
# ---------------------------------------------------------------------------

# Call vm-lifecycle.sh with proper flags
lifecycle() {
    local args=("$@")
    if [[ "${DRY_RUN}" == true ]]; then
        args+=(--dry-run)
    fi
    bash "${VM_LIFECYCLE}" "${args[@]}"
}

# ---------------------------------------------------------------------------
# Mode: fresh -- Full provisioning from scratch via PXE/kickstart
# ---------------------------------------------------------------------------

mode_fresh() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  VM Provisioning: Fresh Install${NC}" >&2
    echo -e "${BOLD}  VM: ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Validate prerequisites ---
    step "Validate prerequisites"

    local prereq_ok=true

    if [[ ! -f "${VM_LIFECYCLE}" ]]; then
        error "vm-lifecycle.sh not found: ${VM_LIFECYCLE}"
        prereq_ok=false
    else
        ok "vm-lifecycle.sh found"
    fi

    # Check for resource-budget.yaml
    local budget_file="${PROJECT_ROOT}/infra/local/resource-budget.yaml"
    if [[ -f "${budget_file}" ]]; then
        ok "resource-budget.yaml found: ${budget_file}"
    else
        warn "resource-budget.yaml not found at: ${budget_file}"
        warn "VM sizing will use values from --values file or defaults"
    fi

    # Check for values file
    if [[ -n "${VALUES_FILE}" ]]; then
        if [[ -f "${VALUES_FILE}" ]]; then
            ok "Values file found: ${VALUES_FILE}"
        else
            error "Values file not found: ${VALUES_FILE}"
            prereq_ok=false
        fi
    else
        local default_values="${PROJECT_ROOT}/infra/local/vm-provisioning.local-values"
        if [[ -f "${default_values}" ]]; then
            VALUES_FILE="${default_values}"
            ok "Using default values file: ${VALUES_FILE}"
        else
            warn "No values file specified and default not found at: ${default_values}"
            warn "Using environment variables or resource-budget.yaml defaults"
        fi
    fi

    if [[ "${prereq_ok}" != true ]]; then
        die "Prerequisites not met. Fix the issues above and retry."
    fi

    ok "All prerequisites met"

    # --- Step 2: Read resource-budget.yaml for VM sizing ---
    step "Read resource budget for VM sizing"

    local mc_ram_gb="" mc_cores="" mc_storage_gb=""

    if [[ -f "${budget_file}" ]]; then
        mc_ram_gb=$(yaml_section_get "${budget_file}" "minecraft_vm" "ram_gb")
        mc_cores=$(yaml_section_get "${budget_file}" "minecraft_vm" "cores")
        mc_storage_gb=$(yaml_section_get "${budget_file}" "minecraft_vm" "storage_gb")

        if [[ -n "${mc_ram_gb}" && -n "${mc_cores}" && -n "${mc_storage_gb}" ]]; then
            info "Budget allocation:"
            info "  RAM:     ${mc_ram_gb} GB ($(( mc_ram_gb * 1024 )) MB)"
            info "  Cores:   ${mc_cores}"
            info "  Storage: ${mc_storage_gb} GB"
            ok "Resource budget loaded"
        else
            warn "Could not parse minecraft_vm section from resource-budget.yaml"
        fi
    else
        if dry_run_cmd "Would read resource-budget.yaml for VM sizing"; then
            :
        else
            warn "resource-budget.yaml not available -- relying on values file"
        fi
    fi

    # --- Step 3: Read VM local-values for configuration ---
    step "Read VM local-values for configuration"

    local lifecycle_args=()
    lifecycle_args+=(create --name "${VM_NAME}")

    if [[ -n "${VALUES_FILE}" ]]; then
        lifecycle_args+=(--values "${VALUES_FILE}")
        info "VM configuration will be loaded from: ${VALUES_FILE}"
    else
        # Use budget-derived values if available
        if [[ -n "${mc_ram_gb}" ]]; then
            lifecycle_args+=(--ram-mb "$(( mc_ram_gb * 1024 ))")
        fi
        if [[ -n "${mc_cores}" ]]; then
            lifecycle_args+=(--vcpus "${mc_cores}")
        fi
        if [[ -n "${mc_storage_gb}" ]]; then
            lifecycle_args+=(--disk-gb "${mc_storage_gb}")
        fi
    fi

    # Add PXE boot flag
    lifecycle_args+=(--pxe)

    ok "VM configuration prepared"

    # --- Step 4: Create VM via vm-lifecycle.sh ---
    step "Create VM via vm-lifecycle.sh"

    info "Running: vm-lifecycle.sh ${lifecycle_args[*]}"
    lifecycle "${lifecycle_args[@]}"
    ok "VM '${VM_NAME}' created"

    # --- Step 5: Start VM (PXE boots into kickstart) ---
    step "Start VM (PXE boot)"

    lifecycle start --name "${VM_NAME}"
    ok "VM '${VM_NAME}' started -- PXE booting"

    # --- Step 6: Wait for installation to complete ---
    step "Wait for installation to complete (timeout: ${FRESH_TIMEOUT}s)"

    if dry_run_cmd "Would poll VM state for ${FRESH_TIMEOUT}s until installation completes"; then
        :
    else
        info "Polling VM state every 30 seconds..."
        local elapsed=0
        while [[ ${elapsed} -lt ${FRESH_TIMEOUT} ]]; do
            sleep 30
            elapsed=$((elapsed + 30))
            info "Waiting for installation... (${elapsed}s / ${FRESH_TIMEOUT}s)"

            # Check if VM has rebooted (kicked from installer -> running OS)
            # After kickstart completes, the VM typically reboots
            # We check if it's still running (installation in progress or completed reboot)
            if ! lifecycle status --name "${VM_NAME}" 2>/dev/null | grep -q "RUNNING"; then
                info "VM appears to have stopped (may be rebooting after install)"
                sleep 10
                # Try to start it if it stopped after install
                lifecycle start --name "${VM_NAME}" 2>/dev/null || true
            fi
        done
    fi

    ok "Installation wait complete"

    # --- Step 7: Verify VM is running ---
    step "Verify VM is running and accessible"

    if dry_run_cmd "Would verify VM '${VM_NAME}' is in RUNNING state"; then
        :
    else
        lifecycle status --name "${VM_NAME}" || true
        ok "VM status retrieved"
    fi

    # --- Step 8: Report provisioning result ---
    step "Report provisioning result"

    local total_time
    total_time=$(_timer_elapsed)

    echo "" >&2
    echo "==========================================" >&2
    echo "  Fresh Provisioning Summary" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  VM Name:    ${VM_NAME}" >&2
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    if [[ -n "${VALUES_FILE}" ]]; then
        echo "  Values:     ${VALUES_FILE}" >&2
    fi
    echo "" >&2

    ok "Fresh provisioning complete for '${VM_NAME}' ($(_timer_format ${total_time}))"
}

# ---------------------------------------------------------------------------
# Mode: golden -- Create golden image from a provisioned VM
# ---------------------------------------------------------------------------

mode_golden() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  VM Provisioning: Create Golden Image${NC}" >&2
    echo -e "${BOLD}  Source VM: ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Validate source VM exists ---
    step "Validate source VM exists"

    if dry_run_cmd "Would validate VM '${VM_NAME}' exists"; then
        :
    else
        info "Checking VM '${VM_NAME}' status..."
        lifecycle status --name "${VM_NAME}" || die "Source VM '${VM_NAME}' not found"
    fi

    ok "Source VM '${VM_NAME}' validated"

    # --- Step 2: Stop source VM gracefully ---
    step "Stop source VM gracefully"

    lifecycle stop --name "${VM_NAME}"
    ok "Source VM '${VM_NAME}' stopped"

    # --- Step 3: Create golden snapshot ---
    step "Create golden snapshot"

    local golden_name="golden-$(date -u +"%Y%m%d-%H%M%S")"
    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        golden_name="${SNAPSHOT_NAME}"
    fi

    lifecycle snapshot --name "${VM_NAME}" --snapshot "${golden_name}"
    ok "Golden snapshot '${golden_name}' created"

    # --- Step 4: Start source VM back up ---
    step "Start source VM back up"

    lifecycle start --name "${VM_NAME}"
    ok "Source VM '${VM_NAME}' restarted"

    # --- Step 5: Report golden image details ---
    step "Report golden image details"

    local total_time
    total_time=$(_timer_elapsed)

    echo "" >&2
    echo "==========================================" >&2
    echo "  Golden Image Summary" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  Source VM:  ${VM_NAME}" >&2
    echo "  Snapshot:   ${golden_name}" >&2
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "" >&2
    echo "  To clone from this image:" >&2
    echo "    ${SCRIPT_NAME} --mode clone --name NEW_NAME --source ${VM_NAME} --snapshot ${golden_name}" >&2
    echo "" >&2

    ok "Golden image created ($(_timer_format ${total_time}))"
}

# ---------------------------------------------------------------------------
# Mode: clone -- Clone from golden image (the <5 minute path)
# ---------------------------------------------------------------------------

mode_clone() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  VM Provisioning: Clone from Golden Image${NC}" >&2
    echo -e "${BOLD}  Source: ${SOURCE_VM} -> ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Validate source VM and golden snapshot ---
    step "Validate source VM and golden snapshot"

    if [[ -z "${SOURCE_VM}" ]]; then
        die "Source VM required for clone mode (use --source)"
    fi

    if dry_run_cmd "Would validate source VM '${SOURCE_VM}' exists"; then
        :
    else
        lifecycle status --name "${SOURCE_VM}" || die "Source VM '${SOURCE_VM}' not found"
    fi

    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        info "Will clone from snapshot: ${SNAPSHOT_NAME}"
    else
        info "Will clone from current state (latest golden-* snapshot if available)"
    fi

    ok "Source validated"

    # --- Step 2: Clone from golden snapshot ---
    step "Clone from golden snapshot"

    local clone_args=(clone --name "${VM_NAME}" --source "${SOURCE_VM}")
    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        clone_args+=(--snapshot "${SNAPSHOT_NAME}")
    fi

    lifecycle "${clone_args[@]}"
    ok "VM '${VM_NAME}' cloned from '${SOURCE_VM}'"

    # --- Step 3: Start the cloned VM ---
    step "Start cloned VM"

    lifecycle start --name "${VM_NAME}"
    ok "Cloned VM '${VM_NAME}' started"

    # --- Step 4: Wait for boot ---
    step "Wait for boot (timeout: ${CLONE_BOOT_TIMEOUT}s)"

    if dry_run_cmd "Would poll VM state for ${CLONE_BOOT_TIMEOUT}s until boot completes"; then
        :
    else
        local elapsed=0
        while [[ ${elapsed} -lt ${CLONE_BOOT_TIMEOUT} ]]; do
            sleep 5
            elapsed=$((elapsed + 5))

            # Check if VM is running
            if lifecycle status --name "${VM_NAME}" 2>/dev/null | grep -q "RUNNING"; then
                ok "VM '${VM_NAME}' is running after ${elapsed}s"
                break
            fi

            if [[ $((elapsed % 30)) -eq 0 ]]; then
                info "Waiting for boot... (${elapsed}s / ${CLONE_BOOT_TIMEOUT}s)"
            fi
        done
    fi

    # --- Step 5: Report clone result ---
    step "Report clone result"

    local total_time
    total_time=$(_timer_elapsed)
    local target_met="NO"
    if [[ ${total_time} -lt 300 ]]; then
        target_met="YES"
    fi

    echo "" >&2
    echo "==========================================" >&2
    echo "  Clone Provisioning Summary" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  Source VM:  ${SOURCE_VM}" >&2
    echo "  Target VM:  ${VM_NAME}" >&2
    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        echo "  Snapshot:   ${SNAPSHOT_NAME}" >&2
    fi
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "  Under 5min: ${target_met} (target per INFRA-11)" >&2
    echo "" >&2

    if [[ "${target_met}" == "YES" ]]; then
        ok "Clone provisioning complete -- under 5 minutes ($(_timer_format ${total_time}))"
    else
        warn "Clone provisioning complete but EXCEEDED 5-minute target ($(_timer_format ${total_time}))"
    fi
}

# ---------------------------------------------------------------------------
# Mode: destroy -- Clean teardown
# ---------------------------------------------------------------------------

mode_destroy() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  VM Provisioning: Destroy${NC}" >&2
    echo -e "${BOLD}  VM: ${VM_NAME}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Stop and destroy VM ---
    step "Stop and destroy VM"

    lifecycle destroy --name "${VM_NAME}" --force
    ok "VM '${VM_NAME}' destroyed"

    # --- Step 2: Confirm destruction ---
    step "Confirm destruction"

    if dry_run_cmd "Would confirm VM '${VM_NAME}' no longer exists"; then
        :
    else
        if lifecycle status --name "${VM_NAME}" 2>/dev/null | grep -q "NOT FOUND"; then
            ok "VM '${VM_NAME}' confirmed destroyed"
        else
            warn "VM '${VM_NAME}' may still exist -- check manually"
        fi
    fi

    local total_time
    total_time=$(_timer_elapsed)

    echo "" >&2
    echo "==========================================" >&2
    echo "  Destroy Summary" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  VM Name:    ${VM_NAME}" >&2
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "" >&2

    ok "Destroy complete ($(_timer_format ${total_time}))"
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --mode MODE --name NAME [options]

Master VM provisioning orchestrator. Handles the complete VM lifecycle
from fresh provisioning through golden image workflow to clean teardown.

Modes:
  fresh     Full provisioning from scratch via PXE/kickstart
  golden    Create golden image snapshot from a provisioned VM
  clone     Clone from golden image (target: under 5 minutes)
  destroy   Clean teardown of a VM

Required:
  --mode MODE           Provisioning mode (fresh|golden|clone|destroy)
  --name NAME           VM name (target VM for create/clone/destroy, source for golden)

Clone Mode:
  --source SOURCE_VM    Source VM to clone from (required for clone)
  --snapshot SNAP_NAME  Specific snapshot to clone from (optional, defaults to latest)

Options:
  --values PATH         Local-values file (default: infra/local/vm-provisioning.local-values)
  --dry-run             Show what would be done without executing
  --help                Show this help message

Integration:
  - Reads infra/local/resource-budget.yaml for VM sizing (from calculate-budget.sh)
  - Calls vm-lifecycle.sh for all VM operations (never calls backends directly)
  - Uses render-pxe-menu.sh for any VM-specific template rendering
  - Follows deploy-pxe.sh orchestrator pattern: numbered steps, validation-first

Timing Targets (INFRA-11):
  - Clone mode: under 5 minutes from snapshot to running VM
  - Fresh mode: 15-20 minutes (PXE boot + kickstart install)
  - Golden mode: 1-2 minutes (stop + snapshot + restart)

Examples:
  # Fresh provisioning with local-values
  ${SCRIPT_NAME} --mode fresh --name minecraft-server \\
    --values infra/local/vm-provisioning.local-values

  # Create golden image
  ${SCRIPT_NAME} --mode golden --name minecraft-server

  # Clone from golden image
  ${SCRIPT_NAME} --mode clone --name minecraft-clone --source minecraft-server

  # Clone from specific snapshot
  ${SCRIPT_NAME} --mode clone --name minecraft-test \\
    --source minecraft-server --snapshot golden-20260218-120000

  # Destroy a VM
  ${SCRIPT_NAME} --mode destroy --name minecraft-test

  # Dry-run preview
  ${SCRIPT_NAME} --mode fresh --name test-vm --dry-run
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --mode)
            MODE="${2:?'--mode requires a value (fresh|golden|clone|destroy)'}"
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
    exit 1
fi

if [[ -z "${VM_NAME}" ]]; then
    die "Missing required argument: --name"
fi

# Validate mode
case "${MODE}" in
    fresh|golden|clone|destroy)
        ;;
    *)
        die "Invalid mode: '${MODE}' (must be fresh, golden, clone, or destroy)"
        ;;
esac

# Mode-specific validation
if [[ "${MODE}" == "clone" && -z "${SOURCE_VM}" ]]; then
    die "Clone mode requires --source (source VM to clone from)"
fi

# ---------------------------------------------------------------------------
# Header
# ---------------------------------------------------------------------------

if [[ "${DRY_RUN}" == true ]]; then
    echo "" >&2
    echo -e "${YELLOW}==========================================${NC}" >&2
    echo -e "${YELLOW}  DRY-RUN MODE -- No changes will be made${NC}" >&2
    echo -e "${YELLOW}==========================================${NC}" >&2
fi

info "Provisioning mode: ${MODE}"
info "VM name: ${VM_NAME}"
if [[ -n "${SOURCE_VM}" ]]; then
    info "Source VM: ${SOURCE_VM}"
fi

# ---------------------------------------------------------------------------
# Dispatch to mode handler
# ---------------------------------------------------------------------------

case "${MODE}" in
    fresh)   mode_fresh ;;
    golden)  mode_golden ;;
    clone)   mode_clone ;;
    destroy) mode_destroy ;;
esac

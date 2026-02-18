#!/usr/bin/env bash
# golden-image.sh -- Golden image lifecycle manager
#
# Manages golden image snapshots for Minecraft server infrastructure.
# Golden images provide the fast rebuild path: clone + world restore + verify
# produces a working server in under 5 minutes (OPS-08).
#
# Commands:
#   create   Create a golden image from a running Minecraft server
#   clone    Clone from a golden image to a new VM (under-5-minute path)
#   list     List available golden images with version info
#   verify   Verify a golden image is bootable and healthy
#   info     Show detailed manifest for a golden image
#
# All VM operations go through vm-lifecycle.sh exclusively (Phase 172 decision).
#
# Usage: golden-image.sh <command> [OPTIONS]
#
# Exit codes:
#   0 -- Success
#   1 -- Operation failed
#   2 -- Usage error
#   3 -- Health check failed

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
HEALTH_CHECK="${SCRIPT_DIR}/check-minecraft-health.sh"
RESTORE_WORLD="${SCRIPT_DIR}/restore-world.sh"
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"
MANIFEST_TEMPLATE="${PROJECT_ROOT}/infra/templates/minecraft/golden-image-manifest.yaml.template"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

COMMAND=""
SOURCE_VM="minecraft-server"
SNAPSHOT_NAME=""
TARGET_NAME=""
TARGET_HOST=""
LOCAL_MODE=false
VALUES_FILE=""
MANIFEST_DIR="${PROJECT_ROOT}/infra/local/golden-images"
RESTORE_BACKUP=""
SECRETS_FILE=""
SKIP_HEALTH_CHECK=false
FORCE=false
JSON_OUTPUT=false
DRY_RUN=false
STEP_NUM=0
MINECRAFT_HOME="/opt/minecraft"

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
# Remote/local execution helpers (matching deploy-minecraft.sh pattern)
# ---------------------------------------------------------------------------

target_cmd() {
    if [[ "${LOCAL_MODE}" == true ]]; then
        eval "$@"
    else
        ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new \
            "${TARGET_HOST}" "$@"
    fi
}

target_copy() {
    local src="$1"
    local dest="$2"
    if [[ "${LOCAL_MODE}" == true ]]; then
        cp "${src}" "${dest}"
    else
        scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new \
            "${src}" "${TARGET_HOST}:${dest}"
    fi
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
# vm-lifecycle.sh wrapper
# ---------------------------------------------------------------------------

lifecycle() {
    local args=("$@")
    if [[ "${DRY_RUN}" == true ]]; then
        args+=(--dry-run)
    fi
    bash "${VM_LIFECYCLE}" "${args[@]}"
}

# ---------------------------------------------------------------------------
# Command: create -- Create a golden image from a running Minecraft server
# ---------------------------------------------------------------------------

cmd_create() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Golden Image: Create${NC}" >&2
    echo -e "${BOLD}  Source VM: ${SOURCE_VM}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Validate source VM exists ---
    step "Validate source VM exists"

    if dry_run_cmd "Would validate VM '${SOURCE_VM}' exists via vm-lifecycle.sh status"; then
        :
    else
        lifecycle status --name "${SOURCE_VM}" || die "Source VM '${SOURCE_VM}' not found"
    fi

    ok "Source VM '${SOURCE_VM}' validated"

    # --- Step 2: Gather version information ---
    step "Gather version information from source VM"

    local centos_version="unknown"
    local kernel_version="unknown"
    local java_version="unknown"
    local fabric_loader_version="unknown"
    local minecraft_version="unknown"
    local fabric_api_version="unknown"
    local syncmatica_version="unknown"

    if [[ "${LOCAL_MODE}" != true ]] && [[ -z "${TARGET_HOST}" ]]; then
        warn "No --target-host or --local specified -- skipping version gathering via SSH"
        warn "Versions will be recorded as 'unknown' in the manifest"
    else
        if dry_run_cmd "Would gather CentOS, kernel, Java, Fabric, Minecraft, mod versions via SSH"; then
            :
        else
            # CentOS version
            centos_version=$(target_cmd "cat /etc/centos-release 2>/dev/null || grep PRETTY_NAME /etc/os-release | cut -d= -f2 | tr -d '\"'" 2>/dev/null || echo "unknown")
            info "CentOS: ${centos_version}"

            # Kernel version
            kernel_version=$(target_cmd "uname -r" 2>/dev/null || echo "unknown")
            info "Kernel: ${kernel_version}"

            # Java version
            java_version=$(target_cmd "java -version 2>&1 | head -1" 2>/dev/null || echo "unknown")
            info "Java: ${java_version}"

            # Read mod-manifest.yaml for Fabric/Minecraft/mod versions
            local mod_manifest="${MINECRAFT_HOME}/server/mod-manifest.yaml"
            if target_cmd "test -f '${mod_manifest}'" 2>/dev/null; then
                local manifest_content
                manifest_content=$(target_cmd "cat '${mod_manifest}'" 2>/dev/null || echo "")

                if [[ -n "${manifest_content}" ]]; then
                    minecraft_version=$(echo "${manifest_content}" | grep -E '^\s*minecraft_version\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"[:space:]' || echo "unknown")
                    fabric_loader_version=$(echo "${manifest_content}" | grep -E '^\s*fabric_loader_version\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"[:space:]' || echo "unknown")
                    fabric_api_version=$(echo "${manifest_content}" | grep -E '^\s*fabric_api_version\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"[:space:]' || echo "unknown")
                    syncmatica_version=$(echo "${manifest_content}" | grep -E '^\s*syncmatica_version\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"[:space:]' || echo "unknown")
                fi

                info "Minecraft: ${minecraft_version}"
                info "Fabric Loader: ${fabric_loader_version}"
                info "Fabric API: ${fabric_api_version}"
                info "Syncmatica: ${syncmatica_version}"
            else
                warn "mod-manifest.yaml not found at ${mod_manifest} -- mod versions unknown"
            fi
        fi
    fi

    ok "Version information gathered"

    # --- Step 3: Gather backup state ---
    step "Gather backup state"

    local last_backup_file="none"
    local last_backup_time="none"
    local last_backup_checksum="none"

    if [[ "${LOCAL_MODE}" == true ]] || [[ -n "${TARGET_HOST}" ]]; then
        local backup_status="${MINECRAFT_HOME}/backups/last-backup-status.yaml"
        if dry_run_cmd "Would read last-backup-status.yaml from ${backup_status}"; then
            :
        elif target_cmd "test -f '${backup_status}'" 2>/dev/null; then
            local status_content
            status_content=$(target_cmd "cat '${backup_status}'" 2>/dev/null || echo "")

            if [[ -n "${status_content}" ]]; then
                last_backup_file=$(echo "${status_content}" | grep -E '^\s*file\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | sed 's/[[:space:]]*$//' || echo "none")
                last_backup_time=$(echo "${status_content}" | grep -E '^\s*time\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | sed 's/[[:space:]]*$//' || echo "none")
                last_backup_checksum=$(echo "${status_content}" | grep -E '^\s*checksum\s*:' | head -1 | sed 's/^[^:]*:[[:space:]]*//' | tr -d '"' | sed 's/[[:space:]]*$//' || echo "none")
            fi

            info "Last backup: ${last_backup_file}"
            info "Backup time: ${last_backup_time}"
        else
            warn "No last-backup-status.yaml found -- image created without backup reference"
        fi
    fi

    ok "Backup state gathered"

    # --- Step 4: Health check (optional) ---
    step "Health check on source VM"

    local health_verified="false"
    local health_tps="unknown"
    local health_memory_ok="false"

    if [[ "${SKIP_HEALTH_CHECK}" == true ]]; then
        warn "Health check skipped (--skip-health-check)"
    elif dry_run_cmd "Would run check-minecraft-health.sh against source VM"; then
        :
    else
        local health_exit=0
        local health_output=""

        if [[ -f "${HEALTH_CHECK}" ]]; then
            local health_args=()
            if [[ "${LOCAL_MODE}" == true ]]; then
                health_args+=(--local)
            elif [[ -n "${TARGET_HOST}" ]]; then
                health_args+=(--target-host "${TARGET_HOST}")
            fi
            health_args+=(--json)

            health_output=$(bash "${HEALTH_CHECK}" "${health_args[@]}" 2>/dev/null) || health_exit=$?

            if [[ ${health_exit} -eq 0 ]]; then
                health_verified="true"
                health_memory_ok="true"
                ok "Health check passed"
            elif [[ ${health_exit} -eq 2 ]]; then
                health_verified="true"
                health_memory_ok="true"
                warn "Health check passed with warnings"
            else
                health_verified="false"
                warn "Health check failed (exit ${health_exit})"
                if [[ "${FORCE}" != true ]]; then
                    error "Source VM is unhealthy. Use --force to create image anyway."
                    exit 3
                fi
                warn "Proceeding with --force despite failed health check"
            fi
        else
            warn "check-minecraft-health.sh not found -- skipping health check"
        fi
    fi

    ok "Health check complete"

    # --- Step 5: Create golden snapshot ---
    step "Create golden snapshot"

    # Stop source VM for clean snapshot
    info "Stopping source VM for clean snapshot..."
    lifecycle stop --name "${SOURCE_VM}"
    ok "Source VM stopped"

    # Generate snapshot name
    local golden_name="golden-$(date -u +"%Y%m%d-%H%M%S")"
    if [[ -n "${SNAPSHOT_NAME}" ]]; then
        golden_name="${SNAPSHOT_NAME}"
    fi

    info "Creating snapshot: ${golden_name}"
    lifecycle snapshot --name "${SOURCE_VM}" --snapshot "${golden_name}"
    ok "Golden snapshot '${golden_name}' created"

    # Restart source VM
    info "Restarting source VM..."
    lifecycle start --name "${SOURCE_VM}"
    ok "Source VM restarted"

    # --- Step 6: Render manifest ---
    step "Render version manifest"

    if dry_run_cmd "Would render manifest to ${MANIFEST_DIR}/${golden_name}.manifest.yaml"; then
        :
    else
        mkdir -p "${MANIFEST_DIR}"

        # Create temporary values file for rendering
        local tmp_values
        tmp_values=$(mktemp /tmp/golden-values.XXXXXX)
        trap "rm -f '${tmp_values}'" EXIT

        cat > "${tmp_values}" <<VALEOF
generated_date: "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
image_name: "${golden_name}"
source_vm: "${SOURCE_VM}"
centos_version: "${centos_version}"
kernel_version: "${kernel_version}"
java_version: "${java_version}"
fabric_loader_version: "${fabric_loader_version}"
minecraft_version: "${minecraft_version}"
fabric_api_version: "${fabric_api_version}"
syncmatica_version: "${syncmatica_version}"
last_backup_file: "${last_backup_file}"
last_backup_time: "${last_backup_time}"
last_backup_checksum: "${last_backup_checksum}"
health_verified: ${health_verified}
health_tps: "${health_tps}"
health_memory_ok: ${health_memory_ok}
VALEOF

        local manifest_output="${MANIFEST_DIR}/${golden_name}.manifest.yaml"

        if [[ -f "${RENDER_SCRIPT}" ]] && [[ -f "${MANIFEST_TEMPLATE}" ]]; then
            bash "${RENDER_SCRIPT}" \
                --template "${MANIFEST_TEMPLATE}" \
                --values "${tmp_values}" \
                --output "${manifest_output}"
            ok "Manifest rendered: ${manifest_output}"

            # Create/update latest symlink
            local latest_link="${MANIFEST_DIR}/latest.manifest.yaml"
            rm -f "${latest_link}"
            cp "${manifest_output}" "${latest_link}"
            ok "Latest manifest updated"
        else
            warn "Renderer or template not found -- writing manifest directly"
            cp "${tmp_values}" "${manifest_output}"
        fi
    fi

    ok "Manifest saved"

    # --- Step 7: Report ---
    step "Report"

    local total_time
    total_time=$(_timer_elapsed)

    echo "" >&2
    echo "==========================================" >&2
    echo "  Golden Image Created" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  Source VM:  ${SOURCE_VM}" >&2
    echo "  Snapshot:   ${golden_name}" >&2
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "" >&2
    echo "  --- Versions ---" >&2
    echo "  CentOS:         ${centos_version}" >&2
    echo "  Kernel:         ${kernel_version}" >&2
    echo "  Java:           ${java_version}" >&2
    echo "  Fabric Loader:  ${fabric_loader_version}" >&2
    echo "  Minecraft:      ${minecraft_version}" >&2
    echo "  Fabric API:     ${fabric_api_version}" >&2
    echo "  Syncmatica:     ${syncmatica_version}" >&2
    echo "" >&2
    echo "  --- World Backup ---" >&2
    echo "  Last backup:    ${last_backup_file}" >&2
    echo "  Backup time:    ${last_backup_time}" >&2
    echo "" >&2
    echo "  --- Health ---" >&2
    echo "  Verified:       ${health_verified}" >&2
    echo "" >&2
    echo "  To clone from this image:" >&2
    echo "    ${SCRIPT_NAME} clone --source ${SOURCE_VM} --name NEW_VM_NAME --snapshot ${golden_name}" >&2
    echo "" >&2

    ok "Golden image create complete ($(_timer_format ${total_time}))"
}

# ---------------------------------------------------------------------------
# Command: clone -- Clone from golden image (under 5 minutes per OPS-08)
# ---------------------------------------------------------------------------

cmd_clone() {
    local CLONE_TARGET_SECONDS=300  # 5 minutes per OPS-08

    if [[ -z "${TARGET_NAME}" ]]; then
        die "Clone requires --name (target VM name). Use --help for usage."
    fi

    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Golden Image: Clone${NC}" >&2
    echo -e "${BOLD}  Source: ${SOURCE_VM} -> ${TARGET_NAME}${NC}" >&2
    echo -e "${BOLD}  Timing target: 5 minutes (300 seconds) per OPS-08${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    _timer_start

    # --- Step 1: Validate source VM and find snapshot ---
    step "Validate source VM and find snapshot"

    if dry_run_cmd "Would validate source VM '${SOURCE_VM}' exists"; then
        :
    else
        lifecycle status --name "${SOURCE_VM}" || die "Source VM '${SOURCE_VM}' not found"
    fi

    local clone_snapshot="${SNAPSHOT_NAME}"
    if [[ -z "${clone_snapshot}" ]]; then
        info "No --snapshot specified -- will use latest golden-* snapshot"
        clone_snapshot=""  # vm-lifecycle.sh clone handles default
    else
        info "Using snapshot: ${clone_snapshot}"
    fi

    # Load manifest if available
    if [[ -n "${clone_snapshot}" ]] && [[ -f "${MANIFEST_DIR}/${clone_snapshot}.manifest.yaml" ]]; then
        info "Manifest found for ${clone_snapshot}"
    elif [[ -f "${MANIFEST_DIR}/latest.manifest.yaml" ]]; then
        info "Using latest manifest"
    fi

    ok "Source validated"

    # --- Step 2: Clone VM ---
    step "Clone VM from golden image"

    local clone_args=(clone --name "${TARGET_NAME}" --source "${SOURCE_VM}")
    if [[ -n "${clone_snapshot}" ]]; then
        clone_args+=(--snapshot "${clone_snapshot}")
    fi

    lifecycle "${clone_args[@]}"
    ok "VM '${TARGET_NAME}' cloned from '${SOURCE_VM}'"

    # --- Step 3: Start cloned VM ---
    step "Start cloned VM"

    lifecycle start --name "${TARGET_NAME}"
    ok "Cloned VM '${TARGET_NAME}' started"

    # Wait for boot (max 120 seconds, matching provision-vm.sh clone pattern)
    local boot_timeout=120
    if dry_run_cmd "Would poll VM state for ${boot_timeout}s until boot completes"; then
        :
    else
        local boot_elapsed=0
        while [[ ${boot_elapsed} -lt ${boot_timeout} ]]; do
            sleep 5
            boot_elapsed=$((boot_elapsed + 5))

            if lifecycle status --name "${TARGET_NAME}" 2>/dev/null | grep -q "RUNNING"; then
                ok "VM '${TARGET_NAME}' is running after ${boot_elapsed}s"
                break
            fi

            if [[ $((boot_elapsed % 30)) -eq 0 ]]; then
                info "Waiting for boot... (${boot_elapsed}s / ${boot_timeout}s)"
            fi
        done
    fi

    # --- Step 4: World restore (if requested) ---
    if [[ -n "${RESTORE_BACKUP}" ]]; then
        step "Restore world from backup"

        local restore_args=("${RESTORE_BACKUP}" --force --no-backup-current)
        if [[ -n "${SECRETS_FILE}" ]]; then
            restore_args+=(--secrets "${SECRETS_FILE}")
        fi

        if dry_run_cmd "Would run restore-world.sh ${restore_args[*]}"; then
            :
        elif [[ -f "${RESTORE_WORLD}" ]]; then
            bash "${RESTORE_WORLD}" "${restore_args[@]}"
            ok "World restored from backup"
        else
            warn "restore-world.sh not found -- skipping world restore"
        fi
    fi

    # --- Step 5: Health check ---
    if [[ "${SKIP_HEALTH_CHECK}" != true ]]; then
        step "Health check on cloned VM"

        if dry_run_cmd "Would run check-minecraft-health.sh against cloned VM"; then
            :
        elif [[ -f "${HEALTH_CHECK}" ]]; then
            # Wait for Minecraft to finish starting (up to 60 seconds)
            info "Waiting for Minecraft server to finish starting..."
            local mc_waited=0
            while [[ ${mc_waited} -lt 60 ]]; do
                sleep 5
                mc_waited=$((mc_waited + 5))
                info "  ... waiting (${mc_waited}s / 60s)"
            done

            local health_exit=0
            local health_args=(--local)
            bash "${HEALTH_CHECK}" "${health_args[@]}" 2>/dev/null || health_exit=$?

            if [[ ${health_exit} -eq 0 ]] || [[ ${health_exit} -eq 2 ]]; then
                ok "Health check passed"
            else
                warn "Health check failed (exit ${health_exit})"
                error "Cloned VM may not be healthy. Check logs."
                exit 3
            fi
        else
            warn "check-minecraft-health.sh not found -- skipping health check"
        fi
    else
        info "Health check skipped (--skip-health-check)"
    fi

    # --- Report ---
    step "Report"

    local total_time
    total_time=$(_timer_elapsed)
    local target_met="NO"
    if [[ ${total_time} -le ${CLONE_TARGET_SECONDS} ]]; then
        target_met="YES"
    fi

    echo "" >&2
    echo "==========================================" >&2
    echo "  Golden Image Clone Summary" >&2
    echo "==========================================" >&2
    echo "" >&2
    if [[ "${DRY_RUN}" == true ]]; then
        echo "  Mode:       DRY-RUN (no changes made)" >&2
    else
        echo "  Mode:       LIVE" >&2
    fi
    echo "  Source VM:  ${SOURCE_VM}" >&2
    echo "  Target VM:  ${TARGET_NAME}" >&2
    if [[ -n "${clone_snapshot}" ]]; then
        echo "  Snapshot:   ${clone_snapshot}" >&2
    fi
    echo "  Duration:   $(_timer_format ${total_time})" >&2
    echo "  Under 5min: ${target_met} (target per OPS-08)" >&2
    echo "" >&2

    if [[ "${target_met}" == "YES" ]]; then
        ok "Clone complete -- under 5 minutes ($(_timer_format ${total_time}))"
    else
        warn "Clone complete but EXCEEDED 5-minute target ($(_timer_format ${total_time}))"
    fi
}

# ---------------------------------------------------------------------------
# Command: list -- List available golden images
# ---------------------------------------------------------------------------

cmd_list() {
    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Golden Images: ${SOURCE_VM}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    # List snapshots from vm-lifecycle.sh status
    if dry_run_cmd "Would list snapshots for VM '${SOURCE_VM}'"; then
        :
    else
        info "Querying snapshots for '${SOURCE_VM}'..."
        lifecycle status --name "${SOURCE_VM}" 2>/dev/null || warn "Could not query VM status"
    fi

    echo "" >&2

    # Cross-reference with manifests
    if [[ -d "${MANIFEST_DIR}" ]]; then
        local manifest_count=0
        info "Available manifests in ${MANIFEST_DIR}:"
        echo "" >&2

        if [[ "${JSON_OUTPUT}" == true ]]; then
            echo "["
            local first=true
        fi

        for manifest in "${MANIFEST_DIR}"/golden-*.manifest.yaml; do
            if [[ -f "${manifest}" ]]; then
                manifest_count=$((manifest_count + 1))
                local name centos_ver fabric_ver backup_date
                name=$(basename "${manifest}" .manifest.yaml)
                centos_ver=$(yaml_get "${manifest}" "centos" 2>/dev/null || echo "unknown")
                fabric_ver=$(yaml_get "${manifest}" "fabric_loader" 2>/dev/null || echo "unknown")
                backup_date=$(yaml_get "${manifest}" "last_backup_time" 2>/dev/null || echo "none")

                if [[ "${JSON_OUTPUT}" == true ]]; then
                    if [[ "${first}" != true ]]; then echo ","; fi
                    echo "  {\"name\": \"${name}\", \"centos\": \"${centos_ver}\", \"fabric\": \"${fabric_ver}\", \"backup\": \"${backup_date}\"}"
                    first=false
                else
                    printf "  %-35s CentOS: %-20s Fabric: %-10s Backup: %s\n" \
                        "${name}" "${centos_ver}" "${fabric_ver}" "${backup_date}" >&2
                fi
            fi
        done

        if [[ "${JSON_OUTPUT}" == true ]]; then
            echo "]"
        fi

        if [[ ${manifest_count} -eq 0 ]]; then
            info "No manifests found. Create one with: ${SCRIPT_NAME} create --source ${SOURCE_VM}"
        else
            ok "${manifest_count} manifest(s) found"
        fi
    else
        info "No manifest directory found at ${MANIFEST_DIR}"
        info "Create a golden image first: ${SCRIPT_NAME} create --source ${SOURCE_VM}"
    fi
}

# ---------------------------------------------------------------------------
# Command: verify -- Verify a golden image VM is bootable and healthy
# ---------------------------------------------------------------------------

cmd_verify() {
    if [[ -z "${TARGET_NAME}" ]]; then
        die "Verify requires --name (VM name to verify). Use --help for usage."
    fi

    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Golden Image: Verify${NC}" >&2
    echo -e "${BOLD}  VM: ${TARGET_NAME}${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    # Check VM status
    step "Check VM status"

    if dry_run_cmd "Would check status of VM '${TARGET_NAME}'"; then
        :
    else
        lifecycle status --name "${TARGET_NAME}" || die "VM '${TARGET_NAME}' not found"
    fi

    ok "VM found"

    # Run health check
    step "Run health check"

    if [[ -f "${HEALTH_CHECK}" ]]; then
        local health_args=()
        if [[ "${LOCAL_MODE}" == true ]]; then
            health_args+=(--local)
        elif [[ -n "${TARGET_HOST}" ]]; then
            health_args+=(--target-host "${TARGET_HOST}")
        else
            health_args+=(--local)
        fi

        local health_exit=0
        bash "${HEALTH_CHECK}" "${health_args[@]}" || health_exit=$?

        if [[ ${health_exit} -eq 0 ]]; then
            ok "VM '${TARGET_NAME}' is HEALTHY"
        elif [[ ${health_exit} -eq 2 ]]; then
            warn "VM '${TARGET_NAME}' is DEGRADED (warnings)"
        else
            error "VM '${TARGET_NAME}' is UNHEALTHY"
            exit 3
        fi
    else
        warn "check-minecraft-health.sh not found -- cannot verify health"
    fi
}

# ---------------------------------------------------------------------------
# Command: info -- Show detailed manifest for a golden image
# ---------------------------------------------------------------------------

cmd_info() {
    local manifest_name="${SNAPSHOT_NAME}"

    echo "" >&2
    echo -e "${BOLD}===========================================${NC}" >&2
    echo -e "${BOLD}  Golden Image: Info${NC}" >&2
    echo -e "${BOLD}===========================================${NC}" >&2

    local manifest_path=""
    if [[ -n "${manifest_name}" ]]; then
        manifest_path="${MANIFEST_DIR}/${manifest_name}.manifest.yaml"
    else
        manifest_path="${MANIFEST_DIR}/latest.manifest.yaml"
        info "No --snapshot specified -- showing latest manifest"
    fi

    if [[ -f "${manifest_path}" ]]; then
        echo "" >&2
        cat "${manifest_path}" >&2
        echo "" >&2
        ok "Manifest displayed: ${manifest_path}"
    else
        die "Manifest not found: ${manifest_path}"
    fi
}

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} <command> [OPTIONS]

Golden image lifecycle manager. Creates versioned snapshots from running
Minecraft servers and clones them for rapid rebuild (under 5 minutes
per OPS-08).

Commands:
  create    Create a golden image from a running Minecraft server
  clone     Clone from a golden image to a new VM
  list      List available golden images with version info
  verify    Verify a golden image VM is bootable and healthy
  info      Show detailed manifest for a golden image

Create Options:
  --source NAME         Source VM name (default: minecraft-server)
  --snapshot-name NAME  Override auto-generated snapshot name
  --target-host HOST    SSH target for reading server versions
  --local               Source VM is localhost
  --values PATH         Local-values file for version info
  --manifest-dir PATH   Where to store manifests (default: infra/local/golden-images/)
  --skip-health-check   Skip pre-snapshot health check
  --force               Create image even if health check fails
  --dry-run             Show what would happen
  --help                Show this help

Clone Options:
  --source NAME         Source VM to clone from (default: minecraft-server)
  --name NAME           Name for the cloned VM (required)
  --snapshot NAME       Specific snapshot to clone from (default: latest golden-*)
  --restore-backup PATH Backup archive to restore after clone
  --secrets PATH        Secrets file for RCON operations during restore
  --skip-health-check   Skip post-clone health verification
  --dry-run             Show what would happen

List Options:
  --source NAME         Source VM whose snapshots to list (default: minecraft-server)
  --manifest-dir PATH   Directory containing manifests
  --json                Output as JSON for scripting

Verify Options:
  --name NAME           VM name to verify (required)
  --target-host HOST    SSH target for health check
  --local               VM is localhost

Info Options:
  --snapshot NAME       Snapshot name to show manifest for (default: latest)
  --manifest-dir PATH   Directory containing manifests

Exit Codes:
  0  Success
  1  Operation failed
  2  Usage error
  3  Health check failed

Timing Targets:
  - Clone: under 5 minutes (300 seconds) per OPS-08
  - Create: typically 1-3 minutes (stop + snapshot + restart)

Integration:
  - Uses vm-lifecycle.sh for all VM operations (Phase 172 decision)
  - Uses check-minecraft-health.sh for health verification
  - Uses restore-world.sh for world data restoration
  - Uses render-pxe-menu.sh for manifest template rendering
  - Reads mod-manifest.yaml for mod version tracking

Examples:
  # Create golden image from running server
  ${SCRIPT_NAME} create --source minecraft-server --target-host gsd@mc-server-01

  # Create golden image from localhost
  ${SCRIPT_NAME} create --source minecraft-server --local

  # Clone from golden image (under 5 minutes)
  ${SCRIPT_NAME} clone --source minecraft-server --name mc-clone-01

  # Clone and restore latest world backup
  ${SCRIPT_NAME} clone --source minecraft-server --name mc-clone-01 \\
    --restore-backup /opt/minecraft/backups/hourly/latest.tar.gz

  # List available golden images
  ${SCRIPT_NAME} list --source minecraft-server

  # Verify a VM
  ${SCRIPT_NAME} verify --name mc-clone-01 --local

  # Show manifest
  ${SCRIPT_NAME} info --snapshot golden-20260218-120000

  # Dry-run preview
  ${SCRIPT_NAME} create --source minecraft-server --local --dry-run
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            create|clone|list|verify|info)
                COMMAND="$1"
                shift
                ;;
            --source)
                SOURCE_VM="${2:?'--source requires a value'}"
                shift 2
                ;;
            --name)
                TARGET_NAME="${2:?'--name requires a value'}"
                shift 2
                ;;
            --snapshot|--snapshot-name)
                SNAPSHOT_NAME="${2:?'--snapshot requires a value'}"
                shift 2
                ;;
            --target-host)
                TARGET_HOST="${2:?'--target-host requires a value'}"
                LOCAL_MODE=false
                shift 2
                ;;
            --local)
                LOCAL_MODE=true
                shift
                ;;
            --values)
                VALUES_FILE="${2:?'--values requires a path'}"
                shift 2
                ;;
            --manifest-dir)
                MANIFEST_DIR="${2:?'--manifest-dir requires a path'}"
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
            --skip-health-check)
                SKIP_HEALTH_CHECK=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
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
            --_sourced)
                return 0
                ;;
            *)
                error "Unknown option: $1 (use --help for usage)"
                exit 2
                ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"

    # Check for --_sourced (skip execution when sourced)
    for arg in "$@"; do
        if [[ "${arg}" == "--_sourced" ]]; then
            return 0
        fi
    done

    if [[ -z "${COMMAND}" ]]; then
        error "No command specified"
        echo "" >&2
        usage
        exit 2
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        echo "" >&2
        echo -e "${YELLOW}==========================================${NC}" >&2
        echo -e "${YELLOW}  DRY-RUN MODE -- No changes will be made${NC}" >&2
        echo -e "${YELLOW}==========================================${NC}" >&2
    fi

    case "${COMMAND}" in
        create) cmd_create ;;
        clone)  cmd_clone ;;
        list)   cmd_list ;;
        verify) cmd_verify ;;
        info)   cmd_info ;;
        *)
            error "Unknown command: ${COMMAND}"
            exit 2
            ;;
    esac
}

main "$@"

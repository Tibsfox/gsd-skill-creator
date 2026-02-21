#!/usr/bin/env bash
# deploy-pxe.sh -- Master PXE deployment orchestrator
#
# Orchestrates the complete PXE boot infrastructure setup:
#   1. Validate prerequisites (dnsmasq, syslinux, root privileges)
#   2. Setup TFTP root directory structure
#   3. Download CentOS Stream 9 boot media (optional)
#   4. Render dnsmasq PXE configuration from template
#   5. Render BIOS boot menu from template
#   6. Render UEFI boot menu from template
#   7. Copy GSD branding to TFTP root
#   8. Validate dnsmasq configuration (BEFORE restart)
#   9. Restart dnsmasq service
#  10. Verify service health (TFTP port, DNS resolution)
#
# Usage: deploy-pxe.sh --local-values PATH [--dry-run] [--skip-download] [--help]
#
# Exit codes:
#   0 -- Success (PXE fully deployed)
#   1 -- Prerequisite or validation failure
#   2 -- Deployment step failure

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Template locations (relative to project root) ---
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE_DIR="${PROJECT_ROOT}/infra/templates"
DNSMASQ_TEMPLATE="${TEMPLATE_DIR}/dnsmasq/pxe-boot.conf.template"
BIOS_MENU_TEMPLATE="${TEMPLATE_DIR}/pxe/pxelinux.cfg-default.template"
UEFI_MENU_TEMPLATE="${TEMPLATE_DIR}/pxe/grub.cfg.template"
SPLASH_FILE="${TEMPLATE_DIR}/pxe/gsd-splash.txt"

# --- Script locations ---
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"
TFTP_SETUP_SCRIPT="${SCRIPT_DIR}/setup-tftp-root.sh"
DOWNLOAD_SCRIPT="${SCRIPT_DIR}/download-centos-boot-media.sh"

# --- Defaults ---
LOCAL_VALUES=""
DRY_RUN=false
SKIP_DOWNLOAD=false
DNSMASQ_CONF_DIR="/etc/dnsmasq.d"
DNSMASQ_CONF_OUTPUT="${DNSMASQ_CONF_DIR}/pxe-boot.conf"
STEP_NUM=0

# --- Colors (if terminal supports them) ---
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

# --- Helper functions (log to stderr) ---
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

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --local-values PATH [OPTIONS]

Master PXE deployment orchestrator. Sets up the complete PXE boot
infrastructure from templates and local configuration values.

Required:
  --local-values PATH   Path to local-values YAML file with site-specific config

Options:
  --dry-run             Show what would be done without executing
  --skip-download       Skip CentOS boot media download (for offline/cached setups)
  --help                Show this help message

Deployment Steps:
  1. Validate prerequisites (dnsmasq, syslinux, root)
  2. Setup TFTP root directory structure
  3. Download CentOS Stream 9 boot media
  4. Render dnsmasq PXE configuration
  5. Render BIOS boot menu (pxelinux)
  6. Render UEFI boot menu (GRUB)
  7. Copy GSD branding to TFTP root
  8. Validate dnsmasq configuration
  9. Restart dnsmasq service
 10. Verify service health

Safety Features:
  - Validates dnsmasq config BEFORE restarting (never breaks existing DNS)
  - Backs up existing PXE config before overwriting
  - Checks TFTP port 69 is not in use by another service
  - Verifies dnsmasq is still serving DNS after restart
  - NEVER modifies existing dnsmasq.conf (only writes to conf.d/)

Examples:
  # Full deployment
  sudo ${SCRIPT_NAME} --local-values infra/local/pxe-boot.local-values

  # Preview without executing
  ${SCRIPT_NAME} --local-values infra/local/pxe-boot.local-values --dry-run

  # Deploy with cached boot media (skip download)
  sudo ${SCRIPT_NAME} --local-values infra/local/pxe-boot.local-values --skip-download
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="${2:?'--local-values requires a path argument'}"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-download)
            SKIP_DOWNLOAD=true
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

# --- Validate required arguments ---
if [[ -z "${LOCAL_VALUES}" ]]; then
    die "Missing required argument: --local-values (use --help for usage)"
fi
if [[ ! -f "${LOCAL_VALUES}" ]]; then
    die "Local values file not found: ${LOCAL_VALUES}"
fi

# --- Parse key values we need for orchestration ---
# Read a value from the local-values YAML (simple grep-based parser)
read_value() {
    local key="$1"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${LOCAL_VALUES}" | head -1 | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//;s/"[[:space:]]*$//' | sed 's/[[:space:]]*$//')
    if [[ -z "${val}" ]]; then
        die "Required key '${key}' not found in ${LOCAL_VALUES}"
    fi
    echo "${val}"
}

TFTP_ROOT=$(read_value "tftp_root")
PXE_INTERFACE=$(read_value "pxe_interface")

info "Configuration loaded from: ${LOCAL_VALUES}"
info "  TFTP root:     ${TFTP_ROOT}"
info "  PXE interface: ${PXE_INTERFACE}"

if [[ "${DRY_RUN}" == true ]]; then
    echo "" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
    echo -e "${YELLOW}  DRY-RUN MODE -- No changes will be made${NC}" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
fi

# ============================================================
# Step 1: Validate prerequisites
# ============================================================
step "Validate prerequisites"

prereq_ok=true

# Check for root (unless dry-run)
if [[ "${DRY_RUN}" != true ]] && [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (required for TFTP setup, dnsmasq config, service restart)"
    error "Run: sudo ${SCRIPT_NAME} --local-values ${LOCAL_VALUES}"
    prereq_ok=false
fi

# Check for dnsmasq
if command -v dnsmasq &>/dev/null; then
    ok "dnsmasq found: $(dnsmasq --version 2>/dev/null | head -1 || echo 'installed')"
else
    error "dnsmasq not installed. Install with: dnf install dnsmasq"
    prereq_ok=false
fi

# Check for required scripts
for script in "${RENDER_SCRIPT}" "${TFTP_SETUP_SCRIPT}" "${DOWNLOAD_SCRIPT}"; do
    if [[ -f "${script}" ]]; then
        ok "Script found: $(basename "${script}")"
    else
        error "Missing script: ${script}"
        prereq_ok=false
    fi
done

# Check for required templates
for tmpl in "${DNSMASQ_TEMPLATE}" "${BIOS_MENU_TEMPLATE}" "${UEFI_MENU_TEMPLATE}" "${SPLASH_FILE}"; do
    if [[ -f "${tmpl}" ]]; then
        ok "Template found: $(basename "${tmpl}")"
    else
        error "Missing template: ${tmpl}"
        prereq_ok=false
    fi
done

if [[ "${prereq_ok}" != true ]]; then
    die "Prerequisites not met. Fix the issues above and retry."
fi

ok "All prerequisites met"

# ============================================================
# Step 2: Setup TFTP root directory structure
# ============================================================
step "Setup TFTP root directory structure"

if dry_run_cmd "bash ${TFTP_SETUP_SCRIPT} --tftp-root ${TFTP_ROOT}"; then
    :
else
    bash "${TFTP_SETUP_SCRIPT}" --tftp-root "${TFTP_ROOT}"
fi

ok "TFTP root structure ready at: ${TFTP_ROOT}"

# ============================================================
# Step 3: Download CentOS boot media (unless --skip-download)
# ============================================================
step "Download CentOS Stream 9 boot media"

if [[ "${SKIP_DOWNLOAD}" == true ]]; then
    warn "Skipping download (--skip-download specified)"
    info "Checking for existing boot media..."
    if [[ -f "${TFTP_ROOT}/centos-stream-9/vmlinuz" ]] && [[ -f "${TFTP_ROOT}/centos-stream-9/initrd.img" ]]; then
        ok "Boot media already present in ${TFTP_ROOT}/centos-stream-9/"
    else
        warn "Boot media not found! PXE boot will fail without vmlinuz + initrd.img"
        warn "Run without --skip-download to fetch them."
    fi
elif dry_run_cmd "bash ${DOWNLOAD_SCRIPT} --tftp-root ${TFTP_ROOT}"; then
    :
else
    bash "${DOWNLOAD_SCRIPT}" --tftp-root "${TFTP_ROOT}"
fi

# ============================================================
# Step 4: Render dnsmasq PXE configuration
# ============================================================
step "Render dnsmasq PXE configuration"

# Backup existing config before overwriting
if [[ -f "${DNSMASQ_CONF_OUTPUT}" ]] && [[ "${DRY_RUN}" != true ]]; then
    backup_path="${DNSMASQ_CONF_OUTPUT}.bak.$(date +%Y%m%d%H%M%S)"
    cp "${DNSMASQ_CONF_OUTPUT}" "${backup_path}"
    ok "Backed up existing config to: ${backup_path}"
fi

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${DNSMASQ_TEMPLATE} --values ${LOCAL_VALUES} --output ${DNSMASQ_CONF_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${DNSMASQ_TEMPLATE}" \
        --values "${LOCAL_VALUES}" \
        --output "${DNSMASQ_CONF_OUTPUT}"
fi

ok "dnsmasq PXE config rendered to: ${DNSMASQ_CONF_OUTPUT}"

# ============================================================
# Step 5: Render BIOS boot menu (pxelinux)
# ============================================================
step "Render BIOS boot menu (pxelinux)"

BIOS_MENU_OUTPUT="${TFTP_ROOT}/pxelinux.cfg/default"

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${BIOS_MENU_TEMPLATE} --values ${LOCAL_VALUES} --output ${BIOS_MENU_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${BIOS_MENU_TEMPLATE}" \
        --values "${LOCAL_VALUES}" \
        --output "${BIOS_MENU_OUTPUT}"
fi

ok "BIOS boot menu rendered to: ${BIOS_MENU_OUTPUT}"

# ============================================================
# Step 6: Render UEFI boot menu (GRUB)
# ============================================================
step "Render UEFI boot menu (GRUB)"

UEFI_MENU_OUTPUT="${TFTP_ROOT}/grub.cfg"

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${UEFI_MENU_TEMPLATE} --values ${LOCAL_VALUES} --output ${UEFI_MENU_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${UEFI_MENU_TEMPLATE}" \
        --values "${LOCAL_VALUES}" \
        --output "${UEFI_MENU_OUTPUT}"
fi

ok "UEFI boot menu rendered to: ${UEFI_MENU_OUTPUT}"

# ============================================================
# Step 7: Copy GSD branding to TFTP root
# ============================================================
step "Copy GSD branding to TFTP root"

GSD_BRAND_DIR="${TFTP_ROOT}/gsd"

if dry_run_cmd "mkdir -p ${GSD_BRAND_DIR} && cp ${SPLASH_FILE} ${GSD_BRAND_DIR}/"; then
    :
else
    mkdir -p "${GSD_BRAND_DIR}"
    cp "${SPLASH_FILE}" "${GSD_BRAND_DIR}/"
fi

ok "Branding copied to: ${GSD_BRAND_DIR}/gsd-splash.txt"

# ============================================================
# Step 8: Validate dnsmasq configuration (BEFORE restart)
# ============================================================
step "Validate dnsmasq configuration"

if [[ "${DRY_RUN}" == true ]]; then
    dry_run_cmd "dnsmasq --test --conf-file=${DNSMASQ_CONF_OUTPUT}"
else
    info "Testing dnsmasq configuration syntax..."
    if dnsmasq --test --conf-file="${DNSMASQ_CONF_OUTPUT}" 2>&1; then
        ok "dnsmasq configuration syntax is valid"
    else
        error "dnsmasq configuration validation FAILED"
        error "The new config has NOT been activated (dnsmasq was NOT restarted)"
        if [[ -f "${DNSMASQ_CONF_OUTPUT}.bak."* ]] 2>/dev/null; then
            error "Previous config backup available -- restore manually if needed"
        fi
        die "Fix the configuration issues and retry."
    fi
fi

# ============================================================
# Step 9: Restart dnsmasq service
# ============================================================
step "Restart dnsmasq service"

# Check if TFTP port 69 is in use by something other than dnsmasq
if [[ "${DRY_RUN}" != true ]]; then
    tftp_pid=$(ss -tulnp 2>/dev/null | grep ":69 " | grep -v dnsmasq | awk '{print $NF}' || true)
    if [[ -n "${tftp_pid}" ]]; then
        warn "TFTP port 69 is in use by another process: ${tftp_pid}"
        warn "dnsmasq may fail to bind. Check for conflicting TFTP servers."
    fi
fi

if dry_run_cmd "systemctl restart dnsmasq"; then
    :
else
    info "Restarting dnsmasq..."
    systemctl restart dnsmasq
    sleep 1
    ok "dnsmasq restarted"
fi

# ============================================================
# Step 10: Verify service health
# ============================================================
step "Verify service health"

if [[ "${DRY_RUN}" == true ]]; then
    dry_run_cmd "systemctl is-active dnsmasq"
    dry_run_cmd "ss -tulnp | grep :69"
    dry_run_cmd "dig @localhost gsd.local (DNS health check)"
else
    # Check dnsmasq is running
    if systemctl is-active --quiet dnsmasq; then
        ok "dnsmasq is active and running"
    else
        error "dnsmasq is NOT running after restart!"
        error "Check: journalctl -u dnsmasq --no-pager -n 20"
        die "Service health check failed."
    fi

    # Check TFTP port
    if ss -tulnp 2>/dev/null | grep -q ":69 "; then
        ok "TFTP port 69 is listening"
    else
        warn "TFTP port 69 is NOT listening -- TFTP may not be enabled"
        warn "Check dnsmasq config for 'enable-tftp' directive"
    fi

    # Quick DNS health check (verify dnsmasq is still serving DNS)
    if command -v dig &>/dev/null; then
        if dig @localhost +short +time=2 +tries=1 . >/dev/null 2>&1; then
            ok "DNS resolution still working (dnsmasq healthy)"
        else
            warn "DNS resolution test inconclusive (may be expected if dnsmasq is not the primary DNS)"
        fi
    elif command -v nslookup &>/dev/null; then
        if nslookup localhost 127.0.0.1 >/dev/null 2>&1; then
            ok "DNS resolution still working"
        else
            warn "DNS resolution test inconclusive"
        fi
    else
        warn "No DNS lookup tool available (dig/nslookup) -- skipping DNS health check"
    fi
fi

# ============================================================
# Deployment Summary
# ============================================================
echo "" >&2
echo "========================================" >&2
echo "  GSD PXE Deployment Summary" >&2
echo "========================================" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    echo "  Mode:           DRY-RUN (no changes made)" >&2
else
    echo "  Mode:           LIVE" >&2
fi

echo "  Values file:    ${LOCAL_VALUES}" >&2
echo "  TFTP root:      ${TFTP_ROOT}" >&2
echo "  PXE interface:  ${PXE_INTERFACE}" >&2
echo "  dnsmasq config: ${DNSMASQ_CONF_OUTPUT}" >&2
echo "  BIOS menu:      ${BIOS_MENU_OUTPUT}" >&2
echo "  UEFI menu:      ${UEFI_MENU_OUTPUT}" >&2
echo "  Boot media:     ${TFTP_ROOT}/centos-stream-9/" >&2

if [[ "${DRY_RUN}" != true ]]; then
    echo "" >&2
    echo "  dnsmasq status: $(systemctl is-active dnsmasq 2>/dev/null || echo 'unknown')" >&2

    # Show boot media checksums if present
    if [[ -f "${TFTP_ROOT}/centos-stream-9/vmlinuz" ]]; then
        echo "  vmlinuz SHA256: $(sha256sum "${TFTP_ROOT}/centos-stream-9/vmlinuz" 2>/dev/null | awk '{print $1}' || echo 'N/A')" >&2
    fi
    if [[ -f "${TFTP_ROOT}/centos-stream-9/initrd.img" ]]; then
        echo "  initrd SHA256:  $(sha256sum "${TFTP_ROOT}/centos-stream-9/initrd.img" 2>/dev/null | awk '{print $1}' || echo 'N/A')" >&2
    fi
fi

echo "" >&2
echo "  To test: Create a VM with PXE boot enabled on network ${PXE_INTERFACE}" >&2
echo "  The VM should display the GSD boot menu with base and Minecraft entries." >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    ok "Dry-run complete. Review the steps above, then re-run without --dry-run."
else
    ok "PXE deployment complete!"
fi

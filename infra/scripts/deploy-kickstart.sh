#!/usr/bin/env bash
# deploy-kickstart.sh -- Kickstart deployment orchestrator
#
# Renders kickstart templates with local values and places the rendered
# files in an output directory for HTTP serving to PXE clients.
#
# This script does NOT start an HTTP server -- that is the operator's
# responsibility (Apache, nginx, Python http.server, etc.). It only
# renders templates and validates the output.
#
# Usage: deploy-kickstart.sh --local-values PATH --output-dir PATH [--dry-run] [--help]
#
# Exit codes:
#   0 -- Success (all kickstarts rendered and validated)
#   1 -- Missing argument or prerequisite
#   2 -- Rendering or validation failure

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Template locations (relative to project root) ---
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE_DIR="${PROJECT_ROOT}/infra/templates/kickstart"
BASE_KS_TEMPLATE="${TEMPLATE_DIR}/base.ks.template"
MINECRAFT_KS_TEMPLATE="${TEMPLATE_DIR}/minecraft.ks.template"

# --- Script locations ---
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"

# --- Defaults ---
LOCAL_VALUES=""
OUTPUT_DIR=""
DRY_RUN=false
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

# --- Parse a single key from the local-values YAML ---
read_value() {
    local key="$1"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${LOCAL_VALUES}" | head -1 | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//;s/"[[:space:]]*$//' | sed 's/[[:space:]]*$//')
    echo "${val}"
}

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --local-values PATH --output-dir PATH [OPTIONS]

Kickstart deployment orchestrator. Renders kickstart templates with
site-specific values and places rendered files for HTTP serving.

Required:
  --local-values PATH   Path to local-values YAML file with site-specific config
  --output-dir PATH     Directory for rendered kickstart files (e.g., /var/www/html/kickstart)

Options:
  --dry-run             Show what would be done without executing
  --help                Show this help message

Deployment Steps:
  1. Validate prerequisites (renderer, templates, values file)
  2. Create output directory
  3. Render base kickstart (base.ks)
  4. Render Minecraft kickstart (minecraft.ks)
  5. Validate rendered kickstarts (no unresolved variables)
  6. Set permissions (644, world-readable for HTTP)
  7. Summary (paths, sizes, kickstart URL)

Safety Features:
  - Backs up existing rendered files before overwriting (timestamped .bak)
  - Validates rendered output for unresolved template variables
  - Never modifies templates (only writes to output directory)

Examples:
  # Render kickstarts to a temporary directory
  ${SCRIPT_NAME} --local-values infra/local/kickstart.local-values --output-dir /tmp/kickstart

  # Preview without rendering
  ${SCRIPT_NAME} --local-values infra/local/kickstart.local-values --output-dir /tmp/kickstart --dry-run

  # Quick HTTP server for testing (after rendering):
  # cd /tmp/kickstart && python3 -m http.server 8080
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="${2:?'--local-values requires a path argument'}"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="${2:?'--output-dir requires a path argument'}"
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

# --- Validate required arguments ---
if [[ -z "${LOCAL_VALUES}" ]]; then
    die "Missing required argument: --local-values (use --help for usage)"
fi
if [[ -z "${OUTPUT_DIR}" ]]; then
    die "Missing required argument: --output-dir (use --help for usage)"
fi
if [[ ! -f "${LOCAL_VALUES}" ]]; then
    die "Local values file not found: ${LOCAL_VALUES}"
fi

info "Configuration:"
info "  Values file:   ${LOCAL_VALUES}"
info "  Output dir:    ${OUTPUT_DIR}"

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

# Check for render script
if [[ -f "${RENDER_SCRIPT}" ]]; then
    ok "Renderer found: $(basename "${RENDER_SCRIPT}")"
else
    error "Missing renderer: ${RENDER_SCRIPT}"
    prereq_ok=false
fi

# Check for templates
for tmpl in "${BASE_KS_TEMPLATE}" "${MINECRAFT_KS_TEMPLATE}"; do
    if [[ -f "${tmpl}" ]]; then
        ok "Template found: $(basename "${tmpl}")"
    else
        error "Missing template: ${tmpl}"
        prereq_ok=false
    fi
done

# Check values file is readable
if [[ -r "${LOCAL_VALUES}" ]]; then
    ok "Values file readable: $(basename "${LOCAL_VALUES}")"
else
    error "Values file not readable: ${LOCAL_VALUES}"
    prereq_ok=false
fi

if [[ "${prereq_ok}" != true ]]; then
    die "Prerequisites not met. Fix the issues above and retry."
fi

ok "All prerequisites met"

# ============================================================
# Step 2: Create output directory
# ============================================================
step "Create output directory"

if dry_run_cmd "mkdir -p ${OUTPUT_DIR}"; then
    :
else
    mkdir -p "${OUTPUT_DIR}"
fi

ok "Output directory ready: ${OUTPUT_DIR}"

# ============================================================
# Step 3: Render base kickstart
# ============================================================
step "Render base kickstart"

BASE_KS_OUTPUT="${OUTPUT_DIR}/base.ks"

# Backup existing rendered file before overwriting
if [[ -f "${BASE_KS_OUTPUT}" ]] && [[ "${DRY_RUN}" != true ]]; then
    backup_path="${BASE_KS_OUTPUT}.bak.$(date +%Y%m%d%H%M%S)"
    cp "${BASE_KS_OUTPUT}" "${backup_path}"
    ok "Backed up existing file to: ${backup_path}"
fi

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${BASE_KS_TEMPLATE} --values ${LOCAL_VALUES} --output ${BASE_KS_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${BASE_KS_TEMPLATE}" \
        --values "${LOCAL_VALUES}" \
        --output "${BASE_KS_OUTPUT}"
fi

ok "Base kickstart rendered to: ${BASE_KS_OUTPUT}"

# ============================================================
# Step 4: Render Minecraft kickstart
# ============================================================
step "Render Minecraft kickstart"

MINECRAFT_KS_OUTPUT="${OUTPUT_DIR}/minecraft.ks"

# Backup existing rendered file before overwriting
if [[ -f "${MINECRAFT_KS_OUTPUT}" ]] && [[ "${DRY_RUN}" != true ]]; then
    backup_path="${MINECRAFT_KS_OUTPUT}.bak.$(date +%Y%m%d%H%M%S)"
    cp "${MINECRAFT_KS_OUTPUT}" "${backup_path}"
    ok "Backed up existing file to: ${backup_path}"
fi

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${MINECRAFT_KS_TEMPLATE} --values ${LOCAL_VALUES} --output ${MINECRAFT_KS_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${MINECRAFT_KS_TEMPLATE}" \
        --values "${LOCAL_VALUES}" \
        --output "${MINECRAFT_KS_OUTPUT}"
fi

ok "Minecraft kickstart rendered to: ${MINECRAFT_KS_OUTPUT}"

# ============================================================
# Step 5: Validate rendered kickstarts
# ============================================================
step "Validate rendered kickstarts"

validation_ok=true

for ks_file in "${BASE_KS_OUTPUT}" "${MINECRAFT_KS_OUTPUT}"; do
    ks_name="$(basename "${ks_file}")"

    if [[ "${DRY_RUN}" == true ]]; then
        dry_run_cmd "Validate ${ks_name}: non-empty, no unresolved vars, has %end"
        continue
    fi

    # Check file exists and is non-empty
    if [[ ! -s "${ks_file}" ]]; then
        error "${ks_name}: File is empty or missing"
        validation_ok=false
        continue
    fi
    ok "${ks_name}: non-empty ($(wc -c < "${ks_file}") bytes)"

    # Check for unresolved template variables
    unresolved=$(grep -oP '\$\{[A-Z][A-Z0-9]*_[A-Z0-9_]+\}' "${ks_file}" || true)
    if [[ -n "${unresolved}" ]]; then
        error "${ks_name}: unresolved template variables found:"
        echo "${unresolved}" | sort -u | while read -r var; do
            error "  ${var}"
        done
        validation_ok=false
    else
        ok "${ks_name}: no unresolved template variables"
    fi

    # Check basic kickstart structure (%end marker)
    if grep -q '%end' "${ks_file}"; then
        ok "${ks_name}: kickstart structure valid (%end found)"
    else
        error "${ks_name}: missing %end -- invalid kickstart structure"
        validation_ok=false
    fi
done

if [[ "${validation_ok}" != true ]]; then
    die "Rendered kickstart validation FAILED. Check the errors above."
fi

ok "All rendered kickstarts validated"

# ============================================================
# Step 6: Set permissions
# ============================================================
step "Set permissions (world-readable for HTTP serving)"

if dry_run_cmd "chmod 644 ${OUTPUT_DIR}/*.ks"; then
    :
else
    chmod 644 "${OUTPUT_DIR}"/*.ks
fi

ok "Permissions set to 644 on all rendered kickstart files"

# ============================================================
# Step 7: Summary
# ============================================================
step "Deployment summary"

# Read kickstart_server_url from values (may not be present)
KICKSTART_URL=$(read_value "kickstart_server_url")

echo "" >&2
echo "========================================" >&2
echo "  GSD Kickstart Deployment Summary" >&2
echo "========================================" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    echo "  Mode:           DRY-RUN (no changes made)" >&2
else
    echo "  Mode:           LIVE" >&2
fi

echo "  Values file:    ${LOCAL_VALUES}" >&2
echo "  Output dir:     ${OUTPUT_DIR}" >&2
echo "" >&2
echo "  Rendered files:" >&2

for ks_file in "${OUTPUT_DIR}"/*.ks; do
    [[ -f "${ks_file}" ]] || continue
    ks_name="$(basename "${ks_file}")"
    if [[ "${DRY_RUN}" != true ]]; then
        ks_size=$(wc -c < "${ks_file}")
        echo "    ${ks_name}  (${ks_size} bytes)" >&2
    else
        echo "    ${ks_name}  (dry-run, not rendered)" >&2
    fi

    # Show the URL this file would be served at
    if [[ -n "${KICKSTART_URL}" ]]; then
        echo "      URL: ${KICKSTART_URL}/${ks_name}" >&2
    fi
done

if [[ -z "${KICKSTART_URL}" ]]; then
    echo "" >&2
    echo "  NOTE: kickstart_server_url not set in values file." >&2
    echo "  PXE clients need a URL to fetch kickstart files." >&2
    echo "  Set kickstart_server_url in your local-values file." >&2
fi

echo "" >&2
echo "  To serve these files for testing:" >&2
echo "    cd ${OUTPUT_DIR} && python3 -m http.server 8080" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    ok "Dry-run complete. Review the steps above, then re-run without --dry-run."
else
    ok "Kickstart deployment complete!"
fi

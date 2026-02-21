#!/usr/bin/env bash
# deploy-minecraft.sh -- Minecraft Fabric server deployment orchestrator
#
# Transforms a bare VM (Java 21 installed, minecraft user created by kickstart
# Phase 171) into a running Minecraft Fabric server with JVM flags templated
# from the hardware profile.
#
# Orchestrates the complete Minecraft server deployment:
#   1. Validate prerequisites (Java, SSH/SCP, templates, values)
#   2. Load configuration from local-values files
#   3. Download Fabric installer
#   4. Render JVM flags from template
#   5. Render systemd service from template
#   6. Deploy server files to target
#   7. Install JVM flags and systemd service
#   8. Open firewall ports
#   9. Start server and verify
#  10. Deployment summary
#
# Requirements satisfied:
#   MC-01: Running Minecraft Fabric server from kickstart + first-boot + deploy
#   MC-02: systemd service with auto-start on boot and restart on crash
#   MC-03: JVM flags templated from hardware profile with correct GC and heap
#
# Usage: deploy-minecraft.sh [OPTIONS]
#
# Exit codes:
#   0 -- Success (Minecraft server deployed and running)
#   1 -- Prerequisite or validation failure
#   2 -- Deployment step failure

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Template locations (relative to project root) ---
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE_DIR="${PROJECT_ROOT}/infra/templates/minecraft"
JVM_FLAGS_TEMPLATE="${TEMPLATE_DIR}/jvm-flags.conf.template"
SERVICE_TEMPLATE="${TEMPLATE_DIR}/minecraft.service.template"

# --- Script locations ---
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"
LIB_DIR="${SCRIPT_DIR}/lib"
FW_ABSTRACTION="${LIB_DIR}/fw-abstraction.sh"

# --- Defaults ---
MC_LOCAL_VALUES=""
MAIN_LOCAL_VALUES=""
TARGET_HOST=""
LOCAL_DEPLOY=false
DRY_RUN=false
SKIP_DOWNLOAD=false
STEP_NUM=0

# Default paths (can be overridden by local-values)
DEFAULT_MINECRAFT_HOME="/opt/minecraft"
DEFAULT_SERVER_JAR="fabric-server-launch.jar"
DEFAULT_JVM_FLAGS_PATH="/opt/minecraft/server/jvm-flags.conf"
DEFAULT_MINECRAFT_PORT="25565"
DEFAULT_RCON_PORT="25575"
DEFAULT_MANAGEMENT_INTERFACE="enp3s0"
DEFAULT_FABRIC_INSTALLER_VERSION="1.0.1"
DEFAULT_MINECRAFT_VERSION="1.21.4"
DEFAULT_FABRIC_LOADER_VERSION="latest"

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
    echo -e "${BOLD}[Step ${STEP_NUM}/10]${NC} $*" >&2
    echo -e "${BOLD}$(printf '%.0s-' {1..60})${NC}" >&2
}

dry_run_cmd() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "  ${YELLOW}[DRY-RUN]${NC} $*" >&2
        return 0
    fi
    return 1
}

# --- Run a command on the target (local or remote) ---
target_cmd() {
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        eval "$@"
    else
        ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${TARGET_HOST}" "$@"
    fi
}

# --- Copy a file to the target (local or remote) ---
target_copy() {
    local src="$1"
    local dest="$2"
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        cp "${src}" "${dest}"
    else
        scp -o BatchMode=yes -o StrictHostKeyChecking=accept-new "${src}" "${TARGET_HOST}:${dest}"
    fi
}

# --- Parse a single key from a flat local-values YAML file ---
# Usage: val=$(yaml_get "key_name" "/path/to/values")
yaml_get() {
    local key="$1"
    local file="$2"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${file}" 2>/dev/null | head -1 | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//;s/"[[:space:]]*$//' | sed 's/[[:space:]]*$//')
    echo "${val}"
}

# --- Parse a nested YAML value (e.g., minecraft.jvm.heap_min_mb) ---
# Uses awk-based section parser matching the pattern from generate-local-values.sh
# Usage: val=$(yaml_get_nested "minecraft" "jvm" "heap_min_mb" "/path/to/values.yaml")
yaml_get_nested() {
    local section1="$1"
    local section2="$2"
    local key="$3"
    local file="$4"

    awk -v s1="${section1}" -v s2="${section2}" -v k="${key}" '
    BEGIN { in_s1=0; in_s2=0 }
    # Detect top-level section (no leading whitespace)
    /^[a-zA-Z]/ {
        if ($1 == s1":") { in_s1=1; in_s2=0 }
        else { in_s1=0; in_s2=0 }
        next
    }
    # Detect second-level section (2-space indent)
    in_s1 && /^  [a-zA-Z]/ {
        gsub(/^  /, "")
        if ($1 == s2":") { in_s2=1 }
        else { in_s2=0 }
        next
    }
    # Detect key within second-level section (4-space indent)
    in_s1 && in_s2 && /^    [a-zA-Z]/ {
        gsub(/^    /, "")
        split($0, parts, ":")
        gsub(/^[[:space:]]+/, "", parts[2])
        gsub(/[[:space:]]+$/, "", parts[2])
        # Strip surrounding quotes
        gsub(/^"/, "", parts[2])
        gsub(/"$/, "", parts[2])
        if (parts[1] == k) { print parts[2]; exit }
    }
    ' "${file}"
}

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Minecraft Fabric server deployment orchestrator. Downloads the Fabric
installer, deploys the server JAR, renders JVM flags from hardware profile,
installs systemd service with auto-restart, and opens firewall ports.

Options:
  --local-values PATH   Minecraft local-values file
                        (default: infra/local/minecraft.local-values)
  --values PATH         Main local-values.yaml from generate-local-values.sh
                        (default: infra/local/local-values.yaml)
  --target-host HOST    SSH target for remote deployment (e.g., gsd@mc-server-01)
  --local               Deploy to localhost (for testing or running on the MC VM)
  --dry-run             Show what would be done without executing
  --skip-download       Skip Fabric installer download (use cached)
  --help                Show this help message

Deployment Steps:
   1. Validate prerequisites (Java, SSH, templates, values)
   2. Load configuration from local-values files
   3. Download Fabric installer
   4. Render JVM flags from template
   5. Render systemd service from template
   6. Deploy server files to target
   7. Install JVM flags and systemd service
   8. Open firewall ports
   9. Start server and verify
  10. Deployment summary

Prerequisites:
  - Target VM provisioned with Java 21 and minecraft user (Phase 171 kickstart)
  - Hardware profile generated (generate-local-values.sh)
  - Network connectivity to fabricmc.net (for installer download)

Examples:
  # Remote deployment to Minecraft VM
  ${SCRIPT_NAME} --target-host gsd@mc-server-01

  # Local deployment (running on the Minecraft VM itself)
  sudo ${SCRIPT_NAME} --local

  # Preview without executing
  ${SCRIPT_NAME} --local --dry-run

  # Custom values files
  ${SCRIPT_NAME} --local-values my-mc.local-values --values my-local-values.yaml --local

  # Skip download (use cached Fabric installer)
  ${SCRIPT_NAME} --target-host gsd@mc-server-01 --skip-download
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            MC_LOCAL_VALUES="${2:?'--local-values requires a path argument'}"
            shift 2
            ;;
        --values)
            MAIN_LOCAL_VALUES="${2:?'--values requires a path argument'}"
            shift 2
            ;;
        --target-host)
            TARGET_HOST="${2:?'--target-host requires a host argument'}"
            shift 2
            ;;
        --local)
            LOCAL_DEPLOY=true
            shift
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

# --- Apply defaults for unset paths ---
if [[ -z "${MC_LOCAL_VALUES}" ]]; then
    MC_LOCAL_VALUES="${PROJECT_ROOT}/infra/local/minecraft.local-values"
fi
if [[ -z "${MAIN_LOCAL_VALUES}" ]]; then
    MAIN_LOCAL_VALUES="${PROJECT_ROOT}/infra/local/local-values.yaml"
fi

# --- Validate deployment target ---
if [[ "${LOCAL_DEPLOY}" != true ]] && [[ -z "${TARGET_HOST}" ]]; then
    die "Must specify either --target-host HOST or --local (use --help for usage)"
fi

info "Minecraft Fabric Server Deployment"
info "  Minecraft local-values: ${MC_LOCAL_VALUES}"
info "  Main local-values:      ${MAIN_LOCAL_VALUES}"
if [[ "${LOCAL_DEPLOY}" == true ]]; then
    info "  Target:                 localhost"
else
    info "  Target:                 ${TARGET_HOST}"
fi

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

# Check for required commands
if [[ "${LOCAL_DEPLOY}" == true ]]; then
    if command -v java &>/dev/null; then
        ok "Java found: $(java -version 2>&1 | head -1)"
    else
        error "Java not installed on localhost. Install Java 21: dnf install java-21-openjdk-headless"
        prereq_ok=false
    fi
else
    for cmd in ssh scp; do
        if command -v "${cmd}" &>/dev/null; then
            ok "Command found: ${cmd}"
        else
            error "Missing command: ${cmd} (required for remote deployment)"
            prereq_ok=false
        fi
    done
fi

if command -v curl &>/dev/null; then
    ok "Command found: curl"
else
    error "Missing command: curl (required for Fabric installer download)"
    prereq_ok=false
fi

# Check render script exists
if [[ -f "${RENDER_SCRIPT}" ]]; then
    ok "Renderer found: $(basename "${RENDER_SCRIPT}")"
else
    error "Missing renderer: ${RENDER_SCRIPT}"
    prereq_ok=false
fi

# Check template files exist
for tmpl in "${JVM_FLAGS_TEMPLATE}" "${SERVICE_TEMPLATE}"; do
    if [[ -f "${tmpl}" ]]; then
        ok "Template found: $(basename "${tmpl}")"
    else
        error "Missing template: ${tmpl}"
        prereq_ok=false
    fi
done

# Check local-values files exist
if [[ -f "${MC_LOCAL_VALUES}" ]]; then
    ok "Minecraft local-values found: ${MC_LOCAL_VALUES}"
else
    warn "Minecraft local-values not found: ${MC_LOCAL_VALUES}"
    warn "Will rely on main local-values.yaml and defaults"
fi

if [[ -f "${MAIN_LOCAL_VALUES}" ]]; then
    ok "Main local-values found: ${MAIN_LOCAL_VALUES}"
    # Verify it contains minecraft.jvm section
    if grep -q "^minecraft:" "${MAIN_LOCAL_VALUES}" 2>/dev/null; then
        ok "Main local-values contains minecraft section"
    else
        warn "Main local-values does not contain minecraft section -- using defaults"
    fi
else
    warn "Main local-values not found: ${MAIN_LOCAL_VALUES}"
    warn "Will rely on Minecraft local-values and defaults"
fi

if [[ "${prereq_ok}" != true ]]; then
    die "Prerequisites not met. Fix the issues above and retry."
fi

ok "All prerequisites met"

# ============================================================
# Step 2: Load configuration
# ============================================================
step "Load configuration"

# Helper: get a value from MC local-values first, then main local-values (nested), then default
get_config() {
    local mc_key="$1"
    local main_section1="${2:-}"
    local main_section2="${3:-}"
    local main_key="${4:-}"
    local default_val="${5:-}"
    local val=""

    # Try MC local-values first (flat YAML)
    if [[ -f "${MC_LOCAL_VALUES}" ]]; then
        val=$(yaml_get "${mc_key}" "${MC_LOCAL_VALUES}")
    fi

    # Fall back to main local-values (nested YAML)
    if [[ -z "${val}" ]] && [[ -f "${MAIN_LOCAL_VALUES}" ]] && [[ -n "${main_section1}" ]]; then
        val=$(yaml_get_nested "${main_section1}" "${main_section2}" "${main_key}" "${MAIN_LOCAL_VALUES}")
    fi

    # Fall back to default
    if [[ -z "${val}" ]]; then
        val="${default_val}"
    fi

    echo "${val}"
}

# --- Fabric installer settings ---
FABRIC_INSTALLER_VERSION=$(get_config "fabric_installer_version" "" "" "" "${DEFAULT_FABRIC_INSTALLER_VERSION}")
MINECRAFT_VERSION=$(get_config "minecraft_version" "" "" "" "${DEFAULT_MINECRAFT_VERSION}")
FABRIC_LOADER_VERSION=$(get_config "fabric_loader_version" "" "" "" "${DEFAULT_FABRIC_LOADER_VERSION}")

# --- Server identity ---
MINECRAFT_HOME=$(get_config "minecraft_home" "" "" "" "${DEFAULT_MINECRAFT_HOME}")
SERVER_JAR=$(get_config "server_jar" "" "" "" "${DEFAULT_SERVER_JAR}")

# --- JVM configuration (MC local-values override main local-values) ---
JVM_HEAP_MIN_MB=$(get_config "jvm_heap_min_mb" "minecraft" "jvm" "heap_min_mb" "4096")
JVM_HEAP_MAX_MB=$(get_config "jvm_heap_max_mb" "minecraft" "jvm" "heap_max_mb" "15872")
GC_TYPE=$(get_config "gc_type" "minecraft" "jvm" "gc_type" "ZGC")
GC_FLAGS=$(get_config "gc_flags" "minecraft" "jvm" "gc_flags" "-XX:+UseZGC -XX:+ZGenerational")
EXTRA_JVM_FLAGS=$(get_config "extra_jvm_flags" "minecraft" "jvm" "extra_flags" "-XX:+ParallelRefProcEnabled -XX:+DisableExplicitGC -XX:+AlwaysPreTouch")

# --- Paths ---
JVM_FLAGS_PATH=$(get_config "jvm_flags_path" "" "" "" "${DEFAULT_JVM_FLAGS_PATH}")

# --- Network ---
MINECRAFT_PORT=$(get_config "minecraft_server_port" "network" "" "game_port" "${DEFAULT_MINECRAFT_PORT}")
RCON_PORT=$(get_config "minecraft_rcon_port" "network" "" "rcon_port" "${DEFAULT_RCON_PORT}")
MGMT_INTERFACE=$(get_config "management_interface" "network" "" "management_interface" "${DEFAULT_MANAGEMENT_INTERFACE}")

# --- EULA ---
MINECRAFT_EULA=$(get_config "minecraft_eula" "" "" "" "false")

info "Configuration loaded:"
info "  Fabric installer: v${FABRIC_INSTALLER_VERSION}"
info "  Minecraft:        ${MINECRAFT_VERSION}"
info "  Fabric loader:    ${FABRIC_LOADER_VERSION}"
info "  Server JAR:       ${SERVER_JAR}"
info "  Minecraft home:   ${MINECRAFT_HOME}"
info "  JVM heap:         ${JVM_HEAP_MIN_MB}MB - ${JVM_HEAP_MAX_MB}MB"
info "  GC type:          ${GC_TYPE}"
info "  GC flags:         ${GC_FLAGS}"
info "  Extra JVM flags:  ${EXTRA_JVM_FLAGS}"
info "  JVM flags path:   ${JVM_FLAGS_PATH}"
info "  Game port:        ${MINECRAFT_PORT}"
info "  RCON port:        ${RCON_PORT}"
info "  Management iface: ${MGMT_INTERFACE}"
info "  EULA accepted:    ${MINECRAFT_EULA}"

ok "Configuration loaded"

# ============================================================
# Step 3: Download Fabric installer
# ============================================================
step "Download Fabric installer"

# Create temp directory for staging files
STAGING_DIR=$(mktemp -d /tmp/deploy-minecraft.XXXXXX)
trap 'rm -rf "${STAGING_DIR}"' EXIT

FABRIC_INSTALLER_JAR="fabric-installer-${FABRIC_INSTALLER_VERSION}.jar"
FABRIC_INSTALLER_URL="https://meta.fabricmc.net/v2/versions/installer/${FABRIC_INSTALLER_VERSION}/${FABRIC_INSTALLER_JAR}"
FABRIC_INSTALLER_PATH="${STAGING_DIR}/${FABRIC_INSTALLER_JAR}"

if [[ "${SKIP_DOWNLOAD}" == true ]]; then
    warn "Skipping download (--skip-download specified)"
    # Check if installer already exists on target
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        cached_path="${MINECRAFT_HOME}/server/${FABRIC_INSTALLER_JAR}"
        if [[ -f "${cached_path}" ]]; then
            ok "Cached installer found: ${cached_path}"
            cp "${cached_path}" "${FABRIC_INSTALLER_PATH}"
        else
            die "Cached installer not found at ${cached_path}. Re-run without --skip-download."
        fi
    else
        info "Will check for cached installer on target during deployment"
    fi
elif dry_run_cmd "curl -fSL ${FABRIC_INSTALLER_URL} -o ${FABRIC_INSTALLER_PATH}"; then
    :
else
    info "Downloading Fabric installer v${FABRIC_INSTALLER_VERSION}..."
    info "  URL: ${FABRIC_INSTALLER_URL}"

    if ! curl -fSL "${FABRIC_INSTALLER_URL}" -o "${FABRIC_INSTALLER_PATH}" 2>&1; then
        error "Failed to download Fabric installer"
        error "Manual download URL: ${FABRIC_INSTALLER_URL}"
        error "Alternative: https://fabricmc.net/use/installer/"
        die "Download failed. Check network connectivity and installer version."
    fi

    # Verify the download is a valid JAR (not an HTML error page)
    file_type=$(file -b "${FABRIC_INSTALLER_PATH}" 2>/dev/null || echo "unknown")
    if [[ "${file_type}" == *"Java archive"* ]] || [[ "${file_type}" == *"Zip archive"* ]]; then
        ok "Fabric installer downloaded and verified: ${FABRIC_INSTALLER_JAR} (${file_type})"
    else
        error "Downloaded file is not a valid JAR: ${file_type}"
        error "This usually means the download URL returned an error page"
        die "Verify the installer version at https://fabricmc.net/use/installer/"
    fi
fi

# ============================================================
# Step 4: Render JVM flags from template
# ============================================================
step "Render JVM flags from template"

# Create a temporary values file for template rendering
JVM_VALUES_FILE="${STAGING_DIR}/jvm-values.yaml"
cat > "${JVM_VALUES_FILE}" <<JVMEOF
jvm_heap_min_mb: "${JVM_HEAP_MIN_MB}"
jvm_heap_max_mb: "${JVM_HEAP_MAX_MB}"
gc_type: "${GC_TYPE}"
gc_flags: "${GC_FLAGS}"
extra_jvm_flags: "${EXTRA_JVM_FLAGS}"
JVMEOF

JVM_FLAGS_OUTPUT="${STAGING_DIR}/jvm-flags.conf"

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${JVM_FLAGS_TEMPLATE} --values ${JVM_VALUES_FILE} --output ${JVM_FLAGS_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${JVM_FLAGS_TEMPLATE}" \
        --values "${JVM_VALUES_FILE}" \
        --output "${JVM_FLAGS_OUTPUT}"
fi

ok "JVM flags rendered to staging: ${JVM_FLAGS_OUTPUT}"

# ============================================================
# Step 5: Render systemd service from template
# ============================================================
step "Render systemd service from template"

# Create a temporary values file for service template rendering
SVC_VALUES_FILE="${STAGING_DIR}/svc-values.yaml"
cat > "${SVC_VALUES_FILE}" <<SVCEOF
minecraft_home: "${MINECRAFT_HOME}"
server_jar: "${SERVER_JAR}"
jvm_flags_path: "${JVM_FLAGS_PATH}"
SVCEOF

SERVICE_OUTPUT="${STAGING_DIR}/minecraft.service"

if dry_run_cmd "bash ${RENDER_SCRIPT} --template ${SERVICE_TEMPLATE} --values ${SVC_VALUES_FILE} --output ${SERVICE_OUTPUT}"; then
    :
else
    bash "${RENDER_SCRIPT}" \
        --template "${SERVICE_TEMPLATE}" \
        --values "${SVC_VALUES_FILE}" \
        --output "${SERVICE_OUTPUT}"
fi

ok "systemd service rendered to staging: ${SERVICE_OUTPUT}"

# ============================================================
# Step 6: Deploy server files to target
# ============================================================
step "Deploy server files to target"

SERVER_DIR="${MINECRAFT_HOME}/server"

if dry_run_cmd "Deploy Fabric installer to ${SERVER_DIR}/ and run installer"; then
    dry_run_cmd "target_copy ${FABRIC_INSTALLER_PATH} ${SERVER_DIR}/"
    dry_run_cmd "java -jar ${FABRIC_INSTALLER_JAR} server -mcversion ${MINECRAFT_VERSION} -loader ${FABRIC_LOADER_VERSION} -downloadMinecraft -dir ${SERVER_DIR}"
    dry_run_cmd "echo eula=true > ${SERVER_DIR}/eula.txt"
    dry_run_cmd "chown -R minecraft:minecraft ${MINECRAFT_HOME}"
else
    # Ensure server directory exists (should exist from kickstart, but be safe)
    info "Ensuring server directory exists: ${SERVER_DIR}"
    target_cmd "sudo mkdir -p '${SERVER_DIR}'"

    # Backup existing server JAR if present
    if target_cmd "test -f '${SERVER_DIR}/${SERVER_JAR}'" 2>/dev/null; then
        backup_name="${SERVER_JAR}.bak.$(date +%Y%m%d%H%M%S)"
        info "Backing up existing server JAR to: ${backup_name}"
        target_cmd "sudo cp '${SERVER_DIR}/${SERVER_JAR}' '${SERVER_DIR}/${backup_name}'"
    fi

    # Copy Fabric installer to target
    if [[ "${SKIP_DOWNLOAD}" == true ]] && [[ "${LOCAL_DEPLOY}" != true ]]; then
        # For remote + skip-download, check if cached installer exists on target
        if target_cmd "test -f '${SERVER_DIR}/${FABRIC_INSTALLER_JAR}'" 2>/dev/null; then
            ok "Cached installer found on target: ${SERVER_DIR}/${FABRIC_INSTALLER_JAR}"
        else
            die "Cached installer not found on target. Re-run without --skip-download."
        fi
    else
        info "Copying Fabric installer to target..."
        if [[ "${LOCAL_DEPLOY}" == true ]]; then
            sudo cp "${FABRIC_INSTALLER_PATH}" "${SERVER_DIR}/"
        else
            target_copy "${FABRIC_INSTALLER_PATH}" "/tmp/${FABRIC_INSTALLER_JAR}"
            target_cmd "sudo mv '/tmp/${FABRIC_INSTALLER_JAR}' '${SERVER_DIR}/'"
        fi
        ok "Fabric installer copied to target"
    fi

    # Run Fabric installer
    info "Running Fabric installer..."
    info "  Minecraft version: ${MINECRAFT_VERSION}"
    info "  Fabric loader:     ${FABRIC_LOADER_VERSION}"

    # Build installer command
    INSTALLER_CMD="cd '${SERVER_DIR}' && sudo -u minecraft java -jar '${FABRIC_INSTALLER_JAR}' server -mcversion '${MINECRAFT_VERSION}'"
    if [[ "${FABRIC_LOADER_VERSION}" != "latest" ]]; then
        INSTALLER_CMD="${INSTALLER_CMD} -loader '${FABRIC_LOADER_VERSION}'"
    fi
    INSTALLER_CMD="${INSTALLER_CMD} -downloadMinecraft -dir '${SERVER_DIR}'"

    if target_cmd "${INSTALLER_CMD}" 2>&1; then
        ok "Fabric server installed successfully"
    else
        error "Fabric installer failed"
        error "Possible causes:"
        error "  - Wrong Java version (requires Java 21)"
        error "  - Network connectivity issues (cannot reach Fabric/Minecraft servers)"
        error "  - Invalid Minecraft or loader version"
        die "Check the error output above and retry."
    fi

    # Verify installer produced expected files
    if target_cmd "test -f '${SERVER_DIR}/${SERVER_JAR}'" 2>/dev/null; then
        ok "Server JAR produced: ${SERVER_JAR}"
    else
        error "Expected server JAR not found: ${SERVER_DIR}/${SERVER_JAR}"
        error "The Fabric installer may have produced files under a different name."
        die "Check ${SERVER_DIR}/ for the actual server JAR."
    fi

    # Accept EULA (conditional on minecraft_eula setting)
    if [[ "${MINECRAFT_EULA}" == "true" ]]; then
        info "Accepting Minecraft EULA..."
        target_cmd "echo 'eula=true' | sudo tee '${SERVER_DIR}/eula.txt' > /dev/null"
        ok "EULA accepted (eula.txt written)"
    else
        warn "EULA NOT accepted (minecraft_eula is not 'true')"
        warn "The server will NOT start until eula=true is set in ${SERVER_DIR}/eula.txt"
        warn "Set minecraft_eula: \"true\" in your local-values to accept."
    fi

    # Set ownership
    info "Setting ownership to minecraft:minecraft..."
    target_cmd "sudo chown -R minecraft:minecraft '${MINECRAFT_HOME}'"
    ok "Ownership set"
fi

ok "Server files deployed to ${SERVER_DIR}"

# ============================================================
# Step 7: Install JVM flags and systemd service
# ============================================================
step "Install JVM flags and systemd service"

if dry_run_cmd "Deploy jvm-flags.conf to ${JVM_FLAGS_PATH}"; then
    dry_run_cmd "Deploy minecraft.service to /etc/systemd/system/minecraft.service"
    dry_run_cmd "systemctl daemon-reload"
    dry_run_cmd "systemctl enable minecraft.service"
else
    # Backup existing JVM flags if present
    if target_cmd "test -f '${JVM_FLAGS_PATH}'" 2>/dev/null; then
        backup_name="${JVM_FLAGS_PATH}.bak.$(date +%Y%m%d%H%M%S)"
        info "Backing up existing JVM flags to: ${backup_name}"
        target_cmd "sudo cp '${JVM_FLAGS_PATH}' '${backup_name}'"
    fi

    # Deploy JVM flags
    info "Deploying JVM flags to: ${JVM_FLAGS_PATH}"
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        sudo cp "${JVM_FLAGS_OUTPUT}" "${JVM_FLAGS_PATH}"
        sudo chown minecraft:minecraft "${JVM_FLAGS_PATH}"
    else
        target_copy "${JVM_FLAGS_OUTPUT}" "/tmp/jvm-flags.conf"
        target_cmd "sudo mv '/tmp/jvm-flags.conf' '${JVM_FLAGS_PATH}' && sudo chown minecraft:minecraft '${JVM_FLAGS_PATH}'"
    fi
    ok "JVM flags deployed"

    # Backup existing service file if present
    if target_cmd "test -f '/etc/systemd/system/minecraft.service'" 2>/dev/null; then
        backup_name="/etc/systemd/system/minecraft.service.bak.$(date +%Y%m%d%H%M%S)"
        info "Backing up existing service to: ${backup_name}"
        target_cmd "sudo cp '/etc/systemd/system/minecraft.service' '${backup_name}'"
    fi

    # Deploy systemd service
    info "Deploying systemd service..."
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        sudo cp "${SERVICE_OUTPUT}" /etc/systemd/system/minecraft.service
    else
        target_copy "${SERVICE_OUTPUT}" "/tmp/minecraft.service"
        target_cmd "sudo mv '/tmp/minecraft.service' '/etc/systemd/system/minecraft.service'"
    fi
    ok "systemd service deployed"

    # Reload systemd and enable service
    info "Reloading systemd daemon..."
    target_cmd "sudo systemctl daemon-reload"
    ok "systemd daemon reloaded"

    # Enable service (idempotent -- skip if already enabled)
    if target_cmd "systemctl is-enabled minecraft.service" &>/dev/null; then
        ok "minecraft.service already enabled (start on boot)"
    else
        target_cmd "sudo systemctl enable minecraft.service"
        ok "minecraft.service enabled (start on boot)"
    fi
fi

ok "JVM flags and systemd service installed"

# ============================================================
# Step 8: Open firewall ports
# ============================================================
step "Open firewall ports"

if dry_run_cmd "Open game port ${MINECRAFT_PORT}/tcp on ${MGMT_INTERFACE}"; then
    dry_run_cmd "Open RCON port ${RCON_PORT}/tcp on ${MGMT_INTERFACE}"
else
    # Source firewall abstraction layer if available
    fw_available=false
    if [[ -f "${FW_ABSTRACTION}" ]]; then
        # shellcheck source=lib/fw-abstraction.sh
        source "${FW_ABSTRACTION}"
        fw_available=true
        ok "Firewall abstraction layer loaded"
    else
        warn "Firewall abstraction layer not found: ${FW_ABSTRACTION}"
        warn "Will attempt direct firewall-cmd as fallback"
    fi

    # Open game port
    info "Opening game port ${MINECRAFT_PORT}/tcp..."
    if [[ "${fw_available}" == true ]]; then
        if fw_open_port "${MINECRAFT_PORT}" tcp; then
            ok "Game port ${MINECRAFT_PORT}/tcp opened"
        else
            warn "Failed to open game port ${MINECRAFT_PORT}/tcp via abstraction layer"
            warn "Server will work locally but may not be accessible remotely"
        fi
    elif command -v firewall-cmd &>/dev/null; then
        # Direct firewalld fallback
        if target_cmd "sudo firewall-cmd --permanent --add-port=${MINECRAFT_PORT}/tcp && sudo firewall-cmd --reload" 2>/dev/null; then
            ok "Game port ${MINECRAFT_PORT}/tcp opened (firewalld direct)"
        else
            warn "Failed to open game port ${MINECRAFT_PORT}/tcp"
            warn "Server will work locally but may not be accessible remotely"
        fi
    else
        warn "No firewall tool available -- assuming ports are already accessible"
    fi

    # Open RCON port (if different from game port)
    if [[ "${RCON_PORT}" != "${MINECRAFT_PORT}" ]]; then
        info "Opening RCON port ${RCON_PORT}/tcp..."
        if [[ "${fw_available}" == true ]]; then
            if fw_open_port "${RCON_PORT}" tcp; then
                ok "RCON port ${RCON_PORT}/tcp opened"
            else
                warn "Failed to open RCON port ${RCON_PORT}/tcp"
            fi
        elif command -v firewall-cmd &>/dev/null; then
            if target_cmd "sudo firewall-cmd --permanent --add-port=${RCON_PORT}/tcp && sudo firewall-cmd --reload" 2>/dev/null; then
                ok "RCON port ${RCON_PORT}/tcp opened (firewalld direct)"
            else
                warn "Failed to open RCON port ${RCON_PORT}/tcp"
            fi
        fi
    fi
fi

ok "Firewall configuration complete"

# ============================================================
# Step 9: Start server and verify
# ============================================================
step "Start server and verify"

if dry_run_cmd "systemctl start minecraft.service"; then
    dry_run_cmd "Wait up to 60s for server startup"
    dry_run_cmd "journalctl -u minecraft.service --no-pager -n 50 | grep -i done"
else
    # Check if service is already running
    if target_cmd "systemctl is-active --quiet minecraft.service" 2>/dev/null; then
        ok "minecraft.service is already running"
        info "Restarting to apply new configuration..."
        target_cmd "sudo systemctl restart minecraft.service"
    else
        info "Starting minecraft.service..."
        target_cmd "sudo systemctl start minecraft.service"
    fi

    # Wait for server to start (up to 60 seconds)
    info "Waiting for Minecraft server to start (up to 60 seconds)..."
    startup_timeout=60
    startup_elapsed=0
    server_started=false

    while [[ ${startup_elapsed} -lt ${startup_timeout} ]]; do
        if target_cmd "systemctl is-active --quiet minecraft.service" 2>/dev/null; then
            # Service is running, check if Minecraft has finished loading
            if target_cmd "journalctl -u minecraft.service --no-pager -n 50 2>/dev/null | grep -qi 'done'" 2>/dev/null; then
                server_started=true
                break
            fi
        else
            # Service stopped/failed -- check for crash
            svc_status=$(target_cmd "systemctl is-active minecraft.service 2>/dev/null" || echo "unknown")
            if [[ "${svc_status}" == "failed" ]]; then
                error "minecraft.service FAILED to start!"
                error "Recent logs:"
                target_cmd "journalctl -u minecraft.service --no-pager -n 30" 2>/dev/null >&2 || true
                die "Server failed to start. Check the logs above."
            fi
        fi

        sleep 5
        startup_elapsed=$((startup_elapsed + 5))
        info "  ... waiting (${startup_elapsed}s / ${startup_timeout}s)"
    done

    if [[ "${server_started}" == true ]]; then
        ok "Minecraft server is running!"
        # Report status
        target_cmd "systemctl status minecraft.service --no-pager -l" 2>/dev/null >&2 || true
    else
        warn "Server may still be starting (timeout after ${startup_timeout}s)"
        warn "Minecraft worlds can take a while to generate on first launch"
        warn "Check status: systemctl status minecraft.service"
        warn "Check logs:   journalctl -u minecraft.service -f"
    fi
fi

# ============================================================
# Step 10: Deployment summary
# ============================================================
step "Deployment summary"

echo "" >&2
echo "========================================" >&2
echo "  GSD Minecraft Deployment Summary" >&2
echo "========================================" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    echo "  Mode:                DRY-RUN (no changes made)" >&2
else
    echo "  Mode:                LIVE" >&2
fi

echo "" >&2
echo "  --- Versions ---" >&2
echo "  Fabric installer:    v${FABRIC_INSTALLER_VERSION}" >&2
echo "  Minecraft:           ${MINECRAFT_VERSION}" >&2
echo "  Fabric loader:       ${FABRIC_LOADER_VERSION}" >&2
echo "" >&2
echo "  --- Server ---" >&2
echo "  Server JAR:          ${SERVER_JAR}" >&2
echo "  Server directory:    ${MINECRAFT_HOME}/server" >&2
echo "  EULA accepted:       ${MINECRAFT_EULA}" >&2
echo "" >&2
echo "  --- JVM ---" >&2
echo "  Heap:                ${JVM_HEAP_MIN_MB}MB - ${JVM_HEAP_MAX_MB}MB" >&2
echo "  GC type:             ${GC_TYPE}" >&2
echo "  GC flags:            ${GC_FLAGS}" >&2
echo "  Extra flags:         ${EXTRA_JVM_FLAGS}" >&2
echo "  JVM flags file:      ${JVM_FLAGS_PATH}" >&2
echo "" >&2
echo "  --- Network ---" >&2
echo "  Game port:           ${MINECRAFT_PORT}/tcp" >&2
echo "  RCON port:           ${RCON_PORT}/tcp" >&2
echo "  Interface:           ${MGMT_INTERFACE}" >&2
echo "" >&2
echo "  --- Files deployed ---" >&2
echo "  JVM flags:           ${JVM_FLAGS_PATH}" >&2
echo "  systemd service:     /etc/systemd/system/minecraft.service" >&2
echo "  Server directory:    ${MINECRAFT_HOME}/server/" >&2

if [[ "${DRY_RUN}" != true ]]; then
    echo "" >&2
    svc_status=$(target_cmd "systemctl is-active minecraft.service 2>/dev/null" || echo "unknown")
    echo "  --- Service status ---" >&2
    echo "  minecraft.service:   ${svc_status}" >&2

    svc_enabled=$(target_cmd "systemctl is-enabled minecraft.service 2>/dev/null" || echo "unknown")
    echo "  Start on boot:       ${svc_enabled}" >&2

    # Show PID and memory if running
    if [[ "${svc_status}" == "active" ]]; then
        svc_pid=$(target_cmd "systemctl show minecraft.service -p MainPID --value 2>/dev/null" || echo "unknown")
        echo "  Server PID:          ${svc_pid}" >&2
        if [[ "${svc_pid}" != "unknown" ]] && [[ "${svc_pid}" != "0" ]]; then
            svc_mem=$(target_cmd "ps -o rss= -p ${svc_pid} 2>/dev/null" || echo "unknown")
            if [[ "${svc_mem}" != "unknown" ]]; then
                svc_mem_mb=$((svc_mem / 1024))
                echo "  Memory usage:        ${svc_mem_mb}MB (RSS)" >&2
            fi
        fi
    fi
fi

echo "" >&2
echo "  --- Management commands ---" >&2

if [[ "${LOCAL_DEPLOY}" == true ]]; then
    echo "  Status:    systemctl status minecraft" >&2
    echo "  Logs:      journalctl -u minecraft -f" >&2
    echo "  Stop:      sudo systemctl stop minecraft" >&2
    echo "  Restart:   sudo systemctl restart minecraft" >&2
else
    echo "  Status:    ssh ${TARGET_HOST} systemctl status minecraft" >&2
    echo "  Logs:      ssh ${TARGET_HOST} journalctl -u minecraft -f" >&2
    echo "  Stop:      ssh ${TARGET_HOST} sudo systemctl stop minecraft" >&2
    echo "  Restart:   ssh ${TARGET_HOST} sudo systemctl restart minecraft" >&2
fi

echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    ok "Dry-run complete. Review the steps above, then re-run without --dry-run."
else
    ok "Minecraft Fabric server deployment complete!"
fi

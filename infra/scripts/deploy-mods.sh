#!/usr/bin/env bash
# deploy-mods.sh -- Fabric mod deployment orchestrator
#
# Downloads version-pinned Fabric API and Syncmatica jars from Modrinth,
# verifies SHA-256 checksums, generates a mod manifest YAML, configures
# Syncmatica, and sets correct ownership.
#
# Orchestrates the complete mod deployment:
#   1. Validate prerequisites (curl, sha256sum, jq, server directory)
#   2. Download Fabric API from Modrinth
#   3. Download Syncmatica from Modrinth
#   4. Configure Syncmatica
#   5. Generate mod manifest
#   6. Set ownership and permissions
#   7. Verify installation
#
# Requirements satisfied:
#   MC-04: Fabric API and Syncmatica installed with version-pinned manifest
#   MC-05: Mod manifest YAML records installed versions, checksums, and sources
#
# Usage: deploy-mods.sh --local-values PATH [--server-dir PATH] [--dry-run] [--force] [--help]
#
# Exit codes:
#   0 -- Success (mods deployed)
#   1 -- Prerequisite or validation failure
#   2 -- Deployment step failure

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Template locations (relative to project root) ---
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TEMPLATE_DIR="${PROJECT_ROOT}/infra/templates/minecraft"
SYNCMATICA_CONFIG_TEMPLATE="${TEMPLATE_DIR}/syncmatica-server.properties.template"

# --- Defaults ---
LOCAL_VALUES=""
SERVER_DIR="/opt/minecraft/server"
DRY_RUN=false
FORCE=false
STEP_NUM=0

# --- Modrinth project IDs ---
FABRIC_API_PROJECT_ID="P7dR8mSH"
SYNCMATICA_PROJECT_ID="oNMIuGg5"

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
    echo -e "${BOLD}[Step ${STEP_NUM}/7]${NC} $*" >&2
    echo -e "${BOLD}$(printf '%.0s-' {1..60})${NC}" >&2
}

dry_run_cmd() {
    if [[ "${DRY_RUN}" == true ]]; then
        echo -e "  ${YELLOW}[DRY-RUN]${NC} $*" >&2
        return 0
    fi
    return 1
}

# --- Parse a single key from a flat local-values YAML file ---
# Usage: val=$(read_value "key_name")
read_value() {
    local key="$1"
    local val
    val=$(grep -E "^[[:space:]]*${key}[[:space:]]*:" "${LOCAL_VALUES}" 2>/dev/null | head -1 | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//;s/"[[:space:]]*$//' | sed 's/[[:space:]]*$//')
    echo "${val}"
}

# --- Read a required value, dying if not found ---
read_required_value() {
    local key="$1"
    local val
    val=$(read_value "${key}")
    if [[ -z "${val}" ]]; then
        die "Required key '${key}' not found in ${LOCAL_VALUES}"
    fi
    echo "${val}"
}

# --- Read a value with a default fallback ---
read_value_or_default() {
    local key="$1"
    local default="$2"
    local val
    val=$(read_value "${key}")
    if [[ -z "${val}" ]]; then
        echo "${default}"
    else
        echo "${val}"
    fi
}

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} --local-values PATH [OPTIONS]

Fabric mod deployment orchestrator. Downloads version-pinned Fabric API
and Syncmatica jars from Modrinth, verifies SHA-256 checksums, generates
a mod manifest YAML, and configures Syncmatica.

Required:
  --local-values PATH   Path to local-values YAML with mod versions,
                        checksums, and Syncmatica settings

Options:
  --server-dir PATH     Minecraft server root directory
                        (default: /opt/minecraft/server)
  --dry-run             Show what would be done without downloading or installing
  --force               Re-download even if jars already exist with correct checksums
  --help                Show this help message

Deployment Steps:
  1. Validate prerequisites (curl, sha256sum, server directory)
  2. Download Fabric API from Modrinth (with SHA-256 verification)
  3. Download Syncmatica from Modrinth (with SHA-256 verification)
  4. Configure Syncmatica (render server properties from template)
  5. Generate mod manifest (mod-manifest.yaml)
  6. Set ownership and permissions
  7. Verify installation

Local-values keys:
  minecraft_version           Minecraft game version (e.g., 1.21.4)
  fabric_api_version          Fabric API version (e.g., 0.114.0+1.21.4)
  fabric_api_sha256           Expected SHA-256 hash of the Fabric API jar
  syncmatica_version          Syncmatica version (e.g., 1.4.2)
  syncmatica_sha256           Expected SHA-256 hash of the Syncmatica jar
  syncmatica_max_schematic_size_kb  Max schematic size in KB (default: 10240)
  syncmatica_allow_sharing    Allow schematic sharing (default: true)
  modrinth_base_url           Modrinth API base URL (default: https://api.modrinth.com/v2)

Safety Features:
  - SHA-256 checksum verification before installing any jar
  - Idempotent: skips download if jar exists with correct checksum (unless --force)
  - Downloads to temp file first, moves only after verification
  - NEVER installs a jar with mismatched checksum

Examples:
  # Full deployment
  sudo ${SCRIPT_NAME} --local-values infra/local/syncmatica.local-values

  # Preview without downloading
  ${SCRIPT_NAME} --local-values infra/local/syncmatica.local-values --dry-run

  # Custom server directory
  sudo ${SCRIPT_NAME} --local-values infra/local/syncmatica.local-values --server-dir /srv/minecraft

  # Force re-download
  sudo ${SCRIPT_NAME} --local-values infra/local/syncmatica.local-values --force
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --local-values)
            LOCAL_VALUES="${2:?'--local-values requires a path argument'}"
            shift 2
            ;;
        --server-dir)
            SERVER_DIR="${2:?'--server-dir requires a path argument'}"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
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

# --- Load configuration from local-values ---
MINECRAFT_VERSION=$(read_required_value "minecraft_version")
FABRIC_API_VERSION=$(read_required_value "fabric_api_version")
FABRIC_API_SHA256=$(read_required_value "fabric_api_sha256")
SYNCMATICA_VERSION=$(read_required_value "syncmatica_version")
SYNCMATICA_SHA256=$(read_required_value "syncmatica_sha256")
SYNCMATICA_MAX_SCHEMATIC_SIZE_KB=$(read_value_or_default "syncmatica_max_schematic_size_kb" "10240")
SYNCMATICA_ALLOW_SHARING=$(read_value_or_default "syncmatica_allow_sharing" "true")
MODRINTH_BASE_URL=$(read_value_or_default "modrinth_base_url" "https://api.modrinth.com/v2")

# --- Derived paths ---
MODS_DIR="${SERVER_DIR}/mods"
CONFIG_DIR="${SERVER_DIR}/config/syncmatica"
MANIFEST_PATH="${SERVER_DIR}/mod-manifest.yaml"

# --- User-Agent for Modrinth API etiquette ---
USER_AGENT="GSD-Minecraft-ModDeployer/1.0 (github.com/gsd-skill-creator)"

info "Mod Deployment Configuration"
info "  Local values:       ${LOCAL_VALUES}"
info "  Server directory:   ${SERVER_DIR}"
info "  Mods directory:     ${MODS_DIR}"
info "  Minecraft version:  ${MINECRAFT_VERSION}"
info "  Fabric API:         ${FABRIC_API_VERSION}"
info "  Syncmatica:         ${SYNCMATICA_VERSION}"
info "  Modrinth API:       ${MODRINTH_BASE_URL}"

if [[ "${DRY_RUN}" == true ]]; then
    echo "" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
    echo -e "${YELLOW}  DRY-RUN MODE -- No changes will be made${NC}" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
fi

# --- Detect jq availability ---
HAS_JQ=false
if command -v jq &>/dev/null; then
    HAS_JQ=true
fi

# --- Helper: Query Modrinth API for a mod's download URL and hash ---
# Usage: modrinth_resolve PROJECT_ID VERSION
# Sets: RESOLVED_URL, RESOLVED_FILENAME, RESOLVED_SHA256
modrinth_resolve() {
    local project_id="$1"
    local target_version="$2"

    RESOLVED_URL=""
    RESOLVED_FILENAME=""
    RESOLVED_SHA256=""

    local api_url="${MODRINTH_BASE_URL}/project/${project_id}/version"
    local query_params="game_versions=%5B%22${MINECRAFT_VERSION}%22%5D&loaders=%5B%22fabric%22%5D"
    local full_url="${api_url}?${query_params}"

    info "  Querying Modrinth API: ${full_url}"

    local response
    response=$(curl -fsSL -H "User-Agent: ${USER_AGENT}" "${full_url}" 2>/dev/null) || {
        warn "  Modrinth API request failed"
        return 1
    }

    if [[ "${HAS_JQ}" != true ]]; then
        warn "  jq not available -- cannot parse Modrinth API response"
        warn "  Checksum verification will rely on local-values SHA-256 only"
        return 1
    fi

    # Find the version entry matching target_version
    local version_data
    version_data=$(echo "${response}" | jq -r --arg ver "${target_version}" '
        .[] | select(.version_number == $ver) | {
            url: .files[0].url,
            filename: .files[0].filename,
            sha256: .files[0].hashes.sha256
        }
    ' 2>/dev/null) || {
        warn "  Could not find version ${target_version} in Modrinth response"
        return 1
    }

    RESOLVED_URL=$(echo "${version_data}" | jq -r '.url' 2>/dev/null)
    RESOLVED_FILENAME=$(echo "${version_data}" | jq -r '.filename' 2>/dev/null)
    RESOLVED_SHA256=$(echo "${version_data}" | jq -r '.sha256' 2>/dev/null)

    if [[ -z "${RESOLVED_URL}" ]] || [[ "${RESOLVED_URL}" == "null" ]]; then
        warn "  Could not resolve download URL from Modrinth API"
        return 1
    fi

    ok "  Resolved from Modrinth: ${RESOLVED_FILENAME}"
    info "  Download URL: ${RESOLVED_URL}"
    if [[ -n "${RESOLVED_SHA256}" ]] && [[ "${RESOLVED_SHA256}" != "null" ]]; then
        info "  API SHA-256:  ${RESOLVED_SHA256}"
    fi

    return 0
}

# --- Helper: Download, verify, and install a mod jar ---
# Usage: install_mod MOD_NAME PROJECT_ID VERSION EXPECTED_SHA256
install_mod() {
    local mod_name="$1"
    local project_id="$2"
    local mod_version="$3"
    local expected_sha256="$4"

    info "Processing ${mod_name} v${mod_version}..."

    # Try to resolve from Modrinth API
    local download_url=""
    local resolved_filename=""
    local api_sha256=""

    if modrinth_resolve "${project_id}" "${mod_version}"; then
        download_url="${RESOLVED_URL}"
        resolved_filename="${RESOLVED_FILENAME}"
        api_sha256="${RESOLVED_SHA256}"
    fi

    # Check if already installed with correct checksum
    if [[ -n "${resolved_filename}" ]] && [[ -f "${MODS_DIR}/${resolved_filename}" ]] && [[ "${FORCE}" != true ]]; then
        local existing_hash
        existing_hash=$(sha256sum "${MODS_DIR}/${resolved_filename}" | awk '{print $1}')
        if [[ "${existing_hash}" == "${expected_sha256}" ]]; then
            ok "  ${mod_name} already installed with correct checksum: ${resolved_filename}"
            # Set output variables for manifest generation
            eval "MOD_${mod_name^^}_FILENAME=${resolved_filename}"
            eval "MOD_${mod_name^^}_URL=${download_url}"
            return 0
        else
            info "  Existing jar checksum mismatch -- re-downloading"
        fi
    fi

    # Also check by glob pattern if we don't have the resolved filename
    if [[ -z "${resolved_filename}" ]] && [[ "${FORCE}" != true ]]; then
        local existing_jar
        existing_jar=$(find "${MODS_DIR}" -maxdepth 1 -name "${mod_name}*.jar" -o -name "${mod_name//-/_}*.jar" 2>/dev/null | head -1)
        if [[ -n "${existing_jar}" ]]; then
            local existing_hash
            existing_hash=$(sha256sum "${existing_jar}" | awk '{print $1}')
            if [[ "${existing_hash}" == "${expected_sha256}" ]]; then
                resolved_filename="$(basename "${existing_jar}")"
                ok "  ${mod_name} already installed with correct checksum: ${resolved_filename}"
                eval "MOD_${mod_name^^}_FILENAME=${resolved_filename}"
                eval "MOD_${mod_name^^}_URL=unknown"
                return 0
            fi
        fi
    fi

    if [[ -z "${download_url}" ]]; then
        die "Cannot determine download URL for ${mod_name} v${mod_version}. Ensure jq is installed and Modrinth API is reachable."
    fi

    # Download to temp file
    local tmp_jar
    tmp_jar=$(mktemp "${STAGING_DIR}/${mod_name}.XXXXXX.jar")

    info "  Downloading ${mod_name}..."
    info "  URL: ${download_url}"

    if ! curl -fSL -H "User-Agent: ${USER_AGENT}" "${download_url}" -o "${tmp_jar}" 2>&1; then
        error "  Failed to download ${mod_name}"
        error "  URL: ${download_url}"
        error "  Check network connectivity and try again"
        die "Download failed for ${mod_name}"
    fi

    # Verify SHA-256 checksum
    local actual_hash
    actual_hash=$(sha256sum "${tmp_jar}" | awk '{print $1}')

    info "  Verifying checksum..."
    info "  Expected (local-values): ${expected_sha256}"
    info "  Actual:                  ${actual_hash}"

    if [[ -n "${api_sha256}" ]] && [[ "${api_sha256}" != "null" ]] && [[ "${api_sha256}" != "${expected_sha256}" ]]; then
        warn "  Note: Modrinth API hash (${api_sha256}) differs from local-values"
        warn "  Using local-values hash as authoritative"
    fi

    if [[ "${actual_hash}" != "${expected_sha256}" ]]; then
        error "  CHECKSUM MISMATCH for ${mod_name}!"
        error "  Expected: ${expected_sha256}"
        error "  Actual:   ${actual_hash}"
        error "  The downloaded file has NOT been installed."
        error "  Possible causes:"
        error "    - Wrong version specified in local-values"
        error "    - Corrupted download"
        error "    - SHA-256 in local-values needs updating"
        rm -f "${tmp_jar}"
        die "Checksum verification failed for ${mod_name}. Aborting."
    fi

    ok "  Checksum verified: ${actual_hash}"

    # Determine filename
    if [[ -z "${resolved_filename}" ]]; then
        resolved_filename="${mod_name}-${mod_version}.jar"
    fi

    # Move verified jar to mods directory
    mv "${tmp_jar}" "${MODS_DIR}/${resolved_filename}"
    ok "  Installed: ${MODS_DIR}/${resolved_filename}"

    # Set output variables for manifest generation (use simple variable names)
    eval "MOD_${mod_name^^}_FILENAME=${resolved_filename}"
    eval "MOD_${mod_name^^}_URL=${download_url}"
}

# ============================================================
# Step 1: Validate prerequisites
# ============================================================
step "Validate prerequisites"

prereq_ok=true

# Check for curl
if command -v curl &>/dev/null; then
    ok "curl found: $(curl --version 2>/dev/null | head -1)"
else
    error "curl not installed. Install with: dnf install curl"
    prereq_ok=false
fi

# Check for sha256sum
if command -v sha256sum &>/dev/null; then
    ok "sha256sum found"
else
    error "sha256sum not installed."
    prereq_ok=false
fi

# Check for jq (optional but recommended)
if [[ "${HAS_JQ}" == true ]]; then
    ok "jq found: $(jq --version 2>/dev/null)"
else
    warn "jq not installed -- Modrinth API parsing will be limited"
    warn "Install with: dnf install jq"
fi

# Check server directory (or dry-run allows missing)
if [[ "${DRY_RUN}" == true ]]; then
    if [[ ! -d "${SERVER_DIR}" ]]; then
        warn "Server directory does not exist: ${SERVER_DIR} (allowed in dry-run)"
    else
        ok "Server directory exists: ${SERVER_DIR}"
    fi
else
    if [[ ! -d "${SERVER_DIR}" ]]; then
        error "Server directory does not exist: ${SERVER_DIR}"
        error "Deploy the Minecraft server first (deploy-minecraft.sh)"
        prereq_ok=false
    else
        ok "Server directory exists: ${SERVER_DIR}"
    fi
fi

# Create mods directory if needed
if [[ "${DRY_RUN}" != true ]]; then
    if [[ ! -d "${MODS_DIR}" ]]; then
        info "Creating mods directory: ${MODS_DIR}"
        mkdir -p "${MODS_DIR}"
        ok "Mods directory created: ${MODS_DIR}"
    else
        ok "Mods directory exists: ${MODS_DIR}"
    fi
fi

# Create Syncmatica config directory if needed
if [[ "${DRY_RUN}" != true ]]; then
    if [[ ! -d "${CONFIG_DIR}" ]]; then
        info "Creating Syncmatica config directory: ${CONFIG_DIR}"
        mkdir -p "${CONFIG_DIR}"
        ok "Syncmatica config directory created: ${CONFIG_DIR}"
    else
        ok "Syncmatica config directory exists: ${CONFIG_DIR}"
    fi
fi

if [[ "${prereq_ok}" != true ]]; then
    die "Prerequisites not met. Fix the issues above and retry."
fi

ok "All prerequisites met"

# --- Create staging directory ---
STAGING_DIR=$(mktemp -d /tmp/deploy-mods.XXXXXX)
trap 'rm -rf "${STAGING_DIR}"' EXIT

# ============================================================
# Step 2: Download Fabric API
# ============================================================
step "Download Fabric API"

# Variables to track installed filenames/URLs for manifest
MOD_FABRIC_API_FILENAME=""
MOD_FABRIC_API_URL=""

if dry_run_cmd "Download Fabric API v${FABRIC_API_VERSION} from Modrinth (project: ${FABRIC_API_PROJECT_ID})"; then
    dry_run_cmd "Verify SHA-256: ${FABRIC_API_SHA256}"
    dry_run_cmd "Install to ${MODS_DIR}/"
    MOD_FABRIC_API_FILENAME="fabric-api-${FABRIC_API_VERSION}.jar"
    MOD_FABRIC_API_URL="https://cdn.modrinth.com/data/${FABRIC_API_PROJECT_ID}/versions/..."
else
    install_mod "fabric-api" "${FABRIC_API_PROJECT_ID}" "${FABRIC_API_VERSION}" "${FABRIC_API_SHA256}"
fi

ok "Fabric API step complete"

# ============================================================
# Step 3: Download Syncmatica
# ============================================================
step "Download Syncmatica"

MOD_SYNCMATICA_FILENAME=""
MOD_SYNCMATICA_URL=""

if dry_run_cmd "Download Syncmatica v${SYNCMATICA_VERSION} from Modrinth (project: ${SYNCMATICA_PROJECT_ID})"; then
    dry_run_cmd "Verify SHA-256: ${SYNCMATICA_SHA256}"
    dry_run_cmd "Install to ${MODS_DIR}/"
    MOD_SYNCMATICA_FILENAME="syncmatica-${SYNCMATICA_VERSION}.jar"
    MOD_SYNCMATICA_URL="https://cdn.modrinth.com/data/${SYNCMATICA_PROJECT_ID}/versions/..."
else
    install_mod "syncmatica" "${SYNCMATICA_PROJECT_ID}" "${SYNCMATICA_VERSION}" "${SYNCMATICA_SHA256}"
fi

ok "Syncmatica step complete"

# ============================================================
# Step 4: Configure Syncmatica
# ============================================================
step "Configure Syncmatica"

SYNCMATICA_CONFIG_PATH="${CONFIG_DIR}/syncmatica-server.properties"

if dry_run_cmd "Render Syncmatica config to ${SYNCMATICA_CONFIG_PATH}"; then
    dry_run_cmd "  max_schematic_size=${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB}"
    dry_run_cmd "  allow_sharing=${SYNCMATICA_ALLOW_SHARING}"
else
    # Check if config already exists and matches
    config_needs_update=true
    if [[ -f "${SYNCMATICA_CONFIG_PATH}" ]]; then
        existing_max=$(grep -E "^max_schematic_size=" "${SYNCMATICA_CONFIG_PATH}" 2>/dev/null | sed 's/^[^=]*=//')
        existing_sharing=$(grep -E "^allow_sharing=" "${SYNCMATICA_CONFIG_PATH}" 2>/dev/null | sed 's/^[^=]*=//')
        if [[ "${existing_max}" == "${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB}" ]] && [[ "${existing_sharing}" == "${SYNCMATICA_ALLOW_SHARING}" ]]; then
            ok "Syncmatica config already configured with correct values"
            config_needs_update=false
        else
            info "Syncmatica config exists but values differ -- updating"
        fi
    fi

    if [[ "${config_needs_update}" == true ]]; then
        # Render from template if available, otherwise write directly
        if [[ -f "${SYNCMATICA_CONFIG_TEMPLATE}" ]]; then
            info "Rendering Syncmatica config from template..."
            sed -e "s/\${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB}/${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB}/g" \
                -e "s/\${SYNCMATICA_ALLOW_SHARING}/${SYNCMATICA_ALLOW_SHARING}/g" \
                "${SYNCMATICA_CONFIG_TEMPLATE}" > "${SYNCMATICA_CONFIG_PATH}"
        else
            warn "Template not found: ${SYNCMATICA_CONFIG_TEMPLATE}"
            info "Writing Syncmatica config directly..."
            cat > "${SYNCMATICA_CONFIG_PATH}" <<CONFEOF
# Syncmatica Server Configuration
# Generated by deploy-mods.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Maximum schematic file size in kilobytes
max_schematic_size=${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB}

# Whether players can share schematics with each other
allow_sharing=${SYNCMATICA_ALLOW_SHARING}
CONFEOF
        fi
        ok "Syncmatica config written to: ${SYNCMATICA_CONFIG_PATH}"
    fi
fi

ok "Syncmatica configuration complete"

# ============================================================
# Step 5: Generate mod manifest
# ============================================================
step "Generate mod manifest"

INSTALLED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if dry_run_cmd "Generate ${MANIFEST_PATH}"; then
    dry_run_cmd "  minecraft_version: ${MINECRAFT_VERSION}"
    dry_run_cmd "  fabric-api: v${FABRIC_API_VERSION}"
    dry_run_cmd "  syncmatica: v${SYNCMATICA_VERSION}"
else
    cat > "${MANIFEST_PATH}" <<MANIFESTEOF
# GSD Minecraft Mod Manifest
# Generated by: infra/scripts/deploy-mods.sh
# This file records installed mod versions for verification and updates.
# Do not edit manually -- re-run deploy-mods.sh to update.

generated_at: "${INSTALLED_AT}"
minecraft_version: "${MINECRAFT_VERSION}"
loader: fabric

mods:
  - name: fabric-api
    version: "${FABRIC_API_VERSION}"
    filename: "${MOD_FABRIC_API_FILENAME}"
    sha256: "${FABRIC_API_SHA256}"
    modrinth_project_id: "${FABRIC_API_PROJECT_ID}"
    modrinth_download_url: "${MOD_FABRIC_API_URL}"
    installed_at: "${INSTALLED_AT}"
  - name: syncmatica
    version: "${SYNCMATICA_VERSION}"
    filename: "${MOD_SYNCMATICA_FILENAME}"
    sha256: "${SYNCMATICA_SHA256}"
    modrinth_project_id: "${SYNCMATICA_PROJECT_ID}"
    modrinth_download_url: "${MOD_SYNCMATICA_URL}"
    installed_at: "${INSTALLED_AT}"
MANIFESTEOF

    ok "Mod manifest generated: ${MANIFEST_PATH}"
fi

# ============================================================
# Step 6: Set ownership and permissions
# ============================================================
step "Set ownership and permissions"

if dry_run_cmd "chown -R minecraft:minecraft ${MODS_DIR}/"; then
    dry_run_cmd "chown -R minecraft:minecraft ${CONFIG_DIR}/"
    dry_run_cmd "chmod 644 ${MODS_DIR}/*.jar"
    dry_run_cmd "chmod 644 ${MANIFEST_PATH}"
else
    # Only set ownership if running as root
    if [[ $EUID -eq 0 ]]; then
        info "Setting ownership to minecraft:minecraft..."
        chown -R minecraft:minecraft "${MODS_DIR}/"
        chown -R minecraft:minecraft "${CONFIG_DIR}/"
        chown minecraft:minecraft "${MANIFEST_PATH}"
        ok "Ownership set"
    else
        warn "Not running as root -- skipping ownership changes"
        warn "Run with sudo to set minecraft:minecraft ownership"
    fi

    # Set permissions on jar files
    info "Setting file permissions..."
    chmod 644 "${MODS_DIR}"/*.jar 2>/dev/null || true
    chmod 644 "${MANIFEST_PATH}"
    chmod 644 "${SYNCMATICA_CONFIG_PATH}" 2>/dev/null || true
    ok "Permissions set"
fi

ok "Ownership and permissions complete"

# ============================================================
# Step 7: Verify installation
# ============================================================
step "Verify installation"

if dry_run_cmd "Verify installed mods and manifest"; then
    :
else
    verify_ok=true

    # List all jars in mods/ with checksums
    info "Installed mods:"
    if ls "${MODS_DIR}"/*.jar &>/dev/null; then
        for jar in "${MODS_DIR}"/*.jar; do
            jar_name=$(basename "${jar}")
            jar_hash=$(sha256sum "${jar}" | awk '{print $1}')
            jar_size=$(stat -c%s "${jar}" 2>/dev/null || stat -f%z "${jar}" 2>/dev/null || echo "unknown")
            ok "  ${jar_name} (${jar_size} bytes, sha256: ${jar_hash})"
        done
    else
        error "  No jar files found in ${MODS_DIR}/"
        verify_ok=false
    fi

    # Verify manifest exists and contains expected entries
    if [[ -f "${MANIFEST_PATH}" ]]; then
        ok "  Manifest found: ${MANIFEST_PATH}"
        if grep -q "fabric-api" "${MANIFEST_PATH}"; then
            ok "  Manifest contains fabric-api entry"
        else
            error "  Manifest missing fabric-api entry"
            verify_ok=false
        fi
        if grep -q "syncmatica" "${MANIFEST_PATH}"; then
            ok "  Manifest contains syncmatica entry"
        else
            error "  Manifest missing syncmatica entry"
            verify_ok=false
        fi
    else
        error "  Manifest not found: ${MANIFEST_PATH}"
        verify_ok=false
    fi

    # Verify Syncmatica config
    if [[ -f "${SYNCMATICA_CONFIG_PATH}" ]]; then
        ok "  Syncmatica config found: ${SYNCMATICA_CONFIG_PATH}"
    else
        error "  Syncmatica config not found: ${SYNCMATICA_CONFIG_PATH}"
        verify_ok=false
    fi

    if [[ "${verify_ok}" != true ]]; then
        error "Verification found issues -- check the errors above"
    fi
fi

# ============================================================
# Deployment Summary
# ============================================================
echo "" >&2
echo "========================================" >&2
echo "  GSD Mod Deployment Summary" >&2
echo "========================================" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    echo "  Mode:               DRY-RUN (no changes made)" >&2
else
    echo "  Mode:               LIVE" >&2
fi

echo "" >&2
echo "  --- Versions ---" >&2
echo "  Minecraft:          ${MINECRAFT_VERSION}" >&2
echo "  Fabric API:         ${FABRIC_API_VERSION}" >&2
echo "  Syncmatica:         ${SYNCMATICA_VERSION}" >&2
echo "" >&2
echo "  --- Files ---" >&2
echo "  Mods directory:     ${MODS_DIR}/" >&2
echo "  Fabric API jar:     ${MOD_FABRIC_API_FILENAME}" >&2
echo "  Syncmatica jar:     ${MOD_SYNCMATICA_FILENAME}" >&2
echo "  Mod manifest:       ${MANIFEST_PATH}" >&2
echo "  Syncmatica config:  ${CONFIG_DIR}/syncmatica-server.properties" >&2
echo "" >&2
echo "  --- Syncmatica Settings ---" >&2
echo "  Max schematic size: ${SYNCMATICA_MAX_SCHEMATIC_SIZE_KB} KB" >&2
echo "  Allow sharing:      ${SYNCMATICA_ALLOW_SHARING}" >&2
echo "" >&2
echo "  --- Next steps ---" >&2
echo "  1. Restart the Minecraft server to load the new mods" >&2
echo "  2. Check server logs for mod loading confirmation" >&2
echo "  3. Run check-mod-updates.sh to verify update availability" >&2
echo "" >&2

if [[ "${DRY_RUN}" == true ]]; then
    ok "Dry-run complete. Review the steps above, then re-run without --dry-run."
else
    ok "Mod deployment complete!"
fi

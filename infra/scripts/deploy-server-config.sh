#!/usr/bin/env bash
# deploy-server-config.sh -- Render and stage Minecraft server configuration
#
# Reads minecraft.server settings from local-values.yaml, generates (or reads)
# a random RCON password from a gitignored secrets file, renders
# server.properties from template via render-pxe-menu.sh, and copies the
# initial whitelist.json template to the output staging directory.
#
# The rendered output is staged locally. Actual deployment to the Minecraft VM
# is a separate SCP/rsync step (or handled by deploy-minecraft.sh --target-host).
#
# Requirements satisfied:
#   MC-06: server.properties fully templated (creative, peaceful, command blocks)
#   MC-07: Whitelist enforcement (white-list=true, enforce-whitelist=true)
#   MC-08: RCON enabled with random password in gitignored secrets file
#
# Usage: deploy-server-config.sh [--values PATH] [--secrets PATH] [--output-dir PATH] [--help]
#
# Exit codes:
#   0 -- Success (server.properties rendered and staged)
#   1 -- Error (missing files, rendering failure)
#   2 -- Usage error

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# --- Template locations ---
TEMPLATE_DIR="${PROJECT_ROOT}/infra/templates/minecraft"
SERVER_PROPERTIES_TEMPLATE="${TEMPLATE_DIR}/server.properties.template"
WHITELIST_TEMPLATE="${TEMPLATE_DIR}/whitelist.json.template"

# --- Script locations ---
RENDER_SCRIPT="${SCRIPT_DIR}/render-pxe-menu.sh"

# --- Defaults ---
VALUES_FILE=""
SECRETS_FILE=""
OUTPUT_DIR=""

DEFAULT_VALUES="${PROJECT_ROOT}/infra/local/local-values.yaml"
DEFAULT_SECRETS="${PROJECT_ROOT}/infra/local/minecraft-secrets.yaml"
DEFAULT_OUTPUT_DIR="${PROJECT_ROOT}/infra/output/minecraft"

# --- Colors (if terminal supports them) ---
if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# --- Helper functions (log to stderr) ---
info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [--values PATH] [--secrets PATH] [--output-dir PATH] [--help]

Render Minecraft server.properties from template, generating an RCON password
if needed, and stage configuration files for deployment.

Options:
  --values PATH       Path to local-values.yaml (default: infra/local/local-values.yaml)
  --secrets PATH      Path to minecraft-secrets.yaml (default: infra/local/minecraft-secrets.yaml)
  --output-dir PATH   Staging directory for rendered output (default: infra/output/minecraft/)
  --help              Show this help message

Configuration Flow:
  1. Read tier-adaptive settings from local-values.yaml (minecraft.server section)
  2. Read network ports from local-values.yaml (network section)
  3. Generate or read RCON password from gitignored secrets file
  4. Create merged values file for template rendering
  5. Render server.properties via render-pxe-menu.sh
  6. Copy whitelist.json template to staging directory

Template Variables (from local-values.yaml):
  minecraft.server.view_distance         -> \${VIEW_DISTANCE}
  minecraft.server.simulation_distance   -> \${SIMULATION_DISTANCE}
  minecraft.server.max_players           -> \${MAX_PLAYERS}
  minecraft.server.network_compression_threshold -> \${NETWORK_COMPRESSION_THRESHOLD}
  minecraft.server.entity_broadcast_range -> \${ENTITY_BROADCAST_RANGE}
  network.game_port                      -> \${SERVER_PORT}
  network.rcon_port                      -> \${RCON_PORT}
  (from secrets) rcon_password           -> \${RCON_PASSWORD}

Output Files:
  <output-dir>/server.properties   Fully rendered server configuration
  <output-dir>/whitelist.json      Initial empty whitelist

Examples:
  # Render with defaults
  ${SCRIPT_NAME}

  # Custom values and output
  ${SCRIPT_NAME} --values /path/to/local-values.yaml --output-dir /tmp/mc-config

  # View rendered output without deploying
  ${SCRIPT_NAME} && cat infra/output/minecraft/server.properties

Deployment:
  After rendering, copy the staged files to the Minecraft server:
    scp infra/output/minecraft/server.properties gsd@mc-server-01:/opt/minecraft/server/
    scp infra/output/minecraft/whitelist.json gsd@mc-server-01:/opt/minecraft/server/
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --values)
            VALUES_FILE="${2:?'--values requires a path argument'}"
            shift 2
            ;;
        --secrets)
            SECRETS_FILE="${2:?'--secrets requires a path argument'}"
            shift 2
            ;;
        --output-dir)
            OUTPUT_DIR="${2:?'--output-dir requires a path argument'}"
            shift 2
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

# --- Apply defaults ---
VALUES_FILE="${VALUES_FILE:-${DEFAULT_VALUES}}"
SECRETS_FILE="${SECRETS_FILE:-${DEFAULT_SECRETS}}"
OUTPUT_DIR="${OUTPUT_DIR:-${DEFAULT_OUTPUT_DIR}}"

info "Minecraft Server Configuration Renderer"
info "  Values:     ${VALUES_FILE}"
info "  Secrets:    ${SECRETS_FILE}"
info "  Output dir: ${OUTPUT_DIR}"

# --- Validate prerequisites ---
if [[ ! -f "${SERVER_PROPERTIES_TEMPLATE}" ]]; then
    die "Server properties template not found: ${SERVER_PROPERTIES_TEMPLATE}"
fi

if [[ ! -f "${WHITELIST_TEMPLATE}" ]]; then
    die "Whitelist template not found: ${WHITELIST_TEMPLATE}"
fi

if [[ ! -f "${RENDER_SCRIPT}" ]]; then
    die "Template renderer not found: ${RENDER_SCRIPT}"
fi

if [[ ! -f "${VALUES_FILE}" ]]; then
    die "Local values file not found: ${VALUES_FILE}\nRun generate-local-values.sh first."
fi

ok "Prerequisites validated"

# --- Temp file cleanup ---
TMPDIR_WORK=$(mktemp -d /tmp/deploy-server-config.XXXXXX)
trap 'rm -rf "${TMPDIR_WORK}"' EXIT

# ============================================================
# Step 1: Parse minecraft.server settings from local-values.yaml
# ============================================================

info "Reading minecraft.server settings from local-values.yaml..."

# Section-aware YAML parsing (awk-based, established pattern)
section_val() {
    local section="$1"
    local key="$2"
    local file="$3"
    awk -v sect="${section}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Nested subsection parser (section -> subsection -> key)
subsection_val() {
    local section="$1"
    local subsec="$2"
    local key="$3"
    local file="$4"
    awk -v sect="${section}" -v subsec="${subsec}" -v k="${key}" '
        $0 ~ "^"sect":" { in_sect=1; next }
        /^[a-zA-Z]/ && !/^[[:space:]]/ { in_sect=0 }
        in_sect && $0 ~ "^  "subsec":" { in_sub=1; next }
        in_sect && /^  [a-zA-Z]/ && $0 !~ "^    " { in_sub=0 }
        in_sect && in_sub && $0 ~ "^[[:space:]]+"k":" {
            val=$0
            gsub(/^[^:]+:[[:space:]]*/, "", val)
            gsub(/[[:space:]]*#.*/, "", val)
            gsub(/^"/, "", val)
            gsub(/"$/, "", val)
            gsub(/^[[:space:]]+/, "", val)
            gsub(/[[:space:]]+$/, "", val)
            print val
            exit
        }
    ' "${file}"
}

# Read tier-adaptive minecraft.server values
VIEW_DISTANCE="$(subsection_val "minecraft" "server" "view_distance" "${VALUES_FILE}")"
SIMULATION_DISTANCE="$(subsection_val "minecraft" "server" "simulation_distance" "${VALUES_FILE}")"
MAX_PLAYERS="$(subsection_val "minecraft" "server" "max_players" "${VALUES_FILE}")"
NETWORK_COMPRESSION_THRESHOLD="$(subsection_val "minecraft" "server" "network_compression_threshold" "${VALUES_FILE}")"
ENTITY_BROADCAST_RANGE="$(subsection_val "minecraft" "server" "entity_broadcast_range" "${VALUES_FILE}")"

# Read network ports
GAME_PORT="$(section_val "network" "game_port" "${VALUES_FILE}")"
RCON_PORT="$(section_val "network" "rcon_port" "${VALUES_FILE}")"

# Apply safe defaults if values are missing
VIEW_DISTANCE="${VIEW_DISTANCE:-10}"
SIMULATION_DISTANCE="${SIMULATION_DISTANCE:-6}"
MAX_PLAYERS="${MAX_PLAYERS:-5}"
NETWORK_COMPRESSION_THRESHOLD="${NETWORK_COMPRESSION_THRESHOLD:-256}"
ENTITY_BROADCAST_RANGE="${ENTITY_BROADCAST_RANGE:-50}"
GAME_PORT="${GAME_PORT:-25565}"
RCON_PORT="${RCON_PORT:-25575}"

info "  view_distance:                 ${VIEW_DISTANCE}"
info "  simulation_distance:           ${SIMULATION_DISTANCE}"
info "  max_players:                   ${MAX_PLAYERS}"
info "  network_compression_threshold: ${NETWORK_COMPRESSION_THRESHOLD}"
info "  entity_broadcast_range:        ${ENTITY_BROADCAST_RANGE}"
info "  game_port:                     ${GAME_PORT}"
info "  rcon_port:                     ${RCON_PORT}"

ok "Server settings loaded"

# ============================================================
# Step 2: Generate or read RCON password
# ============================================================

info "Resolving RCON password..."

RCON_PASSWORD=""
SECRETS_DIR="$(dirname "${SECRETS_FILE}")"

if [[ -f "${SECRETS_FILE}" ]]; then
    # Read existing password (idempotent -- do not regenerate)
    RCON_PASSWORD="$(section_val "rcon_password" "" "${SECRETS_FILE}" 2>/dev/null || true)"
    # section_val may not work for a top-level key; try simple grep
    if [[ -z "${RCON_PASSWORD}" ]]; then
        RCON_PASSWORD="$(grep -E '^rcon_password:' "${SECRETS_FILE}" 2>/dev/null \
            | head -1 \
            | sed 's/^rcon_password:[[:space:]]*//' \
            | sed 's/^"//;s/"[[:space:]]*$//' \
            | sed 's/[[:space:]]*$//' || true)"
    fi

    if [[ -n "${RCON_PASSWORD}" ]]; then
        ok "RCON password read from existing secrets file"
    else
        warn "Secrets file exists but rcon_password not found, generating new password"
    fi
fi

if [[ -z "${RCON_PASSWORD}" ]]; then
    # Generate a random 24-character alphanumeric password
    RCON_PASSWORD="$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)"

    if [[ ${#RCON_PASSWORD} -lt 24 ]]; then
        # Extremely unlikely but handle gracefully
        die "Failed to generate RCON password (insufficient entropy)"
    fi

    # Ensure secrets directory exists
    mkdir -p "${SECRETS_DIR}"

    # Write secrets file
    cat > "${SECRETS_FILE}" <<SECRETS_EOF
# Minecraft server secrets -- DO NOT COMMIT
# Generated by deploy-server-config.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# This file is gitignored via infra/.gitignore (local/* rule)
# Back up this file separately -- losing the RCON password requires regeneration

rcon_password: "${RCON_PASSWORD}"
SECRETS_EOF

    chmod 600 "${SECRETS_FILE}"

    warn "RCON password generated and stored in ${SECRETS_FILE}"
    warn "This file is gitignored and must be backed up separately"
    ok "RCON password generated (24 chars, alphanumeric)"
fi

# ============================================================
# Step 3: Verify secrets file is gitignored
# ============================================================

info "Verifying secrets file is gitignored..."

INFRA_GITIGNORE="${PROJECT_ROOT}/infra/.gitignore"
secrets_covered=false

if [[ -f "${INFRA_GITIGNORE}" ]]; then
    # Check if infra/local/* is covered by the gitignore
    if grep -qE '^local/\*' "${INFRA_GITIGNORE}" 2>/dev/null || \
       grep -qE '^local/' "${INFRA_GITIGNORE}" 2>/dev/null; then
        secrets_covered=true
        ok "Secrets file covered by infra/.gitignore (local/* rule)"
    fi
fi

if [[ "${secrets_covered}" != true ]]; then
    warn "infra/.gitignore does not appear to cover ${SECRETS_FILE}"
    warn "Ensure infra/local/ is in .gitignore to prevent committing secrets"
fi

# ============================================================
# Step 4: Create merged values file for template rendering
# ============================================================

info "Creating merged values file for template rendering..."

MERGED_VALUES="${TMPDIR_WORK}/server-config.values"

cat > "${MERGED_VALUES}" <<VALUES_EOF
# Merged values for server.properties template rendering
# Generated by deploy-server-config.sh

# Tier-adaptive settings (from local-values.yaml minecraft.server)
view_distance: "${VIEW_DISTANCE}"
simulation_distance: "${SIMULATION_DISTANCE}"
max_players: "${MAX_PLAYERS}"
network_compression_threshold: "${NETWORK_COMPRESSION_THRESHOLD}"
entity_broadcast_range: "${ENTITY_BROADCAST_RANGE}"

# Network (from local-values.yaml network section)
server_port: "${GAME_PORT}"
rcon_port: "${RCON_PORT}"

# Secrets (from minecraft-secrets.yaml)
rcon_password: "${RCON_PASSWORD}"
VALUES_EOF

ok "Merged values file created"

# ============================================================
# Step 5: Render server.properties
# ============================================================

info "Rendering server.properties from template..."

mkdir -p "${OUTPUT_DIR}"

bash "${RENDER_SCRIPT}" \
    --template "${SERVER_PROPERTIES_TEMPLATE}" \
    --values "${MERGED_VALUES}" \
    --output "${OUTPUT_DIR}/server.properties"

ok "server.properties rendered to: ${OUTPUT_DIR}/server.properties"

# ============================================================
# Step 6: Copy whitelist template to output
# ============================================================

info "Copying initial whitelist.json to staging..."

cp "${WHITELIST_TEMPLATE}" "${OUTPUT_DIR}/whitelist.json"

ok "whitelist.json copied to: ${OUTPUT_DIR}/whitelist.json"

# ============================================================
# Summary
# ============================================================

echo "" >&2
echo "========================================" >&2
echo "  Server Configuration Rendered" >&2
echo "========================================" >&2
echo "" >&2
echo "  Output directory: ${OUTPUT_DIR}" >&2
echo "" >&2
echo "  Files:" >&2
echo "    server.properties   Minecraft server configuration" >&2
echo "    whitelist.json      Initial empty whitelist" >&2
echo "" >&2
echo "  Settings:" >&2
echo "    Game mode:          creative (forced)" >&2
echo "    Difficulty:         peaceful" >&2
echo "    Command blocks:     enabled" >&2
echo "    Whitelist:          enforced" >&2
echo "    RCON:               enabled (port ${RCON_PORT})" >&2
echo "    View distance:      ${VIEW_DISTANCE} chunks" >&2
echo "    Simulation dist:    ${SIMULATION_DISTANCE} chunks" >&2
echo "    Max players:        ${MAX_PLAYERS}" >&2
echo "    Entity broadcast:   ${ENTITY_BROADCAST_RANGE}%" >&2
echo "" >&2
echo "  Deployment:" >&2
echo "    scp ${OUTPUT_DIR}/server.properties gsd@mc-server-01:/opt/minecraft/server/" >&2
echo "    scp ${OUTPUT_DIR}/whitelist.json gsd@mc-server-01:/opt/minecraft/server/" >&2
echo "" >&2

ok "Server configuration staging complete"

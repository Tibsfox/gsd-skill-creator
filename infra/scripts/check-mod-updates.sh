#!/usr/bin/env bash
# check-mod-updates.sh -- Read-only mod version checker
#
# Queries the Modrinth API for each mod in the installed mod manifest
# and reports available newer versions. This script NEVER modifies any
# files -- it is purely informational. The operator reviews the output
# and runs deploy-mods.sh with updated local-values to apply upgrades.
#
# Requirements satisfied:
#   MC-05: Update script that checks for newer versions without auto-applying
#
# Usage: check-mod-updates.sh [--manifest PATH] [--minecraft-version VERSION] [--json] [--help]
#
# Exit codes:
#   0 -- All mods up-to-date
#   1 -- Error (network, missing manifest, API failure)
#   2 -- Updates available (useful for scripted checks / cron alerting)

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Defaults ---
MANIFEST_PATH="/opt/minecraft/server/mod-manifest.yaml"
MC_VERSION_OVERRIDE=""
JSON_OUTPUT=false

# --- Modrinth API ---
MODRINTH_BASE_URL="https://api.modrinth.com/v2"
USER_AGENT="GSD-Minecraft-Updater/1.0 (github.com/gsd-skill-creator)"

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
die()   { error "$@"; exit 1; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Read-only mod version checker. Queries the Modrinth API for each mod
in the installed mod manifest and reports available newer versions.

This script NEVER modifies any files. It is purely informational.
Review the output and run deploy-mods.sh with updated local-values
to apply upgrades.

Options:
  --manifest PATH           Path to installed mod manifest
                            (default: /opt/minecraft/server/mod-manifest.yaml)
  --minecraft-version VER   Override Minecraft version for checking
                            (e.g., check what is available for 1.21.5)
  --json                    Output machine-readable JSON instead of table
  --help                    Show this help message

Exit Codes:
  0  All mods are up-to-date
  1  Error (network failure, missing manifest, API error)
  2  Updates are available (useful for cron / scripted monitoring)

Examples:
  # Check for updates using default manifest
  ${SCRIPT_NAME}

  # Check with custom manifest path
  ${SCRIPT_NAME} --manifest /srv/minecraft/mod-manifest.yaml

  # Check what is available for a different Minecraft version
  ${SCRIPT_NAME} --minecraft-version 1.21.5

  # Machine-readable output for scripts
  ${SCRIPT_NAME} --json

  # Cron example: alert if updates available
  # 0 6 * * * ${SCRIPT_NAME} --json > /var/log/mod-updates.json 2>&1 || [ \$? -eq 2 ] && mail -s "Mod updates" admin@example.com < /var/log/mod-updates.json
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --manifest)
            MANIFEST_PATH="${2:?'--manifest requires a path argument'}"
            shift 2
            ;;
        --minecraft-version)
            MC_VERSION_OVERRIDE="${2:?'--minecraft-version requires a version argument'}"
            shift 2
            ;;
        --json)
            JSON_OUTPUT=true
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

# --- Validate prerequisites ---
if ! command -v curl &>/dev/null; then
    die "curl is required but not installed. Install with: dnf install curl"
fi

if ! command -v jq &>/dev/null; then
    die "jq is required but not installed. Install with: dnf install jq"
fi

# --- Validate manifest ---
if [[ ! -f "${MANIFEST_PATH}" ]]; then
    die "Mod manifest not found: ${MANIFEST_PATH}. Run deploy-mods.sh first."
fi

# --- Parse manifest ---
# Read simple top-level keys
read_manifest_key() {
    local key="$1"
    grep -E "^${key}:" "${MANIFEST_PATH}" 2>/dev/null | head -1 | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//;s/"[[:space:]]*$//' | sed 's/[[:space:]]*$//'
}

MANIFEST_MC_VERSION=$(read_manifest_key "minecraft_version")
MANIFEST_GENERATED=$(read_manifest_key "generated_at")

# Use override if provided, otherwise use manifest version
MC_VERSION="${MC_VERSION_OVERRIDE:-${MANIFEST_MC_VERSION}}"

if [[ -z "${MC_VERSION}" ]]; then
    die "Cannot determine Minecraft version from manifest or --minecraft-version flag"
fi

info "Mod Update Check"
info "  Manifest:          ${MANIFEST_PATH}"
info "  Generated:         ${MANIFEST_GENERATED:-unknown}"
info "  Minecraft version: ${MC_VERSION}"
if [[ -n "${MC_VERSION_OVERRIDE}" ]] && [[ "${MC_VERSION_OVERRIDE}" != "${MANIFEST_MC_VERSION}" ]]; then
    info "  (Checking against override version ${MC_VERSION_OVERRIDE}, manifest is ${MANIFEST_MC_VERSION})"
fi

# --- Parse mods array from manifest ---
# Extract mod entries: name, version, modrinth_project_id
# Parse sequentially between "- name:" markers using awk
parse_mods() {
    awk '
    /^  - name:/ {
        if (name != "") {
            printf "%s|%s|%s\n", name, version, project_id
        }
        gsub(/^  - name:[[:space:]]*/, "")
        gsub(/"/, "")
        gsub(/[[:space:]]*$/, "")
        name = $0
        version = ""
        project_id = ""
        next
    }
    /^    version:/ {
        gsub(/^    version:[[:space:]]*/, "")
        gsub(/"/, "")
        gsub(/[[:space:]]*$/, "")
        version = $0
        next
    }
    /^    modrinth_project_id:/ {
        gsub(/^    modrinth_project_id:[[:space:]]*/, "")
        gsub(/"/, "")
        gsub(/[[:space:]]*$/, "")
        project_id = $0
        next
    }
    END {
        if (name != "") {
            printf "%s|%s|%s\n", name, version, project_id
        }
    }
    ' "${MANIFEST_PATH}"
}

MOD_ENTRIES=$(parse_mods)

if [[ -z "${MOD_ENTRIES}" ]]; then
    die "No mods found in manifest: ${MANIFEST_PATH}"
fi

# Count mods
MOD_COUNT=$(echo "${MOD_ENTRIES}" | wc -l)
info "  Mods to check:    ${MOD_COUNT}"
echo "" >&2

# --- Query Modrinth for each mod ---
updates_available=false
check_errors=false

# Arrays to collect results
declare -a RESULT_NAMES=()
declare -a RESULT_INSTALLED=()
declare -a RESULT_LATEST=()
declare -a RESULT_STATUS=()
declare -a RESULT_URLS=()

while IFS='|' read -r mod_name mod_version mod_project_id; do
    if [[ -z "${mod_name}" ]] || [[ -z "${mod_project_id}" ]]; then
        warn "Skipping malformed manifest entry: name=${mod_name:-empty} project_id=${mod_project_id:-empty}"
        continue
    fi

    info "Checking ${mod_name} (${mod_project_id})..."

    # Query Modrinth API
    api_url="${MODRINTH_BASE_URL}/project/${mod_project_id}/version?game_versions=%5B%22${MC_VERSION}%22%5D&loaders=%5B%22fabric%22%5D"

    response=""
    http_code=""

    # Use curl with separate status code capture
    response=$(curl -fsSL -H "User-Agent: ${USER_AGENT}" -w "\n%{http_code}" "${api_url}" 2>/dev/null) || {
        http_code=$(echo "${response}" | tail -1)

        if [[ "${http_code}" == "429" ]]; then
            warn "  Rate limited by Modrinth API. Try again later."
        else
            warn "  Modrinth API request failed for ${mod_name} (HTTP ${http_code:-unknown})"
        fi

        RESULT_NAMES+=("${mod_name}")
        RESULT_INSTALLED+=("${mod_version}")
        RESULT_LATEST+=("error")
        RESULT_STATUS+=("API_ERROR")
        RESULT_URLS+=("")
        check_errors=true
        continue
    }

    # Split response body and HTTP code
    http_code=$(echo "${response}" | tail -1)
    response_body=$(echo "${response}" | sed '$d')

    if [[ "${http_code}" == "429" ]]; then
        warn "  Rate limited by Modrinth API. Try again later."
        RESULT_NAMES+=("${mod_name}")
        RESULT_INSTALLED+=("${mod_version}")
        RESULT_LATEST+=("error")
        RESULT_STATUS+=("RATE_LIMITED")
        RESULT_URLS+=("")
        check_errors=true
        continue
    fi

    # Extract latest version (first entry, sorted by date_published by Modrinth)
    latest_version=$(echo "${response_body}" | jq -r '.[0].version_number // empty' 2>/dev/null)
    latest_url=$(echo "${response_body}" | jq -r '.[0].files[0].url // empty' 2>/dev/null)
    latest_sha256=$(echo "${response_body}" | jq -r '.[0].files[0].hashes.sha256 // empty' 2>/dev/null)

    if [[ -z "${latest_version}" ]]; then
        warn "  No versions found for ${mod_name} on Minecraft ${MC_VERSION}"
        RESULT_NAMES+=("${mod_name}")
        RESULT_INSTALLED+=("${mod_version}")
        RESULT_LATEST+=("none-found")
        RESULT_STATUS+=("NO_VERSIONS")
        RESULT_URLS+=("")
        continue
    fi

    # Compare versions
    if [[ "${latest_version}" == "${mod_version}" ]]; then
        ok "  ${mod_name}: up-to-date (${mod_version})"
        RESULT_NAMES+=("${mod_name}")
        RESULT_INSTALLED+=("${mod_version}")
        RESULT_LATEST+=("${latest_version}")
        RESULT_STATUS+=("up-to-date")
        RESULT_URLS+=("${latest_url}")
    else
        warn "  ${mod_name}: UPDATE AVAILABLE ${mod_version} -> ${latest_version}"
        RESULT_NAMES+=("${mod_name}")
        RESULT_INSTALLED+=("${mod_version}")
        RESULT_LATEST+=("${latest_version}")
        RESULT_STATUS+=("UPDATE_AVAILABLE")
        RESULT_URLS+=("${latest_url}")
        updates_available=true
    fi

done <<< "${MOD_ENTRIES}"

echo "" >&2

# --- Output results ---
CHECK_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ "${JSON_OUTPUT}" == true ]]; then
    # Machine-readable JSON output to stdout
    json_mods="["
    first=true
    for i in "${!RESULT_NAMES[@]}"; do
        if [[ "${first}" != true ]]; then
            json_mods="${json_mods},"
        fi
        first=false

        update_avail="false"
        if [[ "${RESULT_STATUS[$i]}" == "UPDATE_AVAILABLE" ]]; then
            update_avail="true"
        fi

        json_mods="${json_mods}{\"name\":\"${RESULT_NAMES[$i]}\",\"installed_version\":\"${RESULT_INSTALLED[$i]}\",\"latest_version\":\"${RESULT_LATEST[$i]}\",\"update_available\":${update_avail},\"status\":\"${RESULT_STATUS[$i]}\",\"download_url\":\"${RESULT_URLS[$i]}\"}"
    done
    json_mods="${json_mods}]"

    echo "{\"check_timestamp\":\"${CHECK_TIMESTAMP}\",\"minecraft_version\":\"${MC_VERSION}\",\"manifest_path\":\"${MANIFEST_PATH}\",\"updates_available\":${updates_available},\"mods\":${json_mods}}"

else
    # Human-readable table output to stdout
    echo ""
    echo "Mod Update Check -- ${CHECK_TIMESTAMP}"
    echo "Minecraft version: ${MC_VERSION}"
    echo ""

    # Table header
    printf "  %-20s %-25s %-25s %-20s\n" "Mod" "Installed" "Available" "Status"
    printf "  %-20s %-25s %-25s %-20s\n" "---" "---------" "---------" "------"

    for i in "${!RESULT_NAMES[@]}"; do
        local_status="${RESULT_STATUS[$i]}"

        # Color-code the status
        case "${local_status}" in
            up-to-date)
                status_display="${GREEN}up-to-date${NC}"
                ;;
            UPDATE_AVAILABLE)
                status_display="${YELLOW}UPDATE AVAILABLE${NC}"
                ;;
            *)
                status_display="${RED}${local_status}${NC}"
                ;;
        esac

        printf "  %-20s %-25s %-25s " "${RESULT_NAMES[$i]}" "${RESULT_INSTALLED[$i]}" "${RESULT_LATEST[$i]}"
        echo -e "${status_display}"
    done

    echo ""

    if [[ "${updates_available}" == true ]]; then
        echo -e "${YELLOW}Updates are available.${NC} To upgrade:"
        echo "  1. Update version and SHA-256 in your syncmatica.local-values file"
        echo "  2. Run: deploy-mods.sh --local-values <path> --force"
        echo ""
    else
        echo -e "${GREEN}All mods are up-to-date.${NC}"
        echo ""
    fi
fi

# --- Exit code ---
if [[ "${check_errors}" == true ]]; then
    exit 1
elif [[ "${updates_available}" == true ]]; then
    exit 2
else
    exit 0
fi

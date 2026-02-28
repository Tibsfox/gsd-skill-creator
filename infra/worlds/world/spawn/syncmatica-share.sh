#!/usr/bin/env bash
# syncmatica-share.sh -- Register spawn schematics with Syncmatica for server-wide sharing
#
# Reads schematic metadata from infra/world/schematics/spawn/*.litematic.yaml,
# identifies files flagged for sharing, and copies them to the Syncmatica
# server directory. Idempotent: running twice copies nothing if files are
# already present and unchanged.
#
# Usage: syncmatica-share.sh [--server-dir <path>] [--dry-run]
#
# Options:
#   --server-dir <path>   Syncmatica server-side schematic directory
#                         (default: /opt/minecraft/syncmatica/)
#   --dry-run             Show what would be done without copying files
#
# Exit codes:
#   0  Success (even if some .litematic files are pending build)
#   1  Error (invalid arguments, YAML parse failure)
#   2  Server directory not accessible (and not --dry-run)

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="${INFRA_DIR:-$(cd "${SCRIPT_DIR}/../.." && pwd)}"
SCHEMATICS_DIR="${INFRA_DIR}/world/schematics/spawn"
SERVER_DIR="/opt/minecraft/syncmatica/"
DRY_RUN=false

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --server-dir)
            if [[ -z "${2:-}" ]]; then
                echo "ERROR: --server-dir requires a path argument" >&2
                exit 1
            fi
            SERVER_DIR="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            echo "Usage: $(basename "$0") [--server-dir <path>] [--dry-run]"
            echo ""
            echo "Register spawn schematics with Syncmatica for server-wide sharing."
            echo ""
            echo "Options:"
            echo "  --server-dir <path>   Syncmatica server directory (default: /opt/minecraft/syncmatica/)"
            echo "  --dry-run             Show actions without performing them"
            exit 0
            ;;
        *)
            echo "ERROR: Unknown argument: $1" >&2
            exit 1
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

if [[ ! -d "${SCHEMATICS_DIR}" ]]; then
    echo "ERROR: Schematics directory not found: ${SCHEMATICS_DIR}" >&2
    exit 1
fi

if [[ "${DRY_RUN}" == "false" && ! -d "${SERVER_DIR}" ]]; then
    echo "ERROR: Server directory not accessible: ${SERVER_DIR}" >&2
    echo "  Use --server-dir to specify an alternative, or --dry-run to preview." >&2
    exit 2
fi

# ---------------------------------------------------------------------------
# Process schematic metadata files
# ---------------------------------------------------------------------------

REGISTERED=0
PENDING=0
SKIPPED=0
UP_TO_DATE=0

echo "Syncmatica Schematic Registration"
echo "================================="
echo "Schematics dir: ${SCHEMATICS_DIR}"
echo "Server dir:     ${SERVER_DIR}"
echo "Dry run:        ${DRY_RUN}"
echo ""

shopt -s nullglob
METADATA_FILES=("${SCHEMATICS_DIR}"/*.litematic.yaml)
shopt -u nullglob

if [[ ${#METADATA_FILES[@]} -eq 0 ]]; then
    echo "No schematic metadata files found in ${SCHEMATICS_DIR}"
    exit 0
fi

for meta_file in "${METADATA_FILES[@]}"; do
    meta_basename="$(basename "${meta_file}")"

    # Parse YAML fields using python3 for reliable extraction
    eval "$(python3 -c "
import yaml, sys
data = yaml.safe_load(open('${meta_file}'))
s = data.get('schematic', {})
print(f'SCHEM_NAME={s.get(\"name\", \"unknown\")}')
print(f'SCHEM_FILENAME={s.get(\"filename\", \"\")}')
share = s.get('syncmatica', {}).get('share', False)
print(f'SCHEM_SHARE={\"true\" if share else \"false\"}')
priority = s.get('syncmatica', {}).get('priority', 'normal')
print(f'SCHEM_PRIORITY={priority}')
" 2>/dev/null)" || {
        echo "  WARNING: Failed to parse ${meta_basename}, skipping" >&2
        SKIPPED=$(( SKIPPED + 1 ))
        continue
    }

    # Skip if not flagged for sharing
    if [[ "${SCHEM_SHARE}" != "true" ]]; then
        echo "  SKIP: ${SCHEM_NAME} (sharing disabled)"
        SKIPPED=$(( SKIPPED + 1 ))
        continue
    fi

    # Check if the actual .litematic file exists
    LITEMATIC_FILE="${SCHEMATICS_DIR}/${SCHEM_FILENAME}"
    if [[ ! -f "${LITEMATIC_FILE}" ]]; then
        echo "  PENDING: ${SCHEM_NAME} (${SCHEM_FILENAME} not yet built)"
        PENDING=$(( PENDING + 1 ))
        continue
    fi

    # Check if already up-to-date on server
    SERVER_FILE="${SERVER_DIR}/${SCHEM_FILENAME}"
    if [[ "${DRY_RUN}" == "false" && -f "${SERVER_FILE}" ]]; then
        if cmp -s "${LITEMATIC_FILE}" "${SERVER_FILE}" 2>/dev/null; then
            echo "  UP-TO-DATE: ${SCHEM_NAME} (${SCHEM_FILENAME})"
            UP_TO_DATE=$(( UP_TO_DATE + 1 ))
            continue
        fi
    fi

    # Copy to server directory
    if [[ "${DRY_RUN}" == "true" ]]; then
        echo "  WOULD COPY: ${SCHEM_NAME} (${SCHEM_FILENAME}) [priority: ${SCHEM_PRIORITY}]"
    else
        cp "${LITEMATIC_FILE}" "${SERVER_DIR}/"
        echo "  COPIED: ${SCHEM_NAME} (${SCHEM_FILENAME}) [priority: ${SCHEM_PRIORITY}]"
    fi
    REGISTERED=$(( REGISTERED + 1 ))
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo ""
echo "Summary"
echo "-------"
TOTAL=$(( REGISTERED + PENDING + SKIPPED + UP_TO_DATE ))
echo "Total schematics found: ${TOTAL}"
if [[ "${DRY_RUN}" == "true" ]]; then
    echo "  Would register: ${REGISTERED}"
else
    echo "  Registered:     ${REGISTERED}"
fi
echo "  Pending build:  ${PENDING}"
echo "  Up-to-date:     ${UP_TO_DATE}"
echo "  Skipped:        ${SKIPPED}"

exit 0

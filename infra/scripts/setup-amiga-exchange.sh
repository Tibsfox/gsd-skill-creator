#!/usr/bin/env bash
# setup-amiga-exchange.sh -- Host-UAE file exchange directory setup
#
# Creates a bidirectional file exchange directory shared between the host
# and the UAE emulator. Files placed in to-amiga/ are accessible from
# within UAE as Exchange:to-amiga/. Files saved in from-amiga/ within UAE
# are accessible from the host for asset conversion (Phase 184).
#
# Usage:
#   setup-amiga-exchange.sh [--dir <exchange-dir>]
#
# Idempotent: running twice creates no errors and does not overwrite
# existing files in the exchange directory.
#
# Exit codes:
#   0 = success
#   1 = general error

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants and defaults
# ---------------------------------------------------------------------------

DEFAULT_DIR="${HOME}/.local/share/gsd-amiga/exchange"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXCHANGE_PATH_FILE="${SCRIPT_DIR}/../local/amiga-exchange.path"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: setup-amiga-exchange.sh [OPTIONS]

Creates the bidirectional file exchange directory for host <-> UAE
file sharing. Within the emulator, this appears as the Exchange: volume.

Options:
  --dir <path>    Custom exchange directory (default: ~/.local/share/gsd-amiga/exchange/)
  --help          Show this help message

Subdirectories created:
  to-amiga/          Files to import into UAE
  from-amiga/        Files exported from UAE to host
  from-amiga/iff/    IFF/ILBM artwork files
  from-amiga/mod/    MOD/MED tracker music files
  from-amiga/misc/   Other exported files
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

EXCHANGE_DIR="${DEFAULT_DIR}"

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dir)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --dir requires a path argument\n" >&2
                    exit 1
                fi
                EXCHANGE_DIR="$2"
                shift 2
                ;;
            --help)
                usage
                exit 0
                ;;
            *)
                printf "ERROR: Unknown option: %s\n" "$1" >&2
                usage >&2
                exit 1
                ;;
        esac
    done
}

# ---------------------------------------------------------------------------
# Exchange directory creation
# ---------------------------------------------------------------------------

create_exchange() {
    printf "Setting up Amiga file exchange directory: %s\n" "${EXCHANGE_DIR}"

    # Create directory structure (idempotent via -p)
    mkdir -p "${EXCHANGE_DIR}/to-amiga"
    mkdir -p "${EXCHANGE_DIR}/from-amiga/iff"
    mkdir -p "${EXCHANGE_DIR}/from-amiga/mod"
    mkdir -p "${EXCHANGE_DIR}/from-amiga/misc"

    # Create README.txt only if it doesn't exist (preserve user edits)
    local readme="${EXCHANGE_DIR}/README.txt"
    if [[ ! -f "${readme}" ]]; then
        cat > "${readme}" << 'README'
GSD Amiga File Exchange
=======================

This directory is shared between the host system and the UAE Amiga
emulator. Within UAE, it appears as the "Exchange:" volume.

Directory Structure
-------------------

  to-amiga/         Place files here on the host to access them
                    from within UAE as Exchange:to-amiga/

  from-amiga/       Save files here from within UAE to access
                    them on the host system

  from-amiga/iff/   IFF/ILBM artwork files (Deluxe Paint, PPaint)
  from-amiga/mod/   MOD/MED tracker music files (ProTracker, OctaMED)
  from-amiga/misc/  Other files

Usage From Within UAE
---------------------

  To read a file from the host:
    copy Exchange:to-amiga/myfile.iff RAM:

  To save a file for the host:
    copy RAM:mytrack.mod Exchange:from-amiga/mod/

Notes
-----

- File names are case-insensitive on the Amiga side
- Long file names (>30 chars) may be truncated in UAE
- Binary files transfer correctly; no line-ending conversion
README
    fi

    # Update or create the exchange path file for launch-amiga-app.sh
    local local_dir
    local_dir="$(dirname "${EXCHANGE_PATH_FILE}")"
    mkdir -p "${local_dir}"
    printf "%s" "${EXCHANGE_DIR}" > "${EXCHANGE_PATH_FILE}"

    # Summary
    printf "\n"
    printf "Exchange directory ready:\n"
    printf "  Path:           %s\n" "${EXCHANGE_DIR}"
    printf "  To Amiga:       %s/to-amiga/\n" "${EXCHANGE_DIR}"
    printf "  From Amiga:     %s/from-amiga/\n" "${EXCHANGE_DIR}"
    printf "  IFF artwork:    %s/from-amiga/iff/\n" "${EXCHANGE_DIR}"
    printf "  MOD music:      %s/from-amiga/mod/\n" "${EXCHANGE_DIR}"
    printf "  Miscellaneous:  %s/from-amiga/misc/\n" "${EXCHANGE_DIR}"
    printf "\n"
    printf "UAE filesystem mapping directive:\n"
    printf "  filesystem2=rw,Exchange:%s,0\n" "${EXCHANGE_DIR}"
    printf "\n"
    printf "This path has been saved to:\n"
    printf "  %s\n" "${EXCHANGE_PATH_FILE}"
    printf "\n"
    printf "launch-amiga-app.sh will automatically include this mapping.\n"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"
    create_exchange
}

main "$@"

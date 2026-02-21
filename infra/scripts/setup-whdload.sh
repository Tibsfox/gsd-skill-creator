#!/usr/bin/env bash
# setup-whdload.sh -- WHDLoad HDF image creation and boot configuration
#
# Creates a blank Hard Disk File (HDF) image with the directory structure
# required for WHDLoad installations. Optionally formats the image using
# xdftool from the amitools Python package.
#
# Usage:
#   setup-whdload.sh [--size <MB>] [--dir <install-dir>] [--dry-run]
#
# Exit codes:
#   0 = success
#   1 = general error
#   2 = xdftool not found (install instructions printed)

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants and defaults
# ---------------------------------------------------------------------------

DEFAULT_SIZE_MB=512
DEFAULT_DIR="${HOME}/.local/share/gsd-amiga/whdload"
HDF_NAME="whdload.hdf"

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<'USAGE'
Usage: setup-whdload.sh [OPTIONS]

Creates a WHDLoad-ready HDF (Hard Disk File) image with the proper
directory structure for game, demo, and application installations.

Options:
  --size <MB>     HDF image size in megabytes (default: 512)
  --dir <path>    Installation directory (default: ~/.local/share/gsd-amiga/whdload/)
  --dry-run       Show what would be created without creating anything
  --help          Show this help message

Exit codes:
  0  Success
  1  General error
  2  xdftool not found
USAGE
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

SIZE_MB="${DEFAULT_SIZE_MB}"
INSTALL_DIR="${DEFAULT_DIR}"
DRY_RUN=false

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --size)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --size requires a value in MB\n" >&2
                    exit 1
                fi
                SIZE_MB="$2"
                if ! [[ "${SIZE_MB}" =~ ^[0-9]+$ ]] || [[ "${SIZE_MB}" -lt 1 ]]; then
                    printf "ERROR: --size must be a positive integer (MB)\n" >&2
                    exit 1
                fi
                shift 2
                ;;
            --dir)
                if [[ $# -lt 2 ]]; then
                    printf "ERROR: --dir requires a path argument\n" >&2
                    exit 1
                fi
                INSTALL_DIR="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
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
# HDF creation
# ---------------------------------------------------------------------------

create_hdf() {
    local hdf_path="${INSTALL_DIR}/${HDF_NAME}"

    if [[ "${DRY_RUN}" == true ]]; then
        printf "=== WHDLoad Setup (DRY RUN) ===\n\n"
        printf "Would create:\n"
        printf "  Directory:  %s\n" "${INSTALL_DIR}"
        printf "  HDF image:  %s\n" "${hdf_path}"
        printf "  Image size: %d MB\n\n" "${SIZE_MB}"
        printf "Directory structure inside HDF:\n"
        printf "  S/          Startup-sequence directory\n"
        printf "  C/          Commands directory\n"
        printf "  WHDLoad/    WHDLoad binary and configs\n"
        printf "  Games/      WHDLoad game slave installations\n"
        printf "  Demos/      WHDLoad demo slave installations\n"
        printf "  Apps/       Application installations\n\n"
        printf "xdftool required for formatting: pip install amitools\n\n"
        printf "LEGAL NOTE: WHDLoad is free for personal use but must be\n"
        printf "downloaded from https://whdload.de -- it cannot be redistributed.\n"
        return 0
    fi

    # Create install directory
    mkdir -p "${INSTALL_DIR}"

    # Check if HDF already exists
    if [[ -f "${hdf_path}" ]]; then
        printf "HDF image already exists: %s\n" "${hdf_path}" >&2
        printf "To recreate, delete the existing file first.\n" >&2
        exit 1
    fi

    # Create blank HDF image
    printf "Creating %d MB HDF image at %s ...\n" "${SIZE_MB}" "${hdf_path}"
    dd if=/dev/zero of="${hdf_path}" bs=1M count="${SIZE_MB}" status=progress 2>&1

    # Format using xdftool if available
    if command -v xdftool &>/dev/null; then
        printf "Formatting HDF with Amiga Fast File System (xdftool)...\n"

        # xdftool from amitools: create FFS volume
        xdftool "${hdf_path}" create size="${SIZE_MB}M" + format WHDLoad ffs

        # Create directory structure
        printf "Creating WHDLoad directory structure...\n"
        xdftool "${hdf_path}" makedir S
        xdftool "${hdf_path}" makedir C
        xdftool "${hdf_path}" makedir WHDLoad
        xdftool "${hdf_path}" makedir Games
        xdftool "${hdf_path}" makedir Demos
        xdftool "${hdf_path}" makedir Apps

        # Create a minimal startup-sequence
        local startup_tmp
        startup_tmp="$(mktemp)"
        cat > "${startup_tmp}" << 'STARTUP'
; GSD WHDLoad Startup-Sequence
; Boots WHDLoad launcher if present, otherwise drops to shell

IF EXISTS WHDLoad:WHDLoad
  WHDLoad:WHDLoad
ELSE
  Echo "WHDLoad binary not found."
  Echo "Download from https://whdload.de and place in WHDLoad/ directory."
  Echo ""
  Echo "Type 'dir' to browse the disk."
ENDIF
STARTUP
        xdftool "${hdf_path}" write "${startup_tmp}" S/startup-sequence
        rm -f "${startup_tmp}"

        printf "HDF formatted and directory structure created.\n\n"
    else
        printf "\n"
        printf "[WARN] xdftool not found -- HDF created but NOT formatted.\n" >&2
        printf "\n"
        printf "To format the HDF, install amitools:\n"
        printf "  pip install amitools\n"
        printf "  # Then re-run this script after deleting the blank HDF\n\n"
        printf "Alternatively, format manually:\n"
        printf "  1. Launch FS-UAE with this HDF as a hard drive\n"
        printf "  2. Use the Amiga Workbench HDToolBox or Format command\n"
        printf "  3. Create directories: S/, C/, WHDLoad/, Games/, Demos/, Apps/\n\n"
        exit 2
    fi

    # Print summary
    printf "=== WHDLoad Setup Complete ===\n\n"
    printf "  HDF path:   %s\n" "${hdf_path}"
    printf "  Image size: %d MB\n" "${SIZE_MB}"
    printf "  Format:     Amiga Fast File System (FFS)\n"
    printf "  Volume:     WHDLoad\n\n"
    printf "Directory structure:\n"
    printf "  S/          Startup-sequence (boots WHDLoad launcher)\n"
    printf "  C/          Commands directory\n"
    printf "  WHDLoad/    Place WHDLoad binary here\n"
    printf "  Games/      Game slave installations\n"
    printf "  Demos/      Demo slave installations\n"
    printf "  Apps/       Application installations\n\n"

    # Legal notice
    printf "IMPORTANT: WHDLoad Installation\n"
    printf "=============================\n"
    printf "WHDLoad is free for personal use but must be downloaded from:\n"
    printf "  https://whdload.de\n\n"
    printf "The WHDLoad binary CANNOT be redistributed. This script creates\n"
    printf "the directory structure only. You must:\n"
    printf "  1. Download WHDLoad from https://whdload.de\n"
    printf "  2. Extract the WHDLoad binary\n"
    printf "  3. Copy it into the WHDLoad/ directory on the HDF image\n\n"
    printf "To launch:\n"
    printf "  launch-amiga-app.sh whdload --hdf %s\n" "${hdf_path}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    parse_args "$@"
    create_hdf
}

main "$@"

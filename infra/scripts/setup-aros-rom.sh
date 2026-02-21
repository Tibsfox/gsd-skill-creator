#!/usr/bin/env bash
# setup-aros-rom.sh -- AROS ROM acquisition and Workbench disk image preparation
#
# Downloads the AROS (AROS Research Operating System) ROM and system disk
# images for use with FS-UAE. AROS is an open-source, freely distributable
# Amiga-compatible operating system.
#
# The ROM (kickstart replacement) and system disk images are copyright-free
# and legal to distribute.
#
# Usage:
#   bash infra/scripts/setup-aros-rom.sh
#   bash infra/scripts/setup-aros-rom.sh --rom-dir /custom/roms
#   bash infra/scripts/setup-aros-rom.sh --data-dir /custom/fs-uae
#   bash infra/scripts/setup-aros-rom.sh --dry-run
#
# Exit codes:
#   0 - ROM acquired successfully (or already present)
#   1 - Download or verification failed
#   2 - Usage error

set -euo pipefail

# ---------------------------------------------------------------------------
# Resolve script directory and source dependencies
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

# ---------------------------------------------------------------------------
# Configurable URLs (override via environment variables)
# ---------------------------------------------------------------------------

# AROS amiga-m68k ROM and system archive URLs
# These can be overridden without editing the script:
#   AROS_ROM_URL=https://example.com/rom.zip bash setup-aros-rom.sh
AROS_ROM_URL="${AROS_ROM_URL:-https://github.com/aros-development-team/AROS/releases/download/ABIv0_20220318/aros-amiga-m68k-rom.zip}"
AROS_SYSTEM_URL="${AROS_SYSTEM_URL:-https://github.com/aros-development-team/AROS/releases/download/ABIv0_20220318/aros-amiga-m68k-system.zip}"

# Expected ROM filename after extraction
AROS_ROM_FILENAME="aros-amiga-m68k-rom.bin"

# Minimum expected file sizes for integrity verification
MIN_ROM_SIZE=262144        # 256KB -- ROM should be at least this large
MIN_SYSTEM_SIZE=1048576    # 1MB -- system disk should be at least this large

# Download retry configuration
MAX_RETRIES=3
RETRY_TIMEOUT=10

# ---------------------------------------------------------------------------
# Defaults and argument parsing
# ---------------------------------------------------------------------------

ROM_DIR="${HOME}/.local/share/fs-uae/ROMs"
DATA_DIR="${HOME}/.local/share/fs-uae"
DRY_RUN=0

usage() {
    printf "Usage: %s [OPTIONS]\n\n" "$(basename "$0")"
    printf "Download and set up AROS ROM for FS-UAE.\n\n"
    printf "Options:\n"
    printf "  --rom-dir <dir>    ROM storage directory (default: %s)\n" "${HOME}/.local/share/fs-uae/ROMs"
    printf "  --data-dir <dir>   FS-UAE data directory (default: %s)\n" "${HOME}/.local/share/fs-uae"
    printf "  --dry-run          Show what would be done without making changes\n"
    printf "  -h, --help         Show this help message\n"
    printf "\nEnvironment variables:\n"
    printf "  AROS_ROM_URL       Override AROS ROM download URL\n"
    printf "  AROS_SYSTEM_URL    Override AROS system disk download URL\n"
    exit 2
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --rom-dir)
            if [[ $# -lt 2 ]]; then
                printf "[ERROR] --rom-dir requires a directory argument\n" >&2
                usage
            fi
            ROM_DIR="$2"
            shift 2
            ;;
        --data-dir)
            if [[ $# -lt 2 ]]; then
                printf "[ERROR] --data-dir requires a directory argument\n" >&2
                usage
            fi
            DATA_DIR="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=1
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            printf "[ERROR] Unknown argument: %s\n" "$1" >&2
            usage
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

info() {
    printf "[INFO] %s\n" "$1"
}

error() {
    printf "[ERROR] %s\n" "$1" >&2
}

# Download a file with retry logic
# Usage: download_with_retry "url" "output_path"
download_with_retry() {
    local url="$1"
    local output="$2"
    local attempt=0

    while [[ ${attempt} -lt ${MAX_RETRIES} ]]; do
        attempt=$(( attempt + 1 ))
        info "Download attempt ${attempt}/${MAX_RETRIES}: $(basename "${output}")"

        if curl -fSL --connect-timeout "${RETRY_TIMEOUT}" -o "${output}" "${url}"; then
            info "Download complete: $(basename "${output}")"
            return 0
        else
            warn "setup-aros-rom: download attempt ${attempt} failed"
            if [[ ${attempt} -lt ${MAX_RETRIES} ]]; then
                info "Retrying in ${RETRY_TIMEOUT} seconds..."
                sleep "${RETRY_TIMEOUT}"
            fi
        fi
    done

    error "Failed to download after ${MAX_RETRIES} attempts: ${url}"
    return 1
}

# Verify a downloaded file meets minimum size requirements
# Usage: verify_file_size "path" min_size_bytes "description"
verify_file_size() {
    local file="$1"
    local min_size="$2"
    local desc="$3"

    if [[ ! -f "${file}" ]]; then
        error "${desc} file not found: ${file}"
        return 1
    fi

    local actual_size
    actual_size="$(stat -c %s "${file}" 2>/dev/null || stat -f %z "${file}" 2>/dev/null || echo "0")"

    if [[ ${actual_size} -lt ${min_size} ]]; then
        error "${desc} file too small: ${actual_size} bytes (minimum: ${min_size} bytes)"
        error "The download may be corrupt or incomplete. Delete and retry."
        return 1
    fi

    info "${desc} verified: ${actual_size} bytes"
    return 0
}

# Extract archive (supports .zip and .tar.bz2)
# Usage: extract_archive "archive_path" "dest_dir"
extract_archive() {
    local archive="$1"
    local dest="$2"

    mkdir -p "${dest}"

    case "${archive}" in
        *.zip)
            if has_command unzip; then
                unzip -o -q "${archive}" -d "${dest}"
            else
                error "unzip is required to extract ${archive}. Install it and retry."
                return 1
            fi
            ;;
        *.tar.bz2|*.tbz2)
            tar xjf "${archive}" -C "${dest}"
            ;;
        *.tar.gz|*.tgz)
            tar xzf "${archive}" -C "${dest}"
            ;;
        *)
            error "Unsupported archive format: ${archive}"
            return 1
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Main: AROS ROM acquisition
# ---------------------------------------------------------------------------

info "AROS ROM Setup Script"
info "ROM directory:  ${ROM_DIR}"
info "Data directory: ${DATA_DIR}"
if [[ ${DRY_RUN} -eq 1 ]]; then
    info "Mode: DRY RUN (no changes will be made)"
fi

# ---------------------------------------------------------------------------
# Step 1: Check if ROM already exists (idempotent)
# ---------------------------------------------------------------------------

info "Checking for existing AROS ROM..."

ROM_PATH="${ROM_DIR}/${AROS_ROM_FILENAME}"

if [[ -f "${ROM_PATH}" ]]; then
    local_size="$(stat -c %s "${ROM_PATH}" 2>/dev/null || stat -f %z "${ROM_PATH}" 2>/dev/null || echo "0")"
    if [[ ${local_size} -gt 0 ]]; then
        info "AROS ROM already exists: ${ROM_PATH} (${local_size} bytes)"
        info "Skipping download (idempotent). Delete the file to force re-download."
        exit 0
    fi
fi

info "AROS ROM not found. Proceeding with download..."

# ---------------------------------------------------------------------------
# Step 2: Download AROS ROM and system archives
# ---------------------------------------------------------------------------

if [[ ${DRY_RUN} -eq 1 ]]; then
    info "Would create directories:"
    info "  ${ROM_DIR}"
    info "  ${DATA_DIR}/Hard Drives"
    info "Would download AROS ROM from: ${AROS_ROM_URL}"
    info "Would download AROS system from: ${AROS_SYSTEM_URL}"
    info "Would extract ROM to: ${ROM_PATH}"
    info "Would extract system disk to: ${DATA_DIR}/Hard Drives/"
    info ""
    info "Dry run complete."
    exit 0
fi

# Ensure required tools are available
if ! has_command curl; then
    error "curl is required for downloading AROS files. Install curl and retry."
    exit 1
fi

# Create target directories
mkdir -p "${ROM_DIR}"
mkdir -p "${DATA_DIR}/Hard Drives"

# Create a temporary directory for downloads
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

# Download ROM archive
ROM_ARCHIVE="${WORK_DIR}/aros-rom.zip"
info "Downloading AROS ROM..."
if ! download_with_retry "${AROS_ROM_URL}" "${ROM_ARCHIVE}"; then
    error ""
    error "AROS ROM download failed. Manual installation instructions:"
    error "  1. Visit: https://github.com/aros-development-team/AROS/releases"
    error "  2. Download the amiga-m68k ROM archive"
    error "  3. Extract the ROM file to: ${ROM_PATH}"
    error ""
    error "Alternative: Override the download URL:"
    error "  AROS_ROM_URL=https://your-mirror.example.com/rom.zip bash setup-aros-rom.sh"
    exit 1
fi

# Download system archive
SYSTEM_ARCHIVE="${WORK_DIR}/aros-system.zip"
info "Downloading AROS system disk..."
if ! download_with_retry "${AROS_SYSTEM_URL}" "${SYSTEM_ARCHIVE}"; then
    warn "setup-aros-rom: AROS system disk download failed (non-fatal)"
    warn "setup-aros-rom: ROM-only setup will continue. System disk can be added later."
    SYSTEM_ARCHIVE=""
fi

# ---------------------------------------------------------------------------
# Step 3: Extract and organize files
# ---------------------------------------------------------------------------

info "Extracting AROS ROM archive..."
ROM_EXTRACT_DIR="${WORK_DIR}/rom-extracted"
if ! extract_archive "${ROM_ARCHIVE}" "${ROM_EXTRACT_DIR}"; then
    error "Failed to extract ROM archive"
    exit 1
fi

# Find the ROM binary in the extracted archive
# Search for common AROS ROM filenames
ROM_FOUND=""
for rom_pattern in "aros-amiga-m68k-rom.bin" "aros.rom" "aros-rom.bin" "*.rom" "*.bin"; do
    ROM_FOUND="$(find "${ROM_EXTRACT_DIR}" -iname "${rom_pattern}" -type f 2>/dev/null | head -1)" || true
    if [[ -n "${ROM_FOUND}" ]]; then
        break
    fi
done

if [[ -z "${ROM_FOUND}" ]]; then
    error "Could not locate ROM file in the extracted archive"
    error "Expected files like: aros-amiga-m68k-rom.bin, aros.rom"
    error "Contents of extracted archive:"
    find "${ROM_EXTRACT_DIR}" -type f 2>/dev/null | while read -r f; do
        error "  ${f}"
    done
    exit 1
fi

# Copy ROM to target location
cp "${ROM_FOUND}" "${ROM_PATH}"
info "ROM installed: ${ROM_PATH}"

# Extract and place system disk if downloaded
if [[ -n "${SYSTEM_ARCHIVE}" && -f "${SYSTEM_ARCHIVE}" ]]; then
    info "Extracting AROS system disk..."
    SYSTEM_EXTRACT_DIR="${WORK_DIR}/system-extracted"
    if extract_archive "${SYSTEM_ARCHIVE}" "${SYSTEM_EXTRACT_DIR}"; then
        # Find HDF or ADF files in the extracted archive
        SYSTEM_FOUND=""
        for sys_pattern in "*.hdf" "*.adf" "AROS*.hdf" "AROS*.adf"; do
            SYSTEM_FOUND="$(find "${SYSTEM_EXTRACT_DIR}" -iname "${sys_pattern}" -type f 2>/dev/null | head -1)" || true
            if [[ -n "${SYSTEM_FOUND}" ]]; then
                break
            fi
        done

        if [[ -n "${SYSTEM_FOUND}" ]]; then
            cp "${SYSTEM_FOUND}" "${DATA_DIR}/Hard Drives/AROS-System.hdf"
            info "System disk installed: ${DATA_DIR}/Hard Drives/AROS-System.hdf"
        else
            warn "setup-aros-rom: No HDF/ADF disk image found in system archive"
            warn "setup-aros-rom: You may need to create a hard drive image manually"
        fi
    else
        warn "setup-aros-rom: Failed to extract system archive (non-fatal)"
    fi
fi

# ---------------------------------------------------------------------------
# Step 4: Verify ROM integrity
# ---------------------------------------------------------------------------

info "Verifying ROM integrity..."
if ! verify_file_size "${ROM_PATH}" "${MIN_ROM_SIZE}" "AROS ROM"; then
    error "ROM verification failed. The file may be corrupt."
    error "Delete ${ROM_PATH} and re-run this script to retry."
    exit 1
fi

# Verify system disk if it was installed
SYSTEM_HDF="${DATA_DIR}/Hard Drives/AROS-System.hdf"
if [[ -f "${SYSTEM_HDF}" ]]; then
    if verify_file_size "${SYSTEM_HDF}" "${MIN_SYSTEM_SIZE}" "AROS system disk"; then
        info "System disk verification passed"
    else
        warn "setup-aros-rom: System disk may be incomplete (non-fatal)"
    fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

info ""
info "AROS ROM setup complete!"
info "  ROM file: ${ROM_PATH}"
if [[ -f "${SYSTEM_HDF}" ]]; then
    info "  System disk: ${SYSTEM_HDF}"
fi
info ""
info "Next steps:"
info "  1. Copy base.fs-uae to your Configurations directory"
info "  2. Update ROM path in the configuration if using a custom location"
info "  3. Launch: fs-uae <configuration-file>"

exit 0

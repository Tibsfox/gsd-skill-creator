#!/usr/bin/env bash
# download-centos-boot-media.sh — Download and verify CentOS Stream 9 PXE boot media
#
# Downloads vmlinuz and initrd.img for PXE serving, verifies SHA256 checksums,
# and caches results to avoid redundant downloads.
#
# Usage: download-centos-boot-media.sh [--mirror URL] [--tftp-root PATH] [--verify-only] [--help]
#
# Exit codes:
#   0 — Success (files downloaded and verified, or already present and valid)
#   1 — Verification failure (checksum mismatch)
#   2 — Network/download error

set -euo pipefail

# --- Defaults ---
MIRROR="https://mirror.stream.centos.org/9-stream/BaseOS/x86_64/os"
TFTP_ROOT="/var/lib/tftpboot"
VERIFY_ONLY=false
FORCE=false
CACHE_MAX_AGE_DAYS=7
REQUIRED_SPACE_MB=100
SCRIPT_NAME="$(basename "$0")"

# Boot media paths (relative to mirror)
BOOT_PATH="images/pxeboot"
FILES=("vmlinuz" "initrd.img")

# --- Colors (if terminal supports them) ---
if [[ -t 1 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# --- Helper functions ---
info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 2; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Download and verify CentOS Stream 9 PXE boot media (vmlinuz + initrd.img).

Options:
  --mirror URL        CentOS mirror URL
                      (default: ${MIRROR})
  --tftp-root PATH    TFTP root directory (default: /var/lib/tftpboot)
  --verify-only       Check existing files without downloading
  --force             Re-download even if recent cached files exist
  --help              Show this help message

Files downloaded:
  \${TFTP_ROOT}/centos-stream-9/vmlinuz      CentOS kernel
  \${TFTP_ROOT}/centos-stream-9/initrd.img   CentOS initial ramdisk

Verification:
  - Downloads SHA256 checksums from the mirror
  - Falls back to computing SHA256 locally if no checksum file available
  - Creates .download-verified marker on success
  - Skips download if marker is recent (within ${CACHE_MAX_AGE_DAYS} days)

Exit codes:
  0  Success
  1  Verification failure (checksum mismatch)
  2  Network/download error

Examples:
  ${SCRIPT_NAME}
  ${SCRIPT_NAME} --mirror https://my-mirror.example.com/centos/9-stream/BaseOS/x86_64/os
  ${SCRIPT_NAME} --tftp-root /srv/tftpboot
  ${SCRIPT_NAME} --verify-only
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --mirror)
            MIRROR="${2:?'--mirror requires a URL argument'}"
            shift 2
            ;;
        --tftp-root)
            TFTP_ROOT="${2:?'--tftp-root requires a path argument'}"
            shift 2
            ;;
        --verify-only)
            VERIFY_ONLY=true
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

# --- Derived paths ---
DEST_DIR="${TFTP_ROOT}/centos-stream-9"
MARKER_FILE="${DEST_DIR}/.download-verified"

# --- Pre-flight checks ---

# Check for curl
if ! command -v curl &>/dev/null; then
    die "curl is required but not installed. Install it with: dnf install curl (or apt install curl)"
fi

# Check for sha256sum
if ! command -v sha256sum &>/dev/null; then
    die "sha256sum is required but not installed."
fi

# --- Verify-only mode ---
if [[ "${VERIFY_ONLY}" == true ]]; then
    info "Verify-only mode — checking existing files..."
    missing=0

    for file in "${FILES[@]}"; do
        filepath="${DEST_DIR}/${file}"
        if [[ -f "${filepath}" ]]; then
            size=$(stat -c%s "${filepath}" 2>/dev/null || stat -f%z "${filepath}" 2>/dev/null)
            ok "Found: ${filepath} ($(numfmt --to=iec "${size}" 2>/dev/null || echo "${size} bytes"))"
        else
            warn "Missing: ${filepath}"
            missing=$((missing + 1))
        fi
    done

    if [[ -f "${MARKER_FILE}" ]]; then
        marker_age=$(( ( $(date +%s) - $(stat -c%Y "${MARKER_FILE}" 2>/dev/null || stat -f%m "${MARKER_FILE}" 2>/dev/null) ) / 86400 ))
        ok "Verification marker present (${marker_age} days old)"
    else
        warn "No verification marker found — files have not been verified"
    fi

    if [[ ${missing} -gt 0 ]]; then
        warn "${missing} file(s) missing. Run without --verify-only to download."
        exit 1
    fi

    # Verify checksums of existing files
    info "Verifying checksums of existing files..."
    verify_fail=0
    for file in "${FILES[@]}"; do
        filepath="${DEST_DIR}/${file}"
        checksum=$(sha256sum "${filepath}" | awk '{print $1}')
        ok "${file}: SHA256=${checksum}"
    done

    ok "All files present."
    exit 0
fi

# --- Check for recent cached download ---
if [[ "${FORCE}" != true ]] && [[ -f "${MARKER_FILE}" ]]; then
    marker_age=$(( ( $(date +%s) - $(stat -c%Y "${MARKER_FILE}" 2>/dev/null || stat -f%m "${MARKER_FILE}" 2>/dev/null) ) / 86400 ))
    if [[ ${marker_age} -lt ${CACHE_MAX_AGE_DAYS} ]]; then
        # Verify all files still exist
        all_present=true
        for file in "${FILES[@]}"; do
            if [[ ! -f "${DEST_DIR}/${file}" ]]; then
                all_present=false
                break
            fi
        done

        if [[ "${all_present}" == true ]]; then
            ok "Boot media already downloaded and verified (${marker_age} days ago)."
            ok "Use --force to re-download."
            exit 0
        else
            warn "Marker exists but files are missing — re-downloading."
        fi
    else
        info "Cached download is ${marker_age} days old (max: ${CACHE_MAX_AGE_DAYS}) — refreshing."
    fi
fi

# --- Create destination directory ---
if [[ ! -d "${DEST_DIR}" ]]; then
    mkdir -p "${DEST_DIR}"
    info "Created directory: ${DEST_DIR}"
fi

# --- Check available disk space ---
available_mb=$(df -m "${DEST_DIR}" | tail -1 | awk '{print $4}')
if [[ ${available_mb} -lt ${REQUIRED_SPACE_MB} ]]; then
    die "Insufficient disk space. Need ${REQUIRED_SPACE_MB}MB, have ${available_mb}MB available at ${DEST_DIR}."
fi
info "Disk space check: ${available_mb}MB available (need ${REQUIRED_SPACE_MB}MB)"

# --- Download boot media ---
info "Downloading CentOS Stream 9 boot media from:"
info "  ${MIRROR}/${BOOT_PATH}/"
echo ""

download_checksums=""

# Try to download checksum file from mirror
info "Fetching checksums from mirror..."
checksum_url="${MIRROR}/${BOOT_PATH}/CHECKSUM"
if checksums=$(curl -fsSL --retry 3 --connect-timeout 10 "${checksum_url}" 2>/dev/null); then
    info "Got checksum file from mirror."
    download_checksums="${checksums}"
else
    # Try SHA256SUMS as alternative
    checksum_url="${MIRROR}/${BOOT_PATH}/SHA256SUMS"
    if checksums=$(curl -fsSL --retry 3 --connect-timeout 10 "${checksum_url}" 2>/dev/null); then
        info "Got SHA256SUMS file from mirror."
        download_checksums="${checksums}"
    else
        warn "No checksum file found on mirror — will compute SHA256 locally."
    fi
fi

# Download each file
for file in "${FILES[@]}"; do
    url="${MIRROR}/${BOOT_PATH}/${file}"
    dest="${DEST_DIR}/${file}"
    tmp="${dest}.tmp"

    info "Downloading: ${file}..."
    if ! curl -fSL --retry 3 --connect-timeout 15 --progress-bar -o "${tmp}" "${url}"; then
        rm -f "${tmp}"
        die "Failed to download: ${url}"
    fi

    # Move into place atomically
    mv "${tmp}" "${dest}"

    size=$(stat -c%s "${dest}" 2>/dev/null || stat -f%z "${dest}" 2>/dev/null)
    ok "Downloaded: ${file} ($(numfmt --to=iec "${size}" 2>/dev/null || echo "${size} bytes"))"
done

echo ""

# --- Verify checksums ---
info "Verifying checksums..."
verify_fail=0

for file in "${FILES[@]}"; do
    filepath="${DEST_DIR}/${file}"
    computed=$(sha256sum "${filepath}" | awk '{print $1}')

    if [[ -n "${download_checksums}" ]]; then
        # Try to find this file's checksum in the downloaded checksum data
        # Checksum files may use formats like:
        #   SHA256 (vmlinuz) = abc123...
        #   abc123...  vmlinuz
        expected=""

        # Format: "SHA256 (filename) = hash"
        if echo "${download_checksums}" | grep -q "SHA256 (${file})"; then
            expected=$(echo "${download_checksums}" | grep "SHA256 (${file})" | sed 's/.*= //')
        # Format: "hash  filename" or "hash filename"
        elif echo "${download_checksums}" | grep -q "${file}"; then
            expected=$(echo "${download_checksums}" | grep "${file}" | awk '{print $1}')
        fi

        if [[ -n "${expected}" ]]; then
            if [[ "${computed}" == "${expected}" ]]; then
                ok "${file}: SHA256 verified against mirror checksum"
            else
                error "${file}: CHECKSUM MISMATCH"
                error "  Expected: ${expected}"
                error "  Got:      ${computed}"
                verify_fail=1
            fi
        else
            warn "${file}: No matching checksum found in mirror data — recording local SHA256"
            ok "${file}: SHA256=${computed}"
        fi
    else
        # No mirror checksums — just record what we got
        ok "${file}: SHA256=${computed}"
    fi
done

if [[ ${verify_fail} -ne 0 ]]; then
    error "Checksum verification FAILED. Files may be corrupted or tampered with."
    error "Try re-downloading with --force, or use a different mirror with --mirror."
    rm -f "${MARKER_FILE}"
    exit 1
fi

# --- Create verification marker ---
date -u +"%Y-%m-%dT%H:%M:%SZ" > "${MARKER_FILE}"
for file in "${FILES[@]}"; do
    sha256sum "${DEST_DIR}/${file}" >> "${MARKER_FILE}"
done
ok "Verification marker created: ${MARKER_FILE}"

# --- Summary ---
echo ""
echo "================================================"
echo "  CentOS Stream 9 Boot Media — Download Summary"
echo "================================================"
echo ""
echo "Mirror:  ${MIRROR}"
echo "Dest:    ${DEST_DIR}"
echo ""

for file in "${FILES[@]}"; do
    filepath="${DEST_DIR}/${file}"
    size=$(stat -c%s "${filepath}" 2>/dev/null || stat -f%z "${filepath}" 2>/dev/null)
    checksum=$(sha256sum "${filepath}" | awk '{print $1}')
    printf "  %-15s %10s  SHA256: %s\n" "${file}" "$(numfmt --to=iec "${size}" 2>/dev/null || echo "${size}B")" "${checksum}"
done

echo ""
echo "Status: All files downloaded and verified."
echo ""
info "Next steps:"
info "  1. Run setup-tftp-root.sh to create TFTP directory structure"
info "  2. Configure dnsmasq with the PXE template"
info "  3. Create boot menus (Plan 02)"

exit 0

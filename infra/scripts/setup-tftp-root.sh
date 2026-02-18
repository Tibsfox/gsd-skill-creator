#!/usr/bin/env bash
# setup-tftp-root.sh — Create TFTP directory structure for BIOS and UEFI PXE boot
#
# Sets up the standard TFTP root layout and copies bootloader files from
# syslinux (BIOS) and grub2-efi (UEFI) packages.
#
# Usage: setup-tftp-root.sh [--tftp-root /path] [--help]

set -euo pipefail

# --- Defaults ---
TFTP_ROOT="/var/lib/tftpboot"
SCRIPT_NAME="$(basename "$0")"

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
die()   { error "$@"; exit 1; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Create TFTP directory structure for BIOS and UEFI PXE boot.

Options:
  --tftp-root PATH    TFTP root directory (default: /var/lib/tftpboot)
  --help              Show this help message

Directory structure created:
  \${TFTP_ROOT}/
    pxelinux.0              # BIOS bootloader (from syslinux)
    ldlinux.c32             # Required by pxelinux
    libutil.c32             # Menu support
    menu.c32                # Simple menu
    vesamenu.c32            # Graphical menu (BIOS)
    pxelinux.cfg/
      default               # BIOS boot menu (created by Plan 02)
    grubx64.efi             # UEFI bootloader (from grub2-efi)
    grub.cfg                # UEFI boot menu (created by Plan 02)
    centos-stream-9/
      vmlinuz               # CentOS kernel
      initrd.img            # CentOS initramfs
    gsd/
      splash.png            # GSD boot splash (created by Plan 02)

Prerequisites:
  - syslinux package installed (provides BIOS bootloader files)
  - grub2-efi-x64 package installed (provides UEFI bootloader)
  - Root privileges (for creating directories in /var/lib/tftpboot)

Example:
  sudo ${SCRIPT_NAME}
  sudo ${SCRIPT_NAME} --tftp-root /srv/tftpboot
EOF
}

# --- Argument parsing ---
while [[ $# -gt 0 ]]; do
    case "$1" in
        --tftp-root)
            TFTP_ROOT="${2:?'--tftp-root requires a path argument'}"
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

# --- Pre-flight checks ---

# Check for root (TFTP root setup typically requires it)
if [[ $EUID -ne 0 ]]; then
    warn "Not running as root. Directory creation may fail if ${TFTP_ROOT} requires elevated privileges."
    warn "Consider: sudo ${SCRIPT_NAME} $*"
fi

# --- Syslinux file locations ---
# Different distros put syslinux files in different places
find_syslinux_file() {
    local filename="$1"
    local search_dirs=(
        "/usr/share/syslinux"
        "/usr/lib/syslinux/modules/bios"
        "/usr/lib/syslinux"
        "/usr/share/syslinux/modules/bios"
        "/usr/lib/SYSLINUX"
    )

    for dir in "${search_dirs[@]}"; do
        if [[ -f "${dir}/${filename}" ]]; then
            echo "${dir}/${filename}"
            return 0
        fi
    done
    return 1
}

# --- GRUB EFI file locations ---
find_grub_efi() {
    local search_paths=(
        "/boot/efi/EFI/centos/grubx64.efi"
        "/boot/efi/EFI/rocky/grubx64.efi"
        "/boot/efi/EFI/fedora/grubx64.efi"
        "/boot/efi/EFI/redhat/grubx64.efi"
        "/boot/efi/EFI/BOOT/grubx64.efi"
        "/usr/lib/grub/x86_64-efi/grub.efi"
        "/usr/share/grub2/x86_64-efi/grubx64.efi"
    )

    for path in "${search_paths[@]}"; do
        if [[ -f "${path}" ]]; then
            echo "${path}"
            return 0
        fi
    done
    return 1
}

# --- Create directory structure ---
info "Setting up TFTP root at: ${TFTP_ROOT}"

directories=(
    "${TFTP_ROOT}"
    "${TFTP_ROOT}/pxelinux.cfg"
    "${TFTP_ROOT}/centos-stream-9"
    "${TFTP_ROOT}/gsd"
)

for dir in "${directories[@]}"; do
    if [[ -d "${dir}" ]]; then
        ok "Directory exists: ${dir}"
    else
        mkdir -p "${dir}"
        chmod 755 "${dir}"
        ok "Created directory: ${dir}"
    fi
done

# --- Copy BIOS bootloader files (syslinux) ---
info "Setting up BIOS PXE bootloader files..."

SYSLINUX_FILES=("pxelinux.0" "ldlinux.c32" "libutil.c32" "menu.c32" "vesamenu.c32")
SYSLINUX_MISSING=0

for file in "${SYSLINUX_FILES[@]}"; do
    if [[ -f "${TFTP_ROOT}/${file}" ]]; then
        ok "Already present: ${file}"
        continue
    fi

    source_path=$(find_syslinux_file "${file}" 2>/dev/null) || true
    if [[ -n "${source_path}" ]]; then
        cp "${source_path}" "${TFTP_ROOT}/${file}"
        chmod 644 "${TFTP_ROOT}/${file}"
        ok "Copied: ${file} (from ${source_path})"
    else
        warn "Not found: ${file}"
        SYSLINUX_MISSING=$((SYSLINUX_MISSING + 1))
    fi
done

if [[ ${SYSLINUX_MISSING} -gt 0 ]]; then
    warn "${SYSLINUX_MISSING} syslinux file(s) not found."
    warn "Install syslinux to enable BIOS PXE boot:"
    warn "  CentOS/RHEL: dnf install syslinux-tftpboot"
    warn "  Fedora:      dnf install syslinux-tftpboot"
    warn "  Ubuntu/Debian: apt install syslinux-common pxelinux"
    warn "Then re-run this script."
fi

# --- Copy UEFI bootloader (grub2-efi) ---
info "Setting up UEFI PXE bootloader..."

if [[ -f "${TFTP_ROOT}/grubx64.efi" ]]; then
    ok "Already present: grubx64.efi"
else
    # Try grub2-mknetdir first (generates a proper network bootloader)
    if command -v grub2-mknetdir &>/dev/null; then
        info "Using grub2-mknetdir to generate UEFI network bootloader..."
        grub2-mknetdir --net-directory="${TFTP_ROOT}" --subdir="" 2>/dev/null || true
        if [[ -f "${TFTP_ROOT}/grubx64.efi" ]]; then
            ok "Generated: grubx64.efi (via grub2-mknetdir)"
        fi
    fi

    # Fallback: copy from known locations
    if [[ ! -f "${TFTP_ROOT}/grubx64.efi" ]]; then
        grub_source=$(find_grub_efi 2>/dev/null) || true
        if [[ -n "${grub_source}" ]]; then
            cp "${grub_source}" "${TFTP_ROOT}/grubx64.efi"
            chmod 644 "${TFTP_ROOT}/grubx64.efi"
            ok "Copied: grubx64.efi (from ${grub_source})"
        else
            warn "Not found: grubx64.efi"
            warn "Install grub2-efi to enable UEFI PXE boot:"
            warn "  CentOS/RHEL: dnf install grub2-efi-x64"
            warn "  Fedora:      dnf install grub2-efi-x64"
            warn "  Ubuntu/Debian: apt install grub-efi-amd64-bin"
            warn "Then re-run this script."
        fi
    fi
fi

# --- Create placeholder for BIOS boot menu ---
if [[ ! -f "${TFTP_ROOT}/pxelinux.cfg/default" ]]; then
    cat > "${TFTP_ROOT}/pxelinux.cfg/default" <<'MENU_EOF'
# BIOS PXE Boot Menu — placeholder
# This file will be replaced by Plan 02 with the full GSD boot menu
DEFAULT menu.c32
PROMPT 0
TIMEOUT 300

MENU TITLE GSD PXE Boot Menu (BIOS)

LABEL centos-stream-9
    MENU LABEL ^1) Install CentOS Stream 9 (GSD)
    KERNEL centos-stream-9/vmlinuz
    APPEND initrd=centos-stream-9/initrd.img inst.stage2=placeholder
MENU_EOF
    ok "Created placeholder: pxelinux.cfg/default"
fi

# --- Create placeholder for UEFI boot menu ---
if [[ ! -f "${TFTP_ROOT}/grub.cfg" ]]; then
    cat > "${TFTP_ROOT}/grub.cfg" <<'GRUB_EOF'
# UEFI PXE Boot Menu — placeholder
# This file will be replaced by Plan 02 with the full GSD boot menu
set timeout=30
set default=0

menuentry "Install CentOS Stream 9 (GSD)" {
    linuxefi centos-stream-9/vmlinuz inst.stage2=placeholder
    initrdefi centos-stream-9/initrd.img
}
GRUB_EOF
    ok "Created placeholder: grub.cfg"
fi

# --- Summary ---
echo ""
info "TFTP root setup complete."
echo ""
echo "Directory structure:"
if command -v tree &>/dev/null; then
    tree -L 2 "${TFTP_ROOT}" 2>/dev/null || ls -lR "${TFTP_ROOT}"
else
    ls -lR "${TFTP_ROOT}"
fi

echo ""
info "Next steps:"
info "  1. Run download-centos-boot-media.sh to fetch CentOS kernel/initrd"
info "  2. Verify bootloader files are present (pxelinux.0, grubx64.efi)"
info "  3. Create boot menus (Plan 02 handles this)"

exit 0

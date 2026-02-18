# pkg-names.sh -- Package name mapping table
#
# Maps logical package names to distro-specific package names for dnf, apt,
# and pacman backends. Sourced by pkg-abstraction.sh to resolve names before
# dispatching install/remove/query operations.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Package name mappings v1.0.0

set -euo pipefail

# ---------------------------------------------------------------------------
# Package Name Maps
# ---------------------------------------------------------------------------
# Each associative array maps: logical_name -> distro-specific package name
# Packages that share the same name across all distros need no entry (fallback
# returns the logical name unchanged).

declare -gA PKG_MAP_DNF=(
    [java-21-jdk]="java-21-openjdk"
    [java-21-jre]="java-21-openjdk-headless"
    [python3-yaml]="python3-pyyaml"
    [qemu-kvm]="qemu-kvm"
    [libvirt]="libvirt"
    [virt-install]="virt-install"
    [fs-uae]=""
    [flatpak]="flatpak"
    [SDL2]="SDL2"
    [SDL2-devel]="SDL2-devel"
    [openal-soft]="openal-soft"
)

declare -gA PKG_MAP_APT=(
    [java-21-jdk]="openjdk-21-jdk"
    [java-21-jre]="openjdk-21-jre-headless"
    [python3-yaml]="python3-yaml"
    [qemu-kvm]="qemu-system-x86"
    [libvirt]="libvirt-daemon-system"
    [virt-install]="virtinst"
    [fs-uae]="fs-uae"
    [flatpak]="flatpak"
    [SDL2]="libsdl2-2.0-0"
    [SDL2-devel]="libsdl2-dev"
    [openal-soft]="libopenal1"
)

declare -gA PKG_MAP_PACMAN=(
    [java-21-jdk]="jdk21-openjdk"
    [java-21-jre]="jre21-openjdk-headless"
    [python3]="python"
    [python3-yaml]="python-yaml"
    [qemu-kvm]="qemu-full"
    [libvirt]="libvirt"
    [virt-install]="virt-install"
    [fs-uae]="fs-uae"
    [flatpak]="flatpak"
    [SDL2]="sdl2"
    [SDL2-devel]="sdl2"
    [openal-soft]="openal"
)

# ---------------------------------------------------------------------------
# Name Resolution
# ---------------------------------------------------------------------------

# Resolve a logical package name to the distro-specific name for a given
# package manager backend.
#
# If the logical name has an explicit mapping, return the mapped value.
# If the mapped value is empty string, the package is unavailable on that
# backend -- return empty string and return code 1.
# If no mapping exists, return the logical name unchanged (many packages
# share the same name across all distros).
#
# Usage: resolved=$(resolve_pkg_name "java-21-jdk" "dnf")
# Args:
#   $1 - logical package name
#   $2 - package manager backend (dnf, apt, pacman)
resolve_pkg_name() {
    local logical_name="$1"
    local backend="$2"
    local resolved=""
    local -n map_ref="_pkg_map_ref_$$" 2>/dev/null || true

    case "${backend}" in
        dnf)
            if [[ -n "${PKG_MAP_DNF[${logical_name}]+_}" ]]; then
                resolved="${PKG_MAP_DNF[${logical_name}]}"
            else
                resolved="${logical_name}"
            fi
            ;;
        apt)
            if [[ -n "${PKG_MAP_APT[${logical_name}]+_}" ]]; then
                resolved="${PKG_MAP_APT[${logical_name}]}"
            else
                resolved="${logical_name}"
            fi
            ;;
        pacman)
            if [[ -n "${PKG_MAP_PACMAN[${logical_name}]+_}" ]]; then
                resolved="${PKG_MAP_PACMAN[${logical_name}]}"
            else
                resolved="${logical_name}"
            fi
            ;;
        *)
            # Unknown backend -- return logical name as-is
            resolved="${logical_name}"
            ;;
    esac

    # Empty resolved value means the package is not available on this backend
    if [[ -z "${resolved}" ]]; then
        return 1
    fi

    printf "%s" "${resolved}"
    return 0
}

# List all known logical package names (union of all maps).
#
# Usage: list_known_packages
list_known_packages() {
    local -A seen=()
    local name

    for name in "${!PKG_MAP_DNF[@]}"; do
        seen["${name}"]=1
    done
    for name in "${!PKG_MAP_APT[@]}"; do
        seen["${name}"]=1
    done
    for name in "${!PKG_MAP_PACMAN[@]}"; do
        seen["${name}"]=1
    done

    for name in "${!seen[@]}"; do
        printf "%s\n" "${name}"
    done | sort
}

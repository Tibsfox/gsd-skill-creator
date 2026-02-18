#!/usr/bin/env bash
# discover-distro.sh -- Distribution detection module
#
# Detects the Linux distribution, maps to package manager, firewall tool,
# and init/service system. Classifies into support tiers (1-3) and reports
# SELinux/AppArmor status. Outputs structured YAML to stdout.
#
# Tier 1 (tested): CentOS Stream 9, Fedora 39+, Ubuntu 22.04+
# Tier 2 (expected): Debian 12+, Rocky 9, Alma 9, Arch Linux
# Tier 3 (untested): everything else
#
# Exit code: always 0 (unknown distro is a valid result with tier 3)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

require_linux

# ---------------------------------------------------------------------------
# Distribution Identification
# ---------------------------------------------------------------------------

discover_os_release() {
    DISTRO_ID="unknown"
    DISTRO_VERSION="unknown"
    DISTRO_ID_LIKE=""
    DISTRO_PRETTY_NAME="Unknown Linux"

    # Primary: /etc/os-release (standard on all modern Linux)
    if [[ -f /etc/os-release ]]; then
        # Source safely -- os-release uses shell variable format
        # shellcheck source=/dev/null
        source /etc/os-release 2>/dev/null || true

        DISTRO_ID="${ID:-unknown}"
        DISTRO_VERSION="${VERSION_ID:-unknown}"
        DISTRO_ID_LIKE="${ID_LIKE:-}"
        DISTRO_PRETTY_NAME="${PRETTY_NAME:-Unknown Linux}"
    # Fallback: /etc/redhat-release
    elif [[ -f /etc/redhat-release ]]; then
        local rh_content
        rh_content="$(safe_read /etc/redhat-release)"
        if echo "${rh_content}" | grep -qi 'centos'; then
            DISTRO_ID="centos"
            DISTRO_ID_LIKE="rhel"
        elif echo "${rh_content}" | grep -qi 'fedora'; then
            DISTRO_ID="fedora"
        elif echo "${rh_content}" | grep -qi 'red hat'; then
            DISTRO_ID="rhel"
        fi
        # Try to extract version number
        local ver
        ver="$(echo "${rh_content}" | grep -oP '[0-9]+(\.[0-9]+)?' | head -1 || echo "unknown")"
        DISTRO_VERSION="${ver}"
        DISTRO_PRETTY_NAME="${rh_content}"
    # Fallback: /etc/debian_version
    elif [[ -f /etc/debian_version ]]; then
        DISTRO_ID="debian"
        DISTRO_VERSION="$(safe_read /etc/debian_version)"
        DISTRO_VERSION="$(echo "${DISTRO_VERSION}" | tr -d '[:space:]')"
        DISTRO_PRETTY_NAME="Debian ${DISTRO_VERSION}"
    fi
}

# ---------------------------------------------------------------------------
# Package Manager Mapping
# ---------------------------------------------------------------------------

map_package_manager() {
    PACKAGE_MANAGER="unknown"

    case "${DISTRO_ID}" in
        centos|rhel|rocky|alma)
            if has_command dnf; then
                PACKAGE_MANAGER="dnf"
            elif has_command yum; then
                PACKAGE_MANAGER="yum"
            fi
            ;;
        fedora)
            if has_command dnf; then
                PACKAGE_MANAGER="dnf"
            fi
            ;;
        ubuntu|debian|mint|pop|linuxmint)
            if has_command apt; then
                PACKAGE_MANAGER="apt"
            fi
            ;;
        arch|manjaro|endeavouros)
            if has_command pacman; then
                PACKAGE_MANAGER="pacman"
            fi
            ;;
        opensuse*|sles)
            if has_command zypper; then
                PACKAGE_MANAGER="zypper"
            fi
            ;;
        *)
            # Try to detect from ID_LIKE
            if [[ "${DISTRO_ID_LIKE}" =~ rhel ]] || [[ "${DISTRO_ID_LIKE}" =~ fedora ]]; then
                if has_command dnf; then
                    PACKAGE_MANAGER="dnf"
                elif has_command yum; then
                    PACKAGE_MANAGER="yum"
                fi
            elif [[ "${DISTRO_ID_LIKE}" =~ debian ]] || [[ "${DISTRO_ID_LIKE}" =~ ubuntu ]]; then
                if has_command apt; then
                    PACKAGE_MANAGER="apt"
                fi
            elif [[ "${DISTRO_ID_LIKE}" =~ arch ]]; then
                if has_command pacman; then
                    PACKAGE_MANAGER="pacman"
                fi
            fi
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Firewall Detection
# ---------------------------------------------------------------------------

detect_firewall() {
    FIREWALL_TOOL="none"

    # Check for firewalld first (common on RHEL/Fedora)
    if has_command firewall-cmd; then
        local fw_status
        fw_status="$(systemctl is-active firewalld 2>/dev/null || echo "inactive")"
        if [[ "${fw_status}" == "active" ]]; then
            FIREWALL_TOOL="firewalld"
            return
        fi
    fi

    # Check for ufw (common on Ubuntu)
    if has_command ufw; then
        local ufw_out
        ufw_out="$(ufw status 2>/dev/null || echo "")"
        if [[ -n "${ufw_out}" ]] && ! echo "${ufw_out}" | grep -qi 'inactive'; then
            FIREWALL_TOOL="ufw"
            return
        fi
    fi

    # Check for nftables (modern replacement for iptables)
    if has_command nft; then
        local nft_rules
        nft_rules="$(nft list ruleset 2>/dev/null | head -5 || echo "")"
        if [[ -n "${nft_rules}" ]]; then
            FIREWALL_TOOL="nftables"
            return
        fi
    fi

    # Fallback: iptables
    if has_command iptables; then
        local ipt_rules
        ipt_rules="$(iptables -L 2>/dev/null | head -5 || echo "")"
        if [[ -n "${ipt_rules}" ]]; then
            FIREWALL_TOOL="iptables"
            return
        fi
    fi
}

# ---------------------------------------------------------------------------
# Init System Detection
# ---------------------------------------------------------------------------

detect_init_system() {
    INIT_SYSTEM="unknown"
    INIT_VERSION=""

    # Check for systemd
    if has_command systemctl; then
        local systemd_ver
        systemd_ver="$(systemctl --version 2>/dev/null | head -1 || echo "")"
        if [[ -n "${systemd_ver}" ]]; then
            INIT_SYSTEM="systemd"
            # Extract version number from "systemd 252 (252.4-1ubuntu1)"
            INIT_VERSION="$(echo "${systemd_ver}" | grep -oP 'systemd\s+\K[0-9]+' || echo "")"
            return
        fi
    fi

    # Fallback: check PID 1
    local pid1_name
    pid1_name="$(safe_read /proc/1/comm)"
    pid1_name="$(echo "${pid1_name}" | tr -d '[:space:]')"

    case "${pid1_name}" in
        systemd)
            INIT_SYSTEM="systemd"
            ;;
        init)
            INIT_SYSTEM="sysvinit"
            ;;
        openrc-init)
            INIT_SYSTEM="openrc"
            ;;
        *)
            if [[ -n "${pid1_name}" ]]; then
                INIT_SYSTEM="${pid1_name}"
            fi
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Tier Classification
# ---------------------------------------------------------------------------

classify_tier() {
    SUPPORT_TIER=3

    case "${DISTRO_ID}" in
        centos)
            # CentOS Stream 9
            if [[ "${DISTRO_VERSION}" == "9" ]]; then
                SUPPORT_TIER=1
            fi
            ;;
        fedora)
            # Fedora 39+
            local fed_major
            fed_major="$(echo "${DISTRO_VERSION}" | cut -d. -f1)"
            if [[ -n "${fed_major}" ]] && [[ "${fed_major}" -ge 39 ]] 2>/dev/null; then
                SUPPORT_TIER=1
            fi
            ;;
        ubuntu)
            # Ubuntu 22.04+
            local ub_major
            ub_major="$(echo "${DISTRO_VERSION}" | cut -d. -f1)"
            if [[ -n "${ub_major}" ]] && [[ "${ub_major}" -ge 22 ]] 2>/dev/null; then
                SUPPORT_TIER=1
            fi
            ;;
        debian)
            # Debian 12+
            local deb_major
            deb_major="$(echo "${DISTRO_VERSION}" | cut -d. -f1)"
            if [[ -n "${deb_major}" ]] && [[ "${deb_major}" -ge 12 ]] 2>/dev/null; then
                SUPPORT_TIER=2
            fi
            ;;
        rocky|alma)
            # Rocky/Alma 9
            local el_major
            el_major="$(echo "${DISTRO_VERSION}" | cut -d. -f1)"
            if [[ -n "${el_major}" ]] && [[ "${el_major}" -ge 9 ]] 2>/dev/null; then
                SUPPORT_TIER=2
            fi
            ;;
        arch|manjaro|endeavouros)
            # Arch-based (rolling release, tier 2)
            SUPPORT_TIER=2
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Kernel Version
# ---------------------------------------------------------------------------

discover_kernel() {
    KERNEL_VERSION="$(uname -r 2>/dev/null || echo "unknown")"
    # Extract major.minor
    KERNEL_MAJOR="$(echo "${KERNEL_VERSION}" | grep -oP '^[0-9]+\.[0-9]+' || echo "unknown")"
}

# ---------------------------------------------------------------------------
# Security Module Detection
# ---------------------------------------------------------------------------

detect_security_modules() {
    # SELinux
    HAS_SELINUX="false"
    SELINUX_STATUS="absent"

    if has_command getenforce; then
        local se_mode
        se_mode="$(getenforce 2>/dev/null || echo "")"
        case "${se_mode}" in
            Enforcing)
                HAS_SELINUX="true"
                SELINUX_STATUS="enforcing"
                ;;
            Permissive)
                HAS_SELINUX="true"
                SELINUX_STATUS="permissive"
                ;;
            Disabled)
                SELINUX_STATUS="disabled"
                ;;
        esac
    fi

    # AppArmor
    HAS_APPARMOR="false"
    APPARMOR_STATUS="absent"

    if has_command aa-status; then
        if aa-status --enabled 2>/dev/null; then
            HAS_APPARMOR="true"
            APPARMOR_STATUS="enabled"
        else
            APPARMOR_STATUS="disabled"
        fi
    elif [[ -d /sys/module/apparmor ]]; then
        # AppArmor module loaded but aa-status not available
        HAS_APPARMOR="true"
        APPARMOR_STATUS="enabled"
    fi
}

# ---------------------------------------------------------------------------
# YAML Output
# ---------------------------------------------------------------------------

emit_yaml() {
    local is_tier1="false"
    if [[ "${SUPPORT_TIER}" -eq 1 ]]; then
        is_tier1="true"
    fi

    local has_systemd="false"
    if [[ "${INIT_SYSTEM}" == "systemd" ]]; then
        has_systemd="true"
    fi

    yaml_section "" "distro"
    yaml_key "  " "id" "${DISTRO_ID}"
    yaml_key "  " "version" "${DISTRO_VERSION}"
    if [[ -n "${DISTRO_ID_LIKE}" ]]; then
        yaml_key "  " "id_like" "${DISTRO_ID_LIKE}"
    fi
    yaml_key "  " "pretty_name" "${DISTRO_PRETTY_NAME}"
    yaml_key "  " "kernel" "${KERNEL_VERSION}"
    yaml_key "  " "kernel_major" "${KERNEL_MAJOR}"
    yaml_int "  " "tier" "${SUPPORT_TIER}"
    yaml_key "  " "package_manager" "${PACKAGE_MANAGER}"
    yaml_key "  " "firewall" "${FIREWALL_TOOL}"
    yaml_key "  " "init_system" "${INIT_SYSTEM}"
    if [[ -n "${INIT_VERSION}" ]]; then
        yaml_key "  " "init_version" "${INIT_VERSION}"
    fi
    yaml_section "  " "security"
    yaml_key "    " "selinux" "${SELINUX_STATUS}"
    yaml_key "    " "apparmor" "${APPARMOR_STATUS}"
    yaml_section "  " "capabilities"
    yaml_bool "    " "is_tier1" "${is_tier1}"
    yaml_bool "    " "has_systemd" "${has_systemd}"
    yaml_bool "    " "has_selinux" "${HAS_SELINUX}"
    yaml_bool "    " "has_apparmor" "${HAS_APPARMOR}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    discover_os_release
    map_package_manager
    detect_firewall
    detect_init_system
    classify_tier
    discover_kernel
    detect_security_modules
    emit_yaml
    exit 0
}

main "$@"

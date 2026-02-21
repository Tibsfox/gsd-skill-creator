#!/usr/bin/env bash
# discover-network.sh -- Network subsystem discovery module
#
# Enumerates network interfaces with type, speed, and state.
# Detects bridge, bond, and VLAN capabilities. Reports DNS/DHCP availability.
# Outputs structured YAML to stdout. Degrades gracefully when no network
# interfaces exist (emits interface_count: 0 with all capabilities false).
#
# Exit code: always 0 (limited networking is a valid state, not an error)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

require_linux

# ---------------------------------------------------------------------------
# Interface Type Detection
# ---------------------------------------------------------------------------

# Determine the type of a network interface
# Returns: ethernet, wifi, bridge, bond, vlan, virtual, loopback
detect_interface_type() {
    local iface="$1"
    local sys_path="/sys/class/net/${iface}"

    # Check for loopback
    if [[ "${iface}" == "lo" ]]; then
        echo "loopback"
        return
    fi

    # Check for bridge
    if [[ -d "${sys_path}/bridge" ]]; then
        echo "bridge"
        return
    fi

    # Check for bond
    if [[ -d "${sys_path}/bonding" ]]; then
        echo "bond"
        return
    fi

    # Check for VLAN (has a dot in name or vlan directory)
    if [[ -f "/proc/net/vlan/${iface}" ]]; then
        echo "vlan"
        return
    fi

    # Check for wireless
    if [[ -d "${sys_path}/wireless" ]] || [[ -d "${sys_path}/phy80211" ]]; then
        echo "wifi"
        return
    fi

    # Check device type from sysfs
    local dev_type
    dev_type="$(safe_read "${sys_path}/type")"
    dev_type="$(echo "${dev_type}" | tr -d '[:space:]')"

    case "${dev_type}" in
        1)
            # Type 1 can be ethernet or virtual (check for physical device)
            if [[ -L "${sys_path}/device" ]]; then
                echo "ethernet"
            else
                echo "virtual"
            fi
            ;;
        772)
            echo "loopback"
            ;;
        *)
            echo "virtual"
            ;;
    esac
}

# ---------------------------------------------------------------------------
# Interface Enumeration
# ---------------------------------------------------------------------------

discover_interfaces() {
    IFACE_COUNT=0
    IFACE_DATA=()
    HAS_ETHERNET="false"
    HAS_WIFI="false"

    if [[ -d /sys/class/net ]]; then
        for sys_iface in /sys/class/net/*; do
            local iface
            iface="$(basename "${sys_iface}")"

            # Skip loopback
            if [[ "${iface}" == "lo" ]]; then
                continue
            fi

            local iface_type state speed_mbps

            # Detect type
            iface_type="$(detect_interface_type "${iface}")"

            # Get operational state
            state="$(safe_read "${sys_iface}/operstate")"
            state="$(echo "${state}" | tr -d '[:space:]')"
            if [[ -z "${state}" ]]; then
                state="unknown"
            fi

            # Get speed (may be -1 or empty if not connected)
            speed_mbps="$(safe_read "${sys_iface}/speed")"
            speed_mbps="$(echo "${speed_mbps}" | tr -d '[:space:]')"
            if [[ -z "${speed_mbps}" ]] || [[ "${speed_mbps}" == "-1" ]]; then
                speed_mbps="-1"
            fi

            # Track capability flags
            if [[ "${iface_type}" == "ethernet" ]]; then
                HAS_ETHERNET="true"
            elif [[ "${iface_type}" == "wifi" ]]; then
                HAS_WIFI="true"
            fi

            IFACE_DATA+=("${iface}|${iface_type}|${state}|${speed_mbps}")
            IFACE_COUNT=$((IFACE_COUNT + 1))
        done
    elif has_command ip; then
        # Fallback: use ip link show
        while IFS= read -r iface; do
            [[ -z "${iface}" ]] && continue
            [[ "${iface}" == "lo" ]] && continue

            # With ip fallback, we can only get basic info
            local state="unknown"
            local link_info
            link_info="$(ip link show "${iface}" 2>/dev/null || echo "")"
            if echo "${link_info}" | grep -q 'state UP'; then
                state="up"
            elif echo "${link_info}" | grep -q 'state DOWN'; then
                state="down"
            fi

            IFACE_DATA+=("${iface}|unknown|${state}|-1")
            IFACE_COUNT=$((IFACE_COUNT + 1))
        done < <(ip -o link show 2>/dev/null | awk -F': ' '{print $2}' | sed 's/@.*//')
    fi
}

# ---------------------------------------------------------------------------
# Capability Detection
# ---------------------------------------------------------------------------

discover_capabilities() {
    HAS_BRIDGE_SUPPORT="false"
    HAS_BOND_SUPPORT="false"
    HAS_VLAN_SUPPORT="false"

    # Bridge support: check for brctl or ip link add type bridge capability
    if has_command brctl; then
        HAS_BRIDGE_SUPPORT="true"
    elif has_command ip; then
        # Check if bridge module is available via modinfo
        if modinfo bridge &>/dev/null 2>&1; then
            HAS_BRIDGE_SUPPORT="true"
        fi
    fi

    # Bond support: check if bonding module is loaded or available
    if [[ -d /sys/class/net/bonding_masters ]] || [[ -f /sys/class/net/bonding_masters ]]; then
        HAS_BOND_SUPPORT="true"
    elif modinfo bonding &>/dev/null 2>&1; then
        HAS_BOND_SUPPORT="true"
    fi

    # VLAN support: check if 8021q module is loaded or available
    if [[ -d /proc/net/vlan ]]; then
        HAS_VLAN_SUPPORT="true"
    elif modinfo 8021q &>/dev/null 2>&1; then
        HAS_VLAN_SUPPORT="true"
    fi
}

# ---------------------------------------------------------------------------
# DNS/DHCP Detection
# ---------------------------------------------------------------------------

discover_dns_dhcp() {
    DNSMASQ_AVAILABLE="false"
    SYSTEMD_RESOLVED="false"

    if has_command dnsmasq; then
        DNSMASQ_AVAILABLE="true"
    fi

    local resolved_status
    resolved_status="$(systemctl is-active systemd-resolved 2>/dev/null || echo "inactive")"
    if [[ "${resolved_status}" == "active" ]]; then
        SYSTEMD_RESOLVED="true"
    fi
}

# ---------------------------------------------------------------------------
# YAML Output
# ---------------------------------------------------------------------------

emit_yaml() {
    yaml_section "" "network"
    yaml_int "  " "interface_count" "${IFACE_COUNT}"

    if [[ ${IFACE_COUNT} -gt 0 ]]; then
        yaml_section "  " "interfaces"
        for iface_entry in "${IFACE_DATA[@]}"; do
            local name itype state speed
            name="$(echo "${iface_entry}" | cut -d'|' -f1)"
            itype="$(echo "${iface_entry}" | cut -d'|' -f2)"
            state="$(echo "${iface_entry}" | cut -d'|' -f3)"
            speed="$(echo "${iface_entry}" | cut -d'|' -f4)"
            printf "    - name: %s\n" "${name}"
            yaml_key "      " "type" "${itype}"
            yaml_key "      " "state" "${state}"
            yaml_int "      " "speed_mbps" "${speed}"
        done
    else
        printf "  interfaces: []\n"
    fi

    yaml_section "  " "dns"
    yaml_bool "    " "dnsmasq_available" "${DNSMASQ_AVAILABLE}"
    yaml_bool "    " "systemd_resolved" "${SYSTEMD_RESOLVED}"

    yaml_section "  " "capabilities"
    yaml_bool "    " "has_ethernet" "${HAS_ETHERNET}"
    yaml_bool "    " "has_wifi" "${HAS_WIFI}"
    yaml_bool "    " "has_bridge_support" "${HAS_BRIDGE_SUPPORT}"
    yaml_bool "    " "has_bond_support" "${HAS_BOND_SUPPORT}"
    yaml_bool "    " "has_vlan_support" "${HAS_VLAN_SUPPORT}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    discover_interfaces
    discover_capabilities
    discover_dns_dhcp
    emit_yaml
    exit 0
}

main "$@"

#!/usr/bin/env bash
# discover-usb.sh -- USB subsystem discovery module
#
# Identifies USB host controllers, connected devices, and supported USB versions.
# Outputs structured YAML to stdout. Degrades gracefully when USB subsystem
# information is unavailable (emits present: false with zeroed counts).
#
# Exit code: always 0 (missing USB is a valid state, not an error)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"

require_linux

# ---------------------------------------------------------------------------
# USB Controller Discovery
# ---------------------------------------------------------------------------

discover_controllers() {
    CONTROLLER_COUNT=0
    CONTROLLER_DATA=()
    HAS_USB3="false"
    HAS_USB2="false"
    MAX_VERSION="unknown"

    # Try lspci for controller detection
    if has_command lspci; then
        local usb_controllers
        usb_controllers="$(lspci 2>/dev/null | grep -i 'usb controller' || echo "")"

        if [[ -n "${usb_controllers}" ]]; then
            while IFS= read -r line; do
                [[ -z "${line}" ]] && continue

                local ctrl_type="unknown"
                local usb_version="unknown"

                if echo "${line}" | grep -qi 'xhci\|usb 3'; then
                    ctrl_type="xhci"
                    usb_version="3.0"
                    HAS_USB3="true"
                elif echo "${line}" | grep -qi 'ehci\|usb 2\|usb2'; then
                    ctrl_type="ehci"
                    usb_version="2.0"
                    HAS_USB2="true"
                elif echo "${line}" | grep -qi 'ohci'; then
                    ctrl_type="ohci"
                    usb_version="1.1"
                elif echo "${line}" | grep -qi 'uhci'; then
                    ctrl_type="uhci"
                    usb_version="1.1"
                fi

                CONTROLLER_DATA+=("${ctrl_type}|${usb_version}")
                CONTROLLER_COUNT=$((CONTROLLER_COUNT + 1))
            done <<< "${usb_controllers}"
        fi
    fi

    # Fallback: check /sys/bus/usb/devices for root hubs
    if [[ ${CONTROLLER_COUNT} -eq 0 ]] && [[ -d /sys/bus/usb/devices ]]; then
        for usb_dev in /sys/bus/usb/devices/usb*; do
            [[ -d "${usb_dev}" ]] || continue

            local version
            version="$(safe_read "${usb_dev}/version")"
            version="$(echo "${version}" | tr -d '[:space:]')"

            local ctrl_type="unknown"
            local usb_version="${version}"

            case "${version}" in
                3.*)
                    ctrl_type="xhci"
                    HAS_USB3="true"
                    ;;
                2.*)
                    ctrl_type="ehci"
                    HAS_USB2="true"
                    ;;
                1.*)
                    ctrl_type="ohci"
                    ;;
            esac

            CONTROLLER_DATA+=("${ctrl_type}|${usb_version}")
            CONTROLLER_COUNT=$((CONTROLLER_COUNT + 1))
        done
    fi

    # Determine max version
    if [[ "${HAS_USB3}" == "true" ]]; then
        # Try to detect 3.1/3.2 from sysfs
        local max_found="3.0"
        if [[ -d /sys/bus/usb/devices ]]; then
            for usb_dev in /sys/bus/usb/devices/usb*; do
                local ver
                ver="$(safe_read "${usb_dev}/version")"
                ver="$(echo "${ver}" | tr -d '[:space:]')"
                case "${ver}" in
                    3.2*) max_found="3.2" ;;
                    3.1*) [[ "${max_found}" != "3.2" ]] && max_found="3.1" ;;
                esac
            done
        fi
        MAX_VERSION="${max_found}"
    elif [[ "${HAS_USB2}" == "true" ]]; then
        MAX_VERSION="2.0"
    elif [[ ${CONTROLLER_COUNT} -gt 0 ]]; then
        MAX_VERSION="1.1"
    fi
}

# ---------------------------------------------------------------------------
# USB Device Discovery
# ---------------------------------------------------------------------------

discover_devices() {
    DEVICE_COUNT=0
    DEVICE_CLASSES=()
    local -A seen_classes=()

    # Try lsusb for device enumeration
    if has_command lsusb; then
        local lsusb_output
        lsusb_output="$(lsusb 2>/dev/null || echo "")"

        if [[ -n "${lsusb_output}" ]]; then
            DEVICE_COUNT="$(echo "${lsusb_output}" | wc -l)"
            # Subtract hub devices for a more useful count
            local hub_count
            hub_count="$(echo "${lsusb_output}" | grep -ci 'hub' || echo "0")"
            DEVICE_COUNT=$((DEVICE_COUNT - hub_count))
            if [[ ${DEVICE_COUNT} -lt 0 ]]; then
                DEVICE_COUNT=0
            fi
        fi
    fi

    # Discover device classes from sysfs
    if [[ -d /sys/bus/usb/devices ]]; then
        for usb_dev in /sys/bus/usb/devices/[0-9]*; do
            [[ -d "${usb_dev}" ]] || continue

            # Skip root hubs (usb1, usb2, etc.)
            local devname
            devname="$(basename "${usb_dev}")"
            [[ "${devname}" =~ ^usb[0-9]+$ ]] && continue

            local dev_class
            dev_class="$(safe_read "${usb_dev}/bDeviceClass")"
            dev_class="$(echo "${dev_class}" | tr -d '[:space:]')"

            local class_name=""
            case "${dev_class}" in
                00) ;; # Defined at interface level, skip
                01) class_name="audio" ;;
                02) class_name="communication" ;;
                03) class_name="hid" ;;
                05) class_name="physical" ;;
                06) class_name="image" ;;
                07) class_name="printer" ;;
                08) class_name="storage" ;;
                09) ;; # Hub, skip
                0a) class_name="cdc-data" ;;
                0b) class_name="smart-card" ;;
                0d) class_name="content-security" ;;
                0e) class_name="video" ;;
                0f) class_name="healthcare" ;;
                10) class_name="audio-video" ;;
                dc) class_name="diagnostic" ;;
                e0) class_name="wireless" ;;
                ef) class_name="miscellaneous" ;;
                fe) class_name="application-specific" ;;
                ff) class_name="vendor-specific" ;;
            esac

            # Also check interface classes for class 00 devices
            if [[ -z "${class_name}" ]] && [[ "${dev_class}" == "00" || -z "${dev_class}" ]]; then
                for iface in "${usb_dev}"/*:*; do
                    [[ -d "${iface}" ]] || continue
                    local iface_class
                    iface_class="$(safe_read "${iface}/bInterfaceClass")"
                    iface_class="$(echo "${iface_class}" | tr -d '[:space:]')"
                    case "${iface_class}" in
                        01) class_name="audio" ;;
                        03) class_name="hid" ;;
                        08) class_name="storage" ;;
                        0e) class_name="video" ;;
                        e0) class_name="wireless" ;;
                    esac
                    [[ -n "${class_name}" ]] && break
                done
            fi

            if [[ -n "${class_name}" ]] && [[ -z "${seen_classes[${class_name}]+x}" ]]; then
                seen_classes["${class_name}"]=1
                DEVICE_CLASSES+=("${class_name}")
            fi
        done
    fi

    # If lsusb wasn't available, count from sysfs (excluding hubs and root hubs)
    if [[ ${DEVICE_COUNT} -eq 0 ]] && [[ -d /sys/bus/usb/devices ]]; then
        for usb_dev in /sys/bus/usb/devices/[0-9]*; do
            [[ -d "${usb_dev}" ]] || continue
            local devname
            devname="$(basename "${usb_dev}")"
            [[ "${devname}" =~ ^usb[0-9]+$ ]] && continue
            local dev_class
            dev_class="$(safe_read "${usb_dev}/bDeviceClass")"
            dev_class="$(echo "${dev_class}" | tr -d '[:space:]')"
            [[ "${dev_class}" == "09" ]] && continue  # Skip hubs
            DEVICE_COUNT=$((DEVICE_COUNT + 1))
        done
    fi
}

# ---------------------------------------------------------------------------
# YAML Output
# ---------------------------------------------------------------------------

emit_yaml() {
    local usb_present="false"
    if [[ ${CONTROLLER_COUNT} -gt 0 ]]; then
        usb_present="true"
    fi

    yaml_section "" "usb"
    yaml_bool "  " "present" "${usb_present}"
    yaml_int "  " "controller_count" "${CONTROLLER_COUNT}"

    if [[ ${CONTROLLER_COUNT} -gt 0 ]]; then
        yaml_section "  " "controllers"
        for ctrl_entry in "${CONTROLLER_DATA[@]}"; do
            local ctype cversion
            ctype="$(echo "${ctrl_entry}" | cut -d'|' -f1)"
            cversion="$(echo "${ctrl_entry}" | cut -d'|' -f2)"
            printf "    - type: %s\n" "${ctype}"
            yaml_key "      " "usb_version" "${cversion}"
        done
    else
        printf "  controllers: []\n"
    fi

    yaml_int "  " "device_count" "${DEVICE_COUNT}"

    if [[ ${#DEVICE_CLASSES[@]} -gt 0 ]]; then
        yaml_section "  " "device_classes"
        for dc in "${DEVICE_CLASSES[@]}"; do
            yaml_list_item "    " "${dc}"
        done
    else
        printf "  device_classes: []\n"
    fi

    yaml_section "  " "capabilities"
    yaml_bool "    " "has_usb3" "${HAS_USB3}"
    yaml_bool "    " "has_usb2" "${HAS_USB2}"
    yaml_key "    " "max_version" "${MAX_VERSION}"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

main() {
    discover_controllers
    discover_devices
    emit_yaml
    exit 0
}

main "$@"

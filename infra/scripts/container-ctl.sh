#!/usr/bin/env bash
# container-ctl.sh -- CLI entry point for container-based Minecraft deployment
#
# Manages container lifecycle via Podman (preferred) or Docker (fallback).
# Used as an alternative to vm-ctl.sh on resource-constrained machines
# that lack hypervisor support.
#
# Usage: container-ctl.sh [--runtime podman|docker] <operation> [args...]
#
# Operations:
#   minecraft <name> --ram-mb N [--port N] [--rcon-port N] [--data-dir PATH]
#   create <name> --image IMAGE [--port HOST:CONTAINER...] [--env KEY=VALUE...] [--volume HOST:CONTAINER...]
#   start <name>
#   stop <name>
#   destroy <name>
#   status <name>
#   list
#   logs <name> [--lines N]
#   exec <name> -- <command...>
#   detect              Print detected container runtime
#
# Exit codes:
#   0 -- Success
#   1 -- Operation error
#   2 -- No container runtime available
#   3 -- Invalid arguments

set -euo pipefail

# --- Script location ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# --- Source shared libraries ---
# shellcheck source=lib/discovery-common.sh
source "${SCRIPT_DIR}/lib/discovery-common.sh"
# shellcheck source=lib/container-fallback.sh
source "${SCRIPT_DIR}/lib/container-fallback.sh"

# --- Helper functions ---
msg() { printf "[container-ctl] %s\n" "$*" >&2; }
err() { printf "[container-ctl] ERROR: %s\n" "$*" >&2; }

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [--runtime podman|docker] <operation> [args...]

Container lifecycle manager for Minecraft server deployment and general
container management. Auto-detects Podman (preferred) or Docker.

Operations:
  minecraft <name> --ram-mb N [--port N] [--rcon-port N] [--data-dir PATH]
      Deploy a Minecraft server using itzg/minecraft-server (Fabric)
      Defaults: port=25565, rcon-port=25575, data-dir=\$HOME/minecraft-data/<name>

  create <name> --image IMAGE [--port HOST:CONTAINER...] [--env KEY=VALUE...] [--volume HOST:CONTAINER...]
      Create a generic container with specified image and configuration

  start <name>
      Start a stopped container

  stop <name>
      Stop a running container (30s graceful timeout)

  destroy <name>
      Remove a container and its runtime state (data volumes preserved)

  status <name>
      Print container state: running/stopped/not-found

  list
      List all containers managed by the active runtime

  logs <name> [--lines N]
      Show container logs (default: 50 lines)

  exec <name> -- <command...>
      Execute a command inside a running container

  detect
      Print which container runtime was auto-detected

Options:
  --runtime podman|docker   Override auto-detection with explicit runtime
  --help, -h                Show this help message

Exit Codes:
  0  Success
  1  Operation error
  2  No container runtime available
  3  Invalid arguments

Examples:
  # Deploy a Minecraft server with 4GB RAM
  ${SCRIPT_NAME} minecraft survival --ram-mb 4096

  # Deploy with custom ports and data directory
  ${SCRIPT_NAME} minecraft creative --ram-mb 4096 --port 25566 --rcon-port 25576 --data-dir /srv/mc/creative

  # Use Docker explicitly instead of Podman
  ${SCRIPT_NAME} --runtime docker minecraft survival --ram-mb 4096

  # Create a generic container
  ${SCRIPT_NAME} create myapp --image nginx:latest --port 8080:80

  # Check container status
  ${SCRIPT_NAME} status survival

  # View Minecraft server logs
  ${SCRIPT_NAME} logs survival --lines 100

  # Run RCON command inside container
  ${SCRIPT_NAME} exec survival -- rcon-cli list

  # See which runtime would be used
  ${SCRIPT_NAME} detect
EOF
}

# --- Argument parsing (phase 1: extract --runtime and --help) ---
RUNTIME_OVERRIDE=""
ARGS=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --runtime)
            if [[ -z "${2:-}" ]]; then
                err "Missing value for --runtime (expected: podman, docker)"
                exit 3
            fi
            RUNTIME_OVERRIDE="$2"
            shift 2
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

# Restore positional arguments
set -- "${ARGS[@]+"${ARGS[@]}"}"

# --- Extract operation ---
if [[ $# -lt 1 ]]; then
    err "No operation specified"
    echo "" >&2
    usage
    exit 3
fi

OPERATION="$1"
shift

# --- Handle detect operation (no runtime init needed) ---
if [[ "${OPERATION}" == "detect" ]]; then
    detected=$(ct_detect_runtime)
    if [[ "${detected}" == "none" ]]; then
        msg "No container runtime detected"
        msg "Install podman (recommended) or docker"
        exit 0
    fi
    msg "Detected runtime: ${detected}"
    echo "${detected}"
    exit 0
fi

# --- Resolve and initialize runtime ---
if [[ -n "${RUNTIME_OVERRIDE}" ]]; then
    case "${RUNTIME_OVERRIDE}" in
        podman|docker)
            if ! has_command "${RUNTIME_OVERRIDE}"; then
                err "Requested runtime '${RUNTIME_OVERRIDE}' is not installed"
                exit 2
            fi
            _CT_RUNTIME="${RUNTIME_OVERRIDE}"
            ;;
        *)
            err "Invalid runtime: '${RUNTIME_OVERRIDE}' (valid: podman, docker)"
            exit 3
            ;;
    esac
else
    _CT_RUNTIME=$(ct_detect_runtime)
    if [[ "${_CT_RUNTIME}" == "none" ]]; then
        err "No container runtime available"
        err "Install podman (recommended) or docker"
        exit 2
    fi
fi

msg "Using runtime: ${_CT_RUNTIME}"

# --- Dispatch operations ---
case "${OPERATION}" in
    minecraft)
        # Parse minecraft arguments
        if [[ $# -lt 1 ]]; then
            err "minecraft requires: <name> --ram-mb N [--port N] [--rcon-port N] [--data-dir PATH]"
            exit 3
        fi

        MC_NAME="$1"
        shift

        MC_RAM_MB=""
        MC_PORT="25565"
        MC_RCON_PORT="25575"
        MC_DATA_DIR="${HOME}/minecraft-data/${MC_NAME}"

        while [[ $# -gt 0 ]]; do
            case "$1" in
                --ram-mb)
                    MC_RAM_MB="${2:-}"
                    shift 2
                    ;;
                --port)
                    MC_PORT="${2:-}"
                    shift 2
                    ;;
                --rcon-port)
                    MC_RCON_PORT="${2:-}"
                    shift 2
                    ;;
                --data-dir)
                    MC_DATA_DIR="${2:-}"
                    shift 2
                    ;;
                *)
                    err "Unknown minecraft option: $1"
                    exit 3
                    ;;
            esac
        done

        if [[ -z "${MC_RAM_MB}" ]]; then
            err "Missing required --ram-mb for minecraft operation"
            err "Usage: ${SCRIPT_NAME} minecraft <name> --ram-mb N [--port N] [--rcon-port N] [--data-dir PATH]"
            exit 3
        fi

        if [[ ! "${MC_RAM_MB}" =~ ^[0-9]+$ ]] || [[ "${MC_RAM_MB}" -le 0 ]]; then
            err "--ram-mb must be a positive integer (got: ${MC_RAM_MB})"
            exit 3
        fi

        msg "Deploying Minecraft server '${MC_NAME}'"
        msg "  RAM: ${MC_RAM_MB}MB | Port: ${MC_PORT} | RCON: ${MC_RCON_PORT}"
        msg "  Data: ${MC_DATA_DIR}"
        msg "  Image: itzg/minecraft-server (Fabric 1.21.4)"

        ct_create_minecraft "${MC_NAME}" "${MC_RAM_MB}" "${MC_PORT}" "${MC_RCON_PORT}" "${MC_DATA_DIR}"
        msg "Minecraft server '${MC_NAME}' created successfully"
        ;;

    create)
        if [[ $# -lt 1 ]]; then
            err "create requires: <name> --image IMAGE [--port HOST:CONTAINER...] [--env KEY=VALUE...] [--volume HOST:CONTAINER...]"
            exit 3
        fi

        CT_NAME="$1"
        shift

        CT_IMAGE=""
        CT_PORTS=""
        CT_ENVS=""
        CT_VOLS=""

        while [[ $# -gt 0 ]]; do
            case "$1" in
                --image)
                    CT_IMAGE="${2:-}"
                    shift 2
                    ;;
                --port)
                    CT_PORTS="${CT_PORTS:+${CT_PORTS} }${2:-}"
                    shift 2
                    ;;
                --env)
                    CT_ENVS="${CT_ENVS:+${CT_ENVS} }${2:-}"
                    shift 2
                    ;;
                --volume)
                    CT_VOLS="${CT_VOLS:+${CT_VOLS} }${2:-}"
                    shift 2
                    ;;
                *)
                    err "Unknown create option: $1"
                    exit 3
                    ;;
            esac
        done

        if [[ -z "${CT_IMAGE}" ]]; then
            err "Missing required --image for create operation"
            exit 3
        fi

        msg "Creating container '${CT_NAME}' from image '${CT_IMAGE}'"
        ct_create "${CT_NAME}" "${CT_IMAGE}" "${CT_PORTS}" "${CT_ENVS}" "${CT_VOLS}"
        msg "Container '${CT_NAME}' created successfully"
        ;;

    start)
        if [[ $# -lt 1 ]]; then
            err "start requires: <name>"
            exit 3
        fi
        msg "Starting container '$1'"
        ct_start "$1"
        msg "Container '$1' started"
        ;;

    stop)
        if [[ $# -lt 1 ]]; then
            err "stop requires: <name>"
            exit 3
        fi
        msg "Stopping container '$1'"
        ct_stop "$1"
        msg "Container '$1' stopped"
        ;;

    destroy)
        if [[ $# -lt 1 ]]; then
            err "destroy requires: <name>"
            exit 3
        fi
        msg "Destroying container '$1'"
        ct_destroy "$1"
        msg "Container '$1' destroyed"
        ;;

    status)
        if [[ $# -lt 1 ]]; then
            err "status requires: <name>"
            exit 3
        fi
        state=$(ct_status "$1")
        msg "Container '$1': ${state}"
        echo "${state}"
        ;;

    list)
        ct_list
        ;;

    logs)
        if [[ $# -lt 1 ]]; then
            err "logs requires: <name> [--lines N]"
            exit 3
        fi

        LOG_NAME="$1"
        shift
        LOG_LINES="50"

        while [[ $# -gt 0 ]]; do
            case "$1" in
                --lines)
                    LOG_LINES="${2:-50}"
                    shift 2
                    ;;
                *)
                    err "Unknown logs option: $1"
                    exit 3
                    ;;
            esac
        done

        ct_logs "${LOG_NAME}" "${LOG_LINES}"
        ;;

    exec)
        if [[ $# -lt 1 ]]; then
            err "exec requires: <name> -- <command...>"
            exit 3
        fi

        EXEC_NAME="$1"
        shift

        # Skip the -- separator if present
        if [[ "${1:-}" == "--" ]]; then
            shift
        fi

        if [[ $# -lt 1 ]]; then
            err "exec requires a command after container name"
            err "Usage: ${SCRIPT_NAME} exec <name> -- <command...>"
            exit 3
        fi

        ct_exec "${EXEC_NAME}" "$@"
        ;;

    *)
        err "Unknown operation: '${OPERATION}'"
        err "Valid operations: minecraft, create, start, stop, destroy, status, list, logs, exec, detect"
        exit 3
        ;;
esac

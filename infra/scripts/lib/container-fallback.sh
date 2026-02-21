# container-fallback.sh -- Container runtime abstraction for Podman/Docker
#
# Sourced by container-ctl.sh for Minecraft server deployment and general
# container management when VMs are unavailable (no VT-x, insufficient RAM,
# no hypervisor installed).
#
# Podman preferred (rootless, daemonless). Docker used as fallback.
#
# This file has NO shebang -- it is meant to be sourced, not executed directly.
# All functions use local variables and produce no side effects when sourced.
#
# Required: discovery-common.sh sourced first (provides has_command, warn)

set -euo pipefail

# Source discovery-common.sh for has_command, warn, YAML helpers
_CF_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=discovery-common.sh
source "${_CF_LIB_DIR}/discovery-common.sh"

# ---------------------------------------------------------------------------
# Runtime state
# ---------------------------------------------------------------------------

# Detected container runtime ("podman", "docker", or empty if none)
_CT_RUNTIME=""

# ---------------------------------------------------------------------------
# Runtime detection
# ---------------------------------------------------------------------------

# Detect the best available container runtime.
# Priority: podman > docker (prefer rootless, daemonless).
# Returns: "podman", "docker", or "none" via stdout.
ct_detect_runtime() {
    if has_command podman; then
        echo "podman"
        return 0
    fi
    if has_command docker; then
        echo "docker"
        return 0
    fi
    echo "none"
    return 0
}

# ---------------------------------------------------------------------------
# Runtime command wrapper
# ---------------------------------------------------------------------------

# Execute a command using the detected container runtime.
# All ct_* functions delegate through this wrapper.
#
# Usage: ct_cmd run -d --name mycontainer myimage
ct_cmd() {
    if [[ -z "${_CT_RUNTIME}" ]]; then
        warn "No container runtime set. Call ct_detect_runtime first."
        return 1
    fi
    "${_CT_RUNTIME}" "$@"
}

# ---------------------------------------------------------------------------
# Container operations
# ---------------------------------------------------------------------------

# Create and start a container.
# If the container already exists (inspect returns 0), warn and return 0 (idempotent).
#
# Usage: ct_create "name" "image" "port1:port1 port2:port2" "KEY1=VAL1 KEY2=VAL2" "host1:cont1 host2:cont2"
#
# Arguments:
#   name           -- Container name
#   image          -- Image to run
#   port_mappings  -- Space-separated list of "host:container" port pairs (can be empty)
#   env_vars       -- Space-separated list of "KEY=VALUE" pairs (can be empty)
#   volume_mounts  -- Space-separated list of "host:container" volume pairs (can be empty)
ct_create() {
    local name="$1"
    local image="$2"
    local port_mappings="${3:-}"
    local env_vars="${4:-}"
    local volume_mounts="${5:-}"

    # Idempotent: if container already exists, warn and return 0
    if ct_cmd inspect "${name}" &>/dev/null; then
        warn "Container '${name}' already exists -- skipping create"
        return 0
    fi

    # Build the run command
    local -a run_args=()
    run_args+=(run -d --name "${name}" --restart unless-stopped)

    # Add port mappings
    local mapping
    if [[ -n "${port_mappings}" ]]; then
        for mapping in ${port_mappings}; do
            run_args+=(-p "${mapping}")
        done
    fi

    # Add environment variables
    local envvar
    if [[ -n "${env_vars}" ]]; then
        for envvar in ${env_vars}; do
            run_args+=(-e "${envvar}")
        done
    fi

    # Add volume mounts
    local vol
    if [[ -n "${volume_mounts}" ]]; then
        for vol in ${volume_mounts}; do
            run_args+=(-v "${vol}")
        done
    fi

    # Append image name
    run_args+=("${image}")

    ct_cmd "${run_args[@]}"
}

# Create a Minecraft server container using itzg/minecraft-server image.
# Convenience wrapper with Minecraft-specific defaults (Fabric, RCON, EULA).
#
# Usage: ct_create_minecraft "name" "ram_mb" "server_port" "rcon_port" "data_dir"
#
# Arguments:
#   name        -- Container name (e.g., "minecraft-survival")
#   ram_mb      -- RAM allocation in MB (e.g., 4096)
#   server_port -- Host port for Minecraft (maps to 25565)
#   rcon_port   -- Host port for RCON (maps to 25575)
#   data_dir    -- Host directory for world data (mounted to /data)
ct_create_minecraft() {
    local name="$1"
    local ram_mb="$2"
    local server_port="${3:-25565}"
    local rcon_port="${4:-25575}"
    local data_dir="${5:-${HOME}/minecraft-data/${name}}"

    local image="itzg/minecraft-server"

    local port_mappings="${server_port}:25565 ${rcon_port}:25575"

    local env_vars="EULA=TRUE TYPE=FABRIC VERSION=1.21.4 MEMORY=${ram_mb}M ENABLE_RCON=true"

    local volume_mounts="${data_dir}:/data"

    # Ensure data directory exists
    if [[ ! -d "${data_dir}" ]]; then
        mkdir -p "${data_dir}"
    fi

    ct_create "${name}" "${image}" "${port_mappings}" "${env_vars}" "${volume_mounts}"
}

# Start a container. If already running, return 0 (idempotent).
#
# Usage: ct_start "name"
ct_start() {
    local name="$1"
    local current_status
    current_status=$(ct_status "${name}")

    if [[ "${current_status}" == "running" ]]; then
        return 0
    fi

    ct_cmd start "${name}"
}

# Stop a container with 30-second timeout. If already stopped, return 0 (idempotent).
#
# Usage: ct_stop "name"
ct_stop() {
    local name="$1"
    local current_status
    current_status=$(ct_status "${name}")

    if [[ "${current_status}" == "stopped" || "${current_status}" == "not-found" ]]; then
        return 0
    fi

    ct_cmd stop -t 30 "${name}"
}

# Destroy a container (stop + remove). If not found, return 0 (idempotent).
#
# Usage: ct_destroy "name"
ct_destroy() {
    local name="$1"

    # Stop if running (ignore errors)
    ct_cmd stop -t 30 "${name}" 2>/dev/null || true

    # Remove (ignore errors if not found)
    ct_cmd rm -f "${name}" 2>/dev/null || true

    return 0
}

# Get container status. Output single word to stdout.
# Returns: "running", "stopped", or "not-found"
#
# Usage: ct_status "name"
ct_status() {
    local name="$1"
    local state

    if ! ct_cmd inspect --format '{{.State.Status}}' "${name}" &>/dev/null; then
        echo "not-found"
        return 0
    fi

    state=$(ct_cmd inspect --format '{{.State.Status}}' "${name}" 2>/dev/null)

    case "${state}" in
        running)
            echo "running"
            ;;
        exited|stopped|created)
            echo "stopped"
            ;;
        *)
            echo "stopped"
            ;;
    esac
    return 0
}

# List all container names.
#
# Usage: ct_list
ct_list() {
    ct_cmd ps -a --format '{{.Names}}'
}

# Show container logs (tail N lines). Default: 50 lines.
#
# Usage: ct_logs "name" [lines]
ct_logs() {
    local name="$1"
    local lines="${2:-50}"

    ct_cmd logs --tail "${lines}" "${name}"
}

# Execute a command inside a running container.
#
# Usage: ct_exec "name" command [args...]
ct_exec() {
    local name="$1"
    shift

    ct_cmd exec "${name}" "$@"
}

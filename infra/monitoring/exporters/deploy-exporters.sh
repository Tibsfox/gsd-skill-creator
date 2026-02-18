#!/usr/bin/env bash
# deploy-exporters.sh -- Deploy Prometheus node_exporter and JMX exporter
#
# Installs and configures both exporters for Minecraft server monitoring:
#   1. node_exporter: System metrics on port 9100 (systemd, processes, filesystem)
#   2. JMX exporter:  JVM metrics on port 9404 (memory, GC, threads, classloading)
#
# node_exporter runs as a standalone systemd service.
# JMX exporter attaches as a Java agent to the Minecraft JVM and activates
# on the next minecraft.service restart.
#
# Requirements satisfied:
#   OPS-04: Exporter deployment with idempotent operation and firewall management
#
# Usage: deploy-exporters.sh [OPTIONS]
#
# Exit codes:
#   0 -- Success
#   1 -- Error
#   2 -- Usage error

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

TARGET_HOST=""
LOCAL_DEPLOY=true
NODE_EXPORTER_VERSION="1.7.0"
JMX_EXPORTER_VERSION="0.20.0"
MINECRAFT_HOME="/opt/minecraft"
JVM_FLAGS_PATH="/opt/minecraft/server/jvm-flags.conf"
DRY_RUN=false

# ---------------------------------------------------------------------------
# Colors (if stderr is a terminal)
# ---------------------------------------------------------------------------

if [[ -t 2 ]]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED='' GREEN='' YELLOW='' BLUE='' NC=''
fi

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

info()  { echo -e "${BLUE}[INFO]${NC}  $*" >&2; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
die()   { error "$@"; exit 1; }

# ---------------------------------------------------------------------------
# Usage
# ---------------------------------------------------------------------------

usage() {
    cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

Deploy Prometheus node_exporter and JMX exporter for Minecraft server
monitoring. Installs binaries, configures systemd services, patches JVM
flags, and opens firewall ports.

Options:
  --target-host HOST           SSH to remote host (e.g., gsd@mc-server-01)
  --local                      Deploy locally (default)
  --node-exporter-version VER  node_exporter version (default: ${NODE_EXPORTER_VERSION})
  --jmx-exporter-version VER   JMX exporter version (default: ${JMX_EXPORTER_VERSION})
  --minecraft-home PATH        Minecraft home directory (default: ${MINECRAFT_HOME})
  --jvm-flags-path PATH        JVM flags file to patch (default: ${JVM_FLAGS_PATH})
  --dry-run                    Show actions without executing
  --help                       Show this help message

Exit Codes:
  0  Success
  1  Error
  2  Usage error

Exporters Deployed:
  node_exporter (port 9100)  System metrics: CPU, memory, disk, network, systemd
  JMX exporter  (port 9404)  JVM metrics: heap, GC, threads, classloading

The JMX exporter attaches as a Java agent and will activate on the next
minecraft.service restart. node_exporter starts immediately.

Examples:
  # Deploy both exporters locally
  ${SCRIPT_NAME} --local

  # Deploy to remote server
  ${SCRIPT_NAME} --target-host gsd@mc-server-01

  # Dry run to see what would happen
  ${SCRIPT_NAME} --dry-run

  # Custom versions
  ${SCRIPT_NAME} --node-exporter-version 1.8.0 --jmx-exporter-version 0.21.0
EOF
}

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target-host)
            TARGET_HOST="${2:?'--target-host requires a host argument'}"
            LOCAL_DEPLOY=false
            shift 2
            ;;
        --local)
            LOCAL_DEPLOY=true
            shift
            ;;
        --node-exporter-version)
            NODE_EXPORTER_VERSION="${2:?'--node-exporter-version requires a version'}"
            shift 2
            ;;
        --jmx-exporter-version)
            JMX_EXPORTER_VERSION="${2:?'--jmx-exporter-version requires a version'}"
            shift 2
            ;;
        --minecraft-home)
            MINECRAFT_HOME="${2:?'--minecraft-home requires a path'}"
            shift 2
            ;;
        --jvm-flags-path)
            JVM_FLAGS_PATH="${2:?'--jvm-flags-path requires a path'}"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            echo "Use --help for usage information." >&2
            exit 2
            ;;
    esac
done

# ---------------------------------------------------------------------------
# Target command execution (local or remote)
# ---------------------------------------------------------------------------

target_cmd() {
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        eval "$@"
    else
        ssh -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new \
            "${TARGET_HOST}" "$@"
    fi
}

# ---------------------------------------------------------------------------
# File transfer to target
# ---------------------------------------------------------------------------

target_put() {
    local src="$1"
    local dest="$2"
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        cp "${src}" "${dest}"
    else
        scp -o BatchMode=yes -o ConnectTimeout=10 \
            "${src}" "${TARGET_HOST}:${dest}"
    fi
}

# ---------------------------------------------------------------------------
# Download helper with SHA-256 verification
# ---------------------------------------------------------------------------

download_file() {
    local url="$1"
    local dest="$2"
    local checksum="${3:-}"

    info "Downloading: ${url}"

    if command -v curl &>/dev/null; then
        target_cmd "curl -fsSL '${url}' -o '${dest}'"
    elif command -v wget &>/dev/null; then
        target_cmd "wget -q '${url}' -O '${dest}'"
    else
        die "Neither curl nor wget available for download"
    fi

    if [[ -n "${checksum}" ]]; then
        local actual
        actual=$(target_cmd "sha256sum '${dest}'" | cut -d' ' -f1)
        if [[ "${actual}" != "${checksum}" ]]; then
            die "SHA-256 checksum mismatch for ${dest}: expected ${checksum}, got ${actual}"
        fi
        ok "Checksum verified: ${dest}"
    fi
}

# ---------------------------------------------------------------------------
# Open firewall port
# ---------------------------------------------------------------------------

open_firewall_port() {
    local port="$1"

    # Try firewall-cmd first (CentOS/RHEL/Fedora)
    if target_cmd "command -v firewall-cmd" &>/dev/null; then
        if target_cmd "firewall-cmd --query-port=${port}/tcp" &>/dev/null; then
            info "Firewall: port ${port}/tcp already open (firewalld)"
        else
            target_cmd "firewall-cmd --permanent --add-port=${port}/tcp"
            target_cmd "firewall-cmd --reload"
            ok "Firewall: opened port ${port}/tcp (firewalld)"
        fi
        return 0
    fi

    # Try ufw (Ubuntu/Debian)
    if target_cmd "command -v ufw" &>/dev/null; then
        if target_cmd "ufw status | grep -q '${port}/tcp.*ALLOW'" 2>/dev/null; then
            info "Firewall: port ${port}/tcp already open (ufw)"
        else
            target_cmd "ufw allow ${port}/tcp"
            ok "Firewall: opened port ${port}/tcp (ufw)"
        fi
        return 0
    fi

    # Try iptables as last resort
    if target_cmd "command -v iptables" &>/dev/null; then
        if target_cmd "iptables -C INPUT -p tcp --dport ${port} -j ACCEPT" &>/dev/null; then
            info "Firewall: port ${port}/tcp already open (iptables)"
        else
            target_cmd "iptables -A INPUT -p tcp --dport ${port} -j ACCEPT"
            ok "Firewall: opened port ${port}/tcp (iptables)"
        fi
        return 0
    fi

    warn "No firewall tool available (firewall-cmd, ufw, iptables) -- port ${port} not opened"
}

# ============================================================
# Step 1: Install node_exporter
# ============================================================

install_node_exporter() {
    info "=== Installing node_exporter v${NODE_EXPORTER_VERSION} ==="

    local arch
    arch=$(target_cmd "uname -m")
    case "${arch}" in
        x86_64)  arch="amd64" ;;
        aarch64) arch="arm64" ;;
        armv7l)  arch="armv7" ;;
        *)       die "Unsupported architecture: ${arch}" ;;
    esac

    local tarball="node_exporter-${NODE_EXPORTER_VERSION}.linux-${arch}.tar.gz"
    local url="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/${tarball}"

    # Check if already installed at correct version
    if target_cmd "test -f /usr/local/bin/node_exporter" &>/dev/null; then
        local installed_ver
        installed_ver=$(target_cmd "/usr/local/bin/node_exporter --version 2>&1 | head -1" | grep -oP 'version \K[0-9.]+' || echo "unknown")
        if [[ "${installed_ver}" == "${NODE_EXPORTER_VERSION}" ]]; then
            ok "node_exporter v${NODE_EXPORTER_VERSION} already installed -- skipping"
            return 0
        fi
        info "Upgrading node_exporter from v${installed_ver} to v${NODE_EXPORTER_VERSION}"
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        info "[DRY RUN] Would download: ${url}"
        info "[DRY RUN] Would install to /usr/local/bin/node_exporter"
        info "[DRY RUN] Would create systemd service"
        return 0
    fi

    # Download and extract
    local tmp_dir
    tmp_dir=$(target_cmd "mktemp -d")
    download_file "${url}" "${tmp_dir}/${tarball}"
    target_cmd "tar xzf '${tmp_dir}/${tarball}' -C '${tmp_dir}'"
    target_cmd "cp '${tmp_dir}/node_exporter-${NODE_EXPORTER_VERSION}.linux-${arch}/node_exporter' /usr/local/bin/node_exporter"
    target_cmd "chmod +x /usr/local/bin/node_exporter"
    target_cmd "rm -rf '${tmp_dir}'"

    ok "node_exporter binary installed to /usr/local/bin/node_exporter"

    # Create system user (idempotent)
    if ! target_cmd "id node_exporter" &>/dev/null; then
        target_cmd "useradd --system --no-create-home --shell /usr/sbin/nologin node_exporter"
        ok "Created system user: node_exporter"
    else
        info "System user node_exporter already exists"
    fi

    # Render and install systemd unit
    local template="${SCRIPT_DIR}/node-exporter.conf.template"
    if [[ -f "${template}" ]]; then
        target_put "${template}" "/etc/systemd/system/node_exporter.service"
        ok "Installed systemd unit: /etc/systemd/system/node_exporter.service"
    else
        die "Template not found: ${template}"
    fi

    # Enable and start
    target_cmd "systemctl daemon-reload"
    target_cmd "systemctl enable --now node_exporter"
    ok "node_exporter service enabled and started"

    # Verify metrics endpoint
    sleep 2
    if target_cmd "curl -s --connect-timeout 5 http://localhost:9100/metrics | head -5" &>/dev/null; then
        ok "node_exporter metrics endpoint responding on :9100"
    else
        warn "node_exporter started but metrics endpoint not yet responding (may need a moment)"
    fi

    # Open firewall port
    open_firewall_port 9100
}

# ============================================================
# Step 2: Install JMX exporter
# ============================================================

install_jmx_exporter() {
    info "=== Installing JMX exporter v${JMX_EXPORTER_VERSION} ==="

    local jar_name="jmx_prometheus_javaagent-${JMX_EXPORTER_VERSION}.jar"
    local jar_url="https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/${JMX_EXPORTER_VERSION}/${jar_name}"
    local monitoring_dir="${MINECRAFT_HOME}/monitoring"
    local jar_path="${monitoring_dir}/${jar_name}"
    local config_path="${monitoring_dir}/jmx-exporter.yaml"
    local agent_jar="${monitoring_dir}/jmx_prometheus_javaagent.jar"

    # Check if already installed at correct version
    if target_cmd "test -f '${jar_path}'" &>/dev/null; then
        ok "JMX exporter v${JMX_EXPORTER_VERSION} JAR already present -- skipping download"
    else
        if [[ "${DRY_RUN}" == true ]]; then
            info "[DRY RUN] Would download: ${jar_url}"
            info "[DRY RUN] Would install to ${jar_path}"
            info "[DRY RUN] Would patch JVM flags"
            return 0
        fi

        # Create monitoring directory
        target_cmd "mkdir -p '${monitoring_dir}'"

        # Download JAR
        download_file "${jar_url}" "${jar_path}"
        ok "JMX exporter JAR installed: ${jar_path}"
    fi

    # Create symlink for stable reference in JVM flags
    if [[ "${DRY_RUN}" != true ]]; then
        target_cmd "ln -sf '${jar_path}' '${agent_jar}'"
        ok "Symlink created: ${agent_jar}"
    fi

    # Render JMX exporter configuration
    local template="${SCRIPT_DIR}/jmx-exporter.yaml.template"
    if [[ -f "${template}" ]]; then
        local rendered
        rendered=$(sed \
            -e 's/{{JMX_EXPORTER_PORT}}/9404/g' \
            -e 's/{{JMX_PORT}}/9999/g' \
            "${template}")

        if [[ "${DRY_RUN}" == true ]]; then
            info "[DRY RUN] Would render JMX config to ${config_path}"
        else
            echo "${rendered}" | target_cmd "tee '${config_path}'" >/dev/null
            ok "JMX exporter config rendered: ${config_path}"
        fi
    else
        die "Template not found: ${template}"
    fi

    # Patch JVM flags to add javaagent (idempotent)
    local javaagent_flag="-javaagent:${agent_jar}=9404:${config_path}"

    if target_cmd "test -f '${JVM_FLAGS_PATH}'" &>/dev/null; then
        if target_cmd "grep -qF 'jmx_prometheus_javaagent' '${JVM_FLAGS_PATH}'" &>/dev/null; then
            info "JVM flags already contain jmx_prometheus_javaagent -- skipping patch"
        else
            if [[ "${DRY_RUN}" == true ]]; then
                info "[DRY RUN] Would append javaagent flag to ${JVM_FLAGS_PATH}"
            else
                # Append the javaagent flag to the EXTRA_JVM_FLAGS or JVM_FLAGS line
                # If EXTRA_JVM_FLAGS exists, append there; otherwise append a new line
                if target_cmd "grep -q 'EXTRA_JVM_FLAGS' '${JVM_FLAGS_PATH}'" &>/dev/null; then
                    target_cmd "sed -i 's|EXTRA_JVM_FLAGS=\"|EXTRA_JVM_FLAGS=\"${javaagent_flag} |' '${JVM_FLAGS_PATH}'"
                else
                    # Append as additional JVM flag
                    target_cmd "echo '# JMX Prometheus exporter agent' >> '${JVM_FLAGS_PATH}'"
                    target_cmd "echo 'EXTRA_JVM_FLAGS=\"\${EXTRA_JVM_FLAGS:-} ${javaagent_flag}\"' >> '${JVM_FLAGS_PATH}'"
                fi
                ok "JVM flags patched with javaagent: ${JVM_FLAGS_PATH}"
            fi
        fi
    else
        warn "JVM flags file not found: ${JVM_FLAGS_PATH} -- JMX agent must be configured manually"
    fi

    # Open firewall port
    if [[ "${DRY_RUN}" != true ]]; then
        open_firewall_port 9404
    fi

    info "JMX exporter configured. Restart minecraft.service to activate."
    warn "Do NOT restart Minecraft automatically -- that is an operator decision."
}

# ============================================================
# Step 3: Validation summary
# ============================================================

print_summary() {
    info ""
    info "=========================================="
    info "  Exporter Deployment Summary"
    info "=========================================="
    info ""

    # Check node_exporter
    local ne_status="NOT INSTALLED"
    if target_cmd "test -f /usr/local/bin/node_exporter" &>/dev/null; then
        local ne_ver
        ne_ver=$(target_cmd "/usr/local/bin/node_exporter --version 2>&1 | head -1" | grep -oP 'version \K[0-9.]+' || echo "unknown")
        ne_status="v${ne_ver}"
    fi

    # Check node_exporter port
    local ne_port="NOT LISTENING"
    if target_cmd "ss -tlnp | grep -q ':9100 '" &>/dev/null; then
        ne_port="LISTENING"
    fi

    # Check JMX exporter JAR
    local jmx_status="NOT INSTALLED"
    if target_cmd "test -f '${MINECRAFT_HOME}/monitoring/jmx_prometheus_javaagent.jar'" &>/dev/null; then
        jmx_status="v${JMX_EXPORTER_VERSION}"
    fi

    # Check JMX exporter port
    local jmx_port="NOT LISTENING (will activate on minecraft.service restart)"
    if target_cmd "ss -tlnp | grep -q ':9404 '" &>/dev/null; then
        jmx_port="LISTENING"
    fi

    info "  node_exporter:  ${ne_status} (port 9100: ${ne_port})"
    info "  JMX exporter:   ${jmx_status} (port 9404: ${jmx_port})"
    info ""

    # Firewall status
    local fw_9100="unknown" fw_9404="unknown"
    if target_cmd "command -v firewall-cmd" &>/dev/null; then
        fw_9100=$(target_cmd "firewall-cmd --query-port=9100/tcp 2>/dev/null" || echo "no")
        fw_9404=$(target_cmd "firewall-cmd --query-port=9404/tcp 2>/dev/null" || echo "no")
    elif target_cmd "command -v ufw" &>/dev/null; then
        fw_9100=$(target_cmd "ufw status | grep '9100/tcp.*ALLOW'" &>/dev/null && echo "open" || echo "closed")
        fw_9404=$(target_cmd "ufw status | grep '9404/tcp.*ALLOW'" &>/dev/null && echo "open" || echo "closed")
    fi

    info "  Firewall 9100:  ${fw_9100}"
    info "  Firewall 9404:  ${fw_9404}"
    info "=========================================="
}

# ============================================================
# Main
# ============================================================

info "Deploying monitoring exporters..."
if [[ "${DRY_RUN}" == true ]]; then
    info "[DRY RUN] No changes will be made"
fi

install_node_exporter
install_jmx_exporter

if [[ "${DRY_RUN}" != true ]]; then
    print_summary
fi

ok "Exporter deployment complete"

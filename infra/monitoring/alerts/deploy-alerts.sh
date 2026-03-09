#!/usr/bin/env bash
# shellcheck disable=SC2294 # eval used intentionally for command dispatch
# deploy-alerts.sh -- Deploy Prometheus alerting rules for Minecraft server
#
# Validates alert rules YAML syntax (promtool or fallback), deploys rules
# to the Prometheus rules directory, and triggers a Prometheus reload.
#
# Requirements satisfied:
#   OPS-06: Alert rules for TPS, memory, disk, backup age, unreachability
#
# Usage: deploy-alerts.sh [OPTIONS]
#
# Exit codes:
#   0 -- Success
#   1 -- Error
#   2 -- Usage error
#   3 -- Validation failed

set -euo pipefail

# ---------------------------------------------------------------------------
# Script location
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

TARGET_HOST=""
LOCAL_DEPLOY=true
PROMETHEUS_RULES_DIR="/etc/prometheus/rules"
PROMETHEUS_URL="http://localhost:9090"
VALIDATE_ONLY=false
DRY_RUN=false
ALERTS_FILE="${SCRIPT_DIR}/minecraft-alerts.yaml"

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

Deploy Prometheus alerting rules for Minecraft server monitoring.
Validates rule syntax, copies to Prometheus rules directory, and
triggers a Prometheus configuration reload.

Options:
  --target-host HOST           SSH to remote host (the Prometheus server)
  --local                      Deploy locally (default)
  --prometheus-rules-dir PATH  Prometheus rules directory (default: ${PROMETHEUS_RULES_DIR})
  --prometheus-url URL         Prometheus URL for reload (default: ${PROMETHEUS_URL})
  --validate-only              Validate rules syntax without deploying
  --dry-run                    Show actions without executing
  --help                       Show this help message

Exit Codes:
  0  Success
  1  Error
  2  Usage error
  3  Validation failed

Alert Rules:
  MinecraftTPSDegraded     TPS < 18 for 2m (warning)
  MinecraftTPSCritical     TPS < 15 for 1m (critical)
  MinecraftMemoryPressure  JVM heap > 90% for 5m (warning)
  MinecraftDiskUsageHigh   Disk > 85% for 5m (warning)
  MinecraftDiskUsageCritical Disk > 95% for 1m (critical)
  MinecraftBackupStale     Backup > 2h old for 5m (warning)
  MinecraftServerUnreachable Server down for 1m (critical)
  MinecraftServiceDown     systemd service inactive for 30s (critical)
  MinecraftMetricsStale    Metrics > 2m old for 2m (warning)

Examples:
  # Validate rules only
  ${SCRIPT_NAME} --validate-only

  # Deploy locally
  ${SCRIPT_NAME} --local

  # Deploy to remote Prometheus server
  ${SCRIPT_NAME} --target-host gsd@prometheus-01

  # Dry run
  ${SCRIPT_NAME} --dry-run
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
        --prometheus-rules-dir)
            PROMETHEUS_RULES_DIR="${2:?'--prometheus-rules-dir requires a path'}"
            shift 2
            ;;
        --prometheus-url)
            PROMETHEUS_URL="${2:?'--prometheus-url requires a URL'}"
            shift 2
            ;;
        --validate-only)
            VALIDATE_ONLY=true
            shift
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
# Step 1: Validate rules YAML
# ---------------------------------------------------------------------------

validate_rules() {
    info "Validating alert rules: ${ALERTS_FILE}"

    if [[ ! -f "${ALERTS_FILE}" ]]; then
        die "Alert rules file not found: ${ALERTS_FILE}"
    fi

    # Try promtool first (best validation)
    if command -v promtool &>/dev/null; then
        info "Using promtool for validation"
        if promtool check rules "${ALERTS_FILE}"; then
            ok "promtool validation passed"
            return 0
        else
            error "promtool validation failed"
            return 3
        fi
    fi

    # Fallback: basic YAML structure validation
    warn "promtool not available -- using basic validation"

    local validation_errors=0

    # Check for required top-level key: groups
    if ! grep -q '^groups:' "${ALERTS_FILE}"; then
        error "Missing required key: groups"
        validation_errors=$(( validation_errors + 1 ))
    fi

    # Check for required alert structure
    if ! grep -qE '^\s+- alert:' "${ALERTS_FILE}"; then
        error "No alert definitions found"
        validation_errors=$(( validation_errors + 1 ))
    fi

    # Check that all alerts have expr
    local alert_count expr_count
    alert_count=$(grep -cE '^\s+- alert:' "${ALERTS_FILE}" || echo "0")
    expr_count=$(grep -cE '^\s+expr:' "${ALERTS_FILE}" || echo "0")
    if [[ "${alert_count}" != "${expr_count}" ]]; then
        error "Mismatch: ${alert_count} alerts but ${expr_count} expr fields"
        validation_errors=$(( validation_errors + 1 ))
    fi

    # Check that all alerts have 'for' duration
    local for_count
    for_count=$(grep -cE '^\s+for:' "${ALERTS_FILE}" || echo "0")
    if [[ "${alert_count}" != "${for_count}" ]]; then
        error "Mismatch: ${alert_count} alerts but ${for_count} 'for' fields"
        validation_errors=$(( validation_errors + 1 ))
    fi

    # Check that all alerts have severity labels
    local severity_count
    severity_count=$(grep -cE '^\s+severity:' "${ALERTS_FILE}" || echo "0")
    if [[ "${alert_count}" != "${severity_count}" ]]; then
        error "Mismatch: ${alert_count} alerts but ${severity_count} severity labels"
        validation_errors=$(( validation_errors + 1 ))
    fi

    if [[ ${validation_errors} -gt 0 ]]; then
        error "Validation failed with ${validation_errors} error(s)"
        return 3
    fi

    ok "Basic validation passed (${alert_count} alerts, all have expr/for/severity)"
    return 0
}

# ---------------------------------------------------------------------------
# Step 2: Deploy rules
# ---------------------------------------------------------------------------

deploy_rules() {
    if [[ "${VALIDATE_ONLY}" == true ]]; then
        info "Validation-only mode -- skipping deployment"
        return 0
    fi

    if [[ "${DRY_RUN}" == true ]]; then
        info "[DRY RUN] Would copy ${ALERTS_FILE} to ${PROMETHEUS_RULES_DIR}/minecraft-alerts.yaml"
        info "[DRY RUN] Would reload Prometheus at ${PROMETHEUS_URL}"
        return 0
    fi

    # Create rules directory if needed
    target_cmd "mkdir -p '${PROMETHEUS_RULES_DIR}'"

    # Copy rules file
    if [[ "${LOCAL_DEPLOY}" == true ]]; then
        cp "${ALERTS_FILE}" "${PROMETHEUS_RULES_DIR}/minecraft-alerts.yaml"
    else
        scp -o BatchMode=yes "${ALERTS_FILE}" \
            "${TARGET_HOST}:${PROMETHEUS_RULES_DIR}/minecraft-alerts.yaml"
    fi
    ok "Alert rules deployed to ${PROMETHEUS_RULES_DIR}/minecraft-alerts.yaml"
}

# ---------------------------------------------------------------------------
# Step 3: Reload Prometheus
# ---------------------------------------------------------------------------

reload_prometheus() {
    if [[ "${VALIDATE_ONLY}" == true ]] || [[ "${DRY_RUN}" == true ]]; then
        return 0
    fi

    info "Reloading Prometheus configuration..."

    # Try HTTP reload first
    local reload_ok=false
    if target_cmd "curl -sf -X POST '${PROMETHEUS_URL}/-/reload'" &>/dev/null; then
        ok "Prometheus reloaded via HTTP POST"
        reload_ok=true
    else
        # Fallback: HUP signal
        local prom_pid
        prom_pid=$(target_cmd "pgrep -f 'prometheus.*--config' | head -1" || echo "")
        if [[ -n "${prom_pid}" ]]; then
            target_cmd "kill -HUP ${prom_pid}"
            ok "Prometheus reloaded via SIGHUP (PID ${prom_pid})"
            reload_ok=true
        else
            warn "Cannot reload Prometheus: HTTP POST failed and process not found"
        fi
    fi

    # Verify rules loaded
    if [[ "${reload_ok}" == true ]]; then
        sleep 2
        local rules_check
        rules_check=$(target_cmd "curl -sf '${PROMETHEUS_URL}/api/v1/rules'" || echo "")
        if echo "${rules_check}" | grep -q "minecraft_server"; then
            ok "Verified: minecraft_server rule group loaded in Prometheus"
        else
            warn "Could not verify rule group in Prometheus (may still be loading)"
        fi
    fi
}

# ============================================================
# Main
# ============================================================

# Validate
validate_exit=0
validate_rules || validate_exit=$?

if [[ ${validate_exit} -ne 0 ]]; then
    exit ${validate_exit}
fi

# Deploy
deploy_rules

# Reload
reload_prometheus

ok "Alert deployment complete"

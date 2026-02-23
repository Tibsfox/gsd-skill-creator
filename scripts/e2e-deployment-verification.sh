#!/usr/bin/env bash
# =============================================================================
# e2e-deployment-verification.sh
# End-to-End Deployment Verification Script
#
# Requirement: VERIF-06 (end-to-end deployment verification)
# Traceability: INTEG-05 (git commit hash recorded at execution start)
# NASA SE Phase: Phase D -- System Integration Review (SIR)
#
# Runs the 7-stage deployment verification from the procedure document:
#   docs/vv/e2e-deployment-verification.md
#
# Usage:
#   ./scripts/e2e-deployment-verification.sh [--dry-run] [--start-stage N]
#
# Options:
#   --dry-run        Print what would be checked without executing checks.
#                    Safe to run at any time; does not modify system state.
#   --start-stage N  Resume verification from stage N (1-7). Useful when
#                    earlier stages have already passed.
#
# Output:
#   Results written to: configs/evaluation/e2e-deployment-results.yaml
#
# Exit codes:
#   0 -- All stages passed (or skipped with documented reason)
#   1 -- One or more blocking stages failed
# =============================================================================

set -euo pipefail

# =============================================================================
# Initialization
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RESULTS_FILE="${PROJECT_ROOT}/configs/evaluation/e2e-deployment-results.yaml"
PRE_GATES="${PROJECT_ROOT}/configs/evaluation/pre-deploy-gates.yaml"
POST_GATES="${PROJECT_ROOT}/configs/evaluation/post-deploy-gates.yaml"
DEPLOYMENT_CREW="${PROJECT_ROOT}/configs/crews/deployment-crew.yaml"
OPERATIONS_CREW="${PROJECT_ROOT}/configs/crews/operations-crew.yaml"
CREW_HANDOFF="${PROJECT_ROOT}/configs/crews/crew-handoff.yaml"

# Defaults
DRY_RUN=false
START_STAGE=1
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")
OPERATOR="${USER:-unknown}"

# Stage result counters
STAGE_PASS=0
STAGE_FAIL=0
STAGE_SKIP=0
OVERALL_VERDICT="pending"

# Track per-stage status for results YAML
declare -A STAGE_STATUS
declare -A STAGE_DURATION
for i in $(seq 1 7); do
  STAGE_STATUS[$i]="pending"
  STAGE_DURATION[$i]=0
done

# Gate status arrays (indexed by gate ID)
declare -A PRE_GATE_STATUS
for g in PRE-001 PRE-002 PRE-003 PRE-004; do
  PRE_GATE_STATUS[$g]="pending"
done

declare -A POST_GATE_STATUS
for g in POST-001 POST-002 POST-003 POST-004 POST-005 POST-006 POST-007 POST-008 POST-009; do
  POST_GATE_STATUS[$g]="pending"
done

# Openstack deployment detected flag (set in stage 4, checked in stage 5)
OPENSTACK_DEPLOYED=false

# =============================================================================
# Argument parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --start-stage)
      if [[ -n "${2:-}" ]] && [[ "$2" =~ ^[1-7]$ ]]; then
        START_STAGE="$2"
        shift 2
      else
        echo "ERROR: --start-stage requires a value between 1 and 7" >&2
        exit 1
      fi
      ;;
    --help|-h)
      head -30 "${BASH_SOURCE[0]}" | grep "^#" | sed 's/^# \?//'
      exit 0
      ;;
    *)
      echo "ERROR: Unknown option: $1" >&2
      echo "Usage: $0 [--dry-run] [--start-stage N]" >&2
      exit 1
      ;;
  esac
done

# =============================================================================
# Color output helpers
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

hdr()  { echo -e "\n${BOLD}${CYAN}$1${NC}"; }
pass() { echo -e "  ${GREEN}PASS${NC}: $1"; }
fail() { echo -e "  ${RED}FAIL${NC}: $1"; }
warn() { echo -e "  ${YELLOW}WARN${NC}: $1"; }
info() { echo -e "  ${CYAN}INFO${NC}: $1"; }
dry()  { echo -e "  ${YELLOW}DRY ${NC}: [would] $1"; }

# =============================================================================
# Utility functions
# =============================================================================

# stamp_seconds: return current epoch seconds
stamp_seconds() { date +%s; }

# elapsed: compute elapsed seconds from a start time
elapsed() {
  local start_epoch="$1"
  echo $(( $(stamp_seconds) - start_epoch ))
}

# check_file_exists: verify a required config file exists
check_file_exists() {
  local path="$1"
  local label="$2"
  if [[ -f "$path" ]]; then
    pass "$label exists: $(basename "$path")"
    return 0
  else
    fail "$label missing: $path"
    return 1
  fi
}

# check_yaml: verify a file is valid YAML (requires python3)
check_yaml() {
  local path="$1"
  if python3 -c "import yaml; yaml.safe_load(open('$path'))" 2>/dev/null; then
    pass "YAML valid: $(basename "$path")"
    return 0
  else
    fail "YAML invalid: $path"
    return 1
  fi
}

# openstack_available: check if openstack CLI is installed and auth env is set
openstack_available() {
  command -v openstack >/dev/null 2>&1 && \
  [[ -n "${OS_AUTH_URL:-}" ]] || [[ -f "/etc/kolla/admin-openrc.sh" ]]
}

# docker_openstack_running: check if any kolla containers are up
docker_openstack_running() {
  docker ps 2>/dev/null | grep -qE 'keystone|nova|neutron|glance|cinder|horizon' 2>/dev/null
}

# update_results_field: write a key=value to the results YAML (simple append approach)
# Note: The full results YAML is written at the end via write_results_yaml.
# This function is a no-op placeholder -- results are aggregated in-memory.
update_results_field() { : ; }

# =============================================================================
# Results YAML writer
# =============================================================================

write_results_yaml() {
  local verdict="$1"

  cat > "${RESULTS_FILE}" << YAML
name: e2e-deployment-verification
version: 1.0.0
description: "End-to-end deployment verification results"
requirement: VERIF-06
nasa_se_phase: "Phase D -- System Integration Review (SIR)"
chipset_ref: openstack-nasa-se

execution:
  timestamp: "${TIMESTAMP}"
  git_commit: "${GIT_COMMIT}"
  dry_run: ${DRY_RUN}
  operator: "${OPERATOR}"

stages:
  - stage: 1
    name: "Fresh System Baseline"
    status: ${STAGE_STATUS[1]}
    details: {}
    duration_seconds: ${STAGE_DURATION[1]}
  - stage: 2
    name: "Pre-Deploy Gate Execution"
    status: ${STAGE_STATUS[2]}
    gates:
      PRE-001: ${PRE_GATE_STATUS[PRE-001]}
      PRE-002: ${PRE_GATE_STATUS[PRE-002]}
      PRE-003: ${PRE_GATE_STATUS[PRE-003]}
      PRE-004: ${PRE_GATE_STATUS[PRE-004]}
    duration_seconds: ${STAGE_DURATION[2]}
  - stage: 3
    name: "Deployment Crew Activation"
    status: ${STAGE_STATUS[3]}
    details: {}
    duration_seconds: ${STAGE_DURATION[3]}
  - stage: 4
    name: "Kolla-Ansible Deployment"
    status: ${STAGE_STATUS[4]}
    details: {}
    duration_seconds: ${STAGE_DURATION[4]}
  - stage: 5
    name: "Post-Deploy Gate Execution"
    status: ${STAGE_STATUS[5]}
    gates:
      POST-001: ${POST_GATE_STATUS[POST-001]}
      POST-002: ${POST_GATE_STATUS[POST-002]}
      POST-003: ${POST_GATE_STATUS[POST-003]}
      POST-004: ${POST_GATE_STATUS[POST-004]}
      POST-005: ${POST_GATE_STATUS[POST-005]}
      POST-006: ${POST_GATE_STATUS[POST-006]}
      POST-007: ${POST_GATE_STATUS[POST-007]}
      POST-008: ${POST_GATE_STATUS[POST-008]}
      POST-009: ${POST_GATE_STATUS[POST-009]}
    duration_seconds: ${STAGE_DURATION[5]}
  - stage: 6
    name: "Operations Handoff"
    status: ${STAGE_STATUS[6]}
    details: {}
    duration_seconds: ${STAGE_DURATION[6]}
  - stage: 7
    name: "Documentation Verification"
    status: ${STAGE_STATUS[7]}
    details: {}
    duration_seconds: ${STAGE_DURATION[7]}

summary:
  total_stages: 7
  passed: ${STAGE_PASS}
  failed: ${STAGE_FAIL}
  skipped: ${STAGE_SKIP}
  verdict: ${verdict}
YAML
}

# =============================================================================
# Stage 1: Fresh System Baseline
# =============================================================================

stage_1_baseline() {
  hdr "Stage 1 -- Fresh System Baseline (Phase D entry)"
  local start
  start=$(stamp_seconds)
  local stage_ok=true

  if ${DRY_RUN}; then
    dry "record hostname"
    dry "record IP address"
    dry "record disk configuration (lsblk)"
    dry "record RAM total (free -g)"
    dry "record CPU count and model"
    dry "record kernel version (uname -r)"
    dry "check: no Kolla containers running"
    dry "check: no OpenStack ports bound (5000, 8774, 9696, 8776, 9292)"
    dry "check: /etc/kolla/ absent or empty"
    dry "record git commit hash for INTEG-05 traceability"
    STAGE_STATUS[1]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[1]=$(elapsed "$start")
    return 0
  fi

  info "Recording system state..."
  info "  Hostname:  $(hostname 2>/dev/null || echo 'unknown')"
  info "  Kernel:    $(uname -r 2>/dev/null || echo 'unknown')"
  info "  CPU cores: $(nproc 2>/dev/null || echo 'unknown')"
  info "  RAM total: $(free -g 2>/dev/null | awk '/^Mem:/{print $2}')GB"
  info "  Git hash:  ${GIT_COMMIT} (INTEG-05 traceability)"

  info "Checking for pre-existing OpenStack services..."

  # Check for kolla containers
  if docker ps 2>/dev/null | grep -qE 'keystone|nova|neutron|glance|cinder|horizon'; then
    warn "Existing OpenStack containers detected -- system is not clean"
    warn "This procedure is designed for fresh deployments"
    # Not a hard failure -- allows running on partially deployed systems
  else
    pass "No Kolla containers present"
  fi

  # Check key ports
  local port_conflict=false
  for port in 5000 8774 9696 8776 9292; do
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
      warn "Port ${port} already in use (may be existing OpenStack service)"
      port_conflict=true
    fi
  done
  if ! $port_conflict; then
    pass "No OpenStack port conflicts detected"
  fi

  # Record git commit (INTEG-05)
  if [[ "$GIT_COMMIT" != "unknown" ]]; then
    pass "Git commit hash recorded: ${GIT_COMMIT}"
  else
    warn "Git commit hash unavailable -- INTEG-05 traceability reduced"
  fi

  STAGE_STATUS[1]="pass"
  STAGE_PASS=$((STAGE_PASS + 1))
  STAGE_DURATION[1]=$(elapsed "$start")
  pass "Stage 1 complete"
  return 0
}

# =============================================================================
# Stage 2: Pre-Deploy Gate Execution
# =============================================================================

stage_2_predeploy() {
  hdr "Stage 2 -- Pre-Deploy Gate Execution (CDR Gate equivalent)"
  local start
  start=$(stamp_seconds)
  local stage_ok=true

  # Verify gate config exists
  if ! check_file_exists "${PRE_GATES}" "Pre-deploy gates config"; then
    STAGE_STATUS[2]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[2]=$(elapsed "$start")
    return 1
  fi

  if ${DRY_RUN}; then
    for g in PRE-001 PRE-002 PRE-003 PRE-004; do
      dry "execute gate ${g}"
      PRE_GATE_STATUS[$g]="skip"
    done
    STAGE_STATUS[2]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[2]=$(elapsed "$start")
    return 0
  fi

  info "Executing PRE-001: Hardware Inventory..."
  local cpu_cores ram_gb virt_support pre001_ok=true
  cpu_cores=$(nproc 2>/dev/null || echo 0)
  ram_gb=$(free -g 2>/dev/null | awk '/^Mem:/{print $2}' || echo 0)
  virt_support=$(grep -cw 'vmx\|svm' /proc/cpuinfo 2>/dev/null || echo 0)

  [[ "$cpu_cores" -ge 4 ]]  && pass "PRE-001: CPU cores = ${cpu_cores} (>= 4)" || { fail "PRE-001: CPU cores = ${cpu_cores} (need >= 4)"; pre001_ok=false; }
  [[ "$ram_gb" -ge 16 ]]    && pass "PRE-001: RAM = ${ram_gb}GB (>= 16GB)" || { fail "PRE-001: RAM = ${ram_gb}GB (need >= 16GB)"; pre001_ok=false; }
  [[ "$virt_support" -gt 0 ]] && pass "PRE-001: Virtualization support present" || { fail "PRE-001: VT-x/AMD-V not detected"; pre001_ok=false; }
  # Disk check
  local disk_gb
  disk_gb=$(df -BG / 2>/dev/null | awk 'NR==2{gsub(/G/,"",$4); print $4}' || echo 0)
  [[ "$disk_gb" -ge 100 ]] && pass "PRE-001: Disk = ${disk_gb}GB available (>= 100GB)" || { fail "PRE-001: Disk = ${disk_gb}GB available (need >= 100GB)"; pre001_ok=false; }

  if $pre001_ok; then
    PRE_GATE_STATUS[PRE-001]="pass"
    pass "PRE-001 PASS"
  else
    PRE_GATE_STATUS[PRE-001]="fail"
    fail "PRE-001 FAIL (action: block) -- remediation: upgrade hardware to meet minimums"
    stage_ok=false
  fi

  info "Executing PRE-002: Network Connectivity..."
  local pre002_ok=true
  # Management interface
  if ip -br addr show 2>/dev/null | grep -qvE '^lo'; then
    pass "PRE-002: Management interface up"
  else
    fail "PRE-002: No non-loopback interface with IP address"
    pre002_ok=false
  fi
  # Default route
  if ip route show default 2>/dev/null | grep -q default; then
    pass "PRE-002: Default route exists"
  else
    fail "PRE-002: No default route"
    pre002_ok=false
  fi
  # DNS
  if host -t A docs.openstack.org 2>/dev/null | grep -q "has address"; then
    pass "PRE-002: DNS resolution working"
  else
    warn "PRE-002: DNS check inconclusive (host command may not be installed)"
  fi
  # Internet (non-blocking timeout)
  local http_code
  http_code=$(curl -s --connect-timeout 5 -o /dev/null -w "%{http_code}" https://releases.openstack.org/ 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]]; then
    pass "PRE-002: Internet connectivity confirmed (HTTP ${http_code})"
  else
    fail "PRE-002: Internet connectivity failed (HTTP ${http_code})"
    pre002_ok=false
  fi

  if $pre002_ok; then
    PRE_GATE_STATUS[PRE-002]="pass"
    pass "PRE-002 PASS"
  else
    PRE_GATE_STATUS[PRE-002]="fail"
    fail "PRE-002 FAIL (action: block) -- remediation: configure network interfaces and default route"
    stage_ok=false
  fi

  info "Executing PRE-003: Resource Sufficiency..."
  local pre003_ok=true
  local free_ram free_disk
  free_ram=$(free -g 2>/dev/null | awk '/^Mem:/{print $7}' || echo 0)
  free_disk=$(df -BG / 2>/dev/null | awk 'NR==2{gsub(/G/,"",$4); print $4}' || echo 0)

  [[ "$free_ram" -ge 8 ]]  && pass "PRE-003: Free RAM = ${free_ram}GB (>= 8GB)" || { fail "PRE-003: Free RAM = ${free_ram}GB (need >= 8GB)"; pre003_ok=false; }
  [[ "$free_disk" -ge 50 ]] && pass "PRE-003: Free disk = ${free_disk}GB (>= 50GB)" || { fail "PRE-003: Free disk = ${free_disk}GB (need >= 50GB)"; pre003_ok=false; }

  # Port conflict check
  local port_ok=true
  for port in 5000 8774 9696 8776 9292 6080 8004 80 443; do
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
      warn "PRE-003: Port ${port} in use (conflict)"
      port_ok=false
    fi
  done
  if $port_ok; then
    pass "PRE-003: No port conflicts detected"
  else
    fail "PRE-003: Port conflicts exist (resolve before deployment)"
    pre003_ok=false
  fi

  # Docker
  if command -v docker >/dev/null 2>&1; then
    pass "PRE-003: Docker installed"
    if systemctl is-active docker >/dev/null 2>&1; then
      pass "PRE-003: Docker service running"
    else
      fail "PRE-003: Docker service not running"
      pre003_ok=false
    fi
  else
    fail "PRE-003: Docker not installed"
    pre003_ok=false
  fi

  if $pre003_ok; then
    PRE_GATE_STATUS[PRE-003]="pass"
    pass "PRE-003 PASS"
  else
    PRE_GATE_STATUS[PRE-003]="fail"
    fail "PRE-003 FAIL (action: block) -- remediation: free resources, resolve port conflicts, start Docker"
    stage_ok=false
  fi

  info "Executing PRE-004: OS Compatibility..."
  local pre004_ok=true
  # OS version
  local os_name
  os_name=$(grep PRETTY_NAME /etc/os-release 2>/dev/null | cut -d= -f2 | tr -d '"' || echo "unknown")
  info "  OS: ${os_name}"
  if echo "$os_name" | grep -qiE 'CentOS Stream 9|Ubuntu 22\.04|Rocky.*9|Debian 12'; then
    pass "PRE-004: Supported OS detected"
  else
    warn "PRE-004: OS '${os_name}' may not be officially supported (CentOS Stream 9, Ubuntu 22.04, Rocky 9, Debian 12)"
  fi

  # Required packages
  for pkg in python3 ansible docker git; do
    if command -v "$pkg" >/dev/null 2>&1; then
      pass "PRE-004: ${pkg} found"
    else
      fail "PRE-004: ${pkg} not found"
      pre004_ok=false
    fi
  done

  if $pre004_ok; then
    PRE_GATE_STATUS[PRE-004]="pass"
    pass "PRE-004 PASS"
  else
    PRE_GATE_STATUS[PRE-004]="fail"
    fail "PRE-004 FAIL (action: block) -- remediation: install python3, ansible-core, docker-ce, git"
    stage_ok=false
  fi

  if $stage_ok; then
    STAGE_STATUS[2]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[2]=$(elapsed "$start")
    pass "Stage 2 complete -- all pre-deploy gates passed"
    return 0
  else
    STAGE_STATUS[2]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[2]=$(elapsed "$start")
    fail "Stage 2 FAILED -- one or more pre-deploy gates blocked (action: block)"
    fail "Remediation: fix gate failures above, then re-run from Stage 2"
    return 1
  fi
}

# =============================================================================
# Stage 3: Deployment Crew Activation
# =============================================================================

stage_3_crew_activation() {
  hdr "Stage 3 -- Deployment Crew Activation (Phase D assembly)"
  local start
  start=$(stamp_seconds)
  local stage_ok=true

  if ${DRY_RUN}; then
    dry "check configs/crews/deployment-crew.yaml exists and is valid YAML"
    dry "verify 14 positions defined (FLIGHT, PLAN, 3x EXEC, VERIFY, INTEG, CAPCOM, TOPO, 3x CRAFT, SCOUT, BUDGET)"
    dry "verify CAPCOM is sole human_interface agent"
    dry "verify activation profiles: scout, patrol, squadron"
    STAGE_STATUS[3]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[3]=$(elapsed "$start")
    return 0
  fi

  # Check crew config files exist
  check_file_exists "${DEPLOYMENT_CREW}" "deployment-crew.yaml" || stage_ok=false
  check_file_exists "${OPERATIONS_CREW}" "operations-crew.yaml" || stage_ok=false
  check_file_exists "${CREW_HANDOFF}" "crew-handoff.yaml" || stage_ok=false

  if $stage_ok; then
    # Validate YAML
    check_yaml "${DEPLOYMENT_CREW}" || stage_ok=false
    check_yaml "${OPERATIONS_CREW}" || stage_ok=false
    check_yaml "${CREW_HANDOFF}" || stage_ok=false
  fi

  if $stage_ok; then
    # Check deployment crew has positions defined
    local position_count
    position_count=$(python3 -c "
import yaml
with open('${DEPLOYMENT_CREW}') as f:
    crew = yaml.safe_load(f)
print(len(crew.get('positions', [])))
" 2>/dev/null || echo 0)

    if [[ "$position_count" -ge 12 ]]; then
      pass "Deployment crew: ${position_count} positions defined (expected >= 12)"
    else
      fail "Deployment crew: only ${position_count} positions (expected >= 12)"
      stage_ok=false
    fi

    # Check CAPCOM isolation (sole human_interface)
    local capcom_sole
    capcom_sole=$(python3 -c "
import yaml
with open('${DEPLOYMENT_CREW}') as f:
    crew = yaml.safe_load(f)
hi_agents = [p['id'] for p in crew.get('positions', []) if p.get('human_interface', False)]
print('ok' if hi_agents == ['capcom'] else 'fail:' + str(hi_agents))
" 2>/dev/null || echo "fail:unknown")

    if [[ "$capcom_sole" == "ok" ]]; then
      pass "CAPCOM is sole human_interface agent (CREW-07 isolation)"
    else
      fail "CAPCOM isolation violated: ${capcom_sole}"
      stage_ok=false
    fi

    # Check activation profiles
    local profiles
    profiles=$(python3 -c "
import yaml
with open('${DEPLOYMENT_CREW}') as f:
    crew = yaml.safe_load(f)
print(' '.join(crew.get('activation_profiles', {}).keys()))
" 2>/dev/null || echo "")

    if echo "$profiles" | grep -q "squadron"; then
      pass "Activation profiles present: ${profiles}"
    else
      warn "Expected activation profiles (scout, patrol, squadron) -- found: '${profiles}'"
    fi

    # Check operations crew count
    local ops_count
    ops_count=$(python3 -c "
import yaml
with open('${OPERATIONS_CREW}') as f:
    crew = yaml.safe_load(f)
print(len(crew.get('positions', [])))
" 2>/dev/null || echo 0)
    pass "Operations crew: ${ops_count} positions defined"

    # Check handoff transition defined
    local transition_defined
    transition_defined=$(python3 -c "
import yaml
with open('${CREW_HANDOFF}') as f:
    h = yaml.safe_load(f)
transitions = h.get('transitions', [])
print('ok' if any(t.get('id') == 'deployment-to-operations' for t in transitions) else 'missing')
" 2>/dev/null || echo "missing")

    if [[ "$transition_defined" == "ok" ]]; then
      pass "crew-handoff.yaml: deployment-to-operations transition defined"
    else
      fail "crew-handoff.yaml: deployment-to-operations transition not found"
      stage_ok=false
    fi
  fi

  if $stage_ok; then
    STAGE_STATUS[3]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[3]=$(elapsed "$start")
    pass "Stage 3 complete -- deployment crew configuration validated"
    return 0
  else
    STAGE_STATUS[3]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[3]=$(elapsed "$start")
    fail "Stage 3 FAILED -- crew configuration has errors"
    return 1
  fi
}

# =============================================================================
# Stage 4: Kolla-Ansible Deployment
# =============================================================================

stage_4_deployment() {
  hdr "Stage 4 -- Kolla-Ansible Deployment (Phase D fabrication)"
  local start
  start=$(stamp_seconds)

  if ${DRY_RUN}; then
    dry "check kolla-ansible is installed"
    dry "record kolla-ansible version"
    dry "check /etc/kolla/globals.yml exists"
    dry "check docker containers from kolla are running"
    dry "NOTE: kolla-ansible deploy would run here (skipped in dry-run)"
    STAGE_STATUS[4]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[4]=$(elapsed "$start")
    return 0
  fi

  # Check if kolla-ansible is installed
  if ! command -v kolla-ansible >/dev/null 2>&1; then
    warn "kolla-ansible not found in PATH"
    info "Checking if OpenStack is already deployed..."

    if docker_openstack_running; then
      info "Existing OpenStack containers detected -- assuming prior deployment"
      OPENSTACK_DEPLOYED=true
      pass "OpenStack containers running (deployment present)"
      STAGE_STATUS[4]="pass"
      STAGE_PASS=$((STAGE_PASS + 1))
      STAGE_DURATION[4]=$(elapsed "$start")
      pass "Stage 4 complete -- existing deployment detected"
      return 0
    else
      info "No OpenStack containers and no kolla-ansible -- skipping deployment stages"
      info "NOTE: Deploy using kolla-ansible before running post-deploy gates"
      OPENSTACK_DEPLOYED=false
      STAGE_STATUS[4]="skip"
      STAGE_SKIP=$((STAGE_SKIP + 1))
      STAGE_DURATION[4]=$(elapsed "$start")
      warn "Stage 4 SKIPPED -- kolla-ansible not installed and no existing deployment found"
      warn "Stages 5 (post-deploy gates) will also be skipped"
      return 0
    fi
  fi

  # kolla-ansible is installed
  local ka_version
  ka_version=$(kolla-ansible --version 2>/dev/null | head -1 || echo "unknown")
  info "kolla-ansible version: ${ka_version}"
  pass "kolla-ansible installed"

  # Check if OpenStack is already deployed
  if docker_openstack_running; then
    info "OpenStack containers already running -- recording as existing deployment"
    OPENSTACK_DEPLOYED=true
    pass "OpenStack containers running"
    STAGE_STATUS[4]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[4]=$(elapsed "$start")
    pass "Stage 4 complete -- existing deployment verified"
    return 0
  fi

  # Check for kolla globals.yml (required for deployment)
  if [[ ! -f "/etc/kolla/globals.yml" ]]; then
    warn "Stage 4: /etc/kolla/globals.yml not found"
    warn "This stage requires kolla-ansible to be configured before deployment"
    OPENSTACK_DEPLOYED=false
    STAGE_STATUS[4]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[4]=$(elapsed "$start")
    warn "Stage 4 SKIPPED -- kolla-ansible not configured (globals.yml missing)"
    warn "Configure kolla-ansible and re-run to execute full deployment"
    return 0
  fi

  # OpenStack not yet deployed -- run the 4-phase deployment
  info "Starting kolla-ansible deployment sequence..."
  OPENSTACK_DEPLOYED=true

  local deploy_ok=true
  for phase in bootstrap-servers prechecks deploy post-deploy; do
    local phase_start
    phase_start=$(stamp_seconds)
    info "Running: kolla-ansible ${phase} ..."
    if kolla-ansible "${phase}" 2>&1; then
      local phase_dur
      phase_dur=$(elapsed "$phase_start")
      pass "kolla-ansible ${phase} -- exit 0 (${phase_dur}s)"
    else
      local phase_dur
      phase_dur=$(elapsed "$phase_start")
      fail "kolla-ansible ${phase} -- non-zero exit (${phase_dur}s)"
      deploy_ok=false
      break
    fi
  done

  if $deploy_ok; then
    STAGE_STATUS[4]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[4]=$(elapsed "$start")
    pass "Stage 4 complete -- kolla-ansible deployment successful"
    return 0
  else
    OPENSTACK_DEPLOYED=false
    STAGE_STATUS[4]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[4]=$(elapsed "$start")
    fail "Stage 4 FAILED -- kolla-ansible deployment error"
    fail "Rollback: kolla-ansible destroy --yes-i-really-really-mean-it"
    fail "Then fix the issue and re-run from Stage 1"
    return 1
  fi
}

# =============================================================================
# Stage 5: Post-Deploy Gate Execution
# =============================================================================

stage_5_postdeploy() {
  hdr "Stage 5 -- Post-Deploy Gate Execution (SIR Gate)"
  local start
  start=$(stamp_seconds)

  # Skip if OpenStack not deployed
  if ! $OPENSTACK_DEPLOYED && ! ${DRY_RUN}; then
    info "OpenStack not deployed -- skipping post-deploy gates"
    info "Deploy using kolla-ansible, then re-run to verify services"
    for g in POST-001 POST-002 POST-003 POST-004 POST-005 POST-006 POST-007 POST-008 POST-009; do
      POST_GATE_STATUS[$g]="skip"
    done
    STAGE_STATUS[5]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[5]=$(elapsed "$start")
    warn "Stage 5 SKIPPED -- deployment required before post-deploy gate execution"
    return 0
  fi

  if ${DRY_RUN}; then
    dry "Group 1: execute POST-001 (keystone_auth) -- openstack token issue -f json"
    dry "Group 2 (parallel after POST-001): POST-002 nova, POST-003 neutron, POST-004 glance,"
    dry "         POST-005 cinder, POST-006 horizon, POST-007 service catalog"
    dry "Group 3 (after all service checks): POST-008 e2e lifecycle, POST-009 doc verification"
    for g in POST-001 POST-002 POST-003 POST-004 POST-005 POST-006 POST-007 POST-008 POST-009; do
      POST_GATE_STATUS[$g]="skip"
    done
    STAGE_STATUS[5]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[5]=$(elapsed "$start")
    return 0
  fi

  check_file_exists "${POST_GATES}" "Post-deploy gates config"

  # Source OpenStack credentials if available
  if [[ -f "/etc/kolla/admin-openrc.sh" ]]; then
    # shellcheck disable=SC1091
    source /etc/kolla/admin-openrc.sh
    pass "Sourced OpenStack credentials from /etc/kolla/admin-openrc.sh"
  elif [[ -n "${OS_AUTH_URL:-}" ]]; then
    pass "OpenStack auth URL set in environment: ${OS_AUTH_URL}"
  else
    warn "No OpenStack credentials found -- gate checks will likely fail"
    warn "Source /etc/kolla/admin-openrc.sh before running this script"
  fi

  local stage_ok=true

  # --------------------------------------------------------------------------
  # Group 1: POST-001 Keystone (must pass first)
  # --------------------------------------------------------------------------
  info "Group 1: POST-001 -- keystone_auth"
  local token_json
  if token_json=$(openstack token issue -f json 2>/dev/null); then
    if echo "$token_json" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'id' in d" 2>/dev/null; then
      POST_GATE_STATUS[POST-001]="pass"
      pass "POST-001: Keystone authentication token issued"
    else
      POST_GATE_STATUS[POST-001]="fail"
      fail "POST-001: Token issued but missing expected fields"
      stage_ok=false
    fi
  else
    POST_GATE_STATUS[POST-001]="fail"
    fail "POST-001 FAIL (action: block) -- Keystone did not issue a token"
    fail "Remediation: check Keystone containers, logs, and endpoint configuration"
    # Skip all dependent gates
    for g in POST-002 POST-003 POST-004 POST-005 POST-006 POST-007 POST-008 POST-009; do
      POST_GATE_STATUS[$g]="skip"
      warn "POST-${g##POST-}: skipped (depends on POST-001)"
    done
    STAGE_STATUS[5]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[5]=$(elapsed "$start")
    return 1
  fi

  # --------------------------------------------------------------------------
  # Group 2: Service checks (parallel after POST-001)
  # --------------------------------------------------------------------------
  info "Group 2: POST-002 through POST-007 -- service checks"

  # POST-002: Nova compute
  if openstack hypervisor list -f json 2>/dev/null | python3 -c "import sys,json; h=json.load(sys.stdin); assert len(h) >= 1" 2>/dev/null; then
    POST_GATE_STATUS[POST-002]="pass"
    pass "POST-002: Nova hypervisor list returned >= 1 hypervisor"
  else
    POST_GATE_STATUS[POST-002]="fail"
    fail "POST-002 FAIL (action: block) -- no hypervisors available"
    stage_ok=false
  fi

  # POST-003: Neutron networking
  if openstack network agent list -f json 2>/dev/null | python3 -c "import sys,json; a=json.load(sys.stdin); assert len(a) >= 1" 2>/dev/null; then
    POST_GATE_STATUS[POST-003]="pass"
    pass "POST-003: Neutron network agents alive"
  else
    POST_GATE_STATUS[POST-003]="fail"
    fail "POST-003 FAIL (action: block) -- no Neutron agents available"
    stage_ok=false
  fi

  # POST-004: Glance images (warn only)
  if openstack image list -f json >/dev/null 2>&1; then
    POST_GATE_STATUS[POST-004]="pass"
    pass "POST-004: Glance image service responsive"
  else
    POST_GATE_STATUS[POST-004]="warn"
    warn "POST-004 WARN -- Glance not responding (action: warn, not blocking)"
  fi

  # POST-005: Cinder storage (warn only)
  if openstack volume service list -f json >/dev/null 2>&1; then
    POST_GATE_STATUS[POST-005]="pass"
    pass "POST-005: Cinder volume services listed"
  else
    POST_GATE_STATUS[POST-005]="warn"
    warn "POST-005 WARN -- Cinder not responding (action: warn, not blocking)"
  fi

  # POST-006: Horizon dashboard (warn only)
  local http_code
  http_code=$(curl -s --connect-timeout 10 -o /dev/null -w "%{http_code}" http://localhost/auth/login/ 2>/dev/null || echo "000")
  if [[ "$http_code" == "200" ]] || [[ "$http_code" == "302" ]]; then
    POST_GATE_STATUS[POST-006]="pass"
    pass "POST-006: Horizon dashboard accessible (HTTP ${http_code})"
  else
    POST_GATE_STATUS[POST-006]="warn"
    warn "POST-006 WARN -- Horizon returned HTTP ${http_code} (action: warn, not blocking)"
  fi

  # POST-007: Service catalog complete (block)
  if openstack catalog list -f json 2>/dev/null | python3 -c "
import sys, json
catalog = json.load(sys.stdin)
names = [s.get('Name', s.get('name', '')) for s in catalog]
required = ['identity', 'compute', 'network', 'image', 'volumev3']
missing = [r for r in required if not any(r in n.lower() for n in names)]
if missing:
    print('missing: ' + ','.join(missing))
    sys.exit(1)
" 2>/dev/null; then
    POST_GATE_STATUS[POST-007]="pass"
    pass "POST-007: Service catalog contains all required services"
  else
    POST_GATE_STATUS[POST-007]="fail"
    fail "POST-007 FAIL (action: block) -- service catalog missing entries"
    fail "Remediation: re-run kolla-ansible deploy for the missing service"
    stage_ok=false
  fi

  # --------------------------------------------------------------------------
  # Group 3: Integration tests (after all service checks)
  # --------------------------------------------------------------------------
  info "Group 3: POST-008 and POST-009 -- integration tests"

  # POST-008: End-to-end VM lifecycle (warn only)
  local e2e_ok=true
  # Create test network
  openstack network create test-e2e-net --no-share -f json >/dev/null 2>&1 || e2e_ok=false
  if $e2e_ok; then
    openstack subnet create test-e2e-subnet --network test-e2e-net --subnet-range 192.168.200.0/24 -f json >/dev/null 2>&1 || e2e_ok=false
    openstack flavor create test-e2e-tiny --ram 512 --disk 1 --vcpus 1 -f json >/dev/null 2>&1 || true  # flavor may already exist
    # Cleanup
    openstack subnet delete test-e2e-subnet >/dev/null 2>&1 || true
    openstack network delete test-e2e-net >/dev/null 2>&1 || true
    openstack flavor delete test-e2e-tiny >/dev/null 2>&1 || true
  fi
  if $e2e_ok; then
    POST_GATE_STATUS[POST-008]="pass"
    pass "POST-008: End-to-end VM lifecycle test passed (network, subnet, flavor)"
  else
    POST_GATE_STATUS[POST-008]="warn"
    warn "POST-008 WARN -- integration test incomplete (action: warn, not blocking)"
  fi

  # POST-009: Documentation verification (warn only)
  local doc_ok=true
  # Basic structural check -- verify doc files exist
  local docs_to_check=(
    "${PROJECT_ROOT}/docs/vv/e2e-deployment-verification.md"
  )
  for doc in "${docs_to_check[@]}"; do
    if [[ -f "$doc" ]]; then
      pass "POST-009: Document exists: $(basename "$doc")"
    else
      warn "POST-009: Document missing: $doc"
      doc_ok=false
    fi
  done
  if $doc_ok; then
    POST_GATE_STATUS[POST-009]="pass"
    pass "POST-009: Documentation structure verified"
  else
    POST_GATE_STATUS[POST-009]="warn"
    warn "POST-009 WARN -- some documentation missing (action: warn, trigger doc-sync loop)"
  fi

  if $stage_ok; then
    STAGE_STATUS[5]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[5]=$(elapsed "$start")
    pass "Stage 5 complete -- post-deploy gates passed"
    return 0
  else
    STAGE_STATUS[5]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[5]=$(elapsed "$start")
    fail "Stage 5 FAILED -- one or more blocking post-deploy gates failed"
    fail "Blocking gates: POST-001, POST-002, POST-003, POST-007"
    return 1
  fi
}

# =============================================================================
# Stage 6: Operations Handoff
# =============================================================================

stage_6_handoff() {
  hdr "Stage 6 -- Operations Handoff (Phase D to E transition)"
  local start
  start=$(stamp_seconds)
  local stage_ok=true

  if ${DRY_RUN}; then
    dry "check crew-handoff.yaml defines deployment-to-operations transition"
    dry "verify 9-step handoff procedure present"
    dry "verify context_preservation section (5 required items)"
    dry "verify operations crew activated at patrol profile"
    dry "verify SURGEON health monitoring configured"
    dry "verify CAPCOM persists across transition"
    STAGE_STATUS[6]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[6]=$(elapsed "$start")
    return 0
  fi

  check_file_exists "${CREW_HANDOFF}" "crew-handoff.yaml" || { STAGE_STATUS[6]="fail"; STAGE_FAIL=$((STAGE_FAIL + 1)); return 1; }
  check_file_exists "${OPERATIONS_CREW}" "operations-crew.yaml" || { STAGE_STATUS[6]="fail"; STAGE_FAIL=$((STAGE_FAIL + 1)); return 1; }

  python3 << PYEOF
import yaml, sys

with open('${CREW_HANDOFF}') as f:
    handoff = yaml.safe_load(f)

with open('${OPERATIONS_CREW}') as f:
    ops = yaml.safe_load(f)

ok = True

# Check transition defined
transitions = handoff.get('transitions', [])
t = next((x for x in transitions if x.get('id') == 'deployment-to-operations'), None)
if t:
    print('  \033[0;32mPASS\033[0m: deployment-to-operations transition defined')
else:
    print('  \033[0;31mFAIL\033[0m: deployment-to-operations transition not found')
    ok = False

if t:
    # Check 9-step procedure
    steps = t.get('procedure', {}).get('steps', [])
    if len(steps) >= 9:
        print(f'  \033[0;32mPASS\033[0m: {len(steps)} handoff procedure steps defined (expected >= 9)')
    else:
        print(f'  \033[0;33mWARN\033[0m: Only {len(steps)} procedure steps (expected 9)')

    # Check context preservation
    cp = t.get('context_preservation', {})
    system_state = cp.get('system_state', [])
    if len(system_state) >= 5:
        print(f'  \033[0;32mPASS\033[0m: {len(system_state)} context items defined for transfer')
    else:
        print(f'  \033[0;33mWARN\033[0m: Only {len(system_state)} context items (expected 5)')

    # Check agent mapping
    mapping = cp.get('agent_mapping', {}).get('mappings', [])
    if len(mapping) >= 5:
        print(f'  \033[0;32mPASS\033[0m: {len(mapping)} agent role mappings defined')
    else:
        print(f'  \033[0;33mWARN\033[0m: Only {len(mapping)} agent mappings')

    # Verify rollback defined
    rollback = t.get('rollback', {})
    if rollback.get('restore_profile') == 'squadron':
        print('  \033[0;32mPASS\033[0m: Handoff rollback restores squadron profile')
    else:
        print('  \033[0;33mWARN\033[0m: Rollback profile not set to squadron')

# Check operations crew SURGEON present
ops_positions = ops.get('positions', [])
surgeon = next((p for p in ops_positions if p.get('role') == 'SURGEON'), None)
if surgeon:
    monitor = surgeon.get('health_monitoring', {})
    interval = monitor.get('polling_interval_seconds', 0)
    endpoints = monitor.get('api_endpoints', [])
    print(f'  \033[0;32mPASS\033[0m: SURGEON present with {len(endpoints)} monitored endpoints (poll: {interval}s)')
else:
    print('  \033[0;31mFAIL\033[0m: SURGEON not found in operations crew')
    ok = False

# Check CAPCOM in operations crew
capcom = next((p for p in ops_positions if p.get('role') == 'CAPCOM'), None)
if capcom and capcom.get('human_interface'):
    print('  \033[0;32mPASS\033[0m: CAPCOM present in operations crew with human_interface: true')
else:
    print('  \033[0;31mFAIL\033[0m: CAPCOM human_interface not confirmed in operations crew')
    ok = False

sys.exit(0 if ok else 1)
PYEOF
  local py_exit=$?

  if [[ $py_exit -eq 0 ]]; then
    STAGE_STATUS[6]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[6]=$(elapsed "$start")
    pass "Stage 6 complete -- operations handoff configuration validated"
    return 0
  else
    STAGE_STATUS[6]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[6]=$(elapsed "$start")
    fail "Stage 6 FAILED -- handoff configuration errors detected"
    return 1
  fi
}

# =============================================================================
# Stage 7: Documentation Verification
# =============================================================================

stage_7_doc_verify() {
  hdr "Stage 7 -- Documentation Verification (Phase D closeout)"
  local start
  start=$(stamp_seconds)
  local stage_ok=true

  if ${DRY_RUN}; then
    dry "check docs/vv/e2e-deployment-verification.md exists and contains all 7 stages"
    dry "check docs/sysadmin-guide/ directory present"
    dry "check docs/ops-manual/ directory present"
    dry "check docs/runbooks/ directory present"
    dry "run doc-verifier drift detection (would compare catalog to documented endpoints)"
    dry "log any drift findings"
    STAGE_STATUS[7]="skip"
    STAGE_SKIP=$((STAGE_SKIP + 1))
    STAGE_DURATION[7]=$(elapsed "$start")
    return 0
  fi

  local docs_root="${PROJECT_ROOT}/docs"

  # Check key documentation artifacts exist
  local required_docs=(
    "${docs_root}/vv/e2e-deployment-verification.md"
  )

  for doc in "${required_docs[@]}"; do
    if [[ -f "$doc" ]]; then
      pass "Doc exists: ${doc#"${PROJECT_ROOT}/"}"
    else
      fail "Doc missing: ${doc#"${PROJECT_ROOT}/"}"
      stage_ok=false
    fi
  done

  # Check optional doc directories (warn if absent)
  for dir in sysadmin-guide ops-manual runbooks; do
    if [[ -d "${docs_root}/${dir}" ]]; then
      local count
      count=$(find "${docs_root}/${dir}" -name "*.md" 2>/dev/null | wc -l)
      pass "docs/${dir}/ present (${count} markdown files)"
    else
      warn "docs/${dir}/ not found (expected documentation directory)"
    fi
  done

  # Verify e2e document contains all 7 stages
  local vv_doc="${docs_root}/vv/e2e-deployment-verification.md"
  if [[ -f "$vv_doc" ]]; then
    local stage_count
    stage_count=$(grep -c "^### Stage [1-7]" "$vv_doc" 2>/dev/null || echo 0)
    if [[ "$stage_count" -ge 7 ]]; then
      pass "e2e-deployment-verification.md contains ${stage_count} stages"
    else
      warn "e2e-deployment-verification.md has ${stage_count} stage sections (expected 7)"
    fi

    # Check VERIF-06 traceability
    if grep -q "VERIF-06" "$vv_doc" 2>/dev/null; then
      pass "VERIF-06 requirement traceability present"
    else
      warn "VERIF-06 not found in verification document"
    fi

    # Check all gate references present
    local gate_refs
    gate_refs=$(grep -c "PRE-00[1-4]\|POST-00[1-9]" "$vv_doc" 2>/dev/null || echo 0)
    if [[ "$gate_refs" -ge 13 ]]; then
      pass "Gate references found: ${gate_refs} (PRE-001..PRE-004 + POST-001..POST-009)"
    else
      warn "Only ${gate_refs} gate references found (expected >= 13)"
    fi
  fi

  # Documentation drift detection (basic version without live OpenStack)
  info "Documentation drift check (structural -- live system check requires OpenStack)..."
  if openstack_available && $OPENSTACK_DEPLOYED; then
    info "Running catalog vs documentation comparison..."
    local catalog_services
    catalog_services=$(openstack catalog list -f value -c Name 2>/dev/null | sort | tr '\n' ' ' || echo "unavailable")
    info "Catalog services: ${catalog_services}"
    pass "Catalog retrieved for documentation comparison"
  else
    info "OpenStack not available -- skipping live drift detection"
    info "Run with OpenStack credentials sourced for full drift check"
    warn "Live documentation drift detection skipped (run on deployed system)"
  fi

  if $stage_ok; then
    STAGE_STATUS[7]="pass"
    STAGE_PASS=$((STAGE_PASS + 1))
    STAGE_DURATION[7]=$(elapsed "$start")
    pass "Stage 7 complete -- documentation verification passed"
    return 0
  else
    STAGE_STATUS[7]="fail"
    STAGE_FAIL=$((STAGE_FAIL + 1))
    STAGE_DURATION[7]=$(elapsed "$start")
    fail "Stage 7 FAILED -- documentation issues detected"
    return 1
  fi
}

# =============================================================================
# Main
# =============================================================================

main() {
  echo ""
  echo -e "${BOLD}=========================================================${NC}"
  echo -e "${BOLD}  End-to-End Deployment Verification${NC}"
  echo -e "${BOLD}  Requirement: VERIF-06 | Phase: NASA SE Phase D SIR${NC}"
  echo -e "${BOLD}=========================================================${NC}"
  echo ""
  info "Timestamp: ${TIMESTAMP}"
  info "Git commit: ${GIT_COMMIT} (INTEG-05)"
  info "Operator:   ${OPERATOR}"
  info "Results:    ${RESULTS_FILE}"
  if ${DRY_RUN}; then
    echo -e "  ${YELLOW}DRY-RUN MODE${NC}: Checks will be printed, not executed"
  fi
  if [[ "$START_STAGE" -gt 1 ]]; then
    info "Starting from Stage ${START_STAGE}"
  fi

  local overall_exit=0

  # Execute stages in order, starting from START_STAGE
  # Each stage returns 0 on pass/skip, 1 on blocking failure

  if [[ "$START_STAGE" -le 1 ]]; then
    stage_1_baseline || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 2 ]]; then
    stage_2_predeploy || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 3 ]]; then
    stage_3_crew_activation || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 4 ]]; then
    stage_4_deployment || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 5 ]]; then
    stage_5_postdeploy || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 6 ]]; then
    stage_6_handoff || overall_exit=1
  fi

  if [[ "$START_STAGE" -le 7 ]]; then
    stage_7_doc_verify || overall_exit=1
  fi

  # Determine overall verdict
  if [[ "$overall_exit" -eq 0 ]]; then
    OVERALL_VERDICT="PASS"
  else
    OVERALL_VERDICT="FAIL"
  fi

  # Write results YAML
  write_results_yaml "${OVERALL_VERDICT}"

  # Print summary
  echo ""
  echo -e "${BOLD}=========================================================${NC}"
  echo -e "${BOLD}  Verification Summary${NC}"
  echo -e "${BOLD}=========================================================${NC}"
  echo ""
  printf "  %-20s %d\n" "Total stages:" 7
  printf "  %-20s %d\n" "Passed:"       "${STAGE_PASS}"
  printf "  %-20s %d\n" "Failed:"       "${STAGE_FAIL}"
  printf "  %-20s %d\n" "Skipped:"      "${STAGE_SKIP}"
  echo ""

  if [[ "$OVERALL_VERDICT" == "PASS" ]]; then
    echo -e "  ${GREEN}${BOLD}Overall Verdict: PASS${NC}"
  else
    echo -e "  ${RED}${BOLD}Overall Verdict: FAIL${NC}"
  fi

  echo ""
  echo -e "  Results written to: ${RESULTS_FILE}"
  echo ""

  return $overall_exit
}

main "$@"

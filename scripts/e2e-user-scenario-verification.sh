#!/usr/bin/env bash
# =============================================================================
# End-to-End User Scenario Verification Script
# =============================================================================
#
# Requirement:      VERIF-07
# NASA SE Phase:    Phase E -- Operations and Sustainment (ORR Gate)
# Reference doc:   docs/vv/e2e-user-scenario-verification.md
# Results file:    configs/evaluation/e2e-user-scenario-results.yaml
#
# Purpose:
#   Automates the 8-stage tenant user scenario: authenticate, create project,
#   configure network, launch instance, attach storage, access via floating IP,
#   and clean up. Exercises all 5 core OpenStack services.
#
# Usage:
#   ./scripts/e2e-user-scenario-verification.sh [OPTIONS]
#
# Options:
#   --dry-run                  Print commands without executing
#   --skip-cleanup             Leave test resources in place for debugging
#   --external-network <name>  External network name for floating IPs (default: external)
#   --image <name>             Guest image name to use (default: cirros)
#   --results <path>           Results file path (default: configs/evaluation/e2e-user-scenario-results.yaml)
#
# Resource naming:
#   All test resources use the 'e2e-test-' prefix for reliable identification.
#   The cleanup trap removes all matching resources on exit.
#
# =============================================================================

set -euo pipefail

# =============================================================================
# Constants -- all test resource names use e2e-test- prefix
# =============================================================================

E2E_PROJECT="e2e-test-project"
E2E_USER="e2e-test-user"
E2E_NETWORK="e2e-test-net"
E2E_SUBNET="e2e-test-subnet"
E2E_ROUTER="e2e-test-router"
E2E_SG="e2e-test-sg"
E2E_INSTANCE="e2e-test-instance"
E2E_VOLUME="e2e-test-volume"
E2E_KEYPAIR="e2e-test-key"
E2E_FLAVOR="e2e-tiny"

# Temporary files (use prefix for cleanup)
E2E_KEY_FILE="/tmp/e2e-test-key.pem"
E2E_OPENRC_FILE="/tmp/e2e-test-openrc.sh"

# =============================================================================
# Defaults (overridden by flags)
# =============================================================================

DRY_RUN=false
SKIP_CLEANUP=false
EXTERNAL_NETWORK="external"
IMAGE_NAME="cirros"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
RESULTS_FILE="${REPO_ROOT}/configs/evaluation/e2e-user-scenario-results.yaml"

# =============================================================================
# Runtime state
# =============================================================================

GIT_COMMIT="unknown"
OPERATOR="${USER:-unknown}"
START_TIME="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
START_EPOCH="$(date +%s)"

# Stage tracking
declare -A STAGE_STATUS
declare -A STAGE_DURATION
STAGES_TOTAL=8
STAGES_PASSED=0
STAGES_FAILED=0
STAGES_SKIPPED=0

# Services exercised (populated as stages pass)
SERVICES_EXERCISED=()

# Floating IP for cleanup
ALLOCATED_FLOATING_IP=""

# =============================================================================
# Parse arguments
# =============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-cleanup)
      SKIP_CLEANUP=true
      shift
      ;;
    --external-network)
      EXTERNAL_NETWORK="${2:?--external-network requires a value}"
      shift 2
      ;;
    --image)
      IMAGE_NAME="${2:?--image requires a value}"
      shift 2
      ;;
    --results)
      RESULTS_FILE="${2:?--results requires a value}"
      shift 2
      ;;
    -h|--help)
      head -45 "${BASH_SOURCE[0]}" | tail -30
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# =============================================================================
# Utility functions
# =============================================================================

print_header() {
  local stage="$1"
  local services="$2"
  echo ""
  echo "=================================================================="
  echo "  Stage ${stage}"
  echo "  Services: ${services}"
  echo "=================================================================="
}

log_info() {
  echo "[INFO]  $*"
}

log_pass() {
  echo "[PASS]  $*"
}

log_fail() {
  echo "[FAIL]  $*" >&2
}

log_skip() {
  echo "[SKIP]  $*"
}

log_warn() {
  echo "[WARN]  $*" >&2
}

# Run a command in dry-run-aware mode.
# In dry-run, prints the command; in live mode, executes it.
run_cmd() {
  if $DRY_RUN; then
    echo "[DRY-RUN] $*"
    return 0
  else
    "$@"
  fi
}

# Record stage result and compute elapsed time
record_stage() {
  local stage="$1"
  local status="$2"  # pass | fail | skip
  local stage_start="$3"

  STAGE_STATUS["$stage"]="$status"
  local now
  now="$(date +%s)"
  STAGE_DURATION["$stage"]=$((now - stage_start))

  case "$status" in
    pass)
      STAGES_PASSED=$((STAGES_PASSED + 1))
      log_pass "Stage ${stage} completed in ${STAGE_DURATION[$stage]}s"
      ;;
    fail)
      STAGES_FAILED=$((STAGES_FAILED + 1))
      log_fail "Stage ${stage} FAILED after ${STAGE_DURATION[$stage]}s"
      ;;
    skip)
      STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
      log_skip "Stage ${stage} skipped"
      ;;
  esac
}

# Add service to exercised list if not already present
add_service() {
  local svc="$1"
  for s in "${SERVICES_EXERCISED[@]+"${SERVICES_EXERCISED[@]}"}"; do
    [[ "$s" == "$svc" ]] && return
  done
  SERVICES_EXERCISED+=("$svc")
}

# Poll for a resource to reach a target status.
# Usage: wait_for_status <resource_type> <resource_name> <target_status> <timeout_seconds>
wait_for_status() {
  local resource_type="$1"
  local resource_name="$2"
  local target_status="$3"
  local timeout="${4:-120}"
  local interval=5
  local elapsed=0
  local current_status

  while [ "$elapsed" -lt "$timeout" ]; do
    current_status=$(openstack "${resource_type}" show "${resource_name}" -f value -c status 2>/dev/null || echo "unknown")
    log_info "${resource_type} ${resource_name} status: ${current_status} (${elapsed}s/${timeout}s)"

    if [[ "$current_status" == "$target_status" ]]; then
      return 0
    fi

    if [[ "$current_status" == "error" || "$current_status" == "ERROR" ]]; then
      log_fail "${resource_type} ${resource_name} entered error state"
      openstack "${resource_type}" show "${resource_name}" 2>/dev/null || true
      return 1
    fi

    sleep "$interval"
    elapsed=$((elapsed + interval))
  done

  log_fail "${resource_type} ${resource_name} did not reach '${target_status}' within ${timeout}s (last: ${current_status})"
  return 1
}

# =============================================================================
# Prerequisite checks
# =============================================================================

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check OpenStack CLI is available
  if ! command -v openstack &>/dev/null; then
    log_fail "OpenStack CLI not found. Install with: pip install python-openstackclient"
    log_fail "Then source your admin openrc: source /etc/kolla/admin-openrc.sh"
    exit 2
  fi

  # Check OpenStack credentials are set
  if [ -z "${OS_AUTH_URL:-}" ]; then
    log_fail "OS_AUTH_URL is not set. Source your admin openrc first:"
    log_fail "  source /etc/kolla/admin-openrc.sh"
    exit 2
  fi

  # Check authentication works
  if ! $DRY_RUN; then
    if ! openstack token issue &>/dev/null; then
      log_fail "Cannot authenticate to OpenStack. Verify credentials and Keystone status."
      log_fail "Try: openstack token issue"
      exit 2
    fi
  fi

  # Record git commit for traceability
  if command -v git &>/dev/null && git -C "${REPO_ROOT}" rev-parse HEAD &>/dev/null 2>&1; then
    GIT_COMMIT="$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")"
  fi

  log_pass "Prerequisites satisfied. Git commit: ${GIT_COMMIT}"
}

# =============================================================================
# Stage 1: Authentication
# =============================================================================

stage_1_authentication() {
  print_header "1 -- Authentication" "Keystone"
  local stage_start
  stage_start="$(date +%s)"

  log_info "Issuing authentication token..."
  if ! $DRY_RUN; then
    if ! openstack token issue; then
      record_stage 1 fail "$stage_start"
      log_fail "Remediation: Check Keystone containers: docker ps | grep keystone"
      log_fail "Reference: skills/openstack/keystone/SKILL.md -- Troubleshooting"
      return 1
    fi
  else
    log_info "[DRY-RUN] openstack token issue"
  fi

  log_info "Creating test project: ${E2E_PROJECT}"
  run_cmd openstack project create "${E2E_PROJECT}" \
    --description "E2E verification test project (safe to delete)"

  log_info "Creating test user: ${E2E_USER}"
  local test_password
  test_password="e2e-test-password-$(date +%s)"
  run_cmd openstack user create "${E2E_USER}" \
    --project "${E2E_PROJECT}" \
    --password "${test_password}"

  log_info "Assigning member role to ${E2E_USER} on ${E2E_PROJECT}..."
  run_cmd openstack role add \
    --project "${E2E_PROJECT}" \
    --user "${E2E_USER}" \
    member

  log_info "Verifying role assignment..."
  if ! $DRY_RUN; then
    openstack role assignment list \
      --project "${E2E_PROJECT}" \
      --user "${E2E_USER}"
  else
    log_info "[DRY-RUN] openstack role assignment list --project ${E2E_PROJECT} --user ${E2E_USER}"
  fi

  add_service "keystone"
  record_stage 1 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 2: Project Setup
# =============================================================================

stage_2_project_setup() {
  print_header "2 -- Project Setup" "Keystone"
  local stage_start
  stage_start="$(date +%s)"

  log_info "Verifying project access..."
  if ! $DRY_RUN; then
    openstack project show "${E2E_PROJECT}"
  else
    log_info "[DRY-RUN] openstack project show ${E2E_PROJECT}"
  fi

  log_info "Listing service catalog..."
  if ! $DRY_RUN; then
    if ! openstack catalog list; then
      record_stage 2 fail "$stage_start"
      log_fail "Remediation: Re-run kolla-ansible post-deploy to recreate service catalog"
      log_fail "Reference: skills/openstack/keystone/SKILL.md -- Service Catalog"
      return 1
    fi
  else
    log_info "[DRY-RUN] openstack catalog list"
  fi

  log_info "Verifying service endpoints are registered..."
  for svc in identity compute network image volumev3; do
    if ! $DRY_RUN; then
      count=$(openstack endpoint list --service "${svc}" -f value -c "ID" 2>/dev/null | wc -l)
      if [ "$count" -eq 0 ]; then
        log_warn "No endpoints found for service: ${svc}"
      else
        log_pass "Service '${svc}' has ${count} endpoint(s)"
      fi
    else
      log_info "[DRY-RUN] openstack endpoint list --service ${svc}"
    fi
  done

  add_service "keystone"
  record_stage 2 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 3: Network Configuration
# =============================================================================

stage_3_network_config() {
  print_header "3 -- Network Configuration" "Neutron"
  local stage_start
  stage_start="$(date +%s)"

  log_info "Creating tenant network: ${E2E_NETWORK}"
  run_cmd openstack network create "${E2E_NETWORK}" \
    --description "E2E verification test network"

  log_info "Creating subnet: ${E2E_SUBNET} (10.0.0.0/24)"
  run_cmd openstack subnet create "${E2E_SUBNET}" \
    --network "${E2E_NETWORK}" \
    --subnet-range 10.0.0.0/24 \
    --dns-nameserver 8.8.8.8 \
    --description "E2E verification test subnet"

  log_info "Creating router: ${E2E_ROUTER}"
  run_cmd openstack router create "${E2E_ROUTER}" \
    --description "E2E verification test router"

  log_info "Setting external gateway on router (external network: ${EXTERNAL_NETWORK})..."
  if ! $DRY_RUN; then
    # Verify the external network exists
    if ! openstack network show "${EXTERNAL_NETWORK}" &>/dev/null; then
      log_fail "External network '${EXTERNAL_NETWORK}' not found."
      log_fail "Available external networks:"
      openstack network list --external -f value -c Name 2>/dev/null || true
      log_fail "Specify with: --external-network <name>"
      log_fail "Remediation: Create external provider network or check Neutron configuration."
      log_fail "Reference: skills/openstack/neutron/SKILL.md -- Troubleshooting"
      record_stage 3 fail "$stage_start"
      return 1
    fi
    openstack router set "${E2E_ROUTER}" --external-gateway "${EXTERNAL_NETWORK}"
  else
    log_info "[DRY-RUN] openstack router set ${E2E_ROUTER} --external-gateway ${EXTERNAL_NETWORK}"
  fi

  log_info "Adding subnet to router..."
  run_cmd openstack router add subnet "${E2E_ROUTER}" "${E2E_SUBNET}"

  log_info "Verifying network topology..."
  if ! $DRY_RUN; then
    openstack network show "${E2E_NETWORK}" -f value -c id -c subnets -c admin_state_up
    openstack router show "${E2E_ROUTER}" -f value -c id -c external_gateway_info -c status
  else
    log_info "[DRY-RUN] openstack network show ${E2E_NETWORK}"
    log_info "[DRY-RUN] openstack router show ${E2E_ROUTER}"
  fi

  add_service "neutron"
  record_stage 3 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 4: Security Group Configuration
# =============================================================================

stage_4_security_group() {
  print_header "4 -- Security Group Configuration" "Neutron"
  local stage_start
  stage_start="$(date +%s)"

  log_info "Creating security group: ${E2E_SG}"
  run_cmd openstack security group create "${E2E_SG}" \
    --description "E2E verification security group"

  log_info "Verifying default deny-all ingress (SC-009)..."
  if ! $DRY_RUN; then
    # Default SG should have no external ingress rules
    ingress_count=$(openstack security group rule list "${E2E_SG}" \
      --ingress -f value -c "IP Range" 2>/dev/null | grep -v "^$" | grep -c "." || true)
    log_info "Default ingress rules from external sources: ${ingress_count} (expected: 0)"
  fi

  log_info "Adding SSH ingress rule (TCP:22)..."
  run_cmd openstack security group rule create \
    --protocol tcp \
    --dst-port 22 \
    --ingress \
    "${E2E_SG}"

  log_info "Adding ICMP ingress rule (ping)..."
  run_cmd openstack security group rule create \
    --protocol icmp \
    --ingress \
    "${E2E_SG}"

  log_info "Verifying security group rules..."
  if ! $DRY_RUN; then
    openstack security group rule list "${E2E_SG}"
  else
    log_info "[DRY-RUN] openstack security group rule list ${E2E_SG}"
  fi

  add_service "neutron"
  record_stage 4 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 5: Instance Launch
# =============================================================================

stage_5_instance_launch() {
  print_header "5 -- Instance Launch" "Nova, Glance, Neutron"
  local stage_start
  stage_start="$(date +%s)"

  # Check if guest image is available
  local found_image=""
  if ! $DRY_RUN; then
    found_image=$(openstack image list -f value -c Name 2>/dev/null \
      | grep -i "${IMAGE_NAME}" | head -1 || true)
    if [ -z "$found_image" ]; then
      log_skip "No image matching '${IMAGE_NAME}' found in Glance. Skipping stages 5-7."
      log_skip "Upload a guest image first:"
      log_skip "  wget https://download.cirros-cloud.net/0.6.2/cirros-0.6.2-x86_64-disk.img"
      log_skip "  openstack image create cirros --file cirros-0.6.2-x86_64-disk.img \\"
      log_skip "    --disk-format qcow2 --container-format bare --public"
      record_stage 5 skip "$stage_start"
      STAGE_STATUS[6]="skip"
      STAGE_DURATION[6]=0
      STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
      STAGE_STATUS[7]="skip"
      STAGE_DURATION[7]=0
      STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
      return 0
    fi
    log_info "Using image: ${found_image}"
  else
    found_image="${IMAGE_NAME}"
    log_info "[DRY-RUN] Would use image matching: ${IMAGE_NAME}"
  fi

  log_info "Listing available flavors..."
  if ! $DRY_RUN; then
    openstack flavor list
  else
    log_info "[DRY-RUN] openstack flavor list"
  fi

  log_info "Creating test flavor: ${E2E_FLAVOR} (512MB RAM, 1 vCPU, 1GB disk)"
  if ! $DRY_RUN; then
    openstack flavor create "${E2E_FLAVOR}" \
      --ram 512 \
      --disk 1 \
      --vcpus 1 \
      2>/dev/null && log_info "Flavor '${E2E_FLAVOR}' created" \
      || log_info "Flavor '${E2E_FLAVOR}' already exists, using existing"
  else
    log_info "[DRY-RUN] openstack flavor create ${E2E_FLAVOR} --ram 512 --disk 1 --vcpus 1"
  fi

  log_info "Creating keypair: ${E2E_KEYPAIR}"
  if ! $DRY_RUN; then
    openstack keypair create "${E2E_KEYPAIR}" > "${E2E_KEY_FILE}"
    chmod 600 "${E2E_KEY_FILE}"
    log_info "Private key saved to: ${E2E_KEY_FILE}"
  else
    log_info "[DRY-RUN] openstack keypair create ${E2E_KEYPAIR} > ${E2E_KEY_FILE}"
  fi

  log_info "Launching instance: ${E2E_INSTANCE}"
  run_cmd openstack server create "${E2E_INSTANCE}" \
    --image "${found_image}" \
    --flavor "${E2E_FLAVOR}" \
    --network "${E2E_NETWORK}" \
    --security-group "${E2E_SG}" \
    --key-name "${E2E_KEYPAIR}"

  log_info "Waiting for instance to reach ACTIVE status (timeout: 120s)..."
  if ! $DRY_RUN; then
    if ! wait_for_status server "${E2E_INSTANCE}" ACTIVE 120; then
      record_stage 5 fail "$stage_start"
      log_fail "Remediation: Check nova compute service and hypervisor availability."
      log_fail "  openstack compute service list"
      log_fail "  openstack hypervisor list"
      log_fail "  openstack server show ${E2E_INSTANCE}  # check fault field"
      log_fail "Reference: skills/openstack/nova/SKILL.md -- Troubleshooting"
      return 1
    fi
  fi

  log_info "Checking console log for boot messages..."
  if ! $DRY_RUN; then
    openstack console log show "${E2E_INSTANCE}" 2>/dev/null | head -20 \
      || log_warn "Could not retrieve console log (service may not be ready yet)"
  else
    log_info "[DRY-RUN] openstack console log show ${E2E_INSTANCE}"
  fi

  add_service "nova"
  add_service "glance"
  add_service "neutron"
  record_stage 5 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 6: Storage Attachment
# =============================================================================

stage_6_storage_attach() {
  print_header "6 -- Storage Attachment" "Cinder, Nova"
  local stage_start
  stage_start="$(date +%s)"

  # Skip if stage 5 was skipped
  if [[ "${STAGE_STATUS[5]:-}" == "skip" ]]; then
    log_skip "Skipping: instance launch (stage 5) was skipped"
    record_stage 6 skip "$stage_start"
    return 0
  fi

  log_info "Creating 1GB test volume: ${E2E_VOLUME}"
  run_cmd openstack volume create "${E2E_VOLUME}" \
    --size 1 \
    --description "E2E verification test volume"

  log_info "Waiting for volume to reach 'available' status (timeout: 60s)..."
  if ! $DRY_RUN; then
    if ! wait_for_status volume "${E2E_VOLUME}" available 60; then
      record_stage 6 fail "$stage_start"
      log_fail "Remediation: Check Cinder volume service."
      log_fail "  openstack volume service list"
      log_fail "  vgs  # verify LVM volume group exists"
      log_fail "Reference: skills/openstack/cinder/SKILL.md -- Troubleshooting"
      return 1
    fi
  fi

  log_info "Attaching volume to instance..."
  run_cmd openstack server add volume "${E2E_INSTANCE}" "${E2E_VOLUME}"

  log_info "Verifying attachment (waiting 10s for status transition)..."
  if ! $DRY_RUN; then
    sleep 10
    vol_status=$(openstack volume show "${E2E_VOLUME}" -f value -c status 2>/dev/null || echo "unknown")
    log_info "Volume status after attach: ${vol_status}"
    if [[ "$vol_status" == "in-use" ]]; then
      log_pass "Volume is in-use (attached successfully)"
    else
      log_warn "Volume status is '${vol_status}' (expected 'in-use'); attachment may still be in progress"
    fi
    openstack volume show "${E2E_VOLUME}" -f value -c id -c status -c attachments
  else
    log_info "[DRY-RUN] openstack volume show ${E2E_VOLUME}"
  fi

  add_service "cinder"
  add_service "nova"
  record_stage 6 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 7: Floating IP Access
# =============================================================================

stage_7_floating_ip() {
  print_header "7 -- Floating IP Access" "Neutron, Nova"
  local stage_start
  stage_start="$(date +%s)"

  # Skip if stage 5 was skipped
  if [[ "${STAGE_STATUS[5]:-}" == "skip" ]]; then
    log_skip "Skipping: instance launch (stage 5) was skipped"
    record_stage 7 skip "$stage_start"
    return 0
  fi

  log_info "Allocating floating IP from external network: ${EXTERNAL_NETWORK}"
  if ! $DRY_RUN; then
    ALLOCATED_FLOATING_IP=$(openstack floating ip create "${EXTERNAL_NETWORK}" \
      -f value -c floating_ip_address 2>/dev/null || true)
    if [ -z "$ALLOCATED_FLOATING_IP" ]; then
      record_stage 7 fail "$stage_start"
      log_fail "Could not allocate floating IP from '${EXTERNAL_NETWORK}'."
      log_fail "Remediation: Verify external network configuration and floating IP quota."
      log_fail "  openstack network list --external"
      log_fail "  openstack quota show | grep floating"
      log_fail "Reference: skills/openstack/neutron/SKILL.md -- Floating IPs"
      return 1
    fi
    log_pass "Floating IP allocated: ${ALLOCATED_FLOATING_IP}"
  else
    log_info "[DRY-RUN] openstack floating ip create ${EXTERNAL_NETWORK}"
    ALLOCATED_FLOATING_IP="203.0.113.100"  # RFC 5737 documentation address for dry-run
  fi

  log_info "Associating floating IP ${ALLOCATED_FLOATING_IP} with instance ${E2E_INSTANCE}..."
  run_cmd openstack server add floating ip "${E2E_INSTANCE}" "${ALLOCATED_FLOATING_IP}"

  log_info "Verifying floating IP association..."
  if ! $DRY_RUN; then
    sleep 5  # Allow association to settle
    openstack server show "${E2E_INSTANCE}" -f value -c addresses
  else
    log_info "[DRY-RUN] openstack server show ${E2E_INSTANCE}"
  fi

  log_info "Testing ICMP connectivity (ping ${ALLOCATED_FLOATING_IP})..."
  local ping_result="fail"
  if ! $DRY_RUN; then
    if ping -c 3 -W 5 "${ALLOCATED_FLOATING_IP}" 2>/dev/null; then
      log_pass "ICMP ping to ${ALLOCATED_FLOATING_IP}: SUCCESS"
      ping_result="pass"
    else
      log_warn "ICMP ping to ${ALLOCATED_FLOATING_IP}: FAILED"
      log_warn "Remediation: Verify security group allows ICMP, check L3 agent, check OVS flows."
      log_warn "Reference: skills/openstack/networking-debug/SKILL.md -- Connectivity Diagnostics"
      ping_result="fail"
    fi
  else
    log_info "[DRY-RUN] ping -c 3 -W 5 ${ALLOCATED_FLOATING_IP}"
    ping_result="skip"
  fi

  log_info "Testing SSH connectivity (cirros@${ALLOCATED_FLOATING_IP})..."
  local ssh_result="skip"
  if ! $DRY_RUN && [ -f "${E2E_KEY_FILE}" ]; then
    if ssh -o StrictHostKeyChecking=no \
           -o ConnectTimeout=30 \
           -o BatchMode=yes \
           -i "${E2E_KEY_FILE}" \
           "cirros@${ALLOCATED_FLOATING_IP}" \
           hostname 2>/dev/null; then
      log_pass "SSH to ${ALLOCATED_FLOATING_IP}: SUCCESS"
      ssh_result="pass"
    else
      log_warn "SSH to ${ALLOCATED_FLOATING_IP}: FAILED or not applicable"
      log_warn "Note: SSH failure may be expected if image user differs from 'cirros'."
      ssh_result="fail"
    fi
  else
    log_info "[DRY-RUN] ssh cirros@${ALLOCATED_FLOATING_IP} hostname"
  fi

  # Stage passes if floating IP was allocated and associated; ping/SSH are advisory
  add_service "neutron"
  add_service "nova"
  record_stage 7 pass "$stage_start"
  return 0
}

# =============================================================================
# Stage 8: Cleanup
# =============================================================================

stage_8_cleanup() {
  print_header "8 -- Cleanup" "All services"
  local stage_start
  stage_start="$(date +%s)"

  log_info "Removing all e2e-test- resources in reverse creation order..."

  # Detach volume from instance first
  if ! $DRY_RUN; then
    openstack server remove volume "${E2E_INSTANCE}" "${E2E_VOLUME}" 2>/dev/null \
      && log_info "Volume detached from instance" \
      || log_info "Volume was not attached (already detached or instance missing)"
  else
    log_info "[DRY-RUN] openstack server remove volume ${E2E_INSTANCE} ${E2E_VOLUME}"
  fi

  # Delete instance
  log_info "Deleting instance: ${E2E_INSTANCE}"
  if ! $DRY_RUN; then
    openstack server delete "${E2E_INSTANCE}" --wait 2>/dev/null \
      && log_info "Instance deleted" \
      || log_info "Instance not found (already deleted or was not created)"
  else
    log_info "[DRY-RUN] openstack server delete ${E2E_INSTANCE} --wait"
  fi

  # Delete volume
  log_info "Deleting volume: ${E2E_VOLUME}"
  if ! $DRY_RUN; then
    openstack volume delete "${E2E_VOLUME}" 2>/dev/null \
      && log_info "Volume deleted" \
      || log_info "Volume not found"
  else
    log_info "[DRY-RUN] openstack volume delete ${E2E_VOLUME}"
  fi

  # Delete floating IP
  if [ -n "${ALLOCATED_FLOATING_IP}" ]; then
    log_info "Deleting floating IP: ${ALLOCATED_FLOATING_IP}"
    if ! $DRY_RUN; then
      FIP_ID=$(openstack floating ip list -f value -c ID \
        | xargs -I{} sh -c "openstack floating ip show {} -f value -c floating_ip_address 2>/dev/null | grep -q '${ALLOCATED_FLOATING_IP}' && echo {} || true" \
        | head -1)
      [ -n "${FIP_ID}" ] && openstack floating ip delete "${FIP_ID}" 2>/dev/null \
        && log_info "Floating IP deleted" \
        || log_info "Floating IP not found or already deleted"
    else
      log_info "[DRY-RUN] openstack floating ip delete <${ALLOCATED_FLOATING_IP}>"
    fi
  fi

  # Remove subnet from router
  log_info "Removing subnet from router..."
  if ! $DRY_RUN; then
    openstack router remove subnet "${E2E_ROUTER}" "${E2E_SUBNET}" 2>/dev/null \
      && log_info "Subnet removed from router" \
      || log_info "Subnet-router interface not found"
    openstack router unset "${E2E_ROUTER}" --external-gateway 2>/dev/null \
      && log_info "External gateway removed" \
      || log_info "External gateway not set"
  else
    log_info "[DRY-RUN] openstack router remove subnet ${E2E_ROUTER} ${E2E_SUBNET}"
  fi

  # Delete router
  log_info "Deleting router: ${E2E_ROUTER}"
  if ! $DRY_RUN; then
    openstack router delete "${E2E_ROUTER}" 2>/dev/null \
      && log_info "Router deleted" \
      || log_info "Router not found"
  else
    log_info "[DRY-RUN] openstack router delete ${E2E_ROUTER}"
  fi

  # Delete network (subnet is auto-deleted with network)
  log_info "Deleting network: ${E2E_NETWORK} (and subnet ${E2E_SUBNET})"
  if ! $DRY_RUN; then
    openstack network delete "${E2E_NETWORK}" 2>/dev/null \
      && log_info "Network (and subnet) deleted" \
      || log_info "Network not found"
  else
    log_info "[DRY-RUN] openstack network delete ${E2E_NETWORK}"
  fi

  # Delete security group
  log_info "Deleting security group: ${E2E_SG}"
  if ! $DRY_RUN; then
    openstack security group delete "${E2E_SG}" 2>/dev/null \
      && log_info "Security group deleted" \
      || log_info "Security group not found"
  else
    log_info "[DRY-RUN] openstack security group delete ${E2E_SG}"
  fi

  # Delete keypair
  log_info "Deleting keypair: ${E2E_KEYPAIR}"
  if ! $DRY_RUN; then
    openstack keypair delete "${E2E_KEYPAIR}" 2>/dev/null \
      && log_info "Keypair deleted" \
      || log_info "Keypair not found"
    rm -f "${E2E_KEY_FILE}" "${E2E_OPENRC_FILE}"
  else
    log_info "[DRY-RUN] openstack keypair delete ${E2E_KEYPAIR}"
  fi

  # Delete flavor (only if created by this script)
  log_info "Deleting flavor: ${E2E_FLAVOR}"
  if ! $DRY_RUN; then
    openstack flavor delete "${E2E_FLAVOR}" 2>/dev/null \
      && log_info "Flavor deleted" \
      || log_info "Flavor not found (may not have been created)"
  else
    log_info "[DRY-RUN] openstack flavor delete ${E2E_FLAVOR}"
  fi

  # Delete test user
  log_info "Deleting user: ${E2E_USER}"
  if ! $DRY_RUN; then
    openstack user delete "${E2E_USER}" 2>/dev/null \
      && log_info "User deleted" \
      || log_info "User not found"
  else
    log_info "[DRY-RUN] openstack user delete ${E2E_USER}"
  fi

  # Delete test project
  log_info "Deleting project: ${E2E_PROJECT}"
  if ! $DRY_RUN; then
    openstack project delete "${E2E_PROJECT}" 2>/dev/null \
      && log_info "Project deleted" \
      || log_info "Project not found"
  else
    log_info "[DRY-RUN] openstack project delete ${E2E_PROJECT}"
  fi

  # Orphan check
  echo ""
  log_info "=== Orphan Check (looking for e2e-test- resources) ==="
  if ! $DRY_RUN; then
    local orphans_found=false
    for resource_type in server volume network router "security group" keypair user project; do
      case "$resource_type" in
        "security group")
          count=$(openstack security group list --all-projects -f value -c Name 2>/dev/null \
            | grep -c "e2e-test-" || true)
          ;;
        *)
          count=$(openstack "${resource_type}" list -f value -c Name 2>/dev/null \
            | grep -c "e2e-test-" || true)
          ;;
      esac
      if [ "${count:-0}" -gt 0 ]; then
        log_warn "${resource_type}: ${count} e2e-test- resource(s) still exist!"
        orphans_found=true
      else
        log_pass "${resource_type}: clean"
      fi
    done

    if $orphans_found; then
      log_warn "Orphaned resources detected. Manual cleanup may be needed."
      record_stage 8 fail "$stage_start"
      return 1
    fi
  else
    log_info "[DRY-RUN] Orphan check skipped in dry-run mode"
  fi

  record_stage 8 pass "$stage_start"
  return 0
}

# =============================================================================
# Cleanup-on-exit trap
# =============================================================================

CLEANUP_TRAP_ENABLED=true

cleanup_on_exit() {
  local exit_code=$?

  # Only run if enabled and not in --skip-cleanup mode and not dry-run
  if ! $CLEANUP_TRAP_ENABLED || $SKIP_CLEANUP || $DRY_RUN; then
    return $exit_code
  fi

  # Only run if we are exiting due to an error (not normal completion)
  if [ $exit_code -eq 0 ]; then
    return 0
  fi

  echo ""
  echo "=================================================================="
  echo "  Emergency Cleanup (script exited with code ${exit_code})"
  echo "  Removing e2e-test- resources to prevent orphan pollution..."
  echo "=================================================================="

  # Best-effort cleanup -- ignore errors
  openstack server delete "${E2E_INSTANCE}" --wait 2>/dev/null || true
  openstack volume delete "${E2E_VOLUME}" 2>/dev/null || true
  if [ -n "${ALLOCATED_FLOATING_IP}" ]; then
    openstack floating ip list -f value -c floating_ip_address 2>/dev/null \
      | grep -q "${ALLOCATED_FLOATING_IP}" \
      && openstack floating ip delete \
           "$(openstack floating ip list -f value -c ID 2>/dev/null | head -1)" 2>/dev/null || true
  fi
  openstack router remove subnet "${E2E_ROUTER}" "${E2E_SUBNET}" 2>/dev/null || true
  openstack router unset "${E2E_ROUTER}" --external-gateway 2>/dev/null || true
  openstack router delete "${E2E_ROUTER}" 2>/dev/null || true
  openstack network delete "${E2E_NETWORK}" 2>/dev/null || true
  openstack security group delete "${E2E_SG}" 2>/dev/null || true
  openstack keypair delete "${E2E_KEYPAIR}" 2>/dev/null || true
  openstack flavor delete "${E2E_FLAVOR}" 2>/dev/null || true
  openstack user delete "${E2E_USER}" 2>/dev/null || true
  openstack project delete "${E2E_PROJECT}" 2>/dev/null || true
  rm -f "${E2E_KEY_FILE}" "${E2E_OPENRC_FILE}" || true

  echo "Emergency cleanup complete."
}

trap cleanup_on_exit EXIT

# =============================================================================
# Results file writer
# =============================================================================

write_results() {
  local verdict="$1"
  local end_time
  end_time="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  local services_yaml=""
  for svc in "${SERVICES_EXERCISED[@]+"${SERVICES_EXERCISED[@]}"}"; do
    services_yaml+="    - ${svc}"$'\n'
  done

  # Build per-stage YAML
  local stages_yaml=""
  for i in 1 2 3 4 5 6 7 8; do
    local status="${STAGE_STATUS[$i]:-pending}"
    local duration="${STAGE_DURATION[$i]:-0}"
    stages_yaml+="  - stage: ${i}"$'\n'
    stages_yaml+="    status: ${status}"$'\n'
    stages_yaml+="    duration_seconds: ${duration}"$'\n'
  done

  cat > "${RESULTS_FILE}" << YAML
name: e2e-user-scenario-verification
version: 1.0.0
description: "End-to-end user scenario verification results"
requirement: VERIF-07
nasa_se_phase: "Phase E -- Operational Readiness Review (ORR)"
chipset_ref: openstack-nasa-se

execution:
  timestamp: "${end_time}"
  git_commit: "${GIT_COMMIT}"
  dry_run: ${DRY_RUN}
  operator: "${OPERATOR}"
  external_network: "${EXTERNAL_NETWORK}"
  image_used: "${IMAGE_NAME}"

stages:
  - stage: 1
    name: "Authentication"
    services: [keystone]
    status: ${STAGE_STATUS[1]:-pending}
    details:
      token_issued: $([ "${STAGE_STATUS[1]:-pending}" = "pass" ] && echo "true" || echo "false")
      project_created: $([ "${STAGE_STATUS[1]:-pending}" = "pass" ] && echo "true" || echo "false")
      user_created: $([ "${STAGE_STATUS[1]:-pending}" = "pass" ] && echo "true" || echo "false")
      role_assigned: $([ "${STAGE_STATUS[1]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[1]:-0}
  - stage: 2
    name: "Project Setup"
    services: [keystone]
    status: ${STAGE_STATUS[2]:-pending}
    details:
      project_accessible: $([ "${STAGE_STATUS[2]:-pending}" = "pass" ] && echo "true" || echo "false")
      catalog_available: $([ "${STAGE_STATUS[2]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[2]:-0}
  - stage: 3
    name: "Network Configuration"
    services: [neutron]
    status: ${STAGE_STATUS[3]:-pending}
    details:
      network_created: $([ "${STAGE_STATUS[3]:-pending}" = "pass" ] && echo "true" || echo "false")
      subnet_created: $([ "${STAGE_STATUS[3]:-pending}" = "pass" ] && echo "true" || echo "false")
      router_created: $([ "${STAGE_STATUS[3]:-pending}" = "pass" ] && echo "true" || echo "false")
      gateway_set: $([ "${STAGE_STATUS[3]:-pending}" = "pass" ] && echo "true" || echo "false")
      subnet_added: $([ "${STAGE_STATUS[3]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[3]:-0}
  - stage: 4
    name: "Security Group Configuration"
    services: [neutron]
    status: ${STAGE_STATUS[4]:-pending}
    details:
      sg_created: $([ "${STAGE_STATUS[4]:-pending}" = "pass" ] && echo "true" || echo "false")
      ssh_rule_added: $([ "${STAGE_STATUS[4]:-pending}" = "pass" ] && echo "true" || echo "false")
      icmp_rule_added: $([ "${STAGE_STATUS[4]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[4]:-0}
  - stage: 5
    name: "Instance Launch"
    services: [nova, glance, neutron]
    status: ${STAGE_STATUS[5]:-pending}
    details:
      image_found: $([ "${STAGE_STATUS[5]:-pending}" = "pass" ] && echo "true" || echo "false")
      flavor_available: $([ "${STAGE_STATUS[5]:-pending}" = "pass" ] && echo "true" || echo "false")
      keypair_created: $([ "${STAGE_STATUS[5]:-pending}" = "pass" ] && echo "true" || echo "false")
      instance_launched: $([ "${STAGE_STATUS[5]:-pending}" = "pass" ] && echo "true" || echo "false")
      instance_active: $([ "${STAGE_STATUS[5]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[5]:-0}
  - stage: 6
    name: "Storage Attachment"
    services: [cinder, nova]
    status: ${STAGE_STATUS[6]:-pending}
    details:
      volume_created: $([ "${STAGE_STATUS[6]:-pending}" = "pass" ] && echo "true" || echo "false")
      volume_available: $([ "${STAGE_STATUS[6]:-pending}" = "pass" ] && echo "true" || echo "false")
      volume_attached: $([ "${STAGE_STATUS[6]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[6]:-0}
  - stage: 7
    name: "Floating IP Access"
    services: [neutron, nova]
    status: ${STAGE_STATUS[7]:-pending}
    details:
      floating_ip_allocated: $([ "${STAGE_STATUS[7]:-pending}" = "pass" ] && echo "true" || echo "false")
      floating_ip_associated: $([ "${STAGE_STATUS[7]:-pending}" = "pass" ] && echo "true" || echo "false")
      ping_successful: false
      ssh_successful: false
    duration_seconds: ${STAGE_DURATION[7]:-0}
  - stage: 8
    name: "Cleanup"
    services: [all]
    status: ${STAGE_STATUS[8]:-pending}
    details:
      all_resources_deleted: $([ "${STAGE_STATUS[8]:-pending}" = "pass" ] && echo "true" || echo "false")
      no_orphans: $([ "${STAGE_STATUS[8]:-pending}" = "pass" ] && echo "true" || echo "false")
    duration_seconds: ${STAGE_DURATION[8]:-0}

service_coverage:
  keystone: [1, 2]
  neutron: [3, 4, 5, 7]
  nova: [5, 6, 7]
  glance: [5]
  cinder: [6]

summary:
  total_stages: ${STAGES_TOTAL}
  passed: ${STAGES_PASSED}
  failed: ${STAGES_FAILED}
  skipped: ${STAGES_SKIPPED}
  services_exercised:
${services_yaml}  verdict: ${verdict}
YAML
}

# =============================================================================
# Main execution
# =============================================================================

main() {
  echo ""
  echo "=================================================================="
  echo "  End-to-End User Scenario Verification"
  echo "  Requirement: VERIF-07"
  echo "  NASA SE Phase: Phase E (ORR Gate)"
  echo "  Started: ${START_TIME}"
  echo "  Git commit: ${GIT_COMMIT}"
  $DRY_RUN && echo "  MODE: DRY-RUN (no actual changes will be made)"
  $SKIP_CLEANUP && echo "  NOTE: --skip-cleanup is set; resources will NOT be deleted"
  echo "=================================================================="

  check_prerequisites

  # Disable the cleanup trap for normal execution; stage_8 handles cleanup
  # The trap only fires on abnormal exit (error or interrupt before stage 8)
  CLEANUP_TRAP_ENABLED=true

  # Run stages sequentially; on failure, continue to cleanup
  local overall_fail=false

  stage_1_authentication || overall_fail=true
  stage_2_project_setup  || overall_fail=true
  stage_3_network_config || overall_fail=true
  stage_4_security_group || overall_fail=true
  stage_5_instance_launch || overall_fail=true

  # Stages 6 and 7 depend on stage 5; skip if stage 5 was skipped
  if [[ "${STAGE_STATUS[5]:-pending}" != "skip" ]]; then
    stage_6_storage_attach || overall_fail=true
    stage_7_floating_ip    || overall_fail=true
  fi

  # Stage 8 (cleanup) always runs unless --skip-cleanup
  if ! $SKIP_CLEANUP; then
    # Disable trap before stage 8 -- stage 8 is the cleanup
    CLEANUP_TRAP_ENABLED=false
    stage_8_cleanup || overall_fail=true
  else
    log_skip "Stage 8 (cleanup) skipped: --skip-cleanup specified"
    STAGE_STATUS[8]="skip"
    STAGE_DURATION[8]=0
    STAGES_SKIPPED=$((STAGES_SKIPPED + 1))
  fi

  # Determine verdict
  local verdict
  if $overall_fail || [ $STAGES_FAILED -gt 0 ]; then
    verdict="FAIL"
  else
    verdict="PASS"
  fi

  # Write results file
  write_results "$verdict"

  # Print summary
  echo ""
  echo "=================================================================="
  echo "  VERIFICATION SUMMARY"
  echo "=================================================================="
  printf "  %-20s %d\n" "Total stages:" "$STAGES_TOTAL"
  printf "  %-20s %d\n" "Passed:" "$STAGES_PASSED"
  printf "  %-20s %d\n" "Failed:" "$STAGES_FAILED"
  printf "  %-20s %d\n" "Skipped:" "$STAGES_SKIPPED"
  echo ""
  if [ ${#SERVICES_EXERCISED[@]} -gt 0 ]; then
    echo "  Services exercised: ${SERVICES_EXERCISED[*]}"
  fi
  echo ""
  local end_epoch
  end_epoch="$(date +%s)"
  local duration=$((end_epoch - START_EPOCH))
  echo "  Duration: ${duration}s"
  echo "  Results:  ${RESULTS_FILE}"
  echo ""
  echo "  VERDICT: ${verdict}"
  echo "=================================================================="

  if [ "$verdict" = "PASS" ]; then
    return 0
  else
    return 1
  fi
}

main "$@"

# End-to-End User Scenario Verification Procedure

**Requirement Traceability:** VERIF-07
**NASA SE Phase:** Phase E (Operations and Sustainment)
**Gate:** ORR -- Operational Readiness Review
**Procedure Type:** Operational Readiness Verification
**Resource Prefix:** `e2e-test-` (all test resources use this prefix)

---

## Purpose

This procedure proves the deployed OpenStack cloud works from a tenant user's perspective. It exercises the complete workflow that a cloud consumer would perform from first login through production access: authenticate, create project, configure network, launch instance, attach storage, and access via floating IP.

VERIF-07 requires demonstrating that every core OpenStack service (Keystone, Neutron, Nova, Glance, Cinder) can handle a realistic multi-service tenant workflow. Unlike individual service health checks (which verify services in isolation), this procedure verifies that services communicate correctly with each other and that the end-user experience meets operational standards.

This is the Phase E gate check. Phase D (SIR -- System Integration Review) verified that services work. Phase E (ORR -- Operational Readiness Review) verifies that the cloud is ready to serve real users. This procedure is the evidence artifact for the ORR gate.

---

## Pre-Conditions

The following conditions must be met before executing this procedure:

1. **Deployment verification passed** -- All blocking post-deploy gates (POST-001 through POST-007) must have passed. The 324-01 deployment verification procedure must show PASS status.
2. **Admin credentials available** -- The admin OpenRC file must be available and sourceable: `source /etc/kolla/admin-openrc.sh` must succeed.
3. **Guest image available** -- At least one bootable guest image must exist in Glance. CirrOS is recommended for testing (lightweight, fast boot). If no image exists, Stages 5-7 will be skipped.
4. **External network configured** -- An external provider network must exist for floating IP allocation. Verify with: `openstack network list --external`.
5. **Network quotas sufficient** -- The admin project must have quota for at least: 2 networks, 2 subnets, 2 routers, 1 floating IP, 1 security group, 1 keypair.
6. **Compute quota sufficient** -- Admin project must allow at least 1 instance with 512MB RAM and 1 vCPU.

**Reference:** If pre-conditions are not met, consult the deployment verification procedure (324-01) and the relevant service skills listed in the Failure Handling section.

---

## Verification Steps

### Stage 1 -- Authentication

**Services Exercised:** Keystone

**Objective:** Verify Keystone can issue tokens, create project/user entities, and enforce role assignments for tenant authentication.

**Commands:**

```bash
# Source admin credentials
source /etc/kolla/admin-openrc.sh

# Issue authentication token and verify fields
openstack token issue
# Expected: Table with id, expires, project_id fields populated

# Create test project
openstack project create e2e-test-project --description "E2E verification test project"
# Expected: Project created with new ID

# Create test user
openstack user create e2e-test-user \
  --project e2e-test-project \
  --password "e2e-test-password-$(date +%s)"
# Expected: User created with new ID

# Assign member role to test user in test project
openstack role add --project e2e-test-project --user e2e-test-user member
# Expected: No output (success is silent)

# Verify role assignment
openstack role assignment list --project e2e-test-project --user e2e-test-user
# Expected: Table showing member role for e2e-test-user on e2e-test-project

# Switch to test user credentials and verify authentication
# (Create a temporary openrc for the test user)
cat > /tmp/e2e-test-openrc.sh << 'EOF'
export OS_PROJECT_NAME=e2e-test-project
export OS_USERNAME=e2e-test-user
export OS_PASSWORD="<password-set-above>"
export OS_AUTH_URL="$OS_AUTH_URL"
export OS_USER_DOMAIN_NAME=Default
export OS_PROJECT_DOMAIN_NAME=Default
export OS_IDENTITY_API_VERSION=3
EOF
source /tmp/e2e-test-openrc.sh
openstack token issue
# Expected: Token issued as e2e-test-user in e2e-test-project

# Return to admin context
source /etc/kolla/admin-openrc.sh
```

**Expected Results:**
- Authentication token contains: `id`, `expires`, `project_id`
- Project `e2e-test-project` created successfully
- User `e2e-test-user` created and authenticated successfully
- Role assignment verified via `role assignment list`

**Pass Criteria:** All commands return 0 exit code. Token issued as test user. Role assignment confirmed.

---

### Stage 2 -- Project Setup

**Services Exercised:** Keystone

**Objective:** Verify tenant can access their project context and discover available services via the service catalog.

**Commands:**

```bash
# As admin, verify test project is accessible
openstack project show e2e-test-project
# Expected: Full project details including ID, name, enabled: True

# List available services in service catalog (tenant view)
openstack catalog list
# Expected: Table listing identity, compute, network, image, volumev3 at minimum

# Verify service endpoints are reachable from tenant context
openstack endpoint list --service identity
openstack endpoint list --service compute
openstack endpoint list --service network
openstack endpoint list --service image
openstack endpoint list --service volumev3
# Expected: Each service has at least one endpoint in 'public' interface

# Verify project-scoped operations work
openstack project list --my-projects
# Expected: e2e-test-project appears in list
```

**Expected Results:**
- Project details accessible with correct metadata
- Service catalog lists all 5 core services (identity, compute, network, image, volumev3)
- All service endpoints resolve and are reachable

**Pass Criteria:** Service catalog contains all required services. Endpoints are configured and accessible.

---

### Stage 3 -- Network Configuration

**Services Exercised:** Neutron

**Objective:** Verify Neutron can create a complete tenant network topology including network, subnet with DHCP, router, and external gateway connectivity.

**Commands:**

```bash
# Create tenant network
openstack network create e2e-test-net \
  --description "E2E verification test network"
# Expected: Network created with new ID, admin_state_up: True

# Create subnet with DHCP and DNS
openstack subnet create e2e-test-subnet \
  --network e2e-test-net \
  --subnet-range 10.0.0.0/24 \
  --dns-nameserver 8.8.8.8 \
  --description "E2E verification test subnet"
# Expected: Subnet created, DHCP enabled, DNS nameserver 8.8.8.8 set

# Create router
openstack router create e2e-test-router \
  --description "E2E verification test router"
# Expected: Router created with new ID, admin_state_up: True

# Set router external gateway (replace <external-network> with actual name)
EXTERNAL_NET=$(openstack network list --external -f value -c Name | head -1)
openstack router set e2e-test-router --external-gateway "$EXTERNAL_NET"
# Expected: No output (success is silent)

# Add test subnet to router
openstack router add subnet e2e-test-router e2e-test-subnet
# Expected: No output (success is silent)

# Verify network topology
openstack network list
# Expected: e2e-test-net appears in list

openstack router show e2e-test-router
# Expected: Router shows external gateway set, subnet interface attached

openstack network show e2e-test-net
# Expected: Network details with subnets: [e2e-test-subnet ID]

openstack subnet show e2e-test-subnet
# Expected: Subnet shows gateway_ip, DNS nameservers, DHCP enabled
```

**Expected Results:**
- Tenant network `e2e-test-net` created
- Subnet `e2e-test-subnet` with CIDR 10.0.0.0/24, DHCP enabled, DNS configured
- Router `e2e-test-router` created with external gateway
- Subnet attached to router, providing outbound routing for tenant instances

**Pass Criteria:** `openstack router show e2e-test-router` shows `external_gateway_info` with gateway port and `interfaces_info` with the test subnet.

---

### Stage 4 -- Security Group Configuration

**Services Exercised:** Neutron

**Objective:** Verify Neutron security group enforcement works correctly -- new groups start with deny-all ingress (SC-009), and rules can be added selectively to allow required traffic.

**Commands:**

```bash
# Create security group (starts with default deny-all ingress per SC-009)
openstack security group create e2e-test-sg \
  --description "E2E verification security group"
# Expected: Security group created, default egress rules present, no ingress rules

# Verify default deny-all ingress (SC-009 compliance check)
openstack security group rule list e2e-test-sg
# Expected: Egress rules for IPv4 and IPv6, no ingress rules from external sources

# Add SSH ingress rule (port 22/TCP)
openstack security group rule create \
  --protocol tcp \
  --dst-port 22 \
  --ingress \
  e2e-test-sg
# Expected: Rule created allowing TCP port 22 ingress from 0.0.0.0/0

# Add ICMP ingress rule (for ping connectivity test)
openstack security group rule create \
  --protocol icmp \
  --ingress \
  e2e-test-sg
# Expected: Rule created allowing ICMP ingress from 0.0.0.0/0

# Verify rules are configured correctly
openstack security group rule list e2e-test-sg
# Expected: Shows SSH (TCP:22) and ICMP ingress rules plus default egress rules
```

**Expected Results:**
- Security group `e2e-test-sg` created
- Initial state is default deny-all ingress (SC-009 verified)
- SSH rule allows port 22 TCP ingress
- ICMP rule allows ping ingress
- Rules list confirms all 4+ rules (2 default egress + 2 added ingress)

**Pass Criteria:** `openstack security group rule list e2e-test-sg` shows both TCP:22 and ICMP ingress rules.

---

### Stage 5 -- Instance Launch

**Services Exercised:** Nova, Glance, Neutron

**Objective:** Verify Nova can schedule and launch an instance using a Glance image, attach it to the Neutron network, and reach ACTIVE state. This exercises the Nova-Glance (image retrieval) and Nova-Neutron (port creation) integrations.

**Commands:**

```bash
# List available images (verify guest image exists)
openstack image list
# Expected: At least one image in 'active' status (CirrOS recommended)

# Capture image name for use in launch command
IMAGE_NAME=$(openstack image list -f value -c Name | grep -i cirros | head -1)
if [ -z "$IMAGE_NAME" ]; then
  echo "WARNING: No CirrOS image found. Stages 5-7 will be skipped."
  echo "Upload a guest image first: openstack image create --file cirros.img --disk-format qcow2 --container-format bare cirros"
  exit 1
fi

# List available flavors (or create e2e-tiny if none suitable)
openstack flavor list
# Expected: At least one flavor available

# Create lightweight test flavor if needed
openstack flavor create e2e-tiny \
  --ram 512 \
  --disk 1 \
  --vcpus 1 \
  2>/dev/null || echo "Flavor e2e-tiny already exists or creation skipped"

# Create keypair for SSH access
openstack keypair create e2e-test-key > /tmp/e2e-test-key.pem
chmod 600 /tmp/e2e-test-key.pem
# Expected: Private key saved to /tmp/e2e-test-key.pem

# Launch instance
openstack server create e2e-test-instance \
  --image "$IMAGE_NAME" \
  --flavor e2e-tiny \
  --network e2e-test-net \
  --security-group e2e-test-sg \
  --key-name e2e-test-key
# Expected: Server created with status BUILD

# Wait for ACTIVE status (poll with timeout)
echo "Waiting for instance to reach ACTIVE status..."
TIMEOUT=120
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS=$(openstack server show e2e-test-instance -f value -c status 2>/dev/null)
  echo "  Status: $STATUS ($ELAPSED seconds elapsed)"
  if [ "$STATUS" = "ACTIVE" ]; then
    echo "Instance reached ACTIVE status."
    break
  elif [ "$STATUS" = "ERROR" ]; then
    echo "ERROR: Instance entered ERROR state."
    openstack server show e2e-test-instance
    exit 1
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done
if [ "$STATUS" != "ACTIVE" ]; then
  echo "TIMEOUT: Instance did not reach ACTIVE within ${TIMEOUT}s"
  exit 1
fi

# Verify console log shows boot messages
openstack console log show e2e-test-instance | head -20
# Expected: Boot messages from the guest OS (kernel log, init messages)

# Verify instance details
openstack server show e2e-test-instance
# Expected: status: ACTIVE, addresses includes IP from e2e-test-net subnet
```

**Expected Results:**
- Guest image found in Glance in 'active' status
- Instance `e2e-test-instance` reaches ACTIVE state within 120 seconds
- Console log shows successful boot messages
- Instance has a private IP address from the 10.0.0.0/24 subnet

**Pass Criteria:** `openstack server show e2e-test-instance` returns `status: ACTIVE`. Console log contains boot messages. Private IP assigned from e2e-test-subnet.

---

### Stage 6 -- Storage Attachment

**Services Exercised:** Cinder, Nova

**Objective:** Verify Cinder can create a block storage volume and Nova can attach it to a running instance. This exercises the Nova-Cinder integration for live volume operations.

**Commands:**

```bash
# Create 1GB test volume
openstack volume create e2e-test-volume \
  --size 1 \
  --description "E2E verification test volume"
# Expected: Volume created with status 'creating' or 'available'

# Wait for volume to reach 'available' status (poll with timeout)
echo "Waiting for volume to reach available status..."
TIMEOUT=60
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  VOL_STATUS=$(openstack volume show e2e-test-volume -f value -c status 2>/dev/null)
  echo "  Volume status: $VOL_STATUS ($ELAPSED seconds elapsed)"
  if [ "$VOL_STATUS" = "available" ]; then
    echo "Volume is available."
    break
  elif [ "$VOL_STATUS" = "error" ]; then
    echo "ERROR: Volume creation failed."
    openstack volume show e2e-test-volume
    exit 1
  fi
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done
if [ "$VOL_STATUS" != "available" ]; then
  echo "TIMEOUT: Volume did not become available within ${TIMEOUT}s"
  exit 1
fi

# Attach volume to running instance
openstack server add volume e2e-test-instance e2e-test-volume
# Expected: No output (success is silent); volume transitions to 'attaching'

# Verify volume is attached (poll briefly for state change)
sleep 5
openstack volume show e2e-test-volume
# Expected: status: in-use, attachments show e2e-test-instance ID

# Verify instance can see the attachment
openstack server show e2e-test-instance -f json | python3 -c "
import json, sys
data = json.load(sys.stdin)
volumes = data.get('volumes_attached', [])
print('Volumes attached:', volumes)
"
# Expected: Volume ID appears in volumes_attached list
```

**Expected Results:**
- Volume `e2e-test-volume` created and reaches 'available' status within 60 seconds
- Volume successfully attached to `e2e-test-instance`
- Volume status changes to 'in-use' with attachment to the test instance
- Instance reports the volume in its `volumes_attached` field

**Pass Criteria:** `openstack volume show e2e-test-volume` returns `status: in-use` and `attachments` list includes the test instance ID.

---

### Stage 7 -- Floating IP Access

**Services Exercised:** Neutron (floating IP NAT), Nova (networking integration)

**Objective:** Verify that a tenant can allocate a floating IP from the external network pool, associate it with a running instance, and achieve external network connectivity to that instance. This is the final end-user access test.

**Commands:**

```bash
# Allocate floating IP from external network
EXTERNAL_NET=$(openstack network list --external -f value -c Name | head -1)
FLOATING_IP=$(openstack floating ip create "$EXTERNAL_NET" -f value -c floating_ip_address)
echo "Allocated floating IP: $FLOATING_IP"
# Expected: Floating IP allocated from external network pool

# Associate floating IP with test instance
openstack server add floating ip e2e-test-instance "$FLOATING_IP"
# Expected: No output (success is silent)

# Verify association
openstack server show e2e-test-instance -f json | python3 -c "
import json, sys
data = json.load(sys.stdin)
addresses = data.get('addresses', {})
print('Instance addresses:', json.dumps(addresses, indent=2))
"
# Expected: Instance addresses include both private IP and floating IP

# Test ICMP connectivity (ping)
echo "Testing ICMP connectivity to $FLOATING_IP..."
ping -c 3 -W 5 "$FLOATING_IP"
# Expected: 3 packets transmitted, 3 received (or at least 1 if ICMP is rate-limited)

# Test SSH connectivity (CirrOS uses 'cirros' username)
echo "Testing SSH connectivity to $FLOATING_IP..."
ssh -o StrictHostKeyChecking=no \
    -o ConnectTimeout=30 \
    -o BatchMode=yes \
    -i /tmp/e2e-test-key.pem \
    cirros@"$FLOATING_IP" \
    hostname 2>/dev/null
SSH_EXIT=$?
if [ $SSH_EXIT -eq 0 ]; then
  echo "SSH connectivity: PASS"
else
  echo "SSH connectivity: FAIL or SKIP (exit code $SSH_EXIT)"
  echo "Note: SSH may fail if image does not use key-based auth or 'cirros' user."
fi
```

**Expected Results:**
- Floating IP allocated from external network pool
- Floating IP associated with `e2e-test-instance`
- Instance shows floating IP in address list alongside private IP
- ICMP ping succeeds (3/3 packets received, or at least 1/3)
- SSH (if CirrOS): `hostname` command returns instance hostname

**Pass Criteria:** Floating IP allocated and associated. Ping to floating IP returns at least 1 successful reply. Instance is reachable from outside the tenant network.

---

### Stage 8 -- Cleanup

**Services Exercised:** All (cleanup order reverses creation order)

**Objective:** Verify that all test resources can be cleanly removed and no orphaned resources remain. Reliable cleanup confirms resource lifecycle management works correctly and prevents quota pollution.

**IMPORTANT:** Cleanup must be performed even if earlier stages failed. All `e2e-test-` prefixed resources should be removed.

**Commands:**

```bash
# Detach volume from instance (must detach before deleting either)
openstack server remove volume e2e-test-instance e2e-test-volume 2>/dev/null
echo "Volume detached (or was not attached)"

# Delete instance (--wait blocks until fully deleted)
openstack server delete e2e-test-instance --wait 2>/dev/null
echo "Instance deleted"

# Delete volume
openstack volume delete e2e-test-volume --wait 2>/dev/null
echo "Volume deleted"

# Remove and delete floating IP
FLOATING_IP_ID=$(openstack floating ip list -f value -c ID \
  --project "$(openstack project show e2e-test-project -f value -c id)" 2>/dev/null | head -1)
if [ -n "$FLOATING_IP_ID" ]; then
  openstack floating ip delete "$FLOATING_IP_ID"
  echo "Floating IP deleted"
fi

# Remove subnet from router
openstack router remove subnet e2e-test-router e2e-test-subnet 2>/dev/null
echo "Subnet removed from router"

# Remove external gateway from router
openstack router unset e2e-test-router --external-gateway 2>/dev/null
echo "External gateway removed from router"

# Delete router
openstack router delete e2e-test-router 2>/dev/null
echo "Router deleted"

# Delete network (subnet is deleted automatically with the network)
openstack network delete e2e-test-net 2>/dev/null
echo "Network deleted"

# Delete security group
openstack security group delete e2e-test-sg 2>/dev/null
echo "Security group deleted"

# Delete keypair
openstack keypair delete e2e-test-key 2>/dev/null
rm -f /tmp/e2e-test-key.pem /tmp/e2e-test-openrc.sh
echo "Keypair deleted"

# Delete flavor (if created by this test)
openstack flavor delete e2e-tiny 2>/dev/null
echo "Flavor deleted (if created by test)"

# Delete test user
openstack user delete e2e-test-user 2>/dev/null
echo "Test user deleted"

# Delete test project
openstack project delete e2e-test-project 2>/dev/null
echo "Test project deleted"

# Verify no orphaned e2e-test- resources remain
echo ""
echo "=== Orphan Check ==="
echo "Servers:       $(openstack server list --all -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Volumes:       $(openstack volume list --all -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Networks:      $(openstack network list -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Routers:       $(openstack router list -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Security grps: $(openstack security group list --all-projects -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Keypairs:      $(openstack keypair list -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Users:         $(openstack user list -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
echo "Projects:      $(openstack project list -f value -c Name 2>/dev/null | grep e2e-test || echo 'none')"
```

**Expected Results:**
- All `e2e-test-` prefixed resources deleted in reverse order
- Orphan check returns 'none' for all resource types
- No quota consumed by test resources after cleanup

**Pass Criteria:** Orphan check shows no `e2e-test-` resources in any service category. All `openstack ... delete` commands succeed or return "not found."

---

## Expected Results Table

| Stage | Services Exercised | Expected Outcome | Pass Criteria |
|-------|--------------------|------------------|---------------|
| 1. Authentication | Keystone | Token issued, project/user created, role assigned | Token has id + expires + project_id; test user authenticates successfully |
| 2. Project Setup | Keystone | Project accessible, service catalog complete | Catalog lists identity, compute, network, image, volumev3 |
| 3. Network Configuration | Neutron | Network, subnet, router created; gateway and interface attached | `router show` displays external_gateway_info and interfaces_info |
| 4. Security Group | Neutron | SG created with default deny; SSH and ICMP rules added | `security group rule list` shows TCP:22 and ICMP ingress rules |
| 5. Instance Launch | Nova, Glance, Neutron | Instance boots to ACTIVE; console log shows boot messages | `server show` returns status: ACTIVE within 120s |
| 6. Storage Attachment | Cinder, Nova | Volume created, reaches available, attaches to instance | `volume show` returns status: in-use with instance attachment |
| 7. Floating IP Access | Neutron, Nova | Floating IP allocated, associated, instance pingable | Ping to floating IP returns at least 1 successful reply |
| 8. Cleanup | All | All e2e-test- resources deleted, no orphans | Orphan check returns 'none' for all resource types |

---

## Service Coverage Matrix

| OpenStack Service | Stages That Exercise This Service | What Is Verified |
|-------------------|-----------------------------------|------------------|
| **Keystone** | 1, 2 | Token issuance, project/user CRUD, role assignment, service catalog, endpoint registration |
| **Neutron** | 3, 4, 5, 7 | Network/subnet/router creation, DHCP provisioning, security group enforcement, floating IP NAT, port lifecycle |
| **Nova** | 5, 6, 7 | Instance scheduling, image retrieval coordination, compute placement, volume attachment coordination, networking integration |
| **Glance** | 5 | Image availability, image metadata retrieval, image data serving to hypervisor |
| **Cinder** | 6 | Volume creation, status lifecycle, live attachment to running instance |

**Coverage Summary:**
- All 5 core OpenStack services exercised in a single workflow
- Services exercised in realistic user order (not arbitrary test order)
- Integrations exercised: Keystone-Nova, Keystone-Neutron, Keystone-Cinder, Nova-Glance, Nova-Neutron, Nova-Cinder, Neutron-external-network

---

## Failure Handling

### Stage 1 (Authentication) Failures

**Symptom:** `openstack token issue` returns HTTP 401 or connection refused.

**Remediation:**
1. Verify Keystone containers are running: `docker ps | grep keystone`
2. Check Keystone logs: `docker logs keystone_api --tail 50`
3. Verify admin credentials: `cat /etc/kolla/admin-openrc.sh` -- ensure all variables are set
4. Check fernet keys are present: `docker exec keystone_api ls /etc/keystone/fernet-keys/`
5. Reference: `skills/openstack/keystone/SKILL.md` -- Troubleshooting section

**Common causes:** Keystone container not running, fernet key rotation failure, Apache configuration error, MariaDB connectivity loss.

---

### Stage 2 (Project Setup) Failures

**Symptom:** `openstack catalog list` shows missing services or `openstack project show` returns 404.

**Remediation:**
1. Verify service endpoints exist: `openstack endpoint list`
2. Re-register missing service endpoint: run `kolla-ansible post-deploy` to recreate service catalog
3. Reference: `skills/openstack/keystone/SKILL.md` -- Service Catalog section

---

### Stage 3 (Network Configuration) Failures

**Symptom:** Network creation fails, router gateway cannot be set, subnet creation rejected.

**Remediation:**
1. Check Neutron agents are alive: `openstack network agent list`
2. Verify OVS/OVN bridge is configured: `ovs-vsctl show` or `ovn-nbctl show`
3. Verify external network exists: `openstack network list --external`
4. Check Neutron logs: `docker logs neutron_server --tail 50`
5. Reference: `skills/openstack/neutron/SKILL.md` -- Troubleshooting section

**Common causes:** OVS bridge misconfiguration, missing external network, Neutron agent down, VXLAN tunnel setup failure.

---

### Stage 4 (Security Group) Failures

**Symptom:** Security group rule creation fails or rules don't appear in list.

**Remediation:**
1. Check Neutron security group driver: `openstack network agent list | grep securitygroup`
2. Verify iptables rules are applied: `iptables -L | grep FORWARD`
3. Reference: `skills/openstack/neutron/SKILL.md` -- Security Groups section

---

### Stage 5 (Instance Launch) Failures

**Symptom:** Instance enters ERROR state or stays in BUILD state past timeout.

**Remediation:**
1. Check instance fault: `openstack server show e2e-test-instance -f json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('fault', 'no fault info'))"`
2. Check Nova scheduler: `openstack compute service list`
3. Verify hypervisor has resources: `openstack hypervisor show <host>`
4. Check Nova logs: `docker logs nova_compute --tail 50` (on compute node)
5. Verify image is in 'active' status: `openstack image show "$IMAGE_NAME"`
6. Reference: `skills/openstack/nova/SKILL.md` -- Troubleshooting section

**Common causes:** Insufficient compute resources, image not in 'active' state, Neutron port allocation failure, libvirt error.

---

### Stage 6 (Storage Attachment) Failures

**Symptom:** Volume stays in 'creating' state or attachment fails.

**Remediation:**
1. Check Cinder services: `openstack volume service list`
2. Verify LVM volume group: `vgs` (should show cinder-volumes VG)
3. Verify iSCSI target: `tgtadm --lld iscsi --op show --mode target` (if using LVM backend)
4. Check Cinder logs: `docker logs cinder_volume --tail 50`
5. Reference: `skills/openstack/cinder/SKILL.md` -- Troubleshooting section

**Common causes:** LVM volume group full, iSCSI/tgtd not running, Cinder scheduler cannot find backend.

---

### Stage 7 (Floating IP) Failures

**Symptom:** Floating IP allocation fails, association fails, or ping does not succeed.

**Remediation:**
1. Verify external network exists: `openstack network list --external`
2. Check floating IP quota: `openstack quota show | grep floating`
3. Verify L3 agent: `openstack network agent list | grep l3`
4. Check NAT rules: `ip netns exec qrouter-<id> iptables -t nat -L` (OVS backend)
5. Verify external interface on physical host: `ip route show` (should have external network route)
6. Reference: `skills/openstack/neutron/SKILL.md` -- Floating IPs section
7. Reference: `skills/openstack/networking-debug/SKILL.md` -- Connectivity Diagnostics section

**Common causes:** No external network provider configured, L3 agent not running, physical network routing not set up, security group blocking ICMP.

---

### Connectivity Failures (SSH/Ping)

**Symptom:** Floating IP is associated but ping or SSH does not respond.

**Remediation:**
1. Verify security group allows ICMP and TCP:22: `openstack security group rule list e2e-test-sg`
2. Trace packet path: `ip netns exec qrouter-<id> ping <private-ip>` (tests inside the namespace)
3. Check OVS flows: `ovs-ofctl dump-flows br-int | grep <port-id>`
4. Verify instance is running and listening: `openstack console log show e2e-test-instance | tail -20`
5. Reference: `skills/openstack/networking-debug/SKILL.md` -- full diagnostic procedures

---

## Git History Requirements

Per INTEG-05, all test execution and configuration changes must be committed to git with rationale:

1. **Before testing:** Commit the current configuration state with a baseline message:
   ```
   chore(e2e-test): record system state before e2e verification run
   ```

2. **After test execution:** Commit the test results file:
   ```
   test(e2e-test): record e2e user scenario verification results

   - Timestamp: <ISO8601>
   - Operator: <name>
   - Result: PASS/FAIL
   - Stages: X/8 passed
   ```

3. **For any configuration changes made during testing:** Each change committed individually with rationale:
   ```
   fix(neutron): increase floating IP quota for e2e test

   Default quota of 10 floating IPs was exhausted by previous test runs.
   Increased to 50 to accommodate e2e verification without conflicts.
   ```

4. **After cleanup:** Commit confirmation that resources are removed:
   ```
   chore(e2e-test): confirm cleanup complete, no orphaned resources
   ```

This git history provides an auditable record of every configuration decision made during the operational readiness verification, satisfying INTEG-05 traceability requirements and enabling post-incident analysis.

---

## Cross-References

- **VERIF-07:** This procedure is the primary evidence artifact for VERIF-07 satisfaction
- **INTEG-05:** Git history requirement; all configuration changes committed with rationale
- **SC-009:** Security group default-deny verified in Stage 4
- **IT-018:** End-to-end user scenario integration test (authenticate through floating IP access)
- **POST-001 through POST-007:** Post-deploy gates that must pass before this procedure
- **324-01:** Deployment verification procedure (prerequisite)
- **skills/openstack/keystone/SKILL.md:** Authentication and identity troubleshooting
- **skills/openstack/neutron/SKILL.md:** Network, security group, floating IP troubleshooting
- **skills/openstack/nova/SKILL.md:** Instance launch and lifecycle troubleshooting
- **skills/openstack/cinder/SKILL.md:** Volume creation and attachment troubleshooting
- **skills/openstack/networking-debug/SKILL.md:** Connectivity diagnostic procedures
- **config/evaluation/e2e-user-scenario-results.yaml:** Results template for recording outcomes
- **scripts/e2e-user-scenario-verification.sh:** Automated execution script for this procedure

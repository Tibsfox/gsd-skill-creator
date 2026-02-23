# Chapter 4: Final Design and Fabrication -- Building It

> **SE Phase:** Phase C | **SP-6105 SS 5.1** | **NPR 7123.1 SS 5.1** | **Review Gate:** CDR (Critical Design Review / Pre-Deployment Review)

Phase C is where design becomes implementation. In NASA's SE lifecycle, this is the phase where flight hardware is fabricated from approved drawings. In cloud operations, this is where Kolla-Ansible configurations are finalized, certificates are generated, networks are wired, and storage backends are prepared. Every configuration decision made here traces back to a trade study from Phase B (SP-6105 SS 4.4) and forward to a verification method in Phase D (SP-6105 SS 5.3).

The discipline of Phase C is configuration management. Per SP-6105 SS 6.5, every configuration change is version-controlled, every decision is documented with rationale, and every baseline change follows a change control process. In cloud operations, this means git commits with messages that explain *why*, not just *what*.

---

## 4.1 Kolla-Ansible Configuration

Kolla-Ansible is the deployment engine selected during Phase A trade studies. It deploys OpenStack services as Docker containers, providing isolation, reproducibility, and clean upgrade paths. The configuration is split across three primary artifacts: `globals.yml`, the inventory file, and service-specific configuration overrides.

### 4.1.1 globals.yml -- The Master Configuration

`globals.yml` is the single most important configuration file in a Kolla-Ansible deployment. It controls deployment-wide settings that affect every service. Per SP-6105 SS 4.4, each setting represents a design decision that should be preceded by a trade study.

**Base Operating System and Container Strategy:**

```yaml
kolla_base_distro: "centos"
kolla_install_type: "source"
```

- **Base distro selection (CentOS Stream 9):** CentOS Stream 9 provides the enterprise Linux foundation with long-term support. The trade study (Phase B) evaluated CentOS vs Ubuntu vs Rocky Linux. CentOS was selected for its upstream RHEL relationship and broad OpenStack community testing. Per SP-6105 SS 4.4, this decision is documented with alternatives considered and rationale.
- **Install type (source):** Source builds compile OpenStack from git repositories, providing the latest patches and the ability to apply custom modifications. The alternative (binary) uses pre-built packages that are simpler but less flexible. For a lab environment focused on learning and experimentation, source provides deeper visibility into the system.

**Network Interface Configuration:**

```yaml
network_interface: "eth0"
neutron_external_interface: "eth1"
kolla_internal_vip_address: "10.0.0.254"
```

- **Management interface (`eth0`):** Carries API traffic, database replication, message queue communication, and inter-service communication. This is the control plane.
- **External interface (`eth1`):** Dedicated to Neutron for provider network access and floating IP connectivity. Separating external traffic from management traffic follows NASA's interface management principles (SP-6105 SS 6.3) -- distinct interfaces for distinct functions.
- **Virtual IP address:** The internal VIP provides a stable endpoint for all API services. Even on a single-node deployment, configuring a VIP establishes the pattern for future multi-node expansion.

**TLS and Security Settings:**

```yaml
kolla_enable_tls_internal: "yes"
kolla_enable_tls_external: "yes"
kolla_copy_ca_into_containers: "yes"
```

- **TLS everywhere:** All API endpoints are encrypted. This is not optional -- SP-6105 SS 6.4 (Technical Risk Management) identifies unencrypted API traffic as a security risk that must be mitigated. Self-signed certificates are acceptable for a lab environment; the infrastructure supports replacement with CA-signed certificates for production.

**Service Enablement:**

```yaml
enable_cinder: "yes"
enable_cinder_backend_lvm: "yes"
enable_heat: "yes"
enable_horizon: "yes"
enable_neutron_provider_networks: "yes"
enable_swift: "yes"
enable_swift_s3api: "yes"
```

- Each service enablement traces to a requirement from the Cloud Requirements Document (Phase A). Services not required by any stakeholder need are not enabled -- this follows the engineering principle of minimum necessary complexity per NPR 7123.1 SS 5.1.

**Docker Registry Configuration:**

```yaml
docker_registry: "quay.io"
docker_namespace: "openstack.kolla"
```

- The container registry source determines image provenance. Using the official Kolla images from quay.io ensures images are built from tested source trees. Per SP-6105 SS 5.1 (Product Implementation), vendor technical information must be reviewed -- this means verifying that container image versions match the target OpenStack release.

### 4.1.2 Inventory File -- Single-Node Topology

The inventory file defines which hosts run which OpenStack roles. For a single-node deployment, all roles are assigned to localhost:

```ini
[control]
localhost ansible_connection=local

[network]
localhost ansible_connection=local

[compute]
localhost ansible_connection=local

[monitoring]
localhost ansible_connection=local

[storage]
localhost ansible_connection=local

[deployment]
localhost ansible_connection=local
```

**Design rationale:** An all-in-one single-node configuration consolidates all OpenStack roles onto a single host. This is appropriate for the lab environment defined in Phase A. The inventory structure follows Kolla-Ansible's standard group naming, which allows future expansion to multi-node by simply adding hosts to the appropriate groups without restructuring.

The `ansible_connection=local` directive eliminates SSH overhead for single-node deployments, reducing deployment time and complexity. Per SP-6105 SS 5.1, implementation should use the simplest mechanism that satisfies requirements.

### 4.1.3 Service-Specific Configuration Overrides

Kolla-Ansible provides a mechanism for per-service configuration overrides through files placed in `/etc/kolla/config/`. These overrides take precedence over Kolla-Ansible defaults and allow fine-tuning without modifying the deployment engine itself.

**Nova Configuration (`/etc/kolla/config/nova.conf`):**

```ini
[DEFAULT]
cpu_allocation_ratio = 16.0
ram_allocation_ratio = 1.5
disk_allocation_ratio = 1.0

[libvirt]
virt_type = kvm
cpu_mode = host-passthrough
```

- **Allocation ratios:** CPU overcommit of 16:1 is the OpenStack default, suitable for mixed workloads. RAM overcommit of 1.5:1 allows moderate oversubscription while maintaining stability. Disk overcommit is disabled (1.0) to prevent storage exhaustion. These ratios trace to capacity requirements from Phase A.
- **Virtualization type:** KVM provides full hardware virtualization with near-native performance. The `host-passthrough` CPU mode exposes the host CPU model directly to guests, enabling optimal instruction set utilization. Per SP-6105 SS 4.4, the trade study evaluated KVM vs QEMU (emulation only) -- KVM was selected for performance on hardware that supports VT-x/AMD-V.

**Neutron ML2 Configuration (`/etc/kolla/config/neutron/ml2_conf.ini`):**

```ini
[ml2]
type_drivers = flat,vlan,vxlan
tenant_network_types = vxlan
mechanism_drivers = openvswitch,l2population

[ml2_type_vxlan]
vni_ranges = 1:1000

[ml2_type_flat]
flat_networks = physnet1

[ml2_type_vlan]
network_vlan_ranges = physnet1:1:4094
```

- **Type drivers:** Supporting flat, VLAN, and VXLAN provides maximum flexibility. VXLAN is the default for tenant networks because it scales beyond the 4094 VLAN limit and operates as an overlay, independent of physical switch configuration.
- **Mechanism driver (OVS with L2 population):** Open vSwitch provides the data plane for virtual networking. L2 population reduces broadcast traffic by distributing forwarding information directly rather than relying on flooding. This design decision traces to the network design from Phase B.

**Cinder Configuration (`/etc/kolla/config/cinder.conf`):**

```ini
[DEFAULT]
enabled_backends = lvm-1

[lvm-1]
volume_driver = cinder.volume.drivers.lvm.LVMVolumeDriver
volume_group = cinder-volumes
target_protocol = iscsi
target_helper = lioadm
volume_backend_name = lvm-1
```

- **LVM backend:** For a single-node deployment, LVM (Logical Volume Manager) provides block storage without the complexity of distributed storage systems like Ceph. The trade study from Phase B evaluated LVM vs Ceph vs NFS -- LVM was selected because it requires no additional infrastructure and provides adequate performance for lab workloads. Per SP-6105 SS 4.4, this decision is documented with the understanding that Ceph migration is a v2.0 scope item.

---

## 4.2 Certificate Generation and Deployment

TLS certificates protect API communication between services and between clients and the cloud. Per SP-6105 SS 6.4 (Technical Risk Management), encrypted communication is a mandatory risk mitigation for any system handling authentication credentials.

### 4.2.1 Certificate Requirements

Each OpenStack API endpoint requires:
- A server certificate with the service endpoint hostname in the Subject Alternative Name (SAN)
- A private key (RSA 2048-bit minimum, 4096-bit recommended)
- A CA certificate chain for trust validation

For a lab environment, self-signed certificates generated by Kolla-Ansible's built-in certificate generation tool are acceptable. The certificate infrastructure supports later replacement with externally-signed certificates per NPR 7123.1 SS 5.1.

### 4.2.2 Generating Self-Signed Certificates

Kolla-Ansible provides a certificate generation utility:

```bash
kolla-ansible certificates
```

This command generates:
- A self-signed CA certificate and key
- Server certificates for each enabled service endpoint
- HAProxy frontend certificates (if HAProxy is the load balancer)

The generated certificates are placed in `/etc/kolla/certificates/`:

```
/etc/kolla/certificates/
  ca/
    root.crt              # CA certificate
  haproxy.pem             # Combined cert+key for HAProxy
  haproxy-internal.pem    # Internal endpoint certificate
```

### 4.2.3 Certificate Deployment Paths

Kolla-Ansible deploys certificates into containers at build time. The CA certificate is copied into each container's trust store (per `kolla_copy_ca_into_containers: "yes"` in globals.yml), ensuring all services trust the self-signed CA.

**Verification after generation:**

```bash
# Verify certificate validity
openssl x509 -in /etc/kolla/certificates/ca/root.crt -text -noout

# Verify certificate chain
openssl verify -CAfile /etc/kolla/certificates/ca/root.crt \
  /etc/kolla/certificates/haproxy.pem

# Check certificate expiration
openssl x509 -in /etc/kolla/certificates/haproxy.pem -enddate -noout
```

### 4.2.4 Certificate Rotation Considerations

Per SP-6105 SS 6.5 (Configuration Management), certificate lifecycle is a configuration management concern:

- **Default validity:** Kolla-Ansible generates certificates with a 1-year validity period
- **Rotation procedure:** Regenerate certificates, then run `kolla-ansible reconfigure` to deploy new certificates to all containers
- **Monitoring:** Certificate expiration should be monitored as part of Phase E operations (SP-6105 SS 5.4)
- **Documentation:** Certificate rotation procedures are documented in the Operations Manual (Phase E deliverable) and verified by the doc-verifier during Phase D

---

## 4.3 Network Configuration

Network configuration translates the logical network design from Phase B into physical and virtual network infrastructure. Per SP-6105 SS 6.3 (Interface Management), each network interface serves a distinct purpose and is documented in the Interface Control Document.

### 4.3.1 OVS/OVN Bridge Setup

Open vSwitch (OVS) provides the virtual switching fabric for Neutron. The bridge configuration creates the data plane infrastructure that tenant networks operate on.

**Integration bridge (br-int):**

The integration bridge is created automatically by the Neutron OVS agent. All VM ports connect to this bridge, and all internal VXLAN tunnels terminate here.

```bash
# Verify OVS bridge after deployment
ovs-vsctl show
# Expected: br-int bridge with VXLAN tunnel ports
```

**External bridge (br-ex):**

The external bridge connects the cloud to the physical network for provider networks and floating IPs:

```bash
# This bridge is configured by Kolla-Ansible during deployment
# Manual creation (for reference):
ovs-vsctl add-br br-ex
ovs-vsctl add-port br-ex eth1
```

- The external bridge binds to the `neutron_external_interface` defined in `globals.yml` (eth1 in our configuration)
- Provider networks use this bridge to deliver flat or VLAN traffic directly to tenant instances
- Floating IPs are routed through this bridge to provide external access to tenant instances

### 4.3.2 Management Network Bridge Configuration

The management network carries all control plane traffic:

| Traffic Type | Protocol | Port(s) | Description |
|---|---|---|---|
| API endpoints | HTTPS | 5000 (Keystone), 8774 (Nova), 9696 (Neutron), 8776 (Cinder), 9292 (Glance) | Service API traffic |
| Message queue | AMQP/TLS | 5672 | RabbitMQ inter-service messaging |
| Database | MySQL/TLS | 3306 | MariaDB service database access |
| Container registry | HTTPS | 4000 | Docker registry for Kolla images |

The management network should be isolated from tenant traffic. On a single-node deployment, this isolation is logical (separate OVS bridges) rather than physical (separate NICs), but the architecture supports physical separation for multi-node expansion.

### 4.3.3 Provider Network for External Access

Provider networks bypass Neutron's overlay networking to deliver traffic directly to instances. This is required for instances that need direct external connectivity:

```bash
# Post-deployment: create provider network
openstack network create --share --external \
  --provider-physical-network physnet1 \
  --provider-network-type flat \
  provider-net

openstack subnet create --network provider-net \
  --allocation-pool start=192.168.1.100,end=192.168.1.200 \
  --dns-nameserver 8.8.8.8 \
  --gateway 192.168.1.1 \
  --subnet-range 192.168.1.0/24 \
  provider-subnet
```

### 4.3.4 VXLAN Configuration for Tenant Networks

VXLAN (Virtual Extensible LAN) provides isolated tenant networks that scale beyond VLAN limits:

- **VNI range:** 1-1000 (configured in ml2_conf.ini)
- **Encapsulation:** UDP port 4789 (IANA standard)
- **MTU consideration:** VXLAN adds 50 bytes of overhead. If the physical MTU is 1500, the tenant network MTU is 1450. Configure jumbo frames (MTU 9000) on the physical network if possible to avoid fragmentation.
- **L2 population:** Enabled to reduce broadcast traffic by distributing MAC/IP learning across compute nodes via the message bus rather than relying on multicast

### 4.3.5 IP Address Allocation Planning

Per SP-6105 SS 6.3 (Interface Management), all IP address allocations are documented:

| Network | CIDR | Purpose | Allocation |
|---|---|---|---|
| Management | 10.0.0.0/24 | Control plane, API endpoints | .1 gateway, .10-.50 services, .254 VIP |
| Provider | 192.168.1.0/24 | External access, floating IPs | .1 gateway, .100-.200 floating IP pool |
| Tenant (VXLAN) | 10.100.0.0/16 | Isolated tenant networks | Subnets allocated per project as /24 |
| Storage (optional) | 10.0.1.0/24 | Dedicated storage traffic | .1 gateway, .10-.50 storage services |

---

## 4.4 Storage Backend Configuration

Storage configuration establishes the persistent data layer for the cloud. Three storage services are configured, each serving a distinct purpose per the logical decomposition from Phase B (SP-6105 SS 4.3).

### 4.4.1 LVM Volume Group Creation for Cinder

Cinder provides block storage (virtual hard drives) for instances. The LVM backend requires a dedicated volume group:

```bash
# Create physical volume on dedicated partition or disk
pvcreate /dev/sdb1

# Create volume group for Cinder
vgcreate cinder-volumes /dev/sdb1

# Verify
vgdisplay cinder-volumes
```

**Capacity allocation:** The volume group should have sufficient space for the expected number and size of volumes. For a lab environment with 32GB+ RAM, allocating 100GB+ for Cinder volumes provides adequate capacity for learning and experimentation. Per SP-6105 SS 6.4, under-provisioning storage is a risk that can cascade into service failures when users cannot create volumes.

### 4.4.2 Glance Local Storage Path Configuration

Glance stores virtual machine images. For a single-node deployment, local filesystem storage is used:

```yaml
# In globals.yml
glance_backend_file: "yes"
```

Images are stored in `/var/lib/docker/volumes/glance/` within the Glance container. The storage path inherits from the Docker storage driver configuration.

**Capacity consideration:** A minimal cloud image (CirrOS) requires ~13MB. Production images (CentOS, Ubuntu) require 500MB-2GB each. Allocate at least 20GB for image storage to support a reasonable library of base images.

### 4.4.3 Swift Ring Initialization for Object Storage

Swift provides object storage (similar to AWS S3). Ring initialization defines how objects are distributed across storage devices:

```bash
# Kolla-Ansible handles ring creation during deployment
# For reference, the ring builder commands:
swift-ring-builder account.builder create 10 1 1
swift-ring-builder container.builder create 10 1 1
swift-ring-builder object.builder create 10 1 1

# Add device (single-node: one device per ring)
swift-ring-builder account.builder add \
  --region 1 --zone 1 --ip 10.0.0.10 --port 6202 \
  --device sdc1 --weight 100

# Rebalance rings
swift-ring-builder account.builder rebalance
swift-ring-builder container.builder rebalance
swift-ring-builder object.builder rebalance
```

**Ring parameters:**
- **Part power (10):** 2^10 = 1024 partitions. Adequate for single-node; production uses 14-18 for millions of objects.
- **Replicas (1):** Single replica on single-node. Production requires 3 replicas across 3 zones minimum.
- **Min part hours (1):** Minimum hours between partition moves. Low value for lab; production uses 24.

### 4.4.4 Disk Space Allocation Between Services

Per SP-6105 SS 6.4 (Technical Risk Management), storage exhaustion is a primary risk. The following allocation provides a baseline for a system with 500GB total storage:

| Service | Minimum | Recommended | Purpose |
|---|---|---|---|
| OS + Docker | 50 GB | 80 GB | Base system, container images, logs |
| Cinder volumes | 50 GB | 100 GB | Block storage for instances |
| Glance images | 20 GB | 50 GB | VM image library |
| Swift objects | 20 GB | 100 GB | Object storage |
| MariaDB | 10 GB | 20 GB | Service databases |
| Logs + monitoring | 10 GB | 30 GB | Operational data |
| Reserve | 20 GB | 50 GB | Growth buffer (never allocate 100%) |

---

## 4.5 Version Control and Change Management

Per SP-6105 SS 6.5 (Configuration Management), all configuration files are managed under version control. This is not merely a best practice -- it is a process requirement that ensures traceability, reproducibility, and auditability of every design decision.

### 4.5.1 Git-Controlled Configuration

Every configuration file described in this chapter is committed to git with messages that document the decision rationale:

```bash
# Example: committing globals.yml with rationale
git add /etc/kolla/globals.yml
git commit -m "feat(kolla): configure TLS for all API endpoints

Enable kolla_enable_tls_internal and kolla_enable_tls_external per
SP-6105 SS 6.4 risk mitigation. Self-signed certificates for lab
environment with infrastructure supporting CA-signed replacement.

Trade study: TLS everywhere vs. TLS external-only
- TLS everywhere: protects against internal network compromise
- TLS external-only: simpler, but leaves internal traffic unencrypted
- Decision: TLS everywhere (defense in depth per security requirements)
"
```

This commit message pattern follows SP-6105 SS 6.5 requirements:
- **What changed:** TLS configuration enabled
- **Why it changed:** Risk mitigation per SP-6105 SS 6.4
- **What alternatives were considered:** TLS everywhere vs. external-only
- **Why this alternative was selected:** Defense in depth

### 4.5.2 Baseline Management

A configuration baseline is a snapshot of all configuration files at a known-good state. Baselines are tagged in git:

```bash
# Tag baseline after Phase C completion
git tag -a "baseline-phase-c-v1.0" -m "Phase C configuration baseline
All Kolla-Ansible configs finalized and validated.
CDR gate criteria met. Ready for Phase D deployment."
```

Per NPR 7123.1 SS 5.1, the Phase C baseline must be established before Phase D (deployment) begins. Changes after baseline require formal change control -- documented justification and re-verification of affected components.

### 4.5.3 Change Control Process

After the Phase C baseline is established, configuration changes follow this process:

1. **Identify the change:** What configuration needs to change and why
2. **Impact assessment:** Which services are affected? What tests need re-running?
3. **Document the change:** Create a git commit with full rationale (per SS 6.5)
4. **Implement the change:** Modify the configuration file
5. **Verify the change:** Run affected verification tests from the V&V plan
6. **Update the baseline:** Tag a new baseline version if the change is accepted

This process applies to all configuration changes, including those discovered during Phase D testing that require Phase C configuration updates. Per SP-6105, iteration between phases is expected and managed through the change control process.

---

## 4.6 Phase Gate Criteria -- CDR (Pre-Deployment Review)

The Critical Design Review (CDR) is the Phase C exit gate. Per NPR 7123.1 Appendix G, CDR evaluates whether the design is complete, correct, and ready for implementation (deployment). In cloud operations, CDR is the Pre-Deployment Review -- the final check before running `kolla-ansible deploy`.

### CDR Entrance Criteria

Before CDR can begin, the following must be true:

- [ ] Phase B PDR (Configuration Review) gate criteria are met
- [ ] All design trade studies from Phase B are documented with decisions finalized
- [ ] Preliminary V&V plan exists with verification methods assigned to all requirements

### CDR Checklist

| # | Criterion | Verification Method | Status |
|---|---|---|---|
| 1 | All Kolla-Ansible configurations finalized and committed to git | Inspection: review git log for globals.yml, inventory, service configs | [ ] |
| 2 | Configuration decisions documented with rationale in commit messages | Inspection: review commit messages for trade study references | [ ] |
| 3 | TLS certificates generated and validated | Test: `openssl verify` against CA, check expiry dates | [ ] |
| 4 | Network configuration documented with IP allocation plan | Inspection: review network design document, verify no address conflicts | [ ] |
| 5 | Storage backend configured with capacity allocation plan | Inspection: review `vgdisplay`, verify sufficient space per allocation table | [ ] |
| 6 | Rollback procedures documented for every configuration change | Inspection: each configuration commit includes rollback instructions | [ ] |
| 7 | Build procedures (deployment steps) documented and reviewed | Inspection: deployment procedure document exists with step-by-step commands | [ ] |
| 8 | Configuration baseline tagged in version control | Inspection: git tag exists for Phase C baseline | [ ] |

### CDR Success Criteria

Per SP-6105 SS 5.1 and NPR 7123.1 SS 5.1:

1. **All configurations finalized and version-controlled** -- every file that Kolla-Ansible reads during deployment is committed to git with documented rationale
2. **Certificates generated and validated** -- TLS certificates pass chain validation and have acceptable expiry dates
3. **Rollback procedures documented** -- for every configuration change, there is a documented procedure to reverse it
4. **Build procedures reviewed and approved** -- the deployment steps are documented, reviewed, and ready for Phase D execution

**Gate decision:** If all criteria pass, proceed to Phase D (System Assembly, Integration, and Test). If any criterion fails, return to the failing item, resolve it, update the baseline, and re-evaluate.

---

## Summary

Phase C transforms the architecture and design from Phase B into concrete, deployable configuration artifacts. Every setting in `globals.yml`, every entry in the inventory, every service-specific override is a design decision that traces backward to a requirement (SP-6105 SS 4.2) and forward to a verification method (SP-6105 SS 5.3).

The key deliverables from Phase C are:

1. **Final Configuration Package** -- globals.yml, inventory, service configs
2. **Certificate Bundle** -- CA certificate, server certificates, HAProxy certificates
3. **Network Configuration** -- OVS bridges, IP allocation plan, VXLAN parameters
4. **Storage Configuration** -- LVM volume group, Glance storage path, Swift rings
5. **Configuration Baseline** -- git tag marking the approved configuration state

With CDR passed and the configuration baseline established, the system is ready for Phase D: deploying services and proving they work.

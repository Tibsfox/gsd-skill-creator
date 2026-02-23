# Chapter 3: Preliminary Design and Technology Completion -- The Blueprint

**SE Phase:** Phase B | **SP-6105 SS 4.3-4.4** | **NPR 7123.1 SS 4.3** | **Review Gate:** PDR (Configuration Review)

---

This chapter maps to NASA's Phase B: Preliminary Design and Technology Completion. With requirements baselined at SRR (Chapter 2), we now produce the detailed design that will guide implementation. Per SP-6105 SS 4.3 (Logical Decomposition) and SS 4.4 (Design Solution Definition), this phase produces service-by-service design specifications, interface definitions, network and storage designs, security architecture, and the preliminary Verification and Validation (V&V) plan.

The output of this phase is the blueprint -- every design decision documented with enough specificity that implementation (Phase C) becomes a translation exercise rather than a design exercise. Per NPR 7123.1 SS 4.3, the Preliminary Design Review (PDR) evaluates whether the design is mature enough to proceed to final design and fabrication.

## 1. Service-by-Service Design Specifications

Per SP-6105 SS 4.3, each functional requirement from Chapter 2 is allocated to a specific OpenStack service, and each service receives a design specification covering its purpose, key configuration parameters, integration dependencies, and API endpoints.

### 1.1 Keystone (Identity Service)

**Purpose:** Provides authentication, authorization, and service catalog for all OpenStack services. Every API call to any OpenStack service authenticates through Keystone.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Token provider | Fernet | Stateless tokens, no database persistence required (CLOUD-IDENTITY-004) |
| Token expiration | 3600 seconds (1 hour) | Balance between security and usability |
| Max token size | Default (255 bytes for Fernet) | Fernet tokens have fixed size |
| Credential encryption | Fernet keys with rotation | Per SP-6105 SS 6.5, key material managed with rotation |
| Admin endpoint | `http://{mgmt_ip}:5000/v3` | Identity API v3 on management network |

**Integration Dependencies:** None -- Keystone is the root of the dependency tree. All other services depend on Keystone.

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:5000/v3` | User authentication, token operations |
| Internal | `http://{mgmt_ip}:5000/v3` | Inter-service authentication |
| Admin | `http://{mgmt_ip}:5000/v3` | Administrative operations (user/project management) |

**Requirements Satisfied:** CLOUD-IDENTITY-001, CLOUD-IDENTITY-002, CLOUD-IDENTITY-003, CLOUD-IDENTITY-004

### 1.2 Nova (Compute Service)

**Purpose:** Manages the lifecycle of compute instances (virtual machines). Handles scheduling, hypervisor interaction, flavor management, and instance state transitions.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Hypervisor | KVM/QEMU (libvirt) | Hardware-accelerated virtualization on Linux |
| Scheduler | Filter scheduler | Default for single-node; filters by resource availability |
| VNC console | noVNC via Horizon | Web-based console access without client software |
| CPU allocation ratio | 16:1 | Lab deployment -- allows overcommit for density |
| RAM allocation ratio | 1.5:1 | Conservative overcommit for lab workloads |
| API endpoint | `http://{mgmt_ip}:8774/v2.1` | Compute API v2.1 on management network |

**Integration Dependencies:**
- Keystone -- authentication and service catalog registration
- Glance -- image retrieval for instance boot
- Neutron -- network port creation for instance connectivity
- Cinder -- volume attachment for persistent block storage

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:8774/v2.1` | Instance lifecycle operations |
| Internal | `http://{mgmt_ip}:8774/v2.1` | Inter-service compute requests |

**Requirements Satisfied:** CLOUD-COMPUTE-001, CLOUD-COMPUTE-002, CLOUD-COMPUTE-003

### 1.3 Neutron (Networking Service)

**Purpose:** Provides software-defined networking including virtual networks, subnets, routers, security groups, floating IPs, and DHCP services.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| ML2 mechanism driver | OVS (Open vSwitch) | Selected in Chapter 2 technology assessment |
| Tunnel type | VXLAN | Tenant network encapsulation for isolation |
| L3 agent | Legacy (centralized) | Appropriate for single-node; DVR not needed |
| DHCP agent | Enabled | Automatic IP assignment for instances |
| Metadata agent | Enabled | Instance metadata service (cloud-init support) |
| API endpoint | `http://{mgmt_ip}:9696/v2.0` | Networking API v2.0 on management network |

**Integration Dependencies:**
- Keystone -- authentication and service catalog
- Nova -- port creation triggered by instance launch

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:9696/v2.0` | Network, subnet, router, security group operations |
| Internal | `http://{mgmt_ip}:9696/v2.0` | Inter-service network requests |

**Requirements Satisfied:** CLOUD-NETWORK-001, CLOUD-NETWORK-002, CLOUD-NETWORK-003

### 1.4 Cinder (Block Storage Service)

**Purpose:** Provides persistent block storage volumes that can be attached to and detached from compute instances. Supports snapshots for point-in-time recovery.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Backend | LVM | Single-node simplicity; selected over Ceph in trade study |
| Volume group | `cinder-volumes` | Dedicated LVM volume group for Cinder |
| iSCSI target | tgtd / LIO | iSCSI protocol for volume attachment |
| Default volume type | LVM | Single backend, single type |
| API endpoint | `http://{mgmt_ip}:8776/v3` | Block Storage API v3 on management network |

**Integration Dependencies:**
- Keystone -- authentication and service catalog
- Nova -- volume attach/detach operations triggered by compute

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:8776/v3` | Volume lifecycle, snapshot operations |
| Internal | `http://{mgmt_ip}:8776/v3` | Inter-service storage requests |

**Requirements Satisfied:** CLOUD-STORAGE-001, CLOUD-STORAGE-002, CLOUD-STORAGE-003

### 1.5 Glance (Image Service)

**Purpose:** Manages virtual machine images used by Nova to boot instances. Stores, catalogs, and serves images in multiple formats.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Backend | Local filesystem | `/var/lib/glance/images/` -- single-node simplicity |
| Supported formats | qcow2, raw, vmdk, vhd | Common hypervisor image formats |
| Image size limit | 5 GB default | Appropriate for lab images |
| API endpoint | `http://{mgmt_ip}:9292/v2` | Image API v2 on management network |

**Integration Dependencies:**
- Keystone -- authentication and service catalog
- Nova -- image retrieval during instance launch

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:9292/v2` | Image upload, download, metadata operations |
| Internal | `http://{mgmt_ip}:9292/v2` | Inter-service image retrieval |

### 1.6 Swift (Object Storage Service)

**Purpose:** Provides object storage with container-based organization, access control lists, and ring-based data distribution.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Replica count | 1 | Single-node -- multi-replica not beneficial without multiple disks |
| Storage policy | Default (single) | One policy for single-node deployment |
| Proxy server | `http://{mgmt_ip}:8080/v1` | Object Storage API v1 on management network |
| Ring partition power | 10 | 2^10 = 1024 partitions, appropriate for lab scale |

**Integration Dependencies:**
- Keystone -- authentication (TempAuth not used in production deployments)

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:8080/v1/AUTH_{project_id}` | Object CRUD, container management |
| Internal | `http://{mgmt_ip}:8080/v1/AUTH_{project_id}` | Inter-service object access |

### 1.7 Heat (Orchestration Service)

**Purpose:** Provides template-based orchestration for deploying multi-resource stacks. Processes HOT (Heat Orchestration Template) templates to create and manage groups of OpenStack resources.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Stack action timeout | 3600 seconds | Allow complex stacks time to deploy |
| Max nested depth | 5 | Prevent runaway template recursion |
| API endpoint | `http://{mgmt_ip}:8004/v1/{project_id}` | Orchestration API v1 on management network |

**Integration Dependencies:**
- Keystone -- authentication and service catalog
- Nova, Neutron, Cinder, Glance -- resource creation as specified in templates

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:8004/v1/{project_id}` | Stack lifecycle operations |
| Internal | `http://{mgmt_ip}:8004/v1/{project_id}` | Inter-service orchestration |

### 1.8 Horizon (Dashboard Service)

**Purpose:** Provides a web-based management console for administrators and users to interact with OpenStack services through a graphical interface.

**Key Configuration Parameters:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Web server | Apache (httpd) | Kolla-Ansible default for Horizon |
| Port | 443 (HTTPS) or 80 (HTTP) | TLS recommended per security design |
| Session backend | Memcached | Shared session storage |
| Default theme | Default OpenStack | Standard dashboard appearance |

**Integration Dependencies:**
- Keystone -- user authentication and authorization
- All other services -- Horizon provides a UI for Nova, Neutron, Cinder, Glance, Swift, Heat

**API Endpoints:**

| Endpoint Type | URL | Purpose |
|---------------|-----|---------|
| Public | `http://{mgmt_ip}:80` (or `:443`) | Web dashboard access |

## 2. Interface Definitions

Per SP-6105 SS 6.3 (Interface Management) and NPR 7123.1 SS 4.3, all critical interfaces between services must be defined with sufficient detail for implementation and testing.

### 2.1 Keystone-to-Nova (Authentication Interface)

**Direction:** Nova authenticates all API requests against Keystone

**Protocol:** HTTP REST over management network

**Mechanism:**
1. User sends API request to Nova with X-Auth-Token header
2. Nova's auth_token middleware validates the token against Keystone
3. Keystone returns token metadata (user, project, roles)
4. Nova authorizes the request based on RBAC policy

**Configuration Points:**
- Nova: `[keystone_authtoken]` section in nova.conf
- Keystone: Service catalog entry for compute endpoint
- Shared: Keystone service credential for Nova

**Failure Mode:** If Keystone is unreachable, all Nova API requests fail with 503. Cached tokens may provide temporary grace period.

### 2.2 Nova-to-Neutron (Instance Networking Interface)

**Direction:** Nova requests network ports from Neutron during instance creation

**Protocol:** HTTP REST over management network

**Mechanism:**
1. Nova receives instance create request specifying network(s)
2. Nova calls Neutron API to create port(s) on specified network(s)
3. Neutron allocates IP address, creates OVS port, applies security groups
4. Nova receives port details and passes to hypervisor for vNIC binding
5. Instance boots with network connectivity via the allocated port

**Configuration Points:**
- Nova: `[neutron]` section in nova.conf (Neutron endpoint URL, credentials)
- Neutron: ML2 plugin configuration for OVS mechanism driver
- OVS: Bridge configuration for instance port binding

**Failure Mode:** If Neutron is unreachable, instance creation fails at the networking stage. Instance remains in BUILD state until timeout.

### 2.3 Nova-to-Cinder (Block Storage Attachment Interface)

**Direction:** Nova requests volume attach/detach from Cinder

**Protocol:** HTTP REST over management network + iSCSI for data path

**Mechanism:**
1. User requests volume attach via Nova API or Cinder API
2. Nova calls Cinder to initialize connection (reserve volume)
3. Cinder creates iSCSI target on the LVM backend
4. Nova connects to the iSCSI target on the compute host
5. Nova attaches the block device to the instance via libvirt

**Configuration Points:**
- Nova: `[cinder]` section in nova.conf (Cinder endpoint URL, credentials)
- Cinder: LVM backend configuration, iSCSI target configuration
- Host: iSCSI initiator configuration for volume discovery

**Failure Mode:** If Cinder is unreachable, volume attach fails. Instance continues to run without the requested volume. Existing attached volumes remain functional.

### 2.4 Nova-to-Glance (Image Retrieval Interface)

**Direction:** Nova retrieves images from Glance during instance boot

**Protocol:** HTTP REST over management network (image download via streaming)

**Mechanism:**
1. Nova receives instance create request specifying image UUID
2. Nova calls Glance API to download the image
3. Glance streams the image to Nova's local cache
4. Nova creates the instance root disk from the cached image
5. Subsequent boots from the same image use the local cache

**Configuration Points:**
- Nova: `[glance]` section in nova.conf (Glance endpoint URL)
- Glance: Backend configuration (local filesystem path)

**Failure Mode:** If Glance is unreachable, instance creation fails at the image download stage. Cached images may still be available for previously-used images.

### 2.5 All-to-Keystone (Service Catalog Registration)

**Direction:** All services register their endpoints with Keystone's service catalog

**Protocol:** Keystone Admin API

**Mechanism:**
1. During deployment, each service is registered in Keystone's service catalog
2. Registration includes: service type, service name, endpoint URLs (public, internal, admin)
3. Other services discover endpoints by querying the service catalog with their service credentials
4. Per SP-6105 SS 6.3, the service catalog is the authoritative interface registry

**Configuration Points:**
- Keystone: Service and endpoint entries in the catalog database
- All services: `[keystone_authtoken]` configuration for catalog discovery

**Failure Mode:** If a service's catalog entry is incorrect or missing, other services cannot discover it. Keystone itself does not depend on the catalog for its own operation.

## 3. Network Design

Per SP-6105 SS 4.3 and NPR 7123.1 SS 4.3, the network design defines how traffic flows between services, between instances, and between the cloud and external networks.

### 3.1 Management Network

**Purpose:** API endpoints, inter-service communication, database and message queue traffic, administrative access.

**Design Specifications:**

| Parameter | Value |
|-----------|-------|
| CIDR | 10.0.0.0/24 (example -- matches site network) |
| Interface | Primary NIC (e.g., `ens3`, `eth0`) |
| Services bound | All OpenStack API endpoints, MariaDB, RabbitMQ, Memcached |
| Access control | SSH from trusted hosts, API endpoints via HAProxy |

**Traffic Types:**
- Keystone token validation (high frequency, low bandwidth)
- RabbitMQ messaging between service components (medium frequency, low bandwidth)
- MariaDB queries from all services (high frequency, medium bandwidth)
- API responses to user requests (variable frequency, variable bandwidth)

### 3.2 Tenant Network

**Purpose:** VM-to-VM traffic, project-isolated network segments, DHCP and metadata services.

**Design Specifications:**

| Parameter | Value |
|-----------|-------|
| Encapsulation | VXLAN (UDP port 4789) |
| Tunnel interface | OVS bridge `br-tun` |
| VXLAN VNI range | 1:1000 |
| MTU | 1450 (1500 - VXLAN overhead) |
| DHCP | Neutron DHCP agent per network |
| Metadata | Neutron metadata agent via metadata proxy |

**Traffic Types:**
- VM-to-VM within same project network (direct through OVS bridge)
- VM-to-VM across project networks (through Neutron L3 agent/router)
- DHCP requests from instances (to Neutron DHCP agent namespace)
- Metadata requests from instances (to Neutron metadata proxy)

### 3.3 External Network

**Purpose:** Floating IP allocation, external connectivity for instances, access from outside the cloud.

**Design Specifications:**

| Parameter | Value |
|-----------|-------|
| Type | Flat or VLAN (bridged to physical network) |
| Interface | OVS bridge `br-ex` mapped to physical interface |
| Floating IP pool | Subnet of site network (e.g., 192.168.1.128/25) |
| Gateway | Site network gateway |
| SNAT | Enabled for tenant network external access |

**Traffic Flow:**

```
Instance -> Virtual Router (Neutron L3) -> Floating IP NAT -> br-ex -> Physical NIC -> External Network
                                                                                    |
External Client -> Physical NIC -> br-ex -> Floating IP DNAT -> Virtual Router -> Instance
```

### 3.4 Storage Network Considerations

For single-node deployment, storage traffic (iSCSI for Cinder, NFS if applicable) travels over the management network. A dedicated storage network is recommended for multi-node deployments but is not required for single-node per the feasibility assessment (Chapter 1, Section 3).

## 4. Storage Design

Per SP-6105 SS 4.4 (Design Solution Definition), the storage design selects and configures backend technologies for block storage, image storage, and object storage.

### 4.1 LVM Backend for Cinder Block Storage

**Design Decision:**

| Criterion | LVM | Ceph |
|-----------|-----|------|
| Single-node suitability | Excellent -- native Linux, no cluster overhead | Poor -- designed for distributed clusters |
| Setup complexity | Low -- `pvcreate`, `vgcreate`, Kolla-Ansible config | High -- MON, OSD, MDS daemons required |
| Performance (single-node) | Direct disk access via LVM | Network overhead even on single node |
| Snapshot support | Yes -- LVM snapshots | Yes -- RADOS snapshots |
| Feature richness | Basic (volumes, snapshots) | Advanced (replication, erasure coding, tiering) |
| Resource overhead | Minimal | ~2 GB RAM for Ceph daemons |

**Selected: LVM** -- per SP-6105 SS 4.4, the simplest solution that satisfies requirements is preferred. Ceph is overengineered for single-node deployment.

**Configuration:**
```
Volume Group: cinder-volumes
  Physical Volume: /dev/sdX (or loopback device for testing)
  Size: Configurable (minimum 20 GB recommended)
  LV naming: volume-{uuid}
  Target: iSCSI (tgtd or LIO target)
```

### 4.2 Local Filesystem for Glance Images

**Design:** Images stored at `/var/lib/glance/images/` on the local filesystem.

**Rationale:** Single-node deployment has no need for distributed image storage. Local filesystem provides the fastest image access for Nova compute on the same host.

**Capacity Planning:** Each image consumes its format size (qcow2 images typically 500 MB - 2 GB). Budget 20 GB for a reasonable image library.

### 4.3 Swift Ring Design for Object Storage

**Design:** Single-node Swift with local storage devices mapped through rings.

**Ring Configuration:**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Partition power | 10 (1024 partitions) | Appropriate for lab scale |
| Replicas | 1 | Single node -- no benefit to multi-replica |
| Minimum part hours | 1 | Minimum rebalance interval |
| Storage devices | Local filesystem directories | Single-node storage backend |

**Rationale per SP-6105 SS 4.4:** Swift's ring architecture is designed for multi-node clusters. On a single node, it operates in a degenerate mode where all ring partitions map to the same device. This is functional and exercises the full Swift API, but does not provide the durability guarantees of a multi-node deployment.

## 5. Security Design

Per SP-6105 SS 6.4 (Technical Risk Management) and NPR 7123.1 SS 4.3, the security design addresses the risks identified in Chapter 1 (R-005: security misconfiguration) through defense-in-depth layers.

### 5.1 TLS Certificate Requirements

| Scope | Implementation | Verification Method |
|-------|---------------|-------------------|
| API endpoints | TLS certificates for all public-facing services | Inspection (I): Certificate validation (expiry, chain, SAN) |
| Internal communication | TLS between services on management network (optional for lab) | Inspection (I): Configuration review |
| Horizon dashboard | HTTPS with valid certificate | Test (T): Browser connection verification |

**Certificate Management:**
- Self-signed CA for lab deployment (automated via Kolla-Ansible)
- Certificate rotation procedure documented in operations manual
- Per SP-6105 SS 6.5, certificate configurations version-controlled in git

### 5.2 RBAC Policy Framework

Per CLOUD-IDENTITY-003, role-based access control is enforced across all services:

| Role | Scope | Permissions |
|------|-------|-------------|
| `admin` | Cloud-wide | Full access to all resources across all projects |
| `member` | Project-scoped | Create, read, update, delete own project resources |
| `reader` | Project-scoped | Read-only access to project resources |

**Policy Files:** Each service has a `policy.yaml` defining RBAC rules. Kolla-Ansible deploys default policies. Custom policies are version-controlled in `configs/kolla-ansible/`.

### 5.3 Network Segmentation

Per the network design (Section 3), security is enforced through:

- **Management network isolation** -- API endpoints accessible only from trusted networks
- **Tenant network isolation** -- VXLAN encapsulation prevents cross-project traffic
- **Security groups** -- Neutron enforces per-instance firewall rules at the OVS bridge level
- **External network control** -- Floating IP allocation controls which instances are externally accessible

### 5.4 Keystone Fernet Token Configuration

Per CLOUD-IDENTITY-004, Keystone uses Fernet tokens:

| Parameter | Value | Security Rationale |
|-----------|-------|--------------------|
| Key repository | `/etc/kolla/keystone/fernet-keys/` | Isolated from service configuration |
| Maximum active keys | 3 | Current key + 1 staged + 1 previous |
| Rotation schedule | Weekly (recommended) | Limits token forgery window |
| Key encryption | AES-256-CBC | Industry standard symmetric encryption |

## 6. Preliminary V&V Plan

Per SP-6105 SS 5.3 (Product Verification) and NPR 7123.1 SS 4.3, the preliminary V&V plan maps each major service to its verification methods. The full V&V plan with detailed test procedures is produced in Phase D (Chapter 5).

### 6.1 Verification Method Assignment

Each service is mapped to the appropriate TAID methods (Test, Analysis, Inspection, Demonstration) per SP-6105 SS 5.3:

| Service | Test (T) | Analysis (A) | Inspection (I) | Demonstration (D) |
|---------|----------|--------------|-----------------|-------------------|
| **Keystone** | Token issue, user create, role assignment | Auth log analysis | policy.yaml review, Fernet key inspection | End-to-end auth flow |
| **Nova** | Instance create/delete, flavor operations | Scheduler log analysis | nova.conf parameter review | Full instance lifecycle demo |
| **Neutron** | Network/subnet/router create, floating IP assign | OVS flow analysis | Security group rule inspection | End-to-end network connectivity |
| **Cinder** | Volume create/attach/snapshot | LVM capacity analysis | LVM configuration inspection | Volume persistence across reboot |
| **Glance** | Image upload/download, format conversion | Image cache analysis | Image metadata inspection | Image boot verification |
| **Swift** | Object upload/download, container operations | Ring partition analysis | Ring configuration inspection | Multi-object workflow |
| **Heat** | Stack create/delete, template validation | Stack event analysis | Template syntax inspection | Multi-resource stack demo |
| **Horizon** | Login, project operations, instance launch | Access log analysis | HTTPS/TLS configuration inspection | Full dashboard walkthrough |

### 6.2 Verification Phase Mapping

Per NPR 7123.1, verification activities are assigned to specific lifecycle phases:

| Phase | Verification Activities |
|-------|------------------------|
| Phase C (Chapter 4) | Configuration inspection -- verify all configs match design specifications |
| Phase D (Chapter 5) | Service-by-service testing, integration testing, performance baseline, security audit |
| Phase E (Chapter 6) | Operational validation -- procedures verified against running system by doc-verifier |

### 6.3 Requirements-to-Verification Traceability

The complete Requirements Verification Matrix (RVM) maps every CLOUD-{DOMAIN}-{NNN} requirement to:

1. **TAID method(s)** -- which verification technique(s) apply
2. **Test procedure** -- specific commands or scenarios to execute
3. **Acceptance criteria** -- quantitative pass/fail thresholds
4. **Phase assignment** -- when the verification occurs in the lifecycle

The full RVM is produced as part of the V&V Plan (Phase 322 of the project roadmap) and is maintained throughout the project lifecycle per SP-6105 SS 6.2.

## 7. Phase Gate Criteria -- PDR (Configuration Review)

Per NPR 7123.1 Appendix G, the Preliminary Design Review (PDR) evaluates whether the design is complete and mature enough to proceed to final design and fabrication. In cloud operations terms, this is the Configuration Review.

### 7.1 PDR Entrance Criteria

The following must be complete before the PDR can be conducted:

- [ ] Service-by-service design specifications produced for all 8 services (Section 1)
- [ ] Interface definitions documented for all critical service pairs (Section 2)
- [ ] Network design completed with management, tenant, and external networks (Section 3)
- [ ] Storage design completed with backend selections and trade studies (Section 4)
- [ ] Security design documented with TLS, RBAC, and network segmentation (Section 5)
- [ ] Preliminary V&V plan maps every service to TAID verification methods (Section 6)

### 7.2 PDR Success Criteria

Per SP-6105 SS 4.3, SS 4.4, and NPR 7123.1 SS 4.3, the PDR passes when:

1. **All service interfaces defined** -- Every service pair with a dependency has a documented interface including protocol, mechanism, configuration points, and failure modes
2. **Network and storage designs documented** -- Network topology covers all three traffic domains (management, tenant, external); storage design includes trade study results per SP-6105 SS 4.4
3. **Trade studies completed** -- LVM vs Ceph (storage), OVS vs OVN (networking) trade studies document alternatives, criteria, and selection rationale per SP-6105 SS 6.8
4. **Preliminary V&V plan complete** -- Every requirement from Chapter 2 maps to at least one TAID verification method; verification phases assigned per NPR 7123.1

### 7.3 PDR Decision

Upon successful completion of all criteria:

- **GO:** Proceed to Phase C (Final Design and Fabrication) -- Chapter 4
- **NO-GO:** Address deficiencies (missing interface definitions, incomplete trade studies, gaps in V&V coverage) before re-evaluation

---

*Chapter 3 maps to NASA SE Phase B (SP-6105 SS 4.3-4.4, NPR 7123.1 SS 4.3). The next chapter -- Phase C: Final Design and Fabrication -- translates these design specifications into Kolla-Ansible configurations, certificates, and build procedures. See Chapter 4: "Building It."*

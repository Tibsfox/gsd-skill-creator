# M11: Sovereign World Rights and OpenStack Isolation

**Module 11 of the Voxel as Vessel research atlas.**
A Minecraft world is a sovereign computational territory. It is owned by a Keystone identity, isolated by Neutron, stored in a dedicated Ceph pool, generated from a seed-coordinate in a 2^64-dimensional address manifold, rendered at LOD-appropriate resolution, and protected by journal-mirrored RBD snapshots with hot-swap capability. This module provides the infrastructure primitives that make sovereignty real — not as metaphor, but as enforceable multi-tenant isolation at every layer of the stack.

---

## 1. OpenStack Service Roles in Sovereign World Architecture

### 1.1 The Sovereignty Stack

Each OpenStack service maps to a specific world sovereignty function. The mapping is not accidental — OpenStack was designed for multi-tenant isolation, and a Minecraft world IS a tenant.

| Service | Role | World Sovereignty Function |
|---------|------|----------------------------|
| **Keystone** | Identity & Auth | World UUID mapped to project; player UUIDs mapped to users; roles: world-owner, operator, player, spectator |
| **Nova** | Compute | PlacementFilter assigns dedicated compute nodes to isolated world tenants; prevents cross-tenant VM cohabitation |
| **Neutron** | Networking | Private network per world; security groups block cross-world traffic; VPN-as-a-Service for inter-world tunnels (SCS R7+) |
| **Cinder** | Block Storage | RBD volume (pool: `worlds`, image: `<world-uuid>`) presented as VM block device; snapshot and clone API |
| **Swift / RGW** | Object Storage | Resource pack and player data backup target; S3-compatible API; per-world buckets with lifecycle policies |
| **Barbican** | Key Management | Data-at-rest encryption keys; LUKS passphrases; TLS certificate storage for inter-world communication |
| **Octavia** | Load Balancing | Distributes player connections across Velocity proxy instances for high-population worlds |

### 1.2 How Each Service Enforces Sovereignty

**Keystone** is the identity boundary. Every API call in OpenStack carries a Keystone token scoped to a project. A world's project ID IS its identity. No token scoped to project `world-alpha` can read, write, or even discover resources belonging to project `world-beta`. This is not application-level filtering — it is enforced at the API gateway before the request reaches any service.

**Nova** enforces compute isolation. The PlacementFilter in Nova's scheduler can be configured to assign dedicated compute hosts to specific projects. When `PlacementFilter` is combined with host aggregates, a world's VM runs on hardware that no other world touches. For worlds that do not require dedicated hosts, Nova's default scheduler still ensures VM-level isolation via hypervisor memory protection (KVM/QEMU).

**Neutron** enforces network isolation. Each world gets a private network with its own subnet. Security groups act as stateful firewalls — the default deny-all policy means a world's VM cannot receive traffic from any source unless an explicit rule permits it. The only inbound rule needed is TCP 25565 (Minecraft protocol) from the Velocity proxy's IP address. All other traffic is dropped at the virtual switch level, before it reaches the VM's network stack.

> "Multi-tenancy in OpenStack is enforced at the API layer through Keystone project scoping, at the network layer through Neutron security groups and network namespaces, and at the storage layer through Ceph namespace isolation."
> — OpenMetal. *Multi-Tenant OpenStack Architecture Basics*. openmetal.io (November 2025).

**Cinder** enforces storage isolation. Each world's volume is a separate RBD image in a namespaced Ceph pool. The CephX keyring attached to the world's VM can only access its own namespace — the storage fabric itself rejects cross-world reads at the OSD level, not just at the API level.

**Swift / RGW** provides the backup and asset layer. Per-world S3 buckets store resource packs, player data exports, and point-in-time snapshots. Bucket policies enforce that only the world owner's credentials can list or retrieve objects.

### 1.3 The Isomorphism

The VAV isomorphism extends here: just as a Minecraft world file is a self-contained namespace of blocks, an OpenStack project is a self-contained namespace of resources. The world boundary in Minecraft (the level.dat file that names the world, sets its seed, and defines its rules) maps to the Keystone project that names the tenant, sets its quotas, and defines its roles.

```
┌──────────────────────────────────────────────────────────────┐
│                    Sovereignty Isomorphism                     │
│                                                               │
│  Minecraft World          ≡      OpenStack Project            │
│  ─────────────────        ─      ──────────────────           │
│  level.dat (identity)     →      Keystone project UUID        │
│  world seed               →      CephX keyring + RBD pool NS  │
│  game rules               →      project quotas + roles       │
│  player whitelist          →      Keystone user-project map   │
│  world border              →      Neutron security groups     │
│  /op command               →      role assignment API         │
│  region files              →      Cinder volumes (RBD images) │
│  resource packs            →      Swift/RGW buckets           │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Sovereign Cloud Stack (SCS) Integration

### 2.1 SCS Release Timeline

The Sovereign Cloud Stack (SCS) is an open-source project that standardizes OpenStack deployments for digital sovereignty. SCS provides a certified reference implementation with specific guarantees about tenant isolation, API compatibility, and operational standards.

| Release | Date | OpenStack Version | Ceph Version | Key Feature for VAV |
|---------|------|-------------------|--------------|---------------------|
| SCS R5 | March 2024 | 2023.2 (Bobcat) | Quincy | Baseline tenant isolation |
| SCS R6 | June 2024 | 2024.1 (Caracal) | Quincy | Improved security group performance |
| SCS R7 | September 2024 | 2024.1 (Caracal) | Reef | VPN-as-a-Service; Domain Manager role |
| SCS R8 | May 2025 | 2025.1 (Epoxy) | Reef | Live migration improvements |
| SCS R9 | November 2025 | 2025.1 (Epoxy) | Reef LTS | PCI passthrough live migration; GPU support |

> Source: Sovereign Cloud Stack. "SCS R7 Released." scs.community/release/2024/09/11/release7

### 2.2 The Domain Manager Role

The Domain Manager role is the single most important SCS contribution for VAV sovereignty. Contributed by the SCS community to upstream OpenStack Keystone, this role enables **delegated self-governance** within a tenant.

Without Domain Manager, every player account creation, role assignment, and quota change requires a cloud-admin API call. The world operator must file a ticket or call an API that requires global admin credentials. This is not sovereignty — it is landlord-permission architecture.

With Domain Manager, a world operator can:

1. **Create player accounts** within their world's project — no admin intervention
2. **Assign roles** (operator, player, spectator) to those accounts — self-service
3. **Manage quotas** for sub-resources within their allocation — autonomy within bounds
4. **Revoke access** immediately when a player leaves — no waiting for admin action

This IS sovereignty: self-governance within allocated resources. The cloud provider sets the outer boundary (total compute, storage, bandwidth). Within that boundary, the world operator is the authority.

```
Cloud Admin
  └── Domain: "worlds"
        ├── World Operator A  ←  Domain Manager role
        │     ├── creates player-1 (role: player)
        │     ├── creates player-2 (role: spectator)
        │     └── promotes player-1 to operator
        │
        └── World Operator B  ←  Domain Manager role
              ├── creates player-3 (role: player)
              └── manages own quotas within allocation
```

### 2.3 VPN-as-a-Service for Inter-World Tunnels

SCS R7 introduced VPN-as-a-Service (VPNaaS) based on Neutron's VPN extension. For VAV, this enables **portal gateways** between sovereign worlds. Each world operator independently creates their side of the IPsec tunnel — IKE policy, IPsec policy, endpoint groups, and site connection. Neither can force a connection on the other. Sovereignty means consent — a portal requires bilateral agreement.

### 2.4 GPU Passthrough and Live Migration (SCS R9)

SCS R9 adds live migration improvements for PCI passthrough devices. This is directly relevant for worlds with GPU-accelerated rendering (shader compute, real-time LOD generation, or ML inference for dynamic content):

- GPU (e.g., NVIDIA A2/L4) passed through to world VM via VFIO
- Live migration previously required VM downtime for passthrough devices
- SCS R9 enables mediated device (mdev) live migration for supported GPUs
- World maintenance (host patching, hardware rotation) no longer requires player disconnection

> Source: Sovereign Cloud Stack. "SCS R9 Released." sovereigncloudstack.org (November 2025).

---

## 3. Full Tenant Provisioning Workflow

### 3.1 Complete CLI Sequence

The following sequence provisions a new sovereign world from bare project to running Minecraft server. Each step is annotated with its sovereignty implication.

```bash
# ─────────────────────────────────────────────────────────────
# Step 1: Create project (world identity)
# Sovereignty: This IS the world. The project UUID becomes the
# world's permanent identity across all OpenStack services.
# ─────────────────────────────────────────────────────────────
openstack project create \
  --domain worlds \
  --description "Sovereign world: Evergreen Forest" \
  world-a1b2c3d4-e5f6-7890-abcd-ef1234567890

# ─────────────────────────────────────────────────────────────
# Step 2: Create world operator user
# Sovereignty: The operator account is the root authority for
# this world. It exists only within this project's scope.
# ─────────────────────────────────────────────────────────────
openstack user create \
  --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --password-prompt \
  operator-foxy

# ─────────────────────────────────────────────────────────────
# Step 3: Assign Domain Manager role (SCS contribution)
# Sovereignty: This is the delegation of authority. The operator
# can now self-manage users and roles without cloud-admin help.
# ─────────────────────────────────────────────────────────────
openstack role add \
  --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --user operator-foxy \
  domain-manager

# Also assign the world-owner role (custom, VAV-specific)
openstack role add \
  --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --user operator-foxy \
  world-owner

# ─────────────────────────────────────────────────────────────
# Step 4: Create private network
# Sovereignty: This network is invisible to all other projects.
# No cross-world traffic is possible without explicit VPN setup.
# ─────────────────────────────────────────────────────────────
openstack network create \
  --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  world-net-a1b2

openstack subnet create \
  --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --network world-net-a1b2 \
  --subnet-range 10.100.1.0/24 \
  --dns-nameserver 1.1.1.1 \
  world-subnet-a1b2

openstack router create --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 world-router-a1b2
openstack router add subnet world-router-a1b2 world-subnet-a1b2
openstack router set --external-gateway public world-router-a1b2

# ─────────────────────────────────────────────────────────────
# Step 5: Create security group (stateful firewall)
# Sovereignty: Default deny-all. Only the Velocity proxy can
# reach this world's Minecraft port. Everything else is dropped.
# ─────────────────────────────────────────────────────────────
openstack security group create --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 world-sg-a1b2

# Allow Minecraft protocol (TCP 25565) from Velocity proxy only
openstack security group rule create --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --protocol tcp --dst-port 25565 --remote-ip 10.0.0.50/32 world-sg-a1b2

# Allow SSH from management network only
openstack security group rule create --project world-a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --protocol tcp --dst-port 22 --remote-ip 10.0.0.0/24 world-sg-a1b2

# ─────────────────────────────────────────────────────────────
# Step 6: Create Cinder volume (Ceph RBD backed)
# Sovereignty: This volume is a dedicated RBD image in the Ceph
# cluster. The world's data lives here and nowhere else.
# ─────────────────────────────────────────────────────────────
openstack volume create \
  --size 100 \
  --type ceph-ssd \
  --property world-uuid=a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  --property world-seed=8675309 \
  --property world-name="Evergreen Forest" \
  world-vol-a1b2

# ─────────────────────────────────────────────────────────────
# Step 7: Create CephX keyring (least-privilege)
# Sovereignty: This keyring can ONLY access this world's
# namespace. It cannot read, write, or discover any other
# world's data. Enforced at the OSD level.
# (Executed on Ceph cluster, not via OpenStack API)
# ─────────────────────────────────────────────────────────────
ceph auth get-or-create client.world-a1b2 \
  mon 'profile rbd' \
  osd 'profile rbd pool=worlds namespace=a1b2c3d4' \
  mgr 'profile rbd pool=worlds'

# ─────────────────────────────────────────────────────────────
# Step 8: Launch VM with dedicated compute
# Sovereignty: The --availability-zone flag pins this VM to a
# specific compute node. Combined with host aggregates, this
# ensures no other tenant's workload shares the hardware.
# ─────────────────────────────────────────────────────────────
openstack server create \
  --flavor mc-server-4c8g \
  --image ubuntu-24.04-minecraft \
  --network world-net-a1b2 \
  --security-group world-sg-a1b2 \
  --block-device source=volume,id=$(openstack volume show world-vol-a1b2 -f value -c id),dest=volume,bootindex=0 \
  --availability-zone az-1::compute-node-07 \
  --key-name operator-foxy-key \
  world-vm-a1b2
```

### 3.2 Provisioning Time Budget

| Step | Typical Duration | Bottleneck |
|------|-----------------|------------|
| Project creation | <1s | Keystone DB write |
| User + role setup | <2s | Keystone DB writes |
| Network + subnet + router | 5-10s | Neutron agent sync |
| Security group + rules | 2-3s | Neutron OVS/OVN flow programming |
| Cinder volume creation | 10-30s | Ceph RBD image creation + thin provisioning |
| CephX keyring | <1s | Monitor Paxos round |
| VM launch | 30-120s | Image download (first boot) + Nova scheduler + hypervisor boot |
| **Total** | **~1-3 minutes** | Image caching eliminates repeat download |

A new sovereign world goes from nothing to running Minecraft server in under 3 minutes. Subsequent worlds on the same compute node (with cached images) provision in under 60 seconds.

---

## 4. Access Control Matrix

### 4.1 Role Definitions

| Role | Keystone Scope | Description |
|------|---------------|-------------|
| **World Owner** | Project admin + domain-manager | Created the world; full authority over all resources |
| **Operator** | Project member + operator role | Can manage the world's runtime but not its identity |
| **Player** | Project member + player role | Can connect and interact with blocks; no management access |
| **Spectator** | Project member + spectator role | Read-only view; cannot modify world state |
| **Other World** | Different project scope | Completely isolated; zero visibility by default |

### 4.2 Full ACL Matrix

| Action | World Owner | Operator | Player | Spectator | Other World |
|--------|:-----------:|:--------:|:------:|:---------:|:-----------:|
| Start/stop world VM | Yes | Yes | No | No | No |
| Modify blocks (gameplay) | Yes | Yes | Yes | No | No |
| View world (connect + observe) | Yes | Yes | Yes | Yes | No |
| Manage player accounts | Yes | Yes | No | No | No |
| Manage operator accounts | Yes | No | No | No | No |
| Access Ceph data directly (CephX) | Yes | No | No | No | No |
| Create RBD snapshot | Yes | Yes | No | No | No |
| Restore from snapshot | Yes | Yes | No | No | No |
| Clone world (full copy) | Yes | No | No | No | No |
| Delete world (destroy project) | Yes | No | No | No | No |
| Modify security group rules | Yes | No | No | No | No |
| Resize VM (vertical scale) | Yes | Yes | No | No | No |
| Cross-world portal travel | By agreement | By agreement | By agreement | No | By agreement |
| Export world data (backup) | Yes | Yes | No | No | No |
| View server logs | Yes | Yes | No | No | No |

### 4.3 Enforcement Layers

Access control is enforced at three independent layers — compromise of any single layer does not breach sovereignty:

```
Layer 1: Keystone RBAC
  └── API-level: role check before any service processes the request
       Token scoped to project → service rejects cross-project calls

Layer 2: Neutron Network Isolation
  └── Network-level: security groups + network namespaces
       Packets from other worlds never reach the VM's vNIC

Layer 3: CephX Storage Isolation
  └── Storage-level: OSD rejects reads/writes from wrong keyring
       Even if network isolation fails, storage remains sovereign
```

No single point of failure. An attacker who compromises the API layer still cannot read storage directly (CephX blocks it). An attacker who compromises the network still cannot authenticate to the API (Keystone blocks it). An attacker who obtains a CephX keyring for world A still cannot access world B's namespace (OSD capability check blocks it).

---

## 5. Multi-Tenant Ceph Cluster Configuration

### 5.1 Dual-Cluster Architecture

Production VAV deployments run two Ceph clusters side by side:

```
┌─────────────────────────────────────────────────────────────┐
│  System Cluster              │  Tenant Cluster               │
│  ──────────────              │  ──────────────               │
│  Kubernetes PVCs             │  World volumes (RBD)          │
│  Platform services           │  Region file objects          │
│  Container images            │  Player data backups          │
│  Monitoring data             │  Resource pack storage        │
│                              │                               │
│  Keyring: client.k8s        │  Keyrings: per-world          │
│  CRUSH: rack-aware          │  CRUSH: world-aware           │
│  Pools: k8s-*               │  Pools: worlds, worlds-*      │
│                              │                               │
│  Separate MON quorums, OSD fleets, CRUSH hierarchies.       │
└─────────────────────────────────────────────────────────────┘
```

The separation ensures that a tenant-triggered storage event (e.g., a large backup saturating OSD bandwidth) cannot impact platform services. Conversely, a Kubernetes node failure does not affect world data availability.

> "Deploying multiple Ceph clusters allows operators to isolate tenant workloads from platform services, each with independent CRUSH maps, keyring namespaces, and failure domains."
> — OpenStack Helm. *Deploying Multiple Ceph Clusters*. docs.openstack.org/openstack-helm

### 5.2 Tenant Cluster Pool Layout

```
worlds/                         ← Primary RBD pool for world volumes
  namespace=a1b2c3d4            ← World 1's RBD images
    world-vol-a1b2              ← 100 GB thin-provisioned volume
  namespace=e5f67890            ← World 2's RBD images
    world-vol-e5f6              ← 50 GB thin-provisioned volume
  namespace=<uuid-N>            ← World N
    ...

worlds-backup/                  ← Cold backup pool (HDD tier, erasure coded)
  namespace=a1b2c3d4            ← World 1's backup snapshots
    snap-2026-03-10T04:00:00Z   ← Point-in-time RBD snapshot export
  namespace=e5f67890            ← World 2's backup snapshots
    ...

worlds-meta/                    ← World metadata pool (replicated, small objects)
  ownership/a1b2c3d4.json       ← Owner UUID, creation date, seed, name
  ownership/e5f67890.json       ← Owner UUID, creation date, seed, name
  quotas/a1b2c3d4.json          ← Storage quota, compute quota
  federation/portals.json       ← Inter-world portal agreements
```

### 5.3 Pool Configuration

```bash
# Primary world storage — SSD tier, 3-way replicated
ceph osd pool create worlds 256
ceph osd pool set worlds size 3
ceph osd pool set worlds min_size 2
ceph osd pool application enable worlds rbd

# Cold backup — HDD tier, erasure coded (k=4, m=2)
ceph osd pool create worlds-backup 128 erasure
ceph osd pool set worlds-backup allow_ec_overwrites true
ceph osd pool application enable worlds-backup rbd

# Metadata — SSD tier, 3-way replicated, small pool
ceph osd pool create worlds-meta 32
ceph osd pool set worlds-meta size 3
ceph osd pool application enable worlds-meta rbd

# CRUSH rule: distribute world replicas across racks
ceph osd crush rule create-replicated worlds-rule default rack
ceph osd pool set worlds crush_rule worlds-rule
ceph osd pool set worlds-meta crush_rule worlds-rule
```

### 5.4 Namespace Isolation

RBD namespaces provide the per-world isolation within the shared `worlds` pool. Each world operates in its own namespace, and the CephX keyring restricts access to that namespace only.

```bash
# Create namespace for a new world
rbd namespace create worlds/a1b2c3d4

# List namespaces (admin only)
rbd namespace list worlds
# Output:
#   a1b2c3d4
#   e5f67890
#   ...

# Create world volume within namespace
rbd create worlds/a1b2c3d4/world-vol --size 102400 --image-feature layering,exclusive-lock,object-map,fast-diff

# Verify namespace isolation — keyring for world A cannot list world B
# (This command FAILS with -EPERM)
rbd --id world-e5f6 ls worlds --namespace a1b2c3d4
# Error: (1) Operation not permitted
```

---

## 6. CephX Keyring Design (Least-Privilege)

### 6.1 Per-World Keyring

Each world receives a dedicated CephX keyring with minimum capabilities:

```
[client.world-a1b2c3d4]
  key = AQBx...generated-key...==
  caps mon = "profile rbd"
  caps osd = "profile rbd pool=worlds namespace=a1b2c3d4"
  caps mgr = "profile rbd pool=worlds"
```

### 6.2 Capability Analysis

This keyring **CAN:**
- Read and write RBD images within `worlds/a1b2c3d4` namespace
- Create, delete, and snapshot images within that namespace
- Query image status and statistics within that namespace

This keyring **CANNOT:**
- Read or write any other world's namespace (OSD rejects with `-EPERM`)
- Access the `worlds-backup` or `worlds-meta` pools (no pool capability)
- Access the system cluster (separate cluster, separate keyrings entirely)
- Modify CRUSH rules or pool configuration (no admin capabilities)
- Create or delete pools (no `allow *` on monitors)
- List other namespaces (profile rbd scopes to the declared namespace)

### 6.3 Cross-World Access (Operator-Level)

For inter-world operations (portal data transfer, world cloning), an operator-level keyring with explicit multi-namespace caps is required:

```
[client.portal-operator]
  key = AQBy...generated-key...==
  caps mon = "profile rbd"
  caps osd = "profile rbd pool=worlds namespace=a1b2c3d4, profile rbd pool=worlds namespace=e5f67890"
  caps mgr = "profile rbd pool=worlds"
```

This keyring can read from both namespaces but still cannot access any third namespace. Portal keyrings are created only when both world operators consent to the portal agreement, and revoked when the agreement ends.

### 6.4 Data-at-Rest Encryption

CephX protects access control but does not encrypt data at rest. For full sovereignty, LUKS encryption runs above the RBD layer inside the VM:

```
World VM
  └── LUKS Encrypted Volume (key from Barbican or local escrow)
        └── ext4/xfs filesystem
              └── /var/minecraft/world/region/r.*.mca
                    │
                    ▼ (encrypted blocks via dm-crypt)
              Cinder RBD Volume (worlds/a1b2c3d4)
              Data on OSD disk is ciphertext
```

The Ceph cluster stores only ciphertext — even a compromised OSD disk reveals nothing without the LUKS key. Barbican stores the key encrypted with the world owner's master key, which never leaves the owner's control.

> "Confidential cloud storage with Ceph requires encrypting data before it reaches the OSD layer. LUKS on the VM block device ensures that the storage backend handles only ciphertext."
> — OpenMetal. *Confidential Cloud Storage with Ceph*. openmetal.io (October 2025).

### 6.5 TLS Between Sites

For multi-site deployments with RBD mirroring (see M13), Ceph messenger v2 protocol provides mutual TLS authentication:

```ini
# ceph.conf — enable messenger v2 with TLS
[global]
  ms_cluster_mode = secure
  ms_service_mode = secure
  ms_client_mode  = secure
  ms_mon_cluster_mode = secure
```

All inter-OSD, MON-OSD, and client-OSD traffic is encrypted with TLS 1.3. RBD mirroring traffic between sites traverses the public internet encrypted end-to-end, with certificates managed per cluster.

---

## 7. Connection to Other Modules

### 7.1 Module Dependency Map

```
M7  (Block/Chunk)        → The block state palettes and NBT structures
│                           stored inside these sovereign volumes
│
M9  (PCG Seed Manifold)  → The world seed is a sovereignty attribute —
│                           each world's procedural generation is unique
│                           and owned by the Keystone identity
│
M10 (Multi-Server)       → Velocity proxy is the border control gateway;
│                           all player connections enter through it and
│                           are routed to the correct sovereign VM
│
M11 (This module)        → Infrastructure primitives for world sovereignty
│
M12 (Edge Topology)      → Portal gateways connect sovereign worlds;
│                           VPNaaS tunnels provide the network fabric
│                           for cross-world travel
│
M13 (Backup/DR)          → RBD snapshots protect sovereign volumes;
                            journal mirroring provides cross-site DR
                            for sovereign data
```

### 7.2 Cross-Module Data Flow

| Step | Module | Sovereignty Primitive |
|------|--------|-----------------------|
| Player connects | M10 (Velocity proxy) | Routes to correct world VM |
| Authentication | M11 (Keystone) | Token scoped to world project |
| Block data read | M7 via M11 (Cinder/RBD) | Anvil .mca files on sovereign volume |
| Resource packs | M8 via M11 (Swift/RGW) | Per-world S3 buckets |
| World generation | M9 via M11 (project metadata) | Seed tied to Keystone identity |
| Portal travel | M12 via M11 (Neutron VPNaaS) | Bilateral tunnel + portal CephX keyring |
| Backup | M13 via M11 (Ceph RBD snapshots) | Snapshots in worlds-backup pool |

---

## 8. Sources

| # | Reference |
|---|-----------|
| 1 | Sovereign Cloud Stack. "SCS R9 Released." sovereigncloudstack.org (November 2025). |
| 2 | Sovereign Cloud Stack. "SCS R7 Released." scs.community/release/2024/09/11/release7 |
| 3 | OpenMetal. "Multi-Tenant OpenStack Architecture Basics." openmetal.io (November 2025). |
| 4 | OpenMetal. "Confidential Cloud Storage with Ceph." openmetal.io (October 2025). |
| 5 | Kubedo. "Ceph Storage Backend for OpenStack: 2025 Guide." kubedo.com (September 2025). |
| 6 | Mirantis. "Placement Control and Multi-Tenancy Isolation with OpenStack." mirantis.com |
| 7 | OpenStack Helm. "Deploying Multiple Ceph Clusters." docs.openstack.org/openstack-helm |
| 8 | Ceph Foundation. "CephX Authentication." https://docs.ceph.com/en/latest/rados/configuration/auth-config-ref/ |
| 9 | Ceph Foundation. "RBD Namespaces." https://docs.ceph.com/en/latest/rbd/rbd-namespaces/ |
| 10 | Ceph Foundation. "Messenger v2 Protocol." https://docs.ceph.com/en/latest/rados/configuration/msgr2/ |
| 11 | OpenStack Documentation. "Keystone Identity Service." https://docs.openstack.org/keystone/latest/ |
| 12 | OpenStack Documentation. "Nova Scheduling." https://docs.openstack.org/nova/latest/admin/scheduling.html |
| 13 | OpenStack Documentation. "Neutron Security Groups." https://docs.openstack.org/neutron/latest/admin/intro-os-networking.html |
| 14 | OpenStack Documentation. "Cinder Volume Encryption." https://docs.openstack.org/cinder/latest/configuration/block-storage/volume-encryption.html |
| 15 | OpenStack Documentation. "Barbican Key Manager." https://docs.openstack.org/barbican/latest/ |

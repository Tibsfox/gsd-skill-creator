# OpenStack Architecture & Core Services

> **Domain:** Cloud Infrastructure
> **Module:** 1 -- Core Services, API Contracts, and Deployment Architecture
> **Through-line:** *Every concept in AWS, GCP, and Azure has a named, inspectable, documented equivalent in OpenStack. Nova is compute. Neutron is networking. Cinder is storage. Keystone is identity. When you understand OpenStack, you understand every cloud platform on earth -- because OpenStack names the primitives that every other platform obscures behind product branding.*

---

## Table of Contents

1. [Origins: From NASA Nebula to Open Infrastructure](#1-origins-from-nasa-nebula-to-open-infrastructure)
2. [Architectural Overview](#2-architectural-overview)
3. [Keystone: Identity and Access Management](#3-keystone-identity-and-access-management)
4. [Nova: Compute Service](#4-nova-compute-service)
5. [Glance: Image Service](#5-glance-image-service)
6. [Horizon: Dashboard](#6-horizon-dashboard)
7. [Message Queue and Database Architecture](#7-message-queue-and-database-architecture)
8. [Service Catalog and API Contracts](#8-service-catalog-and-api-contracts)
9. [Kolla-Ansible: Containerized Deployment](#9-kolla-ansible-containerized-deployment)
10. [Integration Dependency Chain](#10-integration-dependency-chain)
11. [Monitoring and Observability](#11-monitoring-and-observability)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Origins: From NASA Nebula to Open Infrastructure

In 2008, NASA Ames Research Center began developing Nebula, an internal cloud computing platform designed to provide on-demand compute resources for scientific workloads. The project was driven by a practical need: researchers required elastic computing capacity without the procurement cycle delays of traditional IT provisioning [1]. By 2010, Nebula had evolved into a functional IaaS platform running on commodity hardware.

The pivotal moment came in July 2010 when NASA and Rackspace jointly announced OpenStack as an open-source cloud computing platform. NASA contributed the compute component (which became Nova), and Rackspace contributed the object storage component (which became Swift) [2]. The decision to open-source was not incidental. NASA's charter requires that technology developed with public funds be made available for public benefit. The same principle that produced the Systems Engineering Handbook (SP-6105), the Lessons Learned Information System (LLIS), and every mishap investigation report applied to infrastructure software.

Fifteen years later, OpenStack is governed by the Open Infrastructure Foundation (OIF, formerly the OpenStack Foundation) with over 100,000 community members across 187 countries. The 2024 User Survey reports OpenStack managing over 45 million compute cores in production worldwide [3]. Major deployments include CERN (managing physics research computing for the Large Hadron Collider), Walmart (running private cloud for retail operations), China Mobile, and Deutsche Telekom [4].

### The Reference Implementation Thesis

OpenStack's significance extends beyond its deployment count. It is the reference implementation of what a cloud *is*. Every primitive operation in any cloud platform -- launching a virtual machine, creating a network, attaching a block storage volume, authenticating a user -- has a named, documented, inspectable API in OpenStack. When AWS releases a new EC2 instance type, Nova already has the abstraction layer (flavors) that describes what an instance type means. When Azure introduces a new virtual network feature, Neutron already has the network model that defines what virtual networking means at the primitive level.

This is not a claim that OpenStack is better than AWS. It is a claim that OpenStack makes the abstractions visible. A person who understands OpenStack can read any cloud provider's documentation and immediately recognize the underlying primitives, because OpenStack named them first -- or more precisely, OpenStack made them inspectable when others kept them proprietary [5].

> **SAFETY WARNING:** OpenStack is production infrastructure software. Misconfigurations in Keystone authentication, Neutron networking, or Cinder storage can result in data loss, security breaches, or service outages. Every configuration change should follow the verification procedures outlined in Module 2 (NASA SE Rigor). Never deploy to production without completing the full V&V cycle.

---

## 2. Architectural Overview

OpenStack is a collection of loosely coupled services that communicate through REST APIs and a message queue. Each service owns a specific infrastructure domain and exposes a versioned API contract. The architecture follows the microservices pattern before that term was widely adopted -- each service can be developed, deployed, and scaled independently [6].

### Core Service Map

```
OPENSTACK CORE SERVICES -- ARCHITECTURAL OVERVIEW
================================================================

  USER LAYER
  +-----------------------------------------------------------+
  | Horizon (Dashboard)  |  CLI (python-openstackclient)      |
  | REST API consumers   |  Heat (Orchestration)              |
  +-----------------------------------------------------------+
                          |
                          v
  IDENTITY LAYER
  +-----------------------------------------------------------+
  | Keystone                                                   |
  | Token management | Service catalog | RBAC policies        |
  | Fernet/JWS tokens | Domain/Project/User hierarchy         |
  +-----------------------------------------------------------+
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
  COMPUTE LAYER     NETWORK LAYER    STORAGE LAYER
  +-------------+  +--------------+  +--------------+
  | Nova        |  | Neutron      |  | Cinder       |
  | Scheduler   |  | ML2 Plugin   |  | Block Store  |
  | Conductor   |  | OVS / OVN    |  | LVM / Ceph   |
  | API Server  |  | DHCP Agent   |  | Snapshots    |
  +------+------+  +------+-------+  +------+-------+
         |                |                  |
         v                v                  v
  +-------------+  +--------------+  +--------------+
  | Glance      |  | Security Grp |  | Swift        |
  | Image Svc   |  | Floating IP  |  | Object Store |
  | Metadata    |  | L3 Router    |  | Rings / Rep. |
  +-------------+  +--------------+  +--------------+
                          |
                          v
  INFRASTRUCTURE LAYER
  +-----------------------------------------------------------+
  | RabbitMQ (Message Queue)  |  MariaDB/Galera (Database)   |
  | Memcached (Token Cache)   |  HAProxy (Load Balancing)     |
  +-----------------------------------------------------------+
```

### Service Interaction Pattern

Every service interaction follows the same pattern [7]:

1. **Authentication:** Client sends credentials to Keystone, receives a scoped token
2. **Service discovery:** Client queries the service catalog (stored in Keystone) to find the endpoint URL for the target service
3. **API call:** Client sends the request to the target service with the Keystone token in the `X-Auth-Token` header
4. **Token validation:** Target service validates the token against Keystone (cached locally via Memcached for performance)
5. **Authorization:** Target service checks the token's role assignments against its policy file to determine if the operation is permitted
6. **Execution:** Target service performs the requested operation, potentially communicating with other services through the message queue

This pattern is universal. Whether you are launching a virtual machine (Nova), creating a network (Neutron), or uploading an image (Glance), the authentication-discovery-authorization flow is identical. Understanding this flow once means understanding how every OpenStack API call works [8].

---

## 3. Keystone: Identity and Access Management

Keystone is the identity service and the single dependency that every other OpenStack service shares. Without functional Keystone, no other service can authenticate users, validate tokens, or discover endpoints. It is always the first service deployed and the last service decommissioned [9].

### Domain-Project-User Hierarchy

Keystone organizes identity in a three-level hierarchy:

- **Domains** -- Top-level organizational containers. The `default` domain exists in every deployment. Large organizations create separate domains for business units, departments, or tenants.
- **Projects** -- Resource containers within a domain. All OpenStack resources (instances, networks, volumes) belong to a project. Projects provide the primary isolation boundary for multi-tenancy.
- **Users** -- Identity entities that authenticate and receive role assignments. Users belong to a domain and receive roles scoped to one or more projects.

```
KEYSTONE IDENTITY HIERARCHY
================================================================

  Domain: "engineering"
  +------------------------------------------+
  |                                          |
  |  Project: "dev-cloud"                    |
  |  +------------------------------------+  |
  |  | User: alice  (role: admin)         |  |
  |  | User: bob    (role: member)        |  |
  |  | Resources: 4 instances, 2 networks |  |
  |  +------------------------------------+  |
  |                                          |
  |  Project: "staging"                      |
  |  +------------------------------------+  |
  |  | User: alice  (role: member)        |  |
  |  | User: carol  (role: admin)         |  |
  |  | Resources: 8 instances, 3 networks |  |
  |  +------------------------------------+  |
  +------------------------------------------+
```

### Token Management

Keystone supports two token formats for production deployments [10]:

**Fernet tokens** are the default since the Ocata release (2017). They are non-persistent, encrypted symmetric tokens that do not require database storage. Each Fernet token encodes the user identity, project scope, role assignments, and expiration time into a compact encrypted payload using the `cryptography` library's Fernet implementation (AES-128-CBC with HMAC-SHA256).

Key rotation follows a three-stage lifecycle:
1. **Staged key (index 0):** Next key to become primary. Exists so that all nodes can decrypt tokens created with it before it becomes primary.
2. **Primary key (highest index):** Used to create new tokens. Only one primary key exists at any time.
3. **Secondary keys (middle indices):** Former primary keys retained to decrypt tokens created during their tenure. Pruned after a configurable TTL.

**JWS (JSON Web Signature) tokens** were introduced in the Train release (2019) as an alternative. They use asymmetric cryptography (RS256), which simplifies multi-region deployments because only the public key needs distribution to validating services.

### RBAC Policy Engine

Every OpenStack service ships with a `policy.yaml` (formerly `policy.json`) that defines authorization rules. Each API endpoint maps to a policy rule that specifies which roles are permitted to invoke it [11].

Default roles follow a three-tier hierarchy introduced in the Wallaby release:
- **admin** -- Full control over all resources across all projects in a domain
- **member** -- Create and manage resources within their assigned project
- **reader** -- Read-only access to resources within their assigned project

Custom roles can be defined for fine-grained access control. For example, a `security-auditor` role might have reader access to all projects plus the ability to list security groups and RBAC policies.

---

## 4. Nova: Compute Service

Nova is the compute service responsible for the lifecycle of virtual machine instances. It manages scheduling (which hypervisor hosts which instance), resource tracking (CPU, RAM, disk allocation), and instance operations (create, start, stop, resize, snapshot, migrate, delete) [12].

### Architecture Components

Nova consists of several cooperating daemons:

- **nova-api** -- Accepts and responds to REST API calls. Validates requests, checks quotas, and dispatches work to other components via the message queue.
- **nova-scheduler** -- Determines which compute node should host a new instance based on filters (available resources, affinity/anti-affinity rules, availability zones) and weights (resource utilization, custom metrics).
- **nova-conductor** -- Mediates between the API/scheduler and the database. Compute nodes never access the database directly -- conductor handles all DB operations, reducing the attack surface if a compute node is compromised.
- **nova-compute** -- Runs on each hypervisor node. Manages the hypervisor (libvirt/KVM, VMware, Hyper-V) to create, manage, and destroy instances. Communicates with nova-conductor via RabbitMQ.

```
NOVA COMPUTE -- INSTANCE LAUNCH FLOW
================================================================

  Client                nova-api          nova-scheduler
    |                      |                    |
    |--- POST /servers --->|                    |
    |                      |--- validate ------>|
    |                      |    quota check     |
    |                      |                    |
    |                      |--- schedule ------>|
    |                      |                    |--- filter hosts
    |                      |                    |--- weight hosts
    |                      |                    |--- select host
    |                      |<-- host selected --|
    |                      |
    |                nova-conductor        nova-compute (host)
    |                      |                    |
    |                      |--- build req ----->|
    |                      |                    |--- allocate resources
    |                      |                    |--- request Neutron port
    |                      |                    |--- download Glance image
    |                      |                    |--- create libvirt domain
    |                      |                    |--- attach Cinder volumes
    |                      |<-- build complete -|
    |<-- 202 Accepted -----|
```

### Flavors

Flavors define the resource template for an instance -- the amount of vCPUs, RAM, disk, and optional properties like ephemeral storage or NUMA topology. OpenStack ships with no default flavors; the administrator must create them [13].

Standard convention follows a naming pattern that communicates resource allocation:

| Flavor | vCPUs | RAM | Disk | Use Case |
|---|---|---|---|---|
| m1.tiny | 1 | 512 MB | 1 GB | Minimal testing |
| m1.small | 1 | 2 GB | 20 GB | Light workloads |
| m1.medium | 2 | 4 GB | 40 GB | General purpose |
| m1.large | 4 | 8 GB | 80 GB | Application servers |
| m1.xlarge | 8 | 16 GB | 160 GB | Database, compute-intensive |

### Instance Lifecycle States

An instance transitions through well-defined states. The state machine is documented in Nova's source code and enforced by the conductor [14]:

```
BUILD --> ACTIVE --> SHUTOFF --> ACTIVE (start)
                |            --> DELETED (delete)
                |--> PAUSED --> ACTIVE (unpause)
                |--> SUSPENDED --> ACTIVE (resume)
                |--> RESIZE --> VERIFY_RESIZE --> ACTIVE (confirm)
                |                             --> ACTIVE (revert)
                |--> SHELVED --> UNSHELVED --> ACTIVE
                |--> ERROR (on failure)
```

---

## 5. Glance: Image Service

Glance provides image discovery, registration, and retrieval services. It maintains a registry of virtual machine images and their metadata, and serves image data to Nova during instance launches [15].

### Image Formats

Glance supports multiple image formats through its format detection and conversion pipeline:

| Format | Description | Common Use |
|---|---|---|
| qcow2 | QEMU Copy-On-Write v2 | Default for KVM/libvirt. Supports snapshots, thin provisioning |
| raw | Unstructured disk image | Maximum performance, no overhead. Used for Ceph RBD backends |
| vmdk | VMware Virtual Machine Disk | VMware ESXi integration |
| vhd/vhdx | Virtual Hard Disk | Hyper-V integration |
| iso | Optical disc image | Boot media, live images |
| aki/ari/ami | Amazon kernel/ramdisk/machine | Legacy EC2-compatible images |

### Storage Backends

Glance can store images in multiple backends, configured via `glance-api.conf` [16]:

- **File (default):** Local filesystem storage. Simple but not scalable beyond a single node.
- **Swift:** OpenStack object storage. Provides replication and durability.
- **Ceph RBD:** Distributed block device. Enables copy-on-write cloning for instant instance launches.
- **HTTP:** Remote HTTP server. Useful for referencing external image repositories.

The choice of Glance backend significantly affects instance launch performance. With Ceph RBD as both the Glance and Nova backend, instance launches can use copy-on-write cloning, creating a new instance in under 2 seconds regardless of image size because no data copying is required [17].

---

## 6. Horizon: Dashboard

Horizon is the web-based dashboard that provides a graphical interface to OpenStack services. It is implemented as a Django web application that communicates with OpenStack services through their REST APIs -- the same APIs available to the CLI and SDK [18].

### Panel Architecture

Horizon organizes functionality into panels grouped by dashboards:

- **Project Dashboard:** Resource management within a project -- instances, networks, volumes, images, security groups
- **Admin Dashboard:** Cluster-wide management -- hypervisors, host aggregates, flavors, projects, users, system information
- **Identity Dashboard:** Domain and project management, user and group administration, role assignments

Horizon is optional for operations -- every action available in Horizon can be performed via the CLI (`python-openstackclient`) or direct API calls. Many operators use Horizon for monitoring and visualization while performing administrative operations via CLI for reproducibility and scriptability [19].

---

## 7. Message Queue and Database Architecture

### RabbitMQ

OpenStack services communicate asynchronously through a message queue. RabbitMQ is the default and most widely deployed message broker [20].

Each OpenStack service creates exchanges and queues for its internal communication:
- **RPC (Remote Procedure Call):** Synchronous request-reply pattern. Nova-api sends a scheduling request to nova-scheduler and waits for the response.
- **Notification:** Asynchronous event publication. Services publish events (instance created, volume attached, user authenticated) that other services or monitoring systems can consume.

For production deployments, RabbitMQ should be configured in a cluster with mirrored queues for high availability. A three-node RabbitMQ cluster provides tolerance for a single node failure with no message loss [21].

### MariaDB / Galera

Each OpenStack service maintains its own database schema in a shared MariaDB instance (or dedicated instances for large deployments). Galera Cluster provides synchronous multi-master replication for high availability [22].

Key operational considerations:
- **Schema migrations:** Each OpenStack release may include database schema changes. The `db sync` command for each service applies pending migrations. Always take a database backup before running migrations.
- **Connection pooling:** Services use SQLAlchemy connection pools. Default pool size is 5 connections per service; production deployments typically increase this to 20-50 based on workload.
- **Purge expired data:** Soft-deleted records accumulate over time. Regular purging (e.g., `nova-manage db archive_deleted_rows`) prevents table bloat.

---

## 8. Service Catalog and API Contracts

The service catalog is Keystone's registry of all available OpenStack services and their endpoints. Every service registers three endpoint types [23]:

- **Public:** Accessible from external networks. Used by end users and applications.
- **Internal:** Accessible only from the management network. Used for inter-service communication.
- **Admin:** Accessible only from the management network. Used for administrative operations requiring elevated access.

### API Versioning

OpenStack APIs follow a versioning strategy with major versions in the URL path and microversions for incremental changes [24]:

```
Base URL:       https://compute.example.com/v2.1/
Microversion:   X-OpenStack-Nova-API-Version: 2.93
```

Microversions allow services to add new features without breaking existing clients. A client requesting microversion 2.1 receives the base behavior; a client requesting 2.93 receives all features added through that version. This approach avoids the "API version cliff" where upgrading requires rewriting all client code.

### The OpenStack SDK

The `openstacksdk` Python library provides a unified interface to all OpenStack services. It handles authentication, service discovery, API versioning, and error handling. The `openstack` CLI tool (`python-openstackclient`) is built on top of this SDK [25].

```
# Authentication and basic operations
openstack token issue                          # Verify Keystone is working
openstack catalog list                         # Show all registered services
openstack flavor list                          # List compute flavors
openstack image list                           # List available images
openstack server list                          # List instances
openstack network list                         # List networks
openstack volume list                          # List block volumes
```

---

## 9. Kolla-Ansible: Containerized Deployment

Kolla-Ansible is the production-grade deployment tool for OpenStack. It deploys each OpenStack service as a Docker container managed by Ansible playbooks, providing isolation, reproducibility, and simplified upgrades [26].

### Why Containerized Deployment

Traditional OpenStack deployment installs services directly on the host operating system, creating dependency conflicts between services that require different library versions. Kolla-Ansible eliminates this by packaging each service in its own container with its complete dependency tree [27].

Benefits:
- **Isolation:** Each service runs in its own filesystem namespace. A library upgrade for Nova cannot break Neutron.
- **Reproducibility:** Container images are built from Dockerfiles with pinned versions. The same image produces the same behavior on every deployment.
- **Upgrade simplicity:** Rolling upgrades replace containers one at a time. Rollback is trivial -- restart the previous container image.
- **Multi-distro support:** Kolla builds images on CentOS Stream 9, Ubuntu, or Debian. The choice of host OS and container OS are independent.

### Deployment Configuration

Kolla-Ansible configuration is managed through two primary files [28]:

**`globals.yml`** -- Master configuration file. Contains deployment-wide settings:
```yaml
kolla_base_distro: "centos"
openstack_release: "2024.2"
kolla_internal_vip_address: "10.0.0.100"
network_interface: "eth0"
neutron_external_interface: "eth1"
enable_cinder: "yes"
enable_heat: "yes"
enable_horizon: "yes"
```

**`inventory`** -- Ansible inventory file mapping services to hosts. For single-node deployment, all services run on one host. Multi-node deployments distribute services across control, compute, network, and storage nodes.

### Deployment Sequence

```
KOLLA-ANSIBLE DEPLOYMENT SEQUENCE
================================================================

  1. kolla-ansible bootstrap-servers
     Configure host OS: Docker, Python deps, kernel modules

  2. kolla-ansible prechecks
     Validate: disk space, ports, network config, Docker health

  3. kolla-ansible deploy
     Deploy services in dependency order:
       mariadb -> rabbitmq -> memcached -> keystone ->
       glance -> nova -> neutron -> cinder -> heat -> horizon

  4. kolla-ansible post-deploy
     Generate admin-openrc.sh, create initial resources

  5. Verification
     openstack token issue
     openstack catalog list
     openstack server create --flavor m1.tiny --image cirros test
```

---

## 10. Integration Dependency Chain

OpenStack services have a strict dependency order. Deploying services out of order results in failures because upstream dependencies are not available [29].

```
INTEGRATION DEPENDENCY CHAIN
================================================================

  Level 0: Infrastructure
    MariaDB + RabbitMQ + Memcached + HAProxy

  Level 1: Identity (everything depends on this)
    Keystone

  Level 2: Image (Nova needs images to launch instances)
    Glance

  Level 3: Compute (needs Keystone auth + Glance images)
    Nova (scheduler, conductor, compute, API)

  Level 4: Network (Nova needs Neutron for instance networking)
    Neutron (server, agents, DHCP, L3)

  Level 5: Storage (needs Keystone auth, Nova uses for block storage)
    Cinder (API, scheduler, volume)

  Level 6: Orchestration (needs all of the above)
    Heat (engine, API)

  Level 7: Dashboard (needs all of the above)
    Horizon

  Level 8: Optional services
    Swift, Octavia, Designate, Barbican, Ceilometer, Magnum
```

Each level must be fully operational and verified before the next level is deployed. This is the cloud equivalent of NASA's integration sequence -- you do not test the guidance system before the structural frame is proven sound (SP-6105 Section 5.2) [30].

---

## 11. Monitoring and Observability

Production OpenStack deployments require comprehensive monitoring across multiple layers [31].

### Infrastructure Monitoring (Prometheus + Grafana)

Prometheus scrapes metrics from OpenStack service exporters:

| Exporter | Metrics | Alert Examples |
|---|---|---|
| Node Exporter | CPU, RAM, disk, network per host | Disk usage > 85%, RAM pressure |
| RabbitMQ Exporter | Queue depth, message rates, connections | Queue depth > 1000, consumer lag |
| MySQL Exporter | Query rates, replication lag, connection pool | Replication lag > 5s, pool exhaustion |
| OpenStack Exporter | API response times, error rates per service | API error rate > 1%, response time > 5s |

### Application Monitoring

OpenStack services emit structured logs and notifications:

- **Log aggregation:** Fluentd or Filebeat collects logs from all containers, ships to Elasticsearch/OpenSearch
- **API metrics:** Each service tracks request count, latency percentiles, and error rates
- **Notification bus:** Ceilometer (or its successor, Gnocchi) captures resource usage events for metering and billing

### Health Check Pattern

A comprehensive health check verifies each layer of the stack:

```
HEALTH CHECK SEQUENCE
================================================================

  Layer 1: Infrastructure
    - MariaDB: SELECT 1 (connection test)
    - RabbitMQ: rabbitmqctl cluster_status
    - Memcached: echo stats | nc localhost 11211

  Layer 2: OpenStack Services
    - Keystone: openstack token issue
    - Glance: openstack image list
    - Nova: openstack hypervisor list
    - Neutron: openstack network agent list
    - Cinder: openstack volume service list

  Layer 3: Integration
    - End-to-end: create instance with network and volume
    - Floating IP: verify external reachability
    - Console: verify VNC/SPICE console access
```

---

## 12. Cross-References

> **Related:** [NASA SE Applied to Cloud Ops](02-nasa-se-cloud-ops.md) -- the methodology framework for deploying and verifying this architecture. [IaaS Self-Hosting & Ceph](03-iaas-self-hosting.md) -- deep dive into Cinder and Swift storage backends. [Neutron Networking & Heat](04-networking-orchestration.md) -- networking and orchestration layers.

**Series cross-references:**
- **K8S (Kubernetes):** Complementary orchestration layer; OpenStack provides IaaS, Kubernetes provides container orchestration on top
- **SYS (Systems Administration):** Host OS preparation, network configuration, hardware inventory prerequisites
- **MCF (Microservices):** OpenStack's service-oriented architecture is a microservices pattern predating the term
- **GSD2 (GSD Methodology):** Mission management architecture that orchestrates OpenStack deployment
- **CMH (Command History):** Configuration management and change control processes
- **NND (Neural Network Design):** GPU passthrough via Nova for ML workloads
- **OCN (Ocean Computing):** Distributed computing patterns, data sovereignty considerations
- **ACE (Architecture Engineering):** Systems engineering principles applied to infrastructure design

---

## 13. Sources

1. NASA Ames Research Center. "Nebula Cloud Computing Platform." Internal Technical Report, 2008-2010.
2. Open Infrastructure Foundation. "OpenStack: The Path to Cloud -- History and Origins." openinfra.dev/about, 2024.
3. Open Infrastructure Foundation. "2024 OpenStack User Survey." openinfra.dev/user-survey, 2024.
4. CERN IT Department. "CERN Cloud Infrastructure -- Managing Physics Computing with OpenStack." CERN-IT Technical Report, 2023.
5. Sefraoui, O., Aissaoui, M., Eleuldj, M. "OpenStack: Toward an Open-Source Solution for Cloud Computing." International Journal of Computer Applications, vol. 55, no. 3, pp. 38-42, 2012.
6. OpenStack Foundation. "OpenStack Architecture Design Guide." docs.openstack.org/arch-design, 2024.
7. OpenStack Documentation. "Keystone Authentication and Authorization Architecture." docs.openstack.org/keystone/latest/admin/identity-concepts.html, 2024.
8. OpenStack Documentation. "API Quick Start Guide." docs.openstack.org/api-quick-start, 2024.
9. OpenStack Documentation. "Keystone Installation Guide." docs.openstack.org/keystone/latest/install, 2024.
10. Keystone Development Team. "Token Provider Configuration." docs.openstack.org/keystone/latest/admin/tokens-overview.html, 2024.
11. OpenStack Documentation. "Policy Configuration." docs.openstack.org/oslo.policy/latest, 2024.
12. OpenStack Documentation. "Nova System Architecture." docs.openstack.org/nova/latest/user/architecture.html, 2024.
13. OpenStack Documentation. "Nova Flavors." docs.openstack.org/nova/latest/admin/flavors.html, 2024.
14. Nova Development Team. "Instance State Machine." Nova source code, nova/compute/vm_states.py, 2024.
15. OpenStack Documentation. "Glance Architecture." docs.openstack.org/glance/latest/admin/architecture.html, 2024.
16. OpenStack Documentation. "Glance Storage Backends." docs.openstack.org/glance/latest/configuration/configuring.html, 2024.
17. Ceph Documentation. "Ceph Block Device and OpenStack." docs.ceph.com/en/latest/rbd/rbd-openstack, 2024.
18. OpenStack Documentation. "Horizon Developer Documentation." docs.openstack.org/horizon/latest/contributor, 2024.
19. OpenStack Operations Guide. "Dashboard Operations." docs.openstack.org/ops-guide/ops-dashboard.html, 2024.
20. RabbitMQ Documentation. "Clustering Guide." rabbitmq.com/clustering.html, 2024.
21. OpenStack HA Guide. "RabbitMQ High Availability." docs.openstack.org/ha-guide/shared-messaging.html, 2024.
22. MariaDB Foundation. "Galera Cluster Documentation." mariadb.com/kb/en/galera-cluster, 2024.
23. OpenStack Documentation. "Service Catalog and Endpoint Management." docs.openstack.org/keystone/latest/admin/service-api-protection.html, 2024.
24. OpenStack Documentation. "API Microversions." docs.openstack.org/api-guide/compute/microversions.html, 2024.
25. OpenStack SDK Documentation. "Getting Started." docs.openstack.org/openstacksdk/latest, 2024.
26. Kolla-Ansible Documentation. "Deployment Guide." docs.openstack.org/kolla-ansible/latest, 2024.
27. Kolla Documentation. "Philosophy." docs.openstack.org/kolla/latest/contributor/philosophy.html, 2024.
28. Kolla-Ansible Documentation. "Production Architecture Guide." docs.openstack.org/kolla-ansible/latest/admin/production-architecture-guide.html, 2024.
29. OpenStack Installation Guide. "Service Dependencies." docs.openstack.org/install-guide, 2024.
30. NASA. "NASA Systems Engineering Handbook." SP-2016-6105 Rev2, Section 5.2: Product Integration, 2016.
31. OpenStack Operations Guide. "Monitoring." docs.openstack.org/ops-guide/ops-monitoring.html, 2024.

---

*OpenStack Cloud Platform -- Module 1: Architecture & Core Services. The primitives are visible. The APIs are documented. The infrastructure is inspectable. That is the point.*

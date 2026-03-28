# Neutron Networking & Heat Orchestration

> **Domain:** Software-Defined Networking and Infrastructure as Code
> **Module:** 4 -- SDN Architecture, Tenant Isolation, Security Groups, and Orchestration Templates
> **Through-line:** *A network that cannot be described in code cannot be reproduced. A network that cannot be reproduced cannot be verified. Heat templates and Neutron configurations are not convenience features -- they are the infrastructure equivalent of NASA's configuration management requirement: every state must be documented, every change must be traceable, every configuration must be reproducible from its specification alone.*

---

## Table of Contents

1. [Neutron: Software-Defined Networking](#1-neutron-software-defined-networking)
2. [ML2 Plugin Architecture](#2-ml2-plugin-architecture)
3. [OVS vs. OVN: Backend Comparison](#3-ovs-vs-ovn-backend-comparison)
4. [Tenant Network Isolation](#4-tenant-network-isolation)
5. [Security Groups and Firewall Rules](#5-security-groups-and-firewall-rules)
6. [Floating IPs and External Connectivity](#6-floating-ips-and-external-connectivity)
7. [DHCP and Metadata Services](#7-dhcp-and-metadata-services)
8. [Network Design Patterns](#8-network-design-patterns)
9. [Heat: Infrastructure Orchestration](#9-heat-infrastructure-orchestration)
10. [HOT Template Format](#10-hot-template-format)
11. [Stack Lifecycle Management](#11-stack-lifecycle-management)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Neutron: Software-Defined Networking

Neutron provides networking-as-a-service for OpenStack. It abstracts the physical network into software-defined constructs -- virtual networks, subnets, routers, and security groups -- that tenants create and manage through API calls. The physical network infrastructure is invisible to the tenant; Neutron translates virtual network intent into physical network configuration [1].

### Architecture Components

```
NEUTRON SDN -- COMPONENT ARCHITECTURE
================================================================

  neutron-server              neutron-l3-agent         neutron-dhcp-agent
  +---------------+          +----------------+       +------------------+
  | REST API      |          | Virtual routers|       | DHCP service     |
  | Policy engine |--------->| NAT / SNAT     |       | per-network      |
  | Quota mgmt   |          | Floating IP     |       | dnsmasq          |
  | ML2 plugin   |          | Routing tables  |       | Metadata proxy   |
  +-------+-------+          +--------+-------+       +--------+---------+
          |                           |                         |
          v                           v                         v
  +------------------------------------------------------------------+
  |                    OVS / OVN Data Plane                          |
  |                                                                  |
  |  br-int (integration bridge)                                    |
  |    |-- tenant VM ports                                          |
  |    |-- DHCP ports                                               |
  |    |-- router ports                                             |
  |                                                                  |
  |  br-tun (tunnel bridge) -- VXLAN/GRE tunnels between nodes     |
  |                                                                  |
  |  br-ex (external bridge) -- physical network uplink             |
  +------------------------------------------------------------------+
```

- **neutron-server** -- Accepts API requests, applies network policies, communicates with agents via RPC
- **neutron-l3-agent** -- Manages virtual routers, NAT, floating IPs, and routing between networks
- **neutron-dhcp-agent** -- Provides DHCP service for each virtual network using dnsmasq
- **neutron-metadata-agent** -- Provides instance metadata (SSH keys, cloud-init data) via HTTP

### Network Abstractions

| Abstraction | Description | Equivalent |
|---|---|---|
| Network | L2 broadcast domain | AWS VPC subnet, VLAN |
| Subnet | IP address range within a network | CIDR block with gateway, DNS |
| Router | L3 routing between networks | AWS Internet Gateway, VPC router |
| Port | Virtual network interface | ENI (Elastic Network Interface) |
| Security Group | Stateful firewall rules per port | AWS Security Group |
| Floating IP | Public IP mapped to private instance IP | AWS Elastic IP |

---

## 2. ML2 Plugin Architecture

The Modular Layer 2 (ML2) plugin is Neutron's default core plugin. It separates the network abstraction (what the user sees) from the backend implementation (how it is physically realized) through two layers of plugins [2]:

### Type Drivers

Type drivers define the type of network that can be created:

| Type | Mechanism | Use Case |
|---|---|---|
| flat | No encapsulation, direct mapping to physical network | External/provider networks |
| vlan | 802.1Q VLAN tagging | Traditional L2 segmentation (4094 max) |
| vxlan | Virtual Extensible LAN (UDP encapsulation) | Overlay networks (16M+ segments) |
| gre | Generic Routing Encapsulation | Legacy overlay (replaced by VXLAN) |
| geneve | Generic Network Virtualization Encapsulation | Modern overlay, OVN default |

### Mechanism Drivers

Mechanism drivers implement the actual network configuration on the data plane:

| Driver | Description | Status |
|---|---|---|
| openvswitch | Open vSwitch with Neutron agents | Mature, widely deployed |
| ovn | Open Virtual Network (distributed) | Modern, replacing OVS agents |
| linuxbridge | Linux native bridging | Simple, limited features |
| sriov | Single Root I/O Virtualization | Hardware-accelerated, high performance |

---

## 3. OVS vs. OVN: Backend Comparison

The choice between Open vSwitch (OVS) with Neutron agents and Open Virtual Network (OVN) is the most significant networking design decision for an OpenStack deployment [3].

### OVS with Neutron Agents

The traditional approach uses OVS as a programmable virtual switch, controlled by Neutron agents running on each node:

```
OVS ARCHITECTURE -- NEUTRON AGENT MODEL
================================================================

  Controller Node                    Compute Node
  +-------------------+             +-------------------+
  | neutron-server    |             | neutron-ovs-agent |
  | neutron-l3-agent  |             | ovs-vswitchd      |
  | neutron-dhcp-agent|             | ovsdb-server       |
  | neutron-metadata  |  <-- RPC -> |                   |
  +-------------------+             +-------------------+
```

Each agent receives configuration via RPC from neutron-server, then programs OVS flow rules locally. The L3 agent handles all routing centrally, which creates a potential bottleneck for north-south traffic [4].

### OVN (Open Virtual Network)

OVN is a distributed networking system built on top of OVS. It eliminates the need for individual Neutron agents by using its own distributed control plane [5]:

```
OVN ARCHITECTURE -- DISTRIBUTED MODEL
================================================================

  Controller Node                    Compute Node
  +-------------------+             +-------------------+
  | neutron-server    |             | ovn-controller    |
  | ovn-northd        |             | ovs-vswitchd      |
  | ovsdb-server (NB) |  <------->  | ovsdb-server      |
  | ovsdb-server (SB) |             |                   |
  +-------------------+             +-------------------+
```

Key differences:

| Feature | OVS + Agents | OVN |
|---|---|---|
| L3 routing | Centralized (L3 agent) | Distributed (every compute node routes) |
| DHCP | Centralized (DHCP agent) | Distributed (native DHCP responder) |
| ACLs | OVS flow rules via agent | Native OVN ACLs, more efficient |
| Load balancing | Requires Octavia | Native OVN load balancer |
| Performance | Good, centralized routing bottleneck | Better, distributed data plane |
| Complexity | More agents to manage | Fewer components, OVN manages itself |
| Debug tooling | Mature (ovs-ofctl, tcpdump) | Improving (ovn-trace, ovn-nbctl) |

**Recommendation for new deployments:** OVN. The OpenStack community has converged on OVN as the reference networking backend. Kolla-Ansible defaults to OVN since the Yoga release [6].

---

## 4. Tenant Network Isolation

Multi-tenancy requires that networks belonging to different projects are completely isolated -- no traffic leakage, no address space conflicts, no visibility into other tenants' resources [7].

### Isolation Mechanisms

```
TENANT NETWORK ISOLATION
================================================================

  Project A: 10.0.1.0/24             Project B: 10.0.1.0/24
  (same CIDR -- no conflict!)        (isolated by encapsulation)

  +-------------------+              +-------------------+
  | Instance A1       |              | Instance B1       |
  | 10.0.1.5          |              | 10.0.1.5          |
  +--------+----------+              +--------+----------+
           |                                  |
  +--------+----------+              +--------+----------+
  | VNI 100           |              | VNI 200           |
  | (VXLAN segment)   |              | (VXLAN segment)   |
  +--------+----------+              +--------+----------+
           |                                  |
  +--------+----------------------------------+----------+
  |                  Physical Network                    |
  |  VXLAN encapsulation: each tenant's traffic         |
  |  carries a unique VNI, ensuring complete isolation  |
  +-----------------------------------------------------+
```

Two projects can use identical CIDR ranges (e.g., both using 10.0.1.0/24) because each project's network exists in its own VXLAN segment identified by a unique VNI (VXLAN Network Identifier). The physical network carries both without confusion [8].

### Verification

Tenant isolation is a safety-critical property. Verification requires:

1. **Test:** Create instances in two different projects with overlapping CIDRs. Verify no cross-project connectivity.
2. **Analysis:** Inspect OVS/OVN flow rules to confirm traffic separation by VNI.
3. **Inspection:** Review Neutron configuration for proper tenant network type settings.

---

## 5. Security Groups and Firewall Rules

Security groups are stateful firewall rules applied at the port level. They define which traffic is permitted to reach an instance and which traffic the instance can send [9].

### Default Behavior

A newly created security group has:
- **No ingress rules** -- all incoming traffic is denied by default
- **All egress allowed** -- all outgoing traffic is permitted by default

> **SAFETY WARNING:** The default-deny ingress policy is a critical security boundary. Some tutorials instruct users to add "allow all" ingress rules for convenience. This eliminates the primary network security mechanism and should never be done in production. Always create specific rules for specific protocols and ports.

### Rule Specification

```
SECURITY GROUP RULE EXAMPLES
================================================================

  Allow SSH from management network:
    Direction: ingress
    Protocol: TCP
    Port: 22
    Remote CIDR: 10.0.0.0/24

  Allow HTTP from anywhere:
    Direction: ingress
    Protocol: TCP
    Port: 80
    Remote CIDR: 0.0.0.0/0

  Allow ICMP (ping) from project instances:
    Direction: ingress
    Protocol: ICMP
    Remote Group: self (same security group)

  Allow all traffic between application tier:
    Direction: ingress
    Protocol: any
    Remote Group: sg-app-tier
```

Security groups are stateful -- if an inbound TCP connection is permitted, the return traffic is automatically allowed without an explicit egress rule. This is implemented via connection tracking (conntrack) in the Linux kernel or OVN's stateful ACLs [10].

---

## 6. Floating IPs and External Connectivity

Floating IPs provide external (public) IP addresses that can be dynamically associated with instances. They enable instances on private tenant networks to be reachable from the external network [11].

### How Floating IPs Work

```
FLOATING IP -- NAT MAPPING
================================================================

  External Network: 192.168.1.0/24
  Floating IP: 192.168.1.50

  Tenant Network: 10.0.1.0/24
  Instance IP: 10.0.1.5

  Router (L3 agent / OVN):
    DNAT: 192.168.1.50 --> 10.0.1.5 (inbound)
    SNAT: 10.0.1.5 --> 192.168.1.50 (outbound)

  External client --> 192.168.1.50:22
                   --> NAT --> 10.0.1.5:22
                   --> Instance receives SSH connection
```

The L3 agent (or OVN distributed gateway) maintains 1:1 NAT rules mapping floating IPs to tenant IPs. Floating IPs can be associated and dissociated dynamically -- useful for blue/green deployments where a floating IP is moved from the old version to the new version [12].

### Provider Networks

For environments where floating IPs are not needed, provider networks connect instances directly to the physical network. Instances receive IP addresses from the physical network's DHCP or can be statically assigned [13].

| Network Type | Use Case | Pros | Cons |
|---|---|---|---|
| Tenant + floating IP | Multi-tenant, self-service | Full isolation, flexible | NAT overhead, IP management |
| Provider network (flat) | Single-tenant, lab | Simple, no NAT | No isolation, DHCP conflicts |
| Provider network (VLAN) | Enterprise, controlled | Physical switch integration | Requires VLAN-aware switches |

---

## 7. DHCP and Metadata Services

### DHCP

Neutron provides DHCP service for each tenant network through dnsmasq (OVS agent model) or native DHCP (OVN model) [14].

Each network has a dedicated DHCP process that:
- Assigns IP addresses from the subnet's allocation pool
- Provides default gateway, DNS servers, and search domain
- Maintains lease database for IP address tracking
- Supports static IP assignments via Neutron port fixed-ip configuration

### Metadata Service

The metadata service provides instance configuration data (hostname, SSH keys, cloud-init user-data) via a well-known HTTP endpoint at `169.254.169.254` [15].

```
METADATA SERVICE FLOW
================================================================

  Instance (cloud-init)
       |
       | HTTP GET http://169.254.169.254/latest/meta-data/
       |
  neutron-metadata-agent (on network node)
       |
       | Determines instance identity from source IP/port
       |
  nova-metadata-api
       |
       | Returns instance-specific metadata
       |
  Instance receives: hostname, SSH public keys,
                     user-data scripts, vendor-data
```

This is the same metadata service pattern used by AWS EC2 and GCP Compute Engine. Cloud-init, the standard initialization system for cloud instances, expects this endpoint. Understanding how it works in OpenStack means understanding how it works everywhere [16].

---

## 8. Network Design Patterns

### Single-Node Lab

```
SINGLE-NODE NETWORK DESIGN
================================================================

  Physical NIC: ens18
       |
  +----+-----------------------------------------------+
  |                br-ex (external bridge)              |
  |    Management + API: 192.168.1.0/24                |
  +----+-----------------------------------------------+
       |
  +----+-----------------------------------------------+
  |                br-int (integration bridge)          |
  |    Tenant networks: VXLAN overlay (local)          |
  |    DHCP namespaces, router namespaces              |
  +----------------------------------------------------+

  Single NIC serves all traffic: management, API, external.
  Tenant networks use local VXLAN (no remote nodes).
  Suitable for development and learning.
```

### Multi-Node Production

```
MULTI-NODE NETWORK DESIGN
================================================================

  Controller Node:
    eth0: Management (10.0.0.0/24)
    eth1: External / API (192.168.1.0/24)

  Compute Node(s):
    eth0: Management (10.0.0.0/24)
    eth1: Tunnel / VXLAN (10.0.1.0/24)

  Storage Node(s):
    eth0: Management (10.0.0.0/24)
    eth2: Storage replication (10.0.2.0/24)

  Network Separation:
    Management: SSH, Ansible, RabbitMQ, MariaDB
    API/External: Keystone, Nova, Neutron APIs, floating IPs
    Tunnel: VXLAN encapsulated tenant traffic
    Storage: Ceph replication, iSCSI
```

Network separation prevents interference between traffic types. A storage rebalancing event (high bandwidth) should not affect management traffic or API responsiveness [17].

---

## 9. Heat: Infrastructure Orchestration

Heat is OpenStack's orchestration service. It creates and manages collections of cloud resources (instances, networks, volumes, security groups) as a single unit called a stack, defined by a template in the HOT (Heat Orchestration Template) format [18].

### Why Orchestration Matters

Without orchestration, creating a complete application environment requires a sequence of manual API calls:

1. Create network and subnet
2. Create router and connect to external network
3. Create security group with rules
4. Upload or select image
5. Create instance with network, security group, and image
6. Create and attach volume
7. Allocate and associate floating IP

Each step depends on the previous step's output (the network ID is needed to create the instance, etc.). Manual execution is error-prone and not reproducible.

Heat templates encode the entire environment as a declarative specification. The operator says "I want this environment" and Heat figures out the creation order, handles dependencies, and creates everything in the correct sequence [19].

---

## 10. HOT Template Format

HOT (Heat Orchestration Template) uses YAML format with four main sections [20]:

```yaml
heat_template_version: 2021-04-16

description: >
  Complete application environment with network,
  security, compute, and storage resources.

parameters:
  image:
    type: string
    default: ubuntu-22.04
    description: Image name for the instance
  flavor:
    type: string
    default: m1.medium
    description: Instance flavor
  key_name:
    type: string
    description: SSH key pair name

resources:
  # Network
  app_network:
    type: OS::Neutron::Net
    properties:
      name: app-network

  app_subnet:
    type: OS::Neutron::Subnet
    properties:
      network: { get_resource: app_network }
      cidr: 10.0.10.0/24
      gateway_ip: 10.0.10.1
      dns_nameservers: [8.8.8.8, 8.8.4.4]

  # Router
  app_router:
    type: OS::Neutron::Router
    properties:
      external_gateway_info:
        network: external-network

  router_interface:
    type: OS::Neutron::RouterInterface
    properties:
      router: { get_resource: app_router }
      subnet: { get_resource: app_subnet }

  # Security
  app_secgroup:
    type: OS::Neutron::SecurityGroup
    properties:
      rules:
        - protocol: tcp
          port_range_min: 22
          port_range_max: 22
          remote_ip_prefix: 0.0.0.0/0
        - protocol: tcp
          port_range_min: 80
          port_range_max: 80
          remote_ip_prefix: 0.0.0.0/0

  # Compute
  app_server:
    type: OS::Nova::Server
    depends_on: router_interface
    properties:
      name: app-server
      image: { get_param: image }
      flavor: { get_param: flavor }
      key_name: { get_param: key_name }
      networks:
        - network: { get_resource: app_network }
      security_groups:
        - { get_resource: app_secgroup }

  # Storage
  app_volume:
    type: OS::Cinder::Volume
    properties:
      size: 50
      description: Application data volume

  volume_attach:
    type: OS::Cinder::VolumeAttachment
    properties:
      instance_uuid: { get_resource: app_server }
      volume_id: { get_resource: app_volume }

  # Floating IP
  app_floating_ip:
    type: OS::Neutron::FloatingIP
    properties:
      floating_network: external-network
      port_id: { get_attr: [app_server, addresses, app-network, 0, port] }

outputs:
  instance_ip:
    description: Floating IP address
    value: { get_attr: [app_floating_ip, floating_ip_address] }
  volume_id:
    description: Data volume ID
    value: { get_resource: app_volume }
```

### Template Functions

| Function | Purpose | Example |
|---|---|---|
| `get_resource` | Reference another resource in the template | `{ get_resource: app_network }` |
| `get_param` | Reference a template parameter | `{ get_param: image }` |
| `get_attr` | Get an attribute of a created resource | `{ get_attr: [server, first_address] }` |
| `str_replace` | String substitution | `{ str_replace: { template: "Hello $name", params: { $name: World } } }` |
| `list_join` | Join list elements | `{ list_join: [",", [a, b, c]] }` |

---

## 11. Stack Lifecycle Management

### Stack Operations

| Operation | Command | Effect |
|---|---|---|
| Create | `openstack stack create -t template.yaml stack-name` | Creates all resources in dependency order |
| Update | `openstack stack update -t template-v2.yaml stack-name` | Modifies resources to match new template |
| Delete | `openstack stack delete stack-name` | Deletes all resources in reverse dependency order |
| Suspend | `openstack stack suspend stack-name` | Pauses all instances (preserves state) |
| Resume | `openstack stack resume stack-name` | Resumes suspended instances |
| Show | `openstack stack show stack-name` | Display stack status and outputs |

### Dependency Resolution

Heat automatically resolves resource dependencies through two mechanisms [21]:

1. **Implicit dependencies:** When a resource references another via `get_resource` or `get_attr`, Heat infers the dependency
2. **Explicit dependencies:** The `depends_on` property explicitly declares that a resource must wait for another

```
HEAT DEPENDENCY RESOLUTION
================================================================

  app_network
       |
  app_subnet  (implicit: references app_network)
       |
  router_interface  (implicit: references app_subnet + app_router)
       |
  app_server  (explicit: depends_on router_interface)
       |
  volume_attach  (implicit: references app_server + app_volume)
       |
  app_floating_ip  (implicit: references app_server)

  Parallel creation where possible:
    app_network + app_router + app_secgroup + app_volume (parallel)
    --> app_subnet (after network)
    --> router_interface (after subnet + router)
    --> app_server (after router_interface)
    --> volume_attach + floating_ip (after server)
```

### Heat vs. Other Orchestration Tools

| Tool | Scope | Format | Relationship to Heat |
|---|---|---|---|
| Heat | OpenStack resources | YAML (HOT) | Native OpenStack orchestration |
| Terraform | Multi-cloud resources | HCL | Uses OpenStack provider for Heat-equivalent ops |
| Ansible | Any system (imperative) | YAML playbooks | Kolla-Ansible uses Ansible to deploy Heat |
| CloudFormation | AWS only | JSON/YAML | Heat was inspired by CloudFormation's approach |
| Kubernetes | Container workloads | YAML manifests | Complementary: Kubernetes runs ON OpenStack |

Heat templates are the OpenStack-native IaC (Infrastructure as Code) tool. Understanding HOT means understanding the declarative orchestration pattern used by every cloud platform [22].

---

## 12. Cross-References

> **Related:** [OpenStack Architecture](01-openstack-architecture.md) -- Neutron and Heat as core services. [IaaS Self-Hosting & Ceph](03-iaas-self-hosting.md) -- storage network design considerations. [Cloud Comparison](05-cloud-comparison-sovereignty.md) -- Neutron vs. AWS VPC vs. Azure VNet comparison.

**Series cross-references:**
- **K8S (Kubernetes):** CNI plugins implement the same overlay networking patterns as Neutron
- **SYS (Systems Administration):** Physical network configuration, switch management, VLAN provisioning
- **NND (Neural Network Design):** Network bandwidth considerations for distributed training
- **OCN (Ocean Computing):** VXLAN overlay patterns in distributed systems
- **GSD2 (GSD Methodology):** Heat templates as executable specifications of infrastructure intent
- **ACE (Architecture Engineering):** Network architecture patterns and trade study methodology
- **CMH (Command History):** Template version control and change management

---

## 13. Sources

1. OpenStack Documentation. "Neutron Architecture." docs.openstack.org/neutron/latest/admin/intro-os-networking.html, 2024.
2. OpenStack Documentation. "ML2 Plugin." docs.openstack.org/neutron/latest/admin/config-ml2.html, 2024.
3. OpenStack Documentation. "OVN Deployment." docs.openstack.org/neutron/latest/admin/ovn/index.html, 2024.
4. Open vSwitch Documentation. "Open vSwitch with Neutron." docs.openvswitch.org, 2024.
5. OVN Documentation. "OVN Architecture." docs.ovn.org/en/latest/ref/ovn-architecture.7.html, 2024.
6. Kolla-Ansible Documentation. "Neutron Configuration." docs.openstack.org/kolla-ansible/latest/reference/networking/neutron.html, 2024.
7. OpenStack Security Guide. "Tenant Network Isolation." docs.openstack.org/security-guide/networking/services-security.html, 2024.
8. IETF. "Virtual eXtensible Local Area Network (VXLAN)." RFC 7348, 2014.
9. OpenStack Documentation. "Security Groups." docs.openstack.org/neutron/latest/admin/archives/config-security-groups.html, 2024.
10. OpenStack Documentation. "Neutron Security Groups -- Implementation Details." docs.openstack.org/neutron/latest/admin/config-ovsfwdriver.html, 2024.
11. OpenStack Documentation. "Floating IP Addresses." docs.openstack.org/neutron/latest/admin/config-dns-res.html, 2024.
12. OpenStack Operations Guide. "Network Troubleshooting." docs.openstack.org/ops-guide/ops-network-troubleshooting.html, 2024.
13. OpenStack Documentation. "Provider Networks." docs.openstack.org/neutron/latest/admin/config-provider-networks.html, 2024.
14. OpenStack Documentation. "DHCP Agent." docs.openstack.org/neutron/latest/admin/config-dhcp-ha.html, 2024.
15. OpenStack Documentation. "Metadata Service." docs.openstack.org/nova/latest/admin/metadata-service.html, 2024.
16. Canonical. "Cloud-init Documentation." cloudinit.readthedocs.io, 2024.
17. OpenStack HA Guide. "Network Architecture." docs.openstack.org/ha-guide/networking-ha.html, 2024.
18. OpenStack Documentation. "Heat Architecture." docs.openstack.org/heat/latest/developing_guides/architecture.html, 2024.
19. OpenStack Documentation. "Heat Orchestration Template (HOT) Guide." docs.openstack.org/heat/latest/template_guide/hot_guide.html, 2024.
20. OpenStack Documentation. "HOT Specification." docs.openstack.org/heat/latest/template_guide/hot_spec.html, 2024.
21. OpenStack Documentation. "Heat Resource Dependencies." docs.openstack.org/heat/latest/template_guide/hot_spec.html#depends-on, 2024.
22. Morris, K. *Infrastructure as Code*. 2nd ed. O'Reilly Media, 2020.

---

*OpenStack Cloud Platform -- Module 4: Networking & Orchestration. The network you can describe in a template is the network you can reproduce, verify, and trust. Everything else is a configuration you hope is still correct.*

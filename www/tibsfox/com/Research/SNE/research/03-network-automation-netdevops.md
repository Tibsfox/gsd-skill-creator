# Network Automation & NetDevOps

> **Domain:** Network Configuration Management, Model-Driven Programmability, and CI/CD for Infrastructure
> **Module:** 3 -- Automation Frameworks, Data Models, Streaming Telemetry, and the NetDevOps Pipeline
> **Through-line:** *A network configured by hand is a network that cannot explain itself. Every CLI session is an unversioned, unreviewed, untested change to production infrastructure. The transformation from CLI to API is not a tooling upgrade -- it is the adoption of software engineering discipline in a domain that has historically operated without it. YANG models are the schema. NETCONF and gNMI are the transport. Ansible, NAPALM, and Nornir are the execution engines. Git is the audit trail. Batfish is the compiler. Together they form the stack that makes network changes as reviewable, testable, and reversible as application code.*

---

## Table of Contents

1. [The CLI-to-API Transformation](#1-the-cli-to-api-transformation)
2. [Ansible for Network Automation](#2-ansible-for-network-automation)
3. [NAPALM: Vendor Abstraction Layer](#3-napalm-vendor-abstraction-layer)
4. [Nornir: Python-Native Automation](#4-nornir-python-native-automation)
5. [Tool Comparison: Ansible vs NAPALM vs Nornir](#5-tool-comparison-ansible-vs-napalm-vs-nornir)
6. [YANG Data Models](#6-yang-data-models)
7. [NETCONF and RESTCONF](#7-netconf-and-restconf)
8. [gNMI and Streaming Telemetry](#8-gnmi-and-streaming-telemetry)
9. [Network CI/CD Pipelines](#9-network-cicd-pipelines)
10. [Config Drift Detection and Remediation](#10-config-drift-detection-and-remediation)
11. [Batfish: Pre-Deployment Verification](#11-batfish-pre-deployment-verification)
12. [Intent-Based Networking](#12-intent-based-networking)
13. [Source of Truth: NetBox and Nautobot](#13-source-of-truth-netbox-and-nautobot)
14. [Infrastructure as Code for Networks](#14-infrastructure-as-code-for-networks)
15. [The Complete NetDevOps Pipeline](#15-the-complete-netdevops-pipeline)
16. [Cross-References](#16-cross-references)
17. [Sources](#17-sources)

---

## 1. The CLI-to-API Transformation

For decades, network engineers configured devices by typing commands into a serial console or SSH session. Each vendor had its own syntax. Cisco IOS commands bore no resemblance to Juniper JunOS commands. Configuration changes were made live, in production, one device at a time, with no version control, no peer review, and no rollback mechanism beyond the engineer's memory of what was changed [1].

The CLI-to-API transformation is the fundamental shift underlying everything in this module. It is not merely a change in tooling -- it is the application of software engineering principles to network operations.

### What Changed

```
THE CLI-TO-API TRANSFORMATION
================================================================

  BEFORE (CLI Era)                    AFTER (API Era)
  +----------------------+            +----------------------+
  | SSH to each device   |            | API call to each     |
  | Type commands        |            |   device or controller|
  | Hope syntax is right |            | Structured data in   |
  | No version control   |            | Version-controlled   |
  | No peer review       |            | Peer-reviewed configs|
  | No pre-deploy test   |            | Pre-deploy validated |
  | Rollback = memory    |            | Rollback = git revert|
  +----------------------+            +----------------------+

  Key enablers:
    YANG models    --> Structured schema for configuration
    NETCONF/gNMI   --> Programmatic transport protocols
    Ansible/Nornir --> Execution frameworks
    NAPALM         --> Vendor abstraction
    Git            --> Version control + audit trail
    Batfish        --> Pre-deployment verification
    NetBox         --> Source of truth
```

The transformation happened in stages. First came screen-scraping tools like Expect and RANCID that automated CLI interactions but still treated device output as unstructured text. Then came SNMP for monitoring (but not configuration). NETCONF (RFC 4741, 2006; revised RFC 6241, 2011) introduced structured, transactional configuration management. OpenConfig brought vendor-neutral YANG models. gNMI added high-performance streaming telemetry. Each layer built on the previous one, but the destination was always the same: network configuration as structured, versioned, testable data [2].

### The Three Layers

| Layer | Old World | New World | Standard |
|---|---|---|---|
| Data model | Vendor CLI syntax | YANG models (RFC 7950) | OpenConfig, IETF, vendor-native |
| Transport | SSH + screen scrape | NETCONF, RESTCONF, gNMI | RFC 6241, RFC 8040, OpenConfig gNMI |
| Execution | Manual typing | Ansible, Nornir, NAPALM | Community frameworks |

---

## 2. Ansible for Network Automation

Ansible is the most widely adopted automation framework in network operations. Its appeal lies in the low barrier to entry -- playbooks are written in YAML, not Python -- and in its agentless architecture, which requires no software installation on managed devices. For network devices that cannot run agents (switches, routers, firewalls), this is a critical requirement [3].

### Connection Plugins

Network devices do not run Ansible agents. Instead, Ansible uses connection plugins that speak the device's native management protocol:

| Connection Plugin | Protocol | Devices | Use Case |
|---|---|---|---|
| `network_cli` | SSH | Cisco IOS/IOS-XE, Arista EOS, Juniper JunOS | CLI-based configuration and show commands |
| `netconf` | NETCONF over SSH | Juniper JunOS, Cisco IOS-XR, Nokia SR-OS | Structured config with YANG models |
| `httpapi` | REST/HTTP | Arista EOS (eAPI), Cisco NX-OS (NX-API) | API-based devices |
| `local` | SSH (from control node) | Legacy devices | Fallback for unsupported platforms |

### Platform-Specific Modules

Each vendor platform has a dedicated Ansible collection with modules tailored to that platform's capabilities:

```yaml
# Cisco IOS -- cisco.ios collection
- name: Configure interface on IOS device
  cisco.ios.ios_config:
    lines:
      - description Uplink to Core
      - ip address 10.0.1.1 255.255.255.0
      - no shutdown
    parents: interface GigabitEthernet0/1

# Arista EOS -- arista.eos collection
- name: Configure BGP on EOS device
  arista.eos.eos_bgp_global:
    config:
      as_number: "65001"
      router_id: 10.0.0.1

# Juniper JunOS -- junipernetworks.junos collection
- name: Configure interface on JunOS device
  junipernetworks.junos.junos_config:
    lines:
      - set interfaces ge-0/0/0 unit 0 family inet address 10.0.1.1/24
    comment: "Configured by Ansible"
    confirm: 2
```

### Platform-Agnostic Modules

The `ansible.netcommon` collection provides platform-independent modules that work across any device supporting `network_cli`:

```yaml
# Works on IOS, EOS, JunOS, NX-OS -- any network_cli device
- name: Run show command on any platform
  ansible.netcommon.cli_command:
    command: show version

- name: Push config lines to any platform
  ansible.netcommon.cli_config:
    config: |
      interface Loopback0
       ip address 10.255.0.1 255.255.255.255
```

### Network Automation Patterns in Ansible

| Pattern | Module | Purpose |
|---|---|---|
| Config push | `ios_config`, `eos_config`, `junos_config` | Deploy configuration snippets |
| Config replace | `junos_config` with `src` and `replace: override` | Full config replacement |
| Fact gathering | `ios_facts`, `eos_facts`, `junos_facts` | Collect device state |
| Backup | `ios_config` with `backup: yes` | Save running config before changes |
| Compliance check | `assert` module with facts | Verify expected state |
| Template rendering | `template` + `ios_config` | Generate config from Jinja2 templates |

---

## 3. NAPALM: Vendor Abstraction Layer

NAPALM (Network Automation and Programmability Abstraction Layer with Multivendor support) is a Python library that provides a unified API across multiple vendor platforms. Where Ansible requires platform-specific modules (ios_config vs eos_config vs junos_config), NAPALM presents a single interface regardless of the underlying device [4].

### Supported Platforms

| Driver | Vendor | Transport | Status |
|---|---|---|---|
| `eos` | Arista EOS | eAPI (HTTP) | Full support |
| `junos` | Juniper JunOS | NETCONF | Full support |
| `ios` | Cisco IOS/IOS-XE | SSH (Netmiko) | Full support |
| `iosxr` | Cisco IOS-XR | XML agent | Full support (legacy) / NETCONF (modern) |
| `nxos` | Cisco NX-OS | NX-API (HTTP) | Full support |
| `nxos_ssh` | Cisco NX-OS | SSH | SSH fallback |

### The NAPALM Workflow

NAPALM's power lies in its configuration management workflow: load, compare, commit, rollback. This mirrors the transactional model of Juniper JunOS but extends it to platforms (like Cisco IOS) that do not natively support it [5].

```
NAPALM CONFIGURATION WORKFLOW
================================================================

  1. CONNECT             2. LOAD CANDIDATE
  +----------+           +------------------+
  | driver   |           | load_merge_      |
  | .open()  |---------->| candidate()      |
  |          |           |   or             |
  +----------+           | load_replace_    |
                         | candidate()      |
                         +--------+---------+
                                  |
  3. COMPARE              4a. COMMIT          4b. DISCARD
  +-----------+           +----------+        +----------+
  | compare_  |---------->| commit_  |   or   | discard_ |
  | config()  |           | config() |        | config() |
  | (diff)    |           |          |        |          |
  +-----------+           +----------+        +----------+
                                  |
                          5. ROLLBACK (if needed)
                          +----------+
                          | rollback |
                          +----------+
```

### Code Example

```python
from napalm import get_network_driver

# Connect to device
driver = get_network_driver("eos")
device = driver("10.0.1.1", "admin", "password")
device.open()

# Load candidate configuration (merge mode)
device.load_merge_candidate(
    config="interface Loopback100\n ip address 10.255.100.1/32"
)

# Review the diff before committing
diff = device.compare_config()
print(diff)
# +interface Loopback100
# + ip address 10.255.100.1/32

# Commit if diff looks correct
if diff:
    device.commit_config()
else:
    device.discard_config()

# Getter methods -- same API regardless of vendor
facts = device.get_facts()
interfaces = device.get_interfaces()
bgp_neighbors = device.get_bgp_neighbors()
arp_table = device.get_arp_table()

device.close()
```

### NAPALM Getter Methods

| Method | Returns | Cross-Vendor |
|---|---|---|
| `get_facts()` | Hostname, vendor, model, OS version, serial, uptime | Yes |
| `get_interfaces()` | Interface list with speed, status, MAC, description | Yes |
| `get_bgp_neighbors()` | BGP peer state, AS number, received prefixes | Yes |
| `get_lldp_neighbors()` | LLDP adjacency table | Yes |
| `get_arp_table()` | ARP entries (MAC to IP mappings) | Yes |
| `get_route_to()` | Routing table lookup for specific prefix | Yes |
| `get_config()` | Running, startup, and candidate configurations | Yes |

---

## 4. Nornir: Python-Native Automation

Nornir is a pure Python automation framework built by the same team that created NAPALM and Netmiko. Where Ansible uses YAML playbooks and a domain-specific language, Nornir uses Python directly. This makes it dramatically faster (benchmarks show 100x speedup over Ansible for large inventories) and gives engineers full access to Python's ecosystem for complex logic, error handling, and data manipulation [6].

### Architecture

```
NORNIR ARCHITECTURE
================================================================

  Inventory                     Task Execution
  +-----------+                 +---------------------------+
  | hosts.yaml|                 | ThreadedRunner            |
  | groups.yaml|  -------->     | (num_workers=20)          |
  | defaults.yaml|              |                           |
  +-----------+                 |  Host 1 --> Task --> Result|
                                |  Host 2 --> Task --> Result|
  Or: NetBox plugin             |  Host 3 --> Task --> Result|
  Or: Ansible inventory         |  ...                      |
  Or: Custom inventory          |  Host N --> Task --> Result|
                                +---------------------------+
                                          |
                                  AggregatedResult
                                  (per-host results)
```

### Code Example

```python
from nornir import InitNornir
from nornir_netmiko.tasks import netmiko_send_command
from nornir_napalm.plugins.tasks import napalm_get
from nornir_utils.plugins.functions import print_result

# Initialize Nornir with inventory
nr = InitNornir(
    runner={"plugin": "threaded", "options": {"num_workers": 20}},
    inventory={
        "plugin": "SimpleInventory",
        "options": {
            "host_file": "inventory/hosts.yaml",
            "group_file": "inventory/groups.yaml",
        },
    },
)

# Filter inventory to specific devices
spine_switches = nr.filter(role="spine")

# Run a task across all filtered hosts (parallel)
result = spine_switches.run(
    task=netmiko_send_command,
    command_string="show ip bgp summary",
)
print_result(result)

# Use NAPALM through Nornir for vendor-abstracted getters
facts = nr.run(task=napalm_get, getters=["get_facts", "get_interfaces"])
print_result(facts)
```

### Inventory Format

```yaml
# hosts.yaml
spine-01:
  hostname: 10.0.0.1
  platform: eos
  groups:
    - spine
  data:
    site: dc1
    role: spine

leaf-01:
  hostname: 10.0.0.11
  platform: ios
  groups:
    - leaf
  data:
    site: dc1
    role: leaf

# groups.yaml
spine:
  data:
    asn: 65000
leaf:
  data:
    asn: 65001

# defaults.yaml
username: admin
password: secret
```

### Key Nornir Plugins

| Plugin | Purpose |
|---|---|
| `nornir_netmiko` | SSH-based CLI interaction (send commands, send config) |
| `nornir_napalm` | NAPALM integration (getters, config management) |
| `nornir_scrapli` | Modern SSH/Telnet library with structured output |
| `nornir_utils` | Utility functions (print_result, load_yaml) |
| `nornir_jinja2` | Jinja2 template rendering for config generation |
| `nornir_netbox` | NetBox inventory plugin |

---

## 5. Tool Comparison: Ansible vs NAPALM vs Nornir

| Dimension | Ansible | NAPALM | Nornir |
|---|---|---|---|
| **Language** | YAML playbooks (DSL) | Python library | Python framework |
| **Learning curve** | Low (YAML only) | Medium (Python) | Medium-High (Python + framework) |
| **Performance** | Slow (serial by default, forks for parallel) | Single-device library | Fast (native multi-threading) |
| **Vendor support** | Broadest (hundreds of modules) | 6 core drivers + community | Uses NAPALM/Netmiko drivers |
| **Complex logic** | Painful (Jinja2 filters, register/when) | Natural Python | Natural Python |
| **Error handling** | `ignore_errors`, `rescue` blocks | try/except | try/except with Result objects |
| **State management** | Some modules are idempotent | Merge/replace/compare | Developer-managed |
| **Scalability** | Hundreds of devices | Single device per call | Thousands of devices (threaded) |
| **Best for** | Teams starting automation, mixed skill levels | Multi-vendor abstraction | Python shops, large-scale ops |
| **Commercial support** | Red Hat (AAP/Tower) | Community only | Community only |

### When to Use Each

```
TOOL SELECTION DECISION TREE
================================================================

  Starting network automation?
    |
    +-- Team knows Python? --------> Nornir + NAPALM
    |
    +-- Team knows YAML only? -----> Ansible
    |
    +-- Multi-vendor environment? --> NAPALM (as library or via Ansible/Nornir)
    |
    +-- Need speed at scale? -------> Nornir (100x faster than Ansible)
    |
    +-- Need commercial support? ---> Ansible (Red Hat AAP)
    |
    +-- Complex conditional logic? -> Nornir (native Python)
    |
    +-- Quick prototyping? ---------> NAPALM directly in Python
```

The most effective approach for mature organizations is a hybrid: Nornir as the execution framework, NAPALM as the vendor abstraction layer, and Jinja2 templates for config generation. Ansible remains valuable for organizations where the network team does not write Python, or where integration with Red Hat Ansible Automation Platform provides organizational value [7].

---

## 6. YANG Data Models

YANG (Yet Another Next Generation, RFC 7950) is a data modeling language used to model configuration and state data manipulated by NETCONF, RESTCONF, and gNMI. YANG is to network configuration what a database schema is to application data -- it defines the structure, constraints, types, and relationships of every configurable parameter [8].

### YANG Model Families

Three families of YANG models coexist in production networks:

| Family | Source | Scope | Interoperability |
|---|---|---|---|
| **OpenConfig** | Network operators (Google, AT&T, Microsoft) | Vendor-neutral, operationally focused | High -- same model works across vendors |
| **IETF** | IETF working groups | Standards-track, protocol-focused | High -- standards compliant |
| **Vendor-native** | Cisco, Juniper, Arista, etc. | Full vendor feature coverage | None -- vendor-specific |

### Model Structure

```
YANG MODEL HIERARCHY (OpenConfig BGP Example)
================================================================

  openconfig-bgp
  +-- bgp
      +-- global
      |   +-- config
      |   |   +-- as           (uint32)
      |   |   +-- router-id    (inet:ipv4-address)
      |   +-- state
      |       +-- as           (uint32)  [read-only]
      |       +-- router-id    (inet:ipv4-address)  [read-only]
      |       +-- total-paths  (uint32)  [read-only]
      +-- neighbors
          +-- neighbor [neighbor-address]
              +-- config
              |   +-- neighbor-address  (inet:ip-address)
              |   +-- peer-as           (uint32)
              |   +-- description       (string)
              +-- state
              |   +-- session-state  (enumeration)
              |   +-- established-transitions  (counter64)
              +-- timers
                  +-- config
                      +-- hold-time       (decimal64)
                      +-- keepalive-interval (decimal64)
```

The separation between `config` (read-write) and `state` (read-only) containers is a fundamental YANG design principle. Configuration is what the operator intends. State is what the device reports. Comparing the two reveals drift [9].

### Why Three Model Families

The choice of YANG model family is a pragmatic decision:

- **OpenConfig models** provide interoperability across vendors but may not cover every vendor-specific feature. Use them when operating a multi-vendor environment and consistency matters more than feature completeness.
- **IETF models** are standards-track and provide the most rigorous definitions, but are often more abstract than operational teams prefer.
- **Vendor-native models** cover 100% of a vendor's features but lock automation code to a single vendor. Use them when a feature is not available in OpenConfig or IETF models.

Modern Cisco IOS-XE, IOS-XR, and NX-OS devices ship with all three model families. Juniper JunOS supports OpenConfig and Juniper-native models. Arista EOS supports OpenConfig and Arista-native models [10].

---

## 7. NETCONF and RESTCONF

NETCONF and RESTCONF are the transport protocols that carry YANG-modeled data between the automation system and the network device. They are to YANG what HTTP is to HTML -- the delivery mechanism [11].

### NETCONF (RFC 6241)

NETCONF uses SSH as transport and XML as encoding. It provides transactional configuration management with features that SNMP never had: candidate datastores, commit/rollback, configuration locking, and fine-grained filtering.

```
NETCONF PROTOCOL STACK
================================================================

  +-------------------+
  | Content           |  YANG-modeled configuration and state data
  +-------------------+
  | Operations        |  get, get-config, edit-config, copy-config,
  |                   |  delete-config, lock, unlock, close-session,
  |                   |  kill-session, commit, discard-changes
  +-------------------+
  | Messages          |  <rpc>, <rpc-reply>, <notification>
  +-------------------+
  | Transport         |  SSH (port 830)
  +-------------------+
```

### RESTCONF (RFC 8040)

RESTCONF maps NETCONF operations onto HTTP methods, making network device data accessible through standard REST APIs. It uses the same YANG models as NETCONF but trades transactional power for HTTP simplicity.

| HTTP Method | NETCONF Equivalent | Purpose |
|---|---|---|
| GET | `<get>`, `<get-config>` | Retrieve configuration or state |
| POST | `<edit-config>` (create) | Create a new resource |
| PUT | `<edit-config>` (replace) | Create or replace a resource |
| PATCH | `<edit-config>` (merge) | Merge configuration changes |
| DELETE | `<edit-config>` (delete) | Delete a resource |

### NETCONF vs RESTCONF Comparison

| Feature | NETCONF | RESTCONF |
|---|---|---|
| Transport | SSH (port 830) | HTTPS (port 443) |
| Encoding | XML | XML or JSON |
| Candidate datastore | Yes | No |
| Commit/rollback | Yes | No |
| Config locking | Yes | No |
| Subtree filtering | Yes (XPath) | Yes (query params) |
| Streaming notifications | Yes | No (use gNMI instead) |
| Firewall friendly | Requires SSH | Standard HTTPS |
| Tooling | ncclient (Python), NETCONF console | curl, Postman, any HTTP client |

**Recommendation:** Use NETCONF when transactional safety matters -- configuration changes that must be atomic, committed as a unit, and rolled back on failure. Use RESTCONF for lightweight queries, dashboard integrations, and environments where HTTP is the preferred integration protocol. For streaming telemetry, use gNMI [12].

---

## 8. gNMI and Streaming Telemetry

gNMI (gRPC Network Management Interface) is the newest addition to the model-driven management stack. Developed by the OpenConfig consortium, it uses gRPC (Google Remote Procedure Call) as transport and Protocol Buffers for encoding, providing significantly higher performance than NETCONF's XML-over-SSH [13].

### Why gNMI Exists

SNMP polling at 5-minute intervals cannot detect a 30-second micro-loop. NETCONF can retrieve state data but requires explicit requests. gNMI introduces streaming telemetry -- the device pushes state changes to the collector in real time, the moment they happen [14].

```
TELEMETRY EVOLUTION
================================================================

  SNMP Polling (legacy)           gNMI Streaming (modern)
  +-----------------+             +-------------------+
  | NMS polls every |             | Device streams    |
  | 5 minutes       |             | on change or at   |
  | "What is your   |             | fixed intervals   |
  |  interface       |             |                   |
  |  utilization?"  |             | "My interface     |
  |                 |             |  utilization just  |
  | Miss events     |             |  changed to 87%"  |
  | between polls   |             |                   |
  +-----------------+             +-------------------+

  gNMI Subscription Modes:
    SAMPLE   -- device sends data at fixed intervals (e.g., every 10s)
    ON_CHANGE -- device sends data only when value changes
    TARGET_DEFINED -- device chooses optimal mode per path
```

### gNMI Operations

| RPC | Purpose | Analogy |
|---|---|---|
| `Get` | Retrieve current state | NETCONF `<get>` |
| `Set` | Modify configuration (update, replace, delete) | NETCONF `<edit-config>` |
| `Subscribe` | Stream telemetry data | No NETCONF equivalent |
| `Capabilities` | Query supported models and encodings | NETCONF `<hello>` |

### gNMI Tooling

| Tool | Purpose | Source |
|---|---|---|
| `gnmic` | CLI client for gNMI (get, set, subscribe) | OpenConfig community |
| `gnmi-gateway` | Telemetry gateway (Netflix open source) | Netflix |
| `Telegraf` | Telemetry collector with gNMI input plugin | InfluxData |
| `pipeline` | Cisco's telemetry collector | Cisco |

The typical telemetry pipeline: gNMI streams from devices to a collector (gnmic, Telegraf, or pipeline), which writes to a time-series database (InfluxDB, Prometheus, or TimescaleDB), which feeds dashboards (Grafana) and alerting (Alertmanager) [15].

---

## 9. Network CI/CD Pipelines

Applying CI/CD to network configuration is the operational core of NetDevOps. The principle is identical to software CI/CD: every change is version-controlled, peer-reviewed, automatically tested, and deployed through a pipeline -- never applied directly to production by a human [16].

### Pipeline Architecture

```
NETWORK CI/CD PIPELINE
================================================================

  Developer workstation         Git repository         CI/CD platform
  +------------------+         +-----------+          +------------------+
  | Edit config      |         | main      |          | GitLab CI /      |
  | template or      |-------->| branch    |--------->| GitHub Actions   |
  | YANG data        |  push   | (protected)|  trigger|                  |
  +------------------+         +-----------+          +--------+---------+
                                                               |
  STAGE 1: LINT                                                |
  +------------------------------------------------------------+
  | yamllint, ansible-lint, pylint                             |
  | Syntax validation of templates and data files              |
  +------------------------------------------------------------+
           |
  STAGE 2: VALIDATE (offline)
  +------------------------------------------------------------+
  | Batfish: build network model, check reachability           |
  | YANG validation: pyang --lint on YANG modules              |
  | Template rendering: generate configs, verify syntax        |
  +------------------------------------------------------------+
           |
  STAGE 3: TEST (lab/staging)
  +------------------------------------------------------------+
  | Deploy to lab/staging network (Containerlab, GNS3, EVE-NG) |
  | Run connectivity tests, BGP session verification           |
  | Compare expected vs actual state                           |
  +------------------------------------------------------------+
           |
  STAGE 4: APPROVE
  +------------------------------------------------------------+
  | Merge request review by senior engineer                    |
  | Change advisory board approval (for production)            |
  +------------------------------------------------------------+
           |
  STAGE 5: DEPLOY
  +------------------------------------------------------------+
  | Ansible/Nornir pushes config to production devices         |
  | Canary deployment: one device first, verify, then fleet    |
  | Automatic rollback on failure                              |
  +------------------------------------------------------------+
           |
  STAGE 6: VERIFY
  +------------------------------------------------------------+
  | Post-deployment validation: BGP sessions up, interfaces up |
  | Telemetry check: no anomalies in gNMI streams              |
  | Smoke tests: end-to-end reachability confirmed             |
  +------------------------------------------------------------+
```

### GitHub Actions Example

```yaml
# .github/workflows/network-deploy.yml
name: Network Configuration Pipeline

on:
  push:
    branches: [main]
    paths: ['network-configs/**', 'templates/**']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Lint YAML configs
        run: yamllint network-configs/
      - name: Lint Ansible playbooks
        run: ansible-lint playbooks/

  validate:
    needs: lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Start Batfish
        run: docker run -d -p 9997:9997 -p 9996:9996 batfish/batfish
      - name: Run Batfish analysis
        run: python scripts/batfish_validate.py
      - name: Validate YANG models
        run: pyang --lint yang-models/*.yang

  deploy-staging:
    needs: validate
    runs-on: self-hosted
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to staging
        run: ansible-playbook -i inventory/staging playbooks/deploy.yml
      - name: Verify staging
        run: python scripts/verify_deployment.py --env staging

  deploy-production:
    needs: deploy-staging
    runs-on: self-hosted
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production (canary)
        run: ansible-playbook -i inventory/prod playbooks/deploy.yml --limit canary
      - name: Verify canary
        run: python scripts/verify_deployment.py --env prod --scope canary
      - name: Deploy to production (fleet)
        run: ansible-playbook -i inventory/prod playbooks/deploy.yml
      - name: Post-deployment verification
        run: python scripts/verify_deployment.py --env prod --scope full
```

### Network Lab Environments for CI/CD

Testing network changes against real hardware is expensive and slow. Virtual and containerized network labs provide the testing environment:

| Platform | Type | Use Case | Cost |
|---|---|---|---|
| Containerlab | Container-based | Fast CI/CD testing, vendor container images | Free (open source) |
| GNS3 | Emulation | Complex topologies, vendor image support | Free (open source) |
| EVE-NG | Emulation | Enterprise lab, multiple vendors | Free community / paid pro |
| CML (Cisco) | Emulation | Cisco-specific testing | Licensed |

Containerlab has become the standard for CI/CD integration because containers start in seconds, can be defined as code (topology YAML files), and integrate naturally with GitHub Actions and GitLab CI runners [17].

---

## 10. Config Drift Detection and Remediation

Configuration drift occurs when the actual state of a network device diverges from the intended state defined in the source of truth. Drift happens through emergency CLI changes, failed partial deployments, firmware upgrades that reset defaults, or simply the passage of time as manual changes accumulate [18].

### Detection Methods

| Method | How It Works | Tools |
|---|---|---|
| **Periodic pull and diff** | Retrieve running configs, compare to golden configs in Git | NAPALM `compare_config()`, RANCID, Oxidized |
| **Event-driven** | React to syslog/SNMP traps indicating config change | Event-Driven Ansible, StackStorm |
| **Continuous telemetry** | gNMI subscriptions on configuration paths | gnmic, Telegraf |
| **Source-of-truth comparison** | Compare device state to NetBox/Nautobot intended state | NetBox Assurance, Nautobot Golden Config |

### Remediation Strategies

```
CONFIG DRIFT REMEDIATION
================================================================

  Intended State (Git + NetBox)      Actual State (Device)
  +---------------------------+      +---------------------------+
  | interface Loopback0       |      | interface Loopback0       |
  |  ip address 10.0.0.1/32  |      |  ip address 10.0.0.1/32  |
  |                           |      |                           |
  | interface Loopback99      |      | (missing -- drift!)       |
  |  ip address 10.99.0.1/32 |      |                           |
  |                           |      |                           |
  | ntp server 10.0.0.100    |      | ntp server 10.0.0.200    |
  |                           |      |  (wrong server -- drift!)|
  +---------------------------+      +---------------------------+

  Remediation options:
    1. AUTO-REMEDIATE: Push intended config to device (risky if
       the drift was intentional emergency change)
    2. ALERT + MANUAL: Notify engineer, create ticket, human decides
    3. RECONCILE: Update source of truth to match device
       (if drift was a valid emergency change)
```

NetBox Labs launched NetBox Assurance in 2025, providing purpose-built drift detection for network infrastructure. The Nautobot ecosystem offers the Golden Config app, which stores intended configurations, retrieves actual configurations, generates compliance reports, and can push remediation [19].

---

## 11. Batfish: Pre-Deployment Verification

Batfish is a network configuration analysis tool that builds a mathematical model of network behavior from device configuration files. It can answer questions about reachability, routing, ACLs, and failure scenarios without touching a live network. It is the network equivalent of a compiler -- it finds errors before deployment [20].

### How Batfish Works

```
BATFISH ANALYSIS PIPELINE
================================================================

  1. SNAPSHOT                    2. MODEL
  +------------------+          +------------------+
  | Upload device    |          | Batfish builds   |
  | configs to       |--------->| vendor-agnostic  |
  | Batfish server   |          | network model    |
  +------------------+          +--------+---------+
                                         |
  3. QUERY                       4. RESULT
  +------------------+          +------------------+
  | Ask questions    |          | Answers with     |
  | about network    |<-------->| traces, paths,   |
  | behavior         |          | violations       |
  +------------------+          +------------------+

  Example queries:
    - "Can 10.0.1.0/24 reach 10.0.2.0/24?"
    - "What happens if link between spine-01 and leaf-03 fails?"
    - "Which ACLs permit traffic from the internet to the database subnet?"
    - "Are there any undefined references in the configs?"
```

### Batfish Query Categories

| Category | Example Queries | Value |
|---|---|---|
| **Reachability** | Can host A reach host B? Through which path? | Verify connectivity before deploy |
| **Failure analysis** | What breaks if this link goes down? | Validate redundancy |
| **ACL analysis** | What does this ACL permit/deny? Any shadowed rules? | Security audit |
| **Routing** | What routes exist to this prefix? Which is preferred? | Validate route policy |
| **Config compliance** | Are all NTP servers configured? Any undefined references? | Compliance checking |
| **Diff analysis** | How does the new config change reachability? | Safe change validation |

### Integration with CI/CD

Batfish runs as a Docker container and provides a Python client (pybatfish). In a CI/CD pipeline, the validate stage uploads the proposed configuration snapshot, runs reachability and compliance queries, and fails the pipeline if any query returns violations. This catches routing loops, ACL misconfigurations, and reachability regressions before they reach production [21].

Batfish was acquired by AWS, signaling the industry's recognition that pre-deployment verification is a core requirement, not an optional luxury.

---

## 12. Intent-Based Networking

Intent-based networking (IBN) is the highest level of abstraction in network automation. Instead of specifying individual device configurations, the operator declares business intent ("these two applications must be able to communicate with 10ms latency and 99.99% availability") and the IBN system translates that intent into device-level configuration, deploys it, and continuously verifies that the network is meeting the stated intent [22].

### Major IBN Platforms

| Platform | Vendor | Domain | Approach |
|---|---|---|---|
| **Apstra** | Juniper (acquired 2021, now HPE/Juniper) | Data center fabric | Vendor-agnostic, graph-based model |
| **Cisco Catalyst Center** | Cisco (formerly DNA Center) | Campus/enterprise | Cisco-centric, policy-based |
| **Cisco Nexus Dashboard** | Cisco | Data center (ACI) | ACI fabric management |

### Apstra (Juniper/HPE)

Apstra represents the purest form of intent-based networking. Its operating system (AOS) is vendor-agnostic -- it can manage data center fabrics built from Juniper, Cisco, Arista, or SONiC switches. The operator defines the desired network topology (spine-leaf, 3-stage Clos), connectivity requirements, and policies. Apstra generates the device configurations, deploys them, and continuously validates that the network matches the intent through telemetry analysis [23].

### Cisco Catalyst Center

Cisco Catalyst Center (renamed from DNA Center in 2023) provides intent-based networking for campus and enterprise environments. It translates high-level policies into device configurations across Cisco's campus portfolio (Catalyst switches, wireless controllers, ISR/ASR routers). As of 2025, Cisco has added "AgenticOps" AI agents capable of autonomous troubleshooting and a natural-language interface for network policy definition [24].

### The IBN Closed Loop

```
INTENT-BASED NETWORKING CLOSED LOOP
================================================================

  1. INTENT                      2. TRANSLATION
  +------------------+          +------------------+
  | Business policy  |          | IBN platform     |
  | "App A must      |--------->| generates device |
  | reach App B      |          | configs for all  |
  | with < 10ms"     |          | relevant devices |
  +------------------+          +--------+---------+
                                         |
  4. VERIFICATION                3. ACTIVATION
  +------------------+          +------------------+
  | Continuous       |<---------| Push configs to  |
  | telemetry        |          | devices, validate|
  | confirms intent  |          | activation       |
  | is being met     |          +------------------+
  +--------+---------+
           |
  5. REMEDIATION (if drift detected)
  +------------------+
  | Auto-correct or  |
  | alert operator   |
  +------------------+
```

---

## 13. Source of Truth: NetBox and Nautobot

A source of truth (SoT) is the authoritative record of intended network state. Without it, automation has no reference point -- it cannot know what the network should look like, only what it currently looks like. NetBox and Nautobot are the two dominant open-source platforms for network source of truth [25].

### NetBox

NetBox, originally developed by DigitalOcean and now maintained by NetBox Labs, is the most widely deployed network source of truth. It provides IPAM (IP Address Management), DCIM (Data Center Infrastructure Management), and a comprehensive REST API that automation tools consume.

| Feature | Description |
|---|---|
| IPAM | IP prefixes, addresses, VLANs, VRFs, ASNs |
| DCIM | Sites, racks, devices, interfaces, cables, power |
| Circuits | Provider circuits, terminations |
| Virtualization | Clusters, virtual machines, VM interfaces |
| Tenancy | Tenant/customer assignment for multi-tenancy |
| Custom fields | Extensible data model for site-specific needs |
| REST API | Full CRUD API for automation integration |
| GraphQL | Flexible queries for complex data relationships |
| Webhooks | Event-driven integration with external systems |

### Nautobot

Nautobot, maintained by Network to Code, forked from NetBox in 2021 to focus on automation workflows and extensibility. While NetBox excels as a documentation-focused DCIM/IPAM tool, Nautobot positions itself as an automation platform with native Git integration, a plugin ecosystem, and Apps (formerly plugins) that extend its functionality [26].

### NetBox vs Nautobot

| Dimension | NetBox | Nautobot |
|---|---|---|
| **Focus** | DCIM/IPAM documentation | Automation platform |
| **Database** | PostgreSQL | PostgreSQL or MySQL |
| **API** | REST + GraphQL | REST + GraphQL |
| **Git integration** | External (via CI/CD) | Native (Git as data source) |
| **Plugin ecosystem** | Growing | Extensive (Golden Config, Firewall Models, SSoT) |
| **Commercial backing** | NetBox Labs | Network to Code |
| **Community** | Larger install base | Stronger automation focus |
| **Best for** | Teams needing IPAM/DCIM with API | Teams building full automation pipelines |

### The Source of Truth Pattern

```
SOURCE OF TRUTH IN THE AUTOMATION PIPELINE
================================================================

  NetBox / Nautobot (Source of Truth)
  +---------------------------------------------+
  | Intended state:                              |
  | - Device inventory (hostnames, IPs, roles)   |
  | - Interface assignments                      |
  | - VLAN allocations                          |
  | - IP address assignments                     |
  | - BGP peer relationships                     |
  | - Circuit provider information              |
  +----------------------+----------------------+
                         |
            REST API / GraphQL query
                         |
  +----------------------v----------------------+
  | Config Generator (Jinja2 templates)          |
  | Consumes SoT data, produces device configs   |
  +----------------------+----------------------+
                         |
  +----------------------v----------------------+
  | Automation Engine (Ansible / Nornir)         |
  | Deploys generated configs to devices         |
  +----------------------+----------------------+
                         |
  +----------------------v----------------------+
  | Validation (Batfish + telemetry)             |
  | Confirms actual state matches intended state |
  +---------------------------------------------+
```

---

## 14. Infrastructure as Code for Networks

Terraform, traditionally associated with cloud infrastructure, has expanded into network automation through vendor-specific providers. The approach treats network device configuration as declarative infrastructure definitions managed through the same Terraform workflow used for cloud resources [27].

### Network Terraform Providers

| Provider | Vendor | Manages | Registry |
|---|---|---|---|
| `CiscoDevNet/aci` | Cisco | ACI fabric (tenants, EPGs, contracts, BDs) | Verified |
| `CiscoDevNet/iosxe` | Cisco | IOS-XE devices (interfaces, routing, ACLs) | Verified |
| `CiscoDevNet/nxos` | Cisco | NX-OS devices | Verified |
| `CiscoDevNet/meraki` | Cisco | Meraki cloud-managed networks | Verified |
| `PaloAltoNetworks/panos` | Palo Alto | PAN-OS firewalls (security policies, NAT) | Verified |
| `Juniper/junos` | Juniper | JunOS devices (interfaces, routing, firewall) | Community |
| `Fortinet/fortios` | Fortinet | FortiGate firewalls | Community |

### Terraform vs Ansible for Networks

| Dimension | Terraform | Ansible |
|---|---|---|
| **Paradigm** | Declarative (desired state) | Procedural (task sequence) with declarative modules |
| **State management** | Explicit state file (terraform.tfstate) | No state file -- detects current state per run |
| **Plan before apply** | `terraform plan` shows changes | `--check` and `--diff` mode |
| **Rollback** | Apply previous state | Re-run previous playbook or NAPALM rollback |
| **Multi-vendor** | One provider per vendor | One collection per vendor |
| **Strength** | ACI/SDN controllers, cloud networking | Device-level CLI/NETCONF configuration |

**Recommendation:** Use Terraform for SDN controllers (Cisco ACI, Meraki) and cloud networking (AWS VPC, Azure VNet). Use Ansible or Nornir for device-level configuration management. The two tools complement each other -- Terraform manages the fabric and cloud infrastructure, Ansible manages the individual device configurations within that fabric [28].

---

## 15. The Complete NetDevOps Pipeline

All the tools and protocols described in this module fit together into a single, coherent pipeline. The source of truth defines intent. Templates generate configurations. Batfish validates them offline. CI/CD automates the review and deployment process. Streaming telemetry verifies the result. Drift detection closes the loop.

```
THE COMPLETE NETDEVOPS PIPELINE
================================================================

  +-------------------+
  | SOURCE OF TRUTH   |  NetBox / Nautobot
  | (Intended State)  |  Device inventory, IP assignments,
  |                   |  VLAN allocations, BGP peers
  +---------+---------+
            |
            | REST API / GraphQL
            v
  +---------+---------+
  | CONFIG GENERATION |  Jinja2 templates + SoT data
  | (Desired Config)  |  Produces vendor-specific configs
  +---------+---------+
            |
            | Git commit + push
            v
  +---------+---------+
  | VERSION CONTROL   |  Git repository
  | (Change Tracking) |  Branching, pull requests, reviews
  +---------+---------+
            |
            | CI/CD trigger
            v
  +---------+---------+
  | VALIDATION        |  Batfish (reachability, compliance)
  | (Pre-Deploy Test) |  YANG lint (pyang)
  |                   |  Template syntax check
  +---------+---------+
            |
            | On merge to main
            v
  +---------+---------+
  | DEPLOYMENT        |  Ansible / Nornir + NAPALM
  | (Config Push)     |  Canary --> fleet rollout
  |                   |  Automatic rollback on failure
  +---------+---------+
            |
            | Immediate
            v
  +---------+---------+
  | VERIFICATION      |  Post-deploy checks (BGP up, routes)
  | (Post-Deploy)     |  gNMI telemetry streams
  |                   |  End-to-end smoke tests
  +---------+---------+
            |
            | Continuous
            v
  +---------+---------+
  | DRIFT DETECTION   |  Periodic config pull + diff
  | (Closed Loop)     |  gNMI config subscriptions
  |                   |  NetBox Assurance / Nautobot Golden Config
  +---------+---------+
            |
            | If drift detected
            v
  +---------+---------+
  | REMEDIATION       |  Auto-correct or alert
  |                   |  Update SoT if drift was intentional
  +-------------------+
```

### Maturity Model

Organizations do not adopt the full pipeline at once. The journey is incremental:

| Level | Capability | Tools | Typical Timeline |
|---|---|---|---|
| 0 | Manual CLI | SSH, PuTTY, SecureCRT | Legacy |
| 1 | Script automation | Python + Netmiko, Expect | Months 1-3 |
| 2 | Framework automation | Ansible playbooks, NAPALM | Months 3-6 |
| 3 | Source of truth | NetBox + Jinja2 templates | Months 6-12 |
| 4 | CI/CD pipeline | GitLab/GitHub + Batfish + Containerlab | Months 12-18 |
| 5 | Closed-loop automation | gNMI telemetry + drift detection + auto-remediation | Months 18-24+ |

---

## 16. Cross-References

> **Related:** [Network Architecture & Design](01-network-architecture-design.md) -- the topologies that automation deploys. [Routing & Switching Operations](02-routing-switching-operations.md) -- the protocols and configurations that automation manages.

**Series cross-references:**
- **SYA (Systems Administration):** Configuration management fundamentals, Ansible for server automation
- **SOO (Systems Operations):** Operational runbooks, incident response automation
- **K8S (Kubernetes):** GitOps patterns (ArgoCD, Flux) share the same declarative philosophy
- **OPS (OpenStack):** Heat orchestration as IaC for cloud, Neutron as SDN
- **DRP (Disaster Recovery):** Network DR automation, failover testing
- **TCP (TCP/IP Protocol):** The protocol layer that automation configures
- **DNS (DNS Protocol):** DNS automation as part of network provisioning
- **CMH (Computational Mesh):** Distributed system networking requirements

---

## 17. Sources

1. Edelman, J., Lenz, S., and Oswalt, M. *Network Programmability and Automation*. 2nd ed. O'Reilly Media, 2023.
2. Cisco Blogs. "Network Programmability with YANG: The Structure of Network Automation with YANG, NETCONF, RESTCONF, and gNMI." blogs.cisco.com/networking/network-programmability-with-yang, 2023.
3. Ansible Documentation. "Network Automation." docs.ansible.com/ansible/latest/network/, 2025.
4. NAPALM Documentation. "NAPALM -- Network Automation and Programmability Abstraction Layer with Multivendor support." github.com/napalm-automation/napalm, 2024.
5. NAPALM GitHub. "Support Matrix." github.com/napalm-automation/napalm/blob/master/docs/support/index.rst, 2024.
6. Nornir Documentation. "Pluggable multi-threaded framework with inventory management." github.com/nornir-automation/nornir, 2025.
7. APNIC Blog. "Automation tools: Paramiko, Netmiko, NAPALM, Ansible, Nornir or...?" blog.apnic.net, 2023.
8. RFC 7950. "The YANG 1.1 Data Modeling Language." IETF, 2016.
9. OpenConfig. "OpenConfig YANG Models." github.com/openconfig/public, 2025.
10. Cisco Blogs. "Native, IETF, OpenConfig... Why so many YANG models?" blogs.cisco.com/developer/which-yang-model-to-use, 2023.
11. RFC 6241. "Network Configuration Protocol (NETCONF)." IETF, 2011.
12. RFC 8040. "RESTCONF Protocol." IETF, 2017.
13. OpenConfig. "gRPC Network Management Interface (gNMI) Specification." openconfig.net/docs/gnmi/gnmi-specification/, 2024.
14. Netflix Technology Blog. "Simple streaming telemetry: Introducing gnmi-gateway." netflixtechblog.com, 2020.
15. Cisco White Paper. "Data Center Telemetry and Network Automation Using gNMI and OpenConfig." cisco.com, 2024.
16. TechTarget. "How to build a network-aware CI/CD pipeline with GitLab and Ansible." searchnetworking.techtarget.com, 2023.
17. Containerlab Documentation. "Container-based networking lab." containerlab.dev, 2025.
18. NetBox Labs. "NetBox Assurance -- drift detection tool to tame configuration chaos." networkworld.com, 2025.
19. Network to Code. "Nautobot Golden Config." github.com/nautobot/nautobot-app-golden-config, 2025.
20. Batfish. "Network configuration analysis tool." batfish.org, 2025.
21. Fogel, A., et al. "Lessons from the evolution of the Batfish configuration analysis tool." ACM SIGCOMM, 2023.
22. Gartner. "Intent-Based Networking." gartner.com/en/information-technology/glossary/intent-based-networking, 2024.
23. Juniper/HPE. "Apstra Data Center Director." juniper.net/us/en/products/network-automation/apstra-data-center-director.html, 2025.
24. Cisco. "Cisco Catalyst Center: Early Results from Intent-based Networking." cisco.com, 2025.
25. NetBox Labs. "NetBox Documentation." docs.netbox.dev, 2025.
26. Network to Code. "Nautobot Documentation." docs.nautobot.com, 2025.
27. Terraform Registry. "CiscoDevNet/aci Provider." registry.terraform.io/providers/CiscoDevNet/aci/latest, 2026.
28. HashiCorp Blog. "New Terraform integrations with Cisco, Juniper, Palo Alto Networks." hashicorp.com/blog, 2024.

---

*Systems Network Engineering -- Module 3: Network Automation & NetDevOps. The network you can describe in code is the network you can review, test, version, and trust. The network you configure by hand is the network you hope is still correct.*

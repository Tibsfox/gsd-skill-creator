# Runbook Library -- Symptom Index

Runbooks organized by observed failure. Start here when something is broken.

**Total runbooks:** 44 | **Last updated:** 2026-02-23

---

## INSTANCE WON'T LAUNCH

Instances fail to create, get stuck in BUILD/ERROR, or are immediately terminated.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-NOVA-001](RB-NOVA-001.md) -- Instance Launch Failure Diagnosis | Nova scheduler, conductor, compute logs; instance fault messages |
| 2 | [RB-NOVA-002](RB-NOVA-002.md) -- Scheduler and Placement Troubleshooting | Placement resource inventory, scheduler filters, host aggregates |
| 3 | [RB-NOVA-005](RB-NOVA-005.md) -- Compute Resource Exhaustion Response | vCPU/RAM/disk allocation ratios, resource provider inventory |
| 4 | [RB-NEUTRON-001](RB-NEUTRON-001.md) -- Network Connectivity Loss Diagnosis | Port binding failures, network agent availability |
| 5 | [RB-GLANCE-001](RB-GLANCE-001.md) -- Image Upload Failure Troubleshooting | Image status, Glance API connectivity, backend storage |
| 6 | [RB-GLANCE-003](RB-GLANCE-003.md) -- Image Metadata and Visibility Management | Image visibility settings, community/shared/public access |
| 7 | [RB-KEYSTONE-001](RB-KEYSTONE-001.md) -- Token Issuance Failure Troubleshooting | Authentication, token validity, service catalog |
| 8 | [RB-CINDER-001](RB-CINDER-001.md) -- Volume Creation Failure Diagnosis | Boot-from-volume failures, volume backend availability |
| 9 | [RB-GENERAL-003](RB-GENERAL-003.md) -- RabbitMQ Message Queue Recovery | Message bus connectivity between Nova services |

## NETWORK UNREACHABLE

Instances cannot reach external networks, each other, or metadata service. Floating IPs non-functional.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-NEUTRON-001](RB-NEUTRON-001.md) -- Network Connectivity Loss Diagnosis | OVS/OVN flows, agent status, bridge connectivity |
| 2 | [RB-NEUTRON-003](RB-NEUTRON-003.md) -- Floating IP Troubleshooting | NAT rules, router namespace, external gateway |
| 3 | [RB-NEUTRON-002](RB-NEUTRON-002.md) -- DHCP Agent Failure Recovery | DHCP namespace, dnsmasq process, lease files |
| 4 | [RB-NEUTRON-005](RB-NEUTRON-005.md) -- OVS/OVN Bridge Recovery | Bridge configuration, flow tables, patch ports |
| 5 | [RB-NEUTRON-004](RB-NEUTRON-004.md) -- Security Group Rule Debugging | iptables/OVS flow rules, security group applied to port |
| 6 | [RB-NEUTRON-006](RB-NEUTRON-006.md) -- Tenant Network Isolation Verification | VXLAN/VLAN segmentation, cross-tenant leakage |
| 7 | [RB-NOVA-003](RB-NOVA-003.md) -- Hypervisor Connectivity Recovery | Compute node network, libvirt bridge configuration |
| 8 | [RB-KOLLA-001](RB-KOLLA-001.md) -- Container Service Recovery | Neutron agent containers, OVS container status |

## STORAGE UNAVAILABLE

Volumes fail to create/attach/detach. Image uploads fail. Object store inaccessible.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-CINDER-001](RB-CINDER-001.md) -- Volume Creation Failure Diagnosis | Backend driver errors, volume service status |
| 2 | [RB-CINDER-002](RB-CINDER-002.md) -- Volume Attachment Troubleshooting | iSCSI/NFS target, compute-volume connectivity |
| 3 | [RB-CINDER-003](RB-CINDER-003.md) -- LVM Backend Recovery | Volume group status, logical volumes, thin pool |
| 4 | [RB-CINDER-004](RB-CINDER-004.md) -- Snapshot Management Troubleshooting | Snapshot state, backend capacity, orphaned snapshots |
| 5 | [RB-CINDER-005](RB-CINDER-005.md) -- Volume Migration Between Backends | Migration status, backend health comparison |
| 6 | [RB-GLANCE-001](RB-GLANCE-001.md) -- Image Upload Failure Troubleshooting | Glance API errors, backend write permissions |
| 7 | [RB-GLANCE-004](RB-GLANCE-004.md) -- Glance Backend Storage Recovery | Image store filesystem, backend connectivity |
| 8 | [RB-SWIFT-001](RB-SWIFT-001.md) -- Container Access Troubleshooting | Proxy server, account/container servers |
| 9 | [RB-SWIFT-002](RB-SWIFT-002.md) -- Replication Status Verification | Ring consistency, replication lag, disk health |
| 10 | [RB-GENERAL-004](RB-GENERAL-004.md) -- MariaDB/MySQL Database Maintenance | Database disk space, table corruption |

## AUTHENTICATION FAILED

Users cannot log in. API calls return 401/403. Token issuance fails. RBAC denials.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-KEYSTONE-001](RB-KEYSTONE-001.md) -- Token Issuance Failure Troubleshooting | Fernet keys, memcached, MariaDB backend |
| 2 | [RB-KEYSTONE-003](RB-KEYSTONE-003.md) -- RBAC Policy Troubleshooting | Policy files, role assignments, scope tokens |
| 3 | [RB-KEYSTONE-005](RB-KEYSTONE-005.md) -- Fernet Key Rotation | Key staleness, key sync across nodes |
| 4 | [RB-KEYSTONE-002](RB-KEYSTONE-002.md) -- Service Catalog Endpoint Repair | Endpoint URLs, service registration |
| 5 | [RB-KEYSTONE-004](RB-KEYSTONE-004.md) -- TLS Certificate Renewal | Certificate expiry, CA trust chain, TLS handshake |
| 6 | [RB-HORIZON-002](RB-HORIZON-002.md) -- Session and Authentication Troubleshooting | Session backend, cookie settings, Keystone integration |
| 7 | [RB-GENERAL-004](RB-GENERAL-004.md) -- MariaDB/MySQL Database Maintenance | Keystone database connectivity, user table integrity |

## SERVICE CONTAINER DOWN

OpenStack service containers not running, crash-looping, or returning errors.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-KOLLA-001](RB-KOLLA-001.md) -- Container Service Recovery | Docker container state, restart policy, container logs |
| 2 | [RB-KOLLA-002](RB-KOLLA-002.md) -- Service Reconfiguration Procedure | Config file syntax, Kolla globals, reconfigure playbook |
| 3 | [RB-GENERAL-003](RB-GENERAL-003.md) -- RabbitMQ Message Queue Recovery | RabbitMQ cluster state, queue health, mnesia database |
| 4 | [RB-GENERAL-004](RB-GENERAL-004.md) -- MariaDB/MySQL Database Maintenance | Database container, Galera cluster status |
| 5 | [RB-NOVA-003](RB-NOVA-003.md) -- Hypervisor Connectivity Recovery | nova-compute container, libvirt container |
| 6 | [RB-NEUTRON-005](RB-NEUTRON-005.md) -- OVS/OVN Bridge Recovery | OVS container, openvswitch-db, ovs-vswitchd |
| 7 | [RB-KEYSTONE-001](RB-KEYSTONE-001.md) -- Token Issuance Failure Troubleshooting | keystone_api container health |
| 8 | [RB-HORIZON-001](RB-HORIZON-001.md) -- Dashboard Access Recovery | Horizon container, Apache/nginx process |
| 9 | [RB-HEAT-001](RB-HEAT-001.md) -- Stack Creation Failure Diagnosis | heat-api, heat-engine container status |
| 10 | [RB-SWIFT-001](RB-SWIFT-001.md) -- Container Access Troubleshooting | Swift proxy-server, account/container/object server containers |
| 11 | [RB-KOLLA-003](RB-KOLLA-003.md) -- OpenStack Upgrade Procedure | Post-upgrade container failures, version mismatch |

## DATABASE CONNECTIVITY LOST

Services cannot reach MariaDB/Galera. Schema errors. Replication broken.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-GENERAL-004](RB-GENERAL-004.md) -- MariaDB/MySQL Database Maintenance | MariaDB process, Galera sync, wsrep status |
| 2 | [RB-GENERAL-003](RB-GENERAL-003.md) -- RabbitMQ Message Queue Recovery | RabbitMQ Mnesia database, cluster partitions |
| 3 | [RB-KOLLA-001](RB-KOLLA-001.md) -- Container Service Recovery | MariaDB/RabbitMQ container restart |
| 4 | [RB-GENERAL-002](RB-GENERAL-002.md) -- Full Cloud Backup and Restore | Database backup restore, point-in-time recovery |
| 5 | [RB-KEYSTONE-001](RB-KEYSTONE-001.md) -- Token Issuance Failure Troubleshooting | Keystone-to-MariaDB connection pool |
| 6 | [RB-NOVA-001](RB-NOVA-001.md) -- Instance Launch Failure Diagnosis | Nova cell database connectivity, cell mapping |

## DASHBOARD INACCESSIBLE

Horizon returns HTTP errors, blank pages, or SSL/TLS handshake failures.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-HORIZON-001](RB-HORIZON-001.md) -- Dashboard Access Recovery | Web server process, Horizon container, port binding |
| 2 | [RB-HORIZON-002](RB-HORIZON-002.md) -- Session and Authentication Troubleshooting | Session backend, Django settings, Keystone auth |
| 3 | [RB-HORIZON-003](RB-HORIZON-003.md) -- Panel and Plugin Configuration | Enabled panels, plugin errors, static file collection |
| 4 | [RB-KEYSTONE-004](RB-KEYSTONE-004.md) -- TLS Certificate Renewal | HTTPS certificate validity, CA chain |
| 5 | [RB-KEYSTONE-001](RB-KEYSTONE-001.md) -- Token Issuance Failure Troubleshooting | Backend auth to Keystone from Horizon |
| 6 | [RB-KOLLA-001](RB-KOLLA-001.md) -- Container Service Recovery | Horizon container health, restart |
| 7 | [RB-GENERAL-001](RB-GENERAL-001.md) -- Full Cloud Daily Health Check | Overall service health impacting dashboard |

## ORCHESTRATION STACK FAILED

Heat stacks stuck in CREATE_FAILED, UPDATE_FAILED, or DELETE_FAILED. Resource timeouts.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-HEAT-001](RB-HEAT-001.md) -- Stack Creation Failure Diagnosis | Stack events, resource errors, engine logs |
| 2 | [RB-HEAT-003](RB-HEAT-003.md) -- Resource Dependency Resolution | Resource dependency graph, circular references, wait conditions |
| 3 | [RB-HEAT-002](RB-HEAT-002.md) -- Template Validation and Debugging | HOT template syntax, parameter validation, intrinsic functions |
| 4 | [RB-HEAT-004](RB-HEAT-004.md) -- Stack Update and Rollback Procedure | Update preview, rollback triggers, manual resource cleanup |
| 5 | [RB-NOVA-001](RB-NOVA-001.md) -- Instance Launch Failure Diagnosis | Underlying Nova resource creation failures |
| 6 | [RB-NEUTRON-001](RB-NEUTRON-001.md) -- Network Connectivity Loss Diagnosis | Underlying Neutron resource creation failures |
| 7 | [RB-CINDER-001](RB-CINDER-001.md) -- Volume Creation Failure Diagnosis | Underlying Cinder resource creation failures |
| 8 | [RB-GLANCE-001](RB-GLANCE-001.md) -- Image Upload Failure Troubleshooting | Image referenced by stack not available |

## PERFORMANCE DEGRADED

Services respond slowly. High latency on API calls. Instance performance degraded. Disk I/O bottlenecks.

| Priority | Runbook | What to Check |
|----------|---------|---------------|
| 1 | [RB-GENERAL-001](RB-GENERAL-001.md) -- Full Cloud Daily Health Check | Overall system health, resource utilization |
| 2 | [RB-NOVA-005](RB-NOVA-005.md) -- Compute Resource Exhaustion Response | CPU/memory overcommit, host contention |
| 3 | [RB-NOVA-002](RB-NOVA-002.md) -- Scheduler and Placement Troubleshooting | Imbalanced scheduling, incorrect weights |
| 4 | [RB-GENERAL-003](RB-GENERAL-003.md) -- RabbitMQ Message Queue Recovery | Message queue backlog, flow control |
| 5 | [RB-GENERAL-004](RB-GENERAL-004.md) -- MariaDB/MySQL Database Maintenance | Slow queries, table bloat, index fragmentation |
| 6 | [RB-CINDER-003](RB-CINDER-003.md) -- LVM Backend Recovery | Volume I/O performance, thin pool allocation |
| 7 | [RB-NEUTRON-005](RB-NEUTRON-005.md) -- OVS/OVN Bridge Recovery | Flow table size, datapath performance |
| 8 | [RB-SWIFT-002](RB-SWIFT-002.md) -- Replication Status Verification | Replication backlog impacting read performance |
| 9 | [RB-SWIFT-003](RB-SWIFT-003.md) -- Quota and Rate Limit Management | Rate limiting throttling, quota enforcement |
| 10 | [RB-SWIFT-004](RB-SWIFT-004.md) -- Object Expiration and Lifecycle Troubleshooting | Expirer backlog, object-server load |
| 11 | [RB-GLANCE-002](RB-GLANCE-002.md) -- Image Format Conversion | Large image conversions impacting I/O |
| 12 | [RB-GLANCE-004](RB-GLANCE-004.md) -- Glance Backend Storage Recovery | Backend I/O throughput |
| 13 | [RB-KOLLA-002](RB-KOLLA-002.md) -- Service Reconfiguration Procedure | Tuning parameters, worker counts, connection pools |
| 14 | [RB-NOVA-006](RB-NOVA-006.md) -- Compute Service Recovery After Host Failure | Evacuating instances from degraded host |
| 15 | [RB-KEYSTONE-002](RB-KEYSTONE-002.md) -- Service Catalog Endpoint Repair | Slow endpoint resolution, catalog size |
| 16 | [RB-GENERAL-002](RB-GENERAL-002.md) -- Full Cloud Backup and Restore | Backup jobs impacting production performance |
| 17 | [RB-NOVA-004](RB-NOVA-004.md) -- Live Migration Procedure | Migrating instances off degraded host |

---

## Coverage Matrix

Every runbook is discoverable from at least one symptom category. Runbooks that diagnose cross-cutting issues appear under multiple symptoms.

| Service | Runbooks | Instance | Network | Storage | Auth | Container | Database | Dashboard | Orchestration | Performance |
|---------|----------|----------|---------|---------|------|-----------|----------|-----------|---------------|-------------|
| Nova | 6 | 3 | 1 | 0 | 0 | 1 | 1 | 0 | 1 | 4 |
| Neutron | 6 | 1 | 6 | 0 | 0 | 1 | 0 | 0 | 1 | 1 |
| Cinder | 5 | 1 | 0 | 5 | 0 | 0 | 0 | 0 | 1 | 1 |
| Keystone | 5 | 1 | 0 | 0 | 5 | 1 | 1 | 2 | 0 | 1 |
| Glance | 4 | 2 | 0 | 2 | 0 | 0 | 0 | 0 | 1 | 2 |
| Heat | 4 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 4 | 0 |
| Horizon | 3 | 0 | 0 | 0 | 1 | 1 | 0 | 3 | 0 | 0 |
| Swift | 4 | 0 | 0 | 2 | 0 | 1 | 0 | 0 | 0 | 3 |
| Kolla | 3 | 0 | 1 | 0 | 0 | 3 | 1 | 1 | 0 | 1 |
| General | 4 | 1 | 0 | 1 | 1 | 2 | 2 | 1 | 0 | 3 |
| **Total** | **44** | **9** | **8** | **10** | **7** | **11** | **6** | **7** | **8** | **17** |

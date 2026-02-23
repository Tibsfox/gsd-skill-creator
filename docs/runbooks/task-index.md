# Runbook Library -- Task Index

Runbooks organized by operational intent. Find the procedure for what you want to do.

**Total runbooks:** 44 | **Last updated:** 2026-02-23

---

## DEPLOY -- Initial Setup and Infrastructure

Deployment, installation, upgrade, and initial configuration procedures.

| ID | Title | Service | Verification |
|----|-------|---------|--------------|
| [RB-KOLLA-002](RB-KOLLA-002.md) | Service Reconfiguration Procedure | Kolla-Ansible | Manual |
| [RB-KOLLA-003](RB-KOLLA-003.md) | OpenStack Upgrade Procedure | Kolla-Ansible | Manual |
| [RB-KEYSTONE-004](RB-KEYSTONE-004.md) | TLS Certificate Renewal | Keystone | Both |
| [RB-GLANCE-002](RB-GLANCE-002.md) | Image Format Conversion | Glance | Manual |
| [RB-GLANCE-003](RB-GLANCE-003.md) | Image Metadata and Visibility Management | Glance | Manual |
| [RB-CINDER-005](RB-CINDER-005.md) | Volume Migration Between Backends | Cinder | Manual |
| [RB-NOVA-004](RB-NOVA-004.md) | Live Migration Procedure | Nova | Both |
| [RB-HEAT-002](RB-HEAT-002.md) | Template Validation and Debugging | Heat | Manual |
| [RB-HEAT-004](RB-HEAT-004.md) | Stack Update and Rollback Procedure | Heat | Manual |
| [RB-HORIZON-003](RB-HORIZON-003.md) | Panel and Plugin Configuration | Horizon | Manual |
| [RB-NEUTRON-006](RB-NEUTRON-006.md) | Tenant Network Isolation Verification | Neutron | Manual |

## OPERATE -- Day-to-Day Operations

Routine operational tasks, management commands, and standard procedures.

| ID | Title | Service | Verification |
|----|-------|---------|--------------|
| [RB-KEYSTONE-002](RB-KEYSTONE-002.md) | Service Catalog Endpoint Repair | Keystone | Manual |
| [RB-KEYSTONE-003](RB-KEYSTONE-003.md) | RBAC Policy Troubleshooting | Keystone | Manual |
| [RB-KEYSTONE-005](RB-KEYSTONE-005.md) | Fernet Key Rotation | Keystone | Automated |
| [RB-GLANCE-001](RB-GLANCE-001.md) | Image Upload Failure Troubleshooting | Glance | Manual |
| [RB-GLANCE-003](RB-GLANCE-003.md) | Image Metadata and Visibility Management | Glance | Manual |
| [RB-NOVA-004](RB-NOVA-004.md) | Live Migration Procedure | Nova | Both |
| [RB-NOVA-005](RB-NOVA-005.md) | Compute Resource Exhaustion Response | Nova | Both |
| [RB-CINDER-005](RB-CINDER-005.md) | Volume Migration Between Backends | Cinder | Manual |
| [RB-NEUTRON-004](RB-NEUTRON-004.md) | Security Group Rule Debugging | Neutron | Manual |
| [RB-SWIFT-001](RB-SWIFT-001.md) | Container Access Troubleshooting | Swift | Manual |
| [RB-SWIFT-003](RB-SWIFT-003.md) | Quota and Rate Limit Management | Swift | Manual |
| [RB-SWIFT-004](RB-SWIFT-004.md) | Object Expiration and Lifecycle Troubleshooting | Swift | Manual |
| [RB-HEAT-004](RB-HEAT-004.md) | Stack Update and Rollback Procedure | Heat | Manual |
| [RB-HORIZON-002](RB-HORIZON-002.md) | Session and Authentication Troubleshooting | Horizon | Manual |
| [RB-KOLLA-002](RB-KOLLA-002.md) | Service Reconfiguration Procedure | Kolla-Ansible | Manual |

## MONITOR -- Scheduled Observation

Health checks, audits, verification procedures, and monitoring tasks.

| ID | Title | Service | Verification |
|----|-------|---------|--------------|
| [RB-GENERAL-001](RB-GENERAL-001.md) | Full Cloud Daily Health Check | General | Both |
| [RB-SWIFT-002](RB-SWIFT-002.md) | Replication Status Verification | Swift | Manual |
| [RB-NEUTRON-006](RB-NEUTRON-006.md) | Tenant Network Isolation Verification | Neutron | Manual |
| [RB-NOVA-002](RB-NOVA-002.md) | Scheduler and Placement Troubleshooting | Nova | Both |
| [RB-NOVA-003](RB-NOVA-003.md) | Hypervisor Connectivity Recovery | Nova | Both |
| [RB-CINDER-004](RB-CINDER-004.md) | Snapshot Management Troubleshooting | Cinder | Manual |
| [RB-KEYSTONE-004](RB-KEYSTONE-004.md) | TLS Certificate Renewal | Keystone | Both |

## MAINTAIN -- Infrastructure Maintenance

Database maintenance, backup/restore, key rotation, and infrastructure upkeep.

| ID | Title | Service | Verification |
|----|-------|---------|--------------|
| [RB-GENERAL-002](RB-GENERAL-002.md) | Full Cloud Backup and Restore | General | Manual |
| [RB-GENERAL-003](RB-GENERAL-003.md) | RabbitMQ Message Queue Recovery | General | Manual |
| [RB-GENERAL-004](RB-GENERAL-004.md) | MariaDB/MySQL Database Maintenance | General | Manual |
| [RB-KEYSTONE-004](RB-KEYSTONE-004.md) | TLS Certificate Renewal | Keystone | Both |
| [RB-KEYSTONE-005](RB-KEYSTONE-005.md) | Fernet Key Rotation | Keystone | Automated |
| [RB-KOLLA-003](RB-KOLLA-003.md) | OpenStack Upgrade Procedure | Kolla-Ansible | Manual |
| [RB-CINDER-003](RB-CINDER-003.md) | LVM Backend Recovery | Cinder | Manual |
| [RB-CINDER-005](RB-CINDER-005.md) | Volume Migration Between Backends | Cinder | Manual |
| [RB-GLANCE-004](RB-GLANCE-004.md) | Glance Backend Storage Recovery | Glance | Manual |
| [RB-NEUTRON-005](RB-NEUTRON-005.md) | OVS/OVN Bridge Recovery | Neutron | Manual |
| [RB-SWIFT-002](RB-SWIFT-002.md) | Replication Status Verification | Swift | Manual |
| [RB-SWIFT-004](RB-SWIFT-004.md) | Object Expiration and Lifecycle Troubleshooting | Swift | Manual |
| [RB-NOVA-006](RB-NOVA-006.md) | Compute Service Recovery After Host Failure | Nova | Both |

## TROUBLESHOOT -- Incident Response

Diagnosis procedures, failure recovery, and incident triage workflows.

| ID | Title | Service | Verification |
|----|-------|---------|--------------|
| [RB-NOVA-001](RB-NOVA-001.md) | Instance Launch Failure Diagnosis | Nova | Both |
| [RB-NOVA-002](RB-NOVA-002.md) | Scheduler and Placement Troubleshooting | Nova | Both |
| [RB-NOVA-003](RB-NOVA-003.md) | Hypervisor Connectivity Recovery | Nova | Both |
| [RB-NOVA-005](RB-NOVA-005.md) | Compute Resource Exhaustion Response | Nova | Both |
| [RB-NOVA-006](RB-NOVA-006.md) | Compute Service Recovery After Host Failure | Nova | Both |
| [RB-NEUTRON-001](RB-NEUTRON-001.md) | Network Connectivity Loss Diagnosis | Neutron | Manual |
| [RB-NEUTRON-002](RB-NEUTRON-002.md) | DHCP Agent Failure Recovery | Neutron | Manual |
| [RB-NEUTRON-003](RB-NEUTRON-003.md) | Floating IP Troubleshooting | Neutron | Manual |
| [RB-NEUTRON-004](RB-NEUTRON-004.md) | Security Group Rule Debugging | Neutron | Manual |
| [RB-NEUTRON-005](RB-NEUTRON-005.md) | OVS/OVN Bridge Recovery | Neutron | Manual |
| [RB-CINDER-001](RB-CINDER-001.md) | Volume Creation Failure Diagnosis | Cinder | Manual |
| [RB-CINDER-002](RB-CINDER-002.md) | Volume Attachment Troubleshooting | Cinder | Manual |
| [RB-CINDER-003](RB-CINDER-003.md) | LVM Backend Recovery | Cinder | Manual |
| [RB-CINDER-004](RB-CINDER-004.md) | Snapshot Management Troubleshooting | Cinder | Manual |
| [RB-GLANCE-001](RB-GLANCE-001.md) | Image Upload Failure Troubleshooting | Glance | Manual |
| [RB-GLANCE-004](RB-GLANCE-004.md) | Glance Backend Storage Recovery | Glance | Manual |
| [RB-KEYSTONE-001](RB-KEYSTONE-001.md) | Token Issuance Failure Troubleshooting | Keystone | Both |
| [RB-KEYSTONE-002](RB-KEYSTONE-002.md) | Service Catalog Endpoint Repair | Keystone | Manual |
| [RB-KEYSTONE-003](RB-KEYSTONE-003.md) | RBAC Policy Troubleshooting | Keystone | Manual |
| [RB-KOLLA-001](RB-KOLLA-001.md) | Container Service Recovery | Kolla-Ansible | Manual |
| [RB-HEAT-001](RB-HEAT-001.md) | Stack Creation Failure Diagnosis | Heat | Manual |
| [RB-HEAT-003](RB-HEAT-003.md) | Resource Dependency Resolution | Heat | Manual |
| [RB-HORIZON-001](RB-HORIZON-001.md) | Dashboard Access Recovery | Horizon | Manual |
| [RB-HORIZON-002](RB-HORIZON-002.md) | Session and Authentication Troubleshooting | Horizon | Manual |
| [RB-GENERAL-003](RB-GENERAL-003.md) | RabbitMQ Message Queue Recovery | General | Manual |
| [RB-GENERAL-004](RB-GENERAL-004.md) | MariaDB/MySQL Database Maintenance | General | Manual |
| [RB-SWIFT-001](RB-SWIFT-001.md) | Container Access Troubleshooting | Swift | Manual |
| [RB-SWIFT-003](RB-SWIFT-003.md) | Quota and Rate Limit Management | Swift | Manual |

---

## Coverage Matrix

Every runbook appears in at least one category above. Cross-referenced runbooks appear in multiple categories where their scope overlaps.

| Service | Runbooks | DEPLOY | OPERATE | MONITOR | MAINTAIN | TROUBLESHOOT |
|---------|----------|--------|---------|---------|----------|--------------|
| Nova | 6 | 1 | 2 | 2 | 1 | 5 |
| Neutron | 6 | 1 | 1 | 1 | 1 | 5 |
| Cinder | 5 | 1 | 1 | 1 | 2 | 4 |
| Keystone | 5 | 1 | 3 | 1 | 2 | 3 |
| Glance | 4 | 2 | 2 | 0 | 1 | 2 |
| Heat | 4 | 2 | 1 | 0 | 0 | 2 |
| Horizon | 3 | 1 | 1 | 0 | 0 | 2 |
| Swift | 4 | 0 | 3 | 1 | 2 | 2 |
| Kolla-Ansible | 3 | 2 | 1 | 0 | 1 | 1 |
| General | 4 | 0 | 0 | 1 | 3 | 2 |
| **Total unique** | **44** | **11** | **15** | **7** | **13** | **28** |

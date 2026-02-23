# Chapter 6: Operations and Sustainment -- Running It

| Field | Reference |
|-------|-----------|
| **SE Phase** | Phase E |
| **SP-6105** | SS 5.4-5.5 |
| **NPR 7123.1** | SS 5.4 |
| **Review Gate** | ORR (Operational Readiness Review) |

Phase E is the longest phase of the lifecycle. Where Phases C and D were about building and proving the cloud, Phase E is about running it -- day after day, incident after incident, upgrade after upgrade. This chapter covers the transition from deployment crew to operations crew and every operational domain the operations crew is responsible for.

Per SP-6105 SS 5.4 (Product Validation), the system must be confirmed to work under realistic operational conditions. Per SP-6105 SS 5.5 (Product Transition), the system must be handed off to its operators with verified documentation, tested procedures, and trained personnel. Phase E is where both of those requirements become ongoing obligations rather than one-time events.

---

## 1. Operations Handoff

The transition from deployment crew to operations crew is a formal event governed by the Operational Readiness Review (ORR). This is not a casual handoff -- it is a structured transfer of responsibility documented through a signed checklist.

Per SP-6105 SS 5.5 (Product Transition), the deployment crew must demonstrate that the system is ready for sustained operations before the operations crew assumes responsibility. The ORR verifies that all operational prerequisites are satisfied.

### 1.1 Operational Readiness Review Checklist

The ORR checklist must have every item signed off before the handoff is complete:

| Item | Verification Method | Signed Off |
|------|-------------------|------------|
| Operations manuals reviewed and current | Inspection: doc-verifier reports zero Critical drift items | [ ] |
| All runbooks tested against running system | Demonstration: each runbook executed end-to-end | [ ] |
| Monitoring dashboards accessible | Demonstration: Grafana dashboards load with live data | [ ] |
| Alerting rules verified | Test: synthetic alert triggers correct notification | [ ] |
| Backup procedure validated | Demonstration: backup executed and restore verified | [ ] |
| Recovery procedure validated | Demonstration: simulated failure recovered successfully | [ ] |
| Operations crew trained | Inspection: training completion records for each crew member | [ ] |
| Escalation paths documented | Inspection: escalation matrix reviewed and approved | [ ] |
| Service catalog accurate | Test: all service endpoints respond correctly | [ ] |
| Security posture verified | Analysis: security audit report with no critical findings | [ ] |

### 1.2 Crew Handoff Process

The crew handoff follows the crew configurations defined in the mission architecture:

1. **Deployment crew briefing** -- FLIGHT (deployment) presents system state, known issues, and configuration decisions to FLIGHT (operations)
2. **Documentation transfer** -- All configuration files, decision records, and git history are reviewed by the operations crew
3. **Shadowed operations** -- The operations crew operates the cloud for a defined period (minimum 48 hours) with the deployment crew available for consultation
4. **Independent operations** -- The operations crew assumes full responsibility; deployment crew stands down
5. **Formal handoff record** -- A signed handoff document records the transfer date, system state, and any open items

The CAPCOM channel remains the sole human interface throughout the transition. All handoff communications between human operators and the agent crews flow through CAPCOM (per NPR 7123.1 SS 5.4, validation includes confirming that operational interfaces function correctly).

---

## 2. Day-2 Operations Procedures

Day-2 operations encompass everything that happens after the initial deployment is complete and verified. These are the routine tasks that keep the cloud running and its users productive.

For detailed per-service procedures, refer to the operations manual (`docs/operations-manual/`). This section provides the operational overview.

### 2.1 Project and User Management

Keystone manages all identity operations. Routine tasks include:

- **Tenant creation** -- Create new OpenStack projects with appropriate quotas and role assignments
- **User provisioning** -- Create user accounts, assign roles (admin, member, reader) per RBAC policy
- **Quota management** -- Set and adjust compute, storage, and network quotas per project based on capacity planning
- **RBAC assignments** -- Map users to roles within projects; enforce least-privilege principle
- **Domain management** -- Organize projects and users into domains for organizational separation
- **Service catalog maintenance** -- Verify and update service endpoints as services are upgraded or reconfigured

### 2.2 Instance Lifecycle Management

Nova handles compute instance operations. The full instance lifecycle includes:

- **Launch** -- Create instances from Glance images with specified flavors, networks, and security groups
- **Resize** -- Change instance flavor (vCPU, RAM, disk) with confirmation step
- **Migrate** -- Move instances between compute hosts for maintenance (live migration when possible)
- **Shelve** -- Suspend instances to free compute resources while preserving state
- **Snapshot** -- Capture instance state as a Glance image for backup or cloning
- **Delete** -- Terminate instances and release all associated resources (ports, volumes, floating IPs)

### 2.3 Network Management

Neutron manages all network operations:

- **Network creation** -- Create tenant networks (VXLAN/GRE/VLAN) with appropriate segmentation
- **Subnet configuration** -- Define IP address ranges, DHCP settings, DNS nameservers, and gateway addresses
- **Security groups** -- Create and manage firewall rules controlling inbound and outbound traffic per instance
- **Floating IP management** -- Allocate, associate, and release external IP addresses for instance accessibility
- **Router management** -- Create routers connecting tenant networks to external networks
- **Load balancer configuration** -- Set up Octavia load balancers for high-availability applications (if deployed)

### 2.4 Storage Management

Cinder manages block storage operations:

- **Volume creation** -- Create persistent block storage volumes with specified size and type
- **Snapshot** -- Capture point-in-time volume state for backup or cloning
- **Backup** -- Create volume backups to secondary storage (Swift or NFS backend)
- **Extend** -- Increase volume size without data loss (online extension when supported)
- **Volume type management** -- Define storage tiers (SSD vs HDD, replicated vs non-replicated)
- **Attachment management** -- Attach and detach volumes from instances with proper filesystem handling

---

## 3. Monitoring and Alerting

Monitoring is the operations crew's eyes and ears. Without it, the first indication of a problem is a user complaint. Per SP-6105 SS 5.4, the system must be validated under realistic conditions -- monitoring provides the continuous validation that the system is performing as required.

### 3.1 Key Metrics Per Service

| Service | Critical Metrics | Warning Threshold | Critical Threshold |
|---------|-----------------|-------------------|-------------------|
| **Nova** | Hypervisor vCPU utilization, RAM utilization, running instances, instance launch latency | vCPU > 80%, RAM > 85% | vCPU > 95%, RAM > 95% |
| **Neutron** | Port allocation rate, DHCP agent status, floating IP availability, network agent liveness | Ports > 80% allocated | DHCP agent down, no floating IPs |
| **Cinder** | Volume capacity utilization, snapshot count, backend IOPS, volume creation latency | Capacity > 80% | Capacity > 95%, backend unreachable |
| **Keystone** | Token issuance rate, authentication failures, service catalog response time | Auth failures > 10/min | Keystone API unresponsive |
| **Glance** | Image store utilization, image upload/download latency, active image count | Store > 80% | Store > 95%, API unresponsive |
| **Swift** | Object count, container count, replication lag, disk utilization per node | Replication lag > 5min | Disk > 90%, replication stopped |
| **Heat** | Active stacks, stack creation failures, resource creation latency | Failures > 5% | Stack creation completely failing |
| **Horizon** | HTTP response time, session count, error rate | Response > 3s | HTTP 5xx rate > 5% |

### 3.2 Alerting Rules

Alerting rules are configured in Prometheus with notification routing through Alertmanager:

**Critical alerts (immediate response required):**
- Any OpenStack service API returns HTTP 503 for more than 60 seconds
- Hypervisor disk space below 5%
- Keystone unable to issue tokens
- Database connection pool exhausted
- MariaDB replication broken (if applicable)
- Certificate expiring within 7 days

**Warning alerts (response within business hours):**
- API error rate exceeds 1% sustained over 15 minutes
- Hypervisor resource utilization above 85% for 30 minutes
- Volume backend capacity above 80%
- Backup job failure
- Log volume spike (10x normal rate)

**Informational alerts (review at next health check):**
- New OpenStack release available
- Certificate expiring within 30 days
- Resource utilization trending upward

### 3.3 Dashboard Configuration

Grafana dashboards are organized by operational domain:

- **Cloud Overview** -- Aggregate health status, service availability, resource utilization summary
- **Compute Dashboard** -- Nova hypervisor metrics, instance counts, scheduling latency
- **Network Dashboard** -- Neutron agent status, port allocation, traffic metrics
- **Storage Dashboard** -- Cinder volume metrics, Swift object counts, capacity trends
- **Identity Dashboard** -- Keystone token metrics, authentication patterns, service catalog health
- **Infrastructure Dashboard** -- Host metrics (CPU, RAM, disk, network), container health

### 3.4 SURGEON Agent Health Monitoring

The SURGEON agent provides automated health monitoring through the Health Loop communication channel:

- **Continuous polling** -- SURGEON queries OpenStack API endpoints at configurable intervals (default: 60 seconds)
- **Drift detection** -- SURGEON compares current system state against the established performance baseline from Phase D
- **Advisory reports** -- SURGEON sends health advisories to FLIGHT through the Health Loop when metrics deviate from baseline
- **Trend analysis** -- SURGEON tracks metric trends over time and generates capacity warnings before thresholds are reached
- **Integration with Cloud Ops Loop** -- SURGEON's health data feeds the Cloud Ops communication loop, providing real-time status to the GSD-OS dashboard

Per SP-6105 SS 5.4, product validation is an ongoing activity -- SURGEON's continuous monitoring implements this requirement as automated, persistent validation of system behavior against requirements.

---

## 4. Backup and Recovery

Backup is not optional. Without verified backups, every operational decision carries the risk of irreversible data loss. Per SP-6105 SS 5.4, the system must be validated under realistic conditions -- backup and recovery procedures are validated through regular execution, not just documentation.

### 4.1 Database Backups

All OpenStack services store state in MariaDB/MySQL databases. These are the most critical backup targets:

| Database | Service | Backup Method | Schedule |
|----------|---------|---------------|----------|
| keystone | Identity | mysqldump with --single-transaction | Daily |
| nova | Compute | mysqldump with --single-transaction | Daily |
| nova_api | Compute API | mysqldump with --single-transaction | Daily |
| nova_cell0 | Compute Cell | mysqldump with --single-transaction | Daily |
| neutron | Networking | mysqldump with --single-transaction | Daily |
| cinder | Block Storage | mysqldump with --single-transaction | Daily |
| glance | Image | mysqldump with --single-transaction | Daily |
| heat | Orchestration | mysqldump with --single-transaction | Daily |

**Backup procedure:**
1. Connect to the MariaDB container: `docker exec -it mariadb bash`
2. Execute backup: `mysqldump --single-transaction --all-databases > /backup/openstack-$(date +%Y%m%d).sql`
3. Verify backup file size is non-zero and consistent with previous backups
4. Copy backup to off-host storage location
5. Verify backup integrity: `mysql --execute="source /backup/openstack-$(date +%Y%m%d).sql" --database=test_restore`

### 4.2 Configuration Backups

Kolla-Ansible configuration files define the entire deployment. These must be backed up independently of database backups:

- **Kolla-Ansible configs** -- `/etc/kolla/`, including `globals.yml`, inventory files, and all service-specific configurations
- **Certificates** -- TLS certificates and private keys stored in `/etc/kolla/certificates/`
- **Custom configurations** -- Any site-specific overrides in `/etc/kolla/config/`
- **Git repository** -- The configuration management repository containing all version-controlled configs and decision history

**Schedule:** Weekly full backup, or immediately after any configuration change.

### 4.3 Instance Data

- **Volume snapshots** -- Cinder volume snapshots for persistent block storage data
- **Image backups** -- Glance image exports for base images and instance snapshots
- **Object storage** -- Swift container replication (if configured) or export for critical objects

**Schedule:** Monthly full backup of all base images; volume snapshots per project backup policy.

### 4.4 Recovery Procedures

Each recovery procedure must be verified after execution:

1. **Database recovery** -- Restore MariaDB dump, verify all services can connect and authenticate, run integration test suite
2. **Configuration recovery** -- Restore Kolla-Ansible configs from backup, run `kolla-ansible reconfigure` to apply, verify all services healthy
3. **Instance recovery** -- Restore volumes from snapshots, recreate instances from images, verify network connectivity and storage attachment
4. **Full system recovery** -- Fresh Kolla-Ansible deployment from backed-up configurations, restore databases, verify complete system functionality

**Verification after every recovery:**
- All OpenStack service APIs respond with HTTP 200
- Token issuance succeeds (`openstack token issue`)
- Instance launch succeeds end-to-end
- Network connectivity verified (ping through floating IP)
- Storage operations verified (volume create, attach, write, detach)

### 4.5 Backup Schedule Summary

| Backup Type | Schedule | Retention | Verification |
|-------------|----------|-----------|--------------|
| Database | Daily | 30 days rolling | Weekly restore test |
| Configuration | Weekly | 12 weeks rolling | Monthly restore test |
| Instance data | Monthly | 6 months | Quarterly restore test |
| Full system | Quarterly | 4 quarterly backups | Annual full recovery drill |

---

## 5. Upgrade Procedures

OpenStack upgrades require careful planning and execution. A failed upgrade can take the entire cloud offline. Per SP-6105 SS 5.4, any change to the system must be validated -- upgrades are the most significant changes the operations crew will perform.

### 5.1 Minor Version Upgrades

Minor upgrades (security patches, bug fixes within the same release) are lower risk but still require process:

1. **Review release notes** -- Identify security fixes, bug fixes, and any deprecation notices
2. **Test in staging** (if available) -- Apply upgrade to non-production environment first
3. **Notify stakeholders** -- Announce maintenance window with expected duration and impact
4. **Create pre-upgrade backup** -- Full database backup and configuration backup
5. **Apply upgrade** -- `kolla-ansible -i inventory pull` to pull new container images, then `kolla-ansible -i inventory upgrade` to apply
6. **Verify services** -- Run health checks on all services, verify API responses
7. **Run integration tests** -- Execute end-to-end test suite (authenticate, create network, launch instance, attach storage)
8. **Document** -- Record upgrade in change log with version numbers and any issues encountered

### 5.2 Major Release Upgrades

Major upgrades (e.g., OpenStack 2024.1 to 2024.2) carry higher risk and require more preparation:

1. **Review upgrade notes** -- Read the official OpenStack release notes and Kolla-Ansible upgrade documentation
2. **Check compatibility** -- Verify hardware, OS, and dependency compatibility with the new release
3. **Plan rollback** -- Document step-by-step rollback procedure; verify it is executable
4. **Prepare infrastructure** -- Ensure sufficient disk space for new container images alongside old ones
5. **Create full backup** -- Database, configuration, and volume snapshots
6. **Execute upgrade** -- Follow Kolla-Ansible major upgrade procedure:
   - Pull new images: `kolla-ansible -i inventory pull`
   - Run pre-upgrade checks: `kolla-ansible -i inventory prechecks`
   - Execute upgrade: `kolla-ansible -i inventory upgrade`
7. **Post-upgrade verification:**
   - All services report correct version
   - All API endpoints respond
   - Database migrations completed successfully
   - Integration tests pass
   - Performance baseline comparison (no degradation beyond acceptable threshold)

### 5.3 Pre-Upgrade Checklist

| Item | Status |
|------|--------|
| Release notes reviewed | [ ] |
| Compatibility verified (hardware, OS, dependencies) | [ ] |
| Rollback procedure documented and tested | [ ] |
| Full backup completed (database, config, volumes) | [ ] |
| Stakeholders notified of maintenance window | [ ] |
| Monitoring dashboards open and baseline recorded | [ ] |
| Team available for duration of upgrade window | [ ] |

### 5.4 Post-Upgrade Verification

| Item | Verification Method | Status |
|------|-------------------|--------|
| All services healthy | `openstack service list` shows all enabled and up | [ ] |
| Token issuance works | `openstack token issue` succeeds | [ ] |
| Instance launch works | Test instance creates and boots successfully | [ ] |
| Network connectivity | Floating IP reachable from external network | [ ] |
| Storage operations | Volume create, attach, write, detach succeeds | [ ] |
| Monitoring active | Grafana dashboards show data, no alert gaps | [ ] |
| Performance acceptable | Key metrics within 10% of pre-upgrade baseline | [ ] |

---

## 6. Incident Response

Incidents are deviations from normal operations that require immediate attention. Per SP-6105 SS 5.4, the system must perform under realistic conditions -- incident response is how the operations crew maintains that performance when things go wrong.

### 6.1 Incident Classification

| Severity | Definition | Response Time | Examples |
|----------|-----------|---------------|---------|
| **Critical** | Service outage affecting all users | Immediate (< 15 min) | Keystone down (no authentication), all compute hosts unreachable, database corruption |
| **Major** | Degraded performance or partial outage | Within 1 hour | Single service API slow, one compute host down (others available), backup failure |
| **Minor** | Cosmetic or non-impacting issues | Within business day | Horizon theme broken, log rotation not running, stale monitoring data |

### 6.2 Triage Procedure

When an incident is detected (by monitoring alert or user report):

1. **Identify the affected service** -- Which OpenStack service is experiencing the issue? Check service status: `openstack service list`
2. **Check service logs** -- Examine container logs for the affected service: `docker logs <service_container>`
3. **Consult the runbook library** -- Search `docs/runbooks/` by symptom index for the matching procedure
4. **Assess blast radius** -- Determine which users, projects, and dependent services are affected
5. **Classify severity** -- Apply the classification table above based on impact scope and duration
6. **Begin remediation** -- Follow the matching runbook procedure or escalate if no runbook exists

### 6.3 Escalation Path

The escalation path follows the communication loop hierarchy:

1. **SURGEON detects anomaly** -- Health loop sends advisory to FLIGHT
2. **FLIGHT assesses severity** -- Classifies the incident and determines response level
3. **EXEC executes runbook** -- For known incidents with documented procedures
4. **CRAFT specialist engaged** -- For domain-specific issues requiring expert knowledge (CRAFT-network for Neutron issues, CRAFT-security for authentication issues, CRAFT-storage for volume issues)
5. **CAPCOM escalates to human operator** -- When automated remediation fails or when the incident requires human judgment (per NPR 7123.1 SS 5.4, critical decisions during operations require appropriate authority)

### 6.4 Post-Incident Review

After every Critical and Major incident, conduct a post-incident review:

- **Timeline** -- Reconstruct the event sequence from detection through resolution
- **Root cause** -- Identify the underlying cause, not just the immediate trigger
- **Impact assessment** -- Document affected users, duration, and data loss (if any)
- **Lessons learned** -- What should change to prevent recurrence? New monitoring rule? Updated runbook? Configuration change?
- **Action items** -- Specific, assigned, time-bound improvements
- **Runbook update** -- If the incident revealed a gap in the runbook library, create or update the relevant runbook

For detailed incident-specific procedures, refer to the runbook library (`docs/runbooks/`).

---

## 7. Operational Health Checks

Scheduled health checks ensure that problems are discovered proactively rather than reactively. These checks are the operations crew's discipline -- they prevent the slow drift from "everything works" to "we think everything works."

### 7.1 Daily Health Checks

Performed every business day by the operations crew:

- [ ] **Service status** -- All OpenStack services report healthy (`openstack service list`)
- [ ] **Log review** -- Review error-level log entries from the past 24 hours across all services
- [ ] **Disk space** -- Verify all hosts have adequate free disk space (> 20% on all partitions)
- [ ] **Backup verification** -- Confirm last night's database backup completed successfully
- [ ] **Monitoring status** -- Grafana dashboards loading, Prometheus scraping all targets
- [ ] **Alert review** -- Review and acknowledge any outstanding alerts

### 7.2 Weekly Health Checks

Performed once per week, in addition to daily checks:

- [ ] **Capacity review** -- Check resource utilization trends (compute, storage, network). Are we approaching any thresholds?
- [ ] **Security event audit** -- Review authentication logs for unusual patterns (failed logins, privilege escalations, new admin accounts)
- [ ] **Backup verification** -- Restore at least one database backup to verify integrity (rotate through services weekly)
- [ ] **Certificate status** -- Check certificate expiry dates; any expiring within 30 days triggers renewal
- [ ] **Patch review** -- Check for new OpenStack security advisories (OSSA) and bug fixes

### 7.3 Monthly Health Checks

Performed once per month, in addition to daily and weekly checks:

- [ ] **Performance baseline comparison** -- Compare current metrics against the Phase D performance baseline. Flag any degradation > 10%
- [ ] **Certificate expiry check** -- Full certificate inventory review; plan renewals for anything expiring within 90 days
- [ ] **Full integration test** -- Execute the complete end-to-end test suite (authenticate, create project, configure network, launch instance, attach storage, access via floating IP)
- [ ] **Storage capacity planning** -- Project storage growth and estimate time to capacity threshold
- [ ] **User and project audit** -- Review active users and projects; disable any that are no longer needed

### 7.4 Quarterly Health Checks

Performed once per quarter, in addition to all above:

- [ ] **Security audit** -- Comprehensive security review: RBAC policies, network segmentation, certificate chain validation, vulnerability scan
- [ ] **Upgrade assessment** -- Evaluate available OpenStack upgrades for applicability and risk
- [ ] **Documentation accuracy verification** -- Run doc-verifier against the running system to detect drift between documentation and actual configuration (per SP-6105 SS 5.4, ongoing validation includes documentation accuracy)
- [ ] **Full recovery drill** -- Execute a full backup-and-restore drill on a non-production copy to verify disaster recovery capability
- [ ] **Lessons learned review** -- Compile operational lessons from the quarter and update the lessons learned document

---

## 8. Phase Gate Criteria -- ORR (Operations Handoff Review)

The ORR gate verifies that the system is ready for sustained operations and that the operations crew is prepared to assume responsibility. Per SP-6105 SS 5.5 (Product Transition) and NPR 7123.1 SS 5.4, the transition to operations must be a verified, documented event.

### ORR Checklist

| # | Criterion | Verification Method | Evidence |
|---|-----------|-------------------|----------|
| 1 | Operations crew has documented handoff checklist with all items signed off | Inspection: signed handoff document | Handoff record with all signatures |
| 2 | All runbooks verified against running system | Demonstration: doc-verifier reports zero Critical drift | doc-verifier report |
| 3 | Monitoring dashboards accessible and alerting rules active | Demonstration: dashboards load with live data; synthetic alert fires correctly | Screenshot of dashboard; alert notification receipt |
| 4 | Backup procedure executed and restore verified | Demonstration: database backup created and successfully restored | Backup log and restore verification output |
| 5 | Operations crew trained on all day-2 procedures | Inspection: training records for each crew member | Training completion certificates |
| 6 | Incident response procedures documented and rehearsed | Demonstration: tabletop exercise for Critical incident scenario | Exercise record and after-action notes |
| 7 | Escalation paths documented and communication channels verified | Test: CAPCOM escalation test message delivered successfully | Escalation matrix and test confirmation |
| 8 | Performance baseline documented from Phase D | Inspection: baseline document with metrics and thresholds | Phase D verification report |

**Gate decision:** All items must be satisfied for ORR pass. Any failed item blocks the handoff until remediated. The operations crew does not assume responsibility until FLIGHT (deployment) and FLIGHT (operations) both sign the handoff record.

---

## Cross-References

| Reference | Section | Relevance |
|-----------|---------|-----------|
| SP-6105 SS 5.4 | Product Validation | Ongoing system validation under operational conditions |
| SP-6105 SS 5.5 | Product Transition | Formal handoff from deployment to operations crew |
| NPR 7123.1 SS 5.4 | Operations and Maintenance | Operational sustainment requirements and review criteria |
| SP-6105 SS 6.5 | Configuration Management | Change control for operational configurations |
| SP-6105 SS 6.7 | Technical Assessment | Ongoing monitoring and health assessment |
| NPR 7123.1 SS 2.2 | Tailoring | Tailoring rationale for operational review formality |

---

*SE Phase: Phase E -- Operations and Sustainment*
*SP-6105 SS 5.4-5.5 | NPR 7123.1 SS 5.4*
*Review Gate: ORR (Operational Readiness Review)*

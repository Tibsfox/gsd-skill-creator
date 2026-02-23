# Chapter 7: Closeout -- Graceful Shutdown

| Field | Reference |
|-------|-----------|
| **SE Phase** | Phase F |
| **SP-6105** | SS 6.1 |
| **NPR 7123.1** | SS 6.1 |
| **Review Gate** | DR (Decommissioning Review) |

Phase F is the planned completion of the lifecycle. Decommissioning a cloud is not a failure -- it is the final phase of a well-managed system. Hardware reaches end-of-life. Organizations consolidate infrastructure. Projects conclude. New platforms replace old ones. Whatever the reason, a cloud that was built with engineering discipline deserves to be shut down with the same discipline.

Per SP-6105 SS 6.1 (Technical Planning), the lifecycle plan includes closeout from the beginning. The fact that this chapter exists in the Systems Administrator's Guide -- written before the cloud is even deployed -- is itself a SP-6105 requirement: plan for the end before you build the beginning.

This chapter covers the complete decommissioning sequence: from the decision to shut down, through data preservation, service removal, resource recovery, and the compilation of lessons learned that feed into future missions.

---

## 1. When to Decommission

The decision to decommission is a lifecycle management decision, not an emergency response. Triggers include:

- **Hardware end-of-life** -- The physical infrastructure has reached the end of its useful service period, and replacement is not justified for the current workload
- **Platform migration** -- The organization is moving to a different cloud platform (public cloud, different private cloud stack, or upgraded OpenStack deployment on new hardware)
- **Infrastructure consolidation** -- Multiple cloud environments are being merged into a single platform for operational efficiency
- **End of project** -- The project that justified the cloud has concluded, and no successor project requires the infrastructure
- **Cost analysis** -- Operational costs (power, cooling, maintenance, personnel) exceed the value delivered by the infrastructure

Per SP-6105 SS 6.1, lifecycle planning includes the planned end of the system. A decommissioning decision should be documented with rationale, approved by stakeholders, and executed through a formal process -- not performed ad hoc under time pressure.

### Decision Criteria Checklist

| Criterion | Assessment | Decision |
|-----------|------------|----------|
| Hardware warranty and support status | [ ] Current / [ ] Expiring / [ ] Expired | |
| Workload migration plan available | [ ] Yes / [ ] No / [ ] Partial | |
| Stakeholder notification completed | [ ] Yes / [ ] In progress / [ ] Not started | |
| Data retention requirements identified | [ ] Yes / [ ] No | |
| Budget for decommissioning activities | [ ] Allocated / [ ] Pending / [ ] None | |
| Timeline for completion | [ ] Defined / [ ] TBD | |

---

## 2. Instance Migration Procedures

Before any services are shut down, all workloads must be migrated or archived. No user data should be lost during decommissioning.

### 2.1 Workload Inventory

Create a complete inventory of all active workloads:

```bash
# List all projects
openstack project list --long

# For each project, inventory instances
openstack server list --all-projects --long

# Inventory volumes
openstack volume list --all-projects --long

# Inventory networks
openstack network list --long

# Inventory floating IPs
openstack floating ip list --long

# Inventory security groups
openstack security group list --all-projects
```

Document each workload with:
- **Owner** -- The project and user responsible for the workload
- **Classification** -- Active (must migrate), Inactive (can archive), Abandoned (can delete after confirmation)
- **Dependencies** -- Other services or workloads that depend on this one
- **Data sensitivity** -- Data handling requirements for migration and archival

### 2.2 Data Export

For each workload classified as "Active" or "Inactive":

1. **Export instance data** -- Create volume snapshots for all attached volumes; create instance snapshots as Glance images
2. **Export configuration** -- Document instance configuration: flavor, networks, security groups, metadata, user data scripts
3. **Export network configuration** -- Document network topology, subnet allocations, security group rules, floating IP assignments
4. **Export object storage** -- Download all Swift containers and objects to local archive

### 2.3 Stakeholder Notification

Provide stakeholders with a formal migration timeline:

1. **T-90 days** -- Initial notification: decommissioning planned, stakeholders identify workloads for migration
2. **T-60 days** -- Migration plan published: specific dates for each service shutdown, migration support available
3. **T-30 days** -- Final warning: all workloads must be migrated or archived by T-14
4. **T-14 days** -- Service freeze: no new instances, volumes, or networks may be created
5. **T-7 days** -- Final verification: confirm all data migrated or archived; obtain written confirmation from each project owner
6. **T-0** -- Service shutdown begins

### 2.4 Migration Completeness Verification

Before proceeding to service shutdown, verify migration is complete:

- [ ] All active workloads migrated to target platform and verified operational
- [ ] All inactive workloads archived with integrity verification
- [ ] Written confirmation received from every project owner
- [ ] No running instances remain (excluding infrastructure services)
- [ ] All user-created volumes either migrated, archived, or confirmed deletable
- [ ] All user data in Swift either migrated, archived, or confirmed deletable

---

## 3. Data Export and Archive

Systematic data preservation ensures that operational history, configurations, and metrics are available for future reference and audit requirements.

### 3.1 Project Data Export

For each OpenStack project:

| Data Type | Export Method | Archive Format |
|-----------|-------------|----------------|
| Instance snapshots | `openstack image save --file` | QCOW2/RAW files |
| Volume snapshots | Cinder backup to file | Volume backup files |
| Network topology | `openstack network show`, `openstack subnet show` | JSON exports |
| Security group rules | `openstack security group show` | JSON exports |
| Object storage | `swift download --all` | Directory tree |
| Project metadata | `openstack project show` | JSON export |

### 3.2 Service Database Archive

Archive all service databases before shutdown:

| Database | Archive Command | Verification |
|----------|----------------|-------------|
| Keystone | `mysqldump keystone > keystone-final.sql` | Row count comparison |
| Nova | `mysqldump nova nova_api nova_cell0 > nova-final.sql` | Row count comparison |
| Neutron | `mysqldump neutron > neutron-final.sql` | Row count comparison |
| Cinder | `mysqldump cinder > cinder-final.sql` | Row count comparison |
| Glance | `mysqldump glance > glance-final.sql` | Row count comparison |
| Heat | `mysqldump heat > heat-final.sql` | Row count comparison |

### 3.3 Configuration Archive

Preserve the complete configuration history:

- **Kolla-Ansible configuration** -- Archive `/etc/kolla/` directory tree (globals.yml, inventory, all service configs)
- **Git repository** -- Push final state of the configuration management repository; tag as `decommission-final`
- **Certificate archive** -- Archive all TLS certificates with metadata (issuance date, expiry, CA chain)
- **Custom scripts** -- Archive any operational scripts, monitoring configurations, and automation

### 3.4 Monitoring Data Archive

Preserve operational history:

- **Prometheus metrics** -- Export time series data using Prometheus API or snapshot functionality
- **Grafana dashboards** -- Export all dashboard definitions as JSON
- **Alert history** -- Export Alertmanager alert history
- **Log archives** -- Archive service logs from the operational period

### 3.5 Documentation Archive

Create a versioned snapshot of all documentation:

- **Systems Administrator's Guide** -- This document and all chapters
- **Operations Manual** -- All per-service procedures
- **Runbook Library** -- All runbooks with their verification status
- **Decision records** -- All architectural and operational decisions from git history
- **Lessons learned** -- The operational journal (compiled in Section 6)

### 3.6 Archive Integrity Verification

After all archives are created:

1. **Generate checksums** -- SHA-256 for every archive file
2. **Create manifest** -- Document listing all archive files with sizes, checksums, and descriptions
3. **Test restore** -- Restore at least one database archive and one configuration archive to verify integrity
4. **Store securely** -- Copy archives to long-term storage with appropriate access controls
5. **Verify storage** -- Confirm archives are readable from storage and checksums match

---

## 4. Service Decommissioning Sequence

Services must be shut down in reverse dependency order. During deployment (Phase D), services were brought up in dependency order: Keystone first, then Glance, Nova, Neutron, Cinder, and so on. Decommissioning reverses this order to prevent orphaned resources and ensure clean shutdown.

**Why reverse order matters:** Each service depends on services below it in the stack. If Keystone (identity) is shut down before Nova (compute), Nova cannot authenticate API requests and will fail ungracefully. If Neutron (networking) is shut down before Nova, running instances lose network connectivity with no way to clean up ports. Reverse order ensures that each service is shut down only after all services that depend on it have already been stopped.

### Decommissioning Order

| Step | Service | Justification | Pre-Shutdown Verification |
|------|---------|--------------|--------------------------|
| 1 | **Heat** (Orchestration) | No active stacks remaining; Heat depends on all other services | `openstack stack list` returns empty |
| 2 | **Horizon** (Dashboard) | Web interface no longer needed; depends on all API services | No active user sessions |
| 3 | **Swift** (Object Storage) | All objects archived or migrated | `swift stat` shows zero objects in user containers |
| 4 | **Cinder** (Block Storage) | All volumes detached, archived, or deleted | `openstack volume list --all-projects` shows no in-use volumes |
| 5 | **Neutron** (Networking) | All ports released, no active networks needed | `openstack port list --all-projects` shows only infrastructure ports |
| 6 | **Nova** (Compute) | All instances terminated | `openstack server list --all-projects` returns empty |
| 7 | **Glance** (Images) | All images archived | Image archive manifest complete |
| 8 | **Keystone** (Identity) | Last service shutdown; no longer authenticating anyone | All other services confirmed stopped |

### Per-Service Shutdown Procedure

For each service in the decommissioning order:

1. **Verify preconditions** -- Run the pre-shutdown verification command from the table above
2. **Disable the service** -- Prevent new requests: `openstack service set --disable <service>`
3. **Drain active requests** -- Wait for in-flight operations to complete (monitor API request count dropping to zero)
4. **Stop containers** -- `docker stop <service_containers>` for all containers of the service
5. **Verify stopped** -- `docker ps` confirms no containers for the service are running
6. **Record completion** -- Log the service shutdown time and final state in the decommissioning record

---

## 5. Resource Recovery

After all OpenStack services are stopped, the infrastructure must be cleaned up and hardware returned to a usable state.

### 5.1 Container and Image Removal

Remove all Kolla-Ansible containers and images:

```bash
# Remove all Kolla containers and images
kolla-ansible destroy --yes-i-really-really-mean-it

# Verify no OpenStack containers remain
docker ps -a | grep -i kolla

# Remove any remaining images
docker images | grep -i kolla | awk '{print $3}' | xargs docker rmi

# Clean up Docker volumes
docker volume prune -f
```

### 5.2 Storage Cleanup

Remove storage artifacts:

- **LVM volume groups** -- Remove Cinder LVM volume groups and physical volumes created for OpenStack
- **Swift rings** -- Remove Swift ring files and storage directories
- **Glance image store** -- Remove the Glance image storage directory
- **Docker storage** -- Reclaim Docker storage pool space

```bash
# Remove Cinder LVM (if applicable)
vgremove cinder-volumes

# Remove Swift data directories (if applicable)
rm -rf /srv/node/*

# Remove Glance image store
rm -rf /var/lib/glance/images/
```

### 5.3 Network Configuration Restoration

Restore network configuration to pre-deployment state:

- **Remove OVS/OVN bridges** -- Delete OpenStack-managed bridges (`br-int`, `br-ex`, `br-tun`)
- **Restore interface configuration** -- Revert network interface files to pre-deployment configuration
- **Remove iptables/nftables rules** -- Clean up any firewall rules added by OpenStack services
- **Verify connectivity** -- Confirm the host has basic network connectivity after cleanup

```bash
# Remove OVS bridges (if OVS was used)
ovs-vsctl del-br br-int
ovs-vsctl del-br br-ex
ovs-vsctl del-br br-tun

# Restart networking
systemctl restart NetworkManager
```

### 5.4 Hardware Verification

After cleanup, verify the hardware is clean and available for reuse:

- [ ] No OpenStack containers running (`docker ps` shows no kolla containers)
- [ ] No OpenStack processes running (no nova, neutron, cinder, etc. processes)
- [ ] Storage reclaimed (LVM volumes removed, disk space available)
- [ ] Network configuration restored (interfaces working, no stale bridges)
- [ ] Host accessible via SSH and management network
- [ ] Hardware health checks pass (disk SMART status, memory test, CPU test)

### 5.5 Hardware Inventory Update

Update the hardware inventory to reflect the recovered resources:

- **Asset register** -- Update the status of each hardware asset from "in service (OpenStack)" to "available"
- **Capacity inventory** -- Record available compute, storage, and network resources
- **Condition assessment** -- Note any hardware degradation discovered during operations (disk wear, memory errors, fan failures)
- **Disposition recommendation** -- For each asset: reuse, repurpose, retire, or dispose

---

## 6. Lessons Learned Compilation

Per NASA's Lessons Learned Information System (LLIS) methodology, every mission produces a formal lessons learned document. Each lesson must be specific, actionable, and traceable to the experience that generated it. This is not a vague retrospective -- it is an engineering document that improves future missions.

Per SP-6105 SS 6.1, technical planning includes capturing lessons learned for process improvement. NPR 7123.1 SS 6.1 requires that lessons learned be documented and disseminated to benefit future projects.

### 6.1 What Worked Well

Document the aspects of the deployment and operations that succeeded:

- **Deployment automation** -- Which Kolla-Ansible procedures worked reliably? What was the time from bare hardware to working cloud?
- **Documentation methodology** -- Did the NASA SE-structured documentation improve operational outcomes? Were operators able to use the guides effectively?
- **Monitoring and alerting** -- Did the monitoring system catch problems before users reported them? Were alert thresholds appropriate?
- **Crew structure** -- Did the deployment/operations/documentation crew model improve coordination? Were role boundaries clear?
- **Communication framework** -- Did the communication loops route information effectively? Were priority levels appropriate?

### 6.2 What Could Be Improved

Document friction points and process gaps with honesty:

- **Areas of friction** -- Which procedures took longer than expected? Where did operators deviate from documented procedures?
- **Pain points** -- What caused the most frustration during operations? What would operators change first?
- **Process gaps** -- What situations arose that had no documented procedure? What runbooks were missing?
- **Documentation drift** -- How quickly did documentation fall out of date? Was the doc-verifier effective at catching drift?
- **Tool limitations** -- What capabilities were missing from the tooling? What manual steps should have been automated?

### 6.3 Actionable Recommendations

Each recommendation must be:
- **Specific** -- Describe exactly what should change
- **Actionable** -- Describe how to implement the change
- **Traceable** -- Reference the specific experience that motivated the recommendation

**Recommendation format (NASA LLIS):**

| Field | Content |
|-------|---------|
| **Lesson ID** | LL-CLOUD-NNN |
| **Title** | Concise description |
| **Driving Event** | What happened that taught this lesson |
| **Lesson** | What was learned |
| **Recommendation** | Specific action for future projects |
| **Evidence** | Data, logs, metrics, or testimony supporting the lesson |
| **Applicable Domains** | Which types of projects should apply this lesson |

### 6.4 Formal LLIS Document

The complete lessons learned document is maintained at `docs/lessons-learned.md` (produced in Phase 325). This section produces the raw material -- observations, data, and draft recommendations -- that the formal document synthesizes.

Per NASA's LLIS methodology:
- Each lesson should be specific to a concrete experience, not a general principle
- Each lesson should be actionable -- someone reading it should know what to do differently
- Each lesson should be traceable to evidence -- logs, metrics, incident reports, or operator testimony
- The minimum is 3 actionable recommendations; missions of this scope typically produce 10-15

---

## 7. Final Mission Report

The final mission report summarizes the complete lifecycle from concept (Pre-Phase A) through closeout (Phase F). This is the historical record of what was built, why it was built that way, and what it achieved.

### 7.1 Mission Timeline

| Phase | Duration | Key Milestone |
|-------|----------|---------------|
| Pre-Phase A: Concept Studies | [dates] | Cloud Architecture Review (MCR) passed |
| Phase A: Technology Development | [dates] | Requirements Baseline Review (SRR) passed |
| Phase B: Preliminary Design | [dates] | Configuration Review (PDR) passed |
| Phase C: Final Design & Build | [dates] | Pre-Deployment Review (CDR) passed |
| Phase D: Integration & Test | [dates] | Integration Test Review (SIR) passed |
| Phase E: Operations | [dates] | Operations Handoff Review (ORR) passed |
| Phase F: Closeout | [dates] | Decommissioning Review (DR) passed |

### 7.2 Requirements Fulfillment Summary

| Category | Total | Met | Waived | Deferred | Notes |
|----------|-------|-----|--------|----------|-------|
| Functional | | | | | |
| Performance | | | | | |
| Security | | | | | |
| Availability | | | | | |
| Documentation | | | | | |

For each waived or deferred requirement, document the rationale and approval authority.

### 7.3 Key Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total operational uptime | | 99.5% | |
| Total incidents (Critical) | | < 5 | |
| Total incidents (Major) | | < 20 | |
| Changes deployed | | | |
| Documentation accuracy (last verification) | | > 95% | |
| Mean time to recovery (MTTR) | | < 1 hour | |
| Backup success rate | | 100% | |
| Runbooks verified against system | | 100% | |

### 7.4 Recommendations for Successor Systems

Based on the complete lifecycle experience, recommendations for the next deployment:

- **Architecture recommendations** -- What should change in the design? Multi-node? Different storage backend? Different networking model?
- **Process recommendations** -- What should change in how the cloud is managed? More automation? Different crew structure? Different review cadence?
- **Documentation recommendations** -- What should change in how docs are produced and maintained? Different verification frequency? Different format?
- **Tooling recommendations** -- What tools should be added, removed, or replaced?

---

## 8. Phase Gate Criteria -- DR (Decommissioning Review)

The DR gate verifies that the decommissioning was executed completely and that all data preservation requirements are satisfied. Per SP-6105 SS 6.1 and NPR 7123.1 SS 6.1, closeout is a planned, verified activity -- not an afterthought.

### DR Checklist

| # | Criterion | Verification Method | Evidence |
|---|-----------|-------------------|----------|
| 1 | All user data migrated or archived with written confirmation | Inspection: signed confirmation from each project owner | Migration confirmation documents |
| 2 | All services stopped with no OpenStack processes running | Test: `docker ps` shows no kolla containers; `ps aux` shows no OpenStack processes | Terminal output |
| 3 | Hardware resources recovered and inventoried | Inspection: updated asset register with status and condition | Asset register |
| 4 | Lessons learned document published in NASA LLIS format with at least 3 actionable recommendations | Inspection: `docs/lessons-learned.md` contains LLIS-formatted entries | Lessons learned document |
| 5 | Archive integrity verified | Test: checksums match, test restore succeeds | Archive manifest with checksums |
| 6 | Final mission report complete | Inspection: all sections populated with data | Final mission report |
| 7 | Network and storage restored to pre-deployment state | Demonstration: host accessible, no OpenStack artifacts | System state verification |

**Gate decision:** All items must be satisfied for DR pass. The DR marks the formal end of the cloud lifecycle. After DR pass, the mission is complete.

---

## Cross-References

| Reference | Section | Relevance |
|-----------|---------|-----------|
| SP-6105 SS 6.1 | Technical Planning | Lifecycle planning includes closeout; lessons learned capture |
| NPR 7123.1 SS 6.1 | Closeout | Decommissioning requirements and review criteria |
| SP-6105 SS 6.5 | Configuration Management | Final configuration baseline and archive |
| SP-6105 SS 6.6 | Technical Data Management | Data archival and retention requirements |
| NASA LLIS | Lessons Learned | Format and methodology for lessons learned compilation |
| NPR 7120.5 | Program Management | Program closeout and reporting requirements |

---

*SE Phase: Phase F -- Closeout*
*SP-6105 SS 6.1 | NPR 7123.1 SS 6.1*
*Review Gate: DR (Decommissioning Review)*

# Network Change Operations

**Module:** 02 -- Systems Network Operations (SNO) Research Series
**Date:** 2026-04-08
**Domain:** Network Change Control, Configuration Management, Rollback Procedures

---

Network changes are the single largest source of network outages. Industry surveys from Uptime Institute and Gartner consistently attribute 60-80% of network downtime to human error during configuration changes. The remaining fraction splits between hardware failures and external events like fiber cuts or power loss. This is not a surprise -- a network device is a single point of amplification. A misconfigured access list on a server affects one service. A misconfigured access list on a core router affects every service behind it. The blast radius of network changes is categorically different from application changes, and the change process must reflect that difference.

This module covers the full lifecycle of network change operations: scheduling maintenance windows with carriers and customers, executing pre-change and post-change verification, managing configuration backups and version control, implementing rollback procedures that actually work under pressure, handling emergency changes when there is no time for the normal process, executing bulk changes across hundreds of devices, and validating changes in lab environments before they touch production. The SOO module (03 -- Change Management & Control) covers the organizational framework of change management -- ITIL, CABs, risk scoring. This module is about the hands-on network-specific execution that lives inside that framework.

---

## 1. Maintenance Window Scheduling

### Carrier Coordination

Network changes frequently involve circuits, cross-connects, or services provided by carriers, ISPs, or colocation providers. Carrier coordination adds lead time that application deployments never face. A BGP peering change requires the upstream provider to modify their route policy. A circuit migration requires the carrier to provision the new circuit and schedule the cutover. A cross-connect installation requires the colocation provider to dispatch a technician.

Standard carrier lead times for common operations:

| Operation | Typical Lead Time | Notes |
|-----------|-------------------|-------|
| BGP policy change (existing peer) | 1-5 business days | Depends on provider NOC responsiveness |
| New circuit provisioning | 30-90 days | Metro fiber faster than long-haul |
| Cross-connect installation | 3-10 business days | Colo-dependent |
| Circuit bandwidth upgrade | 5-15 business days | Same fiber, different optic or rate |
| IP address block assignment | 1-5 business days | ARIN/RIPE allocation if new space needed |
| DNS delegation change | 24-72 hours | TTL propagation after registrar update |

**The coordination trap:** scheduling a maintenance window for Tuesday night when the carrier's change is scheduled for Wednesday morning. Always confirm the carrier's maintenance window aligns with yours before committing to a customer notification. Get the carrier's change ticket number and a named contact who will be available during your window.

### Customer Notification

Customer notification follows a lifecycle that scales with change impact:

**Standard changes** (pre-authorized, low risk): notification 3-5 business days in advance, single email, no expected impact or brief sub-second failover.

**Normal changes** (requires approval, moderate risk): notification 5-10 business days in advance, email plus status page update, expected impact window and duration documented, reminder 24 hours before, start/progress/completion notifications during execution.

**Emergency changes** (immediate, unplanned): notification concurrent with or immediately after execution, root cause and duration documented within 24 hours.

The notification should answer five questions from the customer's perspective: What is changing? When is the maintenance window? What will the customer experience (outage, degraded performance, brief failover)? How long will the impact last? Who do they contact if something is wrong?

### Time Zone Considerations

Global networks have no good maintenance windows. When it is 2:00 AM in Seattle it is 10:00 AM in London and 7:00 PM in Tokyo. The strategies:

**Regional maintenance windows.** Schedule changes to affect one region at a time during that region's low-traffic hours. This works when the network is segmented regionally and changes can be isolated.

**Follow-the-sun rolling changes.** For global changes (firmware upgrades, security patches), start in the region where it is currently off-peak, verify success, then roll to the next region as their off-peak begins. A 24-hour rolling window can touch every region during its low-traffic period.

**UTC-normalized scheduling.** All maintenance windows are published in UTC to eliminate conversion errors. Every NOC engineer should think in UTC. Post a wall clock set to UTC in the NOC. Use UTC in all change tickets, runbooks, and scripts.

**The Friday Rule:** never schedule a change for Friday night. If it fails, weekend staffing is thin, vendor support is slower, and the engineers who made the change are exhausted or unavailable by Saturday afternoon. Tuesday and Wednesday nights are the industry standard for maintenance windows -- early enough in the week for full staffing, late enough to have Monday's fires resolved.

---

## 2. Change Control for Network Devices

### Network-Specific Risk

Network device changes carry unique risk characteristics that generic IT change management does not adequately address:

**Single-command blast radius.** Entering `shutdown` on the wrong interface, applying a deny-all ACL to a management interface, or committing a route-map that filters the default route -- any of these takes seconds to execute and minutes to hours to diagnose and recover, especially if the change disconnects you from the device you are configuring.

**Configuration atomicity varies by platform.** Junos applies configurations atomically -- either the entire commit succeeds or nothing changes. IOS applies commands line by line as you type them -- there is no transaction boundary, no implicit rollback if line 47 of a paste fails. NX-OS has checkpoint/rollback but the behavior differs from Junos. Arista EOS has a configure session mode that provides candidate configuration semantics similar to Junos. Understanding your platform's configuration model is prerequisite to safe change execution.

**Out-of-band access is your safety net.** If a change locks you out of a device over the network, you need an alternative path: a console server (Opengear, ZPE Systems, Lantronix), a cellular out-of-band link, or physical console access. Every network device that carries production traffic should have out-of-band console access configured and tested before you need it.

### The Network Change Checklist

Before executing any network change, walk through this checklist:

```
NETWORK CHANGE PRE-FLIGHT CHECKLIST
========================================================

[ ] Change ticket created and approved
[ ] Runbook written with exact commands (copy-pasteable)
[ ] Rollback procedure written with exact commands
[ ] Rollback tested in lab (or verified on similar device)
[ ] Maintenance window confirmed with all stakeholders
[ ] Carrier coordination confirmed (if applicable)
[ ] Customer notification sent (if applicable)
[ ] Out-of-band access verified to target device(s)
[ ] Pre-change verification script executed and baseline saved
[ ] Colleague available for peer review / second pair of eyes
[ ] Monitoring dashboard open showing affected services
[ ] Contact list ready (NOC, carrier, management escalation)
```

### Peer Review of Network Changes

Network changes benefit enormously from peer review, but the review happens differently than code review. The reviewer should:

1. Read the runbook and mentally execute each command, predicting the effect
2. Verify the rollback procedure reverses each change
3. Check for missing steps (did you save the running config after changes on IOS?)
4. Identify the point of no return -- after which step can you no longer roll back cleanly?
5. Confirm the commands match the correct device hostnames, interface names, and IP addresses

The most common network change errors are not conceptual -- they are transcription errors. The wrong interface number. A /24 typed as /32. A permit that should be a deny. Peer review catches these before they reach production.

---

## 3. Pre-Change Verification

Pre-change verification captures the current state of the network so that post-change verification has a baseline to compare against. This is not optional. Without a baseline, you cannot distinguish between a problem caused by your change and a pre-existing condition.

### What to Capture

The verification scope depends on the change type, but a general-purpose pre-change capture includes:

**Layer 1 -- Physical.** Interface status (up/down), error counters, optical light levels (if applicable), CRC errors, input/output drops.

**Layer 2 -- Switching.** MAC address table entries, STP topology state, VLAN membership, LACP/port-channel status, ARP table.

**Layer 3 -- Routing.** Routing table (full or relevant subnets), BGP neighbor state and prefix counts, OSPF/IS-IS neighbor adjacencies, VRRP/HSRP state, static route entries.

**Layer 4+ -- Services.** NAT translations (if applicable), firewall session counts, load balancer pool status, QoS queue counters.

**Reachability.** Ping tests to critical endpoints, traceroute to verify path, DNS resolution tests.

### Pre-Change Verification Script Example

```bash
#!/bin/bash
# pre-change-verify.sh -- Capture baseline state from network device
# Usage: ./pre-change-verify.sh <device> <change-ticket>

DEVICE=$1
TICKET=$2
TIMESTAMP=$(date -u +%Y%m%d-%H%M%SZ)
OUTDIR="./baselines/${TICKET}/${DEVICE}"
mkdir -p "$OUTDIR"

echo "=== Pre-change capture for ${DEVICE} -- ${TICKET} ==="
echo "=== Timestamp: ${TIMESTAMP} ==="

# Adjust commands per platform (this example: Cisco IOS-XE via SSH)
ssh "$DEVICE" << 'COMMANDS' > "${OUTDIR}/pre-change-${TIMESTAMP}.txt"
terminal length 0
show version
show running-config
show ip route
show ip bgp summary
show ip ospf neighbor
show interfaces status
show interfaces counters errors
show ip arp
show mac address-table count
show standby brief
show clock
COMMANDS

# Reachability tests from management station
echo "--- Reachability tests ---" >> "${OUTDIR}/pre-change-${TIMESTAMP}.txt"
for TARGET in 10.0.0.1 10.1.0.1 8.8.8.8 192.168.1.1; do
    ping -c 5 -W 2 "$TARGET" >> "${OUTDIR}/pre-change-${TIMESTAMP}.txt" 2>&1
done

echo "=== Baseline saved to ${OUTDIR}/pre-change-${TIMESTAMP}.txt ==="
```

For environments using network automation, the same capture can be done with Ansible, Nornir, or NAPALM:

```yaml
# Ansible playbook: pre-change-capture.yml
---
- name: Pre-change baseline capture
  hosts: "{{ target_device }}"
  gather_facts: no
  tasks:
    - name: Capture routing table
      ios_command:
        commands:
          - show ip route
          - show ip bgp summary
          - show ip ospf neighbor
      register: routing_state

    - name: Capture interface state
      ios_command:
        commands:
          - show interfaces status
          - show interfaces counters errors
      register: interface_state

    - name: Save baseline to file
      copy:
        content: |
          === ROUTING STATE ===
          {{ routing_state.stdout | join('\n\n') }}
          === INTERFACE STATE ===
          {{ interface_state.stdout | join('\n\n') }}
        dest: "./baselines/{{ ticket }}/{{ inventory_hostname }}-pre.txt"
      delegate_to: localhost
```

---

## 4. Post-Change Verification

Post-change verification answers two questions: did the change achieve its intended effect, and did the change break anything else?

### Traffic Baseline Comparison

Compare post-change traffic patterns against the pre-change baseline. SNMP polling tools (LibreNMS, Zabbix, PRTG) and streaming telemetry platforms (Telegraf + InfluxDB + Grafana, Kentik, ThousandEyes) provide the data. What to compare:

- **Interface utilization:** traffic volume should remain consistent (unless the change was designed to shift traffic)
- **Error counters:** CRC errors, input errors, output drops, and giants should not increase
- **Packet loss:** end-to-end loss measured by synthetic probes (SLA responders, SmokePing, ThousandEyes) should remain within SLA
- **Latency:** round-trip time to key endpoints should remain stable
- **BGP prefix counts:** the number of prefixes received from each peer should match pre-change state (or change by the expected amount)

### SLA Validation

If the network has defined SLAs -- 99.99% uptime, less than 5ms latency within the metro, less than 50ms to cloud provider -- verify that the change did not push any metric outside SLA boundaries. Automated SLA monitoring should already be running; post-change verification means checking that the SLA dashboard is green, not building new measurements.

### Post-Change Verification Checklist

```
POST-CHANGE VERIFICATION CHECKLIST
========================================================

[ ] Intended change confirmed (new route present, ACL applied, etc.)
[ ] No unexpected interface state changes (nothing went down)
[ ] BGP neighbor states match pre-change (all peers Established)
[ ] OSPF/IS-IS adjacencies match pre-change
[ ] VRRP/HSRP state matches expected (no unexpected failover)
[ ] Error counters not incrementing abnormally
[ ] Traffic levels consistent with baseline
[ ] Ping tests to critical endpoints passing
[ ] Customer-facing services confirmed operational
[ ] Monitoring system shows no new alerts
[ ] Change ticket updated with post-change results
[ ] Running config saved to startup (IOS) / committed (Junos)
```

---

## 5. Configuration Backup Strategies

### RANCID -- The Legacy Standard

RANCID (Really Awesome New Cisco confIg Differ) has been the industry-standard open-source configuration backup tool since the late 1990s. Written in Perl and Expect, RANCID connects to devices on a schedule, downloads the running configuration, and stores it in a version control system (originally CVS, later Subversion or Git). When the configuration changes, RANCID generates a diff and emails it to a distribution list.

RANCID's strengths are its longevity and battle-tested reliability. Its weaknesses are its Perl/Expect architecture (difficult to extend), its limited API, and its lack of a web interface. New device support requires writing Expect scripts, which is tedious and fragile.

### Oxidized -- The Modern Replacement

Oxidized is the contemporary successor to RANCID. Written in Ruby, Oxidized supports over 130 network operating systems out of the box, integrates natively with Git for version-controlled configuration storage, provides a REST API for integration with other tools, and offers a web interface for browsing configurations and diffs. Oxidized runs well in Docker, making deployment and maintenance straightforward.

Key Oxidized capabilities:

- **Scheduled polling:** configurable per-device or global interval (default: every 3600 seconds)
- **Git integration:** each config change creates a Git commit with timestamp, device name, and diff
- **Source flexibility:** device inventory can come from a flat file, a SQL database, an HTTP API, or a custom source
- **Output flexibility:** store configs in Git, flat files, or a custom backend
- **Hooks:** trigger actions on config change (email, Slack, webhook, custom script)
- **REST API:** query device configs, trigger manual collection, check status

### Git-Based Configuration Versioning

Whether using RANCID, Oxidized, or a custom solution, the configuration backup should land in a Git repository. Git provides:

- **Full history:** every configuration change is a commit with a timestamp, diff, and (optionally) the change ticket number in the commit message
- **Blame:** identify when a specific line was added or changed and by which commit
- **Branching:** maintain separate branches for production configs vs. proposed changes
- **Search:** grep across all device configurations to find every device with a specific ACL, community string, or NTP server
- **Diff:** compare any two points in time for any device

The repository structure should mirror the network hierarchy:

```
network-configs/
  dc1/
    core/
      dc1-core-sw01.cfg
      dc1-core-sw02.cfg
    distribution/
      dc1-dist-sw01.cfg
    access/
      dc1-acc-sw01.cfg
      dc1-acc-sw02.cfg
  dc2/
    core/
      dc2-core-sw01.cfg
  wan/
    dc1-wan-rtr01.cfg
    dc1-wan-rtr02.cfg
  firewalls/
    dc1-fw01.cfg
```

### Comparison Matrix

| Feature | RANCID | Oxidized | Custom (Ansible + Git) |
|---------|--------|----------|------------------------|
| Language | Perl/Expect | Ruby | Python/YAML |
| Device support | ~90 types | 130+ types | Any (write your own module) |
| Version control | CVS/SVN/Git | Git (native) | Git |
| Web interface | No | Yes | No (unless built) |
| REST API | No | Yes | No (unless built) |
| Docker support | Community | Official | N/A |
| Diff notification | Email | Email/Slack/webhook | Custom |
| Active development | Minimal | Active | N/A |
| Recommendation | Legacy environments | New deployments | Automation-heavy shops |

---

## 6. Rollback Procedures

### Junos: commit confirmed

Junos has the most mature rollback model in the industry. The `commit confirmed` command activates the candidate configuration temporarily. If the operator does not issue a second `commit` within the confirmation window (default 10 minutes, configurable from 1 to 65,535 minutes), the device automatically rolls back to the previous configuration and sends a broadcast message to all logged-in users.

```
[edit]
user@router# commit confirmed 5
commit confirmed will be automatically rolled back in 5 minutes unless confirmed
Commit complete

# ... verify the change works ...

[edit]
user@router# commit
commit complete

# If you do NOT confirm within 5 minutes:
# "Broadcast Message from root@router"
# "Commit was not confirmed; automatic rollback complete."
```

Junos also stores the last 50 committed configurations, accessible via `rollback N` where N is 0-49 (0 being the most recent). This provides instant access to any recent known-good state.

**Best practice:** always use `commit confirmed` for changes that could disconnect you from the device. Set the timer to match your verification time -- 3-5 minutes for simple changes, 10-15 for complex ones. If you lose connectivity, the device heals itself.

### IOS/IOS-XE: Configuration Archive and Revert

Cisco IOS-XE provides the `configure replace` and `configure revert` commands for rollback capability. The configuration archive must be enabled first:

```
archive
 path flash:archive-config
 maximum 14
 write-memory

configure terminal
 ! Enable the revert timer
 configure revert timer 5
```

The `configure revert timer <minutes>` command starts a countdown. If the operator does not issue `configure confirm` within the specified time (1-120 minutes), IOS-XE reverts to the archived configuration. This is functionally equivalent to Junos `commit confirmed` but requires explicit archive configuration and is not the default behavior.

**The IOS trap:** on classic IOS (not IOS-XE), there is no native rollback timer. The traditional safety net is `reload in 5` -- schedule a reload in 5 minutes, make your change, and if you lose access, the device reboots and loads the startup config. This is crude but effective. Cancel the pending reload with `reload cancel` after confirming the change works.

### NX-OS: Checkpoints

NX-OS supports configuration checkpoints:

```
checkpoint my-checkpoint
! ... make changes ...
! If something goes wrong:
rollback running-config checkpoint my-checkpoint
```

Checkpoints capture the full running configuration at a point in time. Rollback computes the diff between the current running config and the checkpoint and applies the reverse commands.

### Arista EOS: Configure Sessions

Arista EOS provides a candidate configuration model via `configure session`:

```
configure session my-change
! ... make changes in the session ...
show session-config diffs
commit
! Or, to abort:
abort
```

Changes made in a session are not applied until `commit`. The `show session-config diffs` command shows exactly what will change, providing a review step before activation. If anything looks wrong, `abort` discards the session with no impact.

---

## 7. Emergency Change Process

### When to Invoke Emergency Change

Emergency changes bypass the normal approval process when delay would cause greater harm than the risk of an unreviewed change. Legitimate triggers include:

- **Active outage** affecting production services where a configuration change is the fix
- **Fiber cut or circuit failure** requiring immediate traffic rerouting
- **Security incident** such as active DDoS requiring null-route or ACL deployment
- **BGP hijack** requiring origin validation changes or upstream filter requests
- **Carrier emergency maintenance** requiring traffic failover before the carrier's window

### Emergency Change Guardrails

Bypassing approval does not mean bypassing discipline. Emergency changes should still follow minimum guardrails:

1. **Verbal approval** from the on-call network lead or manager (document who approved and when)
2. **Pre-change capture** even if abbreviated -- at minimum, copy the running config to a file before touching anything
3. **Use commit confirmed / revert timer** -- this is doubly important during emergencies when adrenaline increases error rate
4. **Real-time communication** -- keep a bridge line or chat channel open with the NOC, affected teams, and management
5. **Post-incident documentation** within 24 hours -- full change record, root cause, timeline, what was done, retroactive approval from the change authority

### DDoS Mitigation Emergency Procedures

DDoS response is the most common network emergency that requires immediate configuration changes:

```
! Remotely Triggered Black Hole (RTBH) -- null-route attack target
! Announce via iBGP with community triggering upstream null-route

ip prefix-list BLACKHOLE permit 203.0.113.50/32

route-map BLACKHOLE permit 10
 match ip address prefix-list BLACKHOLE
 set community 65000:666
 set ip next-hop 192.0.2.1

ip route 203.0.113.50 255.255.255.255 Null0 tag 666

router bgp 65001
 address-family ipv4
  redistribute static route-map BLACKHOLE
```

The RTBH approach sacrifices the target IP (it becomes unreachable) but protects the rest of the network from collateral damage. More surgical mitigation requires scrubbing services (Cloudflare Magic Transit, Akamai Prolexic, in-house Arbor/Corero) or FlowSpec rules distributed via BGP.

---

## 8. Bulk Change Operations

### Firmware Upgrades Across Hundreds of Switches

Bulk firmware upgrades are among the highest-risk, highest-effort network operations. The staged rollout model is essential:

**Stage 1 -- Lab validation.** Upgrade a lab device (or virtual instance) to the target firmware. Run the full test suite: boot time, feature verification, known bug regression, configuration compatibility.

**Stage 2 -- Canary deployment.** Upgrade one production device in a non-critical role (a redundant access switch with low user count). Monitor for 24-72 hours. Check for memory leaks, CPU anomalies, unexpected reboots, and feature regressions.

**Stage 3 -- Staged rollout.** Divide the fleet into batches. Upgrade one batch per maintenance window. Never upgrade both members of a redundant pair in the same batch. Verify each batch before proceeding to the next.

**Stage 4 -- Cleanup.** After all devices are upgraded, remove the old firmware images from flash to reclaim storage. Update the CMDB, documentation, and monitoring templates to reflect the new version.

### Automation for Bulk Operations

Manual firmware upgrades at scale are impractical. Ansible, Nornir, or vendor-specific tools (Cisco DNA Center, Arista CloudVision, Juniper Apstra) handle the mechanics:

```yaml
# Ansible playbook: staged-firmware-upgrade.yml
---
- name: Stage 1 -- Pre-upgrade checks
  hosts: "{{ batch }}"
  serial: 1
  tasks:
    - name: Check current firmware version
      ios_command:
        commands: show version
      register: version_check

    - name: Verify free flash space
      ios_command:
        commands: dir flash:
      register: flash_check

    - name: Upload firmware image
      net_put:
        src: "files/cat9k_iosxe.17.09.04a.SPA.bin"
        dest: "flash:cat9k_iosxe.17.09.04a.SPA.bin"
      when: "'17.09.04a' not in version_check.stdout[0]"

    - name: Verify image integrity
      ios_command:
        commands: "verify /md5 flash:cat9k_iosxe.17.09.04a.SPA.bin"
      register: md5_check

    - name: Set boot variable
      ios_config:
        lines:
          - "boot system flash:cat9k_iosxe.17.09.04a.SPA.bin"
        save_when: always

    - name: Reload device
      ios_command:
        commands:
          - command: reload
            prompt: 'confirm'
            answer: 'y'
      when: upgrade_approved | bool
```

### The Serial Constraint

Bulk changes must respect redundancy boundaries. Never upgrade both:

- Both members of a VSS / StackWise Virtual pair simultaneously
- Both spine switches in a leaf-spine fabric simultaneously
- Both routers in an HSRP/VRRP pair simultaneously
- Both paths in a dual-homed WAN circuit simultaneously

The `serial: 1` directive in Ansible enforces sequential execution, but the inventory grouping must ensure redundant partners are in different batches. This is an organizational discipline, not a technical one.

---

## 9. Testing in Lab Environments

### GNS3

GNS3 (Graphical Network Simulator 3) is an open-source network emulator that runs real network operating system images (Cisco IOSv, IOU, Junos vMX, etc.) in QEMU/KVM virtual machines. GNS3 provides a graphical topology editor and has been the standard network lab tool for over a decade. It runs 20-30 nodes comfortably on a workstation. Its weakness is resource consumption -- each device runs a full VM -- and the manual effort required to build and manage topologies.

### EVE-NG

EVE-NG (Emulated Virtual Environment - Next Generation) is a server-based network emulation platform accessed via a web browser. The Professional edition (starting at $110/year as of 2026) adds multi-user access with RBAC, lab templates, and clustering across multiple hosts. EVE-NG is strongest for team environments where multiple engineers need shared access to lab topologies. The Community Edition is free but lacks multi-user features.

### Containerlab

Containerlab is the modern approach to network lab environments. It defines topologies in YAML and runs network operating systems as Docker containers. Topologies launch in seconds rather than minutes. Containerlab supports Nokia SR Linux, Arista cEOS, Juniper cRPD, Cisco XRd, and others natively as container images.

Containerlab's killer feature for change validation is CI/CD integration. A network change can be tested automatically as part of a pipeline:

```yaml
# topology.clab.yml -- Containerlab topology for change testing
name: change-validation-lab

topology:
  nodes:
    spine1:
      kind: ceos
      image: ceos:4.32.0F
    spine2:
      kind: ceos
      image: ceos:4.32.0F
    leaf1:
      kind: ceos
      image: ceos:4.32.0F
    leaf2:
      kind: ceos
      image: ceos:4.32.0F

  links:
    - endpoints: ["spine1:eth1", "leaf1:eth1"]
    - endpoints: ["spine1:eth2", "leaf2:eth1"]
    - endpoints: ["spine2:eth1", "leaf1:eth2"]
    - endpoints: ["spine2:eth2", "leaf2:eth2"]
```

```bash
# Deploy, configure, test, destroy
containerlab deploy --topo topology.clab.yml
ansible-playbook apply-proposed-change.yml -i clab-inventory.yml
pytest tests/test_change_validation.py
containerlab destroy --topo topology.clab.yml
```

### Lab Environment Comparison

| Feature | GNS3 | EVE-NG Pro | Containerlab |
|---------|-------|------------|--------------|
| Architecture | Desktop + VM | Server + browser | CLI + Docker |
| Topology definition | GUI (drag-and-drop) | GUI (drag-and-drop) | YAML files |
| Boot time | Minutes | Minutes | Seconds |
| Node scale | 20-30 | 50-100+ (clustered) | 200+ on single host |
| CI/CD integration | Difficult | Possible (API) | Native |
| Multi-user | No (single user) | Yes (RBAC) | No (single user) |
| Cost | Free (open source) | $110+/year (Pro) | Free (open source) |
| Best for | Individual study/test | Team lab environments | Automation/CI/CD |

### What to Test in Lab Before Production

1. **Exact command sequence** from the runbook -- paste the commands into the lab device, verify the expected output
2. **Rollback procedure** -- execute the rollback, verify the device returns to the pre-change state
3. **Failure scenarios** -- what happens if the change is partially applied? What if connectivity is lost mid-change?
4. **Interaction with existing configuration** -- does the new config conflict with existing ACLs, route-maps, or QoS policies?
5. **Scale behavior** -- if the change affects routing, does the routing table converge correctly? Any route oscillation?

---

## 10. Integrated Change Execution Runbook

Bringing all the pieces together, here is the structure of a complete network change execution:

### Phase 1: Preparation (Days Before)

```
[ ] Change ticket created with:
    - Description of change and business justification
    - Affected devices, interfaces, and services
    - Exact commands (runbook)
    - Rollback commands
    - Risk assessment score
    - Carrier coordination details (if applicable)
[ ] Change approved by change authority
[ ] Customer notification sent
[ ] Lab testing completed
[ ] Out-of-band access verified
[ ] Monitoring dashboards bookmarked
```

### Phase 2: Pre-Change (Minutes Before)

```
[ ] Join bridge call / open chat channel with NOC
[ ] Execute pre-change verification script
[ ] Save baseline output to change ticket
[ ] Verify out-of-band access works right now
[ ] Confirm all team members are available
[ ] Open runbook side-by-side with terminal
[ ] Set rollback timer (commit confirmed / configure revert)
```

### Phase 3: Execution

```
[ ] Announce "starting change" on bridge
[ ] Execute runbook commands exactly as written
[ ] After each major step, verify expected result
[ ] If unexpected result: STOP, assess, decide continue or rollback
[ ] Confirm rollback timer is running (do not confirm prematurely)
[ ] Verify change achieved intended effect
[ ] Confirm the change with commit / configure confirm
[ ] Save configuration to startup
```

### Phase 4: Post-Change (Minutes After)

```
[ ] Execute post-change verification script
[ ] Compare against pre-change baseline
[ ] Check monitoring for new alerts
[ ] Verify customer-facing services operational
[ ] Announce "change complete, monitoring" on bridge
[ ] Monitor for 15-30 minutes minimum
```

### Phase 5: Closure

```
[ ] Update change ticket with results
[ ] Update network documentation / diagrams if topology changed
[ ] Verify config backup system has captured new config
[ ] Close change ticket
[ ] If anything went wrong: schedule post-change review
```

---

## 11. Configuration Drift Detection

Configuration drift occurs when the running configuration diverges from the intended (golden) configuration over time. Sources include: emergency changes that were never formally documented, undocumented troubleshooting commands left in place, changes made by multiple engineers without coordination, and vendor TAC recommendations applied during support cases that were never reviewed.

### Detecting Drift

Oxidized's diff notification catches individual changes as they happen. But drift detection requires comparing the current running config against a defined standard:

- **Golden config comparison:** maintain a template (Jinja2, TextFSM) for each device role. Periodically render the template with device-specific variables and diff against the actual running config. Any delta is drift.
- **Compliance scanning:** tools like Batfish, NetBox config compliance plugin, or custom scripts parse configurations and check for required elements (NTP servers configured, SNMP community strings correct, logging destinations set, AAA configuration present).
- **NAPALM compliance:** NAPALM's `compliance_report()` method compares running configuration against a YAML-defined desired state and reports violations.

### Remediating Drift

When drift is detected, the response depends on the nature of the deviation:

- **Known emergency change:** retroactively document and formally approve, or schedule removal if temporary
- **Unauthorized change:** investigate who made it and why, remediate to standard, address the process gap
- **Legitimate evolution:** update the golden config template to reflect the new standard

---

## Cross-References

- **SNO-01 (Network Monitoring & Alerting)** -- the monitoring that feeds pre/post-change verification baselines
- **SNO-03 (Network Incident Response)** -- emergency changes are a subset of incident response
- **SNO-07 (Firewall & ACL Operations)** -- ACL changes are among the highest-risk network changes
- **SNO-09 (Network Documentation & CMDB)** -- change execution must update documentation
- **SOO-03 (Change Management & Control)** -- the organizational change management framework that network changes operate within
- **SNE-03 (Network Automation & NetDevOps)** -- automation tools (Ansible, Nornir, NAPALM) used for change execution
- **DRP (Disaster Recovery)** -- rollback procedures overlap with DR planning
- **RCA (Root Cause Analysis)** -- post-change review when changes cause incidents

---

## Sources

1. ITIL 4 Practice Guide: Change Enablement. AXELOS / PeopleCert, 2020.
2. Juniper Networks. "Commit the Configuration." Junos OS Documentation. https://www.juniper.net/documentation/us/en/software/junos/cli/topics/topic-map/junos-configuration-commit.html
3. Cisco Systems. "Configuration Rollback Confirmed Change." IOS-XE 17.x System Management Configuration Guide. https://www.cisco.com/c/en/us/td/docs/routers/ios/config/17-x/syst-mgmt/b-system-management/m_cm-config-rollback-confirmed-change.html
4. Oxidized GitHub Repository. https://github.com/ytti/oxidized -- 130+ device types, Git-native config backup.
5. Containerlab Documentation. https://containerlab.dev -- container-based network emulation, YAML topology definitions.
6. Packet Pushers. "Cisco Configuration Archive & Rollback: Using 'Revert' Instead of 'Reload'." https://packetpushers.net/blog/cisco-configuration-archive-rollback-using-revert-instead-of-reload/
7. Uptime Institute Annual Outage Analysis. 2023-2025 reports consistently attribute 60-80% of outages to human configuration error.
8. Open Source Network Simulators. "Containerlab Network Emulator v0.73 Review." March 2026. https://opensourcenetworksimulators.com/2026/03/containerlab-network-emulator-v0-73-review/
9. Forsgren, N., Humble, J., Kim, G. *Accelerate: The Science of Lean Software and DevOps.* IT Revolution Press, 2018. -- DORA research on change management effectiveness.
10. rConfig. "Oxidized vs RANCID: A Feature Comparison." https://www.rconfig.com/blog/oxidized-vs-rancid-a-feature-comparison

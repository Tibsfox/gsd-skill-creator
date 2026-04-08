# High Availability & Resilience

> **Domain:** Reliability Engineering & Resilience Operations
> **Module:** 6 -- SLAs, Error Budgets, Redundancy, Failover, Chaos Engineering, and Graceful Degradation
> **Through-line:** *Availability is not a feature you add at the end. It is an architectural decision you make at the beginning, a budget you manage in the middle, and a discipline you practice continuously. The difference between a system that survives failure and one that collapses is not luck -- it is preparation that was tested before it mattered.*

---

## Table of Contents

1. [The Nines: Quantifying Availability](#1-the-nines-quantifying-availability)
2. [SLAs, SLOs, and SLIs](#2-slas-slos-and-slis)
3. [Error Budgets](#3-error-budgets)
4. [Redundancy Patterns](#4-redundancy-patterns)
5. [Failover Operations](#5-failover-operations)
6. [Chaos Engineering in Practice](#6-chaos-engineering-in-practice)
7. [DR Testing](#7-dr-testing)
8. [Circuit Breakers and Graceful Degradation](#8-circuit-breakers-and-graceful-degradation)
9. [Multi-Region Architecture](#9-multi-region-architecture)
10. [Real-World Outage Case Studies](#10-real-world-outage-case-studies)
11. [Cross-References](#11-cross-references)
12. [Sources](#12-sources)

---

## 1. The Nines: Quantifying Availability

Availability is measured in "nines" -- the number of nines in the uptime percentage. Each additional nine reduces allowable downtime by a factor of ten. The progression is deceptive: the jump from 99.9% to 99.99% sounds like a rounding error but represents the difference between tolerating eight hours of downtime per year and tolerating less than one hour.

| Availability | Common Name | Downtime/Year | Downtime/Month | Downtime/Week | Downtime/Day |
|---|---|---|---|---|---|
| 99% | Two nines | 3.65 days | 7.31 hours | 1.68 hours | 14.40 min |
| 99.9% | Three nines | 8.77 hours | 43.83 min | 10.08 min | 1.44 min |
| 99.95% | Three and a half nines | 4.38 hours | 21.92 min | 5.04 min | 43.20 sec |
| 99.99% | Four nines | 52.60 min | 4.38 min | 1.01 min | 8.64 sec |
| 99.999% | Five nines | 5.26 min | 26.30 sec | 6.05 sec | 0.86 sec |
| 99.9999% | Six nines | 31.56 sec | 2.63 sec | 0.60 sec | 0.09 sec |

The cost-availability curve is not linear. Going from two nines to three nines might require a load balancer and a redundant database. Going from three nines to four nines requires multi-AZ deployment, automated failover, and health checking. Going from four nines to five nines requires multi-region architecture, active-active deployment, and a dedicated reliability engineering team. Each additional nine roughly doubles or triples the infrastructure cost and operational complexity of the previous level.

The practical implication: most internal services should target three nines (99.9%). Customer-facing services typically need three and a half to four nines (99.95%-99.99%). Only payment systems, core infrastructure, and life-safety systems justify the cost of five nines (99.999%). Six nines is the domain of telephone switches and air traffic control.

> **The compound availability trap:** If Service A (99.9%) depends on Service B (99.9%), the combined availability is at best 99.9% x 99.9% = 99.8%. A chain of ten services each at 99.9% yields a system availability of approximately 99.0%. This is why microservice architectures without resilience patterns can have worse availability than monoliths.

---

## 2. SLAs, SLOs, and SLIs

The Google SRE framework introduced a three-layer hierarchy that separates the measurement of reliability from the targets and from the business commitments. Understanding these three concepts and their relationships is foundational to reliability engineering.

### Service Level Indicators (SLIs)

An SLI is a quantitative measure of some aspect of the level of service being provided. The Google SRE Workbook recommends expressing SLIs as a ratio: the number of good events divided by the total number of events, expressed as a percentage.

| SLI Category | What It Measures | Good Event Definition | Example |
|---|---|---|---|
| Availability | Can the user reach the service? | Request returns non-5xx status | 99.95% of requests return 2xx/3xx/4xx |
| Latency | How fast does the service respond? | Request completes under threshold | 99% of requests < 300ms at p99 |
| Throughput | How much work can the service handle? | Requests processed per second | Sustained 10,000 req/s during peak |
| Correctness | Does the service return the right answer? | Response matches expected output | 99.999% of records processed without data loss |
| Freshness | How current is the data? | Data age within acceptable window | 95% of dashboard queries reflect data < 1 minute old |

Choosing the right SLIs is the most important decision in the process. A poorly chosen SLI creates a disconnect between what you measure and what users experience. The rule of thumb from Google's "Art of SLOs" guidance: pick the SLI that most directly captures user happiness. If users care about page load time, measure page load time, not CPU utilization.

### Service Level Objectives (SLOs)

An SLO is a target value or range for an SLI. It is an internal engineering target -- not a contract, not a promise to customers, but the reliability level that the team agrees to maintain.

```
SLO STRUCTURE
================================================================

  SLI:        Proportion of HTTP requests returning 2xx/3xx/4xx
  SLO:        99.9% of requests over a 28-day rolling window
  Error budget: 0.1% = 1 in 1,000 requests may fail

  SLI:        Latency at the 99th percentile
  SLO:        p99 latency < 500ms over a 28-day rolling window
  Error budget: 1% of requests may exceed 500ms

  SLI:        Data processing correctness
  SLO:        99.99% of records processed without error over 28 days
  Error budget: 1 in 10,000 records may have processing errors
```

SLO setting methodology follows these principles:

1. **Start with user expectations, not system capabilities.** If users expect the page to load in under two seconds, that is the SLO anchor -- not what your infrastructure can achieve today.
2. **Use a rolling window, not calendar-based.** A 28-day or 30-day rolling window prevents the "fresh month, fresh budget" problem where teams relax at the start of the month.
3. **Set achievable targets, then tighten.** A service currently running at 99.5% should not leap to a 99.99% SLO. Start at 99.9% and tighten as reliability improves.
4. **Fewer SLOs are better.** Two or three well-chosen SLOs that capture the user experience are superior to fifteen SLOs that nobody monitors.

### Service Level Agreements (SLAs)

An SLA is a business contract between a service provider and its customers that specifies consequences (usually financial) for failing to meet defined service levels. The SLA should always be looser than the SLO -- you want the engineering team to react and fix reliability problems before they become contractual violations.

```
RELATIONSHIP HIERARCHY
================================================================

  SLI:  "We measure availability as the ratio of successful
         requests to total requests."

  SLO:  "We target 99.95% availability over a 28-day window."
         (Internal engineering target. SRE team pages at this.)

  SLA:  "We guarantee 99.9% monthly availability. If we breach
         this, affected customers receive 10% service credit."
         (External business contract. Legal gets involved at this.)

         SLO (99.95%) > SLA (99.9%)
         The gap between them is your safety margin.
```

| Property | SLI | SLO | SLA |
|---|---|---|---|
| Audience | Engineers | Engineers + management | Customers + legal |
| Nature | Measurement | Target | Contract |
| Consequence of miss | Investigation | Reliability sprint, feature freeze | Financial penalty, legal liability |
| Who sets it | SRE + product | SRE + product + leadership | Business + legal + SRE |
| Change frequency | Rarely (fundamental metrics) | Quarterly review | Annual contract renewal |

### SLO-Based Alerting

The Google SRE Workbook advocates alerting based on SLO burn rate rather than static thresholds. The logic: you should page the on-call engineer when the error budget is being consumed fast enough that it will be exhausted before the end of the window -- not when a single metric crosses an arbitrary line.

The multi-window, multi-burn-rate approach uses two time windows for each alert. The long window detects sustained budget consumption. The short window confirms the issue is still active (not a historical spike that already resolved). Google recommends making the short window 1/12 the duration of the long window.

| Severity | Burn Rate | Long Window | Short Window | Action |
|---|---|---|---|---|
| Page (critical) | 14.4x | 1 hour | 5 minutes | Wake the on-call, something is actively broken |
| Page (urgent) | 6x | 6 hours | 30 minutes | Page the on-call during business hours |
| Ticket | 1x | 3 days | 6 hours | Create a ticket, investigate this week |

A 14.4x burn rate means the error budget is being consumed 14.4 times faster than the sustainable rate -- at this pace, the entire 28-day budget would be exhausted in roughly two hours. A 6x burn rate would exhaust it in about 4.7 days. A 1x burn rate is sustainable but worth investigating because it means you are on track to exactly exhaust the budget.

---

## 3. Error Budgets

The error budget is the inverse of the SLO: if the SLO is 99.9% availability, the error budget is 0.1%. It represents the amount of unreliability the service is permitted to have. This framing transforms reliability from an absolute (always be up) to a resource that can be spent.

### Calculation

```
ERROR BUDGET CALCULATION
================================================================

  SLO: 99.9% availability over 28 days
  Error budget: 100% - 99.9% = 0.1%

  In absolute terms:
    Total minutes in 28 days:  28 * 24 * 60 = 40,320 minutes
    Error budget:              40,320 * 0.001 = 40.32 minutes

  Or in request terms:
    Total requests in 28 days:  3,000,000
    Error budget:               3,000,000 * 0.001 = 3,000 failed requests

  Current consumption:
    Failed requests this period: 1,200
    Budget consumed:             1,200 / 3,000 = 40%
    Budget remaining:            60% (1,800 requests)
```

### Error Budget as Alignment Tool

The error budget resolves the fundamental tension between development velocity and operational stability. Without it, developers want to ship fast (more features, more risk) and operators want to keep things stable (fewer changes, less risk). With an error budget, both teams agree on a shared resource:

- **Budget is healthy (well above zero):** Ship features. Take risks. Deploy more frequently. The reliability headroom exists to absorb incidents.
- **Budget is strained (approaching zero):** Slow down. Increase testing. Add canary phases. The service is running out of room for error.
- **Budget is exhausted (at or below zero):** Feature freeze. All engineering effort goes to reliability. No new deployments except bug fixes and reliability improvements.

This is not punitive -- it is economic. The error budget makes the cost of unreliability visible and allocable. A team that ships a bad deployment that burns 30% of the error budget understands the cost in terms their product managers also understand: fewer feature deployments for the rest of the window.

### Error Budget Policy

An error budget policy is a written agreement (signed by engineering leadership and product management) that specifies what happens at each consumption level. Without a written policy, error budgets become advisory and lose their alignment power.

| Budget State | Development Response | Ops Response | Escalation |
|---|---|---|---|
| > 50% remaining | Normal velocity | Normal operations | None |
| 25-50% remaining | Increase canary duration, add test coverage | Enhanced monitoring, review recent changes | Team lead awareness |
| 5-25% remaining | Reduce deployment frequency, no risky changes | Incident review for recent burns, postmortem action items | Director awareness |
| < 5% remaining | Feature freeze, reliability-only work | Full reliability sprint, architecture review | VP-level visibility |
| Exhausted (0%) | All hands on reliability until budget recovers | Root cause analysis, systemic fix required | Executive escalation |

### Maintenance Windows and Error Budgets

A subtlety documented in Google Cloud's SRE guidance: planned maintenance should consume error budget. If a maintenance window causes 20 minutes of downtime and the monthly error budget is 43 minutes, that maintenance used 46% of the budget. This forces teams to minimize maintenance-induced downtime and invest in zero-downtime maintenance techniques (rolling updates, live migration). Exempting maintenance from error budget calculations defeats the purpose of the system.

---

## 4. Redundancy Patterns

Redundancy is the practice of providing multiple instances of a component so that the failure of any single instance does not cause system failure. The choice of redundancy pattern depends on the required availability level, the recovery time objective, and budget.

### Pattern Comparison

| Pattern | Description | Failover Time | Cost | Typical Use |
|---|---|---|---|---|
| Active-Active | All instances serve traffic simultaneously | Zero (no failover needed) | Highest | Web servers, API gateways, CDN edge |
| Active-Passive | Standby instance waits, takes over on failure | Seconds to minutes | Medium-high | Databases, stateful services |
| N+1 | N instances needed, one spare available | Depends on detection | Medium | Compute pools, Kubernetes nodes |
| N+2 | N instances needed, two spares available | Depends on detection | Medium-high | Critical compute pools, safety margin |
| Hot Standby | Standby fully running, data synchronized | Seconds | High | Databases with synchronous replication |
| Warm Standby | Standby running but not fully synchronized | Minutes | Medium | Databases with async replication, DR sites |
| Cold Standby | Standby provisioned but not running | Minutes to hours | Low | DR environments, infrequent failover |

### Database Replication

Database replication is where redundancy becomes genuinely complex. The fundamental trade-off is between consistency and availability, as described by the CAP theorem. In practice, the choice is between synchronous and asynchronous replication.

**Synchronous replication** guarantees that every write is confirmed by the primary and at least one replica before the transaction is acknowledged to the client. This ensures zero data loss (RPO = 0) but adds latency to every write operation and creates a dependency: if the replica is unreachable, the primary either blocks (reducing availability) or must fall back to async (reducing consistency guarantees).

**Asynchronous replication** acknowledges the write on the primary immediately and sends it to replicas in the background. This provides lower write latency and higher availability but introduces a replication lag window where the replica is behind the primary. If the primary fails during this window, those un-replicated transactions are lost (RPO > 0).

```
REPLICATION TRADE-OFFS
================================================================

  SYNCHRONOUS                        ASYNCHRONOUS
  +----------------------------+     +----------------------------+
  | Client writes              |     | Client writes              |
  | Primary commits            |     | Primary commits            |
  | Waits for replica ACK      |     | ACK sent to client         |
  | ACK sent to client         |     | Replica receives later     |
  +----------------------------+     +----------------------------+
  RPO: 0 (zero data loss)           RPO: > 0 (seconds to minutes)
  Latency: Higher (replica RTT)      Latency: Lower (local only)
  Availability: Lower (replica       Availability: Higher (no
   must be reachable)                 replica dependency)
```

**Split-brain prevention** is the critical concern in any replicated system. Split-brain occurs when two nodes both believe they are the primary and accept writes independently, leading to conflicting data that may be irreconcilable. Prevention strategies include:

- **Quorum-based consensus:** Requires a majority of nodes to agree on the leader (etcd, ZooKeeper, Raft-based systems)
- **Fencing tokens:** A monotonically increasing token that storage systems validate, rejecting writes from stale leaders
- **STONITH (Shoot The Other Node In The Head):** Forcibly power off the old primary via IPMI/BMC before promoting the standby

### Multi-AZ and Multi-Region

| Deployment | Failure Tolerance | Typical Latency | Cost Multiplier | Use Case |
|---|---|---|---|---|
| Single AZ | None for AZ-level failure | < 1ms between instances | 1x | Development, testing |
| Multi-AZ (same region) | Survives AZ failure | 1-2ms between AZs | 1.5-2x | Production workloads |
| Multi-Region | Survives region failure | 30-200ms between regions | 3-5x | Global services, regulatory |

---

## 5. Failover Operations

Failover is the process of switching from a failed component to its redundant counterpart. The quality of failover determines whether a component failure becomes a blip or an outage. The three axes of failover quality are: detection time (how fast you notice the failure), decision time (how fast you decide to failover), and execution time (how fast the failover completes).

### DNS Failover

DNS-based failover uses health checks to monitor endpoints and updates DNS records to redirect traffic when the primary becomes unhealthy.

**AWS Route 53 health checks** monitor endpoints at configurable intervals (default: 30 seconds). The default failure threshold is 3 consecutive failures, meaning detection takes approximately 90 seconds. After detection, Route 53 updates the DNS response to point to the failover target. However, actual failover depends on DNS propagation:

| Component | Typical Time | Notes |
|---|---|---|
| Health check detection | 90 seconds | 3 checks at 30-second intervals |
| DNS record update | Near-instant | Route 53 updates within seconds |
| DNS propagation | 0-300 seconds | Depends on TTL and resolver caching |
| Total failover time | 90-390 seconds | Best case ~90s, worst case ~6.5 min |

The TTL trap: setting a long DNS TTL (e.g., 300 seconds or higher) means that even after Route 53 updates, clients continue using the cached old address until the TTL expires. For failover scenarios, TTLs of 60 seconds or less are recommended, with the understanding that lower TTLs increase DNS query volume and cost.

DNS failover is coarse-grained -- it redirects all traffic, not individual requests. It cannot perform request-level load balancing or retry. It works best as a last-resort failover mechanism, not as the primary high-availability strategy.

### Load Balancer Failover

Application Load Balancers (ALBs) and Network Load Balancers (NLBs) provide faster, request-level failover. They health-check backend targets at intervals as low as 5 seconds, detect failures within 10-30 seconds, and reroute individual requests to healthy targets without any DNS propagation delay.

### Database Failover

Database failover is the most operationally complex failover type because databases are stateful. The failover must ensure data consistency, connection re-establishment, and minimal transaction loss.

**AWS RDS Multi-AZ** maintains a synchronous standby replica in a different Availability Zone. On primary failure, RDS automatically promotes the standby by flipping the DNS endpoint. The entire process takes 60-120 seconds for standard Multi-AZ instances and under 35 seconds for Multi-AZ DB clusters (which use two readable standby instances across three AZs). During failover, existing database connections are dropped and applications must reconnect.

**Patroni for PostgreSQL** provides automated high-availability for self-managed PostgreSQL deployments. Patroni runs as a sidecar daemon alongside each PostgreSQL instance and uses a distributed configuration store (etcd, ZooKeeper, or Consul) for leader election and cluster state management.

```
PATRONI ARCHITECTURE
================================================================

  +-------------------+    +-------------------+    +-------------------+
  | Node A            |    | Node B            |    | Node C            |
  | PostgreSQL PRIMARY|    | PostgreSQL STANDBY|    | PostgreSQL STANDBY|
  | Patroni agent     |    | Patroni agent     |    | Patroni agent     |
  +--------+----------+    +--------+----------+    +--------+----------+
           |                        |                        |
           v                        v                        v
  +----------------------------------------------------------------+
  |                     etcd cluster (3+ nodes)                     |
  |  Stores: leader lock, cluster state, replication configuration |
  +----------------------------------------------------------------+
           ^                        ^                        ^
           |                        |                        |
  +--------+----------+    +--------+----------+    +--------+----------+
  |     HAProxy       |    |     HAProxy       |    |     HAProxy       |
  |   (load balance)  |    |   (load balance)  |    |   (load balance)  |
  +-------------------+    +-------------------+    +-------------------+

  Failover sequence:
  1. Primary fails to renew leader lock in etcd (TTL expires)
  2. Remaining Patroni agents detect leader vacancy
  3. Standby with least replication lag wins election
  4. Winner is promoted to primary (pg_promote)
  5. Other standby(s) repoint to new primary
  6. HAProxy health checks detect new primary
  7. Application traffic routes to promoted node
  Total: 10-30 seconds for well-configured clusters
```

Patroni prevents split-brain through the etcd leader lock: only the node holding the lock can accept writes. If a network partition isolates the old primary from etcd, it cannot renew its lock and will demote itself to read-only, even if it is still running. This is a hard safety guarantee that avoids the dual-primary scenario.

### Failover Testing: The Most Skipped Practice

Failover testing is the single most commonly skipped operational practice. Teams build redundancy, configure failover, and then never verify that it works -- until a real failure forces the issue, at which point the untested failover mechanism fails in an unexpected way.

Common failover testing failures:

- **Connection strings hardcoded to primary:** Failover occurs but application still points to old primary
- **Standby database out of sync:** Async replication lag larger than expected, data loss on promotion
- **Insufficient standby capacity:** Standby instance is undersized, cannot handle full production load
- **Application does not handle connection drops:** Database fails over but application hangs on stale connections instead of reconnecting
- **Monitoring does not detect the failover:** Automated failover succeeds but nobody knows it happened, standby is not rebuilt, and the system runs without redundancy until the next failure

The remedy is scheduled failover testing. Monthly for critical systems, quarterly for standard systems. Automate the failover trigger and validate the results programmatically.

---

## 6. Chaos Engineering in Practice

### Origin Story

Chaos engineering began at Netflix in 2010, when the company was migrating from its own data centers to Amazon Web Services. Netflix engineers recognized that cloud infrastructure was inherently less reliable than dedicated hardware -- instances could disappear at any time -- and that the only way to build confidence in their systems was to deliberately introduce failures and observe the results.

The first tool was Chaos Monkey, which randomly terminated EC2 instances in production during business hours. The constraint of "during business hours" was deliberate: if Chaos Monkey killed something that caused an outage, engineers were at their desks to respond. The effect was transformative. Services that could not survive an instance termination were quickly identified and hardened. Over time, Netflix's architecture evolved to expect and tolerate instance failures as a normal operating condition.

Netflix later expanded to Chaos Kong (simulating the failure of an entire AWS region), Chaos Gorilla (simulating the failure of an Availability Zone), and the Simian Army -- a collection of tools that tested various failure modes including latency injection, security group changes, and configuration drift.

### Principles of Chaos Engineering

The discipline matured into a formal methodology with five core principles:

1. **Define steady state as measurable metrics.** Before injecting any failure, establish what "normal" looks like in terms of specific metrics: requests per second, error rate, p99 latency, business transactions per minute. Without a baseline, you cannot detect deviation.

2. **Hypothesize how the system should behave.** Before running the experiment, write down what you expect to happen. "We expect that terminating one of three API servers will cause a brief latency spike but no errors, as the load balancer will reroute traffic within 5 seconds." If the hypothesis is wrong, you have found something valuable.

3. **Introduce real-world failure modes.** Kill processes, inject latency, partition networks, fill disks, exhaust memory. The failures should match what actually happens in production, not theoretical scenarios.

4. **Minimize blast radius.** Start small. Kill one instance, not ten. Inject 100ms of latency, not 10 seconds. Affect 1% of traffic, not 100%. Expand the blast radius only after gaining confidence at smaller scales.

5. **Run in production.** Staging environments do not have production traffic patterns, data distributions, or scale. Chaos experiments in staging find some bugs but miss the ones that only manifest under real load. Production chaos, with proper safeguards and blast radius limits, finds the bugs that matter.

### Tooling Ecosystem

| Tool | Type | Scope | Key Features |
|---|---|---|---|
| Chaos Monkey | Open source (Netflix) | Instance termination | Random EC2 kills, Spinnaker integration |
| Gremlin | Commercial SaaS | Full-spectrum fault injection | Process, network, resource, state attacks; safety controls; team management |
| Litmus (LitmusChaos) | Open source (CNCF) | Kubernetes-native | ChaosHub experiment library, GitOps integration, Kubernetes operator model |
| AWS Fault Injection Simulator (FIS) | Managed service | AWS infrastructure | Native EC2/ECS/EKS/RDS experiments, IAM integration, automatic stop conditions |
| Chaos Toolkit | Open source | Multi-platform | Declarative experiment format (JSON/YAML), extensive driver ecosystem |
| Pumba | Open source | Container-level | Docker container chaos (kill, pause, network), lightweight |

### Game Days

A game day is a scheduled exercise where a team deliberately introduces failures into their production (or production-like) environment and observes the response. Unlike automated chaos experiments that run continuously, game days are orchestrated events with an observer, a facilitator, and a defined scope.

Game day structure:

1. **Pre-game:** Define scope, hypothesis, success criteria, abort criteria. Notify stakeholders. Ensure rollback procedures are ready.
2. **Execution:** Inject the failure. Multiple observers monitor dashboards, logs, alerts, and user-facing behavior simultaneously.
3. **Observation:** Did alerts fire? How fast? Did auto-remediation work? Did the runbook cover this scenario? What surprised us?
4. **Post-game:** Document findings. File action items for every surprise. Update runbooks.

### Chaos Maturity Model

| Level | Characteristics | Typical Activities |
|---|---|---|
| 0 -- Ad Hoc | No chaos practice. Failures are surprises. | Nothing. "We'll deal with it when it happens." |
| 1 -- Beginning | Manual experiments in staging or pre-production. | Quarterly game days, kill an instance, see what happens |
| 2 -- Developing | Automated experiments in staging. Some production experiments. | Monthly experiments, Gremlin or FIS in staging, selected prod experiments |
| 3 -- Mature | Regular automated production experiments. Integrated into CI/CD. | Weekly automated chaos runs, experiments in deployment pipeline, broad coverage |
| 4 -- Advanced | Continuous chaos in production. Experiments cover all failure modes. Culture of resilience. | Always-on experiments, custom fault injection, chaos results in release gates |

---

## 7. DR Testing

Disaster recovery plans that have never been tested are fiction. They represent what someone once believed would work, written at a point in time when the infrastructure, team composition, and dependencies were different from what exists today. The only way to know if a DR plan works is to execute it.

### Types of DR Tests

| Test Type | Effort | Risk | Fidelity | Best For |
|---|---|---|---|---|
| Tabletop exercise | Low (2-4 hours, no systems) | None | Low-medium | Identifying gaps in documentation, decision-making, communication |
| Walkthrough test | Low-medium (half day, read-only) | Minimal | Medium | Verifying runbook steps against actual system state |
| Simulation test | Medium (1-2 days, partial execution) | Low-medium | Medium-high | Testing recovery procedures without full failover |
| Full failover test | High (days of prep, actual failover) | Medium-high | Highest | Validating actual RTO and RPO, end-to-end |
| Surprise test | High (no prep by team) | Medium-high | Highest for team readiness | Testing team response under realistic conditions |

### Tabletop Exercises

A tabletop exercise gathers the relevant team members in a room (or video call) and walks through a disaster scenario step by step without touching any systems. The facilitator presents the scenario progressively, and participants describe what they would do at each stage.

A well-structured 90-minute tabletop:

- **Minutes 0-10:** Set the scene. "It is 2 AM on a Tuesday. PagerDuty fires: database primary is unreachable. The on-call engineer's phone rings."
- **Minutes 10-40:** Walk through the first hour. Who is called? What runbooks are opened? What dashboards are checked? Where is the password for the DR environment?
- **Minutes 40-60:** Escalation and recovery. The primary does not come back. Failover is required. Who authorizes it? How long does it take? What about the data that was in flight?
- **Minutes 60-80:** Post-recovery. The secondary is now primary. How do you rebuild redundancy? What about backups? What about the incident report?
- **Minutes 80-90:** Debrief. What gaps did we find? What runbook steps were unclear? What access was missing?

Tabletop exercises consistently reveal gaps that no amount of documentation review can find. Common discoveries: the person who knows how to run the failover left the company six months ago. The DR runbook references a tool that was decommissioned. The network path between the primary and DR site was never configured. The restore scripts assume a database version two major versions behind the current production version.

### RPO and RTO Validation

RPO (Recovery Point Objective) is the maximum acceptable data loss, measured in time. An RPO of one hour means you can tolerate losing up to one hour of data. RPO is validated by checking backup/replication freshness.

RTO (Recovery Time Objective) is the maximum acceptable downtime, measured from the moment of failure to the moment of service restoration. An RTO of four hours means the service must be back online within four hours of a disaster declaration.

| Metric | How to Validate | What Failure Looks Like |
|---|---|---|
| RPO | Restore from backup, check timestamp of latest data | Backup was 6 hours old despite "hourly backup" policy (job was failing silently) |
| RTO | Time the full recovery process end-to-end | Recovery took 8 hours against a 4-hour RTO (restore was slow, config was missing) |

### Recommended Testing Cadence

| Activity | Frequency | Duration | Participants |
|---|---|---|---|
| Backup restore verification | Weekly (automated) | Automated, no human time | CI/CD pipeline |
| Tabletop exercise | Quarterly | 90 minutes | Engineering team + management |
| Partial failover test | Semi-annually | Half day | Engineering team + SRE |
| Full failover test | Annually | Full day (plus prep) | Cross-functional, all stakeholders |

### The "We've Never Tested Failover" Problem

Organizations that have never tested failover face a specific and dangerous condition: they have redundancy they believe works but have no evidence that it does. The infrastructure cost is being paid, the availability numbers in the architecture diagram are being cited, and the entire foundation rests on an assumption.

The resolution is to start small. Do not attempt a full region failover on the first attempt. Start with a tabletop exercise. Then a database failover in a non-production environment. Then a database failover in production during a maintenance window. Build confidence incrementally. Document every finding. Fix every gap before escalating to the next level of testing.

---

## 8. Circuit Breakers and Graceful Degradation

### The Circuit Breaker Pattern

The circuit breaker pattern prevents a failing downstream service from cascading failures upstream. It is named by analogy to electrical circuit breakers, which trip to prevent a short circuit from causing a fire.

```
CIRCUIT BREAKER STATES
================================================================

  CLOSED (normal operation)
  +---------------------------+
  | Requests flow through     |     Failure count
  | Successes reset counter   |     reaches threshold
  | Failures increment counter|----------+
  +---------------------------+          |
          ^                              v
          |                    OPEN (failing fast)
          |                    +---------------------------+
          |    Timeout         | All requests rejected     |
          |    expires         | immediately (fail fast)   |
          +--------------------| Timer counts down         |
                               +---------------------------+
                                         |
                                         | Timer expires
                                         v
                               HALF-OPEN (testing)
                               +---------------------------+
                               | Limited requests allowed  |
                               | Success -> CLOSED         |
                               | Failure -> OPEN           |
                               +---------------------------+
```

In the **closed** state, requests pass through normally. The circuit breaker monitors for failures. When the failure rate exceeds a configured threshold (e.g., 50% of requests in the last 10 seconds), it transitions to the **open** state.

In the **open** state, requests are immediately rejected without attempting to call the downstream service. This protects the caller from waiting on timeouts and protects the downstream from additional load while it is struggling. After a configured wait period, the breaker transitions to **half-open**.

In the **half-open** state, a limited number of requests are allowed through to test whether the downstream has recovered. If those requests succeed, the breaker transitions back to closed. If they fail, it returns to open.

### Implementation Options

| Tool | Language/Platform | Key Characteristics |
|---|---|---|
| Resilience4j | Java/JVM | Lightweight, functional API. Circuit breaker, rate limiter, retry, bulkhead, time limiter. Successor to Hystrix. |
| Hystrix | Java/JVM (Netflix) | **Deprecated since 2018.** Pioneered the pattern. Migrate to Resilience4j. |
| Istio | Service mesh (any language) | Network-level circuit breaking. Configured via DestinationRule. Language-agnostic. Operates at the sidecar proxy level. |
| Polly | .NET | Circuit breaker, retry, timeout, bulkhead for .NET services |
| opossum | Node.js | Circuit breaker for Node.js applications |
| Sentinel | Java (Alibaba) | Flow control, circuit breaking, adaptive system protection |

**Resilience4j vs Istio:** Resilience4j operates at the application level -- it wraps individual service calls in code and provides fine-grained control, fallback functions, and integration with application metrics. Istio operates at the network level -- it intercepts traffic at the sidecar proxy and applies circuit breaking rules without code changes. The trade-off: Resilience4j gives more control (custom fallbacks, complex state machines) but requires code integration. Istio is language-agnostic and requires no code changes but offers less granularity.

### The Bulkhead Pattern

The bulkhead pattern isolates components so that a failure in one does not exhaust shared resources and cascade to others. Named after the watertight compartments in ship hulls that prevent a breach in one compartment from flooding the entire vessel.

In practice, bulkheads are implemented as:

- **Thread pool isolation:** Each downstream service gets its own thread pool. If Service A becomes slow and all its threads are blocked, Service B's thread pool is unaffected.
- **Connection pool isolation:** Separate connection pools per dependency. A database slowdown does not exhaust the connection pool used for cache lookups.
- **Semaphore isolation:** Limits concurrent calls to a specific dependency without dedicated threads. Lower overhead than thread pools but no timeout protection.

### Timeout Cascades

Timeout cascades are one of the most common failure modes in distributed systems. Service A calls Service B with a 30-second timeout. Service B calls Service C with a 30-second timeout. Service C is slow. Service B waits 30 seconds for C, then returns an error to A. But A has already been waiting 30 seconds for B. If A's timeout is also 30 seconds, it may have already timed out and retried, doubling the load on B, which doubles the load on C, which makes C even slower.

Prevention:

- **Set timeouts in decreasing order from edge to leaf.** If the edge service has a 10-second timeout, the next layer should be 5 seconds, the next 2 seconds. Each layer must be able to respond (even with an error) within the timeout of its caller.
- **Set deadlines, not timeouts.** A deadline propagates through the call chain: "this entire request must complete by 14:00:05.000." Each service checks the remaining deadline and can short-circuit if there is not enough time to complete the work.

### Graceful Degradation Strategies

| Strategy | Description | Example |
|---|---|---|
| Feature shedding | Disable non-essential features to preserve core functionality | Disable recommendation engine, serve generic results. Disable avatars, serve default images. |
| Read-only mode | Accept reads but reject writes when the write path is degraded | E-commerce site shows products and prices but cart/checkout is temporarily unavailable |
| Cached responses | Serve stale cached data when the backend is unavailable | Dashboard shows data from 5 minutes ago instead of real-time, with a "data may be delayed" notice |
| Static fallback | Return a pre-computed static response | Mobile app shows cached content with "offline mode" indicator |
| Load shedding | Deliberately reject a fraction of requests to protect the system | Return 503 to 10% of requests so that 90% get good responses, rather than 100% getting slow/failed responses |
| Priority shedding | Reject low-priority requests first | Free-tier users get 503, paid users continue to be served. Background jobs are paused. |

### Load Shedding

Load shedding is the deliberate rejection of incoming requests when the system is overloaded. The principle: it is better to serve 80% of requests successfully than to attempt 100% and fail on all of them because the system is thrashing.

Load shedding should be implemented at the edge (load balancer or API gateway) based on measurable signals: CPU utilization exceeding 80%, request queue depth exceeding capacity, latency exceeding SLO. The response should be a clean 503 (Service Unavailable) with a Retry-After header, not a timeout or connection reset.

---

## 9. Multi-Region Architecture

Multi-region architecture is the most expensive and complex availability strategy. It is the answer to the question: what happens if an entire cloud region goes offline? The answer depends on whether the deployment is active-passive or active-active.

### Active-Passive Multi-Region

One region serves all traffic. A second region maintains a warm or hot standby that can be promoted to primary if the active region fails.

- **Pros:** Simpler data consistency (single writer). Lower cost than active-active. Established patterns.
- **Cons:** Failover time measured in minutes to hours. Standby may drift from production if not continuously exercised. Full region capacity must be available in the standby region.

### Active-Active Multi-Region

All regions serve traffic simultaneously. Users are routed to the nearest region. Data is replicated across regions in near-real-time.

- **Pros:** Zero-downtime failover (traffic simply stops going to the failed region). Better latency for global users. No standby waste.
- **Cons:** Data consistency across regions is genuinely hard. Cross-region replication adds latency. Conflict resolution required. Significantly more complex to build and operate.

### Database Solutions for Multi-Region

| Database | Multi-Region Mode | Consistency Model | Latency Impact | Data Residency Support |
|---|---|---|---|---|
| Google Cloud Spanner | Multi-region instances (5 nines SLA) | Strong consistency (TrueTime) | Writes: ~10-15ms cross-continent | Dual-region and multi-region configurations with data residency controls |
| CockroachDB | Multi-region clusters | Serializable by default, configurable per table | Writes: depends on replication zones | Table-level data domiciling, row-level geo-partitioning |
| Amazon Aurora Global Database | Active-passive with read replicas | Eventual consistency for reads, strong for writes in primary | Replication lag: typically < 1 second | Region-scoped clusters |
| Cassandra | Multi-datacenter replication | Tunable consistency per query | Write: local DC latency, replication async | Datacenter-aware placement |
| YugabyteDB | Multi-region xCluster or geo-partitioning | Synchronous within region, async across regions (or sync with latency cost) | Configurable per table | Tablespace-based geo-partitioning |

### Data Residency and Sovereignty

Multi-region architecture intersects with data residency regulations. GDPR requires that EU residents' personal data remain within the EU (or in countries with adequate protection). Similar regulations exist in Brazil (LGPD), India (DPDP Act), Canada (PIPEDA), and others.

CockroachDB addresses this with table-level and row-level data domiciling: you can pin specific tables or even specific rows to a geographic region while allowing other data to be globally distributed. Spanner offers dual-region configurations specifically designed for data residency compliance, guaranteeing that data at rest stays within the configured regions.

### Cross-Region Latency Budgets

| Route | Typical Latency | Impact |
|---|---|---|
| Same AZ | < 1ms | Negligible |
| Cross-AZ (same region) | 1-2ms | Acceptable for synchronous replication |
| US East to US West | 60-80ms | Synchronous replication adds ~130ms round-trip to writes |
| US to EU | 80-120ms | Synchronous cross-Atlantic replication often unacceptable |
| US to Asia | 150-200ms | Synchronous replication impractical for user-facing writes |

The latency budget determines the replication strategy. Within a region (cross-AZ), synchronous replication is standard. Across regions on the same continent, synchronous replication is possible but measurably impacts write latency. Across continents, asynchronous replication with conflict resolution is typically the only practical option for user-facing write paths.

### Cost Implications

Multi-region approximately triples infrastructure costs (three or more copies of compute, storage, and networking) and adds significant cross-region data transfer charges. AWS charges $0.02/GB for cross-region transfer within the same continent and $0.08-0.09/GB for intercontinental transfer. A service transferring 10TB/month cross-region incurs $200-900/month in transfer fees alone, on top of the duplicated infrastructure.

The cost question is: what is the cost of a regional outage? If the answer is "we lose $500,000 per hour of downtime" and multi-region adds $50,000/month, the investment pays for itself if it prevents a single regional outage per year lasting more than 72 minutes. If the answer is "our internal tool is down and people use email instead," multi-region is almost certainly not justified.

---

## 10. Real-World Outage Case Studies

Theory is necessary but insufficient. The following outages illustrate how the patterns described in this module apply -- or fail to apply -- in real production environments.

### Google Cloud Paris (April 2023)

On April 25, 2023, Google Cloud's europe-west-9 region went offline. The root cause was a water leak in the battery room at a Globalswitch data center that damaged cooling systems. One zone was offline for approximately 24 hours. A second zone remained offline for two weeks as physical repairs were completed.

**Lesson:** Physical infrastructure failures can outlast any reasonable RTO. Multi-AZ within a single region does not protect against a facility-level event that affects the entire building. For workloads with strict RTOs, multi-region deployment is the only protection against this class of failure.

### AWS US-East-1 (October 2025)

On October 20, 2025, AWS experienced a 15-hour outage in its US-EAST-1 region, the largest and most commonly used AWS region globally. The root cause was traced to a DNS resolution failure related to an empty DNS record and incorrect automation updates. Over 4 million users and more than 1,000 companies were affected.

**Lesson:** US-East-1 is the default region for many AWS services and the implicit dependency of services that do not explicitly configure a region. Organizations that assumed "we're on AWS so we're highly available" without multi-region architecture discovered that concentrating everything in one region -- even the largest one -- is a single point of failure. The outage also demonstrated that DNS, the most fundamental internet service, remains a common root cause of major incidents.

### Azure China North 3 (Late 2024)

A 50-hour disruption -- the longest individual cloud incident in the reporting period -- hit Azure's China North 3 region. The extended duration highlighted the challenges of recovery in a region with unique regulatory and infrastructure constraints.

**Lesson:** DR planning must account for geographic and regulatory factors that can extend recovery time. A 50-hour outage against a 4-hour RTO means the RTO was never achievable for that failure mode without multi-region.

### Comparative Response Times

Google Cloud publishes detailed postmortems most prolifically, releasing over 100 per year. Azure publishes preliminary reports within 3 days and produces video retrospectives. AWS publishes the fewest postmortems -- it released its first public postmortem in 2023 after a two-year gap. Transparency in post-incident communication is a leading indicator of organizational reliability maturity.

---

## 11. Cross-References

| Module | Connection |
|---|---|
| SOO-01: Deployment & Release Engineering | Deployment strategies (canary, blue/green) as availability mechanisms |
| SOO-02: Incident Management & Response | Incident response when HA mechanisms fail; MTTD/MTTR as availability components |
| SOO-04: Capacity Planning & Scaling | Capacity as a prerequisite for redundancy; N+1 sizing depends on capacity models |
| SOO-05: Cost Optimization & FinOps | The cost-availability trade-off curve; multi-region cost implications |
| SOO-07: Runbook Automation & Toil | Failover runbooks; automated remediation as availability enabler |
| SOO-08: Performance Engineering | Latency SLIs; performance degradation as an availability problem |
| SOO-10: On-Call & Operational Culture | On-call response to HA failures; game day culture; error budget negotiation |

---

## 12. Sources

1. Google SRE Workbook, "Implementing SLOs" -- https://sre.google/workbook/implementing-slos/
2. Google SRE Workbook, "Alerting on SLOs" -- https://sre.google/workbook/alerting-on-slos/
3. Google SRE Workbook, "Error Budget Policy" -- https://sre.google/workbook/error-budget-policy/
4. Google Cloud Blog, "SRE Error Budgets and Maintenance Windows" -- https://cloud.google.com/blog/products/management-tools/sre-error-budgets-and-maintenance-windows
5. Google, "The Art of SLOs" -- https://sre.google/resources/practices-and-processes/art-of-slos/
6. AWS Documentation, "Failing Over a Multi-AZ DB Instance" -- https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.Failover.html
7. AWS Documentation, "Configuring DNS Failover (Route 53)" -- https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover-configuring.html
8. Patroni GitHub Repository -- https://github.com/patroni/patroni
9. Crunchy Data, "Patroni & etcd in High Availability Environments" -- https://www.crunchydata.com/blog/patroni-etcd-in-high-availability-environments
10. Netflix, Chaos Monkey -- https://netflix.github.io/chaosmonkey/
11. IEEE Spectrum, "Chaos Engineering Saved Your Netflix" -- https://spectrum.ieee.org/chaos-engineering-saved-your-netflix
12. CockroachDB, "The Art of Data Residency" -- https://www.cockroachlabs.com/blog/multi-region-serverless-data-residency/
13. Google Cloud, "Spanner Regional, Dual-Region, and Multi-Region Configurations" -- https://docs.cloud.google.com/spanner/docs/instance-configurations
14. Google Cloud, "Alerting on Budget Burn Rate" -- https://docs.cloud.google.com/stackdriver/docs/solutions/slo-monitoring/alerting-on-budget-burn-rate
15. IncidentHub, "Major Cloud Outages of 2025" -- https://blog.incidenthub.cloud/major-cloud-outages-2025
16. Pragmatic Engineer, "Three Cloud Providers, Three Outages" -- https://newsletter.pragmaticengineer.com/p/three-cloud-providers-three-outages
17. Gremlin, "Chaos Engineering" -- https://www.gremlin.com/chaos-engineering
18. Splunk, "What Is Five 9s in Availability Metrics?" -- https://www.splunk.com/en_us/blog/learn/five-nines-availability.html
19. Wikipedia, "High Availability" -- https://en.wikipedia.org/wiki/High_availability
20. Percona, "Patroni: The Key PostgreSQL Component for Enterprise High Availability" -- https://www.percona.com/blog/patroni-the-key-postgresql-component-for-enterprise-high-availability/

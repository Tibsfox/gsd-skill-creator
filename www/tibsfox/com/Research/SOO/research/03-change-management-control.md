# Change Management & Control

**Module:** 03 -- Systems Operations (SysOps) Research Series
**Date:** 2026-04-08
**Domain:** IT Service Management, DevOps, Change Governance

---

Every outage has a change behind it. The vast majority of production incidents -- studies consistently place the figure at 70-80% -- trace back to a change: a deployment, a configuration update, a database migration, a network rule modification. Change management exists because the alternative is chaos. But badly implemented change management creates a different kind of chaos -- the bureaucratic kind -- where velocity grinds to a halt, engineers route around process, and the controls that exist on paper bear no resemblance to what happens in practice.

This module examines the full spectrum of change management: from ITIL's formal frameworks to modern continuous delivery practices, from the Change Advisory Board meeting room to the GitOps reconciliation loop. The central tension throughout is control versus velocity. DORA's research, spanning a decade and tens of thousands of organizations, demonstrates conclusively that these are not opposing forces. The highest-performing organizations deploy more frequently, with shorter lead times, lower failure rates, and faster recovery. They achieve this not by abandoning control but by embedding it differently -- shifting from external gatekeeping to automated guardrails, from batch approval to continuous validation, from heavyweight process to lightweight discipline.

The practical implications are significant. An organization that treats change management as a compliance checkbox will get compliance-shaped results: paperwork completed, rubber stamps applied, incidents continuing at the same rate. An organization that treats change management as an engineering discipline will get engineering-shaped results: smaller changes, faster feedback, automated verification, rapid recovery when things go wrong.

---

## 1. ITIL Change Enablement

### From "Management" to "Enablement"

The naming evolution is instructive. ITIL v3 called it "Change Management." The initial 2019 ITIL 4 Foundation publication renamed it "Change Control." The ITSM community rejected that term -- "control" carried connotations of restriction and gatekeeping that ran counter to the spirit of the update -- and by the time the full practice guide shipped in 2020, it had been renamed "Change Enablement." This was not cosmetic. The word "enablement" signals a philosophical inversion: the purpose of the practice is not to prevent change but to facilitate it safely.

ITIL 4 embeds change enablement across the entire Service Value System (SVS) rather than isolating it as a standalone process. This reflects the reality that change touches every stage of service delivery -- from strategy through design, build, transition, and operation. The practice's goal is ensuring that changes are assessed, authorized, and managed to maximize value while minimizing risk and disruption.

### Change Types

ITIL 4 defines three change types, each with distinct authorization paths:

**Standard Changes.** Pre-authorized, low-risk, well-understood changes that follow a documented procedure. Examples include password resets, standard software installations, or routine patching to an established schedule. Standard changes have been risk-assessed in advance and need no per-instance approval. The key requirement is that the procedure is documented, tested, and consistently followed. When organizations invest in expanding their catalog of standard changes, they reduce the approval burden on everything else.

**Normal Changes.** Changes that require assessment and authorization before implementation. This is the broadest category, ranging from minor application updates to significant infrastructure modifications. Normal changes follow the full change enablement workflow: request, assessment, authorization, implementation, review. The critical evolution in ITIL 4 is that "authorization" no longer necessarily means a committee meeting. It means the appropriate change authority has approved the change, and that authority can be a peer reviewer, an automated pipeline, or a team lead -- whatever matches the assessed risk level.

**Emergency Changes.** Changes that must be implemented urgently to resolve an incident or prevent imminent impact. Emergency changes follow an expedited process -- assessment and authorization still happen, but concurrently with or immediately after implementation rather than before it. The danger with emergency changes is scope creep: using the emergency pathway to bypass normal assessment for changes that are merely urgent rather than genuinely emergent. Healthy organizations track their emergency change rate as a metric; if it exceeds 5-10% of total changes, the normal process is likely too slow or too burdensome.

### Change Models

A change model is a repeatable, predefined approach for handling a particular category of change. Models codify the steps, roles, timescales, and escalation paths for recurring change types. The value is consistency: rather than reinventing the approval workflow for each database schema migration, the organization defines a "database migration change model" that specifies required pre-checks, testing gates, rollback procedures, communication steps, and post-implementation verification.

Well-designed change models absorb complexity at definition time so that execution time is streamlined. The investment is front-loaded -- defining the model requires careful analysis of risk, dependencies, and failure modes -- but the payoff compounds with every subsequent use.

### The Shift from Gatekeeping to Enabling

The philosophical core of ITIL 4's change enablement is delegation of authority. Rather than funneling all changes through a single approval body, authority is delegated to the appropriate level:

- **Automated authority** for standard changes that pass pipeline gates
- **Peer authority** for normal changes reviewed by knowledgeable team members
- **Team lead authority** for changes affecting a single team's domain
- **Change authority (CAB or equivalent)** for cross-team, high-risk, or politically sensitive changes
- **Executive authority** for changes with significant business impact

The key insight from DORA's research, published in *Accelerate* and reinforced annually: when team members have a clear understanding of the process to get changes approved for implementation, this drives high performance. Clarity of process matters more than the weight of the process.

---

## 2. The Change Advisory Board

### The Traditional Model

The Change Advisory Board is a group of people who advise the change authority on assessment, prioritization, and scheduling of changes. In the traditional ITIL v3 model, the CAB meets weekly (sometimes more frequently) to review upcoming changes, assess risk, identify scheduling conflicts, and provide go/no-go recommendations. Membership typically includes representatives from operations, development, security, networking, database administration, and business stakeholders.

The CAB's intended value is collective wisdom: no single person understands all the dependencies and implications of a change, so bringing diverse expertise to the table should improve decision quality.

### Why CABs Fail

DORA's multi-year research, detailed in *Accelerate* (Forsgren, Humble, Kim, 2018) and subsequent State of DevOps Reports, found that external change approval processes were negatively correlated with lead time, deployment frequency, and restore time, and had no correlation with change failure rate. This is the damning finding: CABs slow everything down without making anything more stable.

The failure modes are predictable:

**Bottleneck accumulation.** If the CAB meets weekly, a change that took one hour to develop waits up to 40 business hours (168 real hours) for approval. This delay is not neutral -- it increases work-in-progress, creates context-switching overhead when engineers return to changes they submitted days ago, and encourages batching of changes to amortize the wait time. Larger batches mean larger deployments, which mean higher blast radius when something fails.

**Rubber-stamping.** Faced with a queue of 30-50 changes in a one-hour meeting, the CAB cannot provide meaningful technical review of each one. The meeting degenerates into a sequence of "Does anyone have concerns? No? Approved." The approval provides the illusion of oversight without the substance. Engineers recognize this and stop investing effort in change descriptions, creating a downward spiral of information quality.

**Wrong expertise at the table.** A networking engineer reviewing an application deployment or a database administrator assessing a frontend change cannot provide meaningful risk assessment. The people best positioned to evaluate a change -- the peers who understand the codebase and its dependencies -- are rarely on the CAB.

**Process substitution for capability.** Organizations that experience a major incident often respond by adding process: more fields on the change ticket, more approval gates, more documentation requirements. This treats a capability problem (poor testing, inadequate monitoring, insufficient understanding of dependencies) with a process solution. The result is more paperwork and the same failure rate.

### Modern Alternatives

**Peer review at commit time.** Pull request reviews by team members who understand the code provide higher-quality assessment than a CAB ever can. The reviewer has context, can examine the actual code changes, and provides feedback in minutes rather than days. When combined with branch protection rules requiring approval before merge, this creates a lightweight audit trail.

**Automated validation.** Deployment pipelines that run tests, security scans, performance benchmarks, and compliance checks provide consistent, tireless assessment that no committee can match. A pipeline does not get fatigued after reviewing 30 changes. It does not rubber-stamp. It does not go on vacation.

**Risk-based routing.** Rather than sending all changes through the same process, route them based on assessed risk. Low-risk changes (standard, well-tested, small blast radius) proceed through automated approval. Medium-risk changes require peer review. High-risk changes -- cross-team, large blast radius, novel technology -- receive the full treatment: formal review, stakeholder alignment, detailed rollback planning.

### When CAB Still Makes Sense

The CAB is not categorically wrong -- it is wrong as the default approval mechanism for routine changes. CABs retain value for:

- **Cross-organizational coordination** -- changes that affect multiple teams and require scheduling alignment
- **Strategic change review** -- major platform migrations, vendor changes, architecture shifts
- **Compliance requirements** -- regulated industries where policy mandates a formal review body
- **Post-incident process improvement** -- analyzing patterns across changes to identify systemic issues

The key reframing: the CAB should be an advisory and coordination body, not an approval gate. It coordinates, it identifies conflicts, it spots patterns -- but it does not hold deployment hostage.

---

## 3. Change Risk Assessment

### Risk Scoring Frameworks

Effective change risk assessment combines multiple dimensions into a composite risk score. Common factors include:

- **Change complexity** -- number of systems affected, lines of code changed, configuration items modified
- **Change frequency** -- first-time vs. routine (standard changes score lower)
- **Testing coverage** -- automated test results, manual test completion, performance test results
- **Blast radius** -- number of users, services, or business processes affected by failure
- **Reversibility** -- can the change be rolled back, and how quickly
- **Historical failure rate** -- what is the failure rate for similar changes in this environment

A simple but effective model assigns each factor a 1-3 score (low/medium/high) and multiplies or sums them. Changes scoring below a threshold proceed through automated approval; above the threshold, they require human review proportional to the score.

### Blast Radius Analysis

Blast radius measures the potential impact when a change goes wrong. It quantifies: how many users are affected, how many downstream services break, how much revenue is at risk, and how long recovery takes.

Blast radius is not solely a technical measure. A change to a logging library has a small technical footprint but potentially affects every service that imports it. A change to a payment processing module has an enormous business blast radius even if only a few lines of code change. Effective analysis considers both the technical dependency graph and the business impact map.

Techniques for minimizing blast radius include: canary deployments (expose changes to a small percentage of traffic first), feature flags (decouple deployment from activation), blue-green deployments (maintain a rollback environment), and service isolation (limit the scope of any single deployment).

### Change Collision Detection

Change collision detection identifies when multiple changes affect the same systems during overlapping time windows. Collisions create compounding risk: if change A and change B both modify the same service and both go live within the same maintenance window, diagnosing a failure becomes significantly harder because either change could be the cause.

ITSM tools like ServiceNow and BMC Remedy provide automated collision detection by comparing configuration items listed on change requests against scheduled implementation windows. When implementation periods overlap and share CIs, the system flags a collision for human review.

The more sophisticated version of collision detection uses dependency mapping rather than simple CI matching. Two changes might not share any CIs directly but might affect services that depend on a common downstream resource. Dependency-aware collision detection catches these second-order conflicts.

### Automated vs. Human Risk Assessment

What can be automated: test coverage analysis, dependency graph traversal, historical failure rate lookup, deployment size measurement, known-bad-pattern detection (e.g., schema changes without migration scripts), scheduling conflict detection.

What requires human judgment: novel architecture changes (no historical data to compare), business context assessment (is this change timed around a critical business event?), cross-team coordination assessment (who else needs to know?), political and organizational risk (will this change affect a relationship with a vendor or partner?).

The most effective approach uses automation for the quantitative dimensions and escalates to human review when the automated score exceeds a threshold or when qualitative factors are flagged.

---

## 4. Maintenance Windows

### Scheduling Strategies

The traditional maintenance window is a scheduled period -- typically during low-traffic hours -- when changes are deployed to production. Common patterns include:

- **Weekly windows** -- a recurring slot (e.g., Sunday 2:00-6:00 AM) for routine changes
- **Monthly windows** -- a longer slot for more complex changes (e.g., first Saturday, midnight to 8:00 AM)
- **Ad hoc windows** -- negotiated per-change for high-impact deployments
- **Continuous deployment** -- no windows at all; changes deploy when they pass pipeline gates

The choice depends on the organization's deployment maturity and risk tolerance. Organizations early in their DevOps journey often start with weekly windows and gradually reduce their reliance on scheduled downtime as they build confidence in automated testing and deployment.

### Communication Protocols

Maintenance window communication follows a predictable lifecycle:

1. **Announcement** (5-10 business days before) -- what is changing, when, expected impact, contact information
2. **Reminder** (1-2 business days before) -- confirmation that the change is proceeding, any updates
3. **Start notification** -- maintenance window has opened, work is beginning
4. **Progress updates** -- periodic status during the window, especially for long-running changes
5. **Completion notification** -- work is done, services are restored, any post-change issues
6. **Post-maintenance summary** -- what was accomplished, any deviations from plan

For customer-facing services, this communication extends externally through status pages (Statuspage, Instatus, custom solutions) and direct notification channels.

### Follow-the-Sun Maintenance

Global organizations face a timing challenge: there is no universal "off-peak" for a service that serves users around the clock. Follow-the-sun maintenance distributes change implementation across regional teams, with each team deploying during their local low-traffic window.

This approach requires: consistent deployment tooling across regions, clear handoff protocols between regional teams, region-aware canary deployment (roll out to one region first, observe, then proceed to others), and the ability to isolate regional failures.

### Zero-Downtime Deployment vs. Planned Downtime

The evolution toward zero-downtime deployment is driven by economics. With 94% of enterprise applications now requiring 99.9%+ uptime SLAs, scheduled downtime is increasingly untenable. Zero-downtime techniques include:

**Blue-green deployment.** Two identical production environments. Deploy to the idle environment, verify, then switch traffic. Rollback is instant: switch traffic back to the previous environment.

**Canary deployment.** Route a small percentage of traffic (1-5%) to the new version. Monitor error rates, latency, and business metrics. Gradually increase traffic if metrics hold. Roll back by routing all traffic to the previous version.

**Rolling updates.** Update instances one at a time (or in small batches) while the remaining instances continue serving traffic. Each updated instance is health-checked before the next update proceeds.

**Expand-and-contract (for databases).** Add new columns/tables alongside old ones. Deploy the application to write to both old and new. Migrate existing data. Deploy the application to read from new only. Remove old columns in a later deployment.

The trade-off is complexity. Zero-downtime deployments require backward-compatible changes, more sophisticated deployment tooling, and careful handling of database migrations. Sometimes a 15-minute planned downtime window at 3:00 AM is genuinely simpler and safer than engineering a zero-downtime deployment for a complex schema change. The maturity path is to invest in zero-downtime capability for routine changes while reserving planned downtime for genuinely complex operations.

### Maintenance Window Creep

A common failure mode: maintenance windows that were originally 2 hours gradually extend to 4, then 6, then "however long it takes." Window creep indicates one of several underlying problems:

- Changes are too large (should be broken into smaller, independently deployable units)
- Testing is insufficient (issues discovered during deployment that should have been caught earlier)
- Deployment automation is inadequate (manual steps create variability and delay)
- Scope creep (additional changes added to "take advantage of" the window)

The discipline is simple: maintenance windows have hard stop times. If work is not complete by the stop time, roll back and try again in the next window. This creates pressure to right-size changes and invest in automation.

---

## 5. Change Freeze

### The Rationale

A change freeze -- also called a code freeze or deployment freeze -- is a period during which no changes (or only emergency changes) are deployed to production. Freezes serve several purposes:

- **Risk reduction during peak periods** -- e-commerce companies freeze before Black Friday/Cyber Monday because the cost of an outage during peak revenue hours vastly exceeds the cost of delayed features
- **Staffing alignment** -- during holidays, fewer engineers are available to respond to incidents, so the organization reduces the probability of incidents
- **Stabilization before release** -- software products freeze to allow final testing and bug-fixing before a major release
- **Compliance requirements** -- some regulated environments mandate freeze periods around certain events

### Industry Practice

Major technology companies implement freezes with varying approaches:

- **Meta** uses alternating "yellow" and "red" periods from November through December, with progressively stricter restrictions
- **Amazon** distinguishes between "Restricted" days (director approval required) and "Blocked" days (VP approval required)
- **Google** typically freezes from mid-December through early January
- **Uber** historically froze before Thanksgiving and from mid-December through early January, driven by 5x traffic surges during holidays
- **Microsoft** leaves freeze decisions to individual teams rather than mandating company-wide policies

Most large technology companies implement two major freeze windows annually: Thanksgiving week and the Christmas-to-New-Year period.

### The Cost of Freezes

Freezes are not free. The costs are real and often underestimated:

**Pre-freeze rush.** Engineers accelerate risky changes to land them before the freeze deadline. This is precisely the opposite of the freeze's intent: the period immediately before a freeze becomes the riskiest deployment window of the year. As one CTO observed, "The riskiest refactors made it into production at year-end," directly undermining the safety rationale.

**Post-freeze merge chaos.** During the freeze, development continues on branches. When the freeze lifts, a flood of accumulated changes all attempt to merge simultaneously, creating conflicts, integration failures, and a period of elevated instability.

**Technical debt accumulation.** Bugs discovered during the freeze that do not meet the emergency threshold accumulate. Each one is a small compromise that compounds. The post-freeze period becomes dominated by debt cleanup rather than forward progress.

**Opportunity cost.** Features, improvements, and non-critical fixes that could have shipped during the freeze period are delayed. For a two-week freeze twice a year, that is a month of delayed delivery.

### Emergency Changes During Freeze

Every freeze policy needs a clearly defined exception process. The key elements:

- **Severity threshold** -- what qualifies as a genuine emergency (typically: service-impacting incidents affecting users, critical security vulnerabilities, data integrity risks)
- **Approval chain** -- who can authorize a freeze exception (typically elevated: director or VP level, not the normal change authority)
- **Reduced scope** -- emergency changes during freeze must be the minimum viable fix, not an opportunity to bundle additional changes
- **Post-freeze review** -- every freeze exception is reviewed to determine whether the emergency was genuine and whether the fix was appropriately scoped

The cultural discipline is critical. If freeze exceptions are easy to obtain, the freeze becomes performative. If they are too difficult to obtain, genuine emergencies go unaddressed. The balance is: exceptions should be uncomfortable but not impossible.

---

## 6. Rollback Plans

### Mandatory Rollback Planning

Every change should ship with a documented rollback plan before it is approved for implementation. The rollback plan answers three questions:

1. **How do we detect failure?** -- What metrics, alerts, or symptoms indicate the change has caused a problem?
2. **How do we revert?** -- What specific steps restore the previous state?
3. **How long does it take?** -- What is the expected recovery time, and what is the maximum acceptable recovery time?

The quality of a rollback plan correlates directly with change safety. A plan that says "redeploy the previous version" is better than no plan but inadequate for production-critical systems. A complete plan specifies: the exact commands or automation to execute, who has authority to trigger rollback, what data considerations exist (transactions in flight, data written since deployment), and how to verify that rollback completed successfully.

### Rollback Strategies by Recovery Time

**10-minute recovery.** Redeploy the previous application version, skipping database steps. This works when the database schema is backward-compatible with the previous version. Recovery time is dominated by assessment (deciding to roll back) rather than execution.

**3-minute recovery.** Decouple database and code deployments by hours or days. Database changes deploy first using the expand-and-contract pattern, ensuring the previous application version remains compatible with the current schema. Rolling back the application is a simple redeployment.

**Immediate recovery.** Blue-green deployment with load balancer switching. The new version deploys to the idle environment, traffic is routed there, and rollback is a load balancer configuration change that takes seconds.

### Testing Rollback Plans

An untested rollback plan is a hypothesis, not a safety net. Testing approaches include:

- **Dry runs** -- execute the rollback procedure in a staging environment before the production change
- **Chaos engineering** -- deliberately trigger rollback in production (during low-traffic periods) to verify the procedure works
- **Automated rollback testing** -- include rollback verification as a step in the deployment pipeline
- **Table-top exercises** -- walk through the rollback procedure with the team, identifying gaps and ambiguities

### When Rollback Is Not Possible

Some changes cannot be rolled back:

- **Destructive database migrations** -- dropping columns, renaming tables, deleting data
- **External API changes** -- once consumers have adapted to a new API version, reverting creates its own breaking changes
- **Data format changes** -- data written in a new format cannot be read by the old version
- **Third-party integrations** -- changes coordinated with external partners who have made their own corresponding changes

For irreversible changes, the strategy shifts from rollback to roll-forward:

- **Extra testing investment** -- more extensive pre-deployment testing compensates for the lack of a safety net
- **Staged deployment** -- deploy the irreversible change in the smallest possible increment
- **Feature flags** -- separate the deployment of the change from its activation, allowing the new code to exist in production without being active
- **Parallel running** -- run old and new systems simultaneously during a transition period
- **Forward-fix preparation** -- have the next fix ready before deploying, so that if something goes wrong, the path forward is already planned

### Rollback Decision Criteria

The hardest part of rollback is not the mechanics -- it is the decision. Teams often delay rollback hoping to find and fix the problem, extending the outage. Clear decision criteria remove ambiguity:

- **Time-boxed diagnosis** -- if the root cause is not identified within N minutes (typically 15-30), roll back
- **Impact threshold** -- if error rates exceed X% or latency exceeds Y ms, roll back immediately regardless of diagnosis progress
- **Customer impact** -- if users are reporting impact through support channels, roll back
- **Cascading failure** -- if downstream services begin failing, roll back

The cultural element is equally important: rollback must never be treated as failure. It is a successful use of a safety mechanism. Teams that are punished for rolling back will delay the decision, extending outages.

---

## 7. Configuration Management Database (CMDB)

### Purpose and Platforms

The CMDB is a repository that stores information about configuration items (CIs) -- the components that make up an organization's IT environment. CIs include servers, network devices, applications, databases, cloud instances, containers, and the relationships between them. The CMDB's purpose is to provide a single source of truth for what exists, how it is configured, and how components relate to each other.

Major platforms include:

- **ServiceNow CMDB** -- the dominant enterprise platform, deeply integrated with ITSM workflows, incident management, and change management. Offers automated discovery through ServiceNow Discovery and third-party integrations.
- **Device42** -- focused on data center infrastructure management (DCIM) and IT asset management, with strong autodiscovery capabilities and integration with ServiceNow.
- **NetBox** -- open-source network source of truth, originally developed by DigitalOcean. Increasingly used as the authoritative record for network and infrastructure configuration, with NetBox Assurance providing continuous validation against operational state.

### The Accuracy Problem

The CMDB's fundamental challenge is accuracy. The canonical complaint -- "the CMDB is always wrong" -- reflects a structural reality: if the system of record is a separate artifact that humans maintain alongside their actual workflows, it will always drift.

Sources of inaccuracy include:

- **Manual entry decay** -- engineers update the CMDB when they remember to, which is to say not reliably
- **Discovery lag** -- automated discovery runs on a schedule (daily, weekly), so the CMDB is always at least one discovery cycle behind reality
- **Shadow IT** -- resources provisioned outside official channels never appear in the CMDB
- **Ephemeral infrastructure** -- containers, serverless functions, and auto-scaled instances may exist for hours or minutes, making traditional CI tracking meaningless
- **Decommissioning gaps** -- CIs that have been decommissioned remain in the CMDB as phantom records

ServiceNow addresses drift with its Drift Detection Engine, which compares baseline values against real-time discovery data and flags discrepancies. Staleness rules mark CIs as stale if they have not been updated within a configured window (default 60 days). These are mitigations, not solutions -- they reduce the magnitude of drift without eliminating it.

### Automated Discovery vs. Manual Maintenance

The industry has conclusively established that manual CMDB maintenance does not work at scale. Automated discovery is necessary, but it comes in flavors:

- **Agent-based discovery** -- software agents installed on each CI report configuration data to the CMDB. High accuracy, high coverage, but requires agent deployment and maintenance.
- **Agentless discovery** -- network scanning, SNMP, WMI, SSH, and API queries gather data without installed agents. Lower maintenance overhead, but may miss details that require local access.
- **Cloud API integration** -- cloud providers expose APIs (AWS Config, Azure Resource Graph, GCP Asset Inventory) that report resource state. High accuracy for cloud resources, no agent required.
- **Network-based discovery** -- packet analysis and flow data infer the existence and relationships of network-connected devices.

The most effective CMDB strategies combine multiple discovery methods and, critically, integrate the CMDB into operational workflows so that engineers interact with it as part of their work rather than as a separate maintenance task. NetBox's integration with ServiceNow, for example, enables bidirectional synchronization so that network engineers manage infrastructure data in NetBox (their preferred tool) while ServiceNow consumes that data for ITSM workflows.

### Practical CMDB Strategy

Accept that perfect accuracy is unachievable. Instead, focus on:

1. **Prioritize by impact** -- ensure accuracy for CIs that matter most (production databases, core network infrastructure, customer-facing services)
2. **Automate aggressively** -- every manual step is a drift opportunity
3. **Integrate into workflows** -- make the CMDB the place where engineers do their work, not a separate system they update after the fact
4. **Validate continuously** -- compare CMDB state against observed state and flag discrepancies
5. **Measure and report accuracy** -- what gets measured improves; track CMDB accuracy metrics and make them visible

---

## 8. Compliance Evidence

### Change Tickets as Audit Evidence

In regulated environments, change tickets are not merely operational tools -- they are audit evidence. Auditors use change records to verify that the organization follows its own policies: that changes are assessed, approved by appropriate authority, tested, implemented as planned, and reviewed after implementation.

The elements auditors examine:

- **Request and justification** -- why was the change made?
- **Risk assessment** -- was the risk evaluated, and was the assessment reasonable?
- **Authorization** -- who approved the change, and did they have authority to do so?
- **Implementation record** -- what was actually done, and does it match the plan?
- **Testing evidence** -- was the change tested, and what were the results?
- **Review** -- was the change reviewed after implementation?

### SOC 2 Change Control Requirements

SOC 2 audits evaluate against AICPA Trust Services Criteria. For change management, the relevant criteria are:

- **CC8.1** -- the entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures to meet its objectives
- **CC6.1** -- logical and physical access controls
- **CC3.2** -- risk assessment processes

In practice, SOC 2 compliance for change management requires: branch protection with pull request approvals, organization-wide multi-factor authentication, code ownership for sensitive paths (CODEOWNERS), vulnerability scanning (Dependabot or equivalent), secret scanning with push protection, and audit log streaming to external storage with one-year retention (GitHub retains audit logs for only 90 days).

### Automated Compliance Evidence Collection

Manual evidence collection -- screenshots, spreadsheets, email threads -- is expensive, error-prone, and frustrating. Modern compliance platforms (Vanta, Drata, Secureframe, Comp AI) integrate directly with engineering tools to collect evidence automatically:

- **Git platforms** -- pull request approvals, branch protection status, commit history
- **CI/CD platforms** -- build results, test results, deployment records
- **Cloud providers** -- configuration state, access logs, resource changes
- **Identity providers** -- authentication events, access reviews

The compliance pipeline runs continuously: collect evidence, hash it for integrity, organize it by control, and make it available for auditor review. This transforms compliance from a periodic scramble into a steady-state process.

### Git as the Change Record

Version control systems provide an inherently auditable change record. Every commit captures: who made the change (author), when it was made (timestamp), what changed (diff), why it changed (commit message), and who approved it (merge/PR approval). When combined with branch protection rules that require review before merge, git becomes a comprehensive change control system.

For organizations pursuing compliance, this means the development workflow itself generates the required evidence. The pull request is the change request. The code review is the risk assessment. The CI pipeline is the test evidence. The merge is the authorization. The deployment log is the implementation record. No separate change ticket system is needed -- though many organizations maintain one for changes that extend beyond code (network changes, physical infrastructure, vendor configurations).

---

## 9. Modern Change Practices

### Continuous Delivery as Change Management

The highest-performing organizations in DORA's research do not think of change management and continuous delivery as separate concerns. Continuous delivery *is* their change management practice.

The pipeline enforces controls: automated tests verify functionality, security scans check for vulnerabilities, compliance checks verify policy adherence, performance tests validate non-functional requirements. If any gate fails, the change does not proceed. This is more rigorous than any committee review because it is tireless, consistent, and comprehensive.

DORA's key finding bears repeating: speed and stability are positively correlated, not competing priorities. Organizations that deploy more frequently have lower change failure rates and faster recovery times. This is counterintuitive only if you think of "more changes" as "more risk." In practice, more frequent deployment means smaller changes, which means smaller blast radius, easier diagnosis, and simpler rollback.

The 2024 DORA report introduced a fifth metric -- deployment rework rate -- measuring unplanned deployments caused by production issues. This replaced change failure rate, which had consistently behaved as a statistical outlier that did not load cleanly with the other four metrics. The rework rate more precisely captures the cost of change-related failures.

### Feature Flags as Change Control

Feature flags decouple deployment from release. Code is deployed to production but not activated for users until the flag is enabled. This separation provides several change management benefits:

- **Instant rollback** -- disable the flag instead of redeploying
- **Gradual rollout** -- enable for 1% of users, then 5%, then 25%, observing impact at each stage
- **User-segment targeting** -- enable for internal users, then beta users, then all users
- **Kill switch** -- disable a feature immediately in response to an incident without any deployment

When feature flag configuration is managed through GitOps -- flags defined in configuration files, changes made through pull requests, deployment through the standard pipeline -- every flag change carries the same audit trail as a code change: author, reviewer, timestamp, rationale.

The risk with feature flags is accumulation. Flags that are never cleaned up create combinatorial complexity in the codebase. Discipline requires: every flag has an owner and an expiration date, flags are removed once the feature is fully rolled out, and the total number of active flags is tracked and managed.

### Infrastructure as Code as Change Documentation

Infrastructure as Code (IaC) -- Terraform, Pulumi, CloudFormation, Ansible -- transforms infrastructure changes from manual operations into code changes that flow through the same review and deployment pipeline as application code.

The change management implications are profound:

- **Every infrastructure change is a code commit** with an author, reviewer, timestamp, and rationale
- **Changes are reviewed before application** -- `terraform plan` shows exactly what will change before `terraform apply` executes it
- **Changes are version-controlled** -- the complete history of infrastructure configuration is available in git
- **Changes are reproducible** -- the same configuration applied to a different environment produces the same result
- **Drift is detectable** -- compare the declared state in code against the actual state in the environment

### GitOps Reconciliation as Change Verification

GitOps extends IaC with a continuous reconciliation loop. A GitOps operator (ArgoCD, Flux) watches the git repository for changes and continuously ensures that the running environment matches the declared state in git.

The change verification benefit: if someone makes a manual change to the environment that was not committed to git, the GitOps operator detects the drift and either alerts or automatically reverts the change. This provides a guarantee that the environment matches the documented state -- a guarantee that no human-driven change process can match.

The reconciliation loop also catches a class of failure that traditional change management misses entirely: configuration drift caused by automated systems, cloud provider changes, or operator error. In a traditional model, these silent changes accumulate until something breaks. In a GitOps model, they are detected and corrected continuously.

---

## The Tension: Control vs. Velocity

The thread running through every section of this module is the tension between control and velocity. Organizations that over-index on control get heavyweight processes, slow delivery, frustrated engineers, and -- counterintuitively -- more incidents (because large, infrequent deployments are riskier than small, frequent ones). Organizations that over-index on velocity get rapid deployment of untested changes, configuration sprawl, and incidents caused by changes that should have been caught.

DORA's decade of research provides the resolution: the answer is not balance between control and velocity but rather the right kind of control. Automated controls (tests, scans, pipeline gates) provide consistent, scalable verification. Peer review provides context-aware human judgment. Risk-based routing ensures that heavyweight process is applied only where it is warranted. Continuous reconciliation catches drift that no approval process can prevent.

The organizations that navigate this tension best share common characteristics: they invest in automation rather than process, they treat deployment as a solved engineering problem rather than a risky event, they measure outcomes (failure rate, recovery time) rather than inputs (number of approvals, documentation completeness), and they continuously improve their change practices based on evidence rather than instinct.

The destination is not the elimination of change management but its evolution: from a gatekeeping function that restricts change to an engineering discipline that enables it safely. The name change from "change management" to "change enablement" is not just semantics. It describes the trajectory that every maturing organization follows.

---

*Module 03 of the Systems Operations Research Series. The control-velocity tension resolves not through compromise but through engineering discipline: automate the verifiable, delegate the judgment calls, measure the outcomes, improve continuously.*

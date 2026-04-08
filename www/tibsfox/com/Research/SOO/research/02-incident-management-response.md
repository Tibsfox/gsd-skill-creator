# Incident Management & Response

When production breaks at 3 AM, the difference between a 15-minute recovery and a 15-hour catastrophe is not talent or luck. It is process. The organizations that recover fastest are the ones that decided, long before the pager fired, exactly who does what, who talks to whom, and how to learn from it afterward.

This module dissects the operational machinery of incident response: how to classify severity, run a war room, communicate under pressure, escalate intelligently, and close the loop with post-incident reviews that actually change behavior. Every framework here has been tested at scale by organizations running global infrastructure, from Google's IMAG system to Cloudflare's response to their worst outage in six years.

---

## Severity Classification

### The Standard Framework: SEV1 Through SEV4

Severity classification is the first decision in any incident, and it determines everything that follows: who gets paged, what communication channels open, how quickly leadership expects updates, and whether the status page changes.

PagerDuty's open-source incident response documentation defines five severity levels, and their framework has become a de facto industry standard:

**SEV-1 (Critical):** Systems in critical state with large-scale customer impact. Functionality is severely impaired beyond SLA thresholds. Security vulnerabilities exposing customer data. Response: full major incident activation, Incident Commander paged immediately, stakeholder notification, public communication initiated.

**SEV-2 (Major):** Critical system issue actively impacting many customers' ability to use the product. Notification pipelines severely impaired, web applications unavailable, monitoring systems compromised. Response: major incident response with immediate IC page and full incident management protocol.

**SEV-3 (Significant):** Stability or minor customer-impacting issues requiring immediate attention from service owners. Partial functionality loss not affecting most users, issues with escalation potential, services lacking redundancy. Response: high-urgency page to the owning service team.

**SEV-4 (Minor):** Issues requiring action but not affecting customer ability to use the product. Performance delays, individual host failures, delayed job failures outside critical pipelines. Response: low-urgency notification, prioritized above routine work but below critical incidents.

**SEV-5 (Cosmetic):** Bugs or cosmetic issues with no functional impact. Response: ticket creation and assignment.

### Google's Three-Tier Approach

Google's SRE organization uses a simpler three-severity model. Their criteria for declaring an incident at all are instructive: a second team's involvement becomes necessary, the outage affects customers visibly, or the issue remains unresolved after one hour of focused analysis. Google favors fewer tiers because a three-level system reduces the cognitive overhead of classification during high-stress moments.

### Defining Severity for Your Organization

The politics of severity classification are real and worth acknowledging. Every SEV-1 triggers expensive processes: executive notifications, potential status page updates, mandatory postmortems. This creates two failure modes:

**Over-classification:** Teams that call everything SEV-1 cause alert fatigue at the leadership level. Executives stop paying attention to incident notifications, and the process loses its power exactly when it is needed most.

**Under-classification:** Teams that resist declaring SEV-1 (because they do not want the scrutiny, the postmortem overhead, or the perception of failure) end up with SEV-2 incidents that simmer for hours before someone finally escalates. This is more dangerous than over-classification.

The solution is to define severity by customer impact, not by root cause or engineering difficulty. A severity matrix should answer these questions objectively:

| Question | SEV-1 | SEV-2 | SEV-3 | SEV-4 |
|----------|-------|-------|-------|-------|
| How many users are affected? | All or most | Many | Some | Few |
| Is core functionality broken? | Yes | Degraded | Edge cases | No |
| Is there a workaround? | No | Painful one | Yes | N/A |
| Is revenue directly impacted? | Yes | Likely | Possible | No |
| Is data at risk? | Yes | Possibly | No | No |

Write these criteria down, get engineering and business leadership to agree on them, and reference them in your runbooks. The time to argue about whether something is a SEV-1 is not during the incident.

---

## The Incident Commander Role

### Responsibilities and Authority

The Incident Commander (IC) is the single point of coordination during an incident. Google's SRE book defines it clearly: "The incident commander holds the high-level state about the incident. They structure the incident response task force, assigning responsibilities according to need and priority."

The IC's core responsibilities:

1. **Maintain situational awareness.** The IC tracks the big picture: what is broken, what is being tried, what is working, what is not. They do not debug code or run commands.

2. **Assign and coordinate work.** The IC delegates investigation and remediation to subject matter experts. They ensure parallel work streams do not conflict with each other.

3. **Make decisions.** When the team is torn between two approaches, the IC decides. When it is time to roll back versus push forward, the IC calls it. Speed of decision matters more than perfection.

4. **Control communication cadence.** The IC sets the rhythm: how often status updates go out, when stakeholders get briefed, when to bring in additional teams.

5. **Maintain the living document.** Google emphasizes that "the incident commander's most important responsibility is to keep a living incident document," a real-time record of what is happening, what has been tried, and what is next.

The IC does not need to be the most senior engineer. They need to be calm, organized, and willing to say "I don't know, let's find out" rather than guessing.

### The IC Rotation

Organizations that take incident management seriously maintain an IC rotation separate from the on-call engineering rotation. The on-call engineer detects and triages; the IC manages the response process. These are different skills.

An IC rotation typically involves:

- A pool of 6-12 trained ICs rotating weekly or biweekly
- Clear handoff procedures between IC shifts
- A secondary/shadow IC who can take over if the primary IC is overwhelmed
- Coverage across time zones for global organizations

### Training New ICs

PagerDuty's open-source documentation recommends a shadow-then-lead approach:

1. **Read the documentation.** Understand the roles, the communication templates, the escalation paths.
2. **Shadow experienced ICs.** Observe 3-5 real incidents, noting how the IC directs traffic, handles pressure, and manages communication.
3. **Practice in tabletop exercises.** Run game-day scenarios where a facilitator injects complications and the trainee IC must respond in real time.
4. **Lead with a shadow.** Run a real (ideally lower-severity) incident with an experienced IC available as backup.
5. **Full rotation.** After demonstrating competence, join the regular IC rotation.

### IC Anti-Patterns

**Hero Culture:** A single person who always runs incidents because "they're the best at it." This creates a single point of failure and prevents organizational learning. If your best IC gets sick during a major outage, you are in trouble.

**Command Vacuum:** Nobody formally assumes the IC role, and the incident devolves into multiple engineers independently investigating different theories without coordination. This is the most common failure mode in organizations without explicit IC processes.

**IC-as-Debugger:** The IC starts investigating the root cause themselves, losing the coordination perspective. Once the IC is heads-down in logs, nobody is managing the overall response.

**Decision Paralysis:** The IC asks for consensus on every decision instead of making a call. During a SEV-1, you need speed. A wrong decision that is quickly reversible is better than no decision while the incident burns.

---

## War Room Operations

### Virtual vs Physical War Rooms

The shift to distributed teams has made virtual war rooms the default. A war room is a temporary, focused workspace, whether virtual or physical, created to centralize communication, telemetry, and decision-making for high-severity incidents.

**Virtual war room setup (standard practice):**
- A dedicated incident Slack/Teams channel, created automatically or by the IC (naming convention: `#inc-YYYY-MM-DD-short-description` or `#sev1-database-outage`)
- A video bridge (Zoom, Google Meet) for real-time voice coordination
- A shared document (Google Doc, Notion) for the incident timeline
- Dashboard links pinned in the channel (monitoring, status page admin)

**Physical war rooms** still have value for planned events (major migrations, launches) where you know high-severity issues are likely. The advantage is bandwidth: reading body language, whiteboarding architecture, and eliminating the latency of typed communication.

### The Scribe Role

PagerDuty's incident response framework defines the Scribe as a dedicated role, and it is one of the most underappreciated positions in incident management.

The Scribe's job: listen to the call and watch the incident Slack room, keeping track of context and actions that need to be performed, and documenting them as you go. Critically, the Scribe should never be performing remediations, checking graphs, or investigating logs. Those tasks belong to the subject matter experts.

What the Scribe documents:
- Every action the IC delegates and to whom
- Results of polling decisions ("Polled for decision on whether to perform rolling restart. Proceeding with restart.")
- Timeline entries with timestamps
- Follow-up items prefixed with "TODO" for easy postmortem extraction

Organizations that skip the Scribe role pay for it later: the postmortem becomes an exercise in reconstructing what happened from fragmented Slack messages and hazy memories.

### Status Update Cadence

During active incidents, the IC should drive a regular status update cadence:

| Severity | Internal Update Frequency | External Update Frequency |
|----------|--------------------------|--------------------------|
| SEV-1 | Every 15 minutes | Every 30 minutes |
| SEV-2 | Every 30 minutes | Every 60 minutes |
| SEV-3 | Every 60 minutes | As needed |

Each update follows the same structure: what we know, what we are doing about it, when the next update will be. This pattern, sometimes called the "known unknowns" update, is critical. Saying "we don't yet know the root cause, but we have isolated the problem to the database layer and are investigating" is far better than silence.

### Stakeholder Management During Incidents

The Communications Lead (a role Google's IMAG system explicitly separates from the IC) manages stakeholder communication. Different audiences need different information:

- **Engineering teams:** Technical details, what systems are affected, what they should or should not do
- **Support teams:** Customer-facing talking points, ETA guidance, known workarounds
- **Leadership/executives:** Business impact, estimated time to resolution, whether it will make the news
- **Customers:** Status page updates, proactive notification for affected accounts

---

## Communication Protocols

### Internal Communication

**The golden rule of incident communication:** tell people what you know, what you do not know, and when they will hear from you next. Three sentences that cover these three points are better than a paragraph of hedging.

**Engineering-wide notifications** should go out for any SEV-1 or SEV-2. The message should include: what is broken (in plain language), what the customer impact is, a link to the incident channel, and whether other teams need to do anything (usually: "Do not deploy until further notice").

**Leadership briefings** during a SEV-1 should be concise and structured:
```
Subject: [SEV-1] Database cluster primary down - Active incident

Status: INVESTIGATING
Impact: All write operations failing. ~100% of users affected.
Duration so far: 45 minutes
Current actions: Promoting replica to primary. ETA 15 minutes.
Next update: 15 minutes or sooner if status changes.
```

### External Communication

External communication must be honest without being recklessly detailed. Customers need to know three things: (1) you are aware of the problem, (2) you are working on it, and (3) when they will hear from you again.

**Template for initial incident notification:**
```
We are currently investigating reports of [service] degradation.
Some users may experience [specific symptoms].
We are actively working to resolve this and will provide
an update within [timeframe].
```

**Template for ongoing updates:**
```
We have identified the cause of the [service] issue and are
implementing a fix. [X]% of users are currently affected.
We expect to have this resolved by [time estimate or "within
the next hour"]. Next update in 30 minutes.
```

**Template for resolution:**
```
The issue affecting [service] has been resolved as of [time].
[Brief, non-technical explanation of what happened].
We will be conducting a thorough review and will share
findings on our blog.
```

### The "Known Unknowns" Pattern

The most effective incident communicators explicitly state what they do not yet know. "We are investigating elevated error rates. We have ruled out a code deployment as the cause. We have not yet determined whether this is a database issue or a network issue." This builds credibility. Audiences trust organizations that are transparent about uncertainty far more than those that only communicate when they have complete answers.

---

## Escalation Paths

### Technical Escalation vs Management Escalation

These are two separate paths, often triggered simultaneously but serving different purposes:

**Technical escalation** moves the problem to someone with deeper expertise. The on-call application engineer escalates to the database team when they determine the root cause is in the data layer. The database team escalates to the cloud provider when they determine the underlying infrastructure is at fault.

**Management escalation** activates organizational support. This means staffing (pulling people off other work), communication (activating the status page, briefing executives), and resource allocation (approving emergency spend, coordinating with vendors at premium support tiers).

### On-Call Chains

A well-designed escalation policy has multiple tiers:

**Tier 1 (0-5 minutes):** Primary on-call engineer receives the alert. They have 5 minutes to acknowledge. If they do not acknowledge, the alert auto-escalates.

**Tier 2 (5-15 minutes):** Secondary on-call receives the alert. This might be a senior engineer on the same team or the team lead.

**Tier 3 (15-30 minutes):** Engineering manager or principal engineer is notified. At this point, the IC role should be formally activated for SEV-1/SEV-2 incidents.

**Tier 4 (30+ minutes):** VP of Engineering or CTO is informed. Cross-functional coordination activates (customer support, communications, legal if data is involved).

### Cross-Team Escalation

Many incidents span team boundaries. The IC is responsible for pulling in additional teams. Effective cross-team escalation requires:

- A directory of team on-call rotations (most incident management tools provide this automatically)
- Clear paging policies (what information to include when paging another team)
- Expectation setting: the paged team joins the war room within 15 minutes for SEV-1

### Vendor Escalation

Cloud provider support tiers matter enormously during incidents. AWS, Google Cloud, and Azure all offer tiered support with dramatically different response times:

| Support Tier | Typical Cost | SEV-1 Response | Best For |
|-------------|-------------|----------------|----------|
| Basic/Free | $0 | Forums only, no SLA | Development |
| Developer | $29-100/month | 12-24 hours | Small teams |
| Business | $100-5,000/month | 1 hour | Production workloads |
| Enterprise | $15,000+/month | 15 minutes, TAM assigned | Critical infrastructure |

**When to escalate to vendor:** When you have ruled out application-level causes and suspect underlying infrastructure issues. Do not wait until you have exhausted all internal investigation; file the support case early and continue investigating in parallel. Include specific resource IDs, timestamps, error messages, and what you have already ruled out.

### When to Escalate vs When to Investigate

A common failure mode: an engineer spends 45 minutes investigating a SEV-1 alone, confident they are "close to figuring it out." The decision framework should be time-based, not confidence-based:

- **15-minute rule for SEV-1:** If the root cause is not identified within 15 minutes, escalate. You can always de-escalate.
- **30-minute rule for SEV-2:** If mitigation is not in progress within 30 minutes, escalate.
- **Impact expansion:** If the incident's blast radius is growing (more services affected, more users impacted), escalate immediately regardless of how long you have been investigating.

---

## Post-Incident Review

### The Blameless Postmortem

The blameless postmortem is the single most important practice in incident management. Google's SRE book states the core principle: postmortems must focus on "identifying the contributing causes of the incident without indicting any individual or team for bad or inappropriate behavior." A blamelessly written postmortem assumes that everyone involved had good intentions and did the right thing with the information they had at the time.

Etsy's engineering team, pioneers of the blameless postmortem in practice, frames it this way: "Once you welcome people into the room and set expectations about the mindset they should be in (blameless) and the outcome (learning), there's really only one thing to focus on: discovering the story behind the story."

### When to Write a Postmortem

Google triggers postmortems based on objective criteria established before incidents occur:

- User-visible downtime or degradation exceeding defined thresholds
- Any data loss whatsoever
- On-call engineer intervention (rollbacks, traffic rerouting)
- Resolution time surpassing set limits
- Monitoring failures that required manual discovery of the problem
- Any stakeholder may request a postmortem for any event

Having written criteria removes the "was this bad enough for a postmortem?" debate.

### The Postmortem Process

**Within 24-48 hours of resolution:**
1. The postmortem owner (usually the IC or a designated engineer) creates the document from a template
2. Timeline is reconstructed from the Scribe's notes, Slack logs, and monitoring data
3. Contributing factors are identified (not "root cause" singular; incidents typically have multiple contributing factors)
4. Action items are drafted with owners and due dates

**Within one week:**
5. The postmortem is reviewed in a meeting with all participants
6. Action items are refined, prioritized, and assigned
7. The final document is published to the organization

**Ongoing:**
8. Action items are tracked to completion
9. The postmortem is added to the organizational knowledge base

### The "5 Whys" in Practice

The "5 Whys" technique (originally from Toyota's manufacturing process) asks "why" repeatedly to move from symptoms to systemic causes:

1. *Why did the site go down?* The database ran out of connections.
2. *Why did the database run out of connections?* A code change removed connection pooling.
3. *Why did the code change remove connection pooling?* The developer was unfamiliar with the connection management pattern.
4. *Why were they unfamiliar?* There is no documentation or code review checklist for database patterns.
5. *Why is there no documentation?* The team has prioritized feature work over operational documentation.

The "5 Whys" works well for linear causal chains. For complex incidents with multiple contributing factors, the technique can be misleading: it tends to find a single root cause when the reality is that multiple failures aligned. For complex incidents, a contributing-factors analysis (listing all conditions that had to be true for the incident to happen) is more revealing.

### Postmortem Fatigue

The research from Google (published in USENIX ;login:, Spring 2017, by Lunney, Lueder, and Beyer) identifies a critical failure pattern with postmortem action items: twenty action items means zero action items, because teams will complete two and forget the rest.

Practical countermeasures:

- **Limit action items to 3-5 per postmortem.** Prioritize ruthlessly. What are the one or two things that would have prevented this incident entirely?
- **Make action items specific and bounded.** Not "improve monitoring" but "add an alert when database connection count exceeds 80% of max_connections, owned by Alice, due by March 15."
- **Track completion rates as a team metric.** If completion rates are low, the problem is organizational: leadership is not prioritizing reliability work over feature development.
- **Schedule follow-up reviews.** A two-week check-in on action item progress prevents postmortems from becoming write-only documents.

### Learning Reviews vs Blame Reviews

The difference between a learning review and a blame review is audible in the first five minutes:

**Blame review sounds like:** "Who approved this change? Why didn't anyone catch this in code review? The deploy should have been blocked."

**Learning review sounds like:** "Walk us through what you were seeing at the time you made that decision. What information did you have? What would have helped you make a different decision?"

Organizations that conduct blame reviews see incident hiding, reduced reporting, and engineers who avoid taking on-call shifts. Organizations that conduct learning reviews see increased reporting, voluntary postmortem participation, and engineers who proactively improve systems.

---

## Status Pages & Customer Communication

### The Status Page Ecosystem

**Atlassian Statuspage** (formerly Statuspage.io) is the market leader for hosted status pages. The free tier provides 100 subscribers, 25 components, two team members, email and Slack notifications, and REST API access. Paid tiers add SMS notifications, automation, and higher subscriber limits.

**Cachet** is an open-source, self-hosted alternative built in PHP/Laravel. It provides incident reporting, component status tracking, scheduled maintenance announcements, and metric display. Ideal for organizations that need full control over their status infrastructure or have data sovereignty requirements.

**Other notable options:** Instatus (fast, modern UI), Better Uptime (combines monitoring with status pages), StatusPal (SLA tracking built in), and Status.io (multi-brand support for organizations with multiple products).

### Component-Based Status

A well-designed status page breaks the system into components that map to customer-facing functionality, not internal architecture. Users do not care about "us-east-1 RDS cluster"; they care about "Login," "Dashboard," "API," "Webhooks."

Standard component states:
- **Operational:** Everything working normally
- **Degraded Performance:** Working but slower than expected
- **Partial Outage:** Some functionality unavailable
- **Major Outage:** Component is down

### Scheduled Maintenance Communication

Maintenance windows deserve the same communication discipline as incidents:

1. **Advance notice:** 72 hours minimum for impactful maintenance, 1 week for major changes
2. **Clear impact statement:** "During this window, API response times may increase by 200-500ms" rather than "brief performance impact"
3. **Progress updates:** If maintenance is running long, update the status page before the window expires
4. **Completion confirmation:** Explicitly mark the maintenance as complete when finished

### Incident Communication SLAs

Many organizations define internal SLAs for how quickly the status page must be updated:

| Severity | Time to First Update | Update Frequency |
|----------|---------------------|-----------------|
| SEV-1 | Within 10 minutes | Every 30 minutes |
| SEV-2 | Within 30 minutes | Every 60 minutes |
| SEV-3 | Within 60 minutes | As needed |

These SLAs should be tracked as a metric. If you consistently miss the 10-minute window for SEV-1, your process has a gap, likely in the handoff between "incident declared" and "communications lead activated."

---

## Tooling Ecosystem

### The Market Landscape (2026)

The incident management tooling market has bifurcated into two categories: legacy enterprise platforms and modern Slack-native tools. A significant market event: Atlassian ended new sales of OpsGenie in June 2025 and will sunset the product on April 5, 2027, forcing thousands of teams to re-evaluate their stack.

### Legacy Enterprise

**PagerDuty** remains the most widely deployed incident management platform with deep integrations, AIOps capabilities, ITIL-style workflows, and extensive escalation policy configuration. It handles alert routing, on-call scheduling, and escalation chains. The trade-off: complexity, steep pricing (enterprise contracts often run $30-50+/user/month), and a user experience that shows its age. PagerDuty is strongest for organizations that need ITIL compliance, audit trails, and integration with enterprise service management tools.

**Opsgenie** (Atlassian, sunsetting April 2027) offered alert management integrated with Jira and Confluence. Teams currently on Opsgenie should begin migration planning. Atlassian is directing customers toward Jira Service Management as the replacement, but many teams are using this as an opportunity to evaluate the newer platforms.

### Modern Slack-Native

**incident.io** is built to run the entire incident lifecycle inside Slack or Teams. When an alert fires, it automatically creates a dedicated channel, pages the right responders, and provides slash commands for status updates, role assignments, and severity changes. Unique features include real-time call transcription (Scribe) and a post-incident workflow that generates draft postmortems from channel activity. Ease-of-use scores are high (9.5/10 per G2).

**Rootly** operates natively in Slack with AI-powered capabilities: analyzing incidents, suggesting runbooks, generating summaries, and assisting with postmortems. Its Workflow engine can automatically create channels, pull in on-call responders, start video conferences, assign roles, and update stakeholders from a single command. As of late 2025, Rootly held 8.5% mindshare versus FireHydrant's 1.6%.

**FireHydrant** takes a web-first approach with Slack integration (rather than being Slack-native). Its strength is runbook automation: defining step-by-step procedures that execute automatically during incidents. Best for organizations that prioritize highly structured, repeatable workflows and need detailed audit trails.

### Integration Patterns

Modern incident management tools integrate with:
- **Alerting:** Datadog, New Relic, Prometheus/Alertmanager, CloudWatch, Grafana
- **Communication:** Slack, Microsoft Teams, Zoom, Google Meet
- **Status pages:** Atlassian Statuspage, Instatus, custom pages via API
- **Ticketing:** Jira, Linear, Shortcut, GitHub Issues
- **Version control:** GitHub, GitLab (for tracking deployments correlated with incidents)

The key integration: bidirectional sync between the incident management platform and your ticketing system. Postmortem action items should flow automatically into your sprint backlog.

### Cost Considerations

Teams migrating from PagerDuty to modern alternatives report 30-60% savings on total cost of ownership. However, cost should not be the primary decision driver. The right question is: does the tool match how your team actually works? If your team lives in Slack, a Slack-native tool will see higher adoption than a web-first tool, regardless of feature parity.

---

## Metrics

### The Four Core Metrics

These four metrics form the foundation of incident management measurement. Each drives different operational improvements, and tracking them together provides a complete picture.

#### MTTD: Mean Time to Detect

**Definition:** The average elapsed time between when a problem starts and when your monitoring detects it.

**What it measures:** The quality of your monitoring and alerting infrastructure. A high MTTD means your monitoring has blind spots.

**What improves it:**
- Synthetic monitoring (probing from the outside, as a customer would)
- Better alert thresholds (catching degradation before it becomes an outage)
- Canary deployments that detect problems before full rollout
- Anomaly detection on key business metrics (order volume, login rate)

**Benchmark:** Leading organizations target MTTD under 5 minutes for SEV-1 issues.

#### MTTA: Mean Time to Acknowledge

**Definition:** The average elapsed time from when an alert fires to when a human acknowledges it and begins investigation.

**What it measures:** The effectiveness of your on-call process and alerting configuration.

**What improves it:**
- Clear on-call rotations with well-rested engineers
- Alert routing that reaches the right person (not a shared queue)
- Reducing alert noise so real alerts are not buried in false positives
- Auto-escalation when acknowledgment SLAs are missed

**Benchmark:** SEV-1 MTTA should be under 5 minutes.

#### MTTR: Mean Time to Resolve

**Definition:** The average elapsed time from incident detection to full resolution (service restored to normal operation).

**What it measures:** The overall effectiveness of your incident response process, from detection through investigation through remediation.

**What improves it:**
- Runbooks for common failure modes
- Pre-approved rollback procedures
- Feature flags that allow instant mitigation without deploys
- Postmortem action items that address systemic causes

**Benchmark:** MTTR varies enormously by incident type. For SEV-1 incidents, organizations with mature incident processes target MTTR under 1 hour. The industry median is significantly higher.

#### MTBF: Mean Time Between Failures

**Definition:** The average elapsed time between one incident's resolution and the next incident's detection.

**What it measures:** Overall system reliability. MTBF is the metric that captures whether your preventive work (chaos engineering, capacity planning, architecture improvements) is actually reducing incident frequency.

**What improves it:**
- Completing postmortem action items (the most direct lever)
- Chaos engineering to find weaknesses before they cause incidents
- Capacity planning and load testing
- Architecture changes that eliminate single points of failure

### How Each Metric Drives Different Improvements

| Metric | What It Reveals | Investment Area |
|--------|----------------|-----------------|
| MTTD | Monitoring gaps | Observability, synthetic monitoring, anomaly detection |
| MTTA | On-call process issues | Alert routing, rotation health, noise reduction |
| MTTR | Response process gaps | Runbooks, automation, IC training, escalation paths |
| MTBF | Systemic reliability | Architecture, capacity, postmortem follow-through |

The most common mistake is fixating on MTTR alone. An organization with fast MTTR but terrible MTBF is just getting good at fighting fires. An organization with good MTBF but slow MTTR has reliable systems but poor emergency processes. You need both.

### Metric Anti-Patterns

**Gaming MTTR by closing incidents prematurely.** If the incident is "resolved" but the underlying issue recurs within hours, you have not resolved anything. Track re-opened incidents as a separate metric.

**Averaging across severities.** MTTR for SEV-4 incidents should not be in the same average as MTTR for SEV-1 incidents. Report metrics by severity level.

**Using metrics punitively.** The moment MTTR becomes a performance metric for individual engineers, people stop accurately reporting incidents. These metrics measure systems and processes, not people.

---

## Real-World Incident Case Studies

### Cloudflare, November 18, 2025: The Feature File That Broke the Internet

At 11:20 UTC, Cloudflare's network began failing to deliver core traffic. The cause: a database permissions change the previous day allowed a Bot Management feature file generation query to return duplicate column entries. The resulting file exceeded the 200-feature limit and was propagated across all edge servers globally.

**Timeline:**
- 11:20 UTC: Services begin failing
- 11:31 UTC: Automated tests detect anomaly
- 11:35 UTC: Incident declared
- 13:37 UTC: Root cause identified (2 hours 17 minutes from detection)
- 14:24 UTC: New configuration generation stopped
- 17:06 UTC: Full restoration (5 hours 46 minutes total)

**Impact:** X (Twitter), ChatGPT, Shopify, and hundreds of other services went offline. Cloudflare acknowledged it as their worst outage since 2019.

**Lessons:** A seemingly innocuous database permissions change cascaded through a feature file generation pipeline. The change passed review. The deployment followed process. But the interaction between the permissions change and the Bot Management query was not covered by any existing test. Cloudflare committed to validation checks on configuration file ingestion and global kill switches for features.

### AWS US-East-1, October 19-20, 2025: 15 Hours of Cascading Failure

A DNS failure in DynamoDB caused a cascade that affected 142 AWS services for up to 15 hours.

**Timeline:**
- 11:48 PM PDT (Oct 19): DynamoDB DNS failure begins
- 2:25 AM (Oct 20): DNS fixed, but EC2 instance launches fail due to throttling
- 5:30 AM-2:09 PM: NLB health check failures cause connection errors
- 2:15 PM: Final services restored (roughly 14.5 hours total)

**Lessons:** The dependency chain is the critical factor. DynamoDB's DNS failure was not just a DynamoDB problem; internal AWS services also depend on DynamoDB, creating a cascade that far outlasted the original failure. AWS published their postmortem within 3 days, a significant improvement over the 4 months it took after a similarly large 2023 event.

### GitHub, June 25, 2025: The Routine Migration

A planned database migration spiraled into a multi-hour incident affecting repositories, pull requests, GitHub Actions, and dependent services. The incident was resolved by completing a database rollback, and no customer data was lost.

**Lesson:** "Routine" database migrations are one of the most common sources of major incidents. The word "routine" creates a false sense of safety that reduces the scrutiny applied to the change.

### Cloudflare, June 21, 2022: BGP in 19 Data Centers

During an infrastructure configuration standardization, a BGP community attribute change was misconfigured. The diff format reordered terms in BGP prefixes, effectively withdrawing route advertisements for 19 data centers. Despite affecting only a subset of the network, 50% of total traffic was impacted.

**Timeline:**
- 06:27 UTC: Outage begins
- 06:58 UTC: First data center back online
- 07:42 UTC: All data centers online (75 minutes total)

**Lesson:** The change request had a dry-run, a stepped rollout, and peer review. But the rollout steps were not granular enough to catch the error before it propagated to all spine routers. Cloudflare's response was fast (75 minutes), which demonstrates that having good incident processes does not prevent incidents but does limit their duration.

---

## Building an Incident Management Program

### Starting from Zero

If your organization has no formal incident management process, implement these in order:

1. **Define severity levels.** Write them down. Get agreement. Put them in a wiki.
2. **Establish an on-call rotation.** Use PagerDuty, Rootly, or incident.io. Ensure every alert has an owner.
3. **Create an IC rotation.** Start with 3-4 volunteers. Train them with tabletop exercises.
4. **Write three runbooks.** Cover your three most common failure modes. These will be imperfect. That is fine.
5. **Implement a status page.** Even a simple one. The act of updating it forces structured thinking about customer impact.
6. **Conduct your first blameless postmortem.** Set the tone for your organization. This is where culture is created.
7. **Track MTTR and MTBF.** Start measuring before you try to improve.

### Maturity Progression

**Level 1 (Reactive):** Incidents are noticed by customers. Response is ad hoc. No postmortems.

**Level 2 (Defined):** Severity levels exist. On-call rotation exists. Postmortems happen for SEV-1.

**Level 3 (Measured):** MTTD, MTTA, MTTR, and MTBF are tracked. Postmortem action items are completed. The status page is updated within SLA.

**Level 4 (Proactive):** Chaos engineering identifies weaknesses before they cause incidents. Game days test the incident process itself. Postmortem insights drive architectural decisions. MTBF trends upward quarter over quarter.

**Level 5 (Learning Organization):** Incidents are viewed as learning opportunities, not failures. Postmortem insights are shared across teams. The incident management process itself is continuously improved based on retrospectives about the process.

---

## Key Takeaways

1. **Severity classification determines everything.** Get it right, get agreement, and reference it in every incident.
2. **The IC does not debug.** They coordinate, communicate, and decide. Separating these roles is the single highest-leverage process change most organizations can make.
3. **Communication is not optional.** The "known unknowns" update pattern builds trust. Silence erodes it.
4. **Escalate early.** The cost of a false escalation is low. The cost of a late escalation is high.
5. **Blameless postmortems change culture.** But only if action items are tracked and completed. A postmortem with unfulfilled action items is worse than no postmortem, because it teaches the organization that the process is theater.
6. **Metrics measure systems, not people.** Track MTTD, MTTA, MTTR, and MTBF by severity level. Use them to identify process gaps, not to evaluate individuals.
7. **The tooling matters less than the process.** PagerDuty, incident.io, Rootly: any of them work if the underlying process is sound. None of them work if it is not.

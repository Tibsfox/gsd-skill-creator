# On-Call & Operational Culture

**Module:** 10 of Systems Operations (SysOps) Series
**Domain:** People, process, and organizational dynamics in production operations
**Last Updated:** 2026-04-08

Every previous module in this series dealt with systems. This one deals with the people who keep those systems running. Monitoring, incident response, observability, capacity planning --- none of it matters if the humans behind the pager are burned out, undertrained, undercompensated, or operating in a culture that punishes honesty. On-call is the sharp edge where organizational culture meets production reality, and how an organization designs that edge determines whether it learns from failure or repeats it.

This module covers the full lifecycle of operational culture: how rotations are designed, how people are compensated, how alerts are tuned, how handoffs preserve context, how reviews drive improvement, and how culture either enables or destroys all of it. The data comes from the 2025 SRE Report (Catchpoint, n=301), the 2025 State of Incident Management report (Runframe, synthesizing 20+ industry reports and 25+ team interviews), Google's SRE book, the DORA research program, and the Team Topologies framework. Where survey numbers are cited, the methodology and sample size are noted.

---

## 1. Rotation Design

The fundamental constraint of on-call rotation design is biological: humans need sleep, recovery time, and predictability. Every rotation model is an attempt to distribute the burden of 24/7 availability across a finite team in a way that remains sustainable over months and years, not just weeks.

### Rotation Types

**Weekly rotation** is the most common model. One engineer carries the pager for a full week (Monday to Monday is typical), then rotates to the next person. Weekly rotations provide continuity --- the on-call engineer develops context over the week and can see patterns across days. The downside is that a bad week (major incident, repeated pages overnight) creates a sustained burden with no relief until the rotation ends.

**Daily rotation** reduces the maximum exposure window. Each engineer is on-call for 24 hours. This limits the damage from a bad shift but fragments context: the on-call engineer has less time to notice multi-day trends. Daily rotations work better for smaller teams (3--4 people) where weekly rotations would mean being on-call every 3--4 weeks.

**Follow-the-sun** distributes coverage across geographic regions so that no engineer works overnight. With three sites spanning the US, Europe, and Asia-Pacific, each regional team covers its daylight hours, reducing per-engineer on-call duration by as much as 67%. The model eliminates the 3 AM page entirely but introduces handoff complexity and requires sufficient staffing in each region. Follow-the-sun is only viable for organizations with distributed teams; you cannot manufacture it with a single-office team.

### Team Size Requirements

Google's SRE book is explicit: for a single-site team providing 24/7 primary and secondary coverage, the minimum is **eight engineers**. For dual-site teams running follow-the-sun, the minimum is **six engineers per site**. These numbers derive from the 25% cap on on-call work (see Section 6) --- if an engineer spends more than 25% of their time on on-call duties, the rotation is unsustainable.

Datadog's published rotation design targets six to eight engineers per rotation, ensuring each person serves no more than once per month. The math is straightforward: a weekly rotation with six people means each person is on-call roughly once every six weeks. With four people, it is every four weeks. Below four, the rotation becomes a treadmill.

### Primary, Secondary, and Shadow Roles

A well-designed rotation uses layered responsibility:

**Primary** is the first responder. They carry the pager, acknowledge alerts, and begin triage. Response time SLAs are measured against the primary (typically 5--15 minutes for high-severity pages).

**Secondary** is the safety net. If the primary does not acknowledge within the escalation window, the page goes to secondary. Some teams also use the secondary for non-urgent production work (queue maintenance, certificate renewals, minor config changes), freeing the primary to focus on incidents. Google's SRE book notes that the division of labor between primary and secondary varies by team --- some treat secondary as pure fallthrough, others as a division of duties.

**Shadow** is the training lane. Before carrying the pager independently, an engineer shadows an experienced on-call through real incidents. This is not informal mentorship; it is a structured step in the rotation schedule. The shadow receives all the same pages, joins all the same bridges, but has no response obligation. Shadow rotations surface knowledge gaps early and build confidence. Skipping this step --- throwing someone into primary without shadow experience --- is one of the fastest paths to a bad incident and a demoralized engineer.

### Rotation Fairness and Holiday Coverage

Uneven distribution of painful shifts (weekends, holidays, nights) is one of the most corrosive forces in on-call culture. If the same people always end up covering Thanksgiving or New Year's Eve, resentment builds quickly and quietly.

Fair rotation requires explicit rules: holiday assignments rotate year over year (tracked in the scheduling tool, not in someone's memory), weekend shifts are balanced across the quarter, and anyone who covers a holiday gets compensatory time off. PagerDuty, OpsGenie (note: Atlassian announced OpsGenie's planned sunset in April 2027), and incident.io all support override tracking and fairness reporting. The tooling exists; the organizational will to enforce fairness is the bottleneck.

### Scheduling Tools

**PagerDuty** remains the dominant on-call scheduling and alerting platform. Its scheduling engine supports complex rotation types, escalation policies, and override management. PagerDuty's operational reviews feature provides aggregated metrics across teams.

**OpsGenie** (Atlassian) has been a strong alternative, particularly for organizations already in the Atlassian ecosystem. However, Atlassian's announced deprecation timeline means new adoptions should consider alternatives.

**incident.io**, **Rootly**, **Grafana OnCall** (open source), and **Squadcast** (acquired by SolarWinds) represent the current competitive landscape. The market is consolidating rapidly.

---

## 2. Compensation Models

On-call compensation is one of the clearest signals of how an organization values its operations engineers. When on-call is uncompensated, the message --- regardless of what leadership says --- is that the organization does not consider the burden real.

### Compensation Structures

Five models dominate the industry:

**Fixed stipend** pays a flat amount for each on-call period regardless of incident volume. Typical ranges: $100--$300 per weekend shift, $500--$1,200 per month, $200--$500 per week. This model is simple to administer and provides predictable cost. It works best when incident volume is relatively stable and low.

**Hourly standby rate** pays a fraction of the engineer's regular hourly rate for every hour of on-call availability, even if no incidents occur. Rates range from 25% to 66% of base hourly rate. Google uses this model with a tiered structure: Tier-1 SREs (5-minute response requirement) receive 66% of base hourly rate; Tier-2 (30-minute response) receive 33%. This approach explicitly acknowledges that readiness itself has value.

**Per-incident payment** compensates only when the engineer is actively responding. Rates are typically higher than standard hourly (1.5x--2x) to offset the disruption. This model requires clear incident definitions to prevent gaming or disputes. It works well when incidents are rare but severe.

**Time-and-a-half / overtime** applies standard overtime rules when on-call response extends into off-hours. Particularly relevant for FLSA-covered (non-exempt) employees in the US.

**Hybrid models** combine approaches: a base stipend for availability plus hourly or per-incident pay for active response, plus compensatory time off after severe incidents. This is the direction the industry is moving. AWS provides half-day PTO for every Saturday or night-time page in addition to hourly compensation.

### Industry Benchmarks

Compensation varies significantly by company size and market:

| Segment | Weekly On-Call Pay | Notes |
|---|---|---|
| Large tech (10,000+ employees) | $500--$1,000 | Plus 25--66% hourly base rate |
| US SaaS (500--5,000) | $350--$600 | |
| Financial services | $400--$800 | Plus incident bonuses |
| European mid-market | EUR 800--1,050 | Higher regulatory floor |
| Growth-stage startups | $200--$400 | Becoming standard |
| Early-stage startups | Often nothing | Equity-only or informal comp |

Major tech company specifics:
- **Google:** 33--66% of base hourly rate per on-call hour, tiered by response time requirement
- **Amazon/AWS:** 25% of base pay per on-call hour, plus compensatory time off
- **Microsoft:** $500--$800 per weekly shift
- **Meta:** $600--$1,000 per week, plus separate incident response pay

Geographic premiums: San Francisco, New York, and Boston command 15--30% above national averages.

### The Unpaid On-Call Problem

Many organizations --- particularly startups and mid-market companies --- expect engineers to be on-call without additional compensation, arguing that it is "part of the job" covered by base salary. This creates legal, cultural, and retention risks.

**Legal risk (US):** Under the Fair Labor Standards Act, on-call time is compensable when the restrictions on the employee's activities prevent them from using the time for their own purposes. If an engineer must remain within cellular range, respond within 15 minutes, and stay sober, that is not free time. For non-exempt employees, this creates clear FLSA liability. For exempt employees (most software engineers), the legal exposure is lower, but the cultural damage is identical.

**Legal risk (Europe):** The EU Working Time Directive caps working time at 48 hours per week and mandates 11 hours of uninterrupted rest in every 24-hour period. The Court of Justice of the European Union (CJEU) has ruled that on-call time spent at the workplace constitutes working time. On-call time spent at home is more nuanced and varies by member state, but the trend is toward broader worker protections. Commonwealth countries (Canada, Australia) maintain more worker-friendly interpretations than the US.

**Cultural risk:** Unpaid on-call communicates that the organization takes reliability seriously only when it is free. Engineers notice. The best ones leave. The ones who stay become resentful. The 2025 Runframe report found that teams cite unsustainable on-call schedules as a primary reason for losing senior SREs.

---

## 3. Alert Fatigue

Alert fatigue is what happens when monitoring succeeds technically and fails operationally. The systems are instrumented, the thresholds are set, the pages fire --- and nobody responds, because the signal has been buried in noise for so long that the pager has become background radiation.

### The Scale of the Problem

The numbers are stark. According to the 2025 incident.io analysis: 67% of alerts are ignored daily. 85% of alerts generated are false positives. 74% of teams experience alert overload that reduces response effectiveness. Teams receive over 2,000 alerts weekly, with only 3% requiring immediate action.

The 2025 Runframe synthesis found that 73% of organizations experienced outages directly linked to ignored or suppressed alerts. This is not a tooling problem. It is a signal-to-noise problem.

### Alert Noise Metrics

Three metrics define alert health:

**Pages per shift** measures raw volume. Google's SRE book recommends a maximum of 2 incidents per 12-hour shift, with the expected median being zero. If your team consistently sees 8--10 pages per shift, you do not have an on-call problem --- you have an alerting problem. The on-call engineer should spend the majority of each shift not responding to pages.

**False positive rate** measures precision. Industry benchmarks by severity level: Critical alerts should have fewer than 25% false positives. High-severity alerts should stay below 50%. Medium below 75%. If your critical alerts fire falsely more than one-quarter of the time, engineers will stop trusting them.

**Actionable alert rate** measures utility. A healthy system achieves 30--50% actionable alerts (meaning the alert requires human investigation or intervention). Below 10% actionable indicates severe noise. The target signal-to-noise KPI is above 30% actionable alerts.

### Alert Hygiene Practices

**Deduplication** collapses identical alerts into a single notification. If the same host reports the same threshold violation every 60 seconds for 20 minutes, the on-call engineer should receive one page, not twenty.

**Correlation** groups related alerts into a single incident. If a database failover triggers downstream alerts from 15 application servers, those are symptoms of one problem, not fifteen. Alert correlation engines provide consolidated notifications with all related symptoms, dramatically reducing cognitive overhead during incidents.

**Grouping** collects alerts by service, team, or failure domain. A network partition that affects an entire availability zone should present as one event with multiple affected services, not as separate pages for each service. Grouping preserves the big picture.

**Severity tuning** is continuous work, not a one-time configuration. A three-tier escalation model provides structure: Low-severity (informational, 4-hour SLA, routed to Slack channels), Medium-severity (1-hour SLA, escalates after 30 minutes of no acknowledgment), High-severity (15-minute SLA, immediate pager). Alerts that consistently resolve without human intervention should be downgraded or automated away. Alerts that consistently indicate real problems should be promoted.

### The Alert Tax

Every non-actionable alert costs time. The engineer must context-switch, read the alert, assess whether it is real, investigate enough to confirm it is noise, and then return to whatever they were doing before. The Runframe report estimates that 78% of developers spend 30% or more of their time on manual, repetitive operational tasks, much of which is alert triage.

The goal is simple to state and hard to achieve: **every page should require human action**. If an alert fires and the correct response is "do nothing," the alert should not exist.

---

## 4. Cognitive Load

Operations work is cognitively expensive in ways that are invisible to people who do not do it. The on-call engineer is not idle between pages; they are maintaining a background mental model of system state, carrying context from recent changes, and suppressing the low-grade anxiety of knowing the pager could go off at any moment.

### The Operational Cognitive Load Model

Cognitive load in operations comes from three sources, paralleling the cognitive load theory used in educational psychology:

**Intrinsic load** is the inherent complexity of the systems being operated. A microservices architecture with 200 services has higher intrinsic load than a monolith. This load is irreducible without simplifying the architecture.

**Extraneous load** is the unnecessary complexity added by poor tooling, unclear documentation, inconsistent naming, scattered dashboards, and tribal knowledge. This is the load that operational improvements should target. Every minute an engineer spends figuring out which dashboard to look at, or which runbook applies, or what a cryptically-named alert means, is extraneous load.

**Germane load** is the effort of learning and building mental models. This is productive cognitive work --- understanding why a system behaves the way it does, building intuition for diagnosis. Good operations culture maximizes germane load and minimizes extraneous load.

### The 3 AM Decision-Making Problem

Sleep deprivation does not merely make people tired; it fundamentally impairs specific cognitive functions that are critical during incident response. Research published in Neuropsychology Review and the PMC archives demonstrates that:

- Sleep deprivation impairs **feedback-based decision making** --- the ability to update decisions based on new information. During an incident, conditions change rapidly. A sleep-deprived engineer is more likely to fixate on an initial hypothesis even as evidence contradicts it.
- Sleep deprivation increases **rigid thinking and perseveration errors**. The engineer repeats the same diagnostic steps even when they have already been ruled out.
- Sleep deprivation impairs **cognitive flexibility** --- the ability to switch between tasks or mental frameworks. Incident response frequently requires pivoting from one hypothesis to another.
- Risk assessment degrades: sleep-deprived individuals make more risky choices and show more variable performance.

This is not a character flaw or a lack of dedication. It is neuroscience. An engineer woken at 3 AM is operating with measurably impaired cognition, and the systems and processes around them should account for that reality rather than pretend it does not exist.

### Dashboard Design for Reduced Cognitive Load

Dashboards are the primary interface between the on-call engineer and the system. Poor dashboard design amplifies cognitive load during the moments when it is most dangerous.

Principles for cognitive-load-aware dashboards: present the most important information first (service health, error rates, latency) without scrolling. Use consistent color coding across all dashboards (red/yellow/green should mean the same thing everywhere). Group related metrics spatially. Eliminate decorative elements and non-actionable information. Provide drill-down paths from summary to detail rather than presenting everything at once. Show context: what changed recently? Is there an active deployment? Are there known issues?

### Runbooks as Cognitive Offloading

A well-written runbook is not a crutch; it is a cognitive prosthesis. It externalizes the decision-making process so that a sleep-deprived engineer at 3 AM does not have to reconstruct diagnostic logic from first principles.

Effective runbooks contain: the symptom that triggered the investigation, the most common causes ranked by likelihood, specific diagnostic steps (exact commands, not vague instructions), decision points with clear criteria ("if metric X is above threshold Y, proceed to step 4; otherwise, escalate"), escalation paths with contact information, and known false positives with their resolution.

The value is highest precisely when cognitive capacity is lowest --- during overnight pages, during high-stress multi-system outages, and during an engineer's first weeks on a new rotation.

---

## 5. Handoff Protocols

Every shift boundary is a potential information cliff. What the outgoing engineer knows --- the context of ongoing incidents, the state of recent changes, the things that looked worrying but have not yet triggered alerts --- must transfer to the incoming engineer, or it is lost.

### The Handoff Document

A structured handoff template should cover:

- **Active incidents:** Current status, what has been tried, who else is involved, customer impact
- **Ongoing work:** Deployments in progress, maintenance windows, config changes pending
- **Watch items:** Metrics that looked unusual but have not yet triggered, systems under elevated monitoring
- **Upcoming changes:** Scheduled deployments, maintenance windows, certificate expirations in the next shift
- **Decisions made:** Why certain alerts were suppressed, why a rollback was deferred, what tradeoffs were accepted

The value lies in consistency. A team that completes structured handoffs at every shift boundary creates compounding returns: context accumulates, decision history grows, and onboarding time for new team members shrinks. Organizations that implement standardized handoff documentation report up to 65% fewer communication-related errors during transitions.

### Synchronous vs. Asynchronous Handoffs

**Synchronous handoffs** (live meeting or call) provide the richest context transfer. The incoming engineer can ask clarifying questions while the outgoing engineer still has fresh memory. The downside: scheduling overlap windows is expensive, especially across time zones.

**Asynchronous handoffs** (written document in a shared channel) scale better and leave a searchable record. The downside: the incoming engineer cannot ask follow-up questions, and written handoffs tend to understate nuance. An engineer might write "database latency is elevated" without conveying the gut feeling that "this looks like it might be the precursor to the problem we had last month."

**The hybrid approach** works best: a written handoff document completed 15 minutes before shift end, followed by a 10-minute synchronous overlap window where the incoming engineer reads the document and asks questions. This gives structure to the synchronous time and ensures a written record survives the conversation.

### Context Loss at Boundaries

Research on cybersecurity incident response shift handovers (arXiv:2601.07788, January 2025) confirms what practitioners know intuitively: shift transitions are operational risk points. Context loss extends response times --- what could be a five-minute fix becomes a thirty-minute investigation when the incoming engineer does not know that a recent deployment broke a specific service.

Multi-day incidents are particularly vulnerable. As an incident spans three or four shift changes, the accumulated context of earlier shifts degrades. Each handoff preserves most of the information but loses some nuance, like a game of telephone. The countermeasure is incident-specific documentation (an incident timeline or war-room document) that persists independently of shift handoffs.

### On-Call Review Meetings

A weekly on-call review meeting (15--30 minutes) serves as the feedback loop for the rotation itself. The outgoing on-call engineer presents: how many pages they received, which were actionable, which were noise, what was painful, what needs fixing. This meeting is where alert tuning decisions are made, runbook gaps are identified, and rotation problems are surfaced.

Without this meeting, problems accumulate silently. The engineer who had a terrible week says nothing because they do not want to complain, and the next person inherits the same problems.

---

## 6. Operational Reviews

Operational reviews are the organizational learning mechanism that converts incident data into systemic improvement. Without them, organizations respond to individual incidents but never address the patterns that produce them.

### Weekly Ops Review

A lightweight, structured 30-minute session covering: new bugs from the past week, security issues identified, incidents from the past week (severity, duration, customer impact, root cause status), SLO status (error rate, remaining monthly budget, response times), and action items from previous reviews.

The weekly cadence is critical. Monthly reviews miss trends. Daily reviews become routine and lose attention. Weekly is the frequency at which patterns emerge from noise.

### SLO Review Cadence

Error budget status should be part of every weekly engineering meeting. Monthly error budget reviews examine what consumed the budget and what will change going forward. Quarterly SLO reviews ask whether the objectives themselves are still correct --- whether the targets match customer expectations and business requirements.

The error budget is the mechanism that connects operational culture to product development. When the error budget is nearly exhausted, the organization slows feature development and invests in reliability. This is not a punishment; it is the designed-in feedback loop that prevents reliability debt from compounding.

### Incident Trend Analysis

Individual incidents are data points. Trends are information. The weekly review should track: incident frequency by service and severity over time, repeat incidents (same root cause recurring), time-to-detect and time-to-resolve trends, and the ratio of customer-reported to internally-detected incidents.

### Toil Tracking

Google's target is that SREs spend no more than 50% of their time on toil (manual, repetitive, automatable operational work). The 2025 Runframe synthesis found that toil has risen to 30% industry-wide (up from 25%), the first increase in five years, translating to approximately $9.4 million per year wasted per 250 engineers. Tracking toil explicitly --- in the same review meeting, with the same rigor as incident metrics --- is the prerequisite for reducing it.

### Capacity Review

Production systems do not suddenly run out of capacity; they gradually approach it while everyone is too busy fighting incidents to notice. The operational review should include a standing item on capacity utilization trends for critical resources (compute, storage, network, database connections) with a 90-day projection.

### The Review as Learning Mechanism

The operational review works only when it is a learning forum, not a blame forum. The moment someone is reprimanded for an incident in an ops review, the information flow stops. Engineers will minimize incidents in their reports, avoid surfacing uncomfortable truths, and the review degrades into theater. This connects directly to the next section.

---

## 7. Blameless Culture

Building a blameless culture is the hardest problem in operational excellence. It is harder than distributed consensus, harder than auto-scaling, harder than zero-downtime deployments. It requires sustained organizational will in direct opposition to deeply human instincts.

### Why Blame Destroys Learning

When something goes wrong, the human brain seeks a cause. The **fundamental attribution error** --- one of the most robust findings in social psychology --- leads us to attribute others' failures to their character ("they were careless") rather than to the situation ("the interface was confusing, the runbook was wrong, and they had been awake for 18 hours"). Blame feels satisfying. It provides closure. And it prevents the organization from understanding what actually happened.

Sidney Dekker's "Just Culture" framework (first edition 2007, third edition with new material on restorative justice) articulates this clearly: the "old view" of human error treats people as the problem --- find the bad apple, remove them, and the system is safe. The "new view" treats human error as a symptom of systemic issues --- the error reveals where the system's defenses are inadequate.

When an organization punishes the person who made the mistake, three things happen: (1) that person stops reporting near-misses and close calls, (2) everyone who witnesses the punishment stops reporting their own near-misses, and (3) the systemic conditions that produced the error remain unchanged, waiting for the next person to encounter them.

### Blameless Postmortem Facilitation

PagerDuty's open-source postmortem documentation provides a practical framework. Key facilitation principles:

**Use "what" and "how" questions, never "why."** "What conditions led to the database failover?" explores circumstances. "Why did you push that change without testing?" forces justification and assigns blame. The difference is not semantic; it changes the entire trajectory of the conversation.

**Abstract to an unspecific responder.** Instead of "Alice deployed the bad config," frame it as "the on-call engineer deployed the config change" --- because the question is not what Alice did wrong, but what system conditions allowed a bad config to reach production.

**Counter cognitive biases actively.** Hindsight bias makes the failure look obvious in retrospect. Analyze timelines forward from before the incident, not backward from the failure. Confirmation bias leads the group to fixate on the first hypothesis. Appoint a devil's advocate to surface alternative explanations.

J. Paul Reed argues that true "blamelessness" may be impossible due to human neurobiology --- our brains are wired to assign responsibility. His recommendation is a **blame-aware** culture: one that recognizes the impulse to blame when it arises and consciously redirects toward systemic inquiry. This is a more honest and achievable goal than pretending blame does not exist.

### The Westrum Model

Sociologist Ron Westrum's organizational culture typology, validated by the DORA research program, identifies three culture types:

**Pathological (power-oriented):** Information is hoarded, messengers are shot, failure leads to scapegoating, novelty is crushed.

**Bureaucratic (rule-oriented):** Information is channeled through formal processes, messengers are tolerated, failure leads to justice (rule enforcement), novelty creates problems.

**Generative (performance-oriented):** Information is actively sought, messengers are trained, failure leads to inquiry, novelty is implemented.

DORA's research (Accelerate, Forsgren et al.) found that generative culture is among the strongest predictors of software delivery performance. Teams reporting high psychological safety consistently outperform across all four DORA metrics: deployment frequency, lead time for changes, change failure rate, and time to restore service.

### Measuring Culture

Culture is measured through survey instruments, not vibes. The Westrum survey asks teams to rate agreement with statements including: "On my team, information is actively sought." "Messengers are not punished when they deliver news of failures." "Responsibilities are shared." "Cross-functional collaboration is encouraged and rewarded." "Failures are treated primarily as opportunities to improve the system." "New ideas are welcomed."

These surveys should be administered regularly (quarterly or semi-annually), tracked over time, and correlated with operational metrics. A declining Westrum score is an early warning of cultural erosion that will eventually manifest as operational degradation.

---

## 8. Burnout Prevention

Burnout in operations is not a personal failing. It is a predictable consequence of systemic conditions, and it is reaching crisis levels.

### The Numbers

The 2025 State of Incident Management synthesis (Runframe) found that 88% of developers work more than 40 hours per week. The 2024 Catchpoint SRE Report found that 65% of engineers report experiencing burnout, with on-call stress as a primary contributing factor. The 2025 SANS SOC Survey found that 70% of security operations analysts with five years or less of experience leave within three years. These are not isolated findings; they are convergent evidence of a systemic problem.

### Burnout Risk Factors in Operations

Operations has risk factors that other engineering disciplines do not:

**Pager anxiety** is the chronic low-grade stress of knowing you could be interrupted at any moment. Even when the pager does not fire, the awareness that it could degrades relaxation, sleep quality, and the ability to disconnect from work. This is not imagined; it is a documented physiological stress response.

**Sleep disruption** is the most insidious risk factor. A single overnight page does not just cost the 30 minutes of response time; it disrupts the entire sleep cycle, with cognitive effects persisting for 24--48 hours. Repeated overnight pages over a week-long rotation accumulate a sleep debt that rest on the weekend cannot fully repay.

**Context switching** between planned work and incident response imposes a cognitive tax. Studies consistently find that returning to a complex task after an interruption takes 15--25 minutes. An engineer who receives four pages during a workday has lost not just the response time but an additional 1--2 hours of recovery time.

**Asymmetric visibility** means that the effort of keeping systems running is invisible when it succeeds. Nobody notices the 3 AM page that prevented a customer-facing outage. The on-call engineer's work disappears into the baseline, while product engineers ship visible features. This asymmetry erodes morale over time.

**Toil accumulation** means that operational work tends to grow unless actively fought. The 2025 data showing toil rising to 30% (the first increase in five years, despite widespread AI adoption) demonstrates that this is not a problem that solves itself.

### Prevention Strategies

**Rotation limits:** No engineer should be primary on-call more than one week per month. Google's 25% cap on on-call time is the gold standard. If the team is too small to sustain this, the team is too small for the responsibility it carries.

**Compensatory time off:** After a severe incident or a particularly disruptive on-call rotation (multiple overnight pages), the engineer should receive explicit time off --- not as a favor, but as a scheduled recovery period. AWS's half-day PTO per night-time page is a concrete example.

**Quiet hours and pager thresholds:** Some teams implement "quiet hours" policies where only critical alerts page during overnight hours. Informational and low-severity alerts are batched for morning review. This trades slightly slower response for low-severity issues against dramatically better sleep quality.

**Escalation policies with teeth:** An escalation policy that pages the engineering manager after the third overnight page in a rotation creates organizational incentive to fix the underlying problems. The manager feels the pain, and the manager has the authority to prioritize fixes.

**Toil budgets:** Allocate a fixed percentage of sprint capacity to toil reduction. Google targets a maximum of 50% toil, meaning at least 50% of SRE time goes to engineering work. When toil exceeds the budget, feature work pauses until toil is reduced.

### Manager Responsibilities

The engineering manager's role in burnout prevention is not optional and not delegatable. Managers must: monitor on-call metrics (pages per shift, overnight disruptions, incident volume trends) for their team, conduct regular one-on-ones that explicitly ask about on-call burden, intervene when rotation data shows unsustainable patterns (not when an engineer finally complains --- that is too late), advocate for headcount when the team is too small for its on-call obligations, and model healthy behavior by not glorifying suffering ("I was on-call for three weeks straight once" is not a badge of honor; it is a process failure).

### When to Leave On-Call

This is rarely discussed in operational literature, but it matters: sometimes the right answer is to stop being on-call. If an engineer has been on-call for years, has tried all the prevention strategies, and is still experiencing chronic burnout symptoms (persistent sleep problems, anxiety about the pager during off-rotation weeks, dread about upcoming rotations, declining engagement with work), moving to a role without on-call responsibilities is not a retreat. It is a rational response to a real constraint. On-call suitability varies across people and across life stages, and pretending otherwise serves nobody.

---

## 9. Team Topologies for Operations

How teams are organized determines how information flows, how incentives align, and ultimately how reliable the systems are. The Team Topologies framework (Skelton and Pais, 2019) provides a vocabulary for thinking about this, and the nine SRE team topologies identified in the Stack Overflow analysis provide specifics for operations.

### The Four Fundamental Team Types

**Stream-aligned teams** are organized around a single valuable stream of work (a product, a service, a user journey). They are empowered to build and deliver customer value with minimal hand-offs. In an operations context, stream-aligned teams own the full lifecycle of their services, including production operations.

**Platform teams** provide internal services that reduce cognitive load for stream-aligned teams. In operations, the platform team might provide the monitoring stack, the deployment pipeline, the incident management tooling, and the on-call scheduling infrastructure. They do not operate individual services; they provide the tools and platforms that enable other teams to operate their own.

**Enabling teams** are specialists who help other teams adopt new capabilities. An SRE team functioning as an enabling team helps product teams learn reliability practices, adopt the right tools, and improve their operational maturity. They consult, coach, and transfer knowledge rather than taking over operations.

**Complicated-subsystem teams** own components that require deep specialist knowledge (database internals, networking infrastructure, cryptographic systems). They exist because the cognitive load of certain subsystems exceeds what a generalist stream-aligned team can sustain.

### SRE Team Models

The Stack Overflow analysis identifies a core decision framework based on two questions: "who builds it?" and "who runs it?" This produces three fundamental models:

**"You build it, you run it"** (embedded/no-SRE model): Development teams carry the pager for their own services. Incentive alignment is maximized --- developers who are woken at 3 AM by their own code have strong motivation to write reliable software. This is the model Werner Vogels described at Amazon in 2006 and that Netflix famously practices. The limit: it works when developers have the operational skills and tooling support to run production effectively. Without platform support, every team reinvents monitoring, alerting, and incident response independently.

**"You build it, you and SRE run it"** (shared model): SREs work alongside development teams, sharing on-call responsibilities and operational expertise. Google's SRE model falls here. The SRE team provides expertise and carries some of the pager load, while developers retain production ownership. Google's "pager return" mechanism (if a service is too unreliable, the SRE team returns the pager to the development team) maintains accountability.

**"You build it, SRE runs it"** (dedicated ops model): A separate operations team takes full responsibility for running production. This is the traditional model and carries the highest risk of the "throw it over the wall" anti-pattern --- developers build without considering operability, and the ops team scrambles to keep things running. The incentive misalignment is structural: the people who create the problems do not feel the consequences.

### DevOps Team Anti-Patterns

**The "DevOps team"** as a separate organizational unit is itself an anti-pattern. DevOps is a culture and set of practices, not a team name. Creating a "DevOps team" often recreates the same silo that DevOps was meant to eliminate, just with a trendier label.

**The "SRE team as gatekeeper"** anti-pattern emerges when the SRE team controls deployments rather than enabling them. Instead of building platforms and practices that make safe deployment easy, the team becomes a bottleneck that reviews and approves every change.

**The "invisible ops team"** anti-pattern occurs when the operations team is organizationally subordinate to development, with no voice in architectural decisions, no ability to push back on unreliable services, and no path for operational concerns to reach leadership. The ops team absorbs all the pain of poor decisions made elsewhere.

**Over-rotation on "you build it, you run it"** is the opposite anti-pattern. Taken to its extreme, every team must build its own monitoring, its own alerting, its own deployment pipeline. This creates massive duplication of effort and means that operational excellence depends on each team independently discovering best practices. The platform team exists precisely to prevent this.

### The Right Model

There is no universally correct topology. The right choice depends on organizational size, engineering maturity, and system complexity. The key insight from Team Topologies is that team structure should evolve: a startup might begin with "you build it, you run it" (because there is no one else to run it), add a platform team as it scales, introduce enabling SREs when operational complexity exceeds team capacity, and potentially create dedicated SRE teams for the most critical services. The structure serves the work, not the other way around.

---

## Key Takeaways

1. **On-call is a system design problem**, not a staffing problem. If the rotation is unsustainable, the answer is not "hire more people" --- it is "fix the systems, alerts, and processes that make the rotation unsustainable."

2. **Compensation communicates values.** Uncompensated on-call tells engineers their time outside work hours has no value. The legal and retention risks are real.

3. **Every page should be actionable.** If it is not, it should not exist. The 3% actionable rate reported in industry surveys is an organizational failure, not a tooling limitation.

4. **Cognitive load is the hidden tax** on every operational decision. Runbooks, good dashboards, and clear processes are not overhead --- they are the infrastructure that makes 3 AM decisions possible.

5. **Handoffs are information transfer problems.** Treat them with the same engineering rigor as data replication: structured formats, verification protocols, and explicit acknowledgment.

6. **Operational reviews are the learning mechanism.** Without them, organizations respond to incidents but never address patterns.

7. **Blame is the enemy of learning.** A blameless (or blame-aware) culture is not soft; it is the precondition for the honest reporting that makes systemic improvement possible.

8. **Burnout is predictable and preventable** --- but only if the organization treats it as a systemic risk rather than an individual weakness.

9. **Team topology determines information flow.** The right structure evolves with the organization. Anti-patterns emerge when structure ossifies.

---

## References and Further Reading

- Beyer, B., Jones, C., Petoff, J., Murphy, N.R. (2016). *Site Reliability Engineering: How Google Runs Production Systems.* O'Reilly. Chapters 11 (Being On-Call), 15 (Postmortem Culture), 29 (Dealing with Interrupts).
- Dekker, S. (2007, 3rd ed. 2024). *Just Culture: Balancing Safety and Accountability.* CRC Press.
- Forsgren, N., Humble, J., Kim, G. (2018). *Accelerate: The Science of Lean Software and DevOps.* IT Revolution.
- Skelton, M., Pais, M. (2019). *Team Topologies: Organizing Business and Technology Teams for Fast Flow.* IT Revolution.
- DORA. "Generative Organizational Culture." dora.dev/capabilities/generative-organizational-culture/
- Google. "Being On-Call." sre.google/sre-book/being-on-call/
- Google. "Eliminating Toil." sre.google/workbook/eliminating-toil/
- PagerDuty. "Blameless Postmortems." postmortems.pagerduty.com/culture/blameless/
- Etsy Engineering. "Blameless PostMortems and a Just Culture." etsy.com/codeascraft/blameless-postmortems
- Catchpoint. *The SRE Report 2025, 7th Edition.* catchpoint.com
- Runframe. "State of Incident Management 2025." runframe.io/blog/state-of-incident-management-2025
- incident.io. "Alert Fatigue Solutions for DevOps Teams in 2025." incident.io/blog/alert-fatigue-solutions-for-dev-ops-teams-in-2025-what-works
- Stack Overflow Blog. "Who Builds It and Who Runs It? SRE Team Topologies." stackoverflow.blog/2023/03/20/who-builds-it-and-who-runs-it-sre-team-topologies/

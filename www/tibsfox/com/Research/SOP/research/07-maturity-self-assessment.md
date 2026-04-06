# Maturity Self-Assessment Tool

**Mission:** Engineering the Process — Standard Operating Procedures  
**Module:** TOOL (Wave 3 deliverable)  
**Track:** 3 (Publication)  
**Role:** EXEC_A  
**Date:** 2026-04-05  
**Status:** COMPLETE  
**Cross-reference:** M2 Section 1 (CMMI levels); M5 Section 8 (GSD ecosystem mapping)

---

## 1. Introduction

### What This Tool Measures

This tool places your engineering team on the CMMI maturity ladder using observable, verifiable indicators. CMMI (Capability Maturity Model Integration) defines five organizational maturity levels that describe how systematically and predictably an organization produces software and engineering outcomes. The levels are not grades — they are diagnostic positions. Knowing where you are is the prerequisite for moving forward.

The tool does not measure the quality of your product. A Level 1 organization can ship a great product if the people are talented and lucky. What CMMI measures is **institutional predictability**: whether the organization's outcomes depend on individuals and circumstances, or on systems and processes that persist across personnel and project changes.

This distinction matters for scaling, hiring, auditing, and partnership. A team that cannot articulate its process cannot train new members efficiently, cannot pass a DoD or enterprise procurement audit, and cannot improve systematically when something goes wrong.

### How to Use This Tool

**Who participates:** The session works best with 3-7 people who collectively have visibility into how work actually gets done — not how it is supposed to get done. Ideal participants: an engineering lead, a project manager or Scrum Master, 1-2 senior individual contributors, and optionally a QA or DevOps person. Avoid including only managers; they often have an optimistic view of process compliance.

**Time required:** 45 minutes for a team of 4-6. Budget 30 minutes for the questionnaire (Section 2) and 15 minutes for the gap analysis (Section 4). If debate about a single question runs longer than 2 minutes, mark it as a discussion item and move on — the debates are often as informative as the answers.

**What you need:** A printed or shared copy of this document. A way to record yes/no answers per level. Paper is fine.

**Ground rules for the session:**
1. Answer based on what you actually observe, not what the policy document says.
2. "We tried it once" is not a yes. The indicator must be consistently true across most projects and most teams.
3. Disagreement between participants is signal — note it. It may mean the process exists in some teams but not others, which is a Level 2 indicator.

### How to Interpret Results

After completing Section 2, apply the scoring rubric in Section 3. The rubric determines your **confirmed level** — the highest level at which you meet the threshold — and your **gap list** at the next level.

Your confirmed level is a starting point for a conversation, not a verdict. Teams that assess honestly at Level 1 and execute a disciplined improvement roadmap routinely reach Level 2 in 5-6 months. The SEI's longitudinal data shows organizations spend a median of approximately 5 months transitioning from Level 1 to Level 2, 21 months from Level 2 to Level 3, and 26 months from Level 3 to Level 4. These timelines assume committed organizational sponsorship — without it, transitions stall indefinitely.

---

## 2. Assessment Questionnaire

For each indicator, circle or mark **Y (Yes)** or **N (No)**.

A "yes" requires the behavior to be consistently observable across the organization — not just in the best project or the best team.

---

### Level 1 — Initial

At Level 1, success depends primarily on heroics and talent rather than process. The indicators below describe Level 1 organizational signatures. A "yes" to most of these means you are at Level 1.

| # | Indicator | Y / N |
|---|-----------|-------|
| 1.1 | Project outcomes depend significantly on which individual is assigned. If the lead developer is replaced mid-project, the team would expect a noticeable drop in quality or schedule. | |
| 1.2 | There is no standard way to estimate project cost or schedule. Estimates are made by intuition, gut feel, or by working backwards from a desired deadline. | |
| 1.3 | New team members are onboarded primarily by shadowing a senior person. There is no documented onboarding procedure that a new hire could follow independently. | |
| 1.4 | When a key person is unavailable (sick, on leave, departed), their work experiences significant delays or requires extraordinary effort from others to cover. | |
| 1.5 | Post-project retrospectives are not conducted, or if they are, the findings are not written down and acted on in subsequent projects. | |
| 1.6 | The same failure modes (missed deadlines, defects in the same components, unclear requirements) recur across multiple projects without structural resolution. | |
| 1.7 | There is no standard place where build instructions, deployment procedures, or environment setup instructions live. Each project or person has their own approach. | |

**Level 1 score:** \_\_\_ / 7 yes answers

---

### Level 2 — Managed

At Level 2, individual projects are planned and tracked, but practices vary between teams. A "yes" to most of these means you have reached Level 2.

| # | Indicator | Y / N |
|---|-----------|-------|
| 2.1 | Project plans exist with defined milestones, schedules, and resource assignments. A project manager can answer "what is the status of this project?" accurately within 24 hours without calling a team meeting. | |
| 2.2 | Requirements are documented before development begins. There is a written, agreed-upon scope document that the team refers to during development — not just an email chain. | |
| 2.3 | Work items (features, bugs, tasks) are tracked in a system (Jira, GitHub Issues, Linear, etc.). The backlog is not primarily someone's mental model. | |
| 2.4 | Version control (git or equivalent) is used consistently for source code across all active projects. Commits exist; the main branch is not a shared folder. | |
| 2.5 | When a project deviates from its plan (scope change, slipped milestone), the deviation is explicitly documented. Decisions to change scope are made deliberately, not discovered after the fact. | |
| 2.6 | Defects are tracked from discovery to resolution. There is a record of what bugs were found, who fixed them, and when they were closed — not just memory. | |
| 2.7 | Customer or stakeholder commitments (deadlines, feature lists) are made based on a plan, even if the plan is still imprecise. Commitments are not made arbitrarily. | |

**Level 2 score:** \_\_\_ / 7 yes answers

---

### Level 3 — Defined

At Level 3, a consistent organizational standard process exists and is applied across all teams. A "yes" to most of these means you have reached Level 3.

| # | Indicator | Y / N |
|---|-----------|-------|
| 3.1 | Organizational standard processes are documented and accessible to all teams. There is a single source of truth (handbook, wiki, intranet) for "how we do things here." | |
| 3.2 | When a new project starts, the team begins from the organizational standard process and explicitly tailors it — they do not design a new process from scratch each time. | |
| 3.3 | Process assets (templates, checklists, runbooks, guidelines) are maintained in a shared library. Engineers from any team can find and use the template for a new project kickoff, a code review, or a deployment. | |
| 3.4 | Training programs exist for the organizational standard processes. New engineers receive structured process training, not just product training. | |
| 3.5 | Process compliance is periodically verified — through audits, peer reviews, or process reviews. Someone checks whether the defined process is being followed, and findings feed back into the process. | |
| 3.6 | Lessons learned from one project are formally captured and explicitly consulted at the start of subsequent projects. The organization learns as a system, not just as individuals. | |
| 3.7 | When an engineer joins from a different team within the same organization, they recognize the workflow: the sprint ceremonies, PR process, deployment procedure, and escalation path are familiar even though the domain is new. | |

**Level 3 score:** \_\_\_ / 7 yes answers

---

### Level 4 — Quantitatively Managed

At Level 4, process performance is understood and managed using quantitative data. A "yes" to most of these means you have reached Level 4.

| # | Indicator | Y / N |
|---|-----------|-------|
| 4.1 | Process performance is measured with quantitative data. The organization tracks at least two of: defect density, cycle time, lead time, deployment frequency, mean time to recovery, test coverage, or review turnaround time. | |
| 4.2 | Historical performance baselines exist. When asked "what is our typical defect density at release?" or "how long does a medium feature typically take?", the team can answer from data, not from memory or opinion. | |
| 4.3 | Quality and performance objectives are defined quantitatively at the start of each project (e.g., "fewer than 2 critical defects per release," "P50 cycle time under 3 days"). | |
| 4.4 | When process performance deviates from historical norms, the root cause is investigated. Anomalies in metrics trigger analysis, not just concern. | |
| 4.5 | Statistical or analytical techniques are used to understand process variation — at minimum, the team distinguishes between random variation and systematic problems. | |
| 4.6 | Predictions of project outcomes (delivery date, defect count at release) are data-driven. The team uses historical velocity, defect rates, or similar data to make forecasts, not only intuition. | |

**Level 4 score:** \_\_\_ / 6 yes answers

---

### Level 5 — Optimizing

At Level 5, continuous improvement is systematic and quantitatively driven. A "yes" to most of these means you have reached Level 5.

| # | Indicator | Y / N |
|---|-----------|-------|
| 5.1 | Process improvements are proposed based on quantitative analysis. The team does not adopt a new practice because it is popular or because a team member read a blog post — adoption decisions are grounded in data about current performance gaps. | |
| 5.2 | Innovative ideas and technologies are systematically evaluated for potential process improvement. There is a formal or semi-formal mechanism for trialing, evaluating, and deciding whether to adopt or discard new approaches. | |
| 5.3 | Improvement deployment is managed as a project with defined goals, measurable outcomes, and a review at completion. "We are trying to improve cycle time by 20% by Q3" — not just "we are improving." | |
| 5.4 | Root cause analysis of defects and process failures feeds back into process changes. The organization traces defects to their causes and modifies the process to remove the root cause, not just to fix the instance. | |
| 5.5 | The organization measures the effectiveness of its improvement activities. After completing an improvement initiative, the team verifies whether the metric it was targeting actually improved. | |

**Level 5 score:** \_\_\_ / 5 yes answers

---

## 3. Scoring Rubric

### Per-Level Threshold

| Level | Total Indicators | Threshold to Confirm Level |
|-------|-----------------|---------------------------|
| 1 | 7 | 5 or more yes answers |
| 2 | 7 | 5 or more yes answers |
| 3 | 7 | 5 or more yes answers |
| 4 | 6 | 4 or more yes answers |
| 5 | 5 | 4 or more yes answers |

The threshold is approximately 70%. This matches SEI guidance that an organization need not have perfect compliance to be assessed at a level — systematic, consistent application across most projects and most teams is the standard. One project that always does code review and one that never does represents Level 2 evidence in the best team and Level 1 evidence at the organization level.

### Determining Your Confirmed Level

1. Start at Level 2. Did you meet the Level 2 threshold? If no, your confirmed level is **1 — Initial**.
2. If Level 2 is met, check Level 3. If Level 3 is not met, your confirmed level is **2 — Managed**.
3. Continue upward. Your confirmed level is the **highest consecutive level at which you met the threshold**.

A gap at Level 3 that prevents meeting the threshold means you are confirmed at Level 2 — even if you scored well on Level 4 indicators. CMMI levels are cumulative: the capabilities of each level are built on the foundation of the level below.

### Interpreting Your Level 1 Score

Level 1 indicators describe organizational dysfunctions. A high yes count on Level 1 does not confirm Level 1 — it quantifies the severity of the baseline. All teams score some yes answers on Level 1 indicators occasionally; a score of 5 or more consistent yes answers is a meaningful signal.

### What to Do With the Gap List

Every "no" answer at the next level above your confirmed level is a gap. Transfer these to the Gap Analysis Template in Section 4. Each gap becomes a work item. The improvement roadmap in Section 5 provides the sequencing and typical timelines.

---

## 4. Gap Analysis Template

Complete this table after scoring. Focus on the gaps at your **next target level** — the level immediately above your confirmed level. Attempting to close Level 4 gaps before Level 3 is confirmed is a common mistake; the lower-level infrastructure will not support it.

| Indicator | Current State (what you observed) | Target State (what the indicator requires) | Gap Description | Priority (H/M/L) | Owner | Action |
|-----------|-----------------------------------|--------------------------------------------|-----------------|-------------------|-------|--------|
| 2.2 | Requirements captured in Slack threads and email | Written scope document exists before development starts | No formal requirements document template or process | H | | Create requirements template; mandate use on all new projects |
| 2.4 | Version control exists but some projects use shared folders for configs and docs | All source code and config in version control | Config and documentation not in VCS | H | | Add non-code assets to repos; establish branch protection |
| 3.1 | Each team has its own handbook section; no unified org standard | Single accessible source of truth for all org processes | No top-level engineering handbook | H | | Designate handbook location; assign ownership |
| _Add rows for each gap_ | | | | | | |

**Priority guidance:**
- **H (High):** Directly blocks level confirmation; no other indicators can substitute for this one
- **M (Medium):** A gap that will affect multiple future indicators; fix before those become blocking
- **L (Low):** A refinement; does not currently block level confirmation but will matter at the next level

---

## 5. Improvement Roadmap

### Level 1 to Level 2: Establish Project Control

**What changes:** Move from individual heroics to repeatable project management. This transition is about creating a minimum viable project discipline — not perfection, but consistency.

**Prerequisites:**
- At least one person with authority to define and enforce process at the project level
- Willingness to invest 1-2 hours per week in process work alongside delivery work

**Key actions:**
1. Define "what constitutes a project" and give every active project a written scope statement (even a one-pager)
2. Establish a single issue tracker and require all teams to use it with consistent statuses
3. Add version control for all code and all configuration; enforce branch protection on main
4. Run a 30-minute retrospective at the end of every milestone, and write down the top 3 action items
5. Begin tracking estimates against actuals — the goal is data collection, not hitting targets

**Expected timeline:** 3-6 months (SEI median: ~5 months)

**Common pitfalls:**
- Defining the process but not checking whether it is followed — compliance requires light enforcement, not just documentation
- Building a complex ticketing system nobody uses; start minimal (any tracker beats a spreadsheet or none)
- Doing retrospectives but discarding the notes — the retrospective document is the artifact that feeds improvement
- Measuring too many things at once; pick two metrics and track them consistently

---

### Level 2 to Level 3: Standardize Across Teams

**What changes:** Move from per-project discipline to organizational consistency. The process that works on the best-run project becomes the baseline for all projects.

**Prerequisites:**
- Level 2 confirmed across most active projects (not just one team)
- Engineering leadership sponsorship to define and enforce an organizational standard
- A designated home for process assets (wiki, handbook, intranet — any persistent, searchable location)

**Key actions:**
1. Audit process variance: document how the five most critical activities (requirements, code review, testing, deployment, change control) are done across all teams; identify best current practice for each
2. Elevate best current practices to organizational standards; write them into an engineering handbook
3. Define process tailoring rules — which elements are mandatory, which are optional, how to document a tailoring decision
4. Build a process asset library: templates, checklists, runbooks. Start with what already exists informally.
5. Create an onboarding program that works for any project in the organization, not just one team

**Expected timeline:** 18-24 months (SEI median: ~21 months from Level 2 confirmation)

**Common pitfalls:**
- Writing the handbook but not updating it — a stale handbook is worse than no handbook because teams learn to ignore it
- Over-standardizing: requiring a 20-page design document for a two-day task alienates teams and drives workarounds
- Failing to distinguish mandatory elements from optional elements — everything being mandatory is the same as nothing being mandatory
- Treating the transition as a documentation project rather than a behavior-change project; the document is not the process, the behavior is

---

### Level 3 to Level 4: Add Quantitative Management

**What changes:** Move from defined processes to measured processes. The organization begins to understand its own performance numerically and uses that understanding to manage projects.

**Prerequisites:**
- Level 3 confirmed: organizational standard processes are in use and audited
- Instrumented workflow tooling: CI/CD pipelines, issue trackers, or observability platforms that can emit metrics
- Analytical capacity: someone on the team or in the organization who can interpret process data and run basic statistical analysis

**Key actions:**
1. Select 3-5 process attributes to measure (recommended starting set: defect density at code review, cycle time from commit to merge, deployment frequency, and mean time to recovery)
2. Instrument the workflow to collect these measurements automatically; manual data collection is fragile and usually abandoned within two months
3. Establish baselines over the first 3 months of measurement — do not set targets before you have a baseline
4. Introduce performance objectives for the next project cycle once baselines exist; make objectives quantitative ("P50 cycle time under 4 days") not directional ("improve cycle time")
5. Review metrics in retrospectives: do the numbers explain the project outcomes? When they do not, investigate why

**Expected timeline:** 24-30 months (SEI median: ~26 months from Level 3 confirmation)

**Common pitfalls:**
- Measuring the wrong things: tracking story points as a performance metric creates incentive distortion; measure process behaviors, not individual output
- Dashboard theater: building a metrics dashboard that nobody acts on — metrics must be connected to decisions
- Confusing common cause variation (random noise in a stable process) with special cause variation (signals that the process has changed); reacting to noise is expensive and demoralizing
- Setting targets before baselines are stable — you cannot improve toward a target if you do not know where you currently are

---

### Level 4 to Level 5: Systematic Continuous Improvement

**What changes:** Move from measuring processes to systematically improving them. At Level 5, the organization treats improvement as a managed activity with goals, methods, and verification.

**Prerequisites:**
- Level 4 confirmed: quantitative baselines established, performance objectives defined, metrics reviewed regularly
- Organizational appetite for improvement as a first-class project type — not something squeezed in after delivery
- Root cause analysis capability: the organization can trace defects and failures to their process origins

**Key actions:**
1. Establish a formal improvement intake process: proposals backed by data, evaluated against objectives, prioritized by projected impact
2. Manage improvement initiatives as projects with owners, timelines, success metrics, and retrospectives
3. Deploy root cause analysis on all significant defects (escaped bugs, customer-reported issues, production incidents); findings must produce process changes, not just individual feedback
4. Build a technology evaluation protocol for new tools, frameworks, and practices — pilot, measure, decide; not adopt-by-enthusiasm or reject-by-inertia
5. Measure improvement effectiveness: after closing an improvement initiative, verify that the target metric moved in the intended direction

**Expected timeline:** 36+ months (Level 5 organizations are rare; SEI data suggests fewer than 5% of assessed organizations reach this level)

**Common pitfalls:**
- Improvement theater: publishing an improvement roadmap without executing it, or executing it without measuring outcomes
- Improvement fatigue: too many simultaneous initiatives dilute focus; one or two at a time with clear goals is more effective than ten with vague ones
- Conflating process improvement with tool adoption — a new CI/CD platform is not an improvement unless it demonstrably moves a performance objective
- Not closing the feedback loop: doing root cause analysis but not changing the process means the same root cause will recur

---

## 6. Connection to the GSD Ecosystem

The gsd-skill-creator ecosystem is a concrete implementation of CMMI principles in the idiom of agentic software development. The table below maps GSD features to their CMMI equivalents. If your team uses GSD, these features are evidence of maturity — use them as indicators when completing the questionnaire.

| GSD Feature | CMMI Level | CMMI Indicator | Mapping |
|-------------|-----------|----------------|---------|
| `git` with branch protection | L2 | Configuration management applied consistently | Enforced version control for all code and config; branches protected on main |
| Issue tracker (GitHub Issues, Linear) | L2 | Work items tracked in a system | Structured backlog; ticket lifecycle from creation to close |
| Wave plans with defined gates | L2-L3 | Project plans with milestones; organizational standard process | Wave decomposition defines scope, sequence, and exit criteria before execution begins |
| SKILL.md files | L3 | Organizational standard processes documented and accessible | Each skill is a bounded SOP: purpose, scope, procedure, quality checks, success criteria |
| Engineering handbook / `.claude/skills/` | L3 | Process asset library in a shared location | Skills auto-load from a canonical location; the library is the standard process |
| Process tailoring (SKILL.md "when NOT to use") | L3 | Teams tailor from the organizational standard rather than inventing from scratch | Every skill defines its scope boundary; teams use skills as starting points, not blank canvases |
| CAPCOM gates (wave boundary approval) | L3-L4 | Process compliance verified; quantitative go/no-go criteria | Named decision points with explicit criteria before proceeding to the next phase |
| Chain scores | L4 | Process performance measured with quantitative data | Release quality scored on defined dimensions; tracked across releases for trend analysis |
| Retrospectives with action items in `.planning/` | L3-L4 | Lessons learned formally captured; performance deviations investigated | Post-release retrospectives feed `.planning/STATE.md`; findings inform the next wave plan |
| Bounded learning rule (20% cap on skill changes per session) | L5 | Improvement deployment managed with measurable outcomes; change-control mechanism | Limits scope of process changes per session; prevents unbounded accumulation of untested modifications |
| `push.default=nothing` staging discipline | L2-L3 | Version-control SOP; change control | Forces deliberate staging of every commit; eliminates accidental pushes as a failure class |
| Test coverage requirements (21,298 tests) | L3-L4 | Quality objectives defined; process performance measured | Minimum test coverage is a quantitative quality gate applied at every merge |
| Source validation (VERIFY role in wave plans) | L4 | Quality objectives verified with data; root cause analysis | Dedicated verification step checks outputs against criteria before wave is closed |

**Reading this table if you are a GSD user:**

If your team is running wave plans with CAPCOM gates, maintaining SKILL.md files, and tracking chain scores, you have strong evidence for Level 3 indicators and partial evidence for Level 4. The gaps most likely to remain are:

- **L3.5 (compliance verification):** Do you periodically audit whether defined processes are being followed — or is compliance assumed?
- **L4.2 (historical baselines):** Chain scores provide data, but are they being reviewed for trends and used to set quantitative objectives for the next release?
- **L4.4 (deviation investigation):** When chain scores drop or a CAPCOM gate fails, is there a root cause analysis, or just a retry?

Closing these gaps requires deliberate attention, not additional tooling. The tooling is largely in place.

---

## Appendix: Quick Reference Card

Use this card during the session to stay on track.

```
MATURITY SELF-ASSESSMENT — QUICK REFERENCE

CONFIRMED LEVEL: highest consecutive level meeting threshold (≥70%)

L1 THRESHOLD: 5/7 indicators consistently true  → STILL AT L1
L2 THRESHOLD: 5/7 indicators consistently true  → CONFIRMED L2
L3 THRESHOLD: 5/7 indicators consistently true  → CONFIRMED L3
L4 THRESHOLD: 4/6 indicators consistently true  → CONFIRMED L4
L5 THRESHOLD: 4/5 indicators consistently true  → CONFIRMED L5

SESSION RULES
1. Answer based on what you observe, not what the policy says
2. "We tried it once" = N
3. Must be true across most projects and most teams
4. Disagreement = note it; resolve after the session

TIME BUDGET (45 minutes)
- 5 min  : Explain ground rules, distribute questionnaire
- 25 min : Work through levels 1-5 (5 min per level)
- 15 min : Tally scores, identify gaps, assign priorities

AFTER THE SESSION
1. Record confirmed level and gap list
2. Fill gap analysis table (Section 4)
3. Select 2-3 highest priority gaps for next quarter
4. Assign owners and set a 90-day review date
```

---

*This tool is a deliverable of the Engineering SOPs research mission. Cross-reference with M2 (Process Maturity Frameworks) for the full CMMI theoretical background, and with M5 (GSD-Specific SOP Implementation) for detailed GSD ecosystem mapping.*

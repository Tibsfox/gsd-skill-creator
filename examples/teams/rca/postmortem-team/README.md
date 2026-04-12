---
name: postmortem-team
type: team
category: rca
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/rca/postmortem-team/README.md
description: End-to-end blameless postmortem authoring and review pipeline. Takes incident evidence and RCA findings, produces a draft postmortem, runs a blameless-language audit, runs an action-item quality gate, generates the review-meeting agenda, and tracks action items to closure. Use whenever a postmortem needs to be written and you want the process enforced rather than relying on individual discipline. Focuses on the delivery side of RCA; upstream investigation is handled by rca-deep-team or rca-triage-team.
superseded_by: null
---
# Postmortem Team

End-to-end authoring, review, and tracking pipeline for blameless postmortems. Handles everything from evidence intake through action-item closure, so the investigation teams can focus on investigation.

## When to use this team

- **After any SEV1/SEV2 incident** — the deep team produces findings, this team turns them into a finalized postmortem with tracked actions.
- **After the triage team escalates** — to author a proper postmortem rather than the compressed triage version.
- **Postmortem backlog cleanup** — process multiple drafts stalled at various stages.
- **Cross-incident learning initiatives** — when you need consistent postmortem format across many incidents to enable pattern detection.
- **Regulated environments** — healthcare, finance, safety-critical — where postmortem format and action-item tracking must satisfy external reviewers.

## When NOT to use this team

- Live incident — during mitigation, use `incident-response-team` instead. Postmortem authoring starts after mitigation.
- Trivial incidents that don't warrant a postmortem — skip postmortem entirely.
- Investigation-only tasks — use `rca-deep-team` or `rca-investigator` without writing.

## Composition

Four roles, run partly in parallel:

| Role | Agent | Purpose | Model |
|------|-------|---------|-------|
| **Author** | `postmortem-writer` | Draft the postmortem from evidence and findings | Sonnet |
| **Blameless auditor** | `postmortem-writer` (audit mode) | Scan draft for blame-charged language, rewrite | Sonnet |
| **Action-item reviewer** | inline rule-based checks | Validate owners, due dates, specificity, traceability | Sonnet |
| **Meeting facilitator** | `postmortem-writer` (agenda mode) | Produce the review meeting agenda with discussion points | Sonnet |

All roles default to Sonnet. No Opus required because the upstream investigation already used Opus.

## Orchestration flow

```
Input: incident evidence + RCA findings + postmortem template choice
        │
        ▼
┌──────────────────────┐
│ Author               │  Phase 1: Generate draft postmortem
│ postmortem-writer    │          (~5 min, ~30K tokens)
└──────────────────────┘
        │
        ▼
┌──────────────────────┐  Phase 2: Parallel quality gates
│  Blameless auditor   │  ├── Blameless language check, rewrite
│  Action reviewer     │  └── Action-item quality (owner/due/specific/traceable)
│  (in parallel)       │
└──────────────────────┘
        │
        ▼
     Draft v2
        │
        ▼
┌──────────────────────┐  Phase 3: Meeting prep
│ Facilitator          │        Produce agenda with:
│ postmortem-writer    │        — timeline facts to verify
│ (agenda mode)        │        — open questions to resolve
│                      │        — lessons-learned prompts
│                      │        — action-item owner confirmations
└──────────────────────┘
        │
        ▼
  Draft + review-meeting agenda
  ready for human review
        │
        ▼
(Human review — team meeting, 30-60 min)
        │
        ▼
Finalized postmortem → action-item tracker
        │
        ▼
┌──────────────────────┐  Phase 4 (asynchronous): Action-item tracking
│ Tracker              │        Weekly sweeps across open postmortems
│ scheduled job        │        Flag stale actions for re-review
└──────────────────────┘
```

## Quality gates

### Gate 1 — Blameless language

The auditor scans every sentence of the draft against a banned-phrase list and a suspect-structure list:

**Banned phrases** (stripped or rewritten):
- "should have known"
- "failed to [do X]" → rewrite to "did not [do X]" + context
- "careless" / "negligent" / "lazy"
- "ignored" → "did not detect" / "did not prioritize"
- "decided to ignore" → "processed the alert at [time]"

**Suspect structures**:
- Any sentence whose subject is a person and whose verb is blame-charged
- Any sentence ranking contributing factors by moral weight
- Any "single root cause was..." declaration

Rewrites preserve facts while removing judgment. If a rewrite cannot be done without losing information, the auditor flags the passage for the review meeting.

### Gate 2 — Action-item quality

Every action item is checked for:

- [ ] **Specific owner.** A person, not "the team."
- [ ] **Due date.** An absolute date, not "next sprint."
- [ ] **Specific action.** "Add X test" not "improve testing."
- [ ] **Traceability.** Linked to a specific contributing factor or latent condition.
- [ ] **Priority.** P0 / P1 / P2 / P3 assigned.
- [ ] **Tracking issue.** External tracker link (JIRA, GitHub Issue) present or flagged to be created.

Items failing any check are rewritten or flagged. If rewriting is impossible without more information, the item is marked "needs review meeting" in the Open Questions section.

### Gate 3 — Lessons-learned triad

The draft must include all three lessons-learned categories:

- What went well (≥2 bullets)
- What went wrong (≥3 bullets)
- Where we got lucky (≥1 bullet)

If any category is empty, the auditor prompts the author to populate it. An empty "what went well" section is flagged as a cultural warning, not silently allowed.

## Review meeting agenda generation

The facilitator produces a structured agenda tailored to the specific postmortem:

```markdown
# Postmortem Review: INC-4827 — Checkout 500s, 2026-04-09

**When:** <scheduled>
**Attendees:** @primary-author @secondary @sre-lead @checkout-lead @facilitator
**Duration:** 45 minutes

## Pre-reading
- [ ] Draft postmortem: /tmp/inc-4827/postmortem-v2.md
- [ ] RCA findings appendix: /tmp/inc-4827/rca-findings.md

## Agenda

### 1. Timeline walkthrough (10 min)
- Read-along from detection to resolution
- Fact-check: verify each timestamp against source evidence
- Facts flagged for verification:
  - 14:34 — "alert fired" (verify: which alert, which dashboard?)
  - 14:43 — "rollback complete" (verify: was traffic fully shifted?)

### 2. Root-cause discussion (15 min)
- Proximate cause: agreed or debated?
- Contributing factors: any missing?
- Latent conditions: any missing?
- Alternative hypotheses to rule out:
  - Could GC pressure have been a co-cause?
  - Was the database backup running concurrently?

### 3. Lessons learned (10 min)
- What went well discussion
- What went wrong discussion
- Where we got lucky — prompts:
  - Would this have been worse during Friday peak traffic?
  - Did the rollback actually restore all state, or only app state?

### 4. Action-item review (10 min)
- Go around: each owner confirms the action and due date
- Priority adjustments
- Items flagged as "needs review meeting":
  - <list with context>

### 5. Close
- Schedule action-item closure check (4 weeks)
- Assign follow-up postmortem if any action items spawn further work
```

## Action-item tracking

The team includes a tracking role (scheduled job, not an interactive agent) that:

- Scans open postmortems weekly
- Checks each action item's status in the external tracker
- Flags items that are:
  - **Stale** (no progress for > 2 weeks)
  - **Past due**
  - **Blocked** (assigned to unavailable owner)
- Produces a weekly digest for the SRE / reliability function

The tracker does not close action items — only humans close them. Closure requires verification that the change actually landed and the contributing factor is addressed.

## Anti-patterns the team enforces against

### "The postmortem is the deliverable."
No — the postmortem is the *starting point*. The deliverables are: (a) learning absorbed, (b) action items closed, (c) similar incidents prevented. A postmortem that is written and filed without follow-through is failure.

### "The review meeting is a rubber stamp."
The facilitator's agenda explicitly forces discussion on contested points. If the meeting closes without engaging the Open Questions section, the facilitator records this as a process failure.

### "Action items drift."
Weekly tracking catches drift. Stale actions are surfaced and either resurrected with renewed commitment or formally closed as "won't fix" with a written justification.

### "The template is too long, people skip sections."
If teams routinely skip lessons-learned or action items, the team escalates to leadership rather than accommodating. Sections exist because each answers a purpose; skipping them means the purpose is unmet.

## Integration with incident workflow

```
Incident → incident-response-team (mitigation)
         → rca-deep-team or rca-triage-team (investigation)
         → postmortem-team (authoring)
            ├── draft
            ├── blameless audit
            ├── action-item gate
            ├── agenda generation
         → human review meeting
         → finalization
         → postmortem-team.tracker (weekly)
            └── action-item closure verification
```

## Output artifacts

- `postmortem-draft.md` — the authored draft after all quality gates
- `postmortem-agenda.md` — the review meeting agenda
- `postmortem-final.md` — after human review (written by the team)
- `action-items.json` — structured action-item list for tracker ingestion
- `weekly-digest.md` — the weekly action-item tracking summary

## Configuration

```yaml
name: postmortem-team
author: postmortem-writer
auditor: postmortem-writer  # audit mode
action_reviewer: inline-rules
facilitator: postmortem-writer  # agenda mode

template: google-sre  # or etsy, honeycomb, custom
blameless: strict  # strict | moderate | off
action_gates: all  # all | owner-only | off
lessons_triad_required: true

# External integrations
trackers:
  jira:
    url: https://example.atlassian.net
    project: PM
  github:
    repo: Tibsfox/gsd-skill-creator
    label: postmortem-action
```

## Invocation

```
# End-to-end: evidence → finalized draft ready for review
> postmortem-team, produce a postmortem for INC-4827. Evidence in
  /tmp/inc-4827/. Use the google-sre template with strict blameless
  audit. Produce draft, audit, agenda, and action-item JSON.

# Just the draft (no review prep)
> postmortem-team, draft only — no agenda, no action-item extraction
  — for incident INC-4830.

# Audit an existing draft
> postmortem-team, audit the draft at /tmp/inc-4827/draft.md for
  blameless language and action-item quality. Do not rewrite the
  facts — only flag and suggest.
```

---
name: rca-deep-team
type: team
category: rca
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/rca/rca-deep-team/README.md
description: Multi-method parallel root cause investigation for high-severity or high-uncertainty incidents. Runs classical, systems-theoretic, causal-inference, and human-factors analyses in parallel, then synthesizes findings into a single coherent report. Use when an incident is SEV1/SEV2, when initial analysis produced conflicting hypotheses, when the incident is likely to recur, or when regulatory or legal review will scrutinize the investigation. Not for routine incidents — the token and time cost is substantial.
superseded_by: null
---
# RCA Deep Team

Multi-method root cause analysis squadron for high-stakes incidents where a single technique is insufficient and the team wants defensible, multi-perspective findings.

## When to use this team

- **Incidents above SEV2** where user impact, data loss, or regulatory exposure justifies thorough investigation.
- **Recurring incidents** where prior single-method analysis didn't prevent the class.
- **Conflicting hypotheses** — when the on-call team and the SRE review disagree on the cause.
- **Safety-critical systems** — healthcare, aviation, autonomous systems, financial clearing.
- **Cross-organizational incidents** — when multiple teams contributed and you need a blame-neutral synthesis.
- **Post-incident legal or regulatory review** — the multi-method approach is defensible to auditors.

## When NOT to use this team

- Routine low-severity incidents — use `rca-triage-team` instead.
- Time-critical mitigation (we're still in the incident) — use the standard incident-response workflow first; this team runs after mitigation.
- Incidents with obvious single causes that don't recur — use `rca-investigator` in solo mode.

## Composition

The team runs five specialized members in parallel plus a coordinator:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Coordinator** | `rca-investigator` | Method selection, synthesis | Opus |
| **Classical analyst** | `five-whys-facilitator` | 5 Whys + Fishbone + Cause Map | Sonnet |
| **Systems-theoretic analyst** | `stamp-stpa-analyst` | CAST on the incident | Opus |
| **Causal-inference analyst** | `causal-graph-builder` | Bayesian network, counterfactuals | Opus |
| **Human-factors analyst** | `rca-investigator` (HFACS mode) | HFACS taxonomy, Just Culture triage | Opus |
| **Distributed-systems analyst** | `rca-investigator` (distributed mode) | Trace analysis, service-graph diff | Sonnet |

The human-factors and distributed-systems analysts are inline passes of `rca-investigator` in specialized modes, not separate agents, to avoid agent proliferation.

## Orchestration flow

```
Input: incident evidence (logs, metrics, traces, chat, timeline)
        │
        ▼
┌───────────────────────┐
│ Coordinator (Opus)    │  Phase 1: Classify the incident
│ rca-investigator      │          — causal structure, domain, evidence
└───────────────────────┘          — decides which sub-analysts to run
        │
        ├─────────────┬─────────────┬─────────────┬─────────────┐
        ▼             ▼             ▼             ▼             ▼
    Classical     Systems-       Causal-       Human-      Distributed-
    analyst       theoretic      inference     factors     systems
                  (CAST)         (causal       (HFACS +    (trace +
                                  graph)        Just        service
                                                Culture)    graph)
    Phase 2: Each analyst works in parallel, reading the same evidence
             but producing independent findings in their own framework.
        │
        └─────────────┴─────────────┴─────────────┴─────────────┘
                              │
                              ▼
                    ┌───────────────────────┐
                    │ Coordinator           │  Phase 3: Synthesize
                    │                       │          — merge findings
                    │                       │          — reconcile conflicts
                    │                       │          — rank latent conditions
                    │                       │          — produce unified report
                    └───────────────────────┘
                              │
                              ▼
                    ┌───────────────────────┐
                    │ postmortem-writer     │  Phase 4: Produce the
                    │                       │          postmortem draft
                    └───────────────────────┘
                              │
                              ▼
                         draft postmortem
                       ready for human review
```

## Synthesis rules

The coordinator synthesizes the five analyses using these rules:

### Rule 1 — Converging findings are strengthened

When two or more methods identify the same contributing factor, mark it with high confidence and weight it in the corrective-action ranking.

### Rule 2 — Diverging findings are preserved

When methods disagree, preserve both in the report with attribution. Do not force a reconciliation the evidence doesn't support. The review meeting will adjudicate.

### Rule 3 — Proximate vs. latent

Classical analysis tends to find the proximate cause; systems-theoretic and human-factors analyses find latent conditions; causal inference ranks effect magnitudes. Keep them in their appropriate sections of the final report, don't flatten them.

### Rule 4 — Actions target latent conditions first

Corrective actions are ranked by leverage: latent condition fixes (which prevent classes of incidents) rank above proximate fixes (which prevent this specific incident). Both are required, but latent condition fixes get priority allocation.

### Rule 5 — No single-cause declarations

The coordinator refuses to emit a single "the root cause was X" sentence. All findings are multi-causal unless the evidence genuinely supports single causation, which is rare.

## Parallel execution details

The five analysts run concurrently after the coordinator's classification. They share read-access to the same evidence directory. They do not communicate with each other during Phase 2 — only with the coordinator. This preserves independence and allows the rule of convergence (Rule 1) to function as a consistency check.

If the evidence is too large for parallel in-memory loading, the coordinator chunks it and distributes slices to the analysts by domain (e.g., human-factors gets the chat transcript and timeline; causal-inference gets the metrics CSV; distributed-systems gets the trace dump).

## Output

A single markdown report with these sections:

```markdown
# Deep RCA: <incident>

## Summary
## Methods applied and rationale
## Converging findings (high confidence)
## Diverging findings (multiple candidates remain)
## Proximate cause
## Contributing factors
## Latent conditions
## Recommended corrective actions (ranked by leverage)
## Confidence and uncertainty notes
## Per-method appendix
  ### Classical (5 Whys + Fishbone)
  ### Systems-theoretic (CAST)
  ### Causal-inference (Bayesian network)
  ### Human-factors (HFACS)
  ### Distributed-systems (traces + service graph)
```

## Token / time cost

Approximate cost per incident:
- **Coordinator** — 1 Opus invocation for classification, 1 for synthesis (~60K tokens total)
- **5 analysts in parallel** — 4 Opus + 1 Sonnet, ~50–80K tokens each
- **Postmortem writer** — 1 Sonnet invocation, ~30K tokens
- **Total** — 350–550K tokens, 10–30 minutes wall-clock

This cost is justified for SEV1/SEV2 incidents where a missed latent condition costs more than the analysis. It is not justified for routine incidents.

## Integration with incident response

The deep team runs **after** the incident is mitigated and **before** the postmortem is finalized. It plugs into the standard workflow:

```
Incident detection → Mitigation (incident-response-team)
    → Ad-hoc review (~15 min in war room, informal)
    → Deep RCA (rca-deep-team, 10-30 min asynchronous)
    → Postmortem draft (postmortem-writer, ~5 min)
    → Review meeting (human, 30-60 min)
    → Finalization and action-item tracking
```

## Configuration

The team can be configured via a `team.yaml`:

```yaml
name: rca-deep-team
coordinator: rca-investigator
analysts:
  - classical: five-whys-facilitator
  - systems: stamp-stpa-analyst
  - causal: causal-graph-builder
  - human-factors: rca-investigator  # with --mode=hfacs
  - distributed: rca-investigator    # with --mode=distributed
synthesizer: rca-investigator         # same agent, different mode
writer: postmortem-writer

# Opt-out: if you don't want a specific analysis for this incident
skip: []  # e.g., ["causal"] for narrative-only incidents

# Parallelization
parallel: true
timeout_minutes: 30
```

## Invocation

```
> rca-deep-team, run a full multi-method investigation on incident
  INC-4827. Evidence in /tmp/inc-4827/. Incident severity: SEV2.
  Produce a draft postmortem at /tmp/inc-4827/postmortem-draft.md
  and an appendix of per-method findings.
```

## Example output structure

See `examples/postmortems/INC-4827-deep.md` for a reference postmortem produced by this team.

## Limitations

- The team is as good as its evidence. Gaps in logs, missing traces, or absent chat transcripts degrade all five analyses simultaneously.
- Parallel analysts share evidence but do not cross-check intermediate reasoning — convergence is measured only at the findings level.
- The team does not interview humans in real time. For interview-based investigation, a human facilitator must run the interviews and feed the transcripts as evidence.
- The team assumes a blame-free investigation culture. In punitive environments, the output will be technically correct but organizationally unusable.

# Symbiosis — M8 Teaching, Co-Evolution, and Quintessence

**Module:** M8  
**Register:** Relationship  
**Source:** Foxglove 2026, pp. xxv–xxxii (pending source-print verification); Lanzara 2023, Chapter 7 (pending source-print verification)  
**Path:** `src/symbiosis/`  
**Opt-in flag:** `gsd-skill-creator.symbiosis.enabled`

---

## What It Is

Symbiosis is the relationship layer of the Living Sensoria stack. It maintains two ledgers — a teaching ledger and a co-evolution ledger — and computes a five-axis Quintessence score that measures whether the partnership between the developer and the skill-creator system is producing a healthy, bidirectional exchange.

The frame comes from Foxglove 2026, pp. xxv–xxxii (pending source-print verification), which establishes what the text calls the symbiosis register: a formal accounting of what each party brings to an interaction that the other cannot bring. The developer side holds the capacity for value judgements, aesthetic commitments, and long-horizon goals requiring lived context. The system side holds precision at scale and uniform application of specified procedures. Neither side substitutes for the other. M8 makes the exchange surface explicit and computable rather than implicit and ephemeral.

The Quintessence five-axis frame derives from Lanzara 2023, Chapter 7 (pending source-print verification), which identifies five features jointly necessary and sufficient for life-like sensory behaviour. M8 maps each axis to a computable metric from prior-module data — no new instrumentation is required beyond what M1–M7 already produce.

This module does not claim the system is alive or that the partnership has experiential properties. The "symbiosis" term denotes a formal, measurable exchange relationship between two systems with different capabilities. See `docs/foundations/theoretical-audit.md` §9 for the full disclaimer.

---

## The Teaching Ledger

The teaching ledger (`src/symbiosis/teaching.ts`) records structured entries whenever the developer provides feedback, correction, or explicit instruction. Each entry is JSONL-appended to `.planning/symbiosis/teaching.jsonl` (append-only; no record is ever modified or deleted after write).

### Five Teaching Categories

| Category | What it captures | Example |
|----------|-----------------|---------|
| `correction` | Developer corrects a system output | "That's the wrong file — use config.ts, not settings.ts" |
| `instruction` | Developer specifies a procedure to follow | "After a test failure always check the fixture data first" |
| `preference` | Developer expresses a style or priority judgement | "Prefer immutable data structures in this codebase" |
| `boundary` | Developer declares an explicit constraint | "Never commit to main directly; all changes go through dev" |
| `positive-feedback` | Developer confirms a system output was correct | Explicit approval or no-correction across 3+ consecutive activations |

Teaching entries are correlated to M3 decision traces by `traceId` (the optional field added to `ActivationEvent` by the Grove inventory, Phase 638). This enables precedent queries: "the last time a decision like this was made, the developer later corrected it via a `correction` entry."

---

## The Co-Evolution Ledger

The co-evolution ledger (`src/symbiosis/co-evolution.ts`) records offerings — system-generated observations about the partnership state, proposed adjustments to skill parameters or activation patterns, or suggested new skills derived from observed recurring workflows. Offerings are written to `.planning/symbiosis/co-evolution.jsonl`.

### Four Offering Kinds

| Kind | What it proposes | Acceptance criterion |
|------|-----------------|----------------------|
| `skill-parameter` | Adjust K_H / K_L / theta for a skill | LS-22: ≥80% of a 50-offering calibration sample rated useful (deferred to post-release annotation pass) |
| `new-skill` | Propose a new skill from a recurring workflow pattern (M1 community + M3 trace evidence) | Same as pattern-detect pipeline in `src/` |
| `refinement` | Propose a bounded change (≤20%) to an existing skill body | Subject to 7-day cooldown + minimum 3 corrections invariant |
| `quintessence-alert` | Flag a Quintessence axis drifting outside the healthy band | Informational; developer decides action |

Every offering carries a `sourceData` array of record IDs from M1, M2, M3, or M4 that justified the proposal. This makes every offering inspectable and auditable without requiring trust in the system's judgement.

---

## Quintessence Five-Axis Report

The Quintessence computation (`src/symbiosis/quintessence.ts`) reads from all seven other modules and produces a five-axis report. CLI output is plain text and JSONL; no dashboard rendering in v1.49.561 (deferred to a future release).

The five axes derive from Lanzara 2023, Chapter 7, §"Quintessence: the five features" (pending source-print verification):

| Axis | What it measures | Target band |
|------|-----------------|-------------|
| **Self-vs-Non-Self** | Fraction of M1 community memberships unique to this project | 0.5 – 1.0 |
| **Essential Tensions** | Ratio of competing signal pairs (refactor pressure vs stability pressure, coverage pull vs delivery velocity) | 0.3 – 0.7 |
| **Growth-and-Energy-Flow** | Net rate of new structured knowledge added to Grove minus stale entries removed, rolling window | > 0 |
| **Stability-vs-Novelty** | Ratio of retrieval operations returning high-confidence nodes vs operations expanding the graph | Mission-type-dependent |
| **Fateful Encounters** | KL divergence of community-structure distribution before/after each session boundary | Flagged when KL > 2.0 |

---

## Enabling Symbiosis

Symbiosis is **opt-in** and defaults to off:

```json
{
  "gsd-skill-creator": {
    "symbiosis": {
      "enabled": true
    }
  }
}
```

When disabled, no teaching or co-evolution ledger entries are written. Existing v1.49.560 behaviour is byte-identical. When enabled, the system begins recording teaching events from the sensory stream and generating co-evolution offerings after a minimum of 20 sessions (the living-sensorium acceptance test, LS-24).

---

## CLI

```bash
# Display recent teaching ledger entries for a skill
skill-creator teach <skill-name>

# List pending co-evolution offerings
skill-creator co-evolution

# Accept a co-evolution offering by ID
skill-creator co-evolution --accept <offering-id>

# Display the current Quintessence five-axis report
skill-creator quintessence

# Display Quintessence for a specific session range
skill-creator quintessence --since <ISO-date>
```

---

## The Parasocial Guard

M8's language-constraint validator (`src/symbiosis/language-guard.ts`) runs on every co-evolution offering and teaching-ledger summary before it is written or displayed. It rejects any generated text containing emotional framing, first-person-plural relational language, or attribution of experience to the system. The guard is tested by SC-PARASOC: 100 generated offerings, 0 constraint violations.

Rejected patterns include phrases that describe the system as wanting, caring, understanding, or feeling; relationship metaphors that imply parity of experience; and collaborative-"we" constructions that blur the boundary between system output and developer intent.

The guard is not a style filter — it is a structural boundary enforcement mechanism, analogous to the type-level Markov-blanket enforcement in M7. An offering that passes the guard can be read as a computable proposal from a software system; an offering that fails the guard has drifted into anthropomorphic framing that could mislead the developer about the nature of the exchange.

---

## Primary Sources

- Foxglove, M. T. (2026). *The Space Between: The Autodidact's Guide to the Galaxy.* First edition, 923 pages. tibsfox.com. Preface pp. xxv–xxxii (symbiosis register and bidirectional accounting frame). Pending source-print verification.
- Lanzara, R. G. (2023). *Origins of Life's Sensoria.* ISBN 978-1-7335981-1-8. Chapter 7 — Quintessence: the five features jointly necessary and sufficient for life-like sensory behaviour. Pending source-print verification.

---

## See Also

- `docs/sensoria.md` — M6 net-shift receptor substrate (M8 reads M6 activation events)
- `docs/umwelt.md` — M7 Markov-blanket boundary (M8 reads M7 surprise log for Fateful Encounters axis)
- `docs/memory-stack.md` — M1–M5 (M8 Quintessence reads M1 communities, M2 reflection labels, M3 traces, M4 branch ratios)
- `docs/foundations/theoretical-audit.md` — Full theoretical audit with primary-source citations

# Heuristics Audit of the Six-Step Skill-Creator Loop

**Phase:** 731 (v1.49.571 Heuristics-Free Skill Space, T1d)
**Status:** Report-only. No substrate behavior is modified by this document.
**Source:** Balestriero & LeCun 2025, *LeJEPA* §2 + §4 — "stop-gradient analogue" methodology.
**Hard constraint:** CAPCOM gates, Safety Warden BLOCK authority, and the human-in-the-loop verdict at wave boundaries are **NOT** candidates for replacement. This audit evaluates only the *internal* pipeline heuristics.

## Premise

LeJEPA observed that a decade of self-supervised learning had accumulated engineering patches (stop-gradient, teacher-student networks, EMA schedulers, negative samples) that worked in practice but resisted principled explanation. The paper's methodological contribution was to ask, for each patch: *what distributional property is it implicitly guarding?* Once the property was stated, the patches collapsed into symptoms of an unstated objective, and a single regularizer (SIGReg) could subsume the whole lattice.

This audit applies the same methodology to the six-step `gsd-skill-creator` loop:

1. **Observe** — session tool-use and file-change capture
2. **Detect** — pattern candidate surfacing
3. **Suggest** — pending skill/agent/chipset proposal
4. **Manage** — lifecycle actions (accept, dismiss, defer)
5. **Auto-Load** — context-aware activation of existing skills
6. **Learn/Compose** — propagate feedback + compose skills

For each step, the audit scores candidate heuristics for stop-gradient-analogue behavior: patches that might be subsumed by a principled objective.

## Scoring Methodology

**Effort-to-replace (E):** S (small, <100 LOC change), M (medium, module refactor), L (large, cross-module).
**Risk-if-removed (R):** L (no user-visible effect if the property fails silently), M (degraded behavior), H (substrate instability, CAPCOM compromise).

Higher E and lower R = better candidate for early replacement. The audit recommends triaging by (E, R) pair, not by either axis alone.

## Scored Candidates

### Step 1 — Observe

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 1.a | Session-boundary truncation (events older than session-start are dropped) | Finite memory footprint; de-duplication across reruns | Yes — a principled retention policy (e.g., exponential decay weighted by novelty score) subsumes session truncation with a single λ_retention parameter | M | M |
| 1.b | Tool-name normalization table (map `grep` → `Grep`, `bash` → `Bash`) | Canonical event vocabulary for downstream pattern matching | No — this is a specification, not a heuristic; the table *is* the canonical vocabulary | S | L |

### Step 2 — Detect

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 2.a | Minimum-occurrence threshold (pattern must appear ≥N times before surfacing) | False-positive rate in suggestion firehose | Yes — an intrinsic information-gain score per candidate (SIGReg-on-skill-embeddings style, Phase 733 Intrinsic Telemetry) subsumes the N threshold with a single λ_information parameter | M | M |
| 2.b | Pattern-decay cooldown (candidate discounted by age) | Stale-pattern suppression | Partially — decay is a principled weight function; the cooldown *rate* is the heuristic. Could be replaced by fitting the rate from retrospective feed-forward uptake data | M | L |

### Step 3 — Suggest

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 3.a | Confidence gate (suggest only if score ≥ τ) | Precision of surfaced suggestions | Yes — see Cluster B of the Single-λ audit (Phase 730). τ is the paradigmatic single-λ candidate. | S | M |
| 3.b | Per-session suggestion cap | Signal-to-noise at the user surface | Yes — if driven by an intrinsic signal rather than a hard cap, the cap becomes a natural consequence of the SNR threshold | S | L |

### Step 4 — Manage

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 4.a | Defer default after N days without action | Pending-queue entropy bound | Yes — entropy-based natural expiration replaces the N-day heuristic with a single λ_pending_entropy parameter | S | L |
| 4.b | Three-correction minimum before commit (v1.49.560) | Redundancy against single-point outliers | See Cluster A of Single-λ audit (Phase 730) — collapse contingent on Phase 733 telemetry | M | **H** |

### Step 5 — Auto-Load

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 5.a | Context-similarity threshold for activation | Precision of automatic context-matched skill firing | Yes — same family as 3.a (confidence gate) | S | M |
| 5.b | Exclusion of recently-dismissed skills | Respect for user's negative signal | No — this is user-intent preservation, not a heuristic. Keep as-is. | N/A | N/A |

### Step 6 — Learn/Compose

| # | Heuristic | What it implicitly guards | Could a principled objective subsume? | E | R |
|---|-----------|---------------------------|----------------------------------------|---|---|
| 6.a | 20% content-change cap per correction (v1.49.560) | Bounded substrate mutation per cycle | See Cluster A of Single-λ audit | M | **H** |
| 6.b | 7-day cooldown between corrections on the same node | Temporal de-correlation | See Cluster A of Single-λ audit | S | M |
| 6.c | Composition similarity-pruning (refuse to compose two highly-similar skills) | Redundancy in composition space; avoid circular skills | Yes — Phase 728 Skill Space Isotropy Audit provides the principled similarity metric; pruning becomes derived | M | M |

## Summary Table

| Step | Candidates | Tier-1 replace (low risk, small effort) | Tier-2 replace (requires telemetry) | Keep-as-is |
|------|-----------|----------------------------------------|-------------------------------------|------------|
| 1 Observe | 2 | — | 1.a | 1.b |
| 2 Detect | 2 | 2.b | 2.a | — |
| 3 Suggest | 2 | 3.a, 3.b | — | — |
| 4 Manage | 2 | 4.a | 4.b | — |
| 5 Auto-Load | 2 | 5.a | — | 5.b |
| 6 Learn/Compose | 3 | — | 6.a, 6.b, 6.c | — |

**Totals:** 13 candidates audited (floor ≥5 per LEJEPA-16). 5 Tier-1, 5 Tier-2, 3 keep-as-is.

## Hard Constraints (What This Audit Does NOT Propose Replacing)

- **Any CAPCOM gate** — human-in-the-loop authority is not a heuristic, it is the decision surface.
- **Safety Warden BLOCK** — pre-publication sign-off, not a knob.
- **User dismissal memory (5.b)** — respect for user's negative signal is user-intent preservation, not a heuristic.
- **Tool-name canonical vocabulary (1.b)** — this is a specification, not a heuristic.

## Recommendation

**Do not implement any of these replacements in v1.49.571.** This phase delivers the audit. Tier-1 candidates (5 items) are the lowest-risk starting set for a follow-on milestone once Phase 733 Intrinsic Telemetry has produced the correlation data needed to validate the principled objectives each Tier-2 replacement would use.

## Cross-References

- Phase 730 Single-λ orchestration audit (`docs/substrate-audits/single-lambda.md`) — complementary audit of tunable knobs rather than pipeline steps.
- Phase 728 Skill Space Isotropy Audit (`src/skill-isotropy/`) — provides the principled similarity metric needed by 6.c.
- Phase 733 Intrinsic Telemetry (`src/intrinsic-telemetry/`) — provides the Spearman-style correlation evidence needed by 2.a, 4.b, 6.a, 6.b.

## CAPCOM Preservation Statement

This audit is report-only. No substrate behavior is modified by this document. No pipeline step is removed, shortened, or bypassed. CAPCOM gates and Safety Warden authority are explicitly preserved per the Hard Constraints section above.

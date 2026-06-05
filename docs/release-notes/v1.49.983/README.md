---
title: "v1.49.983 — GAP-7 deterministic trip-vocab check"
version: v1.49.983
date: 2026-06-05
summary: >
  Ship 5.3 closes GAP-7 (the last open architecture gap) with a deterministic,
  no-LLM content-filter trip-vocab budget check wired as a WARN-first pre-tag-gate
  step, hardens the v982 retention apply-guard against a lopsided corpus, and adds
  an end-to-end test proving the 5.1c skill-mining pipeline persists activeSkills.
tags: [phase-5, gap-7, content-filter, bounded-learning, safety]
---

# v1.49.983 — GAP-7 deterministic trip-vocab check

**Shipped:** 2026-06-05

GAP-7 (the last open architecture gap) is closed by a deterministic trip-vocab budget check; the same ship hardens the v982 retention guard against a degenerate-by-skew corpus and proves the skill-mining pipeline writes to disk.

## Why this ship

Off the v982 handoff the operator selected four Phase-5 follow-ons; Ship 5.3 (GAP-7) was sequenced first. GAP-7 ("Content Filter Vulnerability") was the only remaining open architecture gap — its evidence is the NASA sub-agent dispatch trip-vocab pattern (Lessons #10401/#10402/#10407), where a brief or dispatch prompt's surface vocabulary predicts whether a build sub-agent ships or trips the Anthropic content-filter mid-flight. The discipline was real but enforced only by a **manual `grep` checklist** in `docs/MISSION-PACKAGE-DISCIPLINE.md §3.3` — an #10461 un-gated runnable surface. Two companion follow-ons rode along: an operator-gated retention **dry-run probe** exposed that the v982 guard mechanically passes on a 26:1 corpus (so it was hardened), and the 5.1c re-audit needed proof that the mining pipeline actually fires (so an end-to-end test was added).

## What shipped

- **GAP-7 — deterministic trip-vocab check.** `tools/trip-vocab-check.mjs` (pure regex counting, no LLM, identical input → identical verdict) with `brief` / `prompt` / `page` modes, encoding the canonical §3.1 primary (title-line budget 0) and secondary (body-density) classes. Exit 0 pass / 1 trip-risk / 2 fatal. Wired as **pre-tag-gate step 21** (WARN-first per #10463; escalatable via `SC_PRE_TAG_GATE_REQUIRE=trip-vocab`), which scans the current NASA degree's local page and skips cleanly when absent (clean-CI path). Output prints class totals + how many classes matched — never the matched tokens (#10462). A negative-test fixture proves the gate actually fires.
- **Retention apply-guard hardening (Tier 2).** The v982 guard refused `--apply` for `observation.retention_days` unless both polarities were present; a v983 dry-run probe showed the e-process recommending 90→91 off a 26:1 corpus (`meanObservation −0.926`) that mechanically passed. Tier 2 now also requires the minority polarity to reach **≥3 events AND ≥20% share** (≤4:1), so a lopsided pile cannot drive a false-vindication change. Dry-run stays unguarded.
- **5.1c mining-pipeline verification.** A new end-to-end `session-observer` test proves that with this repo's config shape (`mine_active_skills` absent → Zod inherits `true`), threaded exactly as the session-end hook threads it, a ≥2-skill session persists non-empty `activeSkills` to `sessions.jsonl` — removing the "is mining firing?" ambiguity from the 5.1c re-audit.

## Verification

- `npm run build` clean; full `npx vitest run` green (**35,778 tests**, 0 failures).
- Adversarial ship review (step P, 5-lens): **0 real BLOCKER/MAJOR** — every BLOCKER/MAJOR considered (`--apply` slip-through, all-`too_lax` symmetry, command-injection from `STATE.md`, ReDoS, exit-25 completeness, bypass-vocab parity, #10462) was refuted with reproduced evidence. 5 genuine low-severity findings (2 MINOR + 3 NIT) all fixed in code.
- Drift-guards updated in lockstep and green: exit-25 legend, bypass-vocab parity, self-consistency `/21`, v965 made count-agnostic, new v983 meta-test.
- No retention calibration tick (dry-run probe was inspect-only; no `--apply`, no recurring tick).

## Engine state

NASA degree **1.178** · counter-cadence **29** · manifest lessons **152** — all unchanged (forward Phase-5 / GAP closure; no lesson promoted). No `cadence_advances`.

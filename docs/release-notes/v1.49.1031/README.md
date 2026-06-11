---
title: "v1.49.1031 — Workflows Library: Committed NASA-Ops Skeletons, Mode-Flip Codification, Drift-Guard"
version: v1.49.1031
date: 2026-06-10
summary: >
  Audit §10 ship 5: the generic skeletons of the untracked NASA-ops workflow
  machinery are promoted into a committed tools/workflows/ library — the
  4-auditor adversarial content review (ANCHOR-LEAK guard always-on,
  rotation|continuation mode flag, Explore-pinned), the 8-task DECOMPOSE-build,
  and the multi-wave retrospective-audit harness — plus a drift-guard
  integration test, a new canonical doc, the NASA discipline-doc resume-era
  refresh (folding audit Lead A: Lesson #10408 superseded for catalog-clone
  rewrites), and the NASA per-ship T14 appendix.
tags: [tools, workflows, nasa-ops, drift-guard, docs]
---

# v1.49.1031 — Workflows Library: Committed NASA-Ops Skeletons, Mode-Flip Codification, Drift-Guard

**Shipped:** 2026-06-10

One-line: the QA machinery that sustained the 39-ship NASA cadence moves from
19 untracked, clone-drifting scripts into 3 committed, parametrized,
drift-guarded Workflow skeletons under `tools/workflows/`.

## Why this ship

AUDIT-2026-06-09's nasa-ops-machinery lens found the repo's proven generative
QA machinery living entirely in gitignored working-tree state: 11 four-auditor
review clones, 6 DECOMPOSE-build clones, and 2 audit harnesses — versus one
committed sibling (`tools/ship-review/adversarial-ship-review.mjs`). The drift
cost was quantified: the ANCHOR-LEAK guard (born from the caught v1023 Dawn
defect, held 3 consecutive clean ships) existed in only 3/11 review and 3/6
build clones, so cloning any older ancestor silently regressed it; the
rotation-vs-continuation prompt flip lived in one untracked handoff paragraph;
mission auditors were not pinned read-only; and the canonical-sidebar footgun
already proved untracked-state loss is permanent (11 pages). The audit's
PROMOTE verdict (§10 queue item 5, operator-triggered "ship 5") scoped exactly
this: commit the generic skeletons, leave per-mission instances untracked.

## What shipped

- **`tools/workflows/content-adversarial-review.mjs`** — parametrized
  4-auditor (2 fact clusters + framing/anchor-canonicality + structure/leak) +
  synthesis-judge content review. The ANCHOR-LEAK guard is always-on; the
  `mode: 'rotation' | 'continuation'` arg commits the predecessor-vocab flip;
  all 4 auditors + judge are read-only Explore agents (an upgrade no untracked
  clone had); 3-way verdict enum; judge fail-safe (a dead judge never silently
  passes a review). Leak payloads arrive via args (#10406 — the committed file
  enumerates no mission vocabulary).
- **`tools/workflows/decompose-build.mjs`** — the canonical 8-task page
  decomposition (index / research / organism / math-sim / papers-curriculum /
  jsons / pointers-shader / readme) that beats the ~290s sub-agent ceiling
  (6× confirmed, 8/8 agents ~350s wall-clock). The ANCHORS guard and the mode
  flip are REQUIRED args; the SHARED contract (brief-first, preserve-structure,
  DISCIPLINE a–e, trip-vocab + no-commit footers) is the committed skeleton.
- **`tools/workflows/audit-harness.mjs`** — the multi-wave retrospective-audit
  topology (scout → refute-prior → coverage/surfaces → lenses → refute-new →
  refute-lenses → critic → budget-gated gap-fill → in-workflow synthesis),
  generalized from the 2026-06-03/2026-06-09 harnesses; refuter enum
  CONFIRMED | REFUTED | UNVERIFIABLE over every fresh-claim wave.
- **`tests/integration/workflows-library-discipline.test.ts`** — 18-assertion
  drift-guard pinning the auditor/task rosters, the Explore/general-purpose
  isolation asymmetry (both ways), the mode-flip branches, the guard language,
  the 3-way enum schema wiring, and all doc cross-references; runs in the root
  vitest project (bare `npx vitest run` → gate + every CI leg).
- **`docs/workflows-library.md`** — canonical process doc: args contracts,
  isolation discipline, mode semantics, the promotion boundary, caught-defect
  provenance ledger.
- **`docs/nasa-mission-authoring-discipline.md`** — resume-era refresh (stale
  since v911, ~120 ships): campaign un-frozen (resumed 2026-06-06; runs 1–4,
  degrees 1.179–1.217, 39 ships, 0 trips runs 2–4); NEW §0 codifies
  DECOMPOSE-build, the adversarial content review, and the per-ship flow.
  **Lead A folded:** Lesson #10408 marked SUPERSEDED for catalog-clone
  rewrites by DECOMPOSE-build (remains valid for constrained harnesses);
  the audit's original #10233 target was a mis-target (absent from live
  disciplines.json — no action).
- **`docs/T14-SHIP-SEQUENCE.md`** — NASA per-ship T14 appendix (the resume-era
  ~14-call variant, previously a pointer chain through untracked handoffs).
- **`docs/sub-agent-dispatch-discipline.md`** — #10408 supersession annotation
  at the lesson's canonical home.

Deliberately NOT shipped: per-mission instances/briefs/handoffs (policy);
the per-mission scaffolder (audit ship C, optional); disciplines.json edits
(prose-only supersession avoids the CLAUDE.md render coupling); the Rust
ProcessContext analogue (separate §3.3 carry).

## Verification

- Evidence fleet `wf_28691c0e` (4 read-only agents) BEFORE any edit verified
  the clone-consensus invariants across all 11 review + 6 build clones
  (schemas/topology/return-shape invariant; ANCHORS guard 3/6; mode language
  per clone) and the integration constraints (new files trip no gate sweep;
  tests/integration/*.test.ts runs in the root project; T14 append safe vs
  c2-story-gate-ordering; prose-only #10408 annotation safe vs
  check-discipline-coverage).
- Full `npx vitest run`: 35,932 passed / 0 failed (35,912 → 35,932; the new
  18-assertion drift-guard + scaffolding). Targeted runs of the two
  doc-pinning tests green before the docs commit.
- Step P v2 adversarial ship review on the full diff + attestation
  (`--mode full`) — results in chapter/99-context.md.
- Pre-tag-gate 22/22 at T14.

## Engine state

NASA degree **1.217** (unchanged — core ship, no degree advance);
counter-cadence count **29** (manifest), cadence unchanged; manifest lesson
count **152**; thresholds **8**. Predecessor v1.49.1030 (`d93c1deab`).

---
title: "v1.49.1129 — The June-2026 arXiv College Campaign"
version: v1.49.1129
date: 2026-07-19
summary: >
  v1.49.1129 ships the June-2026 arXiv College campaign: 219 teaching concepts
  authored across the agent-systems, ai-computation, logic, data-science,
  mathematics, statistics, security, and electronics departments from the June
  arXiv research wave, then refined against their source papers in six grounded
  waves (18 P1 corrections, 111 P2 + 48 P3 re-quantifications, 4 dangling
  cross-refs removed, 8 uncached anchors web-verified with 2 fabrications caught,
  71 reciprocal cross-links). It also lands the flywheel's deferred seams and a
  batch of opt-in, default-inert cartridge / learning / dev-domain-memory
  follow-ups, plus 7 forged agent-systems skills.
tags: [dev-line, college, arxiv, refinement, flywheel]
---

# v1.49.1129 — The June-2026 arXiv College Campaign

**Shipped:** 2026-07-19
**Branch:** dev → main
**Type:** dev-line engineering ship (not a NASA degree)

This release turns a month of frontier AI-agent research into durable teaching
content: **219 College concepts authored from the June-2026 arXiv wave, then
refined against their source papers in six grounded waves** — and wires the
last deferred seams from the v1.49.1128 flywheel roadmap.

## Summary

v1.49.1129 is a large, three-arc dev-line ship: **62 commits ahead of the
v1.49.1128 tag (`cf92f33e4`)**, **397 files changed, +23,944 / −304 lines**,
dominated by **303 files under `.college/departments/`**. Its marquee is the
**June-2026 arXiv College campaign** — a scan of the June LLM-agent-and-security
research frontier turned into 219 teaching concepts, each grounded in a real
June-2026 arXiv paper, distributed across the College's agent-systems (146),
ai-computation (61), and logic (9) barrels plus the data-science, mathematics,
statistics, security, and electronics departments. After authoring, the whole
corpus was **reviewed against its source papers and refined in six waves**,
raising factual fidelity without inventing a single number.

Alongside the campaign the release drains two infrastructure backlogs that had
accumulated as *documented seams* behind the v1.49.1128 flywheel roadmap: a set
of **mission-sized follow-ups and deferred seams** (a Claude-backed claim /
concept-naming / enrichment path, an obs-pump forwarder, informal same-session
undo detection, a semantic concept-skill suggester, prompt-injection
fence-neutralization) and a **dev-domain observation→memory path** with an
opt-in SessionEnd hook. Every new capability ships **opt-in and inert by
default** — the self-modifying safety posture the project holds to.

## Mission Overview

The College is skill-creator's teaching layer: a Rosetta Core and a set of
departments whose concepts map frontier ideas onto a navigable knowledge
structure. The **`scan-arxiv` pipeline** reads a month of arXiv, funnels
candidates through quality gates, and the strongest become concepts. June 2026
was an **LLM-agent-skill-plus-security wave**, so the yield concentrated in the
agent-systems barrel: skill selection and composition, typed skill graphs,
trajectory-conditioned routing, skill-injection defense, memory admission
gating, goal-state inference, and the operational disciplines around them.

Authoring ran as a multi-session campaign (23 base + 22 agent-systems T1 + T2
tails + an additional scan + a batch-B tail + an electronics/EE scan), landing
**219 picks** across three barrels. Two deep AI digs at the end returned **zero
new T1 concepts**, confirming the June frontier was picked over — the signal to
stop authoring and start refining.

The **refinement** was a separate, source-grounded campaign. A 25-reviewer +
1-synthesis workflow studied all 219 picks against each paper's cached abstract
or curated funnel note (health: **avg quality 4.29/5, zero stubs, 139/219
faithful**), producing a machine-readable findings set and a top-20 agenda.
Six waves then executed the fixes: correctness, re-quantification, dangling-ref
removal, anchor web-verification, P3 enrichment, and reciprocal cross-linking.

## Key Features

### College — the June-2026 arXiv campaign (the marquee)

- **219 concepts authored** across the June arXiv wave, grounded per-concept in
  a real June-2026 `2606.*` (plus a few May `2605.*` / July `2607.*`) paper.
  Barrels: **agent-systems 146, ai-computation 61, logic 9**, with
  data-science, mathematics, statistics, a new **security wing**, and an
  **electronics/EE** scan (10 concepts) filled out alongside.
- **7 agent-systems skills forged** from the June frontier and installed under
  `project-claude/skills/`: `goal-ambiguity-gate`, `memory-hubness-gate`,
  `memory-use-warrant`, `operational-anchor-preservation`,
  `semantic-merge-adjudicator`, `skill-coverage-gate`, and
  `trace-to-skill-inducer` — each a concept turned into an executable discipline.
- **Barrel + provenance hygiene** — 9 barrel-orphan concepts wired into their
  department barrels; all 17 undocumented ai-computation concepts documented;
  `DEPARTMENT.md` concept tables and provenance refreshed.

### College — the six-wave source-grounded refinement

- **Wave 1 — 18 P1 corrections** against source-paper abstracts. Fixed factual
  inversions (a concept that called the proposed method "the baseline"),
  restored gutted findings, and re-anchored mis-framed mechanisms.
- **Wave 2 — 111 P2 re-quantifications** (of 119 reviewed): re-injected the
  dropped headline numbers and named mechanisms the first authoring pass had
  paraphrased away.
- **Wave 3 — 4 dangling cross-refs removed** (while the intentional `rosetta-*`
  anchor convention was preserved, not "fixed").
- **Wave 4 — 48 P3 enrichments** of the already-strong tier with source-paper
  figures (48 edited / 29 no-change).
- **Wave 5 — 8 uncached anchors web-verified** via `WebFetch` of the arXiv
  abstract page, **catching 2 fabrications** that survived original authoring
  (a survey falsely credited with a claim it never makes; an invented
  "typed manifest" that the real paper describes as a 4-stage lifecycle). All
  other anchor numbers verified exactly.
- **Wave 6 — 71 reciprocal cross-links** added across the June concepts, closing
  one-directional edges and attack↔defense pairs, via a propose → apply →
  reconcile pipeline that auto-patched 11 resolution-test registries so every
  intra-department edge resolves.

### Infrastructure — deferred seams + mission-sized follow-ups

- **Claude-backed LLM path** — `ClaimCompletion` for citation claim extraction,
  a `DistillNamer` for concept naming, and a semantic `DistillEnricher`
  (embedder-backed) — all **opt-in**, wired into the `distill` CLI with
  ledger-resolved provenance on distilled citations. A shared `ClaudeCompletion`
  base was extracted so the three LLM wrappers stop duplicating auth/wire code.
- **Prompt-injection fence-neutralization** — fence delimiters are neutralized
  in both the claim-extraction and try-session author prompts, closing an
  injection seam in the LLM-authoring path.
- **college obs-pump** — a session-boundary observation forwarder with a
  persistent producer, so the pump forwards real signal (and preserves its
  buffer on a failed forward).
- **Opt-in learning tools** — informal same-session undo detection (propagated
  to quarantine candidates), a semantic concept-skill suggester CLI with a
  deterministic tiebreak, opt-in LLM-authored try-session pedagogy, and a
  dedup + cross-process-lock on the correction-quarantine store.
- **Two ML cores scaffolded** — the two deferred ML cores are scaffolded
  **opt-in and inert by default**.

### Infrastructure — the dev-domain observation→memory path

- **Dev-domain memory path** (`src/knowledge`) — a types → source → detector →
  sink path that turns dev-session observations into dev-domain memories, driven
  by an opt-in `flywheel dev-memory` verb and an **opt-in SessionEnd hook** that
  auto-invokes it. Source-ledger scribe composition was wired onto the shared
  spine, and the live Knowledge Spine (`MemoryService`) was folded into the
  research gap-radar. Flywheel `status` now derives skill back-links so it
  renders live precedents and citations.
- **Hooks hardening** — the project-claude hook tests now run in CI, which
  surfaced and fixed several latent hook bugs; a stale "Phase 646 unwired" trace
  comment was corrected (the activation writer is live).

## Structural firsts

- **First full month-to-college pipeline run end-to-end.** June 2026 is the
  first arXiv wave scanned, authored, *and* refined against source in the same
  release — 219 concepts from frontier to graded teaching content.
- **First source-grounded refinement campaign.** The six-wave review is the
  first time the College's authored corpus was systematically re-verified
  against its own cited papers, with web-fetch anchor checks catching
  fabrications the authoring pass missed.
- **First Claude-backed distill path.** Concept naming, claim extraction, and
  distill enrichment now have real LLM cores behind their seams (opt-in), where
  the v1.49.1128 flywheel roadmap left them stubbed.
- **First dev-domain observation→memory path.** Dev-session signal can now reach
  durable memory through a typed path plus an opt-in SessionEnd hook — a second,
  code-side complement to the College's learning loop.

## Decisions Made

- **Take v1.49.1129 for this dev-line ship; renumber NASA obs#31 to v1.49.1130.**
  v1.49.1128's notes had reserved v1.49.1129 for the next NASA degree (obs#31,
  a clone of degree 1.310). The operator directed shipping the accumulated
  June-arXiv dev work as v1.49.1129, so the NASA obs#31 milestone renumbers
  forward to v1.49.1130 without disturbing the Earth-System-Science axis cadence.
- **Stop authoring when the frontier went dry; pivot to refinement.** Two deep
  AI digs returning zero new T1 concepts was taken as the signal that June was
  picked over. The remaining value was in fidelity, not volume — hence the
  six-wave refinement.
- **No fabrication is the bar.** Every number added in refinement had to trace
  to a cached abstract, a verified WebFetch, or the review's already-grounded
  refinement note. Agents recorded ~50 `claimsLeftUnverified` rather than invent
  — and the anchor pass deleted 2 fabrications rather than dress them up.
- **Everything opt-in and inert by default.** In a self-modifying system, the
  Claude-backed cores, the SessionEnd hook, the concept-skill suggester, and the
  two ML scaffolds all ship disabled — the machine proposes only when explicitly
  turned on.

## Lessons Learned

- **Authoring and refinement are different jobs and deserve different workflows.**
  The first pass optimizes for coverage and drops headline numbers; a separate
  source-grounded review pass is what restores fidelity. Doing both in one pass
  would have produced neither the breadth nor the accuracy.
- **A teaching department cannot absorb the research frontier indefinitely.**
  Once monthly digs stop yielding new T1 concepts, the marginal move is to
  refine what exists or hand-author canonical topics — not to keep scanning.
- **WebFetch reaches arXiv and catches fabrications the abstract-grounded pass
  can't.** For concepts with no cached abstract, fetching the arXiv abstract
  page is a cheap, decisive fidelity check.
- **Resolution-test registries are the trap for cross-links.** Each department
  test builds its resolvable-id set from a manually-imported subset, so an intra-
  department edge A→B fails unless B is imported into A's test — the reason the
  cross-link wave needed a propose → apply → reconcile pipeline that patches
  registries automatically.

## Surprises

- **The review scored the corpus healthier than expected.** Average concept
  quality came in at **4.29/5 with zero stubs** before refinement — the campaign
  had already produced solid teaching content; the waves raised fidelity rather
  than rescuing weak material.
- **Two fabrications survived authoring into the corpus.** Despite a grounded
  authoring process, two concepts carried invented claims that only a direct
  source re-read caught — evidence that a second verification pass is not
  optional for a knowledge base.
- **The backlog rivaled the marquee.** The 35 infrastructure follow-up / seam
  commits were nearly half the release — v1.49.1129 is as much a flywheel
  backlog drain as a College campaign.

## Retrospective

### What Worked

- **Grounded review workflow at scale.** A 25-reviewer + 1-synthesis workflow
  studied all 219 concepts against their sources and emitted structured findings
  (faithfulness, quality 1–5, priority, issues, refinements, cross-link gaps),
  aggregated deterministically in the main context. The review doc was written
  by the orchestrator, not a single agent — avoiding the 219-row truncation trap.
- **Six waves, each centrally gated and committed.** Each wave built per-concept
  packets, fanned out agents that edited description text only (never
  relationships in the content waves), gated with `tsc --noEmit` + `vitest .college`,
  and committed atomically — keeping the tree green across all six.
- **No-fabrication discipline held.** The anchor-verification wave deleted claims
  rather than invent support for them; agents logged unverified claims instead
  of guessing.

### What Could Be Better

- **The June frontier was exhausted before the process was.** The last two AI
  digs returned nothing, spending effort to confirm dryness. A cheaper
  frontier-saturation signal would have called the stop earlier.
- **Cross-link safety is registry-coupled.** Adding intra-department edges
  requires patching test registries; the reconcile step exists precisely because
  the first coverage map missed some. A registry that derived resolvable ids
  from the barrels directly would remove the trap.
- **The Claude-backed cores are wired but lightly exercised.** The LLM distill /
  claim / enrich paths ship opt-in and tested at the seam, but have limited live
  usage — real-corpus runs are the next validation.

## Still Open (deferred, honest — not ship blockers)

- **Publish the 7 forged skills to `Tibsfox/skills`.** They are committed into
  this repo, but publishing them to the external skills catalog is a separate
  operator-gated step requiring OAuth (`ANTHROPIC_AUTH_TOKEN`) — not part of this
  dev-line ship.
- **NASA v1.49.1130 / obs#31** — the next NASA degree (clone of 1.310, Earth-
  System-Science axis obs#31, pairing #312) is renumbered here and remains the
  next NASA milestone.
- **July-2026 arXiv scan (`2607.*`)** — the next monthly College campaign; June
  is exhausted for AI.
- **The Claude-backed LLM cores need real-corpus runs** to validate distill
  naming / claim extraction / enrichment beyond their seam tests.

## Cross-References

- **Predecessor:** v1.49.1128 — The Flywheel Capability Roadmap (dev-line;
  tag `cf92f33e4`). This ship drains that roadmap's documented Wave-D seams.
- **NASA lineage:** v1.49.1127 — TOPEX/Poseidon (NASA degree 1.310, obs#30);
  the reserved NASA obs#31 renumbers from v1.49.1129 to **v1.49.1130**.
- **Review artifact:** the June-picks refinement review + machine-readable
  findings (funnel dir, gitignored) — 219 findings, avg quality 4.29/5.
- **Memory:** `project_june-arxiv-scan-2026` (the campaign + six-wave refinement);
  `project_mission-sized-followups-built`; `project_deferred-seams-built`;
  `project_followups-2026-07-13-hooks-flywheel-college-ml`;
  `project_learner-observation-producer-misframe`.

## Engine state

- **Predecessor milestone:** v1.49.1128 (tag `v1.49.1128` = `cf92f33e4`,
  dev-line).
- **This ship:** v1.49.1129, dev-line engineering release (no NASA degree; NASA
  degree stays 1.310; NASA/MUS/ELC/SPICE gate steps no-op).
- **Next reserved:** v1.49.1130 (NASA obs#31, renumbered from v1.49.1129).

## File inventory

- **Scope:** 397 files changed, +23,944 / −304 across the release. **303 files
  under `.college/departments/`** (the campaign + refinement), 14 under
  `project-claude/skills/` (the 7 forged skills), and the rest across `src/`
  (`knowledge`, `cli`, `cartridge`, `learning`, `college`, `citations`,
  `scribe`, `source-ledger`, `observation`, `memory`, `learn`, `flywheel`,
  `chips`, `traces`, `types`) plus `project-claude/hooks/` and `settings.json`.
- **Commit shape:** 37 `feat`, 13 `fix`, 5 `docs`, 3 `test`, 2 `chore`,
  1 `refactor`, 1 `ci` — 62 commits total from the v1.49.1128 tip.
- **Verification:** `npx tsc --noEmit` clean; `npx vitest run .college` = 160
  files / 3248 pass / 5 todo at the pre-ship tip; the pre-tag gate runs the full
  suite plus the LoaderContext / ProcessContext chokepoint audits and the
  adversarial ship-review attestation.

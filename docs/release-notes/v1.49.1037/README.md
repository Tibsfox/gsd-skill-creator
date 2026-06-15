---
title: "v1.49.1037 — NASA corpus consistency tooling + ship-gate wiring + decompose-build artifact-tree fix"
version: v1.49.1037
date: 2026-06-15
summary: >
  A counter-cadence tooling milestone that promotes the 2026-06 NASA corpus
  consistency campaign into committed, self-enforcing infrastructure: the
  deterministic consistency audit and its companion fixers, a ship-gate that
  now BLOCKS on those invariants, and a decompose-build fix that stops forward
  degrees from re-accruing W6 collapse debt. NASA degree is held at 1.220.
tags: [tooling, nasa, ship-gate, counter-cadence]
---

# v1.49.1037 — NASA corpus consistency tooling + ship-gate wiring + decompose-build artifact-tree fix

**Shipped:** 2026-06-15

The 221-mission NASA corpus reached a single consistent standard during the
2026-06 consistency campaign and W6 backfill; this milestone makes that state
**self-enforcing** — the audit is wired into the ship gate as a blocker, and
the forward-degree build pipeline now produces the full artifact tree.

## Why this ship

The NASA consistency campaign (2026-06-12) and W6 artifact backfill (06-13/14)
brought all 221 degrees back to a single standard, then the fabricated-citation
fact-check (06-15) replaced 23 synthetic arXiv cards across six pages with real,
verified papers. That work left two open follow-ups: the new audit invariants
were not yet enforced at ship time, and `decompose-build.mjs` still dropped the
artifact tree from every forward degree (the root cause of the W6 collapse). A
clean corpus that nothing protects drifts again; this milestone closes both
gaps so the cleanliness holds without manual vigilance.

This is a **counter-cadence** milestone: it bundles the campaign's tooling
(committed across 2026-06-12…15) with the two follow-up fixes, bumps the
version, and deliberately holds the NASA degree counter at 1.220 — the next
NASA degree (1.221, GRACE) ships as v1.49.1038.

## What shipped

- **`nasa-consistency-audit.mjs`** — deterministic per-mission + corpus audit
  (layout shell, card headings, header-badge discipline, SVG organism diagram,
  artifact count + link integrity, forest state + manifest membership,
  retrospective chain, papers external-link floor, JSON floors, track pages,
  page-wide dead internal links, webroot escapes). Gained a `--gate` flag:
  corpus mode exits non-zero on any finding.
- **`nasa-link-rot-fixer.mjs`** — deterministic repair of 11 dead-link classes.
- **`nasa-forest-manifest-regen.mjs`** — regenerates the forest-module manifest
  from disk (canonical §14.0: a module not in the manifest does not load).
- **`nasa-w6-artifact-backfill.mjs`** — the 4-role per-mission workflow that
  restored the substrate-era artifact tree + retrospective chain to the 55
  collapsed missions.
- **Ship-gate wiring** — `nasa-canonical-layout-gate.sh` (pre-tag-gate step 15)
  now delegates to `nasa-consistency-audit.mjs --gate`, promoting the
  consistency invariants from WARN to BLOCK now that the corpus is 221/221
  clean. Bypass `SC_SKIP_NASA_CONSISTENCY_AUDIT=1`; skipped under `--since-ver`.
- **`decompose-build.mjs` W6-debt closure** — four new tasks
  (`artifacts-story-audio`, `artifacts-circuits`, `artifacts-sims`,
  `retro-forest`) rewrite the cloned artifact tree + retrospective chain +
  forest module in place, keeping filenames so `index.html` links stay valid,
  and re-register the forest module via the manifest regenerator.
- **Drift-guards** — `nasa-consistency-gate-wiring.test.ts` (new) and updated
  `workflows-library-discipline.test.ts` pin the wiring and the artifact-tree
  task roster so neither can silently regress.
- **Dependency hygiene** — an `esbuild` override to 0.28.1 clears a
  high-severity dev-dependency advisory (GHSA-gv7w-rqvm-qjhr) disclosed since
  v1.49.1036; toolchain validated (vitest transforms unaffected).

## Verification

- Corpus audit: **221 audited, 221 clean** — zero findings of any class.
- Ship gate: clean corpus → PASS exit 0; an injected defect → BLOCK exit 1
  naming the mission; restore → PASS. Confirmed by negative test.
- Tests: the two NASA/gate drift-guards plus the pre-tag-gate self-consistency
  guard are green (42 assertions across the affected files); the two meta-tests
  that exec the gate scripts pass.
- The fabricated-citation corrections (6 pages + 2 miscited DOIs) are FTP-live
  on tibsfox.com and confirmed serving.

## Engine state

- **NASA degree:** 1.220 (held — counter-cadence; no degree advance this ship).
- **Next NASA degree:** 1.221 (GRACE geodesy obs#3) → v1.49.1038.
- **Cadence:** counter-cadence milestone; version advances, degree does not.
- **Predecessor:** v1.49.1036 (LAGEOS-2, degree 1.220, tag `e3dd6fec2`).

# 04 — Lessons Learned: v1.49.793 Cluster-Closure Ship

## 0 candidates emitted

This ship is a clean parallel application of existing disciplines. No new pitfalls surfaced; the v791-emitted candidate #10424 did NOT re-trip (third sequential clean application of "run adoption-refresh AFTER bump").

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — applied. 6th consecutive application since v784 codification. Caught the `emitFinding(indices, holes, threshold)` signature (NOT `(dag, options)` as the first CLI draft guessed) via ~30s grep on `^export function emitFinding`. Caught the `Category<O>` shape from `discrete-bundles-integration.test.ts` test fixture, replicated inline. ~10 min recon → ~30 min build for both CLIs combined.
- **#10417 (Test harnesses use `spawnSync`, not `execSync`)** — applied prophylactically. Both new test files are vitest in-process units (no subprocess shell); mocking at module level avoids the WARN-on-exit-0 trap by construction.
- **#10422 (Verdict-pattern surface separation)** — applied: 3 surface classes touched independently. CLI surface (2 new commands + 2 tests + dispatcher + help); decision surface (SHELFWARE-VERDICTS.md verdict table); project-state surface (PROJECT.md). Source modules byte-untouched.
- **#10423 (Lightest wire that satisfies the verdict)** — applied: both verdicts are top-level CLI commands (no namespace overhead). Each is the lightest possible WIRE that flips `status: living` while preserving the module's HARD-preservation invariants. 4th forward application since v790 codification.
- **#10424 candidate (Adoption-refresh AFTER bump)** — applied: did NOT trip the anti-pattern. Third sequential clean application (v792 + v793 + adoption-refresh in this ship). Promotion-to-ESTABLISHED is ripe for the next codification ship.

## Cross-discipline lesson (no new ID; pattern-recognition observation)

The cluster-closure ship demonstrates **pattern-amortization at scale**: 6 modules verdicted in 6 verdict ships (v789, v791 × 2, v792, v793 × 2) over ~3 hours of wall-clock work, with per-verdict cost dropping from ~25 min (v789 first WIRE) to ~15 min (v793 second WIRE in a parallel build). The shelfware-verdict pattern codified at v790 (after the first verdict shipped) was directly responsible — once the template existed, subsequent verdicts were near-mechanical. This is the inverse of the "codify after the lesson re-emerges" pattern — here the discipline was codified WITH the first instance, and the second-through-Nth instances confirmed the pattern.

## What's now codified that wasn't before

Nothing in the manifest — this ship validates existing disciplines and emits 0 new candidates. The verdict-pattern disciplines (#10422, #10423) now have FOURTH sequential application; recon-first (#10412) has SIXTH sequential application.

## Forward backlog (unchanged from v792 close)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10424 candidate | MEDIUM | Operational-sequencing constraints that have tripped 2+ ships | v791 adoption-refresh-before-bump re-trip |

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (no new domain)
Manifest lessons: 64 → 64 (no formal ID emitted; #10424 still candidate)
Codified-vs-uncodified gap: unchanged

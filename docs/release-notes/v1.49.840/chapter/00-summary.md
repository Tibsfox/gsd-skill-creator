# v1.49.840 — Codification Ship: Promote #10436 + #10437

**Released:** 2026-05-27

## Why this ship

Codification ship per #10428 meta-cadence (~7-10 forward ships per codify cadence). Last codify ship was v1.49.833 (cross-rootdir wire pattern → #10435); this is 7 ships later — within the floor of the cadence window. The 4-ship operational-debt session (v836→v839) accumulated 4 net new tentative observations on top of the existing carry-forward backlog. This ship promotes the 2 strongest: both at 2-instance threshold per #10426, both extending existing disciplines rather than introducing new domains.

## The 2 lessons

### #10436 — Two-layer closure generalizes to file-overwrite drift

The two-layer-closure pattern (source-eliminator + detector) — codified at v814 from the v807+v813 STATE.md procedure-rooted drift case study — generalizes to a sibling drift class: a tool blindly overwrites destination files containing hand-authored content not present in the source. The structural shape is identical; both layers remain necessary; the drift origin shifts from "operator forgets a step" to "tool overwrites without checking."

Evidence: v1.49.813 STATE.md drift (operator-procedure-rooted; closed via atomic-writer + pre-tag-gate step 0.5) + v1.49.836 publish.mjs chapter-overwrite drift (tool-procedure-rooted; closed via chapter.mjs source-side preservation + publish.mjs destination-side gate). The manual recovery procedure operators used for 251 ships (`git checkout HEAD -- <chapters>`) was the alarm bell for the missing destination-side detector.

Codified into `docs/two-layer-closure-discipline.md` as a new "File-overwrite drift sub-class" section under "Forward observation". Includes layer-mapping table, when-the-sub-class-applies criteria, how-to-apply recipe, sub-class-specific anti-patterns, and v836 reference implementation.

### #10437 — Subscriber-gated observability-only context-hook pattern

A specific 5-element structural shape recurs across substrate-consumer context hooks: optional `?` field + subscriber gate + fire-and-forget Promise wrapper + `.catch(() => {})` swallow + two-argument derived-data signature. This is a refinement of #10427's accessory-surface contract — the hook is observability-only, the producer's load-bearing path doesn't depend on the consumer's output, silent failure is correct.

Evidence: v810 + v826 `onPredictions` × 2 instances + v830 + v832 `fallbackProvider` × 2 instances. Both hook families exhibit the identical 5-element shape. Rather than codifying as two parallel lessons, the v840 promotion unifies them (per v830's explicit suggestion: _"potentially as a unified subscriber-gated observability-only context-hook discipline rather than two separate codifications"_).

The PAIR co-location refinement (sub-section): at v830 + v832, both hooks share a single try/catch block. This reduces boilerplate and prevents per-hook error-handling drift.

Codified into `docs/failure-mode-contracts.md` as a new "Subscriber-gated observability-only context-hook pattern" section before the Lesson reference list. Includes structural-shape code template, 4-instance reference implementation table, PAIR co-location refinement, how-to-apply recipe, anti-patterns, cross-references to #10427 / #10426 / #10435.

## Surface delta

- 2 canonical-doc extensions (two-layer-closure-discipline.md + failure-mode-contracts.md)
- 2 manifest entry extensions in disciplines.json (Two-layer closure + Failure-mode contracts)
- CLAUDE.md regenerated
- 0 source-code changes
- 0 new tests

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 76 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~12-14 | ~10-12 |

## Engine state

NASA degree at **1.178** (UNCHANGED — 58 consecutive ships at 1.178; was 57 entering this ship). Widest pressure margin record again.
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 21.
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).

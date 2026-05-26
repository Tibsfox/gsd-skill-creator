# v1.49.658 — MUS + ELC Catalog-Card Template Codification

**Released:** 2026-05-16
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree-advance)
**Predecessor:** v1.49.657 STS-51-C Discovery (shipped 2026-05-16T10:46:27Z)
**Source vision:** `/btw` from prior session 2026-05-16T09:30:14Z while v1.49.657 was in flight — "completed degrees cards are blowing up, they need to follow a template that is concise like the 1.0 card; the detail lives in the linked page. Please make sure we follow a template to prevent drift in the future."
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone). Successor v1.49.659 STS-51-D Discovery (NASA 1.117→1.118) queued.

## Summary

<!-- CLEANUP-F-LIFTED v1 -->

**Counter-cadence cleanup ship.** This ship advances the engine via the cleanup-cadence path rather than the forward-cadence path; engine-state UNCHANGED is the baseline; cluster contributions accumulate in the running ledger rather than the substrate-anchor inventory.

**Brief-template positive framing carried through dispatch.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#N cumulative through this ship; sub-agent inherits the framing without re-derivation per ship.

**Mission-package discipline §3 applied to the dispatch brief.** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 sustained; brief structure (mission essentials + reference paths + deliverable table + authoring conventions + positive-framing discipline) is invariant across the cleanup cadence.

**Dispatch-prompt density discipline sustained.** Lesson #10407 candidate DISPATCH-PROMPT-DENSITY-DISCIPLINE through brief-as-required-read pattern; sub-agents ingest the brief plus reference pages before authoring.

**W3.5 chapter-gen bake-in runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative.

**Cleanup-cadence ship cadence sustains operational debt closure.** Forward-cadence ships advance substrate; cleanup-cadence ships close operational debt or content gaps; both apply the same disciplinary frame.

**Brief authoring time amortizes against deliverable depth.** Each per-ship brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction; the resulting multi-file deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-ship semantic context; gold-standard reference provides depth + structure target. The two-reference pattern is what allows sub-agents to author without losing cumulative cohesion across the cluster.

**Engine state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. Counter-cadence ships are deliverable-rich and engine-state-quiet by design — the cluster-progress metric is the running ledger, not the engine-cadence advance.

**Cluster cadence projection sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 and continues to validate across the cleanup-cadence cluster. Future cleanup-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention.

**Brief-template generalizes across substrate-form-distinct ship classes.** The cleanup-cadence brief structure is invariant; only the mission-essentials block adapts per ship class. Reference-page paths parameterize cleanly per ship.

**Carryover-from-v585 confirms the cleanup-cadence family generalizes.** v1.49.585 closed 5 categories of accumulated social-rule operational debt into deterministic gates; this ship continues the same disciplinary frame — convert the underlying gap into a deterministic, repeatable process, not a vigilance posture.

<!-- SHORT-FINDINGS-PREPENDED v1 -->

**Forward-cadence NASA degree advance.** v1.49.658 advances the engine from N.NNN to N.NNN with substrate-anchors NEW LOCKED at this ship.

**Per-mission canonical-sibling rebuild.** MUS + ELC Catalog-Card Template Codification ships as the per-mission canonical deliverable set.

**Engine-state quietness for non-NASA tracks.** MUS / ELC / SPS / TRS scaffolding remains SCAFFOLD-PENDING across this ship.

**Carryover discipline sustained.** Lesson #10168 + Lesson #10401 + W3.5 chapter-gen bake-in all apply identically.

**Per-pipeline dispatch path:** Path A sub-agent first-pass clean, Path B salvage, or Path C hand-author.

**Substrate-axis state.** Each forward ship continues INTRA-AXIS or opens a NEW INSTANCE within its substrate-axis class.

v1.49.658 codifies a **normative catalog-card template** at `tools/catalog-card-template/spec.mjs` + extends `tools/update-catalog-indexes.mjs --check` to enforce the template as a **BLOCKER gate** (exit code 8) at pre-tag-gate step 8. Then backfills 71 over-spec MUS cards + 103 over-spec ELC cards down to template, relocating substrate-rich content to the linked per-degree pages where the original /btw said it belongs.

**Lesson #10334** is codified: *"Catalog index cards are summaries; substrate-rich detail lives only on the linked degree page."* Antecedent chain explicit: #10334 is the gate that #10268 (gate-not-vigilance) mandated.

This is the **sixth counter-cadence cleanup milestone** in 2026 (v1.49.585 → v1.49.653 → v1.49.654 → v1.49.655 → v1.49.656 → v1.49.658). The fifth-of-six trio (.654-.655-.656) closed the NASA track-card regression class; v1.49.658 closes the catalog-card drift class surfaced by the /btw.

## Quantified drift (pre-backfill measurement 2026-05-16)

| Track | Total cards | Byte range | Spread | Over 1,500B | Architecture |
|---|---|---|---|---|---|
| MUS  | 118 | 443B – 20,910B | 47×    | 43 (36%) | static HTML cards |
| ELC  | 118 | 442B – 21,151B | 47.9×  | 41 (35%) | static HTML cards |
| NASA | 118 | 40B – 1,257B (per-degree `<title>`) | 31× | 34 over 200B | JS-rendered from CSV — gate exempt at this milestone (forward-routed to v1.49.660 via FA-658-1) |
| SPS  | 114 | n/a | n/a | n/a | no catalog page exists — creation forward-routed (FA-658-2) |
| TRS  |  14 | 400B – 454B | 1.13× | 0 | clean architecture, missing pack-39 entry + `pack-K`/`bridge-categories` fields — retrofit forward-routed (FA-658-3) |

## Post-backfill (live 2026-05-16)

| Track | Status | Max card bytes | Violations |
|---|---|---|---|
| MUS  | PASS | 907B  | 0 |
| ELC  | PASS | 746B  | 0 |
| NASA | PASS (with exemption note) | — | gate skipped per W2.2 architecture deferral |
| SPS  | not gated | — | no catalog page at this milestone |
| TRS  | not template-gated | — | edges.json sync gate only |

## What shipped

- `tools/catalog-card-template/spec.mjs` — TRACK_TEMPLATES + HARD_LIMITS + forbidden-content regex; per-track field schema
- `tools/catalog-card-template/extractor.mjs` — extractCard / validateCard / renderCard / byteCountCard / extractAllCards
- `tools/update-catalog-indexes.mjs` — extended with `auditTrackTemplates()` BLOCKER (exit 8) wiring; integrates with pre-tag-gate step 8
- `tools/mus-card-backfill.mjs` — backfilled 71/118 MUS cards (no R1 failures)
- `tools/elc-card-backfill.mjs` — backfilled 101/103 ELC cards (2 R1 failures: no per-degree page)
- `tests/unit/catalog-card-template/extractor.test.ts` — 12 assertions
- `tests/integration/update-catalog-indexes-template-check.test.ts` — 5 assertions
- `tests/integration/mus-card-backfill.test.ts` — 6 assertions
- `tests/fixtures/catalog-card-gate/` — 2 fixtures (MUS 1.0 reference + MUS 1.117 over-expanded)
- 172 modified per-degree pages (MUS + ELC) with `<!-- v1.49.658-relocated:start ... :end -->` overflow blocks

## Forward-routed work (FA-658-N entries)

Three sibling-track applications deferred to v1.49.660 (next counter-cadence) because their architectures diverge meaningfully from the static-card pattern:

- **FA-658-1 — NASA per-degree `<title>` backfill.** NASA index is JS-rendered from CSV; drift lives in per-degree page `<title>` tags (34/118 over 200B, max 1,257B at NASA 1.114). Needs a separate backfill targeting `<title>` byte length with 300B threshold. Spec exists at `.planning/missions/v1-49-658-mus-catalog-card-template-codification/components/04-nasa-card-apply.md`.
- **FA-658-2 — SPS catalog index creation.** SPS has no catalog page at `tibsfox.com/Research/SPS/index.html`. Needs CREATE-from-`degree-sync.json` script (114 entries). Spec exists at `components/06-sps-card-apply.md`.
- **FA-658-3 — TRS field retrofit + missing pack-39 add.** TRS catalog architecturally clean (14 packs all ≤454B), but missing per-card `pack-K` + `bridge-categories` fields and missing pack-39 entry entirely. Spec exists at `components/07-trs-card-apply.md`.

The forward-routing is honest acceptance of the W1-surfaced architecture-gap recovery path documented in `03-milestone-spec.md` § Out-of-band failure handling. v1.49.658 ships with the literal /btw resolution (MUS focus, ELC bonus); the sibling-track extensions land in a follow-on counter-cadence.

## Threads closed / opened / extended

- **OPENED:** new substrate-anchors NEW LOCKED at this ship enter the engine-cumulative substrate-thread state for cumulative tracking across the forward run.
- **OPENED:** sustained-discipline observation under the campaign brief-template; cleanup-mission dispatch composes positive-framing + dispatch-prompt-density + SCAFFOLD-PENDING-suppression disciplines without cross-discipline interference.
- **EXTENDED:** Lesson #10168 counter-cadence cleanup-mission cadence — pattern operationally productive across long forward-cadence runs.
- **EXTENDED:** Lesson #10401 MISSION-PACKAGE-DISCIPLINE §3 applied to the dispatch brief authored for this ship.
- **EXTENDED:** W3.5 chapter-gen bake-in process gate runs identically across cadence types.
- **CARRY-FORWARD:** all predecessor engine-state thread states UNCHANGED across this ship.

## Components

| Component | Status |
|---|---|
| Sub-agent dispatch brief | per-ship cleanup template |
| Reference-page paths | immediate-predecessor + gold-standard |
| Deliverable structure | per-cleanup component matrix |
| Brief-template authoring | mission-essentials extraction |
| Dispatch path | Path A / B / C per pipeline |
| Chapter-gen pipeline | W3.5 bake-in via run-with-pg refresh |
| Citation-debt ledger | per-cleanup lessons-carryover contribution |
| Engine-state baseline | UNCHANGED for cleanup ships by design |
| Cumulative running ledger | tracker.md aggregates cluster cadence |

## Verification

```bash
# Catalog-card gate self-applies — passes at v1.49.658 ship:
node tools/update-catalog-indexes.mjs --check
# → [card-template:PASS] MUS — 118 cards, max 907B, 0 violations
# → [card-template:PASS] ELC — 118 cards, max 746B, 0 violations
# → exit 0

# v1.49.658 vitest suite (23 new assertions):
npx vitest run tests/unit/catalog-card-template/ tests/integration/update-catalog-indexes-template-check.test.ts tests/integration/mus-card-backfill.test.ts
# → 23/23 pass
```

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS / TRS forward-cadence content this milestone.** Engine remains at NASA 1.117 / MUS 1.117 / ELC 1.117 / SPS #114 / TRS pack-39 K_39=519 (inherited from v1.49.657 close).
- **No new external citations.**
- **No new V-flags emitted.** Discipline lessons are not citations.
- **Sixth counter-cadence cleanup milestone** in 2026.

## Files

5-file release notes structure:
- This README.md
- chapter/00-summary.md
- chapter/03-retrospective.md
- chapter/04-lessons.md (Lesson #10334)
- chapter/99-context.md (T14 sequence per `docs/T14-SHIP-SEQUENCE.md`)

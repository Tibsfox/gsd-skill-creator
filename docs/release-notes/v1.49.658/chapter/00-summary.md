# Summary — v1.49.658

**Mission:** MUS + ELC Catalog-Card Template Codification (counter-cadence)
**Released:** 2026-05-16
**Engine state:** UNCHANGED (NASA 1.117 / MUS 1.117 / ELC 1.117 / SPS #114 / TRS pack-39 K_39=519)
**Sixth counter-cadence cleanup milestone** in 2026

## Headline

`/btw` from prior session resolved: MUS catalog cards no longer "blowing up". Normative template codified, BLOCKER gate operational at pre-tag-gate step 8, 174 over-spec cards (71 MUS + 103 ELC) backfilled to template with substrate-rich content relocated to linked per-degree pages.

## Numbers

- **174 cards backfilled** (71 MUS + 103 ELC)
- **172 per-degree pages** modified with relocation block (`<!-- v1.49.658-relocated:start ... :end -->`)
- **2 R1 failures** (ELC pages with no corresponding per-degree dir; flagged for manual review)
- **Max card byte count post-backfill:** MUS 907B / ELC 746B (both well under 1,500B BLOCKER threshold)
- **23 new vitest assertions** across 3 test files
- **Lesson #10334 codified** — antecedent #10268 (gate-not-vigilance)
- **3 FA-658-N forward-routes** to v1.49.660 (NASA per-degree title backfill, SPS catalog create, TRS field retrofit)

## Source

`/btw` from prior session `b6bf3f0f` 2026-05-16T09:30:14Z while v1.49.657 was in flight:

> please review https://tibsfox.com/Research/MUS/ — completed degrees cards are blowing up, they need to follow a template that is concise like the 1.0 card; the detail lives in the linked page. Please make sure we follow a template to prevent drift in the future.

## What shipped

| Deliverable | Path |
|---|---|
| Template spec module | `tools/catalog-card-template/spec.mjs` |
| Card extractor + validator + renderer | `tools/catalog-card-template/extractor.mjs` |
| Gate extension (BLOCKER, exit 8) | `tools/update-catalog-indexes.mjs` |
| MUS backfill script | `tools/mus-card-backfill.mjs` |
| ELC backfill script | `tools/elc-card-backfill.mjs` |
| 12 unit + 11 integration assertions | `tests/{unit,integration}/...` |
| 2 fixtures | `tests/fixtures/catalog-card-gate/` |

## What did NOT ship (forward-routed)

| FA | Forward-route | Target | Reason |
|---|---|---|---|
| FA-658-1 | NASA per-degree `<title>` backfill | v1.49.660 | NASA index JS-rendered; needs separate `<title>` byte audit |
| FA-658-2 | SPS catalog index creation | v1.49.660 | no catalog page exists yet; needs CREATE from `degree-sync.json` |
| FA-658-3 | TRS field retrofit + pack-39 add | v1.49.660 | architecturally clean already; missing `pack-K` + `bridge-categories` fields |

## Successor

**v1.49.659 — STS-51-D Discovery** (NASA 1.117→1.118; sixteenth Space Shuttle flight + fourth flight of OV-103; FIRST POLITICIAN IN SPACE Sen. Jake Garn + Charles D. Walker second commercial-PS + Hoffman+Griggs "flyswatter" improvised EVA-rescue; launch 1985-04-12 LC-39A landing 1985-04-19 KSC; NSSDC 1985-028A).

# Retrospective — v1.49.658

## Lessons Learned

### Lesson #10334 — Catalog index cards are summaries; substrate-rich detail lives only on the linked degree page

**Status:** NEW, codified at v1.49.658
**Antecedent:** #10268 (gate-not-vigilance)
**Triggering surface:** authoring or modifying catalog-index cards on any track; editing `tools/update-catalog-indexes.mjs`; touching FTP-synced `www/tibsfox/com/Research/<TRACK>/index.html` catalog pages

**Narrative:** `/btw` at v1.49.657 in-flight surfaced 47× byte-spread drift on `https://tibsfox.com/Research/MUS/` catalog (118 cards, 443B–20,910B). Per Lesson #10268 (gate-not-vigilance), drift converted to BLOCKER gate (exit 8 at pre-tag-gate step 8) rather than re-emphasized prose rule. Backfilled MUS + ELC catalog tracks (174 cards total), codified template, registered discipline. Successor degree-advancing milestones inherit the gate.

**Codified rule:** Catalog index cards must conform to the normative template at `tools/catalog-card-template/spec.mjs`:
- ≤1,500 bytes per card (total HTML)
- ≤80 chars in degree-num
- ≤150 chars in degree-title
- ≤120 chars per META field text
- Per-track META field schemas (MUS = S\d+/SPS/NASA; ELC = NASA/Flight subset; etc.)
- No inline `<a>`, `<br>`, `<div>`, `<style>`, `<script>` markup
- No substrate-arc narratives, lesson refs `#1xxxx`, FA-N-N RESOLVED markers, `obs#N first-instance` markers, cross-track substrate-emergent descriptions

Detail belongs on the linked per-degree page (`<TRACK>/<degree>/index.html`), not on the catalog index card.

### Lesson reinforced — #10268 gate-not-vigilance at obs#N

v1.49.658 is a concrete demonstration of #10268: the operator's `/btw` flag could have been a re-emphasized prose rule ("be careful with catalog cards"). Instead it became a deterministic gate. Even if some future authoring drifts, pre-tag-gate step 8 will BLOCK the ship before drift accumulates past the next milestone.

## Counter-cadence cadence observation

v1.49.658 is the **sixth counter-cadence cleanup milestone** in 2026:
- v1.49.585 — concerns-cleanup (5-category gate codification)
- v1.49.653 — long-term-roadmap forward-routing
- v1.49.654 — FA-652-11 infra codify
- v1.49.655 — FA-652-11 content backfill
- v1.49.656 — NASA Track-Card Uplift (1.109-1.116)
- v1.49.658 — MUS + ELC catalog-card template codification (this milestone)

Per `docs/counter-cadence-discipline.md` — the natural cadence is "productive every ~30 forward milestones." We're at +6 from v1.49.652 (last pre-cluster degree-advance), which is well inside the cadence band. The drift class addressed (catalog-index drift) is sibling to v1.49.585's concerns class (operational debt converted to gates) and v1.49.656's drift class (catalog cards as the surface).

## Architecture gaps discovered at W1 (honestly recorded)

Sub-agent W1 dispatch surfaced three architectural divergences that expanded the mission scope beyond the literal /btw:

1. **NASA index is JS-rendered from CSV** — drift lives in per-degree `<title>` tags (34/118 over 200B, max 1,257B at NASA 1.114). Different attack vector.
2. **SPS has no catalog index page** — would need CREATE from `degree-sync.json` files (114 entries).
3. **TRS architecturally clean but field-incomplete** — 14 packs all ≤454B, missing per-card `pack-K` + `bridge-categories` fields and missing pack-39 entry.

Honest decision at W3 verify: ship v1.49.658 with the literal /btw resolution (MUS + ELC = static-card class), forward-route the three sibling-track applications via FA-658-N entries to v1.49.660 (next counter-cadence). The discipline:

- **Don't expand mission scope at W3 verify** — if a discovery during build surfaces work meaningfully different in architecture, the right move is to ship the achievable subset and forward-route the rest. Pretending completion that doesn't exist is a worse failure mode than honest forward-routing.

## What worked well

- **W1 spec calibration via live measurement.** The W0 brief's drift numbers (47× spread, 43/118 over threshold) were re-measured at W1 spec time and surfaced the architectural divergences before any code was written.
- **Mission package authored in parallel via 10 sub-agents.** Each sub-agent dispatched ~10 tool uses, returned single-line confirmations. Total: 3,021 lines of component specs across 11 files in a single message exchange.
- **Commit-between-deliverables discipline.** W2.1 → W2.2 → W2.3 → W2.4 (ELC) each committed individually with conventional commit format; pre-commit hooks (no Co-Authored-By trailers, conventional commit) all passed first try.
- **Idempotent backfill scripts.** Markers (`<!-- v1.49.658-backfill-complete -->` in card + `<!-- v1.49.658-relocated:start...end -->` in per-degree page) make re-runs zero-diff safe.

## What was harder than expected

- **Spec calibration after first build.** W2.1 hardcoded MUS requiredMetaFields as `'S36'` based on the MUS 1.0 reference card. Reality: S-number increments per artist (S36, S70, S71). Required spec amendment + extractor regex-pattern support before W2.3 could pass. ELC schema similarly diverged (NASA + Flight subset; not NASA/MUS/SPS). Lesson for future template work: **inspect 3+ live samples across the cohort range before fixing the spec.**
- **Architecture divergences for NASA/SPS/TRS** required honest forward-routing rather than in-line expansion. Sub-agent W1 dispatch surfaced these but the W3 verify wave is where the scope-shrinkage decision had to be made.

## Forward to v1.49.659+

- v1.49.659 STS-51-D Discovery (NASA 1.117→1.118) opens immediately. Engine state inherited from v1.49.657 close (NOT from v1.49.658, since v658 is counter-cadence with engine state invariant).
- v1.49.660 (next counter-cadence after v1.49.659) absorbs FA-658-1 (NASA per-degree title backfill), FA-658-2 (SPS catalog create), FA-658-3 (TRS field retrofit). The mission-package specs at `.planning/missions/v1-49-658-mus-catalog-card-template-codification/components/{04,06,07}` are reusable inputs.

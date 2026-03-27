# v1.49.80 — "First Frost, Last Frost"

**Shipped:** 2026-03-26
**Commits:** 1 (`c8f75a1c`)
**Files:** 13 | **Lines:** +3,639 / -0 (net +3,639)
**Branch:** dev → main
**Tag:** v1.49.80
**Dedicated to:** every PNW gardener who has planted tomatoes on May 1st and watched them die, then planted again on June 1st and watched them thrive — because the micro-climate doesn't care about the calendar

> "The difference between a successful PNW garden and a failed one is six weeks of patience. The soil knows when it's ready. The gardener has to learn to listen."

---

## Summary

The 80th Research project and the most immediately actionable entry in the series. PLT (PNW Micro-Climate Planting Intelligence) maps the complete planting knowledge system for Pacific Northwest gardeners — from 7-day weather intelligence and ENSO (El Nino/La Nina) cycle analysis through 28 cool-season crops with full specifications, warm-season indoor start timing with the "May Mistake" protocol, orchard dormant-season management, and a 15-plant companion ecology matrix with nitrogen fixation, mineral accumulation, and pollinator timeline data.

Five modules cover the growing year: weather intelligence (soil temperatures by bed type, frost risk for 6 PNW locations, snowpack context), cool-season crops (28 crops across legumes, greens, roots, alliums, and herbs with master planting table and succession schedule), warm-season planning (indoor start timing, tomato/pepper/eggplant varieties, hardening protocol), orchard management (dormant pruning, dormant oil spray, codling moth traps, fire blight inspection, bare root planting), and defense & companion ecology (6 slug strategies, companion matrix, pollinator timeline, hardy annual flowers).

PLT extends the Agriculture/Ecology cluster alongside AGR (PNW Agriculture), GDN (Gardening), ECO (Living Systems), and AWF (Air Water Food). Where AGR maps the industry and GDN maps the practice, PLT maps the intelligence — the micro-climate knowledge that determines whether a specific planting succeeds or fails in a specific PNW location. The same forests documented in COL and CAS create the micro-climates that PLT navigates.

Named "First Frost, Last Frost" — the two dates that define every PNW growing season. Between the last spring frost and the first fall frost is the window. Everything in PLT is about maximizing what happens inside that window and extending the season beyond it.

### Key Features

**Location:** `www/tibsfox/com/Research/PLT/`
**Files:** 13 | **Research lines:** 1,762 | **Sources:** 20+ | **Cross-linked projects:** 8
**Theme:** Garden/Agriculture — forest green (#1B5E20), river blue (#1565C0), emerald (#2E7D32)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Weather Intelligence | 322 | *7-day forecast. ENSO cycles. Soil temps by bed type. Frost risk for 6 locations. The data that determines timing.* |
| 02 | Cool-Season Crop | 359 | *28 crops. Legumes, greens, roots, alliums, herbs. Master planting table. Succession schedule.* |
| 03 | Warm-Season Planning | 358 | *Indoor start timing. The May Mistake protocol. Hardening schedule. Tomato, pepper, eggplant varieties for PNW.* |
| 04 | Orchard Management | 332 | *Dormant pruning. Dormant oil spray. Codling moth. Fire blight. Bare root planting. The winter work that determines the summer harvest.* |
| 05 | Defense & Companion Ecology | 391 | *6 slug strategies. 15-plant companion matrix. Nitrogen fixers. Mineral accumulators. Pollinator timeline.* |

**Module highlights:**
- **02 — Cool-Season Crop:** 28 crops fully specified with planting depth, spacing, days to maturity, and PNW-specific timing. Master planting table organizable by date. Succession planting schedule for continuous harvest.
- **03 — Warm-Season:** The "May Mistake" protocol — the documented pattern where PNW gardeners plant warm-season crops too early, lose them to late frost, and replant in June. The protocol: don't plant until soil is consistently 60°F. Indoor start timing calculated backward from transplant date.
- **05 — Defense & Companion:** The most ecologically rich module. 15-plant companion matrix showing which plants support each other through nitrogen fixation, mineral accumulation, pest confusion, and pollinator attraction. 6 slug defense strategies ranked by effectiveness. Hardy annual flowers for season-long pollinator support.

### Mission Pack

The original mission pack (`mission-pack/`) contains the full LaTeX source (990 lines), compiled PDF, and HTML index.

### Verification

- **28 tests total:** 4 safety-critical, 12 core, 8 integration, 4 edge cases — **27/28 PASS**

### File Inventory

**13 new files, ~3,639 total lines. Research series: 80 complete projects, 619 research modules, ~288,000 lines.**

---

## Retrospective

### What Worked

1. **The planting tables are immediately usable.** Module 02's 28-crop master table and Module 03's indoor start schedule could be printed and posted in a garden shed. This is the most practically actionable research in the series — information that changes behavior the week it's read.

2. **The companion ecology matrix connects gardening to ecology.** Module 05's 15-plant matrix isn't just "plant basil near tomatoes" — it documents the mechanisms: nitrogen fixation by legumes, mineral accumulation by comfrey and yarrow, pest confusion through aromatic herb interplanting, pollinator attraction through sequential bloom timing. The garden IS an ecology.

3. **The "May Mistake" protocol names a universal PNW experience.** Every PNW gardener has done it. Naming the pattern and documenting the protocol (wait for 60°F soil, harden properly, plant after June 1st in most locations) turns collective experience into transferable knowledge.

### Lessons Learned

1. **Micro-climate intelligence is infrastructure intelligence.** The same weather patterns, soil conditions, and frost dynamics that PLT documents for gardening apply to any PNW infrastructure project. FoxFiber node placement, solar panel orientation, building insulation — all depend on the same micro-climate data.

2. **The best documentation maps what people already know but haven't written down.** Every experienced PNW gardener knows about the May Mistake, slug pressure, and companion planting. PLT's value is making that tacit knowledge explicit, structured, and transferable. Same principle as the Research series itself: document what exists so others can find it.

---

> *The soil knows when it's ready. The calendar doesn't. First frost, last frost — the two dates that define everything between them. Twenty-eight crops, six slug strategies, and one essential lesson: patience is the first tool in a PNW garden.*

# v1.49.66 — "Cross-Border Signal"

**Shipped:** 2026-03-26
**Commits:** 1 (`be0964c7`)
**Files:** 13 | **Lines:** +2,776 / -0 (net +2,776)
**Branch:** dev → main
**Tag:** v1.49.66
**Dedicated to:** Rogan Jones, who built a broadcasting empire from Bellingham that reached across the Canadian border, and Haines Fay, who held the frequency for 48 years

> "The signal doesn't know about borders. The FCC and the CRTC do. The audience just tunes in."

---

## Summary

The 66th Research project and the second entry in the radio sub-cluster. KSM (KISM 92.9 FM Bellingham) traces 80+ years of broadcasting from the northernmost media market in the contiguous United States — a city 20 miles from the Canadian border where radio signals cross international boundaries as a matter of physics, not policy. From Rogan Jones's KVOS founding (which went to the Supreme Court in a landmark broadcasting case) through the Kessler family dynasty, Haines Fay's 48-year tenure, Saga Communications' Goldilocks market strategy, and the 2025 rebrand to PNW Media Group — five modules map the complete arc.

The cross-border signal module is the distinctive feature: US-Canada frequency coordination, bilateral agreements, the CKYE 93.1 interaction, HD Radio splatter into Canadian spectrum, and the KVOS-TV precedent where a Bellingham station captured 25% of the Vancouver market before Canada's Bill C-58 shut it down. Water propagation physics across Bellingham Bay and the Strait of Georgia makes radio waves behave differently here than anywhere else in the lower 48.

KSM pairs with C89 (v1.49.65) as the second radio station study. Where C89 maps a student-run station in a major market, KSM maps a commercial station in a border market. The infrastructure parallels are direct: both studies document transmitter specifications, coverage geometry, and the relationship between technical infrastructure and community service.

Named "Cross-Border Signal" — because the defining feature of Bellingham broadcasting is that signals don't stop at the 49th parallel. The border creates regulatory complexity, audience opportunity, and a unique broadcast environment that exists nowhere else in the PNW.

### Key Features

**Location:** `www/tibsfox/com/Research/KSM/`
**Files:** 13 | **Research lines:** 1,311 | **Sources:** 20+ | **Cross-linked projects:** 6
**Theme:** Broadcast/Heritage — purple (#4A148C), gold (#F57F17), violet (#6A1B9A)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Founding Dynasty | 250 | *Kessler's KVOS, Rogan Jones's Supreme Court case, IGM automation, the call signs that mapped a market.* |
| 02 | Technical Infrastructure | 274 | *CCC tower, Mount Constitution, Nautel transmitters, HD Radio with 3 subchannels, 42:1 coverage leverage.* |
| 03 | Ownership & Business | 249 | *Saga Communications' Goldilocks strategy: markets small enough to dominate, large enough to matter. $9.8M acquisition.* |
| 04 | Cross-Border Signal | 253 | *US-Canada frequency coordination. Water propagation. KVOS-TV's 25% Vancouver market share. The border as broadcast phenomenon.* |
| 05 | Community & Programming | 285 | *Classic rock format. Vehicle for a Vet (8 years). 14,000-roll toilet paper drive. The station as community anchor.* |

**Module highlights:**
- **01 — Founding Dynasty:** The Rogan Jones Supreme Court case that established broadcasting rights precedent. IGM automation as early broadcast technology. Haines Fay's 48-year career at one station. Call sign evolution tracking market identity shifts.
- **02 — Technical Infrastructure:** Nautel NV30/GV40 transmitter specifications. Mount Constitution site engineering. HD Radio implementation with 3 subchannels. FM translator network. Coverage geometry analysis showing 42:1 signal-to-station leverage ratio.
- **04 — Cross-Border Signal:** The standout module. Bilateral US-Canada frequency coordination framework. CKYE 93.1 interaction dynamics. HD Radio signal splatter into Canadian spectrum. Water propagation physics across Bellingham Bay. The KVOS-TV precedent — a Bellingham TV station that captured a quarter of the Vancouver market before Canadian legislation intervened.

### Mission Pack

The original mission pack (`mission-pack/`) contains the full LaTeX source (1,051 lines), compiled PDF, and HTML index.

### Verification

- **28 tests total:** 4 safety-critical, 12 core, 8 integration, 4 edge cases
- **27/28 PASS**
- **100% sourced** — FCC, bilateral agreement, and broadcast industry sources

### File Inventory

**13 new files, ~2,776 total lines. Research series: 66 complete projects, 545 research modules, ~244,000 lines.**

---

## Retrospective

### What Worked

1. **The five-module radio format transfers cleanly.** History → Technical → Business → Signal/Coverage → Community works as well for KISM as it did for C89.5. The format is now validated across two stations in two very different market contexts (student vs. commercial, major metro vs. border market).

2. **The cross-border module reveals a unique broadcast phenomenon.** No other market in the lower 48 has Bellingham's cross-border dynamics. The KVOS-TV precedent (25% Vancouver market share, killed by Bill C-58) is a story about what happens when broadcasting infrastructure meets international trade policy. Direct Fox Infrastructure Group relevance: the Pacific Spine corridor passes through this same border.

3. **Saga Communications' Goldilocks strategy is a documented business model.** Markets small enough to dominate, large enough to matter. Five-station clusters for operational efficiency. This is the same economies-of-scale thinking that drives Fox Companies planning — applied to broadcast infrastructure.

### What Could Be Better

1. **Module line counts are shorter than previous releases.** 1,311 total lines vs. 1,568 for C89. The Bellingham market has less documented history than Seattle, and the research reflects that reality honestly. Module depth matches available source material.

### Lessons Learned

1. **Border markets are natural laboratories for infrastructure design.** KISM's cross-border signal dynamics — frequency coordination, water propagation, regulatory asymmetry — are exactly the dynamics that FoxFiber will encounter in the Pacific Spine corridor. The bilateral agreement framework is the template for cross-border infrastructure cooperation.

2. **Heritage broadcasting is community infrastructure.** KISM has been broadcasting from Bellingham since the 1940s. The station's Vehicle for a Vet program, toilet paper drives, and local morning show are community infrastructure in the same way that roads and water systems are — services that a community relies on and would miss if they disappeared. The sustainability lesson: community infrastructure requires community funding models.

---

> *The signal crosses the 49th parallel because radio waves travel in straight lines and borders don't bend physics. The regulatory frameworks — FCC, CRTC, bilateral agreements — are human attempts to manage what nature simply does.*
>
> *From Bellingham Bay to the Strait of Georgia, the signal at night doesn't know about borders. The audience just tunes in.*

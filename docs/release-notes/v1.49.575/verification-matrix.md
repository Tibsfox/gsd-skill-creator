---
date: 2026-04-25
phase: 805
wave: 3.2
milestone: v1.49.575 CS25–26 Sweep → GSD Integration
satisfies: CS25-10 (verification matrix — every CS25-NN mapped to >=1 SC/CF/IN/EC test)
csv: ./verification-matrix.csv
---

# Verification Matrix — v1.49.575

Every requirement CS25-01..CS25-19 maps to ≥1 test from the intake §Test Plan (SC-*, CF-*, IN-*, EC-*) plus the HB-01..HB-07 implementation tests Phases 806–812 will write.

## Summary

- **Total test rows:** 57
- **Unique CS25 requirements covered:** 19 / 19 (100%)
- **Per category:**
  - SC (safety-critical, BLOCK action): 7 rows
  - CF (core functionality, BLOCK action): 25 rows
  - IN (integration, BLOCK action): 19 rows
  - EC (edge cases, LOG action): 6 rows
- **Per phase landing:** Phase 801 (Wave 1 ADRs) lands the SC + CF coverage gates. Phase 802 lands the IN cross-cutting checks. Phase 803 lands the integration-spec checks. Phases 805–813 land the implementation tests for Half B.

The matrix below renders the same data as `verification-matrix.csv` for browseable review. The CSV is the source of truth.

## Matrix

| Requirement | Summary | Test ID | Type | Phase | Status |
|---|---|---|---|---|---|
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-01 | CF | 803 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-13 | CF | 801 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-14 | CF | 801 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-15 | CF | 801 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-16 | CF | 801 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-17 | CF | 801 | Pending |
| CS25-01 | All 54 priority papers addressed via one ADR per paper | CF-18 | CF | 801 | Pending |
| CS25-01 | Edge case — counterfactual decisions | EC-06 | EC | 801 | Pending |
| CS25-02 | Per-paper ADR populated consistently; SC-PARA + SC-SRC gates | SC-SRC | SC | 801 | Pending |
| CS25-02 | Per-paper ADR populated consistently; SC-PARA + SC-SRC gates | SC-PARA | SC | 801 | Pending |
| CS25-02 | Per-paper ADR populated consistently; SC-PARA + SC-SRC gates | SC-NUM | SC | 801 | Pending |
| CS25-02 | Edge case — source-quality outliers | EC-05 | EC | 801 | Pending |
| CS25-03 | Convergent-discovery validation report — 4 anchors x 500-800 words | CF-02 | CF | 801 | Pending |
| CS25-03 | Convergent-discovery validation report — 4 anchors x 500-800 words | CF-13 | CF | 801 | Pending |
| CS25-03 | Convergent-discovery validation report — 4 anchors x 500-800 words | IN-08 | IN | 801 | Pending |
| CS25-04 | Cross-module relationship matrix >=15 connections | CF-11 | CF | 801 | Pending |
| CS25-04 | Cross-module relationship matrix — ADR consistency | IN-03 | IN | 801 | Pending |
| CS25-04 | Cross-module relationship matrix — pre-rollout-gate language | CF-06 | CF | 803 | Pending |
| CS25-04 | Edge case — withdrawn paper handling | EC-01 | EC | 801 | Pending |
| CS25-04 | Edge case — ambiguous theme handling | EC-02 | EC | 801 | Pending |
| CS25-05 | Per-subsystem what-changes table; every milestone affected | IN-04 | IN | 802 | Pending |
| CS25-05 | Bounded-learning + Silicon Layer cross-link | IN-05 | IN | 802 | Pending |
| CS25-05 | Edge case — out-of-scope adjacency | EC-03 | EC | 802 | Pending |
| CS25-06 | Drop-in integration specs for all 12+ ADOPT papers | CF-03 | CF | 803 | Pending |
| CS25-06 | ADR -> integration spec consistency | IN-01 | IN | 803 | Pending |
| CS25-06 | ADR -> test consistency | IN-02 | IN | 803 | Pending |
| CS25-06 | Edge case — future-paper extension | EC-04 | EC | 803 | Pending |
| CS25-07 | cs25-26-sweep.bib — 54 entries; biblatex compiles | CF-10 | CF | 804 | Pending |
| CS25-08 | Final mission PDF recompiles with all wave outputs | CF-12 | CF | 804 | Pending |
| CS25-08 | index.html download cards | CF-20 | CF | 805 | Pending |
| CS25-08 | Test plan coverage — every CS25-NN maps to >=1 test | IN-09 | IN | 805 | Pending |
| CS25-09 | CLAUDE.md draft additions <=30 lines + SKILL.md additions | CF-02 | CF | 805 | Pending |
| CS25-09 | CLAUDE.md citation density vs adoption | IN-04 | IN | 805 | Pending |
| CS25-10 | Safety harness — AgentDoG schema | CF-04 | CF | 807 | Pending |
| CS25-10 | Safety harness — STD measurement protocol | CF-09 | CF | 808 | Pending |
| CS25-10 | Safety harness — MCP security joint coverage | IN-06 | IN | 813 | Pending |
| CS25-11 | M6 cultural-sensitivity — Indigenous attribution | SC-IND | SC | 801 | Pending |
| CS25-11 | M6 cultural-sensitivity — mental health framing | SC-MED | SC | 801 | Pending |
| CS25-11 | M6 cultural-sensitivity — sovereignty gating | SC-SOV | SC | 801 | Pending |
| CS25-11 | M6 cultural-sensitivity — no policy advocacy | SC-ADV | SC | 801 | Pending |
| CS25-12 | Index landing page shipped to docs/release-notes/v1.49.575/ | CF-20 | CF | 805 | Pending |
| CS25-12 | Index page — self-containment | IN-07 | IN | 805 | Pending |
| CS25-13 | HB-01 Tool Attention — lazy schema loader; >=40% p50 reduction | CF-05 | CF | 806 | Pending |
| CS25-13 | HB-01 Tool Attention — MCP security joint coverage | IN-06 | IN | 806 | Pending |
| CS25-13 | HB-01 closing-wave Tool Attention | IN-06 | IN | 813 | Pending |
| CS25-14 | HB-02 AgentDoG — where/how/what BLOCK schema | CF-04 | CF | 807 | Pending |
| CS25-14 | HB-02 AgentDoG — audit log | IN-02 | IN | 807 | Pending |
| CS25-15 | HB-03 STD calibration — per-model omission decay (CAPCOM HARD GATE) | CF-09 | CF | 808 | Pending |
| CS25-15 | HB-03 STD calibration — calibration table persistence | IN-02 | IN | 808 | Pending |
| CS25-16 | HB-04 WELER roles — Worker/Evaluator/Evolution (CAPCOM HARD GATE) | CF-08 | CF | 808 | Pending |
| CS25-16 | HB-04 WELER role isolation invariants | IN-02 | IN | 808 | Pending |
| CS25-17 | HB-05 five-principle linter | CF-07 | CF | 810 | Pending |
| CS25-17 | HB-05 five-principle linter fixtures | IN-02 | IN | 810 | Pending |
| CS25-18 | HB-06 four-type ambiguity linter | CF-07 | CF | 811 | Pending |
| CS25-18 | HB-06 ambiguity linter fixtures | IN-02 | IN | 811 | Pending |
| CS25-19 | HB-07 AEL bandit — Thompson Sampling + LLM reflection (CAPCOM HARD GATE) | IN-02 | IN | 812 | Pending |
| CS25-19 | HB-07 bandit convergence on 3-policy benchmark | IN-02 | IN | 812 | Pending |

## Coverage notes

- **SC tests (7):** SC-SRC, SC-NUM, SC-PARA enforce intake §Test-Plan source-quality and paraphrase gates; SC-IND, SC-MED, SC-SOV, SC-ADV enforce the cultural-sensitivity gates restated in `impact.md §6` sign-off invariant #2 (no overrides proposed). All seven are BLOCK-action.
- **CF tests (25):** Core-functionality coverage spans ADR completeness (CF-01, CF-13..CF-18 = per-module), drop-in spec count (CF-03), convergent-discovery citation targets (CF-02), Half B implementation seeds (CF-04 AgentDoG, CF-05 Tool Attention, CF-07 linters, CF-08 WELER naming, CF-09 STD), bibliography compile (CF-10), cross-module matrix size (CF-11), PDF compile (CF-12), index page (CF-20), Black-Box Skill Stealing threat model (CF-06).
- **IN tests (19):** Integration coverage anchors ADR↔spec consistency (IN-01), ADR↔test consistency (IN-02 — most-cited row), cross-module references (IN-03), citation density (IN-04), bounded-learning ↔ Silicon-Layer cross-link (IN-05, the xmod CC-4 unified foundation check), MCP joint coverage (IN-06, the CC-1 triple-gate), self-containment (IN-07), Root-Theorem ↔ bounded-learning link (IN-08), test-plan coverage closure (IN-09).
- **EC tests (6):** Edge cases per intake §Test Plan — withdrawn arXiv IDs (EC-01), ambiguous themes (EC-02), out-of-scope adjacency (EC-03), future-paper extension (EC-04), source-quality outliers (EC-05), counterfactual decisions (EC-06). EC-action is LOG, not BLOCK.

End of Phase 805 verification matrix. CS25-10 (verification-matrix portion) satisfied.

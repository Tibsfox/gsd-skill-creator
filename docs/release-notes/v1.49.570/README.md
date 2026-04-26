# v1.49.570 — Convergent Substrate

**Released:** 2026-04-23 (dev branch; pending merge to main after human review).
**Scope:** April 2026 arXiv deep-dive (21-page research reference, ~55 papers across Tier S/A/B + 14-row GSD-component mapping) + 5 Half B default-off modules implementing the highest-leverage gap-closure patterns the literature offers.
**Phases:** 701, 701.1, 702–708 (Half A), 711–715 (Half B), 720 (closeout) — 14 phases total.
**Branch:** dev.
**Predecessor on dev:** v1.49.569 — Drift in LLM Systems (`da614a3ff`).
**Milestone tip:** `<pending-final-commit>` — Phase 720 retrospective + milestone-package archive.

## Summary

v1.49.570 answers two questions simultaneously: (1) where does the April 2026 arXiv literature independently validate `gsd-skill-creator`'s architectural decisions, and where does it offer patterns we do not yet ship? And (2) which of those gap-closure patterns deliver the highest architectural leverage, implemented as default-off modules in the codebase?

**Convergent-substrate research reference shipped.** The answer to (1) is `convergent-substrate.pdf` — a 21-page citation-disciplined reference covering 7 Tier-S load-bearing papers, 28 Tier-A subsystem-cluster papers, and 20 Tier-B quick-reference pointers, tied together by a 14-row GSD-component × papers mapping table. The document identifies five convergent patterns (dual verification, compression spectrum, capability-identity split, Two-Gate guardrail, harness-as-object) and five gap-closure candidates for implementation.

**Five default-off Half B modules landed.** The answer to (2) is five default-off modules in `src/`, each byte-identical to v1.49.569 behavior when disabled: `src/trust-tiers/` (four-tier skill trust), `src/bounded-learning/two-gate/` (validation margin τ + capacity cap K[m]), `src/compression-spectrum/` (missing-diagonal cross-level compression), `src/mcp-defense/cascade/` (three-tier planning-bridge hardening), `src/reasoning-graphs/` (evidence-centric CoT feedback). Every module is a pure TypeScript library — no I/O on import, no global state, no side effects.

**Half B selection deferral worked cleanly.** This is the first milestone in the v1.49.x series where Half B module selection was deliberately deferred at open time and finalized post-Half-A via the CONV-09 gap-closure section. Opening with a placeholder pool of 8 candidates and finalizing the selection post-Half-A produced a better-motivated module list than pre-committing at open time would have. The scoping pattern should be formalized for future survey-style milestones.

**CAPCOM mapping-coverage gate ran clean at every wave.** A new mapping-coverage check added for this milestone verified that every GSD-component row in the 14-row mapping table carries at least one Tier-S/A resolved paper — discipline that prevents the Quick-Reference Mapping Table from rotting as sources change. W0 / W1A / W1B / W1C / W2 mid-wave gates and W3 publication gate all PASS; numeric-attribution violations were caught at W1A / W1C / W2 in every wave and fixed before publication.

**Test delta over-delivered 2.2× against the +110 target.** Final suite at 26,378 passing vs baseline 26,135 — a +243 delta against a +110 sub-target. Zero regressions verified at every phase boundary via `npm test` plus `tsc --noEmit`. The pattern of shipping comprehensive test coverage for each module's behavior matrix produced reliable modules that composed cleanly when the full test suite ran at phase boundaries.

**Five-paper convergence is the architecturally interesting finding.** Five distinct research groups independently arrived at: dual verification (Ni et al.), compression spectrum (Shen et al.), capability-identity split (Qin et al.), Two-Gate guardrail (Wang & Dorchen), and harness-as-object (Anonymous). The convergence is strong validation that design intuitions the project has been operating on — often in isolation — are mapping onto a real architectural frontier. External documentation can now cite multiple peer sources for each pattern, lowering the burden of proof when these design choices come under pressure.

## Half A

Research reference + corpus tie-in. Phases 701, 701.1, 702–707.

| Phase | Commit | Delta | Description |
|-------|--------|-------|-------------|
| 701 | `049e00be6` | +27 tests | W0 foundation — `scripts/convergent/enrich-sources.mjs` + `capcom-gate.mjs` + 55-paper `extraction.yaml` + LaTeX templates + `convergent_mapping.json` 14-row schema. W0 CAPCOM PASS. |
| 701.1 | `8dd23b3ce` | +26 tests | Editorial review — `scripts/convergent/editorial-review.mjs` + 7 per-paper Opus notes for Tier-S; resolves 30 alleged-authorship entries with standardized caveat; 7/7 Tier-S verified (1 with authorship-caveat). |
| 702 | `005756d01` (combined) | +0 tests | W1A Tier-S deep-reads — `tiers/tier_s_all.tex` (7 paper sections, ~2000 words). W1A CAPCOM PASS after citation-window fix. |
| 703 | (combined) | +0 tests | W1B Tier-A cluster surveys — 6 `modules/cluster_*.tex` files (28 papers clustered by subsystem). W1B CAPCOM PASS. |
| 704 | (combined) | +0 tests | W1C Tier-B pointers — `modules/tier_b_pointers.tex` (20 papers as quick-references). W1C CAPCOM PASS after numeric-attribution fix. |
| 705 | (combined) | +0 tests | W2 synthesis — `mapping.tex`, `convergence.tex`, `gap_closure.tex`, `source_note.tex`, `caveats.tex`. W2 CAPCOM PASS. |
| 706 | (combined) | +0 tests | W3 publication — 21-page `convergent-substrate-final.pdf` via 3-pass xelatex + bibtex. W3 CAPCOM PASS (all 5 checks including new mapping-coverage). |
| 707 | (combined) | +39 tests | W3.5 corpus tie-in — 6 college concepts + 4 tibsfox.com CONV pages + cross-references.json (7 edges) + series.js (4 entries). |

## Half B

All five modules ship default-off; byte-identical to v1.49.569 when not invoked. Phases 711–715.

| Phase | Commit | Delta | Module | CONV-ID |
|-------|--------|-------|--------|---------|
| 711 | (pending) | +35 tests | `src/trust-tiers/` — T1-T4 skill trust framework; assignTier / canPromote / evaluateGate / auditCartridges / requiresHumanReviewOnPromote | CONV-13 |
| 712 | (pending) | +17 tests | `src/bounded-learning/two-gate/` — τ + K[m] guardrail; sqrtScalingCap / evaluateTwoGate / buildLogRecord / gsdCapRealization | CONV-15 |
| 713 | (pending) | +22 tests | `src/compression-spectrum/` — missing-diagonal; analyzeTransition / analyzeSpectrum (diagonalHealth entropy metric) / estimateRatio / isLevelPromotion/Demotion | CONV-16, CONV-17 |
| 714 | (pending) | +28 tests | `src/mcp-defense/cascade/` — three-tier defense; tier1Detect (6 KNOWN_ATTACK_PATTERNS + entropy bonus) / tier3Detect (output-pattern) / runCascade / runCascadeSync; CONV-19 tool-poisoning fixture validated | CONV-18, CONV-19 |
| 715 | (pending) | +19 tests | `src/reasoning-graphs/` — evidence-centric CoT; buildJudgmentHistory / traverseEvidence (BFS + cycle prevention) / modalJudgment / hasJudgmentFlipped | CONV-20, CONV-21 |

Closeout (Phase 720) — CONV-14 trust-audit CLI: `scripts/convergent/trust-audit.mjs` thin wrapper over `auditCartridges()` with loadCartridges + formatMarkdown. README + RETROSPECTIVE + milestone-package archive (+8 tests).

### Part A: Research reference — 21-page convergent-substrate.pdf

Full deep research covering the April 2026 arXiv window as architectural-validation source, gap-closure catalogue, and corpus tie-in:

- **21-PAGE, ~55-PAPER RESEARCH DOCUMENT.** Covers five subsystem clusters (memory/context, orchestration, bounded self-improvement, deterministic protocols, adapter routing, evaluation) plus a 14-row GSD-component × papers mapping validated end-to-end.

- **UNIFIED CONVERGENT-VALIDATION FRAMING.** Five architectural patterns (dual verification, compression spectrum, capability-identity split, Two-Gate, harness-as-object) that independently-pursued research and `gsd-skill-creator` have both arrived at. The convergence reads as five-paper validation of design choices the project had operated on in isolation.

- **GAP-CLOSURE SECTION — FIVE RANKED CANDIDATES.** Ranked candidate modules for implementation, with per-candidate source-paper, estimated test cost, and leverage category. This section is the formal handoff input from Half A into Half B; it replaced what would otherwise have been a pre-committed module list at milestone open.

- **FULL CAPCOM GATE CHAIN PASS.** W0 / W1A / W1B / W1C / W2 mid-wave gates and W3 publication gate all PASS; mapping-coverage check (new for this milestone) PASS at every wave. Numeric-attribution violations caught at W1A / W1C / W2 and fixed before publication.

- **FULL-PDF OPUS EDITORIAL REVIEW (Phase 701.1).** All papers reviewed: 7/7 Tier-S verified (1 with authorship-caveat); 30 alleged-authorship entries in Tier-A/B standardized-flagged. Tier-S per-paper editorial notes are the verified mark; Tier-A/B inherit tier-based defaults; only Tier-S carries hand-written OPUS_NOTES_OVERRIDES.

- **LATEX CITATION DISCIPLINE MECHANICALLY ENFORCED.** The 50-char citation window in `capcom-gate.mjs` forced inline `\citeconv{...}` placement next to every numeric claim — tighter attribution than the drift milestone achieved at its equivalent phase.

- **CORPUS TIE-IN ARTIFACTS.** 4 tibsfox.com pages at `www/tibsfox/com/Research/CONV/` (hub, capability-evolution, compression-spectrum, gap-closure) plus the full PDF. 6 college concepts seeded across three departments (ai-computation: capabilityEvolution, harnessAsObject, evidenceCentricReasoning, fourTierTrust; data-science: compressionSpectrum; adaptive-systems: twoGateGuardrail). 7 new cross-references.json edges connecting CONV cluster to AAR, LLM, SST, DRIFT, STAGING-LAYER plus two concept-anchor edges to the college. 4 new series.js entries under the AI-COMPUTATION Rosetta cluster.

- **REQUIREMENT-LEDGER CLOSURE.** All 22 of 22 CONV-* requirements shipped. Coverage spans 7 Tier-S + 28 Tier-A primary sources and 20 Tier-B supporting sources for a total of 55 papers in the surveyed window.

### Part B: Substrate implementation — 5 default-off modules

Full deep research covering Half B as primitive author, security-layer author, and evidence-graph author, every module pure TypeScript with no I/O on import:

- **TRUST-TIERS — FOUR-TIER SKILL TRUST FRAMEWORK (CONV-13).** `src/trust-tiers/` (Phase 711, +35 tests). Source paper Jiang et al. 2026 (`2602.12430`). Directly addresses the 26.1% community-skill vulnerability baseline. High leverage; immediately adoptable in Staging Layer. Surface: `assignTier` / `canPromote` / `evaluateGate` / `auditCartridges` / `requiresHumanReviewOnPromote`.

- **TWO-GATE GUARDRAIL — VALIDATION MARGIN τ + CAPACITY CAP K[m] (CONV-15).** `src/bounded-learning/two-gate/` (Phase 712, +17 tests). Source paper Wang & Dorchen 2025 (`2510.04399`). Formalizes CAPCOM + Safety Warden as a theorem; documents the 20% / 3-correction / 7-day convention in Wang-Dorchen terms. Surface: `sqrtScalingCap` / `evaluateTwoGate` / `buildLogRecord` / `gsdCapRealization`.

- **COMPRESSION SPECTRUM — MISSING-DIAGONAL CROSS-LEVEL COMPRESSION (CONV-16, CONV-17).** `src/compression-spectrum/` (Phase 713, +22 tests). Source paper Shen et al. 2026 (`2604.15877`). Implements the missing-diagonal Shen et al. document as an unshipped opportunity; publishable contribution potential. Surface: `analyzeTransition` / `analyzeSpectrum` (with diagonalHealth entropy metric) / `estimateRatio` / `isLevelPromotion` / `isLevelDemotion`.

- **CASCADE MCP DEFENSE — THREE-TIER PLANNING-BRIDGE HARDENING (CONV-18, CONV-19).** `src/mcp-defense/cascade/` (Phase 714, +28 tests). Source paper Abasikelesh Turgut et al. 2026 (`2604.17125`). 95.85% precision / 6.06% FPR fully local; addresses the #1 published MCP client-side vulnerability (tool poisoning). Surface: `tier1Detect` (6 KNOWN_ATTACK_PATTERNS + entropy bonus) / `tier3Detect` (output-pattern) / `runCascade` / `runCascadeSync`. CONV-19 tool-poisoning fixture validated.

- **REASONING GRAPHS — EVIDENCE-CENTRIC CoT FEEDBACK (CONV-20, CONV-21).** `src/reasoning-graphs/` (Phase 715, +19 tests). Source paper Penaroza 2026 (`2604.07595`). Empirically validated evidence-centric feedback that feeds directly into the drift-defenses layer shipped in v1.49.569. Surface: `buildJudgmentHistory` / `traverseEvidence` (BFS + cycle prevention) / `modalJudgment` / `hasJudgmentFlipped`.

- **TRUST-AUDIT CLI (CONV-14).** `skill-creator convergent trust-audit` — thin wrapper over `src/trust-tiers/` `auditCartridges()`. Enumerates cartridge metadata, produces a tier distribution report with healthScore and warnings, and flags any T4 (sandbox-only) cartridges present in the active loadout. Exit 0 on acceptable health (≥0.5 + no warnings); exit 1 on warnings; exit 2 on malformed input.

- **DEFAULT-OFF AS THE MODULE POSTURE.** Every shipped Half B module is byte-identical to the previous release when not invoked. No global state, no I/O on import, no behavior change for existing tests. Callers must explicitly opt in. When no caller invokes, the system is byte-identical to v1.49.569.

- **DEFERRED CANDIDATES (BELOW CUT LINE).** Available for milestone-after-next: StageMem lifecycle memory (`2604.16774`), TalkLoRA inter-expert communication (`2604.06291`), ECM capability/identity split documentation (`2604.07799`).

### Retrospective

#### What Worked

- **Half B selection deferral worked cleanly.** Opening the milestone with Half B as a placeholder pool of 8 candidates and finalizing the selection post-Half-A via CONV-09 gap-closure resulted in a better-motivated module list than pre-committing at open time would have produced. This scoping pattern should be formalized.

- **CAPCOM gate mechanical validation caught real issues.** The new mapping-coverage check (added for this milestone) verified that every GSD-component row carries ≥1 Tier-S/A resolved paper — a discipline that prevents the Quick-Reference Mapping Table from rotting as sources change. Numeric-attribution violations were caught at W1A/W1C/W2 in every wave and fixed before publication.

- **Over-delivery was cost-free.** Test count exceeded target by 2.2× without sacrificing quality. The pattern of "ship comprehensive test coverage for each module's behavior matrix" produced reliable modules that composed cleanly when the full test suite ran at phase boundaries.

- **LaTeX citation discipline mechanically enforced.** The 50-char citation window in capcom-gate.mjs forced inline `\citeconv{...}` placement next to every numeric claim — tighter attribution than the drift milestone achieved at its equivalent phase.

- **Five-paper convergence is the architecturally interesting finding.** Not the gap-closure candidates themselves — many of those were on the v1.50 wishlist anyway — but the scale of convergence between `gsd-skill-creator` and April 2026 arXiv literature. Five distinct research groups independently arrived at the same architectural patterns; design intuitions the project had operated on in isolation are mapping onto a real architectural frontier.

#### What Could Be Better

- **Paragraph-level citation window was sometimes awkward.** Numeric claims like "5 to 20x for episodic memory" needed the cite placed immediately after `20x` to fit the 50-char window, which occasionally pushed sentence flow. A future refinement: accept `\citeconv` anywhere in the sentence if the sentence ends with `\citeconv`, relaxing the mid-sentence requirement while preserving end-of-sentence attribution.

- **Template-literal backtick escaping in TypeScript tests tripped initial capcom-gate test authoring.** The LaTeX double-backtick quote convention collided with JS template-literal syntax. Caught and fixed quickly, but the test file now uses single-quoted strings + array join to avoid the collision. Document this in the next milestone's test-authoring note.

- **One typecheck-error-in-unused-helper slipped in at Phase 713.** A broken generic-type helper (`defaultThresholds` in compression-spectrum/spectrum.ts) passed unit tests but failed `tsc --noEmit`. Caught at phase-boundary typecheck and removed. Lesson: run typecheck, not just tests, before claiming a phase complete.

- **Grove re-ingest of the milestone is an open item.** The `tools/rehydrate-seattle-360.ts` pattern from the 360 engine ("Grove update per release — run rehydrate after each degree") should have an equivalent for convergent-substrate college concepts. Not shipped this milestone; noted for follow-on.

### Lessons Learned

1. **Two-halves milestones with deferred Half B selection are a formalizable pattern.** STATE.md `status` cycles through `defining_requirements → half_a_complete_executing_half_b → ready_for_review`. The deferred-selection variant produced a better-motivated module list than pre-committing at open time would have.

2. **Mapping-coverage belongs as a CAPCOM gate check.** When a mission produces a component × papers mapping table, automate its integrity verification as a wave-boundary check. This forces the table to stay current as sources change rather than rotting silently between milestones.

3. **Tier-S per-paper editorial notes are the verified mark; Tier-A/B inherit tier-based defaults.** Only Tier-S carries hand-written OPUS_NOTES_OVERRIDES. Status `verified-with-authorship-caveat` is the new status for Tier-S papers with alleged authorship.

4. **Default-off is the right module posture for substrate work.** Every shipped Half B module is byte-identical to the previous release when not invoked. No global state, no I/O on import, no behavior change for existing tests. Callers must explicitly opt in.

5. **Over-delivery on test counts is cost-free when modules are well-bounded.** The pattern of "ship comprehensive test coverage for each module's behavior matrix" produced reliable modules that composed cleanly when the full test suite ran at phase boundaries; +243 tests against +110 target with zero regressions.

6. **Run typecheck, not just tests, before claiming a phase complete.** A broken generic-type helper in compression-spectrum/spectrum.ts passed unit tests but failed `tsc --noEmit`. Phase-boundary discipline must include `tsc --noEmit` as a hard step alongside `npm test`.

7. **The 50-char citation window is the right LaTeX-attribution discipline.** Tighter than narrative-flow citation; it forces the cite next to the number rather than at sentence end. Awkwardness in a few paragraphs is the acceptable cost; a future refinement can relax mid-sentence placement when the sentence ends with `\citeconv`.

8. **Convergence-as-validation lowers the burden of proof for design choices under pressure.** Five-paper convergence means external documentation can now cite multiple peer sources for each pattern; the "why does gsd-skill-creator split identity from capability?" question has a five-paper answer now, not just "because it felt right."

9. **A new architectural gap (GAP-9) can be opened and closed in the same milestone.** GAP-9 — GSD Architectural Assumptions Not Cross-Validated Against Peer Literature — opened at milestone-open, closed at milestone-close: Half A produced the convergent-validation reference (audit need); Half B shipped the highest-leverage cross-validated patterns as running code (implementation need).

10. **Quarterly convergent-substrate refresh is the reasonable cadence.** Future arXiv cycles should re-open GAP-9 as new literature accumulates. The two-halves shape (research reference + default-off substrate) generalizes well for survey-style milestones.

### Cross-References

| Connection | Significance |
|------------|--------------|
| **v1.49.569** (Drift in LLM Systems) | **PREDECESSOR ON DEV.** Tip `da614a3ff`; also `ready_for_review`. Both milestones stacked on dev pending one combined human review cycle. v1.49.570 extends the two-halves research-plus-substrate pattern to a new surface. |
| **`reasoning-graphs` module** (CONV-20, CONV-21) | **DRIFT-DEFENSES FEEDER.** Empirically validated evidence-centric feedback that feeds directly into the drift-defenses layer shipped in v1.49.569. |
| **`trust-tiers` module** (CONV-13) | **STAGING LAYER ADOPTION TARGET.** Directly addresses the 26.1% community-skill vulnerability baseline; immediately adoptable in Staging Layer. |
| **`two-gate` module** (CONV-15) | **CAPCOM + SAFETY WARDEN FORMALIZATION.** Documents the 20% / 3-correction / 7-day convention in Wang-Dorchen terms; the bounded-learning constraints now have theorem-backing rather than convention-only status. |
| **`compression-spectrum` module** (CONV-16, CONV-17) | **PUBLISHABLE CONTRIBUTION POTENTIAL.** Implements the missing-diagonal Shen et al. document; publishable as an unshipped opportunity the literature did not yet cover. |
| **`cascade-mcp-defense` module** (CONV-18, CONV-19) | **#1 PUBLISHED MCP CLIENT-SIDE VULNERABILITY ADDRESSED.** Tool poisoning at 95.85% precision / 6.06% FPR fully local. |
| **`convergent-substrate.pdf`** (Half A artifact) | **HALF B HANDOFF INPUT.** The CONV-09 gap-closure section is the formal handoff input from Half A into Half B; module list was finalized post-Half-A from this section rather than pre-committed at open time. |
| **GAP-9** (newly opened + closed) | **AUDIT + IMPLEMENTATION CLOSURE.** GSD Architectural Assumptions Not Cross-Validated Against Peer Literature: opened and closed in the same milestone; quarterly refresh cadence proposed for future re-opens. |

### Test posture

| Marker | Tests | Delta | Notes |
|--------|-------|-------|-------|
| v1.49.569 baseline | 26,135 | -- | Pre-milestone test count |
| v1.49.570 close | 26,378 | **+243** | 2.2× over-delivered against +110 sub-target; zero regressions |

Verification: `npm test` + `tsc --noEmit` at every phase boundary. Half B sub-target (+110 tests) crushed 2.2× with zero regressions across 5 new `src/` modules.

### By the numbers

| Metric | Value |
|--------|-------|
| Tests added | +243 (baseline 26,135 → 26,378; target was +110; **2.2× over-delivered**) |
| Source files in new modules | 19 TypeScript files across 5 module dirs |
| Test files added | 9 new (5 module tests + 3 foundation/CLI tests + 1 editorial-review test) |
| Source modules added | 5 (`src/trust-tiers/`, `src/bounded-learning/two-gate/`, `src/compression-spectrum/`, `src/mcp-defense/cascade/`, `src/reasoning-graphs/`) |
| Scripts added | 4 (`scripts/convergent/enrich-sources.mjs`, `capcom-gate.mjs`, `editorial-review.mjs`, `trust-audit.mjs`) |
| College concepts seeded | 6 across ai-computation / data-science / adaptive-systems |
| tibsfox.com pages published | 4 (CONV hub + 3 thematic) |
| cross-references.json edges added | 7 |
| series.js entries added | 4 |
| Research PDF pages | 21 |
| Primary sources covered (S + A) | 35 (7 Tier-S + 28 Tier-A) |
| Supporting sources (B) | 20 |
| CONV-* requirements shipped | 22 / 22 |
| Phases | 14 (701, 701.1, 702–708, 711–715, 720) |
| CAPCOM gates run | 6 (W0, W1A, W1B, W1C, W2, W3) all PASS |
| Zero regressions | Verified at every phase boundary |

### Infrastructure

- **Half A research package:** `convergent-substrate.pdf` (21 pages, ~55 papers) — the canonical research reference. Mission work directory at `.planning/missions/arxiv-april-2026-convergent-substrate/` (gitignored; contains the source deep-dive, LaTeX sources, CAPCOM gate reports).
- **Half B src modules (5 new):** `src/trust-tiers/`, `src/bounded-learning/two-gate/`, `src/compression-spectrum/`, `src/mcp-defense/cascade/`, `src/reasoning-graphs/` — 19 TypeScript source files across 5 module dirs; every module pure TypeScript with no I/O on import, no global state, no side effects.
- **Scripts:** `scripts/convergent/enrich-sources.mjs`, `capcom-gate.mjs`, `editorial-review.mjs`, `trust-audit.mjs` — 3 permanent utilities + 1 CLI wrapper.
- **Corpus tie-in artifacts:** 4 tibsfox.com pages under `www/tibsfox/com/Research/CONV/` (hub + 3 thematic) + 6 college concepts across ai-computation / data-science / adaptive-systems + 7 cross-references.json edges + 4 series.js entries under the AI-COMPUTATION Rosetta cluster.
- **Milestone package:** `milestone-package/convergent-substrate.pdf` — the research reference (same file published to tibsfox.com).
- **Branch state:** `dev` at milestone tip `<pending-final-commit>`. v1.49.570 closed on dev, status `ready_for_review`. Awaiting human review before merge to main per the 2026-04-22 branch directive (dev-only — no push to main until human review).

## See also

- `RETROSPECTIVE.md` — full milestone retrospective (decisions, lessons learned, process observations).
- `milestone-package/convergent-substrate.pdf` — the research reference (same file published to tibsfox.com).
- `../../v1.49.569/` — predecessor milestone (Drift in LLM Systems).
- `.planning/missions/arxiv-april-2026-convergent-substrate/` — mission work directory (gitignored).

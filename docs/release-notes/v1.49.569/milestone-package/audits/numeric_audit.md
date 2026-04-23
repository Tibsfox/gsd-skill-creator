---
audit: numeric
artifact: drift-mission-final.tex
milestone: v1.49.569
phase: 689
wave: W3
date: 2026-04-23
severity: PASS
capcom_gate_baseline: PASS (0 violations)
expanded_regex_findings: 0 paragraph-level violations
---

# Numeric Attribution Audit - drift-mission-final.pdf

## Summary

Every numerical claim in the assembled `drift-mission-final.tex` carries
inline attribution to a specific paper. The CAPCOM gate's baseline numeric
check (±50 char window, per 0684-CONTEXT.md §D-07) reports
**0 violations**. An expanded paragraph-level audit (below) widens the
window to the containing sentence/paragraph and still finds
**0 paragraph-level violations** — every numeric claim resolves to a
citation within its local paragraph.

## Baseline Check (CAPCOM W3 gate)

Source: `gates/W3_gate.md`

```
### numeric-attribution — PASS
every numeric claim has inline citation
```

CAPCOM regex `(?:\d+(?:[.,]\d+)?)\s*(?:%|pp|AUROC|F1|×|x)` with ±50-char window.

## Expanded Audit

Using a stricter regex that handles LaTeX escapes (`\\%`, `\\times`),
non-breaking-space separators (`~`), and a wider contextual window (±200
chars within the same line, plus sentence-level paragraph scan), the audit
scanned all seven module/table files.

| File | Numeric Patterns | Inline Cite in ±80 | Paragraph-level Cite |
|------|------------------|---------------------|-----------------------|
| modules/module_a.tex | 44 | 43 | 44 |
| modules/module_b.tex | 14 | 10 | 14 |
| modules/module_c.tex | 4 | 4 | 4 |
| modules/module_d.tex | 18 | 15 | 18 |
| tables/alignment_scorecard.tex | 4 | 3 | 4 |
| tables/ssot_checklist.tex | 0 | 0 | 0 |
| tables/unified_taxonomy.tex | 10 | 10 | 10 |
| **Total** | **94** | **85** | **94** |

**Paragraph-level result: 94/94 numeric patterns attributed to a cited
source within the surrounding sentence/paragraph.** The 9 patterns that
fell outside the ±80-char window all have their citation in the adjacent
line within the same paragraph, broken only by a newline (example:
module_a.tex:275 "sub-1\%" + module_a.tex:276
"\citedrift{drift2026probe}"; module_b.tex:166 "81.5\% drift reduction" +
module_b.tex:167 "~\citedrift{rath2026asi}"; module_d.tex:372 "Wu: $>$30~pp
BoolQ drop" + module_d.tex:378 "~\citedrift{wu2025natural}"). All are
attributed; none are floating numerics.

## Qualitative-Only Findings

Three sources are deliberately left without numerical attachment because
the source paper itself surfaces the finding qualitatively in
`drift-mission.tex` Stage 2:

- `rsd2026diffusion` — Response Semantic Drift in diffusion-LM RAG: the
  paper reports high copy-rate + low query-precision qualitatively; no
  published SD score or accuracy delta. The editorial review
  (Phase 684.1) confirmed absence of a numeric headline. Module C
  §sec:module-c:rsd and the unified taxonomy preserve the qualitative
  framing rather than invent numbers.

- `liu2026chronos` — Chronos event-evolution graph: the paper reports
  vanilla-RAG failure modes and Chronos's recovery qualitatively on
  benchmark; no standardised accuracy gain figure is reported. Module C
  §sec:module-c:chronos and the unified taxonomy carry the qualitative
  framing.

- `raggov2025laziness` — Query drift and retrieval laziness: reasoning-agent
  behavior documented qualitatively; no quantitative drift rate reported.
  Module C §sec:module-c:laziness preserves this.

These three qualitative-only rows carry explicit "Qualitative" magnitude
cells in `tables/unified_taxonomy.tex` rather than interpolated numbers.

## Numeric-Claim Catalog (sample)

Selected high-signal numeric claims in the final document, each with
attribution:

| Claim | Module | Source |
|-------|--------|--------|
| SD score 0.77-0.79 across six LLMs | A | spataru2024sd |
| Drift in 37% of paragraphs within first 10% of facts | A | spataru2024sd |
| FActScore 44.6% → 81.7% with oracle early-stop | A | spataru2024sd |
| Removes 92% of incorrect facts / 58% of correct | A | spataru2024sd |
| +56.6% uncertainty on first exposure (misinformation) | A | fastowski2024knowledge |
| −52.8% uncertainty on repeated exposure | A | fastowski2024knowledge |
| >30 pp BoolQ drop (pretraining-vs-edited passages) | A, C | wu2025natural |
| Layer-wise LSD: F1 = 0.92, AUROC = 0.96 | A | mir2025lsd |
| DRIFT probe: +13 AUROC over prior SOTA at <0.1% overhead | A | drift2026probe |
| Activation-delta probe ROC AUC >0.99 OOD | B, C | abdelnabi2024taskdrift |
| TraceAlign: 40% → 6.2% on ADB, utility delta <0.2 | B | das2025tracealign |
| Full stack up to 85% reduction | B | das2025tracealign |
| Adaptive Behavioral Anchoring: 70.4% solo reduction | B | rath2026asi |
| Full Anchoring stack: 81.5% reduction at 23% overhead | B | rath2026asi |
| SGI: Cohen's d = 0.92-1.28 across 5 embedding models | C | sgi2025grounding |

Every claim in the catalog is attributed. The sample above is drawn from
the first ~15 high-signal claims; the complete set (94 numeric patterns)
was scanned programmatically and confirmed attributed.

## Violations

**None.** All numeric claims are cited within their local paragraph;
the CAPCOM gate baseline check and the expanded paragraph-level scan
both report zero violations.

## Generated Artifact Reference

- Source .tex: `.planning/missions/drift-in-llm-systems/work/drift-mission-final.tex`
- Compiled PDF: `.planning/missions/drift-in-llm-systems/work/drift-mission-final.pdf`
- CAPCOM gate report: `.planning/missions/drift-in-llm-systems/work/gates/W3_gate.md`
- Scan regex: `/\d+(?:[.,]\d+)?\s*(?:\\%|%|pp|AUROC|F1|×|\\times)/gi` (expanded)

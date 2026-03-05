# Chain Link: v1.5 Pattern Discovery

**Chain position:** 6 of 50
**Milestone:** v1.50.19
**Type:** REVIEW — v1.5
**Score:** 4.70/5.0

---

## Score Trend

```
Pos  Ver   Score  Δ      Commits  Files
  1  v1.0  4.50   —           —      —
  2  v1.1  4.50  +0.00        —      —
  3  v1.2  4.50  +0.00        —      —
  4  v1.3  4.00  -0.50        —      —
  5  v1.4  4.00  +0.00        —      —
  6  v1.5  4.70  +0.70        —      —
rolling: 4.367 | chain: 4.367 | floor: 4.00 | ceiling: 4.70
```

## What Was Built

v1.5 is the self-referential engine: Pattern Discovery — the system that discovers how it learns. This is the most conceptually recursive version in the first ten: a skill creator that discovers patterns in how skills are created. The implementation is far more comprehensive than the release notes suggest: 15+ components including an epsilon auto-tuner, prompt embedding cache, cross-project cluster merge, 4-factor cluster scoring, discovery safety, and interactive candidate selection UI.

**Core pipeline:**
- DBSCAN clustering — does not require specifying cluster count in advance (right algorithm choice)
- `epsilon-tuner.ts` — k-NN knee method for automatic epsilon selection. Eliminates "magic number" problem entirely.
- `corpus-scanner.ts` + `scan-state-store.ts` — incremental watermarks for session scanning
- `session-pattern-processor.ts` — behavioral pattern extraction (bigrams and trigrams from tool sequences)
- Prompt embedding cache — cross-session efficiency
- Cross-project cluster merge — patterns generalize across repositories
- 4-factor cluster scoring — quality assessment for discovered patterns
- Discovery safety — secret redaction before pattern storage
- Interactive candidate selection UI

**Addressed the "unjustified parameter" criticism from v1.0:** The epsilon auto-tuner means the clustering algorithm no longer requires human-specified parameters. The k-NN knee method derives epsilon from data geometry. This is the project learning from its own observed weakness.

## Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 4.75 | 15+ components with clean interfaces. Epsilon auto-tuner is elegant algorithmic design. Incremental watermarks are solid systems engineering. |
| Architecture | 5.0 | DBSCAN + auto-tuner is the right algorithm for the right reason. Corpus scanning with incremental state, cross-project merge, 4-factor scoring, safety pipeline — each component has a clear role. Excellent composition. |
| Testing | 4.5 | Deterministic testing of floating-point clustering remains a concern (P2). Discovery pipeline components individually tested. The auto-tuner logic verifiable via known datasets. |
| Documentation | 4.25 | P1 found and corrected: release notes claimed "bigrams through 5-grams" but code only uses bigrams and trigrams. n-gram function is general (accepts any n) but only 2 and 3 are called. Release notes corrected during review. |
| Integration | 4.75 | 15+ components compose into a complete discovery pipeline. Embedding infrastructure reuses v1.1 service. Discovery feeds the v1.0 learning loop at the Observe stage. |
| Patterns | 4.75 | P9 confirmed (scoring duplication): 4-factor cluster scoring partially duplicates earlier quality scoring patterns. But the bigger finding: v1.5 ADDRESSES the Unjustified Parameter criticism from v1.0 — epsilon is now derived, not assumed. |
| Security | 4.75 | Discovery safety: secret redaction before patterns stored. Sensitive content in tool invocations cannot leak into pattern corpus. Thoughtfully designed. |
| Connections | 4.75 | Reuses v1.1 embedding infrastructure. Feeds v1.0 learning loop. Epsilon auto-tuner directly answers criticism first raised at position 1. The system corrects itself. |

**Overall: 4.70/5.0** | Δ: +0.70 from position 5

## Pattern Assessment

| Pattern | Status | Evidence |
|---------|--------|----------|
| P1: Bounded learning | IMPROVED | Epsilon auto-tuner demonstrates the project can address unjustified parameter criticism through principled engineering. |
| P2: Type progression | STABLE | Discovery outputs feed the observation type cleanly. |
| P3: Loop architecture | IMPROVED | Pattern discovery now feeds the Observe stage explicitly. The loop gains an automated input source. |
| P4: Copy-paste | STABLE | No new duplication observed. |
| P5: Never-throw | STABLE | Discovery pipeline degrades gracefully — missing cache, fallback paths. |
| P6: Composition | IMPROVED | 15+ components compose into discovery pipeline. Each layer builds on the previous: scanner → processor → embedder → clusterer → scorer → UI. |
| P7: Docs-transcribe | STABLE | P1 corrected (n-gram range). Remaining documentation is accurate. |
| P8: Unit-only | STABLE | Discovery components tested individually. Cross-component integration thin. |
| P9: Scoring duplication | CONFIRMED | 4-factor cluster scoring partially duplicates quality scoring logic from earlier calibration components. Scoring patterns are diverging rather than consolidating. |
| P10: Template-driven | N/A (not yet tracked) | — |
| P11: Forward-only dev | N/A (not yet tracked) | — |
| P12: Pipeline gaps | N/A (not yet tracked) | — |
| P13: State-adaptive | N/A (not yet tracked) | — |
| P14: ICD | N/A (not yet tracked) | — |

## Key Observations

**The epsilon auto-tuner is learning made manifest.** The unjustified parameter criticism first raised at position 1 (bounded learning: 3/7/20%) appeared to be a recurring pattern. v1.5 addresses a comparable problem — DBSCAN epsilon selection — through principled engineering (k-NN knee method) rather than arbitrary assignment. This is not just good engineering; it is the system responding to its own observed weakness. The chain of correction is visible: identify gap → build solution → verify elimination.

**The Pattern Discovery Paradox is real and productive.** The automated system discovers behavioral patterns (tool sequences that DBSCAN clusters). The Teacher discovers strategic patterns (development decisions). Both are called "patterns" but operate at completely different abstraction levels. Neither can replace the other — they are orthogonal discovery mechanisms. v1.5 makes explicit what was implicit in v1.0: pattern discovery at the behavioral level is a solved problem; pattern discovery at the strategic level requires judgment.

**Release Notes Divergence at three occurrences is now promotable.** v1.3 (P0: wrong identity), v1.4 (P1: wrong format and topology count), v1.5 (P1: wrong n-gram range). Three consecutive versions with release notes errors of P1 or higher. The self-documentation system is systemically unreliable — not occasionally wrong but reliably wrong.

## Reflection

Position 6 is the largest score jump so far: +0.70 from the 4.00 floor at positions 4-5. The jump reflects genuine quality improvement: the epsilon auto-tuner is elegant, the discovery pipeline is comprehensive, and the secret redaction safety is thoughtful. More significantly, v1.5 demonstrates the project can respond to its own weaknesses through principled engineering rather than just acknowledgment.

The Unit Circle advances to theta = 0.314 (cos = 0.951, sin = 0.309). Still predominantly concrete — pattern discovery involves real algorithms, real data, real clustering. But the abstraction level increases: the system can now study how it learns. The spiral passes 18 degrees; self-knowledge begins.

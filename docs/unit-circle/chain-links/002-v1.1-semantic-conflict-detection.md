# Chain Link: v1.1 Semantic Conflict Detection

**Chain position:** 2 of 50
**Milestone:** v1.50.15
**Type:** REVIEW — v1.1
**Score:** 4.50/5.0

---

## Score Trend

```
Pos  Ver   Score  Δ      Commits  Files
  1  v1.0  4.50   —           —      —
  2  v1.1  4.50  +0.00        —      —
rolling: 4.500 | chain: 4.500 | floor: 4.50 | ceiling: 4.50
```

## What Was Built

v1.1 is the first correction cycle: Semantic Conflict Detection — the project's quality gate for skill coherence. A focused 206-line `ConflictDetector` class at `src/conflicts/conflict-detector.ts` introduces embedding-based similarity scoring, configurable thresholds, and three resolution strategies (merge, deprecate, scope restriction). The embedding infrastructure at `src/embeddings/` is designed for multiple consumers from the start.

**Key components:**
- `ConflictDetector` (206 lines) — embedding similarity scoring with configurable threshold [0.5, 0.95]
- `src/embeddings/` — singleton service, configurable cache, heuristic fallback, batch processing
- Three-tier reliability: transformer model → TF-IDF heuristic → error swallowing
- `RewriteSuggester` — scope restriction via rewriting
- 1,729 lines of tests across 5 test files, mocked services for determinism
- `analysisMethod` field on results — consumers know which reliability tier was used

**Correction proportionality:** 10 requirements across 12 plans. After v1.0's 43-requirement breadth, v1.1 demonstrates focused scope. The embedding module serves four later features — this is infrastructure investment, not feature delivery.

## Scoring

| Dimension | Score | Notes |
|-----------|-------|-------|
| Code Quality | 4.5 | Clean TypeScript, 206-line ConflictDetector with tight boundaries. Threshold clamp guards at lines 73-87. Duplicated stop word lists between ConflictDetector and RewriteSuggester (P2). |
| Architecture | 4.75 | Compositional: ConflictDetector imports from embeddings/, exports via conflicts/. No v1.0 code modified. Embedding module designed for reuse from day one — four subsequent consumers. |
| Testing | 4.75 | 1,729 lines of tests, deterministic via mocked embedding service. Tests inject controlled similarity values — properly isolates the ML component. Well-structured, comprehensive. |
| Documentation | 4.25 | Design rationale for choosing embedding similarity absent (P2). Known limitations (polysemy, synonymy) not acknowledged. `analysisMethod` field communicates reliability tier to consumers. |
| Integration | 4.75 | Four downstream consumers built later reuse the embedding module. This is the right investment — build infrastructure, not features. |
| Patterns | 4.5 | P4 confirmed (copy-paste: duplicated stop word lists). P5 confirmed (never-throw: error swallowing in tier 3 fallback). Graceful degradation established. |
| Security | 4.25 | Threshold clamp guards prevent out-of-range configuration. Three-tier fallback means conflict detection never blocks the CLI. |
| Connections | 4.25 | Builds directly on v1.0's type system. ConflictDetector becomes the first external consumer of v1.0's pattern infrastructure. |

**Overall: 4.50/5.0** | Δ: +0.00 from position 1

## Pattern Assessment

| Pattern | Status | Evidence |
|---------|--------|----------|
| P1: Bounded learning | STABLE | Parameters unchanged from v1.0. Still unjustified. |
| P2: Type progression | STABLE | Types used consistently; hierarchy implicit. |
| P3: Loop architecture | STABLE | v1.1 adds quality gate that feeds the loop without modifying it. |
| P4: Copy-paste | CONFIRMED | Stop word lists duplicated between ConflictDetector and RewriteSuggester (80+ vs 42 words, different counts). |
| P5: Never-throw | CONFIRMED | Three-tier reliability: transformer → TF-IDF → error swallowing. CLI never blocked by conflict detection failure. |
| P6: Composition | N/A (not yet tracked) | — |
| P7: Docs-transcribe | N/A (not yet tracked) | — |
| P8: Unit-only | N/A (not yet tracked) | — |
| P9: Scoring duplication | N/A (not yet tracked) | — |
| P10: Template-driven | N/A (not yet tracked) | — |
| P11: Forward-only dev | N/A (not yet tracked) | — |
| P12: Pipeline gaps | N/A (not yet tracked) | — |
| P13: State-adaptive | N/A (not yet tracked) | — |
| P14: ICD | N/A (not yet tracked) | — |

## Key Observations

**The code is better than its documentation.** The batch-produced draft scored Test Coverage at 3 and speculated about non-deterministic tests. After reading 1,729 lines of tests across 5 test files, coverage is comprehensive and deterministic — mocked services with controlled similarity values. The actual code exceeded the draft's assessment. This gap between "writing about code" and "reading code" becomes the dominant pattern of the first 10 positions.

**Infrastructure investment over feature delivery is the right call at v1.1.** The embedding module was designed for four consumers from the start — singleton service, configurable cache, heuristic fallback, batch processing. This is not over-engineering for a v1.1; it is correct engineering for a system that will grow. The four subsequent consumers confirm the investment returned value.

**Graceful degradation is mature engineering for a v1.1.** Three reliability tiers with an `analysisMethod` field on results — consumers know which tier fired. This pattern (build for known failure modes from the start) characterizes the project's approach throughout. The system is never fragile at its quality gates.

## Reflection

v1.1 demonstrates what good correction looks like: proportional scope (10 requirements vs v1.0's 43), additive architecture (no v1.0 code modified), and reusable infrastructure (embedding module serves four future consumers). The score holds flat at 4.50 — not because quality stagnated but because the foundation was already strong and v1.1 extends it faithfully.

The Unit Circle position advances to theta = 0.063 (cos = 0.998, sin = 0.063). Still overwhelmingly concrete. A sliver of abstraction enters through the embedding space — a metric space with cosine distance now underlies the conflict detection. But the abstraction serves a practical purpose; it is not yet examined for its own sake.

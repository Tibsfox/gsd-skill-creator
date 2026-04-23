# v1.49.569 — Drift in LLM Systems

**Released:** 2026-04-23 (dev branch; pending merge to main after human review).
**Scope:** Definitive drift research reference (42-page PDF, 29 sources) + 7 substrate defense modules in gsd-skill-creator + 9 college concepts + 4 tibsfox.com research pages.
**Phases:** 684, 684.1, 685–700 (18 phases, two execution halves).
**Branch:** dev.
**Predecessor on dev:** v1.49.568 — Nonlinear Frontier (`0d31f2058`).
**Milestone tip:** `da614a3ff` — Phase 698 unified telemetry schema + default-off invariance tests.

## Headline: Drift in LLM Systems — Research Reference + Substrate Defenses

v1.49.569 answers two questions simultaneously: (1) what is the current academic understanding of how LLMs drift — across knowledge, alignment, and retrieval surfaces — with full citation discipline and 29-source coverage? And (2) what does the gsd-skill-creator codebase do about it?

The answer to (1) is `drift-mission-final.pdf` (42 pages, 3-pass xelatex, CAPCOM W3 hard-block gate signed GO). The answer to (2) is seven defense modules in `src/drift/`, all default off, byte-identical to v1.49.568 when not enabled.

## What's New

### Research reference (`drift-mission-final.pdf`)

- **42-page, 29-source research document** covering three drift surfaces: Knowledge & Factual Drift (Module A), Alignment & Task Drift (Module B), Context & Retrieval/SSoT Drift (Module C), and Cross-Drift Coupling & GSD Ecosystem Mapping (Module D).
- **Unified drift taxonomy** — 11 phenomena in `schema/drift_taxonomy.json` (name / surface / signal / metric / magnitude / citation per record); ≥10 phenomena in the unified table in the PDF.
- **Full CAPCOM gate chain** — W0/W1A/W1B/W1C/W2 advisory gates + W3 hard-block gate all PASS; zero force overrides. Gate reports in `milestone-package/gates/`.
- **Full-PDF Opus editorial review** (Phase 684.1) of all 29 papers: 24 supported, 5 partial, 0 mismatch, 0 unresolved. Average rigor score 4.03/5.

### 7 substrate defense modules (all default-off)

| Module | File | Surface | Default |
|--------|------|---------|---------|
| SD-score semantic-drift detector | `src/drift/semantic-drift.ts` | Knowledge | off |
| Early-stop + rerank hooks | `src/drift/knowledge-mitigations.ts` | Knowledge | off |
| Task-drift activation-delta monitor | `src/drift/task-drift-monitor.ts` | Alignment | off |
| TraceAlign behavioral-contamination index | `src/drift/bci.ts` | Alignment | off |
| Temporal-retrieval check (Δt-gap detection) | `src/drift/temporal-retrieval.ts` | Retrieval | off |
| Grounding-faithfulness assertion | `src/drift/grounding-faithfulness.ts` | Retrieval | off |
| BEE-RAG context-entropy guard | `src/drift/context-entropy.ts` | Retrieval | off |

### `skill-creator drift audit` CLI

```bash
node scripts/drift/drift-audit.mjs --format=markdown
node scripts/drift/drift-audit.mjs --format=json
```

Reads drift-telemetry logs, produces a per-surface scorecard. Exit code 0 on clean audit; non-zero on any CRITICAL finding. Documented at `docs/cli/drift-audit.md`.

### Corpus tie-in

- **9 college concepts** seeded across `data-science` (knowledge-drift, semantic-drift, drift-detection), `ai-computation` (alignment-drift, goal-drift, activation-delta-probe, response-semantic-drift, grounding-faithfulness), and `adaptive-systems` (context-equilibrium). Each has ≥2 relationships + `complexPlanePosition`.
- **4 tibsfox.com pages** published at `www/tibsfox/com/Research/DRIFT/` — hub (`index.html`) + knowledge + alignment + retrieval. Each cross-navigates to the others.
- **`series.js`** drift-hub entry added under "AI & Computation" Rosetta cluster.
- **`cross-references.json`** — ≥5 new edges: drift-hub ↔ AAR, drift-hub ↔ LLM, drift-hub ↔ SST, scope-drift ↔ staging-layer, plus module↔concept edges.

## Opt-In Surface

All seven defense modules are **disabled by default**. Existing v1.49.568 behavior is byte-identical unless you explicitly opt in. To enable any module, add to your `.claude/settings.json`:

```jsonc
{
  "gsd-skill-creator": {
    "drift": {
      "knowledge": {
        "semanticDrift": true,      // SD-score detector
        "earlyStop": true,          // early-stop hook
        "rerank": true              // rerank hook
      },
      "alignment": {
        "taskDriftMonitor": true,   // activation-delta monitor
        "bci": true                 // behavioral-contamination index
      },
      "retrieval": {
        "temporalCheck": true,      // Δt-gap detection
        "groundingFaithfulness": true,  // angular similarity check
        "contextEntropy": true      // BEE-RAG entropy guard
      }
    }
  }
}
```

When all flags are `false` (or absent), `npm test` output is identical to v1.49.568. This is verified by `src/drift/__tests__/default-off-invariance.test.ts`.

## How to Use the Drift Audit CLI

```bash
# Run a full audit against drift-telemetry logs
node scripts/drift/drift-audit.mjs --format=markdown

# Get machine-readable output for CI
node scripts/drift/drift-audit.mjs --format=json

# Validate BCI for a specific training pair
node scripts/drift/bci-validate.mjs --pair <training-pair-path>
```

Exit codes: `0` = clean audit; `1` = CRITICAL finding in any surface.

## Migration Notes

None. This release is a pure opt-in addition. No API changes, no schema changes, no behavior changes for consumers who do not modify their `settings.json`. The `src/drift/` modules are new and do not affect any existing import paths.

## Test Suite

Final: **26,135 passed | 1 skipped | 6 todo | 0 failing** across 1,445 test files. Duration 75.78 s. Typecheck (`npx tsc --noEmit`) exits 0. Zero regressions across all 18 phases.

Delta over the v1.49.568 baseline (25,903): +232. ROADMAP target was +75; actual 3.1x over-delivered. The over-delivery came from Half B defense modules — structurally more testable than the research-content phases.

## Credits

### Primary sources (15)

Spataru et al. 2024 (SD-score), Fastowski & Kasneci 2024 (knowledge uncertainty), Wu et al. 2025 (natural context drift), Mir 2025 (LSD detector), DRIFT 2026 (probe-based routing), Abdelnabi et al. 2024 (task-drift), Das et al. 2025 (TraceAlign BCI), Dongre et al. 2025 (context equilibria), ASI 2024 (multi-agent drift), SAIL 2024 (instruction arbitration), Wu et al. 2025 (response semantic drift in RAG), Liu 2026 (Chronos EEG), Afzal et al. 2024 (DriftLens), Shen et al. 2025 (BEE-RAG), Zhao et al. 2025 (grounding faithfulness).

### Supporting sources (14)

See `milestone-package/sources/index.bib` for full bibliography with arXiv IDs and DOIs.

### Academic lineage

Research methodology follows the CRAFT framework (Concept, Research, Analyze, Find, Test) across all four modules. Numerical citations and quote discipline enforced by the CAPCOM gate chain. Full editorial review of all 29 papers conducted by Opus (Phase 684.1).

## Links

- [Milestone retrospective](./RETROSPECTIVE.md) — per-phase deliverables, test deltas, deviations, process observations
- [CAPCOM gate sign-off](./CAPCOM-GATE.md) — W3 hard-block gate: GO (exit 0, zero force overrides)
- [Milestone-package archive](./milestone-package/) — PDF, LaTeX source, sources, schema, gate reports, audits

---

*v1.49.569 Drift in LLM Systems — 18 phases, 42-page research reference, 7 defense modules, 9 college concepts, 4 tibsfox.com pages — Closed 2026-04-23 — Status `ready_for_review`*

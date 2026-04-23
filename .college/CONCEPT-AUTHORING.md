# Concept Authoring Convention

**Canonical source:** Phase 679 (v1.49.568 Nonlinear Frontier) established the conventions in this document. See `.planning/phases/0679-concept-panel-activation/0679-CONTEXT.md` for the decision log (D-01..D-19).

**Scope:** This document governs how to add a new College of Knowledge concept — the `.ts` concept file, its Rosetta panels, the per-concept try-session module, the department-level test, and the DEPARTMENT.md entry.

**Audience:** Any contributor adding a new concept to any of the eight existing departments (mathematics, physics, chemistry, materials, environmental, data-science, adaptive-systems, logic) or creating a new department.

## 1. Hybrid Panel Placement

Rule established by **D-01**.

**Default: INLINE.** Populate the concept's `panels: new Map([...])` directly inside its `.ts` file. Reference shape: `.college/departments/mathematics/concepts/solitons.ts` (lines 32-53 — three panels Python + C++ + Lisp, inline Map construction).

**Exception: SPILLOVER.** When a panel ships *runnable code* (not pseudocode), move that panel's expression to `.college/departments/<dept>/panels/<lang>/<concept>.ts` and import it into the Map. Inline entries remain for panels without runnable code.

**Rule of thumb:** if the panel's `code` field would exceed ~5 lines of real code or needs test coverage of its own, spill it out. All 57 panels Phase 679 shipped are inline because they carry `explanation` only — no runnable `code` yet (see §Deferred).

**Type contract (do not modify):** `PanelId` + `PanelExpression` live in `.college/rosetta-core/types.ts`. `PanelId` is a fixed union of `'python' | 'cpp' | 'java' | 'lisp' | 'pascal' | 'fortran' | 'perl' | 'algol' | 'unison' | 'vhdl' | 'natural'` — every Map key must land inside this union.

## 2. Minimum-Viable Panel Content

Rule established by **D-02**.

A minimum-viable panel has exactly these fields:

- `panelId` — one of the `PanelId` union literals above.
- `explanation` — 3-5 sentences written in the idiom of the target language's community. Target 200-400 chars; hard cap 500. End with a single citation in `"Author YEAR"` or `"Author YEAR §N.N"` format. Pick ONE citation format per concept and stay consistent across all three of its panels.

**OMIT at minimum-viable:**
- `code` — deferred to a future milestone (see §Deferred). All 57 panels Phase 679 shipped have `explanation` only.
- `examples` — not used in Phase 679.

**OPTIONAL:**
- `pedagogicalNotes` — include only when it adds clear value beyond what `explanation` already covers; skip otherwise.

**Target panel count per concept: exactly 3** (≥ 3 enforced by the D-09 test). Typically Python + C++ + one domain-specific third. See §6 for the per-department third-panel assignment Phase 679 established.

**Idiom rule:** each `explanation` should read like it was written by someone who thinks in that language. Python copy uses numpy/list-comprehension framing; C++ copy uses RAII + templates + contiguous buffers; Lisp copy uses s-expressions + homoiconicity + macro-expansion framing; Fortran copy uses array sections + IFS-style numerical register; Java copy uses class hierarchies + JVM framing; Unison copy uses content-addressed terms + ability handlers; the "natural" panel uses the descriptive register (e.g., WMO taxonomy for environmental). See `.college/departments/mathematics/concepts/solitons.ts` for a canonical three-way Python/C++/Lisp example.

## 3. Try-Session-per-Concept Convention

Rules established by **D-04, D-05, D-06, D-07**.

Every concept ships with **one TypeScript try-session module** at `.college/departments/<dept>/try-sessions/<slug>.ts` where `<slug>` matches the concept file name (minus `.ts`). For example: concept `.college/departments/mathematics/concepts/solitons.ts` ships try-session `.college/departments/mathematics/try-sessions/solitons.ts`.

**Canonical reference:** `.college/departments/mathematics/try-sessions/solitons.ts` (22-minute, 7-step session over the soliton-resolution conjecture).

**Shape:**

```typescript
import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const <conceptCamelCase>Session: TrySessionDefinition = {
  id: '<dept-prefix>-<slug>-first-steps',
  title: '<Display Title>',
  description: '<1-2 sentence session summary>',
  estimatedMinutes: 20,  // integer in [15, 25]
  prerequisites: [],
  steps: [
    {
      instruction: '<observational, imperative, points at an artifact>',
      expectedOutcome: '<what the learner should understand>',
      hint: '<optional nudge>',
      conceptsExplored: ['<dept-prefix>-<slug>', '<cross-ref-1>', '<cross-ref-2>'],
    },
    // ... 4-7 more steps; 5-8 total
  ],
};
```

**Type contract (do not modify):** `TrySessionDefinition` + `TryStep` interfaces live in `.college/college/try-session-runner.ts` (lines 19-34). All new try-sessions satisfy this shape.

**Export name convention:** `<conceptCamelCase>Session` — e.g., `solitonsSession`, `k41CascadeSession`, `aiVerifiedProofSession`. The runner (Phase 679 Plan 09) uses duck-typed shape matching over `Object.values(mod)`, so the export name is not load-bearing — but stay consistent for readability.

**Session id convention:** `<dept-prefix>-<concept-slug>-first-steps` (e.g., `math-solitons-first-steps`, `physics-k41-cascade-first-steps`).

**Step count:** 5-8. Each step has mandatory `instruction` + `expectedOutcome` + `conceptsExplored` and an optional `hint`.

**estimatedMinutes:** integer in [15, 25].

**prerequisites:** `[]` unless a specific prior concept is required to start.

**Runtime loading:** `TrySessionRunner.loadSession(loader, dept, sessionId)` resolves `.ts` modules first, then `.js` (compiled/dist), then `.json` (legacy — the 6 pre-Phase-679 sessions: first-reaction, first-experiment, first-proof, first-venture, first-dataset, first-inquiry). See Phase 679 Plan 09 summary for the dual-loader implementation.

**Coexistence with existing JSON:** the 6 legacy JSON try-sessions stay as-is. The runner supports both formats byte-identically; JSON → TS migration is optional and can happen organically.

## 4. DEPARTMENT.md Row Format

Rules established by **D-11** (same-commit rule) and **D-12** (adaptive-systems wrinkle).

Each new concept gets exactly one row in its `DEPARTMENT.md`. Format varies per dept — follow the dept's existing pattern.

### 4a. Table format (mathematics, adaptive-systems)

4-column Markdown table. See `.college/departments/mathematics/DEPARTMENT.md` §Concepts (rows 17-29) for the canonical example.

```markdown
| Concept | Wing | Panels | Cross-References |
|---------|------|--------|-----------------|
| <Display Name> | <Wing Name> | Python, C++, <Third> | <targetId-1>, <targetId-2> |
```

### 4b. Wing-grouped list format (physics, chemistry, materials, environmental, data-science, logic)

Wing-grouped unordered list with a `(N concepts)` count in each wing header. See `.college/departments/physics/DEPARTMENT.md` §Concepts (lines 22-57) for the canonical example; the Phase 679 additions live under a new `### Fluid Dynamics & Atmosphere (4 concepts)` sub-section.

```markdown
### <Wing Name> (<N> concepts)
- <dept-prefix>-<slug> -- <short one-line description>
```

**Row separator:** space-dash-dash-space (` -- `), not em-dash, not hyphen.

Increment the wing's `(N concepts)` count when adding a row. If the concept doesn't fit an existing wing, create a new `### <New Wing Name> (1 concept)` sub-section (this is how Phase 679 introduced `Fluid Dynamics & Atmosphere` in physics, `Aerosol Microphysics` and `Cloud Taxonomy` in environmental, etc.).

### 4c. Adaptive-systems wrinkle (D-12)

`.college/departments/adaptive-systems/DEPARTMENT.md` organises content around a Panel A/B/C/D "Roots" narrative (Behavioural / Control-Theoretic / Physical-Systems / Biological). **Do NOT overwrite that narrative.** Instead, insert a new `## Concepts` section (4-col table format per §4a) alongside the existing `## Wings` and `## Panels` sections. Preserve all pre-existing content.

See `.college/departments/adaptive-systems/DEPARTMENT.md` lines 37-41 for the Phase 679 exemplar: a single-row Concepts table with `Lorenz Predictability Limit` at `Wing: Control-Theoretic (Panel B adjacent)`.

### 4d. Same-commit rule (D-11)

The DEPARTMENT.md row ships in the **same commit** as the concept it describes. **No end-of-phase batch docs commit.** Phase 679's 19 per-concept commits each touched: concept `.ts` + try-session `.ts` + dept-level test + DEPARTMENT.md + (if needed) barrel `concepts/index.ts`.

## 5. Test Pattern

Rules established by **D-08, D-09, D-10, D-13**.

Each department has one dept-level test file at `.college/departments/<dept>/concepts/<dept>-concepts.test.ts` with parametrized `it.each` over all new concepts.

**Canonical reference:** `.college/departments/mathematics/concepts/math-concepts.test.ts`. Phase 679 extended it to cover the 5 new math concepts; mirror its structure for the 7 other depts.

### Required assertions (per concept, per D-09)

For every new concept in the dept, the test asserts:

1. **Id + domain + description.** `concept.id` non-empty; `concept.domain === '<dept>'`; `concept.description.length > 10`.
2. **complexPlanePosition well-formed.** All four fields (`real`, `imaginary`, `magnitude`, `angle`) are numbers. `magnitude` equals `Math.sqrt(real² + imaginary²)` within 1e-5. `angle` equals `Math.atan2(imaginary, real)` within 1e-5.
3. **Relationships count.** `concept.relationships.length >= 2` (the 5 Phase 679 math additions raised the bar from the pre-Phase-679 `>= 1` baseline).
4. **Panels count + keys.** `concept.panels.size >= 3`; `.has('python')`, `.has('cpp')`, `.has('<dept-third>')` all true. `<dept-third>` comes from §6.
5. **Dept-local targetId resolution (D-13).** For each relationship whose `targetId.startsWith('<dept-prefix>-')`, the targetId resolves to a concept exported from the dept's `concepts/index.ts` barrel. **Cross-dept references** (`math-*` from a physics file, `culinary-*`, etc.) are **accepted without validation** — D-13 explicitly defers external-targetId audit to a future cleanup phase.

### Dept-local prefix conventions (Phase 679)

| Dept | Concept-id prefix |
|------|-------------------|
| mathematics | `math-` |
| physics | `physics-` |
| chemistry | `chemistry-` |
| materials | `materials-` |
| environmental | `environmental-` |
| data-science | `data-science-` |
| adaptive-systems | `adaptive-systems-` |
| logic | `logic-` |

**Caveat:** pre-Phase-679 concepts in `logic/` used a shortened `log-*` prefix, and physics concepts used `phys-*`. **New concepts follow the full-name prefix convention above.** The dept-local resolution assertion in §5 point 5 above uses the dept's full-name prefix.

## 6. Per-Department Third-Panel Assignment (Phase 679)

The third Rosetta panel per concept is domain-appropriate. Phase 679 established:

| Dept | Python + C++ + Third | Rationale |
|------|----------------------|-----------|
| mathematics | Lisp | MIT-AI tradition; symbolic manipulation idiom |
| physics | Fortran | ECMWF IFS / numerical-weather-prediction lineage |
| chemistry | Java | Cheminformatics ecosystem (CDK, OpenChem) |
| materials | Java | Same cheminformatics + phase-field tooling |
| environmental | Natural | WMO descriptive register for cloud taxonomies / aerosol regimes |
| data-science | Unison | Content-addressed pipelines; reproducible data ingest |
| adaptive-systems | Lisp | Classical AI / reinforcement-learning tradition |
| logic | Unison | Content-addressed term semantics align with proof objects |

Each third-panel choice reflects the language community historically closest to that domain's tooling.

## 7. Commit Convention

Each concept addition ships as **one atomic commit**. Conventional-commits format (enforced by the PreToolUse hook — see `CLAUDE.md` §Commit Convention):

```
feat(college): activate <concept-slug> panels + try-session + test
```

**Scope:** always starts with `college` (or a dotted path like `college/try-session-runner` when modifying runtime). The PreToolUse hook rejects commits that don't satisfy this.

**Subject length:** ≤ 72 chars. Imperative mood, lowercase, no trailing period.

**Atomic commit stages:**
- `concepts/<slug>.ts` — panels Map populated
- `try-sessions/<slug>.ts` — new `TrySessionDefinition` module
- `concepts/<dept>-concepts.test.ts` — extended or newly created
- `concepts/index.ts` — barrel export added (or created if first concept in dept)
- `DEPARTMENT.md` — row added (or new `## Concepts` section for adaptive-systems wrinkle)

**Pre-commit check:** run `npm test -- .college/departments/<dept>/` (path-scoped) before committing; exit 0 required. Run full `npm test` once at the end of a multi-concept batch.

## Deferred

Items intentionally out of Phase 679 scope (see `0679-CONTEXT.md` §Deferred Ideas for the full list):

- **Panel `code` field enrichment** — all 57 panels shipped in Phase 679 carry `explanation` only. A future milestone (post-v1.49.568) will add runnable code to each panel. Once a panel's `code` field exceeds ~5 lines, the hybrid rule (§1) triggers spillover to `.college/departments/<dept>/panels/<lang>/<concept>.ts`. Until then, `code` is omitted.
- **JSON → TS migration of 6 existing try-sessions** (first-reaction, first-experiment, first-proof, first-venture, first-dataset, first-inquiry) — the Phase 679 runner extension supports both formats, so migration is optional. Can happen organically when those sessions are touched later.
- **External-targetId audit** — some concepts reference IDs that don't yet resolve (e.g., `culinary-fractal-plating`). D-13 accepts these as dangling; a future cleanup phase can sweep `.college/` for external refs and either stub the missing concepts or trim the relationships.
- **Wing assignment revisit for adaptive-systems** — if the new Concepts table's `Wing` column ever exposes a mismatch with the Panel A/B/C/D structure, a follow-up can reconcile.

## Canonical References

In-tree exemplars for each artifact type:

- **Concept `.ts` shape** — `.college/departments/mathematics/concepts/solitons.ts`
- **Seed scaffolding** (complexPlanePosition computation) — `.college/departments/mathematics/concepts/solitons.ts` lines 14-20
- **Try-session shape** — `.college/departments/mathematics/try-sessions/solitons.ts`
- **Test pattern** — `.college/departments/mathematics/concepts/math-concepts.test.ts` (Phase 679 extended to 12 concepts with a separate `Phase 679 — new concept assertions` describe block)
- **DEPARTMENT.md table format** — `.college/departments/mathematics/DEPARTMENT.md` §Concepts + `.college/departments/adaptive-systems/DEPARTMENT.md` §Concepts (D-12 wrinkle)
- **DEPARTMENT.md list format** — `.college/departments/physics/DEPARTMENT.md` §Concepts (Phase 679 added `Fluid Dynamics & Atmosphere (4 concepts)` sub-section)
- **Rosetta type contracts** — `.college/rosetta-core/types.ts` (`PanelId`, `PanelExpression`, `ConceptRelationship`, `RosettaConcept`, `ComplexPosition`)
- **Try-session runtime + type contracts** — `.college/college/try-session-runner.ts` (`TrySessionDefinition`, `TryStep`, dual-loader `loadSession`)
- **Inline Map reference (seed + hello-world baseline)** — `.college/departments/test-department/concepts/basics/hello-world.ts`

---

*Established: Phase 679 (v1.49.568 Nonlinear Frontier), 2026-04-22.*
*Source decisions: see `.planning/phases/0679-concept-panel-activation/0679-CONTEXT.md` (D-01..D-19).*
*Maintained by: gsd-skill-creator College of Knowledge team.*

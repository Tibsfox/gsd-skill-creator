# v1.49.18 — Space Between Observatory

**Released:** 2026-03-06
**Scope:** standalone Vite+React engine for teaching mathematics through wonder, nature, and creative exploration — 8 observatory wings, 5 nature simulations, garden workshop, narrative layer, skill-creator bridge
**Branch:** dev → main
**Commits:** v1.49.17..v1.49.18 (16 commits, head `3736c3157`)
**Files changed:** 117 (+24,536 / −1)
**Predecessor:** v1.49.17 — The Space Between (cartridge format + muse vocabulary)
**Successor:** v1.49.19
**Classification:** feature — first standalone sub-project in the project, largest single-release code addition in v1.49.x
**Phases covered:** 588 (Wave 0 scaffold + 1A foundation + 2C simulations/garden + 2D narrative/bridge)
**New tests:** ~466 across `tests/core/`, `tests/integration/`, `tests/safety/`, `tests/visualization/`, `tests/wings/`
**Verification:** integration test suite (core registry + connections + progression + bridge + narrative + warden + full-integration) · safety-critical tests for phase gating · wings 1–4 and 5–8 wing-level tests

## Summary

**The Space Between Observatory ships as the first standalone sub-project in the codebase.** Before v1.49.18 every build artifact in this repository lived under the root `src/` tree and shared a single Vite config, a single `package.json`, a single test runner. The new `the-space-between-engine/` directory breaks that pattern deliberately — it has its own `package.json`, its own `vite.config.ts`, its own `tsconfig.json`, and its own test tree. It builds, tests, and ships independently of skill-creator. The integration bridge at `src/integration/skill-bridge.ts` maps foundations to complex-plane positions in the parent project, but that bridge is the only contract between the two. This is the cartridge composition pattern from v1.49.17 applied at the application level rather than the skill level: an independently-authored educational engine composes back into the parent system through a single well-defined seam. Getting this architecture right at v1.49.18 means future engines (music engines, simulation engines, research engines) can follow the same pattern without relitigating the boundary.

**Eight observatory wings implement a 6-phase progression from wonder to creation.** Every wing at `src/observatory/wings/` — unit-circle, pythagorean, trigonometry, vector-calculus, set-theory, category-theory, information-theory, l-systems — ships the same six phase components: `WonderPhase.tsx`, `SeePhase.tsx`, `TouchPhase.tsx`, `UnderstandPhase.tsx`, `ConnectPhase.tsx`, `CreatePhase.tsx`. The progression is pedagogical, not merely structural. Wonder comes first with zero mathematical notation — a learner encounters the idea through story before symbol. See introduces visualization. Touch introduces interaction. Understand introduces formal content. Connect draws cross-wing bridges. Create closes the loop by asking the learner to produce something of their own. This is the College Structure's progressive-disclosure principle applied to mathematics, and the fact that all eight wings implement the same six phases means the progression is enforceable by type system and testable by structure, not by convention.

**Five nature simulations turn abstract mathematics into tangible canvas experience.** The visualization framework at `src/visualization/nature/` ships sims for `set-visualizer`, `functor-bridge`, `tree-growth`, `magnetic-field`, and the supporting `unit-circle-explorer`, `fourier-decomposer`, `l-system-renderer`, `tide-simulator`, and `vector-field` infrastructure. Each sim hooks into the shared canvas system at `src/visualization/canvas.ts`, which provides a requestAnimationFrame loop with FPS tracking, pointer normalization across devices, and a consistent render contract. The architectural win is that the canvas system is reusable: any future educational pack, research simulation, or interactive chipset can build on top of it rather than reimplementing rendering primitives. 10 sim files, 1 framework, 1 canvas primitive — this is the infrastructure that future Observatory-style engines will inherit.

**The Wonder Warden safety pattern applies the skill-creator safety-warden discipline to pedagogy.** `src/integration/warden.ts` implements soft and hard phase gating: the soft mode surfaces a suggestion that the learner stay longer in the current phase before advancing; the hard mode blocks advancement entirely until the gating condition is met. This prevents premature exposure to mathematical notation — a learner cannot skip from Wonder to Understand without passing through See and Touch. The warden is covered by `tests/safety/safety-critical.test.ts`, the same class of test that guards the skill-creator's destructive-operation boundaries. Pedagogy is a safety domain: getting the sequence wrong causes lasting harm to a learner's mathematical intuition, and the warden encodes that safety property rather than leaving it to convention.

**The foundation registry is the engine's single source of truth for all progression logic.** `src/core/registry.ts` (1,489 lines) holds the full metadata for all 8 foundations across all 6 phases — 48 phase records total — plus the cross-wing connection metadata consumed by `src/core/connections.ts` and the state machine consumed by `src/core/progression.ts`. The `registry` module exports the canonical type layer in `src/types/index.ts` so that every wing component, every simulation, every narrative reference, and every integration test reads from the same schema. Centralizing the progression schema prevents the scatter that typically accumulates in multi-wing educational systems where each wing drifts into its own data shape. The BFS pathfinding in `src/core/connections.ts` means the engine can compute the shortest pedagogical path between any two mathematical foundations, which is the substrate the Telescope unified view uses to show 4 parallel progression chains simultaneously.

The narrative layer at `src/narrative/` ships three coordinated pieces that together compose the notation-free entry path: `wonder-stories/index.ts` holds the 8 wonder stories (one per foundation, zero notation), `hundred-voices-bridge/index.ts` integrates the 8 literary bridges from the Hundred Voices collection, and `reflection-prompts/index.ts` provides 20 reflection prompts that the Garden's Journal surfaces. The Garden at `src/observatory/garden/` — `ArtCanvas.tsx`, `MusicStudio.tsx` (Tone.js integration), `LSystemEditor.tsx`, `Journal.tsx` — is the creative workshop that closes the Create phase. A learner at the top of any wing can drop into the Garden, produce art or music or L-system output, and carry the artifact back into their progression record. This is "create with mathematics before learning the notation" made concrete: mathematics becomes a tool for artistic output rather than a set of symbols to memorize.

The Telescope unified view at `src/observatory/telescope/` renders 4 parallel progression chains at once, so a learner working on Unit Circle can see Pythagorean, Trigonometry, and Vector Calculus advance in parallel. `TelescopeChainData.ts` is the declarative config for which foundations share chains, and the BFS pathfinding in `core/connections.ts` drives which bridges light up when a phase completes. The Observatory Shell (`src/shell/`) wraps all of this with `App.tsx`, `Layout.tsx`, `Navigation.tsx`, `PhaseIndicator.tsx`, `ProgressBar.tsx`, `TransitionScreen.tsx`, `WelcomeBack.tsx`, `WingContainer.tsx`, and the dark-theme system in `theme.ts`. The shell is the navigation spine — every wing, the telescope, the garden, and the narrative overlays route through it, and the welcome-back state-restoration component means a learner returning after a break resumes at the exact phase they left.

Shipping the Observatory as a Vite+React sub-project was a deliberate architectural choice rather than a convenience. The parent repository's Tauri+Vite stack could have absorbed the engine, but coupling would have blocked three downstream options: (1) publishing the Observatory to the web independently of the desktop application, (2) swapping the rendering stack later without touching skill-creator, and (3) letting educational-pack authors fork the Observatory pattern for their own domains. The ~24,536-line code addition is large, but it lives in its own tree with its own boundary and its own test suite — a single `the-space-between-engine/` directory that can be extracted, published, or retired without touching the rest of the project. This is the largest feature addition in the v1.49.x series, and it sets the template for every subsequent engine-scale deliverable in the project.

## Key Features

| Area | What Shipped |
|------|--------------|
| Standalone sub-project | `the-space-between-engine/` — own `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, independent build and test |
| Observatory Shell | `src/shell/` — `App.tsx`, `Layout.tsx`, `Navigation.tsx`, `PhaseIndicator.tsx`, `ProgressBar.tsx`, `TransitionScreen.tsx`, `WelcomeBack.tsx`, `WingContainer.tsx`, `theme.ts` |
| Telescope unified view | `src/observatory/telescope/index.tsx` + `TelescopeChainData.ts` — 4 parallel progression chains across foundations |
| Foundation registry | `src/core/registry.ts` (1,489 lines) — 8 foundations × 6 phases, canonical metadata, the engine's source of truth |
| Connection graph | `src/core/connections.ts` — directed edges between foundations plus BFS pathfinding for shortest pedagogical path |
| Progression engine | `src/core/progression.ts` — immutable state management, phase transitions, state-restoration for welcome-back |
| 8 Observatory Wings | `src/observatory/wings/01-unit-circle` through `08-l-systems`, each with 6 phase components (Wonder, See, Touch, Understand, Connect, Create) |
| Canvas system | `src/visualization/canvas.ts` — RAF loop, FPS tracking, pointer normalization, shared render contract |
| Nature simulations | `src/visualization/nature/sims/` — set-visualizer, functor-bridge, tree-growth, magnetic-field, unit-circle-explorer, fourier-decomposer, l-system-renderer, tide-simulator, vector-field (10 sims + framework) |
| Garden creative workshop | `src/observatory/garden/` — `ArtCanvas.tsx`, `MusicStudio.tsx` (Tone.js), `LSystemEditor.tsx`, `Journal.tsx` |
| Narrative layer | `src/narrative/wonder-stories/` (8 stories, zero notation), `hundred-voices-bridge/` (8 literary bridges), `reflection-prompts/` (20 prompts) |
| Skill-creator bridge | `src/integration/skill-bridge.ts` — foundation → complex-plane position mapping; the only coupling point to the parent project |
| Calibration | `src/integration/calibration.ts` — learner-profile calibration bridging into the parent's calibration system |
| Wonder Warden | `src/integration/warden.ts` — soft/hard phase gating to prevent premature notation exposure |
| Test suite | `tests/core/`, `tests/integration/`, `tests/safety/`, `tests/visualization/`, `tests/wings/` — ~466 new tests across 13 test files |
| Housekeeping | `.gitignore` update for sub-project `package-lock.json`; fix to Agentic Programming doc link in `docs/applications/educational-packs.md` |

## Retrospective

### What Worked

- **Standalone Vite+React sub-project proved engine can live outside skill-creator's main build.** `the-space-between-engine/` has its own build, dependencies, and test suite. The integration bridge back to skill-creator's complex plane is a clean boundary, not a tight coupling — one file, one mapping, one contract.
- **Eight observatory wings with phased content (wonder, see, touch, understand, connect, create).** The 6-phase progression is the College Structure's progressive disclosure applied to mathematics — start with wonder (zero notation), end with creation. This is a genuine pedagogical architecture, not just content organization, and it is enforceable because every wing ships the same six phase components.
- **Five nature simulations with Canvas RAF loop and FPS tracking.** Interactive visualizations (set visualizer, functor bridge, tree growth, magnetic field, plus 6 supporting sims) make abstract mathematics tangible. The canvas system with pointer normalization is reusable infrastructure for any future interactive content or research engine.
- **Wonder Warden with soft/hard phase gating.** Preventing premature exposure to mathematical notation is the safety-warden pattern applied to pedagogy. Soft gating suggests staying longer; hard gating blocks advancement. This respects the learner's journey and encodes pedagogy as a first-class safety domain covered by `safety-critical.test.ts`.
- **Foundation registry centralization.** `core/registry.ts` at 1,489 lines holds all 8 foundations × 6 phases in one place, with `core/connections.ts` and `core/progression.ts` reading from that single schema. Centralizing progression logic prevents the per-wing drift that typically breaks multi-wing educational systems.
- **Integration tests covered the full stack.** `tests/integration/full-integration.test.ts` plus per-module tests (`bridge.test.ts`, `narrative.test.ts`, `warden.test.ts`) mean the engine is testable end-to-end, not just unit-level.

### What Could Be Better

- **~24,536 LOC is the largest code addition in the entire v1.49.x series.** The engine is comprehensive (8 wings, 10 sims, garden workshop, narrative layer, integration layer), but the maintenance surface is substantial. The Vite+React sub-project adds a second frontend framework to the overall project and the parent will now always need to consider sub-project coordination in its release cadence.
- **Garden creative workshop scope is ambitious for a single release.** Tone.js integration for a music studio and L-system editors are features that each could be their own milestone. Whether all four Garden tools (ArtCanvas, MusicStudio, LSystemEditor, Journal) are production-quality or proof-of-concept tier is not clearly marked in the release notes, and future work may need to triage them individually.
- **16 commits across 4 waves collapsed into one release tag.** Waves 0, 1A, 2C-1/2C-2, and 2D-1/2D-2 all landed under the v1.49.18 tag. Individual wave-level tagging would have made bisection easier for future regression triage, and a wave-commit-marker convention (like the one in CLAUDE.md for session-boundary collapses) would have preserved the wave structure in the log.
- **No Storybook or component catalog for the wing phase components.** Eight wings × six phase components = 48 React components, plus the Shell's 9 components and the Garden's 4, totals 61 React components with no browsable catalog. A Storybook or equivalent would have accelerated the wing-to-wing consistency review.
- **Sub-project tests run separately from the parent suite.** The ~466 new tests in `the-space-between-engine/tests/` don't show up in the root `npm test` count without explicit cross-project orchestration. Future work should surface sub-project test counts in the root test summary so quality regressions in engines are visible at the top level.

## Lessons Learned

- **Mathematics education should start with wonder, not notation.** The 8 wonder stories with zero mathematical notation, followed by nature simulations, followed by formal content — this progression respects how people actually build mathematical intuition. Every wing ships a `WonderPhase.tsx` before its `UnderstandPhase.tsx` for this reason.
- **Standalone sub-projects with integration bridges are the right architecture for engines.** The Space Between Engine doesn't need skill-creator's build system to function, but it can bridge back when running inside the ecosystem. This is the cartridge composition pattern from v1.49.17 applied at the application level, and it sets the template for every future engine-scale deliverable.
- **Interactive visualizations turn abstract mathematics into tangible experience.** The Canvas RAF loop with FPS tracking and pointer normalization at `src/visualization/canvas.ts` is reusable infrastructure. Future interactive educational content should build on this foundation rather than reimplementing rendering primitives from scratch.
- **Foundation registry with full metadata is the engine's source of truth.** Centralizing all progression logic in `core/registry.ts` (1,489 lines, 8 foundations, 6 phases each) makes the system auditable and prevents scattered state. Every wing component reads from the registry; no wing owns its own progression schema.
- **Pedagogical safety deserves a first-class warden.** The Wonder Warden's soft/hard gating pattern — implemented in `integration/warden.ts` and covered by `safety/safety-critical.test.ts` — treats premature notation exposure as a safety failure, not a UX nit. Every future educational engine should ship its own domain-specific warden rather than leaving sequencing to convention.
- **Type systems enforce pedagogical structure more reliably than documentation.** Because every wing exports the same six phase components (`WonderPhase`, `SeePhase`, `TouchPhase`, `UnderstandPhase`, `ConnectPhase`, `CreatePhase`), the progression contract is enforceable at compile time. Documentation-only conventions would have drifted across 8 wings within a single release cycle.
- **Integration tests and safety tests are separate concerns and need separate test trees.** Splitting `tests/integration/` from `tests/safety/` means the warden's invariants live with the engine's behavioural tests rather than mixing them. This matches the skill-creator parent's treatment of `security-hygiene` as a distinct test surface.
- **Create-phase artifacts close the pedagogical loop.** The Garden's ArtCanvas, MusicStudio, LSystemEditor, and Journal let a learner produce output and carry it back into their progression record. Teaching that ends at Understand leaves knowledge inert; teaching that ends at Create gives the learner something to show.
- **Telescope-style parallel views reduce cognitive tunnelling.** Rendering 4 progression chains at once (via `TelescopeChainData.ts`) prevents the learner from losing sight of the wider mathematical landscape while drilling into one foundation. Every future multi-wing engine should consider a unified view as a first-class shell primitive.
- **Housekeeping commits belong in the release that triggered them.** The `.gitignore` change for the sub-project `package-lock.json` and the Agentic Programming link fix both belong in v1.49.18 because the sub-project introduced the need for them. Splitting them into a follow-up patch would have fragmented the release narrative.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.17](../v1.49.17/) | Predecessor — introduced the cartridge composition format that this engine applies at the application level |
| [v1.49.19](../v1.49.19/) | Successor — next release in the v1.49 train |
| [v1.49.16](../v1.49.16/) | Predecessor² — Muse Integration & MCP Pipeline; the muse vocabulary that the narrative layer draws on |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — the system the skill-creator bridge maps foundations into |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — 451 primitives across 10 domains; the foundational-math substrate the Observatory teaches |
| [v1.34](../v1.34/) | Documentation Ecosystem — canonical docs/ source model that `docs/applications/educational-packs.md` belongs to |
| [v1.30](../v1.30/) | Vision-to-Mission Pipeline — the build-spec-from-vision pattern that drove Phase 588's scaffold |
| [v1.29](../v1.29/) | Electronics Educational Pack — earlier educational-pack pattern the Observatory iterates on |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — 35 packs across 3 tiers; the knowledge-pack lineage the Observatory descends from |
| [v1.22](../v1.22/) | Minecraft Knowledge World — spatial curriculum ancestor; the "create with before learning" pattern |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — Tauri+Vite shell the parent uses; the Observatory's Vite stack is parallel |
| [v1.18](../v1.18/) | Information Design System — the shape+color encoding discipline the Observatory inherits |
| [v1.0](../v1.0/) | Core Skill Management — the 6-step adaptive learning loop the Observatory's 6-phase progression mirrors at engine level |
| `the-space-between-engine/` | The engine itself — independent sub-project introduced in this release |
| `docs/applications/educational-packs.md` | Documentation updated with the Agentic Programming link fix |
| `.gitignore` | Updated to exclude the sub-project `package-lock.json` |
| `src/integration/skill-bridge.ts` | The only coupling point between the engine and skill-creator's complex plane |
| `tests/safety/safety-critical.test.ts` | Safety-gate test that locks in the Wonder Warden invariants |

## Engine Position

v1.49.18 is the first standalone sub-project release in the project. The v1.49.x series before this release layered features onto the root `src/` tree; v1.49.18 breaks the tree into a parent-plus-engine topology that every subsequent engine-scale deliverable will reuse. The Observatory sits downstream of v1.49.17's cartridge format (which established packaging-by-composition) and upstream of later releases that will ship additional engines under the same pattern. Within the v1.49.x release train, v1.49.18 is also the largest single-release code addition at ~24,536 LOC, and the 16 commits it absorbed span Wave 0 scaffold, Wave 1A foundation, Wave 2C simulations and garden, and Wave 2D narrative and skill-creator bridge — four internal waves landed under one release tag. The successor v1.49.19 builds on the Observatory pattern; the predecessor v1.49.17 is the compositional substrate the engine plugs back into. The skill-bridge at `src/integration/skill-bridge.ts` ties the engine to the complex-plane framework introduced in v1.37, so the lineage v1.37 → v1.49.17 → v1.49.18 is load-bearing for understanding where this release fits in the project's long arc.

## Files

- `the-space-between-engine/` — new standalone sub-project root; own `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`
- `the-space-between-engine/src/core/` — `registry.ts` (1,489 lines), `connections.ts`, `progression.ts` — foundation/connection/state core
- `the-space-between-engine/src/observatory/wings/` — 8 wings × 7 files each (6 phase components + index.tsx) = 56 files plus shared `wings/index.ts`
- `the-space-between-engine/src/observatory/telescope/` — `index.tsx` + `TelescopeChainData.ts` (4 parallel progression chains)
- `the-space-between-engine/src/observatory/garden/` — `ArtCanvas.tsx`, `MusicStudio.tsx`, `LSystemEditor.tsx`, `Journal.tsx`, `index.tsx` (creative workshop)
- `the-space-between-engine/src/visualization/` — `canvas.ts` (RAF loop, FPS, pointer normalization); `nature/framework.ts` + `nature/sims/` (10 sim files)
- `the-space-between-engine/src/narrative/` — `wonder-stories/index.ts` (8 stories), `hundred-voices-bridge/index.ts` (8 bridges), `reflection-prompts/index.ts` (20 prompts)
- `the-space-between-engine/src/integration/` — `skill-bridge.ts`, `calibration.ts`, `warden.ts` (3 integration files)
- `the-space-between-engine/src/shell/` — `App.tsx`, `Layout.tsx`, `Navigation.tsx`, `PhaseIndicator.tsx`, `ProgressBar.tsx`, `TransitionScreen.tsx`, `WelcomeBack.tsx`, `WingContainer.tsx`, `theme.ts`, `index.ts`
- `the-space-between-engine/src/types/index.ts` — canonical TypeScript type layer shared across core, wings, sims, and integration
- `the-space-between-engine/tests/` — 13 test files across `core/`, `integration/`, `safety/`, `visualization/`, `wings/` (~466 new tests)
- `.gitignore` — added sub-project `package-lock.json` exclusion
- `docs/applications/educational-packs.md` — Agentic Programming doc link fix

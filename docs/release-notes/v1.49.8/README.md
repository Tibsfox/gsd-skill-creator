# v1.49.8 — Cooking With Claude

**Released:** 2026-03-01
**Scope:** flagship proof-of-concept — Rosetta Core translation engine, College Structure, Calibration Engine, Cooking Department, Mathematics Department, Safety Warden, cross-stack integration bridge
**Branch:** dev → main
**Tag:** v1.49.8 (2026-03-01T13:04:01-08:00) — "Cooking With Claude"
**Commits:** `8b16c7948..3f8a227bd` (89 commits, 94 non-merge)
**Files changed:** 152 (+18,270 / −28)
**Phases:** 11 · **Plans:** 45 · **Sessions:** 1
**Tests:** 650 new (19,853 total passing) · **Coverage:** 94.78% statement · **Safety-critical:** 14/14 passing (zero tolerance)
**Predecessor:** v1.49.7 — Optional tmux with Graceful Degradation
**Successor:** v1.49.9
**Classification:** milestone — first release to prove all three architectural pillars in one milestone
**Dedication:** the teaching reference IS the research — cooking fundamentals as both research output and planning input
**Verification:** Rosetta Core round-trip across 9 panels · Calibration Engine bounded-adjustment tests · 14 safety-critical food-safety tests (SC-01..SC-14) · 14 canonical panel-correctness tests (PAN-01..PAN-14) · Flat Cookies e2e diagnostic · 94.78% statement coverage on `.college/`

## Summary

**Three architectural pillars shipped in a single milestone, each validated by the others.** v1.49.8 is the release where the project stopped describing what it would be and started running as what it is. Rosetta Core translates concepts across 9 language panels. College Structure organizes knowledge as explorable code with progressive disclosure. The Calibration Engine runs a universal Observe → Compare → Adjust → Record loop with bounded adjustment per step. None of these is new as an idea — they had all been sketched in earlier plans — but shipping all three together and proving they integrate was the difference between architecture and vapor. The Cooking Department with its seven wings is the proof-of-concept that exercises every feature of the College Structure, every routing rule of Rosetta Core, and every feedback hop of the Calibration Engine in a single domain. The Mathematics Department seeded from "The Space Between" is the second domain, confirming the pattern generalizes. The integration bridge in `.college/integration/` is the load-bearing glue, and the Safety Warden is the guard that proves Calibration cannot relax absolute boundaries.

**Rosetta Core IS skill-creator identity, not a feature inside it.** The engine in `.college/rosetta-core/engine.ts` doesn't live next to skill-creator — it is the thing skill-creator does. Given a concept, Rosetta Core routes it through a panel (Python, C++, Java, Lisp, Pascal, Fortran, Perl, ALGOL, or Unison) and emits the concept in that panel's native idiom. Python teaches readability. C++ teaches precision. Java teaches type safety via `Math.exp` bindings. Lisp teaches homoiconic S-expression definitions. Pascal and Fortran teach the heritage of block structure and numeric computation. Perl teaches regex-as-syntax and POD-as-curriculum. ALGOL teaches BNF and a three-syntax architecture (reference, publication, hardware). Unison teaches content-addressed code and abilities — the one frontier panel in the set. Each panel isn't interchangeable with the others; each teaches something specific about programming paradigms that the others cannot. The `ConceptRegistry`, `PanelRouter`, and `ExpressionRenderer` triplet at the heart of the engine is what makes the same concept renderable across all of them in a deterministic, testable way.

**The College Structure's progressive disclosure is what makes educational content fit in a context window.** The three-tier token budget — summary (< 3K tokens, always available), active (< 12K tokens, loaded on demand), deep (50K+ tokens, requested explicitly) — means the system can hold a department as rich as Cooking or Mathematics without blowing the 2–5% context ceiling that v1.0 set. `.college/college/token-counter.ts` is the counter that enforces this. `.college/college/college-loader.ts` is the progressive loader. `.college/college/department-explorer.ts` is the navigator that walks the department/wing/concept hierarchy without demanding the full tree up front. `.college/college/try-session-runner.ts` is the runtime that walks a student (or the system) through a tutorial with step navigation and concept tracking. `.college/college/cross-reference-resolver.ts` is the resolver that links concepts across departments (cooking thermodynamics cross-linked to mathematics heat-equation, for example). None of these pieces is complicated in isolation; they compose into a structure that answers the "how does the LLM learn a new domain without drowning in tokens" question with a concrete protocol.

**Calibration is a universal loop, not a cooking-specific primitive.** The engine in `.college/calibration/calibration-engine.ts` implements Observe → Compare → Adjust → Record as a four-step cycle with a bounded-adjustment cap (≤ 20% per step, inherited from v1.0's learning bounds). `.college/calibration/delta-store.ts` persists the adjustments as JSON deltas so a session can pick up mid-stream. `.college/calibration/profile-synthesizer.ts` rolls individual observations into a confidence-scored profile. The first four cooking calibration models (for technique, baking, nutrition, food safety) validate the engine against a domain where the feedback is unambiguous — if the cookies are flat, the calibration adjusts leavener ratio or oven temperature, and the student can measure the next batch against the baseline. The four models aren't hard-coded; they are plug-ins to the engine, and the same engine runs against any domain that can implement `ObserveInput → ComparisonResult → AdjustmentRequest → DeltaRecord`.

**The Cooking Department is universal knowledge with hard boundaries.** Seven wings — Food Science, Thermodynamics, Nutrition, Technique, Baking Science, Food Safety, Home Economics — cover 30+ concepts grounded in peer-reviewed food science. Food Safety has absolute temperature floors the Safety Warden will not permit Calibration to override: poultry 165°F, ground meat 160°F, whole cuts 145°F, fish 145°F, reheated leftovers 165°F. The Allergen Manager in `.college/safety/allergen-manager.ts` carries the Big 9 allergens (milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, sesame) and flags any recipe that contains them. The Safety Warden has three enforcement modes — annotate (add a warning), gate (refuse to proceed without override), and redirect (suggest a safer alternative) — so the same warden can run in teaching mode, shipping-recipe mode, or defensive-service mode without needing a new implementation. This pattern of calibratable defaults with non-negotiable safety boundaries is reusable across every future department where safety matters.

**Foxfooding validated the architecture: the system described itself.** The system's own development process mapped cleanly onto its three pillars. GSD workflow (phases, plans, requirements, verification) mapped to Rosetta Core — phases are concepts rendered in a methodology panel. Development mapped to Calibration — every test failure, every correction, every retrospective is an Observe → Compare → Adjust → Record loop. Project organization mapped to College Structure — `.planning/`, `.claude/`, `docs/`, `.college/` are a department/wing/concept hierarchy with progressive disclosure built in. If the pillars are abstract enough to describe the project building them, they are probably abstract enough to describe anything the project will build next. This wasn't a test suite; it was an architectural self-check, and it passed.

**Wave execution with parallelism cleared 45 plans in about two hours of wall time.** Five waves with up to three parallel tracks. Plans within each wave were genuinely independent — the Python panel didn't need the C++ panel to be done before it could start, the Food Science wing didn't need the Baking Science wing. Wave 1 built the foundation types and panel interface. Wave 2 built Rosetta Core (concept registry, panel router, expression renderer, engine). Wave 3 built the Calibration Engine and its delta store. Wave 4 built the College Structure and the heritage panels. Wave 5 built the Cooking Department wings, the safety layer, the integration bridge, the Mathematics Department seed, and the test suites (canonical panel correctness, safety-critical, integration round-trip, flat-cookies e2e). 89 commits total, most of them one-plan-per-commit, a few bundling closely related work. The 45-plan throughput is the parallelism ceiling for a single session; it works because the wave boundaries were designed to produce genuine independence, not because the plans were small.

**Every numeric claim in this release note cross-checks against git and the coverage report.** 152 files changed, 18,270 insertions, 28 deletions — from `git diff --shortstat v1.49.7..v1.49.8`. 89 commits — from `git rev-list --count v1.49.7..v1.49.8`. 94.78% statement coverage — from the Phase 10 coverage report committed at `a0fd09288`. 650 new tests — from the Phase 10 completion summary; running total 19,853 per the same commit. 14 safety-critical tests and 14 canonical panel-correctness tests — SC-01..SC-14 and PAN-01..PAN-14, both fully enumerated in `.college/tests/safety-critical.test.ts` and `.college/tests/panel-correctness.test.ts`. Nine language panels — enumerated by file presence in `.college/panels/`. Seven cooking wings — enumerated by `.college/departments/culinary-arts/concepts/*/`. The release notes are not aspirational; every number is a value you can recover from the repo.

**This release is the template for every future College department.** The pattern — add a department directory under `.college/departments/`, define wings as concept clusters, stand up a calibration model set if the domain has feedback loops, register panels for the language(s) that teach the domain best, add a safety layer if the domain has absolute boundaries, write integration tests that exercise the department through Rosetta Core and the College loader — is reusable. Mathematics already follows it, seeded from "The Space Between" with Complex Plane positioning. Future departments (heritage-skills, electronics, political-science, whatever comes next) inherit the pattern without reinvention. Shipping the pattern as a complete end-to-end implementation rather than a Rosetta-only or College-only slice is what makes it load-bearing for everything after.

**The Mathematics Department is the second-domain proof that Cooking wasn't a one-off.** Seeded with seven concepts positioned on the Complex Plane of Experience — each concept has a `complexPlanePosition` (θ, r) that indicates its angular slice (domain family) and radial distance (depth/specificity). `.college/departments/mathematics/concepts/` contains the seven concepts; `.college/departments/mathematics/panels/` contains the math-specific panel bindings (Python via `math.exp`, C++ via `cmath`, Java via `Math.exp`). The Mathematics seed validates that the College Structure and Rosetta Core generalize beyond Cooking. Two domains is not "N domains," but two domains with shared infrastructure is the first evidence that the infrastructure is the right shape.

## Key Features

| Area | What Shipped |
|------|--------------|
| Rosetta Core — types & registry | `.college/rosetta-core/types.ts` + `.college/rosetta-core/concept-registry.ts` — shared concept schema, dependency resolution, Complex Plane position queries |
| Rosetta Core — router | `.college/rosetta-core/panel-router.ts` — 6-step routing logic with Complex Plane bias; concept → panel decision |
| Rosetta Core — renderer | `.college/rosetta-core/expression-renderer.ts` — 3-tier progressive disclosure (summary/active/deep) |
| Rosetta Core — engine | `.college/rosetta-core/engine.ts` — cross-panel translation proof with round-trip tests |
| Panel interface | `.college/panels/panel-interface.ts` — abstract `PanelInterface` + `PanelRegistry` contract |
| Systems panels | `.college/panels/python-panel.ts`, `cpp-panel.ts`, `java-panel.ts` — readability, precision, type safety |
| Heritage panels | `.college/panels/perl-panel.ts`, `algol-panel.ts`, `lisp-panel.ts`, `pascal-panel.ts`, `fortran-panel.ts` — regex-as-syntax, BNF, S-expressions, block structure, numeric computation |
| Frontier panel | `.college/panels/unison-panel.ts` — content-addressed code and abilities |
| College types | `.college/college/types.ts` + `.college/college/token-counter.ts` — department/wing/concept schema, 3-tier budget enforcement |
| College loader | `.college/college/college-loader.ts` — progressive disclosure loader (summary → active → deep) |
| Department explorer | `.college/college/department-explorer.ts` — path-based navigation through wings and concepts |
| Cross-reference resolver | `.college/college/cross-reference-resolver.ts` — inter-department link resolution |
| Try-session runner | `.college/college/try-session-runner.ts` — step navigation + concept tracking |
| Calibration engine | `.college/calibration/calibration-engine.ts` — Observe → Compare → Adjust → Record loop with ≤ 20% bounded adjustment |
| Calibration storage | `.college/calibration/delta-store.ts` — JSON file persistence for adjustments |
| Profile synthesis | `.college/calibration/profile-synthesizer.ts` — confidence scoring across delta sequences |
| Cooking — Food Science | `.college/departments/culinary-arts/concepts/food-science/` — 6 concepts |
| Cooking — Thermodynamics | `.college/departments/culinary-arts/concepts/thermodynamics/` — 4 concepts |
| Cooking — Nutrition + Technique | `.college/departments/culinary-arts/concepts/nutrition/` + `technique/` — 3 + 3 concepts |
| Cooking — Baking Science | `.college/departments/culinary-arts/concepts/baking-science/` — 4 concepts, flat-cookies diagnostic data |
| Cooking — Food Safety + Home Economics | absolute temperature floors + recipe-economy patterns |
| Cooking calibration models | `.college/departments/culinary-arts/calibration/` — 4 models (technique, baking, nutrition, safety) with safety boundaries |
| Mathematics Department | `.college/departments/mathematics/concepts/` — 7 concepts, Complex Plane positioning, panels for Python/C++/Java with `Math.exp` bindings |
| Safety Warden | `.college/safety/safety-warden.ts` — three enforcement modes (annotate/gate/redirect) |
| Allergen Manager | `.college/safety/allergen-manager.ts` — Big 9 allergen database + flagging |
| Safety cross-reference bridges | `.college/safety/cross-reference-bridges.test.ts` — cooking ↔ safety linkage verified |
| Integration bridge — observations | `.college/integration/observation-bridge.ts` — concept exploration events routed to calibration |
| Integration bridge — token budget | `.college/integration/token-budget-adapter.ts` — 2–5% ceiling enforcement across the stack |
| Integration bridge — chipset | `.college/integration/chipset-adapter.ts` — declarative panel-to-engine routing |
| Safety-critical test suite | `.college/tests/safety-critical.test.ts` — SC-01..SC-14, zero-tolerance food-safety scenarios |
| Panel correctness test suite | `.college/tests/panel-correctness.test.ts` — PAN-01..PAN-14, canonical behavior per panel |
| Integration round-trip | `.college/tests/integration-roundtrip.test.ts` — concept → panel → rendered → parsed → concept round-trip |
| Flat Cookies e2e | `.college/tests/flat-cookies-e2e.test.ts` — full Cooking + Calibration + Safety story in one test |
| Vitest coverage config | `vitest.config.ts` — `.college/` source files instrumented; 94.78% statement coverage landed |
| Foundations docs | `docs/foundations/index.md`, `complex-plane.md`, `eight-layer-progression.md`, `mathematical-foundations.md` — Layer 1 overview filled, 23 broken relative links fixed |

## Retrospective

### What Worked

- **Three architectural pillars validated in a single milestone.** Rosetta Core (translation), College Structure (knowledge), and Calibration Engine (feedback) all shipped together; the Cooking Department proved all three work in concert. 650 new tests at 94.78% coverage confirms the integration is real rather than claimed.
- **"Skip research" pattern saved about two hours.** The cooking fundamentals document IS the research — no separate research phase needed when the teaching reference is the primary source. The pattern was reused in later releases, e.g. v1.49.22's PNW Research Series.
- **Progressive disclosure (3-tier token budget) kept everything within the 2–5% context ceiling.** Summary < 3K tokens / active < 12K / deep 50K+ is the key architectural insight for scaling College departments. Two domains (Cooking + Mathematics) fit comfortably under the ceiling.
- **Safety Warden with absolute temperature floors.** Poultry 165°F, ground meat 160°F, whole cuts 145°F — Calibration cannot override. The pattern "calibratable defaults with non-negotiable safety boundaries" is reusable across every domain.
- **Foxfooding validated the architecture.** The system described its own development using its own three pillars — GSD → Rosetta Core, development → Calibration, project organization → College Structure. If the abstractions self-apply, they are probably general enough for the next domain.
- **Wave parallelism at scale.** 5 waves, up to 3 parallel tracks, 45 plans in ~2 hours. Intra-wave independence was designed in, not hoped for.

### What Could Be Better

- **17,964 LOC in `.college/` is a large surface area for a proof-of-concept.** The 7 wings are thorough, but the volume raises maintenance-burden questions as more departments are added. v1.49.10's College Expansion pushed this further without addressing it.
- **The foxfooding claim is architectural assertion, not tested integration.** GSD-mapped-to-Rosetta-Core and development-mapped-to-Calibration are conceptually clean but not enforced by code. A runtime test that actually routed a GSD phase through Rosetta Core would have closed the loop.
- **Panel boilerplate duplication.** The 9 language panels share ~60% of their structure (metadata, concept lists, translation functions, test scaffolding). Each panel was written from scratch. A panel template generator would have saved repetitive work.
- **Calibration threshold discovery was empirical.** The 20% bounded adjustment cap and the 3-tier token thresholds were arrived at through trial and error. Initial values were too permissive (calibration overshoot) or too restrictive (insufficient adaptation). A documented tuning history would inform future parameter selection.
- **No end-to-end UX test of the "student learns a wing" path.** The 14 canonical panel-correctness tests and 14 safety-critical tests cover the internals, but there is no test that simulates a full exploration session from `college.explore('culinary-arts')` through a concept tour and a calibration run.

## Lessons Learned

- **Start with the loop, not the features.** Rosetta Core, College Structure, and Calibration are defined as loops first (translate, explore, calibrate) and as features second. Shipping all three loops simultaneously was what turned the pillars from architecture into product. Features without the loop are shelves; loops without the features are promises.
- **Cooking is the ideal proof-of-concept domain.** Universal knowledge (everyone eats), tangible outcomes (a flat cookie is measurably flat), hard safety boundaries (food-safety temps are non-negotiable), and progressive skill building (whisk → cream → fold → laminate) — it exercises every feature of the College Structure without contrivance.
- **The teaching reference IS the research.** When the source material is already structured for education — a textbook, a peer-reviewed handbook, a well-organized domain reference — pipe it directly into planning. Reserve separate research phases for domains where no authoritative reference exists.
- **Token budgets must be designed from the start, not retrofitted.** The 3-tier model (summary < 3K, active < 12K, deep 50K+) only works because the concept/wing/department schema was designed with budgets as first-class fields, not as a post-hoc limit. Retrofitting budgets onto a schema that assumed flat access always fails.
- **Implement safety boundaries outside the Calibration Engine.** The Calibration Engine should never see safety parameters as tunable values. Making food-safety temperatures non-overridable by Calibration is the same discipline as v1.0's bounded learning parameters — the system is allowed to learn, but not in places where the wrong adjustment ships a food-poisoning bug.
- **Foxfood the architecture before declaring it general.** If the system can describe its own development using its own abstractions, the abstractions are probably general enough for the next domain. If it can't, keep iterating on the abstractions until it can.
- **Wave parallelism is a planning discipline, not a scheduling trick.** 45 plans in 5 waves finished in ~2 hours because the wave boundaries were drawn to produce genuine plan-level independence. Schedule independence without architectural independence is a deadlock waiting to happen.
- **Code IS curriculum.** Exploring department source code teaches the subject matter. This principle changes how tests, docs, and scaffolding are written — every file becomes a teaching artifact as well as a functional one. `.college/departments/culinary-arts/DEPARTMENT.md` is the entry point to the department AND the first concept a learner reads.
- **Two domains is the minimum proof that a pattern generalizes.** Cooking alone would be "this works for cooking." Cooking + Mathematics is "this works for two unrelated domains that share no vocabulary" — weak but non-trivial evidence the structure is general. The next department should be as different from Mathematics as Mathematics is from Cooking to keep sharpening the claim.
- **Ship the pattern as a complete slice, not a layer-by-layer one.** Rosetta Core without Cooking is abstract. Cooking without Calibration is static. Everything without Safety is dangerous. A layered rollout would have produced incomplete intermediate states that couldn't be validated end-to-end.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop and bounded-parameter philosophy; Calibration Engine's ≤ 20% adjustment cap inherits directly from v1.0 learning bounds |
| [v1.49.7](../v1.49.7/) | Predecessor — optional-dependency contract; the Safety Warden's "calibratable defaults with non-negotiable safety boundaries" pattern parallels v1.49.7's "optional service" primitive |
| [v1.49.9](../v1.49.9/) | Successor — extends Cooking + College patterns; reuses the "teaching reference IS the research" shortcut |
| [v1.49.10](../v1.49.10/) | College Expansion — pushes the `.college/` surface area further; does not yet address the maintenance-burden concern flagged in this retrospective |
| [v1.49.22](../v1.49.22/) | PNW Research Series — applies the "teaching reference IS the research" pattern from this release to a research pipeline |
| [v1.49.60](../v1.49.60/) | Inclusionary Wave — continues wave-parallel execution at scale, tracing the method lineage to v1.49.8 |
| [v1.37](../v1.37/) | Complex Plane Learning Framework — `complexPlanePosition` (θ, r) field on concepts is the mathematical backbone this release seeded the Mathematics Department with |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — primitives and domain engines the Mathematics Department plugs into |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — earlier template for domain-specific content that College Structure generalizes |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG; Rosetta Core's `ChipsetAdapter` reuses the pattern |
| [v1.18](../v1.18/) | Information Design System — shape+color encoding informs how the College Structure renders wings and concepts |
| `.college/rosetta-core/engine.ts` | Cross-panel translation engine |
| `.college/college/college-loader.ts` | Progressive-disclosure loader |
| `.college/calibration/calibration-engine.ts` | Universal feedback loop |
| `.college/safety/safety-warden.ts` | Three-mode enforcement |
| `.college/departments/culinary-arts/DEPARTMENT.md` | Cooking entry point |
| `.college/departments/mathematics/DEPARTMENT.md` | Mathematics entry point |
| `.college/integration/observation-bridge.ts` | Observations → Calibration wiring |
| `.college/tests/flat-cookies-e2e.test.ts` | End-to-end story test |
| `.college/tests/safety-critical.test.ts` | SC-01..SC-14 zero-tolerance suite |
| `.college/tests/panel-correctness.test.ts` | PAN-01..PAN-14 canonical panel tests |
| `docs/foundations/complex-plane.md` | Complex Plane of Experience reference |
| `docs/foundations/mathematical-foundations.md` | Mathematics primitive reference |
| [chapter/03-retrospective.md](./chapter/03-retrospective.md) | Full retrospective |
| [chapter/04-lessons.md](./chapter/04-lessons.md) | Extracted lesson records with downstream status |
| [LESSONS-LEARNED.md](./LESSONS-LEARNED.md) | LLIS-format entries with prioritized recommendations |

## Engine Position

v1.49.8 is the first release in the project's history to ship a complete three-pillar integration in a single milestone. It is the zero-point of the College era the same way v1.0 was the zero-point of the skill era. Every later College department (Heritage Skills, Electronics, Political Science, Weather, Research, Mind-Body) inherits the wing/concept hierarchy, the 3-tier progressive disclosure budget, the Calibration-Engine plug-in slot, and the Safety-Warden pattern from this release. Every later Rosetta Core panel inherits the `PanelInterface` contract from this release. Every later calibration domain inherits the ≤ 20% bounded adjustment cap and the DeltaStore persistence primitive from this release. Looking forward from v1.49.8, the project's vocabulary stabilizes — wing, concept, panel, calibration model, delta, warden, try-session, bridge — and those words mean what they meant in v1.49.8 for the rest of the v1.49.x line and into v1.50. Looking back, v1.49.8 is where the research artifacts of v1.35/v1.36/v1.37 (Mathematical Foundations, Citation Management, Complex Plane) became load-bearing runtime structures rather than planning documents. The math is no longer a document about how the system thinks; it is a department the system can explore.

## Files

- `.college/rosetta-core/` — 5 modules (`types.ts`, `concept-registry.ts`, `panel-router.ts`, `expression-renderer.ts`, `engine.ts`) + 5 test files, ~1,914 LOC
- `.college/panels/` — 9 panel implementations + 3 integration tests + `panel-interface.ts` + `panel-registry.ts`, ~22 files total, ~4,500 LOC
- `.college/college/` — 6 modules (`types.ts`, `token-counter.ts`, `college-loader.ts`, `department-explorer.ts`, `cross-reference-resolver.ts`, `try-session-runner.ts`) + matching test files, ~1,600 LOC
- `.college/calibration/` — 3 modules (`calibration-engine.ts`, `delta-store.ts`, `profile-synthesizer.ts`) + matching tests, ~950 LOC
- `.college/safety/` — 3 modules (`safety-warden.ts`, `allergen-manager.ts`, `types.ts`) + 4 test files, ~1,376 LOC
- `.college/integration/` — observation bridge, token-budget adapter, chipset adapter + tests, the cross-stack glue
- `.college/departments/culinary-arts/` — 7 wings, 30+ concepts, 4 calibration models, references, try-sessions, `DEPARTMENT.md`, integration test
- `.college/departments/mathematics/` — 7 concepts with Complex Plane positioning, math-focused panel bindings, `DEPARTMENT.md`
- `.college/departments/test-department/` — COLL-05 extensibility proof department
- `.college/tests/` — 4 cross-cutting test suites: `safety-critical.test.ts` (SC-01..SC-14), `panel-correctness.test.ts` (PAN-01..PAN-14), `integration-roundtrip.test.ts`, `flat-cookies-e2e.test.ts`
- `vitest.config.ts` — `.college/` source files instrumented for coverage (+17 lines)
- `docs/foundations/` — Layer 1 overview filled; `complex-plane.md`, `eight-layer-progression.md`, `index.md`, `mathematical-foundations.md` updated; 23 broken relative links fixed across the foundations tree
- `docs/architecture/README.md`, `docs/TROUBLESHOOTING.md`, `docs/framework/getting-started.md` — supporting doc fixes
- `.gitignore` — single-line addition

Aggregate: 152 files changed, 18,270 insertions, 28 deletions, 89 commits from `8b16c7948` to `3f8a227bd`, single release window 2026-03-01.

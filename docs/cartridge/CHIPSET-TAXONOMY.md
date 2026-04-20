# Chipset Taxonomy

*The nine current chipset kinds + the Amiga principle.*

A **chipset** is one semantic unit of a cartridge. The word is borrowed
deliberately from Amiga hardware history: OCS, ECS, and AGA were the
*chipsets* — tight bundles of specialized silicon (Agnus, Denise, Paula)
that cooperated through a shared bus. Each chip had one job, did it well,
and interoperated through a published protocol. Cartridges work the same
way: a small number of well-scoped chipsets, each kind-tagged, cooperating
through the loader + validator.

## The Nine Kinds

### `department`
Skills + agents + teams for a topical domain. This is the single most
common kind. Every `*-department/chipset.yaml` under `examples/chipsets/`
produces exactly one `department` chipset when migrated.

### `grove`
Content-addressed record types plus views. A grove chipset declares the
shapes of stored artifacts (skills, agents, teams, forks, activity logs) so
the Grove runtime can serialize and deduplicate them deterministically.

### `college`
Tier wiring above one or more departments. A college chipset names the
departments it reaches and any cross-department refinement logic.

### `coprocessor`
Pure functional tooling. Math-coprocessor is the reference example:
symbolic linear algebra ops with no skills, no agents, no teams — just a
block of pure functions bound to a type signature.

### `graphics`
Rendering pipelines. A graphics chipset declares:

- An **API + version** pair from `{opengl, opengl-es, webgl, webgl2,
  vulkan}`. The version must match the `X.Y` / `X.Y.Z` pattern the
  Khronos registry uses.
- A **shader language + version** pair from `{glsl, glsl-es, spirv,
  wgsl}`. The scaffold default is `glsl-es 3.00` because that pair runs
  unmodified in every modern browser via WebGL 2.
- The **pipeline stages** in use. All six GLSL 4.60 stages are
  available: `vertex`, `tessellation-control`,
  `tessellation-evaluation`, `geometry`, `fragment`, `compute`
  (Khronos OGL Wiki — Shader). At least one stage is required.
- Optional **shader source files** — relative paths, per-file stage,
  entry-point (defaults to `main`).
- Optional **runtime** knobs (`vram_budget_mb`, `validation_layers`,
  `msaa_samples`, `target_fps`), analogous to the coprocessor
  chipset's quantitative defaults.
- Optional **toolchain** flags: `glslang` (GLSL → SPIR-V), `spirv_cross`
  (SPIR-V → backend shader), `angle` (OpenGL → D3D/Vulkan on Windows),
  `moltenvk` (Vulkan on macOS/iOS).
- Optional **host** hint: `vite` (WebGL browser), `native-c`,
  `native-rust`, or `mcp`.

The evaluation gate `all_graphics_sources_declare_stage` enforces a
cross-field invariant: every `sources[].stage` must be listed in the
top-level `shader_stages[]`. This catches the common failure of
committing a shader file whose stage the chipset has not declared.

Grounding: the five-module
[Graphics APIs research series](https://tibsfox.com/Research/GFX/) on
tibsfox.com (M1 OpenGL, M2 GLSL, M3 WebGL, M4 Vulkan, M5 Pipeline).

Reference cartridge: `examples/cartridges/gfx-reference/`.

### `content`
Essays, vocabulary, references. Space-Between ships most of its payload
here. Content chipsets never contain skills or agents.

### `muse`
Observation relays and Center Camp wiring. Muses are first-class citizens
of the chipset taxonomy rather than an ad-hoc sub-folder.

### `evaluation`
Gates and benchmarks that cartridges must pass before ship. The evaluation
chipset is how a cartridge evaluates *itself*: schema validity, affinity
coverage, domain coverage, benchmark hit-rate.

### `forge`
The capability chipset that backs `skill-creator cartridge …` itself.
This is the dogfood chipset: the forge that produces cartridges *is* a
cartridge. Six skills, five agents, three teams.

## The Amiga Principle

> Small number of specialized chips, published protocols, shared bus.

Three rules follow:

1. **No god chipset.** If a new concept needs a new kind, add a new kind —
   do not overload an existing one.
2. **Kind-tagged.** Every chipset carries a `kind:` discriminator so the
   loader never has to guess.
3. **Loose coupling by name.** Chipsets reference each other by ID, not by
   position in the `chipsets:` array.

## Schema Extensions

Wave 2B migration surfaced two legacy shapes that could not be re-expressed
in the unified schema without a pre-Zod normalizer. The normalizer
pattern (`src/cartridge/normalizers/`) is the sanctioned way to bridge
these: a pure function that rewrites an incoming chipset payload before
`CartridgeSchema.parse()` sees it. Current normalizers:

- `evaluation` — flattens `gates.pre_deploy: [{check, description, action}]`
  into `pre_deploy: [check_name]`, stashing the full gate objects under
  `metadata.gateDetails` via `.passthrough()`.

Future normalizers drop beside the existing one. No schema edits required.

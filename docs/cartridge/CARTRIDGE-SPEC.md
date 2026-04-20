# Cartridge Spec

*Normative reference for the unified cartridge format — `src/cartridge/types.ts`.*

A **cartridge** is a composable bundle of chipsets plus provenance. Every
unified cartridge is a YAML file that parses against the Zod schema in
`src/cartridge/types.ts` and loads through `src/cartridge/loader.ts`.

## Top-Level Shape

```yaml
id: my-cartridge          # kebab-case, globally unique
name: My Cartridge        # human label
version: 1.0.0            # semver
author: ...               # free text
description: >-           # one paragraph
  What this cartridge is for.
trust: system | user | community
provenance:
  origin: scaffold | forge | migrate | fork
  createdAt: 2026-04-14T00:00:00Z
  sourceCommits: [sha, ...]             # optional
  researchGrounding: [path, ...]        # optional
  forkOf: other-cartridge-id            # origin=fork only
chipsets:
  - kind: <chipset-kind>
    # ... chipset body (inline) OR
    src: ../../chipsets/foo/chipset.yaml
    # OR with fragment
    src: ../../chipsets/foo/chipset.yaml#/grove
metadata:                  # optional free-form
  key: value
```

## Chipset Kinds

The unified schema defines a **discriminated union** of nine chipset kinds.
The discriminator is `kind`. No other shape is accepted:

| Kind          | Purpose                                            |
|---------------|----------------------------------------------------|
| `college`     | Tier wiring above a department                     |
| `content`     | Essays, references, vocabulary                     |
| `coprocessor` | Pure functional tooling (math-coprocessor)         |
| `department`  | Skills + agents + teams for a topical domain       |
| `evaluation`  | Gates + benchmarks for cartridge acceptance        |
| `graphics` [^graphics-added] | GLSL / OpenGL / WebGL / Vulkan shader pipelines |
| `grove`       | Content-addressed record types + views             |
| `metrics`     | Activation tracking, benchmarks, telemetry sinks   |
| `voice`       | Vocabulary + orientation for content co-authors    |

Every kind has its own Zod sub-schema; see `src/cartridge/types.ts` for the
exact field lists.

[^graphics-added]: Added 2026-04-20. Analogous to `coprocessor` but
specialised for rendering — declares an API + shader language pair,
the pipeline stages in use, and shader source files. Grounded in the
[*Graphics APIs* research series](https://tibsfox.com/Research/GFX/)
on tibsfox.com.

## Chipset Order

Chipsets in the `chipsets:` array are kept in author order for display, but
cross-chipset validation and metrics treat them as a set. When a cartridge is
forked or migrated the writer SHOULD emit chipsets in lexicographic order by
`kind` for determinism.

## `src:` Refs and `#/` Fragments

A chipset entry can be **inline** or **external**:

```yaml
# inline
- kind: grove
  record_types: [...]
  views: [...]

# external file
- kind: department
  src: ../../chipsets/math-department/chipset.yaml

# external file, fragment
- kind: grove
  src: ../../chipsets/math-department/chipset.yaml#/grove
```

Fragment syntax is a JSON-pointer-like `#/key/nested` path. The loader walks
the loaded YAML document by key and returns the sub-node, which is then
merged with `kind` and handed to the kind-specific schema.

## Trust

`trust` is an explicit marker, not inferred:

- `system` — shipped in the core repo
- `user`   — authored by the end user in their own workspace
- `community` — third-party, not yet vetted

Nothing in the schema enforces behavior by trust — that is policy, not format.

## Provenance

Every cartridge must record its `origin`. `migrate` cartridges carry
`sourceCommits` pointing at the commit(s) that introduced the original
chipset. `fork` cartridges carry `forkOf` pointing at the source cartridge
id. `scaffold` cartridges carry neither.

## Metadata Passthrough

The schema uses Zod `.passthrough()` at the chipset level so loader-side
normalizers (see `src/cartridge/normalizers/`) can stash legacy
shape-preservation data under `metadata.*` without schema edits. Current
normalizers: `evaluation` flattens legacy `gates.pre_deploy` objects into
`pre_deploy: [string]` and preserves the originals under
`metadata.gateDetails`.

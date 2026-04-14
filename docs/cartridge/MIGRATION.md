# Migration Guide

*Old department chipset → unified cartridge format.*

Before cartridge-forge, `examples/chipsets/*-department/chipset.yaml` was the
single unit of content. The unified format wraps each of those files in a
thin `cartridge.yaml` and adds explicit chipset bindings.

## Thin Wrapper Pattern

For every `examples/chipsets/foo-department/chipset.yaml` there is now a
sibling cartridge under `examples/cartridges/foo-department/cartridge.yaml`
with this shape:

```yaml
id: foo-department
name: Foo Department
version: 1.0.0
author: tibsfox
description: >-
  Wraps the existing department chipset as a unified cartridge with
  department / grove / evaluation / college chipset bindings.
trust: system
provenance:
  origin: migrate
  createdAt: 2026-04-14T00:00:00Z
  sourceCommits: [<sha>]
  researchGrounding: [examples/chipsets/foo-department/chipset.yaml]
chipsets:
  - kind: department
    src: ../../chipsets/foo-department/chipset.yaml
  - kind: grove
    src: ../../chipsets/foo-department/chipset.yaml#/grove
  - kind: evaluation
    src: ../../chipsets/foo-department/chipset.yaml#/evaluation
  - kind: college
    src: ../../chipsets/foo-department/chipset.yaml#/college
```

No content moves. No content changes. The wrapper only declares bindings.

## Fragment Syntax

`path#/key/nested/deeper` resolves to `yaml[key][nested][deeper]` and is
then merged with `kind: <kind>` before schema parsing. This lets a single
source file contribute multiple chipset kinds:

```yaml
chipsets:
  - kind: department
    src: ../../chipsets/math-department/chipset.yaml
  - kind: grove
    src: ../../chipsets/math-department/chipset.yaml#/grove
  - kind: college
    src: ../../chipsets/math-department/chipset.yaml#/college
```

## Normalizers

Some legacy shapes cannot be re-expressed in the unified schema without a
pre-Zod transform. The normalizer pattern lives in
`src/cartridge/normalizers/` and the loader runs the right normalizer
based on `kind` before schema parsing.

Current normalizers:

- **evaluation** — flattens `gates.pre_deploy: [{check, description, action}]`
  into `pre_deploy: [check_name]`. The full gate objects are stashed under
  `metadata.gateDetails` (preserved byte-for-byte for future consumers)
  and `metadata.gateLegacy: true` marks the cartridge as having been
  rewritten on load.

## Phase-2 Migrations

Two bulk cartridges carry no evaluation chipset because their source
chipset uses `wings_covered` instead of `domains_covered`, incompatible
with `BenchmarkSchema` in the unified model:

- `electronics-department`
- `spatial-computing-department`

Both cartridges still load, validate, and collect metrics through the
department + grove + college bindings. Adding evaluation for these two is
a Phase-2 repair on the source chipset, not on the format.

## Legacy Adapter

`src/cartridge/legacy-adapter.ts` losslessly round-trips the old
`src/bundles/cartridge/types.ts` shape through the new schema. Space
Between is the reference cartridge for legacy-adapter correctness — the
old type tests + packer tests still pass unchanged.

## Validation Debt

22 migrated department cartridges have pre-existing source defects that
the unified cross-chipset validator now surfaces. See
[KNOWN-VALIDATION-DEBT.md](./KNOWN-VALIDATION-DEBT.md) for the list, split
into Category A (agent_affinity drift) and Category B (domains_covered
drift). These are documented debt, not regressions — the unified loader
is the first tool that could see them, so it is the first tool that can
surface them. Repair is a follow-up milestone.

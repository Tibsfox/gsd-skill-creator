# ADR 0005 — Minecraft Knowledge World: intentional out-of-scope for the adaptive-learning loop (GAP-5)

- **Status:** Accepted
- **Date:** 2026-05-30
- **Milestone:** v1.49.919 (GAP-table reconciliation)
- **Supersedes:** none
- **Superseded by:** none
- **Related:** GAP-3 (PNW vs Global Scope — the "Intentional design" precedent this ADR mirrors); `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` §4 T3.3 + §9 decision 3 (the operator decision point this ADR records)

## Context

GAP-5 ("Minecraft Simulation Not Running") has been tracked as **Open** in `.planning/PROJECT.md` since the gap table was introduced, and the v1.0 Core Value statement names "rendered as a Minecraft simulation world" as one of the project's stated render targets.

The Minecraft Knowledge World originates from **v1.22** (shipped 2026-02-19, tag `v1.22`, phases 169–198). The deliverable physically exists and is git-tracked under `infra/` (289 files / ~4.0 MB; Minecraft is one slice of the broader Amiga+PNW-infra stack, last touched `dbb38759a` on 2026-03-09). What that slice actually contains, on inspection:

- **Documentation + configuration + bash tooling**, not a running render pipeline: `infra/minecraft/world-design/*.yaml` (6-district hub-and-spoke layout source-of-truth), `infra/minecraft/schematics/specs/*.yaml` (10 build specs with block palettes + dimensions), `infra/knowledge-world/curriculum/methodology/system-architecture-as-buildings.md` (712-line concept→structure methodology), `infra/scripts/` (84 bash deploy/ops scripts), `infra/tests/` (22 bash test scripts).
- The **render path is human-in-the-loop**: a person builds in creative mode and captures the result as Litematica `.litematic` schematics. There is **no programmatic block-placement engine** and **no code anywhere that consumes a graph to emit voxels** (a repo-wide grep for `voxel` / `blockworld` / `mineflayer` returns only `infra/` docs).
- The `minecraft-knowledge-world` **chipset remains a maintained first-class artifact** (`data/chipset/minecraft-knowledge-world.yaml` + `examples/chipsets/minecraft-knowledge-world/`, referenced by `src/cartridge/department-adapter.ts:190` as a Family-A normalizer target as of v1.49.644).

"Orphaned since v1.22" is accurate **as an adaptive-learning-narrative claim**: nothing under `src/` imports or invokes `infra/`, so the world is never wired into the Observe→Detect→Suggest→Apply→Learn→Compose loop. It is **loop-orphaned, not vision-orphaned** — the v1.0 render-target sentence still stands as an aspiration.

The 2026-05-26 core-functions audit (§4 T3.3) offered two paths: **re-wire** (estimated 2–3 ships, framed as "skill-graph → voxel projection") or **scope-out** (1 ship-fragment). A code-grounded re-scope at v1.49.919 hardened the picture against the re-wire framing:

1. **The "re-wire" is mislabeled — it is greenfield.** There is no existing projection surface to re-wire; a graph→layout→voxel projector would be net-new code.
2. **The source graph the re-wire assumes does not exist render-ready.** The "739-edge graph" is a *research-citation* graph (177 research-project nodes), not a skill graph. The real skill/memory graph (`src/graph/` M1, entity kinds skill/command/file/session/decision/outcome) has **no coordinate or voxel projection surface** and no consumer pointed at `infra/`.
3. **Even a full re-wire leaves "rendered" aspirational** — the only render path remains human-in-the-loop Litematica capture unless a further, genuinely greenfield `.litematic` NBT emitter is also built.

The audit itself rates this item "lower direct ROI."

## Decision

**The Minecraft Knowledge World is INTENTIONALLY OUT-OF-SCOPE for the adaptive-learning loop.** It stands as a self-contained v1.22 deliverable under `infra/` plus a maintained chipset — not as a wired consumer or producer of the Observe→…→Compose loop. This mirrors the GAP-3 "Intentional design" precedent already in the gap table.

Concretely:

- `PROJECT.md` GAP-5 row flips from **Open** to **INTENTIONAL OUT-OF-SCOPE**, citing this ADR.
- The v1.22 `infra/` Minecraft assets and the `minecraft-knowledge-world` chipset remain in the repo and remain maintained; nothing is deleted.
- The `infra/` bash test suite (22 scripts) is **intentionally not gate-enforced** — it is local/operator-run only, consistent with `infra/` being out of the adaptive-learning loop. (Documenting this pre-empts a future KNOWN_UNWIRED-style drift flag against `infra/`.)

If the operator later decides the Minecraft world should become a genuine **product surface** (live skill-graph → world rendering), that is a **fresh dedicated milestone** with its own SPEC — it must first choose a source graph (`src/graph/` M1, not the research-citation graph) and decide explicitly whether "rendered" means generated-YAML, generated-`.litematic`, or a live-server build. It is not a GAP-closure fragment.

## Consequences

### Benefits

- **Closes the documentation-drift class.** The gap table now tells the truth: GAP-5 is a deliberate scope boundary, not unfinished work silently carried for ~750 milestones (consistent with audit T1.4 + S5 doc-normalizer intent).
- **Preserves the v1.22 work and the chipset** without pretending it is loop-wired.
- **No forward bandwidth spent** on a mislabeled "render" wire whose source graph does not exist.

### Costs

- The v1.0 Core Value sentence ("rendered as a Minecraft simulation world") remains aspirational rather than loop-realized. This ADR accepts that gap explicitly rather than leaving it as ambient debt.
- `infra/`'s 22 bash tests stay unverified-per-ship by design; a future product-surface decision would need to wire them (per the gate-enforce-every-runnable-surface discipline #10461) at that time.

### Out-of-scope (intentional non-goals)

- Deleting `infra/` or retiring the `minecraft-knowledge-world` chipset.
- Building a graph→voxel projector or a `.litematic` emitter as part of this milestone.
- Wiring `infra/` into CI / `pre-tag-gate` (it is out of the loop, therefore out of the gate).

## Verification

Documentation-only ADR. Verification is the PROJECT.md gap-table row reading INTENTIONAL OUT-OF-SCOPE with a citation to this file, and the absence of any new `src/ → infra/` import (none is introduced by this milestone).

# Lessons Emitted — v1.49.905

No new manifest-promoted lessons. v905 reinforces existing disciplines and adds a 1-instance #10448 sub-variant candidate.

## NEW 1-instance candidate: module-function two-site (mixed sync+async)

**Status:** 1-instance candidate.

**Defining property:** A module exports N≥2 fs-touching functions where the op TYPES differ across sites — some sync, some async. Each site gates independently via `ensureAllowed`. The interface admits both via `'read-file'` (or other) LoaderOp tags.

**Discriminator from prior two-site wires:**

| Sub-variant | Sync vs async | Site multiplicity | Notes |
|---|---|---|---|
| v892 async two-site | pure async | 2 entry points | ESTABLISHED |
| v903 sync two-site | pure sync | 2 sites in 1 function | 1-instance candidate |
| **v905 mixed sync+async two-site** | sync + async | 2 entry points (different ops) | THIS SHIP (1-instance) |

**v905 instance:** `src/atlas/spatial/pmtiles-reader.ts` — `validatePMTilesMagic` (sync `readFileSync`) + `fetchTileViaPMTiles` (async `open` via cached source). Independent gates; transitive composition.

**Promotion path:** Two more mixed sync+async two-site wires. Likely candidates from remaining KNOWN_UNWIRED entries: `memory/file-store.ts`, `memory/conversation-store.ts`, `intelligence/kb/store.ts` — pending inspection.

## Reinforcement: #10448 — two-site hoisted-check (mixed-op variant)

**Status:** ALREADY ESTABLISHED at cluster.

**v905 instance:** The two-site discipline holds regardless of op-type mixing. The dimension orthogonal to "site count" is "op type per site." A future catalog refresh might collapse v892 / v903 / v905 into a single "module-function two-site" entry with sub-tags for sync/async/mixed — three pieces of evidence suggest the dimensions are independent.

## Reinforcement: #10456 — composition-driven audit count (6th variant)

**Status:** ALREADY ESTABLISHED.

**v905 instance:** `fetchTileViaPMTiles` emits 2 audits per call: 1 from its own top-of-function gate + 1 from the transitive `validatePMTilesMagic` call. The count comes from INTERNAL CALL COMPOSITION, not from the wire shape alone. Prior variants:

- v892 outer-loop (1 outer × 8 inner = 9 audits)
- v896 derived-method ripple (1 per derived method call via transitive)
- v897 mixed read/write (1 per read; 0 per write)
- v900 module-function direct-call (N per N invocations)
- v902 class-multi-method consolidated-gate (N per N public read())
- v904 class-instance parallel-method (4 under {readAll + getPending + consume + markExpired})
- **v905 composition (2 per fetchTileViaPMTiles via own + transitive validate)**

The new shape: count emerges from the COMPOSITION of two independent gates, not from a single gate's repetition.

## Reinforcement: #10442 — hoist ABOVE try/catch ENOENT swallow

**Status:** ALREADY ESTABLISHED.

**v905 instance:** `validatePMTilesMagic` has a `try { readFileSync(...) } catch { return false }` ENOENT swallow. The `ensureAllowed` hoist sits ABOVE the try, so `LoaderContextDenied` propagates instead of being silently absorbed into a `false` return. Exercised directly by the throw test.

## Carry-forward to v906+

1. **Mixed sync+async two-site (1-instance from v905).** Needs 2 more instances.
2. **Class-instance multi-method read-side (1-instance from v904).** Needs 2 more.
3. **Class-multi-method consolidated-gate (1-instance from v902).** Needs 2 more.
4. **Sync two-site hoisted-check (1-instance from v903).** Needs 2 more.
5. **NodeFileSource pattern (no-wire-needed class).** A class whose constructor is called from a single gated orchestrator and whose disk-touch is covered transitively. Carry-forward observation candidate; needs more instances to ripen.

# v1.49.919 — GAP-table Reconciliation (GAP-4 closed, GAP-5 scoped-out)

**Shipped:** 2026-05-30
**Type:** Feature + maintenance (architecture-gap reconciliation; no NASA degree advance)
**NASA degree:** 1.178 (unchanged — 136 consecutive ships)
**Predecessor:** v1.49.918

## What shipped

Continues the audit-driven thread (`.planning/AUDIT-2026-05-26-core-functions-retrospective.md`)
that produced M14–M16. Scoping the three remaining Tier-3 items (T3.1 cross-platform
CI, T3.3 Minecraft, T3.4 GPU E2E) against the live codebase found two of the three
"open gaps" were already-closed-but-unnamed or mislabeled-greenfield. This milestone
reconciles the PROJECT.md gap table to the truth — backed by a real fix and a real
proof for the one gap that was secretly broken.

### GAP-4 (GPU Pipeline Not Built E2E) → CLOSED, and a latent bug fixed

The audit framed GAP-4 as "wire the v574 megakernel substrate." Running the code (not
just reading it) showed the megakernel is a **pure-TypeScript schema substrate with
zero GPU code** — never the E2E path. The *real* path — skill-activation → MCP → cuRAND
GPU dispatch → result — runs through the **math coprocessor** and was **silently broken**:

- The Python server returns **flat dicts**, but `src/coprocessor/{client,types,activation}.ts`
  expected a `{value, meta}` envelope the server never produces, so `activateCoprocessor`
  threw on `caps.value.chips` (undefined).
- The default-on applicator hook **swallows** that throw → the GPU was **never reached**
  via skill activation (a silent no-op). The one test that would have caught it was
  skip-gated and its assertions were fiction.

The fix: a single `normalizeToolResult` adapter in `client.ts` maps the server's flat
response into the `{value, meta}` envelope for **every** tool (device ← `backend`,
value ← `result`-key-or-stripped-payload, **throws** on server error per #10427), six
drifted method/report types corrected to the probed reality, and `getSharedClient`
now honors `COPROCESSOR_PYTHON`. **Proven E2E on the RTX 4060 Ti**: a `coprocessor:[statos]`
skill activates and dispatches a cuRAND Monte-Carlo run with `meta.device === 'gpu'`
(`src/coprocessor/__tests__/gpu-e2e.integration.test.ts`, GPU-gated).

### GAP-5 (Minecraft Simulation Not Running) → INTENTIONAL OUT-OF-SCOPE

The v1.22 `infra/` Minecraft world (289 files; docs + YAML + bash deploy tooling) is a
self-contained deliverable, loop-orphaned by design — nothing in `src/` wires it into
the adaptive-learning loop, and the audit's "re-wire (skill-graph → voxel)" is greenfield
(no render code; no render-ready source graph). Recorded as intentional design in
`docs/adr/0005-minecraft-knowledge-world-scope.md`, mirroring the GAP-3 precedent. The
`minecraft-knowledge-world` chipset stays maintained; nothing is deleted.

### Also

- The CI-safe drift-guard (`normalize.test.ts`, 10 fixture-based unit tests pinned to the
  real server wire shapes) closes the root cause — no shared schema between CLI and core
  types (RC-04 tech debt) — so this class of drift fails loudly in CI without a GPU.
- Fixed the `applicator-hook.ts` docstring (said "default-off"; the hook is default-on).
- GAP-6 needed no work — already correctly CLOSED in PROJECT.md (the audit's T1.4 was stale).

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18 (unchanged — audit-driven forward gap-closure, not a cleanup-mission)
- Manifest: 24 domains, 149 lessons (unchanged — lesson candidate noted, not yet codified)
- Coprocessor tests: 39 pass / 7 skip default (+10 `normalize.test.ts` CI tests; +2 GPU-gated; live rewritten); 7 gated tests pass on the RTX 4060 Ti
- Architecture gaps: GAP-4 CLOSED, GAP-5 INTENTIONAL OUT-OF-SCOPE → 4 of 7 now closed/intentional

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)

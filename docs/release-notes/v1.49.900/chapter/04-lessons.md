# Lessons Emitted — v1.49.900

No new manifest-promoted lessons this ship. v900 reinforces patterns already at ESTABLISHED (#10444, #10448, #10442, #10456). The codify-axis backlog from v899 carries forward unchanged.

## Reinforcement: module-function hoist-at-top (3rd LoaderContext-specific instance)

**Status:** ALREADY ESTABLISHED (base #10448 sub-variant; codified at v883).

**LoaderContext-specific evidence:**

1. **v1.49.887** — `src/console/reader.ts`: module function with single readFile, hoist-at-top.
2. **v1.49.889** — `src/intelligence/atlas-indexer/file-walker.ts`: module function with single readdir entry point, hoist-at-top.
3. **v1.49.900** — `src/orchestrator/lifecycle/artifact-scanner.ts`: module function with single readdir site, hoist-at-top.

**Why this is reinforcement, not promotion:** The base hoist-at-top form was promoted to the catalog at v1.49.872 (`cli/commands/pic2html.ts` ProcessContext instance). The catalog entry already covers single-site spawn/fetch/read with N=1. LoaderContext-specific instances strengthen the form's cross-chokepoint applicability but don't create a new sub-variant.

## Reinforcement: #10456 audit-record-count assertion (4th distinct variant)

**Status:** ALREADY ESTABLISHED (codified at v899 with 3-variant evidence).

**4th variant evidence:**

- **v1.49.900** — `artifact-scanner.test.ts` audit-record-count test: assert K records under K direct module-function invocations.

**Why this is reinforcement, not promotion:** The #10456 template codified at v899 enumerates three variants (two-site outer-loop / derived-method ripple / mixed read+write derived). The module-function direct-call variant is the simplest reduction of the template — no derived methods, no write-side, no transitive call structure — and was implicit in the v899 codification. v900's test is the first explicit instance of variant #4 but doesn't introduce a new structural property the template doesn't already cover.

## Reinforcement: #10442 hoist gates ABOVE swallow-catches

**Status:** ALREADY ESTABLISHED.

**v900 instance:** The readdir in `scanPhaseArtifacts` is inside `try { } catch { return emptyArtifacts(phaseDirectory); }` — the catch silently returns empty when the directory doesn't exist. The `ensureAllowed` hoist sits ABOVE this try block, so `LoaderContextDenied` propagates instead of being absorbed as "empty result." Asserted directly by the test "denial propagates ABOVE ENOENT swallow."

## Carry-forward observation: state-reader.ts wire shape (next chip candidate)

When the next LoaderContext chip targets `state-reader.ts` (190 LOC, currently the smallest remaining KNOWN_UNWIRED entry after v900), the wire shape will not be a clean #10455 class-stored hoist-at-top — that sub-variant requires N=1 fs-op method. `state-reader.ts` has three fs-op methods (`directoryExists` does `access`, `read` does 4× `readFileSafe`, `resolvePhaseDirectories` does `readdir`). The viable wire shape is either:

1. **Class-multi-method consolidated-gate** — one `ensureAllowed` hoist at the public `read()` method entry, gating all transitive private fs-op methods. Pros: single audit record per read() call; matches the chokepoint "one audit per public surface invocation" model. Cons: per-disk-op audit fidelity is reduced (one record represents 6 disk ops).
2. **Class-multi-method multi-site** — `ensureAllowed` at each fs-op method (access in directoryExists, 4× readFile in read, readdir in resolvePhaseDirectories). Pros: per-disk-op audit fidelity preserved. Cons: 6 audits per read() call.

Both are sub-variant candidates for #10448. The chip-author should pick based on whether the audit consumer expects per-public-invocation or per-disk-op granularity. If picked at v901+ and a new sub-variant is selected, the carry-forward count rises by 1 toward the next codify cycle.

## Cross-references

- #10442 (Failure-mode contracts — Hoist gates ABOVE swallow-catches)
- #10444 (Size-ascending chip-pick reveals wire-shape diversity)
- #10445 (Spawn-site count N as primary wire-shape predictor)
- #10448 (Shared-helper hoist sub-variant catalog) — v900 reinforces base hoist-at-top
- #10455 (Class-stored hoist-at-top — does NOT apply to v900 module-function form)
- #10456 (Audit-record-count assertion) — v900 is 4th variant evidence
- #10432 (KNOWN_UNWIRED allowlists as migration-debt ledger)
- v1.49.887 / v1.49.889 — prior LoaderContext module-function hoist-at-top instances
- v1.49.899 — codify ship that ESTABLISHED #10455 / #10456 / #10457 + extended #10453 to ESTABLISHED

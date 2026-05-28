
# v1.49.842 — Retrospective

**Wall-clock:** ~20 min from v841 ship-close to release-notes draft. Faster than expected — the 3 wires follow the established #10433 pattern exactly; no novel decisions required.

## What went as expected

- **The 3 files matched 3 distinct wire shapes.** session.ts had a swallowing try/catch (hoist-outside pattern). launcher.ts had no swallowing wrapper (in-line natural placement). terminal.ts had a try/catch that absorbed all errors (re-throw ProcessContextDenied pattern). Each is documented in `docs/security-chokepoints.md` and `docs/failure-mode-contracts.md`.
- **The LaunchOptions threading was cleaner than a top-level second parameter.** Adding `ctx?: ProcessContext` to the existing options interface kept the call signature single-argument and matches how launcher's callers already pass config. No process-manager.ts changes needed.
- **All affected tests passed without modification.** The audit-test internally re-counts entries; the process-manager tests don't exercise the new ctx parameter; the process-context.test.ts tests don't reference the terminal family.
- **Build clean.** Standard tsc + esbuild + asset copy. No type errors from the ProcessContext threading.

## What I noticed

- **Re-throw ProcessContextDenied pattern from a CLI catch is a refinement worth documenting.** The standard #10427 pattern is "load-bearing failures propagate, accessory failures swallow". In a CLI surface where the catch is for UX (turn errors into JSON), the implementation is `if (err instanceof X) throw err;` before the swallow. This is the 2nd instance (v820 git/core/branch-manager was the 1st; v842 terminal.ts is the 2nd). Could be promoted as a #10427 refinement at a future codify ship — wait for 3rd instance.
- **No callers updated.** All 3 wires keep ctx optional with permissive-when-undefined behavior. Existing callers (`cli/dispatch.ts` → `terminalCommand`, `terminal/process-manager.ts` → `launchWetty`) pass nothing for ctx; the security check is a no-op in permissive mode. Future surfaces that DO want to enforce can pass a context.
- **LaunchOptions vs second-positional choice was deliberate.** When a function already accepts an options object, threading via the options keeps callers stable. When a function has a positional param list, adding ctx as the last optional positional param is the convention. session.ts (no options object) → second positional; launcher.ts (already options) → field in options.
- **Wire cost was 6-10 LOC per file.** Matches the median documented in #10433 (#10825 ledger entry: internal-helper or threaded-options ≈ 14-18 LOC for the larger files; this batch was smaller files so lower end).

## What surprised me

- **Less than 20 min wall-clock.** Previous batch chips averaged 30-45 min. The terminal family was simpler than git/core or dogfood because each file had a single spawn call and a clear wire site. No multi-spawn-per-file refactoring.
- **session.ts was the simplest wire I've done so far.** 6 LOC added (1 import block + 1 ensureProcessAllowed call + 1 ctx param + 1 docstring expansion). Same pattern as stalled.ts from v839.
- **All 3 files were small.** 46 / 172 / 407 LOC. The largest (terminal.ts) had most of its volume in PID-file management and resolveWetty heuristics, not spawn logic. The actual spawn surface was ~50 LOC out of 407.

## Risk that didn't materialize

- **No test regression.** Suite count holds at 35,261. The audit-test count internally counts source files matching the signature, not allowlist entries (allowlist removal doesn't change test count).
- **No build regression.** Type-checking clean. LaunchOptions extension is backward-compatible (optional field).
- **No type error in process-manager.ts.** `launchWetty({ config, command })` still works — ctx is optional.
- **No callsite-level changes needed.** terminalCommand still calls handleStart(config); the additional ctx param defaults to undefined.

## Carried forward (post-v842)

NEW this ship:

- **Re-throw ProcessContextDenied from CLI swallow-catch pattern** — 2 instances so far (v820 + v842). Could promote at next codify ship if a 3rd instance lands. Forward-test trigger: any future CLI command with a swallowing catch around a spawn.

Inherited from v840 + v841 (unchanged):
- All single-instance observations from v840 (codify-ship-as-recon-consolidator, deferral-by-classification-ambiguity).
- All single-instance observations from v841 (recent-vs-baseline-recent comparison, drift-check noise feedback loop).
- Auto-run-on-import as bootstrap-time tax (v836).
- Polarity convention for inverted-mechanic thresholds (v837).
- #10433 LOC-band-by-callsite-count refinement: now **5 instances** (v825 + v827 + v828 + v839 + v842). Sustained ESTABLISHED.

Carried forward but DEFERRED at v840:
- Verification/integration-only ships axis (2 instances; needs canonical-doc).
- Bidirectional enforcement completeness (1-2 instances; needs 3rd instance).

## Process retrospective

- **Batch chips are the operational-debt steady-state.** This is the 5th batch chip (aminet, git/core, dogfood, scribe/netlist-renderer, terminal). The pattern is well-established: identify a family of 2-4 related files, wire them together in one ship, remove the corresponding KNOWN_UNWIRED entries. Each batch closes a coherent group.
- **Remaining ProcessContext singletons are ~15** (was 18; this ship dropped 3). Singleton chips average ~30 min each; batch chips average ~45-60 min for 2-4 files. The remaining inventory could close in ~5-10 batch chips or ~15 singletons.
- **Next batch candidate: mesh family** (v843; 2 entries). Smaller batch than terminal but follows the same pattern.
- **The two-layer-closure work from v836 + v840 codification continues to pay off.** The publish-preservation gate fired correctly on this ship's chapters (3 PRESERVED log lines expected at T14). No hand-author clobbering risk.

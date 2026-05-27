# v1.49.810 — Retrospective

**Wall-clock:** ~30-40 min from session-start to tag-push. First ship of the v810-814 chain (5 ships planned).

## What worked

**Recon caught a name mismatch in the T1.3 recon doc before any code was written.** The T1.3-RECON-2026-05-27 doc referenced `predictSkills(...)` as the function to wire from the predictive-skill-loader. The actual function names in `src/predictive-skill-loader/`: `predictLinks` (low-level GNN), `predictNextSkills` (high-level wrapper that respects the opt-in flag), `predictNextSkillsWithMeta` (same but returns `{predictions, disabled}`). The right surface to wire is `predictNextSkills` because it's the one that respects the Gate G12 default-off contract automatically. The recon doc's name was off by one layer; recon-first (#10412) caught it before the first edit.

**Recon caught the Gate G12 hard preservation invariant.** Reading `src/predictive-skill-loader/index.ts` for the public surface surfaced an explicit "Gate G12 invariant: orchestration byte-identical to phase-769 tip" with a corresponding `orchestration-byte-identical.test.ts` enforcement test. This narrowed the wire-site choice: anything in `src/orchestration/` would have failed the gate. `src/chipset/copper/` is outside orchestration, so it passes. The recon doc didn't mention G12; recon-first found it by reading the substrate module's own docstring.

**Subscriber-gated hook beats result-field pollution.** Initial sketch was to add `predictions?: SkillPrediction[]` to `ActivationResult`. Rejected because: (a) every result for every caller would carry the optional field even though only opt-in subscribers care; (b) the hook approach matches the existing `executeOffload`/`resolveSkill`-style pluggable-resolver pattern already in `ActivationContext`; (c) the hook is naturally fire-and-forget, decoupling observation from the synchronous activation result. The hook lands as 1 field added to the context interface + 1 private `emitPredictions` helper — net surface increase is ~25 lines.

**Two-layer default-off contract is belt-and-suspenders.** The wire respects both: (1) `onPredictions` is unset → no predictor work runs at all; (2) `onPredictions` is set but the predictive-skill-loader opt-in flag is off → predictions array is empty, hook fires with `[]`. Either layer alone is sufficient to make behavior byte-identical for non-opt-in callers; both together make the contract testable from either side. The two tests directly assert this: (a) hook fires with `count = 0` (flag-off path), (b) hook throws but activation succeeds (fire-and-forget contract).

**Pre-bump PROJECT.md refresh worked perfectly first time.** v807-introduced step-17 patch-drift cap = 3. PROJECT.md was at v806 (3 patches stale). Update to v809 brought drift to exactly 0 after pre-tag-gate detected the bump. No second normalizer pass needed (vindicates the v783 closure of normalizer non-idempotency — operator memory was updated at v807 to reflect this; this ship is the first to depend on that closure end-to-end).

## What surprised

**The `predictNextSkills` wrapper is exactly the surface T1.3 needs.** Going in I expected to have to compose `loadCollegeGraph` + `buildLinkFormationModel` + `predictLinks` at the wire site. Turns out `predictNextSkills` already does all three internally and returns `SkillPrediction[]`. The wire is one function call. This suggests Phase 769 (predictive-skill-loader UIP-18) was designed with future consumers in mind — the public surface is ready for wiring.

**The fire-and-forget pattern was already in the activation file.** The async-mode handler (around line 117) already uses `Promise.resolve().then().catch(swallow)` for fire-and-forget. My `emitPredictions` helper mirrors this exact shape — consistent with the existing module conventions, no new pattern introduced.

**Microtask-drain in the test required `setImmediate`, not `await Promise.resolve()`.** The hook is fire-and-forget via `Promise.resolve().then(...)`. A single `await Promise.resolve()` in the test wasn't enough to drain the chained microtasks (because the hook's `await predictNextSkills(...)` adds another tick). `await new Promise(resolve => setImmediate(resolve))` drains all pending microtasks reliably. Minor test-author lesson; matches the documented pattern in the predictive-skill-loader's own tests.

## What to watch

- **The other 5 modes/handlers (offload-skill, script, team, async) don't fire onPredictions.** Only the lite/full skill handlers do. This is intentional — script and team activations aren't "skill" activations from the predictive-skill-loader's perspective; offload-skill is uncertain (the predictor is for skill graphs); async is fire-and-forget already. If a future T1.3 ship surfaces an actual call-site requirement to predict from script/team activations, the helper can be moved up to `dispatchByTarget` with a per-target opt-in. Kept off this ship's scope per #10416.

- **No production caller wires the hook yet.** This ship establishes the wire; no `src/` code wires `onPredictions: ...` into the activation context at construction time. That's intentional — T1.3 Option A's audit-retrospective claim is "the consumer engine is REACHABLE from src/," not "the consumer engine is ALWAYS ON in src/." A future ship (T1.3 Option B or a dashboard ship) can wire the hook into the activity-tab-toggle or skill-graph observability surface.

- **Predictor invocation cost on every skill activation.** When the hook IS set AND the opt-in flag IS on, every successful lite/full activation invokes `predictNextSkills` which calls `loadCollegeGraph` (file IO) + `buildLinkFormationModel` + `predictLinks`. No caching. The recon doc flagged this as a forward concern. For now (flag default-off), the cost is zero. If/when a real consumer wires the hook and the flag is turned on, a caching strategy at the consumer side (memoize the model build) is the natural next step.

## Verdict on scope

T1.3 GAP-2 closure landed at the smallest viable shape: 1 optional context field + 1 emit helper + 2 tests + 1 pre-bump PROJECT.md update + 5 release-notes files. Resisted: adding `predictions` to `ActivationResult`, wiring Options B/C in the same ship, building a per-activation cache, moving the helper up to `dispatchByTarget`. The wire establishes the substrate-consumer reachability claim the audit retrospective asked for; further T1.3 closure work can build on this foundation incrementally.

After v810, the v810-814 chain stands at 1 of 5. Next: v811 = batch chip 4 sibling registry adapters (cargo, conda, pypi, rubygems). Should be the smallest ship of the chain (~15-20 min) since the v809 interface widening + orchestrator threading already did the heavy lifting.

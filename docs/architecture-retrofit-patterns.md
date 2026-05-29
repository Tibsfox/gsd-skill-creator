# Architecture Retrofit Patterns

**Surface:** Introducing a chokepoint, interface, or generator-template to N existing modules with high call-site multiplicity; authoring a generator that may run on partial input.

**Codified at:** v1.49.784 (lesson cluster from v1.49.782 LoaderContext chokepoint + v1.49.783 STATE.md normalizer fix); v1.49.802 (extended with Lesson #10426 second-instance cross-class registry extraction from the v1.49.795-801 T1.1 arc); v1.49.847 (extended with Lesson #10440 production-caller path-narrowing from v845 + v846 two-instance evidence); v1.49.868 (extended with Lesson #10444 size-ascending chip-pick reveals wire-shape diversity from v858-v862 Process + v863-v867 Egress two-cluster evidence); v1.49.883 (extended with Lessons #10445 spawn-site count as primary wire-shape predictor, #10447 router-with-conditional-bypass, #10448 shared-helper hoist sub-variant catalog — all three from the v868-v882 post-Track-5 codify ship).

## Why this discipline exists

Architecture retrofits — introducing a new pattern across N existing call sites — are high-risk operations. A required parameter on day one forces a breaking change across the entire dependent call graph before any rollout signal has returned. A placeholder sentinel in a generator pollutes outputs and breaks round-trip safety. Both failure modes compound with scale: a 200-call-site retrofit done wrong is a 200-call-site breaking change.

The patterns below have been validated on real retrofits (LoaderContext at 11 modules / ~200 sites, normalizer at all hand-authored STATE.md files) and produced zero call-site churn at existing sites.

## Discipline patterns

### Optional `ctx?` parameter for chokepoint retrofit (Lesson #10414)

When introducing a security or invariant chokepoint to N existing modules with high call-site multiplicity, use the optional-parameter pattern. Three states emerge naturally:

1. **`undefined` ctx → legacy permissive mode** — zero call-site churn, audit-bypass. Existing call sites stay on this state until migrated.
2. **`defaultLoaderContext()` ctx → audit-only mode** — all paths admitted, all reads logged. Security-conscious callers use this during rollout to gather data before tightening.
3. **Restricted ctx → enforced mode** — allow-list checked, denials throw. Production deployments use this for hard enforcement.

Each state has a clear use case; transitions are caller-driven, not provider-driven. The chokepoint is fully implemented from day one but invisible until callers opt in.

**Anti-pattern.** Making the chokepoint required in the public API on day one. Forces a breaking change across the entire dependent call graph before any rollout signal has come back. Adds risk to a security feature whose entire value depends on adoption — and ships the breaking change to call sites that have no use for the feature yet.

**Reference implementation.** `src/security/loader-context.ts` — `LoaderContext` retrofitted across 11 disk-loaders + ~200 call sites at v1.49.782 with zero call-site churn at existing call sites.

### Tolerant generators for round-trip safety (Lesson #10416)

When a generator runs on partial input (e.g. hand-authored frontmatter with missing optional fields), prefer **skip-the-line** behavior over **placeholder sentinels**.

Placeholder sentinels (`UNKNOWN`, `TODO`, `???`, `N/A`) have three problems:

1. They are visually indistinguishable from real field values and pollute the file.
2. They make the round-trip property fragile — any hand-authoring pattern that doesn't use the sentinel will drift.
3. They mask the actual schema gap — operators can't tell whether the field is optional or required without reading the source.

Skip-the-line behavior solves all three:

1. The file is readable — no nonsense placeholder text.
2. The round-trip property is robust — hand-authoring just works on partial input.
3. The schema is honest — fields you don't write don't appear.

**Exception: defaulted fields.** When a field has a load-bearing default (the default IS the right semantic answer for unset state), emit the default. Example: `predecessor.counter_cadence ?? false` in the STATE.md normalizer — most milestones are NOT counter-cadence, so emitting `false` when absent is correct.

**Anti-pattern.** Emitting `UNKNOWN`/`TODO`/`???`/`N/A` placeholders when a generator can't resolve a field. The user almost never wants the placeholder in the final output; they want either the real value or no line at all.

**Reference implementation.** `tools/state-md-normalizer.mjs::generateCurrentPosition` + `generateEngineStateBaseline` — emit `Shipped:` when `shipped_at` is set, skip when absent; build the Predecessor line from whichever of `{tag, sha}` are present.

### Cross-class registry extraction at the SECOND class instance (Lesson #10426)

When a primitive accumulates instances across multiple classes (e.g. threshold classes with different observation sources, message-handler classes with different transports, parser classes with different formats), extract the per-class registry at the **second** class instance — not the first, not the third.

**Why not the first instance.** Premature. You don't yet know what's varying. A single instance contains no contrast; the abstraction shape is speculation.

**Why not the third instance.** The second class shipped using a temporary wrong-source measure (or a copy-pasted dispatch), accumulating semantic confusion in documentation that has to be unwound when the third class arrives. Test fixtures, docstrings, and operator-facing surfaces all encode the temporary measure as if it were the design.

**Why the second instance.** You know exactly what's varying — the contrast between class 1 and class 2 is concrete. The registry's shape is determined by the two real instances rather than by projection from one or speculation about future ones.

The pattern composes with [`#10422`](shelfware-verdict-patterns.md) (verdict-pattern surface separation) and [`#10423`](shelfware-verdict-patterns.md) (lightest wire that satisfies the verdict): those rules govern *how much* surface to add at any point; #10426 governs *when* to extract abstraction across that surface.

**How to apply.** When adding a feature that crosses a class boundary the codebase has not seen before:

1. Recon answers "is this a one-off or the start of a pattern?" (See Lesson #10412 — recon-first as default.)
2. If a one-off: treat it as such; do not speculate about future classes.
3. If a pattern: extract the per-class registry **now**, not at the third instance. The abstraction is small, the surface is clean, and downstream consumers see a single dispatcher rather than per-call branching.

**Anti-pattern.** Reusing the first class's source for a new class because it is the lightest *technical* wire. Cross-class semantic dishonesty (e.g. reusing `suggestions.json` as the source for a `token_budget.*` threshold) is more expensive than the registry extraction by every subsequent surface that has to encode "well, for token-budget this means something different."

**Reference implementation.** `src/bounded-learning/observation-sources.ts` — `observationSourceFor(threshold)` + `loadObservationsForThreshold(threshold, options)`. Extracted at v1.49.798 when `token_budget.warn_at_percent` became the first threshold in a second class. Three consumer-side validations followed within the same chained session (v799 audit log, v800 watch loop, v801 `/sc:status` summary). Each consumer is ~5–8 lines instead of ~15–25 lines because the dispatch lives in the registry.

**Empirical break-even.** In a multi-ship chain where the architectural extraction enables 3+ consumers, the extraction pays for itself: the v798 extraction added ~30 min over the lightest-wire option but saved ~10–15 min on each of v799, v800, v801. Net positive at the third consumer.

### Production-caller scope-reduction via path-narrowing (Lesson #10440)

When a forward-flag from a prior ship names a **wrapper class** as the
production-caller target (e.g., "wire `ActivationSelector` with
`fallbackProvider`") but the underlying **path** the wrapper exercises is
directly callable, prefer to call the path directly. The wrapper is an
integration concern — it composes lifecycle, scheduling, or DI — but the
path's behavior does not require its composition wrapper to be exercised.

**Why this matters.** Wrapper-class instantiation often requires building
peer dependencies (mock factories, executor injectors, lifecycle context)
that are NOT load-bearing for the path under test. The simpler scope —
call the path directly — avoids accreting those dependencies into the
caller surface.

**When the rule applies:**

- The forward-flag specifies a class (e.g., `ActivationSelector`,
  `PipelineActivationDispatch`).
- The path the class exercises is exposed as a free function or static
  module export (e.g., `predictNextSkillsWithMeta`,
  `appendPredictiveLowConfidenceEvent`).
- The wrapper class itself has zero production callers
  (substrate-ahead-of-demand).

In this configuration, instantiating the class is incidental to exercising
the path. Call the path directly.

**Evidence (2 instances).**

- **v1.49.845** — CLI calls `predictNextSkillsWithMeta +
  appendPredictiveLowConfidenceEvent` directly. The v837 forward-flag had
  named `ActivationSelector` + `PipelineActivationDispatch` as wire
  targets; the CLI bypasses both and exercises the path.
- **v1.49.846** — Substrate auto-emit lives inside the existing
  `emitPredictions` chain at the call site, calling
  `appendPredictiveLowConfidenceEvent` directly. No new wrapper class
  introduced.

**Anti-pattern.** Constructing the named wrapper class in the production
caller because the forward-flag named it. The wrapper's composition
becomes an unrelated dependency of the production caller; future refactors
of the wrapper will ripple into callers that don't actually use the
wrapper's composition.

**How to recognize the smell.** If a production-caller PR diff is
dominated by mock executors, lifecycle context constructors, or DI
plumbing, but the underlying path call is one or two lines, the wrapper
is incidental. Narrow the scope.

**Cross-references.**

- #10422 — shelfware verdict patterns; lightest-wire discipline applied
  to the production caller's call shape.
- #10423 — lightest wire that satisfies the verdict; this lesson is the
  production-caller specialization of that rule.
- #10412 — recon-first; the path-vs-wrapper question is the recon
  question that surfaces this lesson.

### Size-ascending chip-pick reveals wire-shape diversity (Lesson #10444)

When chipping down a KNOWN_UNWIRED allowlist (#10432) by picking
entries **smallest-LOC first**, the size-ascending traversal
incidentally surfaces the catalog of viable wire shapes — at zero
explicit planning cost. The cluster's first ship is the simplest
template; each subsequent (larger) chip adds a richer shape; the
campaign-close wire-shape catalog is a free byproduct.

**Why this works.** File size correlates with structural complexity in
chokepoint retrofits:

- **Small files (~70-200 LOC)** trend toward a single-function module
  with one spawn/fetch site. The viable shape is **hoist-at-top** —
  single `ensure*Allowed` call at the top of the entry function.
- **Mid-size files (~200-400 LOC)** introduce a Promise wrapper, a
  factory, or a callback boundary. Shapes: **hoist-outside-Promise**
  (with or without cleanup-on-denial) or **closure-capture** (factory
  returns a function that captures `ctx`).
- **Larger files (~400-800 LOC)** often have multiple sibling spawn or
  fetch sites wrapped in an existing internal helper. Shape:
  **internal-helper** (#10433) — thread `ctx?` through the helper, one
  `ensure*Allowed` protects N call sites.
- **Larger files with dependency injection** expose the **DI-executor
  + tokenized-argv** shape (#10441) or the Egress analog
  **DI-fetch-wrapper** — the default executor closes over `ctx?` and
  checks before delegating; injected executors bypass (caller owns
  security).
- **Cross-cutting modules** (multiple sites, no shared helper) expose
  the **two-site hoisted-check** shape — each site gets its own hoist
  before its try block.

The smallest-LOC chip is the cheapest first ship; it also exercises
the simplest wire shape, so the cluster's first ship is the simplest
template. By the time the cluster closes, the wire-shape catalog is
complete without anyone having explicitly planned variant coverage.

**Empirical evidence (2 instances).**

- **Track 2 — Process chip cluster (v1.49.858-862).** 5 chips ordered
  ascending by LOC (81 → 220 → 408 → 167 → 560). 5 distinct wire
  shapes: hoist-at-top → hoist-outside-Promise+cleanup →
  internal-helper → hoist-outside-Promise (no cleanup) →
  closure-capture.
- **Track 3 — Egress chip cluster (v1.49.863-867).** 5 chips ordered
  ascending by LOC (73 → 108 → 161 → 193 → 151). 5 distinct wire
  shapes: hoist-at-top fetch → hoist-with-early-return-bypass →
  hoist-before-fetch (strict-fail) → DI-fetch-wrapper → two-site
  hoisted-check.

10 chips across 2 chokepoint surfaces → 10 distinct wire shapes, no
variant-coverage planning involved. The size-ascending heuristic
surfaced #10433 and #10441 variants naturally at the LOC bands where
those shapes structurally belong.

**How to apply.**

1. **Sort the candidates by `wc -l` ascending.** Pick the smallest
   first.
2. **Ship the chip with whatever shape the file requires.** Do not
   force-fit a shape from the previous chip; the shape is a property
   of the file, not of the campaign.
3. **Document the wire shape in the release-notes README** (e.g.,
   "hoist-at-top spawnSync", "internal-helper", "two-site
   hoisted-check"). The catalog builds as you go.
4. **At cluster close, the wire-shape catalog is the campaign
   artifact.** No explicit catalog-building step required.

**Composition with other rules.**

- **#10422 / #10423 (lightest wire that satisfies the verdict)** — at
  each chip, pick the lightest shape that satisfies the chokepoint's
  audit. Size-ascending picks the lightest shapes first by accident;
  the per-chip rule is `lightest viable shape for THIS file`, not
  `lightest shape overall`.
- **#10433 (internal-helper for ctx? threading)** — emerges naturally
  at the LOC band where files have multiple sibling spawn/fetch sites
  in a pre-existing helper. The size-ascending traversal hits this
  band in the middle of the cluster, not at the start.
- **#10440 (production-caller path-narrowing)** — the wire shape
  follows the file's own structure; do not accrete wrapper-class
  scaffolding to force a shape from another chip.
- **#10432 (KNOWN_UNWIRED ratchet-ledger)** — the chip cadence (one per
  ship) is the substrate; size-ascending is the picking order within
  the cadence.

**Anti-pattern.** Picking the most "interesting" or "important" file
first because it's the highest-LOC or highest-call-multiplicity entry.
That puts the most complex wire shape at the start of the campaign
and buries the simple shapes — the operator builds muscle memory on
the hardest case, then unwinds it on the easy cases. Size-ascending
inverts this: build muscle memory on the simplest case, let the
cluster surface the harder shapes naturally as LOC grows.

**Anti-pattern.** Force-fitting every chip in a cluster into one wire
shape because the previous chip used that shape. The shape is a
property of the file, not of the campaign. Force-fitting accretes the
peer-dependency surface that #10440 flags as unnecessary.

**Reference implementation.** v1.49.857-867 11-ship campaign README
(10-chip wire-shape catalog table; one wire shape per chip, all
distinct, ascending by LOC within each track).

### Spawn-site count as primary wire-shape predictor (Lesson #10445)

LOC is a coarse predictor of wire-shape complexity. The richer predictor
is **spawn-site count (N)** — how many places in the file issue the
side-effecting operation the chokepoint is gating (spawn, fetch, read).

**Why N dominates LOC at the extremes.** Two counter-examples from the
v868-v882 campaign:

- **v1.49.872 — `src/cli/commands/pic2html.ts` (311 LOC, N=1).**
  Mid-band LOC but a single spawn site. The viable shape was
  **hoist-at-top**, the simplest in the catalog — not the
  internal-helper or DI-executor shapes that the 311-LOC band would
  predict from #10444's LOC heuristic.
- **v1.49.875 — `src/chipset/harness-integrity.ts` (1440 LOC, N=1).**
  Largest LOC in the entire Track 4 cluster but still N=1. The viable
  shape was again **hoist-at-top** at the single spawn site. The 1440
  LOC's complexity lived in the surrounding orchestration, NOT in
  spawn-call multiplicity.

In both cases, the LOC heuristic would have predicted a richer shape
(internal-helper, DI-executor, or class-private-method). The actual
shape was determined by N=1.

**How to apply.** When sizing a chip ship:

1. **First pass — sort by LOC ascending** per #10444. This is the
   cheap heuristic and stays the default picking order.
2. **Second pass — for each candidate, count spawn/fetch sites (N)
   before estimating wall-clock.** A high-LOC file with N=1 is a
   small ship; a mid-LOC file with N=10 is a larger ship.
3. **The wire shape selection then follows N more than LOC:**
   - **N=1 → hoist-at-top** (regardless of LOC). The shape is the
     simplest viable wire.
   - **N=2 + co-located → two-site hoisted-check.** Both hoists are
     mechanical; the catch-block #10427 re-throw is the only nuance.
   - **N≥3 with a pre-existing internal helper → internal-helper
     (#10433).** Thread `ctx?` through the helper once.
   - **N≥3 without an internal helper but with a factory + injected
     executor → DI-executor (#10441).** Wrap the default executor.
   - **N≥3 without helper or executor seam → per-callsite hoists.**
     Highest cost; consider whether a refactor extracting an internal
     helper is the better first step.

**Evidence (2 instances).**

| Ship | File | LOC | N | LOC-heuristic prediction | Actual shape |
|---|---|---|---|---|---|
| v1.49.872 | `cli/commands/pic2html.ts` | 311 | 1 | hoist-outside-Promise / closure-capture | hoist-at-top |
| v1.49.875 | `chipset/harness-integrity.ts` | 1440 | 1 | internal-helper / DI-executor | hoist-at-top |

Both ships used the simplest shape in the catalog because N=1. The
LOC heuristic would have force-fit a richer shape and accreted
unnecessary scaffolding per #10440's anti-pattern.

**Composition with #10444.** This refinement does NOT replace the
size-ascending pick order — LOC is still the right first-pass sort
because (a) LOC is observable without opening the file, and (b)
LOC-ascending still surfaces wire-shape diversity at zero planning
cost when N tracks with LOC (which it does for the majority of files,
hence #10444's empirical validation). The refinement applies at the
second pass: AFTER picking the smallest unpicked candidate, count N
before estimating effort and selecting the shape.

**Anti-pattern.** Estimating wall-clock or selecting wire-shape from
LOC alone when the file is a high-LOC orchestration with a single
spawn site. The estimate will be too high; the shape selection will
force-fit a richer pattern.

**Anti-pattern.** Demanding "the smallest LOC AND the smallest N first."
The double-sort can starve the cluster — a large-LOC small-N candidate
is still a small ship. Take it; the wire-shape catalog will surface
the same diversity.

### Router-with-conditional-bypass wire shape (Lesson #10447)

When a public surface routes between a chokepoint-gated path and a
non-gated path (e.g., a function that installs from a local copy
vs. downloading from a remote URL), apply **router-with-conditional-
bypass**: keep the router itself unchanged; thread `ctx?` only into
the gated path; let the non-gated path remain a literal bypass.

```ts
// Router function: unchanged. The two callees own their own
// chokepoint contracts.
export async function installSkill(
  name: string,
  source: string,
  options?: InstallOptions,
  ctx?: EgressContext,
): Promise<InstallResult> {
  if (isLocalPath(source)) {
    return installFromLocal(name, source, options);
    //                                              ^ no ctx — bypass
  }
  return installFromRemote(name, source, options, ctx);
  //                                              ^^^^ gated
}
```

**Why this shape exists.** The router's branches genuinely differ in
chokepoint scope: the local path's side effect (copying bytes from
disk) is governed by LoaderContext, not EgressContext; the remote
path's side effect (downloading bytes from a URL) is governed by
EgressContext. Threading `ctx?: EgressContext` into the local path
would either (a) lie about its scope or (b) accrete a dual-ctx
signature for no observable benefit.

The router-with-conditional-bypass is a structural pattern: the
chokepoint scope is a property of the destination branch, not of the
router.

**Evidence (2 instances).**

| Ship | File | Router | Gated path | Bypassed path |
|---|---|---|---|---|
| v1.49.864 | `src/upstream-intelligence/git-collector.ts` | `collect()` | remote-clone branch (fetch via `git clone --depth 1`) | local-copy branch (no network egress) |
| v1.49.880 | `src/mcp/skill-installer.ts` | `installSkill()` | `installFromRemote()` (HTTP fetch) | `installFromLocal()` (cp from disk) |

Both ships left the router unchanged; both threaded `ctx?` only into
the gated path; both kept the bypassed path's signature unchanged.

**How to apply.**

1. **Identify whether the router branches differ in chokepoint
   scope.** If yes, this shape applies.
2. **Thread `ctx?` only into the gated path.** Add it as the last
   positional parameter of that path's function signature.
3. **Leave the router itself unchanged** except for the new optional
   parameter on the router signature and the pass-through to the
   gated branch.
4. **Document the routing decision in the function docstring** so
   future operators can tell at a glance which branch is gated.

**Cross-references.**

- #10440 — production-caller scope-reduction; this shape is a
  router-level specialization (the router IS the production caller
  that narrows scope by branch).
- #10444 — size-ascending chip-pick; router-with-conditional-bypass
  emerges in the mid-to-large LOC band where files internally route.
- Security chokepoints LoaderContext / EgressContext / ProcessContext
  are scope-distinct chokepoints; the router shape composes naturally
  with the scope-per-branch invariant.

**Anti-pattern.** Threading `ctx?: EgressContext` into the
local-copy branch "for symmetry." The branch does not perform egress;
the parameter is dead weight, adds confusion at every caller, and may
gate future refactors of the local path into the wrong chokepoint
contract.

**Anti-pattern.** Lifting the chokepoint check to the router itself
and unconditionally calling `ensure*Allowed` regardless of branch.
The local path does not need the check; the audit log fills with
false-positive entries; the allow-list grows with paths the
chokepoint should not be gating.

### Shared-helper hoist sub-variant catalog (Lesson #10448)

#10444 named "shared-helper hoist" as one wire shape; the v868-v882
campaign surfaced five distinct sub-variants of the shape across 12
chip ships. Each sub-variant is a different answer to "where does the
chokepoint check live in this file's structure?"

The five sub-variants emerge naturally from size-ascending traversal
of mixed-shape files. The catalog below pairs each sub-variant with
its first-instance evidence; future chips should pick the sub-variant
that matches the file's existing structure rather than force-fitting.

| Sub-variant | Hoist location | First instance | Best fit |
|---|---|---|---|
| **hoist-at-top** | Top of the entry function, OUTSIDE any try/catch. | v1.49.872 `cli/commands/pic2html.ts` (N=1) | Single spawn/fetch site; high-LOC orchestrations with N=1. |
| **two-site hoisted-check** | Each of N sibling sites gets its own hoist. | v1.49.876 `aminet/package-fetcher.ts` (N=2) | N=2 sibling sites without a shared helper. |
| **class-instance two-site** | `ctx?` stored as instance field; each method hoists before its own side effect. | v1.49.878 `chips/anthropic-chip.ts` (N=2 methods) | Class-based file with multiple methods each performing the gated op. |
| **class-stored hoist-at-top** | `ctx?` stored as `private readonly ctx?` field via constructor; single fs-op method hoists `this.ctx`. | v1.49.890 `eval/calibration-adjustment-store.ts` (N=1 method) | Class-based file with EXACTLY ONE fs-op method; preserves public method signature unchanged. |
| **internal-helper-method** | Shared `private` method on a class wraps the side effect; `ctx?` threaded through the method. | v1.49.870 `learning/version-manager.ts` (N=7) | Class with many sibling spawn-calls behind a private helper. |
| **module-internal-helper** | Free-function helper at module scope; `ctx?` threaded through the helper signature. | v1.49.873 `git/gates/pre-flight.ts` (N=12) | Module with a free-function helper; high N benefits from one-LOC-per-callsite. |

**Also-ran sub-variants from the broader campaign:**

- **closure-capture** (v1.49.871) — factory returns functions that
  close over `ctx`. Same shape as `internal-helper-method` but at the
  function-factory boundary instead of the class boundary.
- **safeExecFile wrapper** (v1.49.874) — wrapper helper that calls
  `execFile` (NOT `exec`) so the audit record captures the actual
  binary target rather than `sh`. Specializes
  `module-internal-helper` for ProcessContext + audit-fidelity (cross-
  ref #10449).

#### Track 5 wire-shape catalog (Egress, v876-v881)

Track 5 closed with 6 chips ordered ascending by LOC. The
size-ascending traversal surfaced four shapes (one NEW, two from the
sub-variant catalog above, one router specialization) without
explicit variant-coverage planning, mirroring the Track 4 retrospective.

| Ship | File | LOC | N | Wire shape | #10427 catches |
|---|---|---|---|---|---|
| v1.49.876 | `aminet/package-fetcher.ts` | 177 | 2 | two-site hoisted-check | 1 |
| v1.49.877 | `aminet/index-fetcher.ts` | 213 | 1 (per loop iter) | hoist-at-top inside mirror loop | 1 |
| v1.49.878 | `chips/anthropic-chip.ts` | 247 | 2 | class-instance two-site | 1 |
| v1.49.879 | `chips/http-client.ts` | 350 | 2 | class-instance two-site (sibling of v878) | 1 |
| v1.49.880 | `mcp/skill-installer.ts` | 401 | 1 (gated path) | router-with-conditional-bypass + hoist-at-top (see #10447) | 0 |
| v1.49.881 | `intelligence/ipc.ts` | 516 | 1 | **module-singleton** (NEW; 1 instance — see anti-pattern note below) | 0 |

Cluster artifact: 5 distinct shape categories observed across 6 chips,
with no force-fitting and a 5th #10444 cluster validation. The
#10427 re-throw catalog from Track 5 added 4 instances to the running
~30-instance total motivating #10446.

**Carry-forward — `module-singleton` (v1.49.881).** A new sub-variant
emerged at v881 ipc.ts: a `setIpcEgressContext(ctx)` setter writes a
module-level `let ipcEgressContext: EgressContext | undefined`
variable that the `invoke()` function reads before its single fetch.
This avoids threading `ctx?` through ~20 exported wrapper functions
that all delegate to `invoke()`.

This is **1 instance** (below the 2-instance promotion bar). It is
catalogued here as a carry-forward observation, NOT as a promoted
sub-variant. If a second instance appears in a future ship, promote
to the table above. Until then, treat it as a known-but-unsanctioned
shape: appropriate when N=1 AND the surrounding wrapper count is
high enough that threading `ctx?` through each wrapper has a real
cost.

**Anti-pattern (carry-forward).** Reaching for `module-singleton`
when N≥2 or the wrapper count is low. The module-singleton pattern
inverts the optional-`ctx?` discipline (#10414) — the chokepoint
state moves from per-call argument to module-level mutable state.
The cost is observability: tests must remember to reset the
singleton; concurrent contexts can race; the read-side `invoke()`
doesn't carry the context in its signature.

**How to apply (the broader shape).**

1. Open the file. Identify the gated operation (spawn / fetch / read).
2. Count N — number of distinct call sites.
3. Inspect the file's existing structure:
   - **Is there an internal helper that all sites flow through?** Use
     `module-internal-helper` or `internal-helper-method` depending on
     scope (free function vs class method).
   - **Are there N sibling sites with no shared helper?** Use
     `two-site hoisted-check` (or class-instance variant if the file
     is class-based).
   - **Is the file a router with branches in different chokepoint
     scopes?** Use `router-with-conditional-bypass` (#10447).
   - **Is N=1?** Use `hoist-at-top` regardless of LOC.
4. Document the chosen sub-variant in the release-notes README. The
   sub-variant catalog grows as new files surface; future chips reuse
   names from this catalog.

**Composition with #10445.** Sub-variant selection is N-driven; #10445
specifies how to pick the shape based on N. Both lessons compose:
#10448 names the shape; #10445 says which shape applies given N.

**Anti-pattern.** Inventing a new sub-variant name when the file fits
an existing sub-variant. The catalog's value is in the shared
vocabulary; sub-variant name proliferation defeats it.

### Class-stored hoist-at-top sub-variant of #10448 (Lesson #10455)

When the file under chip is a class with EXACTLY ONE fs-op method
(N=1 class-method), the cheapest wire shape is **class-stored
hoist-at-top**:

```ts
export class ScanStateStore {
  private readonly statePath: string;
  private readonly ctx?: LoaderContext;       // 1. store as readonly field

  constructor(statePath: string, ctx?: LoaderContext) {
    this.statePath = statePath;
    this.ctx = ctx;                            // 2. accept in constructor
  }

  async load(): Promise<ScanState> {
    // 3. hoist at TOP of the fs-op method, OUTSIDE any try/catch
    ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.statePath);

    try {
      const content = await readFile(this.statePath, 'utf-8');
      // ...
    } catch (err) {
      if (isENOENT(err)) return this.createEmpty();
      throw err;
    }
  }
}
```

**Distinct from `class-instance two-site`.** The class-instance
two-site sub-variant (v878) applies when the class has N≥2 fs-op
methods, each of which hoists independently. Class-stored
hoist-at-top is the N=1 specialization: one method, one hoist, ctx
stored once at construction.

**Distinct from module-function `hoist-at-top`.** v872's hoist-at-top
is the module-function form — `ctx` threads per-call through the
function signature. The class-stored form threads ctx ONCE through
the constructor; the public method signature is preserved unchanged.
This matters when the wired class has many callers using single-arg
constructors — the change is non-breaking.

**Evidence (3 instances).**

| Ship | File | LOC | fs-op method | Other methods |
|---|---|---|---|---|
| v1.49.890 | `eval/calibration-adjustment-store.ts` | 150 | `load()` | `save()` (not gated; see #10457) |
| v1.49.896 | `skill-workflows/workflow-run-store.ts` | 138 | `readAll()` | `append()` (not gated); `getRunEntries`/`getLatestRun`/`getCompletedSteps` (transitive — emit one audit per derived-method call) |
| v1.49.897 | `discovery/scan-state-store.ts` | 176 | `load()` | `save()`/`addExclude`/`removeExclude` (`save` not gated; derived methods emit one audit per call via transitive `load`) |

All three ships:
- Add `private readonly ctx?: LoaderContext` instance field.
- Modify constructor: `(statePath, ctx?: LoaderContext)` — non-breaking, optional second arg.
- Hoist `ensureAllowed(this.ctx, LOADER_SOURCE, 'read-file', this.path)` at the top of the single fs-op method, OUTSIDE the ENOENT-tolerant try/catch (per #10442).
- Leave the write-side method (`save`/`append`) intentionally not gated — LoaderContext is a read-side chokepoint by design (cross-ref #10457).

**Composition with derived-method ripple.** When the wired class has
derived methods that transitively call the fs-op method (e.g.,
v896's `getRunEntries` calls `readAll`; v897's `addExclude` calls
`load`), each derived-method call emits one audit record. The
integration test should assert this exact count to prevent silent
fidelity reductions from a future caching refactor (cross-ref #10456).

**How to apply.**

1. Identify the file as class-based with a single fs-op method.
2. Add `private readonly ctx?: LoaderContext` field.
3. Modify constructor to accept `ctx?` as optional second arg.
4. Hoist `ensureAllowed` at top of the fs-op method, outside the
   try/catch (per #10442).
5. Document write-side method as out-of-scope per LoaderContext
   read-side design (cross-ref #10457).
6. Add tests for: emit-one-audit-on-fs-op-method-call, denial-
   propagates-above-ENOENT-swallow, legacy-permissive (single-arg),
   prefix-pattern admission, save/append-not-gated, and derived-
   method audit-record-count if derived methods exist.

**Anti-pattern.** Wiring a class with N≥2 fs-op methods as class-
stored hoist-at-top — pick `class-instance two-site` instead so each
method gates independently. The class-stored form is a 1-method
specialization.

**Anti-pattern.** Threading `ctx?` through every public method of
the class. The class-stored form preserves the public surface; per-
method threading is the wrong abstraction for N=1 class-method.

## When this discipline kicks in

- Adding a new function/options-bag parameter that will be passed to N existing modules.
- Designing a security or invariant chokepoint that should NOT block existing callers from continuing to work.
- Writing a generator/template that may receive partial input from hand-authoring.
- Choosing between "fail loudly on missing field" and "produce a placeholder."
- Adding the SECOND instance of a class-typed family where the first instance has not yet been abstracted.
- Chipping down a KNOWN_UNWIRED allowlist (or any cross-cutting ratchet ledger) and choosing the picking order for the chip cluster.

## Anti-pattern summary

- ❌ Required-from-day-one chokepoint parameters.
- ❌ `UNKNOWN`/`TODO`/placeholder sentinels in generator output.
- ❌ Two-state (works / breaks) chokepoint design when three states (permissive / audit-only / enforced) are achievable for free.
- ❌ Reusing the first class's data source for a new class because it is the lightest *technical* wire; cross-class semantic dishonesty compounds with every downstream consumer.
- ❌ Deferring per-class abstraction extraction to the third instance — the second instance has already shipped under the temporary measure, and unwinding the surface costs more than the extraction would have.
- ❌ Picking the highest-LOC or highest-risk file first when chipping a ratchet-ledger cluster — forces the most complex wire shape at the start of the campaign and buries the simple shapes.
- ❌ Force-fitting every chip in a cluster into one wire shape because the previous chip used it — wire shape is a property of the file, not of the campaign.
- ❌ Estimating wall-clock or selecting wire-shape from LOC alone when a high-LOC orchestration has N=1 — both the estimate and the shape choice will be wrong.
- ❌ Threading `ctx?` into a router's non-gated branch "for symmetry" — the branch does not perform the side effect; the parameter is dead weight and gates future scope refactors.
- ❌ Inventing a new shared-helper-hoist sub-variant name when the file fits an existing sub-variant in the #10448 catalog — the shared vocabulary is the value.
- ❌ Reaching for `module-singleton` when N≥2 or the wrapper count is low — inverts #10414's optional-`ctx?` discipline and moves the chokepoint state into module-level mutable state.

## Lesson references

- **#10414** — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction. v782 candidate, promoted at v784.
- **#10416** — Tolerant generators are the default for hand-authored ↔ generated round-trips. v783 candidate, promoted at v784.
- **#10426** — Extract per-class registries at the SECOND class instance, not the third. v798 candidate, promoted at v802.
- **#10440** — Production-caller scope-reduction via path-narrowing: when a forward-flag names a wrapper class but the underlying path is directly callable, call the path directly. v845 + v846 candidate, promoted at v847.
- **#10444** — Size-ascending chip-pick reveals wire-shape diversity at zero explicit cost. v858-v862 Process cluster + v863-v867 Egress cluster 2-instance evidence, promoted at v868.
- **#10445** — Spawn-site count (N) as primary wire-shape predictor; refines #10444 at the LOC-vs-N edge case (high-LOC files with N=1 → hoist-at-top, not the richer shape LOC predicts). v872 + v875 two-instance evidence, promoted at v883.
- **#10447** — Router-with-conditional-bypass wire shape. When a router branches between gated and non-gated paths, thread `ctx?` only into the gated branch; leave the bypass branch's signature unchanged. v864 + v880 two-instance evidence, promoted at v883.
- **#10448** — Shared-helper hoist sub-variant catalog (hoist-at-top / two-site / class-instance two-site / internal-helper-method / module-internal-helper + carry-forward `module-singleton`). Track 5 wire-shape table appended. v868-v882 12-chip cluster evidence, promoted at v883.
- **#10455** — Class-stored hoist-at-top sub-variant of #10448. When the chip file is a class with EXACTLY ONE fs-op method (N=1 class-method), accept `ctx?` via constructor, store as `private readonly ctx?`, hoist `this.ctx` in the single fs-op method outside the ENOENT-tolerant try/catch. Distinct from class-instance two-site (N≥2 methods) and from module-function hoist-at-top (preserves public method signature unchanged). v890 + v896 + v897 three-instance evidence, promoted at v899.

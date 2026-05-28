# Architecture Retrofit Patterns

**Surface:** Introducing a chokepoint, interface, or generator-template to N existing modules with high call-site multiplicity; authoring a generator that may run on partial input.

**Codified at:** v1.49.784 (lesson cluster from v1.49.782 LoaderContext chokepoint + v1.49.783 STATE.md normalizer fix); v1.49.802 (extended with Lesson #10426 second-instance cross-class registry extraction from the v1.49.795-801 T1.1 arc); v1.49.847 (extended with Lesson #10440 production-caller path-narrowing from v845 + v846 two-instance evidence).

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

## When this discipline kicks in

- Adding a new function/options-bag parameter that will be passed to N existing modules.
- Designing a security or invariant chokepoint that should NOT block existing callers from continuing to work.
- Writing a generator/template that may receive partial input from hand-authoring.
- Choosing between "fail loudly on missing field" and "produce a placeholder."
- Adding the SECOND instance of a class-typed family where the first instance has not yet been abstracted.

## Anti-pattern summary

- ❌ Required-from-day-one chokepoint parameters.
- ❌ `UNKNOWN`/`TODO`/placeholder sentinels in generator output.
- ❌ Two-state (works / breaks) chokepoint design when three states (permissive / audit-only / enforced) are achievable for free.
- ❌ Reusing the first class's data source for a new class because it is the lightest *technical* wire; cross-class semantic dishonesty compounds with every downstream consumer.
- ❌ Deferring per-class abstraction extraction to the third instance — the second instance has already shipped under the temporary measure, and unwinding the surface costs more than the extraction would have.

## Lesson references

- **#10414** — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction. v782 candidate, promoted at v784.
- **#10416** — Tolerant generators are the default for hand-authored ↔ generated round-trips. v783 candidate, promoted at v784.
- **#10426** — Extract per-class registries at the SECOND class instance, not the third. v798 candidate, promoted at v802.
- **#10440** — Production-caller scope-reduction via path-narrowing: when a forward-flag names a wrapper class but the underlying path is directly callable, call the path directly. v845 + v846 candidate, promoted at v847.

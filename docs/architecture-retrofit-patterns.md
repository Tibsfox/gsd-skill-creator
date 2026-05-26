# Architecture Retrofit Patterns

**Surface:** Introducing a chokepoint, interface, or generator-template to N existing modules with high call-site multiplicity; authoring a generator that may run on partial input.

**Codified at:** v1.49.784 (lesson cluster from v1.49.782 LoaderContext chokepoint + v1.49.783 STATE.md normalizer fix).

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

## When this discipline kicks in

- Adding a new function/options-bag parameter that will be passed to N existing modules.
- Designing a security or invariant chokepoint that should NOT block existing callers from continuing to work.
- Writing a generator/template that may receive partial input from hand-authoring.
- Choosing between "fail loudly on missing field" and "produce a placeholder."

## Anti-pattern summary

- ❌ Required-from-day-one chokepoint parameters.
- ❌ `UNKNOWN`/`TODO`/placeholder sentinels in generator output.
- ❌ Two-state (works / breaks) chokepoint design when three states (permissive / audit-only / enforced) are achievable for free.

## Lesson references

- **#10414** — Optional `ctx?` parameter is the cheapest retrofit pattern for chokepoint introduction. v782 candidate.
- **#10416** — Tolerant generators are the default for hand-authored ↔ generated round-trips. v783 candidate.

# Cross-Rootdir Wire Discipline

**Surface:** Wiring a substrate-consumer relationship between `src/` and `.college/` (or any future rootdir pair) without violating the strict no-cross-import boundary; declaring duck-typed interfaces in one rootdir and structurally satisfying them from the other; verifying the wire functions end-to-end at the application boundary.

**Codified at:** v1.49.833 (lesson cluster from 5 instances accumulated across v1.49.823 + v1.49.829 + v1.49.830 + v1.49.831 + v1.49.832 — two distinct contract families: `SkillActivationObserver` (v823) and `ConceptFallbackProvider` (v830)).

## Why this discipline exists

The `src/` and `.college/` rootdirs cannot import each other directly — they have independent tsconfig roots, run as separate vitest projects, and ship as separate dist trees. This boundary is by design (rosetta-engine separability + lazy `.college/` load). But the boundary forces a question: how does production code in `src/` USE behavior implemented in `.college/`?

Three failure modes if the boundary is handled naively:
1. **Reaching across via relative paths** (`../../../.college/...`) — works at tsc time, BREAKS at vitest project separation and runtime bundling. Surfaces as "passes in dev, fails in CI" or worse, "passes everywhere except prod."
2. **Inlining `.college/` code into `src/`** — destroys separability, bloats the `src/` bundle, makes `.college/` updates require `src/` ships.
3. **Skipping the wire entirely** — declared an interface but never connected the two sides. Surfaces as "the test mocks the wire but no production caller actually consumes the wire."

The cross-rootdir wire pattern solves all three. The instances below validate it on real wires (observation pipeline at v823+v829; concept-fallback pipeline at v830+v831+v832) and produced zero boundary violations.

## Discipline patterns

### The 4-step cross-rootdir wire (Lesson #10435)

When `src/` code needs to invoke behavior that LIVES in `.college/` (or vice versa), use this 4-step pattern:

1. **Declare the interface in the CONSUMER rootdir.** The consumer (the side that USES the behavior) declares a TypeScript interface describing the method shape it needs. Use minimal, primitive field types — never reference cross-rootdir types in the interface.
2. **Implement the satisfier in the PROVIDER rootdir.** The provider (the side that PROVIDES the behavior) writes a class whose methods structurally satisfy the consumer's interface. No `implements` keyword — duck-typing across the boundary means the satisfier's class declaration NEVER imports the interface name.
3. **Bridge via an optional context field.** The consumer accepts the satisfier as an OPTIONAL parameter (typically a field on an options object passed to a class constructor or factory). When unset, the wire is fully no-op — zero cost, zero side effect, zero behavior change.
4. **Verify with a `tests/integration/` test at the application boundary.** Create a test in `tests/integration/*.integration.test.ts` (which has visibility into BOTH rootdirs per vitest's `integration` project config). The test instantiates the real provider, passes it through the consumer, and asserts the wire fires end-to-end.

**Each step is essential.** Skip step 1 → no contract; skip step 2 → no behavior; skip step 3 → forced coupling; skip step 4 → wire works in unit tests with mocks but never proven end-to-end.

**Reference implementations:**
- `src/dashboard/activity-tab-toggle.ts` + `.college/integration/observation-bridge.ts` + `tests/integration/college-observation-bridge-wire.integration.test.ts` — `SkillActivationObserver` family (v1.49.823 / .829).
- `src/predictive-skill-loader/fallback.ts` + `.college/integration/rosetta-concept-fallback.ts` + `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` — `ConceptFallbackProvider` family (v1.49.830 / .831 / .832).

### Local-interface redeclaration discipline (subordinate to Lesson #10435)

When the satisfier needs to RETURN a value typed against the consumer's interface (rather than just receiving inputs), the provider rootdir MUST locally redeclare the result type. Example: `ConceptSuggestion` is declared in `src/predictive-skill-loader/fallback.ts` AND redeclared in `.college/integration/rosetta-concept-fallback.ts` — the two declarations are byte-equivalent by manual maintenance.

**Why local redeclaration is required.** The provider rootdir cannot import the result type from the consumer (cross-rootdir boundary). Inline-typing the result (`Promise<{ conceptId: string; rendered: string; ... }>`) works but bloats every signature and loses the named type. Local redeclaration restores readability.

**Cost.** Field-rename drift between the two declarations is silent — only the call site catches a mismatch, not the result-shape consumer. Mitigation: document the maintenance pairing inline at both sites (`// MUST stay byte-equivalent to <other-site>`) and prefer minimal interfaces (fewer fields = less drift surface).

**Anti-pattern.** Reaching across with `../../<other-rootdir>/...` to import the result type. Breaks at vitest project separation; surfaces as flaky CI behavior.

**Reference implementation.** `ConceptSuggestion` in both `src/predictive-skill-loader/fallback.ts` and `.college/integration/rosetta-concept-fallback.ts` (v1.49.830 + v1.49.831).

### `Pick<T, K>` structural-handle narrowing (subordinate to Lesson #10435)

When the satisfier accepts a CONCRETE class from its own rootdir as a constructor option AND tests need to pass mock objects without a cast, type the constructor option as `Pick<ConcreteClass, 'method1' | 'method2'>` rather than the full concrete class.

Three benefits:

1. **Tests can pass thin mocks.** A `vi.fn(...)` object structurally satisfies `Pick<>` without a type assertion.
2. **Real instances still flow through.** TypeScript subtyping accepts a `ConcreteClass` instance being passed to a `Pick<ConcreteClass, K>` slot.
3. **The signature documents what's actually used.** A reader sees exactly which methods the satisfier touches without scanning the body.

**Reference implementation.** `RegistryHandle = Pick<ConceptRegistry, 'search' | 'get'>` and `EngineHandle = Pick<RosettaCore, 'translate'>` in `.college/integration/rosetta-concept-fallback.ts` (v1.49.831).

**Anti-pattern.** Typing the constructor option as the full concrete class then forcing tests to write `mock as unknown as ConcreteClass`. Loses the duck-typing ergonomics for no payoff.

## When this discipline applies

- Authoring a new wire from `src/` into `.college/` (substrate consumer → rosetta-engine producer).
- Authoring a new wire from `.college/` into `src/` (rosetta-engine consumer → substrate producer; rarer but the same shape).
- Reviewing whether a PR's cross-rootdir wire follows the 4-step pattern; flagging skipped steps.
- Deciding whether a new `.college/integration/` module should accept full concrete class instances or `Pick<>` narrowed handles in its constructor.

## When this discipline does NOT apply

- Wires entirely within `src/` (use normal TypeScript imports).
- Wires entirely within `.college/` (use normal TypeScript imports).
- Wires across the Tauri boundary (`src/` ↔ `src-tauri/`) — different rootdir pair with different constraints (IPC, serde).
- Wires across the desktop frontend boundary (`src/` ↔ `desktop/`) — also different constraints (browser ↔ node).

## Lesson coverage

- **Lesson #10435** — Cross-rootdir wire pattern: the 4-step declare/satisfy/bridge/verify shape. Codified at v1.49.833 from the v1.49.823 + v1.49.829 + v1.49.830 + v1.49.831 + v1.49.832 evidence set.

## Carried-forward observations (not yet codified)

| Observation | Instances | Status |
|---|---|---|
| Substrate-consumer hook PAIR pattern (`onPredictions` + `fallbackProvider` co-located, both fire-and-forget, both two-layer subscriber-gated) | 2 (v830 copper + v832 selector) | Codification deferred to next codify ship; eligible at v833 |
| `onPredictions` substrate-consumer wire pattern (specific to the predictive-skill-loader integration) | 2 (v810 + v826) | Codification deferred to next codify ship; eligible from prior chain |
| Fail-soft fallback pattern (try/catch returning `null` at every external boundary) | 1 (v831) | Wait for 2nd |
| Verification/integration-only ships (small src/ delta + substantial test infrastructure) | 2 (v829 + v832) | Codification candidate for #10428 meta-cadence axis extension; deferred |

These observations all sit within or adjacent to the cross-rootdir wire family. Future codify ships will consolidate them into either this discipline (as subordinate sections) or new sibling disciplines depending on whether the patterns generalize beyond cross-rootdir wires.

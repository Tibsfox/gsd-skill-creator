# KNOWN_UNWIRED Allowlists as Migration-Debt Ledger

**Lesson #10432** — codified at v1.49.814.

## Rule

When a chokepoint (or any cross-cutting enforcement audit-test) is introduced
into a mature codebase, it MUST grandfather existing call sites via a named
allowlist in the audit-test itself. The allowlist serves as:

1. **A migration-debt ledger** visible at every audit-test run
2. **An operator-actionable backlog** — one entry per call site to chip
3. **A bidirectional invariant boundary** that grows tighter as ships chip it

The allowlist is NOT a permanent exemption mechanism. It is a deliberately
visible debt counter that should asymptote toward zero as the codebase
migrates.

## Case study: v806 chokepoint extension + v809-v812 chip ships

The pattern was observed across 4 ships before promotion:

| Ship | Action | Surface |
|---|---|---|
| v1.49.806 | Introduces `KNOWN_UNWIRED` Set<string> in `egress-context-audit.test.ts` + `process-context-audit.test.ts` | 16 egress + 38 process grandfathered callers |
| v1.49.809 | Chip 1 — removes `npm.ts` from egress KNOWN_UNWIRED | 16 → 15 egress |
| v1.49.811 | Batch chip — removes 4 sibling adapters (cargo, conda, pypi, rubygems) | 15 → 11 egress |
| v1.49.812 | Chip 1 — removes `intelligence/analyzer/git.ts` from process KNOWN_UNWIRED | 38 → 37 process |

By v812, the pattern was clearly established: every chip ship updates the
allowlist as the audit's BehaviorViewpoint change. The allowlist count is the
migration progress indicator.

## When to apply

When introducing any new audit-test that enforces a cross-cutting invariant
on `src/` files (or any surface with grandfathered call sites):

- Filesystem chokepoints (LoaderContext audit at v782)
- Network egress chokepoints (EgressContext audit at v806)
- Process spawn chokepoints (ProcessContext audit at v806)
- Future cross-cutting audits (e.g., audit-log emission, telemetry tagging,
  feature-flag check site enforcement)

Out of scope:
- Audits that catch design errors (architectural-boundary audits) — those
  should fail loudly without an allowlist
- Type-system-enforced invariants — the type system already provides the
  invariant; no allowlist needed
- Hand-written audit doc-comments — convention, not enforcement

## How to apply

1. **Add the audit-test to `src/<domain>/<feature>-audit.test.ts`.** Use the
   v806 pattern: grep `src/` for the signature; check each found file against
   either the wire requirement OR the KNOWN_UNWIRED allowlist.

2. **Inventory the existing call sites.** Run the audit's grep; the matched
   files become the initial KNOWN_UNWIRED population.

3. **Add a comment block above KNOWN_UNWIRED** documenting:
   - The chokepoint name + version of introduction
   - The migration policy (e.g., "Chip this list down ship-by-ship")
   - How operators wire a KNOWN_UNWIRED entry (the per-file wire shape)

4. **Add a bidirectional invariant test:** assert that each KNOWN_UNWIRED
   entry actually exists on disk AND contains the audit's signature. This
   prevents stale entries from accumulating when files are renamed/removed.

5. **Per-chip-ship release notes** must include:
   - Which entries were removed (`<surface> KNOWN_UNWIRED N → N-K`)
   - Any orchestrator-level fixes discovered (#10427 hoist mistakes etc)
   - The chip shape — for first chip in a family, document the template

6. **Periodic batch-down ships** (5-1-1 alternation per #10430): when N
   sibling entries share a common shape, batch them in one ship after the
   first-chip establishes the per-family template.

## Forward observations

### Unidirectional enforcement asymmetry

The v806 audit-tests enforce "files NOT in KNOWN_UNWIRED but containing the
signature MUST call ensure*Allowed" but do NOT enforce the inverse: a wired
file can carry a stale KNOWN_UNWIRED entry indefinitely without test failure.
A future enhancement should add the inverse check ("files in KNOWN_UNWIRED
must NOT also call ensure*Allowed"). Flagged at v812 retrospective. Not
urgent — the per-ship release-notes discipline catches it manually at chip
cadence.

### Block-comment consolidation when N-of-N siblings are wired

When all members of a family are wired (e.g., all 5 registry adapters at v811),
listing each individually in KNOWN_UNWIRED comments creates noise. Consolidate
into a single line referencing the family + N wire dates. Cleaner ledger; the
per-ship history lives in per-file docstrings + release notes. Pattern observed
at v811.

### Audit-test as observability surface

The KNOWN_UNWIRED count is a direct migration-progress metric. A future
observability tool could emit the count as a time-series (alongside the
adoption-baseline JSON files from `tools/adoption-refresh.mjs`); the
trajectory is operator-actionable. Out of scope this ship.

## Generalization beyond chokepoints (Lesson #10434)

The KNOWN_UNWIRED shape — a named, visible, ratcheted ledger of
out-of-conformance entries that an enforcement gate consults — is NOT
chokepoint-specific. The same structural pattern works for any cross-cutting
observability + enforcement surface where:

1. The current state has N out-of-conformance entries.
2. Each entry is independently chip-able toward conformance.
3. Operator-driven ratchet replaces a single-step migration.

### Case study: discipline-coverage ceiling (v1.49.821 + v1.49.822)

The T2.2 audit wedge closed at v1.49.821 + v1.49.822 with the same shape:

| Aspect | KNOWN_UNWIRED (chokepoints, v806) | Discipline-coverage ceiling (v821+v822) |
|---|---|---|
| Surface tracked | per-file presence of `ensure*Allowed` | per-discipline UNCODIFIED count |
| Initial state | 16 egress + 38 process grandfathered | 50 ceiling on UNCODIFIED count |
| Chip mechanism | per-file wire → remove from set | per-discipline codify → count drops |
| Gate enforcement | audit-test BLOCK if file missing wire + not in set | pre-tag-gate BLOCK if count > ceiling |
| Default behavior | BLOCK with explicit opt-out | BLOCK with explicit opt-out (`SC_DISCIPLINE_COVERAGE_CEILING`) |
| Asymptote target | 0 entries | 0 UNCODIFIED |
| Trajectory documentation | per-ship release notes `N → N-K` | per-ship release notes `ceiling N → N-K` |

Both surfaces share:
- A current-state metric exposed at audit-time
- A ratchet mechanic (each chip ship reduces the count)
- Strict-mode preserved (legacy opt-in retains old semantics)
- Default-BLOCK with operator-visible ceiling-or-allowlist override

### When to reach for this generalization

Whenever a NEW cross-cutting invariant needs enforcement against a mature
codebase where:

- The conformance work is too large for a single ship
- Per-entry chip cost is bounded (each entry is independently fix-able)
- The gate has BOTH measurement (current count) AND threshold (ceiling) shapes available

Reach for: a count-ledger gate (this generalization) instead of either
(a) a strict gate that fails the build until 100% conformance OR (b) a
documented-only "social rule" that drifts.

### Anti-generalization

The ratchet-ledger shape is NOT the right tool when:

- Per-entry conformance is binary AND must be enforced at write-time (use the
  chokepoint pattern directly — KNOWN_UNWIRED is the load-bearing inventory)
- The list of out-of-conformance entries is unbounded or unenumerable
  (e.g., "all dependency licenses must be MIT-compatible" — the conformance
  surface is per-edge, not per-entry)
- The ratchet direction is unclear (some entries should stay out of
  conformance permanently — those want an exemption mechanism, not a debt
  counter)

Promotion threshold per #10426 (cross-class registry extraction at 2nd
instance) met at v821 (instance #2: discipline-coverage ceiling generalizes
the chokepoint KNOWN_UNWIRED pattern). Codified v1.49.824 from v806 + v821
case studies.

## Anti-patterns

- **Allowlist marked "stable" or "permanent".** The KNOWN_UNWIRED list is
  debt, not a feature. Document the intent (chip-down asymptote-to-zero)
  not the current state.
- **Allowlist used for "tests don't apply here" exemptions.** Use a different
  mechanism (per-file `// audit-exempt: <reason>` comment + audit reads it).
  KNOWN_UNWIRED is for grandfathered call sites that SHOULD be wired but
  aren't yet.
- **Adding entries to existing KNOWN_UNWIRED without a chip-ship plan.**
  Every entry is debt; entry addition without removal plan is debt accrual.
- **Removing an audit-test instead of chipping.** If the audit is too noisy,
  the answer is wire the surface or document the exemption — not delete the
  audit.

## Cross-references

- **#10414 (Gate-not-vigilance)** — KNOWN_UNWIRED is the deterministic
  inventory of where a process-discipline rule WOULD apply if everyone
  remembered the procedure. The allowlist makes the forgetfulness visible.
- **#10416 (Lightest wire)** — the per-chip wire is the smallest viable
  migration: just thread `ctx?`, hoist `ensure*Allowed`, remove KNOWN_UNWIRED
  entry. Batch-chip ships extend this at N×1 cost.
- **#10422 (Verdict-pattern surface separation)** — the audit-test
  enforcement and the per-chip wire decision are separate surfaces; KNOWN_UNWIRED
  removal is the audit's BehaviorViewpoint update from "grandfathered" to
  "wired".
- **#10426 (Cross-class registry extraction at 2nd instance)** — KNOWN_UNWIRED
  itself appears at 3 instances (LoaderContext + EgressContext + ProcessContext)
  in v806, motivating the codification in this discipline.
- **#10427 (Failure-mode contracts)** — every chip MUST hoist `ensure*Allowed`
  OUTSIDE error-swallowing try blocks; security denial is load-bearing.
- **Security chokepoints discipline** — the chokepoints' audit-tests are the
  reference implementation of this pattern.

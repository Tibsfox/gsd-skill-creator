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

## Inverse-audit: stale-entry detection (Lesson #10443)

The v806 audit-tests are unidirectional: they enforce "files NOT in
KNOWN_UNWIRED but containing the signature MUST call `ensure*Allowed`" but
do NOT enforce the inverse — that allowlist entries are still
load-bearing. Two distinct **stale-entry shapes** can accumulate silently
under the unidirectional check.

### Shape A — wired-but-still-in-allowlist

A file calls `ensure*Allowed` AND is still listed in `KNOWN_UNWIRED`. The
audit short-circuits on `KNOWN_UNWIRED.has(label)` before inspecting the
actual wire, so the entry is double-protected.

**First instance:** v1.49.834 surfaced `src/intelligence/analyzer/git.ts`
— the file had been wired since v1.49.812 but the allowlist edit was
silently skipped that ship; the off-by-one persisted across 22 milestones
of release-notes count claims before manual recon caught it.

**Inline closure:** v1.49.838 added the inverse-check directly inside
`src/security/process-context-audit.test.ts` and
`src/security/egress-context-audit.test.ts`:

```ts
it('KNOWN_UNWIRED entries do NOT call ensure*Allowed (stale-entry detector)', () => {
  // for each entry: throw if ensure*Allowed call site found
});
```

### Shape B — import-without-use

A file imports the chokepoint module via named imports AND is in
`KNOWN_UNWIRED` AND does NOT actually call any of the imported names
anywhere in the file body. The audit's "entry imports child_process"
check passes (the import is syntactically present) but no real spawn
ever happens.

**First instance:** v1.49.852 surfaced `src/scan-arxiv/bridge.ts` —
imported `execFileSync` from `node:child_process` but never called it
(likely leftover from an earlier version where the bridge ran an
external script). Removing the dead import + the allowlist entry was
the chip.

Shape B applies only to import-driven chokepoints (ProcessContext).
EgressContext is signature-driven (`fetch(` as a global), so its
existing "KNOWN_UNWIRED contains `fetch(`" check IS the shape-B
equivalent. LoaderContext has no allowlist, so neither shape applies.

### The cross-audit tool

`tools/security/check-stale-known-unwired.mjs` runs both shape-A and
shape-B inverse-checks against the ProcessContext and EgressContext
audit-test files. It regex-extracts each `KNOWN_UNWIRED` set, reads the
referenced source files, and emits a structured report (human-readable
by default, JSON via `--json`). Exit 0 if clean, 1 if any stale entries.
Designed to be invoked from `tools/pre-tag-gate.sh` or ad-hoc; mirrors
the inline vitest inverse-checks at the cross-audit layer.

### Continuous-verification mode

The v857 cross-audit tool was authored with a single integration mode:
run it ad-hoc to surface stale entries. The v1.49.858-867 chip campaign
(10 chips back-to-back) demonstrated a second mode — invoke it after
every chip ship as a continuous-verification check — and validated the
tool's operational tightness across ten consecutive Process and Egress
chips. The discipline is the operational productionization of #10443.

**The per-ship workflow.** After each chip ship that touches a
KNOWN_UNWIRED audit-test:

1. Apply the wire (add `ctx?` parameter, hoist `ensure*Allowed`, remove
   the KNOWN_UNWIRED entry).
2. `npm run build` — must pass.
3. **Run `node tools/security/check-stale-known-unwired.mjs`** — must
   report clean.
4. Proceed to T14.

The third step closes the per-ship verification loop: the chip's wire
intent + the audit-test allowlist edit + the tool's structural view of
the file are cross-checked in the same operator session, before the tag
push. The cost is sub-second per invocation; the value is catching
stale-shape regressions at chip-time rather than at the next codify
recon.

**Tools-detecting-silent-failures must themselves fail loudly.** The
v857 tool was built to catch silent stale entries in the allowlist; the
v1.49.867 chip surfaced the tool's own first real-world bug — a
substring `all errors return []` inside a wire-shape comment collided
with the regex extractor's non-greedy `[\s\S]*?\]\s*\)` terminator. The
tool reported 0 entries instead of 6 for Egress and was "clean" by
vacuous truth. The fix — anchoring the regex terminator to line-start
with the multi-line flag, `[\s\S]*?^\s*\]\s*\)/m` — shipped in the same
ship as the chip that triggered it.

The sibling pattern: any layer designed to surface silent-vs-loud
asymmetry (per #10427) must itself be checked for silent failures in
its detection path. A tool that vacuously reports "clean" because its
parser failed silently is worse than no tool — it actively hides what
it was built to surface. Vitest fixtures with deliberate parse-failure
cases + at least one sanity-check assertion against the real allowlist
counts catches both shapes (the v857 test suite did the former; the
v867 fix added the latter as a fixture line).

**Validated scale.** v1.49.858 through v1.49.867 — 10 consecutive chip
ships, 9 consecutive clean tool runs, 1 self-bug-fix at instance 10.
The discipline catches its own gaps; the v867 tool fix proves the
system works.

**How to apply.**

1. **After authoring a new ratchet-ledger gate**, also author its
   continuous-verification tool and a vitest suite that exercises both
   "clean" and "trip" cases against synthetic allowlist fixtures.
2. **Add at least one sanity-check assertion** that compares the tool's
   structural-view count against the actual allowlist file's enumerated
   entries. Drift between the two is the alarm bell for vacuous-true
   parse failure.
3. **Invoke the tool from the per-ship chip-ship workflow** — between
   `npm run build` and `pre-tag-gate` — so it runs before any
   side-effecting ship action. Promote to a deterministic pre-tag-gate
   step when the chip cadence stabilizes (operator-invoked → automatic
   transition closes the verification gap).

### How to apply (when a third stale-shape surfaces)

The discipline scales by adding one inverse-check per stale-shape:

1. **Identify the stale shape.** Name the shape, find the first
   instance, document the detection rule.
2. **Add an inline inverse-check** to the chokepoint's audit-test for
   automatic CI enforcement.
3. **Extend `tools/security/check-stale-known-unwired.mjs`** with the
   same logic so ad-hoc + pre-tag-gate runs catch the shape.
4. **Add a Shape X section to this discipline doc** under "Inverse-audit:
   stale-entry detection" with the first-instance evidence.

The 2-instance promotion rule (#10426) applies at the META level: two
distinct stale-shapes (A + B) prove the inverse-audit isn't shape-A-
specific. A third shape extends the same discipline rather than creating
a new one.

### Cross-references

- **#10421** (Static-analysis tool authoring) — the cross-audit tool
  follows the spawnSync-not-execSync, JSON-output-as-machine-readable,
  exit-code-as-signal conventions.
- **#10427** (Failure-mode contracts) — stale entries are a
  silent-vs-loud asymmetry; the inverse-check converts the silence to
  loudness at audit time.
- **#10432** (parent — KNOWN_UNWIRED as migration-debt ledger) — the
  inverse-audit closes the unidirectionality flagged in the v812
  forward-observation.
- **#10434** (KNOWN_UNWIRED generalization beyond chokepoints) — the
  inverse-audit shape generalizes too; any ratcheted-allowlist gate
  benefits from the same stale-shape catalog.

## Forward observations

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

### Post-drain ratchet + symmetric companion ceiling (v1.49.912)

A count-ledger ceiling is only as sensitive as the gap between the current
count and the ceiling. When v910 (PARTIAL 8 → 0) and v911 (UNCODIFIED 39 → 0)
drained both buckets to zero, the `SC_DISCIPLINE_COVERAGE_CEILING=41` gate was
left with 41 entries of slack — it would not fire until a large new backlog
reaccumulated. v1.49.912 ratcheted the UNCODIFIED ceiling **41 → 5** to restore
near-term sensitivity. **Ratchet a drained ceiling down within ~1 ship of the
drain** — a slack ceiling silently tolerates re-accumulation, which is exactly
the drift the gate exists to catch. The env-var override
(`SC_DISCIPLINE_COVERAGE_CEILING`) remains the forward-progress escape valve for
when a fast-accumulating campaign (e.g. a NASA degree-advance run) resumes.

v912 also closed a **parsed-but-ungated** asymmetry the v910 retro flagged: step
13 of `tools/pre-tag-gate.sh` already parsed the PARTIAL count into
`PARTIAL_COUNT` but only ever gated on UNCODIFIED, so PARTIAL drift was invisible
to the gate (it drifted to 8 unchecked across the whole v903–v909 campaign). The
fix adds a symmetric `SC_DISCIPLINE_PARTIAL_CEILING` (default 5) plus the
`--max-partial=N` companion flag on `check-discipline-coverage.mjs`, mirroring
`--max-uncodified=N`. **A metric a gate already computes but never enforces is
silent-drift surface — gate every parsed metric, or stop parsing it.** The two
ceilings are gated independently (either exceeding its ceiling BLOCKs); the
legacy strict-mode escape valve stays UNCODIFIED-only.

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

## Gate-enforce every runnable surface, paired with a drift-guard (Lesson #10461)

**A test/observability/policy surface that runs nowhere enforced silently
rots. Gate-enforce every such surface, and pair the gate with a drift-guard
so the enforced SET — or its REFERENCE DATA — cannot silently drift.**

This is the generalization the KNOWN_UNWIRED ledger and its inverse-audit
(#10443) point toward, lifted off chokepoints entirely. A `KNOWN_UNWIRED`
allowlist is one instance of a broader class: **any surface whose correctness
depends on being run**. If nothing runs it (or nothing pins its reference
data), it rots — and the rot is silent because the surface's whole job was to
be the thing that would have shouted.

### The two-layer shape

| Layer | Role | Failure mode if absent |
|---|---|---|
| **Layer 1 — enforce** | Wire the surface's own check into a gated + CI-run suite, so the surface runs every ship. | The surface runs nowhere; regressions accumulate unseen. |
| **Layer 2 — drift-guard** | A structural check that the ENFORCED SET (the include-list, the runner's file-set) or the surface's REFERENCE DATA (an allowlist, a baseline) cannot drift out of sync with reality. | The enforcement runs, but its inputs silently go stale; the gate passes on a lie. |

Either layer alone is incomplete. Layer 1 without Layer 2 ships a gate whose
coverage quietly shrinks (a new test never gets added to the include-list).
Layer 2 without Layer 1 pins a set that nothing actually runs.

### Three-instance evidence — the drift-form catalog

| # | Ship | Unenforced surface | How it rotted | Layer 1 (enforce) | Layer 2 (drift-guard) | Drift form |
|---|---|---|---|---|---|---|
| 1 | v1.49.913 | `vitest.tools.config.mjs` (~40 tools/+scripts/ vitest tests) | ran nowhere → 8 files silently red ~2 weeks | pre-tag-gate step 2.5 `tools-suite` + CI | `tools-config-coverage.test.mjs` explicit include-list vs disk | **omission-drift** (a file on disk missing from the set) |
| 2 | v1.49.914 | 2 `tools/` `node:test` files (21 tests) | vitest can't run them; no other runner | pre-tag-gate step 2.7 `tools-node-test` + CI | `--print-node-test` exact-set `toEqual` | **silent-addition-drift** (a file added to the set with no runner) |
| 3 | v1.49.915 | `atlas-deps-audit` policy tool (ADR-0003 acceptance test) | never gate-wired since v607 → its `CROSS_TREE_ALLOW_PATTERNS` allowlist drifted stale vs the v905 LoaderContext chokepoint wire → a false-positive violation nothing surfaced | live-tree Case 6 in the gate+CI tools suite | Case 6 IS the drift-guard (asserts the real tree passes; fails loudly on a new un-allowlisted import) | **reference-data-staleness** (allowlist vs disk reality) |

**What the third instance generalizes.** Instances 1 and 2 rot as *"the tests
don't run."* Instance 3 rots as *"the reference data went stale."* Same
disease (unenforced ⇒ silent rot), same cure (wire the surface's own check
into the gated suite so the surface enforces itself). The drift-form catalog
now spans three shapes — **omission-drift** (explicit include-list vs disk),
**silent-addition-drift** (exact-set `toEqual`), and **reference-data-staleness**
(allowlist vs disk reality). A `KNOWN_UNWIRED` allowlist is precisely a
reference-data surface: the inverse-audit (#10443) is the Layer-2 drift-guard
for it, and the cross-audit tool `tools/security/check-stale-known-unwired.mjs`
is that drift-guard wired into the gate.

### When to apply

When introducing OR auditing any surface whose value depends on being run each
ship:

- A test suite (vitest config include-list, a per-runner file-set)
- A second runner that the primary runner cannot execute (node:test under vitest)
- A static-analysis / policy tool whose allowlist or baseline must track reality
  (`atlas-deps-audit`, the adoption baseline, the discipline-coverage manifest)
- Any observability surface that emits a metric a gate consults

Ask the two questions: **(1) Does this run on a gate + in CI every ship?** If
not, it can rot unseen — add Layer 1. **(2) Can its enforced set or reference
data drift out of sync with disk reality without anything failing?** If yes,
add Layer 2.

### How to apply

1. **Wire Layer 1.** Register the surface's own check into the gated suite
   (`vitest.tools.config.mjs` + pre-tag-gate + CI). Confirm the first CI run
   concludes green — wiring into CI is only half the work; watch the run land
   (`gh run view`, not `gh run watch`'s exit code).
2. **Wire Layer 2.** Add the structural drift-guard matching the surface's
   drift form: include-list-vs-disk for omission-drift, exact-set `toEqual` for
   silent-addition-drift, allowlist-vs-disk (an inverse-audit / live-tree
   acceptance test) for reference-data-staleness.
3. **Make the surface enforce itself where possible.** The cleanest Layer-2 for
   a policy tool is the tool's own acceptance test run against the live tree
   (v915 Case 6): one assertion both enforces the policy AND fails loudly the
   moment the reference data drifts.

### Cross-references

- **#10443 (inverse-audit / stale-entry detection)** — the Layer-2 drift-guard
  for a `KNOWN_UNWIRED` allowlist specifically; #10461 names the general class
  that contains it.
- **#10432 / #10434 (this discipline)** — the ratchet-ledger is one runnable
  surface; #10461 is the rule for keeping every such surface enforced + pinned.
- **#10427 (failure-mode contracts)** — the silent-rot is a silent-vs-loud
  asymmetry; both layers convert silence to loudness (Layer 1 at run-time,
  Layer 2 at drift-time).
- **#10450 (static-analysis tool robustness)** — instance 3's stale-allowlist
  false-positive is the same family; a tool whose reference data rots must be
  gate-run so the rot is caught.
- **ADR-0003** (atlas clean-room policy) — the allowlist's authority;
  §Verification is the now-enforced acceptance test (v915 Case 6).

Promotion threshold per #10426 met across v913 (omission-drift) + v914
(silent-addition-drift) + v915 (reference-data-staleness) — three distinct
drift forms prove the rule is not test-suite-specific. Codified v1.49.916.

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

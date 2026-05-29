# Lessons Emitted — v1.49.899

Three NEW lessons promoted to ESTABLISHED + one EXISTING lesson extended to ESTABLISHED. Net manifest delta: +3 lessons (95 → 98).

## NEW — Lesson #10455: Class-stored hoist-at-top sub-variant of #10448

**Promoted at:** v1.49.899.

**Status:** ESTABLISHED (3-instance bar).

**Domain:** Architecture-retrofit patterns.

**Canonical doc:** `docs/architecture-retrofit-patterns.md`.

**Evidence (3 instances):**

| Ship | File | LOC | fs-op method | Other methods |
|---|---|---|---|---|
| v1.49.890 | `eval/calibration-adjustment-store.ts` | 150 | `load()` | `save()` (not gated) |
| v1.49.896 | `skill-workflows/workflow-run-store.ts` | 138 | `readAll()` | `append()` (not gated); `getRunEntries`/`getLatestRun`/`getCompletedSteps` (transitive) |
| v1.49.897 | `discovery/scan-state-store.ts` | 176 | `load()` | `save()`/`addExclude`/`removeExclude` (`save` not gated; derived methods transitive) |

**Rule:** When the chip file is a class with EXACTLY ONE fs-op method (N=1 class-method), accept `ctx?` via constructor, store as `private readonly ctx?` instance field, hoist `this.ctx` at the top of the single fs-op method OUTSIDE the ENOENT-tolerant try/catch per #10442.

**Distinct from sibling sub-variants:**
- `class-instance two-site` (N≥2 methods each hoist independently)
- `module-function hoist-at-top` (ctx threaded per-call through function signature; class-stored preserves public method signature unchanged)

**Why this matters:** When the wired class has many callers using single-arg constructors, the optional second-arg constructor is non-breaking. The change introduces a chokepoint without forcing N call-site churn.

## NEW — Lesson #10456: Audit-record-count assertion for chokepoint-gated reads

**Promoted at:** v1.49.899.

**Status:** ESTABLISHED (3-instance bar).

**Domain:** Test authoring.

**Canonical doc:** `docs/test-discipline/cf-closure-verification-templates.md` (Template 5).

**Evidence (3 instances):**

| Ship | File | Assertion shape | Variant |
|---|---|---|---|
| v1.49.892 | `dacp/bus/scanner.ts` | 9 records under outer invocation (1 + 8 inner-loop) | two-site outer-loop |
| v1.49.896 | `workflow-run-store.ts` | 3 records under 3 derived-method calls | derived-method ripple |
| v1.49.897 | `scan-state-store.ts` | 2 records under 2 derived methods + 0 from save between them | mixed read/write |

**Rule:** When a chokepoint-gated method has derived methods that transitively call it, the integration test MUST assert exactly N audit records under N invocations. Load-bearing regression detector against silent fidelity reductions.

**Why this matters:** A future caching refactor (e.g., memoizing `readAll`) would silently reduce audit emissions, breaking observability without breaking unit tests. The exact-N count assertion catches the regression at test time.

## NEW — Lesson #10457: Read-side-only chokepoint at write-bearing classes

**Promoted at:** v1.49.899.

**Status:** ESTABLISHED (3-instance bar).

**Domain:** Security chokepoints.

**Canonical doc:** `docs/security-chokepoints.md`.

**Evidence (3 instances):**

| Ship | File | Gated method | Not-gated method |
|---|---|---|---|
| v1.49.890 | `eval/calibration-adjustment-store.ts` | `load()` | `save()` |
| v1.49.896 | `skill-workflows/workflow-run-store.ts` | `readAll()` | `append()` |
| v1.49.897 | `discovery/scan-state-store.ts` | `load()` | `save()` |

**Rule:** LoaderContext is a READ-side chokepoint by design. When a wired class has BOTH read and write methods, ONLY the read methods are gated; the write methods are intentionally out-of-scope. Test the discipline explicitly with a not-gated-write assertion (restricted-ctx call succeeds AND emits zero audit records).

**Why this matters:** LoaderContext's docstring scopes the disk-read surface. Gating writes would require a separate WriterContext chokepoint (no such surface exists). Without the explicit not-gated-write test, accidental future gating of writes "for symmetry" goes unnoticed.

## EXTENDED — Lesson #10453: Substrate→calibration end-to-end integration test pattern → ESTABLISHED

**Promoted at:** v1.49.895 (initial 2-instance promotion); v1.49.899 (ESTABLISHED at 3-instance).

**Domain:** Meta-cadence.

**Canonical doc:** `docs/meta-cadence-discipline.md`.

**Updated evidence (3 instances):**

| Threshold | First substrate-write | Integration test | Ships-after-wire |
|---|---|---|---|
| `predictive.low_confidence_threshold` | v1.49.846 | v1.49.856 | 10 (canonical trigger) |
| `observation.retention_days` | v1.49.891 | v1.49.894 | 3 (early within budget) |
| `token_budget.max_percent` | v1.49.893 | v1.49.898 | 5 (within budget) |

**Variation-axis table added** (sync vs async, kind selection, boundary case, polarity invariance, override mechanism, multi-event ordering) — 7 columns × 3 rows. Captures the substrate-specific specializations that the 7-step common shape doesn't cover.

**Two sub-disciplines surfaced at v898 and folded into the promotion:**

- **Sync-substrate fire-and-forget order non-determinism:** When the substrate is synchronous but the auto-emit is fire-and-forget per #10437, back-to-back calls spawn Promise chains that complete in undefined order at the filesystem layer. The multi-event accumulation assertion MUST be order-independent (count + net-polarity), not sequence-based.
- **Outcome-driven kind subtlety:** When the substrate IS the comparison (vs. wrapping async work), the kind selection falls out of the inequality being checked. Test both polarities from a single substrate-API surface.

## Carry-forward — remaining 1-instance + 2-instance candidates

Approximately 13 candidates carry forward after v899:

- Live-inspection-driven byte-shape tie-breaking (1 instance v897)
- Convergence between size-ascending and shape-matching (1 instance v897)
- Within-budget closing-move opportunism (1 instance v898; partial echo v894)
- Synchronous-substrate fire-and-forget order non-determinism (1 instance v898; folded into #10453 but kept as separate 1-instance for the next promotion if a non-substrate instance emerges)
- 3-ship-after-wire optional ship within #10428 budget (1 instance v894)
- Default-kind selection discipline when CLI default doesn't exist (1 instance v891)
- `opts.ctx` vs separate ctx parameter (1 instance v889)
- `audit-log.test.ts` assertion-flip step (1 instance v888)
- `module-singleton` wire shape (1 instance v881)
- Audit-fidelity inline-literal extraction (1 instance v872)
- Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created)
- `git stash` cross-branch hazard (1 instance v883 session)
- Codify-ship duration scales with composition (6 data points now after v899)
- Cross-audit tool sanity-fixture coverage (1 instance v885)

## Cross-references

- #10448 (Shared-helper hoist sub-variant catalog — #10455 is a NEW catalog entry)
- #10442 (Hoist gates ABOVE swallow-catches — applied in all #10455 instances)
- #10437 (Subscriber-gated observability — substrate side of #10456's audit-record-count assertion)
- #10428 (Meta-cadence verify-axis — closed by #10453's three-instance ESTABLISHED)
- #10454 (Fire-and-forget test-side wait — sibling test discipline of #10456)

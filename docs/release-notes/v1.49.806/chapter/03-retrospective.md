# Retrospective — v1.49.806

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** 19th consecutive application. Spent ~10 min before writing code: read `loader-context.ts`, `loader-context-audit.test.ts`, a wired consumer (`cartridge/loader.ts`), and the audit retrospective's S6 paragraph. Recon surfaced three critical-path items that would have produced wrong work if skipped: (a) the "audit tool" is actually a vitest test, not a CLI; (b) the v782 docstring forward-references a non-existent CLI, which is itself a deferred-maintenance wedge; (c) the optional-`ctx?` consumer wire pattern requires the chokepoint call to be OUTSIDE any error-swallowing try/catch.
- **Lesson #10414 — Optional `ctx?` parameter chokepoint retrofit.** Both new surfaces mirror v782 exactly. Three operational states (undefined → permissive / default → audit-only / restricted → enforced) transfer verbatim. Zero call-site churn at existing sites.
- **Lesson #10422 — Verdict-pattern surface separation.** Each chokepoint has its own audit-test file (observability surface) separate from its type file (decision surface). The three chokepoints share a domain in disciplines.json but separate canonical implementation files.
- **Lesson #10423 — Lightest wire that satisfies the verdict.** Three concrete instances of resistance to over-engineering:
  1. Did NOT extract a generic `SecurityChokepoint<Op>` abstraction. The three surfaces have genuinely different target shapes (path / URL / command+argv) and different audit-op tags. A parametric generic would either lose per-surface affordances or add complexity for zero downstream payoff.
  2. Did NOT build separate CLI tools in `tools/security/`. The vitest test-as-audit pattern from v782 is simpler (no pre-tag-gate wiring, no second observability surface).
  3. Did NOT migrate all 30+ existing callers. The `KNOWN_UNWIRED` allowlist captures migration debt without forcing it all into one ship.
- **Lesson #10427 — Failure-mode contracts.** Caught a real bug during osv-client wiring: initial draft placed `ensureEgressAllowed()` INSIDE the network-failure try/catch, which would have made `EgressContextDenied` propagate as a graceful "0 vulnerabilities" response. Re-read the code as I wrote it, identified the swallow risk, hoisted the check out. This is exactly the surface this discipline catches.
- **Lesson #10415 — Deferred-maintenance escalation.** Closed the v782 loader-context.ts docstring forward-reference (~24 ships escalated). Within the 1-2-milestone closure target only because the ship was already touching loader-context.ts.
- **Lesson #10424 — Adoption-refresh AFTER bump.** Applied at T14 step 11. Thirteenth consecutive ship.

## What Worked

- **Verbatim transfer of the v782 shape.** Both new chokepoints are ~200 LOC each and follow the LoaderContext shape line-for-line at the type level. The unit tests are similarly mirror-image. No design exploration needed; the shape is determined.
- **`KNOWN_UNWIRED` as migration-debt tracking.** Tested at audit time: the allowlists are first-class data inside the audit-test file. Adding a new caller without wiring it fails the test; adding it to `KNOWN_UNWIRED` is a deliberate act with a comment. Operators see the migration backlog directly in the test source.
- **Behavior-based audit scoping.** Per Lesson #10410, the egress/process audit harnesses classify by behavior (`fetch(` call, `child_process` import), not by filename. Loader-context's filename + behavior combination doesn't generalize — there's no naming convention for egress callers. Behavior alone is the right filter.
- **Three-form import regex for ProcessContext audit.** Covers static `from 'node:child_process'`, lazy `const { exec } = require('node:child_process')`, and dynamic `await import('node:child_process')`. Caught 5 lazy/dynamic callers that the initial static-only regex missed.
- **Comment-stripping NOT needed.** The naive `\bfetch\s*\(` regex matched docstrings with `fetch (` (space-prefixed). Tightening to `\bfetch\(` (no whitespace) eliminated all 3 false positives without comment-stripping logic. Real call sites never have a space between `fetch` and `(`.
- **The osv-client wire surfaced a real bug.** A discipline that catches one real bug per application has paid for itself. #10427 caught the swallow-via-try/catch bug at wire time.
- **STATE.md normalizer drift caught at vitest time.** The v805 hand-authored STATE.md had ~2 lines of drift; `v1-49-635-meta-test.test.ts::C6` caught it during full-suite run. Two `--write` invocations + backup cleanup closed the drift.

## What Could Be Better

- **38 process callers + 16 egress callers grandfathered is a long migration tail.** The KNOWN_UNWIRED allowlists are operator-readable, but the migration cadence is undefined. Should the next ship pick one and migrate it? Should there be a periodic counter-cadence-shaped sweep ship that migrates 5-10? The audit-test makes the backlog visible; the cadence-shape is still open.
- **No automated test for the cross-surface invariants.** All three chokepoints share a shape but no test asserts the shape is consistent. A future ship could add a meta-test that asserts each chokepoint exports the same shape (type, ensure helper, default ctx, denied error). At 3 instances the test is now justifiable.
- **The `KNOWN_NOT_EGRESS` list (dashboard string-emitters) is a smell.** These files contain `fetch(` inside string templates that become browser code. A `Role: NOT an egress caller` docstring would be cleaner than a centralized allowlist, but adding 5 docstring edits to dashboard files is heavier than 5 list entries. The trade-off is debatable; the allowlist won by lightest-wire.
- **No coverage for argv-injection vetting.** ProcessContext records argv in the audit log but doesn't vet argv values. A truly hardened implementation would also gate dangerous argv patterns (e.g. `-rf /`, `--no-verify`). Left as a forward-shadow: argv-vetting is a richer surface than the current chokepoint and should be a separate ship if the use case appears.
- **Dashboard `fetch(` files are exempt without a clear policy on browser-emitted code.** If a future ship lands new `<script>` blocks with `fetch(`, the operator must add to `KNOWN_NOT_EGRESS` rather than wire — which is correct, but the rule isn't articulated outside this retrospective. Worth a follow-up: add a "browser-emitted code" subsection to `docs/security-chokepoints.md`.

## Surprises

- **The audit harness ran 4,093 tests** (2,047 egress + 2,046 process = one `it.each` per src/.ts file). The full test count jumped from 31,038 → 35,172 (+4,134, with 41 from unit tests). This is unusual scale for one ship but reflects the audit harness's per-file granularity. Wall-clock impact: full suite went from ~210s to ~307s — acceptable.
- **Sub-3 minute full suite still.** Adding 4,134 tests cost ~90 seconds. Each per-file audit test is sub-millisecond (regex against file content). At this trajectory, a 3rd chokepoint family added the same way would cost another minute.
- **STATE.md drift was already present at v805 close.** The v805 chained-session ship hand-authored STATE.md (per the v805 handoff). The normalizer would have caught it at v805 T14 if the test had been run, but the v805 handoff claimed 31,038/31,038 passing — suggesting the test was skipped or the drift was introduced after T14. Carry forward as a tentative observation: STATE.md normalizer test SHOULD be part of pre-tag-gate, not just full vitest.
- **Wall-clock landed at ~75-90 min.** At the high end of an investment-class ship band. The new-types work was ~20 min; audit harnesses ~25 min; doc + manifest + chapter set ~30 min; the STATE.md drift recovery + osv-client bug fix ~10 min. Comparable to a typical NASA ship.

## Tentative observations emitted this ship

- **(NEW v806) Chokepoint pattern at 3 instances — promotion-ready.** LoaderContext (v782), EgressContext (v806), ProcessContext (v806). #10426's "extract at the SECOND class instance" rule says the second instance is the right moment for abstraction; here, instances 2+3 arrived simultaneously. The decision to NOT abstract (sibling modules with the same shape) is itself a discipline data point — per #10423, lightest wire wins when the surfaces are genuinely different. A 4th instance would force the abstraction question; 3 instances with deliberate non-abstraction is a stable answer for now.
- **(NEW v806) `KNOWN_UNWIRED` allowlist as migration-debt ledger.** This is a new pattern shape: the test file IS the operator-facing migration backlog. The pattern was forced by the chokepoint introduction at 30+ unwired call sites — too many to wire in one ship, too few to need separate JSON storage. Carry forward; a second instance (e.g. if S2's adoption telemetry needs the same shape) would name the pattern.
- **(NEW v806) STATE.md normalizer drift accumulates without a pre-tag-gate check.** This ship caught drift from the v805 hand-author. The fix is to add the normalizer to pre-tag-gate step 14 (already named in S5). Carry forward as motivation for S5.

## Verdict on v806 scope

Three options were on the table at scope-decision time:
1. Both surfaces (chosen) — ~75-100 min budget.
2. Network egress only — ~45-60 min.
3. Recon-only ship — ~30-45 min.

Both-surfaces won because (a) the audit retrospective named them as one unit (S6); (b) the optional-`ctx?` pattern means types-only ships zero call-site churn so the broader scope doesn't multiply risk; (c) doing both at once lets the codification entry name the cross-surface discipline once. The 1-representative-wire-per-surface depth was the right calibration — it validates the wire pattern (the osv-client wire caught a real bug) without forcing a 30-file migration.

The architectural decision NOT to unify the three chokepoints under a generic `SecurityChokepoint<Op>` abstraction is the load-bearing choice this ship makes. The three are siblings, not parameterizations. Per #10423 (lightest wire) + #10426 (second-class-instance) the right answer at instance 3 is: ship the third sibling, observe whether a 4th class arrives, and abstract IF AND WHEN the contrast across 4 instances is concrete. Premature abstraction at 3 instances would lose per-surface affordances (URL prefix semantics, argv-aware audit records) without compensating downstream simplification.

## Lesson candidate backlog at close

| ID | Severity | Apply | Status |
|---|---|---|---|
| (tentative) watch-loop tear-down race | NOTE | v800 implementation | carry forward (1 instance) |
| (tentative) chained-session architectural-tax break-even | NOTE | v798→v799-801 observation | carry forward |
| (tentative) registry-abstraction cross-chain payoff | NOTE | v798→v804 observation | carry forward |
| (tentative) 6th-mode-flag refactor trigger | NOTE | v800-v804 trajectory | carry forward |
| (tentative v805) codification-ship pattern at 4 instances | NOTE | v784/v790/v802/v805 | carry forward (4 instances) |
| **(NEW v806) Chokepoint pattern at 3 instances** | NOTE | v782/v806/v806 | carry forward (3 instances; abstraction question deferred to instance 4) |
| **(NEW v806) `KNOWN_UNWIRED` as migration-debt ledger** | NOTE | v806 audit harness | carry forward (1 instance; pattern-name at 2nd instance) |
| **(NEW v806) STATE.md normalizer drift recurrence** | NOTE | v805 → v806 detection | carry forward; argues for S5 (PROJECT.md normalizer + STATE.md pre-tag-gate integration) |

Open lesson-candidate backlog: **0** (UNCHANGED). All carried items are tentative observations.

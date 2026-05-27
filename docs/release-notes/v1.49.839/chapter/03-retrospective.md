# v1.49.839 — Retrospective

**Wall-clock:** ~20 min from v838 close to v839 release-notes draft. Smallest ship of the 4-ship session (tied with v838).

## What went as expected

- **v812's `intelligence/analyzer/git.ts` wire was the perfect template.** Same file structure (single child_process call site wrapped in best-effort-silent try/catch); same canonical wire shape (hoist `ensureProcessAllowed` outside the catch). Implementation was nearly mechanical: add import, add optional `ctx?` param, hoist the call, update JSDoc. No new architectural decisions.
- **Internal-helper pattern (#10433) made the wire low-cost.** `hasRecentGitActivity` already wrapped the `execFileAsync` call as an internal helper. Threading `ctx?` through the helper was 1 LOC × 2 callsites (helper signature + the one call in `detectStalledMissions`). Per #10433's three-instance discipline, this is the established pattern.
- **The audit inverse-check from v838 ran on this ship.** The new `KNOWN_UNWIRED entries do NOT call ensureProcessAllowed` test would have caught a stale entry if I'd forgotten to remove the file from the allowlist after wiring. Per-ship recon discipline + the deterministic gate together = double safety net.
- **Pre-tag-gate's flaky `update-outcome.test.ts`** appeared again at v838 (resolved on rerun) but NOT at v839's pre-tag-gate. Flake remains unreliable but doesn't block ship.

## What I noticed

- **The chip wire is now ~5-7 minutes of actual coding time.** v812 + v820 + v825 + v827 + v828 + v834 + v839 = 7 instances of the same wire pattern. The pattern has converged: import → add `ctx?` → hoist `ensureProcessAllowed` → remove from `KNOWN_UNWIRED` → run audit + functional tests. Each step is a single edit.
- **The release notes are ~5x longer than the code change.** v839 has 18 LOC code change + ~200 LOC release notes (README + 4 chapters). This is the ratio for chip ships in counter-cadence-flavor work. The release notes carry the context that the code change alone doesn't.
- **The wire decision (forensic vs load-bearing) is documented in JSDoc directly.** Previous wires sometimes documented this in the audit-test comment block; v839 puts the rationale in the function's JSDoc where future readers will see it. The audit-test comment is the LEDGER (why this entry was removed); the JSDoc is the SPECIFICATION (why the wire was hoisted outside the try/catch).
- **`ProcessContextDenied` import was imported then removed.** Initial code wrapped the `hasRecentGitActivity` call in try/catch that explicitly re-threw `ProcessContextDenied`. Simplified during review: the inner try/catch in `hasRecentGitActivity` already swallows execution errors but NOT thrown errors before `execFileAsync` (which is where `ensureProcessAllowed` lives in the hoisted-outside pattern). No outer wrapping needed.

## What surprised me

- **The 4-ship session closed all 4 handoff candidates in ~135min cumulative.** Pre-session estimate based on handoff was ~30 + 45-60 + 30 + 30-45 = ~135-180 min. Actual was at the lower end: 45 + 50 + 20 + 20 = 135 min. Tight execution + per-ship recon + the chapter.mjs/publish.mjs preservation infrastructure (v585 + v836) all contributed.
- **v836's preservation gate fired correctly for 3 consecutive ships' chapters** (v837, v838, v839). 9 PRESERVED log lines total. This is the end-to-end validation of v836's two-layer-closure work. The fix is sticky.
- **The audit inverse-check from v838 acts on EVERY pre-tag-gate from v838+ onward.** v839 was the first ship to run with the inverse-check active. If v839's wire had introduced a regression (e.g. ensureProcessAllowed call in a different file that I forgot to also remove from KNOWN_UNWIRED), the inverse-check would have caught it. Future operators benefit from this gate for every subsequent ship indefinitely.

## Risk that didn't materialize

- The wire might have broken the existing `detectStalledMissions` tests — checked: no signature changes affect the existing tests (the new optional `ctx?` parameter defaults to undefined → legacy permissive). All 4 existing tests PASS unchanged.
- The audit-test removal might have left a stale entry artifact — checked: the file is removed cleanly from the Set; the comment block explains the v839 wire.
- The hoisted `ensureProcessAllowed` might have caught a real production deny in test runs — checked: the existing tests don't pass a `ctx`, so the helper short-circuits via `if (!ctx) return`. No behavioral change in test paths.
- The forensic-surface semantics might have changed (i.e. now ANY error propagates) — checked: the inner try/catch around `execFileAsync` still swallows execution errors. Only `ProcessContextDenied` (the new error class thrown by `ensureProcessAllowed`) propagates. Verified by the JSDoc + the unchanged test behavior.

## Carried forward

NEW this ship: none. v839 is a clean wire ship; no new observations.

Inherited from v838 close (no change except instance-count increment for #10433):
- **#10433 LOC-band-by-callsite-count refinement** — now 4 instances (v825 + v827 + v828 + v839). The discipline is sustained.
- **Bidirectional enforcement completeness** (1 or 2 instances; classification ambiguous): UNCHANGED.

Inherited from v837 close:
- **Polarity convention for calibratable thresholds in different mechanic classes** (1 instance): UNCHANGED.

Inherited from v836 close:
- **Two-layer closure generalization (#10431 sub-pattern)** (2 instances): UNCHANGED.
- **Auto-run-on-import as a hidden bootstrap-time tax** (1 instance): UNCHANGED.

Inherited from v834-835 (no change):
- Stale-entry cleanup chip pattern (1 instance).
- Scaffold ship pattern (1 instance).
- Paired arc (1 arc).
- Audit-inverse-check enhancement (CLOSED v838).

Inherited from v833 (no change):
- Substrate-consumer hook PAIR pattern (2 instances).
- `onPredictions` substrate-consumer wire pattern (2 instances).
- Verification/integration-only ships (2 instances).

## Process retrospective

- **4-ship session closes here.** v836 → v837 → v838 → v839 in ~135min cumulative. All 4 handoff candidates resolved (the production-caller portion of v837 explicitly deferred per structural blocker).
- **Per-ship recon caught structural mismatches before they cost time.** v837: noticed no production caller of ActivationSelector → scoped down. v838: noticed LoaderContext has no KNOWN_UNWIRED → skipped that audit-test. v839: noticed `hasRecentGitActivity` is an internal helper → applied #10433.
- **v836's preservation gate is now operating as critical infrastructure.** 9 PRESERVED log lines across v837 + v838 + v839 confirm the fix works under repeated exercise. Worth noting in the next codify ship as a "load-bearing infrastructure that prevents friction" case study.
- **Next session pickup is strong-default NASA 1.179** (57 consecutive ships at 1.178 — record again). The operational-debt session shaved nothing off this pressure but added 4 ships of structural improvement on the way.

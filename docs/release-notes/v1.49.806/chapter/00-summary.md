# v1.49.806 — S6 Chokepoint Extension: EgressContext + ProcessContext

**Released:** 2026-05-27
**Type:** tooling ship (substrate addition; 2 new chokepoint surfaces + audit harnesses + 2 representative wires)
**Predecessor:** v1.49.805 — Codification Ship S3 + S4 + S7
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** extend Lesson #10414 LoaderContext chokepoint pattern to network egress (`EgressContext`) and child-process spawn (`ProcessContext`) — closes S6 from the 2026-05-26 audit retrospective.

## Summary

Tooling ship adding two new Tier-E security chokepoint surfaces with the same shape as v782's LoaderContext: optional `ctx?` parameter, allow-list pattern matching, audit sink, typed denial error. Each surface ships with a vitest audit harness (mirroring `loader-context-audit.test.ts`) that catches unwired callers at CI time; 1 representative consumer is wired per surface to prove the wire pattern. Existing call sites are grandfathered via `KNOWN_UNWIRED` allowlists that operators chip down ship-by-ship.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/security/egress-context.ts` | NEW | URL-targeted chokepoint. Mirrors LoaderContext shape: `UrlPattern`, `EgressOp`, `EgressAuditRecord`, `EgressAuditSink`, `EgressContext`, `defaultEgressContext()`, `ensureEgressAllowed()`, `EgressContextDenied`. |
| `src/security/process-context.ts` | NEW | Command-targeted chokepoint. `CommandPattern`, `ProcessOp`, `ProcessAuditRecord` (argv-aware), `ProcessAuditSink`, `ProcessContext`, `defaultProcessContext()`, `ensureProcessAllowed()`, `ProcessContextDenied`. |
| `src/security/egress-context.test.ts` | NEW | 20 unit tests — pattern matching, sink behavior, denial path, undefined-ctx permissive mode, custom sink interface. |
| `src/security/process-context.test.ts` | NEW | 21 unit tests — adds argv-aware assertions (recorded in audit + attached to denial error). |
| `src/security/egress-context-audit.test.ts` | NEW | Vitest enforcement harness: greps every `src/*.ts` for `fetch(` (no whitespace — comment matches excluded). Accepts: `ensureEgressAllowed(` call, `Role: NOT an egress caller` docstring, `KNOWN_UNWIRED` entry (16 existing callers), or `KNOWN_NOT_EGRESS` entry (5 dashboard files that emit browser-side JS strings). |
| `src/security/process-context-audit.test.ts` | NEW | Vitest enforcement harness: greps every `src/*.ts` for `child_process` imports (static, `require()`, or `await import()`). Accepts: `ensureProcessAllowed(` call, `Role: NOT a process caller` docstring, or `KNOWN_UNWIRED` entry (38 existing callers). |
| `src/security/index.ts` | MODIFIED | Exports both new contexts. Module docstring expanded to name all three sibling chokepoints. |
| `src/security/loader-context.ts` | MODIFIED | Docstring forward-reference fix: cites `src/security/loader-context-audit.test.ts` (which exists) instead of `tools/security/audit-loader-context.mjs` (which never did). Closes a ~24-ship escalated wedge from v782 per Lesson #10415. |
| `src/dependency-auditor/osv-client.ts` | WIRED | First EgressContext consumer. `OsvClient.queryBatch()` accepts `ctx?: EgressContext`; calls `ensureEgressAllowed()` BEFORE the try/catch so policy denials propagate (per #10427). |
| `src/dependency-auditor/dry-run-gate.ts` | WIRED | First ProcessContext consumer. `DryRunGate.check()` accepts `ctx?: ProcessContext`; splits the shell-string command into executable+argv before calling `ensureProcessAllowed()`. |
| `docs/security-chokepoints.md` | NEW | Cross-surface catalog: when-to-use table, migration policy, anti-patterns, surface-count baseline. |
| `tools/render-claude-md/disciplines.json` | MODIFIED | +1 entry (Security chokepoints). Cross-references existing lessons #10414 / #10426 / #10427. |
| `CLAUDE.md` | REGENERATED via `npm run render:claude-md` | Operative Disciplines section now 20 entries (was 19). |
| `docs/release-notes/v1.49.806/` | NEW | 5-file chapter set. |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `loader-context.ts` + `loader-context-audit.test.ts` + a wired consumer (`cartridge/loader.ts`) BEFORE writing the new contexts. Recon surfaced: (a) audit harness is a vitest test, not a CLI; (b) the optional-`ctx?` consumer pattern; (c) the `Role: NOT a <surface>` docstring escape hatch. |
| #10414 (optional-`ctx?` retrofit) | Both new surfaces follow the three-state pattern (undefined → permissive / default → audit-only / restricted → enforced) verbatim. |
| #10422 (verdict-pattern surface separation) | Audit harness (observability) lives separately from chokepoint type (decision). Each chokepoint has its own audit test file. |
| #10423 (lightest wire) | Resisted: a unified `SecurityChokepoint<Op>` generic abstraction; a separate CLI audit tool; wiring all 30+ existing callers in this ship. Chose: two parallel sibling modules + audit-test gating + 1 representative wire per surface. |
| #10424 (adoption-refresh AFTER bump) | Applied at T14 step 11. |
| #10426 (second-class-instance extraction) | The three chokepoints are SIBLINGS (concrete instances with the same shape), not parameterizations of a generic abstraction. Resisted premature unification — see "Verdict on scope" in retrospective. |
| #10427 (failure-mode contracts) | Security denials are LOAD-BEARING. `ensureEgressAllowed()` and `ensureProcessAllowed()` calls are hoisted OUTSIDE try/catch blocks that swallow errors. Caught a real bug during the osv-client wiring: initial draft placed the check INSIDE the network-failure try, which would have swallowed denials as graceful degradation. |
| #10415 (deferred-maintenance escalation) | Closed the v782 loader-context.ts docstring forward-reference (~24 ships escalated). Within the 1-2-milestone closure target only because the ship was already touching loader-context.ts. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a full migration of the existing call sites — 16 egress + 38 process callers are grandfathered in `KNOWN_UNWIRED` allowlists. Operators chip these down one at a time as opportunities arise.
- Not a unified generic chokepoint abstraction — the three surfaces are siblings, not parameterizations (per the verdict in retrospective).
- Not a closure of S2 or S5 from the audit retrospective — those are tooling-class levers and remain open.

## Verification

- `npm run build` → PASS.
- `npx vitest run` → 35,172 PASS / 45 skipped / 7 todo (was 31,038 at v805; +4,134 from new audit harnesses + unit tests).
- `npm run render:claude-md` → CLAUDE.md updated; 20 disciplines listed.
- Manual: dry-run of new audit harnesses against the existing src/ surface validates the grandfathering scope (egress: 1 wired + 16 unwired + 5 string-template + 1 self; process: 1 wired + 38 unwired + 1 self).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 23 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 5.

Manifest entries: **19 → 20** (+1: Security chokepoints).
Open lesson candidate backlog: 0 (UNCHANGED).

## Forward path

- **NASA 1.179 forward-cadence** — INTERSTELLAR-BOUNDARY axis obs#3.
- **`KNOWN_UNWIRED` migration cadence** — 16 egress + 38 process callers tracked. Each migration is ~5-10 min wedge (add `ctx?` param, hoist `ensure*Allowed()` out of error-swallowing try, remove allowlist entry).
- **S2 (adoption telemetry) + S5 (PROJECT.md normalizer)** — remaining tooling-class levers from the audit.

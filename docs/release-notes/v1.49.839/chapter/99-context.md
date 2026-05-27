# v1.49.839 — Context

## Provenance

Fourth and final ship of the 4-ship operational-debt session (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chip). Closes the v834-835 handoff's #3 candidate ("Continued ProcessContext singleton chips").

## What this ship adds

```
src/intelligence/analyzer/findings/stalled.ts     [MODIFIED: +ctx?: ProcessContext + hoisted ensureProcessAllowed]
src/security/process-context-audit.test.ts        [MODIFIED: -1 KNOWN_UNWIRED entry + comment block]
docs/release-notes/v1.49.839/                     [NEW: README + 4 chapters]
.planning/PROJECT.md                              [MODIFIED: pre-bump refresh]
```

## Recon trail (per #10422 ledger-driven work)

1. **Read `process-context-audit.test.ts` KNOWN_UNWIRED.** 22 entries at v838 close. Picked `intelligence/analyzer/findings/stalled.ts` as the chip target (mentioned in v834-835 handoff's "next obvious chip targets" list).
2. **Read `stalled.ts`.** Single `execFile` call site inside `hasRecentGitActivity`, already wrapped in best-effort-silent try/catch. The file's header doc references v812's `intelligence/analyzer/git.ts` as the precedent.
3. **Read v812's `intelligence/analyzer/git.ts` as template.** Same shape: single execFile, hoisted `ensureProcessAllowed` outside the try/catch.
4. **Trace callers.** `aggregator.ts:118` calls `detectStalledMissions(kb, projectId, snapshotId)`. New `ctx?` param defaults to undefined → legacy permissive. No caller updates needed.
5. **Decide wire shape:** add `ctx?` to both `hasRecentGitActivity` + `detectStalledMissions` (so the helper-internal call gets the context); hoist `ensureProcessAllowed` outside the inner try/catch.
6. **Implement + run tests.** Existing 4 stalled tests PASS (legacy permissive); audit-test enumeration 2050 PASS (one fewer file flagged).
7. **Verify build:** `npm run build` clean.

## Discipline-extension vs new-domain choice

**EXTENSION of existing `docs/security-chokepoints.md`** (Lesson #10433 codified at v824). v839 is the 4th instance of the internal-helper-pattern refinement (after v825 + v827 + v828). No new discipline domain. UNCODIFIED ceiling at 39 ≤ 41 UNCHANGED.

## What was deferred

- **Terminal family batch chip** (`cli/commands/terminal.ts`, `terminal/launcher.ts`, `terminal/session.ts`) — 3 entries, would be a "batch chip" similar to v825's `git/core` family or v828's `scribe/netlist-renderer` family. Defer to a separate session because the wire shape may not be uniformly the internal-helper pattern across all 3.
- **Mesh family batch chip** (`mesh-worktree.ts`, `proxy-committer.ts`) — 2 entries with injected-executor pattern. Different wire shape; needs a dedicated planning pass.
- **Remaining singletons (~17)** — `cli/commands/keystore.ts`, `cli/commands/pic2html.ts`, `dashboard/collectors/git-collector.ts`, `drift/cli.ts`, etc. Each would be a separate chip ship.

## Verification trail

| Step | Result |
|---|---|
| `npx vitest run src/security/process-context-audit.test.ts src/intelligence/analyzer/__tests__/stalled.test.ts` | 2054 PASS (4 stalled + 2050 audit) |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (pending T14 step 1) |
| Full suite (expected) | 35,259 (UNCHANGED — wire ship, no new tests) |
| KNOWN_UNWIRED Process count | 22 → 21 (-1) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Singleton wire chip; canonical forensic-surface wire shape.
- Fourth ship of 4-ship session; session closes here.
- v836 preservation gate continues to fire (4th time at v839's T14).

## Forward path post-v839 (post-session)

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (57 consecutive ships at 1.178). The 4-ship session is now closed; next session pickup defaults to NASA degree advance.
2. **Continued ProcessContext chips** — terminal/mesh batches remain available.
3. **Production caller of the predict path** — would activate v837's auto-emit wire.
4. **Next codify ship (v840+)** — 5+ eligible patterns waiting.

## References

- Predecessor: v1.49.838 (`docs/release-notes/v1.49.838/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.834-835-paired-arc-closed.md` (now fully resolved)
- Source-of-truth wire: `src/intelligence/analyzer/findings/stalled.ts` (`hasRecentGitActivity`)
- Audit-test allowlist removal: `src/security/process-context-audit.test.ts`
- v812 precedent: `src/intelligence/analyzer/git.ts` (mentioned in the v839-modified file's header doc)
- Security-chokepoints discipline: `docs/security-chokepoints.md` (Lesson #10433)
- Failure-mode contracts: `docs/failure-mode-contracts.md` (Lesson #10427)

# v1.49.838 — Context

## Provenance

Third ship of the 4-ship sequence (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chips). Closes the v834-flagged "audit-inverse-check enhancement" carry-forward.

## What this ship adds

```
src/security/process-context-audit.test.ts    [MODIFIED: +1 it block, +25 LOC inverse-check]
src/security/egress-context-audit.test.ts     [MODIFIED: +1 it block, +25 LOC inverse-check]
docs/release-notes/v1.49.838/                 [NEW: README + 4 chapters]
.planning/PROJECT.md                          [MODIFIED: pre-bump refresh]
```

NOT modified:
- `src/security/loader-context-audit.test.ts` — no `KNOWN_UNWIRED` set; inverse-check N/A.

## Recon trail (per #10422 ledger-driven work)

1. **Read v834's case study + forward-flag.** `docs/release-notes/v1.49.834/chapter/04-lessons.md` documented the manual catch (`intelligence/analyzer/git.ts` stale entry from v812). Forward-flagged "audit-inverse-check enhancement" as a future ship.
2. **Read existing audit-test structures.** `process-context-audit.test.ts` has 4 `it` blocks; `egress-context-audit.test.ts` has 5 (adds `KNOWN_NOT_EGRESS`); `loader-context-audit.test.ts` has 3 (no allowlist).
3. **Confirm regex names.** `ENSURE_PROCESS_ALLOWED_REGEX` and `ENSURE_EGRESS_ALLOWED_REGEX` are already declared at module scope; can be reused in the inverse-check directly.
4. **Identify the symmetric pattern.** Existing "KNOWN_UNWIRED entries actually exist + import X" tests already loop over `KNOWN_UNWIRED`. The inverse-check is the same loop with the opposite assertion.
5. **Decide on error-aggregation pattern.** Throw-on-first vs collect-and-throw-all. Chose collect-and-throw-all for better batch-cleanup UX. Matches the chapter.mjs/publish.mjs preserve-and-log discipline.
6. **Implement + run tests.** All 4118 audit-tests PASS (2050 process + 2051 egress + 17 loader; the new inverse-checks are 1 each, but the it.each enumeration dominates the count).
7. **Verify both inverse-checks fire correctly.** At v838 ship time, both `KNOWN_UNWIRED` sets are CLEAN (no stale entries) — both inverse-checks pass trivially. The gate is now permanent infrastructure for catching future stale entries.

## Discipline-extension vs new-domain choice

**EXTENSION of existing `docs/known-unwired-ledger-discipline.md`** (Lesson #10434 codified at v824). The discipline doc at v814 explicitly forward-flagged the inverse-check enhancement as a future addition. v838 lands it without changing the discipline doc's primary text (the forward-flag paragraph remains accurate — it predicted exactly this enhancement).

No new discipline domain. UNCODIFIED ceiling at 39 ≤ 41 UNCHANGED.

## What was deferred

- **Updating `docs/known-unwired-ledger-discipline.md` to retire the forward-flag paragraph.** Discipline-doc editing is the codify-ship surface; v838 leaves the doc text unchanged. The next codify ship can update the forward-flag from "future enhancement" to "landed at v838" + cross-reference.
- **LoaderContext allowlist-pattern extension.** LoaderContext currently uses path-scoped `findLoaderFiles()` instead of an allowlist. If a future ship expands LoaderContext's scope to broader src/ with a `KNOWN_UNWIRED` analog, the inverse-check pattern from v838 should be replicated.
- **Auto-running the inverse-check in pre-tag-gate explicitly.** The inverse-check fires as part of the regular vitest run, which is part of pre-tag-gate step 2. No additional gate-level integration needed.

## v836 validation continues in flight

The v838 hand-authored chapters at `docs/release-notes/v1.49.838/chapter/` exist BEFORE T14 step 9's refresh writes the auto-generated `.planning/roadmap/v1.49.838/` content. The v836 preservation gate should fire 3 times (for 00-summary, 03-retrospective, 99-context) as it did for v837.

The 04-lessons.md does NOT go through chapter.mjs auto-generation (chapter.mjs writes 00, 01, 03, 04, 99 only if the corresponding DB content exists). Since v838 is too small to have an `01-features.md`, chapter.mjs likely only writes 00, 03, and 99 — matching the v837 preservation count of 3.

## Verification trail

| Step | Result |
|---|---|
| `npx vitest run src/security/*-context-audit.test.ts` | 4118 PASS (2050 process + 2051 egress + 17 loader) |
| Both inverse-checks fire at v838 ship time | PASS (clean state; no stale entries) |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (pending T14 step 1) |
| Full suite (expected) | 35,259 PASS (35,257 + 2) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Audit-enforcement bidirectionality ship; gate infrastructure only.
- Third of 4-ship session; v836 preservation gate continues to fire transparently.
- Forward-flag from v834 close → CLOSED.

## Forward path post-v838

1. **Ship #4 of the session: ProcessContext singleton chips** — terminal/mesh/intel families.
2. **NASA 1.179 forward-cadence** — strong-default after this 4-ship sequence completes.
3. **Production caller of the predict path** — would activate v837's auto-emit wire.
4. **Next codify ship (v840+)** — picks up #10431 sub-pattern (now 2-3 instances) + bidirectional-enforcement-completeness as potential new pattern + v837's polarity-flip + v833 carry-forwards.

## References

- Predecessor: v1.49.837 (`docs/release-notes/v1.49.837/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.834-835-paired-arc-closed.md`
- Source-of-truth inverse-check (process): `src/security/process-context-audit.test.ts` (`KNOWN_UNWIRED entries do NOT call ensureProcessAllowed`)
- Source-of-truth inverse-check (egress): `src/security/egress-context-audit.test.ts` (`KNOWN_UNWIRED entries do NOT call ensureEgressAllowed`)
- v834 forward-flag: `docs/release-notes/v1.49.834/chapter/04-lessons.md` — "Audit-inverse-check enhancement as defensive measure"
- v812 originating drift (now historical): `chore(release): v1.49.812 — process-context wire`
- Known-unwired ledger discipline: `docs/known-unwired-ledger-discipline.md` (Lesson #10434; v814 forward-flag predicted v838)
- v836 preservation: `tools/release-history/publish.mjs::shouldPublishToDestination` — exercises in this ship's T14

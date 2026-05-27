# v1.49.836 — Context

## Provenance

Single-ship operational-debt cleanup. Operator authorization: post-v835 session selected 4 candidates (1/2/3/4) from the v834-835 handoff's next-session list, in the order publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chips. v836 is the first of the 4.

The v834-835 handoff specifically forward-flagged this work: *"Recovery is mechanical (`git checkout HEAD -- <chapters>`), but it's friction that adds ~2-3 min per ship and risks information loss if not caught. Worth investigating in a dedicated small ship."*

## What this ship adds

```
tools/release-history/opener-match.mjs                          [NEW: ~45 LOC, helpers extracted from chapter.mjs]
tools/release-history/publish.mjs                               [MODIFIED: +shouldPublishToDestination + flag + main() guard]
tools/release-history/chapter.mjs                               [MODIFIED: re-exports from opener-match.mjs; inline defs removed]
tests/release-history/publish-preserves-handauthored.test.ts    [NEW: +6 tests]
docs/release-notes/v1.49.836/                                   [NEW: README + 4 chapters]
.planning/PROJECT.md                                            [MODIFIED: pre-bump refresh v835 → v836]
```

No production-code changes (no `src/` modifications). No CLI surface changes. Tool-discipline ship.

## Recon trail (per #10422 ledger-driven work)

1. **Confirm the friction class:** `git log --oneline --all docs/release-notes/v1.49.83[45]/chapter/` shows multiple commits touching the same files — each ship had a "post-ship rh refresh" commit cycle that included re-publishing chapters. The handoff at v834-835 documented the workaround: `git checkout HEAD -- <chapters>`.
2. **Read `publish.mjs`:** confirmed it's a COPIER from `.planning/roadmap/<v>/<file>` to `docs/release-notes/<v>/chapter/<file>` + `www/...`. No destination-side checks. Source-checksum gate at `lastChecksum === checksum && existsSync(targetPath)` only catches the source-unchanged case.
3. **Read `chapter.mjs` and `writeChapterIdempotent`:** confirmed C04 (v1.49.585) has full source-side preservation via `openerMatches` + decision tree. Already exported. Symmetric counterpart for destination would be a clean fit.
4. **Compare source vs destination for v835 chapters:** `.planning/roadmap/v1.49.835/00-summary.md` = 673 bytes auto-generated; `docs/release-notes/v1.49.835/chapter/00-summary.md` = 2607 bytes hand-authored. Opener mismatch: source starts `> Following v1.49.834...`, destination starts `# v1.49.835 —`. Jaccard overlap well below 0.5 → would correctly classify as hand-authored.
5. **Identify the auto-run side effect:** `node -e "import('./tools/release-history/publish.mjs')..."` triggers `main()` in `publish.mjs` AND `chapter.mjs` (transitively imported). Both attempt PG connect; both fail with SASL in the naked test environment.
6. **Choose the fix shape:** extract `opener-match.mjs` (side-effect-free helper module) + guard `publish.mjs`'s `main()` with `isEntryPoint`. Avoids modifying `chapter.mjs`'s main() entry-point behavior; minimal surface change.
7. **Implement `shouldPublishToDestination`:** mirrors `writeChapterIdempotent`'s 5-step decision tree, but checks the destination opener against the source opener (rather than against a DB-derivable template opener).
8. **Wire into both per-target and toplevel publish loops:** the gate fires AFTER the `lastChecksum === checksum` no-op short-circuit (so steady-state is unchanged) and BEFORE the writeFileSync + DB insert.
9. **Add 6 unit tests covering the decision tree.** All pass first run.
10. **Sanity-check via `npx vitest run tests/release-history/`:** 6 PASS, 271ms, no pool-termination warning (confirms the extraction + guard worked).
11. **Confirm publish.mjs still runs as a CLI:** `node tools/release-history/run-with-pg.mjs publish --version v1.49.835` reports `4 published, 6 unchanged, 0 preserved, 0 BLOCKED, 0 skipped`. The `0 preserved` is because the publish_target DB rows already have v835's source_checksum from the actual ship; the early-exit `unchanged++` path fires before the preservation gate. Bug case (first publish for a new version with hand-authored destination) is covered by the unit tests in isolation.
12. **Verify build:** `npm run build` → clean.

## Discipline-extension vs new-domain choice

**EXTENSION of existing `docs/two-layer-closure-discipline.md`** (Lesson #10431, codified at v813). The v813 case study was operator-procedure-rooted drift (STATE.md). v836 is the same pattern applied to tool-procedure-rooted file-overwrite drift. Same shape, different sub-class. Worth an extension paragraph in the discipline doc on the next codify ship if the 3rd instance accumulates — but not this ship (no new manifest entry; the 2-instance threshold per #10426 is at the codify cadence's discretion, not enforced this ship).

No new discipline domain. UNCODIFIED ceiling at 39 ≤ 41 UNCHANGED.

## What was deferred

- **Discipline doc extension paragraph for #10431 file-overwrite sub-class** — deferred to next codify ship (likely v840+).
- **`isEntryPoint` guards on the other `tools/release-history/*.mjs` scripts** — `refresh.mjs`, `scan.mjs`, `ingest.mjs`, `regen-history-md.mjs`, etc. all have unguarded `main()` tails. Apply lightest-wire: only fix the ones we import from. Currently that's just `publish.mjs`.
- **Manual end-to-end verification of the new gate firing** — would require dropping the `publish_target` DB rows + re-running publish on a hand-authored destination. Declined for scope; unit tests cover the decision tree exhaustively.
- **NASA 1.179 forward-cadence ship** — explicitly passed over in operator selection. Still the strong-default next-session candidate (54 consecutive ships at 1.178 post-v836 close).

## Verification trail

| Step | Result |
|---|---|
| `npx vitest run tests/release-history/publish-preserves-handauthored.test.ts` | 6 PASS, 271ms |
| `npx vitest run src/cli/commands/publish.test.ts tests/release-history/` | 20 PASS (14 existing + 6 new) |
| `node -e "import('./tools/release-history/publish.mjs')..."` | `ok exports: [ 'shouldPublishToDestination' ]` — side-effect-free |
| `node tools/release-history/run-with-pg.mjs publish --version v1.49.835` | `4 published, 6 unchanged, 0 preserved` (steady-state path; preservation only fires on first publish with hand-authored destination) |
| `npm run build` | PASS |
| `bash tools/pre-tag-gate.sh` | 17/17 PASS (pending — run at T14 step 1) |
| Full suite (expected) | 35,243 PASS / 45 skipped / 7 todo / 0 fail |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Tool-discipline ship; no `src/` modifications.
- Single-friction-class closure; not a counter-cadence batch.
- First of 4-ship session (publish-investigation → fallbackProvider wire → audit-inverse-check → ProcessContext chips). Subsequent ships ride the now-fixed publish path and should publish chapters without the `git checkout HEAD --` workaround.

## Forward path post-v836

1. **Production fallbackProvider wire** — flips v835's scaffold to `wired: true`. ~45-60 min.
2. **Audit-inverse-check enhancement** — closes v834's chokepoint-audit unidirectional asymmetry. ~30 min.
3. **Continued ProcessContext singleton chips** — terminal family, mesh family, etc. ~30-45 min per chip.
4. **NASA 1.179 forward-cadence** — strong-default after the 4-ship operational-debt sequence.
5. **Next codify ship (v840+)** — picks up the v836 #10431 generalization + v833 carry-forwards.

## References

- Predecessor: v1.49.835 (`docs/release-notes/v1.49.835/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.834-835-paired-arc-closed.md`
- Source-of-truth helpers: `tools/release-history/opener-match.mjs`
- Source-of-truth gate: `tools/release-history/publish.mjs` (`shouldPublishToDestination`)
- C04 precedent: `chore(release): v1.49.585 (concerns cleanup) — chapter.mjs C04 idempotent-write`
- Two-layer closure discipline: `docs/two-layer-closure-discipline.md` (Lesson #10431, codified at v813)
- Test coverage: `tests/release-history/publish-preserves-handauthored.test.ts`

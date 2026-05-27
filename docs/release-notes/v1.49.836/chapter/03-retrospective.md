# v1.49.836 — Retrospective

**Wall-clock:** ~45 min from v835 close to v836 release-notes draft. Recurring-friction fix; small but structurally meaningful.

## What went as expected

- **C04's preservation logic transferred cleanly.** `writeChapterIdempotent` + `openerMatches` from `chapter.mjs` (C04 of v1.49.585) gave a working decision-tree template. The destination-side variant `shouldPublishToDestination` is structurally identical: 5 steps, same conservative-bias-toward-preserve, same Jaccard-token-overlap heuristic on the first 200 bytes. No new architectural decisions required.
- **The two-layer-closure pattern (#10431) fit cleanly.** v813 STATE.md drift used source-eliminator + detector; v836 publish overwrite uses source-side-preservation + destination-side-preservation. The same shape generalizes from "operator-procedure-rooted drift" (v813) to "tool-procedure-rooted file overwrite" (v836). 2nd instance of the pattern; eligible for the next codify ship's pickup.
- **6 unit tests covered the decision tree exhaustively.** One test per decision branch, plus one explicit `--force-overwrite` bypass test. All 6 passed first run. The forward-ready `tools/release-history/__tests__/chapter-idempotent.test.mjs` (C04's test file, currently outside vitest scope) was a usable template for the test shape.

## What I noticed

- **`chapter.mjs` auto-runs `main()` on module import.** When `publish.mjs` first imported `openerMatches` from `chapter.mjs`, the import triggered `chapter.mjs`'s tail-end `main().catch(...)`, which tried to connect to PostgreSQL and failed with `SASL: client password must be a string` in the test environment. The test still passed (the unit test's references to `shouldPublishToDestination` complete synchronously before the async PG connect resolves), but vitest emitted a worker-pool termination timeout warning. This is a hidden bootstrap-time tax on ANY module that imports from `chapter.mjs` — and `chapter-idempotent.test.mjs` already had this same issue but never triggered because that test file is outside vitest scope.
- **Extracting `opener-match.mjs` was the cleaner option vs guarding `chapter.mjs`'s `main()`.** Side-effect-free helper module is a smaller surface, doesn't change `chapter.mjs`'s entry-point behavior, and gives any future consumer (e.g. a hypothetical lint tool, a different publisher target) the same clean reuse path. Trade-off: one more file in `tools/release-history/`. Acceptable.
- **`publish.mjs`'s `main()` also auto-ran on import.** Same fix: `isEntryPoint` guard on the `main()` invocation. This is a Node.js convention (`if (import.meta.url === fileURLToPath(process.argv[1]))`) but neither `chapter.mjs` nor `publish.mjs` had it. Worth a future cleanup pass to add this guard to every script in `tools/release-history/` for consistency — but lightest-wire applies (only fix the ones we want to import from, which is currently just `publish.mjs`).
- **The existing dry-run on v834/v835 returned `0 preserved`.** Source content is already in the publish_target table from the v834/v835 actual ships; `lastChecksum === checksum && existsSync(targetPath)` early-exits before the preservation gate fires. The bug case is the FIRST publish run for a new version (no DB checksum yet). The unit tests cover that case in isolation. Manual end-to-end verification of the new gate firing would require dropping the publish_target rows + re-running publish, which we declined for scope.
- **The DB checksum NOT being updated on preserve is the right semantic.** When we preserve, the destination content is intentionally out of sync with the source. The `publish_target` table records "the source we synced to this target"; if we didn't sync (because we preserved hand-authored), we shouldn't update the row. Every future publish run will re-evaluate and re-trigger the preservation log line. The operator sees the persistent warning until they either (a) hand-edit the source to match, or (b) use `--force-overwrite`.

## What surprised me

- **The publish chapter-overwrite was 251 ships of accumulated friction.** v585 closed source-side preservation in C04. The destination-side counterpart sat as a workaround (`git checkout HEAD -- <chapters>`) for 251 ships (v586 → v836 inclusive). The handoff at v834-835 specifically called this out as a "Forward-flag for next ship" — the recon-then-close discipline picked it up in the next session as planned.
- **Two-layer closure is a 2nd-instance pattern now.** v813 closed STATE.md drift (operator-discretion step + detector). v836 closes publish overwrite drift (chapter.mjs source-side preservation + publish.mjs destination-side preservation). Different drift classes; same closure shape. Eligible for codification in the next codify ship.
- **`chapter.mjs`'s `openerMatches` was already exported and ready to reuse.** Even though it had to be extracted (to avoid the auto-run side effect), the function shape was already export-friendly. v585's C04 author left the helper open for exactly this kind of cross-consumer use. Small but meaningful upstream forward-design.

## Risk that didn't materialize

- The `openerMatches` heuristic might have been too lenient or too strict for the new use case — the Jaccard threshold of 0.5 was chosen at v585 against `chapter.mjs`'s opener template. The hand-authored chapters at v834/v835 have a markedly different opener shape (markdown H1 + bold "Released:" line) vs the auto-generated opener (markdown blockquote bridge + H1 + bold "Shipped:" line). The Jaccard overlap is well below 0.5 in practice. Tested implicitly via the unit tests using the actual v835 hand-authored vs auto-generated content as fixtures. No tuning needed.
- The `--force-overwrite` flag might have conflicted with an existing flag — checked: `chapter.mjs` uses `--force-regenerate`; `publish.mjs` had `--execute`, `--target`, `--version`, `--since`. No collision. Different name from `chapter.mjs` because the action is overwrite (not regenerate).
- The DB-insert path might have needed special handling on preserve — checked: the existing code only INSERTs after a successful `writeFileSync`. Adding `continue` BEFORE the insert (on preserve) is the right place. No DB-level changes needed.

## Carried forward

NEW this ship (2 observations, both at 2 instances → ESTABLISHED CANDIDATE):

- **Two-layer closure for procedure-rooted drift / file-overwrite drift (#10431 generalization)** — now at 2 instances (v813 STATE.md drift + v836 publish overwrite drift). Eligible for codification in the next codify ship; the source-eliminator/detector pair generalizes cleanly across drift sub-classes. The discipline doc at `docs/two-layer-closure-discipline.md` already exists; v836 may warrant an extension paragraph documenting the file-overwrite sub-class.
- **Auto-run-on-import is a hidden bootstrap-time tax on script modules** — observed at 1 instance this ship (across `chapter.mjs` + `publish.mjs`). Both modules had `main().catch(...)` at the tail with no `isEntryPoint` guard. v836 fixed `publish.mjs` directly + worked around `chapter.mjs` via the `opener-match.mjs` extraction. The 1st instance; wait for 2nd before codifying as a class.

Inherited from v834-835 close (no change):
- Stale-entry cleanup chip pattern (1 instance: v834).
- Per-ship release-notes count claims inherit predecessor without source-of-truth re-derivation (1 instance).
- Audit-inverse-check enhancement as defensive measure (1 forward-flag).
- Scaffold ship pattern (1 instance: v835).
- Paired "framework-predicted, recon-caught" ship arc (1 arc: v834+v835).
- Type-registered vs observation-source-wired vs runtime-wired (1 forward-flag).

Inherited from v833 close (no change):
- Substrate-consumer hook PAIR pattern (2 instances).
- `onPredictions` substrate-consumer wire pattern (2 instances).
- #10433 LOC-band-by-callsite-count refinement (3 instances).
- Verification/integration-only ships (2 instances).

## Process retrospective

- The handoff's "Strong default: NASA 1.179 forward-cadence" was passed over by operator selection (1/2/3/4 sequence). v836 is the v834-835 handoff's #4 candidate — the highest operational-debt-payment value of the 4, with the trade that it's not a NASA degree advance.
- Per-ship recon picked up `chapter.mjs`'s auto-run main() inside ~10 minutes of starting the work. The same recon discipline that caught v834's stale-entry off-by-one + v835's type-registration gap.
- Discipline-doc forward-paragraphs continue to be load-bearing: the v834-835 handoff explicitly said "Worth investigating in a dedicated small ship" + named the exact recovery workaround. v836 acted on both signals.

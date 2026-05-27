> Following v1.49.835 — _`lowConfidenceThreshold` Calibration Scaffold (Full)_, v1.49.836 is the **publish.mjs destination-side hand-author preservation** ship — a two-layer closure for the publish.mjs chapter-overwrite friction that has recurred on every ship since at least v834 (and was forward-flagged in the v834-835 handoff as "publish.mjs chapter-overwrite investigation"). Mirrors `chapter.mjs`'s C04 source-side preservation (from v1.49.585) at the destination side, so a hand-authored `docs/release-notes/<v>/chapter/<file>.md` is no longer silently clobbered by the publish copy.

# v1.49.836 — `publish.mjs` Destination-Side Hand-Author Preservation

**Shipped:** 2026-05-27

`publish.mjs` is a COPIER — it reads `.planning/roadmap/<v>/<file>.md` (the auto-generated chapter, written by `chapter.mjs`) and copies the bytes to `docs/release-notes/<v>/chapter/<file>.md` (the GitHub mirror) plus `www/tibsfox/com/Research/release-story/<v>/<file>.md` (the tibsfox.com staging). The source side has had hand-author preservation since v1.49.585 (C04) via `writeChapterIdempotent` + `openerMatches` in `chapter.mjs`. The destination side did not — `publish.mjs` blindly overwrote whatever was there.

v836 mirrors the C04 pattern at the destination: before writing, check if the destination already has content whose first 200 bytes do NOT match the source's first 200 bytes (Jaccard-token-overlap heuristic, identical to chapter.mjs). If so, PRESERVE the destination + log a warning + skip the DB checksum insert. Adds `--force-overwrite` flag as the explicit bypass when the operator does want the source content to win.

## Why this ship

The v834-835 handoff documented the friction explicitly:

> **publish.mjs chapter-overwrite caught both ships.** After `node tools/release-history/run-with-pg.mjs publish --execute --version v...`, the publish step re-generated `00-summary.md`, `03-retrospective.md`, `99-context.md` with auto-generated short content, overwriting hand-authored chapters. Recovered both times via `git checkout HEAD -- docs/release-notes/v.../chapter/<files>` (the original commit preserved the hand-authored content). This is a recurring publish.mjs behavior — chapter files get re-generated even when hand-authored content is present.

The pattern matches the **Two-layer closure for procedure-rooted drift** discipline (#10431, codified at v813 STATE.md closure):

- **Layer 1 (source-eliminator, already existed):** `chapter.mjs`'s `writeChapterIdempotent` preserves hand-authored content in `.planning/roadmap/<v>/<file>` (C04 from v1.49.585; closes a separate drift class where chapter.mjs would clobber `.planning/roadmap/` hand-authored content).
- **Layer 2 (detector/preservation, this ship):** `publish.mjs`'s new `shouldPublishToDestination` preserves hand-authored content at `docs/release-notes/<v>/chapter/<file>` AND `www/.../release-story/<v>/<file>`. Closes the v834/v835 friction class deterministically.

The v834-835 handoff predicted: *"Recovery is mechanical (`git checkout HEAD -- <chapters>`), but it's friction that adds ~2-3 min per ship and risks information loss if not caught. Worth investigating in a dedicated small ship."* v836 is that dedicated ship.

## What shipped

- **NEW** `tools/release-history/opener-match.mjs` (~45 LOC):
  - Extracts `normalizeOpener` + `openerMatches` from `chapter.mjs` into a side-effect-free module so `publish.mjs` (and any future consumer) can import the helpers without triggering `chapter.mjs`'s auto-running `main()` PG connect.
  - Re-exported from `chapter.mjs` for backward compatibility with existing consumers.
- **MODIFIED** `tools/release-history/publish.mjs` (~50 LOC net):
  - Adds `shouldPublishToDestination(sourceContent, destPath, forceOverwrite)` helper (exported) mirroring `writeChapterIdempotent`'s decision tree, but at the destination side and against the source's opener.
  - Wires the gate into the per-target publish loop AND the toplevel-allowlist publish loop, right after the existing `lastChecksum === checksum && existsSync(targetPath)` no-op short-circuit.
  - Adds `files_preserved` + `preserved` to the stats report (surfaced in both the human-readable log line and the JSON output).
  - Adds `--force-overwrite` CLI flag (parallels `chapter.mjs --force-regenerate`).
  - Guards `main()` auto-run with an `isEntryPoint` check so test files can `import { shouldPublishToDestination }` without triggering the script body (which would attempt a PG connect with no credentials).
- **MODIFIED** `tools/release-history/chapter.mjs` (~10 LOC net):
  - Re-exports `normalizeOpener` + `openerMatches` from the new `opener-match.mjs` module.
  - Removes the inline definitions (now in `opener-match.mjs`).
- **NEW** `tests/release-history/publish-preserves-handauthored.test.ts` (+6 tests):
  - `writes when destination does not exist`
  - `writes when destination is a stub (<200 bytes)`
  - `writes when destination opener matches source (prior copy / DB-derivable)`
  - `PRESERVES when destination has hand-authored content (opener mismatch)` — the load-bearing assertion
  - `--force-overwrite bypasses preservation`
  - `writes when source content drifted but destination is a prior copy`
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v835 → v836.

## Decision tree (mirrors C04)

```text
shouldPublishToDestination(sourceContent, destPath, forceOverwrite):
  1. forceOverwrite=true                         → WRITE
  2. destination does not exist                  → WRITE
  3. destination <200 bytes (stub)               → WRITE
  4. destination opener matches source opener    → WRITE (prior copy / DB-derivable)
  5. destination opener does not match source    → PRESERVE
```

Conservative bias matches C04: when in doubt, PRESERVE. A false-preserve costs nothing (next refresh+publish re-evaluates; operator can re-run with `--force-overwrite` if needed). A false-overwrite destroys hand-authored content + costs ~2-3 min recovery per ship.

## Behavior change at the ship-pipeline boundary

The integration is via `tools/release-history/run-with-pg.mjs publish --execute --version v<X>` (T14 step's auto-publish path inside refresh; also invokable directly). After this ship:

- A normal ship where the operator did NOT hand-author chapters: source/destination openers align → identical behavior to v835. Files are published as before.
- A ship where the operator HAS hand-authored chapters in `docs/release-notes/<v>/chapter/`: destination opener no longer matches source opener → publish reports `PRESERVED <v>/<file> → <target>: destination opener non-derivable; preserved as hand-authored` for each affected file. The hand-authored content stays. The DB checksum is NOT updated for that target (correct — destination is intentionally out of sync with source).
- Operator who wants the auto-generated source to win: re-run with `--force-overwrite`. Documented in the in-file usage block + the `--force-overwrite` flag is the explicit bypass.

The pre-existing `lastChecksum === checksum && existsSync(targetPath)` no-op short-circuit is unchanged. The new gate only fires when publish would otherwise write — minimal disruption to the steady-state.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/release-history/publish-preserves-handauthored.test.ts` | 0 → 6 (+6) | New file covering the 5-step decision tree + the `--force-overwrite` bypass |
| Full suite | 35,237 → 35,243 (+6) | All new tests; no existing tests modified |
| **LOC delta** | ~115 src + ~95 tests | New helper module + helper export + integration + flag + tests |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **54 consecutive ships at 1.178**, new widest pressure margin record). Counter-cadence count UNCHANGED at 6 (v836 is a recurring-friction fix, not a counter-cadence cleanup batch).

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
UNCODIFIED: **39** (UNCHANGED; ≤ ceiling 41).
Wired calibratable thresholds: **6 of 7** (UNCHANGED).

Codify-axis cadence: 3 ships past last codify (v833) — within the 7-10 ship floor.
Consume-axis cadence: 2 ships past last consume (v834) — within floor.
Calibrate-axis cadence: 6 ships past last calibrate (v830) — within ~10-ship floor.

## What this ship is not

- Not a NASA degree advance (NASA 1.178 unchanged, now 54 consecutive).
- Not a chip ship (KNOWN_UNWIRED counts unchanged).
- Not a codify ship (no new manifest entries; the two-layer-closure observation is a 2nd instance of #10431, so it sits at the codify threshold and is a candidate for the next codify ship's pickup list).
- Not a counter-cadence cleanup batch (single-friction fix; v585 / v601 / v664 / v666 / v821 / v822 are the counter-cadence batches at scale).
- Not a calibration framework change.

## Verification

- `npx vitest run tests/release-history/publish-preserves-handauthored.test.ts src/cli/commands/publish.test.ts` → 20 PASS.
- `npm run build` → clean.
- `node -e "import('./tools/release-history/publish.mjs')..."` → side-effect-free import succeeds (no PG connect attempt).
- `bash tools/pre-tag-gate.sh` → 17/17 PASS.
- Full suite: 35,243 PASS / 45 skipped / 7 todo / 0 fail.

## Forward path post-v836

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (now 54 consecutive ships at 1.178).
2. **Production fallbackProvider wire** — flips v835's scaffold to `wired: true`.
3. **Audit-inverse-check enhancement** — v834-flagged ~30 min ship.
4. **Continued ProcessContext singleton chips** — terminal/mesh family batches.
5. **Next codify ship** (likely v840+) — picks up the v833 carry-forward observations + the v834 stale-entry-cleanup-chip pattern + this v836 two-layer-closure 2nd instance (now eligible per #10426 at 2 instances: v813 STATE.md drift + v836 publish chapter-overwrite drift).

## Most valuable single takeaway

**The two-layer-closure pattern (#10431) generalized cleanly from procedure-rooted drift to procedure-rooted file-overwrite drift.** v813 closed STATE.md `v805→v806` drift via source-eliminator (atomic-writer) + detector (pre-tag-gate step 0.5). v836 closes the publish-chapter overwrite drift via the same shape: source-side preservation was already in `chapter.mjs` (C04 from v1.49.585), so v836 adds the destination-side preservation that was the symmetric counterpart.

The lesson is that **C04's source-side preservation was structurally incomplete**: it protected one of the two places hand-authored content might live (`/.planning/roadmap/`), but not the other (`docs/release-notes/<v>/chapter/` + `www/.../release-story/<v>/`). A discipline review against `#10431` at v585 close would have predicted the missing destination-side layer. The operator workaround (`git checkout HEAD -- <chapters>`) absorbed the missing layer for 251 ships before getting paid down.

**Second-most valuable:** the import side-effect (chapter.mjs auto-runs `main()` on import → PG connect → SASL failure under naked Node) was a hidden bootstrap-time tax that v836 also paid off via the `opener-match.mjs` extraction + the `isEntryPoint` guard on `publish.mjs`'s own `main()`. Tests can now import these tools' helpers without triggering DB connects. This is a small but recurring quality-of-life win for any future test-side reuse.

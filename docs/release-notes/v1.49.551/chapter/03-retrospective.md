# Retrospective — v1.49.551

## What Worked

- **The patch scope was minimal and landable within hours.** Four entries to `package.json`, four version bumps, one verification command. No secondary changes, no scope creep. That's what a ship-blocker patch should look like.
- **The `installCartridgeDir` warning was clear enough to diagnose in one pass.** "Cartridge source directory missing" with the exact paths led directly to the missing `files` entries. No debugging session, no log-diving — read the warning, fix the manifest.
- **Version bumps across all four artifacts stayed in sync.** `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — every version marker on disk matches 1.49.551. A fragmented version would have caused downstream confusion.
- **The retrospective-patch pattern established in v1.49.1/.2/.3 applied cleanly.** v1.49.550 was a milestone; v1.49.551 is the surgical first-patch fix. The shape is the same as the v1.49.0 → v1.49.1 relationship from February, showing the pattern is reusable.

## What Could Be Better

- **The v1.49.550 publish process didn't have a tarball-verify step.** Every npm publish should run `npm pack --dry-run`, inspect the resulting file list, and fail loudly on missing directories. Adding that to the publish pipeline would prevent this exact class of failure.
- **The `files` array is a single point of truth with no drift detection.** Cartridges are directories that exist under `examples/` but must be enumerated manually in `package.json`. A sync-check script comparing `examples/cartridges/*` against the `files` entries would have caught this.
- **"Ship-blocker within 24 hours" is an indicator something is wrong upstream.** Fast-turn patches are cheap to land but indicate gaps in the parent release's QA. v1.49.551 being needed at all is a signal to harden v1.49.550's publish checklist.
- **npm tarball size isn't being monitored.** The missing cartridges produced a smaller-than-expected tarball; a size-regression check against the previous version would have surfaced this as a warning before tagging.

## Lessons Learned

1. **The `files` array in `package.json` is what trust is built on for npm consumers.** Every directory a user needs at install time must appear in `files` or it won't ship. Default behavior includes too much; explicit `files` includes exactly what's listed and nothing more.
2. **Publishing without a tarball smoke-test is shipping untested code.** The dev-machine install works because the dev machine has everything. The npm install works only if the tarball is complete. Add `npm pack --dry-run` to every publish pipeline.
3. **Ship-blocker patches within 24 hours are a process smell, not a bragging point.** Fast remediation is good; needing fast remediation is a gap. Treat every ship-blocker as a post-mortem trigger for the parent release.
4. **Version markers on disk should all move together.** `package.json`, `package-lock.json`, `Cargo.toml`, `tauri.conf.json` — every version reference must match. A bump script (or pre-tag hook) that verifies all of them stay in sync is table stakes.
5. **Missing-resource warnings deserve CI failures, not log lines.** `installCartridgeDir` warned about missing directories and let installation proceed. In a CI environment, "missing source directory" should fail the build, not log a warning.
6. **Packaging boundaries exist in every deployment pipeline.** Tauri capabilities, npm `files`, Docker `COPY`, Python `MANIFEST.in` — each technology has a step where "what ships" is declared separately from "what runs." The shape of the failure is always the same.
7. **Patch scope discipline is what keeps patches landable.** v1.49.551 was tempting to expand into "while we're in `package.json`, let's also fix X." Resisting that made the patch land in hours instead of days.
8. **Tarball size monitoring catches a whole class of packaging bugs.** A v1.49.551 tarball that's identical in size to v1.49.550 minus the missing directories would have triggered a "why did it shrink?" check before the tag landed. Size regressions are signals.

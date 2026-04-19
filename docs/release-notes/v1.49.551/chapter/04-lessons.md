# Lessons — v1.49.551

12 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The `files` array in `package.json` is what trust is built on for npm consumers.**
   Every directory a user needs at install time must appear in `files` or it won't ship. Default behavior includes too much; explicit `files` includes exactly what's listed and nothing more.
   _⚙ Status: `investigate` · lesson #2179_

2. **Publishing without a tarball smoke-test is shipping untested code.**
   The dev-machine install works because the dev machine has everything. The npm install works only if the tarball is complete. Add `npm pack --dry-run` to every publish pipeline.
   _⚙ Status: `investigate` · lesson #2180_

3. **Ship-blocker patches within 24 hours are a process smell, not a bragging point.**
   Fast remediation is good; needing fast remediation is a gap. Treat every ship-blocker as a post-mortem trigger for the parent release.
   _⚙ Status: `investigate` · lesson #2181_

4. **Version markers on disk should all move together.**
   `package.json`, `package-lock.json`, `Cargo.toml`, `tauri.conf.json` — every version reference must match. A bump script (or pre-tag hook) that verifies all of them stay in sync is table stakes.
   _⚙ Status: `investigate` · lesson #2182_

5. **Missing-resource warnings deserve CI failures, not log lines.**
   `installCartridgeDir` warned about missing directories and let installation proceed. In a CI environment, "missing source directory" should fail the build, not log a warning.
   _⚙ Status: `investigate` · lesson #2183_

6. **Packaging boundaries exist in every deployment pipeline.**
   Tauri capabilities, npm `files`, Docker `COPY`, Python `MANIFEST.in` — each technology has a step where "what ships" is declared separately from "what runs." The shape of the failure is always the same.
   _⚙ Status: `investigate` · lesson #2184_

7. **Patch scope discipline is what keeps patches landable.**
   v1.49.551 was tempting to expand into "while we're in `package.json`, let's also fix X." Resisting that made the patch land in hours instead of days.
   _⚙ Status: `investigate` · lesson #2185_

8. **Tarball size monitoring catches a whole class of packaging bugs.**
   A v1.49.551 tarball that's identical in size to v1.49.550 minus the missing directories would have triggered a "why did it shrink?" check before the tag landed. Size regressions are signals.
   _⚙ Status: `investigate` · lesson #2186_

9. **The v1.49.550 publish process didn't have a tarball-verify step.**
   Every npm publish should run `npm pack --dry-run`, inspect the resulting file list, and fail loudly on missing directories. Adding that to the publish pipeline would prevent this exact class of failure.
   _⚙ Status: `investigate` · lesson #2187_

10. **The `files` array is a single point of truth with no drift detection.**
   Cartridges are directories that exist under `examples/` but must be enumerated manually in `package.json`. A sync-check script comparing `examples/cartridges/*` against the `files` entries would have caught this.
   _⚙ Status: `investigate` · lesson #2188_

11. **Ship-blocker within 24 hours" is an indicator something is wrong upstream.**
   Fast-turn patches are cheap to land but indicate gaps in the parent release's QA. v1.49.551 being needed at all is a signal to harden v1.49.550's publish checklist.
   _⚙ Status: `investigate` · lesson #2189_

12. **npm tarball size isn't being monitored.**
   The missing cartridges produced a smaller-than-expected tarball; a size-regression check against the previous version would have surfaced this as a warning before tagging.
   _⚙ Status: `investigate` · lesson #2190_

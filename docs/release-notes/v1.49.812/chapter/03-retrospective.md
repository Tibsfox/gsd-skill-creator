# v1.49.812 — Retrospective

**Wall-clock:** ~25-30 min from session-start to tag-push. Third ship of the v810-814 chain.

## What worked

**Cross-surface pattern transfer worked first try.** The v809 EgressContext chip established the shape: optional `ctx?`, ensure-outside-try, instanceof-rethrow-in-catch. The v812 ProcessContext chip applied that shape verbatim with one symbol substitution (`Egress` → `Process`). No new design decisions; the pattern is now "substrate for chips."

**Recon picked the right candidate first try.** The 38 ProcessContext KNOWN_UNWIRED entries span widely-varying surface complexity: git/core/* (4 deeply-interconnected files), aminet/* (5 family files), terminal/launcher (user-facing), keystore.ts (security-sensitive). Recon-first identified `intelligence/analyzer/git.ts` as the cleanest candidate for the first chip — single execFile site, self-contained "best-effort observability" with existing swallow-everything catch (perfect #10427 setting), 114 LOC, only one src/ caller and it passes no ctx. Smallest viable demonstration of the pattern.

**The `'exec-file'` symbol typo was caught immediately by the build.** Initial wire used `'execFile'` (camelCase, mirroring the node `execFile` import). The ProcessOp type is `'exec-file'` (kebab-case to match the file-system naming convention used in chokepoint records). Build failed in <2s with a clear TS2345 error pointing at the exact argument. One-character fix. The typescript-strict shape of the ProcessOp union is exactly the right level of strictness for an audit-record vocabulary — operators can write arbitrary source labels but the op vocabulary is closed.

**The `hasGitRepo` early-return guided the test design.** Initial sketch was to test denial via a non-existent git repo path, but that returns null before `ensureProcessAllowed` is reached. Pivoted to "create a real temp git repo" using the same pattern as the existing happy-path test. The new tests reuse the same setup boilerplate (init repo + config user + add file + commit), and the denial path is exercised in the same shape as the success path. No new test scaffolding; mirror the existing.

**Catch-block refactor preserves the existing behavior contract.** Pre-v812 catch was `catch { return null }` (parameter-less). Post-v812 catch is `catch (err) { if (err instanceof ProcessContextDenied) throw err; return null }`. The behavior for every existing caller (no ctx passed) is byte-identical: `ensureProcessAllowed` returns silently when ctx is undefined, the try runs as before, the catch swallows as before. The new behavior only activates when a caller supplies a restrictive ctx — exactly the opt-in contract the chokepoint promises.

## What surprised

**The `gitMetadata` function had only 1 non-test src/ caller.** I expected the analyzer/git helper to be widely used. Grep showed only `src/intelligence/analyzer/core.ts:120` calling it (with `.catch(() => null)` on top, so it's already null-safe from the caller's perspective). This is a clean opt-in surface: future operators can wire `core.ts` (or wherever the analyzer is instantiated from) to pass a ProcessContext when they want enforcement, without touching `git.ts` again.

**The audit-test passed before I updated KNOWN_UNWIRED.** When I ran the audit-test after the wire (before removing `git.ts` from KNOWN_UNWIRED), I expected a "this file is in KNOWN_UNWIRED but is now actually wired" failure. The audit test only checks "files NOT in KNOWN_UNWIRED but containing child_process imports must call ensureProcessAllowed" — it doesn't conversely check that KNOWN_UNWIRED entries don't have ensureProcessAllowed. So grandfathered files can carry a real wire without a test failure, just an extra KNOWN_UNWIRED entry that's no longer needed. The audit-test enforcement is one-directional. Worth flagging as a forward observation.

**There's a related test in the audit-test:** `'KNOWN_UNWIRED entries actually exist and import child_process'` — this would catch if I removed a file but left it in KNOWN_UNWIRED (so the audit can never get out-of-sync in the other direction). But the inverse ("entry removed when wire added") relies on the operator. Not a regression risk — just an asymmetry.

## What to watch

- **The audit-test's KNOWN_UNWIRED unidirectional shape.** A future operator could wire a file (adding ensureProcessAllowed) without removing it from KNOWN_UNWIRED, and no test would catch the dead-entry drift. Worth a future audit-side enhancement: "for every KNOWN_UNWIRED entry, assert that the file does NOT also call ensureProcessAllowed (catches the dead-entry case)." Not urgent — the manual process works at the current chip cadence.

- **The `instanceof ProcessContextDenied` check pattern is now used in 2 places** (audit-orchestrator.ts:116 + git.ts catch). Per #10426, cross-class registry extraction triggers at 2nd-3rd instance. If a 3rd instance lands (likely the first time a future ProcessContext chip touches another swallow-catch site), worth considering a shared utility (`reThrowSecurityDenials(err)` or similar). For now, the 2-line pattern is below the abstraction threshold per #10416.

- **PROJECT.md drift now at 2 patches.** v810 set the line to v809; v811+v812 ships put it at drift=2. Threshold=3 set at v807. The next ship without a PROJECT.md refresh would push to drift=3 (at threshold), v814 would BLOCK. Bundle a refresh into v813 or v814's pre-bump.

- **Aminet family is the natural next batch.** 5 sibling files (emulated-scanner, emulator-launch, lha-extractor, lzx-extractor, tool-validator) likely share enough shape that the v811-style batch chip applies. ~25-30 min for a 5-file batch following v812's first-chip pattern.

## Verdict on scope

ProcessContext first-chip closure landed at the smallest viable shape: 1 file wire + 1 catch refactor + 2 new tests + 1 KNOWN_UNWIRED entry removal + 5 release-notes files. Resisted: chipping the core.ts caller (would have required own recon); batching git/core/* or aminet/* (separate families); building a shared `reThrowSecurityDenials` helper (premature at 2 instances).

After v812, the v810-814 chain stands at 3 of 5. Next: v813 = post-T14-reset STATE.md drift closure (counter-cadence). The pattern-transfer success (v809 EgressContext → v812 ProcessContext) validates the v806 chokepoint extension's "three sibling chokepoints share a common shape" design promise. Each future ProcessContext chip can now follow the v812 template the same way each future EgressContext chip follows the v809 template.

Wall-clock comparison:
- v810 (T1.3 substrate-consumer wire): ~35 min
- v811 (4-adapter batch chip): ~25 min
- v812 (first ProcessContext chip): ~25-30 min

Single-file pattern-transfer chips run at roughly the same wall-clock as multi-file batch chips of established pattern. The cost was almost entirely recon (~15 min) — choosing the right candidate and reading its surface. Once the candidate was chosen, the wire + tests + audit-test edit took ~10-15 min.

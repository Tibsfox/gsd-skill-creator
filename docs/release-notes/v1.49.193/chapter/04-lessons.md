# Lessons — v1.49.193

17 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Ecosystem alignment is maintenance, not a feature**
   but it prevents drift that becomes expensive later.
   _⚙ Status: `applied` (applied in `v1.49.195`) · lesson #1264_

2. **The 250-char cap is tight but fair**
   forces skill descriptions to be precise, which is what tool-calling LLMs need for accurate activation.
   _⚙ Status: `investigate` · lesson #1265_

3. **Base branch flexibility should have been there from the start**
   hardcoding `main` was a shortcut that accumulated debt.
   _⚙ Status: `investigate` · lesson #1266_

4. **Release notes benefit from revision**
   the degree 55 rewrite is materially better than the original, especially on biographical accuracy and acoustic analysis.
</details>
---
*v1.49.193 — ecosystem alignment. 34 skills, 57 commands, 21,298 tests, 190+ research projects. The tooling stays sharp so the work stays clean.
   _⚙ Status: `investigate` · lesson #1267_

5. **Ecosystem alignment is maintenance, not a feature.**
   Users do not feel it when tooling is current; they feel it when tooling has drifted. The work is invisible, high-leverage, and has to be done on someone's schedule that is not tied to feature delivery. Build a recurring cadence for it rather than reacting after breakage.
   _⚙ Status: `applied` (applied in `v1.49.195`) · lesson #4420_

6. **The 250-char cap is tight but fair.**
   It forces skill descriptions into the precision that tool-calling LLMs actually need for accurate activation. The old 291-character `runtime-hal` description had filler; the new 215-character version says more per byte. Spec constraints can be genuine quality forcing functions rather than arbitrary limits.
   _⚙ Status: `investigate` · lesson #4421_

7. **Base-branch flexibility should have been there from the start.**
   Hardcoding `main` was a shortcut taken when the project had exactly one branch topology. Every hardcoded assumption about environment is a debt that compounds silently until someone's environment differs. Prefer configuration-first with a conservative fallback.
   _⚙ Status: `investigate` · lesson #4422_

8. **Release notes benefit from revision.**
   The degree-55 rewrite is materially more accurate than the original, especially on biographical dates and acoustic analysis. A release-note file is not a write-once artifact; it is a living document whose accuracy improves with research passes, and the project's A-grade rubric exists precisely to make those improvements systematic.
   _⚙ Status: `investigate` · lesson #4423_

9. **The SKILL.md format is now industry infrastructure.**
   agentskills.io adoption across 33 tools means every skill written in this repo is portable. This is a strategic position — the project does not maintain a proprietary format, it authors reference assets against an open standard. Every future design decision should preserve that portability.
   _⚙ Status: `investigate` · lesson #4424_

10. **Scope a release to what drifts together.**
   The three source changes in this release all respond to external ecosystem motion; they shipped together because they became necessary during the same week. A release that combines ecosystem drift with feature work obscures which delay came from which surface; isolating maintenance releases keeps the cadence analysis clean.
   _⚙ Status: `investigate` · lesson #4425_

11. **Three-tier fallbacks beat binary choice.**
   The base-branch detector reads user config first, git convention second, hard-coded literal third. Degrading through named tiers is more debuggable than a single try/except with an opaque default, because a failure leaves you exactly one tier away from the answer rather than guessing which tier fired.
   _⚙ Status: `investigate` · lesson #4426_

12. **Flag the unfinished work in the release notes, not in a separate tracker.**
   The `gupp-propulsion` overflow is mentioned in the Summary and the Retrospective rather than deferred to an issue tracker. Release notes that acknowledge their own gaps age better than release notes that leave gaps implicit, because readers returning to the file six months later can see both what shipped and what deliberately did not.
   _⚙ Status: `investigate` · lesson #4427_

13. **Maintenance releases can be A-grade.**
   The original v1.49.193 README was 101 lines and scored F(36) against the rubric; this uplift rewrites it to A-grade without inventing any new content — it reorganises and contextualises the same three source changes into the structure the rubric requires. A-grade is a function of documentation discipline, not release magnitude.
   _⚙ Status: `investigate` · lesson #4428_

14. **`gupp-propulsion` still at 291 characters.**
   The release closes the cap gap on `runtime-hal` but leaves one of the two known offenders uncorrected. A single extra trim would have closed the issue class entirely for the current skill library, and splitting it across two releases creates the risk that the second fix never lands.
   _⚙ Status: `investigate` · lesson #4429_

15. **Claude Code v2.1.88 hooks and subagent fields not addressed.**
   The release acknowledges the new PostCompact, FileChanged, and PermissionDenied hooks plus the subagent-field expansion (effort, maxTurns, isolation, worktree, memory, skills, mcpServers) but defers integration. Every release that defers is a release where drift grows on a different surface while the first is being fixed.
   _⚙ Status: `investigate` · lesson #4430_

16. **The `gsd-tools.cjs` path in the detector is hardcoded to an absolute path.**
   The detector bash block references `/path/to/projectGSD/dev-tools/gsd-skill-creator/.claude/get-shit-done/bin/gsd-tools.cjs` rather than a relative path. That works for the author's workstation but will fail for any fork or checkout at a different prefix; a future revision should use `$GIT_ROOT` or a `$CLAUDE_DIR`-relative lookup.
   _⚙ Status: `investigate` · lesson #4431_

17. **No automated skill-description-length check.**
   The 250-char cap was enforced by reading the spec; the repo does not yet have a pre-commit hook or CI step that fails a build on overlong descriptions. The next release should add a lint rule so the cap becomes a mechanical guarantee rather than a manual discipline.
   _⚙ Status: `investigate` · lesson #4432_

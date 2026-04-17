# v1.49.32 — Release Integrity & Agent Heartbeat

**Released:** 2026-03-09
**Scope:** release-publishing integrity gate + silent-agent-failure detector + v1.49.29/v1.49.30 retrospective backfills
**Branch:** dev → main
**Tag:** v1.49.32 (2026-03-09T22:04:44-07:00)
**Predecessor:** v1.49.31 — Animal Speak, Sacred Landscapes & Process Hardening (Grandmother Cedar — Foxy Edition)
**Successor:** v1.49.33
**Classification:** patch — process tightening plus operational safety nets
**Commits:** 4 commits in range `v1.49.31..v1.49.32` (tip `36403d6`)
**Files changed:** 10 | **Insertions:** 546 | **Deletions:** 31
**Source:** Retrospective review of 95 lessons learned across 28 releases, gap analysis
**Verification:** 6/6 success criteria PASS · publish-release.sh validates · heartbeat hooks registered · v1.49.30 notes complete

## Summary

**Two disconnected manual steps will always drift.** The release-notes gap that v1.49.32 closes had been flagged in four consecutive retrospectives — v1.49.28, v1.49.29, v1.49.30, and v1.49.31 — each time as a "remember to do it" action item, and each time the action item failed. The structural problem was that writing `docs/release-notes/v{version}/README.md` and publishing the GitHub release with `gh release create` or `gh release edit` were two independent manual actions with no validation between them. The symptom was that GitHub release bodies kept shipping as empty or stub text while the in-repo notes were rich. The fix is a single script, `scripts/publish-release.sh`, that refuses to publish a release whose notes file does not exist, is empty, or is missing any of the required sections (Summary, Key Features, Retrospective, Lessons Learned). The script is a process gate, not a tool: it exists to make the bad path impossible rather than to make the good path easier.

**The five-design silence problem collapsed to a timestamp and a poller.** Silent agent failure — the case where a long-running agent stops emitting output but is not detectably dead — had accumulated five different design proposals across earlier sessions: a watchdog agent, the witness observer, a deacon heartbeat, an observer agent, and the flight-ops retro model. All five were over-engineered for the actual problem, which is simply "tell me when no tool call has happened in a while." v1.49.32 ships the minimum viable shape of that detection: `agent-heartbeat.js` (PostToolUse) writes a timestamp on every tool call, `agent-heartbeat-watcher.js` polls every sixty seconds and sends a desktop notification after ten minutes of silence with a thirty-minute reminder cadence thereafter, and `agent-heartbeat-start.js` (SessionStart) spawns the watcher and writes the initial heartbeat. The watcher notifies; it never intervenes. Investigation remains human-initiated. The ten-minute and thirty-minute thresholds are starting values chosen for a first-cut rollout; they will be calibrated against real data-intensive workloads rather than debated in advance.

**Retrospective review as input, not as output.** The standing project practice had been to emit a retrospective at the end of each release and file it in the release notes, then move on. v1.49.32 reverses the direction for one release cycle: the inputs were the 95 cumulative lessons learned across 28 releases read chronologically in a single session, and the outputs were two structural fixes that individual retrospectives could not have surfaced. The release-notes gap appears across four retrospectives; the agent-silence gap appears across three. No single retrospective connected the dots, but a cross-cutting read made both patterns actionable in under a session. That mode of work — retrospectives-as-input, periodically — is the underlying methodological lesson and the one most worth propagating to future process tightening work.

**Wave 2 and Wave 3 of v1.49.29 landed inside this patch.** v1.49.29 had shipped its Wave 1 deliverables on time but left four Wave 2 items and the Wave 3 verification pass open. Those items land in commit `7ac70fa73`: the wave-commit-marker hook (`project-claude/hooks/validate-commit.sh`) now validates warning-mode wave markers in commit messages; LOC-per-release tracking is added to STATE.md; `infra/SPECULATIVE-INVENTORY.md` catalogs speculative infrastructure that exists in the repo but is not yet activated; and `typedoc.json` plus the `docs:api` npm script bootstrap TypeScript API doc generation for the public library surface. Wave 3 is the verification pass itself, 13/13 SC PASS, closing all seven gaps GAP-1 through GAP-7 identified in the v1.49.29 retrospective. Folding the v1.49.29 tail into v1.49.32 keeps the retrospective-driven process hardening thread whole instead of leaving it split across two release boundaries.

**v1.49.30 FFA notes backfilled and published.** The release that triggered the release-notes gap in the first place — v1.49.30 "Fur, Feathers & Animation Arts" — had shipped with 6 research modules, 10 cross-domain bridges, 124+ sources, and 33/33 tests PASS, but its GitHub release body was a stub. Commit `c382e00f3` ships the full v1.49.30 README along with the `publish-release.sh` script itself, in the same change, so the backfill is also the first end-to-end test of the new publishing gate. Both v1.49.30 and v1.49.31 GitHub release bodies were updated with their full in-repo contents as part of this landing. The operational consequence is that every subsequent release must pass the gate to ship, which is the structural guarantee the four-retrospective drift could not produce.

**Minimal design beats escalation architecture.** Each of the five earlier silence-detection designs had wanted an escalation ladder (notify → page → nudge → restart → replace). The ship design has no escalation at all. It notifies once after ten minutes of silence and reminds every thirty minutes thereafter, and it does nothing else. The argument for no escalation: the operator at the terminal already has the signal, and the operator already knows how to investigate. Layering a protocol on top of a notification does not add information; it only adds surface to maintain. If future data shows that notifications alone are insufficient, the right next step is one more layer of protocol, added surgically, not a pre-declared ladder. Start with visibility.

**Scope discipline held.** The temptation with a retrospective-driven patch is to re-open every flagged issue across the cumulative lessons and try to close them all at once. v1.49.32 resists that temptation and ships only the two patterns that had four-plus repeats. Everything else in the 95-lesson corpus remains on the retrospective tracker for later prioritization. That scope discipline is what keeps this release a patch rather than another mega-release; the precedent is v1.49.3, which closed a cluster of five tightly-related first-run desktop bugs in one patch without widening to unrelated post-launch polish.

**Warning-mode first, enforcement later.** The wave-commit-marker hook added to `project-claude/hooks/validate-commit.sh` runs in warning mode by default, not enforcement mode. The publish-release.sh gate is a local convenience, not a CI requirement. Both choices are deliberate. New tooling that enforces behavior is more likely to produce workarounds than adherence; warning mode gathers data on whether the rule is producing useful signal without punishing contributors for its edge cases. Once the data confirms the rule is correct in practice, a subsequent release can promote enforcement. This is the same pattern v1.49.29 used for its validate-commit.sh conventional-commit enforcement — warning mode for one release cycle, then enforcement once the noise floor was understood.

**The retrospective tracker earned its keep.** This release's input was not a single retrospective but the full RETROSPECTIVE-TRACKER-style rollup across 28 releases. The tracker format — one row per lesson with version, status, and category — is what made it possible to scan for four-repeat patterns efficiently. Without that persistent cross-version ledger the same cross-cutting read would have required grepping 28 individual retrospectives in prose form. That's a seven-times-longer operation at least. Retrospective tooling that seems like overhead when you write the first entry earns its keep the moment you need to review 95 entries at once. File the tracker rows honestly in every release; future-you will read them in aggregate and find patterns that present-you cannot.

## Key Features

| Area | What Shipped |
|------|--------------|
| Release publishing | `scripts/publish-release.sh` (124 lines) — validates README existence and required sections before `gh release` publish |
| Release publishing | Validates required sections: Summary, Key Features, Retrospective, Lessons Learned |
| Release publishing | Tag-existence precheck — refuses to proceed if `v{version}` tag is not present locally |
| Release publishing | Creates or updates GitHub release body from the in-repo README — idempotent |
| Silent-agent detection | `.claude/hooks/agent-heartbeat.js` (PostToolUse) — writes timestamp on every tool call |
| Silent-agent detection | `.claude/hooks/agent-heartbeat-watcher.js` — 60-second poll, desktop notification at 10-minute silence |
| Silent-agent detection | `.claude/hooks/agent-heartbeat-start.js` (SessionStart) — spawns watcher, seeds initial heartbeat |
| Release-notes backfill | `docs/release-notes/v1.49.30/README.md` — FFA Fur, Feathers & Animation Arts full notes (87 lines) |
| Release-notes backfill | v1.49.30 and v1.49.31 GitHub release bodies updated with full in-repo content via the new gate |
| Wave 2 process hardening | `project-claude/hooks/validate-commit.sh` — wave-commit-marker validation (warning mode, +24 lines) |
| Wave 2 process hardening | `infra/SPECULATIVE-INVENTORY.md` — catalogs 58 lines of speculative infrastructure not yet activated |
| Wave 2 process hardening | `typedoc.json` + `docs:api` npm script — TypeScript API doc generation bootstrapped |
| Wave 2 process hardening | LOC-per-release tracking added to STATE.md |
| Verification | 6/6 success criteria PASS; publish-release.sh regression-tested against v1.49.30 pre-backfill |

## Retrospective

### What Worked

- **Root cause analysis over symptom treatment.** The release notes gap had been flagged in four retrospectives (v1.49.28 through v1.49.31) but treated each time as "remember to do it." Tracing the actual workflow revealed two disconnected manual steps, which produced the structural fix: one command that connects them.
- **Minimal heartbeat design.** One timestamp file, one poller, one notification. No escalation ladders, no agent hierarchies, no nudge protocols. The five designs that existed (watchdog agent, witness observer, deacon heartbeat, observer agent, flight-ops) were all over-engineered for the actual problem.
- **Retrospective review as input.** Reading all 95 lessons learned chronologically surfaced both the release notes pattern and the agent-silence pattern in a single session.
- **Scope discipline.** Only the two patterns with four-or-more repeats landed in this patch. The remaining 93 lessons stay on the tracker for later prioritization, keeping v1.49.32 a single-session patch instead of another mega-release.
- **Gate tested on its trigger release.** `publish-release.sh` landed in the same commit that backfilled v1.49.30 FFA notes, so the backfill also functioned as the gate's first end-to-end regression test.

### What Could Be Better

- **Heartbeat thresholds are untested.** 10-minute alert, 30-minute reminder — these are starting values with no data behind them. Real data-intensive workloads will calibrate them.
- **No CI enforcement of release notes.** `publish-release.sh` is a local manual gate. A pre-push hook or CI check could enforce it automatically; deliberately held in warning-mode-equivalent for this release.
- **Two retrospective patterns landed; ninety-three did not.** Scope discipline is correct, but every lesson left on the tracker is a potential future repeat. A periodic tracker-sweep cadence is still undefined.
- **v1.49.29 tail folded into v1.49.32.** Wave 2 and Wave 3 of v1.49.29 landed here, not in v1.49.29. Release boundaries that split a retrospective-driven thread across two versions are confusing for future readers; the `Wave N:` commit marker convention is a partial mitigation but the split itself is a symptom worth noting.

## Lessons Learned

- **Two disconnected manual steps will always drift.** If writing release notes and publishing them are separate actions, they will eventually desynchronize. One command that does both eliminates the class of error.
- **The simplest watchdog is the best first watchdog.** A timestamp and a poller. Everything else — escalation, nudges, restarts — can be added when the data says it's needed. Start with visibility.
- **Retrospective reviews compound.** Reading 95 lessons in sequence revealed patterns that individual retrospectives couldn't show. The release-notes gap was mentioned in v1.49.28, v1.49.29, v1.49.30, and v1.49.31 — but only a cross-cutting review made it actionable.
- **Heartbeat thresholds are empirical, not theoretical.** 10 minutes and 30 minutes are starting values that exist to produce data. The correct values come from observing which thresholds produce useful signal vs. noise on real workloads, not from reasoning about them in advance.
- **Warning mode precedes enforcement for new rules.** The wave-commit-marker hook and the publish-release.sh gate both land without hard enforcement on purpose. Enforcement before the rule has been socialized produces workarounds, not adherence.
- **Gate your publishing path, not your authoring path.** The fix is not to make it easier to write release notes — it is to make it impossible to publish a release without them. Process gates work at the moment of shipping, not at the moment of authoring.
- **Retrospective trackers earn their keep at aggregation time.** Per-release retrospective sections feel like overhead until you need to read 95 of them together. File rows honestly because a future cross-cutting read will find patterns individual retrospectives could not.
- **Minimal design beats escalation architecture.** Each of the five prior silence designs wanted an escalation ladder. The shipping design has none. If notifications alone prove insufficient, one more layer will be added surgically from observed data — never pre-declared.
- **Fold tail waves into the next patch, don't leave them hanging.** v1.49.29's Wave 2 and Wave 3 items landed in v1.49.32 rather than drifting indefinitely. The cost is a split retrospective thread; the benefit is that the thread actually closes.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.28](../v1.49.28/) | First retrospective to flag the release-notes gap |
| [v1.49.29](../v1.49.29/) | Second retrospective flagging the gap; also the source of Wave 2 items landed here |
| [v1.49.30](../v1.49.30/) | FFA Fur, Feathers & Animation Arts — notes backfilled in this release |
| [v1.49.31](../v1.49.31/) | Predecessor — TIBS research + process hardening; fourth retrospective flagging the gap |
| [v1.49.33](../v1.49.33/) | Successor — subsequent work on the v1.49.x line |
| [v1.49.3](../v1.49.3/) | Precedent for a tightly-scoped cluster patch (first-run desktop bugs) — shape this release follows |
| [v1.0](../v1.0/) | Foundational milestone — 6-step adaptive loop whose Observe step this release operationalizes |
| `scripts/publish-release.sh` | New publishing gate (124 lines) |
| `.claude/hooks/agent-heartbeat.js` | PostToolUse heartbeat writer |
| `.claude/hooks/agent-heartbeat-watcher.js` | Background poller + desktop notifier |
| `.claude/hooks/agent-heartbeat-start.js` | SessionStart watcher spawn + initial heartbeat |
| `docs/release-notes/v1.49.30/README.md` | Backfilled FFA release notes |
| `project-claude/hooks/validate-commit.sh` | Wave-commit-marker validation (+24 lines) |
| `infra/SPECULATIVE-INVENTORY.md` | Speculative infrastructure catalog (58 lines) |
| `typedoc.json` | TypeScript API doc generator configuration |
| `package.json` | `docs:api` script + version bump to 1.49.32 |
| RETROSPECTIVE-TRACKER (project) | The 95-lesson rollup that sourced the four-repeat patterns |

## Engine Position

v1.49.32 sits between v1.49.31 (Animal Speak, Sacred Landscapes & Process Hardening — Grandmother Cedar — Foxy Edition) and v1.49.33 on the v1.49.x line. It is the first patch in the project's history to be driven purely by a cumulative retrospective review rather than a feature or bug trigger, and it closes two four-plus-repeat drift patterns (release-notes publishing, silent-agent detection) that individual retrospectives had surfaced but could not resolve. The `publish-release.sh` gate it ships is load-bearing for every subsequent release — from v1.49.33 forward, no release can ship without its in-repo notes passing the section validator. The agent-heartbeat trio is additive infrastructure that will refine its thresholds from observed data in later patches. The retrospective-driven-patch pattern itself is the template referenced by later cross-cutting tightening passes in the v1.49.x line.

## Files

- `scripts/publish-release.sh` — new (124 lines), release publishing gate with section and tag validation
- `.claude/hooks/agent-heartbeat.js` — new, PostToolUse heartbeat writer (timestamp per tool call)
- `.claude/hooks/agent-heartbeat-watcher.js` — new, 60-second poller with 10-minute alert + 30-minute reminder
- `.claude/hooks/agent-heartbeat-start.js` — new, SessionStart watcher spawn + initial heartbeat
- `docs/release-notes/v1.49.30/README.md` — new (87 lines), backfilled FFA Fur, Feathers & Animation Arts notes
- `docs/release-notes/v1.49.31/README.md` — new (75 lines), TIBS research + process hardening notes
- `docs/release-notes/v1.49.32/README.md` — new (this file), release integrity + agent heartbeat notes
- `docs/release-notes/v1.49.29/README.md` — +113/−31 lines, Wave 2/Wave 3 tail landed
- `infra/SPECULATIVE-INVENTORY.md` — new (58 lines), speculative infrastructure catalog
- `project-claude/hooks/validate-commit.sh` — +24 lines, wave-commit-marker validation (warning mode)
- `typedoc.json` — new (17 lines), TypeScript API doc generator configuration
- `package.json` — +3/−0 lines, `docs:api` script + version bump to 1.49.32
- `.gitignore` — +3 lines, heartbeat runtime files excluded from commit

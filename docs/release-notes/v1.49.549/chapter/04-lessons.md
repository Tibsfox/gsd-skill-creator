# Lessons — v1.49.549

14 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Freeze schemas early and defend them with loader normalizers.**
   Every attempt across Waves 1–3 of cartridge-forge to "just add a field" was met with "use `metadata` or a loader normalizer." The same pattern holds at mission scale: the Grove format and the Cartridge schema both stabilized before their first real workload, and neither needed a breaking change under real data.
   _⚙ Status: `investigate` · lesson #9917_

2. **Build escape hatches on day one, not when you need them.**
   `KNOWN_VALIDATION_DEBT` and `--allow-validation-debt` were added in Wave 3 because the validator's strictness collided with pre-existing debt. If the quarantine pattern had been designed in at Wave 0, Waves 1 and 2 wouldn't have hit the false "loosen validator vs. skip test" choice. Pay for the escape hatch before you need it — applies equally to cross-file version checks, hook presence checks, and gitignored-path walkers.
   _⚙ Status: `investigate` · lesson #9918_

3. **Dogfood is the shortest path to format validation.**
   The cartridge-forge cartridge forced every schema decision to meet a real workload early. Half a dozen schema ambiguities collapsed into obvious answers the moment the forge cartridge had to declare its own skills, agents, and teams. "Use the system you're building" is cheaper than "write a test plan for the system you're building."
   _⚙ Status: `investigate` · lesson #9919_

4. **Parallel workstreams work when they're isolated at the right boundary.**
   The `artemis-ii` worktree, the `nasa` branch, the `wasteland` exclusion, and the live FTP sync pipeline kept eight concurrent workstreams from interfering with each other. The boundary of isolation matters more than the count of streams — pick worktrees and branches that split by *type of churn*, not by feature.
   _⚙ Status: `investigate` · lesson #9920_

5. **Verify state empirically before claiming it.**
   Multiple incidents during the mission (4 tracked in the memory-arena-m1 feedback file alone) traced to assertions about git state, file presence, or test status made without running a live query. Run the command first, then make the claim.
   _⚙ Status: `investigate` · lesson #9921_

6. **The crossfade tier model beats binary promote/demote for any live memory system.**
   Making tier transitions a crossfade rather than a flip means the system never has a period where data is "in-flight between tiers." A demote-in-progress chunk is still readable from its source; a promote-in-progress chunk is still readable after the copy starts. No window of unreadability, no retry logic for mid-transition reads. The Amiga exec.library pattern (crossfade with reference counting) transferred directly to Rust arena semantics.
   _⚙ Status: `investigate` · lesson #9922_

7. **Deferral asymmetry dominates warm-start cost.**
   The M2 benchmark showed 13.59 µs saved per deferred chunk versus 533 ns cost to validate eagerly — a 25:1 asymmetry that made eager validation the wrong default. The lesson generalizes: when deferred work averages 10× or more the cost of the eager check, default to deferred and validate on demand.
   _⚙ Status: `investigate` · lesson #9923_

8. **Non-squash merges preserve mission history.**
   PR #32 preserved all 670 artemis-ii commits via the non-squash strategy. The history is navigable by anyone who wants to bisect Memory Arena's M1 → M13 progression or the Grove format's evolution. A squash would have collapsed 13 days of work into one commit and erased the sub-milestone boundaries. When the branch IS the mission, preserve the branch.
   _⚙ Status: `investigate` · lesson #9924_

9. **Process failure fingerprints show up at test suite boundaries.**
   The `cli.test.ts` unhandled-rejection bug had been misdiagnosed for weeks as "flaky tests" or "cross-test pollution." The actual root cause — `src/cli.ts` `main()` running at module load — was caught once someone ran the failure under a node `--unhandled-rejections=strict` setting instead of guessing. Entrypoint guard at `1d38b12d8` resolved the whole cluster. Runtime-semantics-level debugging beats hypothesis-level debugging.
   _⚙ Status: `investigate` · lesson #9925_

10. **The omnibus tag matches what shipped, not what was chartered.**
   Artemis II was scoped as research tracking. What shipped was Memory Arena + Grove + cartridge-forge + the research tracking. Versioning the tag as "omnibus" acknowledges the gap between charter and reality without pretending either was wrong. Future missions should expect the same — what flies is what you tag.
   _⚙ Status: `investigate` · lesson #9926_

11. **The `--allow-validation-debt` escape hatch should have been a Wave 0 primitive.**
   Building the quarantine mechanism when we first hit strict-validator collision was the Wave 3 afterthought that should have been day-one infrastructure. Future missions ship escape hatches before they're needed.
   _⚙ Status: `investigate` · lesson #9927_

12. **Packaging version drift caught late.**
   `package.json` at 1.49.500 versus `Cargo.toml` / `tauri.conf.json` at 1.49.441 went unnoticed until harness-integrity surfaced it during post-merge verification. Future missions should have a cross-file version check running on every release.
   _⚙ Status: `investigate` · lesson #9928_

13. **The `pr-review-gate.sh` experimental hook added friction.**
   The sentinel-file pattern (`touch /tmp/.pr-reviewed-artemis-ii`) solved the intended problem but tripped workflow expectations more than once. Retired when `artemis-ii` closed.
   _⚙ Status: `investigate` · lesson #9929_

14. **Cross-chipset validation debt surfaced 22 departments of invisible drift.**
   10 Category A (`agent_affinity` refs pointing at renamed agents) + 12 Category B (`domains_covered` field drift). None of it was visible until a tool could see it. Quarantined, not fixed — the actual department repairs remain follow-up work.
   _⚙ Status: `investigate` · lesson #9930_

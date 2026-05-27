# v1.49.808 — Retrospective

**Wall-clock:** ~30-40 min from session-start to tag-push. Second ship of the 4-ship chain (S5 → S2 → KNOWN_UNWIRED chip → T1.3 recon).

## What worked

**The 14 existing baselines made this a consume-not-create ship.** When the v786 ship landed `adoption-scan` and v787 landed `adoption-refresh` with the per-version JSON snapshot pattern, no one explicitly planned for "v808 will consume these for trends." But the JSON snapshots accumulated over 14 ships gave the trends tool an immediate non-trivial dataset — surfacing 5 real adoption wins (modules that flipped test-only → living during the audit-driven ship campaign) and 45 persistent-shelfware candidates with zero new data collection. This is the cleanest application yet of the substrate-then-consume pattern (#10416 tolerant generator + #10422 verdict-pattern surface separation): the substrate ships first; the consumer ships later when the data is ripe.

**Lightest-wire avoided three nearby tempting paths.** Three obvious alternatives were considered and rejected in recon: (a) build a runtime call-graph scanner — out of scope; existing static-import analysis is enough for the "is this module living" question; (b) introduce a SQLite database — JSON snapshots already exist and committing the markdown report makes the trend visible in PR diffs; (c) wire the trends report into pre-tag-gate as a `--check` — would create a new gate failure mode for a report that doesn't gate anything load-bearing. The smallest viable surface is a tool that produces a markdown file, with npm scripts for ergonomics. ~250 LOC of tool + ~150 LOC of tests.

**The spawnSync test pattern paid off again.** Per #10417, tools/__tests__ use spawnSync rather than execSync so stderr survives non-zero exits. The --check drift test asserts on stderr content ("drift detected"); execSync would have thrown an exception that swallowed the error message. The discipline keeps test diagnostics clean even when the gate exits 1.

**Real S2 work showed visible adoption progress.** The first run of the trends report against the existing baselines wasn't a placeholder — it surfaced 5 concrete adoption wins from the v789-v795 ship range (semantic-channel, koopman-memory, coherent-functors, hourglass-persistence, bounded-learning). These are the modules that the audit campaign specifically targeted; seeing them flip test-only → living in the data validates that the campaign worked. The report is doing useful work on day one.

## What surprised

**The new-module watch was empty.** Every module in the v801 baseline was already present in the v787 baseline — meaning no new substrate modules shipped during the v787-v801 audit campaign (which was deliberately a maintenance/codification window). Future ships will populate this section; the first non-empty entry will be informative.

**45 modules in the persistent-shelfware list is a lot.** At first glance this seemed like an over-eager threshold. Reconsidered: a module that's been `test-only` for 6 consecutive snapshots IS shelfware-risk by the audit's own definition ("6-ship-gap from ship to first non-test caller is normal"). The 45 number says the project has substantial accumulated substrate that hasn't yet attracted real callers. Some of these will get wired in future ships; some will be allowlisted with reasons; some will be retired. The report makes the chip-down candidates visible — that's the load-bearing function.

**One test got the slice indexing wrong on first write.** My test asserted "non-living since v802" for a 3-snapshot threshold over snapshots v800-v803, but `history.slice(-3)` returns v801/v802/v803, so `firstNonLivingSince = v801`. Fixed the assertion. The bug was in the test's mental model, not the tool's behavior — caught by the test infrastructure, which is exactly what the test is for. A useful counter-example to confirmation-bias-driven test authoring: if you write the assertion before the implementation, the test bugs are real bugs in your mental model.

## What to watch

- **First new-module watch hit.** The next ship that lands a new src/<module>/ directory will populate this section. Worth checking the report after the next forward-cadence ship.
- **Shelfware chip-down cadence.** If the operator regularly addresses 1-2 shelfware modules per ship, the list shrinks; if not, the list grows as new substrate ships. The trend is the answer to "is the project adding more substrate than it's adopting?" — a project-health signal we now have visibility into.
- **The "no pre-tag-gate integration" decision.** This is a judgment call that could go either way over time. If the trends report goes stale across many ships (i.e. operators forget to regenerate), a pre-tag-gate `--check` would force the regen. If operators run it on demand and the report stays current, the gate is overhead. First data point: how often does the report drift before v810?
- **Allowlist count creeping up.** From v787 to v801, allowlisted count went 10 → 12 (+2). This is expected behavior for modules that are intentionally not consumed (e.g. WIP, deprecated, reference implementations). If allowlisted count grows much faster than living count, the project may be using allowlisting as a way to avoid making wire/retire decisions — a pattern worth watching.

## Verdict on scope

S2 closure landed in the smallest viable shape: 1 tool + 1 test file + 1 generated markdown + 2 npm scripts + 1 vitest-config entry + 5 release-notes files. Resisted: runtime call-graph; database backend; pre-tag-gate `--check`; auto-wire of any persistent-shelfware module. All resistances paid off — the diff stays surgical, the data is already there, and the operator-facing artifact is committed for visible-in-PR drift detection.

The chain now stands at 2 of 4 ships shipped (S5 + S2). Wall-clock totals: ~40-50 min (S5) + ~30-40 min (S2) = ~70-90 min for the first half. Comparable to the v804+v805 chained-session compression rate (~70-75 min for 2 ships) — but single-ship pattern keeps each ship independently reviewable rather than commingled. The chain-vs-individual tradeoff favors individual for ships of this size; chained-session is for compression of related work, which these are not.

After v808, the 2026-05-26 audit retrospective is **fully closed**. All 7 levers shipped over 19 milestones (v790, v805×3, v806, v807, v808). The next milestone-N audit is overdue per #10428's ~7-10-ship codification cadence; the natural slot is after the NASA 1.179 forward-cadence sweep.

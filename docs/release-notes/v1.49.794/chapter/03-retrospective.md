# Retrospective — v1.49.794

## Carryover lessons applied

- **Lesson #10412 — Recon-first as default.** Applied — 7th consecutive application since v784 codification. Read both `tools/adoption-refresh.mjs` and `tools/__tests__/adoption-refresh.test.mjs` in full BEFORE proposing the guard design; read `docs/T14-SHIP-SEQUENCE.md` + the v790 codification README (template for promoting a candidate to ESTABLISHED); read `docs/static-analysis-tool-discipline.md` to confirm #10424 belongs in the tool-authoring domain (not a new domain). Recon caught the test config detail (`vitest.tools.config.mjs`, not the root config) before the first test run.
- **Lesson #10415 — Deferred-maintenance escalation.** Applied directly: #10424 candidate aged 3 milestones (v791→v793) and the discipline says close escalated wedges within 1-2 milestones; v794 closes at milestone-3 (within tolerance, but at the edge of the window). The trigger for closure was the v793 handoff's explicit "Path E — Migrate #10424 candidate to a deterministic gate" recommendation.
- **Lesson #10417 — Test harnesses use `spawnSync`.** Applied prophylactically — the existing test harness already uses `spawnSync` (the discipline-doc reference implementation). New tests inherit the pattern; no new harness needed.
- **#10424 candidate (now ESTABLISHED) — adoption-refresh ordering.** Self-validated: this ship's T14 sequence runs adoption-refresh AFTER bump-version (4th sequential clean application), and the new guard would have refused if the order were reversed.

## What Worked

- **Single-file gate is the right scope.** The guard lives entirely in `tools/adoption-refresh.mjs` — one new function (`checkOverwriteGuard`), one new flag (`--force`), one new exit code (3). No cross-file plumbing, no new dependencies, no impact on the adoption-scan or render-dashboard tools. The discipline doc says "lightest wire that satisfies the verdict" (#10423); applied here to gate authoring.
- **JSON-content comparison sidesteps git entirely.** The guard reads the on-disk JSON and compares it byte-for-byte with what we'd write. No `git show HEAD:...` complexity, no working-tree-vs-committed reasoning, no test-fixture-needs-git-init friction. The disk IS the source of truth for what's "committed" in normal use, and `--force` is the escape hatch for the rare retroactive case. Pattern: trust the simplest data shape that catches the failure mode.
- **Three tests is the right coverage.** T9 (refusal) + T10 (`--force` override) + T11 (idempotent re-run succeeds) cover the three behavioral branches. T1-T8 (existing) cover the happy-path and feature behaviors. 11 tests total, all in one file, all run in ~4.5s under `vitest.tools.config.mjs`.
- **The codification target was already perfect.** `docs/static-analysis-tool-discipline.md` is the natural home for #10424 — it's a tool-authoring pitfall. No new domain entry needed. The discipline doc gains one section + one anti-pattern bullet + one lesson reference; the manifest JSON entry gains one key_lessons ID + a sentence in the summary + a phrase in the codified-at-milestone field. ~10 lines of manifest delta total.
- **First-time-shipping-a-gate-+-promoting-a-lesson-in-one-ship lifecycle is clean.** v790 was 7 lessons promoted at once after the candidate cluster crossed threshold. v794 is the smaller form: 1 candidate, ripe via the 1-trip-plus-vigilance-hold heuristic, becomes both a formal ID and a gate in the same ship. The latter shape will likely repeat as future single-trip candidates accumulate vigilance evidence.
- **Test assertion typo caught fast.** First test run had `expect(r2.stderr).toContain('forgot to run')` but the message said "Did you forget to run". Read the stderr diff in the failure output, fixed the assertion to "forget to run" (+ added a third assertion for "AFTER bump-version" to strengthen the message contract). ~30s diagnosis. Pattern: read the actual output in the test failure carefully, not the proposed one.

## What Could Be Better

- **`--force` over-broad as an escape hatch.** A single flag covers both the "I know what I'm doing, this is a retroactive rewrite" case AND the "I just want to silence the gate" case. A `--retroactive-rewrite` flag with a stronger name might prevent operators from reflexively passing `--force` when the actual right move is `bump-version`. Cost-of-deferral is low; flag-name change is non-breaking.
- **Guard message doesn't link to discipline doc.** The FATAL message tells the operator "Adoption-refresh MUST run AFTER bump-version, not before" but doesn't point at `docs/static-analysis-tool-discipline.md` for the meta-discipline context. A discipline-doc link in the FATAL message would help operators who are new to the tool. Out of scope.
- **No structured exit-code documentation.** This ship adds exit code 3 (guard refusal). Existing exits: 0 (success), 2 (scan/render failure). No central doc lists adoption-refresh's exit-code contract; operators must read the source. Out of scope.
- **One pre-existing TS friction not addressed.** The `FlagLookup` discriminated union pattern is duplicated across 3 CLI command files (`koopman-check.ts`, `coherent-check.ts`, `hourglass-check.ts`); v793 retrospective flagged the extract-to-`src/cli/lib/flag-lookup.ts` opportunity. Out of scope for this gate ship — still flagged for a future ship.

## Surprises

- **Self-validating gate at T14 ship time.** The ship that installs the gate also runs adoption-refresh as part of its own T14 sequence (step 11 in the canonical sequence). The gate's first production exercise is the ship that introduces it. With v794's bump-version step ordered correctly per the canonical sequence, the guard's check fires once (first-run on the new v794 baseline, file absent → write), confirming the happy path under the gate's authority. If this ship's T14 were misordered (adoption-refresh before bump-version), the gate would catch its own self-deployment misordering — a one-step recursive validation pattern.
- **Codifying a meta-principle alongside the gate.** The discipline-doc section for #10424 has two parts: the specific gate (refuse-to-overwrite-without-force) AND a "General principle (meta)" paragraph stating "When a prose warning about non-obvious tool sequencing trips once and holds two-three ships under vigilance alone, migrate to a deterministic gate the next ship." The meta-principle is the more general statement; the specific gate is its first application. This dual-codification pattern (specific + general) wasn't planned but emerged naturally from writing the section. Future ships codifying single-instance lessons should consider whether the lesson is the first instance of a more general pattern worth naming.
- **`--check` confirms CLAUDE.md sync.** The drift check on regenerated CLAUDE.md returned "up to date" first try — the manifest edit + render combo produced byte-identical output to the just-written CLAUDE.md, with no manual intervention needed. The render-claude-md tool's idempotency is now load-bearing for codification ships.

## Lessons applied at v1.49.794 (from v1.49.793 and earlier)

- **#10412** (recon-first) — applied. 7th consecutive application.
- **#10415** (deferred-maintenance) — applied: closed #10424 at milestone-3 from emit.
- **#10417-#10421** (Static-analysis tool authoring, existing 5) — N/A directly (no new tool); cluster gains a 6th member with #10424.
- **#10422-#10423** (Shelfware verdict patterns) — N/A this ship (no verdict authored).
- **#10423-analog (lightest wire)** — applied to gate authoring: single-function single-file gate, no cross-module plumbing.

## Lesson candidates emitted this ship

None. This ship is the closure of v793's lone candidate (#10424 → ESTABLISHED); no new candidates surfaced.

## Open lessons watchlist (apply at next opportunity)

- **#10412** (recon-first) — apply at every session start with a handoff document.
- **#10417-#10421, #10424** (Static-analysis tool authoring) — apply at any future `tools/*.mjs` or `tools/*.ts` CLI authoring.

## Verdict on the gate-vs-prose migration heuristic

The "1 trip + 2 sequential clean applications under vigilance → migrate to gate" heuristic was the right read here. The cost of the gate (~30 min implementation + tests + discipline doc + manifest + chapter set + T14 sequence) is on par with one operator vigilance lapse + recovery. Beyond ship 3-4 since the trip, the prose warning would decay faster than the operator vigilance could compensate. v794 closes #10424 at the right moment in the decay curve.

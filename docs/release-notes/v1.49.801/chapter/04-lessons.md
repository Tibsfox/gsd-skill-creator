# 04 — Lessons Learned: v1.49.801 T1.1 Ship 7 (T1.1 ARC CLOSED)

## 1 candidate emitted (#10427); 0 promoted to ESTABLISHED

v801 emits the final candidate of the chained session: #10427 (best-effort silent contracts for forensic/dashboard surfaces). Three-instance observation across v799-v801; promotion path is codification.

## Disciplines reinforced (no new IDs)

- **#10412 (Recon-first as default)** — 14th consecutive application since v784 codification. Read both the installed `.claude/commands/sc/status.md` AND the source `project-claude/commands/sc/status.md` to confirm the install pattern before editing.
- **#10422 (Verdict-pattern surface separation)** — 11th forward application. CLI surface (`--summary` flag + helper) separate from operator-facing skill prompt (`project-claude/commands/sc/status.md` Step 5.5). Each evolves independently.
- **#10423 (Lightest wire that satisfies the verdict)** — 11th forward application. Resisted: subcommand-routing rework, custom HTTP API, separate dashboard surface, relative-time rendering primitive.
- **#10424 (ESTABLISHED at v794) — Adoption-refresh AFTER bump-version.** Applied. Eighth consecutive ship under the gate.
- **#10426 candidate (v798) — APPLIED at THIRD consumer.** v799 audit-log + v800 runCalibrationTick + v801 runSummary all consume the v798 observation-source registry verbatim. Three consumer-side validations in one session validates the abstraction extraction was right-sized.

## New lesson candidate (#10427)

**ID:** #10427 candidate
**Severity:** MEDIUM
**Source:** v1.49.799-801 three-instance observation across audit-log write / watch-loop callback / /sc:status Step 5.5

**Statement:**

Forensic, dashboard, and observability surfaces SHOULD fail silently. Load-bearing operations SHOULD fail loudly. The asymmetry: load-bearing failures mean the user is acting on wrong data and must be told; non-load-bearing failures mean a non-essential surface degraded and the user shouldn't be blocked.

**Why:**

Across v799-v801, three surfaces independently implemented best-effort silent failure:
1. v799 audit-log write — disk-full / permission-denied does NOT propagate to CLI exit code.
2. v800 watch-loop callback — single transient error does NOT tear down the watch loop.
3. v801 /sc:status Step 5.5 — subprocess failure or JSON parse failure SKIPS the section silently.

Each instance was a deliberate design choice. Surfacing the failure would either gate the load-bearing operation (calibration loop, watch session, status dashboard) or pollute the operator-facing output.

**How to apply:**

When designing a new surface, ask: "is this load-bearing or accessory?"

- Load-bearing surfaces (operations the user is asking for; data that decisions depend on) MUST fail loudly with clear messages. Examples: calibration loop result, threshold writer, config reads.
- Accessory surfaces (logging, telemetry, dashboard sections, optional decorations) SHOULD fail silently. Examples: audit-log write, /sc:status integration section, watch-loop callback error.

The contract should be explicit in the function docstring (`// best-effort silent` comment or equivalent) AND tested with at least one "what happens when this fails" assertion.

**Promotion path:**

Codification at next discipline-coverage codification ship. Three instances within v799-v801 is sufficient first-instance evidence. Second-instance forward-shadow could be any future surface that adopts the same contract explicitly.

## #10425 promotion path discussion (NOT promoted this ship)

v801 has no e-process redesign surface. Status: **unchanged** (MEDIUM, candidate, v795 design).

## #10426 promotion path discussion (NOT promoted this ship)

v801 is the THIRD consumer-side validation of the v798 cross-class registry extraction. This is strong supporting evidence for the discipline, but the original v798 extraction remains the first instance. Promotion path:

- **(a) Second-instance forward-shadow** — another cross-class registry extraction surfaces in a future unrelated module.
- **(b) Codification at next discipline-coverage codification ship** — likely the more probable path; codification can promote #10426 alongside #10427 in the same session.

Status: **unchanged** (MEDIUM, candidate, validated 3× consumer-side).

## Meta-observation: chained-session arc summary

Five-ship chained session v797-v801. Final aggregated metrics:

- Wall-clock: ~3-3.5h total, ~30-40 min average per ship.
- Test growth: 77 → 136 (+59 across 5 ships, ~12/ship).
- New TypeScript modules: 3 (observation-sources.ts, audit-log.ts, watch-loop.ts).
- New CLI flags: 7 (--watch, --watch-debounce, --audit-log, --no-audit-log, --summary, --threshold extended to 4 keys, observationSource JSON field).
- Operator-facing UX additions: /sc:status Step 5.5.
- Lesson candidates emitted: 1 (#10427) + 1 tentative observation (watch-loop tear-down race).
- Lesson candidates validated as consumer-side application: #10426 (3 times).

**The five-ship cadence pattern:**

```
v797 (same-class extension, chained):              15-20 min
v798 (cross-class + new module + abstraction):     45-60 min  ← architectural tax visible
v799 (new module consuming established):           30-40 min  ← architectural payoff visible
v800 (refactor + new module + long-running):       40-50 min  ← intermediate
v801 (consumer integration, no new module):        30-40 min  ← lightest of the new-surface ships
```

The architectural-tax ship (v798) paid off in three subsequent consumer ships (v799, v800, v801). This is the empirical pattern worth codifying:

**When extracting a cross-class abstraction in a multi-ship chain, the architectural-tax ship adds ~30 min over lightest-wire, but every downstream consumer ship in the same chain saves ~10-15 min by consuming the abstraction verbatim. Break-even is at the second consumer; net positive at the third.**

This is potentially a #10428 candidate. Defer the call for now (would need ~one more cross-class registry chain to validate the break-even point); flag for the next chained-session retro.

## Cross-discipline observation: register-and-consume pattern across files

The v798 observation-source registry is a "register-and-consume" pattern:
- One file (observation-sources.ts) registers.
- N files (CLI, audit-log, summary) consume.

The discipline: never DUPLICATE the registry data across consumers. Three v798 + v799 + v800 + v801 consumers all use `observationSourceFor()` — none re-implement the classification logic. This is what the abstraction is FOR.

If a fourth surface added (e.g. a dashboard generator), it should ALSO consume via `observationSourceFor()` rather than reading the threshold prefix itself. This is now the "well-traveled path" for the registry.

## Discipline-coverage status post-ship

Manifest entries: 15 → 15 (unchanged)
Manifest lessons: 65 → 65 (no new formal ID)
Codified-vs-uncodified gap: 2 → 3 (#10427 candidate ADDS to backlog; #10425 + #10426 still pending)

## Forward backlog (post-v801, T1.1 arc closed)

| ID | Severity | Apply | Source |
|---|---|---|---|
| #10425 candidate | MEDIUM | Two-sided e-processes on bounded binary observations are insensitive to unanimous direction. | v795 design |
| #10426 candidate | MEDIUM | Extract per-class registries at the SECOND class instance, not the third. Validated thrice consumer-side this session. | v798 architectural-choice |
| #10427 candidate | MEDIUM | Forensic/dashboard/observability surfaces fail silently; load-bearing surfaces fail loudly. | v799-801 three-instance observation |
| (tentative) watch-loop tear-down race | NOTE | Long-running primitives MUST await in-flight callbacks during teardown. | v800 implementation |
| (tentative) chained-session break-even | NOTE | Architectural-tax ship in multi-ship chain breaks even at 2nd consumer, net positive at 3rd. | v798→v799/v800/v801 observation |

# 04 — Lessons: v1.49.642 Housekeeping Cluster #9

## Summary

**1 forward lesson emitted** (#10206) + **1 lesson lifecycle completion** (#10199 — 5-transition arc complete).

## Lesson #10199 — 5-transition automation arc complete

### Lifecycle traversal

Lesson #10199 has completed all 5 abstraction transitions:

| Transition | Cluster | Artifact |
|---|---|---|
| 1. Source incident | v1.49.634-638 | 5-cluster CI-install-gap framing-error chain |
| 2. Lesson at retro | v1.49.639 | `docs/release-notes/v1.49.639/chapter/04-lessons.md` §Lesson #10199 |
| 3. Discipline doc | v1.49.640 C2 | `docs/MISSION-PACKAGE-DISCIPLINE.md` §1 |
| 4. Executable tool | v1.49.641 C2 | `scripts/closure-verify-cf.mjs` (5 probe types) |
| 5. Per-CF spec auto-dispatch | **v1.49.642 C1** | `auto` subcommand + `.planning/cf-probes/<CF-id>.yaml` |

### Why the 5th transition matters

The first 4 transitions converted Lesson #10199 from a one-time observation into a reusable discipline. The 5th transition removes the operator-cognitive-load step: instead of "operator picks which probe matches each CF at W0", the CF carries its own probe spec; operator runs `auto`.

This is the path from "discipline-as-code" to "discipline-as-data". Each CF carries its own metadata (probe type, args, routing rules, notes). The tool consumes the metadata. The discipline traveled with the codebase AND with the CFs.

### Forward applicability

Future N+k cluster authors who add new CFs can author probe specs alongside the CFs (in the same carry-forward chapter cycle). The probe spec becomes documentation:
- What probe applies to this CF?
- What routing rules govern its disposition?
- What context does the next cluster author need?

This is the documentation-by-execution pattern: the same file that the tool consumes is the same file the human reads to understand the CF.

## Lesson #10206 — Apply-to-self testing catches discipline-implementation bugs

### Statement

When a discipline is codified as a tool, the tool's own internals can be tested against the discipline they implement (apply-to-self). This catches bugs in the discipline's MECHANICAL implementation that wouldn't surface in normal use because normal use doesn't probe the tool's own behavior.

### Source incident

v1.49.642 C1 implementation:

1. probeAuto was implemented to map exit codes 1:1 to outcomes: `result === 0 ? 'resolved-upstream' : 'still-real'`
2. CF-14's self-referential probe spec was authored: probe `scripts/closure-verify-cf.mjs` via file-snapshot probe; expect status `inconclusive`; routing rule `inconclusive: retire`
3. Running the self-test: routing output printed `routing_rules[resolved-upstream] => retire` instead of `routing_rules[inconclusive] => retire`
4. Root cause: file-snapshot has 3 possible statuses (resolved-upstream / inconclusive / still-real) but always exits 0 in success paths. The exit-code-to-outcome mapping was wrong for any probe with >2 outcomes.
5. Fix: probeAuto reads the actual STATUS from the record file the probe just wrote.

Without the self-test, this bug would have shipped. Future cluster authors running `auto` on real CFs would have gotten wrong routing-rule suggestions silently. The self-test caught it in development.

### Mitigation

For any future discipline codified as a tool:

1. **Apply the discipline to the tool itself**. Author a self-referential test case where the tool consumes its own metadata.
2. **The self-test should exercise the FULL discipline pipeline**: setup → invocation → outcome interpretation → result.
3. **Surface the bug AT design time, not at deployment time**. Self-tests catch implementation bugs that integration tests with synthetic fixtures might miss.

This generalizes Lesson #10180's skip-guard pattern (test substrate matches production substrate) to discipline-as-tool patterns (tool's behavior matches the discipline it implements).

### Forward applicability

- `scripts/closure-verify-cf.mjs` self-test caught the routing-rules bug at v1.49.642 C1
- Future tools codifying disciplines should author self-test cases similarly
- Self-tests can live alongside the tool's test suite OR as separate apply-to-self artifacts

### Apply-to-self check (recursive!)

This Lesson #10206 emission about apply-to-self is itself a meta-observation. The pattern it describes — apply-to-self catches implementation bugs — was demonstrated DURING the cluster that emitted the lesson. The lifecycle:

1. Implement (probeAuto with exit-code mapping)
2. Apply to self (CF-14 self-referential spec)
3. Caught bug (routing rule mismatch)
4. Fixed in-cluster (STATUS read from record)
5. Emitted lesson about the pattern that caught the bug

The emission validates the pattern by example.

## Cumulative lesson count

| Range | Description | Count |
|---|---|---|
| #10180 | Meta-Lesson — fragile-test discipline | 1 |
| #10181-10186 | v1.49.636 cluster | 6 |
| #10187-10192 | v1.49.637 cluster | 6 |
| #10193-10198 | v1.49.638 cluster | 6 |
| #10199-10202 | v1.49.639 cluster | 4 |
| #10203-10204 | v1.49.640 cluster | 2 |
| #10205 | v1.49.641 cluster | 1 |
| #10206 | **v1.49.642 cluster (this milestone)** | 1 |
| Total | | 27 |

Smallest emission tied with v1.49.641. Cluster's value is automation completion + apply-to-self validation, not net-new discipline discovery.

## See also

- `01-overview.md` §Forward implications — discipline-as-code completion arc
- `02-walkthrough.md` §C1 — full implementation trace
- `03-retrospective.md` §What worked — apply-to-self bug-catching example
- `05-carry-forward.md` §CF-15 — only carry-forward to Cluster #10
- `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.7 — auto subcommand + YAML schema
- `docs/test-discipline/cf-closure-verification-templates.md` §Per-CF probe spec auto-dispatch
- `.planning/cf-probes/cf-13.yaml` + `cf-14.yaml` — example probe specs (gitignored)
- `scripts/closure-verify-cf.mjs` — full tool with auto extension

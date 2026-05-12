# 99 — Context: v1.49.638 Housekeeping Cluster #5

## Engine state

UNCHANGED from predecessor v1.49.637. No NASA / MUS / ELC / SPS /
TRS forward-cadence content shipped in this milestone.

| Slot | v1.49.637 | v1.49.638 | Δ |
|---|---|---|---|
| NASA degree | 108 | 108 | 0 |
| MUS pack | 108 | 108 | 0 |
| ELC degree | 108 | 108 | 0 |
| SPS pack | #105 | #105 | 0 |
| TRS pack | 30 | 30 | 0 |
| Counter-cadence flag | true | true | (preserved) |
| No-engine-state-advance flag | true | true | (preserved) |

The next degree-advancing milestone candidate is **v1.49.639**
(STS-7 Sally Ride / Challenger) per v1.49.637 close forward-note.
Cluster #6 (also v1.49.639 if interleaved as counter-cadence)
inherits the 6 carry-forwards documented in chapter 05.

## Predecessor lineage

| Milestone | Tag | Date | Type |
|---|---|---|---|
| v1.49.634 | `v1.49.634` | 2026-05-11 | Counter-cadence (cluster #2) |
| v1.49.635 | `v1.49.635` | 2026-05-11 | Counter-cadence (cluster #3) |
| v1.49.636 | `v1.49.636` | 2026-05-11 | Counter-cadence (cluster #3-followup) |
| v1.49.637 | `v1.49.637` | 2026-05-11 | Counter-cadence (cluster #4) |
| **v1.49.638** | `v1.49.638` (pending T14) | **2026-05-11** | **Counter-cadence (cluster #5)** |

Predecessor merge commit on `main`: TBD (v1.49.637 merge pending
T14 at v1.49.638 W3.T2 ship-prep time).

## T14 ship sequence reference

**NEW at v1.49.638:** the canonical T14 ship sequence is now
authored at `docs/T14-SHIP-SEQUENCE.md` (per C2 component). This
release-notes context section no longer transcribes the sequence
— it references the canonical document.

See `docs/T14-SHIP-SEQUENCE.md` for the 13-step T14 sequence
including:

- Pre-tag-gate composite (9 steps; step 10 STORY append REMOVED from this composite per C2)
- bump-version + release commit + tag + push
- main fast-forward + push
- RH refresh
- **STORY append (now AFTER tag push, not embedded in pre-tag-gate)**
- GH release publish
- STATE.md normalize
- HANDOFF doc finalization

Per Lesson #10191 (v1.49.637), the T14 sequence is atomic —
executes against directive state at G3 authorization time; any
mid-T14 revision goes forward to next milestone.

Per Lesson #10184 (v1.49.635), dev → main fast-forward uses
`git update-ref refs/heads/main HEAD` (single-step) rather than
`git checkout main && git merge dev`.

## Commit manifest (pre-T14)

| SHA | Subject | Wave |
|---|---|---|
| `7a9a2c5cb` | feat(atlas): add get_or_open_for_project for LRU isolation | W1A.T1 |
| `b78097bb9` | test(atlas): C1 LRU isolation invariant under per-project API | W1A.T1 |
| `961e36943` | docs(ship): canonical T14 sequence + ordering invariant test | W1A.T2 |
| `a5ad270fb` | refactor(pre-tag-gate): remove misplaced step 10 STORY append | W1A.T2 |
| `04dbfdc7c` | test(meta): invert v1.49.637 C4 assertions for new STORY-gate ordering | W1A.T3 |
| `1e9d64dfc` | test(meta): W1A.T3 polish for C4 assertion inversion | W1A.T3 |
| `a8a50b21d` | docs(discipline): codify substrate-probe discipline at docs/ | W1B.T1 |
| (`33f4af237` — REVERT of C4 v1) | revert(ci): C4 v1 self-mod-guard install attempt | W1B.T2 v1 |
| `06a0da610` | fix(dashboard): tighten HAS_LIVE_PLANNING to require REQUIREMENTS.md | W1B.T2 v2 partial |
| `97a5ce3cf` | fix(kb-test): ORDER BY rowid tiebreaker for list-meetings | W1C |
| `deff7f9cd` | fix(kb-test): ORDER BY rowid tiebreaker for list-findings | W1C |
| `6d1282c64` | fix(kb-test): pre-emptive flake reduction at projects + findings hookTimeout | W1C |
| `074ff9d44` | docs(test-discipline): flake-audit-2026-05-11 stage 3 closure + stage 2 corrections | W1C |
| `d49a6c381` | test(meta): v1.49.638 integration meta-test (C1 + C2 + C3 + C5 + C4 deferral assertion) | W3.T1 |
| `ce88b8e0a` | docs(release-notes): v1.49.638 chapter 00 summary | W3.T2 |
| `9585e6075` | docs(release-notes): v1.49.638 chapter 01 overview | W3.T2 |
| `c983e8542` | docs(release-notes): v1.49.638 chapter 02 walkthrough | W3.T2 |
| `870d436c5` | docs(release-notes): v1.49.638 chapter 03 retrospective | W3.T2 |
| `1533ac173` | docs(release-notes): v1.49.638 chapter 04 lessons | W3.T2 |
| `f55f50211` | docs(release-notes): v1.49.638 chapter 05 carry-forward | W3.T2 |
| `(this commit)` | docs(release-notes): v1.49.638 chapter 99 context | W3.T2 |
| `(pending)` | docs(release-notes): v1.49.638 README version-root | W3.T2 |

**Deferred (Cluster #6):** C4 self-mod-guard CI install gap.
See `chapter/05-carry-forward.md` CF-1.

## Carry-forward inventory (post-W3)

### Confirmed Cluster #6 carry-forwards (6 items)

See `chapter/05-carry-forward.md` for full body.

| ID | Source | Description | Priority |
|---|---|---|---|
| CF-1 | W1B.T2 C4 v1+v2 | self-mod-guard CI runtime divergence — narrow target | P1 |
| CF-2 | CF-1 paired | diagnostic instrumentation for CF-1 | P1 |
| CF-3 | Lesson #10197 elaboration | meta-lesson candidate: N-dimensional substrate | P3 |
| CF-4 | Lesson #10198 elaboration | audit-method grep adjacency check codification | P2 |
| CF-5 | W1B.T2 retro | pr-review-gate hook retirement (artemis-ii vestigial) | P3 |
| CF-6 | W1C audit doc | source-side ORDER BY tiebreaker + 4 MED-tier hookTimeout files | P4 |

### Forward lessons emitted (4)

| # | Title | Tracker status |
|---|---|---|
| #10197 | Substrate-probe discipline extends to runtime-environment substrate | OPEN |
| #10198 | Audit-method false positives surface late when grep methods don't cover all syntactic forms | OPEN |
| #10199 | Failed-CI iteration produces more reliable substrate than first-try success | OPEN |
| #10200 | Sub-agent dispatches with self-correction stages need ≥2 internal commit boundaries | OPEN |

See `04-lessons.md` for full lesson bodies + Apply patterns.

## Test counts at ship (expected)

- Rust: +3 atlas tests (C1) — LRU isolation invariant active
- TS: +9 integration tests (C2 ordering: 3; C2 inverted: 3; W3.T1 meta-test: 10 minus pre-existing) for net delta
- Tools (`vitest.tools.config.mjs`): no delta this cluster
- v1.49.638 meta-test: 10 PASS

(Final test counts will be transcribed in HANDOFF doc at T14 close.)

## Operator W0 decision summary

| Decision | Options | Recommendation | Operator chose | Routing |
|---|---|---|---|---|
| C1 atlas API shape | (a) per-project API / (b) test rewrite | (b) | **(a)** | team-lead AskUserQuestion |
| C2 STORY-gate ordering | (i) doc+invariant / (ii) refactor / (iii) procedural | (i) | **(i)** | team-lead AskUserQuestion |
| C4 CI install disposition | (a) CI install / (b) test exemption | (a) | **(a) (deferred after v1+v2)** | team-lead AskUserQuestion |

## See also

- `docs/T14-SHIP-SEQUENCE.md` — canonical T14 sequence reference (NEW at v1.49.638 C2)
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` — substrate-probe discipline reference (NEW at v1.49.638 C3)
- `docs/test-discipline/flake-audit-2026-05-11.md` — C5 flake audit doc with Stage 1/2/3 + corrections
- `.planning/HANDOFF-v1.49.638-COMPLETE.md` — flight-ops ship-state handoff (pending T14 close)
- `tests/integration/v1-49-638-meta-test.test.ts` — W3.T1 integration meta-test (10 assertions)
- `tests/integration/c2-story-gate-ordering.test.ts` — C2 ordering invariant test
- v1.49.637 release-notes at `docs/release-notes/v1.49.637/` — predecessor (cluster #4)

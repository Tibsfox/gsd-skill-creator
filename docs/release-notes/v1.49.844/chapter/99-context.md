
# v1.49.844 — Context

## Provenance

4th ship of the new operational-debt cluster. Closes the v840 deferred candidate "Verification/integration-only ships axis" by giving it a canonical-doc home (option 1 of the 3 named in the v840 forward-flag).

The v840 forward-flag explicitly enumerated the options:

> Verification/integration-only ships axis (2 instances v829 + v832) — DEFERRED v840 — no existing canonical-doc home; would need extension to `docs/meta-cadence-discipline.md` OR a new sub-doc. Next codify ship can pick this up if a 3rd instance lands.

The operator's "work through the list" instruction authorized making the canonical-doc decision; option 1 (extend meta-cadence) was the smallest semantic surgery.

## What this ship adds

```
docs/meta-cadence-discipline.md                    [MODIFIED: 3 axes → 4 axes; +new verify axis section; +verify-overdue trigger; +verify CLI subcommand mention]
tools/render-claude-md/disciplines.json            [MODIFIED: Meta-cadence entry trigger + summary + codified_at_milestone updated for verify axis]
CLAUDE.md                                          [MODIFIED: regenerated via npm run render:claude-md]
docs/release-notes/v1.49.844/                      [NEW: README + 4 chapters]
.planning/PROJECT.md                               [MODIFIED: pre-bump refresh]
```

## Recon trail

1. **Read predecessor handoff** (`.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`). Verification/integration-only ships axis listed as v840-deferred with the canonical-doc decision pending.
2. **Locate the 2 instance evidences** (v829 + v832 release-notes 04-lessons.md). Both name the same pattern: small src/ delta + substantial test infrastructure for cross-rootdir wire verification.
3. **Read `docs/meta-cadence-discipline.md`** to understand the existing 3-axis structure (codify/consume/calibrate).
4. **Decide between extension vs new sub-doc.** Extension wins on coherence (meta-cadence IS the canonical doc for operational-axis balance).
5. **Extend meta-cadence doc** with the 4th axis (definition + cadence target + evidence base), the 4th overdue trigger, and the 4th CLI subcommand mention.
6. **Extend disciplines.json Meta-cadence entry** with the verify axis in trigger + summary + codified_at_milestone history.
7. **Regenerate CLAUDE.md** via `npm run render:claude-md`.
8. **Validate JSON parses.** 23 entries.
9. **Author release notes** — 5 files (README + 4 chapters).

## Decision: extend vs new sub-doc

Three options considered (per v840 forward-flag):

| Option | Pros | Cons | Chosen |
|---|---|---|---|
| Extend `docs/meta-cadence-discipline.md` | Smallest surgery; preserves single-doc-for-axes structure; existing readers find the new content in the expected place. | Doc grows; verify-specific deep content stays interleaved with other axes. | **YES** |
| New sub-doc `docs/verification-integration-axis.md` | Verify gets its own deep treatment; can grow independently of other axes. | Two places to look for "operational axes"; breaks the "balance" framing of the parent doc. | No |
| Defer until 3rd instance | Maintains pure 2-instance-then-promote rule. | Already chosen at v840; no progress. | No |

The chosen option (extend) keeps the meta-cadence doc as the single canonical source for "balance of operational axes". If verify-specific deep content eventually exceeds what fits naturally in the meta-cadence doc, a future ship can carve out `docs/verify-axis-discipline.md` as a sub-doc that the meta-cadence section links to. For now, the meta-cadence-as-N-axis-enumeration shape generalizes cleanly to 4.

## Why the numbered-lesson promotion is still deferred

Per #10426 (second-instance threshold for codification), a candidate becomes ESTABLISHED when:
1. ≥2 instances of the pattern exist.
2. A canonical-doc home is decided.
3. A manifest entry references it as a key_lesson.
4. CLAUDE.md is regenerated to surface it.

v844 covers (2) and (4) for the verify axis. (1) is already satisfied (v829 + v832). (3) requires a numbered lesson (e.g. #10438) added to the Meta-cadence entry's `key_lessons` array. The numbering convention is "issue numbers from the GH lessons board"; for codification ships, the operator assigns the number.

This ship doesn't assign the number because codify ships and canonical-doc-decision ships are distinct: codify ships are the formal promotion moment with manifest+number; canonical-doc decision ships are structural prep. Future codify ship (~v847-850) can promote the verify axis with #10438 (or whatever next number is available) once the operator decides to do so.

## Verification trail

| Step | Result |
|---|---|
| `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` | OK; 23 entries (unchanged) |
| `npm run render:claude-md` | CLAUDE.md updated cleanly |
| `npm run build` | (not run — no source-code changes) |
| Full vitest suite | (not run — no source-code changes; suite holds at 35,261 PASS) |
| `bash tools/pre-tag-gate.sh` | (pending T14 step 1) |

## What was deferred

- **Numbered-lesson promotion for verify axis.** Per #10426, the canonical-doc + manifest entry + CLAUDE.md surface are in place; the formal numbered-lesson promotion stays deferred to the next codify ship.
- **`tests/integration/`-style integration tests for v843 mesh family.** The new verify-overdue trigger surfaces the mesh family as a future verify-ship candidate. Not addressed this ship; flagged for the ~10-ships-later check.
- **`docs/verify-axis-discipline.md` as a standalone sub-doc.** Reserved for if the verify axis grows beyond what fits in the meta-cadence doc.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + #10184 + #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- Pure documentation + manifest ship — 0 source changes, 0 test count delta.
- CLAUDE.md regen handled by `npm run render:claude-md`.
- v836 preservation gate continues to fire (8th time at v844's T14 publish step expected).

## Forward path post-v844

1. **Production caller of predict path** — next per the v840 candidates list. Substantive feature work; activates v837's auto-emit wire. v845.
2. **NASA 1.179 forward-cadence** — STRONG-DEFAULT (62 consecutive ships at 1.178 — record-widest pressure margin).
3. **Next codify ship (~v847-850)** — pickup candidates:
   - Verify axis numbered-lesson promotion (canonical-doc set this ship).
   - DI-executor + tokenized-argv wire shape (3 instances).
   - Re-throw ProcessContextDenied from CLI swallow-catch (2 instances).
   - Bidirectional enforcement completeness (still ambiguous).
4. **Future verify ship** — v843 mesh family integration test (~10 ships after v843).

## References

- Predecessor: v1.49.843 (`docs/release-notes/v1.49.843/`)
- Predecessor handoff: `.planning/HANDOFF-2026-05-27-v1.49.840-codify-ship-closed.md`
- Meta-cadence canonical doc: `docs/meta-cadence-discipline.md` (extended this ship)
- Manifest source: `tools/render-claude-md/disciplines.json`
- Manifest renderer: `tools/render-claude-md.mjs`
- v829 first instance evidence: `docs/release-notes/v1.49.829/chapter/04-lessons.md`
- v832 second instance evidence: `docs/release-notes/v1.49.832/chapter/04-lessons.md`
- Counter-cadence discipline: `docs/counter-cadence-discipline.md`
- Second-instance threshold lesson #10426: `docs/architecture-retrofit-patterns.md`

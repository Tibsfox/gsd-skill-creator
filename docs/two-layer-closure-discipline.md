# Two-Layer Closure for Procedure-Rooted Drift Classes

**Lesson #10431** — codified at v1.49.814.

## Rule

When a drift class originates from operator-discretion procedure (a multi-step
sequence the operator must remember to execute correctly), complete closure
requires **two layers**:

1. **Source eliminator** — replace the operator-discretion step with a
   deterministic tool. The tool atomically performs the work AND any
   post-condition checks.
2. **Detector gate** — a structural check (pre-commit hook, pre-tag-gate step,
   audit-test) that catches drift if a future operator bypasses the eliminator.

Either layer alone is insufficient:

- **Source eliminator without detector** — if a future operator forgets the
  tool exists or works around it (e.g., emergency hand-edit), the drift can
  re-enter undetected.
- **Detector without source eliminator** — the operator-discretion procedure
  remains the drift origin. The detector only catches it after it lands; the
  human-error window stays open.

## Case study: v805 → v806 STATE.md drift class

The pattern was first observed and named at v1.49.813:

| Layer | Ship | Mechanism |
|---|---|---|
| Source eliminator | v1.49.813 | `tools/state-md-set-shipped.mjs` — atomic-writer takes milestone metadata and emits a fully-normalized STATE.md, replacing the prior hand-edit-then-normalize procedure |
| Detector | v1.49.807 (S5) | pre-tag-gate step 0.5 post-write check on `state-md-normalizer` — catches drift if the source eliminator is bypassed |

The drift originated when an operator hand-edited STATE.md after T14 step 11
("STATE.md normalize") to set up the next milestone, without then re-running
the normalizer. v807 added the detector; v813 added the source eliminator.
Both layers shipped together as a complete closure.

## Case study: the PROJECT.md "Latest shipped release" drift class

This doc flagged the PROJECT.md case as OPEN at v813 — a detector existed but no
source eliminator, so the structured "Latest shipped release" / "Predecessor" /
"Last updated" lines were hand-edited every ship. Counter-cadence #25 closed it
at v1.49.954, the detector-first inversion of the STATE.md case:

| Layer | Ship | Mechanism |
|---|---|---|
| Detector | v1.49.785 (S5) | `tools/project-md-normalizer.mjs --check` — pre-tag-gate step 17 verifies the "Latest shipped release" version against package.json (tolerant of the predecessor patch during T14) |
| Source eliminator | v1.49.954 | `tools/project-md-normalizer.mjs --write --version --name` — narrow, prose-preserving rewrite of the three STRUCTURED lines only: rotates the current latest-shipped into Predecessor, sets the new latest-shipped, refreshes Last-updated. Idempotent + a post-condition self-check. Replaces the per-ship hand-edit |

The drift was visible twice during the v1.49.951-953 batch (two hand-edits + one
pre-tag-gate WARN). PROJECT.md is gitignored (local-only ground truth), so the
source eliminator is a LOCAL ship-sequence step; the conservative-by-design
normalizer touches no hand-authored prose, only the deterministically-derivable
structured lines.

## Case study: the release-notes 5-file scaffolding drift class

This doc flagged the release-notes case as OPEN through v957 — the completeness
check detected a malformed `docs/release-notes/<version>/` directory, but the
five files (README + four chapters) were hand-created before each tag with no
source eliminator. Counter-cadence #27 closed it at v1.49.958:

| Layer | Ship | Mechanism |
|---|---|---|
| Detector | pre-existing + v1.49.958 | `tools/release-history/check-completeness.mjs` — missing-file + under-200-byte BLOCKs (pre-tag-gate step 3); v1.49.958 adds a BLOCK for any file still carrying the scaffold-pending marker (the FILL half) |
| Source eliminator | v1.49.958 | `tools/release-history/scaffold-release-notes.mjs --write` — emits the canonical 5-file structure deterministically, prose-preserving (preserves any file with hand-authored edits — filled OR partially filled; only missing files + untouched pristine scaffolds are written), with a non-strict presence post-condition |

This case added a refinement worth carrying forward: when the eliminator emits a
fillable SKELETON rather than a finished artifact, the closure needs a ship-time
FILL gate so the skeleton cannot ship unfilled. Structure-presence (the
scaffolder's `--check`) and fill-completeness (`check-completeness --strict`) are
distinct properties on distinct surfaces — keeping them separate lets the
eliminator's post-condition be non-strict while the ship gate still refuses an
unfilled scaffold. The marker token is the single source of truth shared by the
two tools (imported, not duplicated — #10461) and is kept out of all published
release-notes prose (#10462 self-referential trap).

## When to apply

Whenever a retrospective surfaces a drift class with this shape:

- Drift originates from a multi-step operator procedure
- One specific step in the procedure is forgettable / skippable
- The drift only becomes visible at the next pipeline-gate run

Examples in scope:
- STATE.md hand-edit + normalize (closed at v813)
- PROJECT.md "Latest shipped release" hand-edit (closed at v1.49.954 —
  `project-md-normalizer.mjs --write` is the source eliminator; pre-tag-gate
  step 17 / `--check` is the pre-existing detector; see the case study below)
- Release-notes file scaffolding (any drift between v<X> dir and expected
  5-file set; detector = completeness check, source eliminator =
  `scaffold-release-notes.mjs` — closed at v1.49.958, counter-cadence #27)

Examples out of scope (single-step procedures or no detector available):
- "Run tests before pushing" — the test is the detector + the procedure;
  no operator-discretion step to eliminate
- "Update CHANGELOG before merging" — the operator step IS the value; no
  way to atomize it without losing the semantic content

## How to apply

When designing a closure for a procedure-rooted drift:

1. **Identify the drift origin step.** What specific operator action introduces
   the drift? (For STATE.md: "hand-edit a fresh STATE.md before next ship".)

2. **Build a source eliminator.** Tool that replaces the discretion step:
   - Takes the same inputs the operator would (via CLI flags or config)
   - Emits the same artifact atomically + canonical-form-checked
   - Documents exit codes and failure modes per #10427
   - Has dedicated unit tests for the content builder + e2e write-check

3. **Add or confirm the detector.** Structural check that catches bypass:
   - Pre-tag-gate step, pre-commit hook, audit-test, or pipeline assertion
   - Fails loudly with clear remediation guidance
   - Has its own tests

4. **Document both layers in T14-SHIP-SEQUENCE.md** or the relevant procedure
   doc, with cross-references between the eliminator's step and the detector's
   step.

5. **Per-ship release notes** record the closure shape: "drift class closed in
   two layers: source (this ship) + detector (prior ship)."

## Anti-patterns

- **Source eliminator that doesn't include the post-condition check.** The
  tool emits the canonical artifact but doesn't verify with the validator/
  normalizer. A future template-vs-validator drift can re-introduce drift
  without breaking the tool's exit code.
- **Detector that fails silently or only WARNs.** If the detector doesn't BLOCK
  (or at minimum FAIL the ship), the drift can land in production. WARN-only
  detectors are useful as ratchet ratchets, not as load-bearing closures.
- **Closure documented as "complete" when only one layer ships.** v807's S5
  retrospective explicitly noted the partial closure status; the operator
  should resist the temptation to call a half-closure done.

## Cross-references

- **#10414 (Gate-not-vigilance)** — this discipline is the structural version
  of gate-not-vigilance applied to procedure-rooted drift specifically.
- **#10427 (Failure-mode contracts)** — both layers must specify their failure
  contracts loudly (the source eliminator's exit codes; the detector's BLOCK/
  WARN semantics).
- **counter-cadence-discipline.md** — counter-cadence ships are the natural
  venue for source-eliminator construction. The detector typically ships earlier
  (as part of a related Strengthening Lever or audit retrospective).

## Open questions

- Should the source eliminator + detector ship together in one ship, or is
  the v807 → v813 separation (6 ships apart) acceptable? Argument for together:
  the closure is atomically complete. Argument for separation: the detector is
  cheap (~few lines of bash); the source eliminator is more substantial
  (~200 LOC + tests). Shipping in separate counter-cadence ships matches the
  size-bound discipline.

## Forward observation

This discipline is now ESTABLISHED-and-applied: three two-layer closures have
shipped — STATE.md (detector v807 / eliminator v813), PROJECT.md (detector v785
/ eliminator v954), and release-notes 5-file scaffolding (detector pre-existing /
eliminator v958). The next procedure-rooted or file-overwrite drift class should
be closed with both layers as a matter of course, treated as an application of
#10431 / #10436 rather than a new discipline. Remaining candidate:

- STATE.md `.backup-*` file accumulation (no detector; would need both layers)

## File-overwrite drift sub-class (Lesson #10436)

**Codified at:** v1.49.840 (from v813 STATE.md + v836 publish.mjs two-instance
evidence — the two-layer pattern generalizes from operator-procedure-rooted
drift to *tool-procedure-rooted file-overwrite drift*).

The two-layer shape applies cleanly to a sibling drift class: a tool blindly
overwrites destination files that may contain hand-authored content not
present in the source. The structural shape is identical — both layers
remain necessary — but the drift origin shifts from "operator forgets a
step" to "tool overwrites without checking."

### Mapping the layers

| Layer | v813 (operator-procedure drift) | v836 (file-overwrite drift) |
|---|---|---|
| Source eliminator | `tools/state-md-set-shipped.mjs` atomic writer | `chapter.mjs` `writeChapterIdempotent` + `openerMatches` (source-side preservation; existed since v1.49.585 C04) |
| Detector / destination-side preservation | `tools/pre-tag-gate.sh` step 0.5 canonical-form check | `publish.mjs` `shouldPublishToDestination` (destination-side preservation gate) |

The v836 case revealed an asymmetry: the source layer (`chapter.mjs` C04
preservation) had existed for 251 ships, but the missing destination layer
(`publish.mjs` overwrite-without-check) created drift that operators worked
around with `git checkout HEAD -- <chapters>` after each ship. The manual
recovery procedure was the alarm bell for a missing detector layer.

### When the sub-class applies

A drift class fits the file-overwrite sub-class when:

- The drift originates from a tool blindly writing a destination file (not an
  operator forgetting a step).
- The same content exists in two locations: a *source* file (where hand-edits
  are made) and a *destination* file (where the tool writes).
- The tool reads from the source and writes to the destination without
  comparing — so hand-authored content present only in the destination is
  silently destroyed.

### How to apply the sub-class

1. **Identify both file locations.** Where do hand-edits land? Where does the
   tool write?
2. **Build or confirm source-side preservation.** The source file's writer
   must compare against existing content and preserve hand-authored sections.
   For chapter scaffolds, the convention is "preserve any chapter whose
   opener line differs from the canonical opener."
3. **Build destination-side preservation.** The publish/sync tool must apply
   the same comparison rule at the destination file. The check fires per
   destination file, not just at the source.
4. **Provide an `--force-overwrite` flag** for the legitimate case (a fresh
   re-render that *should* clobber). The default is preserve.
5. **Log preserve decisions** so they accumulate visible evidence the gate is
   firing — `PRESERVED <path>` log lines per ship.

### Anti-patterns specific to this sub-class

- **Source-side preservation without destination-side.** This was the v585→v836
  state of `chapter.mjs` + `publish.mjs`: source preserved but destination
  blindly overwrote. The operator's manual recovery (`git checkout HEAD --`)
  is the smell.
- **A single combined preservation check at one of the two layers.** Source-
  only preservation lets destination-side stale renders clobber; destination-
  only preservation lets a fresh scaffold pass through and destroy source-side
  hand-edits.
- **No log lines for preserved files.** Without visible evidence the gate is
  firing, future ships can't validate the preservation contract is operating;
  9 PRESERVED log lines across v837+v838+v839 confirmed v836's gate worked
  end-to-end under sustained exercise.

### Reference implementation: v836 publish-preservation gate

The v836 implementation, validated across v837-v839:

- `tools/release-history/publish.mjs` — `shouldPublishToDestination(sourceContent, destPath, forceOverwrite)` helper, wired into per-target + toplevel publish loops.
- `tools/release-history/chapter.mjs` — pre-existing `writeChapterIdempotent` + `openerMatches` (the source-side layer; refactored at v836 to export `openerMatches` via `tools/release-history/opener-match.mjs`).
- `--force-overwrite` flag on `publish.mjs` for the legitimate re-render case.
- `files_preserved` count in publish stats output.

The destination-side gate fired 9 times across 3 subsequent ships (v837+v838+v839 T14 publish steps; 3 PRESERVED log lines per ship for `00-summary.md` + `03-retrospective.md` + `99-context.md`). No hand-authored content clobbered after v836.

### Cross-reference to #10431

This sub-class IS a #10431 application — both layers required, same shape, same
anti-patterns. The naming distinction (procedure-rooted vs file-overwrite) is
descriptive of the drift *origin*, not a structural change to the discipline.
A future ship that closes a third drift class with both layers present should
treat them as additional case studies under #10431 + #10436 rather than as
separate disciplines.

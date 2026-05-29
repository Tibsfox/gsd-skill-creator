# v1.49.910 — Counter-Cadence Codify Ship

**Released:** 2026-05-29

## Why this ship

Counter-cadence codify ship per #10428 meta-cadence (codify-axis ~7-10 ships trigger). The v903-v909 seven-chip LoaderContext campaign closed the KNOWN_UNWIRED Loader ratchet to 0 and accumulated six promotion-eligible candidates in carry-forward — but exactly ONE crossed the 3-instance ESTABLISHED bar: the class-multi-method consolidated-gate sub-variant (#10448 family), which promoted v902 → v907 → v908 inside the campaign itself. This ship formalizes that one promotion AND runs a discipline-coverage drift sweep: eight lessons that were already documented in canonical docs but never wired into the manifest (PARTIAL state) are connected to their owning entries, taking PARTIAL coverage to zero.

Doc-only ship — no source code changes; no test additions; no version-bump beyond the standard release-notes mechanics. The codified discipline harvests from existing implementations (v902 + v907 + v908 source files for #10459); the PARTIAL backfill harvests from canonical docs that already document the lessons (`tools/pre-tag-gate.sh`, `docs/MISSION-PACKAGE-DISCIPLINE.md`, `docs/sub-agent-dispatch-discipline.md`).

## What's in this ship

### Promotion (NEW ESTABLISHED)

- **`docs/architecture-retrofit-patterns.md`** UPDATED:
  - Added `class-multi-method consolidated-gate` as a new row of the #10448 shared-helper hoist sub-variant catalog table (after `class-stored hoist-at-top`).
  - Added a dedicated **#10459** section under the #10448 catalog with code skeleton, distinct-from sibling forms (#10455 single-fs-op + v904 class-instance multi-method), 3-instance evidence table, mixed-mode handling, wire mechanics, how-to-apply checklist, and two anti-patterns.
  - Added #10459 to the Lesson references list.
  - Backfilled the missing v1.49.899 (#10455) entry on the "Codified at" header line + added the v1.49.910 (#10459) entry.

### Discipline-coverage drift sweep (8 PARTIAL → 0)

Each lesson below was already present in a canonical doc but absent from any manifest `key_lessons` list (PARTIAL = "in doc, not in manifest"). Wiring the ID to its owning entry flips it to COVERED:

- **Ship pipeline** — registered `tools/pre-tag-gate.sh` as a canonical doc; added **#10176** (pre-tag-gate composite HARD RULE), **#10183** (version-sequence sanity, step 1.5), **#10188** (POSIX-ERE→depth-audit gate, step 6).
- **Mission package framing** — registered `docs/scaffold-manifest-discipline.md` as a canonical doc; added **#10364** (SPS cohort-uniqueness audit, step 14), **#10365** (scaffold-manifest hint validation), **#10401** (brief title-line trip-vocab budget).
- **Sub-agent dispatch** — added **#10391** (STORY.md newline-separator discipline; documented in `docs/sub-agent-dispatch-discipline.md`).
- **Two-layer closure for procedure-rooted drift** — added **#10373** (STATE.md normalizer drift recurrence closure; the v807+v813 case study's recurrence-soak lesson, documented in `tools/pre-tag-gate.sh` step 0.5).

### Manifest updates

- **`tools/render-claude-md/disciplines.json`** UPDATED (5 domain entries):
  - Architecture-retrofit patterns: added #10459 to key_lessons; extended summary with the consolidated-gate sub-variant; appended v1.49.910 to codified_at_milestone.
  - Ship pipeline: added pre-tag-gate.sh to canonical_docs; added #10176/#10183/#10188 to key_lessons; appended v1.49.910 PARTIAL-backfill note.
  - Mission package framing: added scaffold-manifest-discipline.md to canonical_docs; added #10364/#10365/#10401 to key_lessons; appended v1.49.910 PARTIAL-backfill note.
  - Sub-agent dispatch: added #10391 to key_lessons; appended v1.49.910 PARTIAL-backfill note.
  - Two-layer closure: added #10373 to key_lessons; appended v1.49.910 PARTIAL-backfill note.

`CLAUDE.md` regenerated from `disciplines.json` via `npm run render:claude-md` (gitignored — local-only).

## What this ship is

- A counter-cadence codify ship per #10428 codify-axis budget.
- Promotes 1 NEW lesson (#10459) to ESTABLISHED + clears 8 PARTIAL discipline-coverage entries.
- Doc-only — no source code, test code, or behavior changes.

## What this ship is not

- Not a chokepoint chip (all three Tier-E ledgers remain at KNOWN_UNWIRED 0; the Loader ratchet closed at v909).
- Not a substrate or verify-axis ship (engine state UNCHANGED except counter-cadence count + lessons count + discipline-coverage PARTIAL).
- Not a NASA degree advance (still 1.178; 128 consecutive ships at the margin record).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **128 consecutive ships** at this degree; pressure-margin record extended by 1).
**Counter-cadence count: 10 → 11** (+1; reflects this codify ship).
Manifest entries 23 (UNCHANGED).
**Lessons in manifest: 99 → 108** (+9: #10459 NEW + #10176/#10183/#10188/#10364/#10365/#10373/#10391/#10401 PARTIAL-backfill).
**Discipline-coverage PARTIAL: 8 → 0**; UNCODIFIED unchanged at 39 (ceiling 41).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 0.
Wired calibratable thresholds 7 of 7 (UNCHANGED); verify-axis 7 COVERED + 0 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `docs/architecture-retrofit-patterns.md` (UPDATED — #10459 promotion + catalog row + header backfill)
- `tools/render-claude-md/disciplines.json` (UPDATED — 5 domain entries)
- `docs/release-notes/v1.49.910/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — v910 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps 1.49.909 → 1.49.910)

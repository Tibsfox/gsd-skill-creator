# v1.49.895 — Counter-Cadence Codify Ship: #10452 + #10453 + #10454

**Released:** 2026-05-28

## Why this ship

Closing ship of the v892-v895 multi-ship session. Counter-cadence codify ship — no production code changes; doc-only. Mirrors v886's codify cadence (#10450 + #10451 promotion). Absorbs three ESTABLISHED-ready candidates accumulated during the session:

- v891 + v893 = 2 instances of substrate-wrapper pattern → **#10452 NEW LESSON**.
- v856 + v894 = 2 instances of substrate→calibration end-to-end integration test → **#10453 NEW LESSON**.
- v891 + v893 + v894 = 3 instances of `setTimeout(50ms)` fire-and-forget test-side wait → **#10454 NEW LESSON**.

Counter-cadence count: **7 → 8**. Lessons in manifest: **92 → 95**.

## What's in this ship

### Discipline doc extensions

- **`docs/bounded-learning-calibration-discipline.md`** — extended with #10452 substrate-wrapper pattern. Documents the two sub-variants (default-fixed v891 + outcome-driven v893) and the polarity-derivation discriminator. Also notes #10451 STABLE promotion (3rd instance at v888 — token_budget.max_percent).
- **`docs/meta-cadence-discipline.md`** — extended with #10453 substrate→calibration end-to-end test pattern. 7-step canonical test shape: temp dir setup → substrate write → fire-and-forget wait → calibration read → polarity assertion → missing-file → malformed-line tolerance.
- **`docs/failure-mode-contracts.md`** — extended with #10454 fire-and-forget test-side wait via `setTimeout(50ms)`. Documents why `setImmediate` is insufficient (event-loop tick vs OS-level fs scheduling) and the structural-vs-test-verified protection limit.

### CLAUDE.md regeneration

- **`tools/render-claude-md/disciplines.json`** — three discipline entries updated:
  - Bounded-learning calibration: `key_lessons: ["#10425", "#10451", "#10452"]`; summary extended with substrate-wrapper pattern + sub-variants.
  - Meta-cadence: `key_lessons: ["#10428", "#10438", "#10439", "#10453"]`; summary extended with end-to-end integration test pattern.
  - Failure-mode contracts: `key_lessons: ["#10427", "#10437", "#10442", "#10446", "#10454"]`; summary extended with fire-and-forget test-side wait pattern.
- **`CLAUDE.md`** regenerated via `npm run render:claude-md`.

## Promotion summary

| Lesson | Status | Instances | Codified |
|---|---|---|---|
| #10451 (calibrate-axis read-side recipe) | STABLE (3rd instance) | v837 + v884 + v888 | Mention in v895 |
| #10452 (substrate-wrapper pattern) | NEW ESTABLISHED | v891 + v893 | v895 |
| #10453 (substrate→calibration e2e test) | NEW ESTABLISHED | v856 + v894 | v895 |
| #10454 (setTimeout(50ms) wait) | NEW ESTABLISHED | v891 + v893 + v894 | v895 |

## What this ship is

- A counter-cadence codify ship — doc-only, no production code changes.
- Closes the v892-v895 multi-ship session.
- Absorbs 3 ESTABLISHED-ready candidates accumulated during the session.

## What this ship is not

- Not a forward-cadence ship (no NASA degree advance, no chokepoint chip, no new substrate).
- Not a counter-cadence cleanup (no gate added, no procedural debt closed).
- Pure documentation refinement — converts session-internal observations into reusable discipline patterns.

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — **113 consecutive ships** at this degree; new pressure-margin high-water mark).
**Counter-cadence count: 7 → 8.**
Manifest entries 23 (UNCHANGED).
**Lessons in manifest: 92 → 95** (+3 new ESTABLISHED).
KNOWN_UNWIRED Process / Egress / Loader UNCHANGED at 0 / 0 / 11.
Wired calibratable thresholds **7 of 7**; verify-axis coverage 6 COVERED + 1 PENDING-TEST (UNCHANGED).
Pre-tag-gate step count: 18 (UNCHANGED).

## Files touched

- `docs/bounded-learning-calibration-discipline.md` (UPDATED — #10452 + #10451 STABLE)
- `docs/meta-cadence-discipline.md` (UPDATED — #10453)
- `docs/failure-mode-contracts.md` (UPDATED — #10454)
- `tools/render-claude-md/disciplines.json` (UPDATED — 3 discipline entries)
- `CLAUDE.md` (REGENERATED via render script)
- `docs/release-notes/v1.49.895/` (NEW)
- `docs/release-notes/STORY.md` (UPDATED — chapter count + v895 entry)
- `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` (version bumps)

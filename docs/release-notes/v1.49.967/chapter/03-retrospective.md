# v1.49.967 — Retrospective

## What went right

- **Per-finding recon kept the scope honest (#10409).** The plan named this ship
  as "fix the 13 frontmatter errors," but mapping each error to its file first
  surfaced a trap: running the catalog generator to "refresh everything" would
  have swept in a large, unrelated count-badge change (chipsets 7 → 48, stale
  since 2026-04-11). Stashing the frontmatter edits and re-running the generator
  on a clean HEAD tree proved that badge drift was pre-existing, not a consequence
  of the fix — so it was reverted and left for Ship 2.1, where it belongs.
- **The catalog copy was distinguished from the live skill before editing.** The
  `cartridge-forge` SKILL.md exists twice — once as the examples/ storefront entry
  and once as the live runtime skill under `.claude/skills/`. Confirming they are
  distinct files (different inodes, the live one carrying richer activation
  frontmatter) meant the catalog edit carried zero runtime risk.
- **Field values were derived, not invented.** `origin: tibsfox` and
  `status: stable` came from the sibling gsd-skills; `first_seen: 2026-04-15` came
  from the file's git first-add date rather than a guess.

## What went well in process

- **Review scaled to risk.** This is a 14-line, validator-checked, mechanical
  metadata edit — so it was verified directly (validator 13 → 0, generator-drift
  isolation, inode check, sibling/git cross-reference) rather than with a full
  adversarial agent panel, which is reserved for the logic-bearing Ship 1.1 that
  follows it. Matching review depth to blast radius keeps the cadence moving.
- **Scope fork resolved up front.** The packaging decision (ship 0.3 and 1.1 as
  two milestones vs. one bundle) was settled with the operator before any commit,
  so the commit structure never had to be unwound.

## What to watch

- **The count-badge drift is still open.** `examples/.count-badge.md` remains
  stale (chipsets 7 → 48) and is now the headline item for Ship 2.1's catalog
  de-hardcode + re-catalog + gate work. This ship intentionally did not touch it.
- **The validator's `--strict` is not yet in pre-tag-gate.** Until Ship 2.1 gates
  `validate.mjs`, a future frontmatter regression in examples/ would not be caught
  at ship time — only by running the validator manually.
- **`test-skill` removal leaves no git trace.** Because the stray was untracked,
  its deletion is invisible to `git log`; this retrospective is the only record
  that it was removed.

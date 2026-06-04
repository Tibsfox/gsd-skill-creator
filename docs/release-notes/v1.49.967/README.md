---
title: "v1.49.967 — examples/ catalog frontmatter hygiene"
version: v1.49.967
date: 2026-06-04
summary: >
  Closes the 13 real frontmatter validation errors in the examples/ catalog
  storefront (the cartridge-forge skill copy + four department chipsets) and
  removes a local-only stray scaffolding artifact. The catalog validator now
  reports zero errors; the separate, pre-existing count-badge drift is
  deliberately left for Ship 2.1.
tags: [examples, catalog, frontmatter, hygiene, validation]
---

# v1.49.967 — examples/ catalog frontmatter hygiene

**Shipped:** 2026-06-04

The examples/ storefront catalog validator went from 13 frontmatter errors to
zero by backfilling missing required metadata fields on five artifacts.

## Why this ship

Ship 0.3 of the 2026-06-03 audit plan: stray-artifact + frontmatter hygiene.
`node examples/tools/validate.mjs` reported 13 real errors across five catalog
artifacts — the `cartridge-forge` skill copy was missing seven of the nine
required catalog fields, and four department chipset READMEs were each missing
one or two (`modified`, `first_path`). The ship was scoped tightly to *only*
those five metadata files: the catalog's separate count-badge drift (chipsets
7 → 48, last refreshed 2026-04-11) is a different, larger concern reserved for
Ship 2.1, and was deliberately left untouched so this diff stays surgical.

## What shipped

- **`examples/skills/gsd/cartridge-forge/SKILL.md`** — backfilled the seven
  missing catalog fields (`type`, `category`, `status`, `origin`, `modified`,
  `first_seen`, `first_path`) plus `superseded_by: null`. Values were derived
  from the sibling `examples/skills/gsd/*` skills (`origin: tibsfox`,
  `status: stable`) and the file's git first-add date (`first_seen: 2026-04-15`).
  This is the catalog *storefront* copy; the live runtime skill at
  `.claude/skills/cartridge-forge/SKILL.md` is a separate file (distinct inode,
  richer activation frontmatter) and was **not** touched.
- **`examples/chipsets/astronomy-department/README.md`** and
  **`.../environmental-department/README.md`** — added `modified: false` +
  `first_path`.
- **`examples/chipsets/digital-literacy-department/README.md`** and
  **`.../logic-department/README.md`** — added `modified: false`.
- Removed the local-only stray `.claude/skills/test-skill/` (a two-record
  scaffolding `tests.json`; untracked, so no git footprint — it is the
  `test-skill` scaffolding-leftover the validator already flags by name).

## Verification

- `node examples/tools/validate.mjs` → **13 → 0 errors** (304 checked, 177 clean,
  was 172).
- Confirmed the count-badge drift is pre-existing, not introduced here: running
  `catalog-gen.mjs` on a clean HEAD tree (with the frontmatter edits stashed)
  produced the identical badge change, so `examples/.count-badge.md` was reverted
  and left for Ship 2.1.
- Confirmed the live `cartridge-forge` skill is a distinct file by inode; the
  edit only changed the catalog copy.
- pre-tag-gate "all 20 checks PASS"; both the code commit and the chore(release)
  CI green.

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — normal forward `fix`)
- **Manifest lessons:** 151 (unchanged — applies #10409 per-finding-recon scope discipline; no new lesson)
- **cadence_advances:** none (not a degree advance)

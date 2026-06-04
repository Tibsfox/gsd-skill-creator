---
title: "v1.49.970 — de-hardcode examples/ catalog tooling + re-catalog storefront"
version: v1.49.970
date: 2026-06-04
summary: >
  Ship 2.1 of the 2026-06-03 audit plan: the six examples/tools catalog scripts
  each carried a frozen category allowlist that had drifted to ~19% coverage as
  the taxonomy grew to 40+ college/department domains. Category discovery is now
  structural (disk-derived via a shared catalog-core.mjs), the storefront is
  re-catalogued (badge 60/56/12/7 → 312/343/135/48, 125 new category READMEs),
  and a vitest drift-guard pins the fix.
tags: [examples, tooling, de-hardcode, catalog, drift-guard, storefront]
---

# v1.49.970 — de-hardcode examples/ catalog tooling + re-catalog storefront

**Shipped:** 2026-06-04

The `examples/` storefront silently served ~19% of itself — six tools each hardcoded the same frozen 10/8/5 category allowlist while the taxonomy grew to 40+ domains; v1.49.970 makes category discovery structural and re-catalogues the whole tree.

## Why this ship

Ship 2.1 of the 2026-06-03 core-functions audit plan (Phase 2, surface hygiene). The audit flagged that `examples/tools/install.mjs` and its five siblings (`validate`, `catalog-gen`, `generate-category-readmes`, `license-report`, `backfill-frontmatter`) each declared their own `SKILL_CATEGORIES`/`AGENT_CATEGORIES`/`TEAM_CATEGORIES` `Set` — frozen at the original 10/8/5 buckets. The library had since grown a two-tier taxonomy (workflow/infrastructure categories + 40+ college/department domains), so `install --all` served only the allowlisted slice, `validate` flagged the rest as `(unclassified)` without checking it, and the count badge + per-category READMEs froze. A storefront that silently omits four-fifths of itself is worse than a small one — both browsers and the install path trust the tooling to be complete.

## What shipped

- **De-hardcode (6 tools → one source of truth):** new `examples/tools/catalog-core.mjs` owns category discovery, which is now **structural** — a directory under `examples/<type>/` is a category unless it holds its metadata file directly (the legacy pre-Stage-2 placement). All six tools consume `discoverCategories`/`isArtifactDir` from there. Adding a new domain dir needs no code change.
- **Re-catalogued storefront:** `.count-badge.md` went from a stale `60/56/12/7` to the live **312 skills / 343 agents / 135 teams / 48 chipsets**; **125 new category READMEs** were generated (every domain now has one), with descriptions composed from a shared `DOMAIN_DESCRIPTIONS` map.
- **Three off-convention artifacts the de-hardcode surfaced, fixed:** deleted two stale top-level duplicate skills (`vision-to-mission`, `research-mission-generator` — canonical 9-field copies already live in `skills/research/`); normalized two flat-file agents (`gsd-meta/pipeline-reconciler`, `gsd-meta/quality-drift-watcher`) into the `dir/AGENT.md` convention with backfilled frontmatter; backfilled five `gsd-meta` skills (had `status: active` + six missing required fields).
- **CATEGORIES.md** rewritten as a two-tier taxonomy noting categories are now discovered structurally; **CHANGELOG.md** entry added.
- **Drift-guard:** `tests/integration/examples-catalog-parity.test.ts` pins no tool re-hardcodes an allowlist, `validate --strict` is clean over the whole tree with zero unclassified, every disk category has a README, and the badge equals the live catalog count.

## Verification

- `validate --strict` exits 0 over all **838 artifacts** (0 errors/warnings/info; was 304 checked / 127 unclassified).
- New drift-guard: 5 tests, all pass; full suite **35939 passed** (0 failed; +5 from the new test).
- `tsc --noEmit` clean; `install --all` now dry-runs the full 838-artifact tree.
- Pre-tag-gate: all 20 checks PASS. CI green on dev.
- Adversarial pre-push review (5 lenses → verify): 1 MINOR finding (a CHANGELOG field-count ambiguity), fixed in code.

## Engine state

- **NASA degree:** 1.178 (frozen — unchanged)
- **Counter-cadence count:** 29 (unchanged — forward ship, not counter-cadence)
- **Manifest lesson count:** 151 (unchanged — applies existing lessons #10409/#10417/#10448/#10461, no new promotion)

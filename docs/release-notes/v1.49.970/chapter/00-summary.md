# v1.49.970 — Summary

## The ship

Ship 2.1 of the 2026-06-03 audit plan de-hardcodes the `examples/` catalog tooling. Six scripts each carried their own frozen category allowlist (`SKILL/AGENT/TEAM_CATEGORIES` Sets) that had drifted to ~19% coverage while the taxonomy grew to 40+ college/department domains. Category discovery now lives in one place (`examples/tools/catalog-core.mjs`) and is structural — derived from disk, not an allowlist — so the storefront serves the whole tree and self-maintains as domains are added.

## What shipped

- New `examples/tools/catalog-core.mjs`; `install`, `validate`, `catalog-gen`, `generate-category-readmes`, `license-report`, `backfill-frontmatter` all consume `discoverCategories`/`isArtifactDir` from it.
- `.count-badge.md`: stale `60/56/12/7` → live **312/343/135/48**.
- **125 new category READMEs** (every domain) + `CATEGORIES.md` rewritten two-tier + `CHANGELOG.md` entry.
- Cleanup the de-hardcode surfaced: 2 stale duplicate skills deleted, 2 flat-file agents normalized to `dir/AGENT.md`, 5 `gsd-meta` skills backfilled (`status: active` → `stable` + 6 missing fields).
- `tests/integration/examples-catalog-parity.test.ts` drift-guard (gates `validate --strict` via the existing vitest step — no new pre-tag-gate shell step / denominator bump).

## Verification

- `validate --strict`: 0 errors/warnings/info over **838 artifacts** (was 304 checked, 127 unclassified).
- Full suite **35939 passed** (0 failed; +5 new); `tsc` clean; pre-tag-gate all 20 PASS; CI green on dev.
- Adversarial pre-push review: 1 MINOR finding fixed in code.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **151** (unchanged).

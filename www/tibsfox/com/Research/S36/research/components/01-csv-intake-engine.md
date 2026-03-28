# CSV Intake Engine — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 0 | **Track:** Foundation
**Model Assignment:** Haiku
**Estimated Tokens:** ~2K per artist cycle (reads 1 row; first run reads full CSV)
**Dependencies:** `components/00-shared-types.md` (ArtistProfile, ProgressLedger schemas)
**Produces:** `ArtistProfile[N]` for the current artist; `ProgressLedger` (initialized once)

---

## Objective

Parse `seattle_360_geo.csv`, generate a validated `ArtistProfile` for the current artist
(degree N), and initialize or update the `ProgressLedger`. On first run (degree=0),
processes the entire CSV to build the ledger. On subsequent runs, reads only row N.
"Done" = a valid, schema-conformant `ArtistProfile[N]` object is available in memory for
Wave 1 consumers.

---

## Context

The CSV has 360 rows (degrees 0–359) with fields: `degree, name, genre, energy, era,
neighborhood, label, lat, lon`. Some `lat` fields are empty (labels and eras are
sometimes in the lat column due to inconsistent CSV structure — see row 41 for example).
The intake engine must be robust to this inconsistency.

CSV field anomalies found during pre-analysis:
- Some rows have the `label` in the `neighborhood` column and vice versa (rows 38–41)
- `lat` is occasionally missing; use 47.6062 (Seattle default) when absent
- `lon` is occasionally missing; use -122.3321 (Seattle default) when absent
- `name` may contain parenthetical qualifiers: "(blues context)", "(acoustic context)",
  "(grunge context)", etc. — preserve the full name, but note the context tag separately

**Resumability rule:** On engine start, read `progress.json`. Find the last COMPLETE entry.
Start at `lastComplete + 1`. If `progress.json` does not exist, start at degree=0.

---

## Technical Specification

### Interfaces (from shared types)
Input: `seattle_360_geo.csv` (file path)
Output: `ArtistProfile` (see `00-shared-types.md`)

### Behavioral Requirements

**MUST:**
- Parse all 360 rows on first invocation; cache as `artist-profiles-cache.json`
- Validate every ArtistProfile against the JSON schema before emitting
- Generate slug from name (lowercase, spaces→hyphens, remove parens+content)
- Derive `curriculumDepth` from energy (1–3=foundational, 4–6=intermediate, 7–10=advanced)
- Handle missing lat/lon with Seattle defaults (47.6062, -122.3321)
- Extract context tags from parenthetical qualifiers into `contextTag` field
- Emit one ArtistProfile per call (current degree only)

**MUST NOT:**
- Silently skip rows with parsing errors — raise and log the error, then continue
- Store `isDeceased` or `isLiving` — these are set by Safety Warden
- Re-parse the entire CSV on every call if cache exists

**Edge cases:**
- Degree out of range (< 0 or > 359): throw `RangeError`
- Duplicate degree in CSV: log warning, use first occurrence
- Empty name field: throw `ValidationError`

### Implementation Notes

Use `papaparse` (Node.js) for CSV parsing with `header: true` config.
JSON schema validation via `ajv` (Ajv v8). Cache to `engine-state/artist-profiles-cache.json`.

---

## Implementation Steps

1. Install `papaparse`, `ajv`, `ajv-formats` if not present.
2. Write `src/intake/parse-csv.ts` — reads CSV, returns raw row objects.
3. Write `src/intake/transform-row.ts` — maps raw row → `ArtistProfile` with:
   - slug generation (import from `types/slug.ts`)
   - curriculumDepth derivation (import from `types/curriculum-depth.ts`)
   - contextTag extraction from parenthetical (regex: `/\(([^)]+)\)/`)
   - lat/lon defaults
4. Write `src/intake/validate-profile.ts` — AJV validation against `artist-profile.schema.json`
5. Write `src/intake/cache.ts` — read/write `engine-state/artist-profiles-cache.json`
6. Write `src/intake/progress.ts` — read/write/update `releases/seattle-360/progress.json`
7. Write `src/intake/index.ts` — main export: `getArtistProfile(degree: number): ArtistProfile`
8. Write unit tests in `src/intake/__tests__/`
9. Run `npx tsc --noEmit`; run tests

---

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| CI-01 | degree=0 | ArtistProfile with name="Quincy Jones", degree=0, genre="Jazz" | Exact field match |
| CI-02 | degree=359 | ArtistProfile with name="Unwound", degree=359 | Exact field match |
| CI-03 | degree=36 | slug="jimi-hendrix-blues-context", contextTag="blues context" | Slug + tag extracted |
| CI-04 | degree=8 (Gary Peacock, energy=1) | curriculumDepth="foundational" | Correct depth |
| CI-05 | Row with missing lat | lat=47.6062 (default applied) | Default used silently |
| CI-06 | degree=-1 | RangeError thrown | Error class correct |
| CI-07 | Second call, cache exists | Cache read, not CSV re-parsed | Log shows "cache hit" |
| CI-08 | progress.json shows degree=49 complete | getArtistProfile(50) called | Returns degree=50 profile |

## Verification Gate

- [ ] `getArtistProfile(0)` returns Quincy Jones profile, schema-valid
- [ ] `getArtistProfile(359)` returns Unwound profile, schema-valid
- [ ] All 360 profiles generate without error (batch validation run)
- [ ] `npx tsc --noEmit` exits 0
- [ ] Cache file written on first run; subsequent runs use cache (log verification)
- [ ] Progress ledger initialized with 360 PENDING entries on first run

## Safety Boundaries

No domain-specific safety boundaries. Do not set `isDeceased`/`isLiving` — that is the
Safety Warden's responsibility based on professional research.

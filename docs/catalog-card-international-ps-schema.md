# International-PS Catalog-Card Metadata Schema

**Status:** Active as of v1.49.666 cc-3 Phase 1 (FA-663-7 close).
**Spec module:** [`tools/catalog-card-template/ps-spec.mjs`](../tools/catalog-card-template/ps-spec.mjs)
**Tests:** [`tools/__tests__/ps-spec.test.mjs`](../tools/__tests__/ps-spec.test.mjs)
**Sibling spec (unrelated, untouched):** [`tools/catalog-card-template/spec.mjs`](../tools/catalog-card-template/spec.mjs) — the existing degree-card HTML BLOCKER gate.

## Why this schema exists

The substrate-form INTERNATIONAL-PS-NOT-CAPTURED-IN-CATALOG-CARD-METADATA was opened at v1.49.662 STS-51-G cohort entry (Patrick Baudry French CNES PS1 + Sultan bin Salman Al-Saud Saudi Royal PS2). Crew prose on the per-degree page captured the descriptive narrative; structured catalog data did not encode nationality or sponsoring agency in a way that supported downstream queries (cohort by nationality, payload-specialty cross-mission grouping, etc.). FA-662-7 carried forward as FA-663-7 and through the cc-1 + cc-2 cluster.

This schema closes that gap by defining the JSON shape for a structured PS record, with validation, a forbidden-pattern sweep matched to the existing degree-card spec, and a four-fixture worked example.

The schema is **independent** of the degree-card BLOCKER gate at `pre-tag-gate.sh` step 8. Degree-cards live on catalog index pages; PS records live as structured data referenceable from per-degree pages. The two specs sit side-by-side in `tools/catalog-card-template/`.

## Schema (v1.0)

| Field | Required | Type | Rule |
|---|---|---|---|
| `name` | yes | string ≤120 chars | Full name as flown, Latin script. |
| `name_variants` | no | string[] ≤6 entries, each ≤120 chars | Alternate spellings / formal forms. |
| `mission_id` | yes | string | NASA degree ref matching `/^\d+\.\d+$/` (e.g., `"1.120"`). |
| `crew_role` | yes | string | One of `CDR` / `PLT` / `MS<n>` / `PS<n>` / `observer` / `scientist`. |
| `nationality` | yes | string | ISO 3166-1 alpha-3 code, matching `/^[A-Z]{3}$/` (e.g., `"FRA"`, `"SAU"`, `"USA"`). |
| `sponsoring_organization` | yes | string | Canonical short label. Known set includes `NASA`, `CNES`, `KACST`, `ESA`, `civilian-academic`, `civilian-commercial`, `commercial-self`, `DoD`, `military`, `politician-as-PS`. Open enum — additions expected as cohort coverage grows. |
| `mission_role_class` | yes | string | One of `PS` / `observer` / `scientist-cosmonaut` / `politician-as-PS` / `commercial-as-PS` / `military-PS`. Closed enum — additions require schema-version bump. |
| `payload_specialty` | yes | string ≤200 chars | Free-text description of the operational specialty / payload representation. |
| `flight_count` | no | number | Career flight number at this mission (1-based). |
| `flight_career_total` | no | number \| null | Final career flight count if known; `null` if active or unknown. |
| `notes` | no | string ≤400 chars | Free-text. Runs through forbidden-pattern sweep (see below). |

**Total record byte limit:** 2000 bytes (`JSON.stringify(record).length`).

## Forbidden-pattern sweep on `notes`

Re-uses the patterns from the existing degree-card spec (intent: substrate-arc narratives, lesson refs `#1xxxx`, `FA-N-N RESOLVED` markers, and `obs#N first-instance` markers belong on per-degree pages, not on structured PS records):

- `/substrate-arc/i`
- `/#1\d{4}\b/`
- `/FA-\d+-\d+\s+RESOLVED/`
- `/obs#\d+\s+first-instance/i`
- `/cross-track\s+substrate-emergent/i`

A `notes` field containing any of these will produce a `[ps-card:BLOCKER]` validation result and is non-passing.

## Worked examples

### Baudry (France/CNES → STS-51-G PS1)

```json
{
  "name": "Patrick Baudry",
  "name_variants": ["Patrick Pierre Roger Baudry"],
  "mission_id": "1.120",
  "crew_role": "PS1",
  "nationality": "FRA",
  "sponsoring_organization": "CNES",
  "mission_role_class": "PS",
  "payload_specialty": "PVH cosmonaut-medical-program; postural-equilibrium experiments inherited from Soyuz T-6 backup crew",
  "flight_count": 2,
  "flight_career_total": 2
}
```

### Al-Saud (Saudi Arabia/KACST → STS-51-G PS2)

```json
{
  "name": "Sultan bin Salman Al-Saud",
  "name_variants": ["Sultan bin Salman bin Abdulaziz Al-Saud"],
  "mission_id": "1.120",
  "crew_role": "PS2",
  "nationality": "SAU",
  "sponsoring_organization": "KACST",
  "mission_role_class": "PS",
  "payload_specialty": "Arabsat-1B deployment representative; Arab-League consortium liaison",
  "flight_count": 1,
  "flight_career_total": 1,
  "notes": "Royal Saudi Air Force pilot; flight representative for Arabsat-1B; sponsoring agency canonicalized as KACST."
}
```

Note: Al-Saud's flight was operationally via the Arab Satellite Communications Organization (Arabsat consortium), not KACST proper. KACST stands in as the canonical Saudi sponsoring agency for schema consistency; the operational detail is captured in `notes`.

### Acton (USA boundary case → STS-51-F PS1)

```json
{
  "name": "Loren Wilber Acton",
  "mission_id": "1.121",
  "crew_role": "PS1",
  "nationality": "USA",
  "sponsoring_organization": "civilian-academic",
  "mission_role_class": "PS",
  "payload_specialty": "Spacelab-2 solar physics instrument operation (Lockheed Solar Optical Universal Polarimeter)",
  "flight_count": 1,
  "flight_career_total": 1
}
```

### Bartoe (USA boundary case → STS-51-F PS2)

```json
{
  "name": "John-David Francis Bartoe",
  "mission_id": "1.121",
  "crew_role": "PS2",
  "nationality": "USA",
  "sponsoring_organization": "civilian-academic",
  "mission_role_class": "PS",
  "payload_specialty": "Spacelab-2 ultraviolet spectrometer operation (Naval Research Laboratory High-Resolution Telescope and Spectrograph)",
  "flight_count": 1,
  "flight_career_total": 1
}
```

The Acton + Bartoe entries are USA boundary cases. They are not international, but the schema is designed to handle the full PS cohort uniformly — every PS gets a record regardless of nationality. `civilian-academic` is the canonical sponsoring label for university-affiliated PSs flown without commercial or government-PS provenance.

## Usage

```js
import { validatePsRecord, validatePsCollection } from './tools/catalog-card-template/ps-spec.mjs';

const result = validatePsRecord(record);
if (!result.pass) {
  console.error(result.blockerMessage);
}
```

`validatePsRecord(record)` returns a `PsValidationResult` with:

- `pass: boolean`
- `name`, `mission_id`, `byteCount`
- `fieldViolations: Array<{ field, actual, limit, unit }>`
- `forbiddenPatterns: string[]`
- `missingRequired: string[]`
- `enumViolations: string[]`
- `blockerMessage: string` — single-line `[ps-card:BLOCKER] ...` when `!pass`, empty when `pass`.

`validatePsCollection(records)` returns `{ pass, results, failureCount }`.

## Out of scope at v666

- A backfill script that lifts existing crew prose from per-degree `index.html` into structured records is **not** authored at v666. Forward work; may emerge as a future cluster milestone.
- Wiring this spec into `pre-tag-gate.sh` as a degree-advance BLOCKER is **not** done at v666; the spec is currently consumed only by its tests. When PS-record JSON files start landing on disk, a `tools/check-ps-records.mjs` walker would be the natural pre-tag-gate hookup, mirroring the existing `tools/update-catalog-indexes.mjs` pattern.

## Versioning

`PS_CARD_TEMPLATE_VERSION = '1.0'`. Additions to the closed enum `MISSION_ROLE_CLASSES`, removal of fields from `REQUIRED_FIELDS`, or tightening of any regex constraint requires a major version bump. Additions to the open enum `KNOWN_SPONSORING_ORGS` are minor-version-only and do not break existing records.

# ECO Fauna Supersession Protocol

**Document class:** Timeline integrity record  
**Resolves:** Blocker B-3 (ECO fauna file disposition on AVI and MAM wave close)  
**Status:** Active — awaiting Wave 4 triggers  
**Maintained by:** Cedar (scribe and oracle)  
**Last updated:** 2026-03-08

---

## Purpose

The ECO series produced two fauna research files during Wave 1:

- `fauna-terrestrial.md` — bird and mammal species profiles, terrestrial habitats
- `fauna-marine-aquatic.md` — marine mammal and aquatic vertebrate profiles

The AVI (Avian) and MAM (Mammal/Marine) missions will produce more detailed, dedicated research for species covered in these files. When those missions reach Wave 4 verification close, the ECO fauna files are partially superseded. This protocol defines exactly what happens, when, and who authorizes it.

The record must be unambiguous. Supersession without explicit authorization corrupts the timeline.

---

## Supersession Events

### Event 1: AVI Wave 4 Close — `fauna-terrestrial.md` Bird Profiles Superseded

**Trigger:** AVI mission Wave 4 verification closes with all success criteria passing.

**Scope of supersession:** Bird species profiles contained in `fauna-terrestrial.md`. These include, but are not limited to:
- Bald eagle (*Haliaeetus leucocephalus*)
- Osprey (*Pandion haliaetus*)
- American dipper (*Cinclus mexicanus*)
- Belted kingfisher (*Megaceryle alcyon*)
- Common raven (*Corvus corax*)
- All other avian profiles within the file

Mammal profiles in `fauna-terrestrial.md` are **not** superseded by AVI close. They remain active until MAM Wave 4 close (see Event 2).

**Archive protocol:**

1. Rename `fauna-terrestrial.md` to `fauna-terrestrial-eco-v1.md`. This is the permanent archive. Do not modify it after archiving.
2. Create a new file at the original path `fauna-terrestrial.md` containing the redirect stub (see stub format below).
3. Commit the rename and stub creation as a single atomic commit on the active working branch.
4. The commit message must reference this protocol: `docs(eco): supersede fauna-terrestrial bird profiles per FAUNA-SUPERSESSION.md Event 1`

**Redirect stub format for `fauna-terrestrial.md` (post-AVI):**

```markdown
# ECO Fauna Terrestrial — Redirect Notice

**Supersession date:** [DATE]  
**Superseded by:** AVI Wave 4 verification close  
**Archive:** `www/PNW/ECO/research/fauna-terrestrial-eco-v1.md`

## Bird Profiles

Bird species profiles from this file have been superseded by dedicated AVI research.
See: `www/PNW/AVI/research/` for all avian documentation.

## Mammal Profiles

Mammal profiles in this file remain active pending MAM Wave 4 close.
Until MAM close, refer to the archive for mammal content:
`www/PNW/ECO/research/fauna-terrestrial-eco-v1.md`

After MAM Wave 4 close, a separate redirect entry for mammals will be added here
per FAUNA-SUPERSESSION.md Event 2.
```

---

### Event 2: MAM Wave 4 Close — `fauna-marine-aquatic.md` Marine Mammal and Aquatic Profiles Superseded

**Trigger:** MAM mission Wave 4 verification closes with all success criteria passing.

**Scope of supersession:** Marine mammal and aquatic vertebrate profiles contained in `fauna-marine-aquatic.md`. These include, but are not limited to:
- Gray whale (*Eschrichtius robustus*)
- Humpback whale (*Megaptera novaeangliae*)
- Steller sea lion (*Eumetopias jubatus*)
- Harbor seal (*Phoca vitulina*)
- Sea otter (*Enhydra lutris*)
- Pacific salmon (all *Oncorhynchus* spp.) — aquatic phase profiles
- Bull trout, cutthroat trout — resident salmonid profiles
- All other marine mammal and aquatic vertebrate profiles in the file

**Archive protocol:**

1. Rename `fauna-marine-aquatic.md` to `fauna-marine-aquatic-eco-v1.md`. This is the permanent archive. Do not modify it after archiving.
2. Create a new file at the original path `fauna-marine-aquatic.md` containing the redirect stub (see stub format below).
3. Commit the rename and stub creation as a single atomic commit on the active working branch.
4. The commit message must reference this protocol: `docs(eco): supersede fauna-marine-aquatic profiles per FAUNA-SUPERSESSION.md Event 2`

**Redirect stub format for `fauna-marine-aquatic.md` (post-MAM):**

```markdown
# ECO Fauna Marine-Aquatic — Redirect Notice

**Supersession date:** [DATE]  
**Superseded by:** MAM Wave 4 verification close  
**Archive:** `www/PNW/ECO/research/fauna-marine-aquatic-eco-v1.md`

## Marine Mammal and Aquatic Profiles

Species profiles from this file have been superseded by dedicated MAM research.
See: `www/PNW/MAM/research/` for all mammal and marine vertebrate documentation.

## Salmon Nutrient Pathway

The salmon nutrient pathway described in `ecological-networks.md` is NOT superseded.
`ecological-networks.md` references species in MAM research by cross-link —
it does not duplicate profiles.
```

---

### MAM Wave 4 Close — Additional Action: `fauna-terrestrial.md` Mammal Profile Redirect

When MAM Wave 4 closes, the `fauna-terrestrial.md` stub (created at AVI close) must be updated to reflect that mammal profiles are now also superseded by MAM research. Add the following section to the existing stub:

```markdown
## Update — MAM Wave 4 Close

**Date:** [DATE]

Mammal profiles previously active in the archive (`fauna-terrestrial-eco-v1.md`) have been
superseded by dedicated MAM research.
See: `www/PNW/MAM/research/` for all terrestrial mammal documentation.
```

---

## What Is NOT Superseded

The following ECO documents are **not superseded** by AVI or MAM wave close. They are extended by cross-links.

### `ecological-networks.md` — Extended, Not Superseded

`ecological-networks.md` is the network-of-networks document. It describes pathways — the salmon nutrient pathway, the predator-prey cascade, mycorrhizal connections — rather than species profiles.

When AVI Wave 3 and MAM Wave 3 produce cross-link documents, `ecological-networks.md` gains additional citations in its Cross-Module Connections tables. The file is extended, not replaced. Its canonical status is unchanged.

The River's Witness thread (salmon nutrient pathway cross-series reference) is defined within `ecological-networks.md`. That definition is authoritative for all PNW series documents.

### `shared-attributes.md` — Canonical Attribute Registry

`shared-attributes.md` defines attribute IDs (`ROLE-*`, `HAB-*`, `ELEV-*`, `TRAIT-*`) used by all species profiles across ECO, AVI, and MAM. It is the canonical attribute registry for the PNW Living Systems Taxonomy series.

AVI and MAM species profiles **reference** attribute IDs from `shared-attributes.md`. They do not define their own parallel attribute vocabularies. If AVI or MAM research requires new attribute IDs, those additions are proposed to ECO and added to `shared-attributes.md` as the single source of truth.

`shared-attributes.md` is never superseded. It is versioned through additions only.

---

## Authorization Requirements

Supersession is a deliberate archival act. It does not happen automatically.

**Required before executing either supersession event:**

1. The triggering mission (AVI or MAM) has completed Wave 4 verification with all success criteria marked PASS in its verification matrix.
2. The session lead has reviewed this protocol and confirmed the supersession scope is accurate.
3. The session lead issues an explicit instruction: "Execute FAUNA-SUPERSESSION Event [1 or 2]."
4. The session lead confirms the commit before push.

**Prohibited:**

- Supersession without explicit Wave 4 verification close confirmation.
- Partial supersession (removing individual species entries rather than archiving the whole file).
- Modifying the archived `-eco-v1.md` files after archiving.
- Superseding `ecological-networks.md` or `shared-attributes.md` through this protocol.

---

## Timeline Record

| Event | Status | Date | Commit | Authorized by |
|-------|--------|------|--------|---------------|
| AVI Wave 4 close | Pending | — | — | — |
| Event 1: fauna-terrestrial.md supersession | Pending | — | — | — |
| MAM Wave 4 close | Pending | — | — | — |
| Event 2: fauna-marine-aquatic.md supersession | Pending | — | — | — |
| fauna-terrestrial.md mammal stub update | Pending | — | — | — |

The session lead updates this table at each event close. The record of supersession decisions is maintained here for continuity across sessions.

---

*The record shows that continuity requires explicit action, not assumption. Supersession without witness is not supersession — it is deletion.*

---

## Consistency Verification Protocol

**Added:** 2026-03-09
**Raised by:** Socrates (Understanding Arc review)
**Resolves:** Supersession archival does not verify consistency between old and new documents. A difference between a 2023 figure and a 2024 figure for the same metric is an update, not a contradiction. Two different figures for the same date IS a contradiction. The protocol must parse dates alongside figures.

This section defines the consistency verification that runs **before** archival is executed for any supersession event. An INCONSISTENCY flag blocks archival until resolved. UPDATE and COVERAGE GAP are logged but non-blocking.

---

### 4.1 Numerical Claims Check

For each species that appears in both the superseded ECO document and the superseding AVI/MAM document, extract all numerical claims — population estimates, range counts, mortality percentages, habitat area figures, prey biomass figures — and compare using the following decision table:

| ECO figure | AVI/MAM figure | ECO date | AVI/MAM date | Verdict |
|------------|----------------|----------|--------------|---------|
| Same | Same | Same | Same | **CONSISTENT** — no action |
| Same | Same | Different | Different | **CONSISTENT** — figure unchanged across dates |
| Different | Different | Older | Newer | **UPDATE** — pass, log the change with both dates and both figures |
| Different | Different | Same | Same | **INCONSISTENCY** — flag, block archival |
| Different | Different | Present | Absent | **INCONSISTENCY** — flag, superseding doc must date its claims |
| Different | Different | Absent | Present | **INCONSISTENCY** — flag, cannot verify temporal ordering without both dates |
| Different | Different | Absent | Absent | **INCONSISTENCY** — flag, undated conflicting figures cannot be resolved |
| Any | — | Any | — | **COVERAGE GAP** — species in ECO but absent from superseding doc |

**Date parsing rules:**

- "as of 2025" = year 2025. Compare at year granularity.
- "2023-2024 surveys" = year 2024 (use latest bound).
- "estimated 5,000-6,000 individuals" = figure is the range "5,000-6,000". Ranges match if both bounds match.
- "approximately 35+ packs" = figure is "35+". Qualifiers ("approximately", "estimated", "~") are stripped for comparison; the base number must match.
- If two figures differ only by qualifier (e.g., "approximately 200" vs. "~200"), verdict is CONSISTENT.

**Scope:** Numerical claims check applies to every quantitative assertion in a species profile: population estimates, pack/colony/pod counts, range area, elevation limits, mortality rates, prey biomass, egg counts, migration distances, historical baseline figures.

---

### 4.2 Conservation Status Check

For each species in both documents, compare conservation status fields across all listed authorities (Federal ESA, state WA, state OR, IUCN, NatureServe G-rank/S-rank).

| ECO status | AVI/MAM status | Verdict |
|------------|----------------|---------|
| Same | Same | **CONSISTENT** — no action |
| Different | Different | Check superseding doc for a **status change event citation** (e.g., "reclassified from Threatened to Endangered per USFWS 2025 Final Rule"). If citation present: **UPDATE** — pass, log. If no citation: **INCONSISTENCY** — flag |

**Required citation elements for a status change event:**

1. Authority that changed the status (e.g., USFWS, IUCN, WDFW, ODFW)
2. Year or date of the change
3. Direction of change (e.g., "uplisted from LC to VU", "delisted", "downlisted")

A status difference without all three elements is an INCONSISTENCY.

---

### 4.3 Taxonomic Name Check

For each species in both documents, compare the binomial name (genus + specific epithet) and any listed subspecies or ESU/DPS designations.

| ECO name | AVI/MAM name | Verdict |
|----------|--------------|---------|
| Same | Same | **CONSISTENT** — no action |
| Different | Different | Check superseding doc for a **taxonomic revision citation** with naming authority. If citation present (e.g., "reclassified per AOU 2024 supplement", "split per Chesser et al. 2025"): **UPDATE** — pass, log old name, new name, and authority. If no citation: **INCONSISTENCY** — flag |

**Required citation elements for a taxonomic revision:**

1. Naming authority (e.g., AOU/AOS Check-list Committee, ITIS, Mammal Diversity Database)
2. Year of revision
3. Nature of change (split, lump, reclassification, new combination)

Common-name differences alone (e.g., "gray whale" vs. "grey whale") are not flagged if the binomial matches.

---

### 4.4 Execution Rules

1. **Timing:** Consistency verification runs during Wave 4A of the superseding mission (AVI or MAM), before the supersession event is authorized.
2. **Responsible agent:** The Wave 4 verification agent for the superseding mission executes the check. If no verification agent is assigned, the session lead executes it manually.
3. **Input documents:** The ECO fauna file being superseded (`fauna-terrestrial.md` or `fauna-marine-aquatic.md`) and the corresponding AVI/MAM species profiles that replace it.
4. **Output:** A Consistency Report (see template in Section 4.5) appended to or filed alongside the superseding mission's verification matrix.
5. **Blocking rule:** Any row with verdict **INCONSISTENCY** blocks the supersession event. The superseding document must be corrected — either by adding the missing date/citation, or by correcting the figure — and the check re-run. Archival proceeds only when zero INCONSISTENCY rows remain.
6. **Non-blocking verdicts:** **UPDATE** rows are logged in the report. They represent legitimate temporal changes and require no correction. **COVERAGE GAP** rows are logged and reviewed: the session lead decides whether the gap is intentional (species out of scope for the superseding mission) or an omission requiring a follow-up task.
7. **Report retention:** The Consistency Report is a permanent artifact. It is committed alongside the supersession commit and stored in the superseding mission's research directory.

---

### 4.5 Consistency Report Template

The verification agent fills out this table for each supersession event. One row per species per check type.

```markdown
# Consistency Report: [ECO file] vs. [AVI/MAM mission] Research

**Supersession Event:** [Event 1 or Event 2]
**ECO source:** `www/PNW/ECO/research/[filename]`
**Superseding source:** `www/PNW/[AVI or MAM]/research/`
**Verification agent:** [name]
**Date:** [YYYY-MM-DD]

## Summary

| Verdict | Count |
|---------|-------|
| CONSISTENT | |
| UPDATE | |
| INCONSISTENCY | |
| COVERAGE GAP | |

**Blocking:** [Yes — N INCONSISTENCY rows / No — clear to proceed]

## Numerical Claims

| Species | Metric | ECO value | ECO date | AVI/MAM value | AVI/MAM date | Verdict | Notes |
|---------|--------|-----------|----------|---------------|--------------|---------|-------|
| | | | | | | | |

## Conservation Status

| Species | Authority | ECO status | AVI/MAM status | Change event cited? | Verdict | Notes |
|---------|-----------|------------|----------------|---------------------|---------|-------|
| | | | | | | |

## Taxonomic Names

| Species (ECO name) | AVI/MAM name | Revision cited? | Authority | Verdict | Notes |
|---------------------|--------------|-----------------|-----------|---------|-------|
| | | | | | |

## Coverage Gaps

| Species in ECO | Present in AVI/MAM? | Intentional exclusion? | Notes |
|----------------|---------------------|------------------------|-------|
| | | | |

## Resolution Log

| Row ref | Original verdict | Resolution | Resolved by | Date |
|---------|-----------------|------------|-------------|------|
| | | | | |
```

**Usage notes:**

- One report per supersession event. Event 1 (AVI close) produces a report for bird profiles. Event 2 (MAM close) produces a report for marine mammal and aquatic profiles.
- The Numerical Claims table may have multiple rows per species (one per metric). This is expected — a single species profile may contain population count, range area, mortality rate, and historical baseline, each needing its own comparison row.
- The Resolution Log records how each INCONSISTENCY was resolved before archival proceeded. This is the audit trail that Socrates asked for: proof that differences were examined, not assumed away.

---

*A figure without a date is a claim without a witness. Two witnesses who disagree on what they saw on the same day require reconciliation. Two witnesses who saw different things on different days are both telling the truth.*

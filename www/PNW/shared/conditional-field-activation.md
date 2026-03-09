# Conditional Field Activation Protocol

> **PNW Research Series -- Cross-Taxonomy Verification Infrastructure**
>
> This document defines the verification path for conditional fields: schema fields that activate only when a taxonomic precondition is met. A verification agent cannot simply check whether a field is present or absent. It must first determine whether the field *should* be present, then verify presence, then validate the value. This two-step verification (precondition check, then field check) requires its own explicit protocol.
>
> **Design principle:** The activation condition must be machine-parseable from the species profile's Taxonomy table. If the Taxonomy table is missing, malformed, or uses non-canonical values, no conditional check can fire and the profile must be flagged for structural repair before conditional verification proceeds.
>
> **Scope:** All conditional fields identified across AVI and MAM taxonomies. Extensible to future taxonomies (fungi, flora, invertebrate) by adding rows to the activation table.

---

## 1. Purpose and Design Principle

### Why conditional fields need their own verification path

A mandatory field is binary: present or absent. A verification agent checks for presence and reports. A conditional field introduces a third state: *not applicable*. The verification agent must distinguish between three outcomes:

1. **Condition met, field present, value valid** -- PASS
2. **Condition met, field absent or value invalid** -- FAIL (severity depends on safety gate assignment)
3. **Condition not met, field absent** -- PASS (correct omission)
4. **Condition not met, field present** -- WARNING (unnecessary field; may indicate taxonomy error or over-application)

Outcome 4 is the false-positive case. A verification agent that does not understand activation conditions will either (a) flag every profile missing WNS Status as a failure (false positive on non-Chiroptera), or (b) skip WNS Status entirely and miss real omissions (false negative on Chiroptera). Both errors compromise the verification matrix.

### Precision requirement

The activation condition must resolve from data already present in the species profile. Specifically:

- The **Order** field in the Taxonomy table determines activation for order-level conditions (Chiroptera, Artiodactyla/Cetacea).
- The **Family** field determines activation for family-level conditions (Mustelidae for sea otter MMPA exception).
- The **Species** field determines activation for species-level conditions (Orcinus orca ecotype table).
- The **Residency Status** or **Migration strategy** field determines activation for behavioral conditions (migratory birds).

If the field used as activation key is missing from the profile, the conditional check cannot fire. This is a structural failure, not a conditional-field failure, and must be reported separately.

---

## 2. Conditional Field Activation Table

The following table defines every known conditional field across AVI and MAM taxonomies. Each row specifies exactly what a verification agent needs: trigger, required fields, valid values, failure action, and safety gate linkage.

| Conditional Field | Taxonomy | Activation Condition | Required When | Valid Values | Verification Action on Absence | Safety Gate |
|---|---|---|---|---|---|---|
| WNS Status | MAM | Order = Chiroptera | Every bat species profile | `present`, `not-detected`, `not-susceptible`, `unknown` | **BLOCK** -- H-9 safety-critical. Log species name, report as missing safety field. | H-9 |
| WNS Risk Tier | MAM | Order = Chiroptera | Every bat species profile where WNS Status = `present` or `not-detected` | `high` (cave hibernator), `moderate` (mixed roost), `low` (tree roost, limited cave use) | **WARNING** -- risk stratification absent. Log for editorial follow-up. | H-9 (secondary) |
| WNS Notes | MAM | Order = Chiroptera | Every bat species profile | Free text: detection year, susceptibility assessment, monitoring status | **WARNING** -- context absent but WNS Status alone is sufficient for safety gate. | -- |
| MMPA Stock | MAM | Order = Artiodactyla (Cetacea) OR Family = Otariidae OR Family = Phocidae OR Species = *Enhydra lutris* | Every cetacean, pinniped, and sea otter profile | Official NOAA stock name string (e.g., "Eastern North Pacific Southern Resident") | **BLOCK** -- SC-MMP safety-critical. Profile lacks required legal designation. | SC-MMP |
| MMPA Managing Agency | MAM | Same as MMPA Stock | Every cetacean, pinniped, and sea otter profile | `NOAA Fisheries` (cetaceans, pinnipeds) or `USFWS` (sea otter) | **BLOCK** -- SC-MMP. Jurisdictional assignment missing. | SC-MMP |
| MMPA Stock Status | MAM | Same as MMPA Stock | Every MMPA-managed species profile | `strategic`, `non-strategic`, `depleted` | **BLOCK** -- SC-MMP. Stock status missing. | SC-MMP |
| PBR (Potential Biological Removal) | MAM | MMPA Stock field is present AND Stock Status = `strategic` or `depleted` | Strategic or depleted stocks | Numeric value with source citation, or `not calculated` with justification | **WARNING** -- PBR is a key management metric but absence does not block safety. | -- |
| Ecotype Table | MAM | Species = *Orcinus orca* | Every orca profile | Table with columns: Ecotype, Proposed Taxonomy, Population, Pod Structure, Primary Prey, Cultural Significance | **BLOCK** -- CF-06. Orca profiles without ecotype differentiation conflate biologically distinct populations. | CF-06 |
| Ecotype Field | MAM | Species = *Orcinus orca* OR Species = *Phoca vitulina* (harbor seal with documented ecotype variation) | Orca profiles (mandatory), harbor seal profiles (optional) | Orca: `resident`, `Bigg's (transient)`, `offshore`. Harbor seal: `coastal`, `inland` | **BLOCK** for orca (CF-06). **LOG** for harbor seal. | CF-06 (orca) |
| Critical Habitat Designation | MAM | MMPA Stock field is present OR ESA Status != `Not listed` | All MMPA-managed and ESA-listed species | `yes` (with Federal Register citation), `no`, `proposed` | **WARNING** -- important legal context but absence is not a safety block. | -- |
| Haul-out Site Regions | MAM | Family = Otariidae OR Family = Phocidae | All pinniped profiles | Generalized location (county/watershed level; NEVER GPS or specific site names for ESA-listed species) | **WARNING** -- expected field for pinnipeds. | SC-END (safety review if present -- verify no GPS coordinates) |
| Hibernation/Torpor Pattern | MAM | Order = Chiroptera OR Family = Sciuridae (marmots, ground squirrels) OR Species with documented hibernation | Species with documented hibernation or torpor | `true hibernator`, `torpor`, `daily torpor`, `no hibernation`, `unknown` | **WARNING** -- ecological context absent. Not safety-critical. | -- |
| Migration Fields (Spring Arrival, Fall Departure, Wintering Range, Staging Areas) | AVI | Residency Status = `Summer Breeder` OR `Winter Visitor` OR `Passage Migrant` | All migratory bird profiles | Date ranges (Spring arrival, Fall departure), geographic descriptions (Wintering range), named locations (Staging areas) | **WARNING** -- CF-07. Migration timing data expected for non-resident species. | CF-07 |
| Migration Strategy | AVI | Residency Status != `Resident` | All non-resident bird profiles | `Short-distance`, `Medium-distance`, `Long-distance (neotropical)`, `Altitudinal`, `Nomadic` | **WARNING** -- CF-07. Strategy classification missing. | CF-07 |

---

## 3. Known Conditional Fields by Taxonomy

### 3.1 MAM -- White-Nose Syndrome (Chiroptera only)

**Activation key:** Taxonomy table `Order` = `Chiroptera`

The WNS conditional block is defined in `www/PNW/MAM/research/shared-schema.md` Section 10 ("Chiroptera-Specific Extension: White-Nose Syndrome Protocol"). It specifies four valid status values (`present`, `not-detected`, `not-susceptible`, `unknown`) with usage definitions.

**Safety gate:** H-9. WNS is the primary disease threat to North American bats. *Pseudogymnoascus destructans* was detected in Washington State in March 2016 (King County) and in Oregon in 2023. A bat species profile without WNS Status is incomplete in a way that directly affects conservation assessment.

**Fields activated:**
- WNS Status (BLOCK on absence)
- WNS Risk Tier (WARNING on absence)
- WNS Notes (WARNING on absence)

**Current MAM corpus status:** The VERIFY-MAM report (Section 2.4) found that all 15 bat species carry WNS status in `elevation-matrix.md` but lack full species card profiles in `small-mammals.md` (Finding F-01, Parts 2-4 absent). The conditional field data exists in matrix form but is not in the schema-compliant per-profile format. This is a known gap scheduled for remediation.

### 3.2 MAM -- MMPA Stock and Managing Agency (cetaceans, pinnipeds, sea otter)

**Activation key:** Taxonomy table `Order` = `Artiodactyla` with suborder Cetacea, OR `Family` = `Otariidae` or `Phocidae`, OR `Species` = `Enhydra lutris`

The MMPA conditional block is defined in `www/PNW/MAM/research/shared-schema.md` Section 2 ("Marine Mammal Species Card Template"). The key jurisdictional distinction: NOAA Fisheries manages cetaceans and pinnipeds; USFWS manages sea otters, walruses, and polar bears.

**Safety gate:** SC-MMP. The MMPA is federal law. Incorrect jurisdictional assignment is a factual error with legal implications. The VERIFY-MAM report (Section 2.5) confirmed that `marine.md` correctly documents the NOAA/USFWS split.

**Fields activated:**
- MMPA Stock (BLOCK on absence)
- MMPA Managing Agency (BLOCK on absence)
- MMPA Stock Status (BLOCK on absence)
- Stock Assessment Reference (WARNING on absence)
- PBR/Potential Biological Removal (WARNING on absence for strategic/depleted stocks)
- Critical Habitat Designation (WARNING on absence)
- Haul-out Site Regions (WARNING on absence for pinnipeds; N/A for cetaceans)

**Current MAM corpus status:** VERIFY-MAM (Section 3, SC-MMP) confirmed 9/9 PASS on safety-critical gates. All 27 marine mammal profiles include MMPA stock designation, stock status, and managing agency.

### 3.3 MAM -- Ecotype Table (Orcinus orca only)

**Activation key:** Taxonomy table `Species` = `orca` AND `Genus` = `Orcinus`

The ecotype table is defined in `www/PNW/MAM/research/shared-schema.md` Section 2 ("Ecotype Details -- CONDITIONAL: Orcinus only"). Orca populations in the PNW represent at least three biologically distinct ecotypes (Resident, Bigg's/Transient, Offshore) that differ in diet, social structure, genetics, and proposed taxonomic status.

**Safety gate:** CF-06. Conflating ecotypes in a single orca profile obscures the conservation-critical distinction between the Endangered Southern Resident population (73 individuals, July 2024) and the stable/increasing Bigg's population (~500+).

**Fields activated:**
- Ecotype (BLOCK on absence)
- Proposed Taxonomy (WARNING on absence)
- Population by ecotype (BLOCK on absence for SRKW)
- Pod Structure (WARNING on absence)
- Primary Prey by ecotype (BLOCK on absence -- this distinguishes fish-specialist residents from mammal-specialist transients)

**Current MAM corpus status:** VERIFY-MAM (Section 2.6) confirmed all four ecotypes documented with complete profiles.

### 3.4 MAM -- Hibernation/Torpor (subset of mammals)

**Activation key:** Order = Chiroptera (all bats enter torpor), OR Family = Sciuridae where genus = *Marmota* or documented hibernating ground squirrel, OR species with documented hibernation behavior.

This is a WARNING-level conditional. Hibernation status affects vulnerability assessment (e.g., WNS transmission occurs primarily in hibernacula) and seasonal activity patterns relevant to survey timing.

**Fields activated:**
- Hibernation/Torpor Pattern (WARNING on absence)

### 3.5 AVI -- Migration Fields (migratory birds only)

**Activation key:** `Residency Status` field value is NOT `Resident`

The AVI shared schema (`www/PNW/AVI/research/shared-schema.md` Section 1) includes a "Migration (if applicable)" block with fields for Migration Strategy, Spring Arrival, Fall Departure, Wintering Range, and Key PNW Staging Areas.

**Safety gate:** CF-07. Migration timing data is core functionality for a migratory bird profile. The AVI verification report (Section 3.2, CF-07) confirmed profiles include arrival/departure fields.

**Fields activated:**
- Migration Strategy (WARNING on absence)
- Spring Arrival (WARNING on absence)
- Fall Departure (WARNING on absence)
- Wintering Range (WARNING on absence)
- Key PNW Staging Areas (WARNING on absence when species uses known staging sites)

**Current AVI corpus status:** VERIFY-AVI (CF-07) confirmed PASS.

### 3.6 AVI -- No Conditional MAM Fields Apply

The AVI schema defines 8 mandatory fields and zero conditional fields derived from mammalian-specific concerns. WNS Status, MMPA Stock, ecotype tables, and hibernation fields are irrelevant to avian profiles. This is the baseline for the false-positive back-test: when the conditional field activation table is run against the AVI corpus, zero conditional MAM fields should trigger.

---

## 4. Pre-Check Requirement

Before running any conditional field check, the verification agent must confirm that the activation key field itself is present and well-formed.

### Step 0: Taxonomy Table Structural Check

1. **Verify Taxonomy table exists.** If the profile lacks a Taxonomy table entirely, flag as STRUCTURAL-FAIL and skip all conditional checks. Report: "Cannot evaluate conditional fields: Taxonomy table missing."

2. **Verify Order field is present.** The `Order` field is the primary activation key for most conditional checks. If absent, flag as STRUCTURAL-FAIL for conditional evaluation.

3. **Verify Order field uses canonical values.** The following Order values are recognized by the activation table:
   - MAM: `Chiroptera`, `Artiodactyla`, `Carnivora`, `Rodentia`, `Lagomorpha`, `Eulipotyphla` (formerly Soricomorpha), `Didelphimorphia`
   - AVI: Standard AOS-recognized avian orders
   - If the Order value does not match any canonical value, flag as WARNING: "Order value not recognized by conditional activation table: [value]. Manual review required."

4. **Verify Family field is present** (required for family-level activation conditions: Otariidae, Phocidae, Sciuridae, Mustelidae marine exception).

5. **Verify Species field is present** (required for species-level activation conditions: *Orcinus orca*, *Enhydra lutris*, *Phoca vitulina*).

### Formatting consistency rule

Order values must use initial capitalization with no trailing whitespace: `Chiroptera`, not `chiroptera`, not `CHIROPTERA`, not `Chiroptera `. The verification agent should normalize case before matching but should LOG any non-canonical formatting for editorial cleanup.

---

## 5. Verification Agent Protocol

This section provides step-by-step instructions for a Wave 4 verification agent using this table to verify conditional fields across a species profile corpus.

### Protocol: Conditional Field Verification Pass

```
INPUT:  Directory of species profile markdown files
        Conditional Field Activation Table (Section 2 of this document)
OUTPUT: Conditional field verification report

PROCEDURE:

1. LOAD the Conditional Field Activation Table into working memory.

2. ENUMERATE all species profile files in the target directory.
   - Identify full profiles (contain Taxonomy table with Order field).
   - Identify abbreviated profiles (vagrant/accidental -- skip conditional checks;
     these use a reduced schema that does not include conditional fields).

3. For each full species profile:

   a. EXTRACT the Taxonomy table.
      - If Taxonomy table is absent: report STRUCTURAL-FAIL, skip to next profile.

   b. EXTRACT activation key fields:
      - Order (required)
      - Family (required for family-level conditions)
      - Genus + Species (required for species-level conditions)
      - Residency Status or Migration strategy (for AVI behavioral conditions)
      - If Order is missing: report STRUCTURAL-FAIL for conditional checks, skip.

   c. NORMALIZE Order value (trim whitespace, match case-insensitively).

   d. ITERATE the activation table rows:
      - For each row, EVALUATE the Activation Condition against extracted fields.
      - If condition is TRUE:
        - CHECK whether the Required Field is present in the profile.
        - If present: VALIDATE the value against the Valid Values column.
          - Value valid: record PASS.
          - Value invalid: record FAIL with expected values.
        - If absent: record the action from "Verification Action on Absence" column
          (BLOCK, WARNING, or LOG).
      - If condition is FALSE:
        - CHECK whether the conditional field is present anyway.
        - If present: record WARNING ("Conditional field present but activation
          condition not met -- possible taxonomy error or over-application").
        - If absent: record PASS (correct omission). Do not report.

   e. AGGREGATE results for this profile.

4. After all profiles processed:

   a. SUMMARIZE by conditional field:
      - Total profiles where condition applies
      - PASS count, FAIL count, WARNING count
      - STRUCTURAL-FAIL count (profiles skipped due to missing taxonomy data)

   b. SUMMARIZE by safety gate:
      - H-9: count of bat profiles with/without WNS fields
      - SC-MMP: count of marine profiles with/without MMPA fields
      - CF-06: orca profiles with/without ecotype table
      - CF-07: migratory profiles with/without migration fields

   c. LIST all BLOCK-level failures (these prevent mission sign-off).

   d. LIST all false positives (conditional field present when condition not met).

5. RETURN the conditional field verification report.
```

### Error escalation

- **BLOCK failures** are appended to the main verification matrix as safety gate results. They must be resolved before Hemlock sign-off.
- **WARNING results** are logged in the PARTIAL Items Registry with recommended remediation.
- **LOG results** are informational only and do not affect pass/fail status.
- **STRUCTURAL-FAIL** results indicate profiles that need repair before conditional verification can run. These are reported separately from conditional field results.

---

## 6. Back-Test Results Template

The following template records back-test results when this activation table is run against an existing corpus. The purpose of back-testing is to confirm zero false positives (no conditional field triggers on profiles where the condition does not apply) and zero false negatives (no missing conditional fields on profiles where the condition does apply).

### Template

```markdown
## Back-Test: [Taxonomy] Corpus

**Date:** [YYYY-MM-DD]
**Agent:** [verification agent ID]
**Corpus:** [directory path]
**Profile count:** [N full profiles, M abbreviated profiles]
**Activation table version:** conditional-field-activation.md v[X]

### False Positive Check

| Conditional Field | Profiles Where Condition Does NOT Apply | Field Incorrectly Present | False Positive Count |
|---|---|---|---|
| WNS Status | [count of non-Chiroptera profiles] | [list or 0] | [N] |
| MMPA Stock | [count of non-marine profiles] | [list or 0] | [N] |
| Ecotype Table | [count of non-orca profiles] | [list or 0] | [N] |
| Migration Fields | [count of resident profiles] | [list or 0] | [N] |

**Total false positives:** [N] (target: 0)

### False Negative Check

| Conditional Field | Profiles Where Condition Applies | Field Correctly Present | Field Missing | False Negative Count |
|---|---|---|---|---|
| WNS Status | [count of Chiroptera profiles] | [count] | [list or 0] | [N] |
| MMPA Stock | [count of marine profiles] | [count] | [list or 0] | [N] |
| Ecotype Table | [count of orca profiles] | [count] | [list or 0] | [N] |
| Migration Fields | [count of migratory profiles] | [count] | [list or 0] | [N] |

**Total false negatives:** [N] (target: 0 for BLOCK-level fields)

### Value Validation

| Conditional Field | Profiles Checked | Valid Values | Invalid Values | Invalid Value List |
|---|---|---|---|---|
| WNS Status | [N] | [N] | [N] | [list or none] |
| MMPA Stock | [N] | [N] | [N] | [list or none] |

### Summary

- False positives: [N] (Hemlock constraint: must be 0)
- False negatives (BLOCK): [N]
- False negatives (WARNING): [N]
- Invalid values: [N]
- Structural failures: [N]
- **Back-test verdict:** [PASS / FAIL]
```

### Expected Results for Current Corpus

**AVI corpus (20 files, 484 unique species profiles):**
- WNS Status triggers: 0 (no Chiroptera in AVI) -- expected false positives: 0
- MMPA Stock triggers: 0 (no marine mammals in AVI) -- expected false positives: 0
- Ecotype Table triggers: 0 (no orca in AVI) -- expected false positives: 0
- Migration Fields triggers: 229+ migratory profiles should activate migration fields
- **Constraint:** Zero MAM-conditional fields fire on any AVI profile. If any fire, the activation condition has a specificity error.

**MAM corpus (13 files, 97 full species profiles + 133 matrix entries):**
- WNS Status triggers: 15 bat species (elevation matrix) -- expect WNS Status present for all 15 in matrix form; full profile form pending F-01 resolution
- MMPA Stock triggers: 27 marine profiles in `marine.md` -- expect MMPA Stock present for all 27
- Ecotype Table triggers: 1 species (*Orcinus orca*) -- expect ecotype table present
- All bat profiles trigger WNS fields: confirmed via elevation-matrix.md Chiroptera table (12 `not-detected`, 2 `not-susceptible`, 1 partial)
- All marine profiles trigger MMPA fields: confirmed via VERIFY-MAM SC-MMP PASS

**Hemlock's constraint: zero false positives when back-tested against the existing 36 committed files** (20 AVI + 16 MAM research files including verification reports). The activation conditions are taxonomic-order-level or species-level predicates that do not cross taxonomy boundaries.

---

## 7. Extensibility

### Adding conditional fields for future taxonomies

When a new PNW taxonomy is produced (fungi, flora, invertebrate, herpetology), conditional fields are added by appending rows to the activation table in Section 2. The protocol requires:

1. **Define the activation condition** using a field already present in the new taxonomy's shared schema (Order, Family, Class, Division, Phylum -- whatever the taxonomic rank system uses).

2. **Define the required fields** that activate under this condition, their valid values, and the failure action (BLOCK, WARNING, or LOG).

3. **Assign a safety gate** if the conditional field is safety-critical (e.g., endangered species, legal jurisdiction, disease status).

4. **Back-test** against all existing taxonomies to confirm zero false positives. The new condition must not trigger on any profile in AVI, MAM, or other existing corpora.

5. **Document** the new row in this file and update the version stamp.

### Anticipated future conditional fields

| Conditional Field | Taxonomy | Activation Condition | Rationale |
|---|---|---|---|
| Mycorrhizal Association Type | Fungi | Division = Basidiomycota AND Class = Agaricomycetes, certain families (Russulaceae, Cortinariaceae, Amanitaceae, Boletaceae) | Ectomycorrhizal vs. saprotrophic distinction affects forest ecosystem role. Activation at family level because not all Agaricomycetes are mycorrhizal. |
| Lichen Substrate Requirement | Fungi | Growth form = `lichen` | Substrate specificity (bark, rock, soil) is a conditional field that only applies to lichenized fungi, not free-living species. |
| Wetland Indicator Status | Flora | Habitat includes `HAB-WETLAND` or `HAB-RIPARIAN` | USACE wetland indicator status (OBL, FACW, FAC, FACU, UPL) is relevant only for species occurring in wetland-adjacent habitats. |
| Venom Profile | Herpetology | Family = Viperidae OR Genus = *Elgaria* (alligator lizards -- mildly venomous) | Venom composition and medical significance is a conditional field for venomous reptiles only. |
| Anadromous Life History | Fish/Aquatic | Family = Salmonidae AND life history = `anadromous` | Ocean phase duration, smolt timing, and homing fidelity are conditional on anadromous life history, not applicable to resident freshwater populations. |

### Version control

This document is versioned by commit. When rows are added to the activation table, the commit message should reference the conditional field name and the taxonomy it serves (e.g., `feat(shared): add mycorrhizal-association conditional field for fungi taxonomy`).

---

*PNW Research Series -- Cross-Taxonomy Verification Infrastructure*
*Phase 2: Conditional Field Activation Protocol*
*Author: Lex (execution discipline muse, near the real axis)*

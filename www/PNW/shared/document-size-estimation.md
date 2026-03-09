# Document Size Estimation and Split Planning Guide

> **Pattern:** P-17 (Output Limit Degradation Protocol)
> **Origin:** AVI+MAM missions, 2026-03-08 — 4 of 8 agents hit the 32,000 output token limit
> **Purpose:** Pre-mission estimation of document size so agents can split work before starting, not after truncation
> **Audience:** Any agent assigned to produce a research document. No prior mission knowledge required.

---

## 1. The Problem

Claude Code agents have a hard output limit of approximately 32,000 tokens per response. When an agent producing a research document exceeds this limit, the output is truncated — the document ends mid-sentence with no sources section, no closing, and no verification metadata. This is not a graceful failure; the agent does not know it has been truncated.

In the AVI and MAM missions, 4 of 8 survey agents hit this limit. The resulting documents required remediation (a second agent pass to complete the truncated sections). Remediation is expensive: it doubles the agent cost for that document and introduces merge complexity.

This guide provides a formula to estimate document size before writing begins, and a structured split plan template for documents that will exceed the limit.

---

## 2. Key Definitions

- **Token:** The unit of text that language models process. For English prose with markdown formatting, 1 word produces approximately 1.3 tokens. All estimates in this document use this ratio.
- **Species card:** A structured profile of one species, following the shared schema. Contains taxonomy, morphometrics, habitat, diet, conservation status, ecological role, and source citations.
- **Unit count:** The number of discrete items (species, topics, networks) a document will contain. This is the primary input to the size formula.
- **Overhead:** Fixed content that appears in every document regardless of unit count: title block, scope section, introduction, source bibliography, verification metadata.
- **Split:** Dividing one document into two or more parts, each produced by a separate agent invocation, then merged by concatenation.

---

## 3. Redundancy Classes

Shannon's analysis of the AVI+MAM corpus identified three classes of content based on how much text each unit of subject matter produces. These classes determine the tokens-per-unit multiplier.

### HIGH Redundancy — Species Surveys

Documents that contain one structured card per species. Each card follows a repeating template (taxonomy, habitat, diet, conservation, sources), which means the per-unit token cost is relatively predictable.

**Measured range:** 59–1,048 tokens per species (see Calibration Data, Section 7).

The wide range reflects card depth:

| Card Depth | Tokens/Species | Description | Example |
|------------|---------------|-------------|---------|
| Abbreviated | ~60 | Cross-reference stub. Species covered in detail elsewhere; entry here contains name, status, and a pointer. | `resident.md` entries for raptors covered by `raptors.md` |
| Standard | ~200 | Full card with all schema fields, minimal narrative. Songbirds, common waterfowl. | `migratory.md` neotropical migrants |
| Deep | ~500 | Full card plus ecological context paragraphs (habitat relationships, prey web position). | `small-mammals.md` rodent entries |
| Extended | ~1,000 | Full card plus multi-paragraph conservation narratives, stock assessment tables, threat analyses. Apex predators, ESA-listed species. | `raptors.md` owl profiles, `marine.md` killer whale, `carnivores.md` wolf/bear |

**Guidance for estimation:** If the mission schema requests "detailed profiles" or "conservation narratives," use Deep (500) or Extended (1,000). If the schema says "standard card" or "brief profile," use Standard (200). If species are cross-referenced to another module, use Abbreviated (60).

### MEDIUM Redundancy — Cultural, Synthesis, and Integration Documents

Documents that synthesize across species or topics. Examples: heritage bridge documents, ecological network analyses, cross-module merge documents. These have less structural repetition than species surveys — each section is somewhat unique.

**Estimated range:** 300–600 tokens per topic section.

No calibration data from AVI+MAM (these documents were not the ones that hit limits). Use 500 tokens/section as a conservative default.

### LOW Redundancy — Networks, Evolutionary, and Methodology Documents

Documents describing relationships, phylogenies, or analytical methods. These have the least repetition — each paragraph covers novel ground.

**Estimated range:** Not unit-based. Estimate total document length directly. Typical range: 8,000–15,000 tokens for a complete network or methodology document.

---

## 4. Size Estimation Formula

```
estimated_tokens = (unit_count × tokens_per_unit) + overhead
```

Where:

| Variable | How to Determine |
|----------|-----------------|
| `unit_count` | Count the species, topics, or sections the document must cover. This comes from the mission pack or task assignment. |
| `tokens_per_unit` | Choose from the card depth table in Section 3 based on the required schema depth. When uncertain, use the next higher depth. |
| `overhead` | Use **1,000 tokens** for standard documents. Use **1,500 tokens** for documents with extensive introductions, bibliographies, or methodology sections. |

### Worked Examples

**Example 1: A 32-species raptor survey with extended profiles**
```
estimated_tokens = (32 × 1,000) + 1,000 = 33,000 tokens
Decision: SPLIT REQUIRED (exceeds 28,000)
```
Actual measured: 33,551 tokens (`raptors.md`). Estimate error: -1.6%.

**Example 2: A 182-species resident survey with mostly abbreviated entries**

Resident surveys cross-reference species covered in other modules. Assume 150 abbreviated (60 tok) and 32 full standard cards (200 tok):
```
estimated_tokens = (150 × 60) + (32 × 200) + 1,000 = 9,000 + 6,400 + 1,000 = 16,400 tokens
Decision: No split needed (under 20,000)
```
Actual measured: 10,792 tokens (`resident.md`). Estimate is conservative by 52%, which is safe — overestimation leads to unnecessary splits (low cost), underestimation leads to truncation (high cost).

**Example 3: A 229-species migratory survey with standard cards**
```
estimated_tokens = (229 × 200) + 1,000 = 45,800 + 1,000 = 46,800 tokens
Decision: SPLIT REQUIRED (exceeds 28,000)
```
Actual measured: 44,840 tokens (`migratory.md`). Estimate error: +4.4%.

---

## 5. Split Decision Thresholds

| Estimated Tokens | Decision | Action |
|-----------------|----------|--------|
| **> 28,000** | **SPLIT REQUIRED** | Must split before starting. No exceptions. |
| **20,000 – 28,000** | **SPLIT RECOMMENDED** | Split if card depth is Deep or Extended. Proceed as single document only if card depth is Standard or Abbreviated. |
| **< 20,000** | **No split needed** | Produce as a single document. |

The 28,000 threshold provides a 4,000-token safety margin below the 32,000 hard limit. This margin accounts for:
- Estimation error (formula is approximate)
- Source bibliography growth (sources accumulate as cards reference new literature)
- Verification metadata appended at document end

The 20,000 advisory threshold flags documents that could exceed the limit if card depth increases during writing (a common pattern: agents write richer cards for charismatic species).

---

## 6. Split Plan Template

Before writing begins, produce a split plan in this format:

### Split Plan: [Document Name]

| Field | Value |
|-------|-------|
| **Document** | [e.g., `migratory.md`] |
| **Total unit count** | [e.g., 229 species] |
| **Card depth** | [Abbreviated / Standard / Deep / Extended] |
| **Tokens per unit** | [e.g., 200] |
| **Overhead per part** | [e.g., 1,000] |
| **Estimated total tokens** | [formula result] |
| **Number of parts** | [calculated below] |

**Part Allocation Table:**

| Part | File Name | Units | Unit Range | Est. Tokens | Agent |
|------|-----------|-------|------------|-------------|-------|
| 1 | `[doc]-part1.md` | [count] | [e.g., species 1–120] | [estimate] | [agent name] |
| 2 | `[doc]-part2.md` | [count] | [e.g., species 121–229] | [estimate] | [agent name] |

**Split Boundary Rules:**

1. Split at taxonomic order or family boundaries, never mid-species.
2. Each part must be independently valid markdown (own title, own sources section).
3. Part 1 carries the full introduction and scope section. Parts 2+ carry an abbreviated header referencing Part 1.
4. Each part's estimated tokens must be under 25,000 (leaving margin for the 28,000 advisory threshold).

**How to calculate number of parts:**
```
parts = ceil(estimated_total_tokens / 25,000)
units_per_part = ceil(unit_count / parts)
```

### Merge Strategy

After all parts are produced, merge into a single final document by concatenation:

1. **Take Part 1 as the base.** It has the full introduction.
2. **Append Part 2+ content** starting from their first species card (skip their abbreviated headers).
3. **Merge source bibliographies.** Combine all `## Sources` sections, deduplicate by source ID, sort by ID.
4. **Update the header metadata** (species count, date, status) to reflect the merged totals.

### Merge Validation Checklist

After merging, verify:

- [ ] Species count in header matches actual species card count in body
- [ ] No duplicate species cards (search for duplicate `### [Species Name]` headers)
- [ ] All source IDs referenced in cards appear in the merged bibliography
- [ ] No source IDs in the bibliography are unreferenced (orphan check)
- [ ] Document begins with proper module header block
- [ ] Document ends with sources section (not truncated)
- [ ] Total word count is within 10% of sum of parts' word counts (no content lost in merge)

---

## 7. Calibration Data Table

Measured from AVI and MAM mission outputs (2026-03-08). All files use the PNW shared species card schema.

| File | Species Count | Bytes | Words | Est. Tokens (words x 1.3) | Tokens/Species | Card Depth | Hit Limit? |
|------|--------------|-------|-------|---------------------------|----------------|------------|------------|
| `AVI/resident.md` | 182 | 61,890 | 8,302 | 10,793 | 59 | Abbreviated (mixed) | No |
| `AVI/migratory.md` | 229 | 252,156 | 34,493 | 44,841 | 196 | Standard | **Yes** (1.4x) |
| `AVI/raptors.md` | 32 | 190,120 | 25,809 | 33,552 | 1,048 | Extended | **Yes** (1.0x) |
| `MAM/carnivores.md` | 32 | 151,064 | 23,238 | 30,209 | 944 | Extended | Borderline |
| `MAM/small-mammals.md` | 71 | 170,590 | 26,412 | 34,336 | 484 | Deep | **Yes** (1.1x) |
| `MAM/marine.md` | 27 | 147,408 | 21,195 | 27,554 | 1,020 | Extended | Borderline |

**Observations:**

1. **Resident.md is an outlier.** Its low tokens/species (59) reflects abbreviated cross-reference entries for species profiled in other modules. Do not use this value for planning full-card surveys.
2. **Extended profiles average ~1,000 tokens/species.** Raptors (1,048), carnivores (944), and marine mammals (1,020) cluster tightly. Use 1,000 as the planning value for any document covering apex predators, ESA-listed species, or species requiring conservation narratives.
3. **Deep profiles average ~500 tokens/species.** Small mammals (484) is the only measured example. Use 500 for documents covering high-diversity groups with moderate ecological context.
4. **Standard profiles average ~200 tokens/species.** Migratory birds (196) is the measured example. Use 200 for documents following the schema without extended narrative.
5. **The byte-to-token ratio varies.** Markdown formatting (tables, headers, bold, links) inflates byte count relative to word count. Do not estimate tokens from bytes — use word count.

---

## 8. Example Split Plans

These show what pre-mission split plans would have looked like for two documents that exceeded or approached the limit.

### Example A: Migratory Birds (`migratory.md`)

**Pre-mission estimate:**
```
unit_count = 229 species
tokens_per_unit = 200 (Standard cards for songbirds and waterbirds)
overhead = 1,000
estimated_tokens = (229 × 200) + 1,000 = 46,800
parts = ceil(46,800 / 25,000) = 2
```

| Part | File Name | Units | Unit Range | Est. Tokens | Agent |
|------|-----------|-------|------------|-------------|-------|
| 1 | `migratory-part1.md` | 115 | Neotropical migrants + winter visitors (species 1–115) | 24,000 | SURVEY-MIGRATORY-A |
| 2 | `migratory-part2.md` | 114 | Staging waterbirds + vagrants (species 116–229) | 23,800 | SURVEY-MIGRATORY-B |

**Split boundary:** Between Part III (Winter Visitors) and Part IV (Staging Waterbirds). This is a natural taxonomic boundary — passerines in Part 1, non-passerines in Part 2.

**Outcome if pre-planned:** Two agents each produce ~24,000 tokens, both well under the 32,000 limit. Merge produces the same final document. Total agent cost is similar (two smaller calls vs. one truncated call plus one remediation call), but no content is lost.

### Example B: Marine Mammals (`marine.md`)

**Pre-mission estimate:**
```
unit_count = 27 species
tokens_per_unit = 1,000 (Extended profiles for marine megafauna)
overhead = 1,500 (extensive MMPA/ESA regulatory introduction)
estimated_tokens = (27 × 1,000) + 1,500 = 28,500
parts = ceil(28,500 / 25,000) = 2
```

| Part | File Name | Units | Unit Range | Est. Tokens | Agent |
|------|-----------|-------|------------|-------------|-------|
| 1 | `marine-part1.md` | 14 | Cetaceans: Odontoceti + Mysticeti (14 species) | 15,500 | CRAFT-MARINE-A |
| 2 | `marine-part2.md` | 13 | Pinnipeds + Mustelidae + Sirenia (13 species) | 14,500 | CRAFT-MARINE-B |

**Split boundary:** Between Cetacea (Part I) and Pinnipedia (Part II). This is the highest-level taxonomic boundary in the document.

**Outcome if pre-planned:** Each part stays well under the limit. The killer whale entry alone is ~2,500 tokens (with ecotype table and Chinook salmon narrative), which is absorbed comfortably in Part 1's budget. Without pre-planning, this document finished at 27,554 estimated tokens — it survived intact, but with zero margin. A slightly more detailed source bibliography would have caused truncation.

---

## 9. When to Update This Guide

Add new rows to the Calibration Data Table (Section 7) after each mission that produces species surveys or structured research documents. The tokens-per-unit values will stabilize as more missions contribute data. Current confidence levels:

| Card Depth | Confidence | Basis |
|------------|-----------|-------|
| Abbreviated (~60) | Low | 1 file (resident.md), mixed entry types |
| Standard (~200) | Medium | 1 file (migratory.md), consistent entries |
| Deep (~500) | Medium | 1 file (small-mammals.md), consistent entries |
| Extended (~1,000) | High | 3 files (raptors, carnivores, marine), tight cluster (944–1,048) |

After 3+ files per depth category, the values can be considered calibrated.

---

*P-17: Output Limit Degradation Protocol — Raven, 2026-03-08*
*Calibration data: AVI+MAM missions, 6 files, 573 species, 139,449 words measured*

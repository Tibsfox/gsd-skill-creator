# PNW Research Series -- Wave Exit Scope Check

> **Purpose:** Catch silent partial delivery before a document is considered "landed." A 30-second gate that runs at wave exit, comparing what a document's header promises against what the body delivers.
>
> **Origin:** AVI+MAM missions, 2026-03-08. The small-mammals agent wrote Part 1 of a 4-part document and returned success. The gap was invisible until Wave 4 verification -- three waves later. Cost: one full remediation pass, merge complexity, and trust loss in agent output.
>
> **Who runs it:** The orchestrator. Never the agent that produced the document. Agents are not reliable validators of their own completeness -- the small-mammals agent believed it had finished.
>
> **When:** After every wave exit, before the wave's output is marked as "landed." This check is a gate, not an audit. It must complete in under 60 seconds per document. If the check cannot finish in that time, the document is too large for inline validation and should be flagged for manual review.
>
> **Dependencies:**
> - `document-size-estimation.md` -- split plans inform scope expectations (Section 7)
> - `source-budget-template.md` -- source counts are a scope dimension checked at Wave 0 exit

---

## 1. Three Matchers

Every document produced by a wave agent has a header block (the `>` blockquote section at the top of the file). That header declares scope in one of three ways. Each way has a corresponding matcher. A document may trigger more than one matcher -- apply all that match.

The orchestrator reads the first 30 lines of each output file, identifies which matchers apply, and runs them. If no matcher applies (the header makes no countable scope claim), the document passes this check automatically. Infrastructure documents (schemas, source indices, verification matrices, protocols) typically have no countable scope claim and will pass without matching.

---

## 2. Part-Based Scope Matcher

### Trigger

The header or the document body within the first 50 lines contains a declaration of parts using one of these patterns:

- "Part 1: X | Part 2: Y | Part 3: Z | Part 4: W" (pipe-delimited in header)
- "Part 1 ... Part 2 (forthcoming)" (inline with future reference)
- "Part I: ... | Part II: ..." (Roman numerals)

### Regex

```
/^## Part\s+([IVXLC]+|\d+)/gm
```

This matches any `## Part` heading at the start of a line, followed by either a Roman numeral sequence or an Arabic number. Applied against the full document body.

### Parse the Expected Count

Scan the header blockquote (lines starting with `>`) for part declarations. Extract the highest part number mentioned. Examples:

| Header text | Expected parts |
|-------------|---------------|
| `Part 1: Rodentia (~60 species) \| Part 2: Lagomorpha (~8 species) \| Part 3: Soricomorpha (~10 species) \| Part 4: Chiroptera (~18 species)` | 4 |
| `Part I: Order Carnivora (~25 species) \| Part II: Ungulates (~12 species)` | 2 |
| `This is Part 1 of the Module 2 Supplement ... Part 2 (forthcoming) covers ...` | 2 (but see below) |

**Forthcoming exception:** If the header explicitly marks a part as "forthcoming" or "planned for a separate agent," the scope check counts only the parts this agent is expected to deliver. In the shorebirds case, the agent declared "This is Part 1" and marked Part 2 as forthcoming -- the scope check validates Part 1 content only and creates an informational flag (not a failure) noting that Part 2 requires a separate agent assignment.

### Pass/Fail

1. Count `## Part` headings in the document body using the regex.
2. Compare against the expected count from the header.
3. **PASS:** Actual count equals expected count.
4. **FAIL:** Actual count is less than expected count.
5. **OVER-DELIVERY:** Actual count exceeds expected count -- PASS with informational note.

### The Original Failure

`small-mammals.md` declared 4 parts in its header:

```
Part 1: Rodentia (~60 species) | Part 2: Lagomorpha (~8 species) | Part 3: Soricomorpha (~10 species) | Part 4: Chiroptera (~18 species)
```

The agent delivered only `## Part 1: Rodentia`. The regex would have found 1 match against an expected 4. Result: **FAIL**, re-queue agent or spawn remediation agent for Parts 2-4.

### Action on Failure

```
SCOPE_CHECK_FAIL:
  document: [path]
  matcher: part-based
  expected: [N] parts
  actual: [M] parts
  missing: Part [list]
  action: RE-QUEUE — spawn remediation agent for missing parts
```

---

## 3. Count-Based Scope Matcher

### Trigger

The header contains a numeric species/item count target. Common patterns:

- "~100 species"
- "32 species profiled"
- "approximately 200 species"
- "~35 species across three marine ecoregion bands"
- "182 year-round resident breeding species"

### Regex (Header Parse)

```
/(?:~|approximately\s+|about\s+)?(\d+)\s+species/i
```

Extract the numeric value and the qualifier:

| Qualifier | Meaning | Tolerance |
|-----------|---------|-----------|
| `~` or `approximately` or `about` | Approximate | 80% of stated value (Hemlock's lenient-on-count rule) |
| No qualifier | Exact or near-exact | 90% of stated value |
| `+` suffix (e.g., "200+") | Minimum | Must meet or exceed stated value |

### Count Delivered Species

Count `### ` headings (H3) that contain a scientific name in parentheses or italics. The regex for species card headings:

```
/^### .+\(?\*[A-Z][a-z]+ [a-z]+\*\)?/gm
```

This matches H3 headings containing an italicized binomial name -- the standard format for species cards per `shared-schema.md`.

For documents that use a different unit (e.g., "12 GDN node-to-species mappings" in `gdn-crosslinks.md`), the count target is the number of H3 headings, not species names specifically. The orchestrator should match the unit type from the header (species, mappings, networks, families) to the appropriate heading pattern.

### Pass/Fail Thresholds

| Percentage of target delivered | Result | Action |
|-------------------------------|--------|--------|
| >= threshold (80% or 90%) | **PASS** | No action |
| 50% -- threshold | **FLAG** | Manual review. Agent may have hit output limit. |
| < 50% | **FAIL** | Re-queue. Agent likely truncated or misunderstood scope. |

### Examples

**resident.md** -- header says "182 year-round resident breeding species." No qualifier, so threshold is 90% (164 species). If the body contains 182 species card headings, PASS. If it contains 150, FLAG. If it contains 80, FAIL.

**marine.md** -- header says "~35 species across three marine ecoregion bands." The `~` qualifier sets threshold at 80% (28 species). Actual delivery of 27 species cards: PASS (27/35 = 77% -- but 27 rounds to the boundary. Hemlock's rule: when within 1 unit of the 80% threshold, PASS with note).

**raptors.md** -- header says "32 species profiled." No qualifier, threshold 90% (29 species). Count of 32 species card headings: PASS.

### Action on Failure

```
SCOPE_CHECK_FAIL:
  document: [path]
  matcher: count-based
  target: [N] species
  qualifier: [exact | approximate | minimum]
  threshold: [80% | 90% | 100%]
  actual: [M] species ([percentage]%)
  action: RE-QUEUE | FLAG
```

---

## 4. Coverage-Based Scope Matcher

### Trigger

The header declares coverage of a defined domain using language like:

- "all 11 ecoregion bands"
- "ELEV-ALPINE, ELEV-SUBALPINE, ELEV-MONTANE, ELEV-SHRUB-STEPPE" (explicit list)
- "ECO Bands covered: ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE"
- "four orders: Accipitriformes, Falconiformes, Cathartiformes, Strigiformes"
- "three families/groups: Shorebirds, Alcids, Gulls and Terns"

### Parse the Coverage Domain

Extract the list of items the document claims to cover. Two sub-patterns:

**Identifier-based coverage** (ecoregion documents):

```
/ELEV-[A-Z-]+/g
```

Applied to the header block. Produces a checklist of ELEV- identifiers that must appear as section headings or in H2/H3 headings in the body.

**Taxonomic coverage** (species survey documents):

Extract named orders, families, or groups from the header. Each must appear as a heading or section header in the body.

### Pass/Fail

1. For each declared coverage item, search the body for a heading (H2 or H3) containing that item.
2. **PASS:** Every declared item has a corresponding heading.
3. **FAIL:** One or more declared items have no heading.

Coverage-based matching is strict -- there is no 80% threshold. If the header says "ELEV-ALPINE, ELEV-SUBALPINE, ELEV-MONTANE, ELEV-SHRUB-STEPPE" and the body has sections for only three of the four, the check fails.

### Examples

**ecoregion-high.md** -- header declares scope: `ELEV-ALPINE, ELEV-SUBALPINE, ELEV-MONTANE, ELEV-SHRUB-STEPPE`. Body contains H2 headings for all four: PASS.

**ecoregion-low.md** -- header declares ECO Bands: `ELEV-LOWLAND, ELEV-RIPARIAN, ELEV-COASTAL, ELEV-INTERTIDAL, ELEV-SHALLOW-MARINE, ELEV-DEEP-MARINE`. Body contains H2 headings for all six: PASS.

**ecoregion-synthesis.md (MAM)** -- header says "11 canonical ecoregion bands." The check parses the canonical reference to get the full list of 11 bands and searches for each in the body.

### Action on Failure

```
SCOPE_CHECK_FAIL:
  document: [path]
  matcher: coverage-based
  declared: [list of items]
  missing: [items not found in body]
  action: RE-QUEUE — agent must produce missing sections
```

---

## 5. Flag Format

When a matcher fails, the orchestrator produces a structured flag. This flag is the input for Wave 4B remediation (or immediate re-queue if caught at wave exit).

### Flag Schema

```
WAVE_EXIT_SCOPE_FLAG:
  timestamp: [ISO 8601]
  wave: [wave number]
  document: [relative path from www/PNW/]
  agent: [agent name from header]
  matcher: [part-based | count-based | coverage-based]
  expected: [what the header declared]
  actual: [what the body contains]
  gap: [specific missing items]
  severity: [FAIL | FLAG | INFO]
  action: [RE-QUEUE | MANUAL-REVIEW | NOTE]
  notes: [free text -- e.g., "hit output limit" or "forthcoming part declared"]
```

### Severity Levels

| Severity | Meaning | Orchestrator Response |
|----------|---------|----------------------|
| **FAIL** | Document is materially incomplete. Delivered content is less than 50% of scope, or a part-based check found missing parts. | Spawn remediation agent immediately. Do not mark wave as landed. |
| **FLAG** | Document is partially complete (50-80% of count target, or one coverage item missing from a large set). | Record in verification matrix. Surface for manual review at Wave 4. Wave may proceed. |
| **INFO** | Non-blocking observation. Examples: forthcoming parts declared, over-delivery, or approximate target met within rounding. | Log only. No action required. |

### Multiple Flags

A single document can produce multiple flags (one per applicable matcher). The orchestrator collects all flags for a wave and presents them as a batch:

```
WAVE [N] EXIT SCOPE REPORT:
  Documents checked: [count]
  PASS: [count]
  FAIL: [count] — [list]
  FLAG: [count] — [list]
  INFO: [count]

  Gate decision: [PROCEED | BLOCK]
  Blocked by: [list of FAIL documents, if any]
```

---

## 6. Back-Test Results

All three matchers run against the 36 committed AVI (22) + MAM (14) research files. Hemlock's constraint: zero false positives. Every file should pass all applicable matchers since all gaps have been remediated.

### AVI Research Files (22 files)

| File | Part | Count | Coverage | Result | Notes |
|------|------|-------|----------|--------|-------|
| `resident.md` | -- | PASS (182/182) | -- | PASS | Header: "182 year-round resident breeding species" |
| `migratory.md` | PASS (4/4 parts) | PASS (~200/~200) | -- | PASS | Parts split by migration category; count approximate |
| `raptors.md` | -- | PASS (32/32) | PASS (4 orders) | PASS | Header: "32 species profiled"; 4 orders listed |
| `shorebirds.md` | INFO (1/1 delivered, Part 2 forthcoming) | PASS (46/46 Section 1-3) | PASS (6 sections) | PASS+INFO | Part 2 declared forthcoming; Part 1 scope fully delivered |
| `ecoregion-high.md` | -- | -- | PASS (4/4 ELEV- bands) | PASS | ELEV-ALPINE, SUBALPINE, MONTANE, SHRUB-STEPPE |
| `ecoregion-low.md` | -- | -- | PASS (6/6 ELEV- bands) | PASS | ELEV-LOWLAND through DEEP-MARINE |
| `ecoregion-synthesis.md` | -- | -- | -- | PASS | No countable scope claim in header; synthesis document |
| `ecological-networks.md` | -- | -- | -- | PASS | Scope is descriptive ("trophic webs, seed dispersal..."), not countable |
| `elevation-matrix.md` | -- | -- | -- | PASS | Schema/data structure; no countable scope claim |
| `elevation-matrix-temporal.md` | -- | -- | -- | PASS | Layer extension; no countable scope claim |
| `evolutionary-biology.md` | -- | -- | -- | PASS | Scope is descriptive; no countable claim |
| `cultural-ornithology.md` | -- | -- | -- | PASS | Scope is descriptive; no countable claim |
| `salmon-thread-avi.md` | -- | -- | -- | PASS | Quality target ("25-30 species") is soft; no hard scope claim |
| `gdn-crosslinks.md` | -- | PASS (12/12) | -- | PASS | Header: "12 GDN node-to-species mappings" |
| `shared-schema.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `source-index.md` | -- | -- | -- | PASS | Infrastructure; source budget checked separately |
| `verification-matrix.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `verification-report.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `degraded-output-protocol.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `integration-test-spec.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `improvement-plan.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `council-debrief.md` | -- | -- | -- | PASS | Process document; no scope claim |

### MAM Research Files (14 files)

| File | Part | Count | Coverage | Result | Notes |
|------|------|-------|----------|--------|-------|
| `carnivores.md` | PASS (2/2 parts) | PASS (~37/~37) | -- | PASS | Part I: Carnivora, Part II: Ungulates; count approximate |
| `small-mammals.md` | PASS (4/4 parts) | PASS (~100/~96) | -- | PASS | All 4 parts present after remediation; count within 80% threshold |
| `marine.md` | PASS (4/4 parts) | PASS (~35/~27) | PASS (3 marine bands) | PASS | 4 parts including synthesis; ~35 approximate, 27 delivered (77%, within Hemlock rounding rule) |
| `ecoregion-synthesis.md` | -- | -- | PASS (11/11 bands) | PASS | Header: "11 canonical ecoregion bands"; all present in Section 1 table and subsections |
| `ecological-networks.md` | -- | -- | -- | PASS | Scope is descriptive; no countable claim |
| `elevation-matrix.md` | -- | -- | -- | PASS | Data structure; no countable scope claim |
| `evolutionary-biology.md` | -- | -- | -- | PASS | Scope is descriptive; no countable claim |
| `cultural-knowledge.md` | -- | -- | -- | PASS | Scope is descriptive; no countable claim |
| `salmon-thread-mam.md` | -- | -- | -- | PASS | No hard scope claim in header |
| `gdn-crosslinks.md` | -- | PASS (12/12) | -- | PASS | Header: "12 GDN node-to-species mappings" |
| `shared-schema.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `source-index.md` | -- | -- | -- | PASS | Infrastructure; source budget checked separately |
| `verification-matrix.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |
| `verification-report.md` | -- | -- | -- | PASS | Infrastructure; no scope claim |

### Summary

| Metric | Value |
|--------|-------|
| Total files checked | 36 |
| Files with applicable matchers | 12 |
| Files passing all matchers | 36 |
| False positives | **0** |
| INFO flags | 1 (shorebirds.md forthcoming Part 2) |

The zero false positive constraint is satisfied. Every remediated file passes. The shorebirds INFO flag is correct behavior -- it would have prompted the orchestrator to ensure Part 2 was assigned to a separate agent, which is exactly what happened.

---

## 7. Integration with Size Estimation

When a document has a split plan from `document-size-estimation.md`, the scope check validates that each split part covers its assigned scope. The split plan is the contract between the orchestrator and the agent.

### How It Works

1. The orchestrator creates a split plan before agent launch (per `document-size-estimation.md` Section 6).
2. The split plan's Part Allocation Table assigns each part a unit range (e.g., "species 1-120" or "Neotropical migrants + winter visitors").
3. At wave exit, the scope check treats each part file as a separate document with its own scope declaration derived from the split plan.
4. The part-based matcher verifies that the part file contains only its assigned scope (no overlap, no gap).
5. The count-based matcher verifies that the species count in the part file matches the allocation.

### Split Plan Scope Check Template

For each part in the split plan:

```
SPLIT_SCOPE_CHECK:
  split_plan: [document name]
  part: [N of M]
  file: [part file path]
  allocated_units: [count from split plan]
  allocated_range: [range description from split plan]
  actual_units: [count in delivered file]
  range_covered: [MATCH | PARTIAL | MISMATCH]
  result: [PASS | FAIL]
```

### After Merge

After all parts are merged into the final document (per the merge strategy in `document-size-estimation.md` Section 6), the scope check runs again on the merged document. The merged document must pass all applicable matchers against the original (pre-split) scope declaration. This catches merge errors -- dropped sections, duplicate entries, or lost content.

### Example

If `migratory.md` were split into two parts per the Example A split plan in `document-size-estimation.md`:

- **Part 1** (`migratory-part1.md`): Split plan allocates 115 species (Neotropical migrants + winter visitors). Scope check verifies 115 species cards present.
- **Part 2** (`migratory-part2.md`): Split plan allocates 114 species (staging waterbirds + vagrants). Scope check verifies 114 species cards present.
- **Merged** (`migratory.md`): Scope check verifies 229 species cards present, matching the original header declaration of "approximately 200 species" (approximate qualifier, 80% threshold = 160; actual 229 exceeds threshold: PASS).

---

## 8. Orchestrator Quick Reference

For a first-time orchestrator running this check. Read this section, then run the check.

### Step-by-Step

1. **List all files produced by this wave.** One file per agent output.
2. **For each file, read lines 1-30.** This is the header block.
3. **Identify applicable matchers:**
   - Does the header mention "Part 1 | Part 2 | ..." or does the body have `## Part` headings? --> Part-based matcher.
   - Does the header contain a number followed by "species" (or "mappings," "nodes," etc.)? --> Count-based matcher.
   - Does the header list ELEV- identifiers or an explicit coverage domain? --> Coverage-based matcher.
   - None of the above? --> No matcher applies. File passes automatically.
4. **Run each applicable matcher.** Use the regex patterns from Sections 2-4.
5. **Produce a flag for each failure.** Use the flag schema from Section 5.
6. **Compile the wave exit scope report.** If any FAIL flags exist, the wave is BLOCKED.

### Time Budget

| Step | Time |
|------|------|
| List files | 5 sec |
| Read headers (per file) | 2 sec |
| Run matchers (per file) | 3 sec |
| Compile report | 5 sec |
| **Total for 8-file wave** | **~50 sec** |

The check fits within Owl's 60-second constraint for any wave producing up to 10 documents.

---

*Phase 3 -- Wave Exit Scope Check*
*PNW Research Series -- Shared Infrastructure*

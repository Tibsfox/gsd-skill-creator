# Fleet Research Generator — Component Specification

**Milestone:** Seattle 360 Continuous Artist Release Engine
**Wave:** 2 | **Track:** Sequential (synthesis)
**Model Assignment:** Opus
**Estimated Tokens:** ~20K per artist
**Dependencies:**
  - `TheoryNodeList[N]` from component 02
  - `CollegeLinkList[N]` from component 04
  - `ArtistProfile[N]` from component 01
  - `ActiveContext[N]` from Wave 0 (KnowledgeState summary)
  - LaTeX template from `research-mission-generator/references/latex-template.md`
**Produces:**
  - `releases/seattle-360/NNN-[slug]/research-mission.pdf`
  - `releases/seattle-360/NNN-[slug]/research-mission.tex`
  - `releases/seattle-360/NNN-[slug]/index.html`
  - `releases/seattle-360/NNN-[slug]/knowledge-nodes.json`

---

## Objective

Synthesize the `ArtistProfile`, `TheoryNodeList`, `CollegeLinkList`, and `ActiveContext`
into a full, three-stage Fleet research mission document following the GSD research-mission-
generator skill's LaTeX template. Compile with XeLaTeX (three passes). Produce the index.html
landing page. "Done" = four files present in the output directory, PDF compiled without
XeLaTeX errors, and `knowledge-nodes.json` matching the CollegeLinkList exactly.

---

## Context

Each artist release is a **complete** educational document — not a stub or summary.
It follows the three-stage structure:

**Stage 1: Vision Guide** (artist-specific)
- Why this artist matters educationally
- What theory they teach
- How they connect to the Seattle lineage (from ActiveContext)

**Stage 2: Research Reference** (sourced)
- Biography with professional citations (AllMusic, Grove Music, KEXP, academic journals)
- Theory section: each TheoryNode explained with audible evidence and historical context
- Cultural context: neighborhood, era, label, Black American / Indigenous attribution as applicable
- College Knowledge section: each CollegeLink explained with department rationale
- Cross-references to prior artists in the theory genealogy (from TheoryNodeList.genealogyLinks)

**Stage 3: Mission Package** (College integration plan)
- What `.college/` nodes this artist's release creates or enriches
- Specific content to add to each node (derived from TheoryNodeList + CollegeLinkList)
- Carry-forward section: what to seed into the next artist's KnowledgeState
- Wave execution plan for integrating this artist into `.college/` (simplified 2-wave plan)

**Color Scheme:** Music history domain
- Primary: `#1A237E` (deep navy — jazz clubs, night)
- Secondary: `#880E4F` (deep cranberry — Sub Pop red, vinyl)
- Tertiary: `#2E7D32` (PNW forest green)
- Accent: `#1565C0` (Seattle sky blue)
- lightprimary: `#E8EAF6`
- lightsecondary: `#FCE4EC`
- lighttertiary: `#E8F5E9`

**NASA SE verbosity standard:**
- Every biographical claim has a citation
- Every numerical claim (year, chart position, sales figure) has a source
- Hedging language for unverified claims ("reportedly," "according to X")
- No Wikipedia as primary source; use it only to find citable sources

---

## Technical Specification

### Document Structure (per LaTeX skeleton)

```
Title Page:
  Artist Name + Degree number
  Genre + Era + Neighborhood
  "GSD RESEARCH MISSION PACKAGE — Seattle 360"
  Date + Safety Warden status (PENDING until Wave 3a)

Table of Contents

STAGE 1 — VISION GUIDE
  § Vision (why this artist matters educationally)
  § Problem Statement (3–5 specific things this artist teaches)
  § Core Concept (the one key pedagogical arc)
  § Study Architecture (ASCII diagram of theory nodes)
  § Theory Modules (one subsubsection per TheoryNode)
  § Chipset Configuration (YAML for this artist's College integration mission)
  § Scope Boundaries
  § Success Criteria (8–10 criteria for this artist's College module)
  § Relationship to Other Releases (genealogy links from ActiveContext)
  § Through-Line (GSD ecosystem connection)

STAGE 2 — RESEARCH REFERENCE
  § Biography (sourced; era, label, neighborhood, key recordings)
  § Musical DNA (theory concepts with audible evidence — from TheoryNodeList)
  § Cultural Context (neighborhood, era, attribution)
  § College Knowledge Cross-References (from CollegeLinkList)
  § Theory Genealogy Connections (prior artists; future implications)
  § Safety & Sensitivity Considerations
  § Source Bibliography

STAGE 3 — MISSION PACKAGE
  § Milestone Specification (College integration objective)
  § College Node Deliverables (table: path, type, content)
  § Wave Execution Plan (simplified: Wave 0 schemas + Wave 1 content + Wave 2 verify)
  § Test Plan (15–20 tests for this artist's College module)
  § Crew Manifest (CEDAR, ORCA, WARDEN roles for this micro-mission)
  § Carry-Forward Section (explicit seeds for next artist)
  § Execution Summary
```

### Behavioral Requirements

**MUST:**
- Use XeLaTeX with music-domain color scheme (defined above)
- Complete Table of Contents with page references
- Include ASCII diagram in Stage 1 showing theory node relationships
- Include chipset YAML specific to this artist's College integration
- Stage 2 biography: minimum 3 professional citations
- Stage 2 theory section: one subsubsection per TheoryNode, each with:
  - Concept definition
  - Audible evidence (direct quote from TheoryNodeList.audibleEvidence)
  - Historical context (who taught whom; lineage)
  - Mathematics bridge (if present in TheoryNode)
  - Link to College path
- Stage 3 College deliverables: one table row per CollegeLink (CREATE or ENRICH)
- Carry-Forward section: explicit seeds for the next 1–5 artists

**MUST NOT:**
- Omit a TheoryNode from Stage 2 (all nodes must appear)
- Omit a CollegeLink from Stage 3 (all links must appear)
- Generate speculative biographical claims
- Reproduce copyrighted lyrics (describe; don't reproduce)
- Use Wikipedia as a primary source

---

## Implementation Steps

1. Read LaTeX template from `research-mission-generator/references/latex-template.md`.
2. Apply music-domain color scheme (defined above).
3. Write Stage 1 content (Opus — synthesis of all inputs).
4. Write Stage 2 content (Opus — sourced biography + theory + cultural context).
5. Write Stage 3 content (Opus — College integration plan + carry-forward).
6. Assemble `.tex` document from three stages using LaTeX template skeleton.
7. Write `.tex` to output directory.
8. Run XeLaTeX three passes; capture stderr; if errors → log + BLOCK signal.
9. Write `index.html` (3-file landing page with download links; music-domain colors).
10. Write `knowledge-nodes.json` from CollegeLinkList (exact copy, JSON format).
11. Verify all 4 output files present and non-zero size.

---

## Test Cases

| Test ID | Input | Expected Output | Pass Condition |
|---------|-------|-----------------|----------------|
| RG-01 | Any artist | PDF present in output dir | File exists, size > 50KB |
| RG-02 | Any artist | XeLaTeX compiles without errors | Exit code 0 on all 3 passes |
| RG-03 | Any artist | All 3 stages in PDF | PDF text search finds "STAGE 1", "STAGE 2", "STAGE 3" |
| RG-04 | degree=0 (Quincy Jones) | Stage 2 has ≥3 citations | Source bibliography has ≥3 entries |
| RG-05 | Any artist | Stage 2 has all TheoryNodes | Node count in Stage 2 = TheoryNodeList.nodes.length |
| RG-06 | Any artist | Stage 3 has all CollegeLinks | Table rows = CollegeLinkList.links.length |
| RG-07 | Any artist | knowledge-nodes.json valid JSON | JSON.parse succeeds |
| RG-08 | Any artist | index.html has 3 download links | `<a href="research-mission.pdf" download>` present |
| RG-09 | Any artist | Carry-forward section present | "Carry-Forward" heading in Stage 3 |
| RG-10 | Artist with genealogy links | Stage 2 cross-references prior artists | Prior artist names appear in Stage 2 |

## Verification Gate

- [ ] All 4 output files present (pdf, tex, html, json)
- [ ] XeLaTeX exits 0 on all three passes
- [ ] knowledge-nodes.json validates against `college-link-list.schema.json`
- [ ] PDF > 50KB (not an empty document)
- [ ] Stage 2 bibliography has ≥3 professional sources
- [ ] RG-01 through RG-10 pass

## Safety Boundaries

| Constraint | Boundary Type |
|-----------|---------------|
| No copyrighted lyrics reproduced (even partial) | ABSOLUTE |
| All biographical claims cited | ABSOLUTE |
| Indigenous attribution nation-specific | ABSOLUTE (defer to Safety Warden for audit) |
| No "invented by" language for music concepts | ANNOTATE |
| LaTeX compilation failure = BLOCK (no PDF = no release) | ABSOLUTE |

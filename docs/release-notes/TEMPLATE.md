# Release Notes Template

Copy this file to `docs/release-notes/v<VERSION>/README.md` and fill it in.

**Two equally-canonical authoring shapes are recognized by the scorer:**

1. **Inline-everything README** (pre-v1.49.585 canonical) — single README.md
   with all required sections inline. Modeled on **v1.49.165** + **v1.49.580/581/582**
   (all A 100). Best when the milestone is a single coherent release without
   need for extended chapter-level deep-dives.

2. **5-file chapter-first structure** (v1.49.585+ canonical) — README.md as
   gateway/index + `chapter/{00-summary, 03-retrospective, 04-lessons, 99-context}.md`
   for depth content. Mandated by `tools/release-history/check-completeness.mjs --strict`
   for v1.49.585+ milestones (5 files × ≥200 bytes hard floor). Modeled on
   **v1.49.587/591** (highest-scoring 5-file releases). Best when retrospective
   + lessons + context warrant separate hand-authored documents.

The scorer (`tools/release-history/score-completeness.mjs`) recognizes both
shapes. The corpus builder (`buildReleaseCorpus()`) concatenates README + all
chapter/*.md files with heading-demote-by-one, so chapter content counts toward
all dimensions. Section-name regexes accept both inline ("Part A", "Cross-References",
"Infrastructure") and chapter-first ("Cross-track structural pair anchor inventory",
"Tier N inline-Opus build-path provenance", "Cadence", formal-ID `#10NNN`
cross-refs) equivalents.

For chapter-first authoring (v1.49.585+), see **§ 5-File Chapter-First Structure**
below for the per-file content map.

When in doubt, read [`v1.49.165/README.md`](v1.49.165/README.md) for inline-format
gold standard, or [`v1.49.587/`](v1.49.587/) for 5-file chapter-first gold standard.

Scores appear in `docs/RELEASE-HISTORY.md` so drift shows up in plain sight.

---

## 5-File Chapter-First Structure (v1.49.585+)

When using the chaptered authoring shape, distribute content across the 5
required files this way. Each file's recommended scorer-recognized headings
are listed; pick those that apply to your milestone.

### `README.md` — Gateway / Index

Lean, ~50-200 lines. Holds:
- **Header metadata block** (same fields as inline format — see § Header below)
- `## Summary` — 1-3 paragraph high-level prose with **bolded findings**
- `## Cross-track / Engine state` OR `## What shipped` — pipe-table summary of
  this milestone's deliverables (NASA / MUS / ELC / SPS engine advances or
  feature-milestone summary). Counts toward `key_features_table` dimension.
- `## See also` OR `## Cadence` — pointers to chapter files + adjacent milestones.
  Counts toward `infrastructure_block` and `cross_references`.

### `chapter/00-summary.md` — Structural firsts + cross-track weave

Holds the depth content for `summary_findings` + `key_features_table` +
`part_a_depth` dimensions. Recommended sections:
- `## Structural firsts at v<VERSION> close` — bolded findings of what's
  novel this milestone (5+ findings → max `summary_findings` 15)
- `## Engine state at v<VERSION> close` — pipe-table of NASA/MUS/ELC/SPS
  state. Counts toward `key_features_table`.
- `## Cross-track <pair-name> weave (N anchor points)` — bolded sub-themes
  for the cross-track substrate-coherence finding. Counts toward `part_a_depth`
  + `part_b_depth`.

### `chapter/03-retrospective.md` — Retrospective

Holds the depth content for `retrospective_structure` dimension (15 pts).
Required sections:
- `## Carryover lessons applied this milestone` (or `## What Worked` for
  inline-style)
- `## New observations` OR `## Trust-budget notes` OR `## Process observation`
  (or `## What Could Be Better` for inline-style)

The scorer accepts version-prefixed H1 (`# v<VERSION> — Retrospective`) AND
canonical (`# Retrospective — v<VERSION>`) — both demote to `## Retrospective`
under the corpus builder.

### `chapter/04-lessons.md` — Forward lessons emitted

Holds `lessons_learned` dimension (10 pts). Required structure:
- H1: `# v<VERSION> — Forward Lessons Emitted` OR `# Lessons — v<VERSION>`
- H2/H3 sections per formal-ID lesson: `## #10NNN — Title` with
  promotion criteria + cross-references. The scorer counts numbered lessons
  AND bulleted sub-themes; 8+ → max score.

Cross-references between lessons (`#10NNN` formal IDs) accumulate toward
the `cross_references` dimension via the corpus-wide formal-ID counter.

### `chapter/99-context.md` — Engine state + ledger + provenance

Holds `running_ledgers` + `infrastructure_block` + `part_a_depth`/`part_b_depth`
fallback dimensions. Recommended sections:
- `## Engine state full enumeration at v<VERSION> close` — full pipe-table
  enumerating NASA/MUS/ELC/SPS state. Counts toward `running_ledgers`.
- `## §6.6 register full enumeration at v<VERSION> close` — full enumeration
  of all active §6.6 register threads. Counts toward `running_ledgers` +
  `part_a_depth`.
- `## Cross-track structural pair anchor inventory` — bolded sub-themes for
  the cross-track substrate weave. Counts toward `part_b_depth` + `running_ledgers`.
- `## Tier <N> inline-Opus build-path provenance` OR `## Build path: Tier <N>`
  — provenance of the build path used for this milestone. Counts toward
  `infrastructure_block`.
- `## Cadence` — release cadence notes (counter-cadence vs forward-cadence,
  carry-forward queue size, soak observation count). Counts toward
  `infrastructure_block`.
- `## Pipeline closure` — final dev/main SHA, RH refresh disposition, ship-sync
  invariants verified. Counts toward `infrastructure_block`.

---

## Header Metadata Block

Every release starts with a structured header. Fields depend on release type:

### For series/degree releases (paired-engine style)

```markdown
# v<VERSION> -- Degree <N>: <Two-line theme>

**Released:** YYYY-MM-DD
**Degree:** <N> of 360
**Part A:** <Artist/topic> -- <Genre, Energy, Era, Location, 1-line summary>
**Part B:** <Species/companion> -- <Vocalization, Energy, Habitat, Family, 1-line summary>
**Series:** <Series name> -- <Tagline>
**Cluster:** <Cluster> (hub: <HUB-CODE>)
```

Optional (include if present):
- `**NASA Mission:** <X.Y> -- <Name> (<date>. <one-sentence context>)`
- `**Note:** <Curatorial note, e.g. deferred CSV items or integrity disclosure>`
- `**Dedicated to:** <person>`

### For GSD-phased milestone releases

```markdown
# v<VERSION> -- <Milestone name>

**Shipped:** YYYY-MM-DD
**Commits:** <N>
**Files changed:** <N> | **Lines:** +<A> / -<R>
**Phases:** <N> (<range>) | **Plans:** <N>
**Branch:** <branch>
**Tag:** v<VERSION>
```

---

## Required Sections

The scorer counts these. Each adds to the quality score.

### `## Summary`

Prose paragraph naming multiple **bolded findings**, one theme per paragraph.
Each bolded finding states a novel insight, not a restatement.

**Good pattern (from v1.49.165):**
> **LIQUID PATTERN SHATTERED.** Three consecutive liquid sounds (gurgle 26,
> twitter 27, twittering gurgle 28) established the most elegant timbral
> trilogy in the engine. Degree 29 breaks it. The Rough-winged Swallow
> produces a rough buzzy brrit...

**Target: 5+ bolded findings** in the summary, each with 2-3 sentences.

### `## Key Features`

A two-column table of metrics (Part A vs Part B, or Before vs After).
Rows typically include:

- Research Words / Lines of prose
- Files Produced
- Theory Nodes / Concepts introduced
- Cross-References count
- Sources Cited
- Safety/Verification Tests

For GSD milestones, adapt to relevant metrics (tests added, phases completed,
plans executed, etc.).

### `### Part A: <name> -- <theme>`

Deep dive. Begins with a 1-2 sentence thesis, then **multiple bolded
sub-themes** (target: 8+), each its own mini-section with bold lead-in and
rich prose body. Every sub-theme names a distinct finding.

**Pattern:**
```markdown
### Part A: <name> -- <THEME> (<comma-separated sub-theme names>)

Full deep research covering <name> as <role>, <role>, <role>:

- **<SUB-THEME NAME IN ALL CAPS> -- <descriptor>:** <2-4 sentences of prose
  naming the finding, citing evidence, connecting to the engine's prior
  state...>

- **<NEXT SUB-THEME>:** ...
```

### `### Part B: <name> -- <theme>`

Same shape as Part A. For paired-engine releases this is the species; for
other releases it may be omitted or replaced with a companion topic.

### `### The Part A/B Parallel: <descriptor>` (if applicable)

Explicit list of 3-5 resonance axes between Part A and Part B. Each axis is
numbered and has a title plus 1-2 sentences explaining the parallel.

### Running Ledger Tables

These are **cumulative across all releases** — each release extends them by
one row. They are what makes v1.49.165 special: they carry state forward.

Typical ledgers (for paired-engine series):

- **`### Acoustic Progression: <N> Elements`** — every acoustic element across
  all degrees, numbered, with Part A / Part B per row
- **`### Artist-City Patterns: <N> Named Patterns`** — every named artist-city
  pattern across all degrees
- **`### Energy Distribution: <N> Degrees`** — cumulative energy-level counts
- **`### Genre Evolution: <N> Stages`** — every genre stage with its degree
  range

For other release types, substitute relevant ledgers:
- **Test coverage progression** (tests, pass rate, delta per release)
- **Phase completion history**
- **Skill/agent inventory** (count per release)

### `### Cross-References`

Split by Part A and Part B if both exist:

```markdown
#### Part A Cross-References

| Connection | Significance |
|------------|-------------|
| **<CODE>** (<name>) | **<RELATIONSHIP LABEL>.** <1-2 sentence explanation> |
```

Target: 5+ cross-references per part, pointing at earlier releases or other
research projects.

### `### Infrastructure`

File paths, word counts, verification tags. Bullet list:

- **Part A output:** `<path>` -- `<files>`
- **Part B output:** `<path>` -- `<files>`
- N files total, ~N words combined
- Source depth and count per part
- Any new running-ledger totals
- Running gap/debt callouts (e.g. "gender gap unchanged at 6:24")

### `### Retrospective`

**Required** for every release. Three sub-sections:

#### `#### What Worked`

Bullet list of **bolded findings**. What produced value this release. 5-10
items. Each item names a specific technique, decision, or source that worked
well and says why.

**Pattern:**
- **The geographic transparency standard is the right approach.** <2-3
  sentences explaining why the decision paid off and what was learned.>

#### `#### What Could Be Better`

Same shape. What didn't work, what's still open, what to address. Tag
items with severity when applicable (CRITICAL, warning, note).

### `### Lessons Learned`

Numbered list of 8-12 lessons. Each lesson is a **bolded single-sentence
heading** followed by 2-4 sentences of elaboration. Lessons should generalize
beyond this specific release — they're instructions to future work.

**Pattern:**
> 1. **Geographic discrepancy is a structural finding, not a research
>    failure.** The engine's first honest "we don't know if this artist
>    belongs here" produced the Catalog pattern...

Lessons get extracted into the tracker; write them as standalone guidance
that reads well outside the release context.

---

## Optional Sections

Don't penalize their absence; reward their presence.

- `### Design Decisions` — architectural choices with rationale
- `### Known Gaps` — explicit enumeration of UNCONFIRMED / ESTIMATED / ASSUMED
  items (see below)
- `### The <Arc-Word> for Degree <N>` — single-word framing of the release
- Custom-topic deep dives when the release has unique content (e.g. v1.49.165's
  serrated primary mystery deserved its own sub-heading)

---

## Wrap in `<details>` (optional but recommended)

For long releases, wrap the deep-dive sections in a collapsible:

```markdown
## Key Features

<metrics table>

<details>
<summary>Read more -- Full Release Notes</summary>

### Part A: ...
### Part B: ...
...deep content...

</details>
```

This keeps the GitHub-rendered page scannable while preserving all content.

---

## Tagging Uncertain Data

When content includes unverified claims, tag them explicitly. The scorer
rewards this as an integrity signal.

| Tag | Meaning |
|-----|---------|
| `UNCONFIRMED` | Claim is made but not verified by an independent source |
| `ESTIMATED` | Value is approximate (e.g. "c. 1940") |
| `GAP` | Information is missing; no source available |
| `ASSUMED` | Working assumption that could not be confirmed |

Use these inline: _"Birth year is estimated (c. 1940). Tag: ESTIMATED."_

---

## The Completeness Score

The scorer (`tools/release-history/score-completeness.mjs`) grades each
README on these dimensions:

| Dimension | Points | Notes |
|-----------|--------|-------|
| Header block present (metadata lines) | 10 | `**Released:**` / `**Shipped:**` + at least 3 other fields |
| Summary with ≥ 3 bolded findings | 15 | Counts `**PHRASE.**` patterns in Summary |
| Key Features table | 10 | Any pipe-table after `## Key Features` |
| Part A deep section with ≥ 3 bolded sub-themes | 10 | For series releases |
| Part B deep section with ≥ 3 bolded sub-themes | 10 | For series releases |
| Retrospective with What Worked and What Could Be Better | 15 | Both sub-headings required |
| Lessons Learned with ≥ 5 numbered entries | 10 | Numbered list pattern |
| Cross-References block | 10 | `### Cross-References` heading |
| ≥ 1 running-ledger table | 5 | Acoustic Progression / Artist-City Patterns / Energy Distribution / etc |
| Infrastructure block | 5 | Files and word counts |
| **Total** | **100** | |

Grade scale:

| Score | Grade | Meaning |
|-------|-------|---------|
| 90+ | A | Gold-standard. v1.49.165 class. |
| 80-89 | B | Strong. All required sections, solid depth. |
| 70-79 | C | Acceptable. Core sections present, depth thin. |
| 60-69 | D | Marginal. Missing 2-3 required sections. |
| < 60 | F | Drifting. Flag for backfill or rewrite. |

Scores live in `release_history.release_score` (per-dimension breakdown) and
surface in `docs/RELEASE-HISTORY.md` as a `Quality` column. The audit
reports average grade across releases so regression is visible.

---

## Canonical Reference

When this template is ambiguous, defer to [`v1.49.165/README.md`](v1.49.165/README.md).
That release:

- 340 lines
- 17 sections (2 H2, 11 H3, 4 H4)
- 114 table lines
- 8+ bolded sub-themes per Part
- 4 running-ledger tables maintained cumulatively
- 10 numbered lessons
- Full Retrospective with What Worked + What Could Be Better
- Intellectual honesty throughout (first geographic discrepancy documented
  transparently, unsolved serrated-primary mystery treated as feature not bug)

If your release doesn't hit those marks, your release isn't done.

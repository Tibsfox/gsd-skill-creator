# Decision: examples/ as the Canonical Artifact Library

*Archaeological record of the decision to reorganize `examples/` into a category-structured, frontmatter-driven, user-choose-what-to-install library for every Tibsfox-derived skill, agent, team, and chipset.*

**Date:** 2026-04-10
**Status:** Accepted
**Author:** Tibsfox (with AI assistance)
**Supersedes:** n/a (first decision doc in this series)

---

## Context

By 2026-04-10, the `gsd-skill-creator` project had accumulated artifacts across four locations in this repo and two sibling repos:

- `.claude/` — project-installed skills and agents
- `examples/` — reference library (flat, no categories)
- `project-claude/` — source files installed to `.claude/` by an install script
- `~/.claude/` — global user library (outside the repo)
- Sibling repos: `gsd-skill-creator/` (upstream) and `gsd-skill-creator-nasa/` (variant)

A private artifact inventory at `.planning/artifact-catalog.csv` (726 rows) surfaced the situation:

- ~397 skills across all locations (roughly 150 unique names)
- ~280 agents (roughly 110 unique names)
- 42 teams, 7 chipsets
- 625 of 726 rows had duplicate names across locations
- Many artifacts were derived from the upstream GSD project, with varying degrees of modification
- Some were adapted from [glittercowboy/taches-cc-resources](https://github.com/glittercowboy/taches-cc-resources)
- The `examples/` tree specifically had 127 artifacts (56 skills, 54 agents, 10 teams, 7 chipsets) all at flat top-level within each type

The flat structure worked at 30 artifacts, was painful at 80, and was unbrowsable at 127. Deduplication across locations was also needed: we wanted a single authoritative source of truth that declared which version was canonical and which were deprecated — without deleting the superseded ones.

## Problem

How do we organize `examples/` so that:

1. A human (or AI) can find a skill by category in <10 seconds
2. Derived-but-unchanged artifacts from upstream GSD stay under their original license (not BSL 1.1)
3. Deprecated artifacts are preserved for reference, not deleted
4. Users can pick what to install, not get the whole library
5. The "hows and whys" behind each reorganization are preserved for future readers
6. The built-in `.claude/skills/` library keeps working without modification
7. The external publishing target (`github.com/Tibsfox/skills`) isn't touched as part of this work

## Considered alternatives

### (A) Publish directly to `Tibsfox/skills` as a distribution

An earlier draft (`.planning/tibsfox-skills-reorganization-proposal.md`) targeted the published external repo. This was rejected because:

- It required immediately solving cross-repo license reconciliation
- It conflated the reorganization work with the publication work
- It required freezing the chipset format before we're ready to freeze it
- It touched a repo Tibsfox explicitly wanted unchanged

### (B) Flat structure with tagging instead of categories

Add tags to frontmatter (`tags: [gsd, research, media]`) and keep the tree flat. Rejected because:

- Browsing a flat 127-file directory is still painful even with tags
- File explorers don't surface tags; directories are what users navigate
- Tools would need a tag index to make tags useful

### (C) Deep subcategories (>15 per type)

Split each type into many fine-grained categories. Rejected because:

- Hard to classify artifacts that straddle boundaries
- Growing categories forever leads to the "where does this go?" paralysis
- Moderate count (7–10 per type) preserves browseability and tolerates occasional mis-classification

### (D) No frontmatter, manifest files instead

Use a separate `MANIFEST.json` per artifact. Rejected because:

- Duplicates information in SKILL.md/AGENT.md frontmatter
- Requires syncing two files instead of one
- Breaks the Claude Code convention of frontmatter-first metadata

### (E) Delete deprecated artifacts outright

Simplify by removing superseded work. Rejected because:

- Loses the archaeological record of how the library evolved
- Makes it impossible to see *why* a replacement exists without git archaeology
- Contradicts the explicit Tibsfox preference for preserving decision history

## Decision

Reorganize `examples/` in place with these properties:

1. **Category subfolders** (9 for skills, 7 for agents, 4 for teams; chipsets not subcategorized). Defined in `examples/CATEGORIES.md`.
2. **9-field frontmatter convention** — minimal metadata on every artifact, with `origin` + `modified` encoding licensing provenance.
3. **First-class `deprecated/` subfolder** under each type. Artifacts move here when superseded but are never deleted.
4. **Four tools** in `examples/tools/`:
   - `install.mjs` — user-choose-what-to-install
   - `validate.mjs` — frontmatter + structure checker
   - `catalog-gen.mjs` — regenerates `.planning/artifact-catalog.csv` and `.count-badge.md`
   - `license-report.mjs` — audits BSL-vs-exempt classification
5. **`LICENSE-POLICY.md`** stating the single BSL exemption rule: `origin != tibsfox AND modified == false → BSL-exempt`.
6. **Narrative `CHANGELOG.md`** capturing decision process, not just diffs. First two entries document the 2026-02-07 Taches-derived imports and the 2026-04-08 bulk import from `.claude/`.
7. **Private workshop + public archaeology**: `.planning/` holds drafts and exploration (gitignored); `docs/decisions/` holds promoted rationale when a decision becomes load-bearing. This file is the first promotion.
8. **Catalog stays private**: `.planning/artifact-catalog.csv` is not published into `examples/`.
9. **No changes to `.claude/skills/` built-ins** or to `github.com/Tibsfox/skills`.
10. **Wasteland exclusion is operational policy, not documented**: wasteland content is excluded from imports; no public explanation in README.

## Frontmatter schema

```yaml
---
name: audio-engineer
type: agent                    # skill | agent | team | chipset
category: media                # see CATEGORIES.md
status: stable                 # stable | experimental | deprecated
origin: tibsfox                # tibsfox | gsd | taches-cc-resources | community
modified: false                # true = Tibsfox-changed (BSL applies)
                               # false + non-tibsfox origin = BSL-exempt
first_seen: 2026-04-10         # first appearance in this project
first_path: .claude/agents/audio-engineer.md
description: ...
superseded_by: null
---
```

Existing rich frontmatter (`token_budget`, `activation_triggers`, `tools`, etc.) is preserved on artifacts that already have it. Stage 2 only *adds* the 9 new fields; it never replaces existing ones.

## Categories

Locked taxonomy:

**Skills (9):** `gsd, research, media, dev, ops, workflow, patterns, orchestration, state, deprecated`

**Agents (7):** `gsd, research, media, dev, ops, ui, audit, deprecated`

**Teams (4):** `code, ops, infra, migration, deprecated`

**Chipsets:** not subcategorized; flat `<name>/` directories. Deprecated ones move to `chipsets/deprecated/`.

Growth rules are in `examples/CATEGORIES.md`.

## Licensing rule

Stated once in `examples/LICENSE-POLICY.md`:

> Artifacts where `origin == tibsfox` OR `modified == true` fall under the repo's BSL 1.1 license (converting to GPL 3.0 on 2030-03-11). Artifacts where `origin != tibsfox` AND `modified == false` retain their upstream license — they are BSL-exempt.

Run `node examples/tools/license-report.mjs` to produce a per-artifact audit.

## Archaeological linking convention

Two tiers of documentation introduced by this decision:

- **`.planning/`** — private workshop. Drafts, proposals, session state, exploration. Gitignored. Can reference anything, can change freely.
- **`docs/decisions/`** — committed archaeology. When a `.planning/` proposal becomes load-bearing and we execute it, the relevant rationale is promoted here as a permanent record.

CHANGELOG entries may reference both, but must note which:
- Private references: "session archive, not in repo"
- Public references: linked directly via relative path

This decision document is the first entry in `docs/decisions/`. The source draft lives at `.planning/examples-reorganization-proposal.md` (private).

## Consequences

### Positive

- Library becomes browseable at 127 artifacts and scales to 500+
- License status is unambiguous per artifact and auditable by a script
- Deprecation is explicit, preserving reference value without cluttering the stable library
- Users can install what they want via `tools/install.mjs` without getting the whole tree
- Decision rationale is recoverable by future readers (human or AI) via CHANGELOG + docs/decisions
- Zero changes to `.claude/` built-ins means no regression risk for active work
- Zero touches on `Tibsfox/skills` preserves the external repo's current state

### Negative / accepted tradeoffs

- Frontmatter back-fill (Stage 2) touches 127 files — large diff, reviewer fatigue
- Category boundaries are judgment calls; some artifacts will straddle
- The convention requires tool runs to stay up-to-date (`.count-badge.md`, `.planning/artifact-catalog.csv`)
- Future contributors need to learn the 9-field frontmatter and the LICENSE-POLICY rule
- Archaeological writing style in CHANGELOG takes more time than terse diffs

### Open for future

- Should chipset format be frozen (spec v1) once Stage 2 completes?
- Should `gsd-skill-creator`'s main install script pull from `examples/` as a secondary source?
- When do we revisit publishing to `Tibsfox/skills` (or `Tibsfox/artifacts`)?
- Should `docs/decisions/` become a numbered ADR series (`0001-examples-library-reorganization.md`)?

## Execution plan

**Stage 1** (this commit): Directory skeleton, tools, text files (CHANGELOG, LICENSE-POLICY, CATEGORIES, new README), per-type READMEs, this decision doc. Does not move existing content.

**Stage 2** (following commit series): Classification and `git mv` of all 127 existing artifacts into their categories. Frontmatter back-fill. Chipset wrapping. Per-category README population. Validator pass. Catalog regeneration.

**Stage 3+**: Documentation updates, CI wiring (if a CI pipeline exists), follow-up decisions.

## References

- `examples/CATEGORIES.md` — taxonomy definitions
- `examples/CHANGELOG.md` — narrative history
- `examples/LICENSE-POLICY.md` — BSL + exemption rule
- `examples/tools/` — four zero-dependency Node scripts
- `.planning/examples-reorganization-proposal.md` — private draft proposal (session archive, not in repo)
- `.planning/artifact-catalog.csv` — private 726-row catalog (session archive, not in repo)
- `tools/import-filesystem-skills.ts` — the uncommitted one-shot import script that ran on 2026-04-08

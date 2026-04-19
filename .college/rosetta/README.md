# `.college/rosetta/` — Rosetta Cross-Reference Directory

This directory holds Rosetta Stone cross-reference documents that connect College department concepts to the project's 13-cluster framework. The 13-cluster map lives in `.planning/STATE.md` (the canonical table); the files here are the translation layer that makes cluster vocabulary accessible within department learning paths.

## Purpose

The Rosetta framework's core claim is that the same structural concept appears across all 13 clusters simultaneously, and that recognising the cross-cluster form of a concept is an accelerant to understanding. The files in this directory operationalise that claim by providing per-department tables mapping department-internal concept IDs to cluster vocabulary, translation axes, and sibling concepts in other domains.

## File Format Convention

Each Rosetta document follows this structure:

```yaml
---
title: "<Department Name> — Cross-Domain Translations"
cluster_ids: [<list of relevant cluster numbers 1–13>]
concept_axes: [<list of translation axes, e.g. learning, stability, boundary>]
departments: [<list of College department IDs this file bridges>]
status: proposed | active | deprecated
authors: [<synthesis source>]
dates: [<ISO-8601 date>]
---
```

Followed by the translation table body: one section per translation axis, each with a table row for each of the 13 clusters showing how the axis concept reads in that domain.

## Adding a New Cluster Cross-Reference

1. Create a file named `<department-id>-translations.md` in this directory.
2. Add YAML frontmatter with the fields above.
3. For each central concept in the department, write one translation table covering all 13 clusters.
4. Register the file in the companion department's `CROSS_LINKS.md` under a "Rosetta" section.
5. Update `.planning/STATE.md`'s cluster member count if the department introduces new cluster members.

## Relationship to STATE.md

The 13-cluster table in `.planning/STATE.md` is the authoritative source for cluster membership, hub codes, and member lists. Files here do not modify that table; they document the conceptual translation layer on top of it. For the canonical cluster map, see: [`clusters.md`](clusters.md) (reproduced here for offline reference).

## Current Files

| File | Department | Status | Cluster IDs |
|------|-----------|--------|-------------|
| (none yet — TC-rosetta-translations.md will add the first file) | | | |

Companion proposal `TC-rosetta-translations.md` handles the translation content for the Adaptive Systems department and the concept-registry wiring.

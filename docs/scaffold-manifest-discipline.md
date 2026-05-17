# Scaffold-Manifest Discipline

**Status:** Active as of v1.49.666 cc-3 Phase 4 (Lesson #10365 codification).
**Scope:** Authoring scaffold manifests that hint at content metadata — e.g.,
`tools/scaffold-sps-pages.manifest.json`, `tools/scaffold-trs-packs.manifest.json`,
and future siblings that drive `SCAFFOLD-PENDING`-marked stub generation.

## The rule

> When authoring a scaffold manifest that includes metadata hints (theme,
> K_N, milestone_bound, cohort_entry_milestone, cross-track_nasa, or any
> other field whose value can be cross-checked against historical
> release-notes), validate every hint against the bound milestone's
> release-notes BEFORE committing the manifest.

If a hint cannot be release-notes-grounded:

- Use the literal string `"pending validation"` (or for numeric fields:
  `null` with the same intent) as the placeholder.
- Surface the unvalidated field in the mission brief as a follow-on
  deliverable (cc-2-style content authoring agent can validate at
  authoring time).
- Never include speculative metadata in committed manifest fields unless
  it has been release-notes-grounded.

## Why this rule exists — the cc-1 → cc-2 50% error rate

The rule was emitted at v1.49.665 cc-2 retrospective as Lesson #10365 candidate
and codified here at v1.49.666 cc-3 Phase 4.

**Evidence:** The v1.49.664 cc-1 milestone authored
`tools/scaffold-trs-packs.manifest.json` with theme hints for six TRS packs
derived by *extrapolation* from the v657 mission brief's pack-39 destination
candidates — without grepping the release-notes for the bound milestone's
actual TRS section. The hints were:

| Pack | cc-1 hint (speculative) | cc-2 validated theme |
|---|---|---|
| pack-21 | measure theory | **topology** *(corrected)* |
| pack-22 | functional analysis | **measure theory** *(corrected)* |
| pack-33 | control theory | **mechanism design** *(corrected)* |
| pack-36 | convex optimization | convex optimization (correct) |
| pack-37 | dynamical systems | dynamical systems (correct) |
| pack-38 | functional analysis cohort-close | functional analysis cohort-close (correct) |

**Error rate: 3 of 6 hints (50%) wrong.** Conservative cc-2 sub-agent caught the
errors by grep-validating against release-notes during content authoring. The
ship process correctly substituted the validated themes into the manifest and
content. No corruption shipped — but the cost was 3 sub-agent corrections that
would not have been needed if the cc-1 manifest had been authored discipline-first.

The remaining 19 deferred TRS packs (pack-14..20 + 23..32 + 34..35) at cc-2
close were left with `"theme": "pending"` *because of this lesson* — cc-2
chose conservative deferral over a second round of speculation.

## How to apply

### Authoring path

Before committing a scaffold manifest with metadata hints:

```bash
# For each entry that hints at theme / K_N / milestone_bound:
grep -rln "pack-NN\|K_NN" docs/release-notes/
# Or, for the bound-milestone-specific lookup:
grep -A 5 "pack-NN" docs/release-notes/<bound-milestone>/chapter/*.md
```

If grep returns no hits, the hint is speculative — mark `"pending validation"`
and defer to the content-authoring milestone.

### Content-authoring path

When a downstream sub-agent (or main-context author) processes a manifest
entry with `"pending validation"` or null metadata fields:

- Treat the field as authoritatively unknown.
- Grep-validate against release-notes as the *first* step of authoring.
- Once authored, update the manifest in the same commit that creates the
  content (or as a paired commit) — never leave validated metadata stranded
  in content while the manifest still says `"pending"`.

### Mission-brief path

Mission briefs that drive scaffold-manifest authoring should explicitly:

- List which fields are hints (speculative) vs. release-notes-grounded.
- Include a §"validate against release-notes" deliverable for any field
  marked hint.
- Avoid the trap of "informed extrapolation" — if a hint feels obvious
  from naming, grep anyway; the cc-1 cases all *looked* like sensible
  extrapolations from the prior milestone's release-notes.

## Out of scope at v666

A helper script `tools/validate-manifest-hints.mjs` was proposed at cc-3
Phase 4 (C13). It would take a manifest path + a metadata-field-list +
grep-against-release-notes and report unsupported hints as WARN. **Deferred**
as FA-666-N forward — manual grep validation is sufficient at current
manifest-authoring frequency. Reconsider if scaffold-manifest authoring
becomes routine enough that automation pays for itself.

## Lesson cross-references

- **Lesson #10169** (gate-not-vigilance) — this rule is codified discipline,
  not vigilance: the audit step happens at manifest-author time, not at
  ship time. Future work to mechanize this (`validate-manifest-hints.mjs`)
  would convert it from discipline-as-doc to discipline-as-gate.
- **Lesson #10172** (closure-verification + scope-expansion re-framing) —
  the cc-1 manifest is a closure-verification artifact for the cc-1 → cc-2
  cross-track scaffold-then-fill pattern; speculative hints in the manifest
  corrupt the closure-verification.
- **Lesson #10215** (parallel sub-agent dispatch tractable for independent
  work) — the parallel-dispatch model exposed the 50% error rate cleanly:
  one conservative sub-agent's release-notes validation pass invalidated
  speculation that had been baked into the cc-1 manifest. Without parallel
  dispatch the error would have shipped.
- **Lesson #10265** (cross-track scaffold-then-fill step 1 / step 2) — this
  rule applies to step 1 (scaffold) authoring; step 2 (fill) sub-agents
  then take the manifest as authoritative.

## Related discipline docs

- [`MISSION-PACKAGE-DISCIPLINE.md`](MISSION-PACKAGE-DISCIPLINE.md) — closure-
  verification + scope-expansion re-framing + apply-to-self templates;
  this doc's §Lesson coverage list cross-references Lesson #10365 to here.
- [`counter-cadence-discipline.md`](counter-cadence-discipline.md) — counter-
  cadence cleanup-mission pattern + gate-not-vigilance + 3-cluster lifecycle.
  The cc-1 → cc-2 → cc-3 cluster that produced Lesson #10365 is the v666
  exemplar of the 3-cluster lifecycle.
- [`sub-agent-dispatch-discipline.md`](sub-agent-dispatch-discipline.md) —
  the parallel-dispatch + commit-between-deliverables discipline that made
  the 50% error rate detectable without shipping the corruption.

## Provenance

- **Codified:** v1.49.666 cc-3 Phase 4 (FA-665-3 close).
- **Lesson emit:** v1.49.665 cc-2 retrospective `chapter/04-lessons.md`
  §"Lesson #10365 candidate".
- **Evidence corpus:** v1.49.664 cc-1 manifest commit + v1.49.665 cc-2
  pack-21 / pack-22 / pack-33 correction commits.

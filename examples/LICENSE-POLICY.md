# License Policy for examples/

This repository is licensed under the **Business Source License 1.1 (BSL 1.1)**, converting to **GPL 3.0 on 2030-03-11**. See the repo root `LICENSE` file for the full text.

Not every artifact in `examples/` falls under BSL 1.1. Some are derived from upstream projects that retain their original licenses. This policy explains how to tell the difference.

## The exemption rule

An artifact in `examples/` is **BSL-exempt** — it retains its upstream license instead of BSL 1.1 — when both of these are true in its frontmatter:

1. `origin` is something other than `tibsfox`
2. `modified` is `false`

In other words: **if we imported it from somewhere else and haven't changed it, we don't apply BSL to it.** The upstream license governs.

## When BSL 1.1 applies

BSL 1.1 applies when either of these is true:

- `origin: tibsfox` — we authored it here
- `modified: true` — we imported something and meaningfully changed it (modifying the description, restructuring the content, adapting the scope, etc.)

A "minor fix" (typo, formatting, frontmatter addition only) does not flip `modified` to `true`. The flag reflects *content* changes, not mechanical ones.

## The origin field

Possible values:

| `origin` | Meaning |
|----------|---------|
| `tibsfox` | Authored by Tibsfox directly in this project |
| `gsd` | Derived from the GSD (Get Shit Done) upstream project |
| `taches-cc-resources` | Derived from [glittercowboy/taches-cc-resources](https://github.com/glittercowboy/taches-cc-resources) |
| `community` | Derived from various community sources; attribution is in the artifact's `description` or accompanying notes |

## Attribution

For artifacts where `origin` is not `tibsfox`, attribution lives:

- In the artifact's frontmatter (`origin` field pointing to the upstream)
- In the CHANGELOG.md entry that records the import
- For Taches-derived work specifically, in the 2026-02-07 CHANGELOG entry

## Verification

Run `tools/license-report.mjs` from the repo root to produce a per-artifact report of BSL-vs-exempt classification. The report is written to `.planning/license-audit.csv` (private).

```bash
node examples/tools/license-report.mjs
```

The script also flags any artifacts with missing or contradictory frontmatter (e.g., `origin: tibsfox, modified: false` is redundant but not wrong; missing `origin` is an error).

## Adding new artifacts

When adding a new artifact to `examples/`:

1. Decide the `origin` honestly — where did this come from?
2. Set `modified` to `false` at import time if unchanged, `true` if you've adapted it
3. If deriving from a third-party source not listed above, add the source to the "origin field" table in this document in the same commit
4. Credit upstream authors in the CHANGELOG entry for the import

## Changing an existing artifact

When you modify an existing artifact that was previously `modified: false`:

1. Flip `modified: true` in its frontmatter
2. The artifact now falls under BSL 1.1
3. Note the modification in CHANGELOG.md with a dated entry

This is a one-way door: once `modified: true`, the artifact stays BSL 1.1 even if it's later reverted, because the change happened on the record.

## Questions this policy does not answer

- **What to do if the upstream license is incompatible with BSL conversion to GPL in 2030.** Deferred; we'll deal with it if/when it becomes real.
- **How to relicense a BSL artifact to a more permissive license** for a specific downstream use. Case-by-case; contact the maintainer.
- **Whether chipsets have a different policy.** They don't. Same rules apply.

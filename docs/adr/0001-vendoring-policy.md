# ADR 0001 — Vendoring policy for upstream-sourced files

- **Status:** Accepted
- **Date:** 2026-04-25
- **Milestone:** v1.49.576 (OOPS-GSD Implementation, Phase 821 / Component C0)
- **Supersedes:** none
- **Superseded by:** none
- **Related:** ADR 0002 (dual-impl decision record); OGA-048, OGA-049, OGA-050, OGA-051, OGA-052

## Context

The repository imports a substantial set of files from the upstream `gsd-build/get-shit-done` project — currently the entire `.claude/commands/gsd/` command surface (81 commands), most of `.claude/agents/` (the GSD agent family), and roughly half of `.claude/hooks/` (every script whose name begins with `gsd-`). These files were vendored in at upstream version `1.38.3`, as recorded by the `gsd-hook-version: 1.38.3` header stamp on the hook scripts and by `$REPO/.claude/get-shit-done/VERSION`.

Two facts have since drifted apart:

1. **The repository ships at v1.49.x.** Local enhancements have been added on top of the vendored files. In four documented cases — OGA-048 (`validate-commit`), OGA-049 (`phase-boundary`), OGA-050 (`session-state`), OGA-051 (`snapshot/recovery`) — the local enhancement was added by writing a parallel `.cjs` sibling next to the vendored `.sh` rather than editing the vendored file in place. This is the dual-implementation pattern: a side-channel for "I want a change but I'm not sure I'm allowed to touch the vendored copy."
2. **The `gsd-hook-version: 1.38.3` stamp records where the file came from but not whether it has since been edited.** A maintainer who modifies `gsd-validate-commit.sh` to add a project-specific check leaves the stamp at `1.38.3`. A future "is this file modified from upstream?" check would falsely conclude unchanged. (OGA-052 documents this.)

The downstream impacts are concrete:

- **`gsd update` may overwrite local edits.** The `update` skill re-vendors upstream files. With no policy for what counts as locally modified, every upstream sync silently destroys local enhancements.
- **PR-back-to-upstream is blocked.** Without a clean diff between "what we vendored" and "what we changed," there is no safe way to send improvements back upstream.
- **The dual-impl pattern is the symptom, not the disease.** Maintainers chose the parallel-`.cjs` workaround because they had no policy that said editing the vendored file was safe. Until we publish that policy, the next vendored upstream file becomes the next dual-impl trap.

This ADR establishes that policy.

## Decision

**Every file in this repository sourced from `gsd-build/get-shit-done` (or any other upstream that we vendor) carries a three-line origin marker. The marker uses two existing-style header lines plus one new boolean.**

The chosen marker uses **option (a) — a `local-modified: true` boolean** rather than option (b) — re-stamping with a `gsd-skill-creator-hook-version`. The boolean is preferred because:

1. It composes cleanly with the existing `gsd-hook-version` stamp without introducing a second version-string maintenance surface.
2. It distinguishes the three required states with one bit (`true` / `false` / absent), versus option (b) which requires the maintainer to invent and maintain a second version string at every edit.
3. The boolean answer is the question `gsd update --check-modified` actually needs to ask. A second version string would force `gsd update` to compare semver-like tokens, which is more complex and more error-prone than reading a boolean.

### Marker schema

For every file vendored from upstream, the file's header (a comment block at the top, syntax-appropriate for the file type) must contain:

```
# gsd-hook-version: 1.38.3                        # required: the upstream version vendored
# local-modified: true|false                      # required: has the file been edited since vendoring?
# local-modified-since: gsd-skill-creator/v1.49.x # required iff local-modified = true
```

For files that are **locally authored** — neither vendored nor a fork of a vendored file — the header instead carries:

```
# gsd-skill-creator-hook-version: v1.49.x         # required: locally authored, no upstream lineage
```

Notice that the locally-authored header uses a different stamp name (`gsd-skill-creator-hook-version`) so a stamp-grep can reliably distinguish vendored from locally-authored files in O(1).

### Three valid states for any file

Combining the markers yields exactly three distinguishable states:

| State | `gsd-hook-version` | `local-modified` | `gsd-skill-creator-hook-version` | Meaning |
|-------|-------------------:|------------------|----------------------------------|---------|
| **A. Upstream-unmodified vendor copy** | present (e.g. `1.38.3`) | `false` | absent | Vendored file, unedited since vendoring. `gsd update` may overwrite without warning. |
| **B. Locally-forked vendor copy** | present (e.g. `1.38.3`) | `true` | absent | Vendored file with local edits. `gsd update` must refuse to overwrite without `--force`; the maintainer must reconcile manually. |
| **C. Locally-authored** | absent | absent | present (e.g. `v1.49.500`) | Never came from upstream. `gsd update` must never touch this file. |

Any file with a different combination (e.g. both `gsd-hook-version` and `gsd-skill-creator-hook-version` present, or `local-modified: true` without `local-modified-since`) is a policy violation and must fail validation.

### Editing protocol

1. **Editing a state-A file (upstream-unmodified):** the maintainer's first edit must flip `local-modified: false` → `true`, add the `local-modified-since` line, and stage the marker change as part of the same commit as the substantive edit. This converts the file from state A to state B atomically.
2. **Editing a state-B file (already locally-forked):** the maintainer should bump `local-modified-since` to the current version. Optionally append a one-line rationale that points to a CHANGELOG entry.
3. **Authoring a new file:** stamp it with `gsd-skill-creator-hook-version: v1.49.x` immediately. Never use `gsd-hook-version` for a file that did not actually come from upstream.
4. **Re-vendoring an upstream file (intentional re-sync):** if the file is currently state B and the maintainer has decided to abandon the local fork, replace the file wholesale with the new upstream copy and reset the marker to state A. Document the decision in the commit body.

### Enforcement

- **`gsd update`** (skill or future CLI) must refuse to overwrite any file with `local-modified: true` unless invoked with `--force`. Locally-authored files (state C) must never be touched.
- **CI / pre-publish gate** (deferred to a later wave) should grep every file under `.claude/commands/`, `.claude/agents/`, `.claude/hooks/` for one of the three valid stamp combinations and fail if any file is unstamped or carries an invalid combination.
- **Code review** should treat any PR that changes a vendored-state-A file as also requiring the marker flip, just as TypeScript reviewers treat type changes as also requiring callsite updates.

## Consequences

### Positive

- **`gsd update` becomes safe.** Local edits survive upstream syncs because the marker tells the updater what it owns and what it does not.
- **PR-back-to-upstream becomes possible.** A clean diff between vendored and locally-edited files is one boolean-grep away.
- **Dual-impl pairs become unnecessary.** The OGA-048 through OGA-051 workaround — adding a parallel `.cjs` to avoid editing the vendored `.sh` — was driven by the absence of this policy. With the marker in place, future maintainers can edit the vendored file directly and flip the boolean. ADR 0002 records the decisions for the four existing pairs.
- **The drift question becomes introspectable.** OOPS-style audits can answer "what has diverged from upstream" by counting `local-modified: true` headers.

### Negative

- **One-time audit cost.** Every existing vendored file must be triaged into state A or state B and stamped accordingly. The hook surface is small (~36 files); the command surface (81 files) and agent surface (33 GSD agents) are larger but still bounded. C2 and C6 absorb this cost as part of their respective scopes.
- **Marker maintenance burden.** Maintainers must remember to flip the boolean on first edit. A pre-commit hook that diffs the file content against the upstream snapshot and fails if `local-modified` is still `false` would automate this; a future ticket should add it.

### Neutral

- **Choice of boolean over re-stamping.** The two options are equally expressive in principle. The boolean is chosen for the reasons given in the Decision section. If a future ADR finds the boolean too coarse (e.g., we want to know *which* version a file diverged at), it can supersede this ADR by adding the version string as a fourth header line without breaking the boolean semantics.

## Alternatives considered

### Alternative 1 — Status quo (rejected)

Continue with the `gsd-hook-version: 1.38.3` stamp alone. Rejected because it provides no signal on local edits, which is the exact problem we are trying to solve. The dual-impl pattern would persist as the de-facto workaround.

### Alternative 2 — Re-stamp on local edit (option b)

Add a second header `gsd-skill-creator-hook-version: v1.49.500` whenever the file is edited locally. Rejected because it requires the maintainer to invent and maintain a second version string at every edit, which is more friction than flipping a boolean and is more likely to drift out of sync with the actual repository version. The boolean answers the question `gsd update` actually needs to ask.

### Alternative 3 — Fork and rename (rejected)

When local enhancements are needed, copy the vendored file to a different name and edit the copy. Rejected because this is what already happened (OGA-048 through OGA-051) and is the source of the drift, not the cure. Two files registered under the same event with no documented authority is exactly the problem.

### Alternative 4 — Refuse to edit vendored files at all; require all customisation via configuration (rejected)

This is the cleanest model in principle but is incompatible with the current state of the codebase, where many vendored files have project-specific behaviour baked in. A future ADR could move toward this model gradually; this one keeps the door open.

## References

- OGA-048 — Dual-impl hook pair: validate-commit
- OGA-049 — Dual-impl hook pair: phase-boundary
- OGA-050 — Dual-impl hook pair: session-state
- OGA-051 — Snapshot-pair status (PreCompact/PostCompact)
- OGA-052 — gsd-hook-version stamp policy (root cause)
- `arXiv:2604.21744` — GROUNDINGmd, two-class taxonomy of Hard Constraints vs Convention Parameters; this ADR is a Convention Parameter (overridable with explicit typed override; not a non-negotiable invariant)

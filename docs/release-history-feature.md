---
title: "Release History Tracking"
layer: feature
path: "release-history-feature.md"
summary: "A queryable, publishable ledger of every shipped release, with retrospectives and lessons tracked across the project's lifetime."
reading_levels:
  glance: "Keep the archive honest. Every release gets a chapter, every retrospective becomes a lesson, every lesson gets a status."
  scan:
    - "Three passes: baseline → per-release stories → retrospective tracker"
    - "Two database choices: SQLite (zero config) or Postgres (shared)"
    - "Six allowlisted chapter files per release, published to GitHub and/or your website"
    - "Leak scanner blocks private content from leaving the local tree"
    - "One-command refresh keeps filesystem, database, and publish targets in lockstep"
last_verified: "2026-04-17"
---

# Release History Tracking

A feature of gsd-skill-creator that turns `docs/release-notes/` into a **single source of truth**: indexed in Postgres or SQLite, projected as a continuous prose story under `.planning/roadmap/`, and optionally published to GitHub and your website.

The feature exists because most projects drift: retros get skipped, index files lag the filesystem, lessons from v1.10 stop being tracked by v1.50. This tool closes the loop.

## What You Get

After `init` + `refresh`, any repo with a `docs/release-notes/v*/README.md` tree gets:

| Artifact | What |
|----------|------|
| `docs/RELEASE-HISTORY.md` | Auto-regenerated index with `Retro`/`Lessons` columns, snapshot line, every row linked |
| `.planning/roadmap/v*/` | One prose chapter per release — summary, features, metrics, retrospective, lessons, context |
| `.planning/roadmap/STORY.md` | "Read this directory like a book" — top-level ToC |
| `.planning/roadmap/RETROSPECTIVE-TRACKER.md` | Every retrospective lesson with status (applied / deferred / investigate / superseded), sortable by age |
| Postgres `release_history.*` or `.planning/release-history.db` | 6-table schema: `release`, `feature`, `metric`, `retrospective`, `lesson`, `publish_target` |
| `.planning/missions/release-history-tracking/VERIFICATION.md` | 10-gate acceptance-criteria report |
| `docs/release-notes/v*/chapter/` (optional) | GitHub-published mirror |

## Quick Start

```bash
# 1. Initialize (detects paths, applies schema, installs hook)
node tools/release-history/init.mjs --yes

# 2. Run the pipeline (idempotent, ~30s for 600 releases)
node tools/release-history/refresh.mjs --fast

# 3. Read the archive
less .planning/roadmap/STORY.md
less .planning/roadmap/RETROSPECTIVE-TRACKER.md

# 4. (Optional) publish to GitHub + website staging
node tools/release-history/publish.mjs --execute
```

No Postgres? `init.mjs` defaults to SQLite at `.planning/release-history.db`. Zero config beyond `npm install better-sqlite3`.

Have Postgres? Set `RH_POSTGRES_URL` in your environment, re-run `init.mjs`. Schema applied via `psql`.

## The Three Passes

The pipeline models the mission as three conceptual passes. Tools run them all in sequence via `refresh.mjs`; you can also run them individually.

### Pass 1 — Baseline Map

| Script | Reads | Writes |
|--------|-------|--------|
| `scan.mjs` | `docs/release-notes/` + `docs/RELEASE-HISTORY.md` | `.planning/release-cache/_reconciliation.json`, regenerated `INDEX.md` |
| `ingest.mjs` | Per-release README metadata | `release_history.release` |
| `ingest-deep.mjs` | Per-release features + retro blocks | `release_history.feature`, `release_history.retrospective` |
| `extract-metrics.mjs` | "By the Numbers" / "Engine Statistics" tables | `release_history.metric` |
| `seed-ghosts.mjs` | `cfg.ghosts[]` | Rows for releases that exist in the index but never got README dirs |

### Pass 2 — Per-Release Stories

| Script | Reads | Writes |
|--------|-------|--------|
| `chapter.mjs` | `release_history.*` | `.planning/roadmap/v*/00-summary.md`, `01-features.md`, `02-metrics.md`, `03-retrospective.md`, `04-lessons.md`, `99-context.md` + top-level `STORY.md`, `INDEX.md` |

Each `00-summary.md` opens with a **bridge sentence** from the prior release, so the chapters read as one continuous narrative.

### Pass 3 — Retrospective Tracker

| Script | Reads | Writes |
|--------|-------|--------|
| `extract-lessons.mjs` | `release_history.retrospective` (kind=lessons_learned, what_could_be_better) | `release_history.lesson` |
| `classify-and-track.mjs` | `lesson` + `release` + `feature` | `RETROSPECTIVE-TRACKER.md`; updates lesson rows with rule-based status |
| `llm-tiebreaker.mjs` *(optional)* | Investigate lessons with distinctive keywords | Re-classified lessons via `claude -p`; LLM reasoning stored in `classification_note` |

The classifier is **deliberately strict**: a lesson is only `applied` if a later release (within 100 versions) has ≥2 distinctive-keyword hits OR ≥3 total hits with one distinctive. The tracker's default posture is "open until proven closed."

## Single-Command Refresh

```bash
node tools/release-history/refresh.mjs [--fast] [--no-classify] [--publish]
```

Runs all 10 steps in sequence, idempotent, ~30 seconds for 600 releases. Add `--publish` to also stage publisher output.

## Configuration

Two-file layout, deep-merged at load time:

| File | Role | VCS |
|------|------|-----|
| `release-history.config.json` | Generic defaults | committed |
| `release-history.local.json` | Your project's overrides | gitignored |
| `release-history.local.json.example` | Template | committed |

### What's in `release-history.config.json`

- Filesystem paths (`source_dir`, `roadmap_dir`, etc.)
- DB driver choice (sqlite default)
- Version regex — supports 2/3/4-segment semver
- Publish allowlist (which chapter files are eligible to publish)
- Leak-scan patterns (minimal safe defaults)
- Classifier thresholds
- LLM tiebreaker config (opt-in)

### What you put in `release-history.local.json`

- Switch to Postgres with `db.driver = "postgres"` + `RH_POSTGRES_URL`
- Extra publish targets — your website staging path, mirror destinations
- Your own leak-scan patterns (company names, private paths, secrets)
- `ghosts[]` for releases indexed but missing README dirs
- `audit.cold_read_quiz[]` for project-specific audit facts

## Database Choice

| Concern | SQLite | Postgres |
|---------|--------|----------|
| Setup | `npm install better-sqlite3` — done | Shared DB with `release_history` schema |
| Storage | `.planning/release-history.db` | Your DB of record |
| Speed (600 releases) | ~30s full pipeline | ~30s full pipeline |
| Multi-user | No | Yes |
| Queryable by other tools | Via `sqlite3` CLI | Any SQL client |
| CI-friendly | Yes (ephemeral) | Yes (fixture DB) |

The adapter (`tools/release-history/db.mjs`) rewrites queries automatically:

- `$N` placeholders → `?` for SQLite
- `release_history.` schema prefix stripped for SQLite
- `now()` → `strftime(...)`, `::int` casts dropped, `to_char()` → column, `string_agg` → `group_concat`
- Booleans coerced to 0/1 for SQLite bindings
- `TRUNCATE` replaced with `DELETE FROM` + `sqlite_sequence` reset

Neither driver dependency is required until selected — both are lazy-imported.

## Publishing

```bash
node tools/release-history/publish.mjs                # dry-run (default)
node tools/release-history/publish.mjs --execute      # write
node tools/release-history/publish.mjs --target github --version v1.49.39 --execute
```

Targets come from `cfg.publish.targets[]`. Each target is a `local_copy` with a templated `dest`:

```json
{ "name": "github",  "kind": "local_copy", "dest": "docs/release-notes/{version}/chapter/{file}" }
{ "name": "website", "kind": "local_copy", "dest": "www/example.com/release-story/{version}/{file}" }
```

Placeholders: `{version}`, `{file}`, `{file_lowercased}`.

Idempotency: `publish_target` table records `source_checksum` per (version, file, target). Unchanged source = no-op.

### Safety

Two gates, both run **before** any write:

1. **Allowlist** (basename-strict) — only `00-summary.md`, `01-features.md`, …, `99-context.md` plus `STORY.md` and `INDEX.md` are eligible. Continuation files (`03a-`, `03b-`) handled by prefix regex.
2. **Leak scanner** — every candidate file scanned against `cfg.leak_scan_patterns[]`. Any match blocks that file from publishing. Default patterns block references to `.planning/fox-companies/`, `HANDOFF-*`, etc. Your `local.json` adds company-specific patterns.

Patterns are case-sensitive. Use inline `(?i:...)` for case-insensitive.

### External Publish Scripts

The publisher stages files locally. Your publish script takes the staged tree and pushes it. Templates in `tools/release-history/examples/`:

| Template | Use for |
|----------|---------|
| `publish-rsync.sh.example` | SSH-accessible server |
| `publish-s3.sh.example` | AWS S3 + optional CloudFront |
| `publish-gh-pages.sh.example` | GitHub Pages (via git worktree) |
| `publish-ftp.sh.example` | FTP host via lftp |
| `publish-netlify.sh.example` | Netlify deploy |

Copy, drop the `.example` suffix, customize the configure-these block at the top.

## LLM Tiebreaker (Optional)

For lessons the rule-based classifier can't confidently close, run:

```bash
node tools/release-history/llm-tiebreaker.mjs --limit 100
node tools/release-history/llm-tiebreaker.mjs            # all candidates
```

Batches 5 lessons per `claude -p` call. Each batch returns JSON with `status + reasoning + evidence_version`. Classifications land with `classification_source='llm'` and `requires_review=true` — the tracker shows them in a "Needs Review" section for human confirmation.

Requires the `claude` CLI. For other LLM providers, override `cfg.llm_tiebreaker.cli_command` and `cli_args` with a prompt placeholder (`{prompt}`).

## Audit

```bash
node tools/release-history/audit.mjs
```

Runs 10 acceptance-criteria gates:

| AC | What |
|----|------|
| AC1 | Filesystem ↔ index parity (drift = 0, excluding configured ghosts) |
| AC2 | DB row count = chapter directory count |
| AC3 | Every release has a non-empty `00-summary.md` |
| AC4 | Releases post-gap have `has_retrospective` or `retrospective_status` set |
| AC5 | Tracker row count ≥ DB lesson count |
| AC6 | Roundtrip fidelity (10-release sample — name present in regenerated chapter) |
| AC7 | Publish dry-run clean (0 blocked, 0 violations) |
| AC8 | Every chapter has prev/next links in `99-context.md` |
| AC9 | Cold-read quiz (config-driven; generic fallback: STORY.md + TRACKER exist) |
| AC10 | Leak scan clean on 200-chapter sample |

Writes `.planning/missions/release-history-tracking/VERIFICATION.md`. Exit 0 = all pass; exit 1 = any fail.

## Auto-Refresh on Commit

`init.mjs` symlinks `tools/release-history/hooks/post-commit.sh` into `.git/hooks/post-commit`. The hook only runs the pipeline if the commit touched `docs/release-notes/` or `docs/RELEASE-HISTORY.md`, and it runs in the background so it never blocks `git commit`. Output goes to `.local/release-history-refresh.log`.

To uninstall: `rm .git/hooks/post-commit`.

To disable without uninstalling: `export RH_SKIP_HOOK=1` (hook checks this).

## Schema

See `migrations/release-history/001-init.postgres.sql` and `001-init.sqlite.sql`.

Six tables:

```
release         — one row per version; natural key = version
feature         — per-release feature sections
metric          — per-release metric table rows
retrospective   — per-release retro blocks by kind
lesson          — individual lessons with cross-version lifecycle
publish_target  — checksum-tracked publish destinations
```

Foreign keys cascade from `release`. `lesson` uniquely has `applied_in_version` + `superseded_by_version` references.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `fatal: Missing release-history.config.json` | Run `node tools/release-history/init.mjs --yes` |
| `SQLite driver requires better-sqlite3` | `npm install better-sqlite3` (optional peer dep) |
| `release table not found` | Apply the driver-specific migration under `migrations/release-history/` |
| Audit AC1 fails with drift | Run `scan.mjs` and inspect `.planning/release-cache/_reconciliation.json` |
| Publish blocks files | Inspect `_publish-report.json` → `violations[]`. Fix chapter content or tighten scanner |
| LLM tiebreaker misclassifies | Set `classification_source='human'` on the row — future runs preserve your decision |

## Design Principles

The feature follows project-wide rules:

- **The archive is sacred** — every release gets an immutable chapter; nothing is deleted.
- **Fix or amend** — drift between index and filesystem is reconciled, not hidden.
- **Safety is never parallel** — allowlist + leak scanner run on the critical path.
- **Deny by default** — publisher dry-runs until `--execute`, leak scanner can't be bypassed with `--force-publish`.
- **Calm by default** — most output is progress pings; details go to report files for later reading.
- **Leverage over power** — the adapter's SQL rewriter lets one codebase target two drivers without duplicating logic.

## What's Next (Open Work)

- `rh review` TUI for the LLM-classified rows
- `publish.mjs --target` auto-discovery from `scripts/` directory
- CI workflow template (`.github/workflows/release-history.yml`)
- Optional HTML rendering of chapters for static-site targets

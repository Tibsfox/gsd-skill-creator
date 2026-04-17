# Release History Tooling

One-command pipeline that keeps your release-notes tree, a local database, and
optional publish mirrors in lockstep.

**Full feature guide:** [`docs/release-history-feature.md`](../../docs/release-history-feature.md) — philosophy, setup, config, the three-pass workflow, publishing, audit, troubleshooting.

**Mission spec:** [`.planning/missions/release-history-tracking/`](../../.planning/missions/release-history-tracking/) — vision, components, test plan.

## Quick Start

```bash
# One-shot setup for a fresh repo
node tools/release-history/init.mjs --yes

# One-shot refresh (idempotent)
node tools/release-history/refresh.mjs --fast

# Publish (dry-run by default)
node tools/release-history/publish.mjs --execute
```

`init.mjs` detects paths, picks SQLite by default (Postgres if `RH_POSTGRES_URL` is set), applies the schema, installs the post-commit hook, and runs a baseline scan.

## Configuration

Two-file layout, deep-merged:

| File | VCS | Purpose |
|------|-----|---------|
| `release-history.config.json` | committed | generic defaults |
| `release-history.local.json` | gitignored | project-specific overrides |
| `release-history.local.json.example` | committed | template |

See the [feature doc](../../docs/release-history-feature.md#configuration) for schema details.

## Daily Commands

```bash
# Full refresh — all 10 steps, idempotent, ~30-60s
node tools/release-history/refresh.mjs

# Fast refresh (skips metric scan)
node tools/release-history/refresh.mjs --fast

# Full + publisher dry-run
node tools/release-history/refresh.mjs --publish

# Just the audit gate
node tools/release-history/audit.mjs

# Publish to configured targets
node tools/release-history/publish.mjs --execute

# Publish one release to one target
node tools/release-history/publish.mjs --version v1.49.39 --target github --execute

# Run the LLM tiebreaker (optional, requires `claude` CLI)
node tools/release-history/llm-tiebreaker.mjs --limit 100
```

## Individual Tools

| Tool | What it does |
|------|--------------|
| `init.mjs` | First-time setup — detects paths, applies schema, installs hook |
| `scan.mjs` | Reconcile filesystem ↔ release-history index file |
| `ingest.mjs` | Load release metadata into DB |
| `seed-ghosts.mjs` | Upsert ghost releases from `cfg.ghosts[]` |
| `ingest-deep.mjs` | Extract features + retrospective blocks |
| `extract-metrics.mjs` | Parse "By the Numbers" tables into metrics |
| `extract-lessons.mjs` | Split retrospective blocks into individual lessons |
| `classify-and-track.mjs` | Rule-based classifier + writes `RETROSPECTIVE-TRACKER.md` |
| `chapter.mjs` | Generate `.planning/roadmap/v*/` prose chapters |
| `regen-history-md.mjs` | Rewrite `docs/RELEASE-HISTORY.md` from DB |
| `llm-tiebreaker.mjs` | LLM classification of ambiguous lessons |
| `publish.mjs` | Sync allowlisted chapters to configured targets |
| `audit.mjs` | Run all 10 acceptance-criteria gates |
| `refresh.mjs` | One-shot: run the whole pipeline |
| `config.mjs` | Config loader (used by all other scripts) |
| `db.mjs` | Database adapter (Postgres + SQLite) |

All tools are idempotent. Re-running does no harm.

## Publish Script Templates

`examples/` has ready-to-use templates:

- `publish-rsync.sh.example` — SSH/rsync
- `publish-s3.sh.example` — AWS S3 + CloudFront
- `publish-gh-pages.sh.example` — GitHub Pages (git worktree)
- `publish-ftp.sh.example` — FTP via lftp
- `publish-netlify.sh.example` — Netlify deploy

Copy, drop the `.example`, customize the configure-these block at the top.

## Data Topology

```
docs/release-notes/v*/README.md   ← human-authored source
        │
        ▼
  release_history.*  (Postgres or SQLite)  ← canonical, queryable
        │
        ▼
  .planning/roadmap/v*/*.md   ← prose projection (private)
        │
        ▼
  Configured publish targets   ← public mirrors (allowlist + leak scan)
```

The database is authoritative. Markdown under `.planning/roadmap/` is a projection
regenerable from the DB. Publish targets are filtered by allowlist + leak scanner.

## Safety Rules

- `publish.mjs` defaults to dry-run. Real writes require `--execute`.
- Leak scanner is a hard gate — patterns configured via `cfg.leak_scan_patterns[]`.
- Human `status` overrides on lessons (via `classification_source='human'`) are
  preserved through re-runs of the classifier and LLM tiebreaker.
- `.planning/roadmap/` is typically gitignored; the DB is authoritative if they
  disagree (regenerate via `node tools/release-history/chapter.mjs`).

## See Also

- [Feature doc](../../docs/release-history-feature.md) — complete guide
- [Mission spec](../../.planning/missions/release-history-tracking/) — design + acceptance criteria
- [Examples](./examples/) — publish script templates

# KB Query Patterns

Common SQL queries against `.gsd/intelligence/intelligence.db` (per-project DB
written by the TS `KBStore`). All queries are sqlite3-CLI compatible — copy,
paste, replace the bind values, run.

The schema lives at `src/intelligence/db/migrations/001_initial.sql` (+ the
snapshot-diff cache at `002_snapshot_diff_cache.sql`).

## Top 30 findings by severity × confidence

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT id, kind, severity, confidence, title, rationale, source_path
FROM findings
WHERE project_id = ? AND status = 'open'
ORDER BY
  CASE severity WHEN 'high' THEN 3 WHEN 'med' THEN 2 ELSE 1 END * confidence DESC
LIMIT 30;
"
```

## In-flight bundles + their decision states

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT b.id AS bundle_id, b.emitted_at, d.id AS decision_id, d.kind, d.state, d.ai_draft_title
FROM bundles b
JOIN bundle_decisions bd ON bd.bundle_id = b.id
JOIN decisions d ON d.id = bd.decision_id
JOIN meetings m ON m.id = b.meeting_id
WHERE m.project_id = ?
ORDER BY b.emitted_at DESC, d.state;
"
```

## Orphan vision drafts older than 14 days

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT d.id, d.ai_draft_title, m.started_at, julianday('now') - julianday(m.started_at) AS days_old
FROM decisions d
JOIN meetings m ON m.id = d.meeting_id
WHERE d.state IN ('pending', 'sent_now')
  AND d.emitted_at IS NULL
  AND m.project_id = ?
  AND julianday('now') - julianday(m.started_at) > 14
ORDER BY m.started_at;
"
```

## Stalled missions (per C03's stalled-mission detector)

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT
  d.id AS decision_id,
  d.ai_draft_title,
  d.emitted_at,
  julianday('now') - julianday(d.emitted_at) AS days_since_emit
FROM decisions d
JOIN meetings m ON m.id = d.meeting_id
LEFT JOIN mission_links ml ON ml.decision_id = d.id AND ml.artifact_kind = 'mission_package'
WHERE d.emitted_at IS NOT NULL
  AND ml.id IS NULL
  AND m.project_id = ?
  AND julianday('now') - julianday(d.emitted_at) > 7
ORDER BY d.emitted_at;
"
```

## Snapshot diff between two snapshot ids (cached)

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT payload_json
FROM snapshot_diffs
WHERE from_snapshot = ? AND to_snapshot = ?
LIMIT 1;
"
```

## Recent meeting records (last 3 by committed_at)

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT id, started_at, committed_at, status, kb_snapshot
FROM meetings
WHERE project_id = ? AND status IN ('committed', 'wrapped')
ORDER BY committed_at DESC
LIMIT 3;
"
```

## Findings by source_path prefix (for investigate_section requests)

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT id, kind, severity, confidence, title, rationale, source_path
FROM findings
WHERE project_id = ?
  AND status = 'open'
  AND source_path LIKE ?
ORDER BY confidence DESC;
"
```

(`?` for source_path uses LIKE, e.g. `'src/intelligence/%'`.)

## Dismissed findings with rationale (for context)

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT id, kind, title, dismissed_rationale
FROM findings
WHERE project_id = ?
  AND status = 'dismissed'
ORDER BY produced_at DESC
LIMIT 20;
"
```

Dismissed findings are NOT noise — they record decisions about what NOT to
work on. Surfacing them helps the briefing avoid re-suggesting dismissed
moves.

## Cross-snapshot finding count trend

```bash
sqlite3 .gsd/intelligence/intelligence.db "
SELECT
  s.id AS snapshot_id,
  s.taken_at,
  COUNT(f.id) AS finding_count,
  SUM(CASE WHEN f.severity = 'high' THEN 1 ELSE 0 END) AS high_severity
FROM snapshots s
LEFT JOIN findings f ON f.snapshot_id = s.id
WHERE s.project_id = ?
  AND s.taken_at != 'IN_PROGRESS'
GROUP BY s.id
ORDER BY s.taken_at DESC
LIMIT 10;
"
```

## Notes

- Always include `project_id = ?` in the WHERE clause — the DB is per-project,
  but FK constraints don't replace explicit filtering.
- `julianday()` arithmetic gives day deltas as floats; cast or compare directly.
- `LIKE` patterns with leading `%` cannot use indexes; for hot paths, prefer
  prefix matches (`'src/intelligence/%'`) which CAN use the index.
- The `snapshot_diffs` table may be empty on a fresh project (migration 002).
  Treat empty results as "no diff cached," not "no changes."

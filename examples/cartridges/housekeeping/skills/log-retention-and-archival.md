# log-retention-and-archival

Manage logs and session transcripts under the archive-only rule. Logs are never deleted — only moved to a colder tier. This skill rotates live logs, packs rotated segments into dated archive bundles, writes an ArchiveEntry per bundle, and verifies that the bundle is readable before the live log is recycled. Covers session transcripts, daemon logs, build logs, research output logs, and CI captures.

**Triggers:** `rotate logs`, `archive logs`, `log retention`, `session log archive`, `log bundle`, `transcript archive`

**Affinity:** `housekeeping-capcom`, `archivist`

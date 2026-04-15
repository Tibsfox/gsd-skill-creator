# stale-file-detection

Find files that look stale — not referenced by code, no git activity in N days, path matches a known-scratch pattern — and write a StaleFileReport. This skill never deletes. It produces evidence so a human can decide whether a stale artifact should be archived, promoted, or ignored. The report is content-addressed so the same scan re-run later can detect drift.

**Triggers:** `stale file`, `dead code scan`, `unreferenced file`, `age out`, `orphan audit`, `scratch file`

**Affinity:** `housekeeping-capcom`, `archivist`, `steward`

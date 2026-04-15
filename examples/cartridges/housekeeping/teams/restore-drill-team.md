# restore-drill-team

Run a scheduled restore drill to prove an archive is still usable. Archivist restores to a staging target, retention-auditor verifies integrity and time-to-restore against policy, capcom signs off and writes the RestoreDrillResult.

**Roster:** `housekeeping-capcom`, `archivist`, `retention-auditor`.

**Use when:** running a scheduled restore drill or a pre-change recovery test

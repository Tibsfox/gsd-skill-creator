# restore-drill

Prove an archive is usable by test-restoring it into a staging target. An archive that has not been test-restored is treated as unverified. Each drill writes a RestoreDrillResult with scope, source ArchiveEntry, target, time-to-restore, integrity verdict, and any drift detected against the original content hash. Scheduled, not ad-hoc.

**Triggers:** `restore drill`, `test restore`, `archive drill`, `verify backup`, `rehearse restore`, `recovery drill`

**Affinity:** `housekeeping-capcom`, `archivist`, `retention-auditor`

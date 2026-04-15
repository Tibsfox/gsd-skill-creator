# retention-audit-team

Audit real storage state against declared RetentionPolicy records. Retention-auditor runs the compliance scan, archivist proposes remediation (always archive, never delete), capcom approves. Writes a RetentionAudit record.

**Roster:** `housekeeping-capcom`, `retention-auditor`, `archivist`.

**Use when:** periodic retention compliance audit or policy review

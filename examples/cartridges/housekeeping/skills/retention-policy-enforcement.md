# retention-policy-enforcement

Audit real storage state against the declared RetentionPolicy records. Flags under-retention (data aged out faster than policy said it should), over-retention (data kept in hot tier past its policy), and missing-policy (data with no declared tier). Writes a RetentionAudit record per run. Enforcement is advisory — the auditor surfaces findings; humans decide on destructive action, and the standing rule is still archive-over-delete.

**Triggers:** `retention audit`, `policy compliance`, `retention violation`, `under retention`, `over retention`, `missing policy`

**Affinity:** `housekeeping-capcom`, `retention-auditor`

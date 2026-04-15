# gitignore-policy

Own the `.gitignore` policy for the project. Enforces the hard rules — `.planning/` never in git, `.planning/patterns/` is gitignored, `.local/` stays untracked, runtime state (`.sweep-daemon-state.json`, daemon pids, session logs) stays local. Resolves `git check-ignore` conflicts, catalogs which paths should be tracked vs archived vs untracked, and writes a RetentionPolicy record for any rule it adds.

**Triggers:** `gitignore rule`, `what to gitignore`, `check-ignore`, `untracked policy`, `.planning gitignore`, `runtime state ignore`

**Affinity:** `housekeeping-capcom`, `steward`, `retention-auditor`

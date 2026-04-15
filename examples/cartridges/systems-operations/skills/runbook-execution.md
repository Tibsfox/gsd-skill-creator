# runbook-execution

Execute operational runbooks against live systems with human-approval gates at destructive steps. Parses structured runbooks, validates preconditions, tracks progress, emits a run record. Refuses to improvise off-runbook. Triggers on `run runbook`, `execute procedure`, `approval gate`, `precondition check`. Affinity: `sysops-runner`, `sysops-commander`.

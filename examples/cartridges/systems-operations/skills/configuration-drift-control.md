# configuration-drift-control

Manage runtime configuration via Ansible/Salt/Puppet/Chef or equivalent, detect drift from declared state, and drive reconciliation. Enforces the rule that no production host is configured by hand without a follow-up config-as-code change. Triggers on `ansible run`, `puppet drift`, `salt state`, `chef converge`, `config drift`, `reconcile state`. Affinity: `sysops-runner`, `sysops-change-manager`.

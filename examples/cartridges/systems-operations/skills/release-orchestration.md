# release-orchestration

Drive staged production rollouts — canary, percentage ramp, blue/green, and feature-flag gated releases. Owns ramp thresholds, rollback criteria, and the human go/no-go gate at each step. Triggers on `deploy release`, `canary`, `rollback`, `blue green`, `ramp percentage`, `feature flag`. Affinity: `sysops-runner`, `sysops-change-manager`.

# sysops-release-team

Drive a staged production rollout. Change-manager validates the approved window and rollback plan, runner executes the ramp, commander holds the go/no-go gate at each step, reliability-engineer watches SLO burn during the ramp.

**Roster:** `sysops-change-manager`, `sysops-runner`, `sysops-commander`, `sysops-reliability-engineer`.
**Use when:** pushing a release to production via canary, ramp, or blue/green.

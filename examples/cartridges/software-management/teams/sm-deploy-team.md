# sm-deploy-team

Cut and verify a production deployment. Deploy engineer runs the rollout, lead owns the approval chain and the go / no-go calls, reviewer confirms the artifact under rollout matches the reviewed commit range.

**Roster:** `sm-deploy-engineer`, `sm-lead`, `sm-reviewer`.

**Use when:** promoting a build to production, running a canary or blue-green rollout, or executing an emergency rollback

# Software Management

A full cartridge for the discipline of **managing existing code** —
understanding it, reviewing it, moving it, and shipping it to
production. Complements `software-development` (the writing side)
and `troubleshooting` (the diagnosis side).

Focus areas: code mapping, architecture extraction, dependency
graphs, review at scale, static analysis, porting across platforms,
language translation, API surface diffing, production deployments,
canary / blue-green rollouts, incident rollback, and post-deploy
observability.

- Slug: `software-management`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — codebase mapping, architecture extraction,
  dependency graph analysis, code review at scale, static analysis
  and linting, code porting between platforms, language translation
  and rewrite, API surface diffing, production deployment
  orchestration, rollout strategy and canary, incident rollback and
  recovery, observability and post-deploy verification
- **5 agents** — `sm-lead` (Opus capcom),
  `sm-codebase-cartographer`, `sm-reviewer`, `sm-porter-translator`,
  `sm-deploy-engineer`
- **4 teams** — mapping, review, porting, deploy
- **6 grove record types** — `CodebaseMap`, `ArchitectureExtraction`,
  `DependencyGraph`, `ReviewFinding`, `PortingTask`,
  `DeploymentRecord`

## Load + validate

```
skill-creator cartridge load ./cartridge.yaml
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

All four forge gates (validate / eval / dedup / metrics) should be
green before shipping or depending on this cartridge.

## Design notes

- **Map before you touch.** `codebase-mapping-and-inventory` is a
  precondition for any review, port, or translation — there is no
  "just start editing" path in this cartridge.
- **Behavior-preserving translation.** `language-translation-and-rewrite`
  enforces a shared behavioral test suite that both implementations
  must pass; correctness is audited, not asserted.
- **Rollback is a first-class skill.** `incident-rollback-and-recovery`
  is intentionally separate from the deploy skill — a clean rollback
  has its own discipline (drain, revert, reconcile state, evidence).
- **Observability gates the deploy.** A deploy is not "done" until
  the `observability-and-post-deploy-verification` checklist is
  green.

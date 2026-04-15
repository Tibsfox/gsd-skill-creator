# Systems Engineering

A full cartridge for systems engineering — the discipline of designing,
integrating, and verifying complex technical systems across their
lifecycle. Covers the daily surface area of a working systems engineer:
stakeholder needs and requirements, architecture modeling, interface
control, trade studies, verification and validation, risk and
opportunity, configuration and change control, RAM (reliability /
availability / maintainability), safety and assurance, human factors,
and lifecycle transition.

Built to compose with `project-management`, `engineering`, `safety`,
and `reliability` cartridges through the grove layer.

- Slug: `systems-engineering`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — one per systems-engineering responsibility surface
- **5 agents** — `se-chief-engineer` (Opus capcom), `se-requirements-analyst`,
  `se-verification-lead`, `se-risk-and-safety-officer`,
  `se-configuration-manager`
- **4 teams** — requirements, architecture-trade, verification-validation,
  risk-safety-review
- **6 grove record types** — `RequirementItem`, `ArchitectureModel`,
  `InterfaceDefinition`, `TradeStudy`, `VerificationRecord`, `RiskItem`

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

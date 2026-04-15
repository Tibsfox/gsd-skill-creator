# Troubleshooting

A full cartridge for general-purpose troubleshooting across **all**
domains — software, hardware, mechanical, electrical, plumbing,
chemical and process, biological, organizational, and human-system.
Domain-agnostic by design: the same framing, bisection, hypothesis,
and fault-tree skills apply to a leaking pipe, a failing server, a
misbehaving engine, or a team conflict.

Built to compose with `systems-administration`, `systems-engineering`,
`incident-response`, and any domain cartridge that needs a
diagnostic backbone.

- Slug: `troubleshooting`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — problem framing, bisection, five-whys, hypothesis
  and test, observation and measurement, reproducibility, fault tree,
  comparative diagnosis, intermittent faults, safe-state and
  containment, post-incident analysis, mentoring and handoff
- **5 agents** — `troubleshoot-lead` (Opus capcom),
  `symptom-interviewer`, `hypothesis-tester`, `comparative-analyst`,
  `incident-historian`
- **4 teams** — triage, deep-dive, intermittent-hunt, postmortem
- **6 grove record types** — `SymptomReport`, `HypothesisTest`,
  `BisectionTrace`, `FaultTreeNode`, `RootCauseFinding`,
  `PostIncidentReport`

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

- **Containment before diagnosis.** The `safe-state-and-containment`
  skill is intentionally separate from any repair skill — stopping
  the bleeding is a discipline in its own right.
- **Blameless post-incident.** The `post-incident-analysis` skill and
  the `PostIncidentReport` record type both enforce symptom-vs-cause
  discipline and preventive-action ownership, not narrative.
- **Reproducibility is a precondition.** `reproducibility-and-isolation`
  exists as its own skill because an unreproducible fault cannot be
  fixed with confidence — everything else follows from it.

# Software Development

A full cartridge for the daily surface area of a working software
engineer. Language- and stack-agnostic by design — composes with
language-specific cartridges (typescript, rust, python, go) and with
`troubleshooting`, `systems-engineering`, and `project-management`.

- Slug: `software-development`
- Trust: `user`
- Template: `department`

## Shape

- **12 skills** — requirements and user stories, design and API
  shaping, implementation, version control workflow, automated
  testing, code review, refactoring and tech debt, debugging and
  diagnosis, build and CI, release and deploy, documentation and
  knowledge, performance and profiling
- **5 agents** — `sd-tech-lead` (Opus capcom), `sd-developer`,
  `sd-reviewer`, `sd-test-engineer`, `sd-release-engineer`
- **4 teams** — feature, review, bugfix, release
- **6 grove record types** — `FeatureSpec`, `CodeReviewRecord`,
  `TestSuiteResult`, `BuildArtifact`, `ReleaseEntry`, `DebugSession`

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

- **Design before implementation.** `design-and-api-shaping` is a
  separate skill from `implementation-and-coding` so the shape gets
  a first-class pass before any code is written.
- **Every fix ships with a test.** `debugging-and-diagnosis` and
  `automated-testing` pair by convention — bug fixes are expected
  to land with a failing-then-passing regression test.
- **Green main is a team invariant.** `build-and-ci` treats a red
  main as a stop-the-line event, not a backlog item.
- **Measure before optimizing.** `performance-and-profiling` exists
  as its own skill to resist the "rewrite it in X" reflex.

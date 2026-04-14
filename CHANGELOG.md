# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Where the release history lives

gsd-skill-creator ships releases at a cadence that makes a traditional
per-entry changelog impractical: 592 milestones from v1.0 (2026-01-31)
through v1.49.549 (2026-04-14), many shipped multiple per day during
engine runs like the Seattle 360 / Sound of Puget Sound series.

The authoritative, one-line-per-release index is:

- **[`docs/RELEASE-HISTORY.md`](docs/RELEASE-HISTORY.md)** — every shipped
  version, newest first, with title, ship date, and links to the detailed
  release-notes directory.

Each release also has its own directory under
[`docs/release-notes/v<version>/`](docs/release-notes/) containing a
`README.md` with the full feature description, and for major milestones
a `RETROSPECTIVE.md` and/or `LESSONS-LEARNED.md`.

## Highlights

A curated timeline of the most significant milestones across the v1.0 → v1.49.549 arc:

- **v1.0** (2026-01-31) — Core Skill Management. First shipped release.
- **v1.4** (2026-02-05) — Agent Teams. Multi-agent coordination primitives.
- **v1.23** (2026-02-19) — Project AMIGA. 24 phases, 74 plans; one of the
  largest pre-GSD-OS milestones.
- **v1.27** (2026-02-20) — GSD Foundational Knowledge Packs. 79 plans.
- **v1.30** (2026-02-22) — Vision-to-Mission Pipeline. The builder
  pipeline that still powers mission-pack creation today.
- **v1.33** (2026-02-23) — GSD OpenStack Cloud Platform (NASA SE Edition).
- **v1.35** (2026-02-26) — Mathematical Foundations Engine. 16 phases,
  50 plans. Underpins the Math Co-Processor.
- **v1.37** (2026-02-26) — Complex Plane Learning Framework.
- **v1.39** (2026-02-26) — GSD-OS Bootstrap & READY Prompt.
- **v1.44** (2026-02-26) — SC Learn PyDMD Dogfood. First end-to-end
  self-improving learning run.
- **v1.47** (2026-02-27) — Holomorphic Dynamics Educational Pack.
- **v1.48** (2026-02-27) — Physical Infrastructure Engineering Pack.
- **v1.49** (2026-02-27) — Deterministic Agent Communication Protocol
  (DACP). 11 phases, 24 plans. The v1.49 minor-line begins here and now
  dominates the release history.
- **v1.49.8 / v1.49.9** (2026-03-01) — Cooking With Claude + Learn Kung
  Fu. Heritage/practice-domain dogfood missions.
- **v1.49.12** (2026-03-02) — Heritage Skills Educational Pack. 12
  phases, 45 plans, 18 rooms, 55 badges, 36 red-team scenarios cleared.
- **v1.49.13 / v1.49.14** (2026-03-03) — Skill Usage Telemetry +
  Dependency Health Monitor & Progressive Internalization Engine.
- **v1.49.21** (2026-03-07) — Image to Mission Pipeline. 253 new tests,
  the creative-translation bridge for image-driven builds.
- **v1.49.39** (2026-03-25) — "Weird Al: Eat It". 37 Research Projects
  & Rosetta Stone framework crosses a threshold.
- **v1.49.40 → v1.49.192** (2026-03-25 → 2026-03-31) — Seattle 360
  engine first pass: roughly 58 degree-releases named after PNW bands
  and bird species, ~600K+ words of research, the Continuous Release
  Engine's proof of cadence.
- **v1.49.195** (2026-03-31) — Ecosystem Alignment, Helium Corridor,
  OOPS Analysis, OPEN Problems. Largest single-session release in
  project history (HEL + OOPS + OPEN mega-release, 126K+ words).
- **v1.49.200** (2026-04-01) — Degree 61: Y La Bamba + American Beaver.
  First Latina/bilingual artist and first mammal enter the engine on
  the same degree — taxonomic threshold for the SPS second pass.
- **v1.49.500** (2026-04-13) — last npx-published `skill-creator`
  checkpoint. Marks the beginning of the combined NASA/360 engine
  second pass.
- **v1.49.549** (2026-04-14) — **Artemis II: The Space Between the Moon
  and the Earth.** Omnibus mission release covering the full 13-day
  Artemis II arc (2026-04-01 → 2026-04-14): ~356 point releases
  (v1.49.193 → v1.49.549), the Seattle 360 / Sound of Puget Sound
  second pass through Degree 359, the Memory Arena Rust stack M1 → M13
  with IPC and Grove integration (710 Rust + 393 TS tests), the Grove
  content-addressed format with 299 resources imported, Phase B
  skill-author-discipline, 1.88M+ words of research corpus expansion,
  NASA missions v1.0 → v1.5, and — shipping the unified
  Cartridge/Chipset schema under the same release — cartridge-forge
  with seven CLI subcommands and 43 department migrations. Full suite
  23,645 passing, zero new runtime dependencies from the forge work,
  PR #32 merged artemis-ii → dev preserving all 670 commits.

For anything not in this list, consult
[`docs/RELEASE-HISTORY.md`](docs/RELEASE-HISTORY.md).

# release-engine

The continuous release engine cartridge. Covers the full release
surface for a GSD project — series definition, versioning and semver
policy, branching and tagging, changelog and release-note authoring,
build and publish, pre-ship and post-ship verification, per-release
retrospectives, the flywheel that compounds those retros into the
next cadence, hotfix handling, release communications, and
end-of-series closeout.

Ships **both** as an in-tree example under `examples/cartridges/` **and**
as a core cartridge that installs into every gsd-skill-creator harness
via `project-claude/manifest.json`. Any project that runs
`node project-claude/install.cjs` picks up
`.claude/cartridges/release-engine/` on day one.

## Three canonical series shapes

The `series-definition` skill recognizes three proven patterns, each
backed by a real shipped series you can inspect:

1. **Degree cadence** — one release per catalog item on a daily or
   near-daily schedule. Reference: **Seattle 360** (v1.49.135–192+),
   one degree per release, 360 catalog items, ~600K+ words shipped.
2. **Mission catalog** — CSV-driven catalog with per-mission
   research depth. Reference: **NASA 720 missions**, six tracks in
   parallel + one QA gate, mission-by-mission pacing, v1.0–v1.5
   complete at time of forge.
3. **Book as release** — chapter flow published as a single shipped
   version, with a research corpus behind the final manuscript.
   Reference: **Thicc Splines Save Lives** (v1.49.203), a 329-page
   Blender 4.4 user manual with 6 chapter files and a 10-file
   research corpus (~107K words).

A new series can reuse any of these shapes or declare a custom one;
the `ReleaseSeries` record just captures `shape`, `cadence`, and
`arc` and the catalog flows from there.

## Shape

- **14 skills** — series-definition, version-policy, release-branching,
  changelog-generation, release-note-authoring, series-cadence-ops,
  flywheel-orchestration, build-and-publish, release-verification,
  retrospective-and-lessons, **release-grove-memory**,
  release-communications, hotfix-and-patch, series-closeout.
- **6 agents** — release-capcom (Opus capcom), release-roadmapper,
  release-engineer (Sonnet), release-publisher (Sonnet),
  release-verifier, release-retrospective-analyst.
- **6 teams** — release-series-bootstrap-team, release-cycle-team,
  release-hotfix-team, release-series-closeout-team,
  release-flywheel-team, release-grove-memory-team.
- **12 grove record types** — ReleaseSeries, SeriesCatalog,
  ReleaseRecord, VersionDecision, ChangelogEntry,
  ReleaseRetrospective, FlywheelDelta, PublishArtifact, HotfixRecord,
  ReleaseCommunication, SeriesRetrospective, GroveActivityLog.
- **3 chipsets** — `department`, `grove`, `evaluation`.

## The flywheel — why this cartridge exists

A release series is not a list of releases. It's a feedback loop where
each release reads the prior one's retrospective before it plans. That
loop is the flywheel, and it is made material by two grove record
types:

- **`ReleaseRetrospective`** — written at the end of every release,
  carrying a `carry_forward` item that is the explicit input to the
  next cycle.
- **`FlywheelDelta`** — computed between releases N and N+1,
  recording what the pipeline actually changed in response to the
  retro. An empty `FlywheelDelta` chain means the series is
  stagnating — the flywheel isn't turning.

The `flywheel-orchestration` skill and `release-flywheel-team` own
this loop. The `retrospective-and-lessons` skill feeds it. The
`series-closeout` skill collapses the whole chain into a
`SeriesRetrospective` at the end.

## Why grove is the centerpiece

Release pipelines generate a lot of durable artifacts — catalogs,
version decisions, changelogs, built binaries, retros, hotfix
records, announcements. Grove is where they live between sessions
and between machines. Every skill in this cartridge writes into the
`release-engine` namespace and:

1. **Replay** — a whole series can be rehydrated by walking
   `GroveActivityLog` and reconstructing `ReleaseSeries` →
   `SeriesCatalog` → `ReleaseRecord*` → `ReleaseRetrospective*` →
   `FlywheelDelta*` in order. That is how "rewind this series to
   release N" works without mutating any shipped record.
2. **Multi-hop retrieval** — a hotfix can pull the
   `VersionDecision` and `ChangelogEntry` of the release it
   patches by content hash alone, even years later.
3. **Cross-series linking** — the `FlywheelDelta` chain of one
   series can feed the `SeriesRetrospective` of another, so
   lessons from 360 flow into NASA and both flow into the next
   book. Content addresses make cross-series links cheap.
4. **Cross-cartridge linking** — a `HotfixRecord` points to the
   root-cause `DebugSession` from the `get-shit-done` cartridge
   by content hash, so the bug story and the release story are
   a single queryable graph.
5. **Activity-log integrity** — every record creation, link,
   export, and migration is signed and appended to
   `GroveActivityLog`, giving the release pipeline the same
   audit guarantees the rest of the GSD system has.

The `release-grove-memory` skill is the single owner of the grove
surface — import, export, query, diff, signature verification,
activity-log replay, namespace queries, and arena-snapshot
migration. Every other skill in the cartridge defers to it for
persistence.

## Load + validate

```
skill-creator cartridge validate ./cartridge.yaml
skill-creator cartridge eval ./cartridge.yaml
skill-creator cartridge dedup ./cartridge.yaml
skill-creator cartridge metrics ./cartridge.yaml
```

All four gates are green as of the forge commit.

## How it integrates with gsd-skill-creator install

`project-claude/manifest.json` lists this cartridge under
`files.cartridges`, and `project-claude/install.cjs` copies it to
`.claude/cartridges/release-engine/` on install and checks for its
`cartridge.yaml` during the post-install verification pass.

## Relationship to `get-shit-done`

`release-engine` is the last-mile cartridge that takes verified
phases from `get-shit-done` and ships them. The two cartridges are
deliberately split:

- `get-shit-done` owns research → plan → execute → verify.
- `release-engine` owns package → ship → retro → flywheel.

Cross-cartridge links through grove connect them: a
`VerificationResult` from `get-shit-done` is the precondition for a
`ReleaseRecord` in `release-engine`; a `HotfixRecord` links back to
a `DebugSession`.

## Forged via

`cartridge-forge` skill, `department` template, gates run in this
order: scaffold → fill → scaffold-companions → validate → eval →
dedup → metrics.

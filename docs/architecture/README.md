# Architecture Overview

This documentation covers the internal architecture of `gsd-skill-creator` for contributors working on the codebase and library consumers building integrations.

## Layered Design Philosophy

The codebase follows a strict layered architecture where dependencies flow downward only. Lower layers (types, storage) have no dependencies on higher layers (CLI, workflows). This enables:

- **Testability**: Each layer can be tested in isolation
- **Reusability**: Core modules work independently of CLI
- **Maintainability**: Changes in one layer don't ripple upward

## Combined Data Flow Diagram

```mermaid
flowchart TB
    subgraph Entry["Entry Points"]
        CLI["CLI Commands<br/>src/cli/"]
        Hooks["Session Hooks<br/>src/hooks/"]
        API["Library API<br/>src/index.ts"]
    end

    subgraph Workflows["Orchestration Layer"]
        WF["Workflows<br/>src/workflows/"]
    end

    subgraph Core["Core Processing"]
        App["Application<br/>src/application/"]
        Sim["Simulation<br/>src/simulation/"]
        Learn["Learning<br/>src/learning/"]
        Cal["Calibration<br/>src/calibration/"]
    end

    subgraph Analysis["Analysis Layer"]
        Obs["Observation<br/>src/observation/"]
        Det["Detection<br/>src/detection/"]
        Act["Activation<br/>src/activation/"]
        Conf["Conflicts<br/>src/conflicts/"]
        Comp["Composition<br/>src/composition/"]
        Agents["Agents<br/>src/agents/"]
        TeamsMod["Teams<br/>src/teams/"]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Emb["Embeddings<br/>src/embeddings/"]
        Test["Testing<br/>src/testing/"]
        Val["Validation<br/>src/validation/"]
        Store["Storage<br/>src/storage/"]
    end

    subgraph Foundation["Foundation"]
        Types["Types<br/>src/types/"]
    end

    CLI --> WF
    CLI --> Core
    CLI --> Analysis
    Hooks --> Obs
    API --> Core
    API --> Analysis
    API --> Infrastructure

    WF --> Core
    WF --> Infrastructure

    App --> Store
    App --> Val
    App --> Emb
    Sim --> Emb
    Sim --> Store
    Learn --> Store
    Cal --> Store

    Obs --> Store
    Det --> Store
    Act --> Emb
    Conf --> Emb
    Comp --> Store
    Agents --> Det
    Agents --> Store

    CLI --> TeamsMod
    TeamsMod --> Val
    TeamsMod --> Emb
    TeamsMod --> Conf

    Emb --> Types
    Test --> Types
    Val --> Types
    Store --> Types
```

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [layers.md](layers.md) | Comprehensive 12+ layer module documentation with dependency matrix |
| [data-flows.md](data-flows.md) | Per-operation data flow diagrams |
| [storage.md](storage.md) | Storage locations and file formats |
| [extending.md](extending.md) | Extension points and customization |

## Related Documentation

For learning-oriented documentation, see:

- [Getting Started](../GETTING-STARTED.md) - Installation and quickstart
- [Workflows](../WORKFLOWS.md) - Common usage patterns
- [Tutorials](../tutorials/) - Step-by-step guides:
  - [Skill Creation](../tutorials/skill-creation.md)
  - [Conflict Detection](../tutorials/conflict-detection.md)
  - [Calibration](../tutorials/calibration.md)
  - [CI Integration](../tutorials/ci-integration.md)
- [Examples](../../examples/) - Ready-to-use skill templates

For reference documentation:

- [API.md](../API.md) - Complete programmatic API reference
- [CLI.md](../CLI.md) - Command-line interface reference
- [GSD-TEAMS.md](../GSD-TEAMS.md) - GSD teams vs subagents decision guide
- [CHANGELOG.md](../CHANGELOG.md) - Version history and changes

# packs/

Staging workspace for educational and domain knowledge pack artifacts.

This directory is the workspace for pack release artifacts -- exported configurations,
pre-built bundles, and staging content before publication. The actual pack *source code*
lives in `src/` (currently split across `src/holomorphic/`, `src/knowledge/`, `src/agc/`,
`src/aminet/`, and similar modules; consolidating into `src/packs/` in v1.51 Phase 485).

## This directory vs src/ pack modules

| Location | Purpose |
|----------|---------|
| `packs/` | Release artifacts, pre-built bundles, staging workspace |
| `src/packs/` (Phase 485+) | Pack implementation source code |
| `skills/` | Distributable Claude skill packs |

## Available Packs (Source)

| Pack | Source | Description |
|------|--------|-------------|
| holomorphic | `src/holomorphic/` | Complex dynamics and holomorphic functions |
| electronics | `src/knowledge/` | Electronics engineering with circuit simulation |
| agc | `src/agc/` | Apollo Guidance Computer architecture |
| aminet | `src/aminet/` | Amiga software archive and history |

## Quick Start

```bash
# List all available packs
sc pack list

# Show pack details
sc pack info <name>
```

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)

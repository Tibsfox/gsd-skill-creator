# infra/

Infrastructure and world environments for the GSD-OS project.

## Structure

### Infrastructure Operations

| Directory | Description |
|-----------|-------------|
| `agents/` | Agent definitions (infra-scout, deployers, archivists) |
| `config/` | Emulator and tool configuration files |
| `dashboard/` | Generated HTML dashboard (gitignored) |
| `docs/` | Runbooks: day-1, day-2, incident response, server update |
| `inventory/` | Hardware capability profiles and hypervisor specs |
| `local/` | Local machine hardware values (gitignored, private) |
| `monitoring/` | Prometheus alert rules and exporter configs |
| `packs/` | Knowledge packs: AGC archive, RFC data |
| `scripts/` | Deployment and maintenance scripts |
| `skills/` | Infrastructure-specific Claude skills |
| `teams/` | Team coordination definitions |
| `templates/` | Configuration templates |
| `tests/` | Infrastructure integration tests |

### Game and Emulation Worlds

| Directory | Description |
|-----------|-------------|
| `worlds/` | Game and emulation environments — see [worlds/README.md](worlds/README.md) |

## Navigation

- [Project Root](../README.md)
- [Documentation](../docs/)

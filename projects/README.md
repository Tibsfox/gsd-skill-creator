# Projects

Template placeholder for downstream user projects.

Each subdirectory under `projects/` is intended to be an independent GSD
project with its own `.planning/` directory for state management.
Contents of `projects/*` are gitignored by default — they are your
personal workspace, not part of the upstream repository.

> **Note for people reading the upstream repo:** `projects/` is
> scaffolding. The gsd-skill-creator project's own source, tests, and
> documentation live at the repo root in `src/`, `src-tauri/`,
> `desktop/`, `tests/`, `docs/`, `scripts/`, `examples/`, `packs/`,
> and so on. Nothing of ours lives inside `projects/`; it exists
> purely so downstream users who clone this repo have a conventional
> place to put their own work.

## Quick Start

```bash
# Create a new project under projects/
sc project init my-app

# List all projects (local + external)
sc project list

# Open a project
cd projects/my-app
```

## External Projects

You can also register external directories as projects via
`.sc-config.json`:

```json
{
  "external_projects": [
    { "name": "my-app", "path": "/home/user/code/my-app" }
  ]
}
```

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)

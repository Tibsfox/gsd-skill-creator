# Projects

Your GSD projects live here. Each subdirectory is an independent project with its own `.planning/` directory for GSD state management. Projects in this directory are gitignored by default -- they're your personal workspace.

## Quick Start

```bash
# Create a new project
sc project init my-app

# List all projects (local + external)
sc project list

# Open a project
cd projects/my-app
```

## External Projects

You can also register external directories as projects via `.sc-config.json`:

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

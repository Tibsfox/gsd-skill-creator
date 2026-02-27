# v1.49.4 — Filesystem Management Strategy

**Shipped:** 2026-02-27
**Requirements:** 38 | **Phases:** 3 (457-459) | **Plans:** 7 | **Tests:** 97

## Summary

Introduces a filesystem management layer that organizes the skill-creator repository into navigable zones — `projects/`, `contrib/`, `packs/`, `www/` — with a thin TypeScript management layer and CLI commands. Purely additive: zero existing files moved or renamed.

## Zone Directories

Four new top-level directories with self-documenting README.md files:

- **`projects/`** — User workspace for GSD projects. Each subdirectory is an independent project with its own `.planning/` state. Supports external project directories via `.sc-config.json`.
- **`contrib/`** — Collaboration zone: `upstream/` for PRs we send, `downstream/staging/` for PRs we receive, `publishing/` for side projects extracted for independent release.
- **`packs/`** — Catalog of educational/domain packs (holomorphic, electronics, agc, aminet) referencing their source directories in `src/`.
- **`www/`** — Web staging: `site/` for generated output, `tools/` for web tool sources, `staging/` for pre-publish review.

## Config Schema

`.sc-config.json` (gitignored, user-local) with Zod validation:

```json
{
  "home": "projects",
  "external_projects": [
    { "name": "my-app", "path": "/home/user/code/my-app" }
  ],
  "upstream_forks": {
    "get-shit-done": "/path/to/projectGSD/dev-tools/get-shit-done"
  },
  "www": { "build_dir": "site", "tools_dir": "tools" }
}
```

Works with zero configuration — sensible defaults when no config exists. Invalid configs produce human-readable errors naming the offending field.

## CLI Commands

| Command | Description |
|---------|-------------|
| `sc project init <name>` | Create a new GSD project with `.planning/` scaffold |
| `sc project list` | List local and external projects |
| `sc project status` | Show workspace summary |
| `sc pack list` | List available educational packs with module counts |
| `sc pack info <name>` | Show pack details |
| `sc contrib status` | Show upstream/downstream/publishing counts |
| `sc contrib list` | List contributions grouped by direction |
| `sc www status` | Show www directory state |

## Core Modules

| Module | LOC | Purpose |
|--------|-----|---------|
| `src/fs/types.ts` | 40 | Zone, ProjectDescriptor, PackDescriptor, ContribDescriptor, WwwDescriptor |
| `src/fs/config.ts` | 97 | Zod schema, loadConfig, saveConfig, defaults |
| `src/fs/scaffold.ts` | 205 | Idempotent directory creation, README generation |
| `src/fs/project-manager.ts` | 81 | Project CRUD with name validation |
| `src/fs/pack-catalog.ts` | 64 | Pack registry and info |
| `src/fs/contrib-manager.ts` | 84 | Upstream/downstream/publishing scanning |
| `src/fs/www-stager.ts` | 40 | WWW directory lifecycle |
| `src/fs/commands/*.ts` | 280 | CLI command implementations |
| **Total** | **~630** | (excluding tests) |

## Safety

- Path traversal prevention: project names with `..`, `/`, `\` rejected before any filesystem operation
- Strict config validation: unknown fields rejected, relative external paths rejected
- Purely additive: zero existing files modified
- Gitignore separates tracked conventions from untracked user data

## Verification

- 97 new tests across 7 test files
- Full regression: 19,185+ tests, 0 new failures
- TypeScript: 0 errors

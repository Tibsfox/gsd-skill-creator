# examples/tools/

Zero-dependency Node scripts for managing the `examples/` library.

## Scripts

| Script | Purpose |
|--------|---------|
| [`install.mjs`](install.mjs) | Copy artifacts from `examples/` into a target `.claude/` directory |
| [`validate.mjs`](validate.mjs) | Check frontmatter + structure across the library |
| [`catalog-gen.mjs`](catalog-gen.mjs) | Regenerate `.planning/artifact-catalog.csv` and `.count-badge.md` |
| [`license-report.mjs`](license-report.mjs) | Audit BSL-vs-exempt classification across the library |

## Runtime requirements

- Node 18+ (for native `node:fs/promises` + top-level await)
- Zero npm dependencies — pure standard library

Run from the repo root:

```bash
node examples/tools/install.mjs --help
node examples/tools/validate.mjs --help
node examples/tools/catalog-gen.mjs
node examples/tools/license-report.mjs
```

## Design notes

- **Zero deps** — these scripts ship with the library and should work in a fresh clone with no install step
- **Read-mostly** — `install.mjs` is the only one that writes into places outside this repo; the others are strictly diagnostic/reporting
- **Private outputs** — `catalog-gen.mjs` and `license-report.mjs` write to `.planning/` (gitignored) by design
- **Frontmatter-driven** — every script reads YAML frontmatter from artifacts; there is no separate manifest file

## What they do NOT do

- No package management / dependency resolution
- No network access
- No `~/.claude` modification unless explicit via `install.mjs --target`
- No chipset runtime (chipsets are yaml definitions, not executable here)

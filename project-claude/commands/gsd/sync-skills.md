---
name: gsd:sync-skills
description: Sync managed GSD skills across runtime roots so multi-runtime users stay aligned after an update
allowed-tools:
  - Bash
  - AskUserQuestion
gsd-build-source: 1.38.3
gsd-build-source-url: https://github.com/gsd-build/get-shit-done/blob/v1.38.3/commands/gsd/sync-skills.md
local-modified: false
gsd-skill-creator-vendored-at: 2026-04-25
---

<objective>
Sync managed `gsd-*` skill directories from one canonical runtime's skills root to one or more destination runtime skills roots.

Routes to the sync-skills workflow which handles:
- Argument parsing (--from, --to, --dry-run, --apply)
- Runtime skills root resolution via install.js --skills-root
- Diff computation (CREATE / UPDATE / REMOVE per destination)
- Dry-run reporting (default — no writes)
- Apply execution (copy and remove with idempotency)
- Non-GSD skill preservation (only gsd-* dirs are touched)
</objective>

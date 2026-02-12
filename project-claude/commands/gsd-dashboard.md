---
name: gsd-dashboard
description: Generate, watch, or clean the GSD Planning Docs Dashboard from .planning/ artifacts
allowed-tools:
  - Read
  - Bash
  - Glob
---

# /gsd-dashboard -- GSD Planning Docs Dashboard

<objective>
Generate a static HTML dashboard from `.planning/` markdown artifacts. The dashboard renders five pages (index, requirements, roadmap, milestones, state) with navigation, structured data, and an optional live-refresh mechanism.

Supports three subcommands:
- **generate** (default) -- Parse `.planning/` and write HTML to the output directory
- **watch** -- Continuously regenerate on file changes with live-refresh injection
- **clean** -- Remove all generated HTML files and the build manifest

When the integration config (`.planning/skill-creator.json`) has `phase_transition_hooks: true`, this command is automatically triggered after GSD phase transitions (`plan-phase`, `execute-phase`, `verify-work` completions) to keep the dashboard current.
</objective>

<process>

## Step 0: Determine Subcommand

Parse the user's request to determine the subcommand:
- If the user says "generate", "build", "create dashboard", or just invokes the command with no qualifier, use **generate**.
- If the user says "watch", "live", or "auto-refresh", use **watch**.
- If the user says "clean", "remove", "delete dashboard", use **clean**.

---

## Subcommand: generate

1. **Check prerequisites.** Verify `.planning/` directory exists using the Glob tool:
   ```
   Glob: .planning/*.md
   ```
   If no markdown files are found, inform the user: "No .planning/ directory found. Run `/gsd:new-project` to initialize."

2. **Run the generator.** Execute via Bash:
   ```bash
   npx skill-creator dashboard generate --force
   ```
   The `--force` flag ensures all pages regenerate regardless of cache state.

3. **Report results.** Read the output and report:
   - Number of pages generated
   - Any errors encountered
   - Output directory location (default: `dashboard/`)

4. **Verify output.** Spot-check that `dashboard/index.html` exists:
   ```bash
   [ -f dashboard/index.html ] && echo "Dashboard generated successfully" || echo "ERROR: index.html not found"
   ```

---

## Subcommand: watch

1. **Check prerequisites** (same as generate Step 1).

2. **Start watch mode.** Execute via Bash:
   ```bash
   npx skill-creator dashboard --watch --live
   ```
   This will:
   - Inject auto-refresh scripts into generated pages
   - Poll `.planning/` for file changes every 3 seconds
   - Regenerate changed pages automatically

3. **Inform the user** that watch mode is running and they can press Ctrl+C to stop.

---

## Subcommand: clean

1. **Remove generated files.** Execute via Bash:
   ```bash
   npx skill-creator dashboard clean
   ```

2. **Report results.** Confirm which files were removed and that the output directory is clean.

---

## Auto-trigger on Phase Transitions

When invoked automatically after a GSD phase transition:

1. Read `.planning/skill-creator.json` to confirm `integration.phase_transition_hooks` is `true`.
2. If enabled, run a silent generate (equivalent to `generate` subcommand).
3. If disabled, skip silently -- do not warn or prompt.

</process>

<success_criteria>
- Generate subcommand produces 5 HTML files (index, requirements, roadmap, milestones, state)
- Each HTML file has valid DOCTYPE, head, body, and navigation structure
- Watch subcommand starts polling and injects live-refresh scripts
- Clean subcommand removes all generated HTML and the build manifest
- Errors are reported clearly without crashing
- Auto-trigger respects integration config toggle
</success_criteria>

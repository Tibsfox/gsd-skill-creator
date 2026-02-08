# Migration Team

Framework and library migration with a phased analysis-then-transformation workflow. A read-only analyzer first catalogs every required change, then specialized transformers execute the migration in atomic, individually revertable steps.

## When to Use This Team

- Major framework upgrades (React 17 to 18, Next.js 13 to 14, Express to Fastify)
- Library replacements (Moment.js to date-fns, Request to Axios)
- Language version migrations (Node 16 to 20, TypeScript 4 to 5)
- Build tool migrations (Webpack to Vite, Jest to Vitest)

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| migration-coordinator | Leader | Strategy, scope, ordering, conflict resolution | Read, Glob, Grep | opus |
| compatibility-analyzer | Worker | Deprecated API usage, old-to-new pattern mapping | Read, Glob, Grep | sonnet |
| code-transformer | Worker | Source code transformations, imports, API signatures | Read, Write, Edit, Glob, Grep | sonnet |
| test-updater | Worker | Test migrations, mock updates, coverage maintenance | Read, Write, Edit, Glob, Grep | sonnet |
| config-migrator | Worker | Dependencies, build config, tooling, CI/CD | Read, Write, Edit, Bash, Glob, Grep | sonnet |

## Safety Properties

- **Analysis before modification.** The compatibility-analyzer runs first (read-only) to produce a complete migration manifest before any code is changed.
- **Analyzer is read-only.** It cannot accidentally modify code during the analysis phase.
- **Atomic transformations.** Each transformer makes small, focused changes that can be individually reverted via git.
- **Scoped write access.** code-transformer targets source files, test-updater targets test files, config-migrator targets config and dependency files. Overlap is minimized by the coordinator's scope assignments.
- **Bash is limited.** Only config-migrator has Bash access (needed for `npm install`, `npx` migrations). No other member can execute shell commands.
- **Leader uses opus.** Migration coordination requires sophisticated reasoning about ordering, dependency chains, and conflict resolution, justifying the stronger model.

## How It Works

### Phase 1: Analysis (Sequential)

1. The **migration-coordinator** receives the migration target (e.g., "Migrate from React Router v5 to v6").
2. The coordinator dispatches the **compatibility-analyzer** to scan the entire codebase.
3. The analyzer produces a migration manifest: every file, every deprecated pattern, every required transformation, with severity ratings.

### Phase 2: Transformation (Parallel)

4. The coordinator reviews the manifest and creates scoped work assignments for each transformer.
5. **code-transformer**, **test-updater**, and **config-migrator** work in parallel on their assigned scopes.
6. Each transformer makes atomic changes: one pattern replacement per commit when possible.
7. The coordinator monitors progress and resolves conflicts (e.g., when a source change requires a corresponding test change).

### Phase 3: Verification

8. The coordinator verifies all manifest items are addressed.
9. config-migrator runs the build and test suite to confirm the migration is complete.

## Example Usage Scenario

**Input:** "Migrate from Express.js to Fastify"

**Flow:**
- compatibility-analyzer scans all route files, middleware, and plugins. Produces manifest: 23 route handlers, 8 middleware functions, 3 plugins, 2 custom error handlers need migration.
- code-transformer rewrites route handlers from `app.get()` to Fastify's `fastify.get()` with schema validation, updates middleware to Fastify hooks.
- test-updater updates supertest setup from Express app to Fastify inject, fixes all broken test imports.
- config-migrator removes express from package.json, adds fastify and @fastify plugins, updates TypeScript types, runs npm install.
- migration-coordinator verifies all 23 routes, 8 middleware, 3 plugins, and 2 error handlers are migrated. Build passes. Tests pass.

## Integration Notes

- The two-phase approach (analyze then transform) prevents partial migrations where some files are updated and others are missed
- For very large migrations, the coordinator can batch transformations into multiple rounds, verifying after each round
- The atomic change pattern means any problematic transformation can be reverted without losing the rest of the migration
- config-migrator's Bash access should be monitored in high-security environments; its agent prompt should restrict commands to package management and build tools only
- The opus model for the coordinator is justified by the complexity of planning migration order (e.g., shared types must migrate before consumers)

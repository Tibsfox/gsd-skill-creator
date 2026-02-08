# Doc Generation Team

Documentation generation pipeline with specialized writers that produce API references, architecture docs, and user guides from source code analysis. A coordinator ensures consistency and accuracy across all generated documentation.

## When to Use This Team

- Bootstrapping documentation for an undocumented codebase
- Generating API reference docs from source code and types
- Creating onboarding documentation for new team members
- Producing architecture documentation before a handoff or audit

## Member Roles

| Member | Role | Focus Area | Tools | Model |
|--------|------|------------|-------|-------|
| doc-coordinator | Leader | Scope assignment, draft review, consistency enforcement | Read, Glob, Grep | sonnet |
| api-doc-writer | Worker | Endpoint docs, schemas, auth docs, error references | Read, Write, Glob, Grep | sonnet |
| architecture-writer | Worker | System design, component relationships, data flow | Read, Write, Glob, Grep | sonnet |
| guide-writer | Worker | README, getting started, tutorials, FAQ | Read, Write, Glob, Grep | sonnet |

## Safety Properties

- **Write scope is constrained.** Workers write only to `docs/` and `README.md`. They cannot modify source code, tests, or configuration files.
- **No destructive tools.** No member has Bash or Edit access. Writers create new files via Write; they do not patch existing source files.
- **Leader is read-only.** The coordinator reads and reviews but does not write files, maintaining separation between review and authoring.
- **Idempotent output.** Running the team again overwrites docs with updated versions rather than creating duplicates.

## How It Works

1. The **doc-coordinator** analyzes the codebase structure and determines what documentation is needed.
2. The coordinator assigns scope: API endpoints to api-doc-writer, architecture to architecture-writer, user-facing guides to guide-writer.
3. Each writer reads the relevant source code, types, and existing docs, then produces their assigned documentation.
4. The coordinator reviews all drafts for factual accuracy, consistent terminology, and correct cross-references.
5. Writers apply revisions and produce final documentation.

## Example Usage Scenario

**Input:** "Generate documentation for the entire src/ directory"

**Flow:**
- doc-coordinator scans src/ structure, identifies 12 API routes, 3 major subsystems, and no existing docs
- api-doc-writer reads route handlers and types, generates docs/api/endpoints.md with all 12 routes documented
- architecture-writer reads module structure and imports, generates docs/architecture/overview.md with component diagrams
- guide-writer reads package.json, entry points, and env config, generates README.md and docs/getting-started.md
- doc-coordinator reviews all output, flags two inconsistent type names, writers correct them

## Integration Notes

- The write scope constraint (`docs/` and `README.md`) should be enforced by the agent prompt for each worker, not just by convention
- For projects using documentation generators (TypeDoc, Swagger), the api-doc-writer can generate source annotations instead of standalone docs
- The team reads source code but never modifies it, making it safe to run against any branch
- Consider running this team after significant feature work to keep docs in sync

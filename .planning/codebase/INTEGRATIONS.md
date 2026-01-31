# External Integrations

**Analysis Date:** 2026-01-30

## APIs & External Services

**Anthropic Claude API:**
- Service: Anthropic Claude text generation and token counting
  - What it's used for: Token counting via `messages.countTokens()` API and potentially for skill content generation/validation
  - SDK/Client: `@anthropic-ai/sdk` 0.72.1
  - Auth: `ANTHROPIC_API_KEY` environment variable (optional)
  - Integration point: `src/application/token-counter.ts`
  - Behavior: Falls back gracefully to offline estimation if key is unavailable
  - Model used: `claude-sonnet-4-5-20250929` for token counting

## Data Storage

**Local Filesystem Only:**
- Storage: File system based, no external database
- Pattern Storage:
  - Location: `.planning/patterns/` (default, configurable)
  - Format: JSONL (JSON Lines) files organized by pattern category
  - Examples: `commands.jsonl`, `file_patterns.jsonl`, `decisions.jsonl`
  - Client: Node.js native `fs/promises` module

- Skill Storage:
  - Location: `.claude/skills/` (default, configurable)
  - Format: Markdown files with YAML frontmatter
  - Client: Node.js native `fs/promises` module
  - Example structure: `.claude/skills/typescript-patterns/SKILL.md`

- Skill Index:
  - Location: `.claude/skills/.index.json` (auto-generated)
  - Format: JSON
  - Purpose: Fast lookup and metadata for all skills
  - Client: Node.js native `fs/promises` module

- Agent Storage:
  - Location: `.claude/agents/` (auto-generated)
  - Format: Markdown files with YAML frontmatter
  - Purpose: Composite skills bundled for specific workflows
  - Client: Node.js native `fs/promises` module

**File Operations:**
- All file I/O through Node.js `fs` and `fs/promises`
- Locations: `src/storage/pattern-store.ts`, `src/storage/skill-store.ts`, `src/observation/session-observer.ts`
- Write safety: Queue-based serialization to prevent race conditions in `PatternStore`

**Caching:**
- In-memory cache only
- Token count cache in `TokenCounter` class (`src/application/token-counter.ts`)
- Stores computed token counts with hash-based cache keys

## Authentication & Identity

**Auth Provider:**
- Custom/None - No user authentication system
- API Authentication:
  - Anthropic API uses `ANTHROPIC_API_KEY` environment variable
  - Optional - system functions without it (offline fallback)

## Monitoring & Observability

**Error Tracking:**
- Not detected - No external error tracking service
- Error handling: Try/catch blocks with graceful fallbacks (e.g., `TokenCounter.count()`)

**Logs:**
- Approach: Console logging via `picocolors` for colored output
- Locations: `src/cli.ts` and throughout workflow files
- Levels: Info/error messages sent to stdout/stderr

## CI/CD & Deployment

**Hosting:**
- Not applicable - CLI tool, not a hosted service
- Installed locally or globally via npm/npx

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other pipeline configuration found
- Testing: Run manually via `npm test`

## Environment Configuration

**Required env vars:**
- None (all optional)

**Optional env vars:**
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude token counting
  - If provided: Uses API for accurate token counts
  - If missing: Falls back to offline `gpt-tokenizer` estimation

**Configuration via Code:**
- Configurable paths:
  - Patterns directory: Default `.planning/patterns/`, customizable in `createStores()`
  - Skills directory: Default `.claude/skills/`, customizable in `createStores()`
  - Agent directory: Default `.claude/agents/`

- Configurable via `ApplicationConfig` in `src/types/application.ts`:
  - Context window size (for token budgeting)
  - Token budget percentages
  - Retention policies for patterns (days and session limits)
  - Learning parameters (rate limiting, version limits)

**Secrets location:**
- Environment variable only
- No `.env` file or config file support
- No secrets management integration (Vault, AWS Secrets Manager, etc.)

## Webhooks & Callbacks

**Incoming:**
- None - CLI tool, not a service

**Outgoing:**
- None - Does not call external webhooks or callbacks
- One-way integration only with Anthropic API

## Data Persistence Strategy

**Pattern Recording:**
- Append-only JSONL format prevents data loss
- Safe concurrent writes via queue mechanism
- Example: `src/observation/session-observer.ts` appends to `PatternStore`

**Skill Versioning:**
- Git-tracked (users should commit `.claude/skills/` and `.claude/agents/`)
- Markdown format allows easy version control diffing
- Version numbers in frontmatter metadata

**No External Sync:**
- All data stored locally
- User responsible for git commits and backups
- No cloud sync, replication, or backup integration

---

*Integration audit: 2026-01-30*

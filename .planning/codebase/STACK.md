# Technology Stack

**Analysis Date:** 2026-01-30

## Languages

**Primary:**
- TypeScript 5.3.0 - All source code in `src/`
- JavaScript ES2022 - Compiled target and CLI scripts

**Secondary:**
- Markdown - Skill definitions, documentation, and configuration files

## Runtime

**Environment:**
- Node.js v22.22.0 (minimum required version varies, check package.json for engines field)

**Package Manager:**
- npm 10.9.4
- Lockfile: `package-lock.json` (present and tracked)

## Frameworks

**Core:**
- No web framework - Pure Node.js CLI/library
- CLI framework: `@clack/prompts` 1.0.0 - Interactive terminal UI for skill creation workflows

**Testing:**
- Vitest 1.0.0 - Test runner and assertion library
- Test files: `*.test.ts` throughout `src/`

**Build/Dev:**
- TypeScript 5.3.0 - Language compiler
- tsx 4.21.0 - TypeScript executor for development/CLI runs
- tsc - Built-in TypeScript compiler for production builds

## Key Dependencies

**Critical:**
- `@anthropic-ai/sdk` 0.72.1 - Anthropic Claude API client
  - Used in `src/application/token-counter.ts` for token counting via Claude Sonnet 4.5
  - Optional integration when ANTHROPIC_API_KEY is available
  - Fallback to offline token estimation via `gpt-tokenizer`

**Data & Text Processing:**
- `gray-matter` 4.0.3 - YAML frontmatter parsing
  - Parses skill definitions and agent configurations
  - Used in skill loading, composition, and storage

- `natural` 8.1.0 - NLP library
  - Text analysis and pattern matching
  - Used in pattern detection and skill suggestion engines

- `gpt-tokenizer` 3.4.0 - Offline token counting
  - Fast token estimation without API calls
  - Fallback when Anthropic SDK is unavailable

**Diff & Comparison:**
- `diff` 8.0.3 - Text diffing library
  - Used in learning module for detecting code changes
  - Feedback-driven skill refinement

**Validation:**
- `zod` 4.3.6 - Runtime schema validation
  - Validates skill input, metadata, and configuration
  - Location: `src/validation/skill-validation.ts`

**Utilities:**
- `picocolors` 1.1.1 - Terminal color output
  - Colored CLI messages and logging
  - Used throughout `src/cli.ts`

## Configuration

**Environment:**
- No `.env` file detected
- Optional `ANTHROPIC_API_KEY` environment variable for token counting via Anthropic API
- Token counter gracefully degrades to offline estimation if key is missing

**Build:**
- `tsconfig.json` - TypeScript compiler configuration
  - Target: ES2022
  - Module: NodeNext (modern ESM)
  - Output: `dist/` directory
  - Root: `src/`
  - Strict mode enabled
  - Module resolution: NodeNext

**Package Configuration:**
- `package.json` - Node.js package manifest
  - Type: "module" (ESM-only)
  - Main entry: `dist/index.js`
  - CLI entry: `./dist/cli.js` (executable as `skill-creator` command when installed globally)

## Platform Requirements

**Development:**
- Node.js v22.x or compatible
- npm 10.x or compatible
- Git (for tracking skills and patterns)
- ~150MB disk space (after node_modules installation)

**Production/Usage:**
- Node.js v22.x or compatible (may work with earlier LTS versions, untested)
- Read/write access to `.planning/patterns/` directory (pattern storage)
- Read/write access to `.claude/skills/` directory (skill storage)
- Optional: ANTHROPIC_API_KEY for enhanced token counting

## Build Output

**Directory:** `dist/`
- Compiled JavaScript from TypeScript
- Generated after `npm run build`
- Not committed to git (in .gitignore)

## Scripts

**Available Commands:**
```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Run CLI directly with tsx (development)
npm test           # Run Vitest test suite
```

**CLI Invocation:**
```bash
npm run dev [command] [args]        # Development mode
skill-creator [command] [args]      # After global install
npx skill-creator [command] [args]  # Via npx
```

---

*Stack analysis: 2026-01-30*

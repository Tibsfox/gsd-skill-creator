# Contributing to GSD Skill Creator

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Run tests: `npm test`
5. Build: `npm run build`

## Development

- TypeScript source: `src/`
- Desktop frontend: `desktop/`
- Rust backend: `src-tauri/`
- Tests: `test/`

### Strict Boundaries

- `src/` never imports from `desktop/` or `@tauri-apps/api`
- `desktop/` never imports Node.js modules

### Quick Commands

```sh
make build        # TypeScript library build
make test         # Run all Vitest tests
make lint         # TypeScript type checking
make desktop      # Start desktop dev server
make rust-check   # Cargo check
make verify       # Run all verification checks
```

## Commit Convention

We use Conventional Commits:

- `feat(scope): add new feature`
- `fix(scope): fix bug`
- `docs(scope): update documentation`
- `test(scope): add tests`
- `refactor(scope): restructure code`
- `chore(scope): maintenance task`

Subject line: imperative mood, lowercase, <72 chars, no period.

## Pull Requests

1. Create a branch from `dev`
2. Make your changes with tests
3. Ensure `npm test` passes
4. Ensure `npx tsc --noEmit` passes
5. Submit PR to `dev` branch

## Code of Conduct

Be respectful. Be constructive. Build cool things.

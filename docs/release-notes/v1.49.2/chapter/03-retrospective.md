# Retrospective — v1.49.2

## What Worked

- **Systematic categorization of TypeScript errors.** Breaking 219 errors into 6 distinct categories (missing `.js` extensions, casts, import paths, implicit `any`, ESM/CJS interop, type mismatches) made the fix tractable as a single pass rather than a sprawling refactor.
- **Desktop indicator wiring validated the Tauri-tmux integration pattern.** Terminal open/close driving indicator state through `createTmuxTerminal` and `ClaudeSessionManager.start_monitor()` proved the Rust-to-TypeScript bridge works end-to-end.
- **Zero regression across 19,107 tests.** A 219-error fix touching 34+ files with no new test failures demonstrates the test suite catches real breakage.

## What Could Be Better

- **167 of 219 errors were missing `.js` extensions.** This is a tooling gap -- ESM resolution rules should be enforced by a lint rule at authorship time, not caught as a batch of 167 errors after the fact.
- **Holomorphic and upstream modules were the worst offenders.** 114 relative imports across 34 files in those two directories suggests they were written without the same import discipline as the rest of the codebase.

## Lessons Learned

1. **ESM import extensions should be enforced by lint, not discovered during compilation.** A single eslint-plugin-import rule (`import/extensions`) would have prevented 76% of these errors from accumulating.
2. **Ajv ESM/CJS interop requires the `.default` fallback pattern.** This is a recurring cross-ecosystem friction point that should be documented as a project convention.
3. **Desktop indicator wiring is a good smoke test for Tauri integration.** If the indicators respond correctly, the full Rust-TypeScript-PTY pipeline is working.

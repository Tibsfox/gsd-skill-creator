# v1.49.2 — GSD-OS Indicator Wiring & TypeScript Fixes (Patch)

**Shipped:** 2026-02-27

Major bugfix release wiring GSD-OS desktop indicators and resolving 219 TypeScript compilation errors.

### Desktop Indicators

- **Terminal indicator:** Wired terminal window open → PTY spawn via `createTmuxTerminal` → indicator goes green; cleanup on window close returns to red
- **Claude monitor:** Started `ClaudeSessionManager.start_monitor()` in Tauri setup, auto-detects existing Claude sessions in `gsd` tmux session, maps Claude status to process indicator status
- **File Watcher:** Already working (no changes needed)

### TypeScript Fixes (219 errors → 0)

- **Missing `.js` extensions (167 errors):** Added `.js` extensions to 114 relative imports across 34 files in `src/holomorphic/` and `src/upstream/`
- **Missing `.js` extensions in site (21 files):** Fixed extensionless imports in `src/site/`, including barrel imports requiring `/index.js`
- **Chat pipeline casts (3 errors):** Fixed type casts in `desktop/src/pipeline/chat-pipeline.ts` by casting through `unknown`
- **Dogfood import paths (5 errors):** Fixed `../../types` → `../types` in `src/dogfood/pydmd/learn/`
- **Implicit `any` parameters (18 errors):** Added type annotations across holomorphic, site, and dogfood modules
- **Ajv ESM/CJS interop:** Fixed constructor usage with `.default` fallback pattern
- **DACP analyze types:** Fixed type mismatches in `dacp-analyze.ts`

### Verification

- 19,107 tests passing, 2 skipped (pre-existing shellcheck timeouts)
- TypeScript strict mode: 0 errors
- `npm run build`: clean

## Retrospective

### What Worked
- **Systematic categorization of TypeScript errors.** Breaking 219 errors into 6 distinct categories (missing `.js` extensions, casts, import paths, implicit `any`, ESM/CJS interop, type mismatches) made the fix tractable as a single pass rather than a sprawling refactor.
- **Desktop indicator wiring validated the Tauri-tmux integration pattern.** Terminal open/close driving indicator state through `createTmuxTerminal` and `ClaudeSessionManager.start_monitor()` proved the Rust-to-TypeScript bridge works end-to-end.
- **Zero regression across 19,107 tests.** A 219-error fix touching 34+ files with no new test failures demonstrates the test suite catches real breakage.

### What Could Be Better
- **167 of 219 errors were missing `.js` extensions.** This is a tooling gap -- ESM resolution rules should be enforced by a lint rule at authorship time, not caught as a batch of 167 errors after the fact.
- **Holomorphic and upstream modules were the worst offenders.** 114 relative imports across 34 files in those two directories suggests they were written without the same import discipline as the rest of the codebase.

## Lessons Learned

1. **ESM import extensions should be enforced by lint, not discovered during compilation.** A single eslint-plugin-import rule (`import/extensions`) would have prevented 76% of these errors from accumulating.
2. **Ajv ESM/CJS interop requires the `.default` fallback pattern.** This is a recurring cross-ecosystem friction point that should be documented as a project convention.
3. **Desktop indicator wiring is a good smoke test for Tauri integration.** If the indicators respond correctly, the full Rust-TypeScript-PTY pipeline is working.

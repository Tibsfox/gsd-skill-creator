# v1.49.2 — GSD-OS Indicator Wiring & TypeScript Fixes (Patch)

**Shipped:** 2026-02-27

Major bugfix release wiring GSD-OS desktop indicators and resolving 219 TypeScript compilation errors.

### Desktop Indicators

- **Terminal indicator:** Wired terminal window open → PTY spawn via `createTmuxTerminal` → indicator goes green; cleanup on window close returns to red
- **Claude monitor:** Started `ClaudeSessionManager.start_monitor()` in Tauri setup, auto-detects existing Claude sessions in `gsd` tmux session, maps Claude status to process indicator status
- **File Watcher:** Already working (no changes needed)

### TypeScript Fixes (219 errors → 0)

- **Missing `.js` extensions (167 errors):** Added `.js` extensions to 114 relative imports across 34 files in `src/packs/holomorphic/` and `src/integrations/upstream/`
- **Missing `.js` extensions in site (21 files):** Fixed extensionless imports in `src/integrations/site/`, including barrel imports requiring `/index.js`
- **Chat pipeline casts (3 errors):** Fixed type casts in `desktop/src/pipeline/chat-pipeline.ts` by casting through `unknown`
- **Dogfood import paths (5 errors):** Fixed `../../types` → `../types` in `src/packs/dogfood/pydmd/learn/`
- **Implicit `any` parameters (18 errors):** Added type annotations across holomorphic, site, and dogfood modules
- **Ajv ESM/CJS interop:** Fixed constructor usage with `.default` fallback pattern
- **DACP analyze types:** Fixed type mismatches in `dacp-analyze.ts`

### Verification

- 19,107 tests passing, 2 skipped (pre-existing shellcheck timeouts)
- TypeScript strict mode: 0 errors
- `npm run build`: clean

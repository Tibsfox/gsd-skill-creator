# v1.49.903 — Ninth LoaderContext Chip: `cli/commands/keystore.ts` (Sync Two-Site Hoisted-Check)

**Released:** 2026-05-29

Continues the LoaderContext chip-down opened by v900 + extended by v902. v903 chips `src/cli/commands/keystore.ts` (179 LOC, unique-smallest entry in the post-v902 KNOWN_UNWIRED Loader ledger). The file was already ProcessContext-wired at v861; the LoaderContext-wire targets 2 sync `existsSync` sites in `resolveKeystoreBin` (KEYSTORE_BIN env override + candidate-loop), surfacing a NEW sync wire shape — sync two-site hoisted-check, sibling of v892 `dacp/bus/scanner.ts` async two-site hoisted-check. Sibling chokepoints (LoaderContext + ProcessContext) thread independently per #10449. KNOWN_UNWIRED Loader 7 → 6.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path

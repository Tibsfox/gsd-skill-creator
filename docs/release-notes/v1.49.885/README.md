# v1.49.885 — LoaderContext Chip-Down Opener: Audit Extension + KNOWN_UNWIRED Ledger Initialization

**Released:** 2026-05-28

Opens the LoaderContext (third Tier-E chokepoint) chip-down ratchet-ledger. Extends the audit-test glob from `*loader*.ts` to `*{loader,reader,scanner,walker,store}*.ts`, identifies 15 grandfathered files, adds KNOWN_UNWIRED + stale-entry detector tests, integrates with `tools/security/check-stale-known-unwired.mjs`. Surfaces (and fixes) an alias-stripping bug in the cross-audit tool — 2nd instance of "tool itself fails silently" class after v867.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path

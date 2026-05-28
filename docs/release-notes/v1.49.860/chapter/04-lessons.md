# v1.49.860 — Lessons

## Tentative observations (below promotion threshold)

### Pre-test FK-pragma pattern for wire-only tests

**Instances: 1 (v860)**

**Observation:** When a wire test only exercises a downstream side-effect (e.g., git invocation here) and the upstream tables have FK constraints, disabling FKs via `db.pragma('foreign_keys = OFF')` on the test DB lets the test seed minimal rows without the full FK chain (meetings → decisions → mission_links). Pattern:

```ts
const db = new Database(':memory:');
applyMigrations(db, MIGRATIONS_DIR);
db.pragma('foreign_keys = OFF');
db.prepare("INSERT INTO mission_links (...) VALUES (...)").run();
```

**Why below threshold:** First instance. The cleaner alternative (seed full FK chain) is correct for tests exercising business logic; the FK-pragma pattern is for tests where the FK chain is incidental to the security wire.

**Promotion gate:** 2nd instance. Sub-pattern of test-discipline.

## Forward-test of existing lessons

### #10433 — Internal-helper pattern (Lightest wire)

**Status:** APPLIED. linker.ts had a single internal `git()` helper called from 4 sites + 2 exported entry points. Threaded `ctx?` through the helper + 2 entries; hoisted `ensureProcessAllowed` at the helper's spawn site. Cost ~15 LOC; protected 4 downstream spawns.

### #10427 — Failure-mode contracts

**Status:** APPLIED. No swallowing try/catch around the spawn — ProcessContextDenied propagates naturally.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** APPLIED (3rd consecutive chip ship). Tool runs clean post-wire.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Process KNOWN_UNWIRED 9 → 8.

## No promotions this ship

Eligible backlog: 0.

# v1.49.880 — Retrospective

**Wall-clock:** ~8-10 min. Single fetch site made this the fastest Track 5 chip yet.

## What went as expected

- Simple wire: installSkill is a router; installFromRemote does the fetch. Add ctx to both. Single hoist before fetch.
- installFromLocal bypasses ctx (no network) — same as v864's non-npm bypass pattern.

## Future-improvement candidates

### Conditional bypass for non-network paths

**Surface ship:** v1.49.880 (installFromLocal vs installFromRemote split).

When a router function dispatches to multiple implementations, only some of which spawn (or fetch), the wire only needs to thread ctx to the spawn-capable paths. installFromLocal at v880 doesn't take ctx; installFromRemote does. v864 equivalent-searcher has the same shape: non-npm early-return bypasses the ctx wire.

**2 instances** (v864 + v880). Promotion-eligible at next codify as a refinement to #10444 — "router-with-conditional-bypass" sub-pattern.

## Verdict on scope

One chip away from Track 5 close. v881 ipc.ts (516 LOC) is the last KNOWN_UNWIRED Egress entry.

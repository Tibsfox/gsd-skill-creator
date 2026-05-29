# Lessons Emitted — v1.49.903

No new manifest-promoted lessons this ship. v903 introduces a 1-instance sub-variant candidate for #10448 (sync two-site hoisted-check) and reinforces #10444, #10449, #10456 at ESTABLISHED. The codify-axis backlog from v902 carries forward with one new 1-instance candidate added.

## NEW 1-instance candidate: sync two-site hoisted-check (sub-variant of #10448)

**Status:** 1-instance candidate; needs 2 more sync-`existsSync` (or sibling sync-op) two-site chips to promote.

**Defining property:** A function with N≥2 distinct `existsSync` (or other sync fs-op) call sites — typically a binary/path resolver. Each site gates independently via `ensureAllowed` BEFORE the sync call. Variable audit-record count per function invocation (depends on early-return behavior).

**Discriminator from v892 async two-site:**

| Sub-variant | Sync vs async | Site multiplicity | Audit fixedness |
|---|---|---|---|
| v892 (ESTABLISHED via cluster) | async (`readdir`, `access`) | 2 entry points | 1 per entry point call |
| v903 candidate | sync (`existsSync`) | 2 sites inside ONE function | 1-or-2 per function call (early-return dependent) |

The "two-site" framing differs: v892 has two distinct exported functions each with a single fs op; v903 has one function with two fs ops at different control-flow points. Both share the spirit of #10448's "two-site hoisted-check" — multiple chokepoint touchpoints per logical wire — but the structural decomposition is different.

**v903 instance:** `src/cli/commands/keystore.ts` — `resolveKeystoreBin` has 2 sites (KEYSTORE_BIN env override branch + repo-relative candidate loop). Site 1 short-circuits when ENOENT to fall through to site 2; site 2 short-circuits on first match.

**Promotion path:** Two more sync-`existsSync` (or sync-stat / sync-readFile) two-site chips. The remaining KNOWN_UNWIRED Loader ledger has no other sync-existsSync candidates from inspection so far — promotion may come from non-LoaderContext-named files added later, or from a future audit-scope expansion. Patience candidate.

## Reinforcement: #10449 (sibling chokepoints stay separate)

**Status:** ALREADY ESTABLISHED.

**v903 instance:** `keystore.ts` carries both `ctx?: ProcessContext` (v861) and now `loaderCtx?: LoaderContext` (v903). Threaded via separate parameter positions on `keystoreCommand(args, io, ctx?, loaderCtx?)` — no combined `SecurityContext` aggregation. Callers wanting both gates supply both args; each is independently optional.

## Reinforcement: #10444 (size-ascending chip-pick)

**Status:** ALREADY ESTABLISHED.

**v903 instance:** Live `wc -l` confirmed 179 LOC is unique-smallest in the post-v902 KNOWN_UNWIRED Loader ledger. The v902 deferral was explicit; v903 picks up exactly where v902 paused.

## Reinforcement: #10456 (audit-record-count assertion) — with variable-count observation

**Status:** ALREADY ESTABLISHED.

**v903 instance:** Tests assert exactly 2 audit records when KEYSTORE_BIN is unset (site 2 loop fires twice) AND exactly 1 audit record when KEYSTORE_BIN is set (site 1 fires + early-return). This is a NEW variable-count variant of #10456: prior instances asserted fixed N under K invocations. v903 asserts conditional N: 1 OR 2 under 1 invocation depending on input.

**Carry-forward observation:** The #10456 catalog may want a variable-count annotation for early-return wire shapes. If a future audit-record-count assertion exists in a wire with branching audit emission, it should follow v903's pattern of asserting BOTH branches independently rather than asserting an "at-least-1" lower bound.

## Carry-forward to v904+

1. **Ergonomic combined `SecurityContext` (1-instance candidate).** `keystore.ts` now carries 2 chokepoint params on adjacent surfaces. A future file with 3+ chokepoint params would justify a combined param object. Not yet — needs at least one more 2-of-N file to ripen.
2. **Class-multi-method consolidated-gate (1-instance from v902).** Will promote if any of `memory/conversation-store.ts`, `memory/file-store.ts`, `intelligence/kb/store.ts`, `events/skill-event-store.ts` chips select consolidated-gate.
3. **Sync two-site hoisted-check (1-instance from v903).** Needs more sync-fs-op two-site instances.

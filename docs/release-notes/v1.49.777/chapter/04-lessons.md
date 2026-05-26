# Lessons — v1.49.777

5 lesson candidates from the Wave 1 review-remediation ship. Concrete lesson IDs assigned by the in-cycle retrospective tracker.

1. **Counter-cadence cadence trigger extends to review-surfaced BLOCKERs.** Lesson #10168 framed counter-cadence as productive every ~30 forward milestones, originally triggered by accumulated social-rule debt (v585) and later by script-bug cascade with public impact (v776). v1.49.777 extends the cadence concept again: full-codebase review surfacing BLOCKERs is a valid third trigger class. Cadence intervals shrink when the trigger is operator-driven (v776 → v777 was 1 milestone; v585 → v776 was 190 milestones) — that's expected and acceptable, because tight cadence under a deliberate trigger is qualitatively different from forced cadence under passive accumulation.

2. **Multi-tier risk sweep as a full-review template.** 5 parallel sub-agents on non-overlapping scopes (security / correctness / performance / tests / architecture), each capped at ~500 words of structured findings with severity tags, returned complete coverage in ~10 minutes wall-clock. Cross-tier synthesis (independent corroboration when two tiers flag the same file) surfaces highest-leverage fixes. Reusable for periodic codebase audits and pre-merge review of large branches.

3. **Cross-tier hot-spot prioritization.** When two parallel-dispatched review tiers independently flag the same file, that file moves to the top of the fix queue. Two reasons: leverage (one diff satisfies two findings) and corroboration (the agreement is from independent contexts that didn't share findings during the sweep). At v1.49.777, `src/chipset/blitter/executor.ts` showed up in both security (BLOCKER — RCE-by-design) and correctness (HIGH — temp-dir leak), and was the first file fixed.

4. **Defense-in-depth over removal preserves consumer pipelines.** When a finding flags a feature with active consumers, hardening the feature is preferable to removing it. For blitter/executor.ts: dropping 'custom' scriptType + chmod 0o755 + env-allowlist + temp-leak fix closes the attack vectors while preserving the legit bash/node/python paths the chipset/copper offload pipeline depends on. Removing the whole executor would have broken downstream consumers; hardening keeps both safety and capability.

5. **Shared-helper extraction beats per-file inline fix when a pattern appears N≥3 times.** Originally validated at the earlier-session `isCliEntrypoint` extraction (4 call sites → `src/cli/entrypoint-guard.ts`). Re-validated at v1.49.777 with the write-queue sweep: 14 sites across 10 sibling stores all carried the same self-poisoning pattern; introducing `src/safety/write-queue.ts::serializeWrite(holder, work)` collapsed each site to one helper call and provided single-point test coverage of the regression. Also counter-patterns Tier E's "85 Store/Registry/Manager classes" sprawl finding by reducing the surface area in which the pattern can re-appear.

## Anti-patterns surfaced

- **Self-poisoning promise-chain queue.** `this.writeQueue = this.writeQueue.then(work); await this.writeQueue` keeps the rejected chain reachable on every subsequent write. The fix separates the chain-continuation promise from the caller's awaited result so each caller sees only its own outcome and the chain stays alive.
- **`munmap` failure as a backing-strategy oracle.** The original PinnedBuffer::drop treated non-zero `munmap` return as evidence of alloc-backed memory. `munmap` can fail for unrelated reasons (EINVAL on bad len/alignment, EAGAIN under memory pressure); the inference is unsound. Record the backing explicitly at construction time.
- **Inheriting full `process.env` for child processes.** Offload scripts had access to every env var the parent process held, including credentials. Allowlist + per-operation env override is the safer default.
- **'custom' scriptType allowing arbitrary executable shebangs.** When a script type implies "we'll chmod the file 0o755 and let the kernel pick the interpreter," the attacker controls which binary runs. Either remove the surface or restrict to explicit named interpreters.

## Forward gates (codified)

| Gate | Mechanism | Triggered at |
|------|-----------|--------------|
| Shell-string execSync detection | grep for `execSync(\`...\${...}\``) patterns; fail on hit | New PR pre-merge |
| Write-queue self-poisoning detection | grep for `this.writeQueue.then(` outside `src/safety/write-queue.ts`; fail on hit | New PR pre-merge |
| Child-process env allowlist | All `spawn`/`execFile` calls in chipset/observation must pass a constructed env, not `...process.env` | New PR pre-merge |
| Rust Drop UB audit | Manual review of any unsafe block in a Drop impl | Code review |

These gates would have caught the four BLOCKERs at PR time rather than waiting for a full-codebase review.

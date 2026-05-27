# v1.49.818 — Retrospective

**Wall-clock:** ~25 min from continuing the chain to tag-push. Third ship of the v816-822 chain.

## What worked

**Grep-first recon nailed the wedge shape in 30 seconds.** `grep -rln "FlagLookup\|getFlagValue" src/cli/` returned exactly 4 files. Inspecting one (`koopman-check.ts`) confirmed the 9-LOC block; a side-by-side comparison of all 4 confirmed byte-identicality. No design re-litigation needed.

**The migration was mechanical and reviewable in one glance.** Each of the 4 files got: (a) add 1 import line, (b) remove the 9-LOC inline block. Diff per file: ~+1/-9 LOC. The lack of edge cases (no callers depend on the inline form; the function signature is unchanged) means the migration is byte-equivalent at runtime.

**The new unit-test file fills a gap.** Before extraction, the function was tested implicitly through CLI integration tests (e.g., calling `koopman-check` with various flags). After extraction, `flag-lookup.test.ts` covers each of the 7 return-shape branches directly. Faster regressions; better coverage; cleaner separation between unit and integration.

**TypeScript caught zero issues.** `npx tsc --noEmit` ran clean immediately after migration. This validates that the extracted module's exported types (`FlagLookup`, `getFlagValue`) are surface-compatible with the inline declarations — no inferred-type drift or implicit narrow-vs-wide differences across callers.

**The 615-test cli suite passed unchanged.** Migration is byte-equivalent: the same function with the same signature, just imported from a different module. The integration test surface confirms no semantics-level regression across all 4 migrated callers.

## What surprised

**The deferred wedge was at the 4th instance, not the 2nd or 3rd.** #10426 specifies extraction at 2nd-3rd instance; by the time the wedge gets named in a handoff, it's usually at 4th+. Pattern: deferred-maintenance class wedges accumulate instances during the "tolerated" phase, then close at the recon ship. The instance count at closure is typically 1-2 above the discipline's named threshold.

**The extracted module is small.** 14 LOC of code + 25 lines of doc/attribution comments. The doc comments cite v796 deferral and v818 closure inline — future readers see the wedge's history without needing to spelunk through release notes. This mirrors v817's structural-cause comment block — the same "comment-block-as-history-anchor" pattern.

**Other duplicate-code patterns aren't obviously deferred-maintenance.** Spot-checked for similar 5+-LOC blocks repeated across `src/cli/commands/`. Nothing obvious; each command has its own command-specific helpers (argument parsing for command-specific flags, etc.). The FlagLookup case is genuinely a "single 9-LOC helper used identically by N modules" pattern; most CLI command code is intentionally bespoke.

## What to watch

- **If a 5th caller emerges in the future, it imports directly — no further deferral.** Now that the module exists, new callers should `import { getFlagValue }` rather than re-declare the inline block. The presence of `src/cli/lib/flag-lookup.ts` is itself the contract for future callers.

- **`src/cli/lib/` is currently a one-file directory.** If 2-3 more shared CLI helpers accumulate (e.g., common arg-validation patterns, common output-formatting helpers), `lib/` becomes a small utility namespace. No structural action needed yet; just watch the cadence.

- **The doc comment in `flag-lookup.ts` cites #10426.** If the discipline name or threshold changes in a future codify ship, the doc comment becomes stale. This is a known pattern with discipline-citing inline comments; the doc-render gate doesn't catch it. Worth a future doc-render augmentation if the citation drift becomes an issue.

## Verdict on scope

Closed at the smallest viable shape: 14 LOC extract + 41 LOC test + 4 mechanical migrations (-9 LOC each) + 5 release-notes files. Resisted: building a generic CLI-arg parser library, auto-derivation from a schema, adding flag-shape variants nobody asks for. The extract is the byte-identical inline form, lifted to a shared module — nothing more.

After v818, the T2.3 recon-surfaced backlog is EMPTY. Three ships have closed (HIGH-01 PMTiles, c12 flake, FlagLookup). The v784 audit's value as a wedge-list source has been mostly harvested. The chain continues with non-T2.3 work (aminet batch chip, git/core chip, gate flip, ObservationBridge wire).

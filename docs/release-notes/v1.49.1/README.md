# v1.49.1 — DACP CLI Field Alignment

**Released:** 2026-02-27
**Scope:** DACP CLI bugfix — `handoff_type` field alignment + backward-compat shim
**Branch:** dev → main
**Tag:** v1.49.1 (2026-02-27T03:18:28-08:00)
**Predecessor:** v1.49.0 — Mega-release foundations
**Successor:** v1.49.2 — GSD-OS Indicator Wiring & TypeScript Fixes
**Classification:** patch — single-file field rename + compat shim; no new functionality
**Verification:** 19,110 tests passing · strict TypeScript · 0 regressions

## Summary

**A single CLI field-name mismatch shipped in v1.49.0 and this patch aligned it.** DACP bundles serialize a kind-of-handoff discriminator; the CLI code read it as `type` in some call sites and `handoff_type` in others. Bundles produced by one code path couldn't be consumed by another without manual rewriting. v1.49.1 canonicalizes on `handoff_type` everywhere in `dacp-analyze.ts` and adds a compat shim so bundles that still carry the old `type` field deserialize cleanly.

**Backward compatibility was non-negotiable.** DACP bundles live on disk — some in user projects, some in the `.planning/` archives the team depends on daily. A rename without a shim would have broken every bundle created before v1.49.1. The chosen shape — read both `type` and `handoff_type`, write `handoff_type` — means every old bundle still loads, and every new bundle is canonical. The shim is small enough to keep indefinitely; there's no forcing function to ever remove it.

**Full regression verification ran on a one-line semantic fix.** v1.49.1 touches a single file and a single field name. It still runs the complete 19,110-test suite to catch the cascade risks that field-rename bugs produce — broken deserialization, silent field-stripping, wrong-enum routing. The discipline of "always run the full suite, even on a tiny patch" is what makes this patch worth landing as a tagged release rather than squashed into v1.49.2.

**The patch closes RC-04 in the v1.49 retrospective tracker.** The mega-release that became v1.49.0 shipped with five known retrospective items (RC-01 through RC-05). RC-04 was this field-alignment bug. v1.49.1 applies the fix, updates tracker state, and establishes documentation checklists for RC-01 and RC-05. The patch is named "DACP CLI Field Alignment" in the release title but the tag message also names it "Retrospective patch" — both framings are accurate.

**This is why mega-releases need retrospective patches.** Large bundled releases (v1.49.0 was one) accumulate small inconsistencies during their long integration window that only surface under real use. Landing a dedicated `.1` patch within hours or days of the mega-release is the pattern that keeps the main version line clean without forcing a rush-fix `.0`.

## Key Features

| Area | What Shipped |
|------|--------------|
| DACP CLI | `dacp-analyze.ts` — canonicalize field name on `handoff_type` (was mixed `type`/`handoff_type`) |
| DACP CLI | Backward-compat shim — read both `type` and `handoff_type`, always write `handoff_type` |
| Retrospective tracker | RC-04 marked applied; tracker state updated in `.planning/retrospective/` |
| Documentation | RC-01 and RC-05 documentation checklists established |
| Verification | `npm test` clean — 19,110 passing · strict TypeScript 0 errors · no regressions |

## Retrospective

### What Worked

- **Backward compatibility shim for existing bundles.** Rather than forcing all existing DACP bundles to update their field names, the fix supports both `type` and `handoff_type` with a shim. This is the right approach for a field-alignment fix — don't break existing consumers.
- **19,110 tests passing confirms no regression from the field rename.** A single-field rename touching CLI code could cascade into deserialization failures. Full test suite confirmation is essential even for small patches.
- **Scope was tight and the fix was surgical.** One file, one field, one shim. The patch didn't scope-creep into "while we're here, let's also rename three other fields." Small patches stay landable.
- **Retrospective-tracker integration.** RC-04 marked applied cleanly, tracker state updated. The v1.49.0 retrospective loop feeds directly into the next patch plan without ceremony.

### What Could Be Better

- **Mixed field names (`type` vs `handoff_type`) shipped in the first place.** This patch exists because the original DACP CLI implementation used inconsistent field naming. Stricter type checking or a shared schema between CLI and core types would have prevented the inconsistency.
- **Backward-compat shims accumulate.** Every shim is one more branch in the reader code. Long-term, a shared Zod schema with a canonical field name from the start is cheaper than living with the shim.
- **RC-01 and RC-05 are documentation-only in this patch.** Establishing checklists doesn't close them — future patches need to actually run the checklists. The retrospective tracker state should reflect that distinction (documented vs closed).

## Lessons Learned

1. **Field naming inconsistencies between CLI and core types are a common bug class in TypeScript projects.** Zod schemas shared between the CLI layer and the domain layer catch these at compile time. When they drift, the fix is always "align to the canonical schema" plus a backward-compat shim.
2. **Patch releases with full regression verification (19,110 tests, 0 failures) set the quality floor.** Even a single-field bugfix runs the complete test suite. This discipline prevents "it's just a small change" from introducing regressions.
3. **Mixed field names (`type` vs `handoff_type`) shipped in the first place because there was no shared schema.** Catching this at compile time requires a single source of truth the CLI and core both import from — not two parallel interface declarations that happen to agree.
4. **Mega-releases need retrospective patches.** Large bundled releases accumulate small inconsistencies that only surface under use. Landing a dedicated `.1` patch quickly after a mega-release is the pattern that keeps main clean.
5. **Backward-compat shims are cheap to land and hard to remove.** The reader-accepts-both, writer-always-canonical shape in v1.49.1 works forever without maintenance — but future reads can never assume the old field is gone. Plan for that.
6. **Name the retrospective-tracker items (RC-NN) to make the closure loop auditable.** RC-04 closure is visible in git history, tag message, and tracker state. That traceability is worth the small bookkeeping cost.
7. **Documentation checklists (RC-01, RC-05) are work-in-progress markers, not closures.** Calling the patch a "retrospective patch" conflates establishing a checklist with running it. Future release notes should distinguish documented-item from resolved-item.
8. **Single-field-rename bugs hide in test suites that only touch one serialization path.** The 19,110 tests caught zero regressions here, but the fact that mixed naming shipped at all suggests tests weren't exercising cross-path serialization. Adding a round-trip bundle test would make this class of bug undetectable at merge time.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.0](../v1.49.0/) | Predecessor mega-release where the DACP field-name mismatch was introduced |
| [v1.49.2](../v1.49.2/) | Successor patch — continues the rapid-fix pattern against the v1.49.0 retrospective items |
| [v1.49.3](../v1.49.3/) | Third in the v1.49.0 retrospective-patch sequence (GSD-OS Desktop Polish) |
| [v1.49](../v1.49/) | Parent mega-release line — v1.49.1/.2/.3 are all retrospective patches against v1.49 |
| `src/dacp/dacp-analyze.ts` | File changed in this patch |
| `.planning/retrospective/RC-04.md` | Retrospective item this patch closes |
| `.planning/retrospective/RC-01.md` | Documentation checklist established |
| `.planning/retrospective/RC-05.md` | Documentation checklist established |

## Engine Position

v1.49.1 is the first retrospective patch against the v1.49.0 mega-release. It opens a three-patch sequence (v1.49.1, v1.49.2, v1.49.3) that cleared the known items from the v1.49.0 post-release retrospective without disturbing the main release line. This pattern — ship a big bundled release, then land a rapid sequence of `.1`/`.2`/`.3` retrospective patches within days — became the project's standard post-mega-release workflow from v1.49 forward.

## Files

- `src/dacp/dacp-analyze.ts` — field name canonicalized to `handoff_type` + compat shim
- `.planning/retrospective/RC-04.md` — tracker state updated to `applied`
- `.planning/retrospective/RC-01.md`, `RC-05.md` — documentation checklists established (still open)
- `docs/release-notes/v1.49.1/` — this release's notes
- `package.json` — version bumped to 1.49.1

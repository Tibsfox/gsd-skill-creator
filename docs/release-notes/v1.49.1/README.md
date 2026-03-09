# v1.49.1 — DACP CLI Field Alignment (Patch)

**Shipped:** 2026-02-27

Bugfix release aligning DACP CLI field names to `handoff_type` with backward compatibility support.

### Fix

- **DACP CLI field alignment:** Fixed `dacp-analyze.ts` field names to consistently use `handoff_type` instead of mixed `type`/`handoff_type` references, with backward compatibility shim for existing bundles

### Verification

- 19,110 tests passing, 0 failures
- TypeScript strict mode: 0 errors

## Retrospective

### What Worked
- **Backward compatibility shim for existing bundles.** Rather than forcing all existing DACP bundles to update their field names, the fix supports both `type` and `handoff_type` with a shim. This is the right approach for a field alignment fix -- don't break existing consumers.
- **19,110 tests passing confirms no regression from the field rename.** A single-field rename touching CLI code could cascade into deserialization failures. Full test suite confirmation is essential even for small patches.

### What Could Be Better
- **Mixed field names (`type` vs `handoff_type`) shipped in the first place.** This patch exists because the original DACP CLI implementation used inconsistent field naming. Stricter type checking or a shared schema between CLI and core types would have prevented the inconsistency.

## Lessons Learned

1. **Field naming inconsistencies between CLI and core types are a common bug class in TypeScript projects.** Zod schemas shared between the CLI layer and the domain layer catch these at compile time. When they drift, the fix is always "align to the canonical schema" plus a backward-compat shim.
2. **Patch releases with full regression verification (19,110 tests, 0 failures) set the quality floor.** Even a single-field bugfix runs the complete test suite. This discipline prevents "it's just a small change" from introducing regressions.

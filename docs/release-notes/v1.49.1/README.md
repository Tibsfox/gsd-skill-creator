# v1.49.1 — DACP CLI Field Alignment (Patch)

**Shipped:** 2026-02-27

Bugfix release aligning DACP CLI field names to `handoff_type` with backward compatibility support.

### Fix

- **DACP CLI field alignment:** Fixed `dacp-analyze.ts` field names to consistently use `handoff_type` instead of mixed `type`/`handoff_type` references, with backward compatibility shim for existing bundles

### Verification

- 19,110 tests passing, 0 failures
- TypeScript strict mode: 0 errors

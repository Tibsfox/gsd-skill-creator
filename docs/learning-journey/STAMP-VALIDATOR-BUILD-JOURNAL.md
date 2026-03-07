# Stamp Validation Pipeline — Build Journal

## Build (2026-03-06)

### What Was Built

Automated completion validation pipeline for MVR protocol stamps.
Lives at `src/integrations/wasteland/stamp-validator.ts` with 51 tests.
Targets wanted item `w-wl-002` ("Build automated stamp validation pipeline").

**Pipeline stages:**

| Stage | Function | Output |
|-------|----------|--------|
| Evidence Parser | Regex extraction of file refs, line counts, PR links, commit hashes, URLs, description quality | `EvidenceSignals` |
| Valence Scorer | quality/reliability/creativity on MVR spec 1-5 scale | `Valence` |
| Confidence Scorer | 0.0-1.0 based on evidence verifiability | `number` |
| Severity Classifier | leaf/branch/root from effort level + evidence depth | `string` |
| Stamp Generator | Full MVR-compliant stamp with passbook chain linking | `StampRecommendation` |
| SQL Generator | INSERT stamp + UPDATE completion + UPDATE wanted | `string` |

### Architecture Decisions

- **Dependency injection:** `ValidationDataProvider` interface decouples pipeline from DoltHub API. Tests use mocks, production uses `createDoltHubProvider()`.
- **SQL output, not auto-commit:** Pipeline produces SQL for human review. No mutations happen automatically.
- **Yearbook Rule at pipeline level:** `author != subject` enforced before SQL generation (defense in depth with DB's CHECK constraint).
- **Spec-canonical valence (1-5):** Existing demo stamps use 0-1 scale. Pipeline follows the MVR spec, which says 1-5. This creates a data inconsistency with the 3 existing demo stamps.
- **Passbook chain:** `prev_stamp_hash` looked up per subject rig via `getLastStampHash()`.
- **Follows existing patterns:** Same DI/pure-function style as `dolt-scanner.ts`, `decay-simulator.ts`.

### Dry Run Results (Real DoltHub Data)

| Completion | Subject | Q | R | C | Conf | Severity | Evidence Summary |
|-----------|---------|---|---|---|------|----------|-----------------|
| c-01541be343 | MapleFoxyBells | 4.5 | 4 | 4 | 0.75 | root | 886-line design spec |
| c-06b3609d31 | MapleFoxyBells | 3.5 | 4 | 3 | 0.70 | branch | fraud detection, no line count |
| c-c648052618 | MapleFoxyBells | 4.5 | 4 | 3.5 | 0.75 | root | 1013-line protocol spec |
| c-e435133c74 | MapleFoxyBells | 3.5 | 4 | 3.5 | 0.70 | branch | formula engine, no line count |
| c-demo-001 | steveyegge | 3 | 4 | 3 | 0.50 | leaf | PR link only |

Scoring behaves well: high line counts + file refs produce higher scores, PR-only evidence produces lower confidence, effort level correctly maps to severity.

### What Landed Well

**Evidence parser handles real wasteland data.** The `docs/file.md — N-line description` format that MapleFoxyBells uses is well-matched by the regex patterns. The parser correctly extracts file paths, line counts, and description quality from all 17 unvalidated completions.

**Confidence scoring is appropriately skeptical.** Vague evidence caps at 0.4 confidence. Rich evidence with file refs + line counts + descriptions reaches 0.75. The pipeline never claims > 0.95 confidence because it can't actually verify artifact contents.

**Severity classification tracks effort level well.** trivial/small → leaf, medium/large with evidence → branch, epic or large with 800+ lines → root. The 886-line role format spec correctly gets `root` for its `large` effort level.

**Test suite is comprehensive.** 51 tests covering parser, each scorer individually, confidence, severity, SQL generation, SQL injection escaping, Yearbook Rule, empty evidence, network errors, confidence thresholds, passbook chain, and full pipeline integration.

### Issues Found in Review

**1. Valence scale mismatch.** Pipeline uses 1-5 (per spec). Existing demo stamps use 0-1 (e.g., `quality: 0.72`). Creates inconsistent data in the stamps table. The spec is authoritative, but the migration gap exists.

**2. `block_hash` not computed.** MVR spec says stamps should have a content-addressed hash for tamper detection. Pipeline doesn't generate one. Existing demo stamps also have null `block_hash`, so this matches current state but is a gap for production passbook integrity.

**3. SQL injection surface in `getLastStampHash`.** The `subjectHandle` parameter is string-interpolated into a SQL query sent to DoltHub's read-only API. Correctly escaped with `''`, but parameterized queries would be better. Risk is limited (read-only API, can't mutate data).

**4. `dryRun` config flag is dead code.** Declared in `ValidatorConfig` but never read. Pipeline always produces recommendations without executing. Would matter if the pipeline ever auto-pushed SQL.

**5. Duplicate wanted UPDATEs for competing completions.** If two completions reference the same wanted item, the script generates two `UPDATE wanted SET status = 'completed'` for the same ID. Idempotent but redundant.

**6. Heuristics blind to linked artifact content.** A PR that changes 500 lines of code gets scored the same as a PR that changes 1 line — the pipeline can't look inside GitHub links. This is an inherent limitation of text-based evidence analysis.

**7. `EvidenceSignals.tags` always empty.** Field exists in the interface but is never populated. Wanted item tags are extracted separately via `parseTags()`. The field is dead.

**8. No `metadata` in generated stamps SQL.** Could record `{"validator_type": "automated", "pipeline_version": "0.1"}` for provenance tracking. Not critical but would be useful for the Spider Protocol to distinguish automated from human stamps.

### Lessons Learned

**1. The MVR spec is the right source of truth.** Following the spec (1-5 valence, stamp structure, passbook chain) rather than the demo data (0-1 valence) means the pipeline is forward-compatible even if it creates a temporary inconsistency.

**2. Evidence parsing is harder than scoring.** Most of the pipeline's accuracy depends on the regex patterns in `parseEvidence()`. The scoring functions are straightforward arithmetic, but correctly extracting file paths from free-form text required iterating on the regex (em-dash `—` vs hyphen `-`, whitespace boundaries, extension patterns).

**3. Dependency injection pays for itself immediately.** The `ValidationDataProvider` interface meant zero network calls in tests, and the mock setup is 3 lines. Without DI, testing would require HTTP mocking or live API calls.

**4. The wasteland evidence format is surprisingly consistent.** MapleFoxyBells uses `docs/filename.md — N-line description. Feature list.` in all 14 completions. This regularity made the parser's job much easier than expected. A diverse contributor base would break the heuristics faster.

### File Inventory

```
src/integrations/wasteland/
  stamp-validator.ts                    # Pipeline (660 lines)
  __tests__/stamp-validator.test.ts     # Tests (525 lines, 51 tests)
  index.ts                              # Updated: +29 lines (exports)
```

### Known Gaps for Next Iteration

1. Compute `block_hash` for passbook chain integrity
2. Populate `metadata` with automated validator provenance
3. Deduplicate wanted UPDATEs for competing completions
4. Remove dead `dryRun` flag or implement it
5. Remove dead `EvidenceSignals.tags` field
6. Add GitHub API integration to inspect PR diffs for richer scoring
7. Reconcile valence scale with existing demo stamps (migrate demos to 1-5 or document the break)
8. Add CLI runner (e.g., `npx tsx src/integrations/wasteland/stamp-validator.ts --run`)

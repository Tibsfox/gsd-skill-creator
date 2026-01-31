# Codebase Concerns

**Analysis Date:** 2026-01-30

## Tech Debt

**Incomplete skill generation templates:**
- Issue: Generated skills have TODO placeholders that require manual completion
- Files: `src/detection/skill-generator.ts` (lines 95, 105)
- Impact: New skills are non-functional until users manually fill in guidelines and examples; reduces quality of auto-generated skills
- Fix approach: Implement intelligent template completion using skill name and pattern evidence to generate contextual examples and guidelines

**Type safety gap in pattern store casting:**
- Issue: Pattern store uses `as any` and `unknown as Record<string, unknown>` to force session data into incompatible type
- Files: `src/observation/session-observer.ts` (line 94)
- Impact: Bypasses type system, hiding potential type mismatches; vulnerable to runtime errors if session format changes
- Fix approach: Create proper `SessionObservation` type that extends PatternStore's expected types, or create separate session storage layer

**Hard-coded token budget parameters:**
- Issue: Token counting uses hard-coded model name and budget calculations without configuration
- Files: `src/application/token-counter.ts` (line 34), `src/application/skill-session.ts`
- Impact: Cannot adapt to different model versions; token budget may be inaccurate if base context size changes
- Fix approach: Extract model configuration to `ApplicationConfig`, allow runtime model selection

**Overly simple hash function for token cache:**
- Issue: Uses custom 32-bit hash for cache keys instead of standard hashing
- Files: `src/application/token-counter.ts` (lines 66-73)
- Impact: Potential hash collisions with different content; cache misses reduce performance
- Fix approach: Use `crypto.createHash('sha256')` for deterministic collision-free cache keys

**String replacement in skill refinement without bounds validation:**
- Issue: `newBody.replace()` replaces only first occurrence, but validation checks total change percent
- Files: `src/learning/refinement-engine.ts` (line 214)
- Impact: If pattern appears multiple times, change percent validation becomes inaccurate
- Fix approach: Use `replaceAll()` and validate change percent after actual replacement

**Feedback JSONL parsing has no size limits:**
- Issue: `readAll()` loads entire feedback file into memory and splits by newline without size checks
- Files: `src/learning/feedback-store.ts` (lines 90-112)
- Impact: Large feedback files (months of data) could cause memory exhaustion; no pagination or streaming
- Fix approach: Implement streaming JSON parser or add pagination with limit/offset parameters

**No validation of trigger pattern regexes:**
- Issue: Trigger patterns are stored as strings but only validated at match time (in try/catch)
- Files: `src/storage/skill-index.ts` (lines 214-220)
- Impact: Invalid regex patterns fail silently during matching, returning no results instead of reporting validation error
- Fix approach: Validate trigger patterns as valid regex when loading skills, fail fast on invalid patterns

## Known Bugs

**Cluster detection includes single-member components:**
- Symptoms: Clusters of size 1 may be created if filtering by size constraints fails
- Files: `src/agents/cluster-detector.ts` (lines 83-86)
- Trigger: When `minClusterSize=1` or when BFS finds isolated components
- Workaround: Set `minClusterSize >= 2` in ClusterConfig

**Missing dependency injection test coverage:**
- Symptoms: DependencyGraph handles circular references, but no test validates self-reference case
- Files: `src/composition/dependency-graph.test.ts`
- Trigger: Skill with `extends: skillName` (same as self)
- Workaround: Validation in `skill-store.ts` prevents this at creation time (lines 99-101)

**Session observer cache file creates race condition:**
- Symptoms: Multiple sessions writing `.session-cache.json` simultaneously could corrupt state
- Files: `src/observation/session-observer.ts` (lines 48-50, 61-73)
- Trigger: Rapid session start/end events or concurrent session handling
- Workaround: None currently; system assumes single session context

## Security Considerations

**No input sanitization for trigger patterns:**
- Risk: Malicious regex patterns could cause ReDoS (Regular Expression Denial of Service) attacks
- Files: `src/storage/skill-index.ts` (lines 216, 228-230)
- Current mitigation: Try/catch silently handles invalid patterns
- Recommendations: (1) Validate regex patterns for known DoS patterns, (2) Set timeout on regex matching, (3) Use safe regex library like `safe-regex`

**File path traversal vulnerability in skill directory:**
- Risk: Skill names are sanitized, but no validation prevents directory traversal in skill operations
- Files: `src/detection/skill-generator.ts` (lines 144-150), `src/storage/skill-store.ts` (lines 27-28, 47)
- Current mitigation: Name sanitization limits to alphanumeric and hyphens
- Recommendations: (1) Validate final resolved path is within skills directory, (2) Use `Path.resolve()` and check parent, (3) Add integration test for path traversal attempts

**API key exposure in token counter:**
- Risk: API key passed to TokenCounter constructor; cached in memory without cleanup
- Files: `src/application/token-counter.ts` (lines 9-12)
- Current mitigation: Depends on application to manage environment variables
- Recommendations: (1) Accept pre-configured client instead of API key, (2) Document secure initialization pattern, (3) Clear client reference on destroy

**No rate limiting on feedback recording:**
- Risk: Client can spam feedback events without limit, consuming disk space
- Files: `src/learning/feedback-store.ts` (lines 17-28)
- Current mitigation: None
- Recommendations: (1) Implement rate limiting per skill, (2) Add max feedback count per skill, (3) Implement feedback deduplication

## Performance Bottlenecks

**TF-IDF reindexing on every skill application:**
- Problem: Full TF-IDF corpus rebuilt for every skill session when using `RelevanceScorer`
- Files: `src/application/skill-applicator.ts` (lines 46-49), `src/application/relevance-scorer.ts` (lines 15-26)
- Cause: `initialize()` and `reindex()` create new TfIdf object and re-add all documents
- Improvement path: Cache TF-IDF corpus, invalidate only when skills change; implement incremental updates

**Inefficient cluster detection with O(n²) edge checking:**
- Problem: Creating cluster ID requires sorting skills and string concatenation (line 114)
- Files: `src/agents/cluster-detector.ts` (lines 113-114)
- Cause: No pre-computed hash of skill sets; rebuilds string on every cluster creation
- Improvement path: Use sorted array hash or UUID-based ID generation

**Memory usage in pattern analysis:**
- Problem: `analyzePatterns()` stores full original/corrected strings as pattern keys
- Files: `src/learning/refinement-engine.ts` (lines 244-265)
- Cause: Pattern map uses full string slices as keys; no truncation or hashing
- Improvement path: Use first N characters or hash for pattern keys; store full text separately

**No pagination in storage operations:**
- Problem: `SkillIndex.refresh()` and `FeedbackStore.readAll()` load entire dataset into memory
- Files: `src/storage/skill-index.ts` (lines 119-176), `src/learning/feedback-store.ts` (lines 90-112)
- Cause: File-based storage with no cursor/offset support
- Improvement path: Implement streaming reads or add limit/offset parameters

## Fragile Areas

**Skill store relies on SKILL.md filename:**
- Files: `src/storage/skill-store.ts`
- Why fragile: Hard-coded filename; directory structure assumptions; if SKILL.md is renamed or deleted, entire operation fails
- Safe modification: (1) Use constant for filename, (2) Check file exists before operations, (3) Add recovery for missing files
- Test coverage: No test for missing SKILL.md file in existing directory

**Dependency graph circular reference detection only works for simple chains:**
- Files: `src/composition/dependency-graph.ts` (lines 51-112)
- Why fragile: Linear chain following assumes single parent per skill; doesn't model multiple inheritance or complex graphs
- Safe modification: (1) Validate structure before building graphs, (2) Test with complex multi-parent scenarios
- Test coverage: Tests cover basic cycles but not diamond inheritance patterns

**Session observer assumes SessionEnd always has cache:**
- Files: `src/observation/session-observer.ts` (lines 60-73)
- Why fragile: Falling back to default startData if cache missing; assumes 1-minute duration is reasonable
- Safe modification: (1) Store session metadata in database instead of cache file, (2) Pass startData through call chain, (3) Add logging when using defaults
- Test coverage: No test for missing cache scenario

**Skill refinement validation compares original/suggested as strings:**
- Files: `src/learning/refinement-engine.ts` (lines 141-176)
- Why fragile: Whitespace differences, unicode normalization, or encoding changes could cause validation to fail
- Safe modification: (1) Normalize before comparison, (2) Test with various unicode/whitespace scenarios
- Test coverage: Limited test coverage for edge cases

**Conflict resolver assumes trigger fields are always defined:**
- Files: `src/application/conflict-resolver.ts` (lines 14-30)
- Why fragile: Uses `??` operator but still calls methods on potentially undefined triggers
- Safe modification: Check if `triggers` exists before accessing fields consistently; add optional chaining
- Test coverage: No test for skills without triggers

## Scaling Limits

**Single feedback file becomes unwieldy:**
- Current capacity: Feedback JSONL loaded entirely into memory
- Limit: ~10k feedback events before noticeable slowdown (testing shows 1MB+ files slow)
- Scaling path: (1) Partition by skill or time, (2) Implement database backend, (3) Add archival of old events

**TF-IDF indexing scales poorly:**
- Current capacity: 100-200 skills before noticeable scoring delay
- Limit: O(n) documents added to corpus; O(m) terms per document; scoring is O(m*n)
- Scaling path: (1) Use approximate nearest neighbors (ANN), (2) Implement skill grouping/categories, (3) Cache similarity matrices

**Skill index refresh full-scans directory:**
- Current capacity: 1000 skills before refresh is noticeably slow
- Limit: `readdir` + `stat` on every file for modification check
- Scaling path: (1) Use file watcher instead of polling, (2) Implement batch operations, (3) Cache mtime more aggressively

## Dependencies at Risk

**gpt-tokenizer (v3.4.0):**
- Risk: Tokenizer may diverge from official Claude tokenizer; no major version updates in 2+ years
- Impact: Token counts could be inaccurate for new Claude models
- Migration plan: Switch to `js-tiktoken` (OpenAI maintained) or use Anthropic's token counting API exclusively

**natural (v8.1.0):**
- Risk: TF-IDF implementation is simplistic; no active maintenance for advanced NLP features
- Impact: Relevance scoring may be suboptimal for complex skill matching
- Migration plan: Replace with semantic similarity (embedding-based) scoring using Anthropic embeddings API

**gray-matter (v4.0.3):**
- Risk: YAML parsing could have security implications; no validation of frontmatter structure
- Impact: Malformed YAML in skill metadata could cause parsing errors
- Migration plan: (1) Add strict schema validation after gray-matter parse, (2) Consider switch to TOML for simpler syntax

## Missing Critical Features

**No skill composition/inheritance support:**
- Problem: `extends` field is parsed but never used to merge parent skill content
- Blocks: Cannot create skill variants or shared base skills
- Workaround: Duplicate skill content manually

**No skill versioning/history:**
- Problem: Only current version stored; no way to rollback or see change history
- Blocks: Cannot audit skill modifications or restore previous versions
- Workaround: Commit skills to git for history

**No skill tagging/categorization:**
- Problem: Skills have flat structure; no way to group by domain or purpose
- Blocks: Scaling to 100+ skills becomes unwieldy; no way to organize by team/project
- Workaround: Use naming conventions (e.g., `prefix-skillname`)

**No skill usage analytics:**
- Problem: No tracking of which skills are used, when, or how often
- Blocks: Cannot identify unused skills or optimize which skills to load
- Workaround: Parse transcript manually or use feedback scores as proxy

## Test Coverage Gaps

**Skill store edge cases not tested:**
- What's not tested: (1) Corrupt SKILL.md files, (2) Missing metadata fields, (3) Oversized skill bodies
- Files: `src/storage/skill-store.ts`
- Risk: File I/O errors could cause unhandled rejections
- Priority: Medium - edge cases are rare but impact is high

**Trigger pattern regex validation untested:**
- What's not tested: Invalid regex patterns, ReDoS attack patterns, unicode edge cases
- Files: `src/storage/skill-index.ts` (lines 214-220)
- Risk: Invalid patterns fail silently; DoS-prone patterns execute on every match
- Priority: High - security and reliability impact

**Feedback store concurrent writes untested:**
- What's not tested: Parallel `record()` calls, interleaving of different event types
- Files: `src/learning/feedback-store.ts` (lines 117-127)
- Risk: Write queue serialization may have race conditions under stress
- Priority: Medium - concurrent usage expected in production

**Refinement engine change bounds untested:**
- What's not tested: Multi-line changes, unicode normalization, whitespace-only changes
- Files: `src/learning/refinement-engine.ts` (lines 141-177)
- Risk: Validation passes for changes that exceed limits
- Priority: High - safety-critical feature

**Agent cluster detection with real co-activation data untested:**
- What's not tested: Large clusters, multiple disconnected components, edge weight distributions
- Files: `src/agents/cluster-detector.ts`
- Risk: Clustering algorithm behavior not validated against realistic data
- Priority: Medium - feature is new and untested at scale

---

*Concerns audit: 2026-01-30*

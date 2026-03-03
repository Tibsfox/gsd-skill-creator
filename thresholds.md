# Threshold Registry

Hardcoded numeric constants introduced or modified in Phase 50+, with rationale and source location.
Updated each phase per IMP-03.

## Phase 50: Model Abstraction

| Constant | Value | Rationale | File:Line |
|----------|-------|-----------|-----------|
| DEFAULT_TIMEOUT_MS | 30000 | 30s timeout balances slow local models against hanging connections. Ollama cold-starts can take 10-15s. | src/chips/types.ts:18 |
| DEFAULT_MAX_TOKENS | 4096 | Conservative default suitable for eval responses. Most skill evals produce <1K tokens. | src/chips/types.ts:21 |
| DEFAULT_TEMPERATURE | 0.0 | Deterministic execution for reproducible eval results. | src/chips/types.ts:24 |
| CHIPSET_FILE_VERSION | 1 | Schema versioning for chipset.json forward compatibility. Literal 1 -- breaking schema changes increment this. | src/chips/chip-factory.ts:20 |
| HEALTH_CHECK_PARALLEL_LIMIT | 10 | Prevent overwhelming local hardware with concurrent health probes. Ollama and similar run on same machine as the tool. | src/chips/chip-factory.ts:26 |
| GRADER_MAX_TOKENS | 512 | Grader responses are structured JSON, never need more than a few hundred tokens. Keeping this low reduces latency for the grading step. | src/chips/chip-test-runner.ts:35 |
| GRADER_TEMPERATURE | 0.0 | Deterministic grading for reproducible evaluation. Grader output must be stable across identical inputs. | src/chips/chip-test-runner.ts:38 |

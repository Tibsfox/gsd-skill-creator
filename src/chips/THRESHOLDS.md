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

## Phase 51: Multi-Model Evaluation

| Constant | Value | Rationale | File:Line |
|----------|-------|-----------|-----------|
| DEFAULT_PASS_RATE_THRESHOLD | 0.75 | Default pass rate for chips without a per-chip override. 75% is a conservative quality bar: below it indicates significant correctness issues; above it with no override provides a safe baseline for new chip configurations. | src/eval/types.ts:34 |
| THRESHOLD_EQUALITY_TOLERANCE | 0.001 | Floating-point tolerance for 'at' threshold comparisons. Pass rates are computed as ratios (e.g., 7/10 = 0.6999... in IEEE 754). A tolerance of 0.001 absorbs rounding without masking meaningful differences. | src/eval/thresholds-config.ts:32 |
| BENCHMARK_PASS_ACCURACY_THRESHOLD | 50 | Accuracy percentage above which a benchmark run is considered "passed" in the multi-model context. Distinct from the skill activation threshold (similarity scores). Below 50%, the model fails more than half the test cases. | src/eval/multi-model-benchmark.ts:32 |
| LOCAL_SMALL_CONTEXT_THRESHOLD | 8192 | Context length below which a model is classified as 'local-small' tier. Below 8K tokens, the model has very limited context and may struggle with longer skill evaluation prompts. | src/eval/model-aware-grader.ts:34 |
| CLOUD_CONTEXT_THRESHOLD | 100000 | Context length at or above which a model is classified as 'cloud' tier. At 100K+ tokens, the model has full context capacity typical of cloud-hosted models like Claude. | src/eval/model-aware-grader.ts:38 |
| VIEWER_PASS_RATE_GREEN_THRESHOLD | 0.75 | Pass rate at or above this value is displayed green in the eval viewer. Matches DEFAULT_PASS_RATE_THRESHOLD: green = passing the quality bar. | src/eval/eval-viewer.ts:27 |
| VIEWER_PASS_RATE_YELLOW_THRESHOLD | 0.50 | Pass rate at or above this value (but below green) is displayed yellow. Below 50% the model fails more than it passes, displayed red. Provides a three-band visual signal for model quality. | src/eval/eval-viewer.ts:36 |

## Phase 52: MCP Infrastructure

| Constant | Value | Rationale | File:Line |
|----------|-------|-----------|-----------|
| DEFAULT_HEARTBEAT_INTERVAL_MS | 30000 | 30s heartbeat frequency for mesh nodes. Balances freshness against network overhead. | src/mesh/types.ts:17 |
| MAX_MISSED_HEARTBEATS | 3 | Three missed heartbeats (90s) before eviction. Tolerates brief network blips while detecting dead nodes quickly. | src/mesh/types.ts:20 |
| DEFAULT_CHECK_INTERVAL_MS | 10000 | 10s eviction check interval. Frequent enough to catch stale nodes within one heartbeat period. | src/mesh/types.ts:23 |
| MESH_EVENT_LOG_VERSION | 1 | Schema version for mesh event log format. Increment on breaking changes for forward compatibility. | src/mesh/types.ts:26 |
| LOCAL_LATENCY_THRESHOLD_MS | 5 | Latency below 5ms classified as 'local' transport condition. Local IPC/loopback is typically sub-millisecond. | src/mesh/fidelity-adapter.ts |
| MESH_LATENCY_THRESHOLD_MS | 100 | Latency 5-100ms classified as 'mesh' (LAN). Above 100ms classified as 'remote' (WAN). | src/mesh/fidelity-adapter.ts |

## Phase 53: Mesh Orchestration

| Constant | Value | Rationale | File:Line |
|----------|-------|-----------|-----------|
| CAPABILITY_WEIGHT | 0.4 | Weight for capability match in total routing score. Capability is critical: a node that can't run the chip scores 0 on this dimension. | src/mesh/scoring.ts:24 |
| LOAD_WEIGHT | 0.2 | Weight for load factor in total routing score. Load is a tie-breaker: all else equal, prefer less loaded nodes. | src/mesh/scoring.ts:30 |
| PERFORMANCE_WEIGHT | 0.4 | Weight for historical pass rate in total routing score. Performance matters as much as capability: reliable nodes preferred. | src/mesh/scoring.ts:37 |
| LOCAL_PASS_RATE_THRESHOLD | 0.70 | Local pass rate threshold for cost-aware routing. At 70%+, local execution preferred to save cost. Below this, cloud preferred due to insufficient local quality. | src/mesh/routing-policy.ts:28 |
| MARGINAL_PASS_RATE_THRESHOLD | 0.50 | Pass rate below which a model is classified as 'failing'. Below 50%, the model fails more than it passes. | src/mesh/multi-model-optimizer.ts:24 |

## Phase 54: Context & Integration

| Constant | Value | Rationale | File:Line |
|----------|-------|-----------|-----------|
| MAX_DIGEST_LENGTH | 2000 | Maximum transcript digest length to prevent bloated state entries. 2000 chars captures key decisions without overwhelming downstream consumers. | src/mesh/transcript-summarizer.ts:13 |

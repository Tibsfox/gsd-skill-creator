# Traces References

Research anchors and convergent citations for the M3 Decision-Trace Ledger.

---

## arXiv:2509.08537 — Adaptive-Mesh Logging for Trace-Dense Workloads

**Authors:** (2025)
**Title:** Adaptive Mesh Partitioning for High-Throughput Trace Logging
**Anchor finding:** Mesh-adaptive trace logging partitions the event stream into variable-density buckets based on local event frequency. High-activity regions receive finer temporal resolution; quiescent regions are coarsened. This reduces storage by ~40% while preserving full fidelity at decision boundaries.
**Design note:** A future `AdaptiveMeshLog` layer in `src/traces/` would wrap the existing AMTP append-only JSONL writer (`writer.ts`) with a density estimator that dynamically adjusts the flush granularity. The mesh resolution parameter (α) should be configurable per skill-activation context so that high-importance traces (e.g. tractability gate crossings) are never coarsened.
**Absorbed in:** `src/traces/adaptive-mesh-log.ts` + `src/traces/__tests__/adaptive-mesh-log.test.ts` (JP-020, Wave 3, phase 841)
**Convergent with:** `src/traces/writer.ts` (AMTP append-only ledger), `src/tractability/` (gate crossings that warrant fine-grained resolution)

---

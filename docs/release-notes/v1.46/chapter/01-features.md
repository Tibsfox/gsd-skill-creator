# Features — v1.46

## Shared Types


TypeScript types and Zod schemas for upstream intelligence pipeline (change events, impact assessments, channel state)

## Channel Monitors


Watchers for Anthropic API changelog, Claude Code releases, SDK updates, and community discussions

## Persistence Layer


Append-only JSONL logger, cache manager with TTL, rollback support for pipeline state recovery

## Channel State Persistence


Session recovery with state snapshots, enabling resume after interruption

## 5 Monitoring Agents


SENTINEL (API watch), ANALYST (impact assessment), TRACER (change provenance), PATCHER (adaptation generation), HERALD (notification dispatch)

## 3 Team Topologies


upstream-watch (monitoring), impact-response (assessment + patching), full-cycle (end-to-end)

## Test Corpus


50 historical Anthropic change events for pipeline validation

## Safety-Critical Tests


14 safety-critical + 8 edge case tests for pipeline integrity

## Pipeline Orchestrator


End-to-end wiring connecting all upstream modules

## Documentation


Upstream intelligence pack documentation and master barrel exports

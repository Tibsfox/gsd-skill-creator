/**
 * Agent Event-Sourced Memory concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.23752 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/event-sourced-memory
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const eventSourcedMemory: RosettaConcept = {
  id: 'agent-event-sourced-memory',
  name: 'Agent Event-Sourced Memory',
  domain: 'agent-systems',
  description: 'Agent Event-Sourced Memory treats the visible conversation itself as an append-only event store from which shared cross-agent state is deterministically derived. As introduced in ESAA-Conversational (arXiv:2606.23752, 2026), a domain specialization of the Event-Sourcing Agent Architecture, hooks and watchers capture each visible turn from heterogeneous coding agents (Codex, Grok, Claude Code, and others), normalize them into an immutable activity.jsonl, and then project deterministic read models — handoff.md, state.md, decisions.md, tasks.json — that any subsequent agent can consult on takeover. The central design commitment is that mechanical capture requires no LLM inference: turns are recorded and projected by pure functions, so replaying the log always reconstructs the same read models, and agents spend judgment only on explicit curation (recording durable decisions via a decide command, conversational tasks via task). This dissolves the vendor-specific private-log problem behind conversational state drift, where goals, rationales, and open tasks established with one tool become invisible to the next. The public v1.1.0 release ships a PowerShell CLI (init, enable-hooks, sync, project, verify, context, decide, task) with workspace_root isolation and a write-path lockfile; a self-referential case study over 570 development-lab events shows heterogeneous agents collaborating through the shared log with no direct agent-to-agent channel, while the distributed package preserves privacy by excluding the private history. Distinct from Memory Consolidation, which relies on LLM inference to compress and distill traces, event-sourced memory keeps capture and projection fully deterministic and reserves the model only for curation. For agent systems this argues that cross-agent continuity is better built as an event-sourced substrate with derived read models than as a bespoke agent-to-agent messaging protocol: durability, replayability, and privacy fall out of the append-only log discipline rather than from coordination logic.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-transactive-memory',
      description: 'Both give a team of agents shared knowledge of who-knows-what, but event-sourced memory realizes it through a single append-only log with deterministic read models rather than a distributed directory of per-agent expertise.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-context-divergence',
      description: 'Directly targets the failure this concept names: when one agent\'s goals, decisions, and open tasks are stranded in a private vendor log, the next agent diverges — the shared event store plus handoff projection is the remediation.',
    },
    {
      type: 'analogy',
      targetId: 'agent-content-addressed-storage',
      description: 'Shares the immutable append-only substrate stance: both make the store a durable, replayable ground truth from which higher-level views are derived, differing in that event-sourced memory indexes by time-ordered events rather than by content hash.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-persistent-decision-history',
      description: 'The decisions.md read model is a concrete instance of persistent decision history, but here it is a deterministic projection over the event log rather than a separately curated record, so it cannot drift from the underlying turns.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

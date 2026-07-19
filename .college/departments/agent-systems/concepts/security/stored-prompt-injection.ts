/**
 * Agent Stored Prompt Injection concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.04425 (2026).
 *
 * @module departments/agent-systems/concepts/security/stored-prompt-injection
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 22 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const storedPromptInjection: RosettaConcept = {
  id: 'agent-stored-prompt-injection',
  name: 'Agent Stored Prompt Injection',
  domain: 'agent-systems',
  description: 'Agent Stored Prompt Injection is the cross-session analogue of stored cross-site scripting: adversarial content planted during one attacker interaction is written into a long-lived agentic substrate — persistent memory, the filesystem, tool state, or other durable contextual artifacts — and then silently re-read and re-executed in future sessions, long after the original attacker has disconnected. The core insight of arXiv:2606.04425 (2026) is that modern agents are no longer session-bounded assistants but stateful systems that persist and evolve a shared world state, so a single successful injection stops being an ephemeral, model-level event and becomes a durable, system-level vulnerability embedded in execution state. The paper formalizes stored prompt injection, builds a taxonomy of how adversarial content persists and propagates across sessions, and ships a benchmark plus sandbox toolkit that quantifies attack success across different models, attack goals, and persistence channels (memory vs filesystem vs tool state). Distinct from Retriever Weight-Editing Attack (agent-retriever-weight-editing-attack), which persists by mutating parametric retriever weights, stored prompt injection persists as plaintext adversarial payloads in readable state that get re-ingested verbatim — the compromise lives in data the agent re-reads, not in learned parameters. The implication for building agent systems is that any write into durable agent state is an attack-surface expansion: teams must treat memory-write, file-write, and tool-state-update as trust boundaries, sanitize or provenance-tag content at ingestion, and re-validate persisted context on load rather than assuming that surviving a single session made it safe.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-mid-session-tool-injection',
      description: 'Mid-session tool injection is the ephemeral, single-session sibling; stored prompt injection generalizes the same tool/data-channel vector across session boundaries by persisting the payload in durable state.',
    },
    {
      type: 'dependency',
      targetId: 'agent-isolated-planning-poison-defense',
      description: 'Defenses that isolate planning from poisoned inputs must extend to the cross-session case; stored prompt injection is precisely the persistence threat such isolation has to hold against on every load, not just at first ingestion.',
    },
    {
      type: 'analogy',
      targetId: 'agent-retriever-weight-editing-attack',
      description: 'Both are persistence-based attacks, but this one persists as plaintext payloads in re-read memory/filesystem/tool state whereas weight-editing persists in parametric retriever weights — two contrasting persistence channels for the same long-lived-compromise goal.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-self-mutating-poisoning',
      description: 'Self-mutating poisoning and stored prompt injection both exploit durable agent state to outlive the attacker interaction; stored injection frames this via the stored-XSS taxonomy of persistence channels.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

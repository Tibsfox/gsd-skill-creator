/**
 * Mid-Session Tool Injection concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.06387 (2026).
 *
 * @module departments/agent-systems/concepts/security/mid-session-tool-injection
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 25 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const midSessionToolInjection: RosettaConcept = {
  id: 'agent-mid-session-tool-injection',
  name: 'Mid-Session Tool Injection',
  domain: 'agent-systems',
  description: 'Mid-Session Tool Injection (MSTI) is a class of runtime attack on WebMCP, an emerging protocol that lets websites expose callable tools directly to an LLM agent, bypassing the human UI. Because WebMCP registers its tool set dynamically and permits mutation while a session is live, a third-party script embedded in the page can add, remove, or rewrite the tools the agent sees mid-session, turning the tool surface itself into the attack vector. arXiv:2606.06387 (2026) characterizes MSTI by stage and target into two families. Tool Hijacking mutates the visible tool set through timing mechanisms — the AbortSignal API or race conditions during tool registration — so the agent invokes an attacker\'s tool in place of the intended one. Tool Framing leaves the tool set intact but poisons the structured metadata the agent reasons over — name, description, readOnlyHint, and inputSchema — so a write tool appears read-only or a malicious tool appears benign. The authors implement both and show each reliably disrupts intended WebMCP functionality, then propose defenses: binding tool identity to its origin, enforcing lifecycle consistency across registration and invocation, imposing data boundaries on third-party tools, and keeping traceable registration/invocation logs. Distinct from Stored Prompt Injection, which hides adversarial instructions inside content the agent later reads, MSTI never touches the natural-language payload — it manipulates the typed tool-surface metadata and registration lifecycle, so text-level input sanitization cannot catch it. The implication for agent systems: any framework that lets tools be registered or re-described at runtime (MCP servers, plugin loaders, dynamic skill exposure) must treat the tool manifest as an integrity-critical, origin-attributed channel — pin each tool\'s identity and metadata to its source, freeze or diff the manifest across a turn, and log every registration change — rather than trusting whatever descriptors are visible at call time.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Origin-bound manifest integrity check: capture a snapshot of the tool manifest at turn start — for each tool record {name, origin, readOnlyHint, hash(inputSchema), hash(description)} keyed by a stable tool id bound to its registering origin. Before every invocation, re-derive the record for the tool about to be called and compare against the frozen snapshot; if the origin changed, the metadata hash drifted, or the id is newly present (race-registered), reject the call and log a registration-integrity violation. This turns Tool Hijacking (id/origin swap) and Tool Framing (silent metadata rewrite) into detectable, auditable events instead of trusted state.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-stored-prompt-injection',
      description: 'Both are injection attacks on an agent, but stored prompt injection smuggles adversarial instructions into content the agent later reads, whereas MSTI mutates the typed tool surface and its registration lifecycle — a channel that text sanitization does not cover.',
    },
    {
      type: 'dependency',
      targetId: 'agent-least-privilege-tool-selection',
      description: 'Least-privilege tool selection bounds the blast radius of a hijacked or reframed tool: if the agent only ever loads the minimal tool set required for its task, an injected or metadata-poisoned tool has fewer capabilities to abuse.',
    },
    {
      type: 'analogy',
      targetId: 'agent-semantic-tool-transactions',
      description: 'MSTI\'s proposed defense of lifecycle consistency across registration and invocation mirrors transactional integrity over tool calls — treating a registration-then-invocation sequence as an atomic, tamper-checked unit rather than independently trusted events.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

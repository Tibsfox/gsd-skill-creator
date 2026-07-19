/**
 * Agent Proactive Power Regulation concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.01991 (2026).
 *
 * @module departments/agent-systems/concepts/security/proactive-power-regulation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 15 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const proactivePowerRegulation: RosettaConcept = {
  id: 'agent-proactive-power-regulation',
  name: 'Agent Proactive Power Regulation',
  domain: 'agent-systems',
  description: 'Proactive power regulation is a server-side defense that decides which tools an LLM agent is even allowed to acquire by forecasting the downstream safety consequences of granting that power, rather than judging each call only at the moment it fires. SafeMCP, from arXiv:2606.01991 (2026), implements this as a Model Context Protocol plugin that runs an internal world model to do look-ahead reasoning over the agent\'s likely future trajectory, then applies a two-tier defense: proactive tool filtering that refuses hazardous expansions of the action space before they are added, plus immediate intervention as a fail-safe when a live call still turns risky. The regulator is trained by a three-stage pipeline (environmental dynamic grounding, safe policy initialization, and reinforcement learning with dual verifiable rewards), and on PowerSeeking Bench, ToolEmu, and AgentHarm it reaches what the authors call a safe equilibrium — cutting catastrophic power-seeking while preserving task utility, since indiscriminately shrinking the action space would cripple the agent. The core insight is that a broad action space is a fragile risk surface where a single hallucination is magnified into catastrophic failure, so the defense reasons about environment-grounded futures instead of surface intent. Distinct from Least-Privilege Tool Selection, which hands the agent a minimal static toolset scoped to the declared task, proactive power regulation is dynamic and predictive: it simulates where acquiring a capability would lead and gates on forecasted harm rather than on a fixed allow-list. For anyone building agent systems, this argues that the MCP server itself — not the model — should own a risk-forecasting admission controller, so power expansion is mediated by predicted future state before the tool is ever exposed to the reasoning loop.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Sketch the SafeMCP admission controller as a server-side hook that wraps tool exposure: before a tool is added to the agent\'s action space, a world-model rollout estimates a forward risk score over predicted future states; if it exceeds a threshold the tool is filtered out (tier 1), and a lightweight runtime guard re-checks each live invocation as a fail-safe (tier 2). The gate returns allow/deny plus the forecast so denials are auditable, and thresholds are tuned toward the safe-equilibrium point where utility is preserved.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-least-privilege-tool-selection',
      description: 'Both shrink the exposed tool surface, but least-privilege scopes a static minimal toolset to the task while proactive power regulation gates acquisition dynamically on forecasted future risk.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-capability-gate-authorization',
      description: 'Capability gating authorizes a tool against a policy at call time; proactive power regulation moves the gate earlier and makes it predictive, refusing power expansion based on a world-model look-ahead rather than a present-tense authorization check.',
    },
    {
      type: 'analogy',
      targetId: 'agent-joint-intent-harm-defense',
      description: 'Like joint intent-and-harm defense, this reasons about consequences rather than surface phrasing, but it does so proactively via environment-grounded trajectory simulation instead of scoring an individual request.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

/**
 * Context Proprioception -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/context-proprioception
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 52 * 2 * Math.PI / 85;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextProprioception: RosettaConcept = {
  id: "agent-context-proprioception",
  name: "Context Proprioception",
  domain: 'agent-systems',
  description:
    "Long-horizon tool agents accumulate context blocks — tool outputs, retrieved docs, prior turns — until the window bloats and signal is buried. The usual fix trains a compression or summarization policy. arXiv 2606.30005v2 introduces context proprioception via VISTA (Visible Internal State for Tool Agents): a training-free, model-agnostic layer that represents working memory as typed, addressable blocks and surfaces a runtime dashboard of per-block metadata (byte size, age since last access, usage frequency), letting the model make competent keep-or-drop decisions itself — and, crucially, archives evicted blocks as recoverable full-fidelity payloads, so it is not observe-only but can restore anything it dropped. The claim: competent context management is a latent capability already in the model, unlocked by making block state observable rather than by a learned policy. The evidence is concrete: on LOCA-Bench the same untrained interface lifts Gemini-3-Flash from 22.7% to 50.7%, improves four backbones, transfers across million-, 100K-, and 10K-scale trajectories, and the lift GROWS with context pressure — with ablations confirming the dashboard matters beyond the archive/recovery tools alone. It reframes context budgeting as interface design, retrofittable to any agent with no fine-tuning.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Specializes consolidation's goal of controlling context size but inverts the mechanism: instead of a learned pass that merges or summarizes blocks, it leaves raw blocks intact and surfaces their metadata so the model itself decides what to drop — making consolidation an emergent, interface-driven behavior rather than a trained compression policy.",
    },
    {
      type: "cross-reference",
      targetId: "agent-decision-aware-context-selection",
      description: "Both decide which context blocks to retain, but decision-aware selection scores blocks by externally-computed downstream task utility, whereas context proprioception hands per-block size/age/usage signals to the model and lets it make the keep-or-drop call unaided.",
    },
    {
      type: "cross-reference",
      targetId: "agent-submodular-context-selection",
      description: "An algorithmic alternative to the same keep-or-drop problem: submodular selection optimizes a coverage objective over blocks externally, while proprioception treats block pruning as a latent model capability unlocked merely by exposing block metadata through an interface.",
    },
    {
      type: "analogy",
      targetId: "agent-evolvable-context-units",
      description: "Both treat context as discrete, individually-addressable units rather than a monolithic window; evolvable units mutate block content over time, whereas proprioception adds an observability layer over those blocks so the agent can curate which ones survive.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

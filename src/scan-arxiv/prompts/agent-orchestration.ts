// === agent-orchestration domain prompts ===
//
// Anchor text used for Stage 1 embedding pre-rank, and rubric used for Stage 2
// LLM fine-rank.
//
// Boundaries:
//   IN  — multi-agent coordination, MCP/A2A, agent frameworks (LangGraph,
//         CrewAI, AutoGen), dispatch, role assignment, swarm architectures,
//         hierarchical or peer-to-peer agent topologies.
//   OUT — single-agent RLHF, single-model fine-tuning, single-LLM prompt
//         engineering with no inter-agent dimension.

export const AGENT_ORCHESTRATION_ANCHOR = `
Multi-agent systems and orchestration: coordination of multiple LLM agents,
inter-agent communication protocols (MCP, A2A, message passing),
agent frameworks (LangGraph, CrewAI, AutoGen), role assignment,
swarm architectures, dispatch and routing patterns, hierarchical
or peer-to-peer agent topologies. Excludes single-agent training.
`.trim();

export const AGENT_ORCHESTRATION_SCORING_RUBRIC = `
Score 0.9-1.0: Core multi-agent contribution.
Score 0.7-0.8: Substantial agent-coordination component.
Score 0.4-0.6: Tangential or applied use of multi-agent ideas.
Score 0.1-0.3: Single-agent system that incidentally mentions multi-agent context.
Score 0.0: No agent-coordination relevance.
`.trim();

export const AGENT_ORCHESTRATION_DOMAIN_BLOCK = `
Domain: agent-orchestration
Definition: ${AGENT_ORCHESTRATION_ANCHOR}
Rubric:
${AGENT_ORCHESTRATION_SCORING_RUBRIC}
`.trim();

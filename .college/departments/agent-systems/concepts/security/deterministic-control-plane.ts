/**
 * Agent Deterministic Control Plane concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.26924 (2026).
 *
 * @module departments/agent-systems/concepts/security/deterministic-control-plane
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 7 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const deterministicControlPlane: RosettaConcept = {
  id: 'agent-deterministic-control-plane',
  name: 'Agent Deterministic Control Plane',
  domain: 'agent-systems',
  description: 'Agent Deterministic Control Plane is a non-LLM governance layer that sits above an LLM coding harness and manages the configuration files that steer it — rules files, agent definitions, IDE-specific markdown — as a first-class, content-addressed supply chain. Introduced as Rel(AI)Build in arXiv:2606.26924 (2026), it assigns every agent definition a SHA-256 content address, records it in an HMAC-stamped lockfile, and appends each change to a hash-chained audit log so tampering is detectable and provenance is verifiable. Before any LLM invocation it enforces tiered permissions and attack-derived blocklists, gates feature work through a phase state machine with requirement-to-file-to-test traceability, compiles a single canonical definition to seven IDE targets, and flags prompt drift by Jaccard similarity against the locked baseline. The design is motivated by a prevalence study of 10,008 public GitHub repositories (n=6,145 agent config files) showing that agent configs propagate as undeclared shared components: 10.1% of tracked paths are exact SHA-256 duplicates across independent repos, 75.5% of clone pairs cross organizational boundaries, 58% of configs are single-commit, and fewer than 1% declare permission boundaries versus 33% of Actions workflows. Conformance tests on injected violations confirm each mechanism enforces its stated invariant. Distinct from agent-capability-gate-authorization, which decides a single tool-use authorization at runtime, this concept governs the entire lifecycle of the steering artifacts themselves — identity, provenance, drift, and compilation — deterministically and tool-agnostically, explicitly refusing to delegate governance to further LLM orchestration. For anyone building a self-modifying skill or agent system, the implication is sharp: the layer that configures the agent is itself an unmanaged attack surface, and it should be pinned, hash-chained, and drift-checked by deterministic tooling rather than trusted because it looks right or reviewed by another model.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Implement the pre-invocation gate as a deterministic function that runs before the harness spawns the model: for each agent config file, compute its SHA-256 digest and compare it against an HMAC-stamped lockfile entry (rejecting if the digest is absent or the HMAC fails), verify the tail hash of the append-only audit log chains back to the previous entry, and compute Jaccard similarity between the current prompt\'s token set and the locked baseline — quarantining rather than loading any file whose drift exceeds a fixed threshold. This maps cleanly onto gsd-skill-creator\'s security-hygiene / skill-injection-guardian sanitize path: the check is pure, non-LLM, and fail-closed, so config governance never depends on a second model\'s judgment.',
    }],
  ]),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-content-addressed-storage',
      description: 'The control plane\'s supply-chain treatment of agent definitions is built directly on content-addressed storage: every rules file and agent config is pinned by its SHA-256 digest, which is what makes lockfile verification and cross-repo duplicate detection possible.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-capability-gate-authorization',
      description: 'Both enforce permission boundaries before an action proceeds, but the capability gate decides a single runtime tool-use authorization whereas this control plane governs the permission-declaring configuration artifacts themselves ahead of any LLM invocation.',
    },
    {
      type: 'analogy',
      targetId: 'agent-skill-resource-supply-chain',
      description: 'This deterministic control plane is the defensive counterpart to the skill-resource supply-chain attack: it treats agent config files as the same kind of undeclared shared dependency that the attack exploits, and hardens them with content addressing, HMAC-stamped lockfiles, and hash-chained audit.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};

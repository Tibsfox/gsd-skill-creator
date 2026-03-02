/**
 * Cloud Systems Department Chipset Configuration.
 *
 * Defines the complete chipset for the Cloud Systems department:
 * 5 skills (one per wing) and 3 agents (cloud-ops-agent, nasa-se-agent, runbook-agent).
 * Based on src/types/openstack.ts service types and NASA SE phase structure.
 *
 * @module departments/cloud-systems/chipset/cloud-chipset
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single skill within the cloud-systems chipset */
export interface ChipsetSkill {
  id: string;
  domain: string;
  description: string;
}

/** An agent definition */
export interface AgentDefinition {
  id: string;
  name: string;
  role: string;
  skills: string[];
}

/** Token budget configuration */
export interface TokenBudget {
  summaryLimit: number;
  activeLimit: number;
  deepLimit: number;
}

/** Complete chipset configuration */
export interface ChipsetConfig {
  name: string;
  version: string;
  description: string;
  skills: ChipsetSkill[];
  agents: AgentDefinition[];
  tokenBudget: TokenBudget;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

const skills: ChipsetSkill[] = [
  {
    id: 'keystone-neutron-guide',
    domain: 'identity-networking',
    description: 'Keystone auth tokens, service catalog, Neutron networks/subnets/routers/security groups',
  },
  {
    id: 'nova-storage-guide',
    domain: 'compute-storage',
    description: 'Nova instance lifecycle, Cinder volumes, Glance images, Swift object storage',
  },
  {
    id: 'orchestration-guide',
    domain: 'orchestration',
    description: 'Heat stack templates, HOT syntax, Horizon dashboard, multi-service coordination',
  },
  {
    id: 'nasa-se-guide',
    domain: 'nasa-se-lifecycle',
    description: 'Pre-Phase A through Phase F, review gates (MCR/SRR/PDR/CDR/ORR), TAID verification methods',
  },
  {
    id: 'runbook-guide',
    domain: 'runbook-operations',
    description: 'Runbook structure, ProcedureStep execution, communication loop priorities, deployment verification',
  },
];

// ─── Agents ──────────────────────────────────────────────────────────────────

const cloudOpsAgent: AgentDefinition = {
  id: 'cloud-ops-agent',
  name: 'cloud-ops-agent',
  role: 'Primary cloud operations instructor for identity, networking, compute, and storage',
  skills: ['keystone-neutron-guide', 'nova-storage-guide'],
};

const nasaSeAgent: AgentDefinition = {
  id: 'nasa-se-agent',
  name: 'nasa-se-agent',
  role: 'Systems engineering instructor for NASA lifecycle phases, review gates, and TAID',
  skills: ['nasa-se-guide'],
};

const runbookAgent: AgentDefinition = {
  id: 'runbook-agent',
  name: 'runbook-agent',
  role: 'Orchestration and runbook instructor for Heat templates and operational procedures',
  skills: ['orchestration-guide', 'runbook-guide'],
};

// ─── Chipset Config ──────────────────────────────────────────────────────────

/**
 * The complete Cloud Systems chipset configuration.
 *
 * 5 skills, 3 agents (pipeline topology), token budget for session management.
 */
export const chipsetConfig: ChipsetConfig = {
  name: 'cloud-systems',
  version: '0.1.0',
  description:
    'Cloud Systems Department -- routes queries across OpenStack services (keystone, nova, neutron, ' +
    'cinder, glance, swift, heat, horizon) and NASA SE lifecycle.',
  skills,
  agents: [cloudOpsAgent, nasaSeAgent, runbookAgent],
  tokenBudget: {
    summaryLimit: 3000,
    activeLimit: 12000,
    deepLimit: 50000,
  },
};

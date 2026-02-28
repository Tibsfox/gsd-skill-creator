/**
 * Shared TypeScript interfaces and type definitions for the GSD OpenStack
 * Cloud Platform (NASA SE Edition).
 *
 * Every downstream skill, agent, crew, documentation phase, chipset, and
 * dashboard imports these types to ensure consistent data shapes across the
 * entire milestone.
 *
 * @module types/openstack
 */

// ============================================================================
// Service Types
// ============================================================================

/** Operational status of an OpenStack service. */
export type ServiceStatus = 'active' | 'inactive' | 'error' | 'maintenance' | 'unknown';

/** Names of the 8 core OpenStack services managed by this platform. */
export type OpenStackServiceName =
  | 'keystone' | 'nova' | 'neutron' | 'cinder'
  | 'glance' | 'swift' | 'heat' | 'horizon';

/** Endpoint interface visibility level. */
export type EndpointInterface = 'public' | 'internal' | 'admin';

// ============================================================================
// NASA SE Types
// ============================================================================

/** Verification method per NASA TAID framework (SP-6105 section 5.3). */
export type VerificationMethod = 'test' | 'analysis' | 'inspection' | 'demonstration';

/** Requirement verification status. */
export type RequirementStatus = 'pending' | 'pass' | 'fail';

/** Communication loop directionality. */
export type LoopDirection = 'bidirectional' | 'unidirectional';

/** NASA Systems Engineering life-cycle phase identifiers (Pre-Phase A through Phase F). */
export type SEPhaseId = 'pre-a' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f';

/**
 * Priority level for communication loops.
 * 0 = HALT (highest priority, emergency stop).
 * 7 = HEARTBEAT (lowest priority, background monitoring).
 */
export type LoopPriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Names of the 9 communication loops in the mission crew framework. */
export type CommunicationLoopName =
  | 'command' | 'execution' | 'specialist' | 'user'
  | 'observation' | 'health' | 'budget' | 'cloud-ops' | 'doc-sync';

/**
 * NASA life-cycle review gate abbreviations.
 * Maps to NPR 7123.1 Appendix G reviews.
 */
export type NASAReviewGate =
  | 'MCR' | 'SRR' | 'SDR' | 'PDR' | 'CDR'
  | 'SIR' | 'ORR' | 'FRR' | 'PLAR' | 'DR';

// ============================================================================
// Core Interfaces
// ============================================================================

/**
 * A service endpoint registered in the Keystone service catalog.
 * Each service can expose public, internal, and admin endpoints.
 */
export interface ServiceEndpoint {
  /** The endpoint URL. */
  url: string;
  /** Visibility level of this endpoint. */
  interface: EndpointInterface;
  /** OpenStack region this endpoint belongs to. */
  region: string;
}

/**
 * Result of a service health check.
 * Returned by the healthCheck function on each OpenStackService.
 */
export interface HealthResult {
  /** Whether the service is healthy. */
  healthy: boolean;
  /** Human-readable status message. */
  message: string;
  /** ISO 8601 timestamp of the health check. */
  timestamp: string;
  /** Optional service-specific health details. */
  details?: Record<string, unknown>;
}

/**
 * An OpenStack service instance with its status, endpoints, health check,
 * and traced requirements.
 *
 * The healthCheck function is runtime-only and not validated by Zod schemas
 * (functions cannot be serialized).
 */
export interface OpenStackService {
  /** Service name (one of the 8 core services or kolla-ansible). */
  name: OpenStackServiceName | 'kolla-ansible';
  /** Current operational status. */
  status: ServiceStatus;
  /** Registered endpoints in the service catalog. */
  endpoints: ServiceEndpoint[];
  /** Async health check returning current service health. */
  healthCheck: () => Promise<HealthResult>;
  /** Requirements traced to the V&V plan for this service. */
  requirements: Requirement[];
}

/**
 * A formal requirement statement following NASA requirements engineering
 * conventions. Each requirement is traceable from stakeholder need through
 * verification.
 *
 * ID pattern: CLOUD-{DOMAIN}-{NNN} (e.g., CLOUD-COMPUTE-001).
 */
export interface Requirement {
  /** Unique identifier (pattern: CLOUD-{DOMAIN}-{NNN}). */
  id: string;
  /** The "shall" statement defining what the system must do. */
  text: string;
  /** Stakeholder need this requirement traces to. */
  source: string;
  /** How this requirement will be verified (NASA TAID). */
  verificationMethod: VerificationMethod;
  /** Current verification status. */
  status: RequirementStatus;
  /** ISO 8601 date when verification was completed. */
  verifiedDate?: string;
  /** Agent role that performed verification. */
  verifiedBy?: string;
}

/**
 * A single step in an operational procedure or runbook.
 * Follows NASA procedure format with expected results and
 * contingency instructions.
 */
export interface ProcedureStep {
  /** Step number within the procedure (1-based). */
  stepNumber: number;
  /** The instruction to execute. */
  instruction: string;
  /** What the operator should observe after executing this step. */
  expectedResult: string;
  /** What to do if the expected result is not observed. */
  ifUnexpected?: string;
}

/**
 * An operational runbook following NASA procedure standards.
 * Each runbook is self-contained with preconditions, steps,
 * verification, and rollback procedures.
 *
 * ID pattern: RB-{SERVICE}-{NNN} (e.g., RB-NOVA-001).
 */
export interface Runbook {
  /** Unique identifier (pattern: RB-{SERVICE}-{NNN}). */
  id: string;
  /** Human-readable title describing what this runbook accomplishes. */
  title: string;
  /** Cross-reference to the relevant NPR 7123.1 section. */
  sePhaseRef: string;
  /** ISO 8601 date of last verification against the running system. */
  lastVerified: string;
  /** Whether verification was automated or manual. */
  verificationMethod: 'automated' | 'manual';
  /** System state required before starting this runbook. */
  preconditions: string[];
  /** Ordered procedure steps. */
  steps: ProcedureStep[];
  /** Steps to confirm the procedure succeeded. */
  verification: string[];
  /** Steps to undo this procedure if needed. */
  rollback: string[];
  /** IDs of related runbooks for cross-referencing. */
  relatedRunbooks: string[];
}

/**
 * A NASA Systems Engineering life-cycle phase mapped to cloud operations.
 * Each phase includes cross-references to both SP-6105 and NPR 7123.1,
 * plus the cloud operations equivalent description.
 */
export interface NASASEPhase {
  /** Phase identifier (pre-a through f). */
  phase: SEPhaseId;
  /** Official NASA phase name. */
  name: string;
  /** SP-6105 section reference. */
  spReference: string;
  /** NPR 7123.1 section reference. */
  nprReference: string;
  /** What this NASA SE phase means for cloud operations. */
  cloudOpsEquivalent: string;
  /** Key deliverables produced during this phase. */
  deliverables: string[];
  /** NASA life-cycle review gate at the end of this phase. */
  reviewGate: NASAReviewGate;
}

/**
 * A communication loop in the mission crew framework.
 * Loops define message routing paths between agent roles with
 * priority-based arbitration.
 */
export interface CommunicationLoop {
  /** Loop identifier (one of 9 defined loops). */
  name: CommunicationLoopName;
  /** Agent roles participating in this loop. */
  participants: string[];
  /** Priority level (0 = HALT highest, 7 = HEARTBEAT lowest). */
  priority: LoopPriority;
  /** Whether messages flow in both directions or one. */
  direction: LoopDirection;
  /** Types of messages carried by this loop. */
  messageTypes: string[];
  /** Human-readable description of this loop's purpose. */
  description: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * All 7 NASA Systems Engineering phases mapped to cloud operations equivalents.
 * Cross-references SP-6105 and NPR 7123.1 sections.
 *
 * Source: gsd-openstack-nasa-reference.md Section 1 and Section 2.
 */
export const NASA_SE_PHASES: readonly NASASEPhase[] = [
  {
    phase: 'pre-a',
    name: 'Pre-Phase A: Concept Studies',
    spReference: 'SP-6105 section 4.1',
    nprReference: 'NPR 7123.1 section 4.1',
    cloudOpsEquivalent: 'Cloud Architecture Assessment',
    deliverables: [
      'Concept of Operations (ConOps)',
      'Measures of Effectiveness (MOEs)',
      'Stakeholder identification',
    ],
    reviewGate: 'MCR',
  },
  {
    phase: 'a',
    name: 'Phase A: Concept & Technology Development',
    spReference: 'SP-6105 section 4.2',
    nprReference: 'NPR 7123.1 section 4.2',
    cloudOpsEquivalent: 'Technology Selection & Requirements',
    deliverables: [
      'Requirements specification',
      'Trade studies',
      'SEMP baseline',
    ],
    reviewGate: 'SRR',
  },
  {
    phase: 'b',
    name: 'Phase B: Preliminary Design',
    spReference: 'SP-6105 section 4.3-4.4',
    nprReference: 'NPR 7123.1 section 4.3',
    cloudOpsEquivalent: 'Architecture & Configuration Design',
    deliverables: [
      'Service-by-service design',
      'Interface definitions',
      'V&V plan',
    ],
    reviewGate: 'PDR',
  },
  {
    phase: 'c',
    name: 'Phase C: Final Design & Fabrication',
    spReference: 'SP-6105 section 5.1',
    nprReference: 'NPR 7123.1 section 5.1',
    cloudOpsEquivalent: 'Deployment Configuration & Build',
    deliverables: [
      'Kolla-Ansible configurations',
      'Certificates',
      'Network configurations',
    ],
    reviewGate: 'CDR',
  },
  {
    phase: 'd',
    name: 'Phase D: Integration & Test',
    spReference: 'SP-6105 section 5.2-5.3',
    nprReference: 'NPR 7123.1 section 5.2',
    cloudOpsEquivalent: 'Service Integration & Verification',
    deliverables: [
      'Integration tests',
      'V&V report',
      'Performance baseline',
    ],
    reviewGate: 'SIR',
  },
  {
    phase: 'e',
    name: 'Phase E: Operations & Sustainment',
    spReference: 'SP-6105 section 5.4-5.5',
    nprReference: 'NPR 7123.1 section 5.4',
    cloudOpsEquivalent: 'Cloud Operations & Maintenance',
    deliverables: [
      'Operations procedures',
      'Monitoring',
      'Backup',
      'Runbooks',
    ],
    reviewGate: 'ORR',
  },
  {
    phase: 'f',
    name: 'Phase F: Closeout',
    spReference: 'SP-6105 section 6.1',
    nprReference: 'NPR 7123.1 section 6.1',
    cloudOpsEquivalent: 'Decommission & Lessons Learned',
    deliverables: [
      'Migration procedures',
      'Data archive',
      'Lessons learned',
    ],
    reviewGate: 'DR',
  },
] as const;

/**
 * All 9 communication loops in the mission crew framework.
 * Priority levels follow the bus arbitration scheme:
 * 0 = HALT (emergency), 1-3 = critical operational, 4-5 = standard, 6-7 = background.
 *
 * Source: Vision document section 1.3 Communication Framework.
 */
export const COMMUNICATION_LOOPS: readonly CommunicationLoop[] = [
  {
    name: 'command',
    participants: ['FLIGHT', 'all Tier 2-3 roles'],
    priority: 1,
    direction: 'bidirectional',
    messageTypes: ['directive', 'status-report', 'halt'],
    description: 'Command loop between FLIGHT director and all Tier 2-3 roles for directives and status reporting',
  },
  {
    name: 'execution',
    participants: ['PLAN', 'EXEC', 'VERIFY'],
    priority: 2,
    direction: 'bidirectional',
    messageTypes: ['task-assignment', 'execution-report', 'verification-result'],
    description: 'Execution loop coordinating the plan-execute-verify cycle for all mission tasks',
  },
  {
    name: 'specialist',
    participants: ['TOPO', 'CRAFT agents'],
    priority: 3,
    direction: 'bidirectional',
    messageTypes: ['domain-request', 'domain-response', 'activation-trigger'],
    description: 'Specialist loop routing domain-specific requests to appropriate CRAFT agents via TOPO',
  },
  {
    name: 'user',
    participants: ['CAPCOM', 'human operator'],
    priority: 2,
    direction: 'bidirectional',
    messageTypes: ['decision-request', 'user-response', 'notification'],
    description: 'User loop providing the sole human interface through CAPCOM for decisions and notifications',
  },
  {
    name: 'observation',
    participants: ['all agents', 'SKILL (skill-creator pipeline)'],
    priority: 6,
    direction: 'unidirectional',
    messageTypes: ['pattern-observation', 'session-event'],
    description: 'Observation loop feeding pattern data from all agents into the skill-creator pipeline',
  },
  {
    name: 'health',
    participants: ['SURGEON', 'agents', 'FLIGHT'],
    priority: 2,
    direction: 'bidirectional',
    messageTypes: ['telemetry', 'health-advisory', 'status-check'],
    description: 'Health loop for SURGEON to monitor agent and cloud service health with advisories to FLIGHT',
  },
  {
    name: 'budget',
    participants: ['BUDGET', 'agents', 'FLIGHT'],
    priority: 3,
    direction: 'bidirectional',
    messageTypes: ['consumption-report', 'budget-warning', 'budget-block'],
    description: 'Budget loop tracking token consumption with warnings and blocks at threshold limits',
  },
  {
    name: 'cloud-ops',
    participants: ['OpenStack APIs', 'SURGEON', 'GUARD'],
    priority: 2,
    direction: 'bidirectional',
    messageTypes: ['api-health-check', 'event-notification', 'status-change'],
    description: 'Cloud operations loop polling OpenStack API endpoints and routing events to SURGEON and GUARD',
  },
  {
    name: 'doc-sync',
    participants: ['running system', 'VERIFY-docs', 'EXEC-docs'],
    priority: 4,
    direction: 'bidirectional',
    messageTypes: ['drift-detection', 'update-trigger', 'verification-request'],
    description: 'Documentation sync loop detecting configuration drift between running system and documentation',
  },
] as const;

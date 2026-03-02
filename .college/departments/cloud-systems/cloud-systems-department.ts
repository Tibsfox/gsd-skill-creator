/**
 * Cloud Systems Department Definition
 *
 * Defines the CollegeDepartment object for the cloud-systems department,
 * including all 5 service-layer wings and token budget configuration.
 *
 * Content draws from the OpenStack Platform (NASA SE Edition) with 8 core services
 * and the NASA Systems Engineering lifecycle defined in src/types/openstack.ts.
 *
 * @module departments/cloud-systems/cloud-systems-department
 */

import type {
  CollegeDepartment,
  DepartmentWing,
  TrySession,
  TokenBudgetConfig,
  CalibrationModel,
  RosettaConcept,
} from '../../rosetta-core/types.js';

// ─── Wing Definitions ───────────────────────────────────────────────────────

const identityNetworkingWing: DepartmentWing = {
  id: 'identity-networking',
  name: 'Identity & Networking',
  description:
    'Keystone authentication, token management, Neutron networks/subnets/routers, security groups, ' +
    'and endpoint catalog. Covers scoped tokens, service catalog (public/internal/admin), ' +
    'VLAN segmentation, and default-deny security posture.',
  concepts: ['cloud-keystone-auth', 'cloud-neutron-networking', 'cloud-security-groups-policies'],
};

const computeStorageWing: DepartmentWing = {
  id: 'compute-storage',
  name: 'Compute & Storage',
  description:
    'Nova instance lifecycle, Cinder block volumes, Glance image registry, and Swift object storage. ' +
    'Covers flavors (vCPU/RAM/disk), live migration, volume snapshots, and image formats (QCOW2/raw).',
  concepts: ['cloud-nova-instances', 'cloud-cinder-block-storage', 'cloud-swift-glance-object-image'],
};

const orchestrationWing: DepartmentWing = {
  id: 'orchestration',
  name: 'Orchestration',
  description:
    'Heat stack templates (HOT syntax), Horizon dashboard, and multi-service resource graph coordination. ' +
    'Covers parameter injection, stack outputs, quota display, and eventual consistency between services.',
  concepts: ['cloud-heat-stack-templates', 'cloud-horizon-dashboard', 'cloud-multi-service-coordination'],
};

const nasaSeLifecycleWing: DepartmentWing = {
  id: 'nasa-se-lifecycle',
  name: 'NASA SE Lifecycle',
  description:
    'Pre-Phase A through Phase F reviews (MCR, SRR, PDR, CDR, ORR), TAID verification methods, ' +
    'and requirements tracing. Covers SEPhaseId types, NASAReviewGate abbreviations, and ' +
    'RequirementStatus tracking from SP-6105 and NPR 7123.1.',
  concepts: ['cloud-se-phase-reviews', 'cloud-taid-verification', 'cloud-requirements-tracing'],
};

const runbookOperationsWing: DepartmentWing = {
  id: 'runbook-operations',
  name: 'Runbook Operations',
  description:
    'Runbook structure, ProcedureStep execution, and communication loop priority (0=HALT to 7=HEARTBEAT). ' +
    'Covers self-contained runbooks with prerequisites, steps, verification, and rollback procedures.',
  concepts: ['cloud-runbook-structure', 'cloud-procedure-execution', 'cloud-communication-loops'],
};

// ─── Token Budget ───────────────────────────────────────────────────────────

const tokenBudget: TokenBudgetConfig = {
  summaryLimit: 3000,
  activeLimit: 12000,
  deepLimit: 50000,
};

// ─── Department Definition ──────────────────────────────────────────────────

/**
 * The Cloud Systems department -- 5 service-layer wings of cloud operations.
 *
 * Wings progress from foundational identity/networking through compute and storage,
 * orchestration, the NASA SE lifecycle process, and operational runbook execution.
 */
export const cloudSystemsDepartment: CollegeDepartment = {
  id: 'cloud-systems',
  name: 'Cloud Systems',
  wings: [
    identityNetworkingWing,
    computeStorageWing,
    orchestrationWing,
    nasaSeLifecycleWing,
    runbookOperationsWing,
  ],
  concepts: [] as RosettaConcept[],
  calibrationModels: [] as CalibrationModel[],
  trySessions: [] as TrySession[],
  tokenBudget,
};

// ─── Registration ───────────────────────────────────────────────────────────

/**
 * Register the cloud-systems department.
 *
 * No-op: CollegeLoader uses filesystem discovery via DEPARTMENT.md.
 */
export function registerCloudSystemsDepartment(): void {
  // CollegeLoader auto-discovers departments from DEPARTMENT.md files.
}

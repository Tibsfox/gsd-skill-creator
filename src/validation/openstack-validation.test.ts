/**
 * Tests for OpenStack and NASA SE Zod validation schemas.
 *
 * Covers all 8 schemas with valid input, missing fields, and wrong types.
 * Also verifies pattern validation for IDs, priority ranges, and reference formats.
 */

import { describe, it, expect } from 'vitest';
import {
  ServiceEndpointSchema,
  HealthResultSchema,
  ProcedureStepSchema,
  OpenStackServiceSchema,
  RequirementSchema,
  RunbookSchema,
  NASASEPhaseSchema,
  CommunicationLoopSchema,
  validateOpenStackService,
  validateRequirement,
  validateRunbook,
  validateNASASEPhase,
  validateCommunicationLoop,
  validateProcedureStep,
  safeValidateOpenStackService,
  safeValidateRequirement,
  safeValidateRunbook,
  safeValidateNASASEPhase,
  safeValidateCommunicationLoop,
  safeValidateProcedureStep,
} from './openstack-validation.js';

// ============================================================================
// Test Data Factories
// ============================================================================

function validEndpoint() {
  return {
    url: 'http://10.0.0.1:5000/v3',
    interface: 'public' as const,
    region: 'RegionOne',
  };
}

function validHealthResult() {
  return {
    healthy: true,
    message: 'Service is healthy',
    timestamp: '2026-02-22T10:00:00Z',
  };
}

function validProcedureStep() {
  return {
    stepNumber: 1,
    instruction: 'Run openstack token issue',
    expectedResult: 'Token issued successfully',
  };
}

function validRequirement() {
  return {
    id: 'CLOUD-COMPUTE-001',
    text: 'The compute service shall support launching instances with at least 4 flavors',
    source: 'Stakeholder: developers',
    verificationMethod: 'test' as const,
    status: 'pending' as const,
  };
}

function validOpenStackService() {
  return {
    name: 'nova' as const,
    status: 'active' as const,
    endpoints: [validEndpoint()],
    requirements: [validRequirement()],
  };
}

function validRunbook() {
  return {
    id: 'RB-NOVA-001',
    title: 'Nova Service Recovery',
    sePhaseRef: 'NPR 7123.1 section 5.4',
    lastVerified: '2026-02-22',
    verificationMethod: 'automated' as const,
    preconditions: ['Nova service is running'],
    steps: [validProcedureStep()],
    verification: ['Verify nova service is healthy'],
    rollback: ['Restart nova containers'],
    relatedRunbooks: ['RB-KEYSTONE-001'],
  };
}

function validNASASEPhase() {
  return {
    phase: 'a' as const,
    name: 'Phase A: Concept & Technology Development',
    spReference: 'SP-6105 section 4.2',
    nprReference: 'NPR 7123.1 section 4.2',
    cloudOpsEquivalent: 'Technology Selection & Requirements',
    deliverables: ['Requirements specification', 'Trade studies'],
    reviewGate: 'SRR' as const,
  };
}

function validCommunicationLoop() {
  return {
    name: 'command' as const,
    participants: ['FLIGHT', 'all Tier 2-3 roles'],
    priority: 1,
    direction: 'bidirectional' as const,
    messageTypes: ['directive', 'status-report', 'halt'],
    description: 'Command loop between FLIGHT and all Tier 2-3 roles',
  };
}

// ============================================================================
// ServiceEndpointSchema
// ============================================================================

describe('ServiceEndpointSchema', () => {
  it('accepts valid endpoint data', () => {
    const result = ServiceEndpointSchema.safeParse(validEndpoint());
    expect(result.success).toBe(true);
  });

  it('rejects missing url', () => {
    const result = ServiceEndpointSchema.safeParse({
      interface: 'public',
      region: 'RegionOne',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid interface type', () => {
    const result = ServiceEndpointSchema.safeParse({
      url: 'http://10.0.0.1:5000/v3',
      interface: 'superadmin',
      region: 'RegionOne',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty region string', () => {
    const result = ServiceEndpointSchema.safeParse({
      url: 'http://10.0.0.1:5000/v3',
      interface: 'public',
      region: '',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// HealthResultSchema
// ============================================================================

describe('HealthResultSchema', () => {
  it('accepts valid health result', () => {
    const result = HealthResultSchema.safeParse(validHealthResult());
    expect(result.success).toBe(true);
  });

  it('accepts health result with details', () => {
    const result = HealthResultSchema.safeParse({
      ...validHealthResult(),
      details: { latency: 42, version: '2024.2' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing healthy field', () => {
    const result = HealthResultSchema.safeParse({
      message: 'Service is healthy',
      timestamp: '2026-02-22T10:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean healthy', () => {
    const result = HealthResultSchema.safeParse({
      healthy: 'yes',
      message: 'ok',
      timestamp: '2026-02-22T10:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid timestamp format', () => {
    const result = HealthResultSchema.safeParse({
      healthy: true,
      message: 'ok',
      timestamp: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// ProcedureStepSchema
// ============================================================================

describe('ProcedureStepSchema', () => {
  it('accepts valid procedure step', () => {
    const result = ProcedureStepSchema.safeParse(validProcedureStep());
    expect(result.success).toBe(true);
  });

  it('accepts step with ifUnexpected', () => {
    const result = ProcedureStepSchema.safeParse({
      ...validProcedureStep(),
      ifUnexpected: 'Check keystone service status',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing instruction', () => {
    const result = ProcedureStepSchema.safeParse({
      stepNumber: 1,
      expectedResult: 'Token issued',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-positive step number', () => {
    const result = ProcedureStepSchema.safeParse({
      stepNumber: 0,
      instruction: 'Do something',
      expectedResult: 'Something happens',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer step number', () => {
    const result = ProcedureStepSchema.safeParse({
      stepNumber: 1.5,
      instruction: 'Do something',
      expectedResult: 'Something happens',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// OpenStackServiceSchema
// ============================================================================

describe('OpenStackServiceSchema', () => {
  it('accepts valid service data', () => {
    const result = OpenStackServiceSchema.safeParse(validOpenStackService());
    expect(result.success).toBe(true);
  });

  it('accepts kolla-ansible as service name', () => {
    const result = OpenStackServiceSchema.safeParse({
      ...validOpenStackService(),
      name: 'kolla-ansible',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid service name', () => {
    const result = OpenStackServiceSchema.safeParse({
      ...validOpenStackService(),
      name: 'invalid-service',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing status', () => {
    const result = OpenStackServiceSchema.safeParse({
      name: 'nova',
      endpoints: [],
      requirements: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type for endpoints', () => {
    const result = OpenStackServiceSchema.safeParse({
      name: 'nova',
      status: 'active',
      endpoints: 'not-an-array',
      requirements: [],
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// RequirementSchema
// ============================================================================

describe('RequirementSchema', () => {
  it('accepts valid requirement', () => {
    const result = RequirementSchema.safeParse(validRequirement());
    expect(result.success).toBe(true);
  });

  it('accepts requirement with optional fields', () => {
    const result = RequirementSchema.safeParse({
      ...validRequirement(),
      status: 'pass',
      verifiedDate: '2026-02-22',
      verifiedBy: 'VERIFY agent',
    });
    expect(result.success).toBe(true);
  });

  it('accepts CLOUD-COMPUTE-001 pattern', () => {
    const result = RequirementSchema.safeParse(validRequirement());
    expect(result.success).toBe(true);
  });

  it('accepts CLOUD-NETWORK-042 pattern', () => {
    const result = RequirementSchema.safeParse({
      ...validRequirement(),
      id: 'CLOUD-NETWORK-042',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid ID format', () => {
    const result = RequirementSchema.safeParse({
      ...validRequirement(),
      id: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects ID with lowercase domain', () => {
    const result = RequirementSchema.safeParse({
      ...validRequirement(),
      id: 'CLOUD-compute-001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing text', () => {
    const result = RequirementSchema.safeParse({
      id: 'CLOUD-COMPUTE-001',
      source: 'Stakeholder',
      verificationMethod: 'test',
      status: 'pending',
    });
    expect(result.success).toBe(false);
  });

  it('rejects wrong type for status', () => {
    const result = RequirementSchema.safeParse({
      ...validRequirement(),
      status: 'completed',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// RunbookSchema
// ============================================================================

describe('RunbookSchema', () => {
  it('accepts valid runbook', () => {
    const result = RunbookSchema.safeParse(validRunbook());
    expect(result.success).toBe(true);
  });

  it('accepts RB-NOVA-001 pattern', () => {
    const result = RunbookSchema.safeParse(validRunbook());
    expect(result.success).toBe(true);
  });

  it('accepts RB-KEYSTONE-042 pattern', () => {
    const result = RunbookSchema.safeParse({
      ...validRunbook(),
      id: 'RB-KEYSTONE-042',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid runbook ID', () => {
    const result = RunbookSchema.safeParse({
      ...validRunbook(),
      id: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects ID with lowercase service', () => {
    const result = RunbookSchema.safeParse({
      ...validRunbook(),
      id: 'RB-nova-001',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const { title, ...noTitle } = validRunbook();
    const result = RunbookSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  it('rejects wrong type for steps', () => {
    const result = RunbookSchema.safeParse({
      ...validRunbook(),
      steps: 'not-an-array',
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// NASASEPhaseSchema
// ============================================================================

describe('NASASEPhaseSchema', () => {
  it('accepts valid NASA SE phase', () => {
    const result = NASASEPhaseSchema.safeParse(validNASASEPhase());
    expect(result.success).toBe(true);
  });

  it('accepts SP-6105 section 4.1 format', () => {
    const result = NASASEPhaseSchema.safeParse({
      ...validNASASEPhase(),
      spReference: 'SP-6105 section 4.1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid spReference prefix', () => {
    const result = NASASEPhaseSchema.safeParse({
      ...validNASASEPhase(),
      spReference: 'invalid reference',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid nprReference prefix', () => {
    const result = NASASEPhaseSchema.safeParse({
      ...validNASASEPhase(),
      nprReference: 'invalid reference',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid phase ID', () => {
    const result = NASASEPhaseSchema.safeParse({
      ...validNASASEPhase(),
      phase: 'g',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid review gate', () => {
    const result = NASASEPhaseSchema.safeParse({
      ...validNASASEPhase(),
      reviewGate: 'INVALID',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 7 SE phase IDs', () => {
    const phaseIds = ['pre-a', 'a', 'b', 'c', 'd', 'e', 'f'] as const;
    for (const phaseId of phaseIds) {
      const result = NASASEPhaseSchema.safeParse({
        ...validNASASEPhase(),
        phase: phaseId,
      });
      expect(result.success, `Phase ID '${phaseId}' should be valid`).toBe(true);
    }
  });

  it('rejects missing deliverables', () => {
    const { deliverables, ...noDeliverables } = validNASASEPhase();
    const result = NASASEPhaseSchema.safeParse(noDeliverables);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// CommunicationLoopSchema
// ============================================================================

describe('CommunicationLoopSchema', () => {
  it('accepts valid communication loop', () => {
    const result = CommunicationLoopSchema.safeParse(validCommunicationLoop());
    expect(result.success).toBe(true);
  });

  it('accepts priority 0 (HALT)', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      priority: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts priority 7 (HEARTBEAT)', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      priority: 7,
    });
    expect(result.success).toBe(true);
  });

  it('rejects priority -1 (below range)', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      priority: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects priority 8 (above range)', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      priority: 8,
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty participants array', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      participants: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty messageTypes array', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      messageTypes: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid loop name', () => {
    const result = CommunicationLoopSchema.safeParse({
      ...validCommunicationLoop(),
      name: 'invalid-loop',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 9 communication loop names', () => {
    const loopNames = [
      'command', 'execution', 'specialist', 'user',
      'observation', 'health', 'budget', 'cloud-ops', 'doc-sync',
    ] as const;
    for (const loopName of loopNames) {
      const result = CommunicationLoopSchema.safeParse({
        ...validCommunicationLoop(),
        name: loopName,
      });
      expect(result.success, `Loop name '${loopName}' should be valid`).toBe(true);
    }
  });

  it('rejects missing description', () => {
    const { description, ...noDesc } = validCommunicationLoop();
    const result = CommunicationLoopSchema.safeParse(noDesc);
    expect(result.success).toBe(false);
  });
});

// ============================================================================
// Throwing Validator Functions
// ============================================================================

describe('validateOpenStackService', () => {
  it('returns validated data for valid input', () => {
    const data = validateOpenStackService(validOpenStackService());
    expect(data.name).toBe('nova');
    expect(data.status).toBe('active');
  });

  it('throws for invalid input', () => {
    expect(() => validateOpenStackService({})).toThrow('Invalid OpenStack service');
  });
});

describe('validateRequirement', () => {
  it('returns validated data for valid input', () => {
    const data = validateRequirement(validRequirement());
    expect(data.id).toBe('CLOUD-COMPUTE-001');
  });

  it('throws for invalid input', () => {
    expect(() => validateRequirement({})).toThrow('Invalid requirement');
  });
});

describe('validateRunbook', () => {
  it('returns validated data for valid input', () => {
    const data = validateRunbook(validRunbook());
    expect(data.id).toBe('RB-NOVA-001');
  });

  it('throws for invalid input', () => {
    expect(() => validateRunbook({})).toThrow('Invalid runbook');
  });
});

describe('validateNASASEPhase', () => {
  it('returns validated data for valid input', () => {
    const data = validateNASASEPhase(validNASASEPhase());
    expect(data.phase).toBe('a');
  });

  it('throws for invalid input', () => {
    expect(() => validateNASASEPhase({})).toThrow('Invalid NASA SE phase');
  });
});

describe('validateCommunicationLoop', () => {
  it('returns validated data for valid input', () => {
    const data = validateCommunicationLoop(validCommunicationLoop());
    expect(data.name).toBe('command');
  });

  it('throws for invalid input', () => {
    expect(() => validateCommunicationLoop({})).toThrow('Invalid communication loop');
  });
});

describe('validateProcedureStep', () => {
  it('returns validated data for valid input', () => {
    const data = validateProcedureStep(validProcedureStep());
    expect(data.stepNumber).toBe(1);
  });

  it('throws for invalid input', () => {
    expect(() => validateProcedureStep({})).toThrow('Invalid procedure step');
  });
});

// ============================================================================
// Safe (Non-throwing) Validator Functions
// ============================================================================

describe('safeValidateOpenStackService', () => {
  it('returns success for valid input', () => {
    const result = safeValidateOpenStackService(validOpenStackService());
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('nova');
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateOpenStackService({});
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe('safeValidateRequirement', () => {
  it('returns success for valid input', () => {
    const result = safeValidateRequirement(validRequirement());
    expect(result.success).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateRequirement({ id: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe('safeValidateRunbook', () => {
  it('returns success for valid input', () => {
    const result = safeValidateRunbook(validRunbook());
    expect(result.success).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateRunbook({});
    expect(result.success).toBe(false);
  });
});

describe('safeValidateNASASEPhase', () => {
  it('returns success for valid input', () => {
    const result = safeValidateNASASEPhase(validNASASEPhase());
    expect(result.success).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateNASASEPhase({});
    expect(result.success).toBe(false);
  });
});

describe('safeValidateCommunicationLoop', () => {
  it('returns success for valid input', () => {
    const result = safeValidateCommunicationLoop(validCommunicationLoop());
    expect(result.success).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateCommunicationLoop({});
    expect(result.success).toBe(false);
  });
});

describe('safeValidateProcedureStep', () => {
  it('returns success for valid input', () => {
    const result = safeValidateProcedureStep(validProcedureStep());
    expect(result.success).toBe(true);
  });

  it('returns errors for invalid input', () => {
    const result = safeValidateProcedureStep({});
    expect(result.success).toBe(false);
  });
});

/**
 * FL Threat-Model Gate — mitigation-matrix tests.
 *
 * Tests all four mandatory mitigations:
 *   1. Differential privacy (noise budget)    arXiv:2604.19891
 *   2. Gradient clipping                       arXiv:2604.20020
 *   3. Secure aggregation                      arXiv:2604.19915
 *   4. Per-client training-data cap            arXiv:2604.20020
 *
 * @module fl-threat-model/__tests__/mitigation-matrix.test
 */

import { describe, it, expect } from 'vitest';
import {
  checkMitigationMatrix,
  allMitigationsPass,
  MANDATORY_MITIGATIONS,
} from '../mitigation-matrix.js';
import type { DesignDoc } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

function makeFullDoc(): DesignDoc {
  return {
    fl_threat_model: {
      version: '1.0.0',
      mandatory_sources: ['eess26_2604.19891', 'eess26_2604.19915', 'eess26_2604.20020'],
      mitigations: {
        differential_privacy: {
          enabled: true,
          noise_mechanism: 'gaussian',
          epsilon: 1.0,
          delta: 0.00001,
          accuracy_tradeoff_documented: true,
        },
        gradient_clipping: {
          enabled: true,
          clipping_norm: 1.0,
          bias_characterised: true,
        },
        secure_aggregation: {
          enabled: true,
          protocol: 'SecAgg+',
          communication_overhead_estimated: true,
        },
        per_client_data_cap: {
          enabled: true,
          cap_value: 500,
          cap_rationale: 'Limits gradient info content per client per round',
        },
      },
      decifr_assessment: {
        attack_class_enumerated: true,
        secure_aggregation_as_primary_countermeasure: true,
      },
      dolthub_delineation: {
        static_skill_sharing_permitted: true,
        federated_training_status: 'BLOCKED',
        unblock_conditions_documented: true,
      },
    },
  };
}

// ============================================================================
// MANDATORY_MITIGATIONS metadata
// ============================================================================

describe('MANDATORY_MITIGATIONS', () => {
  it('has exactly 4 entries', () => {
    expect(MANDATORY_MITIGATIONS).toHaveLength(4);
  });

  it('includes differential privacy citing 2604.19891', () => {
    const dp = MANDATORY_MITIGATIONS.find((m) => m.arXivId.includes('2604.19891'));
    expect(dp).toBeDefined();
    expect(dp?.name).toMatch(/differential privacy/i);
  });

  it('includes gradient clipping citing 2604.20020', () => {
    const gc = MANDATORY_MITIGATIONS.find((m) =>
      m.arXivId.includes('2604.20020') && m.name.toLowerCase().includes('clipping'),
    );
    expect(gc).toBeDefined();
  });

  it('includes secure aggregation citing 2604.19915', () => {
    const sa = MANDATORY_MITIGATIONS.find((m) => m.arXivId.includes('2604.19915'));
    expect(sa).toBeDefined();
    expect(sa?.name).toMatch(/secure aggregation/i);
  });

  it('includes per-client data cap', () => {
    const cap = MANDATORY_MITIGATIONS.find((m) =>
      m.name.toLowerCase().includes('cap'),
    );
    expect(cap).toBeDefined();
  });
});

// ============================================================================
// allMitigationsPass — full passing doc
// ============================================================================

describe('allMitigationsPass — full valid doc', () => {
  it('returns true when all 4 mitigations are fully specified', () => {
    expect(allMitigationsPass(makeFullDoc())).toBe(true);
  });
});

// ============================================================================
// checkMitigationMatrix — differential privacy
// ============================================================================

describe('checkMitigationMatrix — differential privacy', () => {
  it('fails when dp.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.enabled = false;
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
    expect(results[0].reason).toMatch(/enabled/i);
  });

  it('fails when epsilon is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.epsilon = null;
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
    expect(results[0].reason).toMatch(/epsilon/i);
  });

  it('fails when epsilon is 0 (non-positive)', () => {
    const doc = makeFullDoc();
    (doc.fl_threat_model!.mitigations.differential_privacy as { epsilon: number }).epsilon = 0;
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
  });

  it('fails when noise_mechanism is empty string', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.noise_mechanism = '';
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
    expect(results[0].reason).toMatch(/noise_mechanism/i);
  });

  it('fails when noise_mechanism is "TODO"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.noise_mechanism = 'TODO';
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
  });

  it('fails when accuracy_tradeoff_documented is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.accuracy_tradeoff_documented = false;
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(false);
    expect(results[0].reason).toMatch(/accuracy_tradeoff_documented/i);
  });

  it('passes with laplacian noise mechanism', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.noise_mechanism = 'laplacian';
    const results = checkMitigationMatrix(doc);
    expect(results[0].passed).toBe(true);
  });
});

// ============================================================================
// checkMitigationMatrix — gradient clipping
// ============================================================================

describe('checkMitigationMatrix — gradient clipping', () => {
  it('fails when gradient_clipping.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.enabled = false;
    const results = checkMitigationMatrix(doc);
    expect(results[1].passed).toBe(false);
  });

  it('fails when clipping_norm is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.clipping_norm = null;
    const results = checkMitigationMatrix(doc);
    expect(results[1].passed).toBe(false);
    expect(results[1].reason).toMatch(/clipping_norm/i);
  });

  it('fails when bias_characterised is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.bias_characterised = false;
    const results = checkMitigationMatrix(doc);
    expect(results[1].passed).toBe(false);
  });
});

// ============================================================================
// checkMitigationMatrix — secure aggregation
// ============================================================================

describe('checkMitigationMatrix — secure aggregation', () => {
  it('fails when secure_aggregation.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.enabled = false;
    const results = checkMitigationMatrix(doc);
    expect(results[2].passed).toBe(false);
  });

  it('fails when protocol is empty', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = '';
    const results = checkMitigationMatrix(doc);
    expect(results[2].passed).toBe(false);
  });

  it('fails when protocol is "TBD"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = 'TBD';
    const results = checkMitigationMatrix(doc);
    expect(results[2].passed).toBe(false);
  });

  it('fails when communication_overhead_estimated is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.communication_overhead_estimated = false;
    const results = checkMitigationMatrix(doc);
    expect(results[2].passed).toBe(false);
  });
});

// ============================================================================
// checkMitigationMatrix — per-client data cap
// ============================================================================

describe('checkMitigationMatrix — per-client data cap', () => {
  it('fails when per_client_data_cap.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.enabled = false;
    const results = checkMitigationMatrix(doc);
    expect(results[3].passed).toBe(false);
  });

  it('fails when cap_value is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_value = null;
    const results = checkMitigationMatrix(doc);
    expect(results[3].passed).toBe(false);
    expect(results[3].reason).toMatch(/cap_value/i);
  });

  it('fails when cap_rationale is empty', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = '';
    const results = checkMitigationMatrix(doc);
    expect(results[3].passed).toBe(false);
  });

  it('fails when cap_rationale is "TODO"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = 'TODO';
    const results = checkMitigationMatrix(doc);
    expect(results[3].passed).toBe(false);
  });
});

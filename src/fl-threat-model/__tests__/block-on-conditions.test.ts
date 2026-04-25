/**
 * FL Threat-Model Gate — block-on-conditions tests.
 *
 * Tests all 15 block-on conditions enumerated in m4-mia-threat-model.tex
 * § Pre-Rollout Gate Specification. Each condition has at least one test.
 *
 * @module fl-threat-model/__tests__/block-on-conditions.test
 */

import { describe, it, expect } from 'vitest';
import {
  BLOCK_ON_ENTRIES,
  evaluateBlockOnConditions,
} from '../block-on-conditions.js';
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

function getEntry(id: number) {
  const e = BLOCK_ON_ENTRIES.find((b) => b.condition.id === id);
  if (!e) throw new Error(`Block-on entry ${id} not found`);
  return e;
}

// ============================================================================
// Structural checks
// ============================================================================

describe('BLOCK_ON_ENTRIES structure', () => {
  it('has exactly 15 entries', () => {
    expect(BLOCK_ON_ENTRIES).toHaveLength(15);
  });

  it('has sequential IDs from 1 to 15', () => {
    const ids = BLOCK_ON_ENTRIES.map((e) => e.condition.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  });

  it('all entries have non-empty key and description', () => {
    for (const e of BLOCK_ON_ENTRIES) {
      expect(e.condition.key.length).toBeGreaterThan(0);
      expect(e.condition.description.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// evaluateBlockOnConditions — full passing doc
// ============================================================================

describe('evaluateBlockOnConditions — full passing doc', () => {
  it('returns no fired conditions for a fully compliant doc', () => {
    const fired = evaluateBlockOnConditions(makeFullDoc());
    expect(fired).toHaveLength(0);
  });
});

// ============================================================================
// Condition 1: fl_threat_model block absent
// ============================================================================

describe('Block-on condition 1 — fl_threat_model absent', () => {
  it('fires when fl_threat_model is undefined', () => {
    const doc: DesignDoc = {};
    expect(getEntry(1).check(doc)).toBe(true);
  });

  it('does not fire when fl_threat_model is present', () => {
    expect(getEntry(1).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 2: mandatory_sources missing an ID
// ============================================================================

describe('Block-on condition 2 — mandatory_sources incomplete', () => {
  it('fires when mandatory_sources is empty', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = [];
    expect(getEntry(2).check(doc)).toBe(true);
  });

  it('fires when 2604.19891 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19915', '2604.20020'];
    expect(getEntry(2).check(doc)).toBe(true);
  });

  it('fires when 2604.19915 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19891', '2604.20020'];
    expect(getEntry(2).check(doc)).toBe(true);
  });

  it('fires when 2604.20020 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19891', '2604.19915'];
    expect(getEntry(2).check(doc)).toBe(true);
  });

  it('does not fire when all three IDs are present', () => {
    expect(getEntry(2).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 3: dp.enabled false
// ============================================================================

describe('Block-on condition 3 — differential_privacy.enabled false', () => {
  it('fires when dp.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.enabled = false;
    expect(getEntry(3).check(doc)).toBe(true);
  });

  it('does not fire when dp.enabled is true', () => {
    expect(getEntry(3).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 4: dp.epsilon null / non-positive
// ============================================================================

describe('Block-on condition 4 — differential_privacy.epsilon null', () => {
  it('fires when epsilon is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.epsilon = null;
    expect(getEntry(4).check(doc)).toBe(true);
  });

  it('fires when epsilon is 0', () => {
    const doc = makeFullDoc();
    (doc.fl_threat_model!.mitigations.differential_privacy as { epsilon: number }).epsilon = 0;
    expect(getEntry(4).check(doc)).toBe(true);
  });

  it('does not fire when epsilon is a positive number', () => {
    expect(getEntry(4).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 5: accuracy_tradeoff_documented false
// ============================================================================

describe('Block-on condition 5 — accuracy_tradeoff_documented false', () => {
  it('fires when accuracy_tradeoff_documented is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.accuracy_tradeoff_documented = false;
    expect(getEntry(5).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(5).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 6: gradient_clipping.enabled false
// ============================================================================

describe('Block-on condition 6 — gradient_clipping.enabled false', () => {
  it('fires when gradient_clipping.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.enabled = false;
    expect(getEntry(6).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(6).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 7: clipping_norm null / non-positive
// ============================================================================

describe('Block-on condition 7 — clipping_norm null', () => {
  it('fires when clipping_norm is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.clipping_norm = null;
    expect(getEntry(7).check(doc)).toBe(true);
  });

  it('does not fire when clipping_norm is a positive number', () => {
    expect(getEntry(7).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 8: secure_aggregation.enabled false
// ============================================================================

describe('Block-on condition 8 — secure_aggregation.enabled false', () => {
  it('fires when secure_aggregation.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.enabled = false;
    expect(getEntry(8).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(8).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 9: secure_aggregation.protocol empty
// ============================================================================

describe('Block-on condition 9 — secure_aggregation.protocol empty', () => {
  it('fires when protocol is empty string', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = '';
    expect(getEntry(9).check(doc)).toBe(true);
  });

  it('fires when protocol is "TODO"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = 'TODO';
    expect(getEntry(9).check(doc)).toBe(true);
  });

  it('does not fire when protocol is a named protocol', () => {
    expect(getEntry(9).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 10: per_client_data_cap.enabled false
// ============================================================================

describe('Block-on condition 10 — per_client_data_cap.enabled false', () => {
  it('fires when per_client_data_cap.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.enabled = false;
    expect(getEntry(10).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(10).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 11: cap_value null / non-positive
// ============================================================================

describe('Block-on condition 11 — cap_value null', () => {
  it('fires when cap_value is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_value = null;
    expect(getEntry(11).check(doc)).toBe(true);
  });

  it('does not fire when cap_value is a positive number', () => {
    expect(getEntry(11).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 12: cap_rationale empty
// ============================================================================

describe('Block-on condition 12 — cap_rationale empty', () => {
  it('fires when cap_rationale is empty string', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = '';
    expect(getEntry(12).check(doc)).toBe(true);
  });

  it('fires when cap_rationale is "TBD"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = 'TBD';
    expect(getEntry(12).check(doc)).toBe(true);
  });

  it('does not fire when cap_rationale is a real string', () => {
    expect(getEntry(12).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 13: decifr_assessment.attack_class_enumerated false
// ============================================================================

describe('Block-on condition 13 — attack_class_enumerated false', () => {
  it('fires when attack_class_enumerated is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.decifr_assessment.attack_class_enumerated = false;
    expect(getEntry(13).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(13).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 14: secure_aggregation_as_primary_countermeasure false
// ============================================================================

describe('Block-on condition 14 — secure_aggregation_as_primary_countermeasure false', () => {
  it('fires when secure_aggregation_as_primary_countermeasure is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.decifr_assessment.secure_aggregation_as_primary_countermeasure = false;
    expect(getEntry(14).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(14).check(makeFullDoc())).toBe(false);
  });
});

// ============================================================================
// Condition 15: unblock_conditions_documented false
// ============================================================================

describe('Block-on condition 15 — unblock_conditions_documented false', () => {
  it('fires when unblock_conditions_documented is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.dolthub_delineation.unblock_conditions_documented = false;
    expect(getEntry(15).check(doc)).toBe(true);
  });

  it('does not fire when true', () => {
    expect(getEntry(15).check(makeFullDoc())).toBe(false);
  });
});

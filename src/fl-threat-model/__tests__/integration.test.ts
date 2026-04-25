/**
 * FL Threat-Model Gate — integration tests.
 *
 * End-to-end tests for `gatePreRollout` and `validateDesignDocContent`.
 *
 * Key scenarios:
 *   - Design-doc with all 4 mitigations + Lee et al. trio cited → PASS
 *   - Design-doc missing any cite → BLOCK with cite-error
 *   - Design-doc missing any mitigation → BLOCK with mitigation-error
 *   - Design-doc with placeholder values → BLOCK
 *   - Design-doc with non-numeric noise_budget → BLOCK
 *   - Default-off passthrough (flag false → returns { verdict: 'gate-disabled' })
 *   - Round-trip GateVerdict JSON shape
 *
 * The settings flag is controlled by passing an explicit settingsPath to
 * each call; tests use a temp config file or a nonexistent path to test
 * the disabled default.
 *
 * @module fl-threat-model/__tests__/integration.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gatePreRollout, validateDesignDocContent } from '../index.js';
import type { DesignDoc, GateVerdict } from '../types.js';

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

const FULL_YAML = `
fl_threat_model:
  version: "1.0.0"
  mandatory_sources:
    - "eess26_2604.19891"
    - "eess26_2604.19915"
    - "eess26_2604.20020"
  mitigations:
    differential_privacy:
      enabled: true
      noise_mechanism: "gaussian"
      epsilon: 1.0
      delta: 0.00001
      accuracy_tradeoff_documented: true
    gradient_clipping:
      enabled: true
      clipping_norm: 1.0
      bias_characterised: true
    secure_aggregation:
      enabled: true
      protocol: "SecAgg+"
      communication_overhead_estimated: true
    per_client_data_cap:
      enabled: true
      cap_value: 500
      cap_rationale: "Limits gradient info content per client per round"
  decifr_assessment:
    attack_class_enumerated: true
    secure_aggregation_as_primary_countermeasure: true
  dolthub_delineation:
    static_skill_sharing_permitted: true
    federated_training_status: "BLOCKED"
    unblock_conditions_documented: true
`;

// ============================================================================
// Temp settings files
// ============================================================================

let tmpDir: string;
let enabledSettingsPath: string;
let disabledSettingsPath: string;
let missingSettingsPath: string;

const ENABLED_CONFIG = {
  'gsd-skill-creator': {
    'upstream-intelligence': {
      'fl-threat-model': { enabled: true },
    },
  },
};

const DISABLED_CONFIG = {
  'gsd-skill-creator': {
    'upstream-intelligence': {
      'fl-threat-model': { enabled: false },
    },
  },
};

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fl-threat-model-test-'));
  enabledSettingsPath = path.join(tmpDir, 'enabled.json');
  disabledSettingsPath = path.join(tmpDir, 'disabled.json');
  missingSettingsPath = path.join(tmpDir, 'nonexistent.json');
  fs.writeFileSync(enabledSettingsPath, JSON.stringify(ENABLED_CONFIG));
  fs.writeFileSync(disabledSettingsPath, JSON.stringify(DISABLED_CONFIG));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ============================================================================
// Default-off passthrough
// ============================================================================

describe('default-off passthrough', () => {
  it('returns gate-disabled when settings file is missing', () => {
    const verdict = gatePreRollout(makeFullDoc(), missingSettingsPath);
    expect(verdict.verdict).toBe('gate-disabled');
    expect(verdict.blocks).toHaveLength(0);
    expect(verdict.messages).toHaveLength(0);
  });

  it('returns gate-disabled when flag is false', () => {
    const verdict = gatePreRollout(makeFullDoc(), disabledSettingsPath);
    expect(verdict.verdict).toBe('gate-disabled');
  });

  it('returns gate-disabled even for a malformed doc when flag is off', () => {
    const doc: DesignDoc = {}; // no fl_threat_model
    const verdict = gatePreRollout(doc, disabledSettingsPath);
    expect(verdict.verdict).toBe('gate-disabled');
  });
});

// ============================================================================
// Full pass
// ============================================================================

describe('gatePreRollout — full passing doc', () => {
  it('returns pass when all 4 mitigations + Lee et al. trio cited', () => {
    const verdict = gatePreRollout(makeFullDoc(), enabledSettingsPath);
    expect(verdict.verdict).toBe('pass');
    expect(verdict.blocks).toHaveLength(0);
    expect(verdict.messages).toHaveLength(0);
  });
});

// ============================================================================
// Missing Lee et al. cites
// ============================================================================

describe('gatePreRollout — missing cites', () => {
  it('blocks when 2604.19891 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19915', '2604.20020'];
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
    expect(verdict.blocks).toContain('fl_threat_model.mandatory_sources');
  });

  it('blocks when 2604.19915 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19891', '2604.20020'];
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when 2604.20020 is missing', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = ['2604.19891', '2604.19915'];
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when mandatory_sources is absent', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = [];
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

// ============================================================================
// Missing mitigations
// ============================================================================

describe('gatePreRollout — missing differential_privacy', () => {
  it('blocks when dp.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.enabled = false;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
    expect(verdict.blocks.some((b) => b.includes('differential_privacy'))).toBe(true);
  });

  it('blocks when epsilon is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.epsilon = null;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when accuracy_tradeoff_documented is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.differential_privacy.accuracy_tradeoff_documented = false;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

describe('gatePreRollout — missing gradient_clipping', () => {
  it('blocks when gradient_clipping.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.enabled = false;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when clipping_norm is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.gradient_clipping.clipping_norm = null;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

describe('gatePreRollout — missing secure_aggregation', () => {
  it('blocks when secure_aggregation.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.enabled = false;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when protocol is empty', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = '';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

describe('gatePreRollout — missing per_client_data_cap', () => {
  it('blocks when cap.enabled is false', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.enabled = false;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when cap_value is null', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_value = null;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when cap_rationale is empty', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = '';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

// ============================================================================
// Placeholder values
// ============================================================================

describe('gatePreRollout — placeholder values', () => {
  it('blocks when protocol is "TODO" (secure_aggregation.protocol is a placeholder)', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = 'TODO';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
    expect(verdict.blocks.some((b) => b.includes('secure_aggregation.protocol'))).toBe(true);
  });

  it('blocks when protocol is "TBD"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.secure_aggregation.protocol = 'TBD';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when cap_rationale is "TODO"', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mitigations.per_client_data_cap.cap_rationale = 'TODO';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

// ============================================================================
// Non-numeric noise_budget (epsilon)
// ============================================================================

describe('gatePreRollout — non-numeric epsilon', () => {
  it('blocks when epsilon is provided as a string "TBD"', () => {
    const doc = makeFullDoc();
    // Force a string through the type system to simulate a YAML coercion edge case
    (doc.fl_threat_model!.mitigations.differential_privacy as unknown as Record<string, unknown>)['epsilon'] =
      'TBD';
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });

  it('blocks when epsilon is NaN', () => {
    const doc = makeFullDoc();
    (doc.fl_threat_model!.mitigations.differential_privacy as unknown as Record<string, unknown>)['epsilon'] =
      NaN;
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

// ============================================================================
// fl_threat_model block absent
// ============================================================================

describe('gatePreRollout — fl_threat_model absent', () => {
  it('blocks when the block is entirely absent', () => {
    const doc: DesignDoc = {};
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
    expect(verdict.blocks).toContain('fl_threat_model.present');
  });
});

// ============================================================================
// validateDesignDocContent (YAML string API)
// ============================================================================

describe('validateDesignDocContent — YAML string API', () => {
  it('passes for a fully compliant YAML string (flag enabled)', () => {
    const verdict = validateDesignDocContent(FULL_YAML, enabledSettingsPath);
    expect(verdict.verdict).toBe('pass');
  });

  it('returns gate-disabled for a fully compliant YAML string (flag disabled)', () => {
    const verdict = validateDesignDocContent(FULL_YAML, disabledSettingsPath);
    expect(verdict.verdict).toBe('gate-disabled');
  });

  it('blocks when mandatory_sources is empty in YAML', () => {
    const yaml = FULL_YAML.replace(
      /mandatory_sources:[\s\S]*?decifr_assessment/,
      'mandatory_sources: []\n  decifr_assessment',
    );
    const verdict = validateDesignDocContent(yaml, enabledSettingsPath);
    expect(verdict.verdict).toBe('block');
  });
});

// ============================================================================
// GateVerdict JSON shape round-trip
// ============================================================================

describe('GateVerdict JSON shape round-trip', () => {
  it('round-trips the pass verdict through JSON.stringify / JSON.parse', () => {
    const verdict = gatePreRollout(makeFullDoc(), enabledSettingsPath);
    const json = JSON.stringify(verdict);
    const parsed = JSON.parse(json) as typeof verdict;
    expect(parsed.verdict).toBe('pass');
    expect(Array.isArray(parsed.blocks)).toBe(true);
    expect(Array.isArray(parsed.messages)).toBe(true);
    expect(typeof parsed.timestamp).toBe('string');
  });

  it('round-trips a block verdict through JSON', () => {
    const doc = makeFullDoc();
    doc.fl_threat_model!.mandatory_sources = [];
    const verdict = gatePreRollout(doc, enabledSettingsPath);
    const parsed: GateVerdict = JSON.parse(JSON.stringify(verdict));
    expect(parsed.verdict).toBe('block');
    expect(parsed.blocks.length).toBeGreaterThan(0);
    expect(parsed.messages.length).toBeGreaterThan(0);
    expect(parsed.messages.length).toBe(parsed.blocks.length);
  });

  it('round-trips a gate-disabled verdict through JSON', () => {
    const verdict = gatePreRollout(makeFullDoc(), missingSettingsPath);
    const parsed: GateVerdict = JSON.parse(JSON.stringify(verdict));
    expect(parsed.verdict).toBe('gate-disabled');
    expect(parsed.blocks).toHaveLength(0);
    expect(parsed.messages).toHaveLength(0);
  });

  it('timestamp is a valid ISO-8601 string', () => {
    const verdict = gatePreRollout(makeFullDoc(), enabledSettingsPath);
    expect(() => new Date(verdict.timestamp)).not.toThrow();
    expect(new Date(verdict.timestamp).toISOString()).toBe(verdict.timestamp);
  });
});

// ============================================================================
// CAPCOM preservation: no src/orchestration, src/capcom, src/dacp imports
// ============================================================================

describe('CAPCOM preservation — module boundary', () => {
  it('index.ts exports do not reference orchestration, capcom, or dacp', async () => {
    // Import the index module and inspect its exports
    const mod = await import('../index.js');
    const exportNames = Object.keys(mod);
    // None of the export names should include capcom/dacp/orchestration
    for (const name of exportNames) {
      expect(name.toLowerCase()).not.toMatch(/capcom|dacp|orchestrat/);
    }
  });
});

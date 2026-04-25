/**
 * FL Threat-Model Gate — yaml-validator tests.
 *
 * Tests YAML frontmatter parsing, cite presence checks, and coercion of
 * design-doc fields. Verifies that the Lee et al. trio is enforced:
 *   arXiv:2604.19891 / 2604.19915 / 2604.20020
 *
 * @module fl-threat-model/__tests__/yaml-validator.test
 */

import { describe, it, expect } from 'vitest';
import {
  extractFrontmatter,
  parseDesignDocContent,
  findMissingCites,
  REQUIRED_ARXIV_IDS,
} from '../yaml-validator.js';

// ============================================================================
// extractFrontmatter
// ============================================================================

describe('extractFrontmatter', () => {
  it('extracts content between --- delimiters', () => {
    const md = '---\nfoo: bar\n---\n# Title\nBody';
    const result = extractFrontmatter(md);
    expect(result).toBe('foo: bar');
  });

  it('handles ... as closing delimiter', () => {
    const md = '---\nfoo: 1\n...\n# Title';
    const result = extractFrontmatter(md);
    expect(result).toBe('foo: 1');
  });

  it('returns full content when no --- markers present', () => {
    const yaml = 'a: 1\nb: 2';
    const result = extractFrontmatter(yaml);
    expect(result).toBe('a: 1\nb: 2');
  });

  it('returns content up to end when closing --- is missing', () => {
    const md = '---\nfoo: bar\n';
    const result = extractFrontmatter(md);
    expect(result).not.toBeNull();
    expect(result).toContain('foo: bar');
  });
});

// ============================================================================
// REQUIRED_ARXIV_IDS
// ============================================================================

describe('REQUIRED_ARXIV_IDS', () => {
  it('contains all three Lee et al. arXiv IDs', () => {
    expect(REQUIRED_ARXIV_IDS).toContain('2604.19891');
    expect(REQUIRED_ARXIV_IDS).toContain('2604.19915');
    expect(REQUIRED_ARXIV_IDS).toContain('2604.20020');
    expect(REQUIRED_ARXIV_IDS).toHaveLength(3);
  });
});

// ============================================================================
// findMissingCites
// ============================================================================

describe('findMissingCites', () => {
  it('returns empty array when all three IDs are present (bare form)', () => {
    const sources = ['2604.19891', '2604.19915', '2604.20020'];
    expect(findMissingCites(sources)).toHaveLength(0);
  });

  it('returns empty array with arXiv: prefix form', () => {
    const sources = [
      'arXiv:2604.19891',
      'arXiv:2604.19915',
      'arXiv:2604.20020',
    ];
    expect(findMissingCites(sources)).toHaveLength(0);
  });

  it('returns empty array with eess26_ cite-key form', () => {
    const sources = [
      'eess26_2604.19891',
      'eess26_2604.19915',
      'eess26_2604.20020',
    ];
    expect(findMissingCites(sources)).toHaveLength(0);
  });

  it('returns the missing ID when one is absent', () => {
    const sources = ['2604.19891', '2604.20020'];
    const missing = findMissingCites(sources);
    expect(missing).toEqual(['2604.19915']);
  });

  it('returns all three IDs when sources is empty', () => {
    const missing = findMissingCites([]);
    expect(missing).toHaveLength(3);
  });

  it('returns two missing IDs when only one present', () => {
    const missing = findMissingCites(['2604.19891']);
    expect(missing).toHaveLength(2);
    expect(missing).toContain('2604.19915');
    expect(missing).toContain('2604.20020');
  });
});

// ============================================================================
// parseDesignDocContent — present and complete
// ============================================================================

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
      cap_rationale: "Limits gradient information density per client per round"
  decifr_assessment:
    attack_class_enumerated: true
    secure_aggregation_as_primary_countermeasure: true
  dolthub_delineation:
    static_skill_sharing_permitted: true
    federated_training_status: "BLOCKED"
    unblock_conditions_documented: true
`;

describe('parseDesignDocContent — full valid doc', () => {
  it('parses without error', () => {
    const { parsed, parseError } = parseDesignDocContent(FULL_YAML);
    expect(parsed).toBe(true);
    expect(parseError).toBeUndefined();
  });

  it('extracts fl_threat_model block', () => {
    const { doc } = parseDesignDocContent(FULL_YAML);
    expect(doc.fl_threat_model).toBeDefined();
  });

  it('coerces epsilon to number', () => {
    const { doc } = parseDesignDocContent(FULL_YAML);
    expect(doc.fl_threat_model?.mitigations.differential_privacy.epsilon).toBe(1.0);
  });

  it('coerces enabled flags to boolean', () => {
    const { doc } = parseDesignDocContent(FULL_YAML);
    expect(doc.fl_threat_model?.mitigations.gradient_clipping.enabled).toBe(true);
  });

  it('captures mandatory_sources array', () => {
    const { doc } = parseDesignDocContent(FULL_YAML);
    const sources = doc.fl_threat_model?.mandatory_sources ?? [];
    expect(findMissingCites(sources)).toHaveLength(0);
  });
});

describe('parseDesignDocContent — absent fl_threat_model block', () => {
  it('returns doc with fl_threat_model undefined', () => {
    const { doc, parsed } = parseDesignDocContent('other_key: value');
    expect(parsed).toBe(true);
    expect(doc.fl_threat_model).toBeUndefined();
  });
});

describe('parseDesignDocContent — invalid YAML', () => {
  it('returns parseError on malformed YAML', () => {
    const { parseError } = parseDesignDocContent('key: [unclosed');
    expect(parseError).toBeDefined();
    expect(parseError).toMatch(/YAML parse error/i);
  });
});

describe('parseDesignDocContent — markdown frontmatter', () => {
  it('handles markdown with --- frontmatter delimiters', () => {
    const md = `---\nfl_threat_model:\n  version: "1.0.0"\n  mandatory_sources: []\n  mitigations:\n    differential_privacy:\n      enabled: false\n      noise_mechanism: ""\n      epsilon: null\n      delta: null\n      accuracy_tradeoff_documented: false\n    gradient_clipping:\n      enabled: false\n      clipping_norm: null\n      bias_characterised: false\n    secure_aggregation:\n      enabled: false\n      protocol: ""\n      communication_overhead_estimated: false\n    per_client_data_cap:\n      enabled: false\n      cap_value: null\n      cap_rationale: ""\n  decifr_assessment:\n    attack_class_enumerated: false\n    secure_aggregation_as_primary_countermeasure: false\n  dolthub_delineation:\n    static_skill_sharing_permitted: true\n    federated_training_status: "BLOCKED"\n    unblock_conditions_documented: false\n---\n# Design Doc\nBody here.`;
    const { doc, parsed } = parseDesignDocContent(md);
    expect(parsed).toBe(true);
    expect(doc.fl_threat_model).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlaneClassification, DomainActivation } from '../packs/engines/plane-classifier.js';

// Mock classifyProblem before importing the module under test
vi.mock('../packs/engines/plane-classifier.js', () => ({
  classifyProblem: vi.fn(),
}));

import { classifyProblem } from '../packs/engines/plane-classifier.js';
import {
  MfeSkillType,
  detectMathematicalStructure,
  createMfeSkillType,
  type KnowledgeTier,
  type MfeSkillConfig,
  type TierMetadata,
} from './mfe-skill-type.js';

const mockClassify = vi.mocked(classifyProblem);

function makeMockClassification(overrides: Partial<PlaneClassification> = {}): PlaneClassification {
  return {
    position: { real: 0.0, imaginary: 0.0 },
    activatedDomains: [],
    confidence: 0,
    keywords: [],
    ...overrides,
  };
}

function makeDomainActivation(
  domainId: string,
  score: number,
  matchedPatterns: string[] = [],
): DomainActivation {
  return { domainId: domainId as any, score, matchedPatterns };
}

describe('detectMathematicalStructure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true for inputs with clear mathematical terms', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.7,
        activatedDomains: [makeDomainActivation('change', 0.8, ['derivative'])],
        keywords: ['derivative'],
      }),
    );
    expect(detectMathematicalStructure('derivative of x^2')).toBe(true);
  });

  it('returns true for inputs with eigenvalue terminology', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.6,
        activatedDomains: [makeDomainActivation('structure', 0.7, ['eigenvalue'])],
        keywords: ['eigenvalue', 'decomposition'],
      }),
    );
    expect(detectMathematicalStructure('eigenvalue decomposition')).toBe(true);
  });

  it('returns true for inputs with domain activation keywords', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.5,
        activatedDomains: [makeDomainActivation('waves', 0.6, ['Fourier'])],
        keywords: ['fourier', 'transform'],
      }),
    );
    expect(detectMathematicalStructure('Fourier transform')).toBe(true);
  });

  it('returns false for non-mathematical inputs', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0,
        activatedDomains: [],
        keywords: ['deploy', 'server'],
      }),
    );
    expect(detectMathematicalStructure('deploy the server')).toBe(false);
  });

  it('returns false for CSS layout inputs', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0,
        activatedDomains: [],
        keywords: ['fix', 'css', 'layout'],
      }),
    );
    expect(detectMathematicalStructure('fix CSS layout')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(detectMathematicalStructure('')).toBe(false);
  });

  it('returns false for whitespace-only input', () => {
    expect(detectMathematicalStructure('   ')).toBe(false);
  });

  it('returns true for mixed inputs where mathematical structure is present', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.4,
        activatedDomains: [makeDomainActivation('change', 0.5, ['derivative'])],
        keywords: ['build', 'function', 'computes', 'derivative'],
      }),
    );
    expect(detectMathematicalStructure('build a function that computes the derivative')).toBe(true);
  });
});

describe('MfeSkillType.score', () => {
  let skillType: MfeSkillType;

  beforeEach(() => {
    vi.clearAllMocks();
    skillType = new MfeSkillType();
  });

  it('returns a ScoredSkill with name mathematical-foundation and matchType intent', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.7,
        activatedDomains: [makeDomainActivation('change', 0.8)],
      }),
    );
    const result = skillType.score('derivative of x^2');
    expect(result.name).toBe('mathematical-foundation');
    expect(result.matchType).toBe('intent');
  });

  it('score is derived from plane classifier confidence: high-confidence produces score > 0.5', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.8,
        activatedDomains: [makeDomainActivation('change', 0.8)],
      }),
    );
    const result = skillType.score('prove the fundamental theorem of calculus');
    expect(result.score).toBeGreaterThan(0.5);
  });

  it('low-confidence classification below threshold returns score of 0', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.1,
        activatedDomains: [makeDomainActivation('perception', 0.1)],
      }),
    );
    const result = skillType.score('maybe something with numbers');
    expect(result.score).toBe(0);
  });

  it('score is clamped to [0.0, 1.0] range', () => {
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 1.0,
        activatedDomains: [
          makeDomainActivation('change', 0.9),
          makeDomainActivation('structure', 0.8),
          makeDomainActivation('foundations', 0.7),
          makeDomainActivation('mapping', 0.6),
          makeDomainActivation('waves', 0.5),
          makeDomainActivation('perception', 0.4),
        ],
      }),
    );
    const result = skillType.score('comprehensive mathematical problem');
    expect(result.score).toBeGreaterThanOrEqual(0.0);
    expect(result.score).toBeLessThanOrEqual(1.0);
  });

  it('multiple domain activations boost the score', () => {
    // Single domain
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.5,
        activatedDomains: [makeDomainActivation('change', 0.5)],
      }),
    );
    const singleResult = skillType.score('derivative');

    // Multiple domains, same confidence
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.5,
        activatedDomains: [
          makeDomainActivation('change', 0.5),
          makeDomainActivation('structure', 0.4),
          makeDomainActivation('waves', 0.3),
        ],
      }),
    );
    const multiResult = skillType.score('derivative transform vector');

    expect(multiResult.score).toBeGreaterThan(singleResult.score);
  });
});

describe('KnowledgeTier metadata', () => {
  let skillType: MfeSkillType;

  beforeEach(() => {
    skillType = new MfeSkillType();
  });

  it('getTierMetadata summary returns correct metadata', () => {
    const tier = skillType.getTierMetadata('summary');
    expect(tier).toEqual({
      name: 'summary',
      maxTokens: 4000,
      alwaysLoad: true,
    });
  });

  it('getTierMetadata active returns correct metadata', () => {
    const tier = skillType.getTierMetadata('active');
    expect(tier).toEqual({
      name: 'active',
      maxTokens: 15000,
      alwaysLoad: false,
    });
  });

  it('getTierMetadata reference returns correct metadata with productionLoad false', () => {
    const tier = skillType.getTierMetadata('reference');
    expect(tier).toEqual({
      name: 'reference',
      maxTokens: 40000,
      alwaysLoad: false,
      productionLoad: false,
    });
  });

  it('getActiveTierForDomains returns content description scoped to those domains', () => {
    const content = skillType.getActiveTierForDomains(['perception', 'waves']);
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content.toLowerCase()).toContain('perception');
    expect(content.toLowerCase()).toContain('waves');
  });
});

describe('MfeSkillConfig', () => {
  it('default config has confidenceThreshold of 0.2', () => {
    const skillType = new MfeSkillType();
    // Score something below 0.2 threshold
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.15,
        activatedDomains: [makeDomainActivation('perception', 0.15)],
      }),
    );
    const result = skillType.score('slightly math');
    expect(result.score).toBe(0); // Below 0.2 threshold
  });

  it('default config has skillName of mathematical-foundation', () => {
    const skillType = new MfeSkillType();
    expect(skillType.getSkillName()).toBe('mathematical-foundation');
  });

  it('config can be overridden via constructor', () => {
    const custom = new MfeSkillType({ skillName: 'custom-math', confidenceThreshold: 0.5 });
    expect(custom.getSkillName()).toBe('custom-math');

    // Score something between 0.2 and 0.5 threshold (should be 0 with custom threshold)
    mockClassify.mockReturnValue(
      makeMockClassification({
        confidence: 0.3,
        activatedDomains: [makeDomainActivation('change', 0.3)],
      }),
    );
    const result = custom.score('derivative');
    expect(result.score).toBe(0); // Below 0.5 custom threshold
  });
});

describe('createMfeSkillType factory', () => {
  it('creates an MfeSkillType instance with default config', () => {
    const skillType = createMfeSkillType();
    expect(skillType).toBeInstanceOf(MfeSkillType);
    expect(skillType.getSkillName()).toBe('mathematical-foundation');
  });

  it('creates an MfeSkillType instance with custom config', () => {
    const skillType = createMfeSkillType({ skillName: 'test-math' });
    expect(skillType.getSkillName()).toBe('test-math');
  });
});

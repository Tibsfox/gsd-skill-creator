/**
 * Test suite for AngularRefinementWrapper -- content direction analysis
 * and post-refinement position updates on the complex plane.
 */

import { describe, it, expect } from 'vitest';
import { createPosition } from './arithmetic.js';
import { MAX_ANGULAR_VELOCITY } from './types.js';
import { CONSTRAINT_MAP } from './promotion.js';
import type { PositionStorePort } from './promotion.js';
import type { SkillPosition } from './types.js';
import {
  AngularRefinementWrapper,
  analyzeRefinementDirection,
  countConcreteIndicators,
  countAbstractIndicators,
} from './refinement-wrapper.js';

// ============================================================================
// Test Factories
// ============================================================================

function createMockPositionStore(
  positions: Map<string, SkillPosition> = new Map(),
): PositionStorePort {
  return {
    get: (id: string) => positions.get(id) ?? null,
    set: (id: string, pos: SkillPosition) => { positions.set(id, pos); },
  };
}

// ============================================================================
// Test Content Samples
// ============================================================================

const CONCRETE_CONTENT = `# Deploy Script
1. Run \`npm run build\`
2. Execute \`npx prisma db push\`
3. Deploy to production

\`\`\`bash
cd src/api/auth
node server.js
\`\`\`

Files: src/api/auth/route.ts, src/middleware/cors.ts
`;

const ABSTRACT_CONTENT = `# Architecture Approach
When the system encounters a pattern, consider whether it should be cached.
If the approach suggests a broader strategy, you might want to explore
similar patterns across the codebase. See also related concepts in
the architecture documentation. The design could be modeled as a
concept graph where each node represents an abstract strategy.
`;

const NEUTRAL_CONTENT_OLD = `# My Skill
This skill helps with teh deployment process.
It runs npm test and checks results.
`;

const NEUTRAL_CONTENT_NEW = `# My Skill
This skill helps with the deployment process.
It runs npm test and checks results.
`;

// ============================================================================
// Tests
// ============================================================================

describe('countConcreteIndicators', () => {
  it('counts file paths', () => {
    const count = countConcreteIndicators('Look at src/api/auth.ts and src/middleware/cors.ts for details.');
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('counts code blocks', () => {
    const content = '```bash\nnpm run build\n```\n\nSome text\n\n```ts\nconst x = 1;\n```';
    const count = countConcreteIndicators(content);
    expect(count).toBeGreaterThanOrEqual(2); // At least 2 code blocks (weighted)
  });

  it('counts exact commands', () => {
    const content = 'First npm run build, then npx prisma migrate, finally git push origin main.';
    const count = countConcreteIndicators(content);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  it('returns 0 for pure prose', () => {
    const count = countConcreteIndicators(ABSTRACT_CONTENT);
    // Abstract content should have very few concrete indicators
    expect(count).toBeLessThanOrEqual(1);
  });
});

describe('countAbstractIndicators', () => {
  it('counts broad language', () => {
    const content = 'When you consider the approach, you might find it could work.';
    const count = countAbstractIndicators(content);
    expect(count).toBeGreaterThanOrEqual(3); // when, consider, might, could
  });

  it('counts semantic terms', () => {
    const content = 'The pattern and concept follow an approach that reflects the strategy.';
    const count = countAbstractIndicators(content);
    expect(count).toBeGreaterThanOrEqual(4); // pattern, concept, approach, strategy
  });

  it('counts flexible language', () => {
    const content = 'This is similar to what you see in examples, such as the one described.';
    const count = countAbstractIndicators(content);
    expect(count).toBeGreaterThanOrEqual(2); // "similar to", "such as" (weighted x2)
  });

  it('returns 0 for concrete content', () => {
    const content = '```bash\nnpm install\ngit commit\n```\n\nFiles: src/index.ts';
    const count = countAbstractIndicators(content);
    expect(count).toBe(0);
  });
});

describe('analyzeRefinementDirection', () => {
  it('returns negative when refinement became more concrete', () => {
    const direction = analyzeRefinementDirection(ABSTRACT_CONTENT, CONCRETE_CONTENT);
    expect(direction).toBeLessThan(0);
  });

  it('returns positive when refinement became more abstract', () => {
    const direction = analyzeRefinementDirection(CONCRETE_CONTENT, ABSTRACT_CONTENT);
    expect(direction).toBeGreaterThan(0);
  });

  it('returns approximately 0 for neutral changes', () => {
    const direction = analyzeRefinementDirection(NEUTRAL_CONTENT_OLD, NEUTRAL_CONTENT_NEW);
    expect(direction).toBeCloseTo(0, 1);
  });

  it('handles empty strings', () => {
    const direction = analyzeRefinementDirection('', '');
    expect(direction).toBe(0);
  });

  it('handles identical content', () => {
    const direction = analyzeRefinementDirection(CONCRETE_CONTENT, CONCRETE_CONTENT);
    expect(direction).toBe(0);
  });
});

describe('AngularRefinementWrapper', () => {
  describe('onRefinement', () => {
    it('decreases theta when refinement is more concrete', () => {
      const pos = createPosition(Math.PI / 4, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.15);

      const updated = store.get('s1')!;
      expect(updated.theta).toBeLessThan(pos.theta);
    });

    it('increases theta when refinement is more abstract', () => {
      const pos = createPosition(Math.PI / 4, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', CONCRETE_CONTENT, ABSTRACT_CONTENT, 0.15);

      const updated = store.get('s1')!;
      expect(updated.theta).toBeGreaterThan(pos.theta);
    });

    it('leaves theta approximately unchanged for neutral refinement', () => {
      const pos = createPosition(Math.PI / 4, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', NEUTRAL_CONTENT_OLD, NEUTRAL_CONTENT_NEW, 0.02);

      const updated = store.get('s1')!;
      expect(Math.abs(updated.theta - pos.theta)).toBeLessThan(0.01);
    });

    it('clamps angular shift to velocity bound', () => {
      const theta = Math.PI / 4;
      const pos = createPosition(theta, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      // Use extreme content change with high changePercent to test clamping
      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.20);

      const updated = store.get('s1')!;
      const shift = Math.abs(updated.theta - pos.theta);
      const maxShift = MAX_ANGULAR_VELOCITY * pos.theta;
      expect(shift).toBeLessThanOrEqual(maxShift + 1e-10); // Small epsilon for float
    });

    it('sets angular velocity to the clamped shift value', () => {
      const pos = createPosition(Math.PI / 4, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.15);

      const updated = store.get('s1')!;
      // Angular velocity should be the clamped shift value (negative for concrete direction)
      expect(updated.angularVelocity).not.toBe(0);
      expect(Math.abs(updated.angularVelocity)).toBeLessThanOrEqual(
        MAX_ANGULAR_VELOCITY * pos.theta + 1e-10,
      );
    });

    it('preserves radius on refinement', () => {
      const pos = createPosition(Math.PI / 4, 0.7, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.10);

      const updated = store.get('s1')!;
      expect(updated.radius).toBeCloseTo(0.7, 3);
    });

    it('does nothing when skill has no position', () => {
      const store = createMockPositionStore(new Map());
      const wrapper = new AngularRefinementWrapper(store);

      // Should not throw
      expect(() => {
        wrapper.onRefinement('missing', 'old', 'new', 0.1);
      }).not.toThrow();

      // Store should still be empty
      expect(store.get('missing')).toBeNull();
    });

    it('updates position store', () => {
      const pos = createPosition(Math.PI / 4, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.10);

      const updated = store.get('s1')!;
      expect(updated).not.toBeNull();
      // Position should be different from original
      expect(updated.theta).not.toBeCloseTo(pos.theta, 3);
    });
  });

  describe('existing constraint preservation', () => {
    it('angular shift respects 20% content change mapping', () => {
      const theta = Math.PI / 3; // ~1.047
      const pos = createPosition(theta, 0.5, 0.0);
      const positions = new Map<string, SkillPosition>([['s1', pos]]);
      const store = createMockPositionStore(positions);
      const wrapper = new AngularRefinementWrapper(store);

      // 20% changePercent is the max allowed by bounded learning
      wrapper.onRefinement('s1', ABSTRACT_CONTENT, CONCRETE_CONTENT, 0.20);

      const updated = store.get('s1')!;
      const shift = Math.abs(updated.theta - pos.theta);
      const maxAllowed = MAX_ANGULAR_VELOCITY * pos.theta;
      expect(shift).toBeLessThanOrEqual(maxAllowed + 1e-10);
    });

    it('CONSTRAINT_MAP values match existing bounded config', () => {
      expect(CONSTRAINT_MAP.minCorrections).toBe(3);
      expect(CONSTRAINT_MAP.cooldownDays).toBe(7);
      expect(CONSTRAINT_MAP.maxContentChange).toBeCloseTo(0.20, 3);
    });
  });
});

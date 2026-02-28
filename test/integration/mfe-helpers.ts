// === MFE Integration Test Helpers ===
//
// Shared test fixtures, factory functions, and mock domain data for
// MFE pipeline integration tests. Pure factory functions only -- no
// side effects on import.

import type {
  MathematicalPrimitive,
  DomainId,
  PlanePosition,
  CompositionPath,
  CompositionStep,
  PrimitiveType,
  DependencyEdge,
  CompositionRule,
} from '../../src/core/types/mfe-types.js';
import type { DomainDataFile } from '../../src/packs/engines/dependency-graph.js';
import type { DependencyGraphPort } from '../../src/packs/engines/composition-engine.js';
import type { VerificationLookups } from '../../src/packs/engines/verification-engine.js';

// === Constants ===

export const DOMAIN_IDS: DomainId[] = [
  'perception',
  'waves',
  'change',
  'structure',
  'reality',
  'foundations',
  'mapping',
  'unification',
  'emergence',
  'synthesis',
];

export const DOMAIN_CENTERS: Map<DomainId, PlanePosition> = new Map([
  ['perception', { real: -0.2, imaginary: 0.2 }],
  ['waves', { real: -0.4, imaginary: 0.0 }],
  ['change', { real: 0.0, imaginary: -0.2 }],
  ['structure', { real: 0.2, imaginary: 0.4 }],
  ['reality', { real: 0.4, imaginary: -0.2 }],
  ['foundations', { real: -0.2, imaginary: 0.6 }],
  ['mapping', { real: 0.2, imaginary: 0.2 }],
  ['unification', { real: 0.6, imaginary: 0.0 }],
  ['emergence', { real: 0.0, imaginary: -0.6 }],
  ['synthesis', { real: 0.0, imaginary: 0.0 }],
]);

// === Domain chapter ranges ===

const DOMAIN_CHAPTERS: Record<DomainId, number[]> = {
  perception: [1, 2, 3],
  waves: [4, 5, 6, 7],
  change: [8, 9, 10],
  structure: [11, 12, 13, 14],
  reality: [15, 16, 17],
  foundations: [18, 19, 20, 21],
  mapping: [22, 23, 24, 25],
  unification: [26, 27],
  emergence: [28, 29, 30, 31],
  synthesis: [32, 33],
};

// === Factory: MathematicalPrimitive ===

export function makePrimitive(
  overrides?: Partial<MathematicalPrimitive>,
): MathematicalPrimitive {
  const domain = overrides?.domain ?? 'perception';
  const center = DOMAIN_CENTERS.get(domain) ?? { real: 0, imaginary: 0 };
  const chapters = DOMAIN_CHAPTERS[domain] ?? [1];

  return {
    id: `${domain}-test-prim`,
    name: 'Test Primitive',
    type: 'definition' as PrimitiveType,
    domain,
    chapter: chapters[0],
    section: '1.1',
    planePosition: { real: center.real, imaginary: center.imaginary },
    formalStatement: 'A test formal statement.',
    computationalForm: `${domain}-type`,
    prerequisites: [],
    dependencies: [],
    enables: [],
    compositionRules: [],
    applicabilityPatterns: [domain],
    keywords: [domain, 'test'],
    tags: ['test'],
    buildLabs: [],
    ...overrides,
  };
}

// === Factory: DomainDataFile ===

export function makeDomainData(
  domainId: DomainId,
  primitiveCount: number,
): DomainDataFile {
  const center = DOMAIN_CENTERS.get(domainId) ?? { real: 0, imaginary: 0 };
  const chapters = DOMAIN_CHAPTERS[domainId] ?? [1];
  const primitives: MathematicalPrimitive[] = [];

  for (let n = 0; n < primitiveCount; n++) {
    const id = `${domainId}-prim-${n}`;

    // First primitive is an axiom with no dependencies; subsequent depend on prior
    const type: PrimitiveType = n === 0 ? 'axiom' : 'definition';
    const dependencies: DependencyEdge[] =
      n === 0
        ? []
        : [
            {
              target: `${domainId}-prim-${n - 1}`,
              type: 'requires',
              strength: 1.0,
              description: `${id} requires ${domainId}-prim-${n - 1}`,
            },
          ];

    // Each primitive has a sequential composition rule with the next primitive.
    // yields must match the next primitive's computationalForm so the composition
    // engine produces dimensionally consistent paths (inputType === prev outputType).
    const compositionRules: CompositionRule[] =
      n < primitiveCount - 1
        ? [
            {
              with: `${domainId}-prim-${n + 1}`,
              yields: `${domainId}-type`,
              type: 'sequential',
              conditions: ['Both primitives available'],
              example: `Compose ${id} with ${domainId}-prim-${n + 1}`,
            },
          ]
        : [];

    const planePosition: PlanePosition = {
      real: center.real + n * 0.02,
      imaginary: center.imaginary + n * 0.02,
    };

    primitives.push(
      makePrimitive({
        id,
        name: `${domainId} Primitive ${n}`,
        type,
        domain: domainId,
        chapter: chapters[n % chapters.length],
        section: `${chapters[n % chapters.length]}.${n + 1}`,
        planePosition,
        formalStatement: `Formal statement for ${id}`,
        computationalForm: `${domainId}-type`,
        prerequisites: n > 0 ? [`Understanding of ${domainId}-prim-${n - 1}`] : [],
        dependencies,
        enables: n < primitiveCount - 1 ? [`${domainId}-prim-${n + 1}`] : [],
        compositionRules,
        applicabilityPatterns: [domainId, `${domainId} pattern ${n}`],
        keywords: [domainId, `prim${n}`],
        tags: [domainId],
        buildLabs: [],
      }),
    );
  }

  return {
    domain: domainId,
    version: '1.35.0',
    primitives,
  };
}

// === Factory: all 10 domains ===

export function makeAllDomainData(primitivesPerDomain: number): DomainDataFile[] {
  return DOMAIN_IDS.map((id) => makeDomainData(id, primitivesPerDomain));
}

// === Factory: DependencyGraphPort ===

export function makeDependencyGraphPort(
  primitives: Map<string, MathematicalPrimitive>,
): DependencyGraphPort {
  const ids = Array.from(primitives.keys());

  return {
    hasPath(from: string, to: string): boolean {
      return primitives.has(from) && primitives.has(to);
    },

    getTopologicalOrder(primitiveIds: string[]): string[] {
      // Return in insertion order (respects dependency ordering from makeDomainData)
      return ids.filter((id) => primitiveIds.includes(id));
    },

    getPathCost(_from: string, _to: string): number {
      return 1.0;
    },
  };
}

// === Factory: VerificationLookups ===

export function makeVerificationLookups(
  primitives: Map<string, MathematicalPrimitive>,
  domainCompatibility?: Map<DomainId, DomainId[]>,
): VerificationLookups {
  // Default: every domain compatible with every other domain
  const defaultCompatibility = new Map<DomainId, DomainId[]>();
  for (const d of DOMAIN_IDS) {
    defaultCompatibility.set(
      d,
      DOMAIN_IDS.filter((other) => other !== d),
    );
  }

  return {
    primitiveType(id: string): PrimitiveType | undefined {
      return primitives.get(id)?.type;
    },

    primitiveDomain(id: string): DomainId | undefined {
      return primitives.get(id)?.domain;
    },

    domainCompatibility: domainCompatibility ?? defaultCompatibility,
  };
}

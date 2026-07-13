import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  generateTrySession,
  generateTrySessionAuthored,
  orderConceptsByPrerequisite,
  validateGeneratedSession,
  serializeTrySession,
  type GeneratorConcept,
  type TrySessionAuthor,
} from '../try-session-generator.js';

// A small department: `sum` depends on `add`, `add` depends on `count`, plus a
// cross-department external dependency the ordering must surface as a prereq.
const CONCEPTS: GeneratorConcept[] = [
  {
    id: 'math-sum',
    name: 'Sum',
    description: 'add a whole list of numbers',
    relationships: [
      { type: 'dependency', targetId: 'math-add', description: 'sum repeats add' },
      { type: 'dependency', targetId: 'ext-numbers', description: 'needs numbers' },
    ],
  },
  {
    id: 'math-add',
    name: 'Addition',
    description: 'combine two numbers',
    relationships: [{ type: 'dependency', targetId: 'math-count', description: 'add counts on' }],
  },
  {
    id: 'math-count',
    name: 'Counting',
    description: 'enumerate a set',
    relationships: [{ type: 'analogy', targetId: 'math-add', description: 'related' }],
  },
];

function indexOfConcept(session: ReturnType<typeof generateTrySession>, id: string): number {
  return session.steps.findIndex((s) => s.conceptsExplored[0] === id);
}

describe('orderConceptsByPrerequisite', () => {
  it('orders prerequisites before dependents', () => {
    const { ordered } = orderConceptsByPrerequisite(CONCEPTS);
    const ids = ordered.map((c) => c.id);
    expect(ids.indexOf('math-count')).toBeLessThan(ids.indexOf('math-add'));
    expect(ids.indexOf('math-add')).toBeLessThan(ids.indexOf('math-sum'));
  });

  it('surfaces out-of-set dependency targets as external prerequisites', () => {
    const { externalPrerequisites } = orderConceptsByPrerequisite(CONCEPTS);
    expect(externalPrerequisites).toContain('ext-numbers');
    expect(externalPrerequisites).not.toContain('math-add');
  });

  it('is deterministic and terminates on a cycle', () => {
    const cyclic: GeneratorConcept[] = [
      { id: 'a', relationships: [{ type: 'dependency', targetId: 'b' }] },
      { id: 'b', relationships: [{ type: 'dependency', targetId: 'a' }] },
    ];
    const r = orderConceptsByPrerequisite(cyclic);
    expect(r.hadCycle).toBe(true);
    expect(r.ordered.map((c) => c.id).sort()).toEqual(['a', 'b']);
  });
});

describe('generateTrySession', () => {
  it('emits one step per concept, each tied to a real concept id', () => {
    const session = generateTrySession(CONCEPTS, { departmentId: 'math' });
    expect(session.steps).toHaveLength(CONCEPTS.length);
    const realIds = new Set(CONCEPTS.map((c) => c.id));
    for (const step of session.steps) {
      expect(step.conceptsExplored.length).toBeGreaterThan(0);
      expect(realIds.has(step.conceptsExplored[0]!)).toBe(true);
    }
  });

  it('orders steps so prerequisites precede dependents', () => {
    const session = generateTrySession(CONCEPTS, { departmentId: 'math' });
    expect(indexOfConcept(session, 'math-count')).toBeLessThan(indexOfConcept(session, 'math-add'));
    expect(indexOfConcept(session, 'math-add')).toBeLessThan(indexOfConcept(session, 'math-sum'));
  });

  it('passes the structural validation quality bar', () => {
    const session = generateTrySession(CONCEPTS, { departmentId: 'math', wingId: 'arithmetic' });
    const check = validateGeneratedSession(session);
    expect(check.errors).toEqual([]);
    expect(check.valid).toBe(true);
    expect(session.estimatedMinutes).toBeGreaterThan(0);
    expect(session.id).toBe('math-arithmetic-generated-tour');
  });

  it('respects maxSteps', () => {
    const session = generateTrySession(CONCEPTS, { departmentId: 'math', maxSteps: 2 });
    expect(session.steps).toHaveLength(2);
  });
});

describe('generateTrySessionAuthored', () => {
  it('with no author, is identical to the template generateTrySession (opt-in gate)', async () => {
    const template = generateTrySession(CONCEPTS, { departmentId: 'math' });
    const authored = await generateTrySessionAuthored(CONCEPTS, { departmentId: 'math' });
    expect(authored).toEqual(template);
  });

  it('uses an injected author for step prose while preserving structure', async () => {
    const author: TrySessionAuthor = {
      async authorStep({ concept, index }) {
        return {
          instruction: `Hands-on task ${index + 1} for ${concept.id}: build a small example.`,
          expectedOutcome: `You produced a working ${concept.id} example.`,
          hint: `Start from the ${concept.id} definition.`,
        };
      },
    };
    const session = await generateTrySessionAuthored(CONCEPTS, { departmentId: 'math' }, author);
    expect(validateGeneratedSession(session).valid).toBe(true);
    for (const step of session.steps) {
      expect(step.instruction).toContain('Hands-on task');
      expect(step.instruction).not.toContain('[DRAFT');
    }
    // Ordering + concept tracking survive authoring.
    expect(session.steps[0]!.conceptsExplored[0]).toBe('math-count');
  });

  it('falls back to the template on a throwing or unusable author (best-effort)', async () => {
    const template = generateTrySession(CONCEPTS, { departmentId: 'math' });
    const throwing: TrySessionAuthor = { async authorStep() { throw new Error('boom'); } };
    const empty: TrySessionAuthor = { async authorStep() { return { instruction: '', expectedOutcome: '' }; } };
    expect((await generateTrySessionAuthored(CONCEPTS, { departmentId: 'math' }, throwing)).steps).toEqual(template.steps);
    expect((await generateTrySessionAuthored(CONCEPTS, { departmentId: 'math' }, empty)).steps).toEqual(template.steps);
  });
});

describe('serializeTrySession + runner acceptance', () => {
  it('produces a module the .college TrySessionRunner accepts and orders correctly', async () => {
    const session = generateTrySession(CONCEPTS, { departmentId: 'math' });
    const source = serializeTrySession(session);

    // Write the emitted .ts into a temp department, then load it through the
    // REAL runner via the same dual-loader path the CLI writes to. The runner
    // module lives outside src/, so it is pulled in with a computed dynamic
    // import (mirroring src/cli/commands/college.ts).
    const tmp = mkdtempSync(join(tmpdir(), 'gen-trysession-'));
    try {
      const deptDir = join(tmp, 'math');
      mkdirSync(join(deptDir, 'try-sessions'), { recursive: true });
      writeFileSync(
        join(deptDir, 'DEPARTMENT.md'),
        '# Math\n\n## Wings\n\n- Arithmetic\n\n## Entry Point\n\nmath-count\n',
      );
      writeFileSync(join(deptDir, 'try-sessions', `${session.id}.ts`), source);

      const loaderUrl = pathToFileURL(
        join(process.cwd(), '.college', 'college', 'college-loader.ts'),
      ).href;
      const runnerUrl = pathToFileURL(
        join(process.cwd(), '.college', 'college', 'try-session-runner.ts'),
      ).href;
      const { CollegeLoader } = (await import(loaderUrl)) as {
        CollegeLoader: new (base: string) => object;
      };
      const { TrySessionRunner } = (await import(runnerUrl)) as {
        TrySessionRunner: {
          loadSession(loader: object, dept: string, id: string): Promise<{
            getState(): { title: string; totalSteps: number };
            getCurrentStep(): { conceptsExplored: string[] };
            getPrerequisites(): string[];
          }>;
        };
      };

      const loader = new CollegeLoader(tmp);
      const runner = await TrySessionRunner.loadSession(loader, 'math', session.id);
      const state = runner.getState();
      expect(state.totalSteps).toBe(CONCEPTS.length);
      expect(state.title).toBe(session.title);
      // First step must be the prerequisite root (math-count), proving ordering
      // survived the serialize -> load round-trip.
      expect(runner.getCurrentStep().conceptsExplored[0]).toBe('math-count');
      expect(runner.getPrerequisites()).toContain('ext-numbers');
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

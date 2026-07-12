import { describe, it, expect } from 'vitest';
import {
  DEFAULT_THRESHOLDS,
  diagnoseDepartment,
  buildDoctorReport,
  formatDoctorReport,
  gatherAuditInputs,
  type DepartmentAuditInput,
} from './department-doctor.js';

const healthy: DepartmentAuditInput = {
  id: 'zeta',
  name: 'Zeta',
  wings: [
    { id: 'w1', name: 'W1', conceptCount: 5 },
    { id: 'w2', name: 'W2', conceptCount: 4 },
  ],
  trySessionCount: 2,
  referencesState: 'populated',
};

const thin: DepartmentAuditInput = {
  id: 'alpha',
  name: 'Alpha',
  wings: [
    { id: 'a', name: 'A', conceptCount: 0 },
    { id: 'b', name: 'B', conceptCount: 1 },
  ],
  trySessionCount: 0,
  referencesState: 'missing',
};

describe('diagnoseDepartment', () => {
  it('scores a fully-covered department as healthy with no proposals', () => {
    const d = diagnoseDepartment(healthy);
    expect(d.score).toBe(1);
    expect(d.healthy).toBe(true);
    expect(d.flags).toEqual([]);
    expect(d.proposals).toEqual([]);
    expect(d.conceptCount).toBe(9);
    expect(d.conceptsPerWing).toBe(4.5);
  });

  it('flags every thin dimension and emits a proposal per gap', () => {
    const d = diagnoseDepartment(thin);
    expect(d.score).toBe(0);
    expect(d.healthy).toBe(false);
    // two thin wings + no try-sessions + missing references
    expect(d.flags).toContain('2 thin wing(s)');
    expect(d.flags).toContain('no try-sessions');
    expect(d.flags).toContain('references missing');
    const kinds = d.proposals.map((p) => p.kind).sort();
    expect(kinds).toEqual(['add-concepts', 'add-concepts', 'author-reference', 'author-try-session']);
    // deficit-scaled severity: empty wing (0 concepts) is more urgent than the 1-concept wing
    const addA = d.proposals.find((p) => p.wingId === 'a')!;
    const addB = d.proposals.find((p) => p.wingId === 'b')!;
    expect(addA.severity).toBe(3);
    expect(addB.severity).toBe(2);
  });

  it('honors a relaxed thresholds config', () => {
    const d = diagnoseDepartment(thin, {
      minConceptsPerWing: 1,
      minTrySessions: 0,
      requirePopulatedReferences: false,
    });
    // wing 'a' still has 0 (< 1), wing 'b' has 1 (>= 1); try/refs no longer required
    expect(d.flags).toEqual(['1 thin wing(s)']);
    expect(d.proposals).toHaveLength(1);
    expect(d.proposals[0].wingId).toBe('a');
  });

  it('treats empty (gitkeep-only) references as a gap', () => {
    const d = diagnoseDepartment({ ...healthy, referencesState: 'empty' });
    expect(d.healthy).toBe(false);
    expect(d.flags).toContain('references empty');
    expect(d.proposals.some((p) => p.kind === 'author-reference')).toBe(true);
  });
});

describe('buildDoctorReport', () => {
  it('ranks departments worst-first and proposals most-urgent-first', () => {
    const report = buildDoctorReport([healthy, thin]);
    expect(report.departments[0].id).toBe('alpha'); // worst first
    expect(report.departments[1].id).toBe('zeta');
    expect(report.flaggedCount).toBe(1);
    // top proposal is the emptiest wing (severity 3)
    expect(report.proposals[0].wingId).toBe('a');
    expect(report.proposals[0].severity).toBe(3);
    // severities are monotonically non-increasing
    const sev = report.proposals.map((p) => p.severity);
    expect(sev).toEqual([...sev].sort((x, y) => y - x));
  });

  it('handles the empty corpus', () => {
    const report = buildDoctorReport([]);
    expect(report.departments).toEqual([]);
    expect(report.proposals).toEqual([]);
    expect(report.flaggedCount).toBe(0);
    expect(formatDoctorReport(report)).toContain('No departments found');
  });
});

describe('formatDoctorReport', () => {
  it('renders a header, per-department lines, and ranked proposals', () => {
    const out = formatDoctorReport(buildDoctorReport([healthy, thin]));
    expect(out).toContain('1/2 department(s) flagged');
    expect(out).toContain('[FLAG] alpha');
    expect(out).toContain('[ok  ] zeta');
    expect(out).toContain('Ranked fill proposals');
    expect(out).toContain("add 3 concept(s) to wing 'a'");
  });
});

describe('gatherAuditInputs (fs adapter)', () => {
  it('reads summaries and references state from a stub loader', async () => {
    const loader = {
      listDepartments: () => ['alpha', 'zeta'],
      loadSummary: async (id: string) =>
        id === 'alpha'
          ? {
              id,
              name: 'Alpha',
              description: '',
              wings: [{ id: 'a', name: 'A', description: '', conceptCount: 0 }],
              entryPoint: '',
              trySessions: [],
              tokenCost: 0,
            }
          : {
              id,
              name: 'Zeta',
              description: '',
              wings: [{ id: 'w1', name: 'W1', description: '', conceptCount: 5 }],
              entryPoint: '',
              trySessions: [{ id: 's', name: 'S', estimatedDuration: '5 min' }],
              tokenCost: 0,
            },
      getDepartmentPath: () => '/nonexistent/path/that/does/not/exist',
    };
    const inputs = await gatherAuditInputs(loader);
    expect(inputs.map((i) => i.id)).toEqual(['alpha', 'zeta']);
    expect(inputs[0].wings[0].conceptCount).toBe(0);
    expect(inputs[1].trySessionCount).toBe(1);
    // no directory on disk -> missing
    expect(inputs[0].referencesState).toBe('missing');
    expect(DEFAULT_THRESHOLDS.minConceptsPerWing).toBe(3);
  });
});

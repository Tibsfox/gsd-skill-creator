import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  parseCollegeArgs,
  formatDepartmentList,
  collegeCommand,
  type DepartmentRow,
} from './college.js';

describe('parseCollegeArgs', () => {
  it('reads the subcommand and positional tail', () => {
    const r = parseCollegeArgs(['explore', 'mathematics/algebra']);
    expect(r.subcommand).toBe('explore');
    expect(r.positional).toEqual(['mathematics/algebra']);
    expect(r.to).toBeUndefined();
    expect(r.help).toBe(false);
  });

  it('captures --to <panel> without consuming it as positional', () => {
    const r = parseCollegeArgs(['translate', 'exponential-decay', '--to', 'graph']);
    expect(r.subcommand).toBe('translate');
    expect(r.positional).toEqual(['exponential-decay']);
    expect(r.to).toBe('graph');
  });

  it('captures --to=<panel> form', () => {
    const r = parseCollegeArgs(['translate', 'x', '--to=symbolic']);
    expect(r.to).toBe('symbolic');
    expect(r.positional).toEqual(['x']);
  });

  it('captures --topic and --wings for scaffold-department', () => {
    const r = parseCollegeArgs([
      'scaffold-department',
      'widgets',
      '--topic',
      'widget craft',
      '--wings=alpha,beta',
    ]);
    expect(r.subcommand).toBe('scaffold-department');
    expect(r.positional).toEqual(['widgets']);
    expect(r.topic).toBe('widget craft');
    expect(r.wings).toBe('alpha,beta');
  });

  it('flags help and ignores unknown dashed tokens', () => {
    const r = parseCollegeArgs(['list', '--help', '--bogus']);
    expect(r.subcommand).toBe('list');
    expect(r.help).toBe(true);
  });

  it('captures --json for doctor without consuming a positional', () => {
    const r = parseCollegeArgs(['doctor', '--json']);
    expect(r.subcommand).toBe('doctor');
    expect(r.json).toBe(true);
    expect(r.positional).toEqual([]);
  });

  it('returns undefined subcommand for an empty slice', () => {
    expect(parseCollegeArgs([]).subcommand).toBeUndefined();
  });
});

describe('formatDepartmentList', () => {
  it('renders a header count and one line per department', () => {
    const rows: DepartmentRow[] = [
      { id: 'math', name: 'Mathematics', wingCount: 3, conceptCount: 12, sessionCount: 2 },
      { id: 'chem', name: 'Chemistry', wingCount: 2, conceptCount: 8, sessionCount: 3 },
    ];
    const out = formatDepartmentList(rows);
    expect(out).toContain('Departments (2):');
    expect(out).toContain('math — Mathematics (3 wings, 12 concepts, 2 sessions)');
    expect(out).toContain('chem — Chemistry (2 wings, 8 concepts, 3 sessions)');
  });

  it('handles the empty case', () => {
    expect(formatDepartmentList([])).toContain('No departments found');
  });
});

describe('collegeCommand routing', () => {
  afterEach(() => vi.restoreAllMocks());

  it('prints help and exits 0 for no subcommand', async () => {
    const code = await collegeCommand([]);
    expect(code).toBe(0);
  });

  it('rejects an unknown subcommand with exit 1', async () => {
    const code = await collegeCommand(['frobnicate']);
    expect(code).toBe(1);
  });

  it('translate is a graceful no-op stub (deferred wiring)', async () => {
    const code = await collegeCommand(['translate', 'exponential-decay', '--to', 'graph']);
    expect(code).toBe(0);
  });

  it('scaffold-department without required flags exits 1', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await collegeCommand(['scaffold-department', 'my-dept']);
    expect(code).toBe(1);
  });

  it('list wires through to the real CollegeLoader and returns 0', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await collegeCommand(['list']);
    expect(code).toBe(0);
    const printed = spy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('Departments (');
  });

  it('doctor audits the real corpus and returns 0', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await collegeCommand(['doctor']);
    expect(code).toBe(0);
    const printed = spy.mock.calls.map((c) => String(c[0])).join('\n');
    expect(printed).toContain('Department doctor:');
  });

  it('doctor --json emits a parseable report with ranked proposals', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = await collegeCommand(['doctor', '--json']);
    expect(code).toBe(0);
    const printed = spy.mock.calls.map((c) => String(c[0])).join('\n');
    const report = JSON.parse(printed);
    expect(Array.isArray(report.departments)).toBe(true);
    expect(Array.isArray(report.proposals)).toBe(true);
    expect(typeof report.flaggedCount).toBe('number');
  });
});

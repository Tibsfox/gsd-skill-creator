import { describe, it, expect } from 'vitest';
import { parseIntelligenceArgs } from './intelligence.js';

describe('parseIntelligenceArgs', () => {
  it('reads the subcommand from the first positional', () => {
    expect(parseIntelligenceArgs(['mirror-findings']).subcommand).toBe('mirror-findings');
  });

  it('parses --project in both spaced and = forms', () => {
    expect(parseIntelligenceArgs(['mirror-findings', '--project', 'p1']).project).toBe('p1');
    expect(parseIntelligenceArgs(['mirror-findings', '--project=p2']).project).toBe('p2');
  });

  it('parses --registry and --json and --help', () => {
    const parsed = parseIntelligenceArgs(['mirror', '--registry=/tmp/reg.db', '--json', '-h']);
    expect(parsed.subcommand).toBe('mirror');
    expect(parsed.registry).toBe('/tmp/reg.db');
    expect(parsed.json).toBe(true);
    expect(parsed.help).toBe(true);
  });

  it('leaves options undefined when absent', () => {
    const parsed = parseIntelligenceArgs([]);
    expect(parsed.subcommand).toBeUndefined();
    expect(parsed.project).toBeUndefined();
    expect(parsed.json).toBe(false);
    expect(parsed.help).toBe(false);
  });
});

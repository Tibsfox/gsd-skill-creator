import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectVersion, parseChangelog, classifyFeatures, runChangelogWatch } from '../../src/retro/changelog-watch.js';
import { ChangelogWatchResultSchema } from '../../src/retro/types.js';
import type { ChangelogEntry } from '../../src/retro/types.js';

// Mock child_process at module level
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

import { execSync } from 'child_process';

const mockExecSync = vi.mocked(execSync);

describe('changelog-watch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectVersion', () => {
    it('parses claude --version output', () => {
      mockExecSync.mockReturnValue(Buffer.from('claude v2.1.5\n'));
      const version = detectVersion();
      expect(version).toBe('2.1.5');
    });

    it('handles missing claude CLI gracefully', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command not found: claude');
      });
      const version = detectVersion();
      expect(version).toBe('unknown');
    });
  });

  describe('parseChangelog', () => {
    it('extracts features from markdown changelog text', () => {
      const markdown = `
## v2.1.5

- **Agent Teams**: Multi-agent collaboration support is now available
- **Hook System**: Pre/post command hooks for workflow automation

## v2.1.0

- **Streaming API**: Real-time token streaming for better UX
- **Context Caching**: Reduced latency for repeated prompts
`;

      const entries = parseChangelog(markdown);

      expect(entries).toHaveLength(4);
      expect(entries[0].name).toBe('Agent Teams');
      expect(entries[1].name).toBe('Hook System');
      expect(entries[2].name).toBe('Streaming API');
      expect(entries[3].name).toBe('Context Caching');
    });
  });

  describe('classifyFeatures', () => {
    it('categorizes features into LEVERAGE_NOW / PLAN_FOR / WATCH', () => {
      const entries: ChangelogEntry[] = [
        {
          name: 'Agent Teams',
          classification: 'WATCH',
          impact: 'Available now with stable API support',
          action: '',
        },
        {
          name: 'MCP v2',
          classification: 'WATCH',
          impact: 'Currently in beta preview',
          action: '',
        },
        {
          name: 'Custom Training',
          classification: 'WATCH',
          impact: 'On the roadmap for future release',
          action: '',
        },
      ];

      const classified = classifyFeatures(entries);

      expect(classified[0].classification).toBe('LEVERAGE_NOW'); // "available" keyword
      expect(classified[1].classification).toBe('PLAN_FOR'); // "beta" + "preview" keywords
      expect(classified[2].classification).toBe('WATCH'); // "roadmap" keyword
    });

    it('uses keyword matching on feature descriptions', () => {
      const entries: ChangelogEntry[] = [
        {
          name: 'Shipped Feature',
          classification: 'WATCH',
          impact: 'This feature has SHIPPED and is GA',
          action: '',
        },
        {
          name: 'Experimental Thing',
          classification: 'WATCH',
          impact: 'Experimental feature for early access users',
          action: '',
        },
        {
          name: 'Unknown Feature',
          classification: 'WATCH',
          impact: 'Something completely new',
          action: '',
        },
      ];

      const classified = classifyFeatures(entries);

      // "shipped" + "ga" -> LEVERAGE_NOW
      expect(classified[0].classification).toBe('LEVERAGE_NOW');
      // "experimental" + "early access" -> PLAN_FOR
      expect(classified[1].classification).toBe('PLAN_FOR');
      // No matching keywords -> WATCH (default)
      expect(classified[2].classification).toBe('WATCH');
    });
  });

  describe('runChangelogWatch', () => {
    it('produces ChangelogWatchResult', () => {
      mockExecSync.mockReturnValue(Buffer.from('claude v2.1.5\n'));

      const changelogText = `
## v2.1.5

- **New Feature**: Now available and stable
`;

      const result = runChangelogWatch({
        versionStart: '2.0.0',
        changelogText,
      });

      // Validate against schema
      const parsed = ChangelogWatchResultSchema.parse(result);
      expect(parsed.version_start).toBe('2.0.0');
      expect(parsed.version_end).toBe('2.1.5');
      expect(parsed.features).toHaveLength(1);
      expect(parsed.checked_at).toBeTruthy();
    });
  });
});

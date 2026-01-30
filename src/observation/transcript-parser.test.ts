import { describe, it, expect } from 'vitest';
import { TranscriptParser } from './transcript-parser.js';

describe('TranscriptParser', () => {
  const parser = new TranscriptParser();

  describe('parseString', () => {
    it('should parse valid JSONL', () => {
      const content = `{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}
{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"assistant"}`;

      const entries = parser.parseString(content);
      expect(entries).toHaveLength(2);
      expect(entries[0].uuid).toBe('1');
      expect(entries[1].uuid).toBe('2');
    });

    it('should skip corrupted lines', () => {
      const content = `{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}
this is not valid json
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"user"}`;

      const entries = parser.parseString(content);
      expect(entries).toHaveLength(2);
      expect(entries[0].uuid).toBe('1');
      expect(entries[1].uuid).toBe('3');
    });

    it('should filter sidechain entries', () => {
      const content = `{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}
{"uuid":"2","parentUuid":"1","isSidechain":true,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"assistant"}
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"user"}`;

      const entries = parser.parseString(content);
      expect(entries).toHaveLength(2);
      expect(entries.some(e => e.isSidechain)).toBe(false);
    });

    it('should handle empty lines', () => {
      const content = `{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}

{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"assistant"}`;

      const entries = parser.parseString(content);
      expect(entries).toHaveLength(2);
    });
  });

  describe('filterToolUse', () => {
    it('should filter only tool_use entries', () => {
      const entries = parser.parseString(`
{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}
{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_use","tool_name":"Read"}
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"assistant"}
{"uuid":"4","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:03Z","type":"tool_use","tool_name":"Write"}
      `.trim());

      const toolUse = parser.filterToolUse(entries);
      expect(toolUse).toHaveLength(2);
      expect(toolUse.every(e => e.type === 'tool_use')).toBe(true);
    });
  });

  describe('extractFilePaths', () => {
    it('should extract read and written files', () => {
      const entries = parser.parseString(`
{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Read","tool_input":{"file_path":"/src/index.ts"}}
{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_use","tool_name":"Write","tool_input":{"file_path":"/src/output.ts"}}
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"tool_use","tool_name":"Edit","tool_input":{"file_path":"/src/config.ts"}}
{"uuid":"4","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:03Z","type":"tool_use","tool_name":"Read","tool_input":{"file_path":"/src/index.ts"}}
      `.trim());

      const files = parser.extractFilePaths(entries);
      expect(files.read).toEqual(['/src/index.ts']);
      expect(files.written).toContain('/src/output.ts');
      expect(files.written).toContain('/src/config.ts');
    });
  });

  describe('extractCommands', () => {
    it('should extract unique command names', () => {
      const entries = parser.parseString(`
{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Bash","tool_input":{"command":"git status"}}
{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_use","tool_name":"Bash","tool_input":{"command":"npm install"}}
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"tool_use","tool_name":"Bash","tool_input":{"command":"git add ."}}
{"uuid":"4","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:03Z","type":"tool_use","tool_name":"Read","tool_input":{"file_path":"/src/index.ts"}}
      `.trim());

      const commands = parser.extractCommands(entries);
      expect(commands).toContain('git');
      expect(commands).toContain('npm');
      expect(commands).toHaveLength(2);
    });
  });

  describe('extractToolCounts', () => {
    it('should count tool usage', () => {
      const entries = parser.parseString(`
{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Read"}
{"uuid":"2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_use","tool_name":"Read"}
{"uuid":"3","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"tool_use","tool_name":"Write"}
{"uuid":"4","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:03Z","type":"tool_use","tool_name":"Bash"}
      `.trim());

      const counts = parser.extractToolCounts(entries);
      expect(counts.get('Read')).toBe(2);
      expect(counts.get('Write')).toBe(1);
      expect(counts.get('Bash')).toBe(1);
    });
  });

  describe('getTopN', () => {
    it('should return top N items by frequency', () => {
      const counts = new Map<string, number>([
        ['Read', 5],
        ['Write', 3],
        ['Bash', 10],
        ['Edit', 1],
      ]);

      const top2 = parser.getTopN(counts, 2);
      expect(top2).toEqual(['Bash', 'Read']);
    });
  });
});

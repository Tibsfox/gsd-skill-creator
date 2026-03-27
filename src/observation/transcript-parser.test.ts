import { describe, it, expect } from 'vitest';
import { TranscriptParser } from './transcript-parser.js';
import type { ExecutionContext } from '../types/observation.js';

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

  describe('pairToolExecutions', () => {
    const defaultContext: ExecutionContext = { sessionId: 'sess-1' };

    it('should pair tool_use with matching tool_result by sequential ordering', () => {
      const content = [
        '{"uuid":"tu-1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Read","tool_input":{"file_path":"/src/foo.ts"}}',
        '{"uuid":"tr-1","parentUuid":"tu-1","isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_result","tool_use_id":"tu-1","tool_output":"file contents here"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toHaveLength(1);
      expect(pairs[0].status).toBe('complete');
      expect(pairs[0].toolName).toBe('Read');
      expect(pairs[0].output).toContain('file contents here');
      expect(pairs[0].outputHash).not.toBeNull();
      expect(pairs[0].outputHash).toHaveLength(64);
      expect(pairs[0].context.sessionId).toBe('sess-1');
    });

    it('should create partial pair when tool_use has no matching tool_result', () => {
      const content = [
        '{"uuid":"tu-2","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Bash","tool_input":{"command":"npm test"}}',
        '{"uuid":"u-1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"user"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toHaveLength(1);
      expect(pairs[0].status).toBe('partial');
      expect(pairs[0].output).toBeNull();
      expect(pairs[0].outputHash).toBeNull();
    });

    it('should pair multiple tool executions in sequence', () => {
      const content = [
        '{"uuid":"tu-a","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Read","tool_input":{"file_path":"/a.ts"}}',
        '{"uuid":"tr-a","parentUuid":"tu-a","isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_result","tool_use_id":"tu-a","tool_output":"content A"}',
        '{"uuid":"tu-b","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"tool_use","tool_name":"Write","tool_input":{"file_path":"/b.ts"}}',
        '{"uuid":"tr-b","parentUuid":"tu-b","isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:03Z","type":"tool_result","tool_use_id":"tu-b","tool_output":"content B"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toHaveLength(2);
      expect(pairs[0].toolName).toBe('Read');
      expect(pairs[0].output).toBe('content A');
      expect(pairs[0].status).toBe('complete');
      expect(pairs[1].toolName).toBe('Write');
      expect(pairs[1].output).toBe('content B');
      expect(pairs[1].status).toBe('complete');
    });

    it('should handle interleaved entries between tool_use and tool_result', () => {
      const content = [
        '{"uuid":"tu-x","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_name":"Bash","tool_input":{"command":"ls"}}',
        '{"uuid":"a-1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"assistant","message":{"role":"assistant","content":"listing files"}}',
        '{"uuid":"tr-x","parentUuid":"tu-x","isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:02Z","type":"tool_result","tool_use_id":"tu-x","tool_output":"file1 file2"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toHaveLength(1);
      expect(pairs[0].status).toBe('complete');
      expect(pairs[0].output).toBe('file1 file2');
    });

    it('should handle tool_use with no tool_name gracefully', () => {
      const content = [
        '{"uuid":"tu-no-name","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"tool_use","tool_input":{"file_path":"/x.ts"}}',
        '{"uuid":"tr-no-name","parentUuid":"tu-no-name","isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"tool_result","tool_use_id":"tu-no-name","tool_output":"result"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toHaveLength(1);
      expect(pairs[0].toolName).toBe('unknown');
    });

    it('should return empty array for entries with no tool_use', () => {
      const content = [
        '{"uuid":"u-1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user"}',
        '{"uuid":"a-1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:01Z","type":"assistant"}',
      ].join('\n');

      const entries = parser.parseString(content);
      const pairs = parser.pairToolExecutions(entries, defaultContext);

      expect(pairs).toEqual([]);
    });
  });
});

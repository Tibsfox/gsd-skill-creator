import { describe, it, expect } from 'vitest';
import { TranscriptParser } from './transcript-parser.js';
import type { ExecutionContext } from '../types/observation.js';

// ---------------------------------------------------------------------------
// Helpers shared across extractActiveSkills tests
// ---------------------------------------------------------------------------

/** Build a JSONL line for an assistant entry with one Skill tool_use block */
function skillEntry(uuid: string, skill: string, isSidechain = false): string {
  return JSON.stringify({
    uuid,
    parentUuid: null,
    isSidechain,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'assistant',
    message: {
      role: 'assistant',
      content: [
        { type: 'text', text: 'invoking a skill' },
        { type: 'tool_use', name: 'Skill', input: { skill } },
      ],
    },
  });
}

/** Build a JSONL line for a user entry whose message.content is a plain string
 *  containing one <command-name> tag (real transcript invocation shape). */
function commandEntry(uuid: string, commandName: string): string {
  return JSON.stringify({
    uuid,
    parentUuid: null,
    isSidechain: false,
    sessionId: 's1',
    timestamp: '2026-01-30T12:00:00Z',
    type: 'user',
    message: {
      role: 'user',
      content: `<command-name>${commandName}</command-name>\n            <command-message>${commandName.replace('/', '')}</command-message>\n            <command-args></command-args>`,
    },
  });
}

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

  describe('extractActiveSkills', () => {
    // Skills surface in two forms:
    //   1. Skill tool_use blocks nested in message.content[] (assistant entries) — 5.1b
    //   2. <command-name> tags in user-message string content (slash-command activations) — 5.1c

    it('mines distinct skill names from nested Skill tool_use blocks in insertion order', () => {
      const entries = parser.parseString(
        [skillEntry('1', 'context-handoff'), skillEntry('2', 'graphify'), skillEntry('3', 'context-handoff')].join('\n'),
      );
      // Insertion order: context-handoff first (uuid 1), graphify second (uuid 2)
      expect(parser.extractActiveSkills(entries)).toEqual(['context-handoff', 'graphify']);
    });

    it('excludes sidechain (sub-agent) skill invocations', () => {
      // parseString drops isSidechain entries, so their skills never count.
      const entries = parser.parseString(
        [skillEntry('1', 'main-skill'), skillEntry('2', 'subagent-skill', true)].join('\n'),
      );
      expect(parser.extractActiveSkills(entries)).toEqual(['main-skill']);
    });

    it('ignores non-Skill tool_use blocks and entries without content arrays', () => {
      const content = [
        JSON.stringify({
          uuid: '1', parentUuid: null, isSidechain: false, sessionId: 's1',
          timestamp: '2026-01-30T12:00:00Z', type: 'assistant',
          message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/a.ts' } }] },
        }),
        skillEntry('3', 'real-skill'),
      ].join('\n');
      const entries = parser.parseString(content);
      expect(parser.extractActiveSkills(entries)).toEqual(['real-skill']);
    });

    it('excludes empty and whitespace-only skill names (guards the byte-identity invariant)', () => {
      // Mutation guard: dropping the `.trim()` filter would let '' / '   ' leak
      // into the skill set and break the flag-off byte-identical contract.
      const entries = parser.parseString(
        [skillEntry('1', ''), skillEntry('2', '   '), skillEntry('3', 'kept')].join('\n'),
      );
      expect(parser.extractActiveSkills(entries)).toEqual(['kept']);
    });

    it('returns an empty array when no skills were activated', () => {
      const entries = parser.parseString(
        '{"uuid":"1","parentUuid":null,"isSidechain":false,"sessionId":"s1","timestamp":"2026-01-30T12:00:00Z","type":"user","message":{"role":"user","content":"hi"}}',
      );
      expect(parser.extractActiveSkills(entries)).toEqual([]);
    });

    // -----------------------------------------------------------------------
    // 5.1c: <command-name> tag extraction
    // -----------------------------------------------------------------------

    it('extracts command-name tags from user-message string content, stripping leading slash', () => {
      const entries = parser.parseString(
        [commandEntry('1', '/gsd-progress'), commandEntry('2', '/sc:status')].join('\n'),
      );
      expect(parser.extractActiveSkills(entries)).toEqual(['gsd-progress', 'sc:status']);
    });

    it('excludes denylisted builtins from command-name tags (case-insensitive)', () => {
      // /model and /clear are on the denylist
      const entries = parser.parseString(
        [commandEntry('1', '/model'), commandEntry('2', '/CLEAR'), commandEntry('3', '/gsd-progress')].join('\n'),
      );
      expect(parser.extractActiveSkills(entries)).toEqual(['gsd-progress']);
    });

    it('deduplicates across both sources and preserves insertion order', () => {
      // Fixture: Skill block 'context-handoff', command-name '/gsd-progress',
      // command-name '/gsd-progress' (duplicate), Skill block 'context-handoff' (dup),
      // denylisted '/model' — expect exactly 2 results in insertion order
      const lines = [
        skillEntry('1', 'context-handoff'),        // source 1 — first occurrence
        commandEntry('2', '/gsd-progress'),          // source 2 — first occurrence
        commandEntry('3', '/gsd-progress'),          // duplicate → skip
        skillEntry('4', 'context-handoff'),          // duplicate → skip
        commandEntry('5', '/model'),                 // denylisted → skip
      ];
      const entries = parser.parseString(lines.join('\n'));
      expect(parser.extractActiveSkills(entries)).toEqual(['context-handoff', 'gsd-progress']);
    });

    it('full fixture: 2 distinct command-name tags + 1 Skill block + 1 denylisted + 1 duplicate → 3 activeSkills', () => {
      // Canonical verify-test from design doc § Component C
      const lines = [
        skillEntry('1', 'gsd-workflow'),              // Skill tool_use → 'gsd-workflow'
        commandEntry('2', '/gsd-progress'),            // command-name → 'gsd-progress'
        commandEntry('3', '/sc:status'),               // namespaced command → 'sc:status'
        commandEntry('4', '/model'),                   // denylisted builtin → excluded
        commandEntry('5', '/gsd-progress'),            // duplicate of uuid-2 → excluded
      ];
      const entries = parser.parseString(lines.join('\n'));
      const skills = parser.extractActiveSkills(entries);
      expect(skills).toHaveLength(3);
      expect(skills).toEqual(['gsd-workflow', 'gsd-progress', 'sc:status']);
    });

    it('flag-off (empty entries): returns []', () => {
      // When mineActiveSkills=false the caller passes [] directly and never
      // calls extractActiveSkills; but calling it on an empty array is safe.
      expect(parser.extractActiveSkills([])).toEqual([]);
    });

    it('COMMAND_NAME_DENYLIST is exported and contains expected builtins', () => {
      const dl = TranscriptParser.COMMAND_NAME_DENYLIST;
      for (const builtin of ['model', 'effort', 'clear', 'help', 'config', 'workflows',
        'fast', 'login', 'logout', 'status', 'compact', 'resume', 'cost', 'exit', 'quit']) {
        expect(dl.has(builtin), `expected '${builtin}' in denylist`).toBe(true);
      }
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

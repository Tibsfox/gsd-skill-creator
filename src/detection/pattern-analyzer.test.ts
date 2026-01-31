import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { PatternAnalyzer } from './pattern-analyzer.js';
import { SessionObservation } from '../types/observation.js';

describe('PatternAnalyzer', () => {
  const testDir = join(tmpdir(), `pattern-analyzer-test-${Date.now()}`);
  const sessionsFile = join(testDir, 'sessions.jsonl');

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  function createSession(overrides: Partial<SessionObservation>): SessionObservation {
    return {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      startTime: Date.now() - 60000,
      endTime: Date.now(),
      durationMinutes: 1,
      source: 'startup',
      reason: 'logout',
      metrics: {
        userMessages: 1,
        assistantMessages: 1,
        toolCalls: 1,
        uniqueFilesRead: 1,
        uniqueFilesWritten: 0,
        uniqueCommandsRun: 1,
      },
      topCommands: [],
      topFiles: [],
      topTools: [],
      activeSkills: [],
      ...overrides,
    };
  }

  describe('analyzeFromSessions', () => {
    it('should identify commands exceeding threshold', () => {
      const analyzer = new PatternAnalyzer({ threshold: 3 });

      const sessions = [
        createSession({ topCommands: ['prisma', 'migrate'] }),
        createSession({ topCommands: ['prisma', 'generate'] }),
        createSession({ topCommands: ['prisma', 'studio'] }),
        createSession({ topCommands: ['vitest'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);

      // 'prisma' appears 3 times, should be suggested
      const prismaCandidate = candidates.find(c => c.pattern === 'prisma');
      expect(prismaCandidate).toBeDefined();
      expect(prismaCandidate!.occurrences).toBe(3);
      expect(prismaCandidate!.type).toBe('command');
    });

    it('should filter common commands', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = [
        createSession({ topCommands: ['git', 'npm', 'prisma'] }),
        createSession({ topCommands: ['git', 'npm', 'prisma'] }),
        createSession({ topCommands: ['git', 'npm', 'prisma'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);

      // git and npm should be filtered, only prisma suggested
      expect(candidates.find(c => c.pattern === 'git')).toBeUndefined();
      expect(candidates.find(c => c.pattern === 'npm')).toBeUndefined();
      expect(candidates.find(c => c.pattern === 'prisma')).toBeDefined();
    });

    it('should respect threshold configuration', () => {
      const analyzer = new PatternAnalyzer({ threshold: 5 });

      const sessions = [
        createSession({ topCommands: ['vitest'] }),
        createSession({ topCommands: ['vitest'] }),
        createSession({ topCommands: ['vitest'] }),
        createSession({ topCommands: ['vitest'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);

      // vitest appears 4 times, threshold is 5
      expect(candidates.find(c => c.pattern === 'vitest')).toBeUndefined();
    });

    it('should track co-occurring files', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = [
        createSession({
          topCommands: ['prisma'],
          topFiles: ['/src/db/schema.prisma', '/src/db/client.ts'],
        }),
        createSession({
          topCommands: ['prisma'],
          topFiles: ['/src/db/schema.prisma', '/src/db/migrations/'],
        }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);
      const prismaCandidate = candidates.find(c => c.pattern === 'prisma');

      expect(prismaCandidate).toBeDefined();
      expect(prismaCandidate!.evidence.coOccurringFiles).toContain('/src/db/schema.prisma');
    });

    it('should generate meaningful skill names', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = [
        createSession({ topCommands: ['docker-compose'] }),
        createSession({ topCommands: ['docker-compose'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'docker-compose');

      expect(candidate).toBeDefined();
      expect(candidate!.suggestedName).toBe('docker-compose-workflow');
      expect(candidate!.id).toBe('com-docker-compose');
    });

    it('should calculate confidence based on occurrences', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = Array.from({ length: 10 }, () =>
        createSession({ topCommands: ['kubectl'] })
      );

      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'kubectl');

      expect(candidate).toBeDefined();
      // 10 occurrences / 10 = 1.0 base, capped at 0.7 base + recency boost
      expect(candidate!.confidence).toBeGreaterThan(0.5);
      expect(candidate!.confidence).toBeLessThanOrEqual(1);
    });

    it('should limit number of suggestions', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2, maxSuggestions: 3 });

      // Create 5 different patterns, each appearing twice
      const patterns = ['terraform', 'ansible', 'kubectl', 'helm', 'pulumi'];
      const sessions = patterns.flatMap(cmd => [
        createSession({ topCommands: [cmd] }),
        createSession({ topCommands: [cmd] }),
      ]);

      const candidates = analyzer.analyzeFromSessions(sessions);

      expect(candidates.length).toBeLessThanOrEqual(3);
    });

    it('should include evidence with timestamps and session IDs', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = [
        createSession({ sessionId: 'session-1', topCommands: ['terraform'] }),
        createSession({ sessionId: 'session-2', topCommands: ['terraform'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'terraform');

      expect(candidate).toBeDefined();
      expect(candidate!.evidence.sessionIds).toContain('session-1');
      expect(candidate!.evidence.sessionIds).toContain('session-2');
      expect(candidate!.evidence.firstSeen).toBeLessThanOrEqual(candidate!.evidence.lastSeen);
    });
  });

  describe('analyze (file-based)', () => {
    it('should stream and analyze sessions from JSONL file', async () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const sessions = [
        createSession({ topCommands: ['make'] }),
        createSession({ topCommands: ['make'] }),
        createSession({ topCommands: ['make'] }),
      ];

      // Write as Pattern format (timestamp, category, data)
      const lines = sessions.map(s => JSON.stringify({
        timestamp: Date.now(),
        category: 'sessions',
        data: s,
      }));
      await writeFile(sessionsFile, lines.join('\n') + '\n');

      const candidates = await analyzer.analyze(sessionsFile);

      expect(candidates.find(c => c.pattern === 'make')).toBeDefined();
    });

    it('should return empty array for missing file', async () => {
      const analyzer = new PatternAnalyzer();
      const candidates = await analyzer.analyze('/nonexistent/sessions.jsonl');
      expect(candidates).toEqual([]);
    });

    it('should skip corrupted lines', async () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      const content = `{"timestamp":${Date.now()},"category":"sessions","data":${JSON.stringify(createSession({ topCommands: ['cargo'] }))}}
this is not valid json
{"timestamp":${Date.now()},"category":"sessions","data":${JSON.stringify(createSession({ topCommands: ['cargo'] }))}}`;

      await writeFile(sessionsFile, content);

      const candidates = await analyzer.analyze(sessionsFile);

      // Should still find 'cargo' from valid lines
      expect(candidates.find(c => c.pattern === 'cargo')).toBeDefined();
    });
  });

  describe('tool detection', () => {
    it('should identify recurring tool usage', () => {
      const analyzer = new PatternAnalyzer({ threshold: 3 });

      const sessions = [
        createSession({ topTools: ['WebFetch', 'Read', 'Bash'] }),
        createSession({ topTools: ['WebFetch', 'Read', 'Write'] }),
        createSession({ topTools: ['WebFetch', 'Read', 'Bash'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);

      // WebFetch appears 3 times and is not common
      const webFetchCandidate = candidates.find(c => c.pattern === 'WebFetch');
      expect(webFetchCandidate).toBeDefined();
      expect(webFetchCandidate!.type).toBe('tool');

      // Read and Bash are common tools, should not be suggested
      expect(candidates.find(c => c.pattern === 'Read')).toBeUndefined();
      expect(candidates.find(c => c.pattern === 'Bash')).toBeUndefined();
    });
  });

  describe('description generation', () => {
    it('should generate descriptions with Use when pattern', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });
      const sessions = [
        createSession({ topCommands: ['prisma'] }),
        createSession({ topCommands: ['prisma'] }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'prisma');

      expect(candidate).toBeDefined();
      expect(candidate!.suggestedDescription).toContain('Use when');
      expect(candidate!.suggestedDescription).toContain('prisma');
    });

    it('should include file context in description triggers', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });
      const sessions = [
        createSession({
          topCommands: ['prisma'],
          topFiles: ['/src/schema.prisma'],
        }),
        createSession({
          topCommands: ['prisma'],
          topFiles: ['/src/schema.prisma'],
        }),
      ];

      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'prisma');

      expect(candidate!.suggestedDescription).toMatch(/editing.*schema\.prisma/i);
    });

    it('should generate type-specific capability statements', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      // Command type
      const commandSessions = [
        createSession({ topCommands: ['docker'] }),
        createSession({ topCommands: ['docker'] }),
      ];
      const commandCandidates = analyzer.analyzeFromSessions(commandSessions);
      const commandCandidate = commandCandidates.find(c => c.pattern === 'docker');
      expect(commandCandidate!.suggestedDescription).toContain('Workflow for running docker commands');

      // Tool type
      const toolSessions = [
        createSession({ topTools: ['WebFetch'] }),
        createSession({ topTools: ['WebFetch'] }),
      ];
      const toolCandidates = analyzer.analyzeFromSessions(toolSessions);
      const toolCandidate = toolCandidates.find(c => c.pattern === 'WebFetch');
      expect(toolCandidate!.suggestedDescription).toContain('Guide for using WebFetch tool');
    });

    it('should generate type-specific trigger phrases', () => {
      const analyzer = new PatternAnalyzer({ threshold: 2 });

      // Command type should have "running X commands" trigger
      const sessions = [
        createSession({ topCommands: ['terraform'] }),
        createSession({ topCommands: ['terraform'] }),
      ];
      const candidates = analyzer.analyzeFromSessions(sessions);
      const candidate = candidates.find(c => c.pattern === 'terraform');

      expect(candidate!.suggestedDescription).toMatch(/running terraform commands/i);
      expect(candidate!.suggestedDescription).toMatch(/setting up terraform/i);
    });
  });
});

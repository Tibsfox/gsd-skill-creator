import { describe, it, expect } from 'vitest';
import { shouldForkContext, suggestAgent } from './context-fork-detection.js';

describe('Context Fork Detection (SPEC-05)', () => {
  describe('shouldForkContext', () => {
    // HIGH confidence triggers in description
    it('returns shouldFork=true for "research" in description with investigation steps', () => {
      const result = shouldForkContext(
        'Research best practices for TypeScript project structure',
        '1. Investigate current patterns\n2. Analyze alternatives\n3. Summarize findings',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
      expect(result.reason).toBeDefined();
    });

    it('returns shouldFork=true for "analyze" in description with multi-step investigation', () => {
      const result = shouldForkContext(
        'Analyze codebase for performance bottlenecks',
        '1. Profile critical paths\n2. Examine hot loops\n3. Investigate memory usage',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('returns shouldFork=true for "analysis" in description', () => {
      const result = shouldForkContext(
        'Deep analysis of dependency tree vulnerabilities',
        'Examine each dependency for known CVEs.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('returns shouldFork=true for "audit" in description with deep-dive steps', () => {
      const result = shouldForkContext(
        'Security audit of authentication module',
        '1. Deep dive into auth flows\n2. Check token handling\n3. Review permission checks',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('returns shouldFork=true for "investigate" in description', () => {
      const result = shouldForkContext(
        'Investigate why builds are failing on CI',
        'Check logs and trace the failure.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('returns shouldFork=true for "deep dive" in description', () => {
      const result = shouldForkContext(
        'Deep dive into database query performance',
        'Analyze query plans and execution times.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    // NOT triggers (too common/generic)
    it('returns shouldFork=false for "review" (too generic)', () => {
      const result = shouldForkContext(
        'Review pull request changes',
        'Check code style and correctness.',
      );
      expect(result.shouldFork).toBe(false);
    });

    it('returns shouldFork=false for "commit" (not research)', () => {
      const result = shouldForkContext(
        'Commit changes with proper message',
        'Stage files and create commit.',
      );
      expect(result.shouldFork).toBe(false);
    });

    it('returns shouldFork=false for "deploy" (not research)', () => {
      const result = shouldForkContext(
        'Deploy application to production',
        'Run deployment pipeline.',
      );
      expect(result.shouldFork).toBe(false);
    });

    // MEDIUM confidence triggers in body
    it('returns shouldFork=true when body mentions "spawn a subagent"', () => {
      const result = shouldForkContext(
        'Process the task',
        'To handle this, spawn a subagent that will investigate the issue in isolation.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    it('returns shouldFork=true when body mentions "run in isolation"', () => {
      const result = shouldForkContext(
        'Handle the request',
        'This task should run in isolation to avoid polluting the main context.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('medium');
    });

    // Edge cases
    it('returns shouldFork=false for empty description and body', () => {
      const result = shouldForkContext('', '');
      expect(result.shouldFork).toBe(false);
    });

    it('returns shouldFork=true for "comprehensive audit" (high confidence)', () => {
      const result = shouldForkContext(
        'Comprehensive audit of the API surface',
        'Review all endpoints.',
      );
      expect(result.shouldFork).toBe(true);
      expect(result.confidence).toBe('high');
    });

    it('returns shouldFork=false for "check" (too common)', () => {
      const result = shouldForkContext(
        'Check if tests pass',
        'Run the test suite.',
      );
      expect(result.shouldFork).toBe(false);
    });

    it('returns shouldFork=false for "test" (testing, not research)', () => {
      const result = shouldForkContext(
        'Test the new feature',
        'Write unit tests and run them.',
      );
      expect(result.shouldFork).toBe(false);
    });
  });

  describe('suggestAgent', () => {
    it('suggests "research-agent" for research-type skills', () => {
      const result = suggestAgent(
        'Research TypeScript patterns',
        'Investigate best practices.',
      );
      expect(result).toBe('research-agent');
    });

    it('suggests "analysis-agent" for analysis-type skills', () => {
      const result = suggestAgent(
        'Analyze code performance',
        'Profile and examine bottlenecks.',
      );
      expect(result).toBe('analysis-agent');
    });

    it('suggests "security-agent" for security-related skills', () => {
      const result = suggestAgent(
        'Security audit of the authentication system',
        'Deep dive into auth flows.',
      );
      expect(result).toBe('security-agent');
    });

    it('returns null for non-fork skills', () => {
      const result = suggestAgent(
        'Deploy application',
        'Run the deployment pipeline.',
      );
      expect(result).toBeNull();
    });

    it('suggests "task-agent" as default for fork skills without specific type', () => {
      const result = suggestAgent(
        'Deep dive into module structure',
        'Examine the architecture.',
      );
      expect(result).toBe('task-agent');
    });
  });
});

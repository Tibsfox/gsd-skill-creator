import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { SessionObservation } from '../types/observation.js';
import {
  SkillCandidate,
  FrequencyMap,
  DetectionConfig,
  PatternEvidence,
  DEFAULT_DETECTION_CONFIG,
} from '../types/detection.js';

// Common dev commands that aren't skill-worthy on their own
const COMMON_COMMANDS = new Set([
  'git', 'npm', 'node', 'npx', 'pnpm', 'yarn', 'bun',
  'ls', 'cd', 'cat', 'echo', 'pwd', 'mkdir', 'rm', 'cp', 'mv',
  'grep', 'find', 'which', 'head', 'tail', 'wc', 'sort', 'uniq',
  'curl', 'wget', 'ssh', 'scp',
]);

export class PatternAnalyzer {
  private config: DetectionConfig;

  constructor(config?: Partial<DetectionConfig>) {
    this.config = { ...DEFAULT_DETECTION_CONFIG, ...config };
  }

  /**
   * Stream sessions from JSONL file and identify skill candidates
   * Memory-efficient: only keeps counts, not full sessions
   */
  async analyze(sessionsPath: string): Promise<SkillCandidate[]> {
    const freq = await this.countPatterns(sessionsPath);
    return this.extractCandidates(freq);
  }

  /**
   * Analyze sessions from an array (for testing)
   */
  analyzeFromSessions(sessions: SessionObservation[]): SkillCandidate[] {
    const freq = this.countPatternsFromSessions(sessions);
    return this.extractCandidates(freq);
  }

  /**
   * Stream JSONL and build frequency maps
   */
  private async countPatterns(path: string): Promise<FrequencyMap> {
    const freq = this.initFrequencyMap();

    try {
      const fileStream = createReadStream(path, { encoding: 'utf8' });
      const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const entry = JSON.parse(line);
          // Handle both Pattern wrapper and raw SessionObservation
          const session: SessionObservation = entry.data || entry;
          this.processSession(freq, session);
        } catch {
          // Skip corrupted lines
        }
      }
    } catch (err) {
      // File doesn't exist or can't be read - return empty freq
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }

    return freq;
  }

  /**
   * Count patterns from session array (for testing)
   */
  private countPatternsFromSessions(sessions: SessionObservation[]): FrequencyMap {
    const freq = this.initFrequencyMap();
    for (const session of sessions) {
      this.processSession(freq, session);
    }
    return freq;
  }

  /**
   * Initialize empty frequency map
   */
  private initFrequencyMap(): FrequencyMap {
    return {
      commands: new Map(),
      files: new Map(),
      tools: new Map(),
      coOccurrences: new Map(),
      sessionTimestamps: new Map(),
      sessionIds: new Map(),
    };
  }

  /**
   * Process a single session into frequency maps
   */
  private processSession(freq: FrequencyMap, session: SessionObservation): void {
    const timestamp = session.endTime || Date.now();
    const sessionId = session.sessionId;

    // Count commands (filter common ones)
    for (const cmd of session.topCommands || []) {
      if (!this.isCommonCommand(cmd)) {
        const key = `cmd:${cmd}`;
        freq.commands.set(cmd, (freq.commands.get(cmd) ?? 0) + 1);
        this.trackPatternMeta(freq, key, timestamp, sessionId);

        // Track co-occurrences with files
        if (!freq.coOccurrences.has(key)) {
          freq.coOccurrences.set(key, new Set());
        }
        for (const file of session.topFiles || []) {
          freq.coOccurrences.get(key)!.add(file);
        }
      }
    }

    // Count files
    for (const file of session.topFiles || []) {
      const key = `file:${file}`;
      freq.files.set(file, (freq.files.get(file) ?? 0) + 1);
      this.trackPatternMeta(freq, key, timestamp, sessionId);
    }

    // Count tools
    for (const tool of session.topTools || []) {
      const key = `tool:${tool}`;
      freq.tools.set(tool, (freq.tools.get(tool) ?? 0) + 1);
      this.trackPatternMeta(freq, key, timestamp, sessionId);

      // Track co-occurrences with files
      if (!freq.coOccurrences.has(key)) {
        freq.coOccurrences.set(key, new Set());
      }
      for (const file of session.topFiles || []) {
        freq.coOccurrences.get(key)!.add(file);
      }
    }
  }

  /**
   * Track timestamps and session IDs for a pattern
   */
  private trackPatternMeta(
    freq: FrequencyMap,
    key: string,
    timestamp: number,
    sessionId: string
  ): void {
    if (!freq.sessionTimestamps.has(key)) {
      freq.sessionTimestamps.set(key, []);
    }
    freq.sessionTimestamps.get(key)!.push(timestamp);

    if (!freq.sessionIds.has(key)) {
      freq.sessionIds.set(key, []);
    }
    const ids = freq.sessionIds.get(key)!;
    if (!ids.includes(sessionId)) {
      ids.push(sessionId);
    }
  }

  /**
   * Extract candidates that exceed threshold
   */
  private extractCandidates(freq: FrequencyMap): SkillCandidate[] {
    const candidates: SkillCandidate[] = [];
    const now = Date.now();
    const recencyMs = this.config.recencyDays * 24 * 60 * 60 * 1000;

    // Process commands
    for (const [cmd, count] of freq.commands) {
      if (count >= this.config.threshold) {
        const key = `cmd:${cmd}`;
        const candidate = this.createCandidate('command', cmd, count, key, freq, now, recencyMs);
        candidates.push(candidate);
      }
    }

    // Process tools (excluding common ones like Read, Write, Bash)
    for (const [tool, count] of freq.tools) {
      if (count >= this.config.threshold && !this.isCommonTool(tool)) {
        const key = `tool:${tool}`;
        const candidate = this.createCandidate('tool', tool, count, key, freq, now, recencyMs);
        candidates.push(candidate);
      }
    }

    // Sort by confidence (descending) and limit
    return candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxSuggestions);
  }

  /**
   * Create a skill candidate from frequency data
   */
  private createCandidate(
    type: 'command' | 'file' | 'tool' | 'workflow',
    pattern: string,
    occurrences: number,
    key: string,
    freq: FrequencyMap,
    now: number,
    recencyMs: number
  ): SkillCandidate {
    const timestamps = freq.sessionTimestamps.get(key) || [];
    const sessionIds = freq.sessionIds.get(key) || [];
    const coFiles = Array.from(freq.coOccurrences.get(key) || []).slice(0, 5);
    const coTools = type === 'command' ? this.findCoOccurringTools(pattern, freq) : [];

    // Calculate recency-weighted confidence
    const recentCount = timestamps.filter(t => (now - t) < recencyMs).length;
    const recencyBoost = recentCount > 0 ? Math.min(recentCount / occurrences, 0.3) : 0;
    const baseConfidence = Math.min(occurrences / 10, 0.7);
    const confidence = Math.min(baseConfidence + recencyBoost, 1);

    const evidence: PatternEvidence = {
      firstSeen: Math.min(...timestamps),
      lastSeen: Math.max(...timestamps),
      sessionIds: sessionIds.slice(-10),
      coOccurringFiles: coFiles,
      coOccurringTools: coTools,
    };

    return {
      id: `${type.slice(0, 3)}-${this.slugify(pattern)}`,
      type,
      pattern,
      occurrences,
      confidence,
      suggestedName: this.generateSkillName(type, pattern),
      suggestedDescription: this.generateDescription(type, pattern, occurrences, coFiles),
      evidence,
    };
  }

  /**
   * Find tools that co-occur with a command
   */
  private findCoOccurringTools(cmd: string, freq: FrequencyMap): string[] {
    const result: string[] = [];
    for (const [tool] of freq.tools) {
      if (!this.isCommonTool(tool)) {
        result.push(tool);
      }
    }
    return result.slice(0, 5);
  }

  /**
   * Check if command is too common to suggest
   */
  private isCommonCommand(cmd: string): boolean {
    return COMMON_COMMANDS.has(cmd.toLowerCase());
  }

  /**
   * Check if tool is too common to suggest
   */
  private isCommonTool(tool: string): boolean {
    const common = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep', 'Task'];
    return common.includes(tool);
  }

  /**
   * Generate a skill name from pattern
   */
  private generateSkillName(type: string, pattern: string): string {
    const slug = this.slugify(pattern);
    return `${slug}-${type === 'command' ? 'workflow' : 'guide'}`;
  }

  /**
   * Generate description with activation-friendly "Use when" pattern.
   * Based on official Claude Code skill documentation.
   */
  private generateDescription(
    type: string,
    pattern: string,
    _occurrences: number,
    coFiles: string[]
  ): string {
    // Capability statement based on type
    const capabilities: Record<string, string> = {
      command: `Workflow for running ${pattern} commands`,
      tool: `Guide for using ${pattern} tool`,
      file: `Patterns for working with ${pattern} files`,
      workflow: `Multi-step workflow involving ${pattern}`,
    };
    const capability = capabilities[type] || `Guide for ${pattern}`;

    // Generate trigger phrases from type and context
    const triggers: string[] = [];
    switch (type) {
      case 'command':
        triggers.push(`running ${pattern} commands`);
        triggers.push(`setting up ${pattern}`);
        break;
      case 'tool':
        triggers.push(`using ${pattern}`);
        triggers.push(`working with ${pattern} tool`);
        break;
      case 'file':
        triggers.push(`editing ${pattern} files`);
        triggers.push(`working with ${pattern}`);
        break;
      default:
        triggers.push(`working with ${pattern}`);
    }

    // Add file context if available
    if (coFiles.length > 0) {
      const fileTypes = coFiles.slice(0, 2).map(f => f.split('/').pop()).join(' or ');
      triggers.push(`editing ${fileTypes}`);
    }

    return `${capability}. Use when ${triggers.slice(0, 3).join(', ')}.`;
  }

  /**
   * Convert pattern to URL-safe slug
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }
}

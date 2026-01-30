import { join } from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { TranscriptParser } from './transcript-parser.js';
import { PatternSummarizer } from './pattern-summarizer.js';
import { RetentionManager } from './retention-manager.js';
import { PatternStore } from '../storage/pattern-store.js';
import { SessionObservation, RetentionConfig } from '../types/observation.js';

export interface SessionStartData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  source: 'startup' | 'resume' | 'clear' | 'compact';
  model: string;
  startTime: number;
}

export interface SessionEndData {
  sessionId: string;
  transcriptPath: string;
  cwd: string;
  reason: 'clear' | 'logout' | 'prompt_input_exit' | 'other';
  activeSkills?: string[];  // Skills that were active during the session
}

export class SessionObserver {
  private parser: TranscriptParser;
  private summarizer: PatternSummarizer;
  private retentionManager: RetentionManager;
  private patternStore: PatternStore;
  private cacheDir: string;

  constructor(
    patternsDir: string = '.planning/patterns',
    retentionConfig?: Partial<RetentionConfig>
  ) {
    this.parser = new TranscriptParser();
    this.summarizer = new PatternSummarizer();
    this.retentionManager = new RetentionManager(retentionConfig);
    this.patternStore = new PatternStore(patternsDir);
    this.cacheDir = patternsDir;
  }

  /**
   * Handle SessionStart event - cache session info for later use
   */
  async onSessionStart(data: SessionStartData): Promise<void> {
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(data), 'utf-8');
  }

  /**
   * Handle SessionEnd event - parse, summarize, store, prune
   */
  async onSessionEnd(data: SessionEndData): Promise<SessionObservation | null> {
    // Load session start cache
    const cacheFile = join(this.cacheDir, '.session-cache.json');
    let startData: SessionStartData;
    try {
      const cached = await readFile(cacheFile, 'utf-8');
      startData = JSON.parse(cached);
    } catch {
      // No cache, use defaults
      startData = {
        sessionId: data.sessionId,
        transcriptPath: data.transcriptPath,
        cwd: data.cwd,
        source: 'startup',
        model: 'unknown',
        startTime: Date.now() - 60000, // Assume 1 min ago
      };
    }

    // Parse transcript
    const entries = await this.parser.parse(data.transcriptPath);

    if (entries.length === 0) {
      return null; // Empty session, nothing to observe
    }

    // Summarize session
    const summary = this.summarizer.summarize(
      entries,
      data.sessionId,
      startData.startTime,
      Date.now(),
      startData.source,
      data.reason,
      data.activeSkills || []
    );

    // Store in pattern store (extend PatternCategory with 'sessions')
    await this.patternStore.append('sessions' as any, summary as unknown as Record<string, unknown>);

    // Prune old patterns
    const sessionsFile = join(this.cacheDir, 'sessions.jsonl');
    await this.retentionManager.prune(sessionsFile);

    return summary;
  }
}

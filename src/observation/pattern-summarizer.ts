import type { TranscriptEntry, SessionObservation } from '../types/observation.js';
import { TranscriptParser } from './transcript-parser.js';

export class PatternSummarizer {
  private parser: TranscriptParser;

  constructor() {
    this.parser = new TranscriptParser();
  }

  /**
   * Summarize a session from transcript entries
   * Token-efficient: stores counts and top-N items, not full content
   */
  summarize(
    entries: TranscriptEntry[],
    sessionId: string,
    startTime: number,
    endTime: number,
    source: SessionObservation['source'],
    reason: SessionObservation['reason'],
    activeSkills: string[] = []
  ): SessionObservation {
    // Calculate metrics
    const userMessages = entries.filter(
      e => e.type === 'user' || e.message?.role === 'user'
    ).length;
    const assistantMessages = entries.filter(
      e => e.type === 'assistant' || e.message?.role === 'assistant'
    ).length;
    const toolCalls = entries.filter(e => e.type === 'tool_use').length;

    // Extract file paths using parser helper
    const { read, written } = this.parser.extractFilePaths(entries);

    // Extract commands using parser helper
    const commands = this.parser.extractCommands(entries);

    // Get top tools (by frequency)
    const toolFreq = this.countFrequency(
      entries.filter(e => e.type === 'tool_use').map(e => e.tool_name || 'unknown')
    );

    return {
      sessionId,
      startTime,
      endTime,
      durationMinutes: Math.round((endTime - startTime) / 60000),
      source,
      reason,
      metrics: {
        userMessages,
        assistantMessages,
        toolCalls,
        uniqueFilesRead: new Set(read).size,
        uniqueFilesWritten: new Set(written).size,
        uniqueCommandsRun: new Set(commands).size,
      },
      topCommands: this.topN(commands, 5),
      topFiles: this.topN([...read, ...written], 10),
      topTools: Object.entries(toolFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name),
      activeSkills,
    };
  }

  private countFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private topN(items: string[], n: number): string[] {
    const freq = this.countFrequency(items);
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([item]) => item);
  }
}

export function summarizeSession(
  entries: TranscriptEntry[],
  sessionId: string,
  startTime: number,
  endTime: number,
  source: SessionObservation['source'],
  reason: SessionObservation['reason'],
  activeSkills: string[] = []
): SessionObservation {
  const summarizer = new PatternSummarizer();
  return summarizer.summarize(entries, sessionId, startTime, endTime, source, reason, activeSkills);
}

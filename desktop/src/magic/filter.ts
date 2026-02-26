/**
 * MagicFilter: gates IPC events by current magic level.
 *
 * Sits between IPC events and the CLI Chat renderer.
 * Events below the current level threshold are filtered out.
 * Chat messages from Claude always pass through.
 *
 * @module magic/filter
 */

import {
  MagicLevel,
  EVENT_VISIBILITY,
  DEFAULT_MAGIC_LEVEL,
} from './types';
import type { DisplayEvent, VisualIndicator } from './types';

export interface IpcEvent {
  type: string;
  payload: Record<string, unknown>;
  summary?: string;
  content?: string;
  source?: string;
}

export class MagicFilter {
  private level: MagicLevel;

  constructor(initialLevel?: MagicLevel) {
    this.level = initialLevel ?? DEFAULT_MAGIC_LEVEL;
  }

  /** Returns true if this event should be rendered at the current level. */
  shouldRender(eventType: string): boolean {
    const minLevel = EVENT_VISIBILITY[eventType] ?? MagicLevel.ANNOTATED;
    return this.level >= minLevel;
  }

  /** Transform event for display at current level. Returns null if filtered. */
  transform(event: IpcEvent): DisplayEvent | null {
    if (!this.shouldRender(event.type)) return null;

    switch (this.level) {
      case MagicLevel.FULL_MAGIC:
        return this.toVisualOnly(event);
      case MagicLevel.GUIDED:
        return this.toSummary(event);
      case MagicLevel.ANNOTATED:
        return this.toAnnotated(event);
      case MagicLevel.VERBOSE:
        return this.toFull(event, false);
      case MagicLevel.NO_MAGIC:
        return this.toFull(event, true);
      default:
        return this.toAnnotated(event);
    }
  }

  setLevel(level: MagicLevel): void {
    this.level = level;
  }

  getLevel(): MagicLevel {
    return this.level;
  }

  /** Level 1: Visual indicators only. Chat messages pass through as text. */
  private toVisualOnly(event: IpcEvent): DisplayEvent {
    if (event.type.startsWith('chat:')) {
      return { type: event.type, payload: event.payload, renderMode: 'text' };
    }
    return {
      type: event.type,
      payload: event.payload,
      renderMode: 'visual',
      visual: this.mapToVisual(event),
    };
  }

  /** Level 2: Claude-narrated summary. */
  private toSummary(event: IpcEvent): DisplayEvent {
    return {
      type: event.type,
      payload: event.payload,
      renderMode: 'text',
      content: event.summary || event.content,
    };
  }

  /** Level 3: Key output + annotations. */
  private toAnnotated(event: IpcEvent): DisplayEvent {
    return {
      type: event.type,
      payload: event.payload,
      renderMode: 'text',
    };
  }

  /** Level 4-5: Everything. showRaw=true at level 5 only. */
  private toFull(event: IpcEvent, showRaw: boolean): DisplayEvent {
    return {
      type: event.type,
      payload: event.payload,
      renderMode: 'text',
      showRaw,
    };
  }

  private mapToVisual(event: IpcEvent): VisualIndicator {
    return {
      type:
        event.type.includes('error') || event.type.includes('failed')
          ? 'flash'
          : event.type.includes('complete') || event.type.includes('online')
            ? 'fill'
            : 'pulse',
      color:
        event.type.includes('error') || event.type.includes('failed')
          ? 'red'
          : event.type.includes('complete') || event.type.includes('online')
            ? 'green'
            : 'amber',
      target:
        event.source ||
        ((event.payload as Record<string, unknown>).service_id as string) ||
        'general',
    };
  }
}

/**
 * Willow engine — progressive disclosure and humane interface.
 *
 * Wraps muse output at the user's depth level.
 * Three reading speeds: glance (≤80ch), scan (≤500ch), read (full).
 * Never guilts. Always welcomes.
 */

import type { DisclosureLevel, WillowContext, WillowRendering, WillowGreeting } from './willow-types.js';
import type { MergedResult } from './muse-forking.js';

const GLANCE_KEYWORDS = ['summarize', 'brief', 'quick', 'short', 'tldr'];
const READ_KEYWORDS = ['detail', 'explain', 'deep', 'full', 'expand'];

const NEXT_LEVEL: Record<DisclosureLevel, DisclosureLevel | null> = {
  glance: 'scan',
  scan: 'read',
  read: null,
};

export class WillowEngine {
  inferDepth(context: WillowContext): DisclosureLevel {
    // Explicit user preference overrides session-based inference
    if (context.preferredStyle) {
      const style = context.preferredStyle.toLowerCase();
      if (GLANCE_KEYWORDS.some(kw => style.includes(kw))) return 'glance';
      if (READ_KEYWORDS.some(kw => style.includes(kw))) return 'read';
    }

    if (context.sessionCount < 4) return 'glance';
    if (context.sessionCount <= 20) return 'scan';
    return 'read';
  }

  render(output: string, level: DisclosureLevel): WillowRendering {
    switch (level) {
      case 'glance': return this.renderGlance(output);
      case 'scan': return this.renderScan(output);
      case 'read': return this.renderRead(output);
    }
  }

  greet(context: WillowContext): WillowGreeting {
    if (context.sessionCount <= 1 || !context.lastSeen) {
      return { message: 'Welcome! Here\'s what\'s available.', contextHint: 'First visit — everything is new.' };
    }

    const now = new Date();
    const last = new Date(context.lastSeen);
    const daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince < 1) {
      return { message: 'Back again. Here\'s where you left off.', contextHint: 'Continuing from earlier today.' };
    }
    if (daysSince <= 7) {
      return { message: 'Welcome back. A few things happened while you were away.', contextHint: 'Some updates since your last visit.' };
    }
    return { message: 'Welcome back. Here\'s a quick catch-up.', contextHint: 'Here\'s what\'s new since you were last here.' };
  }

  wrapMergedResult(result: MergedResult, level: DisclosureLevel): WillowRendering {
    return this.render(result.content, level);
  }

  expand(rendering: WillowRendering): WillowRendering | null {
    const next = NEXT_LEVEL[rendering.level];
    if (!next) return null;

    // Re-render at deeper level using stored content as base
    // For expand, we reconstruct from the content we have
    return this.render(rendering.content, next);
  }

  private renderGlance(output: string): WillowRendering {
    // Extract first sentence or truncate to 80 chars
    const firstSentence = output.split(/[.!?]/)[0];
    let content = firstSentence.length <= 77 ? firstSentence : output.slice(0, 77);
    if (content.length < output.length) content = content.trimEnd() + '...';
    if (content.length > 80) content = content.slice(0, 77) + '...';

    return {
      level: 'glance',
      content,
      expandable: true,
      expandHint: 'More detail available',
    };
  }

  private renderScan(output: string): WillowRendering {
    let content = output;
    if (content.length > 500) {
      content = content.slice(0, 497) + '...';
    }

    return {
      level: 'scan',
      content,
      expandable: content.length < output.length,
      expandHint: content.length < output.length ? 'Full detail available' : null,
    };
  }

  private renderRead(output: string): WillowRendering {
    return {
      level: 'read',
      content: output,
      expandable: false,
      expandHint: null,
    };
  }
}

/**
 * Willow engine — progressive disclosure and humane interface.
 *
 * Wraps muse output at the user's depth level.
 * Never guilts. Always welcomes.
 */

import type { DisclosureLevel, WillowContext, WillowRendering, WillowGreeting } from './willow-types.js';
import type { MergedResult } from './muse-forking.js';

export class WillowEngine {
  inferDepth(_context: WillowContext): DisclosureLevel {
    throw new Error('Not implemented');
  }

  render(_output: string, _level: DisclosureLevel): WillowRendering {
    throw new Error('Not implemented');
  }

  greet(_context: WillowContext): WillowGreeting {
    throw new Error('Not implemented');
  }

  wrapMergedResult(_result: MergedResult, _level: DisclosureLevel): WillowRendering {
    throw new Error('Not implemented');
  }

  expand(_rendering: WillowRendering): WillowRendering | null {
    throw new Error('Not implemented');
  }
}

#!/usr/bin/env node
// Auto-restore work state on session start
// Called by SessionStart hook - loads previous session context
// Invokes: skill-creator orchestrator work-state restore

const { execSync } = require('child_process');

const MEMORY_RELEVANCE_ENABLED = process.env.GSD_MEMORY_RELEVANCE === '1';

function loadPassive() {
  try {
    const result = execSync(
      'npx skill-creator orchestrator work-state restore --pretty',
      { cwd: process.cwd(), timeout: 10000, encoding: 'utf-8' }
    );
    if (result && result.trim()) {
      process.stdout.write(result);
    }
  } catch (e) {
    // Silent failure -- don't block session start
  }
}

if (MEMORY_RELEVANCE_ENABLED) {
  try {
    // Relevance-gated memory load (Wave 2A, Platform Alignment).
    // Loader is implemented in src/memory/memory-loader.ts; wiring here is
    // intentionally a no-op pass-through until the MEMORY.md reader (follow-up)
    // is built. The feature flag is live so the code path can be smoke-tested
    // without changing session-start behavior.
    loadPassive();
  } catch (e) {
    loadPassive();
  }
} else {
  loadPassive();
}

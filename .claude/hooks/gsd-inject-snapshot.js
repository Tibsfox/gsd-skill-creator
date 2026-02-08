#!/usr/bin/env node
// Inject latest session snapshot as context on session start
// Called by SessionStart hook - provides narrative continuity
// Invokes: skill-creator orchestrator snapshot latest --format=context

import { execSync } from 'child_process';

try {
  const result = execSync(
    'npx skill-creator orchestrator snapshot latest --format=context',
    { cwd: process.cwd(), timeout: 10000, encoding: 'utf-8' }
  );
  if (result && result.trim()) {
    // Output to stdout for SessionStart context injection
    process.stdout.write(result.trim());
  }
} catch (e) {
  // Silent failure -- don't block session start
}

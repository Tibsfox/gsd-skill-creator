#!/usr/bin/env node
// Auto-restore work state on session start
// Called by SessionStart hook - loads previous session context
// Invokes: skill-creator orchestrator work-state restore

import { execSync } from 'child_process';

try {
  const result = execSync(
    'npx skill-creator orchestrator work-state restore --pretty',
    { cwd: process.cwd(), timeout: 10000, encoding: 'utf-8' }
  );
  // Output to stdout for SessionStart context injection
  if (result && result.trim()) {
    process.stdout.write(result);
  }
} catch (e) {
  // Silent failure -- don't block session start
}

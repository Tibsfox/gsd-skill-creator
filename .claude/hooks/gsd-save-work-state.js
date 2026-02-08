#!/usr/bin/env node
// Auto-save work state on session end
// Called by SessionEnd hook - persists active task, skills, and checkpoint
// Invokes: skill-creator orchestrator work-state save

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Read hook input from stdin (Claude Code provides session context as JSON)
let input = '';
try {
  input = readFileSync('/dev/stdin', 'utf-8');
} catch (e) {}

let parsed = {};
try { parsed = JSON.parse(input); } catch (e) {}

const sessionId = parsed.session_id || 'unknown';
const cwd = parsed.cwd || process.cwd();

try {
  execSync(
    `npx skill-creator orchestrator work-state save --session-id=${sessionId}`,
    { cwd, timeout: 10000, stdio: 'ignore' }
  );
} catch (e) {
  // Silent failure -- never block session exit
}

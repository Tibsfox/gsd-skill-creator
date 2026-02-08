#!/usr/bin/env node
// Auto-generate session snapshot on session end
// Called by SessionEnd hook - captures summary, files modified, open questions
// Invokes: skill-creator orchestrator snapshot generate

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
const transcriptPath = parsed.transcript_path || '';
const cwd = parsed.cwd || process.cwd();

// Skip if no transcript available (e.g., /clear with no history)
if (!transcriptPath) process.exit(0);

try {
  execSync(
    `npx skill-creator orchestrator snapshot generate --session-id=${sessionId} --transcript-path="${transcriptPath}"`,
    { cwd, timeout: 10000, stdio: 'ignore' }
  );
} catch (e) {
  // Silent failure -- never block session exit
}

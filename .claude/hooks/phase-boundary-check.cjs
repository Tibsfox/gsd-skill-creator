#!/usr/bin/env node
// phase-boundary-check.js — PostToolUse hook: detect .planning/ file writes
// Outputs a reminder when planning files are modified.
'use strict';

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const file = (data.tool_input && data.tool_input.file_path) || '';
    const normalized = file.replace(/\\/g, '/');

    if (normalized.includes('.planning/') || normalized.startsWith('.planning/')) {
      console.log(`.planning/ file modified: ${file}`);
      console.log('Check: Does this phase transition trigger any skill-creator hooks?');
      console.log('Check: Should STATE.md be updated?');
    }
  } catch {
    // Parse error — ignore
  }

  process.exit(0);
});

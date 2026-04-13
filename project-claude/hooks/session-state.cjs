#!/usr/bin/env node
// session-state.js — SessionStart hook: inject project state reminder
// Outputs STATE.md head on every session start for orientation.
'use strict';

const fs = require('fs');
const path = require('path');

console.log('## Project State Reminder');
console.log('');

const statePath = path.join(process.cwd(), '.planning', 'STATE.md');
if (fs.existsSync(statePath)) {
  console.log('STATE.md exists - check for blockers and current phase.');
  const content = fs.readFileSync(statePath, 'utf-8');
  const lines = content.split('\n').slice(0, 20);
  console.log(lines.join('\n'));
} else {
  console.log('No .planning/ found - suggest /gsd:new-project if starting new work.');
}

console.log('');

const configPath = path.join(process.cwd(), '.planning', 'config.json');
if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`Config: "mode": "${config.mode || 'unknown'}"`);
  } catch {
    console.log('Config: "mode": "unknown"');
  }
}

process.exit(0);

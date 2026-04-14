#!/usr/bin/env node
// validate-commit.js — PreToolUse hook: enforce Conventional Commits format
// Blocks git commit commands with non-conforming messages (exit 2).
// Allows conforming messages and all non-commit commands (exit 0).
'use strict';

let input = '';
process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cmd = (data.tool_input && data.tool_input.command) || '';

    // Only check git commit commands
    if (!/^git\s+commit/.test(cmd)) {
      process.exit(0);
    }

    // Extract message from -m flag
    let msg = '';
    // Double-quoted -m
    const dq = cmd.match(/-m\s+"([^"]*)"/);
    if (dq) msg = dq[1];
    // Single-quoted -m
    if (!msg) {
      const sq = cmd.match(/-m\s+'([^']*)'/);
      if (sq) msg = sq[1];
    }
    // Heredoc pattern: -m "$(cat <<'EOF'\n...)"
    if (!msg) {
      const hd = cmd.match(/-m\s+"\$\(cat <<'EOF'\s*\n([^\n]*)/);
      if (hd) msg = hd[1].trim();
    }

    if (msg) {
      const subject = msg.split('\n')[0];
      const pattern = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)(\(.+\))?: .{1,72}$/;
      if (!pattern.test(subject)) {
        console.log(JSON.stringify({
          decision: 'block',
          reason: 'Commit message must follow Conventional Commits: <type>(<scope>): <subject>. Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore. Subject must be <=72 chars, lowercase, imperative mood, no trailing period.',
        }));
        process.exit(2);
      }

      // Wave commit marker validation (warning only)
      const bodyLines = msg.split('\n').slice(1);
      const waveLines = bodyLines.filter((l) => /^Wave\s/.test(l));
      if (waveLines.length > 0) {
        let prevWave = 0;
        let formatOk = true;
        for (const line of waveLines) {
          const m = line.match(/^Wave (\d+): .+/);
          if (!m) {
            formatOk = false;
          } else {
            const num = parseInt(m[1], 10);
            if (num <= prevWave && prevWave > 0) formatOk = false;
            prevWave = num;
          }
        }
        if (!formatOk) {
          process.stderr.write('[WARNING] Wave commit markers should follow format: Wave <number>: <description> (numbers sequential)\n');
        }
      }
    }
  } catch {
    // Parse error — allow the command
  }

  process.exit(0);
});

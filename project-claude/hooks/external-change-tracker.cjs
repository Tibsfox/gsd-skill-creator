#!/usr/bin/env node
'use strict';

/**
 * FileChanged hook — detects external file modifications (VS Code edits,
 * linter reformats, git checkout/merge/rebase, cross-session edits) and
 * emits targeted guidance about which subsystem was touched.
 *
 * Five cases handled explicitly; anything else produces no output (no cost).
 *
 * Safety: silent exit 0 on any error.
 */

const path = require('path');
const { runHook, emit } = require('./lib/hook-output.cjs');

function extractFilePath(input) {
  if (!input) return '';
  if (typeof input.file_path === 'string') return input.file_path;
  if (input.tool_input && typeof input.tool_input.file_path === 'string') {
    return input.tool_input.file_path;
  }
  if (typeof input.path === 'string') return input.path;
  return '';
}

function normalize(p) {
  if (!p) return '';
  return p.replace(/\\/g, '/');
}

function buildMessages(filePath, cwd) {
  const messages = [];
  const norm = normalize(filePath);
  const cwdNorm = normalize(cwd);

  // Case 1: .claude/skills/<name>/SKILL.md
  const skillMatch = norm.match(/\.claude\/skills\/([^/]+)\/SKILL\.md$/);
  if (skillMatch) {
    const skillName = skillMatch[1];
    messages.push(
      `Skill \`${skillName}\` was modified outside this session. If relevant to current work, re-read its SKILL.md.`
    );
  }

  // Case 2: .planning/*
  if (/\.planning\//.test(norm)) {
    const base = path.basename(norm);
    messages.push(
      `GSD state file \`${base}\` was modified outside this session. Cached knowledge may be outdated — re-read before workflow decisions.`
    );
  }

  // Case 3: .claude/settings.json
  if (/\.claude\/settings\.json$/.test(norm)) {
    messages.push(
      'Hook configuration changed. New hooks may be active or existing hooks removed.'
    );
  }

  // Case 4: project-root CLAUDE.md
  const projectClaudeMd = cwdNorm
    ? normalize(path.join(cwdNorm, 'CLAUDE.md'))
    : '';
  if (projectClaudeMd && norm === projectClaudeMd) {
    messages.push(
      'Project instructions (CLAUDE.md) were modified. Re-read for updated directives.'
    );
  } else if (!cwdNorm && /(^|\/)CLAUDE\.md$/.test(norm) && !/\.claude\//.test(norm)) {
    messages.push(
      'Project instructions (CLAUDE.md) were modified. Re-read for updated directives.'
    );
  }

  // Case 5: src/** or desktop/** (but not SKILL.md already caught)
  const srcMatch = norm.match(/(?:^|\/)((?:src|desktop)\/[^\s]+)$/);
  if (srcMatch && !skillMatch) {
    messages.push(
      `Source file \`${srcMatch[1]}\` was modified outside this session. If you were editing it, re-read before further changes to avoid conflicts.`
    );
  }

  return messages;
}

runHook((input) => {
  const filePath = extractFilePath(input);
  if (!filePath) return;
  const cwd = input.cwd || '';
  const messages = buildMessages(filePath, cwd);
  if (messages.length === 0) return;
  emit('FileChanged', messages.join('\n\n'));
});

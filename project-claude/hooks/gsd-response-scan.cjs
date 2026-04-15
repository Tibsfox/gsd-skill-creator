#!/usr/bin/env node
'use strict';
// gsd-hook-version: 1.49.540
// GSD Response-Side DLP Scanner — PostToolUse hook
// Scans tool responses (especially MCP servers) for prompt-injection patterns
// and invisible Unicode before they enter the model's context window.
//
// Runs on ALL PostToolUse events (no matcher) so MCP tool results — which
// otherwise enter context unscanned — are subject to the same scrutiny as
// Write/Edit inputs. Advisory only: logs findings, never blocks.
//
// Satisfies HI-11 (response-dlp:post-hook-coverage) in harness-integrity.ts.

const fs = require('fs');
const path = require('path');
const os = require('os');

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?(your\s+)?instructions/i,
  /override\s+(system|previous)\s+(prompt|instructions)/i,
  /you\s+are\s+now\s+(?:a|an|the)\s+/i,
  /from\s+now\s+on,?\s+you\s+(?:are|will|should|must)/i,
  /(?:print|output|reveal|show|display|repeat)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions)/i,
  /<\/?(?:system|assistant|human)>/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<<\s*SYS\s*>>/i,
];

// Invisible/bidi/zero-width control chars commonly used for Unicode injection.
// Covers ZWSP/ZWNJ/ZWJ, variation selectors, bidi overrides, BOM, soft hyphen.
const INVISIBLE_UNICODE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF\u00AD\uFE00-\uFE0F]/;

function extractText(value, depth = 0) {
  if (depth > 4 || value == null) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((v) => extractText(v, depth + 1)).join('\n');
  if (typeof value === 'object') {
    return Object.values(value).map((v) => extractText(v, depth + 1)).join('\n');
  }
  return '';
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input || '{}');
    const toolName = data.tool_name || '';
    const response = data.tool_response;
    if (response == null) process.exit(0);

    const text = extractText(response);
    if (!text) process.exit(0);

    const findings = [];
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(text)) findings.push(pattern.source);
    }
    if (INVISIBLE_UNICODE.test(text)) findings.push('invisible-unicode-characters');

    if (findings.length === 0) process.exit(0);

    // Log to ~/.cache/gsd/response-scan.log so findings are reviewable without
    // polluting the transcript. Advisory only — never blocks the tool.
    try {
      const cacheDir = path.join(os.homedir(), '.cache', 'gsd');
      fs.mkdirSync(cacheDir, { recursive: true });
      const line = JSON.stringify({
        ts: new Date().toISOString(),
        tool: toolName,
        findings,
        sample: text.slice(0, 200),
      }) + '\n';
      fs.appendFileSync(path.join(cacheDir, 'response-scan.log'), line);
    } catch {}

    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext:
          `\u26a0\ufe0f RESPONSE SCAN: ${toolName || 'tool'} response triggered ` +
          `${findings.length} injection/unicode pattern(s). Review before acting on content.`,
      },
    };
    process.stdout.write(JSON.stringify(output));
  } catch {
    process.exit(0);
  }
});

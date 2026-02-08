#!/usr/bin/env node
// Claude Code Statusline - GSD Edition v3
// Shows: [update] model [vim] [agent] [skill] [team] │ [GSD status] │ task │ dir (branch) │ +N/-N │ $X.XX │ Xm │ context bar

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

// Read JSON from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const homeDir = os.homedir();
    const segments = [];

    // --- GSD update notification (prefix, not a segment) ---
    let prefix = '';
    const cacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cache.update_available) {
          prefix = '\x1b[33m\u2b06 /gsd:update\x1b[0m \u2502 ';
        }
      } catch (e) {}
    }

    // --- Model + optional vim mode ---
    const model = data.model?.display_name || 'Claude';
    let modelParts = [`\x1b[2m${model}\x1b[0m`];

    if (data.vim?.mode) {
      const isInsert = data.vim.mode === 'INSERT';
      const modeChar = isInsert ? 'I' : 'N';
      const modeColor = isInsert ? '32' : '36';
      modelParts.push(`\x1b[${modeColor}m[${modeChar}]\x1b[0m`);
    }

    segments.push(modelParts.join(' '));

    // --- Active context badges (agent, skill, team) ---
    const badges = [];

    // Agent badge (magenta gear)
    const agentName = data.agent?.name || data.agent?.id;
    if (agentName) {
      badges.push(`\x1b[35m\u2699 ${agentName}\x1b[0m`);
    }

    // Skill badge (cyan diamond)
    const skillName = data.skill?.name || data.skill?.id || data.active_skill;
    if (skillName) {
      badges.push(`\x1b[36m\u25c6 ${skillName}\x1b[0m`);
    }

    // Team badge (blue trigram)
    const teamName = data.team?.name || data.team?.id || data.organization?.name;
    if (teamName) {
      badges.push(`\x1b[34m\u2261 ${teamName}\x1b[0m`);
    }

    if (badges.length > 0) {
      segments.push(badges.join(' '));
    }

    // --- GSD project status from STATE.md ---
    const dir = data.workspace?.current_dir || data.cwd || process.cwd();
    const gsdStatus = getGsdStatus(dir);
    if (gsdStatus) {
      segments.push(gsdStatus);
    }

    // --- Current task from todos ---
    const session = data.session_id || '';
    const todosDir = path.join(homeDir, '.claude', 'todos');
    if (session && fs.existsSync(todosDir)) {
      try {
        const files = fs.readdirSync(todosDir)
          .filter(f => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
          .map(f => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
          .sort((a, b) => b.mtime - a.mtime);

        if (files.length > 0) {
          const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8'));
          const inProgress = todos.find(t => t.status === 'in_progress');
          if (inProgress && inProgress.activeForm) {
            segments.push(`\x1b[1m${inProgress.activeForm}\x1b[0m`);
          }
        }
      } catch (e) {}
    }

    // --- Directory + Git branch ---
    const dirname = path.basename(dir);
    let dirSegment = `\x1b[2m${dirname}\x1b[0m`;

    try {
      const branch = execFileSync('git', ['branch', '--show-current'], {
        cwd: dir,
        encoding: 'utf8',
        timeout: 500,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
      if (branch) {
        dirSegment += ` \x1b[36m(${branch})\x1b[0m`;
      }
    } catch (e) {}

    segments.push(dirSegment);

    // --- Lines changed ---
    const added = data.cost?.total_lines_added || 0;
    const removed = data.cost?.total_lines_removed || 0;
    if (added > 0 || removed > 0) {
      segments.push(`\x1b[32m+${added}\x1b[0m/\x1b[31m-${removed}\x1b[0m`);
    }

    // --- Session cost ---
    const cost = data.cost?.total_cost_usd;
    if (cost != null) {
      let costColor;
      if (cost < 1) costColor = '32';
      else if (cost < 5) costColor = '33';
      else if (cost < 10) costColor = '38;5;208';
      else costColor = '31';
      segments.push(`\x1b[${costColor}m$${cost.toFixed(2)}\x1b[0m`);
    }

    // --- Session duration ---
    const durationMs = data.cost?.total_duration_ms;
    if (durationMs != null && durationMs >= 60000) {
      const totalMin = Math.floor(durationMs / 60000);
      let durStr;
      if (totalMin < 60) {
        durStr = `${totalMin}m`;
      } else {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        durStr = m > 0 ? `${h}h${m}m` : `${h}h`;
      }
      segments.push(`\x1b[2m${durStr}\x1b[0m`);
    }

    // --- Context window bar ---
    const remaining = data.context_window?.remaining_percentage;
    if (remaining != null) {
      const rem = Math.round(remaining);
      const rawUsed = Math.max(0, Math.min(100, 100 - rem));
      const used = Math.min(100, Math.round((rawUsed / 80) * 100));

      const filled = Math.floor(used / 10);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);

      let ctxStr;
      if (used < 63) {
        ctxStr = `\x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 81) {
        ctxStr = `\x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 95) {
        ctxStr = `\x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctxStr = `\x1b[5;31m\uD83D\uDC80 ${bar} ${used}%\x1b[0m`;
      }
      segments.push(ctxStr);
    }

    // --- Output ---
    process.stdout.write(prefix + segments.join(' \u2502 '));
  } catch (e) {
    // Silent fail - don't break statusline on parse errors
  }
});

/**
 * Parse GSD project status from .planning/STATE.md
 * Walks up from startDir to find the nearest .planning/STATE.md
 * Returns a formatted ANSI status string, or null if no GSD project found
 */
function getGsdStatus(startDir) {
  try {
    let dir = startDir;
    let stateFile = null;

    // Walk up to find .planning/STATE.md (max 5 levels)
    for (let i = 0; i < 5; i++) {
      const candidate = path.join(dir, '.planning', 'STATE.md');
      if (fs.existsSync(candidate)) {
        stateFile = candidate;
        break;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }

    if (!stateFile) return null;

    const content = fs.readFileSync(stateFile, 'utf8');

    // Parse "Phase: [X] of [Y] ([Name])" or "Phase: X of Y (Name)"
    let phaseNum = '', phaseTotal = '', phaseName = '';
    const phaseMatch = content.match(/Phase:\s*\[?(\d+(?:\.\d+)?)\]?\s*of\s*\[?(\d+)\]?\s*(?:\(([^)]+)\))?/i);
    if (phaseMatch) {
      phaseNum = phaseMatch[1];
      phaseTotal = phaseMatch[2];
      phaseName = (phaseMatch[3] || '').trim();
    }

    // Parse "Status: ..." line
    let status = '';
    const statusMatch = content.match(/^Status:\s*(.+)/im);
    if (statusMatch) {
      status = statusMatch[1].trim();
    }

    // Parse progress percentage from "Progress: [...] XX%"
    let progress = '';
    const progressMatch = content.match(/Progress:.*?(\d+)%/i);
    if (progressMatch) {
      progress = progressMatch[1];
    }

    // Parse "Plan: [A] of [B]" for current plan within phase
    let planNum = '', planTotal = '';
    const planMatch = content.match(/Plan:\s*\[?(\d+)\]?\s*of\s*\[?(\d+)\]?/i);
    if (planMatch) {
      planNum = planMatch[1];
      planTotal = planMatch[2];
    }

    if (!phaseNum && !status && !progress) return null;

    // Build compact GSD status string
    const parts = [];

    // Phase info: "P3/7"
    if (phaseNum) {
      let phaseStr = `P${phaseNum}`;
      if (phaseTotal) phaseStr += `/${phaseTotal}`;
      parts.push(phaseStr);
    }

    // Plan info within phase: "p2/4"
    if (planNum) {
      let planStr = `p${planNum}`;
      if (planTotal) planStr += `/${planTotal}`;
      parts.push(planStr);
    }

    // Status icon
    if (status) {
      parts.push(getStatusIcon(status));
    }

    // Progress percentage
    if (progress) {
      parts.push(`${progress}%`);
    }

    // Short phase name (truncate if long)
    if (phaseName) {
      const shortName = phaseName.length > 18 ? phaseName.slice(0, 17) + '\u2026' : phaseName;
      parts.push(shortName);
    }

    if (parts.length === 0) return null;

    const color = getStatusColor(status);
    return `\x1b[${color}mGSD ${parts.join(' ')}\x1b[0m`;
  } catch (e) {
    return null;
  }
}

/** Map GSD status text to a compact icon */
function getStatusIcon(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return '\u2713';
  if (s.includes('in progress')) return '\u25B8';
  if (s.includes('ready to execute')) return '\u25B6';
  if (s.includes('planning')) return '\u270E';
  if (s.includes('ready to plan')) return '\u2026';
  return '\u2022';
}

/** Map GSD status text to ANSI color code */
function getStatusColor(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('complete')) return '32';           // green
  if (s.includes('in progress')) return '33';        // yellow
  if (s.includes('ready to execute')) return '36';   // cyan
  if (s.includes('planning')) return '35';           // magenta
  return '2';                                        // dim
}

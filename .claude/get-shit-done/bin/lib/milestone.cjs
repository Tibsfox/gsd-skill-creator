/**
 * Milestone — Milestone and requirements lifecycle operations
 */

const fs = require('fs');
const path = require('path');
const { output, error } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { writeStateMd } = require('./state.cjs');
const { parseRoadmapStats } = require('./roadmap.cjs');

function cmdRequirementsMarkComplete(cwd, reqIdsRaw, raw) {
  if (!reqIdsRaw || reqIdsRaw.length === 0) {
    error('requirement IDs required. Usage: requirements mark-complete REQ-01,REQ-02 or REQ-01 REQ-02');
  }

  // Accept comma-separated, space-separated, or bracket-wrapped: [REQ-01, REQ-02]
  const reqIds = reqIdsRaw
    .join(' ')
    .replace(/[\[\]]/g, '')
    .split(/[,\s]+/)
    .map(r => r.trim())
    .filter(Boolean);

  if (reqIds.length === 0) {
    error('no valid requirement IDs found');
  }

  const reqPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');
  if (!fs.existsSync(reqPath)) {
    output({ updated: false, reason: 'REQUIREMENTS.md not found', ids: reqIds }, raw, 'no requirements file');
    return;
  }

  let reqContent = fs.readFileSync(reqPath, 'utf-8');
  const updated = [];
  const notFound = [];

  for (const reqId of reqIds) {
    let found = false;

    // Update checkbox: - [ ] **REQ-ID** → - [x] **REQ-ID**
    const checkboxPattern = new RegExp(`(-\\s*\\[)[ ](\\]\\s*\\*\\*${reqId}\\*\\*)`, 'gi');
    if (checkboxPattern.test(reqContent)) {
      reqContent = reqContent.replace(checkboxPattern, '$1x$2');
      found = true;
    }

    // Update traceability table: | REQ-ID | Phase N | Pending | → | REQ-ID | Phase N | Complete |
    const tablePattern = new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi');
    if (tablePattern.test(reqContent)) {
      // Re-read since test() advances lastIndex for global regex
      reqContent = reqContent.replace(
        new RegExp(`(\\|\\s*${reqId}\\s*\\|[^|]+\\|)\\s*Pending\\s*(\\|)`, 'gi'),
        '$1 Complete $2'
      );
      found = true;
    }

    if (found) {
      updated.push(reqId);
    } else {
      notFound.push(reqId);
    }
  }

  if (updated.length > 0) {
    fs.writeFileSync(reqPath, reqContent, 'utf-8');
  }

  output({
    updated: updated.length > 0,
    marked_complete: updated,
    not_found: notFound,
    total: reqIds.length,
  }, raw, `${updated.length}/${reqIds.length} requirements marked complete`);
}

function cmdMilestoneComplete(cwd, version, options, raw) {
  if (!version) {
    error('version required for milestone complete (e.g., v1.0)');
  }

  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  const reqPath = path.join(cwd, '.planning', 'REQUIREMENTS.md');
  const statePath = path.join(cwd, '.planning', 'STATE.md');
  const milestonesPath = path.join(cwd, '.planning', 'MILESTONES.md');
  const archiveDir = path.join(cwd, '.planning', 'milestones');
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const today = new Date().toISOString().split('T')[0];
  const milestoneName = options.name || version;

  // Ensure archive directory exists
  fs.mkdirSync(archiveDir, { recursive: true });

  // Extract milestone phase numbers from ROADMAP.md to scope stats.
  // Only phases listed in the current ROADMAP are counted — phases from
  // prior milestones that remain on disk are excluded.
  //
  // Related upstream PRs (getMilestoneInfo, not milestone complete):
  //   #756 — fix(core): detect current milestone correctly in getMilestoneInfo
  //   #783 — fix: getMilestoneInfo() returns wrong version after completion
  // Those PRs fix *which* milestone is detected; this fix scopes *stats*
  // and *accomplishments* to only the phases belonging to that milestone.
  const milestonePhaseNums = new Set();
  if (fs.existsSync(roadmapPath)) {
    try {
      const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
      const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
      let phaseMatch;
      while ((phaseMatch = phasePattern.exec(roadmapContent)) !== null) {
        milestonePhaseNums.add(phaseMatch[1]);
      }
    } catch {}
  }

  // Pre-normalize phase numbers for O(1) lookup — strip leading zeros
  // and lowercase for case-insensitive matching of letter suffixes (e.g. 3A/3a).
  const normalizedPhaseNums = new Set(
    [...milestonePhaseNums].map(num => (num.replace(/^0+/, '') || '0').toLowerCase())
  );

  // Match a phase directory name to the milestone's phase set.
  // Handles: "01-foo" → "1", "3A-bar" → "3a", "3.1-baz" → "3.1"
  // Returns false for non-phase directories (no leading digit).
  function isDirInMilestone(dirName) {
    if (normalizedPhaseNums.size === 0) return true; // no scoping
    const m = dirName.match(/^0*(\d+[A-Za-z]?(?:\.\d+)*)/);
    if (!m) return false; // not a phase directory
    return normalizedPhaseNums.has(m[1].toLowerCase());
  }

  // Gather stats: phase/plan counts from ROADMAP.md (authoritative),
  // task counts and accomplishments from disk SUMMARY files.
  //
  // Why ROADMAP instead of disk scan: inline-executed phases may not have
  // *-PLAN.md files on disk, producing 0/0. ROADMAP.md has the real counts
  // in its checklist items: "(N/M plans)".
  let roadmapStats = { phaseCount: 0, totalPlans: 0, perPhase: [] };
  if (fs.existsSync(roadmapPath)) {
    try {
      const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
      roadmapStats = parseRoadmapStats(roadmapContent);
    } catch {}
  }

  let phaseCount = roadmapStats.phaseCount;
  let totalPlans = roadmapStats.totalPlans;
  let totalTasks = 0;
  const accomplishments = [];

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      if (!isDirInMilestone(dir)) continue;

      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');

      // Extract one-liners and task counts from summaries (disk-only data)
      for (const s of summaries) {
        try {
          const content = fs.readFileSync(path.join(phasesDir, dir, s), 'utf-8');
          const fm = extractFrontmatter(content);
          if (fm['one-liner']) {
            accomplishments.push(fm['one-liner']);
          }
          // Count tasks
          const taskMatches = content.match(/##\s*Task\s*\d+/gi) || [];
          totalTasks += taskMatches.length;
        } catch {}
      }
    }
  } catch {}

  // Archive ROADMAP.md
  if (fs.existsSync(roadmapPath)) {
    const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
    fs.writeFileSync(path.join(archiveDir, `${version}-ROADMAP.md`), roadmapContent, 'utf-8');
  }

  // Archive REQUIREMENTS.md
  if (fs.existsSync(reqPath)) {
    const reqContent = fs.readFileSync(reqPath, 'utf-8');
    const archiveHeader = `# Requirements Archive: ${version} ${milestoneName}\n\n**Archived:** ${today}\n**Status:** SHIPPED\n\nFor current requirements, see \`.planning/REQUIREMENTS.md\`.\n\n---\n\n`;
    fs.writeFileSync(path.join(archiveDir, `${version}-REQUIREMENTS.md`), archiveHeader + reqContent, 'utf-8');
  }

  // Archive audit file if exists
  const auditFile = path.join(cwd, '.planning', `${version}-MILESTONE-AUDIT.md`);
  if (fs.existsSync(auditFile)) {
    fs.renameSync(auditFile, path.join(archiveDir, `${version}-MILESTONE-AUDIT.md`));
  }

  // Create/append MILESTONES.md entry
  const accomplishmentsList = accomplishments.map(a => `- ${a}`).join('\n');
  const milestoneEntry = `## ${version} ${milestoneName} (Shipped: ${today})\n\n**Phases completed:** ${phaseCount} phases, ${totalPlans} plans, ${totalTasks} tasks\n\n**Key accomplishments:**\n${accomplishmentsList || '- (none recorded)'}\n\n---\n\n`;

  if (fs.existsSync(milestonesPath)) {
    const existing = fs.readFileSync(milestonesPath, 'utf-8');
    // Insert after the header line(s) for reverse chronological order (newest first)
    const headerMatch = existing.match(/^(#{1,3}\s+[^\n]*\n\n?)/);
    if (headerMatch) {
      const header = headerMatch[1];
      const rest = existing.slice(header.length);
      fs.writeFileSync(milestonesPath, header + milestoneEntry + rest, 'utf-8');
    } else {
      // No recognizable header — prepend the entry
      fs.writeFileSync(milestonesPath, milestoneEntry + existing, 'utf-8');
    }
  } else {
    fs.writeFileSync(milestonesPath, `# Milestones\n\n${milestoneEntry}`, 'utf-8');
  }

  // Generate RETROSPECTIVE.md entry
  const retroPath = path.join(cwd, '.planning', 'RETROSPECTIVE.md');
  let retrospectiveUpdated = false;

  try {
    // Gather per-phase accomplishments for ### What Was Built
    const phaseAccomplishments = [];
    const entries2 = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs2 = entries2.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs2) {
      if (!isDirInMilestone(dir)) continue;

      const phaseMatch = dir.match(/^(\d+(?:\.\d+)*)-(.+)/);
      if (!phaseMatch) continue;
      const pNum = phaseMatch[1];
      const pName = phaseMatch[2].replace(/-/g, ' ');

      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');

      const phaseOneLiners = [];
      for (const s of summaries) {
        try {
          const content = fs.readFileSync(path.join(phasesDir, dir, s), 'utf-8');
          const fm = extractFrontmatter(content);
          if (fm['one-liner']) phaseOneLiners.push(fm['one-liner']);
        } catch {}
      }

      if (phaseOneLiners.length > 0) {
        phaseAccomplishments.push(`- **${pName} (${pNum}):** ${phaseOneLiners.join('; ')}`);
      } else {
        phaseAccomplishments.push(`- **${pName} (${pNum}):** Phase completed`);
      }
    }

    // Build the RETROSPECTIVE.md entry
    const retroEntry = [
      `## Milestone: ${version} -- ${milestoneName}`,
      '',
      `**Shipped:** ${today}`,
      `**Phases:** ${phaseCount} | **Plans:** ${totalPlans} | **Tasks:** ${totalTasks}`,
      '',
      '### What Was Built',
      '',
      ...(phaseAccomplishments.length > 0
        ? phaseAccomplishments
        : ['- (no phase accomplishments recorded)']),
      '',
      '### What Worked',
      '',
      '_[Review and add observations]_',
      '',
      '### What Was Inefficient',
      '',
      '_[Review and add observations]_',
      '',
      '### Key Lessons',
      '',
      '_[Review and add observations]_',
      '',
      '### Cost Observations',
      '',
      '_[Review and add observations]_',
      '',
      '---',
      `*Auto-generated by milestone ceremony on ${today}. Review and enhance manually.*`,
      '',
    ].join('\n');

    // Write or append to RETROSPECTIVE.md
    if (fs.existsSync(retroPath)) {
      const existing = fs.readFileSync(retroPath, 'utf-8');
      // Find insertion point: after the header block
      // Header format:
      // # Project Retrospective
      //
      // *A living document...*
      //
      const headerEndMatch = existing.match(/^(#[^\n]*\n\n\*[^\n]*\*\n\n?)/);
      if (headerEndMatch) {
        const header = headerEndMatch[1];
        const rest = existing.slice(header.length);
        fs.writeFileSync(retroPath, header + retroEntry + '\n' + rest, 'utf-8');
      } else {
        // No recognizable header -- prepend after first line
        const firstNewline = existing.indexOf('\n');
        if (firstNewline > 0) {
          const firstLine = existing.slice(0, firstNewline + 1);
          const rest = existing.slice(firstNewline + 1);
          fs.writeFileSync(retroPath, firstLine + '\n' + retroEntry + '\n' + rest, 'utf-8');
        } else {
          fs.writeFileSync(retroPath, existing + '\n\n' + retroEntry, 'utf-8');
        }
      }
    } else {
      // Create new RETROSPECTIVE.md
      const retroHeader = '# Project Retrospective\n\n*A living document updated after each milestone. Lessons feed forward into future planning.*\n\n';
      fs.writeFileSync(retroPath, retroHeader + retroEntry, 'utf-8');
    }
    retrospectiveUpdated = true;
  } catch {}

  // Update STATE.md
  if (fs.existsSync(statePath)) {
    let stateContent = fs.readFileSync(statePath, 'utf-8');
    stateContent = stateContent.replace(
      /(\*\*Status:\*\*\s*).*/,
      `$1${version} milestone complete`
    );
    stateContent = stateContent.replace(
      /(\*\*Last Activity:\*\*\s*).*/,
      `$1${today}`
    );
    stateContent = stateContent.replace(
      /(\*\*Last Activity Description:\*\*\s*).*/,
      `$1${version} milestone completed and archived`
    );
    writeStateMd(statePath, stateContent, cwd);
  }

  // Archive phase directories if requested
  let phasesArchived = false;
  if (options.archivePhases) {
    try {
      const phaseArchiveDir = path.join(archiveDir, `${version}-phases`);
      fs.mkdirSync(phaseArchiveDir, { recursive: true });

      const phaseEntries = fs.readdirSync(phasesDir, { withFileTypes: true });
      const phaseDirNames = phaseEntries.filter(e => e.isDirectory()).map(e => e.name);
      let archivedCount = 0;
      for (const dir of phaseDirNames) {
        if (!isDirInMilestone(dir)) continue;
        fs.renameSync(path.join(phasesDir, dir), path.join(phaseArchiveDir, dir));
        archivedCount++;
      }
      phasesArchived = archivedCount > 0;
    } catch {}
  }

  const result = {
    version,
    name: milestoneName,
    date: today,
    phases: phaseCount,
    plans: totalPlans,
    tasks: totalTasks,
    accomplishments,
    archived: {
      roadmap: fs.existsSync(path.join(archiveDir, `${version}-ROADMAP.md`)),
      requirements: fs.existsSync(path.join(archiveDir, `${version}-REQUIREMENTS.md`)),
      audit: fs.existsSync(path.join(archiveDir, `${version}-MILESTONE-AUDIT.md`)),
      phases: phasesArchived,
    },
    milestones_updated: true,
    state_updated: fs.existsSync(statePath),
    retrospective_updated: retrospectiveUpdated,
  };

  output(result, raw);
}

module.exports = {
  cmdRequirementsMarkComplete,
  cmdMilestoneComplete,
};

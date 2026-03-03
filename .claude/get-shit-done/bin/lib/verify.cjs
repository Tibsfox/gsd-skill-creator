/**
 * Verify — Verification suite, consistency, and health validation
 */

const fs = require('fs');
const path = require('path');
const { safeReadFile, normalizePhaseName, execGit, findPhaseInternal, getMilestoneInfo, output, error } = require('./core.cjs');
const { extractFrontmatter, parseMustHavesBlock } = require('./frontmatter.cjs');
const { writeStateMd } = require('./state.cjs');
const { classifyTestEvidence, formatAdvisoryMessage } = require('./test-quality.cjs');

function cmdVerifySummary(cwd, summaryPath, checkFileCount, raw) {
  if (!summaryPath) {
    error('summary-path required');
  }

  const fullPath = path.join(cwd, summaryPath);
  const checkCount = checkFileCount || 2;

  // Check 1: Summary exists
  if (!fs.existsSync(fullPath)) {
    const result = {
      passed: false,
      checks: {
        summary_exists: false,
        files_created: { checked: 0, found: 0, missing: [] },
        commits_exist: false,
        self_check: 'not_found',
      },
      errors: ['SUMMARY.md not found'],
    };
    output(result, raw, 'failed');
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const errors = [];

  // Check 2: Spot-check files mentioned in summary
  const mentionedFiles = new Set();
  const patterns = [
    /`([^`]+\.[a-zA-Z]+)`/g,
    /(?:Created|Modified|Added|Updated|Edited):\s*`?([^\s`]+\.[a-zA-Z]+)`?/gi,
  ];

  for (const pattern of patterns) {
    let m;
    while ((m = pattern.exec(content)) !== null) {
      const filePath = m[1];
      if (filePath && !filePath.startsWith('http') && filePath.includes('/')) {
        mentionedFiles.add(filePath);
      }
    }
  }

  const filesToCheck = Array.from(mentionedFiles).slice(0, checkCount);
  const missing = [];
  for (const file of filesToCheck) {
    if (!fs.existsSync(path.join(cwd, file))) {
      missing.push(file);
    }
  }

  // Check 3: Commits exist
  const commitHashPattern = /\b[0-9a-f]{7,40}\b/g;
  const hashes = content.match(commitHashPattern) || [];
  let commitsExist = false;
  if (hashes.length > 0) {
    for (const hash of hashes.slice(0, 3)) {
      const result = execGit(cwd, ['cat-file', '-t', hash]);
      if (result.exitCode === 0 && result.stdout === 'commit') {
        commitsExist = true;
        break;
      }
    }
  }

  // Check 4: Self-check section
  let selfCheck = 'not_found';
  const selfCheckPattern = /##\s*(?:Self[- ]?Check|Verification|Quality Check)/i;
  if (selfCheckPattern.test(content)) {
    const passPattern = /(?:all\s+)?(?:pass|✓|✅|complete|succeeded)/i;
    const failPattern = /(?:fail|✗|❌|incomplete|blocked)/i;
    const checkSection = content.slice(content.search(selfCheckPattern));
    if (failPattern.test(checkSection)) {
      selfCheck = 'failed';
    } else if (passPattern.test(checkSection)) {
      selfCheck = 'passed';
    }
  }

  if (missing.length > 0) errors.push('Missing files: ' + missing.join(', '));
  if (!commitsExist && hashes.length > 0) errors.push('Referenced commit hashes not found in git history');
  if (selfCheck === 'failed') errors.push('Self-check section indicates failure');

  const checks = {
    summary_exists: true,
    files_created: { checked: filesToCheck.length, found: filesToCheck.length - missing.length, missing },
    commits_exist: commitsExist,
    self_check: selfCheck,
  };

  const passed = missing.length === 0 && selfCheck !== 'failed';
  const result = { passed, checks, errors };
  output(result, raw, passed ? 'passed' : 'failed');
}

function cmdVerifyPlanStructure(cwd, filePath, raw) {
  if (!filePath) { error('file path required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }

  const fm = extractFrontmatter(content);
  const errors = [];
  const warnings = [];

  // Check required frontmatter fields
  const required = ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'];
  for (const field of required) {
    if (fm[field] === undefined) errors.push(`Missing required frontmatter field: ${field}`);
  }

  // Parse and check task elements
  const taskPattern = /<task[^>]*>([\s\S]*?)<\/task>/g;
  const tasks = [];
  let taskMatch;
  while ((taskMatch = taskPattern.exec(content)) !== null) {
    const taskContent = taskMatch[1];
    const nameMatch = taskContent.match(/<name>([\s\S]*?)<\/name>/);
    const taskName = nameMatch ? nameMatch[1].trim() : 'unnamed';
    const hasFiles = /<files>/.test(taskContent);
    const hasAction = /<action>/.test(taskContent);
    const hasVerify = /<verify>/.test(taskContent);
    const hasDone = /<done>/.test(taskContent);

    if (!nameMatch) errors.push('Task missing <name> element');
    if (!hasAction) errors.push(`Task '${taskName}' missing <action>`);
    if (!hasVerify) warnings.push(`Task '${taskName}' missing <verify>`);
    if (!hasDone) warnings.push(`Task '${taskName}' missing <done>`);
    if (!hasFiles) warnings.push(`Task '${taskName}' missing <files>`);

    tasks.push({ name: taskName, hasFiles, hasAction, hasVerify, hasDone });
  }

  if (tasks.length === 0) warnings.push('No <task> elements found');

  // Wave/depends_on consistency
  if (fm.wave && parseInt(fm.wave) > 1 && (!fm.depends_on || (Array.isArray(fm.depends_on) && fm.depends_on.length === 0))) {
    warnings.push('Wave > 1 but depends_on is empty');
  }

  // Autonomous/checkpoint consistency
  const hasCheckpoints = /<task\s+type=["']?checkpoint/.test(content);
  if (hasCheckpoints && fm.autonomous !== 'false' && fm.autonomous !== false) {
    errors.push('Has checkpoint tasks but autonomous is not false');
  }

  output({
    valid: errors.length === 0,
    errors,
    warnings,
    task_count: tasks.length,
    tasks,
    frontmatter_fields: Object.keys(fm),
  }, raw, errors.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyPhaseCompleteness(cwd, phase, raw) {
  if (!phase) { error('phase required'); }
  const phaseInfo = findPhaseInternal(cwd, phase);
  if (!phaseInfo || !phaseInfo.found) {
    output({ error: 'Phase not found', phase }, raw);
    return;
  }

  const errors = [];
  const warnings = [];
  const phaseDir = path.join(cwd, phaseInfo.directory);

  // List plans and summaries
  let files;
  try { files = fs.readdirSync(phaseDir); } catch { output({ error: 'Cannot read phase directory' }, raw); return; }

  const plans = files.filter(f => f.match(/-PLAN\.md$/i));
  const summaries = files.filter(f => f.match(/-SUMMARY\.md$/i));

  // Extract plan IDs (everything before -PLAN.md)
  const planIds = new Set(plans.map(p => p.replace(/-PLAN\.md$/i, '')));
  const summaryIds = new Set(summaries.map(s => s.replace(/-SUMMARY\.md$/i, '')));

  // Plans without summaries
  const incompletePlans = [...planIds].filter(id => !summaryIds.has(id));
  if (incompletePlans.length > 0) {
    errors.push(`Plans without summaries: ${incompletePlans.join(', ')}`);
  }

  // Summaries without plans (orphans)
  const orphanSummaries = [...summaryIds].filter(id => !planIds.has(id));
  if (orphanSummaries.length > 0) {
    warnings.push(`Summaries without plans: ${orphanSummaries.join(', ')}`);
  }

  output({
    complete: errors.length === 0,
    phase: phaseInfo.phase_number,
    plan_count: plans.length,
    summary_count: summaries.length,
    incomplete_plans: incompletePlans,
    orphan_summaries: orphanSummaries,
    errors,
    warnings,
  }, raw, errors.length === 0 ? 'complete' : 'incomplete');
}

function cmdVerifyReferences(cwd, filePath, raw) {
  if (!filePath) { error('file path required'); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }

  const found = [];
  const missing = [];

  // Find @-references: @path/to/file (must contain / to be a file path)
  const atRefs = content.match(/@([^\s\n,)]+\/[^\s\n,)]+)/g) || [];
  for (const ref of atRefs) {
    const cleanRef = ref.slice(1); // remove @
    const resolved = cleanRef.startsWith('~/')
      ? path.join(process.env.HOME || '', cleanRef.slice(2))
      : path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  // Find backtick file paths that look like real paths (contain / and have extension)
  const backtickRefs = content.match(/`([^`]+\/[^`]+\.[a-zA-Z]{1,10})`/g) || [];
  for (const ref of backtickRefs) {
    const cleanRef = ref.slice(1, -1); // remove backticks
    if (cleanRef.startsWith('http') || cleanRef.includes('${') || cleanRef.includes('{{')) continue;
    if (found.includes(cleanRef) || missing.includes(cleanRef)) continue; // dedup
    const resolved = path.join(cwd, cleanRef);
    if (fs.existsSync(resolved)) {
      found.push(cleanRef);
    } else {
      missing.push(cleanRef);
    }
  }

  output({
    valid: missing.length === 0,
    found: found.length,
    missing,
    total: found.length + missing.length,
  }, raw, missing.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyCommits(cwd, hashes, raw) {
  if (!hashes || hashes.length === 0) { error('At least one commit hash required'); }

  const valid = [];
  const invalid = [];
  for (const hash of hashes) {
    const result = execGit(cwd, ['cat-file', '-t', hash]);
    if (result.exitCode === 0 && result.stdout.trim() === 'commit') {
      valid.push(hash);
    } else {
      invalid.push(hash);
    }
  }

  output({
    all_valid: invalid.length === 0,
    valid,
    invalid,
    total: hashes.length,
  }, raw, invalid.length === 0 ? 'valid' : 'invalid');
}

function cmdVerifyArtifacts(cwd, planFilePath, raw) {
  if (!planFilePath) { error('plan file path required'); }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: planFilePath }, raw); return; }

  const artifacts = parseMustHavesBlock(content, 'artifacts');
  if (artifacts.length === 0) {
    output({ error: 'No must_haves.artifacts found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results = [];
  for (const artifact of artifacts) {
    if (typeof artifact === 'string') continue; // skip simple string items
    const artPath = artifact.path;
    if (!artPath) continue;

    const artFullPath = path.join(cwd, artPath);
    const exists = fs.existsSync(artFullPath);
    const check = { path: artPath, exists, issues: [], passed: false };

    if (exists) {
      const fileContent = safeReadFile(artFullPath) || '';
      const lineCount = fileContent.split('\n').length;

      if (artifact.min_lines && lineCount < artifact.min_lines) {
        check.issues.push(`Only ${lineCount} lines, need ${artifact.min_lines}`);
      }
      if (artifact.contains && !fileContent.includes(artifact.contains)) {
        check.issues.push(`Missing pattern: ${artifact.contains}`);
      }
      if (artifact.exports) {
        const exports = Array.isArray(artifact.exports) ? artifact.exports : [artifact.exports];
        for (const exp of exports) {
          if (!fileContent.includes(exp)) check.issues.push(`Missing export: ${exp}`);
        }
      }
      check.passed = check.issues.length === 0;
    } else {
      check.issues.push('File not found');
    }

    results.push(check);
  }

  const passed = results.filter(r => r.passed).length;
  output({
    all_passed: passed === results.length,
    passed,
    total: results.length,
    artifacts: results,
  }, raw, passed === results.length ? 'valid' : 'invalid');
}

function cmdVerifyKeyLinks(cwd, planFilePath, raw) {
  if (!planFilePath) { error('plan file path required'); }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: planFilePath }, raw); return; }

  const keyLinks = parseMustHavesBlock(content, 'key_links');
  if (keyLinks.length === 0) {
    output({ error: 'No must_haves.key_links found in frontmatter', path: planFilePath }, raw);
    return;
  }

  const results = [];
  for (const link of keyLinks) {
    if (typeof link === 'string') continue;
    const check = { from: link.from, to: link.to, via: link.via || '', verified: false, detail: '' };

    const sourceContent = safeReadFile(path.join(cwd, link.from || ''));
    if (!sourceContent) {
      check.detail = 'Source file not found';
    } else if (link.pattern) {
      try {
        const regex = new RegExp(link.pattern);
        if (regex.test(sourceContent)) {
          check.verified = true;
          check.detail = 'Pattern found in source';
        } else {
          const targetContent = safeReadFile(path.join(cwd, link.to || ''));
          if (targetContent && regex.test(targetContent)) {
            check.verified = true;
            check.detail = 'Pattern found in target';
          } else {
            check.detail = `Pattern "${link.pattern}" not found in source or target`;
          }
        }
      } catch {
        check.detail = `Invalid regex pattern: ${link.pattern}`;
      }
    } else {
      // No pattern: just check source references target
      if (sourceContent.includes(link.to || '')) {
        check.verified = true;
        check.detail = 'Target referenced in source';
      } else {
        check.detail = 'Target not referenced in source';
      }
    }

    results.push(check);
  }

  const verified = results.filter(r => r.verified).length;
  output({
    all_verified: verified === results.length,
    verified,
    total: results.length,
    links: results,
  }, raw, verified === results.length ? 'valid' : 'invalid');
}

function cmdValidateConsistency(cwd, raw) {
  const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const errors = [];
  const warnings = [];

  // Check for ROADMAP
  if (!fs.existsSync(roadmapPath)) {
    errors.push('ROADMAP.md not found');
    output({ passed: false, errors, warnings }, raw, 'failed');
    return;
  }

  const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');

  // Extract phases from ROADMAP
  const roadmapPhases = new Set();
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
  let m;
  while ((m = phasePattern.exec(roadmapContent)) !== null) {
    roadmapPhases.add(m[1]);
  }

  // Get phases on disk
  const diskPhases = new Set();
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    for (const dir of dirs) {
      const dm = dir.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
      if (dm) diskPhases.add(dm[1]);
    }
  } catch {}

  // Check: phases in ROADMAP but not on disk
  for (const p of roadmapPhases) {
    if (!diskPhases.has(p) && !diskPhases.has(normalizePhaseName(p))) {
      warnings.push(`Phase ${p} in ROADMAP.md but no directory on disk`);
    }
  }

  // Check: phases on disk but not in ROADMAP
  for (const p of diskPhases) {
    const unpadded = String(parseInt(p, 10));
    if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
      warnings.push(`Phase ${p} exists on disk but not in ROADMAP.md`);
    }
  }

  // Check: sequential phase numbers (integers only)
  const integerPhases = [...diskPhases]
    .filter(p => !p.includes('.'))
    .map(p => parseInt(p, 10))
    .sort((a, b) => a - b);

  for (let i = 1; i < integerPhases.length; i++) {
    if (integerPhases[i] !== integerPhases[i - 1] + 1) {
      warnings.push(`Gap in phase numbering: ${integerPhases[i - 1]} → ${integerPhases[i]}`);
    }
  }

  // Check: plan numbering within phases
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md')).sort();

      // Extract plan numbers
      const planNums = plans.map(p => {
        const pm = p.match(/-(\d{2})-PLAN\.md$/);
        return pm ? parseInt(pm[1], 10) : null;
      }).filter(n => n !== null);

      for (let i = 1; i < planNums.length; i++) {
        if (planNums[i] !== planNums[i - 1] + 1) {
          warnings.push(`Gap in plan numbering in ${dir}: plan ${planNums[i - 1]} → ${planNums[i]}`);
        }
      }

      // Check: plans without summaries (completed plans)
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md'));
      const planIds = new Set(plans.map(p => p.replace('-PLAN.md', '')));
      const summaryIds = new Set(summaries.map(s => s.replace('-SUMMARY.md', '')));

      // Summary without matching plan is suspicious
      for (const sid of summaryIds) {
        if (!planIds.has(sid)) {
          warnings.push(`Summary ${sid}-SUMMARY.md in ${dir} has no matching PLAN.md`);
        }
      }
    }
  } catch {}

  // Check: frontmatter in plans has required fields
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);

    for (const dir of dirs) {
      const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md'));

      for (const plan of plans) {
        const content = fs.readFileSync(path.join(phasesDir, dir, plan), 'utf-8');
        const fm = extractFrontmatter(content);

        if (!fm.wave) {
          warnings.push(`${dir}/${plan}: missing 'wave' in frontmatter`);
        }
      }
    }
  } catch {}

  const passed = errors.length === 0;
  output({ passed, errors, warnings, warning_count: warnings.length }, raw, passed ? 'passed' : 'failed');
}

function cmdValidateHealth(cwd, options, raw) {
  const planningDir = path.join(cwd, '.planning');
  const projectPath = path.join(planningDir, 'PROJECT.md');
  const roadmapPath = path.join(planningDir, 'ROADMAP.md');
  const statePath = path.join(planningDir, 'STATE.md');
  const configPath = path.join(planningDir, 'config.json');
  const phasesDir = path.join(planningDir, 'phases');

  const errors = [];
  const warnings = [];
  const info = [];
  const repairs = [];

  // Helper to add issue
  const addIssue = (severity, code, message, fix, repairable = false) => {
    const issue = { code, message, fix, repairable };
    if (severity === 'error') errors.push(issue);
    else if (severity === 'warning') warnings.push(issue);
    else info.push(issue);
  };

  // ─── Check 1: .planning/ exists ───────────────────────────────────────────
  if (!fs.existsSync(planningDir)) {
    addIssue('error', 'E001', '.planning/ directory not found', 'Run /gsd:new-project to initialize');
    output({
      status: 'broken',
      errors,
      warnings,
      info,
      repairable_count: 0,
    }, raw);
    return;
  }

  // ─── Check 2: PROJECT.md exists and has required sections ─────────────────
  if (!fs.existsSync(projectPath)) {
    addIssue('error', 'E002', 'PROJECT.md not found', 'Run /gsd:new-project to create');
  } else {
    const content = fs.readFileSync(projectPath, 'utf-8');
    const requiredSections = ['## What This Is', '## Core Value', '## Requirements'];
    for (const section of requiredSections) {
      if (!content.includes(section)) {
        addIssue('warning', 'W001', `PROJECT.md missing section: ${section}`, 'Add section manually');
      }
    }
  }

  // ─── Check 3: ROADMAP.md exists ───────────────────────────────────────────
  if (!fs.existsSync(roadmapPath)) {
    addIssue('error', 'E003', 'ROADMAP.md not found', 'Run /gsd:new-milestone to create roadmap');
  }

  // ─── Check 4: STATE.md exists and references valid phases ─────────────────
  if (!fs.existsSync(statePath)) {
    addIssue('error', 'E004', 'STATE.md not found', 'Run /gsd:health --repair to regenerate', true);
    repairs.push('regenerateState');
  } else {
    const stateContent = fs.readFileSync(statePath, 'utf-8');
    // Extract phase references from STATE.md
    const phaseRefs = [...stateContent.matchAll(/[Pp]hase\s+(\d+(?:\.\d+)*)/g)].map(m => m[1]);
    // Get disk phases
    const diskPhases = new Set();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const m = e.name.match(/^(\d+(?:\.\d+)*)/);
          if (m) diskPhases.add(m[1]);
        }
      }
    } catch {}
    // Check for invalid references
    for (const ref of phaseRefs) {
      const normalizedRef = String(parseInt(ref, 10)).padStart(2, '0');
      if (!diskPhases.has(ref) && !diskPhases.has(normalizedRef) && !diskPhases.has(String(parseInt(ref, 10)))) {
        // Only warn if phases dir has any content (not just an empty project)
        if (diskPhases.size > 0) {
          addIssue('warning', 'W002', `STATE.md references phase ${ref}, but only phases ${[...diskPhases].sort().join(', ')} exist`, 'Run /gsd:health --repair to regenerate STATE.md', true);
          if (!repairs.includes('regenerateState')) repairs.push('regenerateState');
        }
      }
    }
  }

  // ─── Check 5: config.json valid JSON + valid schema ───────────────────────
  if (!fs.existsSync(configPath)) {
    addIssue('warning', 'W003', 'config.json not found', 'Run /gsd:health --repair to create with defaults', true);
    repairs.push('createConfig');
  } else {
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      // Validate known fields
      const validProfiles = ['quality', 'balanced', 'budget'];
      if (parsed.model_profile && !validProfiles.includes(parsed.model_profile)) {
        addIssue('warning', 'W004', `config.json: invalid model_profile "${parsed.model_profile}"`, `Valid values: ${validProfiles.join(', ')}`);
      }
    } catch (err) {
      addIssue('error', 'E005', `config.json: JSON parse error - ${err.message}`, 'Run /gsd:health --repair to reset to defaults', true);
      repairs.push('resetConfig');
    }
  }

  // ─── Check 6: Phase directory naming (NN-name format) ─────────────────────
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory() && !e.name.match(/^\d{2}(?:\.\d+)*-[\w-]+$/)) {
        addIssue('warning', 'W005', `Phase directory "${e.name}" doesn't follow NN-name format`, 'Rename to match pattern (e.g., 01-setup)');
      }
    }
  } catch {}

  // ─── Check 7: Orphaned plans (PLAN without SUMMARY) ───────────────────────
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const phaseFiles = fs.readdirSync(path.join(phasesDir, e.name));
      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const summaryBases = new Set(summaries.map(s => s.replace('-SUMMARY.md', '').replace('SUMMARY.md', '')));

      for (const plan of plans) {
        const planBase = plan.replace('-PLAN.md', '').replace('PLAN.md', '');
        if (!summaryBases.has(planBase)) {
          addIssue('info', 'I001', `${e.name}/${plan} has no SUMMARY.md`, 'May be in progress');
        }
      }
    }
  } catch {}

  // ─── Check 8: Run existing consistency checks ─────────────────────────────
  // Inline subset of cmdValidateConsistency
  if (fs.existsSync(roadmapPath)) {
    const roadmapContent = fs.readFileSync(roadmapPath, 'utf-8');
    const roadmapPhases = new Set();
    const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
    let m;
    while ((m = phasePattern.exec(roadmapContent)) !== null) {
      roadmapPhases.add(m[1]);
    }

    const diskPhases = new Set();
    try {
      const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) {
          const dm = e.name.match(/^(\d+[A-Z]?(?:\.\d+)*)/i);
          if (dm) diskPhases.add(dm[1]);
        }
      }
    } catch {}

    // Phases in ROADMAP but not on disk
    for (const p of roadmapPhases) {
      const padded = String(parseInt(p, 10)).padStart(2, '0');
      if (!diskPhases.has(p) && !diskPhases.has(padded)) {
        addIssue('warning', 'W006', `Phase ${p} in ROADMAP.md but no directory on disk`, 'Create phase directory or remove from roadmap');
      }
    }

    // Phases on disk but not in ROADMAP
    for (const p of diskPhases) {
      const unpadded = String(parseInt(p, 10));
      if (!roadmapPhases.has(p) && !roadmapPhases.has(unpadded)) {
        addIssue('warning', 'W007', `Phase ${p} exists on disk but not in ROADMAP.md`, 'Add to roadmap or remove directory');
      }
    }
  }

  // ─── Perform repairs if requested ─────────────────────────────────────────
  const repairActions = [];
  if (options.repair && repairs.length > 0) {
    for (const repair of repairs) {
      try {
        switch (repair) {
          case 'createConfig':
          case 'resetConfig': {
            const defaults = {
              model_profile: 'balanced',
              commit_docs: true,
              search_gitignored: false,
              branching_strategy: 'none',
              research: true,
              plan_checker: true,
              verifier: true,
              parallelization: true,
            };
            fs.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf-8');
            repairActions.push({ action: repair, success: true, path: 'config.json' });
            break;
          }
          case 'regenerateState': {
            // Create timestamped backup before overwriting
            if (fs.existsSync(statePath)) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
              const backupPath = `${statePath}.bak-${timestamp}`;
              fs.copyFileSync(statePath, backupPath);
              repairActions.push({ action: 'backupState', success: true, path: backupPath });
            }
            // Generate minimal STATE.md from ROADMAP.md structure
            const milestone = getMilestoneInfo(cwd);
            let stateContent = `# Session State\n\n`;
            stateContent += `## Project Reference\n\n`;
            stateContent += `See: .planning/PROJECT.md\n\n`;
            stateContent += `## Position\n\n`;
            stateContent += `**Milestone:** ${milestone.version} ${milestone.name}\n`;
            stateContent += `**Current phase:** (determining...)\n`;
            stateContent += `**Status:** Resuming\n\n`;
            stateContent += `## Session Log\n\n`;
            stateContent += `- ${new Date().toISOString().split('T')[0]}: STATE.md regenerated by /gsd:health --repair\n`;
            writeStateMd(statePath, stateContent, cwd);
            repairActions.push({ action: repair, success: true, path: 'STATE.md' });
            break;
          }
        }
      } catch (err) {
        repairActions.push({ action: repair, success: false, error: err.message });
      }
    }
  }

  // ─── Determine overall status ─────────────────────────────────────────────
  let status;
  if (errors.length > 0) {
    status = 'broken';
  } else if (warnings.length > 0) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  const repairableCount = errors.filter(e => e.repairable).length +
                         warnings.filter(w => w.repairable).length;

  output({
    status,
    errors,
    warnings,
    info,
    repairable_count: repairableCount,
    repairs_performed: repairActions.length > 0 ? repairActions : undefined,
  }, raw);
}

function cmdVerifyTestQuality(cwd, planFilePath, raw) {
  if (!planFilePath) { error('plan file path required'); }
  const fullPath = path.isAbsolute(planFilePath) ? planFilePath : path.join(cwd, planFilePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: planFilePath }, raw); return; }

  const fm = extractFrontmatter(content);

  // Extract requirements and files_modified from frontmatter
  const requirements = Array.isArray(fm.requirements) ? fm.requirements :
    (typeof fm.requirements === 'string' ? fm.requirements.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean) : []);
  const filesModified = Array.isArray(fm.files_modified) ? fm.files_modified :
    (typeof fm.files_modified === 'string' ? [fm.files_modified] : []);

  // Identify test files from files_modified
  const testFilePatterns = /\.(test|spec)\.(ts|js|tsx|jsx)$/;
  const testFiles = filesModified.filter(f => testFilePatterns.test(f));

  // Classify each test file
  const fileClassifications = [];
  for (const testFile of testFiles) {
    const cleanPath = testFile.replace(/^["']|["']$/g, '');
    const testFullPath = path.join(cwd, cleanPath);
    const testContent = safeReadFile(testFullPath);
    if (testContent) {
      const classification = classifyTestEvidence(testContent);
      fileClassifications.push({
        file: cleanPath,
        ...classification,
      });
    }
  }

  // Build per-requirement results
  // For now, all test files contribute to all requirements
  // (a more sophisticated approach would match files to requirements)
  const requirementResults = [];
  let behavioralCount = 0;
  let shapeOnlyCount = 0;
  let unknownCount = 0;
  const advisories = [];

  for (const reqId of requirements) {
    let bestClassification = 'unknown';
    let bestReason = 'No test evidence provided';
    const reqTestFiles = [];

    if (fileClassifications.length === 0) {
      // No test files found
      bestClassification = 'unknown';
      bestReason = 'No test files found in files_modified';
    } else {
      // Check all classified test files for this requirement
      for (const fc of fileClassifications) {
        reqTestFiles.push(fc.file);
        if (fc.classification === 'behavioral') {
          bestClassification = 'behavioral';
          bestReason = fc.reason;
        } else if (fc.classification === 'shape-only' && bestClassification !== 'behavioral') {
          bestClassification = 'shape-only';
          bestReason = fc.reason;
        } else if (fc.classification === 'unknown' && bestClassification === 'unknown') {
          bestReason = fc.reason;
        }
      }
    }

    requirementResults.push({
      reqId,
      classification: bestClassification,
      reason: bestReason,
      test_files: reqTestFiles,
    });

    // Generate advisory message
    const msg = formatAdvisoryMessage({ reqId, classification: bestClassification, reason: bestReason });
    advisories.push(msg);

    // Count
    if (bestClassification === 'behavioral') behavioralCount++;
    else if (bestClassification === 'shape-only') shapeOnlyCount++;
    else unknownCount++;
  }

  const result = {
    advisory_only: true,
    requirements_checked: requirements.length,
    behavioral_count: behavioralCount,
    shape_only_count: shapeOnlyCount,
    unknown_count: unknownCount,
    advisories,
    requirement_results: requirementResults,
  };

  output(result, raw);
}

// ============================================================================
// Pacing Advisory
// ============================================================================

function cmdVerifyPacing(cwd, raw) {
  const planningDir = path.join(cwd, '.planning');
  if (!fs.existsSync(planningDir)) {
    output({ advisory_only: true, error: '.planning/ directory not found', status: 'error', checks: [], report: 'Error: .planning/ directory not found' }, raw);
    return;
  }

  // Read STATE.md for session metrics
  const statePath = path.join(planningDir, 'STATE.md');
  const stateContent = safeReadFile(statePath) || '';

  // Read config.json for pacing budget settings
  const configPath = path.join(planningDir, 'config.json');
  let pacingConfig = { maxSubversionsPerSession: 5, minContextWindowsPerSubversion: 2 };
  try {
    const configRaw = safeReadFile(configPath);
    if (configRaw) {
      const parsed = JSON.parse(configRaw);
      if (parsed.pacing) {
        if (parsed.pacing.maxSubversionsPerSession !== undefined) {
          pacingConfig.maxSubversionsPerSession = parsed.pacing.maxSubversionsPerSession;
        }
        if (parsed.pacing.minContextWindowsPerSubversion !== undefined) {
          pacingConfig.minContextWindowsPerSubversion = parsed.pacing.minContextWindowsPerSubversion;
        }
      }
    }
  } catch { /* use defaults */ }

  // Extract phase count from Performance Metrics table
  const metricsMatch = stateContent.match(/\|\s*Phase\s*\|/i);
  let phaseCount = 0;
  if (metricsMatch) {
    const tableStart = metricsMatch.index;
    const tableSection = stateContent.slice(tableStart);
    const rows = tableSection.split('\n').filter(line => line.match(/^\|\s*\d+/));
    phaseCount = rows.length;
  }

  // Run budget check
  const checks = [];
  let overallStatus = 'pass';

  // Check 1: Session budget
  const budgetExceeded = phaseCount > pacingConfig.maxSubversionsPerSession;
  checks.push({
    name: 'session-budget',
    status: budgetExceeded ? 'warn' : 'pass',
    detail: budgetExceeded
      ? `${phaseCount} phases in session exceeds budget of ${pacingConfig.maxSubversionsPerSession}`
      : `${phaseCount} phases in session within budget of ${pacingConfig.maxSubversionsPerSession}`,
  });
  if (budgetExceeded) overallStatus = 'warn';

  // Check 2: Context depth (check if STATE.md exists and has milestone info)
  const hasMilestone = /milestone:/i.test(stateContent);
  checks.push({
    name: 'context-depth',
    status: hasMilestone ? 'pass' : 'warn',
    detail: hasMilestone
      ? 'STATE.md contains milestone context'
      : 'STATE.md missing milestone context',
  });
  if (!hasMilestone) overallStatus = 'warn';

  // Build report
  const reportLines = [
    '=== Pacing Advisory Report ===',
    '',
    `Phases in session: ${phaseCount}`,
    `Budget limit: ${pacingConfig.maxSubversionsPerSession}`,
    '',
  ];
  for (const check of checks) {
    const tag = check.status === 'pass' ? '[PASS]' : '[WARN]';
    reportLines.push(`${tag} ${check.name}: ${check.detail}`);
  }
  reportLines.push('');
  reportLines.push(`Overall: ${overallStatus.toUpperCase()}`);
  const report = reportLines.join('\n');

  output({
    advisory_only: true,
    checks,
    report,
    status: overallStatus,
  }, raw);
}

// ============================================================================
// Batch Detection Advisory
// ============================================================================

function cmdVerifyBatchDetection(cwd, raw) {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) {
    output({ advisory_only: true, error: '.planning/phases/ directory not found', overallStatus: 'error', heuristics: {}, report: 'Error: .planning/phases/ directory not found' }, raw);
    return;
  }

  // Scan for SUMMARY.md files and extract timestamps
  const timestamps = [];
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const phaseDir = path.join(phasesDir, entry.name);
      const files = fs.readdirSync(phaseDir);
      const summaries = files.filter(f => f.endsWith('-SUMMARY.md'));

      for (const summary of summaries) {
        const content = safeReadFile(path.join(phaseDir, summary)) || '';
        const fm = extractFrontmatter(content);
        if (fm.completed) {
          const ts = new Date(fm.completed.replace(/^["']|["']$/g, ''));
          if (!isNaN(ts.getTime())) {
            timestamps.push({ file: path.join(entry.name, summary), time: ts.getTime(), duration: fm.duration || '' });
          }
        }
      }
    }
  } catch { /* empty phases dir */ }

  timestamps.sort((a, b) => a.time - b.time);

  // Heuristic 1: Timestamp clustering (multiple within 60 seconds)
  let clusterCount = 0;
  for (let i = 1; i < timestamps.length; i++) {
    if (timestamps[i].time - timestamps[i - 1].time < 60000) {
      clusterCount++;
    }
  }
  const clusterDetected = clusterCount >= 2;

  // Heuristic 2: Session compression (many summaries in short window)
  let compressionDetected = false;
  if (timestamps.length >= 3) {
    const totalSpanMinutes = (timestamps[timestamps.length - 1].time - timestamps[0].time) / 60000;
    const avgMinutesPerSummary = totalSpanMinutes / timestamps.length;
    compressionDetected = avgMinutesPerSummary < 2 && timestamps.length > 2;
  }

  // Heuristic 3: Duration uniformity (all durations suspiciously similar)
  const durations = timestamps.map(t => t.duration).filter(Boolean);
  let uniformityDetected = false;
  if (durations.length >= 3) {
    const uniqueDurations = new Set(durations);
    uniformityDetected = uniqueDurations.size === 1;
  }

  // Heuristic 4: Volume check (too many summaries for reasonable work)
  const volumeDetected = timestamps.length > 10;

  const heuristics = {
    timestampClustering: {
      detected: clusterDetected,
      severity: clusterDetected ? 'warn' : 'none',
      details: clusterDetected
        ? `${clusterCount} pairs of summaries within 60 seconds of each other`
        : 'No timestamp clustering detected',
    },
    sessionCompression: {
      detected: compressionDetected,
      severity: compressionDetected ? 'warn' : 'none',
      details: compressionDetected
        ? `${timestamps.length} summaries with very short average spacing`
        : 'Session timing appears normal',
    },
    durationUniformity: {
      detected: uniformityDetected,
      severity: uniformityDetected ? 'info' : 'none',
      details: uniformityDetected
        ? 'All summaries report identical duration'
        : 'Duration values vary (expected)',
    },
    volume: {
      detected: volumeDetected,
      severity: volumeDetected ? 'info' : 'none',
      details: `${timestamps.length} summaries found`,
    },
  };

  // Determine overall status
  let overallStatus = 'pass';
  const detectedCount = Object.values(heuristics).filter(h => h.detected).length;
  if (detectedCount >= 3) overallStatus = 'critical';
  else if (detectedCount >= 1 && (clusterDetected || compressionDetected)) overallStatus = 'warn';

  // Build report
  const reportLines = [
    '=== Batch Detection Advisory Report ===',
    '',
    `Summaries analyzed: ${timestamps.length}`,
    '',
  ];
  for (const [name, h] of Object.entries(heuristics)) {
    const tag = h.detected ? `[${h.severity.toUpperCase()}]` : '[PASS]';
    reportLines.push(`${tag} ${name}: ${h.details}`);
  }
  reportLines.push('');
  reportLines.push(`Overall: ${overallStatus.toUpperCase()}`);
  const report = reportLines.join('\n');

  output({
    advisory_only: true,
    heuristics,
    report,
    overallStatus,
  }, raw);
}

// ============================================================================
// Lessons Chain Advisory
// ============================================================================

function cmdVerifyLessonsChain(cwd, raw) {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) {
    output({ advisory_only: true, error: '.planning/phases/ directory not found', overallStatus: 'error', chainIntegrity: {}, catalog: {}, report: 'Error: .planning/phases/ directory not found' }, raw);
    return;
  }

  // Scan summaries for lessons-learned sections
  const phaseLessons = [];
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const sortedEntries = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dirName of sortedEntries) {
      const phaseDir = path.join(phasesDir, dirName);
      const files = fs.readdirSync(phaseDir);
      const summaries = files.filter(f => f.endsWith('-SUMMARY.md'));

      for (const summary of summaries) {
        const content = safeReadFile(path.join(phaseDir, summary)) || '';

        // Extract lessons section
        const lessonsMatch = content.match(/##\s*(?:Lessons\s+Learned|Lessons|Key\s+Lessons)([\s\S]*?)(?=\n##\s|\n---|\n$|$)/i);
        const lessons = [];
        if (lessonsMatch) {
          const lessonsText = lessonsMatch[1];
          const bulletItems = lessonsText.match(/^[\s]*[-*]\s+(.+)/gm) || [];
          for (const item of bulletItems) {
            lessons.push(item.replace(/^[\s]*[-*]\s+/, '').trim());
          }
        }

        // Check for references to prior phases/milestones
        const priorRefs = [];
        const phaseRefPattern = /(?:Phase|phase)\s+(\d+)/g;
        const milestoneRefPattern = /(?:v\d+\.\d+(?:\.\d+)?)/g;
        let match;
        while ((match = phaseRefPattern.exec(content)) !== null) {
          priorRefs.push(`Phase ${match[1]}`);
        }
        while ((match = milestoneRefPattern.exec(content)) !== null) {
          priorRefs.push(match[0]);
        }

        phaseLessons.push({
          phase: dirName,
          file: summary,
          lessons,
          priorReferences: [...new Set(priorRefs)],
          hasLessons: lessons.length > 0,
        });
      }
    }
  } catch { /* empty phases dir */ }

  // Chain integrity: check that lessons reference prior work
  const totalWithLessons = phaseLessons.filter(p => p.hasLessons).length;
  const totalWithRefs = phaseLessons.filter(p => p.priorReferences.length > 0).length;
  const totalPhases = phaseLessons.length;

  let integrityStatus = 'intact';
  if (totalPhases === 0) {
    integrityStatus = 'incomplete';
  } else if (totalWithLessons === 0) {
    integrityStatus = 'broken';
  } else if (totalWithLessons < totalPhases * 0.5) {
    integrityStatus = 'incomplete';
  }

  const chainIntegrity = {
    totalPhases,
    phasesWithLessons: totalWithLessons,
    phasesWithPriorReferences: totalWithRefs,
    status: integrityStatus,
  };

  // Build catalog: count unique lessons, find recurring patterns
  const allLessons = phaseLessons.flatMap(p => p.lessons);
  const uniqueCount = new Set(allLessons).size;

  // Simple recurring pattern detection: look for repeated words across lessons
  const wordCounts = {};
  for (const lesson of allLessons) {
    const words = lesson.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    for (const word of words) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }
  const recurringPatterns = Object.entries(wordCounts)
    .filter(([, count]) => count >= 3)
    .map(([word]) => word)
    .slice(0, 5);

  const catalog = {
    totalLessons: allLessons.length,
    uniqueLessons: uniqueCount,
    recurringPatterns,
    byPhase: phaseLessons.map(p => ({ phase: p.phase, count: p.lessons.length })),
  };

  // Build report
  const reportLines = [
    '=== Lessons Chain Integrity Report ===',
    '',
    `Phases analyzed: ${totalPhases}`,
    `Phases with lessons: ${totalWithLessons}`,
    `Phases with prior references: ${totalWithRefs}`,
    '',
    `Chain integrity: ${integrityStatus.toUpperCase()}`,
    '',
    '--- Catalog ---',
    `Total lessons: ${allLessons.length}`,
    `Unique lessons: ${uniqueCount}`,
    recurringPatterns.length > 0
      ? `Recurring patterns: ${recurringPatterns.join(', ')}`
      : 'No recurring patterns detected',
    '',
    `Overall: ${integrityStatus.toUpperCase()}`,
  ];
  const report = reportLines.join('\n');

  output({
    advisory_only: true,
    chainIntegrity,
    catalog,
    report,
    overallStatus: integrityStatus,
  }, raw);
}

module.exports = {
  cmdVerifySummary,
  cmdVerifyPlanStructure,
  cmdVerifyPhaseCompleteness,
  cmdVerifyReferences,
  cmdVerifyCommits,
  cmdVerifyArtifacts,
  cmdVerifyKeyLinks,
  cmdValidateConsistency,
  cmdValidateHealth,
  cmdVerifyTestQuality,
  cmdVerifyPacing,
  cmdVerifyBatchDetection,
  cmdVerifyLessonsChain,
};

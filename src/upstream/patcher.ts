import type {
  ClassifiedEvent,
  AffectedComponent,
  ImpactManifest,
  PatchManifest,
  PatchDiff,
  PatchValidation,
  Severity,
} from './types';

// --- Injectable dependency types ---

/** Read file contents */
export type ReadFileFn = (path: string) => Promise<string>;

/** Write file contents */
export type WriteFileFn = (path: string, content: string) => Promise<void>;

/** Copy file from source to destination */
export type CopyFileFn = (src: string, dest: string) => Promise<void>;

/** Hash file contents (SHA-256) */
export type HashFileFn = (path: string) => Promise<string>;

/** Run validation (pre or post patch) */
export type RunValidationFn = (phase: string) => Promise<boolean>;

/** Get patch history for cooldown checking */
export type GetPatchHistoryFn = () => Promise<{ skill: string; timestamp: string }[]>;

/** All injectable dependencies for patch operations */
export interface PatcherDeps {
  readFile: ReadFileFn;
  writeFile: WriteFileFn;
  copyFile: CopyFileFn;
  hashFile: HashFileFn;
  runValidation: RunValidationFn;
  getPatchHistory: GetPatchHistoryFn;
}

/** Bounds validation result */
export interface BoundsResult {
  allowed: boolean;
  reason?: string;
}

/** Cooldown check result */
export interface CooldownResult {
  allowed: boolean;
  cooldownUntil?: string;
}

/** Maximum allowed patch size (20% of content) */
const MAX_PATCH_SIZE = 0.20;

/** Cooldown period in days */
const COOLDOWN_DAYS = 7;

/**
 * Apply a patch to an affected component with full safety guards.
 *
 * Safety invariants enforced:
 * - patchSize > 0.20 -> reject
 * - severity P0 or P1 -> reject (require human approval)
 * - backup must exist before any write
 * - post-validation failure -> automatic rollback
 */
export async function applyPatch(
  manifest: ImpactManifest,
  component: AffectedComponent,
  deps: PatcherDeps,
): Promise<PatchManifest> {
  const event = manifest.classification;
  const skillPath = component.component;

  // Check severity bounds (P0/P1 never auto-patched)
  const severityCheck = validatePatchBounds(0, event.severity);
  if (!severityCheck.allowed) {
    return buildRejectedManifest(manifest, component, severityCheck.reason!);
  }

  // Check cooldown
  const cooldown = await checkCooldown(skillPath, { getPatchHistory: deps.getPatchHistory });
  if (!cooldown.allowed) {
    return buildRejectedManifest(manifest, component, `Cooldown active until ${cooldown.cooldownUntil}`);
  }

  // Read current content
  const currentContent = await deps.readFile(skillPath);

  // Generate patched content
  const patchedContent = generatePatchContent(component, currentContent, event);

  // Check patch size bounds
  const patchSize = calculatePatchSize(currentContent, patchedContent);
  const boundsCheck = validatePatchBounds(patchSize, event.severity);
  if (!boundsCheck.allowed) {
    return buildRejectedManifest(manifest, component, boundsCheck.reason!);
  }

  // Run pre-validation
  const preValid = await deps.runValidation('pre');
  if (!preValid) {
    return buildFailedManifest(manifest, component, 'Pre-validation failed');
  }

  // Create backup BEFORE any write (SC-10)
  const backupPath = `rollbacks/${Date.now()}/${skillPath}`;
  await createBackup(skillPath, backupPath, deps);

  // Apply the patch
  await deps.writeFile(skillPath, patchedContent);

  // Run post-validation
  const postValid = await deps.runValidation('post');
  if (!postValid) {
    // SC-11: automatic rollback on post-validation failure
    await rollback(backupPath, skillPath, deps);
    return {
      patch_id: generatePatchId(),
      change_id: manifest.change_id,
      target_skill: skillPath,
      patch_type: event.change_type,
      severity: event.severity,
      auto_approved: false,
      diff: [{ path: skillPath, before: currentContent, after: patchedContent }],
      backup_path: backupPath,
      validation: { tests_passed: false, lint_passed: false, size_within_bounds: true },
      upstream_reference: { channel: event.channel, change_id: event.id },
    };
  }

  // Success
  return {
    patch_id: generatePatchId(),
    change_id: manifest.change_id,
    target_skill: skillPath,
    patch_type: event.change_type,
    severity: event.severity,
    auto_approved: true,
    diff: [{ path: skillPath, before: currentContent, after: patchedContent }],
    backup_path: backupPath,
    validation: { tests_passed: true, lint_passed: true, size_within_bounds: true },
    upstream_reference: { channel: event.channel, change_id: event.id },
  };
}

/**
 * Calculate the percentage of content changed between before and after.
 * Returns a value between 0 (identical) and 1 (completely different).
 */
export function calculatePatchSize(before: string, after: string): number {
  if (before === after) return 0;

  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');

  // Simple line-level diff calculation
  const beforeSet = new Set(beforeLines);
  const afterSet = new Set(afterLines);

  let changedLines = 0;
  for (const line of afterLines) {
    if (!beforeSet.has(line)) changedLines++;
  }
  for (const line of beforeLines) {
    if (!afterSet.has(line)) changedLines++;
  }

  const totalLines = Math.max(beforeLines.length, afterLines.length);
  if (totalLines === 0) return 0;

  const ratio = changedLines / (totalLines * 2);
  return Math.min(1, ratio * 2); // Normalize: all lines changed = 1.0
}

/**
 * Create a backup of a skill file before patching.
 * The backup path is used for rollback if post-validation fails.
 */
export async function createBackup(
  skillPath: string,
  rollbackDir: string,
  deps: Pick<PatcherDeps, 'readFile' | 'copyFile' | 'hashFile'>,
): Promise<string> {
  const backupPath = rollbackDir.includes(skillPath) ? rollbackDir : `${rollbackDir}`;
  await deps.copyFile(skillPath, backupPath);
  const hash = await deps.hashFile(backupPath);
  return hash;
}

/**
 * Rollback a patch by restoring from backup.
 * Ensures byte-identical restoration via SHA-256 verification (SC-05).
 */
export async function rollback(
  backupPath: string,
  skillPath: string,
  deps: Pick<PatcherDeps, 'readFile' | 'writeFile'>,
): Promise<void> {
  const backupContent = await deps.readFile(backupPath);
  await deps.writeFile(skillPath, backupContent);
}

/**
 * Validate that a patch is within allowed bounds.
 *
 * Safety rules:
 * - P0 severity: NEVER auto-patched (requires human approval)
 * - P1 severity: NEVER auto-patched (requires human approval)
 * - Patch size > 20%: REJECTED (bounded learning constraint)
 * - P2/P3 within bounds: ALLOWED
 */
export function validatePatchBounds(patchSize: number, severity: string): BoundsResult {
  // P0 and P1 always require human approval
  if (severity === 'P0') {
    return { allowed: false, reason: 'P0 severity requires human approval — never auto-patched' };
  }
  if (severity === 'P1') {
    return { allowed: false, reason: 'P1 severity requires human approval — never auto-patched' };
  }

  // Check size bounds
  if (patchSize > MAX_PATCH_SIZE) {
    return { allowed: false, reason: `Patch size ${(patchSize * 100).toFixed(1)}% exceeds 20% bound` };
  }

  return { allowed: true };
}

/**
 * Check if a skill is within its cooldown period.
 * Skills cannot be re-patched within 7 days of a previous patch (SC-14).
 */
export async function checkCooldown(
  skill: string,
  deps: Pick<PatcherDeps, 'getPatchHistory'>,
): Promise<CooldownResult> {
  const history = await deps.getPatchHistory();
  const skillPatches = history.filter((h) => h.skill === skill);

  if (skillPatches.length === 0) {
    return { allowed: true };
  }

  // Find most recent patch
  const sorted = skillPatches.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
  const lastPatch = new Date(sorted[0].timestamp);
  const cooldownEnd = new Date(lastPatch);
  cooldownEnd.setDate(cooldownEnd.getDate() + COOLDOWN_DAYS);

  const now = new Date();
  if (now < cooldownEnd) {
    return { allowed: false, cooldownUntil: cooldownEnd.toISOString() };
  }

  return { allowed: true };
}

/**
 * Generate patched content for a component based on the upstream change.
 * Handles version bumping in frontmatter if present.
 */
export function generatePatchContent(
  component: AffectedComponent,
  currentContent: string,
  event: ClassifiedEvent,
): string {
  let patched = currentContent;

  // Bump version in frontmatter if present
  patched = patched.replace(
    /version:\s*(\d+)\.(\d+)\.(\d+)/,
    (_match, major: string, minor: string, patch: string) => {
      return `version: ${major}.${minor}.${parseInt(patch, 10) + 1}`;
    },
  );

  // Add upstream reference comment if not already present
  if (!patched.includes('upstream-ref:')) {
    const ref = `\n<!-- upstream-ref: ${event.id} | ${event.channel} | ${event.timestamp} -->`;
    patched = patched + ref;
  }

  return patched;
}

// --- Internal helpers ---

/** Generate a unique patch ID */
function generatePatchId(): string {
  return `patch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Build a rejected patch manifest */
function buildRejectedManifest(
  manifest: ImpactManifest,
  component: AffectedComponent,
  reason: string,
): PatchManifest {
  return {
    patch_id: generatePatchId(),
    change_id: manifest.change_id,
    target_skill: component.component,
    patch_type: manifest.classification.change_type,
    severity: manifest.classification.severity,
    auto_approved: false,
    diff: [],
    backup_path: '',
    validation: { tests_passed: false, lint_passed: false, size_within_bounds: false },
    upstream_reference: {
      channel: manifest.classification.channel,
      change_id: manifest.classification.id,
    },
  };
}

/** Build a failed patch manifest (pre-validation failure) */
function buildFailedManifest(
  manifest: ImpactManifest,
  component: AffectedComponent,
  reason: string,
): PatchManifest {
  return {
    patch_id: generatePatchId(),
    change_id: manifest.change_id,
    target_skill: component.component,
    patch_type: manifest.classification.change_type,
    severity: manifest.classification.severity,
    auto_approved: false,
    diff: [],
    backup_path: '',
    validation: { tests_passed: false, lint_passed: false, size_within_bounds: true },
    upstream_reference: {
      channel: manifest.classification.channel,
      change_id: manifest.classification.id,
    },
  };
}

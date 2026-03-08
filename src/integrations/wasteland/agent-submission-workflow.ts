/**
 * Agent Submission Workflow — Skill-Creator → Wasteland Federation
 *
 * Handles the complete flow from skill-creator agent to wasteland federation:
 * 1. Format conversion
 * 2. Trust validation
 * 3. Role registration
 * 4. Discovery enablement
 *
 * @module agent-submission-workflow
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { GeneratedAgent } from '../../services/agents/agent-generator.js';
import {
  convertToWastelandRole,
  validateWastelandRole,
  serializeWastelandRole,
  type WastelandRoleFile
} from './agent-role-converter.js';
import { emitStampIssued } from './wasteland-events.js';
import type { WastelandEventOptions } from './wasteland-events.js';

export interface SubmissionConfig {
  /** Directory where wasteland roles are stored */
  rolesDir: string;
  /** Trust level for new submissions ('newcomer' | 'contributor' | 'maintainer') */
  trustLevel: 'newcomer' | 'contributor' | 'maintainer';
  /** Whether to require manual approval before registration */
  requireApproval: boolean;
  /** Event options for submission tracking */
  eventOptions?: WastelandEventOptions;
}

export interface SubmissionResult {
  success: boolean;
  roleFilePath?: string;
  errors: string[];
  warnings: string[];
  registrationId?: string;
  trustLevel: string;
  requiresApproval: boolean;
}

export interface PendingSubmission {
  id: string;
  agent: GeneratedAgent;
  convertedRole: WastelandRoleFile;
  submittedAt: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  trustLevel: string;
}

export const DEFAULT_SUBMISSION_CONFIG: SubmissionConfig = {
  rolesDir: '.wasteland/roles',
  trustLevel: 'newcomer',
  requireApproval: true
};

/**
 * Submit a skill-creator agent to the wasteland federation.
 */
export class AgentSubmissionWorkflow {
  private config: SubmissionConfig;

  constructor(config?: Partial<SubmissionConfig>) {
    this.config = { ...DEFAULT_SUBMISSION_CONFIG, ...config };
  }

  /**
   * Submit an agent to the wasteland federation.
   */
  async submit(agent: GeneratedAgent, submittedBy: string): Promise<SubmissionResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Step 1: Convert to wasteland role format
      const convertedRole = convertToWastelandRole(agent);

      // Step 2: Validate wasteland role format
      const validation = validateWastelandRole(convertedRole);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (!validation.valid) {
        return {
          success: false,
          errors,
          warnings,
          trustLevel: this.config.trustLevel,
          requiresApproval: this.config.requireApproval
        };
      }

      // Step 3: Trust level check
      const trustCheck = await this.validateTrustLevel(submittedBy);
      if (!trustCheck.valid) {
        errors.push(...trustCheck.errors);
        return {
          success: false,
          errors,
          warnings,
          trustLevel: this.config.trustLevel,
          requiresApproval: this.config.requireApproval
        };
      }

      // Step 4: Handle approval workflow
      if (this.config.requireApproval) {
        const pendingId = await this.createPendingSubmission(agent, convertedRole, submittedBy);
        return {
          success: true,
          errors,
          warnings,
          registrationId: pendingId,
          trustLevel: this.config.trustLevel,
          requiresApproval: true
        };
      }

      // Step 5: Direct registration (no approval required)
      const roleFilePath = await this.registerRole(convertedRole);

      // Step 6: Emit federation event
      await this.emitSubmissionEvent(agent, convertedRole, submittedBy);

      return {
        success: true,
        roleFilePath,
        errors,
        warnings,
        registrationId: `direct-${Date.now()}`,
        trustLevel: this.config.trustLevel,
        requiresApproval: false
      };

    } catch (error) {
      errors.push(`Submission failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        errors,
        warnings,
        trustLevel: this.config.trustLevel,
        requiresApproval: this.config.requireApproval
      };
    }
  }

  /**
   * Approve a pending submission.
   */
  async approveSubmission(pendingId: string, approvedBy: string): Promise<SubmissionResult> {
    try {
      const pending = await this.loadPendingSubmission(pendingId);
      if (!pending) {
        return {
          success: false,
          errors: [`Pending submission ${pendingId} not found`],
          warnings: [],
          trustLevel: this.config.trustLevel,
          requiresApproval: false
        };
      }

      // Register the role
      const roleFilePath = await this.registerRole(pending.convertedRole);

      // Update pending status
      await this.updatePendingStatus(pendingId, 'approved');

      // Emit events
      await this.emitApprovalEvent(pending, approvedBy);
      await this.emitSubmissionEvent(pending.agent, pending.convertedRole, pending.submittedBy);

      return {
        success: true,
        roleFilePath,
        errors: [],
        warnings: [],
        registrationId: pendingId,
        trustLevel: pending.trustLevel,
        requiresApproval: false
      };

    } catch (error) {
      return {
        success: false,
        errors: [`Approval failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        trustLevel: this.config.trustLevel,
        requiresApproval: false
      };
    }
  }

  /**
   * Reject a pending submission.
   */
  async rejectSubmission(pendingId: string, rejectedBy: string, reason: string): Promise<void> {
    await this.updatePendingStatus(pendingId, 'rejected');
    // Could emit rejection event here if needed
  }

  /**
   * List pending submissions.
   */
  async listPendingSubmissions(): Promise<PendingSubmission[]> {
    const pendingDir = path.join(this.config.rolesDir, '.pending');
    try {
      const files = await fs.readdir(pendingDir);
      const submissions: PendingSubmission[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(pendingDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const submission = JSON.parse(content) as PendingSubmission;
          submissions.push(submission);
        }
      }

      return submissions.filter(s => s.status === 'pending');
    } catch {
      return []; // No pending submissions or directory doesn't exist
    }
  }

  /**
   * Validate submitter's trust level.
   */
  private async validateTrustLevel(submittedBy: string): Promise<{ valid: boolean; errors: string[] }> {
    // For now, accept all submissions at newcomer level
    // In a real implementation, this would check against trust registry
    if (this.config.trustLevel === 'newcomer') {
      return { valid: true, errors: [] };
    }

    // Placeholder for trust validation
    return { valid: true, errors: [] };
  }

  /**
   * Register a role in the wasteland federation.
   */
  private async registerRole(role: WastelandRoleFile): Promise<string> {
    // Ensure roles directory exists
    await fs.mkdir(this.config.rolesDir, { recursive: true });

    // Sanitize: use basename to strip directory components, then allow only safe characters
    const safeName = path.basename(role.frontmatter.name).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!safeName) throw new Error('Invalid role name: cannot be empty after sanitization');
    const fileName = `${safeName}.md`;
    const filePath = path.join(this.config.rolesDir, fileName);
    // Double-check resolved path stays within rolesDir
    const resolvedPath = path.resolve(filePath);
    const resolvedRolesDir = path.resolve(this.config.rolesDir);
    if (!resolvedPath.startsWith(resolvedRolesDir + path.sep) && resolvedPath !== resolvedRolesDir) {
      throw new Error('Path traversal detected in role name');
    }

    // Write role file
    const content = serializeWastelandRole(role);
    await fs.writeFile(filePath, content, 'utf8');

    return filePath;
  }

  /**
   * Create a pending submission for approval.
   */
  private async createPendingSubmission(
    agent: GeneratedAgent,
    convertedRole: WastelandRoleFile,
    submittedBy: string
  ): Promise<string> {
    const pendingDir = path.join(this.config.rolesDir, '.pending');
    await fs.mkdir(pendingDir, { recursive: true });

    const submissionId = `submission-${randomUUID()}`;
    const submission: PendingSubmission = {
      id: submissionId,
      agent,
      convertedRole,
      submittedAt: new Date().toISOString(),
      submittedBy,
      status: 'pending',
      trustLevel: this.config.trustLevel
    };

    const filePath = path.join(pendingDir, `${submissionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(submission, null, 2), 'utf8');

    return submissionId;
  }

  /**
   * Load a pending submission by ID.
   */
  private async loadPendingSubmission(pendingId: string): Promise<PendingSubmission | null> {
    try {
      const safeId = path.basename(pendingId).replace(/[^a-zA-Z0-9_-]/g, '_');
      if (!safeId) return null;
      const pendingDir = path.join(this.config.rolesDir, '.pending');
      const filePath = path.join(pendingDir, `${safeId}.json`);
      const resolvedPath = path.resolve(filePath);
      const resolvedPendingDir = path.resolve(pendingDir);
      if (!resolvedPath.startsWith(resolvedPendingDir + path.sep) && resolvedPath !== resolvedPendingDir) {
        return null;
      }
      const content = await fs.readFile(filePath, 'utf8');
      return JSON.parse(content) as PendingSubmission;
    } catch {
      return null;
    }
  }

  /**
   * Update pending submission status.
   */
  private async updatePendingStatus(pendingId: string, status: PendingSubmission['status']): Promise<void> {
    const safeId = path.basename(pendingId).replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!safeId) return;
    const pendingDir = path.join(this.config.rolesDir, '.pending');
    const filePath = path.join(pendingDir, `${safeId}.json`);
    const resolvedPath = path.resolve(filePath);
    const resolvedPendingDir = path.resolve(pendingDir);
    if (!resolvedPath.startsWith(resolvedPendingDir + path.sep) && resolvedPath !== resolvedPendingDir) {
      return;
    }
    const submission = await this.loadPendingSubmission(pendingId);
    if (submission) {
      submission.status = status;
      await fs.writeFile(filePath, JSON.stringify(submission, null, 2), 'utf8');
    }
  }

  /**
   * Emit submission event to federation.
   */
  private async emitSubmissionEvent(
    agent: GeneratedAgent,
    role: WastelandRoleFile,
    submittedBy: string
  ): Promise<void> {
    if (this.config.eventOptions) {
      await emitStampIssued(
        {
          stampId: `submission-${Date.now()}`,
          wantedId: agent.name,
          handle: submittedBy
        },
        this.config.eventOptions
      );
    }
  }

  /**
   * Emit approval event.
   */
  private async emitApprovalEvent(pending: PendingSubmission, approvedBy: string): Promise<void> {
    if (this.config.eventOptions) {
      await emitStampIssued(
        {
          stampId: `approval-${Date.now()}`,
          wantedId: pending.agent.name,
          handle: pending.submittedBy
        },
        this.config.eventOptions
      );
    }
  }
}

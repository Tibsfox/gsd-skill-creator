/**
 * Agent Submission Workflow — Test Suite
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AgentSubmissionWorkflow } from '../agent-submission-workflow.js';
import type { GeneratedAgent } from '../../../services/agents/agent-generator.js';

// Mock fs operations
vi.mock('fs/promises');

const { mockEmitStampIssued } = vi.hoisted(() => ({
  mockEmitStampIssued: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('../wasteland-events.js', () => ({
  emitStampIssued: mockEmitStampIssued
}));

const mockFs = vi.mocked(fs);

describe('Agent Submission Workflow', () => {
  const sampleAgent: GeneratedAgent = {
    name: 'test-agent',
    description: 'A test agent',
    skills: ['typescript-patterns', 'test-generator'],
    filePath: '/path/to/agent.md',
    content: 'test content'
  };

  const testRolesDir = '/test/roles';
  let workflow: AgentSubmissionWorkflow;

  beforeEach(() => {
    vi.clearAllMocks();
    workflow = new AgentSubmissionWorkflow({
      rolesDir: testRolesDir,
      trustLevel: 'newcomer',
      requireApproval: false,
      eventOptions: {}
    });

    // Default mock implementations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('{}');
    mockFs.readdir.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('submit', () => {
    it('successfully submits agent without approval', async () => {
      const result = await workflow.submit(sampleAgent, 'test-user');

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.requiresApproval).toBe(false);
      expect(result.roleFilePath).toBe(path.join(testRolesDir, 'test-agent.md'));

      // Verify role file was written
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testRolesDir, 'test-agent.md'),
        expect.stringContaining('name: test-agent'),
        'utf8'
      );

      // Verify event was emitted
      expect(mockEmitStampIssued).toHaveBeenCalledWith(
        expect.objectContaining({
          wantedId: 'test-agent',
          handle: 'test-user',
        }),
        expect.anything()
      );
    });

    it('creates pending submission when approval required', async () => {
      workflow = new AgentSubmissionWorkflow({
        rolesDir: testRolesDir,
        trustLevel: 'newcomer',
        requireApproval: true
      });

      const result = await workflow.submit(sampleAgent, 'test-user');

      expect(result.success).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(result.registrationId).toMatch(/^submission-/);

      // Verify pending submission was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\/test\/roles\/\.pending\/submission-.*\.json$/),
        expect.stringContaining('"status": "pending"'),
        'utf8'
      );
    });

    it('handles validation errors', async () => {
      const invalidAgent: GeneratedAgent = {
        name: '', // invalid empty name
        description: 'test',
        skills: [],
        filePath: '/test.md',
        content: 'test'
      };

      const result = await workflow.submit(invalidAgent, 'test-user');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('handles file system errors gracefully', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      const result = await workflow.submit(sampleAgent, 'test-user');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Submission failed: Disk full');
    });
  });

  describe('approveSubmission', () => {
    const pendingSubmission = {
      id: 'test-submission',
      agent: sampleAgent,
      convertedRole: {
        frontmatter: {
          name: 'test-agent',
          description: 'A test agent',
          tools: ['typescript-patterns', 'test-generator'],
          model: 'sonnet'
        },
        content: '# Test Agent'
      },
      submittedAt: '2026-03-07T12:00:00.000Z',
      submittedBy: 'test-user',
      status: 'pending' as const,
      trustLevel: 'newcomer'
    };

    beforeEach(() => {
      mockFs.readFile.mockResolvedValue(JSON.stringify(pendingSubmission));
    });

    it('successfully approves pending submission', async () => {
      const result = await workflow.approveSubmission('test-submission', 'approver');

      expect(result.success).toBe(true);
      expect(result.roleFilePath).toBe(path.join(testRolesDir, 'test-agent.md'));

      // Verify role file was written
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(testRolesDir, 'test-agent.md'),
        '# Test Agent',
        'utf8'
      );

      // Verify pending status was updated
      const statusUpdateCall = vi.mocked(mockFs.writeFile).mock.calls.find(call =>
        String(call[0]).includes('.pending/test-submission.json')
      );
      expect(statusUpdateCall).toBeDefined();
      expect(statusUpdateCall![1]).toContain('"status": "approved"');
    });

    it('handles missing pending submission', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));

      const result = await workflow.approveSubmission('nonexistent', 'approver');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Pending submission nonexistent not found');
    });
  });

  describe('rejectSubmission', () => {
    it('updates pending submission status to rejected', async () => {
      const pendingSubmission = {
        id: 'test-submission',
        status: 'pending'
      };
      mockFs.readFile.mockResolvedValue(JSON.stringify(pendingSubmission));

      await workflow.rejectSubmission('test-submission', 'rejector', 'Not suitable');

      // Verify status was updated to rejected
      const statusUpdateCall = vi.mocked(mockFs.writeFile).mock.calls.find(call =>
        String(call[0]).includes('.pending/test-submission.json')
      );
      expect(statusUpdateCall).toBeDefined();
      expect(statusUpdateCall![1]).toContain('"status": "rejected"');
    });
  });

  describe('listPendingSubmissions', () => {
    it('returns list of pending submissions', async () => {
      const pendingSubmission1 = {
        id: 'submission-1',
        status: 'pending',
        agent: { name: 'agent-1' }
      };
      const pendingSubmission2 = {
        id: 'submission-2',
        status: 'pending',
        agent: { name: 'agent-2' }
      };
      const approvedSubmission = {
        id: 'submission-3',
        status: 'approved',
        agent: { name: 'agent-3' }
      };

      mockFs.readdir.mockResolvedValue(['submission-1.json', 'submission-2.json', 'submission-3.json'] as any);
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(pendingSubmission1))
        .mockResolvedValueOnce(JSON.stringify(pendingSubmission2))
        .mockResolvedValueOnce(JSON.stringify(approvedSubmission));

      const result = await workflow.listPendingSubmissions();

      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toEqual(['submission-1', 'submission-2']);
    });

    it('returns empty array when no pending directory exists', async () => {
      mockFs.readdir.mockRejectedValue(new Error('Directory not found'));

      const result = await workflow.listPendingSubmissions();

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('handles malformed pending submission files', async () => {
      mockFs.readFile.mockResolvedValue('invalid json');

      const result = await workflow.approveSubmission('test-submission', 'approver');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles permission errors during file operations', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const result = await workflow.submit(sampleAgent, 'test-user');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Submission failed: Permission denied');
    });
  });
});

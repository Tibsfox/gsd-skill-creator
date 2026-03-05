/**
 * Pack Infrastructure Types
 *
 * Shared schema for all mission and educational packs.
 * Supports passion-driven learning with safe reversibility (Nethack principles).
 */

import { z } from 'zod';

/**
 * Pack metadata — version, author, complexity, time estimate
 */
export const PackMetadataSchema = z.object({
  id: z.string().describe('Unique pack identifier (e.g., "pack-wasteland-newcomer")'),
  title: z.string().describe('Human-readable title'),
  description: z.string().describe('One-paragraph overview'),
  type: z.enum(['mission', 'educational']).describe('Pack category'),
  category: z.string().describe('Subcategory (e.g., "getting-started", "complex-plane")'),
  author: z.string().describe('Pack creator'),
  version: z.string().describe('Semantic version (e.g., "1.0.0")'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  passion_alignment: z.array(z.string()).describe('Tags: completers, designers, explorers, teachers, validators'),
  estimated_duration: z.object({
    min_hours: z.number(),
    max_hours: z.number(),
  }),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
});

export type PackMetadata = z.infer<typeof PackMetadataSchema>;

/**
 * Phase structure — a unit of work within a pack (e.g., "setup", "exploration", "completion")
 */
export const PackPhaseSchema = z.object({
  id: z.string().describe('Phase identifier (e.g., "phase-1-setup")'),
  title: z.string(),
  description: z.string(),
  estimated_duration_minutes: z.number(),
  sequence: z.number().describe('Execution order (1, 2, 3, ...)'),
  objectives: z.array(z.string()).describe('What learner should accomplish'),
  instructions: z.string().describe('Step-by-step guidance (markdown)'),
  resources: z.array(z.object({
    type: z.enum(['file', 'url', 'command', 'tool']),
    label: z.string(),
    path_or_url: z.string(),
  })),
  exit_points: z.array(z.object({
    label: z.string().describe('Why learner might exit (e.g., "overcomplicated")'),
    safe_retreat: z.string().describe('Where to go for help (e.g., "Sam (0.50, 0.50) center")'),
  })),
  checkpoint: z.object({
    question: z.string().describe('Verification question'),
    success_criteria: z.array(z.string()),
  }),
});

export type PackPhase = z.infer<typeof PackPhaseSchema>;

/**
 * Role definition — who the learner becomes during the pack
 */
export const PackRoleSchema = z.object({
  id: z.string().describe('Role identifier'),
  title: z.string().describe('Role name (e.g., "Wasteland Scout")'),
  description: z.string(),
  complex_plane_position: z.object({
    real: z.number().min(0).max(1),
    imaginary: z.number().min(0).max(1),
  }).describe('Position on muse complex plane for guidance matching'),
  responsibilities: z.array(z.string()),
});

export type PackRole = z.infer<typeof PackRoleSchema>;

/**
 * Assessment structure — how learner demonstrates mastery
 */
export const PackAssessmentSchema = z.object({
  type: z.enum(['checkpoint', 'reflection', 'project', 'choice']),
  prompt: z.string().describe('What learner is asked to do'),
  success_indicators: z.array(z.string()).describe('Signs of successful completion'),
  feedback_template: z.string().describe('How to provide encouraging feedback'),
});

export type PackAssessment = z.infer<typeof PackAssessmentSchema>;

/**
 * Full pack document
 */
export const PackDocumentSchema = z.object({
  metadata: PackMetadataSchema,
  mission: z.object({
    goal: z.string().describe('What learner will achieve'),
    scope: z.string().describe('What is included/excluded'),
    success_criteria: z.array(z.string()),
  }).optional(),
  roles: z.array(PackRoleSchema),
  phases: z.array(PackPhaseSchema),
  assessments: z.array(PackAssessmentSchema),
  safe_reversibility: z.object({
    entry_point: z.string().describe('How learner enters pack'),
    exit_points: z.array(z.object({
      phase: z.number(),
      label: z.string(),
      next_step: z.string().describe('Where to go'),
    })),
    refuge_point: z.string().describe('Central safe place (Sam = 0.50, 0.50)'),
    graceful_failure: z.string().describe('What happens if learner gets stuck'),
  }),
  resources: z.object({
    documentation: z.array(z.object({ title: z.string(), path: z.string() })),
    tools: z.array(z.string()),
    external_links: z.array(z.object({ title: z.string(), url: z.string() })),
  }),
});

export type PackDocument = z.infer<typeof PackDocumentSchema>;

/**
 * Pack state — tracks learner progress
 */
export const PackProgressSchema = z.object({
  pack_id: z.string(),
  learner_handle: z.string().describe('Wasteland rig handle'),
  started_at: z.string().datetime(),
  current_phase: z.number(),
  completed_phases: z.array(z.number()),
  checkpoints_passed: z.array(z.object({
    phase: z.number(),
    timestamp: z.string().datetime(),
    feedback: z.string(),
  })),
  abandoned_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
});

export type PackProgress = z.infer<typeof PackProgressSchema>;

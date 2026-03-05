/**
 * Pack CLI — Interactive pack creation and management
 */

import * as fs from 'fs';
import * as path from 'path';
import { PackDocumentSchema, type PackDocument } from './pack-types';
import { PackLoader } from './pack-loader';

export class PackCLI {
  private loader: PackLoader;
  private packsDir: string;

  constructor(packsDir: string = path.join(process.cwd(), 'src/packs')) {
    this.packsDir = packsDir;
    this.loader = new PackLoader(packsDir);
  }

  /**
   * Initialize a new pack scaffold
   * Creates: pack-{id}/PACK.json, BRIEFING.md, ROLES.json, PHASES.json, LOGS/
   */
  async initPack(packId: string, options: {
    type: 'mission' | 'educational';
    title: string;
    description: string;
    author: string;
    passion_alignment: string[];
  }): Promise<void> {
    const packDir = path.join(this.packsDir, `pack-${packId}`);

    // Check if exists
    if (fs.existsSync(packDir)) {
      throw new Error(`Pack already exists: ${packId}`);
    }

    // Create directory structure
    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(path.join(packDir, 'RESOURCES'), { recursive: true });
    fs.mkdirSync(path.join(packDir, 'LOGS'), { recursive: true });

    // Create PACK.json scaffold
    const packScaffold: Partial<PackDocument> = {
      metadata: {
        id: packId,
        title: options.title,
        description: options.description,
        type: options.type,
        category: 'uncategorized',
        author: options.author,
        version: '0.1.0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        passion_alignment: options.passion_alignment,
        estimated_duration: { min_hours: 1, max_hours: 3 },
        difficulty: 'beginner',
      },
      ...(options.type === 'mission' && {
        mission: {
          goal: 'Define the learner goal',
          scope: 'Define what is included/excluded',
          success_criteria: ['Criterion 1', 'Criterion 2'],
        },
      }),
      roles: [
        {
          id: 'learner',
          title: `${options.title} Learner`,
          description: 'You in this pack',
          complex_plane_position: { real: 0.5, imaginary: 0.5 },
          responsibilities: ['Learn', 'Build', 'Reflect'],
        },
      ],
      phases: [
        {
          id: 'phase-1-setup',
          title: 'Phase 1: Setup',
          description: 'Get ready to begin',
          estimated_duration_minutes: 15,
          sequence: 1,
          objectives: ['Understand the goal', 'Gather materials'],
          instructions: '## Phase 1: Setup\n\nFollow these steps to get started.',
          resources: [],
          exit_points: [
            {
              label: 'Too confusing',
              safe_retreat: 'Sam (0.50, 0.50) — ask for help in #learning channel',
            },
          ],
          checkpoint: {
            question: 'Are you ready to start?',
            success_criteria: ['You have confirmed understanding'],
          },
        },
      ],
      assessments: [
        {
          type: 'checkpoint',
          prompt: 'What did you learn?',
          success_indicators: ['Specific example', 'Reflection on process'],
          feedback_template: 'Great work! You demonstrated understanding by...',
        },
      ],
      safe_reversibility: {
        entry_point: 'Start at Phase 1: Setup',
        exit_points: [
          { phase: 1, label: 'Overwhelmed', next_step: 'Talk to Sam at center (0.50, 0.50)' },
          {
            phase: 2,
            label: 'Lost interest',
            next_step: 'Pause and try a different passion-aligned pack',
          },
        ],
        refuge_point: 'Sam (0.50, 0.50) — the center of the complex plane, always available',
        graceful_failure:
          'If stuck: Ask for help, take a break, try a smaller pack first, or explore a different learning path',
      },
      resources: {
        documentation: [{ title: 'BRIEFING.md', path: './BRIEFING.md' }],
        tools: [],
        external_links: [],
      },
    };

    fs.writeFileSync(path.join(packDir, 'PACK.json'), JSON.stringify(packScaffold, null, 2));

    // Create BRIEFING.md
    const briefing = `# ${options.title}

**Type:** ${options.type}
**Author:** ${options.author}
**Duration:** ${packScaffold.estimated_duration?.min_hours}-${packScaffold.estimated_duration?.max_hours} hours

## Overview

${options.description}

## For Whom?

Passion alignment: ${options.passion_alignment.join(', ')}

## What You'll Learn

- Learning outcome 1
- Learning outcome 2
- Learning outcome 3

## Getting Started

See Phase 1 in PACK.json to begin.
`;

    fs.writeFileSync(path.join(packDir, 'BRIEFING.md'), briefing);

    // Create README
    const readme = `# Pack: ${packId}

Scaffold created. Edit PACK.json to define phases, objectives, and assessments.

## Structure

- \`PACK.json\` — Pack configuration (metadata, phases, roles, assessments)
- \`BRIEFING.md\` — Human-readable overview
- \`RESOURCES/\` — Supporting files (docs, templates, scripts)
- \`LOGS/\` — Learner progress tracking

## Next Steps

1. Edit \`PACK.json\` to define your phases
2. Add resources to \`RESOURCES/\`
3. Test with volunteers
4. Submit to Wasteland wanted board
`;

    fs.writeFileSync(path.join(packDir, 'README.md'), readme);
  }

  /**
   * List all packs with metadata
   */
  async listPacks(): Promise<Array<{ id: string; title: string; type: string }>> {
    const packs = this.loader.listPacks();

    return Promise.all(
      packs.map(async id => {
        try {
          const pack = await this.loader.loadPack(id);
          return {
            id,
            title: pack.metadata.title,
            type: pack.metadata.type,
          };
        } catch {
          return { id, title: '(error loading)', type: 'unknown' };
        }
      }),
    );
  }

  /**
   * Show pack details
   */
  async showPack(packId: string): Promise<void> {
    const pack = await this.loader.loadPack(packId);
    console.log(`\n# ${pack.metadata.title}`);
    console.log(`Type: ${pack.metadata.type} | Duration: ${pack.metadata.estimated_duration.min_hours}-${pack.metadata.estimated_duration.max_hours}h`);
    console.log(`\n${pack.metadata.description}`);
    console.log(`\n## Phases`);
    for (const phase of pack.phases) {
      console.log(`- ${phase.sequence}. ${phase.title} (${phase.estimated_duration_minutes}min)`);
    }
  }

  /**
   * Validate pack against schema
   */
  async validatePack(packId: string): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const pack = await this.loader.loadPack(packId);
      PackDocumentSchema.parse(pack);
      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        errors: error.errors?.map((e: any) => e.message) || [error.message],
      };
    }
  }
}

/**
 * Tests for knowledge pack Zod schemas.
 *
 * Validates all schemas against data shapes from the MATH-101 .skillmeta
 * delivery package exemplar and the SKILLMETA-FORMAT.md specification.
 */

import { describe, it, expect } from 'vitest';
import {
  PackStatusSchema,
  PackClassificationSchema,
  GradeLevelEntrySchema,
  ContributorSchema,
  LearningOutcomeSchema,
  ModuleTimeEstimatesSchema,
  ModuleActivitiesSchema,
  PackModuleSchema,
  PackActivitySchema,
  AssessmentMethodSchema,
  PackDependencySchema,
  LearningPathwaySchema,
  CrossModuleCompetencySchema,
  ToolSchema,
  InteractiveElementSchema,
  TranslationEntrySchema,
  TranslationSchema,
  AccessibilitySchema,
  StandardAlignmentSchema,
  DifficultySchema,
  ContentFlagSchema,
  CommunitySchema,
  MaintenanceSchema,
  MetricsSchema,
  ResourceSchema,
  RelatedPackSchema,
  ChangelogEntrySchema,
  QaSchema,
  GsdIntegrationSchema,
  PackFilesSchema,
  KnowledgePackSchema,
  ModulesFileSchema,
} from '../types.js';
import type {
  KnowledgePack,
  PackModule,
  PackActivity,
  LearningOutcome,
  PackDependency,
  LearningPathway,
} from '../types.js';

// ============================================================================
// PackStatus and PackClassification enums
// ============================================================================

describe('PackStatusSchema', () => {
  it('accepts alpha', () => {
    expect(PackStatusSchema.parse('alpha')).toBe('alpha');
  });

  it('accepts beta', () => {
    expect(PackStatusSchema.parse('beta')).toBe('beta');
  });

  it('accepts stable', () => {
    expect(PackStatusSchema.parse('stable')).toBe('stable');
  });

  it('accepts deprecated', () => {
    expect(PackStatusSchema.parse('deprecated')).toBe('deprecated');
  });

  it('rejects unknown', () => {
    expect(() => PackStatusSchema.parse('unknown')).toThrow();
  });
});

describe('PackClassificationSchema', () => {
  it('accepts core_academic', () => {
    expect(PackClassificationSchema.parse('core_academic')).toBe('core_academic');
  });

  it('accepts applied', () => {
    expect(PackClassificationSchema.parse('applied')).toBe('applied');
  });

  it('accepts specialized', () => {
    expect(PackClassificationSchema.parse('specialized')).toBe('specialized');
  });

  it('rejects invalid classification', () => {
    expect(() => PackClassificationSchema.parse('hobby')).toThrow();
  });
});

// ============================================================================
// GradeLevelEntrySchema
// ============================================================================

describe('GradeLevelEntrySchema', () => {
  it('accepts Foundation level from MATH-101', () => {
    const result = GradeLevelEntrySchema.parse({
      label: 'Foundation',
      grades: ['PreK', 'K', '1', '2'],
      estimated_hours: [40, 60],
    });
    expect(result.label).toBe('Foundation');
    expect(result.grades).toEqual(['PreK', 'K', '1', '2']);
  });

  it('accepts Elementary level', () => {
    const result = GradeLevelEntrySchema.parse({
      label: 'Elementary',
      grades: ['3', '4', '5'],
      estimated_hours: [60, 80],
    });
    expect(result.label).toBe('Elementary');
  });

  it('accepts Middle School level', () => {
    const result = GradeLevelEntrySchema.parse({
      label: 'Middle School',
      grades: ['6', '7', '8'],
      estimated_hours: [80, 120],
    });
    expect(result.label).toBe('Middle School');
  });

  it('accepts High School level', () => {
    const result = GradeLevelEntrySchema.parse({
      label: 'High School',
      grades: ['9', '10', '11', '12'],
      estimated_hours: [120, 180],
    });
    expect(result.label).toBe('High School');
  });

  it('accepts College level', () => {
    const result = GradeLevelEntrySchema.parse({
      label: 'College',
      grades: ['13', '14', '15', '16'],
      estimated_hours: [180, 240],
    });
    expect(result.label).toBe('College');
  });
});

// ============================================================================
// LearningOutcomeSchema
// ============================================================================

describe('LearningOutcomeSchema', () => {
  it('accepts valid learning outcome from MATH-101', () => {
    const result = LearningOutcomeSchema.parse({
      code: 'LO-NUM-001',
      description: 'Recognize and describe numerical patterns',
      levels: ['K', '1', '2', '3', '4', '5'],
    });
    expect(result.code).toBe('LO-NUM-001');
    expect(result.levels).toHaveLength(6);
  });

  it('rejects missing code', () => {
    expect(() =>
      LearningOutcomeSchema.parse({
        description: 'Some description',
        levels: ['K'],
      }),
    ).toThrow();
  });

  it('rejects missing description', () => {
    expect(() =>
      LearningOutcomeSchema.parse({
        code: 'LO-001',
        levels: ['K'],
      }),
    ).toThrow();
  });
});

// ============================================================================
// PackModuleSchema
// ============================================================================

describe('PackModuleSchema', () => {
  it('accepts full module from MATH-101-modules.yaml', () => {
    const result = PackModuleSchema.parse({
      id: 'MATH-101-M1',
      name: 'Number & Operations',
      description: 'Understanding quantity, place value, and how to combine/separate quantities',
      learning_outcomes: [
        'Recognize quantities without counting (subitizing)',
        'Understand what numbers represent',
        'Compose and decompose numbers flexibly',
        'Apply operations (add, subtract, multiply, divide) meaningfully',
        'Develop fluency with operations',
      ],
      topics: [
        'Subitizing & Cardinality',
        'Counting Principles',
        'Number Composition & Decomposition',
        'Addition & Subtraction',
        'Multiplication & Division',
        'Place Value',
        'Multi-Digit Operations',
      ],
      grade_levels: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      time_estimates: {
        foundation: 40,
        elementary: 30,
        middle: 20,
        high: 0,
      },
      prerequisite_modules: [],
      activities: {
        count: 8,
        examples: [
          'Finger Counting & Subitizing Games',
          'Number Composition with Manipulatives',
        ],
      },
      assessments: [
        'Can student recognize quantities instantly?',
        'Does student understand operation meaning?',
      ],
    });
    expect(result.id).toBe('MATH-101-M1');
    expect(result.learning_outcomes).toHaveLength(5);
    expect(result.topics).toHaveLength(7);
  });

  it('rejects module missing id', () => {
    expect(() =>
      PackModuleSchema.parse({
        name: 'Some Module',
        description: 'desc',
        learning_outcomes: [],
        topics: [],
        grade_levels: [],
        time_estimates: { foundation: 10 },
        prerequisite_modules: [],
      }),
    ).toThrow();
  });

  it('rejects module missing name', () => {
    expect(() =>
      PackModuleSchema.parse({
        id: 'MOD-1',
        description: 'desc',
        learning_outcomes: [],
        topics: [],
        grade_levels: [],
        time_estimates: { foundation: 10 },
        prerequisite_modules: [],
      }),
    ).toThrow();
  });
});

// ============================================================================
// PackActivitySchema
// ============================================================================

describe('PackActivitySchema', () => {
  it('accepts valid activity', () => {
    const result = PackActivitySchema.parse({
      id: 'ACT-001',
      name: 'Finger Counting Games',
      module_id: 'MATH-101-M1',
      grade_range: ['K', '1', '2'],
      duration_minutes: 30,
      description: 'Interactive counting activity using fingers and manipulatives',
      materials: ['counting blocks', 'number cards'],
      learning_objectives: ['Count to 20', 'Recognize quantity patterns'],
      variations: ['Use different manipulatives', 'Increase difficulty'],
    });
    expect(result.id).toBe('ACT-001');
    expect(result.duration_minutes).toBe(30);
  });

  it('accepts activity without optional variations', () => {
    const result = PackActivitySchema.parse({
      id: 'ACT-002',
      name: 'Pattern Extension',
      module_id: 'MATH-101-M2',
      grade_range: ['3', '4', '5'],
      duration_minutes: 45,
      description: 'Extend visual and numerical patterns',
      materials: [],
      learning_objectives: ['Extend patterns'],
    });
    expect(result.id).toBe('ACT-002');
  });

  it('rejects activity missing id', () => {
    expect(() =>
      PackActivitySchema.parse({
        name: 'Some Activity',
        module_id: 'MOD-1',
        grade_range: [],
        duration_minutes: 30,
        description: 'desc',
        materials: [],
        learning_objectives: [],
      }),
    ).toThrow();
  });
});

// ============================================================================
// AssessmentMethodSchema
// ============================================================================

describe('AssessmentMethodSchema', () => {
  it('accepts formative assessment from MATH-101', () => {
    const result = AssessmentMethodSchema.parse({
      type: 'formative',
      name: 'Mathematical Discourse',
      frequency: 'ongoing',
    });
    expect(result.type).toBe('formative');
    expect(result.name).toBe('Mathematical Discourse');
  });

  it('accepts summative assessment from MATH-101', () => {
    const result = AssessmentMethodSchema.parse({
      type: 'summative',
      name: 'Portfolio',
      frequency: 'end_of_unit',
    });
    expect(result.type).toBe('summative');
  });

  it('rejects invalid assessment type', () => {
    expect(() =>
      AssessmentMethodSchema.parse({
        type: 'diagnostic',
        name: 'Test',
        frequency: 'weekly',
      }),
    ).toThrow();
  });
});

// ============================================================================
// PackDependencySchema
// ============================================================================

describe('PackDependencySchema', () => {
  it('accepts dependency without description', () => {
    const result = PackDependencySchema.parse({
      pack_id: 'MATH-101',
      relationship: 'prerequisite',
    });
    expect(result.pack_id).toBe('MATH-101');
    expect(result.relationship).toBe('prerequisite');
  });

  it('accepts dependency with description', () => {
    const result = PackDependencySchema.parse({
      pack_id: 'PHYS-101',
      relationship: 'enables',
      description: 'Physics requires math',
    });
    expect(result.description).toBe('Physics requires math');
  });
});

// ============================================================================
// LearningPathwaySchema
// ============================================================================

describe('LearningPathwaySchema', () => {
  it('accepts Linear Pathway from MATH-101', () => {
    const result = LearningPathwaySchema.parse({
      name: 'Linear Pathway',
      description: 'M1 -> M2 -> M3 & M4',
      rationale: 'Number & operations are foundational; algebra and geometry can proceed in parallel',
    });
    expect(result.name).toBe('Linear Pathway');
  });
});

// ============================================================================
// ContentFlagSchema
// ============================================================================

describe('ContentFlagSchema', () => {
  it('accepts content flag from MATH-101', () => {
    const result = ContentFlagSchema.parse({
      flag: 'anxiety_potential',
      description: 'Some learners have math anxiety. Pack addresses this explicitly.',
      mitigation: 'Focus on understanding, not speed. Celebrate struggles.',
    });
    expect(result.flag).toBe('anxiety_potential');
  });
});

// ============================================================================
// AccessibilitySchema
// ============================================================================

describe('AccessibilitySchema', () => {
  it('accepts accessibility data from MATH-101', () => {
    const result = AccessibilitySchema.parse({
      screen_reader_compatible: true,
      large_text_available: true,
      high_contrast_available: true,
      keyboard_navigable: true,
      alt_text_provided: true,
      captions_available: false,
      notes: 'All visual content has text descriptions. Consider adding video lectures with captions.',
    });
    expect(result.screen_reader_compatible).toBe(true);
    expect(result.captions_available).toBe(false);
  });
});

// ============================================================================
// TranslationSchema
// ============================================================================

describe('TranslationSchema', () => {
  it('accepts translation data from MATH-101', () => {
    const result = TranslationSchema.parse({
      available: [
        { language_code: 'en', name: 'English', complete: true },
        { language_code: 'es', name: 'Espanol', complete: false, progress: '45%' },
      ],
      planned: ['fr', 'zh', 'ar'],
    });
    expect(result.available).toHaveLength(2);
    expect(result.planned).toEqual(['fr', 'zh', 'ar']);
  });
});

// ============================================================================
// DifficultySchema
// ============================================================================

describe('DifficultySchema', () => {
  it('accepts difficulty data from MATH-101', () => {
    const result = DifficultySchema.parse({
      conceptual_demand: 'high',
      technical_demand: 'low',
      prerequisites_required: 'low',
      notes: 'Difficulty is in thinking, not syntax or tools',
    });
    expect(result.conceptual_demand).toBe('high');
  });
});

// ============================================================================
// ResourceSchema
// ============================================================================

describe('ResourceSchema', () => {
  it('accepts resource from MATH-101', () => {
    const result = ResourceSchema.parse({
      type: 'textbook',
      title: 'How Children Learn Mathematics',
      author: 'David Thornton',
      url: null,
    });
    expect(result.type).toBe('textbook');
    expect(result.url).toBeNull();
  });

  it('accepts resource with URL', () => {
    const result = ResourceSchema.parse({
      type: 'online_course',
      title: '3Blue1Brown Mathematics',
      author: '3Blue1Brown',
      url: 'https://www.youtube.com/3blue1brown',
    });
    expect(result.url).toBe('https://www.youtube.com/3blue1brown');
  });
});

// ============================================================================
// CommunitySchema
// ============================================================================

describe('CommunitySchema', () => {
  it('accepts community data from MATH-101', () => {
    const result = CommunitySchema.parse({
      discussion_forum: 'https://community.gsd.edu/math-101',
      contribution_guidelines: 'CONTRIBUTING.md',
      open_issues_tag: 'MATH-101',
      looking_for: [
        'Additional activities for middle school algebra',
        'Geometry visualizations',
        'Translations to Spanish & Mandarin',
      ],
    });
    expect(result.looking_for).toHaveLength(3);
  });
});

// ============================================================================
// MaintenanceSchema
// ============================================================================

describe('MaintenanceSchema', () => {
  it('accepts maintenance data from MATH-101', () => {
    const result = MaintenanceSchema.parse({
      review_frequency: 'quarterly',
      last_reviewed: '2026-02-15',
      next_review: '2026-05-15',
      maintainer: 'Math Education Working Group',
    });
    expect(result.review_frequency).toBe('quarterly');
  });
});

// ============================================================================
// KnowledgePackSchema (the main schema)
// ============================================================================

describe('KnowledgePackSchema', () => {
  const minimalPack = {
    pack_id: 'TEST-001',
    pack_name: 'Test Pack',
    version: '1.0.0',
    status: 'alpha' as const,
    classification: 'core_academic' as const,
    description: 'A test knowledge pack',
    contributors: [{ name: 'Test Author', role: 'architect' }],
    modules: [],
    learning_outcomes: [],
    copyright: 'CC-BY-SA-4.0',
    tags: ['test'],
    gsd_integration: {},
    grade_levels: [
      { label: 'Foundation', grades: ['K'], estimated_hours: [10, 20] },
    ],
  };

  it('accepts minimal valid pack', () => {
    const result = KnowledgePackSchema.parse(minimalPack);
    expect(result.pack_id).toBe('TEST-001');
    expect(result.pack_name).toBe('Test Pack');
    expect(result.dependencies).toEqual([]);
  });

  it('accepts full MATH-101 .skillmeta structure', () => {
    const math101: unknown = {
      pack_id: 'MATH-101',
      pack_name: 'Mathematics -- Foundational Knowledge Pack',
      version: '1.0.0',
      release_date: '2026-02-18',
      status: 'alpha',
      classification: 'core_academic',
      learning_domain: 'quantitative_reasoning',
      description:
        'Mathematics as a way of thinking: pattern recognition, precise reasoning, and building complexity from simple rules.',
      short_description: 'Pattern, precision, and mathematical thinking across K-College',
      contributors: [
        { name: 'GSD Foundation', role: 'architect' },
        { name: 'Mathematics Education Working Group', role: 'content_creators' },
      ],
      copyright: 'Creative Commons Attribution-ShareAlike 4.0 (CC-BY-SA-4.0)',
      maintained_by: 'GSD-Foundational-Knowledge',
      dependencies: [],
      prerequisite_packs: [],
      recommended_prior_knowledge: [],
      enables: ['PHYS-101', 'CODE-101', 'DATA-101', 'ECON-101', 'ASTRO-101', 'LOG-101'],
      grade_levels: [
        { label: 'Foundation', grades: ['PreK', 'K', '1', '2'], estimated_hours: [40, 60] },
        { label: 'Elementary', grades: ['3', '4', '5'], estimated_hours: [60, 80] },
        { label: 'Middle School', grades: ['6', '7', '8'], estimated_hours: [80, 120] },
        { label: 'High School', grades: ['9', '10', '11', '12'], estimated_hours: [120, 180] },
        { label: 'College', grades: ['13', '14', '15', '16'], estimated_hours: [180, 240] },
      ],
      modules: [
        {
          id: 'MATH-101-M1',
          name: 'Number & Operations',
          description: 'Understanding quantity, place value',
          learning_outcomes: ['Recognize quantities'],
          topics: ['Subitizing & Cardinality'],
          grade_levels: ['K', '1', '2'],
          time_estimates: { foundation: 40, elementary: 30, middle: 20, high: 0 },
          prerequisite_modules: [],
          activities: { count: 8, examples: ['Finger Counting'] },
          assessments: ['Can student recognize quantities?'],
        },
      ],
      learning_outcomes: [
        { code: 'LO-NUM-001', description: 'Recognize and describe numerical patterns', levels: ['K', '1', '2'] },
        { code: 'LO-ALG-001', description: 'Use variables to represent unknown quantities', levels: ['3', '4', '5'] },
      ],
      assessment_methods: [
        { type: 'formative', name: 'Mathematical Discourse', frequency: 'ongoing' },
        { type: 'summative', name: 'Portfolio', frequency: 'end_of_unit' },
      ],
      tools_required: [],
      tools_optional: [
        { name: 'graphing_calculator', url: 'https://www.desmos.com' },
        { name: 'algebra_manipulatives', integrated: true, description: 'Visual representations' },
      ],
      interactive_elements: [
        { type: 'manipulative', name: 'Blocks & Counters' },
        { type: 'simulator', name: 'Balance Scale' },
      ],
      translations: {
        available: [
          { language_code: 'en', name: 'English', complete: true },
          { language_code: 'es', name: 'Espanol', complete: false, progress: '45%' },
        ],
        planned: ['fr', 'zh', 'ar'],
      },
      accessibility: {
        screen_reader_compatible: true,
        large_text_available: true,
        high_contrast_available: true,
        keyboard_navigable: true,
        alt_text_provided: true,
        captions_available: false,
        notes: 'All visual content has text descriptions.',
      },
      standards_alignment: [
        {
          framework: 'Common Core State Standards (Math)',
          version: 2010,
          alignments: { 'K.CC': 'Counting & Cardinality', '1.NBT': 'Numbers & Operations in Base Ten' },
        },
        {
          framework: 'NCTM Principles & Standards',
          version: 2000,
          alignments: { 'Number & Operations': true, Algebra: true },
        },
      ],
      difficulty: {
        conceptual_demand: 'high',
        technical_demand: 'low',
        prerequisites_required: 'low',
        notes: 'Difficulty is in thinking, not syntax or tools',
      },
      content_flags: [
        {
          flag: 'anxiety_potential',
          description: 'Some learners have math anxiety.',
          mitigation: 'Focus on understanding, not speed.',
        },
      ],
      community: {
        discussion_forum: 'https://community.gsd.edu/math-101',
        contribution_guidelines: 'CONTRIBUTING.md',
        open_issues_tag: 'MATH-101',
        looking_for: ['Geometry visualizations'],
      },
      maintenance: {
        review_frequency: 'quarterly',
        last_reviewed: '2026-02-15',
        next_review: '2026-05-15',
        maintainer: 'Math Education Working Group',
      },
      metrics: {
        active_learners: 0,
        completion_rate: null,
        satisfaction_rating: null,
      },
      tags: ['mathematics', 'quantitative-reasoning', 'stem', 'foundational'],
      resources: [
        { type: 'textbook', title: 'How Children Learn Mathematics', author: 'David Thornton', url: null },
        {
          type: 'online_course',
          title: '3Blue1Brown Mathematics',
          author: '3Blue1Brown',
          url: 'https://www.youtube.com/3blue1brown',
        },
      ],
      related_packs: [
        { id: 'PHYS-101', relationship: 'Mathematical modeling underlies physics' },
        { id: 'CODE-101', relationship: 'Algorithms are mathematical structures' },
      ],
      gsd_integration: {
        dashboard_display: { icon: 'math-symbol', color: '#4A90E2', position: 'Featured - Core' },
        activity_scaffolding: true,
        skill_creator_enabled: true,
        adaptive_pacing: true,
        cache_keys: ['MATH-101-core-concepts', 'MATH-101-assessment-patterns'],
      },
      files: {
        vision_document: 'MATH-101-vision.md',
        modules_definition: 'MATH-101-modules.yaml',
        activities: 'MATH-101-activities.json',
        assessment: 'MATH-101-assessment.md',
        resources: 'MATH-101-resources.md',
        readme: 'README.md',
      },
      changelog: [
        {
          version: '1.0.0',
          date: '2026-02-18',
          changes: ['Initial release: Four core modules', 'Contributed 12 starter activities'],
        },
      ],
      qa: {
        peer_reviewed: true,
        tested_with_learners: false,
        culturally_responsive: true,
        bias_audit_completed: false,
        accessibility_audit_completed: false,
        next_audit_scheduled: '2026-04-15',
      },
    };

    const result = KnowledgePackSchema.parse(math101);
    expect(result.pack_id).toBe('MATH-101');
    expect(result.enables).toContain('PHYS-101');
    expect(result.grade_levels).toHaveLength(5);
    expect(result.modules).toHaveLength(1);
    expect(result.learning_outcomes).toHaveLength(2);
    expect(result.assessment_methods).toHaveLength(2);
    expect(result.tags).toContain('stem');
  });

  it('rejects pack missing pack_id', () => {
    expect(() =>
      KnowledgePackSchema.parse({
        ...minimalPack,
        pack_id: undefined,
      }),
    ).toThrow();
  });

  it('rejects pack with invalid status', () => {
    expect(() =>
      KnowledgePackSchema.parse({
        ...minimalPack,
        status: 'invalid',
      }),
    ).toThrow();
  });

  it('defaults empty arrays for optional array fields', () => {
    const result = KnowledgePackSchema.parse(minimalPack);
    expect(result.dependencies).toEqual([]);
    expect(result.prerequisite_packs).toEqual([]);
    expect(result.recommended_prior_knowledge).toEqual([]);
    expect(result.enables).toEqual([]);
    expect(result.assessment_methods).toEqual([]);
    expect(result.tools_required).toEqual([]);
    expect(result.tools_optional).toEqual([]);
    expect(result.interactive_elements).toEqual([]);
    expect(result.standards_alignment).toEqual([]);
    expect(result.content_flags).toEqual([]);
    expect(result.resources).toEqual([]);
    expect(result.related_packs).toEqual([]);
    expect(result.changelog).toEqual([]);
  });
});

// ============================================================================
// ModulesFileSchema
// ============================================================================

describe('ModulesFileSchema', () => {
  it('accepts MATH-101-modules.yaml structure', () => {
    const result = ModulesFileSchema.parse({
      pack_id: 'MATH-101',
      pack_name: 'Mathematics -- Foundational Knowledge Pack',
      modules: [
        {
          id: 'MATH-101-M1',
          name: 'Number & Operations',
          description: 'Understanding quantity',
          learning_outcomes: ['Recognize quantities'],
          topics: ['Subitizing'],
          grade_levels: ['K'],
          time_estimates: { foundation: 40 },
          prerequisite_modules: [],
        },
      ],
      cross_module_competencies: [
        {
          name: 'Mathematical Communication',
          description: 'Ability to explain thinking clearly',
          assessed_in: ['MATH-101-M1', 'MATH-101-M2'],
        },
      ],
      progression_pathways: [
        {
          name: 'Linear Pathway',
          description: 'M1 -> M2 -> M3 & M4',
          rationale: 'Number & operations are foundational',
        },
      ],
      parallel_patterns: [
        { pattern: 'Module Introduction', description: 'Same intro structure', cached: true },
      ],
      skill_creator_integration: {
        observation_points: ['When learner solves problems multiple ways'],
        pattern_detection: ['Effective debugging strategies'],
        skill_promotion: ['Promote successful explanation patterns'],
      },
    });
    expect(result.pack_id).toBe('MATH-101');
    expect(result.modules).toHaveLength(1);
    expect(result.cross_module_competencies).toHaveLength(1);
    expect(result.progression_pathways).toHaveLength(1);
  });
});

// ============================================================================
// Additional supporting schemas
// ============================================================================

describe('CrossModuleCompetencySchema', () => {
  it('accepts competency from MATH-101', () => {
    const result = CrossModuleCompetencySchema.parse({
      name: 'Problem-Solving Flexibility',
      description: 'Ability to solve problems using multiple approaches',
      assessed_in: ['MATH-101-M1', 'MATH-101-M2', 'MATH-101-M3'],
    });
    expect(result.assessed_in).toHaveLength(3);
  });
});

describe('ToolSchema', () => {
  it('accepts tool with URL', () => {
    const result = ToolSchema.parse({
      name: 'graphing_calculator',
      url: 'https://www.desmos.com',
    });
    expect(result.name).toBe('graphing_calculator');
  });

  it('accepts tool with integrated flag', () => {
    const result = ToolSchema.parse({
      name: 'algebra_manipulatives',
      integrated: true,
      description: 'Visual representations of algebraic concepts',
    });
    expect(result.integrated).toBe(true);
  });
});

describe('InteractiveElementSchema', () => {
  it('accepts interactive element from MATH-101', () => {
    const result = InteractiveElementSchema.parse({
      type: 'manipulative',
      name: 'Blocks & Counters',
    });
    expect(result.type).toBe('manipulative');
  });
});

describe('StandardAlignmentSchema', () => {
  it('accepts Common Core alignment from MATH-101', () => {
    const result = StandardAlignmentSchema.parse({
      framework: 'Common Core State Standards (Math)',
      version: 2010,
      alignments: {
        'K.CC': 'Counting & Cardinality',
        '1.NBT': 'Numbers & Operations in Base Ten',
      },
    });
    expect(result.framework).toBe('Common Core State Standards (Math)');
  });

  it('accepts NCTM alignment with boolean values', () => {
    const result = StandardAlignmentSchema.parse({
      framework: 'NCTM Principles & Standards',
      version: 2000,
      alignments: {
        'Number & Operations': true,
        Algebra: true,
      },
    });
    expect(result.alignments['Algebra']).toBe(true);
  });
});

describe('MetricsSchema', () => {
  it('accepts metrics from MATH-101 with null values', () => {
    const result = MetricsSchema.parse({
      active_learners: 0,
      completion_rate: null,
      satisfaction_rating: null,
    });
    expect(result.active_learners).toBe(0);
    expect(result.completion_rate).toBeNull();
  });
});

describe('RelatedPackSchema', () => {
  it('accepts related pack from MATH-101', () => {
    const result = RelatedPackSchema.parse({
      id: 'PHYS-101',
      relationship: 'Mathematical modeling underlies physics',
    });
    expect(result.id).toBe('PHYS-101');
  });
});

describe('ChangelogEntrySchema', () => {
  it('accepts changelog entry from MATH-101', () => {
    const result = ChangelogEntrySchema.parse({
      version: '1.0.0',
      date: '2026-02-18',
      changes: [
        'Initial release: Four core modules, assessment framework, parent guidance',
        'Contributed 12 starter activities',
      ],
    });
    expect(result.changes).toHaveLength(2);
  });
});

describe('QaSchema', () => {
  it('accepts QA data from MATH-101', () => {
    const result = QaSchema.parse({
      peer_reviewed: true,
      tested_with_learners: false,
      culturally_responsive: true,
      bias_audit_completed: false,
      accessibility_audit_completed: false,
      next_audit_scheduled: '2026-04-15',
    });
    expect(result.peer_reviewed).toBe(true);
    expect(result.tested_with_learners).toBe(false);
  });
});

describe('GsdIntegrationSchema', () => {
  it('accepts full integration data from MATH-101', () => {
    const result = GsdIntegrationSchema.parse({
      dashboard_display: {
        icon: 'math-symbol',
        color: '#4A90E2',
        position: 'Featured - Core',
      },
      activity_scaffolding: true,
      skill_creator_enabled: true,
      adaptive_pacing: true,
      cache_keys: ['MATH-101-core-concepts', 'MATH-101-assessment-patterns'],
    });
    expect(result.dashboard_display?.icon).toBe('math-symbol');
    expect(result.cache_keys).toHaveLength(2);
  });

  it('accepts empty integration object', () => {
    const result = GsdIntegrationSchema.parse({});
    expect(result).toBeDefined();
  });
});

describe('PackFilesSchema', () => {
  it('accepts files data from MATH-101', () => {
    const result = PackFilesSchema.parse({
      vision_document: 'MATH-101-vision.md',
      modules_definition: 'MATH-101-modules.yaml',
      activities: 'MATH-101-activities.json',
      assessment: 'MATH-101-assessment.md',
      resources: 'MATH-101-resources.md',
      readme: 'README.md',
    });
    expect(result.vision_document).toBe('MATH-101-vision.md');
  });
});

describe('ContributorSchema', () => {
  it('accepts contributor from MATH-101', () => {
    const result = ContributorSchema.parse({
      name: 'GSD Foundation',
      role: 'architect',
    });
    expect(result.name).toBe('GSD Foundation');
  });
});

describe('ModuleTimeEstimatesSchema', () => {
  it('accepts time estimates from MATH-101', () => {
    const result = ModuleTimeEstimatesSchema.parse({
      foundation: 40,
      elementary: 30,
      middle: 20,
      high: 0,
    });
    expect(result.foundation).toBe(40);
  });

  it('accepts partial time estimates', () => {
    const result = ModuleTimeEstimatesSchema.parse({ foundation: 10 });
    expect(result.foundation).toBe(10);
  });
});

describe('ModuleActivitiesSchema', () => {
  it('accepts activities structure from MATH-101', () => {
    const result = ModuleActivitiesSchema.parse({
      count: 8,
      examples: ['Finger Counting', 'Number Composition'],
    });
    expect(result.count).toBe(8);
    expect(result.examples).toHaveLength(2);
  });
});

describe('TranslationEntrySchema', () => {
  it('accepts complete translation entry', () => {
    const result = TranslationEntrySchema.parse({
      language_code: 'en',
      name: 'English',
      complete: true,
    });
    expect(result.complete).toBe(true);
  });

  it('accepts translation entry with progress', () => {
    const result = TranslationEntrySchema.parse({
      language_code: 'es',
      name: 'Espanol',
      complete: false,
      progress: '45%',
    });
    expect(result.progress).toBe('45%');
  });
});

// ============================================================================
// NFR-02: Zero external dependencies check
// ============================================================================

describe('NFR-02: zero external dependencies', () => {
  it('types.ts only imports from zod', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync(
      new URL('../../knowledge/types.ts', import.meta.url),
      'utf-8',
    );
    const importLines = content
      .split('\n')
      .filter((line) => /^import\s/.test(line.trim()));
    for (const line of importLines) {
      expect(line).toMatch(/from\s+['"]zod['"]/);
    }
    expect(importLines.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Type inference checks (compile-time verification at test time)
// ============================================================================

describe('Type inference', () => {
  it('KnowledgePack type matches schema output', () => {
    const pack: KnowledgePack = KnowledgePackSchema.parse({
      pack_id: 'TYPE-CHECK',
      pack_name: 'Type Check',
      version: '1.0.0',
      status: 'alpha',
      classification: 'core_academic',
      description: 'Testing type inference',
      contributors: [{ name: 'Test', role: 'test' }],
      copyright: 'MIT',
      tags: ['test'],
      gsd_integration: {},
      grade_levels: [{ label: 'K', grades: ['K'], estimated_hours: [10, 20] }],
    });
    expect(pack.pack_id).toBe('TYPE-CHECK');
  });

  it('PackModule type matches schema output', () => {
    const mod: PackModule = PackModuleSchema.parse({
      id: 'MOD-1',
      name: 'Test Module',
      description: 'desc',
      learning_outcomes: [],
      topics: [],
      grade_levels: [],
      time_estimates: {},
      prerequisite_modules: [],
    });
    expect(mod.id).toBe('MOD-1');
  });

  it('PackActivity type matches schema output', () => {
    const act: PackActivity = PackActivitySchema.parse({
      id: 'ACT-1',
      name: 'Test',
      module_id: 'MOD-1',
      grade_range: [],
      duration_minutes: 10,
      description: 'test',
      materials: [],
      learning_objectives: [],
    });
    expect(act.id).toBe('ACT-1');
  });

  it('LearningOutcome type matches schema output', () => {
    const lo: LearningOutcome = LearningOutcomeSchema.parse({
      code: 'LO-001',
      description: 'Test',
      levels: ['K'],
    });
    expect(lo.code).toBe('LO-001');
  });

  it('PackDependency type matches schema output', () => {
    const dep: PackDependency = PackDependencySchema.parse({
      pack_id: 'DEP-1',
      relationship: 'prerequisite',
    });
    expect(dep.pack_id).toBe('DEP-1');
  });

  it('LearningPathway type matches schema output', () => {
    const path: LearningPathway = LearningPathwaySchema.parse({
      name: 'Test',
      description: 'test',
      rationale: 'test',
    });
    expect(path.name).toBe('Test');
  });
});

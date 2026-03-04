/**
 * Skill Creator MCP Server for exposing skill lifecycle tools via MCP protocol.
 *
 * Defines 8 tools covering the complete skill lifecycle: create, eval, grade,
 * compare, analyze, optimize, package, and benchmark. Each tool validates
 * inputs via Zod schemas and returns MCP-formatted responses.
 *
 * Handler stubs describe intended behavior without wiring to actual pipelines.
 */

import { z, type ZodObject, type ZodRawShape } from 'zod';

// ============================================================================
// Tool Input Schemas
// ============================================================================

const SkillCreateInputSchema = z.object({
  skillName: z.string(),
  description: z.string(),
  template: z.string().optional(),
});

const SkillEvalInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  testCases: z.number().optional(),
});

const SkillGradeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  graderChip: z.string().optional(),
});

const SkillCompareInputSchema = z.object({
  skillName: z.string(),
  chips: z.array(z.string()),
});

const SkillAnalyzeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
});

const SkillOptimizeInputSchema = z.object({
  skillName: z.string(),
  chipName: z.string(),
  targetPassRate: z.number().optional(),
});

const SkillPackageInputSchema = z.object({
  skillName: z.string(),
  version: z.string(),
  description: z.string().optional(),
});

const SkillBenchmarkInputSchema = z.object({
  skillName: z.string(),
  chips: z.array(z.string()),
  iterations: z.number().optional(),
});

// ============================================================================
// MCP Response Types
// ============================================================================

/** MCP text content block */
interface McpTextContent {
  type: 'text';
  text: string;
}

/** MCP tool response */
interface McpToolResponse {
  content: McpTextContent[];
}

// ============================================================================
// Tool Definition
// ============================================================================

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ZodObject<ZodRawShape>;
}

// ============================================================================
// SKILL_CREATOR_TOOLS
// ============================================================================

/** All 8 skill creator MCP tools with their schemas */
export const SKILL_CREATOR_TOOLS: ToolDefinition[] = [
  {
    name: 'skill.create',
    description: 'Create a new skill from a name, description, and optional template',
    inputSchema: SkillCreateInputSchema,
  },
  {
    name: 'skill.eval',
    description: 'Evaluate a skill against a specific chip with optional test case count',
    inputSchema: SkillEvalInputSchema,
  },
  {
    name: 'skill.grade',
    description: 'Grade skill evaluation results using an optional grader chip',
    inputSchema: SkillGradeInputSchema,
  },
  {
    name: 'skill.compare',
    description: 'Compare skill performance across multiple chips',
    inputSchema: SkillCompareInputSchema,
  },
  {
    name: 'skill.analyze',
    description: 'Analyze skill behavior and failure patterns for a specific chip',
    inputSchema: SkillAnalyzeInputSchema,
  },
  {
    name: 'skill.optimize',
    description: 'Optimize skill prompts for a chip with optional target pass rate',
    inputSchema: SkillOptimizeInputSchema,
  },
  {
    name: 'skill.package',
    description: 'Package a skill with version for distribution',
    inputSchema: SkillPackageInputSchema,
  },
  {
    name: 'skill.benchmark',
    description: 'Benchmark a skill across multiple chips with optional iteration count',
    inputSchema: SkillBenchmarkInputSchema,
  },
];

// ============================================================================
// Handler Stubs
// ============================================================================

function handleSkillCreate(args: z.infer<typeof SkillCreateInputSchema>): string {
  const tmpl = args.template ? ` using template '${args.template}'` : '';
  return `Would create skill '${args.skillName}'${tmpl}: ${args.description}`;
}

function handleSkillEval(args: z.infer<typeof SkillEvalInputSchema>): string {
  const cases = args.testCases ? ` with ${args.testCases} test cases` : '';
  return `Would evaluate skill '${args.skillName}' on chip '${args.chipName}'${cases}`;
}

function handleSkillGrade(args: z.infer<typeof SkillGradeInputSchema>): string {
  const grader = args.graderChip ? ` using grader '${args.graderChip}'` : '';
  return `Would grade skill '${args.skillName}' on chip '${args.chipName}'${grader}`;
}

function handleSkillCompare(args: z.infer<typeof SkillCompareInputSchema>): string {
  return `Would compare skill '${args.skillName}' across chips: ${args.chips.join(', ')}`;
}

function handleSkillAnalyze(args: z.infer<typeof SkillAnalyzeInputSchema>): string {
  return `Would analyze skill '${args.skillName}' behavior on chip '${args.chipName}'`;
}

function handleSkillOptimize(args: z.infer<typeof SkillOptimizeInputSchema>): string {
  const target = args.targetPassRate ? ` targeting ${args.targetPassRate} pass rate` : '';
  return `Would optimize skill '${args.skillName}' for chip '${args.chipName}'${target}`;
}

function handleSkillPackage(args: z.infer<typeof SkillPackageInputSchema>): string {
  const desc = args.description ? ` (${args.description})` : '';
  return `Would package skill '${args.skillName}' v${args.version}${desc}`;
}

function handleSkillBenchmark(args: z.infer<typeof SkillBenchmarkInputSchema>): string {
  const iters = args.iterations ? ` for ${args.iterations} iterations` : '';
  return `Would benchmark skill '${args.skillName}' on chips: ${args.chips.join(', ')}${iters}`;
}

/** Maps tool names to handler functions */
const HANDLERS: Record<string, (args: unknown) => string> = {
  'skill.create': handleSkillCreate as (args: unknown) => string,
  'skill.eval': handleSkillEval as (args: unknown) => string,
  'skill.grade': handleSkillGrade as (args: unknown) => string,
  'skill.compare': handleSkillCompare as (args: unknown) => string,
  'skill.analyze': handleSkillAnalyze as (args: unknown) => string,
  'skill.optimize': handleSkillOptimize as (args: unknown) => string,
  'skill.package': handleSkillPackage as (args: unknown) => string,
  'skill.benchmark': handleSkillBenchmark as (args: unknown) => string,
};

// ============================================================================
// SkillCreatorMcpServer
// ============================================================================

/**
 * MCP server that exposes skill lifecycle tools.
 *
 * Validates tool arguments via Zod schemas and dispatches to handler stubs.
 * Returns MCP-formatted responses: { content: [{ type: 'text', text }] }
 */
export class SkillCreatorMcpServer {
  /**
   * List all available tools with their schemas.
   */
  listTools(): ToolDefinition[] {
    return SKILL_CREATOR_TOOLS;
  }

  /**
   * Handle an MCP tool call.
   *
   * Validates args against the tool's input schema, dispatches to the
   * appropriate handler, and returns an MCP-formatted response.
   *
   * @param toolName - Name of the tool to invoke
   * @param args - Raw arguments to validate and pass to handler
   * @returns MCP response with content array
   */
  async handleToolCall(toolName: string, args: unknown): Promise<McpToolResponse> {
    // Find the tool definition
    const tool = SKILL_CREATOR_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      return {
        content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
      };
    }

    // Validate args against input schema
    const parseResult = tool.inputSchema.safeParse(args);
    if (!parseResult.success) {
      return {
        content: [
          {
            type: 'text',
            text: `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
          },
        ],
      };
    }

    // Dispatch to handler
    const handler = HANDLERS[toolName];
    const text = handler(parseResult.data);

    return {
      content: [{ type: 'text', text }],
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new SkillCreatorMcpServer instance.
 */
export function createSkillCreatorMcpServer(): SkillCreatorMcpServer {
  return new SkillCreatorMcpServer();
}

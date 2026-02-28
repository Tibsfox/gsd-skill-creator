/**
 * Context fork detection for research/analysis workflow patterns.
 *
 * Skills intended for research and deep analysis workflows should run
 * in isolated forked contexts (SPEC-05). This prevents research tasks
 * from polluting the main conversation context.
 *
 * Detection is conservative -- only clear research/analysis patterns
 * trigger fork suggestion, not general-purpose skills.
 */

// ============================================================================
// Types
// ============================================================================

export interface ForkDetection {
  shouldFork: boolean;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// Pattern definitions
// ============================================================================

/**
 * HIGH confidence triggers: keywords in the description that clearly
 * indicate research/analysis workflows.
 */
const HIGH_CONFIDENCE_DESCRIPTION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bresearch\b/i, label: 'research' },
  { pattern: /\binvestigat/i, label: 'investigate' },
  { pattern: /\bdeep\s+dive\b/i, label: 'deep dive' },
  { pattern: /\bdeep\s+analysis\b/i, label: 'deep analysis' },
  { pattern: /\bcomprehensive\s+audit\b/i, label: 'comprehensive audit' },
  { pattern: /\bsecurity\s+audit\b/i, label: 'security audit' },
  { pattern: /\baudit\b/i, label: 'audit' },
  { pattern: /\banalyz/i, label: 'analyze' },
  { pattern: /\banalysis\b/i, label: 'analysis' },
];

/**
 * MEDIUM confidence triggers: keywords in the body that suggest
 * the skill should run in an isolated context.
 */
const MEDIUM_CONFIDENCE_BODY_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bspawn\s+a?\s*subagent\b/i, label: 'spawn subagent' },
  { pattern: /\brun\s+in\s+isolation\b/i, label: 'run in isolation' },
  { pattern: /\bisolated\s+context\b/i, label: 'isolated context' },
  { pattern: /\bfork\s+(the\s+)?context\b/i, label: 'fork context' },
];

/**
 * NOT triggers: common words that should NOT trigger fork detection.
 * These are explicitly excluded even if they might seem research-like.
 */
const NOT_TRIGGERS = [
  /\breview\b/i,
  /\bcheck\b/i,
  /\btest\b/i,
];

// ============================================================================
// Agent suggestion patterns
// ============================================================================

const AGENT_PATTERNS: Array<{ pattern: RegExp; agent: string }> = [
  { pattern: /\bsecurity\b/i, agent: 'security-agent' },
  { pattern: /\bresearch\b/i, agent: 'research-agent' },
  { pattern: /\banalyz/i, agent: 'analysis-agent' },
  { pattern: /\banalysis\b/i, agent: 'analysis-agent' },
];

// ============================================================================
// Public API
// ============================================================================

/**
 * Detect whether a skill should run in a forked context based on
 * research/analysis workflow patterns.
 *
 * Detection is conservative:
 * - HIGH confidence: clear research/analysis keywords in description
 * - MEDIUM confidence: isolation/subagent keywords in body
 * - Common words like "review", "check", "test" do NOT trigger
 *
 * @param description - The skill description
 * @param body - The skill body content
 * @returns Fork detection result with confidence level
 */
export function shouldForkContext(description: string, body: string): ForkDetection {
  // Check HIGH confidence patterns in description
  for (const { pattern, label } of HIGH_CONFIDENCE_DESCRIPTION_PATTERNS) {
    if (pattern.test(description)) {
      return {
        shouldFork: true,
        reason: `Description contains research/analysis indicator: "${label}"`,
        confidence: 'high',
      };
    }
  }

  // Check MEDIUM confidence patterns in body
  for (const { pattern, label } of MEDIUM_CONFIDENCE_BODY_PATTERNS) {
    if (pattern.test(body)) {
      return {
        shouldFork: true,
        reason: `Body contains isolation indicator: "${label}"`,
        confidence: 'medium',
      };
    }
  }

  // No patterns matched
  return {
    shouldFork: false,
    confidence: 'low',
  };
}

/**
 * Suggest an agent name for a skill that should fork context.
 *
 * Derives agent name from the description/body keywords:
 * - "security" -> "security-agent"
 * - "research" -> "research-agent"
 * - "analysis"/"analyze" -> "analysis-agent"
 * - Default for fork skills: "task-agent"
 * - Non-fork skills: null
 *
 * @param description - The skill description
 * @param body - The skill body content
 * @returns Suggested agent name, or null if not a fork skill
 */
export function suggestAgent(description: string, body: string): string | null {
  const forkResult = shouldForkContext(description, body);

  if (!forkResult.shouldFork) {
    return null;
  }

  // Check combined text for agent type hints
  const combined = `${description} ${body}`;

  for (const { pattern, agent } of AGENT_PATTERNS) {
    if (pattern.test(combined)) {
      return agent;
    }
  }

  // Default agent for fork skills
  return 'task-agent';
}

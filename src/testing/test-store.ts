import { readFile, writeFile, rename, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { TestCase } from '../types/testing.js';
import { validateTestCaseInput, type TestCaseInput } from '../validation/test-validation.js';
import { getSkillsBasePath, type SkillScope } from '../types/scope.js';

/**
 * Store for persisting test cases to JSON files.
 *
 * Test cases are stored in `~/.claude/skills/<skillName>/tests.json` (user scope)
 * or `.claude/skills/<skillName>/tests.json` (project scope).
 *
 * Uses atomic writes (temp file + rename) to prevent corruption.
 * Serializes concurrent writes to the same skill using a write queue.
 */
export class TestStore {
  private basePath: string;
  private scope: SkillScope;
  // Write queues per skill to serialize concurrent writes
  private writeQueues: Map<string, Promise<void>> = new Map();

  /**
   * Create a new TestStore instance.
   *
   * @param scope - 'user' for ~/.claude/skills or 'project' for .claude/skills
   */
  constructor(scope: SkillScope = 'user') {
    this.scope = scope;
    this.basePath = getSkillsBasePath(scope);
  }

  /**
   * Get the path to the tests.json file for a skill.
   */
  private getTestsPath(skillName: string): string {
    return join(this.basePath, skillName, 'tests.json');
  }

  /**
   * Check if the skill directory exists and warn if not.
   */
  private async warnIfSkillNotExists(skillName: string): Promise<void> {
    const skillDir = join(this.basePath, skillName);
    try {
      await access(skillDir);
    } catch {
      console.warn(
        `Warning: Skill directory '${skillName}' does not exist yet at ${skillDir}. ` +
        `Tests will be created when first test is added.`
      );
    }
  }

  /**
   * Load all test cases for a skill.
   *
   * @param skillName - Name of the skill
   * @returns Array of test cases, empty if file doesn't exist
   */
  async load(skillName: string): Promise<TestCase[]> {
    const testsPath = this.getTestsPath(skillName);
    try {
      const content = await readFile(testsPath, 'utf-8');
      return JSON.parse(content) as TestCase[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      // Corrupted file - return empty and let next save fix it
      console.warn(`Warning: Could not parse tests.json for '${skillName}', starting fresh`);
      return [];
    }
  }

  /**
   * Save test cases with atomic write (temp file + rename).
   *
   * @param skillName - Name of the skill
   * @param tests - Array of test cases to save
   */
  async save(skillName: string, tests: TestCase[]): Promise<void> {
    const testsPath = this.getTestsPath(skillName);

    // Ensure parent directory exists
    await mkdir(dirname(testsPath), { recursive: true });

    // Write to temp file in the same directory as target to avoid cross-device link issues
    const tempPath = join(
      dirname(testsPath),
      `.tests-${Date.now()}-${Math.random().toString(36).slice(2)}.json.tmp`
    );

    await writeFile(tempPath, JSON.stringify(tests, null, 2), 'utf-8');
    await rename(tempPath, testsPath);
  }

  /**
   * Serialize writes to a skill by queueing them.
   * This prevents race conditions when multiple adds happen concurrently.
   */
  private async serializedWrite<T>(
    skillName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const currentQueue = this.writeQueues.get(skillName) ?? Promise.resolve();

    let result: T;
    const newQueue = currentQueue.then(async () => {
      result = await operation();
    });

    this.writeQueues.set(skillName, newQueue);
    await newQueue;
    return result!;
  }

  /**
   * Add a new test case for a skill.
   *
   * @param skillName - Name of the skill
   * @param input - Test case input data
   * @returns The created test case with id and createdAt
   * @throws Error if input validation fails or prompt is duplicate
   */
  async add(skillName: string, input: TestCaseInput): Promise<TestCase> {
    // Validate input first (can be done outside serialized write)
    const validationResult = validateTestCaseInput(input);

    if (!validationResult.valid) {
      throw new Error(
        `Invalid test case input: ${validationResult.errors?.join(', ')}`
      );
    }

    // Log warnings if any
    if (validationResult.warnings && validationResult.warnings.length > 0) {
      for (const warning of validationResult.warnings) {
        console.warn(`Warning [${warning.field}]: ${warning.message}`);
      }
    }

    // Warn if skill directory doesn't exist
    await this.warnIfSkillNotExists(skillName);

    // Serialize the read-modify-write operation
    return this.serializedWrite(skillName, async () => {
      // Load existing tests
      const tests = await this.load(skillName);

      // Check for duplicate prompt (exact match)
      const duplicatePrompt = tests.find((t) => t.prompt === input.prompt);
      if (duplicatePrompt) {
        throw new Error(
          `Duplicate test prompt: A test with the exact same prompt already exists (id: ${duplicatePrompt.id})`
        );
      }

      // Create new test case
      const newTest: TestCase = {
        id: randomUUID(),
        prompt: input.prompt,
        expected: input.expected,
        description: input.description,
        tags: input.tags,
        difficulty: input.difficulty,
        minConfidence: input.minConfidence,
        maxConfidence: input.maxConfidence,
        reason: input.reason,
        createdAt: new Date().toISOString(),
      };

      // Append and save
      tests.push(newTest);
      await this.save(skillName, tests);

      return newTest;
    });
  }

  /**
   * Get a specific test case by ID.
   *
   * @param skillName - Name of the skill
   * @param testId - ID of the test case
   * @returns The test case or null if not found
   */
  async get(skillName: string, testId: string): Promise<TestCase | null> {
    const tests = await this.load(skillName);
    return tests.find((t) => t.id === testId) ?? null;
  }

  /**
   * Update an existing test case.
   *
   * @param skillName - Name of the skill
   * @param testId - ID of the test case to update
   * @param updates - Partial test case input with fields to update
   * @returns The updated test case or null if not found
   * @throws Error if validation fails or updated prompt would be duplicate
   */
  async update(
    skillName: string,
    testId: string,
    updates: Partial<TestCaseInput>
  ): Promise<TestCase | null> {
    return this.serializedWrite(skillName, async () => {
      const tests = await this.load(skillName);
      const index = tests.findIndex((t) => t.id === testId);

      if (index === -1) {
        return null;
      }

      const existingTest = tests[index];

      // If updating prompt, check for duplicates (excluding current test)
      if (updates.prompt !== undefined && updates.prompt !== existingTest.prompt) {
        const duplicatePrompt = tests.find(
          (t) => t.id !== testId && t.prompt === updates.prompt
        );
        if (duplicatePrompt) {
          throw new Error(
            `Duplicate test prompt: A test with the exact same prompt already exists (id: ${duplicatePrompt.id})`
          );
        }
      }

      // Merge updates (preserving id and createdAt)
      const mergedInput: TestCaseInput = {
        prompt: updates.prompt ?? existingTest.prompt,
        expected: updates.expected ?? existingTest.expected,
        description: updates.description ?? existingTest.description,
        tags: updates.tags ?? existingTest.tags,
        difficulty: updates.difficulty ?? existingTest.difficulty,
        minConfidence: updates.minConfidence ?? existingTest.minConfidence,
        maxConfidence: updates.maxConfidence ?? existingTest.maxConfidence,
        reason: updates.reason ?? existingTest.reason,
      };

      // Validate merged input
      const validationResult = validateTestCaseInput(mergedInput);

      if (!validationResult.valid) {
        throw new Error(
          `Invalid test case input: ${validationResult.errors?.join(', ')}`
        );
      }

      // Log warnings if any
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        for (const warning of validationResult.warnings) {
          console.warn(`Warning [${warning.field}]: ${warning.message}`);
        }
      }

      // Update test case (preserve id and createdAt)
      const updatedTest: TestCase = {
        id: existingTest.id,
        prompt: mergedInput.prompt,
        expected: mergedInput.expected,
        description: mergedInput.description,
        tags: mergedInput.tags,
        difficulty: mergedInput.difficulty,
        minConfidence: mergedInput.minConfidence,
        maxConfidence: mergedInput.maxConfidence,
        reason: mergedInput.reason,
        createdAt: existingTest.createdAt,
      };

      tests[index] = updatedTest;
      await this.save(skillName, tests);

      return updatedTest;
    });
  }

  /**
   * Delete a test case by ID.
   *
   * @param skillName - Name of the skill
   * @param testId - ID of the test case to delete
   * @returns true if deleted, false if not found
   */
  async delete(skillName: string, testId: string): Promise<boolean> {
    return this.serializedWrite(skillName, async () => {
      const tests = await this.load(skillName);
      const initialLength = tests.length;
      const filtered = tests.filter((t) => t.id !== testId);

      if (filtered.length === initialLength) {
        return false;
      }

      await this.save(skillName, filtered);
      return true;
    });
  }

  /**
   * List all test cases for a skill.
   *
   * @param skillName - Name of the skill
   * @returns Array of test cases
   */
  async list(skillName: string): Promise<TestCase[]> {
    return this.load(skillName);
  }

  /**
   * Count test cases for a skill.
   *
   * @param skillName - Name of the skill
   * @returns Number of test cases
   */
  async count(skillName: string): Promise<number> {
    const tests = await this.load(skillName);
    return tests.length;
  }
}

/**
 * JSONL manifest generation and exercise/build-lab extraction.
 * Produces the master manifest consumed by downstream learning phases.
 */

import type { TextChunk } from '../types.js';
import type { ChapterMap, PartMap } from './types.js';
import { segmentChapter } from './chunk-segmenter.js';

interface ExerciseEntry {
  number: number;
  text: string;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'challenge';
}

interface ExerciseResult {
  exercises: ExerciseEntry[];
}

const EXERCISE_SECTION_PATTERN = /(?:^|\n)(Exercises|Problems)\s*\n/i;
const BUILD_LAB_PATTERN = /(?:^|\n)(Build Lab)\s*\n/i;
const EXERCISE_NUMBERING = /^\s*(\d+)\.\s/;

/**
 * Extract exercises from chapter text with difficulty tags.
 *
 * Difficulty assignment:
 * - Position-based: first 30% = basic, middle 40% = intermediate, last 30% = advanced
 * - Keyword override: "prove"/"show" -> advanced; "compute"/"calculate" -> basic
 * - Star markers: "*" or "challenge" -> challenge
 * - Build Lab content: intermediate by default
 */
export function extractExercises(text: string, _chapterNumber: number): ExerciseResult {
  const exercises: ExerciseEntry[] = [];

  // Check for exercise section
  const exerciseMatch = text.match(EXERCISE_SECTION_PATTERN);
  const buildLabMatch = text.match(BUILD_LAB_PATTERN);

  const isBuildLab = buildLabMatch && !exerciseMatch;

  if (!exerciseMatch && !buildLabMatch) {
    return { exercises: [] };
  }

  // Extract the section text
  const sectionStart = exerciseMatch
    ? text.indexOf(exerciseMatch[0]) + exerciseMatch[0].length
    : text.indexOf(buildLabMatch![0]) + buildLabMatch![0].length;

  const sectionText = text.slice(sectionStart);

  // Split into individual exercises by numbering pattern
  const lines = sectionText.split('\n');
  let currentExercise: { number: number; lines: string[] } | null = null;

  for (const line of lines) {
    const match = line.match(EXERCISE_NUMBERING);
    if (match) {
      // Save previous exercise
      if (currentExercise) {
        exercises.push({
          number: currentExercise.number,
          text: currentExercise.lines.join('\n').trim(),
          difficulty: 'basic', // placeholder, computed below
        });
      }
      currentExercise = {
        number: parseInt(match[1], 10),
        lines: [line.replace(EXERCISE_NUMBERING, '').trim()],
      };
    } else if (currentExercise && line.trim().length > 0) {
      currentExercise.lines.push(line.trim());
    }
  }

  // Save last exercise
  if (currentExercise) {
    exercises.push({
      number: currentExercise.number,
      text: currentExercise.lines.join('\n').trim(),
      difficulty: 'basic',
    });
  }

  // Assign difficulty
  const totalExercises = exercises.length;
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    const textLower = ex.text.toLowerCase();

    // Check for challenge markers first
    if (textLower.includes('*challenge') || textLower.includes('challenge:') || ex.text.includes('*')) {
      ex.difficulty = 'challenge';
      continue;
    }

    // Build Lab: all intermediate
    if (isBuildLab) {
      ex.difficulty = 'intermediate';
      continue;
    }

    // Position-based default
    const position = i / totalExercises;
    if (position < 0.3) {
      ex.difficulty = 'basic';
    } else if (position < 0.7) {
      ex.difficulty = 'intermediate';
    } else {
      ex.difficulty = 'advanced';
    }

    // Keyword overrides
    if (textLower.includes('prove') || textLower.includes('show that') || textLower.includes('demonstrate')) {
      ex.difficulty = 'advanced';
    } else if (textLower.includes('compute') || textLower.includes('calculate') || textLower.includes('find')) {
      if (ex.difficulty !== 'advanced') {
        ex.difficulty = 'basic';
      }
    }
  }

  return { exercises };
}

/**
 * Generate the master JSONL manifest from chapters and parts.
 * Processes chapters in order, segmenting each and collecting all chunks.
 *
 * @param chapters - All chapter data (sorted by chapterNumber)
 * @param parts - All part data
 * @param config - Configuration with maxChunkTokens
 * @returns chunks and their JSONL serialization
 */
export function generateManifest(
  chapters: ChapterMap[],
  parts: PartMap[],
  config: { maxChunkTokens: number }
): { chunks: TextChunk[]; jsonl: string } {
  const allChunks: TextChunk[] = [];
  let sequenceIndex = 0;

  // Sort chapters by chapterNumber
  const sortedChapters = [...chapters].sort((a, b) => a.chapterNumber - b.chapterNumber);

  for (const chapter of sortedChapters) {
    // Skip empty chapters
    if (!chapter.rawText || chapter.rawText.trim().length === 0) {
      continue;
    }

    // Find parent part
    const part = parts.find(p => p.partNumber === chapter.partNumber);
    if (!part) continue;

    // Segment chapter into chunks
    const chapterChunks = segmentChapter(chapter, part, config, sequenceIndex);
    sequenceIndex += chapterChunks.length;
    allChunks.push(...chapterChunks);
  }

  // Serialize to JSONL
  const jsonl = allChunks.length > 0
    ? allChunks.map(chunk => JSON.stringify(chunk)).join('\n')
    : '';

  return { chunks: allChunks, jsonl };
}

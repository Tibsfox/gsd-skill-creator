/**
 * Dashboard-side question poller and response script generator.
 *
 * QuestionPoller scans outbox/questions/ for pending question files,
 * parses them through QuestionSchema, and returns validated Question
 * objects for rendering in the dashboard.
 *
 * renderQuestionResponseScript generates client-side JavaScript that
 * submits user responses back to the console bridge via the helper
 * endpoint.
 *
 * @module dashboard/question-poller
 */

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CONSOLE_DIRS } from '../console/types.js';
import { QuestionSchema } from '../console/question-schema.js';
import type { Question } from '../console/question-schema.js';

// ---------------------------------------------------------------------------
// QuestionPoller
// ---------------------------------------------------------------------------

/**
 * Polls outbox/questions/ for pending question files and returns
 * validated Question objects.
 */
export class QuestionPoller {
  private readonly questionsDir: string;

  constructor(basePath: string) {
    this.questionsDir = join(basePath, CONSOLE_DIRS.outboxQuestions);
  }

  /**
   * Scan the questions directory for pending questions.
   *
   * - Reads all .json files from outbox/questions/
   * - Parses each through QuestionSchema.safeParse
   * - Returns only questions with status "pending"
   * - Handles ENOENT, invalid JSON, and schema failures gracefully
   *
   * @returns Array of valid pending Question objects, sorted by filename
   */
  async poll(): Promise<Question[]> {
    // Read directory listing -- handle ENOENT gracefully
    let entries: string[];
    try {
      entries = await readdir(this.questionsDir);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw err;
    }

    // Filter for .json files and sort alphabetically
    const jsonFiles = entries
      .filter((f) => f.endsWith('.json'))
      .sort();

    const results: Question[] = [];

    for (const filename of jsonFiles) {
      const filePath = join(this.questionsDir, filename);

      try {
        const raw = await readFile(filePath, 'utf-8');

        // Parse JSON -- skip malformed files
        let data: unknown;
        try {
          data = JSON.parse(raw);
        } catch {
          continue;
        }

        // Validate through QuestionSchema
        const result = QuestionSchema.safeParse(data);
        if (!result.success) {
          continue;
        }

        // Only include pending questions
        if (result.data.status === 'pending') {
          results.push(result.data);
        }
      } catch {
        // Unexpected error -- skip file, don't crash
        continue;
      }
    }

    return results;
  }
}

// ---------------------------------------------------------------------------
// Response script generator
// ---------------------------------------------------------------------------

/**
 * Generate client-side JavaScript for submitting question responses.
 *
 * The returned string is a complete `<script>` block that:
 * - Defines a global `submitQuestionResponse(questionId, answer)` function
 * - Constructs a message envelope with type "question-response"
 * - POSTs to the helper endpoint via fetch
 * - Attaches event delegation for question card interactive elements
 *
 * @param helperUrl - URL for the helper endpoint (e.g. "/api/console/message")
 * @returns HTML script tag string
 */
export function renderQuestionResponseScript(helperUrl: string): string {
  return `<script>
(function() {
  // ------------------------------------------------------------------
  // Submit a question response via the helper endpoint
  // ------------------------------------------------------------------
  function submitQuestionResponse(questionId, answer) {
    var now = new Date();
    var msgId = 'msg-' + now.toISOString().slice(0, 10).replace(/-/g, '') +
                '-' + String(now.getTime()).slice(-4);

    var envelope = {
      id: msgId,
      type: 'question-response',
      timestamp: now.toISOString(),
      source: 'dashboard',
      payload: {
        question_id: questionId,
        answer: answer
      }
    };

    fetch('${helperUrl}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: msgId + '-question-response.json',
        content: envelope,
        subdirectory: 'inbox/pending'
      })
    }).then(function(res) {
      if (!res.ok) {
        console.error('Question response submit failed:', res.status);
      }
    }).catch(function(err) {
      console.error('Question response submit error:', err);
    });
  }

  // Make globally accessible
  window.submitQuestionResponse = submitQuestionResponse;

  // ------------------------------------------------------------------
  // Event delegation for question card interactions
  // ------------------------------------------------------------------
  document.addEventListener('click', function(e) {
    var target = e.target;
    if (!target) return;

    // Binary option buttons (yes/no) -- answer is the data-value attribute
    if (target.classList.contains('question-card-option')) {
      var questionId = target.getAttribute('data-question-id');
      var answer = target.getAttribute('data-value');
      if (questionId && answer) {
        submitQuestionResponse(questionId, answer);
      }
      return;
    }

    // Confirmation button -- answer is true
    if (target.classList.contains('question-card-confirm')) {
      var questionId = target.getAttribute('data-question-id');
      if (questionId) {
        submitQuestionResponse(questionId, true);
      }
      return;
    }

    // Submit button -- collect answer based on question type
    if (target.classList.contains('question-card-submit')) {
      var questionId = target.getAttribute('data-question-id');
      var card = target.closest('.question-card');
      if (!card || !questionId) return;

      var questionType = card.getAttribute('data-type');
      var answer;

      if (questionType === 'choice') {
        // Choice: selected radio value
        var selected = card.querySelector('input[type="radio"]:checked');
        answer = selected ? selected.value : null;
      } else if (questionType === 'multi-select') {
        // Multi-select: array of checked checkbox values
        var checked = card.querySelectorAll('input[type="checkbox"]:checked');
        answer = Array.from(checked).map(function(cb) { return cb.value; });
      } else if (questionType === 'text') {
        // Text: textarea value
        var textarea = card.querySelector('textarea');
        answer = textarea ? textarea.value : '';
      }

      if (answer !== null && answer !== undefined) {
        submitQuestionResponse(questionId, answer);
      }
      return;
    }
  });
})();
</script>`;
}

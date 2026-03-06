// ─── Journal ────────────────────────────────────────────
// Reflection journal with foundation-relevant prompts,
// free-form entry, and previous entry display.

import React, { useState, useCallback } from 'react';
import type { FoundationId, JournalEntry } from '../../types/index.js';

// ─── Reflection Prompts ──────────────────────────────────

export interface ReflectionPromptConfig {
  id: string;
  foundationId: FoundationId;
  prompt: string;
  followUp?: string;
}

export const REFLECTION_PROMPTS: ReflectionPromptConfig[] = [
  {
    id: 'uc-1',
    foundationId: 'unit-circle',
    prompt: 'What does it mean for something to go around in a circle and come back changed?',
    followUp: 'Where have you seen this pattern in your own life?',
  },
  {
    id: 'uc-2',
    foundationId: 'unit-circle',
    prompt: 'How does rotating a point on the unit circle connect to the rhythm of waves?',
  },
  {
    id: 'py-1',
    foundationId: 'pythagorean',
    prompt: 'When you see a right triangle, what relationships do you notice between its sides?',
    followUp: 'How does the idea of a^2 + b^2 = c^2 appear in unexpected places?',
  },
  {
    id: 'py-2',
    foundationId: 'pythagorean',
    prompt: 'How is distance a form of relationship?',
  },
  {
    id: 'trig-1',
    foundationId: 'trigonometry',
    prompt: 'Where do you see oscillation in the natural world?',
    followUp: 'What connects a pendulum, a heartbeat, and a sound wave?',
  },
  {
    id: 'trig-2',
    foundationId: 'trigonometry',
    prompt: 'What happens when two waves meet?',
  },
  {
    id: 'vc-1',
    foundationId: 'vector-calculus',
    prompt: 'How would you describe the "flow" of wind to someone who cannot feel it?',
    followUp: 'What makes a field different from a single measurement?',
  },
  {
    id: 'vc-2',
    foundationId: 'vector-calculus',
    prompt: 'What does it mean for something to have both magnitude and direction?',
  },
  {
    id: 'st-1',
    foundationId: 'set-theory',
    prompt: 'What does it mean to belong? How do you define the boundary of a group?',
    followUp: 'Can something belong to two groups at once?',
  },
  {
    id: 'st-2',
    foundationId: 'set-theory',
    prompt: 'What is the difference between a thing and a collection of things?',
  },
  {
    id: 'ct-1',
    foundationId: 'category-theory',
    prompt: 'When you transform one thing into another, what is preserved?',
    followUp: 'What matters more: the objects themselves, or the relationships between them?',
  },
  {
    id: 'ct-2',
    foundationId: 'category-theory',
    prompt: 'How do arrows (functions, maps, transformations) tell a story?',
  },
  {
    id: 'it-1',
    foundationId: 'information-theory',
    prompt: 'What is surprise? How does it relate to information?',
    followUp: 'When you learn something, where does the information come from?',
  },
  {
    id: 'it-2',
    foundationId: 'information-theory',
    prompt: 'How much of what you hear is signal, and how much is noise?',
  },
  {
    id: 'ls-1',
    foundationId: 'l-systems',
    prompt: 'How does a seed become a tree? What rules does growth follow?',
    followUp: 'Where else do you see simple rules creating complex forms?',
  },
  {
    id: 'ls-2',
    foundationId: 'l-systems',
    prompt: 'What happens when a rule is applied to itself, again and again?',
  },
];

// ─── Component ────────────────────────────────────────────

export interface JournalProps {
  foundation: FoundationId;
  entries: JournalEntry[];
  onSave: (text: string, prompt?: string) => void;
}

export function Journal({ foundation, entries, onSave }: JournalProps): React.ReactElement {
  const [text, setText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<ReflectionPromptConfig | null>(null);

  // Filter prompts for current foundation
  const relevantPrompts = REFLECTION_PROMPTS.filter((p) => p.foundationId === foundation);

  const handleSave = useCallback(() => {
    if (text.trim().length === 0) return;
    onSave(text, selectedPrompt?.prompt);
    setText('');
    setSelectedPrompt(null);
  }, [text, selectedPrompt, onSave]);

  const handleSelectPrompt = useCallback((prompt: ReflectionPromptConfig) => {
    setSelectedPrompt(prompt);
  }, []);

  // Show entries for this foundation (most recent first)
  const foundationEntries = entries
    .filter((e) => e.foundationId === foundation)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="journal" data-testid="journal">
      <div className="journal-prompts" data-testid="journal-prompts">
        <h3>Reflection Prompts</h3>
        {relevantPrompts.map((prompt) => (
          <button
            key={prompt.id}
            className={`journal-prompt-btn ${selectedPrompt?.id === prompt.id ? 'active' : ''}`}
            onClick={() => handleSelectPrompt(prompt)}
            data-testid={`journal-prompt-${prompt.id}`}
          >
            {prompt.prompt}
          </button>
        ))}
      </div>

      {selectedPrompt && (
        <div className="journal-active-prompt" data-testid="journal-active-prompt">
          <p className="prompt-text">{selectedPrompt.prompt}</p>
          {selectedPrompt.followUp && (
            <p className="prompt-followup">{selectedPrompt.followUp}</p>
          )}
        </div>
      )}

      <div className="journal-entry-area" data-testid="journal-entry-area">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your reflection here..."
          rows={6}
          data-testid="journal-textarea"
        />
        <button
          onClick={handleSave}
          disabled={text.trim().length === 0}
          data-testid="journal-save"
        >
          Save Entry
        </button>
      </div>

      {foundationEntries.length > 0 && (
        <div className="journal-history" data-testid="journal-history">
          <h3>Previous Entries</h3>
          {foundationEntries.map((entry) => (
            <div key={entry.id} className="journal-entry" data-testid={`journal-entry-${entry.id}`}>
              {entry.prompt && (
                <p className="entry-prompt">{entry.prompt}</p>
              )}
              <p className="entry-text">{entry.text}</p>
              <small className="entry-date">{entry.createdAt}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

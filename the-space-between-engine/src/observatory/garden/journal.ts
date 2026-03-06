// Reflection Journal — Garden Workshop
// A writing space for prompted reflections and free-form entries.
// Personal record of the learning journey.

import type { FoundationId, JournalEntry } from '../../types/index';

/**
 * Reflection journal for recording insights, observations, and
 * personal connections to mathematical foundations.
 *
 * The journal is integrated throughout the Observatory experience
 * but has a dedicated Garden view. Entries can be prompted (from
 * reflection prompts in each wing) or free-form.
 */
export class ReflectionJournal {
  private entries: JournalEntry[] = [];
  private nextId = 0;

  /**
   * Add a new journal entry.
   *
   * @param text - The journal entry text (markdown supported)
   * @param foundationId - Optional foundation this entry relates to
   * @param prompt - Optional reflection prompt that inspired this entry
   * @returns The created JournalEntry
   */
  addEntry(text: string, foundationId?: FoundationId, prompt?: string): JournalEntry {
    const entry: JournalEntry = {
      id: `journal-${this.nextId++}`,
      foundationId,
      text,
      createdAt: new Date().toISOString(),
      prompt,
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Get all entries, optionally filtered by foundation.
   * Returns entries in reverse chronological order (newest first).
   */
  getEntries(foundationId?: FoundationId): JournalEntry[] {
    let filtered = this.entries;

    if (foundationId !== undefined) {
      filtered = this.entries.filter(e => e.foundationId === foundationId);
    }

    // Return newest first
    return [...filtered].reverse();
  }

  /**
   * Get all entries that were created in response to a prompt.
   */
  getPromptedEntries(): JournalEntry[] {
    return this.entries
      .filter(e => e.prompt !== undefined && e.prompt !== '')
      .reverse();
  }

  /**
   * Get a single entry by ID.
   */
  getEntry(id: string): JournalEntry | null {
    return this.entries.find(e => e.id === id) ?? null;
  }

  /**
   * Update an existing entry's text.
   */
  updateEntry(id: string, text: string): boolean {
    const entry = this.entries.find(e => e.id === id);
    if (!entry) return false;
    entry.text = text;
    return true;
  }

  /**
   * Delete an entry by ID.
   */
  deleteEntry(id: string): boolean {
    const index = this.entries.findIndex(e => e.id === id);
    if (index < 0) return false;
    this.entries.splice(index, 1);
    return true;
  }

  /**
   * Get the total number of entries.
   */
  get count(): number {
    return this.entries.length;
  }

  /**
   * Get the number of entries per foundation.
   */
  getCountByFoundation(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const entry of this.entries) {
      const key = entry.foundationId ?? 'general';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }

  /**
   * Export all entries as a markdown document.
   * Organized by foundation, with timestamps and prompts.
   */
  exportAll(): string {
    const lines: string[] = [];
    lines.push('# Learning Journey — Reflection Journal');
    lines.push('');
    lines.push(`*Exported on ${new Date().toLocaleDateString()}*`);
    lines.push('');

    // Group by foundation
    const grouped = new Map<string, JournalEntry[]>();
    grouped.set('general', []);

    for (const entry of this.entries) {
      const key = entry.foundationId ?? 'general';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(entry);
    }

    // Foundation display names
    const foundationNames: Record<string, string> = {
      'general': 'General Reflections',
      'unit-circle': 'Unit Circle',
      'pythagorean': 'Pythagorean Theorem',
      'trigonometry': 'Trigonometry',
      'vector-calculus': 'Vector Calculus',
      'set-theory': 'Set Theory',
      'category-theory': 'Category Theory',
      'information-theory': 'Information Theory',
      'l-systems': 'L-Systems',
    };

    for (const [foundationId, entries] of Array.from(grouped.entries())) {
      if (entries.length === 0) continue;

      const name = foundationNames[foundationId] ?? foundationId;
      lines.push(`## ${name}`);
      lines.push('');

      for (const entry of entries) {
        const date = new Date(entry.createdAt).toLocaleString();
        lines.push(`### ${date}`);
        lines.push('');

        if (entry.prompt) {
          lines.push(`> *Prompt: ${entry.prompt}*`);
          lines.push('');
        }

        lines.push(entry.text);
        lines.push('');
        lines.push('---');
        lines.push('');
      }
    }

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- **Total entries:** ${this.entries.length}`);
    lines.push(`- **Prompted entries:** ${this.entries.filter(e => e.prompt).length}`);
    lines.push(`- **Free-form entries:** ${this.entries.filter(e => !e.prompt).length}`);

    const foundations = new Set(this.entries.map(e => e.foundationId).filter(Boolean));
    lines.push(`- **Foundations covered:** ${foundations.size}/8`);

    return lines.join('\n');
  }

  /**
   * Load entries from a serialized array (for persistence).
   */
  loadEntries(entries: JournalEntry[]): void {
    this.entries = [...entries];
    // Update nextId to avoid collisions
    let maxId = 0;
    for (const entry of entries) {
      const match = entry.id.match(/journal-(\d+)/);
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1]!, 10));
      }
    }
    this.nextId = maxId + 1;
  }

  /**
   * Get all entries as a plain array (for serialization).
   */
  toJSON(): JournalEntry[] {
    return [...this.entries];
  }
}

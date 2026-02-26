/**
 * CommandHistory -- Up/down arrow command recall with maxSize limit and persistence.
 *
 * Stores user-entered commands in chronological order. previous() navigates
 * backward (most recent first), next() navigates forward. Cursor resets on
 * new add(). Deduplicates consecutive identical entries. Serializable via
 * toJSON/fromJSON for persistence across sessions.
 */

export interface CommandHistoryOptions {
  maxSize?: number;
}

export class CommandHistory {
  private entries: string[] = [];
  private cursor = -1; // -1 means not browsing; 0..length-1 = current position
  private readonly maxSize: number;

  constructor(options?: CommandHistoryOptions) {
    this.maxSize = options?.maxSize ?? 100;
  }

  get length(): number {
    return this.entries.length;
  }

  add(entry: string): void {
    if (!entry || entry.trim() === "") return;

    // Deduplicate: skip if same as most recent entry
    if (
      this.entries.length > 0 &&
      this.entries[this.entries.length - 1] === entry
    ) {
      return;
    }

    this.entries.push(entry);

    // Trim oldest entries if over maxSize
    if (this.entries.length > this.maxSize) {
      this.entries = this.entries.slice(this.entries.length - this.maxSize);
    }

    // Reset browsing position on new entry
    this.cursor = -1;
  }

  previous(): string | undefined {
    if (this.entries.length === 0) return undefined;

    if (this.cursor === -1) {
      // Start browsing from most recent
      this.cursor = this.entries.length - 1;
    } else if (this.cursor > 0) {
      this.cursor--;
    }
    // If cursor is 0 and called again, stay at 0 (oldest entry)
    return this.entries[this.cursor];
  }

  next(): string | undefined {
    if (this.cursor === -1 || this.entries.length === 0) return undefined;

    if (this.cursor < this.entries.length - 1) {
      this.cursor++;
      return this.entries[this.cursor];
    }

    // Past most recent: stop browsing
    this.cursor = -1;
    return undefined;
  }

  reset(): void {
    this.cursor = -1;
  }

  toJSON(): string[] {
    return [...this.entries];
  }

  static fromJSON(
    data: string[],
    options?: CommandHistoryOptions,
  ): CommandHistory {
    const history = new CommandHistory(options);
    for (const entry of data) {
      history.entries.push(entry);
    }
    return history;
  }
}

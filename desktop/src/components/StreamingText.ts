/**
 * StreamingText -- Incremental text renderer with magic-level-aware display.
 *
 * Accumulates text deltas and renders progressively. At magic level 1,
 * text is buffered until finalize(). At levels 2-5, each delta updates
 * the display immediately. All rendering uses textContent (never innerHTML).
 */

export interface StreamingTextProps {
  container: HTMLElement;
  onDelta?: (text: string) => void;
  onComplete?: (fullText: string) => void;
  magicLevel?: number;
}

export class StreamingText {
  private props: StreamingTextProps;
  private element: HTMLElement | null = null;
  private accumulatedText = "";
  private displayedText = "";
  private magicLevel: number;

  constructor(props: StreamingTextProps) {
    this.props = props;
    this.magicLevel = props.magicLevel ?? 3;
  }

  mount(): void {
    this.element = document.createElement("span");
    this.element.className = "cli-chat__streaming";
    this.props.container.appendChild(this.element);
  }

  appendDelta(text: string): void {
    this.accumulatedText += text;

    if (this.props.onDelta) {
      this.props.onDelta(text);
    }

    // Magic level 1: buffer only, do not update display
    if (this.magicLevel === 1) {
      return;
    }

    // Levels 2-5: update display immediately
    this.displayedText = this.accumulatedText;
    this.updateDisplay();
  }

  finalize(): void {
    this.displayedText = this.accumulatedText;
    this.updateDisplay();

    if (this.props.onComplete) {
      this.props.onComplete(this.accumulatedText);
    }
  }

  reset(): void {
    this.accumulatedText = "";
    this.displayedText = "";
    this.updateDisplay();
  }

  getText(): string {
    return this.accumulatedText;
  }

  setMagicLevel(level: number): void {
    this.magicLevel = level;
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }

  private updateDisplay(): void {
    if (this.element) {
      this.element.textContent = this.displayedText;
    }
  }
}

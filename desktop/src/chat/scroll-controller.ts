/**
 * ScrollController -- Auto-scroll with manual scroll preservation and indicator.
 *
 * Manages scroll behavior for the chat messages area. When the user is at
 * the bottom, new content auto-scrolls. When the user has scrolled up,
 * position is preserved and a "scroll to bottom" indicator appears.
 * Clicking the indicator or calling scrollToBottom() returns to the bottom.
 */

export interface ScrollControllerOptions {
  threshold?: number; // pixels from bottom to consider "at bottom", default 50
}

export class ScrollController {
  private container: HTMLElement;
  private threshold: number;
  private indicator: HTMLElement | null = null;
  private _indicatorVisible = false;
  private scrollHandler: (() => void) | null = null;

  constructor(container: HTMLElement, options?: ScrollControllerOptions) {
    this.container = container;
    this.threshold = options?.threshold ?? 50;
    this.setupIndicator();
    this.setupScrollListener();
  }

  get indicatorVisible(): boolean {
    return this._indicatorVisible;
  }

  isAtBottom(): boolean {
    const { scrollTop, scrollHeight, clientHeight } = this.container;
    return scrollHeight - scrollTop - clientHeight <= this.threshold;
  }

  onNewContent(): void {
    if (this.isAtBottom()) {
      this.scrollToBottom();
    } else {
      this.showIndicator();
    }
  }

  scrollToBottom(): void {
    this.container.scrollTop =
      this.container.scrollHeight - this.container.clientHeight;
    this.hideIndicator();
  }

  destroy(): void {
    if (this.scrollHandler) {
      this.container.removeEventListener("scroll", this.scrollHandler);
    }
    this.indicator?.remove();
  }

  private setupIndicator(): void {
    this.indicator = document.createElement("div");
    this.indicator.className = "cli-chat__scroll-indicator";
    this.indicator.textContent = "\u2193 New messages";
    this.indicator.style.display = "none";
    this.indicator.style.cursor = "pointer";
    this.indicator.addEventListener("click", () => this.scrollToBottom());
    // Insert as child of container
    this.container.appendChild(this.indicator);
  }

  private setupScrollListener(): void {
    this.scrollHandler = () => {
      if (this.isAtBottom()) {
        this.hideIndicator();
      }
    };
    this.container.addEventListener("scroll", this.scrollHandler);
  }

  private showIndicator(): void {
    this._indicatorVisible = true;
    if (this.indicator) this.indicator.style.display = "block";
  }

  private hideIndicator(): void {
    this._indicatorVisible = false;
    if (this.indicator) this.indicator.style.display = "none";
  }
}

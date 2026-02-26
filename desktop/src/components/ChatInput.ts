/**
 * ChatInput -- Single-line terminal input with submit, disable, and blinking cursor.
 *
 * Renders an input element with monospace styling. On Enter, calls onSubmit
 * and clears the input. A blinking block cursor element is shown when the
 * input is focused. All interactions are keyboard-driven (no mouse buttons).
 */

export interface ChatInputProps {
  container: HTMLElement;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export class ChatInput {
  private props: ChatInputProps;
  private wrapper: HTMLElement | null = null;
  private inputEl: HTMLInputElement | null = null;
  private cursorEl: HTMLElement | null = null;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private focusHandler: (() => void) | null = null;
  private blurHandler: (() => void) | null = null;

  constructor(props: ChatInputProps) {
    this.props = props;
  }

  mount(): void {
    // Create input row wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "cli-chat__input-row";

    // Create input element
    this.inputEl = document.createElement("input");
    this.inputEl.type = "text";
    this.inputEl.className = "cli-chat__input";
    this.inputEl.autocomplete = "off";
    this.inputEl.spellcheck = false;

    if (this.props.disabled) {
      this.inputEl.disabled = true;
      this.inputEl.setAttribute("aria-disabled", "true");
    }

    if (this.props.placeholder) {
      this.inputEl.placeholder = this.props.placeholder;
    }

    // Create blinking cursor element
    this.cursorEl = document.createElement("span");
    this.cursorEl.className = "cli-chat__cursor cli-chat__cursor--hidden";

    // Keydown handler: submit on Enter
    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && this.inputEl && !this.inputEl.disabled) {
        const value = this.inputEl.value.trim();
        if (value) {
          this.props.onSubmit(value);
          this.inputEl.value = "";
        }
      }
    };
    this.inputEl.addEventListener("keydown", this.keydownHandler);

    // Focus/blur handlers for cursor visibility
    this.focusHandler = () => {
      this.cursorEl?.classList.remove("cli-chat__cursor--hidden");
    };
    this.blurHandler = () => {
      this.cursorEl?.classList.add("cli-chat__cursor--hidden");
    };
    this.inputEl.addEventListener("focus", this.focusHandler);
    this.inputEl.addEventListener("blur", this.blurHandler);

    this.wrapper.appendChild(this.inputEl);
    this.wrapper.appendChild(this.cursorEl);
    this.props.container.appendChild(this.wrapper);
  }

  setDisabled(disabled: boolean): void {
    if (this.inputEl) {
      this.inputEl.disabled = disabled;
      this.inputEl.setAttribute("aria-disabled", String(disabled));
    }
  }

  setPlaceholder(text: string): void {
    if (this.inputEl) {
      this.inputEl.placeholder = text;
    }
  }

  getValue(): string {
    return this.inputEl?.value ?? "";
  }

  setValue(text: string): void {
    if (this.inputEl) {
      this.inputEl.value = text;
    }
  }

  getInputElement(): HTMLInputElement | null {
    return this.inputEl;
  }

  destroy(): void {
    if (this.inputEl && this.keydownHandler) {
      this.inputEl.removeEventListener("keydown", this.keydownHandler);
    }
    if (this.inputEl && this.focusHandler) {
      this.inputEl.removeEventListener("focus", this.focusHandler);
    }
    if (this.inputEl && this.blurHandler) {
      this.inputEl.removeEventListener("blur", this.blurHandler);
    }
    this.wrapper?.remove();
    this.wrapper = null;
    this.inputEl = null;
    this.cursorEl = null;
  }
}

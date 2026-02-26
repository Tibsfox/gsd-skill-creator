/**
 * LedPanel -- LED status panel with colored dots for service states.
 *
 * Renders colored indicator dots (8x8px circles) for each service.
 * Supports green/red/amber base colors with optional blink animation
 * for degraded (amber-blink) and failed (red-blink) states. Each dot
 * shows the service name as a tooltip. Pure DOM module -- no Tauri deps.
 */

export type LedColor = "green" | "red" | "amber" | "amber-blink" | "red-blink";

export interface ServiceLedState {
  status: string;
  led_color: string;
}

export class LedPanel {
  private container: HTMLElement;
  private panel: HTMLElement | null = null;
  private services: Map<string, ServiceLedState> = new Map();
  private dots: Map<string, HTMLElement> = new Map();

  constructor(container: HTMLElement) {
    this.container = container;
  }

  mount(): void {
    this.panel = document.createElement("div");
    this.panel.className = "led-panel";
    this.panel.style.display = "flex";
    this.panel.style.gap = "6px";
    this.panel.style.alignItems = "center";
    this.container.appendChild(this.panel);
  }

  updateService(
    serviceId: string,
    state: { status: string; led_color: string },
  ): void {
    this.services.set(serviceId, state);

    // Parse color string: "amber-blink" -> base "amber" + blink flag
    const isBlink = state.led_color.endsWith("-blink");
    const baseColor = isBlink
      ? state.led_color.replace("-blink", "")
      : state.led_color;

    let dot = this.dots.get(serviceId);
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "led-panel__dot";
      dot.style.display = "inline-block";
      dot.style.width = "8px";
      dot.style.height = "8px";
      dot.style.borderRadius = "50%";
      this.dots.set(serviceId, dot);
      this.panel?.appendChild(dot);
    }

    // Reset and apply classes
    dot.className = "led-panel__dot";
    dot.classList.add(`led-panel__dot--${baseColor}`);
    if (isBlink) {
      dot.classList.add("led-panel__dot--blink");
    }
    dot.title = serviceId;
  }

  getServiceStates(): Map<string, ServiceLedState> {
    return new Map(this.services);
  }

  destroy(): void {
    this.panel?.remove();
    this.panel = null;
    this.dots.clear();
    this.services.clear();
  }
}

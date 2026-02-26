import { describe, it, expect, beforeEach } from "vitest";
import { LedPanel } from "./led-panel";

describe("LedPanel", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders panel container with led-panel class", () => {
    const panel = new LedPanel(container);
    panel.mount();

    expect(container.querySelector(".led-panel")).not.toBeNull();
  });

  it("renders LED dot for each service", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "online", led_color: "green" });
    panel.updateService("watcher", { status: "offline", led_color: "red" });

    const dots = container.querySelectorAll(".led-panel__dot");
    expect(dots.length).toBe(2);
  });

  it("LED dot has correct color class for online (green)", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "online", led_color: "green" });

    const dot = container.querySelector(".led-panel__dot");
    expect(dot!.classList.contains("led-panel__dot--green")).toBe(true);
  });

  it("LED dot has correct color class for offline (red)", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "offline", led_color: "red" });

    const dot = container.querySelector(".led-panel__dot");
    expect(dot!.classList.contains("led-panel__dot--red")).toBe(true);
  });

  it("LED dot has correct color class for starting (amber)", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "starting", led_color: "amber" });

    const dot = container.querySelector(".led-panel__dot");
    expect(dot!.classList.contains("led-panel__dot--amber")).toBe(true);
  });

  it("LED dot has blink class for degraded (amber-blink)", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", {
      status: "degraded",
      led_color: "amber-blink",
    });

    const dot = container.querySelector(".led-panel__dot");
    expect(dot!.classList.contains("led-panel__dot--amber")).toBe(true);
    expect(dot!.classList.contains("led-panel__dot--blink")).toBe(true);
  });

  it("LED dot has blink class for failed (red-blink)", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", {
      status: "failed",
      led_color: "red-blink",
    });

    const dot = container.querySelector(".led-panel__dot");
    expect(dot!.classList.contains("led-panel__dot--red")).toBe(true);
    expect(dot!.classList.contains("led-panel__dot--blink")).toBe(true);
  });

  it("updates existing service instead of creating duplicate", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "online", led_color: "green" });
    panel.updateService("claude", { status: "offline", led_color: "red" });

    const dots = container.querySelectorAll(".led-panel__dot");
    expect(dots.length).toBe(1);
    expect(dots[0].classList.contains("led-panel__dot--red")).toBe(true);
    expect(dots[0].classList.contains("led-panel__dot--green")).toBe(false);
  });

  it("shows service label as title/tooltip", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "online", led_color: "green" });

    const dot = container.querySelector(".led-panel__dot") as HTMLElement;
    expect(dot.title).toContain("claude");
  });

  it("getServiceStates returns current state map", () => {
    const panel = new LedPanel(container);
    panel.mount();

    panel.updateService("claude", { status: "online", led_color: "green" });
    panel.updateService("watcher", { status: "offline", led_color: "red" });

    const states = panel.getServiceStates();
    expect(states.size).toBe(2);
    expect(states.get("claude")).toEqual({
      status: "online",
      led_color: "green",
    });
    expect(states.get("watcher")).toEqual({
      status: "offline",
      led_color: "red",
    });
  });

  it("destroy removes panel DOM", () => {
    const panel = new LedPanel(container);
    panel.mount();
    panel.destroy();

    expect(container.querySelector(".led-panel")).toBeNull();
  });
});

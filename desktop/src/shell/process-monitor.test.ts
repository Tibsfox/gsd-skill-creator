import { describe, it, expect, vi } from "vitest";
import { ProcessMonitor } from "./process-monitor";

describe("ProcessMonitor", () => {
  it("registerProcess adds indicator", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    const indicators = pm.getIndicators();
    expect(indicators).toHaveLength(1);
    expect(indicators[0]).toEqual({ id: "claude", label: "Claude", status: "idle" });
  });

  it("registerProcess multiple processes", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    pm.registerProcess("watcher", "Watcher", "running");
    pm.registerProcess("terminal", "Terminal", "stopped");
    expect(pm.getIndicators()).toHaveLength(3);
  });

  it("updateStatus changes indicator status", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    pm.updateStatus("claude", "running");
    const indicators = pm.getIndicators();
    const claude = indicators.find((i) => i.id === "claude");
    expect(claude?.status).toBe("running");
  });

  it("updateStatus on unknown id is no-op", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    expect(() => pm.updateStatus("unknown", "running")).not.toThrow();
    expect(pm.getIndicators()).toHaveLength(1);
  });

  it("removeProcess removes indicator", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    pm.removeProcess("claude");
    expect(pm.getIndicators()).toHaveLength(0);
  });

  it("removeProcess unknown id is no-op", () => {
    const pm = new ProcessMonitor();
    expect(() => pm.removeProcess("unknown")).not.toThrow();
  });

  it("onChange notifies on updateStatus", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    const spy = vi.fn();
    pm.onChange(spy);
    pm.updateStatus("claude", "running");
    expect(spy).toHaveBeenCalledTimes(1);
    const args = spy.mock.calls[0][0];
    expect(args[0].status).toBe("running");
  });

  it("onChange notifies on registerProcess", () => {
    const pm = new ProcessMonitor();
    const spy = vi.fn();
    pm.onChange(spy);
    pm.registerProcess("claude", "Claude", "idle");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("onChange notifies on removeProcess", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    const spy = vi.fn();
    pm.onChange(spy);
    pm.removeProcess("claude");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("onChange returns unsubscribe", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    const spy = vi.fn();
    const unsub = pm.onChange(spy);
    unsub();
    pm.updateStatus("claude", "running");
    expect(spy).not.toHaveBeenCalled();
  });

  it("destroy clears all indicators and listeners", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    pm.registerProcess("watcher", "Watcher", "running");
    const spy = vi.fn();
    pm.onChange(spy);
    pm.destroy();
    expect(pm.getIndicators()).toHaveLength(0);
  });

  it("multiple listeners all notified", () => {
    const pm = new ProcessMonitor();
    pm.registerProcess("claude", "Claude", "idle");
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    pm.onChange(spy1);
    pm.onChange(spy2);
    pm.updateStatus("claude", "running");
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
  });
});

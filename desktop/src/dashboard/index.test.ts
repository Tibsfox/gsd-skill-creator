import { describe, it, expect } from "vitest";
import {
  DASHBOARD_PAGES,
  DashboardHost,
  WatcherRefresh,
  DEFAULT_PALETTE,
  paletteToCssVars,
  applyPalette,
  removePalette,
} from "./index";

describe("dashboard barrel exports", () => {
  it("exports DASHBOARD_PAGES array", () => {
    expect(DASHBOARD_PAGES).toHaveLength(6);
  });

  it("exports DashboardHost class", () => {
    expect(DashboardHost).toBeDefined();
    expect(typeof DashboardHost).toBe("function");
  });

  it("exports WatcherRefresh class", () => {
    expect(WatcherRefresh).toBeDefined();
    expect(typeof WatcherRefresh).toBe("function");
  });

  it("exports palette bridge functions", () => {
    expect(DEFAULT_PALETTE).toBeDefined();
    expect(typeof paletteToCssVars).toBe("function");
    expect(typeof applyPalette).toBe("function");
    expect(typeof removePalette).toBe("function");
  });
});

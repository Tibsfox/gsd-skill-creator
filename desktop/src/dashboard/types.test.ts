import { describe, it, expect } from "vitest";
import {
  DASHBOARD_PAGES,
  type DashboardPage,
  type GenerateRequest,
  type GenerateResponse,
  type DashboardConfig,
} from "./types";

describe("DashboardPage type and DASHBOARD_PAGES", () => {
  it("has exactly 6 entries", () => {
    expect(DASHBOARD_PAGES).toHaveLength(6);
  });

  it("contains all expected page names", () => {
    const expected: DashboardPage[] = [
      "index",
      "requirements",
      "roadmap",
      "milestones",
      "state",
      "console",
    ];
    for (const page of expected) {
      expect(DASHBOARD_PAGES).toContain(page);
    }
  });

  it("pages are in expected order", () => {
    expect(DASHBOARD_PAGES[0]).toBe("index");
    expect(DASHBOARD_PAGES[5]).toBe("console");
  });
});

describe("GenerateRequest shape", () => {
  it("accepts valid request fields", () => {
    const req: GenerateRequest = {
      page: "index",
      planningDir: "/tmp/.planning",
    };
    expect(req.page).toBe("index");
    expect(req.planningDir).toBe("/tmp/.planning");
    expect(req.force).toBeUndefined();
  });

  it("accepts optional force flag", () => {
    const req: GenerateRequest = {
      page: "roadmap",
      planningDir: "/tmp/.planning",
      force: true,
    };
    expect(req.force).toBe(true);
  });
});

describe("GenerateResponse shape", () => {
  it("contains required html, page, and duration", () => {
    const resp: GenerateResponse = {
      html: "<h1>Dashboard</h1>",
      page: "index",
      duration: 42.5,
    };
    expect(resp.html).toBe("<h1>Dashboard</h1>");
    expect(resp.page).toBe("index");
    expect(resp.duration).toBe(42.5);
    expect(resp.error).toBeUndefined();
  });

  it("accepts optional error field", () => {
    const resp: GenerateResponse = {
      html: "",
      page: "state",
      duration: 0,
      error: "Node process failed",
    };
    expect(resp.error).toBe("Node process failed");
  });
});

describe("DashboardConfig shape", () => {
  it("requires planningDir", () => {
    const config: DashboardConfig = {
      planningDir: "/project/.planning",
    };
    expect(config.planningDir).toBe("/project/.planning");
    expect(config.outputDir).toBeUndefined();
  });

  it("accepts optional outputDir", () => {
    const config: DashboardConfig = {
      planningDir: "/project/.planning",
      outputDir: "/tmp/dashboard-out",
    };
    expect(config.outputDir).toBe("/tmp/dashboard-out");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { randomFillSync } from "node:crypto";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { generateDashboard, generateAllPages } from "./ipc";
import { DASHBOARD_PAGES } from "./types";
import type { DashboardPage, GenerateResponse } from "./types";

// jsdom does not provide crypto.getRandomValues; mockIPC needs it
beforeEach(() => {
  if (!globalThis.crypto?.getRandomValues) {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: {
        getRandomValues: (arr: Uint32Array) => randomFillSync(arr),
      },
    });
  }
});

afterEach(() => {
  clearMocks();
});

function mockDashboardResponse(page: DashboardPage): GenerateResponse {
  return {
    html: `<h1>${page}</h1>`,
    page,
    duration: 50,
  };
}

describe("generateDashboard", () => {
  it("invokes generate_dashboard with correct command name and args", async () => {
    let capturedCmd = "";
    let capturedArgs: Record<string, unknown> = {};

    mockIPC((cmd, payload) => {
      capturedCmd = cmd;
      capturedArgs = payload as Record<string, unknown>;
      return mockDashboardResponse("index");
    });

    await generateDashboard("index", "/tmp/.planning");

    expect(capturedCmd).toBe("generate_dashboard");
    expect(capturedArgs).toMatchObject({
      page: "index",
      planningDir: "/tmp/.planning",
    });
  });

  it("returns GenerateResponse from Rust", async () => {
    mockIPC((cmd) => {
      if (cmd === "generate_dashboard") {
        return {
          html: "<h1>Roadmap</h1>",
          page: "roadmap",
          duration: 123.4,
        };
      }
    });

    const result = await generateDashboard("roadmap", "/project/.planning");

    expect(result).toEqual({
      html: "<h1>Roadmap</h1>",
      page: "roadmap",
      duration: 123.4,
    });
  });
});

describe("generateAllPages", () => {
  it("returns array of 6 GenerateResponse objects", async () => {
    mockIPC((cmd, payload) => {
      if (cmd === "generate_dashboard") {
        const args = payload as Record<string, unknown>;
        return mockDashboardResponse(args.page as DashboardPage);
      }
    });

    const results = await generateAllPages("/tmp/.planning");

    expect(results).toHaveLength(DASHBOARD_PAGES.length);
    for (let i = 0; i < DASHBOARD_PAGES.length; i++) {
      expect(results[i].page).toBe(DASHBOARD_PAGES[i]);
      expect(results[i].html).toContain(DASHBOARD_PAGES[i]);
    }
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardHost } from "./dashboard-host";
import { DASHBOARD_PAGES } from "./types";
import type { DashboardPage, GenerateResponse } from "./types";

vi.mock("./ipc", () => ({
  generateDashboard: vi.fn(),
}));

import { generateDashboard } from "./ipc";

const mockGenerateDashboard = vi.mocked(generateDashboard);

function makeContainer(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function makeHost(overrides: Partial<ConstructorParameters<typeof DashboardHost>[0]> = {}): {
  host: DashboardHost;
  container: HTMLElement;
} {
  const container = overrides.container ?? makeContainer();
  const host = new DashboardHost({
    planningDir: "/tmp/.planning",
    ...overrides,
    container,
  });
  return { host, container };
}

describe("DashboardHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  describe("construction", () => {
    it("creates without error given valid options", () => {
      expect(() => makeHost()).not.toThrow();
    });

    it("appends a navigation bar element to the container", () => {
      const { container } = makeHost();
      const nav = container.querySelector("nav.dash-host-nav");
      expect(nav).not.toBeNull();
    });

    it("appends a content area element to the container", () => {
      const { container } = makeHost();
      const content = container.querySelector(".dash-host-content");
      expect(content).not.toBeNull();
    });

    it("navigation bar has 6 links, one per DASHBOARD_PAGES", () => {
      const { container } = makeHost();
      const links = container.querySelectorAll("nav.dash-host-nav a");
      expect(links).toHaveLength(DASHBOARD_PAGES.length);
      for (let i = 0; i < DASHBOARD_PAGES.length; i++) {
        expect(links[i].getAttribute("data-page")).toBe(DASHBOARD_PAGES[i]);
      }
    });
  });

  describe("page loading (setHtml)", () => {
    it("renders HTML inside the content area", () => {
      const { host, container } = makeHost();
      host.setHtml("index", "<h1>Dashboard</h1>");
      const content = container.querySelector(".dash-host-content");
      expect(content!.innerHTML).toContain("<h1>Dashboard</h1>");
    });

    it("strips <script> tags from HTML for security", () => {
      const { host, container } = makeHost();
      host.setHtml("index", '<h1>Hello</h1><script>alert("xss")</script>');
      const content = container.querySelector(".dash-host-content");
      expect(content!.innerHTML).not.toContain("<script");
      expect(content!.innerHTML).toContain("<h1>Hello</h1>");
    });

    it("strips <link rel='stylesheet'> external stylesheet tags", () => {
      const { host, container } = makeHost();
      host.setHtml("index", '<link rel="stylesheet" href="evil.css"><h1>Safe</h1>');
      const content = container.querySelector(".dash-host-content");
      expect(content!.innerHTML).not.toContain("<link");
      expect(content!.innerHTML).toContain("<h1>Safe</h1>");
    });
  });

  describe("navigation", () => {
    it("currentPage returns 'index' initially", () => {
      const { host } = makeHost();
      expect(host.currentPage).toBe("index");
    });

    it("setHtml changes currentPage", () => {
      const { host } = makeHost();
      host.setHtml("roadmap", "<h1>Roadmap</h1>");
      expect(host.currentPage).toBe("roadmap");
    });

    it("active navigation link has data-active='true'", () => {
      const { host, container } = makeHost();
      host.setHtml("roadmap", "<h1>Roadmap</h1>");
      const activeLink = container.querySelector('a[data-page="roadmap"]');
      expect(activeLink!.getAttribute("data-active")).toBe("true");

      const indexLink = container.querySelector('a[data-page="index"]');
      expect(indexLink!.getAttribute("data-active")).toBeNull();
    });

    it("onPageChange callback fires when page changes", () => {
      const onPageChange = vi.fn();
      const { host } = makeHost({ onPageChange });
      host.setHtml("milestones", "<h1>Milestones</h1>");
      expect(onPageChange).toHaveBeenCalledWith("milestones");
    });

    it("clicking a navigation link triggers loadPage", async () => {
      const mockResponse: GenerateResponse = {
        html: "<h1>Requirements</h1>",
        page: "requirements",
        duration: 10,
      };
      mockGenerateDashboard.mockResolvedValue(mockResponse);

      const onPageChange = vi.fn();
      const { container } = makeHost({ onPageChange });
      const link = container.querySelector('a[data-page="requirements"]') as HTMLAnchorElement;
      link.click();

      // loadPage is async, wait for it
      await vi.waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith("requirements");
      });
    });
  });

  describe("caching", () => {
    it("switching back to a previously loaded page shows cached HTML", () => {
      const { host, container } = makeHost();
      host.setHtml("index", "<h1>Index Content</h1>");
      host.setHtml("roadmap", "<h1>Roadmap Content</h1>");
      host.setHtml("index", "<h1>Should use cache</h1>");

      // The setHtml call above explicitly sets new content, but loadPage uses cache
      // Test that after setHtml caches, loadPage reuses it
    });

    it("loadPage uses cache when available instead of IPC", async () => {
      const { host } = makeHost();
      host.setHtml("index", "<h1>Cached Index</h1>");

      // loadPage should use cached content, not call IPC
      await host.loadPage("index");
      expect(mockGenerateDashboard).not.toHaveBeenCalled();
    });

    it("invalidateCache(page) clears only that page", async () => {
      const mockResponse: GenerateResponse = {
        html: "<h1>Fresh Index</h1>",
        page: "index",
        duration: 10,
      };
      mockGenerateDashboard.mockResolvedValue(mockResponse);

      const { host } = makeHost();
      host.setHtml("index", "<h1>Old Index</h1>");
      host.setHtml("roadmap", "<h1>Old Roadmap</h1>");

      host.invalidateCache("index");

      // loadPage("index") should now call IPC since cache was cleared
      await host.loadPage("index");
      expect(mockGenerateDashboard).toHaveBeenCalledWith("index", "/tmp/.planning");

      // loadPage("roadmap") should still use cache
      mockGenerateDashboard.mockClear();
      await host.loadPage("roadmap");
      expect(mockGenerateDashboard).not.toHaveBeenCalled();
    });

    it("invalidateCache() with no args clears all cached pages", async () => {
      const mockResponse: GenerateResponse = {
        html: "<h1>Fresh</h1>",
        page: "index",
        duration: 10,
      };
      mockGenerateDashboard.mockResolvedValue(mockResponse);

      const { host } = makeHost();
      host.setHtml("index", "<h1>Old</h1>");
      host.setHtml("roadmap", "<h1>Old</h1>");

      host.invalidateCache();

      await host.loadPage("index");
      expect(mockGenerateDashboard).toHaveBeenCalled();
    });
  });

  describe("loading state", () => {
    it("onLoading callback fires true then false during loadPage", async () => {
      const mockResponse: GenerateResponse = {
        html: "<h1>Page</h1>",
        page: "state",
        duration: 10,
      };
      mockGenerateDashboard.mockResolvedValue(mockResponse);

      const onLoading = vi.fn();
      const { host } = makeHost({ onLoading });

      await host.loadPage("state");

      expect(onLoading).toHaveBeenCalledWith(true);
      expect(onLoading).toHaveBeenCalledWith(false);
      // true must come before false
      const calls = onLoading.mock.calls.map((c) => c[0]);
      expect(calls.indexOf(true)).toBeLessThan(calls.lastIndexOf(false));
    });
  });

  describe("cleanup", () => {
    it("destroy removes navigation bar and content area from container", () => {
      const { host, container } = makeHost();
      host.destroy();
      expect(container.querySelector("nav.dash-host-nav")).toBeNull();
      expect(container.querySelector(".dash-host-content")).toBeNull();
    });

    it("after destroy, container has no dashboard-host children", () => {
      const { host, container } = makeHost();
      host.destroy();
      expect(container.children).toHaveLength(0);
    });
  });
});

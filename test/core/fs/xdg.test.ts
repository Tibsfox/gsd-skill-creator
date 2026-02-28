import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";

// Store original env values
const originalEnv = { ...process.env };

describe("XDG Base Directory utilities", () => {
  beforeEach(() => {
    // Clear all XDG env vars before each test
    delete process.env.XDG_CONFIG_HOME;
    delete process.env.XDG_DATA_HOME;
    delete process.env.XDG_STATE_HOME;
    delete process.env.XDG_CACHE_HOME;
    delete process.env.XDG_RUNTIME_DIR;
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
  });

  // Dynamic import to get fresh module for each test group
  async function loadXdg() {
    // Clear module cache to pick up env changes
    const mod = await import("../../../src/fs/xdg.js");
    return mod;
  }

  describe("configDir", () => {
    it("uses XDG_CONFIG_HOME when set to absolute path", async () => {
      process.env.XDG_CONFIG_HOME = "/custom/config";
      const { configDir } = await loadXdg();
      expect(configDir()).toBe("/custom/config/gsd-os");
    });

    it("falls back to ~/.config when XDG_CONFIG_HOME is unset", async () => {
      const { configDir } = await loadXdg();
      expect(configDir()).toBe(join(homedir(), ".config", "gsd-os"));
    });

    it("ignores relative path in XDG_CONFIG_HOME", async () => {
      process.env.XDG_CONFIG_HOME = "relative/path";
      const { configDir } = await loadXdg();
      expect(configDir()).toBe(join(homedir(), ".config", "gsd-os"));
    });
  });

  describe("dataDir", () => {
    it("uses XDG_DATA_HOME when set to absolute path", async () => {
      process.env.XDG_DATA_HOME = "/custom/data";
      const { dataDir } = await loadXdg();
      expect(dataDir()).toBe("/custom/data/gsd-os");
    });

    it("falls back to ~/.local/share when XDG_DATA_HOME is unset", async () => {
      const { dataDir } = await loadXdg();
      expect(dataDir()).toBe(join(homedir(), ".local/share", "gsd-os"));
    });
  });

  describe("stateDir", () => {
    it("uses XDG_STATE_HOME when set to absolute path", async () => {
      process.env.XDG_STATE_HOME = "/custom/state";
      const { stateDir } = await loadXdg();
      expect(stateDir()).toBe("/custom/state/gsd-os");
    });

    it("falls back to ~/.local/state when XDG_STATE_HOME is unset", async () => {
      const { stateDir } = await loadXdg();
      expect(stateDir()).toBe(join(homedir(), ".local/state", "gsd-os"));
    });
  });

  describe("cacheDir", () => {
    it("uses XDG_CACHE_HOME when set to absolute path", async () => {
      process.env.XDG_CACHE_HOME = "/custom/cache";
      const { cacheDir } = await loadXdg();
      expect(cacheDir()).toBe("/custom/cache/gsd-os");
    });

    it("falls back to ~/.cache when XDG_CACHE_HOME is unset", async () => {
      const { cacheDir } = await loadXdg();
      expect(cacheDir()).toBe(join(homedir(), ".cache", "gsd-os"));
    });
  });

  describe("runtimeDir", () => {
    it("returns undefined when XDG_RUNTIME_DIR is unset", async () => {
      const { runtimeDir } = await loadXdg();
      expect(runtimeDir()).toBeUndefined();
    });

    it("returns path when XDG_RUNTIME_DIR is set to absolute path", async () => {
      process.env.XDG_RUNTIME_DIR = "/run/user/1000";
      const { runtimeDir } = await loadXdg();
      expect(runtimeDir()).toBe("/run/user/1000/gsd-os");
    });

    it("returns undefined when XDG_RUNTIME_DIR is relative", async () => {
      process.env.XDG_RUNTIME_DIR = "relative/runtime";
      const { runtimeDir } = await loadXdg();
      expect(runtimeDir()).toBeUndefined();
    });

    it("returns undefined when XDG_RUNTIME_DIR is empty string", async () => {
      process.env.XDG_RUNTIME_DIR = "";
      const { runtimeDir } = await loadXdg();
      expect(runtimeDir()).toBeUndefined();
    });
  });

  describe("cross-cutting concerns", () => {
    it("all returned paths are absolute", async () => {
      const { configDir, dataDir, stateDir, cacheDir } = await loadXdg();
      expect(configDir().startsWith("/")).toBe(true);
      expect(dataDir().startsWith("/")).toBe(true);
      expect(stateDir().startsWith("/")).toBe(true);
      expect(cacheDir().startsWith("/")).toBe(true);
    });

    it("all paths include gsd-os subdirectory", async () => {
      const { configDir, dataDir, stateDir, cacheDir, APP_NAME } = await loadXdg();
      expect(APP_NAME).toBe("gsd-os");
      expect(configDir()).toContain("gsd-os");
      expect(dataDir()).toContain("gsd-os");
      expect(stateDir()).toContain("gsd-os");
      expect(cacheDir()).toContain("gsd-os");
    });

    it("ignores empty string env values", async () => {
      process.env.XDG_CONFIG_HOME = "";
      const { configDir } = await loadXdg();
      expect(configDir()).toBe(join(homedir(), ".config", "gsd-os"));
    });
  });
});

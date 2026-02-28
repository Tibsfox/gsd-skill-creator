import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ScConfigSchema,
  ExternalProjectSchema,
  loadConfig,
  saveConfig,
  defaultConfig,
  resolveProjectPath,
} from "../../../src/fs/config.js";

// --- Helpers ---

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-config-test-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function writeConfig(root: string, content: unknown): Promise<void> {
  await writeFile(join(root, ".sc-config.json"), JSON.stringify(content, null, 2));
}

// --- ScConfigSchema ---

describe("ScConfigSchema", () => {
  it("parses valid complete config", () => {
    const result = ScConfigSchema.safeParse({
      home: "projects",
      external_projects: [{ name: "my-app", path: "/home/user/my-app" }],
      upstream_forks: { "anthropic/claude": "/home/user/forks/claude" },
      www: { build_dir: "site", tools_dir: "tools" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.home).toBe("projects");
      expect(result.data.external_projects).toHaveLength(1);
    }
  });

  it("applies defaults for missing optional fields", () => {
    const result = ScConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.home).toBe("projects");
      expect(result.data.external_projects).toEqual([]);
      expect(result.data.upstream_forks).toEqual({});
      expect(result.data.www.build_dir).toBe("site");
      expect(result.data.www.tools_dir).toBe("tools");
    }
  });

  it("rejects invalid project names (uppercase)", () => {
    const result = ExternalProjectSchema.safeParse({ name: "MyApp", path: "/tmp/myapp" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toContain("lowercase alphanumeric with hyphens");
    }
  });

  it("rejects invalid project names (spaces)", () => {
    const result = ExternalProjectSchema.safeParse({ name: "my app", path: "/tmp/myapp" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid project names (empty)", () => {
    const result = ExternalProjectSchema.safeParse({ name: "", path: "/tmp/myapp" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toContain("cannot be empty");
    }
  });

  it("rejects relative external project paths", () => {
    const result = ExternalProjectSchema.safeParse({ name: "app", path: "relative/path" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toContain("must be absolute");
    }
  });

  it("rejects unknown fields (strict mode)", () => {
    const result = ScConfigSchema.safeParse({ unknown_field: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0].message;
      expect(msg).toContain("unknown_field");
    }
  });

  it("accepts empty object (all defaults)", () => {
    const result = ScConfigSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

// --- loadConfig ---

describe("loadConfig", () => {
  it("returns defaults when no config file exists", async () => {
    const config = await loadConfig(tmpRoot);
    expect(config.home).toBe("projects");
    expect(config.external_projects).toEqual([]);
    expect(config.upstream_forks).toEqual({});
    expect(config.www.build_dir).toBe("site");
    expect(config.www.tools_dir).toBe("tools");
  });

  it("loads and validates existing config file", async () => {
    await writeConfig(tmpRoot, {
      home: "my-projects",
      external_projects: [{ name: "work-app", path: "/home/user/work-app" }],
    });
    const config = await loadConfig(tmpRoot);
    expect(config.home).toBe("my-projects");
    expect(config.external_projects).toHaveLength(1);
    expect(config.external_projects[0].name).toBe("work-app");
  });

  it("throws clear error on invalid JSON", async () => {
    await writeFile(join(tmpRoot, ".sc-config.json"), "not json {{{");
    await expect(loadConfig(tmpRoot)).rejects.toThrow("Invalid JSON in .sc-config.json");
  });

  it("throws clear error on schema violation", async () => {
    await writeConfig(tmpRoot, { home: 42 });
    await expect(loadConfig(tmpRoot)).rejects.toThrow("Invalid .sc-config.json");
  });

  it("includes file path in error messages for JSON parse errors", async () => {
    await writeFile(join(tmpRoot, ".sc-config.json"), "bad");
    await expect(loadConfig(tmpRoot)).rejects.toThrow(tmpRoot);
  });

  it("includes file path in error messages for schema errors", async () => {
    await writeConfig(tmpRoot, { unknown_key: true });
    await expect(loadConfig(tmpRoot)).rejects.toThrow(tmpRoot);
  });
});

// --- saveConfig ---

describe("saveConfig", () => {
  it("writes validated config as formatted JSON", async () => {
    const config = defaultConfig();
    await saveConfig(tmpRoot, config);
    const loaded = await loadConfig(tmpRoot);
    expect(loaded).toEqual(config);
  });

  it("validates before writing (rejects invalid via schema.parse)", async () => {
    // Pass a config object with a bad external project via type cast
    const badConfig = {
      home: "projects",
      external_projects: [{ name: "BAD NAME", path: "relative" }],
      upstream_forks: {},
      www: { build_dir: "site", tools_dir: "tools" },
    };
    // saveConfig calls ScConfigSchema.parse which will throw on invalid data
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saveConfig(tmpRoot, badConfig as any)
    ).rejects.toThrow();
  });
});

// --- resolveProjectPath ---

describe("resolveProjectPath", () => {
  it("resolves relative home path against root", () => {
    const config = defaultConfig(); // home: "projects"
    const resolved = resolveProjectPath("/home/user/sc", config);
    expect(resolved).toBe("/home/user/sc/projects");
  });

  it("returns absolute home path unchanged", () => {
    const config = { ...defaultConfig(), home: "/abs/projects" };
    const resolved = resolveProjectPath("/home/user/sc", config);
    expect(resolved).toBe("/abs/projects");
  });
});

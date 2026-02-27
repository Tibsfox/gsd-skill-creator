import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ProjectManager } from "../../src/fs/project-manager.js";
import { defaultConfig } from "../../src/fs/config.js";

// --- Helpers ---

let tmpRoot: string;
let projectsDir: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-pm-test-"));
  projectsDir = join(tmpRoot, "projects");
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

function makeManager(overrides: Partial<ReturnType<typeof defaultConfig>> = {}) {
  const config = { ...defaultConfig(), ...overrides };
  return new ProjectManager(tmpRoot, config);
}

// --- list() ---

describe("list()", () => {
  it("returns empty array when projects/ does not exist", async () => {
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result).toEqual([]);
  });

  it("returns empty array when projects/ is empty", async () => {
    await mkdir(projectsDir);
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result).toEqual([]);
  });

  it("lists local projects with hasPlanning=false when .planning absent", async () => {
    await mkdir(join(projectsDir, "my-app"), { recursive: true });
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("my-app");
    expect(result[0].external).toBe(false);
    expect(result[0].hasPlanning).toBe(false);
    expect(result[0].path).toBe(join(projectsDir, "my-app"));
  });

  it("detects .planning directory in local projects", async () => {
    await mkdir(join(projectsDir, "with-plan", ".planning"), { recursive: true });
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result).toHaveLength(1);
    expect(result[0].hasPlanning).toBe(true);
  });

  it("skips hidden directories (starting with .)", async () => {
    await mkdir(join(projectsDir, ".hidden"), { recursive: true });
    await mkdir(join(projectsDir, "visible"), { recursive: true });
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("visible");
  });

  it("includes external projects from config", async () => {
    const extPath = join(tmpRoot, "external-project");
    await mkdir(extPath, { recursive: true });
    const mgr = makeManager({
      external_projects: [{ name: "ext-proj", path: extPath }],
    });
    const result = await mgr.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("ext-proj");
    expect(result[0].external).toBe(true);
    expect(result[0].path).toBe(extPath);
  });

  it("detects .planning in external projects", async () => {
    const extPath = join(tmpRoot, "ext-with-plan");
    await mkdir(join(extPath, ".planning"), { recursive: true });
    const mgr = makeManager({
      external_projects: [{ name: "ext-plan", path: extPath }],
    });
    const result = await mgr.list();
    expect(result[0].hasPlanning).toBe(true);
  });

  it("sorts projects alphabetically by name", async () => {
    await mkdir(join(projectsDir, "zebra"), { recursive: true });
    await mkdir(join(projectsDir, "alpha"), { recursive: true });
    await mkdir(join(projectsDir, "mango"), { recursive: true });
    const mgr = makeManager();
    const result = await mgr.list();
    expect(result.map((p) => p.name)).toEqual(["alpha", "mango", "zebra"]);
  });

  it("interleaves local and external in sorted order", async () => {
    const extPath = join(tmpRoot, "beta-ext");
    await mkdir(extPath, { recursive: true });
    await mkdir(join(projectsDir, "alpha-local"), { recursive: true });
    await mkdir(join(projectsDir, "gamma-local"), { recursive: true });
    const mgr = makeManager({
      external_projects: [{ name: "beta-ext", path: extPath }],
    });
    const result = await mgr.list();
    expect(result.map((p) => p.name)).toEqual([
      "alpha-local",
      "beta-ext",
      "gamma-local",
    ]);
  });
});

// --- init() ---

describe("init()", () => {
  it("creates project directory with .planning/ scaffold", async () => {
    await mkdir(projectsDir);
    const mgr = makeManager();
    await mgr.init("my-new-project");
    const { existsSync } = await import("node:fs");
    expect(existsSync(join(projectsDir, "my-new-project", ".planning"))).toBe(true);
  });

  it("returns valid ProjectDescriptor on success", async () => {
    await mkdir(projectsDir);
    const mgr = makeManager();
    const result = await mgr.init("hello-world");
    expect(result.name).toBe("hello-world");
    expect(result.path).toBe(join(projectsDir, "hello-world"));
    expect(result.external).toBe(false);
    expect(result.hasPlanning).toBe(true);
  });

  it("rejects uppercase names", async () => {
    const mgr = makeManager();
    await expect(mgr.init("MyProject")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects names with spaces", async () => {
    const mgr = makeManager();
    await expect(mgr.init("my project")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects names with underscores", async () => {
    const mgr = makeManager();
    await expect(mgr.init("my_project")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects names starting with a hyphen", async () => {
    const mgr = makeManager();
    await expect(mgr.init("-bad")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects empty name", async () => {
    const mgr = makeManager();
    await expect(mgr.init("")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects path traversal via dots", async () => {
    const mgr = makeManager();
    await expect(mgr.init("..")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects names containing slashes", async () => {
    const mgr = makeManager();
    await expect(mgr.init("a/b")).rejects.toThrow(
      "must be lowercase alphanumeric with hyphens"
    );
  });

  it("rejects duplicate project names", async () => {
    await mkdir(projectsDir);
    const mgr = makeManager();
    await mgr.init("existing");
    await expect(mgr.init("existing")).rejects.toThrow(
      "already exists"
    );
  });

  it("creates projects/ directory if it does not exist", async () => {
    // Do NOT create projectsDir first
    const mgr = makeManager();
    const result = await mgr.init("first-project");
    expect(result.hasPlanning).toBe(true);
    const { existsSync } = await import("node:fs");
    expect(existsSync(join(projectsDir, "first-project", ".planning"))).toBe(true);
  });
});

// --- status() ---

describe("status()", () => {
  it("returns formatted count string with zero projects", async () => {
    const mgr = makeManager();
    const result = await mgr.status();
    expect(result).toBe("0 projects (0 local, 0 external)");
  });

  it("returns formatted count with local projects only", async () => {
    await mkdir(join(projectsDir, "app-a"), { recursive: true });
    await mkdir(join(projectsDir, "app-b"), { recursive: true });
    const mgr = makeManager();
    const result = await mgr.status();
    expect(result).toBe("2 projects (2 local, 0 external)");
  });

  it("returns formatted count with external projects only", async () => {
    const extPath = join(tmpRoot, "some-ext");
    await mkdir(extPath, { recursive: true });
    const mgr = makeManager({
      external_projects: [{ name: "some-ext", path: extPath }],
    });
    const result = await mgr.status();
    expect(result).toBe("1 projects (0 local, 1 external)");
  });

  it("returns formatted count with mixed local and external", async () => {
    await mkdir(join(projectsDir, "local-one"), { recursive: true });
    const extPath = join(tmpRoot, "ext-one");
    await mkdir(extPath, { recursive: true });
    const mgr = makeManager({
      external_projects: [{ name: "ext-one", path: extPath }],
    });
    const result = await mgr.status();
    expect(result).toBe("2 projects (1 local, 1 external)");
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

import { projectCommand } from "../../src/fs/commands/project.js";
import { packCommand } from "../../src/fs/commands/pack.js";
import { contribCommand } from "../../src/fs/commands/contrib.js";
import { wwwCommand } from "../../src/fs/commands/www.js";

// --- Console capture ---

let consoleOutput: string[];
let consoleErrors: string[];

beforeEach(() => {
  consoleOutput = [];
  consoleErrors = [];
  vi.spyOn(console, "log").mockImplementation((...args) =>
    consoleOutput.push(args.join(" "))
  );
  vi.spyOn(console, "error").mockImplementation((...args) =>
    consoleErrors.push(args.join(" "))
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- Temp dir helpers ---

let tmpRoot: string;

async function setupTmpRoot(): Promise<string> {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-cli-int-test-"));
  return tmpRoot;
}

async function teardownTmpRoot(): Promise<void> {
  if (tmpRoot) {
    await rm(tmpRoot, { recursive: true, force: true });
  }
}

// =============================================================================
// project command tests
// =============================================================================

describe("projectCommand", () => {
  beforeEach(async () => {
    await setupTmpRoot();
  });
  afterEach(async () => {
    await teardownTmpRoot();
  });

  it("init creates project directory with .planning/ scaffold", async () => {
    await mkdir(join(tmpRoot, "projects"), { recursive: true });
    const code = await projectCommand(["init", "my-app"], tmpRoot);
    expect(code).toBe(0);
    expect(existsSync(join(tmpRoot, "projects", "my-app", ".planning"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("my-app"))).toBe(true);
  });

  it("init returns exit code 1 for invalid name (uppercase)", async () => {
    const code = await projectCommand(["init", "My-Bad-Name"], tmpRoot);
    expect(code).toBe(1);
    expect(consoleErrors.some(e => e.toLowerCase().includes("error"))).toBe(true);
  });

  it("list shows registered projects", async () => {
    await mkdir(join(tmpRoot, "projects", "alpha"), { recursive: true });
    await mkdir(join(tmpRoot, "projects", "beta"), { recursive: true });
    const code = await projectCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("alpha"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("beta"))).toBe(true);
  });

  it("list shows 'No projects found' when empty", async () => {
    const code = await projectCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("No projects"))).toBe(true);
  });

  it("status shows project summary", async () => {
    await mkdir(join(tmpRoot, "projects", "app-a"), { recursive: true });
    const code = await projectCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("project"))).toBe(true);
  });

  // SAFE-01: Path traversal rejection
  it("[SAFE-01] rejects path traversal via ../escape", async () => {
    const code = await projectCommand(["init", "../escape"], tmpRoot);
    expect(code).toBe(1);
    expect(consoleErrors.some(e => e.toLowerCase().includes("error"))).toBe(true);
    // Must NOT create any directory outside tmpRoot
    expect(existsSync(join(tmpRoot, "..", "escape"))).toBe(false);
  });

  it("[SAFE-01] rejects path traversal via test/slash", async () => {
    const code = await projectCommand(["init", "test/slash"], tmpRoot);
    expect(code).toBe(1);
    expect(consoleErrors.some(e => e.toLowerCase().includes("error"))).toBe(true);
  });

  it("[SAFE-01] rejects backslash path traversal", async () => {
    const code = await projectCommand(["init", "test\\escape"], tmpRoot);
    expect(code).toBe(1);
    expect(consoleErrors.some(e => e.toLowerCase().includes("error"))).toBe(true);
  });
});

// =============================================================================
// pack command tests
// =============================================================================

describe("packCommand", () => {
  beforeEach(async () => {
    await setupTmpRoot();
  });
  afterEach(async () => {
    await teardownTmpRoot();
  });

  it("list shows registered packs when source exists", async () => {
    // Create holomorphic pack source
    await mkdir(join(tmpRoot, "src", "holomorphic"), { recursive: true });
    await writeFile(join(tmpRoot, "src", "holomorphic", "types.ts"), "// mock\n");
    await writeFile(join(tmpRoot, "src", "holomorphic", "index.ts"), "// mock\n");

    const code = await packCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("holomorphic"))).toBe(true);
  });

  it("list shows 'No packs available' when no source paths exist", async () => {
    const code = await packCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("No packs"))).toBe(true);
  });

  it("info shows pack details when source exists", async () => {
    await mkdir(join(tmpRoot, "src", "holomorphic"), { recursive: true });
    await writeFile(join(tmpRoot, "src", "holomorphic", "types.ts"), "// mock\n");

    const code = await packCommand(["info", "holomorphic"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("holomorphic"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("Description"))).toBe(true);
  });

  it("info returns exit code 1 for nonexistent pack", async () => {
    const code = await packCommand(["info", "nonexistent"], tmpRoot);
    expect(code).toBe(1);
    expect(consoleErrors.some(e => e.includes("not found"))).toBe(true);
  });

  it("status shows pack summary", async () => {
    await mkdir(join(tmpRoot, "src", "agc"), { recursive: true });
    await writeFile(join(tmpRoot, "src", "agc", "types.ts"), "// mock\n");

    const code = await packCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("packs"))).toBe(true);
  });
});

// =============================================================================
// contrib command tests
// =============================================================================

describe("contribCommand", () => {
  beforeEach(async () => {
    await setupTmpRoot();
  });
  afterEach(async () => {
    await teardownTmpRoot();
  });

  it("status shows direction counts", async () => {
    // Create upstream and downstream dirs
    await mkdir(join(tmpRoot, "contrib", "upstream", "my-fork"), { recursive: true });
    await mkdir(join(tmpRoot, "contrib", "downstream", "staging", "pr-123"), { recursive: true });

    const code = await contribCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("upstream"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("downstream"))).toBe(true);
  });

  it("status works with empty contrib zone", async () => {
    const code = await contribCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.length).toBeGreaterThan(0);
  });

  it("list groups contributions by direction", async () => {
    await mkdir(join(tmpRoot, "contrib", "upstream", "fork-a"), { recursive: true });
    await mkdir(join(tmpRoot, "contrib", "publishing", "my-lib"), { recursive: true });

    const code = await contribCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("upstream"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("publishing"))).toBe(true);
  });

  it("list shows 'No contributions found' when empty", async () => {
    const code = await contribCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("No contributions"))).toBe(true);
  });
});

// =============================================================================
// www command tests
// =============================================================================

describe("wwwCommand", () => {
  beforeEach(async () => {
    await setupTmpRoot();
  });
  afterEach(async () => {
    await teardownTmpRoot();
  });

  it("status shows www state", async () => {
    const code = await wwwCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("www"))).toBe(true);
  });

  it("status reflects actual content in www/", async () => {
    await mkdir(join(tmpRoot, "www", "tools"), { recursive: true });
    await writeFile(join(tmpRoot, "www", "tools", "demo.html"), "<html/>");

    const code = await wwwCommand(["status"], tmpRoot);
    expect(code).toBe(0);
    const output = consoleOutput.join("\n");
    // tools=1 means one tool file exists
    expect(output).toMatch(/tools=1/);
  });

  it("list shows detailed www zone state", async () => {
    const code = await wwwCommand(["list"], tmpRoot);
    expect(code).toBe(0);
    expect(consoleOutput.some(line => line.includes("site"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("tools"))).toBe(true);
    expect(consoleOutput.some(line => line.includes("staging"))).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, access, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scaffoldZones } from "../../src/fs/scaffold.js";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-scaffold-test-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function dirExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

describe("scaffoldZones", () => {
  it("creates all four zone directories", async () => {
    await scaffoldZones(tmpRoot);
    expect(await dirExists(join(tmpRoot, "projects"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "contrib"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "packs"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "www"))).toBe(true);
  });

  it("creates contrib subdirectories", async () => {
    await scaffoldZones(tmpRoot);
    expect(await dirExists(join(tmpRoot, "contrib", "upstream"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "contrib", "downstream"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "contrib", "downstream", "staging"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "contrib", "publishing"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "contrib", "publishing", "templates"))).toBe(true);
  });

  it("creates www subdirectories", async () => {
    await scaffoldZones(tmpRoot);
    expect(await dirExists(join(tmpRoot, "www", "site"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "www", "tools"))).toBe(true);
    expect(await dirExists(join(tmpRoot, "www", "staging"))).toBe(true);
  });

  it("creates .gitkeep in leaf directories", async () => {
    await scaffoldZones(tmpRoot);
    expect(await fileExists(join(tmpRoot, "projects", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "upstream", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "downstream", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "downstream", "staging", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "publishing", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "publishing", "templates", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "packs", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "www", "site", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "www", "tools", ".gitkeep"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "www", "staging", ".gitkeep"))).toBe(true);
  });

  it("creates README.md in each zone root", async () => {
    await scaffoldZones(tmpRoot);
    expect(await fileExists(join(tmpRoot, "projects", "README.md"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "contrib", "README.md"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "packs", "README.md"))).toBe(true);
    expect(await fileExists(join(tmpRoot, "www", "README.md"))).toBe(true);
  });

  it("README.md contains Quick Start and Navigation sections", async () => {
    await scaffoldZones(tmpRoot);
    const projectsReadme = await readFile(join(tmpRoot, "projects", "README.md"), "utf-8");
    expect(projectsReadme).toContain("## Quick Start");
    expect(projectsReadme).toContain("## Navigation");

    const contribReadme = await readFile(join(tmpRoot, "contrib", "README.md"), "utf-8");
    expect(contribReadme).toContain("## Quick Start");
    expect(contribReadme).toContain("## Navigation");
  });

  it("is idempotent (calling twice produces no errors)", async () => {
    await scaffoldZones(tmpRoot);
    // Second call should not throw
    await expect(scaffoldZones(tmpRoot)).resolves.toBeUndefined();
  });

  it("does not overwrite existing README.md on second call", async () => {
    await scaffoldZones(tmpRoot);
    // Modify the README
    const readmePath = join(tmpRoot, "projects", "README.md");
    const original = await readFile(readmePath, "utf-8");
    // Manually change it
    const modified = "# Modified\n";
    await rm(readmePath);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(readmePath, modified, "utf-8");

    // Run scaffold again -- should not overwrite since file exists
    await scaffoldZones(tmpRoot);

    // File should still be our modified version (idempotent: only creates if missing)
    const after = await readFile(readmePath, "utf-8");
    expect(after).toBe(modified);
    // Restore check: original README would be longer
    expect(after).not.toBe(original);
  });
});

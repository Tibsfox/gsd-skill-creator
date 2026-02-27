import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { WWWStager } from "../../src/fs/www-stager.js";
import { defaultConfig } from "../../src/fs/config.js";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-www-test-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

describe("WWWStager", () => {
  it("returns descriptor with all false/zero when www/ is absent", async () => {
    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const [desc] = await mgr.list();
    expect(desc.hasSite).toBe(false);
    expect(desc.hasTools).toBe(false);
    expect(desc.hasStaging).toBe(false);
    expect(desc.toolCount).toBe(0);
  });

  it("detects built site when site dir has content", async () => {
    const siteDir = join(tmpRoot, "www", "site");
    await mkdir(siteDir, { recursive: true });
    await writeFile(join(siteDir, "index.html"), "<html></html>");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const [desc] = await mgr.list();
    expect(desc.hasSite).toBe(true);
  });

  it("reports hasSite false when site dir contains only .gitkeep", async () => {
    const siteDir = join(tmpRoot, "www", "site");
    await mkdir(siteDir, { recursive: true });
    await writeFile(join(siteDir, ".gitkeep"), "");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const [desc] = await mgr.list();
    expect(desc.hasSite).toBe(false);
  });

  it("counts tools files excluding .gitkeep", async () => {
    const toolsDir = join(tmpRoot, "www", "tools");
    await mkdir(toolsDir, { recursive: true });
    await writeFile(join(toolsDir, ".gitkeep"), "");
    await writeFile(join(toolsDir, "tool-a.sh"), "#!/bin/bash");
    await writeFile(join(toolsDir, "tool-b.sh"), "#!/bin/bash");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const [desc] = await mgr.list();
    expect(desc.hasTools).toBe(true);
    expect(desc.toolCount).toBe(2);
  });

  it("detects staging presence when staging dir has content", async () => {
    const stagingDir = join(tmpRoot, "www", "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "draft.md"), "# Draft");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const [desc] = await mgr.list();
    expect(desc.hasStaging).toBe(true);
  });

  it("handles missing www/ directory gracefully", async () => {
    const mgr = new WWWStager(tmpRoot, defaultConfig());
    await expect(mgr.list()).resolves.toHaveLength(1);
    const [desc] = await mgr.list();
    expect(desc.hasSite).toBe(false);
    expect(desc.hasTools).toBe(false);
    expect(desc.hasStaging).toBe(false);
    expect(desc.toolCount).toBe(0);
  });

  it("respects custom build_dir and tools_dir from config", async () => {
    const cfg = defaultConfig();
    cfg.www.build_dir = "dist";
    cfg.www.tools_dir = "scripts";

    const distDir = join(tmpRoot, "www", "dist");
    await mkdir(distDir, { recursive: true });
    await writeFile(join(distDir, "index.html"), "<html></html>");

    const scriptsDir = join(tmpRoot, "www", "scripts");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(join(scriptsDir, "deploy.sh"), "#!/bin/bash");

    const mgr = new WWWStager(tmpRoot, cfg);
    const [desc] = await mgr.list();
    expect(desc.hasSite).toBe(true);
    expect(desc.hasTools).toBe(true);
    expect(desc.toolCount).toBe(1);
  });

  it("status() returns formatted www state string", async () => {
    const toolsDir = join(tmpRoot, "www", "tools");
    await mkdir(toolsDir, { recursive: true });
    await writeFile(join(toolsDir, "tool-a.sh"), "#!/bin/bash");
    await writeFile(join(toolsDir, "tool-b.sh"), "#!/bin/bash");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const s = await mgr.status();
    expect(s).toBe("www: site=no, tools=2, staging=no");
  });

  it("status() reports built and staging when both have content", async () => {
    const siteDir = join(tmpRoot, "www", "site");
    await mkdir(siteDir, { recursive: true });
    await writeFile(join(siteDir, "index.html"), "<html></html>");

    const stagingDir = join(tmpRoot, "www", "staging");
    await mkdir(stagingDir, { recursive: true });
    await writeFile(join(stagingDir, "draft.md"), "# Draft");

    const mgr = new WWWStager(tmpRoot, defaultConfig());
    const s = await mgr.status();
    expect(s).toBe("www: site=built, tools=0, staging=yes");
  });
});

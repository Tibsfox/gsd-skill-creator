import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ContribManager } from "../../../src/fs/contrib-manager.js";
import { defaultConfig } from "../../../src/fs/config.js";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-contrib-test-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

describe("ContribManager", () => {
  it("returns empty array when contrib/ is absent", async () => {
    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const result = await mgr.list();
    expect(result).toEqual([]);
  });

  it("returns empty array when contrib/ exists but has no subdirs", async () => {
    await mkdir(join(tmpRoot, "contrib"), { recursive: true });
    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const result = await mgr.list();
    expect(result).toEqual([]);
  });

  it("scans upstream directory and returns upstream descriptors", async () => {
    const upstreamDir = join(tmpRoot, "contrib", "upstream");
    await mkdir(join(upstreamDir, "fork-a"), { recursive: true });
    await mkdir(join(upstreamDir, "fork-b"), { recursive: true });

    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const result = await mgr.list();

    const upstreams = result.filter(r => r.direction === "upstream");
    expect(upstreams).toHaveLength(2);
    const names = upstreams.map(u => u.name).sort();
    expect(names).toEqual(["fork-a", "fork-b"]);
    expect(upstreams[0].status).toBe("active");
  });

  it("scans downstream staging directory and returns downstream descriptors", async () => {
    const stagingDir = join(tmpRoot, "contrib", "downstream", "staging");
    await mkdir(join(stagingDir, "patch-1"), { recursive: true });

    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const result = await mgr.list();

    const downstreams = result.filter(r => r.direction === "downstream");
    expect(downstreams).toHaveLength(1);
    expect(downstreams[0].name).toBe("patch-1");
    expect(downstreams[0].status).toBe("staged");
  });

  it("scans publishing directory and excludes templates entry", async () => {
    const pubDir = join(tmpRoot, "contrib", "publishing");
    await mkdir(join(pubDir, "templates"), { recursive: true });
    await mkdir(join(pubDir, "release-v1"), { recursive: true });

    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const result = await mgr.list();

    const publishers = result.filter(r => r.direction === "publishing");
    expect(publishers).toHaveLength(1);
    expect(publishers[0].name).toBe("release-v1");
    expect(publishers[0].status).toBe("active");
  });

  it("includes config upstream_forks not already in upstream dir", async () => {
    const cfg = defaultConfig();
    (cfg.upstream_forks as Record<string, string>)["remote-fork"] = "/nonexistent/path";

    const mgr = new ContribManager(tmpRoot, cfg);
    const result = await mgr.list();

    const match = result.find(r => r.name === "remote-fork");
    expect(match).toBeDefined();
    expect(match?.direction).toBe("upstream");
    expect(match?.status).toBe("archived");
  });

  it("does not duplicate fork already scanned from upstream dir", async () => {
    const upstreamDir = join(tmpRoot, "contrib", "upstream");
    await mkdir(join(upstreamDir, "shared-fork"), { recursive: true });

    const cfg = defaultConfig();
    (cfg.upstream_forks as Record<string, string>)["shared-fork"] = join(upstreamDir, "shared-fork");

    const mgr = new ContribManager(tmpRoot, cfg);
    const result = await mgr.list();

    const matches = result.filter(r => r.name === "shared-fork");
    expect(matches).toHaveLength(1);
  });

  it("status() returns formatted direction counts", async () => {
    const upstreamDir = join(tmpRoot, "contrib", "upstream");
    await mkdir(join(upstreamDir, "fork-a"), { recursive: true });

    const stagingDir = join(tmpRoot, "contrib", "downstream", "staging");
    await mkdir(join(stagingDir, "patch-1"), { recursive: true });
    await mkdir(join(stagingDir, "patch-2"), { recursive: true });

    const pubDir = join(tmpRoot, "contrib", "publishing");
    await mkdir(join(pubDir, "release-v1"), { recursive: true });

    const mgr = new ContribManager(tmpRoot, defaultConfig());
    const s = await mgr.status();
    expect(s).toBe("1 upstream, 2 downstream, 1 publishing");
  });
});

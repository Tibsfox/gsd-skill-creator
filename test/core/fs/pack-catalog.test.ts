import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { PackCatalog } from "../../../src/core/fs/pack-catalog.js";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await mkdtemp(join(tmpdir(), "sc-pack-catalog-test-"));
});

afterEach(async () => {
  await rm(tmpRoot, { recursive: true, force: true });
});

async function createMockPack(root: string, sourcePath: string, tsFiles: string[]): Promise<void> {
  const fullPath = join(root, sourcePath);
  await mkdir(fullPath, { recursive: true });
  for (const name of tsFiles) {
    await writeFile(join(fullPath, name), "// mock\n", "utf-8");
  }
}

describe("PackCatalog", () => {
  describe("list()", () => {
    it("returns registered packs with descriptions", async () => {
      await createMockPack(tmpRoot, "src/holomorphic", ["types.ts", "index.ts"]);

      const catalog = new PackCatalog(tmpRoot);
      const packs = await catalog.list();

      const holomorphic = packs.find(p => p.name === "holomorphic");
      expect(holomorphic).toBeDefined();
      expect(holomorphic?.description).toContain("Complex dynamics");
      expect(holomorphic?.sourcePath).toBe("src/holomorphic");
    });

    it("counts .ts modules in source directories excluding .test.ts", async () => {
      await createMockPack(tmpRoot, "src/holomorphic", [
        "types.ts",
        "index.ts",
        "renderer.ts",
        "renderer.test.ts",
        "types.test.ts",
      ]);

      const catalog = new PackCatalog(tmpRoot);
      const packs = await catalog.list();

      const holomorphic = packs.find(p => p.name === "holomorphic");
      expect(holomorphic?.moduleCount).toBe(3);
    });

    it("omits packs whose source path does not exist", async () => {
      // Only create the agc pack directory
      await createMockPack(tmpRoot, "src/agc", ["types.ts"]);

      const catalog = new PackCatalog(tmpRoot);
      const packs = await catalog.list();

      const names = packs.map(p => p.name);
      expect(names).toContain("agc");
      expect(names).not.toContain("holomorphic");
      expect(names).not.toContain("electronics");
      expect(names).not.toContain("aminet");
    });

    it("returns multiple packs when multiple source paths exist", async () => {
      await createMockPack(tmpRoot, "src/agc", ["types.ts", "cpu.ts"]);
      await createMockPack(tmpRoot, "src/aminet", ["types.ts"]);

      const catalog = new PackCatalog(tmpRoot);
      const packs = await catalog.list();

      expect(packs.length).toBe(2);
      const agc = packs.find(p => p.name === "agc");
      expect(agc?.moduleCount).toBe(2);
    });

    it("returns empty array when no source paths exist", async () => {
      const catalog = new PackCatalog(tmpRoot);
      const packs = await catalog.list();
      expect(packs).toEqual([]);
    });
  });

  describe("info()", () => {
    it("returns descriptor for known pack", async () => {
      await createMockPack(tmpRoot, "src/knowledge", ["types.ts", "mna.ts", "warden.ts"]);

      const catalog = new PackCatalog(tmpRoot);
      const result = await catalog.info("electronics");

      expect(result).toBeDefined();
      expect(result?.name).toBe("electronics");
      expect(result?.description).toContain("MNA circuit simulation");
      expect(result?.moduleCount).toBe(3);
    });

    it("returns undefined for unknown pack", async () => {
      const catalog = new PackCatalog(tmpRoot);
      const result = await catalog.info("nonexistent");
      expect(result).toBeUndefined();
    });

    it("returns undefined for known pack name whose source path does not exist", async () => {
      // No directories created, so no packs will appear
      const catalog = new PackCatalog(tmpRoot);
      const result = await catalog.info("agc");
      expect(result).toBeUndefined();
    });
  });

  describe("status()", () => {
    it("returns formatted pack list string", async () => {
      await createMockPack(tmpRoot, "src/holomorphic", ["index.ts"]);
      await createMockPack(tmpRoot, "src/agc", ["types.ts"]);

      const catalog = new PackCatalog(tmpRoot);
      const result = await catalog.status();

      expect(result).toMatch(/^2 packs available/);
      expect(result).toContain("holomorphic");
      expect(result).toContain("agc");
    });

    it("returns zero packs when no source paths exist", async () => {
      const catalog = new PackCatalog(tmpRoot);
      const result = await catalog.status();
      expect(result).toBe("0 packs available ()");
    });
  });
});

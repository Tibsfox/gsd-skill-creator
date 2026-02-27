import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { PackDescriptor, ZoneManager } from "./types.js";

const PACK_REGISTRY: Array<{ name: string; sourcePath: string; description: string }> = [
  {
    name: "holomorphic",
    sourcePath: "src/holomorphic",
    description: "Complex dynamics, Julia sets, and holomorphic function visualization",
  },
  {
    name: "electronics",
    sourcePath: "src/knowledge",
    description: "Electronics engineering with MNA circuit simulation and safety warden",
  },
  {
    name: "agc",
    sourcePath: "src/agc",
    description: "Apollo Guidance Computer architecture, instruction set, and DSKY interface",
  },
  {
    name: "aminet",
    sourcePath: "src/aminet",
    description: "Amiga software archive exploration and retrocomputing history",
  },
];

export class PackCatalog implements ZoneManager<PackDescriptor> {
  constructor(private root: string) {}

  async list(): Promise<PackDescriptor[]> {
    const results: PackDescriptor[] = [];
    for (const pack of PACK_REGISTRY) {
      const fullPath = join(this.root, pack.sourcePath);
      if (!existsSync(fullPath)) continue;

      let moduleCount = 0;
      try {
        const entries = await readdir(fullPath);
        moduleCount = entries.filter(e => e.endsWith(".ts") && !e.endsWith(".test.ts")).length;
      } catch { /* empty */ }

      results.push({
        name: pack.name,
        sourcePath: pack.sourcePath,
        description: pack.description,
        moduleCount,
      });
    }
    return results;
  }

  async info(name: string): Promise<PackDescriptor | undefined> {
    const all = await this.list();
    return all.find(p => p.name === name);
  }

  async status(): Promise<string> {
    const packs = await this.list();
    const names = packs.map(p => p.name).join(", ");
    return `${packs.length} packs available (${names})`;
  }
}

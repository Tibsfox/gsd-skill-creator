import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { ContribDescriptor, ZoneManager } from "./types.js";
import type { ScConfig } from "./config.js";

export class ContribManager implements ZoneManager<ContribDescriptor> {
  constructor(private root: string, private config: ScConfig) {}

  async list(): Promise<ContribDescriptor[]> {
    const results: ContribDescriptor[] = [];
    const contribRoot = join(this.root, "contrib");

    // Upstream directories
    const upstreamDir = join(contribRoot, "upstream");
    if (existsSync(upstreamDir)) {
      const entries = await readdir(upstreamDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          results.push({
            name: entry.name,
            direction: "upstream",
            path: join(upstreamDir, entry.name),
            status: "active",
          });
        }
      }
    }

    // Config upstream forks
    for (const [name, path] of Object.entries(this.config.upstream_forks)) {
      if (!results.some(r => r.name === name)) {
        results.push({
          name,
          direction: "upstream",
          path,
          status: existsSync(path) ? "active" : "archived",
        });
      }
    }

    // Downstream staging
    const stagingDir = join(contribRoot, "downstream", "staging");
    if (existsSync(stagingDir)) {
      const entries = await readdir(stagingDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          results.push({
            name: entry.name,
            direction: "downstream",
            path: join(stagingDir, entry.name),
            status: "staged",
          });
        }
      }
    }

    // Publishing
    const pubDir = join(contribRoot, "publishing");
    if (existsSync(pubDir)) {
      const entries = await readdir(pubDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "templates") {
          results.push({
            name: entry.name,
            direction: "publishing",
            path: join(pubDir, entry.name),
            status: "active",
          });
        }
      }
    }

    return results;
  }

  async status(): Promise<string> {
    const all = await this.list();
    const up = all.filter(c => c.direction === "upstream").length;
    const down = all.filter(c => c.direction === "downstream").length;
    const pub = all.filter(c => c.direction === "publishing").length;
    return `${up} upstream, ${down} downstream, ${pub} publishing`;
  }
}

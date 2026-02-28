import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { WwwDescriptor, ZoneManager } from "./types.js";
import type { ScConfig } from "./config.js";

export class WWWStager implements ZoneManager<WwwDescriptor> {
  constructor(private root: string, private config: ScConfig) {}

  private async hasContent(dir: string): Promise<boolean> {
    if (!existsSync(dir)) return false;
    const entries = await readdir(dir);
    return entries.some(e => e !== ".gitkeep");
  }

  private async countFiles(dir: string): Promise<number> {
    if (!existsSync(dir)) return 0;
    const entries = await readdir(dir);
    return entries.filter(e => e !== ".gitkeep").length;
  }

  async list(): Promise<WwwDescriptor[]> {
    const wwwRoot = join(this.root, "www");
    const siteDir = join(wwwRoot, this.config.www.build_dir);
    const toolsDir = join(wwwRoot, this.config.www.tools_dir);
    const stagingDir = join(wwwRoot, "staging");

    return [{
      hasSite: await this.hasContent(siteDir),
      hasTools: await this.hasContent(toolsDir),
      hasStaging: await this.hasContent(stagingDir),
      toolCount: await this.countFiles(toolsDir),
    }];
  }

  async status(): Promise<string> {
    const [desc] = await this.list();
    return `www: site=${desc.hasSite ? "built" : "no"}, tools=${desc.toolCount}, staging=${desc.hasStaging ? "yes" : "no"}`;
  }
}

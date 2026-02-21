/**
 * Knowledge Pack detail view with tabbed content, progress actions,
 * and interactive prerequisite mini-graph.
 *
 * Renders a full detail view for a single pack when selected from the
 * browser listing. Follows AminetPanel class pattern: DOM construction,
 * CSS injection, event cleanup, destroy.
 *
 * @module knowledge/pack-detail
 */

import type {
  PackDetailView,
  DetailTab,
  ProgressState,
} from "./types";

/** Options for constructing a PackDetail view */
export interface PackDetailOptions {
  container: HTMLElement;
  onBack?: () => void;
  onPackNavigate?: (packId: string) => void;
  onProgressChange?: (packId: string, action: "start" | "complete" | "reset") => void;
  onFavoriteToggle?: (packId: string) => void;
  onStartActivity?: (packId: string) => void;
}

/** All five detail tabs */
const ALL_TABS: readonly DetailTab[] = ["vision", "modules", "activities", "assessment", "resources"] as const;

/** Tab display labels */
const TAB_LABELS: Record<DetailTab, string> = {
  vision: "Vision",
  modules: "Modules",
  activities: "Activities",
  assessment: "Assessment",
  resources: "Resources",
};

/** CSS for the detail panel (injected once) */
const DETAIL_CSS = `
.knowledge-detail { display: flex; flex-direction: column; height: 100%; overflow: hidden; font-family: system-ui, sans-serif; background: var(--kp-bg, #1a1a2e); color: var(--kp-fg, #e0e0e0); }
.knowledge-detail__header { padding: 12px 16px; border-bottom: 1px solid var(--kp-border, #333); }
.knowledge-detail__back { cursor: pointer; background: none; border: none; color: var(--kp-accent, #e94560); font-size: 13px; padding: 4px 0; margin-bottom: 8px; }
.knowledge-detail__back:hover { text-decoration: underline; }
.knowledge-detail__title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
.knowledge-detail__meta { font-size: 12px; color: var(--kp-muted, #888); display: flex; gap: 12px; flex-wrap: wrap; }
.knowledge-detail__actions { padding: 8px 16px; border-bottom: 1px solid var(--kp-border, #333); display: flex; gap: 8px; flex-wrap: wrap; }
.knowledge-detail__action-btn { padding: 6px 14px; border-radius: 4px; border: 1px solid var(--kp-border, #333); background: var(--kp-input-bg, #16213e); color: var(--kp-fg, #e0e0e0); cursor: pointer; font-size: 12px; }
.knowledge-detail__action-btn:hover { border-color: var(--kp-accent, #e94560); }
.knowledge-detail__action-btn--primary { background: var(--kp-accent, #e94560); border-color: var(--kp-accent, #e94560); color: #fff; }
.knowledge-detail__tabs { display: flex; border-bottom: 1px solid var(--kp-border, #333); padding: 0 16px; }
.knowledge-detail__tab { padding: 8px 16px; cursor: pointer; font-size: 13px; border-bottom: 2px solid transparent; color: var(--kp-muted, #888); }
.knowledge-detail__tab:hover { color: var(--kp-fg, #e0e0e0); }
.knowledge-detail__tab--active { color: var(--kp-accent, #e94560); border-bottom-color: var(--kp-accent, #e94560); }
.knowledge-detail__content { flex: 1; overflow-y: auto; padding: 16px; }
.knowledge-detail__prereq-graph { padding: 12px 16px; border-top: 1px solid var(--kp-border, #333); display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap; }
.knowledge-detail__prereq-chip { padding: 4px 10px; background: var(--kp-input-bg, #16213e); border: 1px solid var(--kp-border, #333); border-radius: 12px; font-size: 11px; cursor: pointer; color: var(--kp-fg, #e0e0e0); }
.knowledge-detail__prereq-chip:hover { border-color: var(--kp-accent, #e94560); }
.knowledge-detail__prereq-center { padding: 6px 14px; background: var(--kp-accent, #e94560); color: #fff; border-radius: 12px; font-size: 12px; font-weight: bold; }
.knowledge-detail__prereq-arrow { color: var(--kp-muted, #666); font-size: 16px; }
.knowledge-detail__prereq-empty { color: var(--kp-muted, #666); font-size: 11px; font-style: italic; }
.knowledge-detail__module-item { padding: 10px 0; border-bottom: 1px solid var(--kp-border, #222); }
.knowledge-detail__module-name { font-weight: bold; font-size: 14px; }
.knowledge-detail__module-desc { font-size: 12px; color: var(--kp-muted, #888); margin-top: 4px; }
.knowledge-detail__module-badges { font-size: 11px; color: var(--kp-muted, #666); margin-top: 4px; }
.knowledge-detail__activity-row { padding: 8px 0; border-bottom: 1px solid var(--kp-border, #222); font-size: 13px; }
.knowledge-detail__activity-name { font-weight: bold; }
.knowledge-detail__activity-meta { font-size: 11px; color: var(--kp-muted, #888); margin-top: 2px; }
.knowledge-detail__tag { display: inline-block; padding: 2px 8px; background: var(--kp-input-bg, #16213e); border-radius: 10px; font-size: 11px; margin: 2px; }
.knowledge-detail__vision-text { white-space: pre-wrap; line-height: 1.6; }
.knowledge-detail__tags { margin-top: 12px; }
`;

/**
 * Pack detail view with tabbed content, progress actions, and
 * interactive prerequisite mini-graph.
 */
export class PackDetail {
  private readonly root: HTMLElement;
  private readonly opts: PackDetailOptions;
  private readonly cleanupFns: Array<() => void> = [];
  private destroyed = false;
  private detail: PackDetailView | null = null;
  private activeTab: DetailTab = "vision";
  private contentArea: HTMLElement | null = null;
  private actionsBar: HTMLElement | null = null;

  constructor(options: PackDetailOptions) {
    this.opts = options;

    // Create root element
    this.root = document.createElement("div");
    this.root.className = "knowledge-detail";

    // Inject CSS
    const style = document.createElement("style");
    style.textContent = DETAIL_CSS;
    this.root.appendChild(style);

    // Mount to container
    this.opts.container.appendChild(this.root);
  }

  /** Render the full detail view for a pack */
  setPackDetail(detail: PackDetailView): void {
    this.detail = detail;
    this.activeTab = "vision";

    // Clear previous content (keep style element)
    const style = this.root.querySelector("style");
    this.removeAllListeners();
    this.root.innerHTML = "";
    if (style) this.root.appendChild(style);

    // Header
    this.root.appendChild(this.renderHeader(detail));

    // Action bar
    this.actionsBar = this.renderActions(detail);
    this.root.appendChild(this.actionsBar);

    // Tab bar
    this.root.appendChild(this.renderTabBar());

    // Content area
    this.contentArea = document.createElement("div");
    this.contentArea.className = "knowledge-detail__content";
    this.root.appendChild(this.contentArea);
    this.renderTabContent();

    // Prerequisite mini-graph
    this.root.appendChild(this.renderPrereqGraph(detail));
  }

  /** Switch the active tab and re-render content area */
  setActiveTab(tab: DetailTab): void {
    this.activeTab = tab;

    // Update tab bar active state
    const tabs = this.root.querySelectorAll(".knowledge-detail__tab");
    tabs.forEach((el) => {
      const tabEl = el as HTMLElement;
      const tabName = tabEl.dataset.tab as DetailTab;
      if (tabName === tab) {
        tabEl.classList.add("knowledge-detail__tab--active");
      } else {
        tabEl.classList.remove("knowledge-detail__tab--active");
      }
    });

    // Re-render content
    this.renderTabContent();
  }

  /** Update action buttons without full re-render */
  updateProgress(progress: ProgressState): void {
    if (!this.detail || !this.actionsBar) return;
    this.detail = { ...this.detail, progress };

    // Clear and re-render action bar in place
    const parent = this.actionsBar.parentElement;
    const nextSibling = this.actionsBar.nextSibling;
    this.actionsBar.remove();
    this.actionsBar = this.renderActions(this.detail);
    if (parent) {
      if (nextSibling) {
        parent.insertBefore(this.actionsBar, nextSibling);
      } else {
        parent.appendChild(this.actionsBar);
      }
    }
  }

  /** Remove all DOM elements and clean up event listeners */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    this.removeAllListeners();
    this.root.remove();
  }

  // --------------------------------------------------------------------------
  // Private: Section renderers
  // --------------------------------------------------------------------------

  private renderHeader(detail: PackDetailView): HTMLElement {
    const header = document.createElement("div");
    header.className = "knowledge-detail__header";

    // Back button
    const backBtn = document.createElement("button");
    backBtn.className = "knowledge-detail__back";
    backBtn.textContent = "\u2190 Back to packs";
    const backHandler = (): void => { this.opts.onBack?.(); };
    backBtn.addEventListener("click", backHandler);
    this.cleanupFns.push(() => backBtn.removeEventListener("click", backHandler));
    header.appendChild(backBtn);

    // Title with icon
    const title = document.createElement("div");
    title.className = "knowledge-detail__title";
    title.textContent = `${detail.icon} ${detail.packName}`;
    header.appendChild(title);

    // Meta row
    const meta = document.createElement("div");
    meta.className = "knowledge-detail__meta";
    meta.innerHTML = [
      `<span>${detail.classification}</span>`,
      `<span>v${detail.version}</span>`,
      `<span>${detail.gradeRange}</span>`,
      `<span>${detail.status}</span>`,
    ].join("");
    header.appendChild(meta);

    return header;
  }

  private renderActions(detail: PackDetailView): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "knowledge-detail__actions";

    // Progress action button
    const progressBtn = document.createElement("button");
    progressBtn.className = "knowledge-detail__action-btn knowledge-detail__action-btn--primary";

    let progressAction: "start" | "complete" | "reset";
    switch (detail.progress) {
      case "not-started":
        progressBtn.textContent = "Start Pack";
        progressAction = "start";
        break;
      case "in-progress":
        progressBtn.textContent = "Complete Pack";
        progressAction = "complete";
        break;
      case "completed":
        progressBtn.textContent = "Reset";
        progressAction = "reset";
        break;
    }
    const progressHandler = (): void => {
      this.opts.onProgressChange?.(detail.packId, progressAction);
    };
    progressBtn.addEventListener("click", progressHandler);
    this.cleanupFns.push(() => progressBtn.removeEventListener("click", progressHandler));
    bar.appendChild(progressBtn);

    // Favorite toggle
    const favBtn = document.createElement("button");
    favBtn.className = "knowledge-detail__action-btn";
    favBtn.textContent = "\u2605 Favorite";
    const favHandler = (): void => { this.opts.onFavoriteToggle?.(detail.packId); };
    favBtn.addEventListener("click", favHandler);
    this.cleanupFns.push(() => favBtn.removeEventListener("click", favHandler));
    bar.appendChild(favBtn);

    // Start Activity button
    const activityBtn = document.createElement("button");
    activityBtn.className = "knowledge-detail__action-btn";
    activityBtn.textContent = "Start Activity";
    const activityHandler = (): void => { this.opts.onStartActivity?.(detail.packId); };
    activityBtn.addEventListener("click", activityHandler);
    this.cleanupFns.push(() => activityBtn.removeEventListener("click", activityHandler));
    bar.appendChild(activityBtn);

    return bar;
  }

  private renderTabBar(): HTMLElement {
    const bar = document.createElement("div");
    bar.className = "knowledge-detail__tabs";

    for (const tab of ALL_TABS) {
      const el = document.createElement("div");
      el.className = "knowledge-detail__tab";
      if (tab === this.activeTab) {
        el.classList.add("knowledge-detail__tab--active");
      }
      el.dataset.tab = tab;
      el.textContent = TAB_LABELS[tab];

      const handler = (): void => { this.setActiveTab(tab); };
      el.addEventListener("click", handler);
      this.cleanupFns.push(() => el.removeEventListener("click", handler));

      bar.appendChild(el);
    }

    return bar;
  }

  private renderTabContent(): void {
    if (!this.contentArea || !this.detail) return;
    this.contentArea.innerHTML = "";

    switch (this.activeTab) {
      case "vision":
        this.renderVisionTab(this.contentArea, this.detail);
        break;
      case "modules":
        this.renderModulesTab(this.contentArea, this.detail);
        break;
      case "activities":
        this.renderActivitiesTab(this.contentArea, this.detail);
        break;
      case "assessment":
        this.renderAssessmentTab(this.contentArea, this.detail);
        break;
      case "resources":
        this.renderResourcesTab(this.contentArea, this.detail);
        break;
    }
  }

  private renderVisionTab(container: HTMLElement, detail: PackDetailView): void {
    const text = document.createElement("div");
    text.className = "knowledge-detail__vision-text";
    text.textContent = detail.visionSummary;
    container.appendChild(text);

    if (detail.tags.length > 0) {
      const tagsContainer = document.createElement("div");
      tagsContainer.className = "knowledge-detail__tags";
      for (const tag of detail.tags) {
        const pill = document.createElement("span");
        pill.className = "knowledge-detail__tag";
        pill.textContent = tag;
        tagsContainer.appendChild(pill);
      }
      container.appendChild(tagsContainer);
    }
  }

  private renderModulesTab(container: HTMLElement, detail: PackDetailView): void {
    for (const mod of detail.modules) {
      const item = document.createElement("div");
      item.className = "knowledge-detail__module-item";

      const name = document.createElement("div");
      name.className = "knowledge-detail__module-name";
      name.textContent = `${mod.id}: ${mod.name}`;
      item.appendChild(name);

      const desc = document.createElement("div");
      desc.className = "knowledge-detail__module-desc";
      desc.textContent = mod.description;
      item.appendChild(desc);

      const badges = document.createElement("div");
      badges.className = "knowledge-detail__module-badges";
      badges.textContent = `${mod.topicCount} topics \u00B7 ${mod.activityCount} activities`;
      item.appendChild(badges);

      container.appendChild(item);
    }
  }

  private renderActivitiesTab(container: HTMLElement, detail: PackDetailView): void {
    for (const activity of detail.activities) {
      const row = document.createElement("div");
      row.className = "knowledge-detail__activity-row";

      const name = document.createElement("div");
      name.className = "knowledge-detail__activity-name";
      name.textContent = activity.name;
      row.appendChild(name);

      const meta = document.createElement("div");
      meta.className = "knowledge-detail__activity-meta";
      meta.textContent = `Module: ${activity.moduleId} \u00B7 ${activity.durationMinutes} min \u00B7 ${activity.gradeRange}`;
      row.appendChild(meta);

      const desc = document.createElement("div");
      desc.className = "knowledge-detail__module-desc";
      desc.textContent = activity.description;
      row.appendChild(desc);

      container.appendChild(row);
    }
  }

  private renderAssessmentTab(container: HTMLElement, detail: PackDetailView): void {
    const text = document.createElement("div");
    text.className = "knowledge-detail__vision-text";
    text.textContent = detail.assessmentSummary;
    container.appendChild(text);
  }

  private renderResourcesTab(container: HTMLElement, detail: PackDetailView): void {
    const text = document.createElement("div");
    text.className = "knowledge-detail__vision-text";
    text.textContent = detail.resourcesSummary;
    container.appendChild(text);
  }

  private renderPrereqGraph(detail: PackDetailView): HTMLElement {
    const graph = document.createElement("div");
    graph.className = "knowledge-detail__prereq-graph";

    // Prerequisites column
    if (detail.prerequisites.length === 0) {
      const empty = document.createElement("span");
      empty.className = "knowledge-detail__prereq-empty";
      empty.textContent = "No prerequisites";
      graph.appendChild(empty);
    } else {
      for (const prereqId of detail.prerequisites) {
        const chip = document.createElement("button");
        chip.className = "knowledge-detail__prereq-chip";
        chip.textContent = prereqId;
        const handler = (): void => { this.opts.onPackNavigate?.(prereqId); };
        chip.addEventListener("click", handler);
        this.cleanupFns.push(() => chip.removeEventListener("click", handler));
        graph.appendChild(chip);
      }
    }

    // Arrow to center
    const arrowIn = document.createElement("span");
    arrowIn.className = "knowledge-detail__prereq-arrow";
    arrowIn.textContent = "\u2192";
    graph.appendChild(arrowIn);

    // Center: this pack
    const center = document.createElement("span");
    center.className = "knowledge-detail__prereq-center";
    center.textContent = `${detail.icon} ${detail.packId}`;
    graph.appendChild(center);

    // Arrow from center
    const arrowOut = document.createElement("span");
    arrowOut.className = "knowledge-detail__prereq-arrow";
    arrowOut.textContent = "\u2192";
    graph.appendChild(arrowOut);

    // Dependents column
    if (detail.dependents.length === 0) {
      const empty = document.createElement("span");
      empty.className = "knowledge-detail__prereq-empty";
      empty.textContent = "No dependent packs";
      graph.appendChild(empty);
    } else {
      for (const depId of detail.dependents) {
        const chip = document.createElement("button");
        chip.className = "knowledge-detail__prereq-chip";
        chip.textContent = depId;
        const handler = (): void => { this.opts.onPackNavigate?.(depId); };
        chip.addEventListener("click", handler);
        this.cleanupFns.push(() => chip.removeEventListener("click", handler));
        graph.appendChild(chip);
      }
    }

    return graph;
  }

  // --------------------------------------------------------------------------
  // Private: Cleanup helpers
  // --------------------------------------------------------------------------

  private removeAllListeners(): void {
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns.length = 0;
  }
}

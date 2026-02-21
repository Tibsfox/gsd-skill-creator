import { describe, it, expect } from "vitest";
import {
  getStatusColor,
  getStatusLabel,
  renderStatusBadge,
  type DisplayStatus,
} from "./status-indicators";

// ---------------------------------------------------------------------------
// getStatusColor
// ---------------------------------------------------------------------------

describe("getStatusColor", () => {
  it("returns green for 'clean'", () => {
    expect(getStatusColor("clean")).toBe("#3fb950");
  });

  it("returns yellow/amber for 'suspicious'", () => {
    expect(getStatusColor("suspicious")).toBe("#d29922");
  });

  it("returns red for 'infected'", () => {
    expect(getStatusColor("infected")).toBe("#f85149");
  });

  it("returns gray for 'not-mirrored'", () => {
    expect(getStatusColor("not-mirrored")).toBe("#484f58");
  });

  it("returns gray for 'unscanned' (same as not-mirrored)", () => {
    expect(getStatusColor("unscanned")).toBe("#484f58");
  });

  it("returns blue for 'mirrored'", () => {
    expect(getStatusColor("mirrored")).toBe("#58a6ff");
  });

  it("returns green for 'installed' (same as clean)", () => {
    expect(getStatusColor("installed")).toBe("#3fb950");
  });

  it("returns blue for 'downloading'", () => {
    expect(getStatusColor("downloading")).toBe("#58a6ff");
  });

  it("returns yellow for 'scan-pending'", () => {
    expect(getStatusColor("scan-pending")).toBe("#d29922");
  });
});

// ---------------------------------------------------------------------------
// getStatusLabel
// ---------------------------------------------------------------------------

describe("getStatusLabel", () => {
  it("returns 'Clean' for 'clean'", () => {
    expect(getStatusLabel("clean")).toBe("Clean");
  });

  it("returns 'Suspicious' for 'suspicious'", () => {
    expect(getStatusLabel("suspicious")).toBe("Suspicious");
  });

  it("returns 'Infected' for 'infected'", () => {
    expect(getStatusLabel("infected")).toBe("Infected");
  });

  it("returns 'Not Mirrored' for 'not-mirrored'", () => {
    expect(getStatusLabel("not-mirrored")).toBe("Not Mirrored");
  });

  it("returns 'Unscanned' for 'unscanned'", () => {
    expect(getStatusLabel("unscanned")).toBe("Unscanned");
  });

  it("returns 'Installed' for 'installed'", () => {
    expect(getStatusLabel("installed")).toBe("Installed");
  });

  it("returns 'Mirrored' for 'mirrored'", () => {
    expect(getStatusLabel("mirrored")).toBe("Mirrored");
  });

  it("returns 'Downloading' for 'downloading'", () => {
    expect(getStatusLabel("downloading")).toBe("Downloading");
  });

  it("returns 'Scan Pending' for 'scan-pending'", () => {
    expect(getStatusLabel("scan-pending")).toBe("Scan Pending");
  });
});

// ---------------------------------------------------------------------------
// renderStatusBadge
// ---------------------------------------------------------------------------

describe("renderStatusBadge", () => {
  it("returns an HTML string containing a span element", () => {
    const html = renderStatusBadge("clean");
    expect(html).toContain("<span");
    expect(html).toContain("</span>");
  });

  it("span has inline style with background-color matching getStatusColor", () => {
    const html = renderStatusBadge("clean");
    expect(html).toContain("background-color:#3fb950");
  });

  it("span contains the status label text", () => {
    const html = renderStatusBadge("suspicious");
    expect(html).toContain("Suspicious");
  });

  it('has class "aminet-status-badge"', () => {
    const html = renderStatusBadge("infected");
    expect(html).toContain('class="aminet-status-badge"');
  });

  it("'clean' badge has green background and 'Clean' text", () => {
    const html = renderStatusBadge("clean");
    expect(html).toContain("background-color:#3fb950");
    expect(html).toContain("Clean");
  });

  it("'infected' badge has red background and 'Infected' text", () => {
    const html = renderStatusBadge("infected");
    expect(html).toContain("background-color:#f85149");
    expect(html).toContain("Infected");
  });
});

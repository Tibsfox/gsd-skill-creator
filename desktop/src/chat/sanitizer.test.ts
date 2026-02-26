import { describe, it, expect } from "vitest";
import { sanitizeInput, escapeHtml } from "./sanitizer";

describe("sanitizeInput", () => {
  it("passes through plain text unchanged", () => {
    expect(sanitizeInput("hello world")).toBe("hello world");
  });

  it("strips script tags completely", () => {
    expect(sanitizeInput("<script>alert(1)</script>hello")).toBe(
      "alert(1)hello",
    );
  });

  it("handles nested HTML", () => {
    expect(sanitizeInput("<div><b>bold</b></div>")).toBe("bold");
  });

  it("preserves newlines", () => {
    expect(sanitizeInput("line1\nline2")).toBe("line1\nline2");
  });

  it("handles null gracefully", () => {
    expect(sanitizeInput(null as unknown)).toBe("");
  });

  it("handles undefined gracefully", () => {
    expect(sanitizeInput(undefined as unknown)).toBe("");
  });
});

describe("escapeHtml", () => {
  it("escapes HTML angle brackets", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("escapes ampersand", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('"quoted"')).toBe("&quot;quoted&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toContain("&#x27;");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

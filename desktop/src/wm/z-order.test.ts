import { describe, it, expect } from "vitest";
import {
  createZStack,
  bringToFront,
  sendToBack,
  depthCycle,
  removeFromStack,
  insertAtFront,
  getZIndex,
  getFront,
} from "./z-order";

describe("createZStack", () => {
  it("returns empty array", () => {
    const stack = createZStack();
    expect(stack).toEqual([]);
    expect(stack.length).toBe(0);
  });
});

describe("insertAtFront", () => {
  it("adds to empty stack", () => {
    const stack = insertAtFront([], "win-1");
    expect(stack).toEqual(["win-1"]);
  });

  it("adds to front of existing stack", () => {
    const stack = insertAtFront(["win-1"], "win-2");
    expect(stack).toEqual(["win-1", "win-2"]);
  });
});

describe("bringToFront", () => {
  it("moves window to end", () => {
    const result = bringToFront(["a", "b", "c"], "a");
    expect(result).toEqual(["b", "c", "a"]);
  });

  it("is no-op on already-front window", () => {
    const stack = ["a", "b"] as const;
    const result = bringToFront(stack, "b");
    expect(result).toEqual(["a", "b"]);
  });

  it("returns same stack for unknown id", () => {
    const stack = ["a"] as const;
    const result = bringToFront(stack, "x");
    expect(result).toBe(stack);
  });
});

describe("sendToBack", () => {
  it("moves window to start", () => {
    const result = sendToBack(["a", "b", "c"], "c");
    expect(result).toEqual(["c", "a", "b"]);
  });

  it("is no-op on already-back window", () => {
    const stack = ["a", "b"] as const;
    const result = sendToBack(stack, "a");
    expect(result).toEqual(["a", "b"]);
  });
});

describe("depthCycle", () => {
  it("front window goes to back", () => {
    const result = depthCycle(["a", "b", "c"], "c");
    expect(result).toEqual(["c", "a", "b"]);
  });

  it("non-front window goes to front", () => {
    const result = depthCycle(["a", "b", "c"], "a");
    expect(result).toEqual(["b", "c", "a"]);
  });

  it("middle window goes to front", () => {
    const result = depthCycle(["a", "b", "c"], "b");
    expect(result).toEqual(["a", "c", "b"]);
  });
});

describe("removeFromStack", () => {
  it("removes window", () => {
    const result = removeFromStack(["a", "b", "c"], "b");
    expect(result).toEqual(["a", "c"]);
  });

  it("returns same stack for unknown id", () => {
    const stack = ["a", "b"] as const;
    const result = removeFromStack(stack, "x");
    expect(result).toBe(stack);
  });
});

describe("getZIndex", () => {
  it("returns position", () => {
    expect(getZIndex(["a", "b", "c"], "b")).toBe(1);
  });

  it("returns -1 for unknown", () => {
    expect(getZIndex(["a"], "x")).toBe(-1);
  });
});

describe("getFront", () => {
  it("returns last element", () => {
    expect(getFront(["a", "b", "c"])).toBe("c");
  });

  it("returns null for empty stack", () => {
    expect(getFront([])).toBeNull();
  });
});

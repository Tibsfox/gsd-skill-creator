import { describe, it, expect } from "vitest";
import { CommandHistory } from "./history";

describe("CommandHistory", () => {
  it("starts with empty history", () => {
    const history = new CommandHistory();
    expect(history.previous()).toBeUndefined();
  });

  it("adds and recalls single entry", () => {
    const history = new CommandHistory();
    history.add("hello");
    expect(history.previous()).toBe("hello");
  });

  it("recalls entries in reverse order", () => {
    const history = new CommandHistory();
    history.add("first");
    history.add("second");

    expect(history.previous()).toBe("second");
    expect(history.previous()).toBe("first");
  });

  it("next() moves forward through history", () => {
    const history = new CommandHistory();
    history.add("first");
    history.add("second");

    history.previous(); // "second"
    history.previous(); // "first"
    expect(history.next()).toBe("second");
  });

  it("next() past the end returns undefined", () => {
    const history = new CommandHistory();
    history.add("a");

    history.previous(); // "a"
    expect(history.next()).toBeUndefined();
    expect(history.next()).toBeUndefined();
  });

  it("resets cursor position on new add", () => {
    const history = new CommandHistory();
    history.add("a");
    history.previous(); // start browsing
    history.add("b");

    expect(history.previous()).toBe("b");
  });

  it("limits history to maxSize entries", () => {
    const history = new CommandHistory({ maxSize: 3 });
    history.add("1");
    history.add("2");
    history.add("3");
    history.add("4");
    history.add("5");

    expect(history.length).toBe(3);
    // Oldest entries dropped; most recent 3 remain: "3", "4", "5"
    expect(history.previous()).toBe("5");
    expect(history.previous()).toBe("4");
    expect(history.previous()).toBe("3");
  });

  it("does not add empty strings", () => {
    const history = new CommandHistory();
    history.add("");
    expect(history.previous()).toBeUndefined();
  });

  it("does not add duplicate of most recent", () => {
    const history = new CommandHistory();
    history.add("x");
    history.add("x");

    expect(history.length).toBe(1);
    expect(history.previous()).toBe("x");
    // Second previous stays at same entry (only one exists)
    expect(history.previous()).toBe("x");
  });

  it("toJSON returns serializable array", () => {
    const history = new CommandHistory();
    history.add("a");
    history.add("b");

    expect(history.toJSON()).toEqual(["a", "b"]);
  });

  it("fromJSON restores history", () => {
    const history = CommandHistory.fromJSON(["a", "b"]);
    expect(history.previous()).toBe("b");
    expect(history.previous()).toBe("a");
  });
});

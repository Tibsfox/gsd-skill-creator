import { describe, it, expect, vi, beforeEach } from "vitest";
import { StreamingText } from "./StreamingText";

describe("StreamingText", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders empty container initially", () => {
    const st = new StreamingText({ container });
    st.mount();

    expect(container.textContent).toBe("");
  });

  it("appends delta text progressively", () => {
    const st = new StreamingText({ container });
    st.mount();

    st.appendDelta("Hel");
    st.appendDelta("lo");

    expect(st.getText()).toBe("Hello");
    expect(container.textContent).toContain("Hello");
  });

  it("calls onDelta callback for each delta", () => {
    const onDelta = vi.fn();
    const st = new StreamingText({ container, onDelta });
    st.mount();

    st.appendDelta("H");
    st.appendDelta("i");

    expect(onDelta).toHaveBeenCalledTimes(2);
    expect(onDelta).toHaveBeenCalledWith("H");
    expect(onDelta).toHaveBeenCalledWith("i");
  });

  it("calls onComplete with full text on finalize", () => {
    const onComplete = vi.fn();
    const st = new StreamingText({ container, onComplete });
    st.mount();

    st.appendDelta("Hello");
    st.finalize();

    expect(onComplete).toHaveBeenCalledWith("Hello");
  });

  it("magic level 1 buffers text until finalize", () => {
    const st = new StreamingText({ container, magicLevel: 1 });
    st.mount();

    st.appendDelta("H");
    st.appendDelta("i");

    // Text is accumulated but not displayed at level 1
    expect(st.getText()).toBe("Hi");
    expect(container.textContent).toBe("");

    st.finalize();
    expect(container.textContent).toBe("Hi");
  });

  it("magic level 4-5 shows each delta immediately", () => {
    const st = new StreamingText({ container, magicLevel: 5 });
    st.mount();

    st.appendDelta("H");
    expect(container.textContent).toBe("H");

    st.appendDelta("i");
    expect(container.textContent).toBe("Hi");
  });

  it("reset clears accumulated text", () => {
    const st = new StreamingText({ container });
    st.mount();

    st.appendDelta("test");
    expect(st.getText()).toBe("test");

    st.reset();
    expect(st.getText()).toBe("");
    expect(container.textContent).toBe("");
  });
});

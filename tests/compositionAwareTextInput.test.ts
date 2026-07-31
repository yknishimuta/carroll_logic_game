// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { bindCompositionAwareTextInput } from "../src/app/compositionAwareTextInput";

describe("composition-aware text input", () => {
  it("commits ordinary changes immediately and ignores duplicate values", () => {
    const input = document.createElement("input");
    const commit = vi.fn();
    bindCompositionAwareTextInput(input, commit);
    input.value = "Saved Barbara";
    input.dispatchEvent(new InputEvent("input"));
    input.dispatchEvent(new InputEvent("input"));
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith("Saved Barbara");
  });

  it("commits only the completed composition and suppresses its duplicate input", () => {
    const input = document.createElement("input");
    input.dataset.test = "unchanged";
    const commit = vi.fn();
    bindCompositionAwareTextInput(input, commit);
    input.dispatchEvent(new CompositionEvent("compositionstart"));
    for (const value of ["t", "た", "たn", "たな"]) {
      input.value = value;
      input.dispatchEvent(new InputEvent("input", { isComposing: true }));
    }
    expect(commit).not.toHaveBeenCalled();
    input.value = "田中の問題";
    input.dispatchEvent(new CompositionEvent("compositionend"));
    input.dispatchEvent(new InputEvent("input"));
    expect(commit).toHaveBeenCalledOnce();
    expect(commit).toHaveBeenCalledWith("田中の問題");
    expect(input.dataset.test).toBe("unchanged");
    input.value = "田中の問題2";
    input.dispatchEvent(new InputEvent("input"));
    expect(commit).toHaveBeenCalledTimes(2);
  });

  it("keeps composition state independent and can commit an empty value", () => {
    const first = document.createElement("input");
    const second = document.createElement("input");
    first.value = "既存";
    const firstCommit = vi.fn();
    const secondCommit = vi.fn();
    bindCompositionAwareTextInput(first, firstCommit);
    bindCompositionAwareTextInput(second, secondCommit);
    first.dispatchEvent(new CompositionEvent("compositionstart"));
    first.value = "";
    first.dispatchEvent(new InputEvent("input", { isComposing: true }));
    second.value = "abc";
    second.dispatchEvent(new InputEvent("input"));
    expect(secondCommit).toHaveBeenCalledWith("abc");
    expect(firstCommit).not.toHaveBeenCalled();
    first.dispatchEvent(new CompositionEvent("compositionend"));
    expect(firstCommit).toHaveBeenCalledWith("");
  });
});

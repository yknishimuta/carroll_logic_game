// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureFocus,
  focusPhaseHeading,
  getActiveFocusKey,
  restoreFocus,
  restoreFocusByKey,
} from "../src/app/focusManagement";

describe("focus management", () => {
  beforeEach(() => document.body.replaceChildren());

  it("reads and restores a stable focus key after regeneration", () => {
    const oldRoot = document.createElement("div");
    const oldButton = document.createElement("button");
    oldButton.dataset.focusKey = "navigation-next";
    oldRoot.append(oldButton);
    document.body.append(oldRoot);
    oldButton.focus();
    expect(getActiveFocusKey(oldRoot)).toBe("navigation-next");

    const root = document.createElement("div");
    const button = document.createElement("button");
    button.dataset.focusKey = "navigation-next";
    root.append(button);
    document.body.replaceChildren(root);
    expect(restoreFocusByKey(root, "navigation-next")).toBe(true);
    expect(document.activeElement).toBe(button);
  });

  it("returns null without a key and false for an unknown key", () => {
    const root = document.createElement("div");
    const button = document.createElement("button");
    root.append(button);
    document.body.append(root);
    button.focus();
    expect(getActiveFocusKey(root)).toBeNull();
    expect(restoreFocusByKey(root, "missing")).toBe(false);
    expect(button.dataset.focusKey).toBeUndefined();
  });

  it("rejects duplicate keys without modifying the DOM", () => {
    const root = document.createElement("div");
    for (let index = 0; index < 2; index += 1) {
      const button = document.createElement("button");
      button.dataset.focusKey = "duplicate";
      button.textContent = String(index);
      root.append(button);
    }
    expect(() => restoreFocusByKey(root, "duplicate"))
      .toThrow('Duplicate focus key: "duplicate".');
    expect(root.textContent).toBe("01");
  });

  it("restores text input focus and caret selection", () => {
    const root = document.createElement("div");
    const input = document.createElement("input");
    input.type = "text";
    input.value = "philosophers";
    input.dataset.focusKey = "custom-term-input:enSubjectPlural";
    root.append(input);
    document.body.append(root);
    input.focus();
    input.setSelectionRange(2, 7);
    const snapshot = captureFocus(root)!;
    const replacement = input.cloneNode(true) as HTMLInputElement;
    root.replaceChildren(replacement);
    expect(restoreFocus(root, snapshot)).toBe(true);
    expect(document.activeElement).toBe(replacement);
    expect([replacement.selectionStart, replacement.selectionEnd]).toEqual([2, 7]);
  });

  it("moves focus without scrolling the page", () => {
    const root = document.createElement("div");
    const heading = document.createElement("h2");
    heading.tabIndex = -1;
    heading.dataset.phaseHeading = "combined-premises";
    root.append(heading);
    document.body.append(root);
    const focus = vi.spyOn(heading, "focus");

    expect(focusPhaseHeading(root)).toBe(true);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});

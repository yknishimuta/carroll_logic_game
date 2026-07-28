// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { mountTutorial } from "../src/tutorial";

describe("mountTutorial", () => {
  it("switches both languages, preserves diagrams, and restores locale focus", () => {
    const root = document.createElement("div");
    root.id = "tutorial-app";
    document.body.replaceChildren(root);
    mountTutorial(root);
    expect(document.documentElement.lang).toBe("ja");
    expect(root.querySelectorAll("main section")).toHaveLength(12);
    const jaCounterCount = root.querySelectorAll(".carroll-diagram__counter").length;
    let select = root.querySelector<HTMLSelectElement>('[data-action="tutorial-locale"]')!;
    select.focus();
    select.value = "en";
    select.dispatchEvent(new Event("change"));
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toContain("Counter Placement Tutorial");
    expect(root.querySelector("h1")?.textContent).toBe("Counter Placement Tutorial");
    expect(root.querySelector("#source-references-heading")?.textContent)
      .toBe("Source References");
    expect(root.textContent).toContain("(Application behavior)");
    expect(root.textContent).not.toContain("（本アプリの操作仕様）");
    expect(root.querySelectorAll(".carroll-diagram__counter")).toHaveLength(jaCounterCount);
    expect(document.activeElement).toBe(
      root.querySelector('[data-action="tutorial-locale"]'),
    );
    select = root.querySelector<HTMLSelectElement>('[data-action="tutorial-locale"]')!;
    select.value = "ja";
    select.dispatchEvent(new Event("change"));
    expect(root.textContent).not.toContain("Back to the game");
    for (const link of root.querySelectorAll<HTMLAnchorElement>("nav a")) {
      expect(root.querySelector(link.hash)).not.toBeNull();
    }
  });
});

// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { renderTutorial } from "../src/tutorial/domRenderer";
import { createTutorialViewModel } from "../src/tutorial/model";

describe("tutorial renderer", () => {
  it("renders semantic, accessible Japanese tutorial markup", () => {
    const root = document.createElement("div");
    renderTutorial(root, createTutorialViewModel("ja"), { onLocaleChange: vi.fn() });
    expect(root.querySelectorAll("h1")).toHaveLength(1);
    expect(root.querySelector(".skip-link")?.getAttribute("href")).toBe("#tutorial-main");
    expect(root.querySelector("main#tutorial-main")).not.toBeNull();
    expect(root.querySelector("nav")?.getAttribute("aria-label")).toBe("チュートリアルの目次");
    expect(root.querySelectorAll("main section")).toHaveLength(12);
    expect(root.querySelectorAll("svg")).toHaveLength(7);
    expect([...root.querySelectorAll("svg")].every((svg) => svg.getAttribute("role") === "img")).toBe(true);
    expect(root.querySelectorAll("table caption")).toHaveLength(5);
    expect(root.querySelectorAll("th:not([scope])")).toHaveLength(0);
    expect(root.querySelector('[href="./index.html"]')?.textContent).toBe("ゲームへ戻る");
    expect(root.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toHaveLength(0);
    const ids = [...root.querySelectorAll("[id]")].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(root.querySelector("#source-references-heading")?.textContent)
      .toBe("原著参照");
    const citationLinks = [
      ...root.querySelectorAll<HTMLAnchorElement>("a.tutorial__citation"),
    ];
    expect(citationLinks.length).toBeGreaterThan(0);
    expect(citationLinks.every((link) => {
      const href = link.getAttribute("href");
      return link.textContent?.trim() !== "" &&
        href !== null &&
        href.startsWith("#") &&
        root.querySelector(`[id="${href.slice(1)}"]`) !== null;
    })).toBe(true);
    expect(root.querySelector(".tutorial__citation--derived")?.textContent)
      .toContain("に基づく整理");
    expect(root.querySelector(".tutorial__citation--application")?.textContent)
      .toBe("（本アプリの操作仕様）");
  });

  it("validates locale values and dispatches one change", () => {
    const root = document.createElement("div");
    const onLocaleChange = vi.fn();
    renderTutorial(root, createTutorialViewModel("ja"), { onLocaleChange });
    const select = root.querySelector<HTMLSelectElement>('[data-action="tutorial-locale"]')!;
    select.value = "en";
    select.dispatchEvent(new Event("change"));
    expect(onLocaleChange).toHaveBeenCalledOnce();
    expect(onLocaleChange).toHaveBeenCalledWith("en");
  });
});

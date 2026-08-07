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
    expect(root.querySelectorAll("main section")).toHaveLength(11);
    expect(root.querySelectorAll("svg")).toHaveLength(8);
    expect([...root.querySelectorAll("svg")].every((svg) => svg.getAttribute("role") === "img")).toBe(true);
    expect(root.querySelectorAll("table caption")).toHaveLength(7);
    expect(root.querySelectorAll("#barbara table")).toHaveLength(1);
    expect(root.querySelectorAll("#biliteral-diagram table")).toHaveLength(1);
    expect(root.querySelectorAll("th:not([scope])")).toHaveLength(0);
    expect(root.querySelector('[href="./index.html"]')?.textContent).toBe("ゲームへ戻る");
    expect(root.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toHaveLength(0);
    const ids = [...root.querySelectorAll("[id]")].map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    const intro = root.querySelector(".tutorial__notice");
    expect(intro?.querySelector(".tutorial__notice-introduction strong")?.textContent)
      .toBe("このチュートリアルでは、ルイス・キャロルの論理ゲームを説明します。");
    const bibliography = intro?.querySelector(".tutorial__bibliography");
    expect(bibliography?.textContent).toBe(
      "参照文献：Lewis Carroll, Symbolic Logic, Part I: Elementary, 4th ed., Macmillan, 1897.",
    );
    expect(bibliography?.querySelector("strong")?.textContent).toBe("参照文献：");
    expect(bibliography?.querySelector("em")?.textContent)
      .toBe("Symbolic Logic, Part I: Elementary");
    expect(intro?.querySelector(".tutorial__locator-explanation")?.textContent)
      .toBe("各節末の「原著の関連箇所」は、その説明に対応する原著の箇所を示します。");
    expect(root.querySelectorAll("main > .tutorial__bibliography")).toHaveLength(0);
    expect(root.querySelector(".tutorial__locators")?.textContent)
      .toMatch(/^原著の関連箇所： \(I\./);
    expect(root.textContent).toContain("(I.III.III.2)");
    expect(root.querySelector(".tutorial__source-note")?.tagName).toBe("ASIDE");
    expect(root.querySelector(".tutorial__source-note-label")?.textContent)
      .toBe("原著の関連箇所：");
    expect(root.querySelectorAll(".tutorial__locators a")).toHaveLength(0);
    expect(root.querySelectorAll('[href^="#source-symbolic-logic-"]')).toHaveLength(0);
    expect(root.querySelectorAll('[id^="source-symbolic-logic-"]')).toHaveLength(0);
    expect(root.querySelector(".tutorial__source-references")).toBeNull();
    expect(root.querySelector(".tutorial__rule-sources")).toBeNull();
    expect(root.textContent).not.toContain("原著参照");
    expect(root.textContent).not.toContain("本アプリの操作仕様");
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

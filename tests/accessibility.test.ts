// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../src/app";

function mount(): HTMLElement {
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  mountApp(container, null, {
    readText: async () => "",
    downloadText: () => undefined,
  });
  return container;
}

function change(container: HTMLElement, action: string, value: string): void {
  const select = container.querySelector<HTMLSelectElement>(
    `[data-action="${action}"]`,
  )!;
  select.value = value;
  select.dispatchEvent(new Event("change"));
}

describe("rendered accessibility contracts", () => {
  beforeEach(() => document.body.replaceChildren());

  it("has one h1, a working localized skip link, landmarks, and progress state", () => {
    const container = mount();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const skip = container.querySelector<HTMLAnchorElement>(".skip-link")!;
    expect(skip.href.endsWith("#main-content")).toBe(true);
    expect(skip.textContent).toBe("メインコンテンツへ移動");
    const main = container.querySelector("main#main-content")!;
    expect(main.getAttribute("aria-label")).toBe("問題の内容");
    expect(container.querySelector("#settings-heading")?.textContent).toBe("設定");
    expect(container.querySelector("nav.logic-game__progress")?.getAttribute(
      "aria-label",
    )).toBe("進行状況");
    expect(container.querySelector('[aria-current="step"]')?.textContent)
      .toBe("問題");
  });

  it("labels every visible input and button and has no positive tabindex or duplicate IDs", () => {
    const container = mount();
    const controls = container.querySelectorAll("select,input");
    controls.forEach((control) => {
      expect(control.closest("label") !== null || control.hasAttribute("aria-label"))
        .toBe(true);
    });
    container.querySelectorAll("button").forEach((button) => {
      expect(button.textContent?.trim().length).toBeGreaterThan(0);
      expect(button.type).toBe("button");
    });
    expect(container.querySelector('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])'))
      .toBeNull();
    const ids = [...container.querySelectorAll<HTMLElement>("[id]")]
      .map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses fieldsets and live feedback with invalid descriptions", () => {
    const container = mount();
    change(container, "problem-source", "custom");
    expect(container.querySelectorAll(".logic-game__custom-problem fieldset"))
      .toHaveLength(2);
    expect(container.querySelectorAll(".logic-game__custom-problem legend"))
      .toHaveLength(2);
    container.querySelector<HTMLButtonElement>(
      '[data-action="create-custom-problem"]',
    )!.click();
    const feedback = container.querySelector("#custom-problem-feedback")!;
    expect(feedback.getAttribute("role")).toBe("status");
    expect(feedback.getAttribute("aria-live")).toBe("polite");
    const invalid = container.querySelector<HTMLSelectElement>(
      '.logic-game__custom-problem [aria-invalid="true"]',
    )!;
    expect(invalid.getAttribute("aria-describedby")).toBe(
      "custom-problem-feedback",
    );
  });

  it("keeps meaningful SVG names and native manual target buttons", () => {
    const container = mount();
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.getAttribute("aria-label")).toBeTruthy();
    expect(svg.hasAttribute("aria-hidden")).toBe(false);
    change(container, "counter-placement-mode", "manual");
    container.querySelector<HTMLButtonElement>('[data-action="next"]')!.click();
    const targets = container.querySelectorAll<HTMLButtonElement>(
      '[data-action="counter-target"]',
    );
    expect(targets).toHaveLength(20);
    targets.forEach((target) => {
      expect(target.tagName).toBe("BUTTON");
      expect(target.getAttribute("aria-label")).toBeTruthy();
      expect(target.dataset.focusKey).toContain("counter-target");
    });
  });
});

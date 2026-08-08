// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../src/app";
import {
  CUSTOM_TERM_STORAGE_KEY,
  type StringStorage,
} from "../src/storage/customTermStorage";
import { CUSTOM_PROBLEM_STORAGE_KEY } from "../src/storage/customProblemStorage";
import type { TextFileTransfer } from "../src/app/browserFileTransfer";
import {
  DATA_BACKUP_FILENAME,
  DATA_BACKUP_FORMAT,
  DATA_BACKUP_MIME_TYPE,
  createDataBackupJson,
} from "../src/storage/dataBackupFormat";

class MemoryStorage implements StringStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function mount(storage: StringStorage = new MemoryStorage()): HTMLElement {
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  mountApp(container, storage);
  return container;
}

function button(
  container: HTMLElement,
  action: "previous" | "next" | "reset",
): HTMLButtonElement {
  return container.querySelector<HTMLButtonElement>(
    `[data-action="${action}"]`,
  )!;
}

function select(
  container: HTMLElement,
  action:
    | "locale"
    | "problem"
    | "problem-source"
    | "counter-placement-mode"
    | "conclusion-answer-mode",
  value: string,
): void {
  const control = container.querySelector<HTMLSelectElement>(
    `[data-action="${action}"]`,
  )!;
  control.value = value;
  control.dispatchEvent(new Event("change"));
}

function answerConclusion(
  container: HTMLElement,
  answer: "A" | "E" | "I" | "O" | "none" | "",
): void {
  const control = container.querySelector<HTMLSelectElement>(
    '[data-action="conclusion-answer"]',
  )!;
  control.value = answer;
  control.dispatchEvent(new Event("change"));
}

function submitConclusion(container: HTMLElement, answer: "A" | "E" | "I" | "O" | "none"): void {
  answerConclusion(container, answer);
  container.querySelector<HTMLButtonElement>(
    '[data-action="check-conclusion-answer"]',
  )!.click();
}

function chooseCounterTool(
  container: HTMLElement,
  tool: "emptiness" | "existence" | "erase",
): void {
  container.querySelector<HTMLButtonElement>(
    `[data-action="counter-tool"][data-tool="${tool}"]`,
  )!.click();
}

function activateCounterTarget(
  container: HTMLElement,
  key: string,
): void {
  container.querySelector<HTMLButtonElement>(
    `[data-action="counter-target"][data-target-key="${key}"]`,
  )!.click();
}

function selectCustom(
  container: HTMLElement,
  action: "custom-form" | "custom-term",
  position: "major" | "minor",
  value: string,
  field?: "subjectTermId" | "predicateTermId",
): void {
  const fieldSelector = field === undefined ? "" : `[data-field="${field}"]`;
  const control = container.querySelector<HTMLSelectElement>(
    `[data-action="${action}"][data-premise-position="${position}"]${fieldSelector}`,
  )!;
  control.value = value;
  control.dispatchEvent(new Event("change"));
}

function fillCustomBarbara(container: HTMLElement): void {
  selectCustom(container, "custom-form", "major", "A");
  selectCustom(container, "custom-term", "major", "animal", "subjectTermId");
  selectCustom(container, "custom-term", "major", "mortal", "predicateTermId");
  selectCustom(container, "custom-form", "minor", "A");
  selectCustom(container, "custom-term", "minor", "human", "subjectTermId");
  selectCustom(container, "custom-term", "minor", "animal", "predicateTermId");
}

function setCustomComplement(
  container: HTMLElement,
  position: "major" | "minor",
  field: "subjectComplemented" | "predicateComplemented",
  checked: boolean,
): void {
  const control = container.querySelector<HTMLInputElement>(
    `[data-action="custom-complement"][data-premise-position="${position}"]` +
    `[data-field="${field}"]`,
  )!;
  control.checked = checked;
  control.dispatchEvent(new Event("change"));
}

function createCustom(container: HTMLElement): void {
  container.querySelector<HTMLButtonElement>(
    '[data-action="create-custom-problem"]',
  )!.click();
}

function inputCustomTerm(
  container: HTMLElement,
  field: "jaNounPhrase" | "enSubjectPlural" | "enPredicatePhrase",
  value: string,
): void {
  const input = container.querySelector<HTMLInputElement>(
    `[data-action="custom-term-input"][data-field="${field}"]`,
  )!;
  input.value = value;
  input.dispatchEvent(new Event("input"));
}

function openTermManagement(container: HTMLElement): void {
  container.querySelector<HTMLButtonElement>(
    '[data-action="open-custom-term-management"]',
  )!.click();
}

function closeTermManagement(container: HTMLElement): void {
  container.querySelector<HTMLButtonElement>(
    '[data-action="close-custom-term-management"]',
  )!.click();
}

function addPhilosopher(container: HTMLElement): void {
  openTermManagement(container);
  inputCustomTerm(container, "jaNounPhrase", "哲学者");
  inputCustomTerm(container, "enSubjectPlural", "philosophers");
  inputCustomTerm(container, "enPredicatePhrase", "philosophers");
  container.querySelector<HTMLButtonElement>(
    '[data-action="submit-custom-term"]',
  )!.click();
  closeTermManagement(container);
}

function saveCurrentProblem(
  container: HTMLElement,
  title: string,
): void {
  const input = container.querySelector<HTMLInputElement>(
    '[data-action="saved-custom-problem-title"]',
  )!;
  input.value = title;
  input.dispatchEvent(new Event("input"));
  container.querySelector<HTMLButtonElement>(
    '[data-action="save-custom-problem"]',
  )!.click();
}

function phase(container: HTMLElement): string | undefined {
  return container.querySelector("article")?.dataset.phase;
}

function advanceToConclusion(container: HTMLElement): void {
  button(container, "next").click();
  button(container, "next").click();
  button(container, "next").click();
}

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.lang = "ja";
});

  it("exports, previews, applies, and persists an imported backup", async () => {
    const storage = new MemoryStorage();
    const downloads: Array<{
      filename: string;
      content: string;
      mimeType: string;
    }> = [];
    const imported = createDataBackupJson({
      customTerms: [{
        id: "custom-term-1",
        labels: {
          ja: { nounPhrase: "哲学者" },
          en: {
            subjectPlural: "philosophers",
            predicatePhrase: "philosophers",
          },
        },
      }],
      savedCustomProblems: [{
        id: "custom-problem-1",
        title: "哲学者の問題",
        premises: {
          firstPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
          secondPremise: {
            form: "A",
            subject: { termId: "custom-term-1", complemented: true },
            predicate: { termId: "human", complemented: false },
          },
        },
      }],
    });
    const transfer: TextFileTransfer = {
      readText: async () => imported,
      downloadText: (filename, content, mimeType) => {
        downloads.push({ filename, content, mimeType });
      },
    };
    const container = document.createElement("div");
    document.body.replaceChildren(container);
    mountApp(container, storage, transfer);
    container.querySelector<HTMLButtonElement>(
      '[data-action="export-data-backup"]',
    )!.click();
    expect(downloads).toHaveLength(1);
    expect(downloads[0]?.filename).toBe(DATA_BACKUP_FILENAME);
    expect(downloads[0]?.mimeType).toBe(DATA_BACKUP_MIME_TYPE);
    expect(JSON.parse(downloads[0]!.content)).toEqual({
      format: DATA_BACKUP_FORMAT,
      version: 3,
      customTerms: [],
      savedCustomProblems: [],
    });
    const input = container.querySelector<HTMLInputElement>(
      '[data-action="import-data-backup-file"]',
    )!;
    const file = new File([imported], "import.json", {
      type: "application/json",
    });
    Object.defineProperty(input, "files", { value: { item: () => file } });
    input.dispatchEvent(new Event("change"));
    await Promise.resolve();
    await Promise.resolve();
    expect(container.textContent).toContain("import.json");
    expect(container.textContent).toContain("ユーザー登録名詞1");
    expect(container.querySelector('[data-custom-term-id]')).toBeNull();
    container.querySelector<HTMLButtonElement>(
      '[data-action="apply-data-import"]',
    )!.click();
    expect(container.textContent).toContain("データを読み込みました。");
    expect(storage.values.has(CUSTOM_TERM_STORAGE_KEY)).toBe(true);
    expect(storage.values.has(CUSTOM_PROBLEM_STORAGE_KEY)).toBe(true);
    expect(storage.values.size).toBe(2);
    select(container, "problem-source", "custom");
    expect(container.textContent).toContain("哲学者");
    expect(container.textContent).toContain("哲学者の問題");
    container.querySelector<HTMLButtonElement>(
      '[data-action="open-saved-custom-problem"]',
    )!.click();
    expect(container.querySelector<HTMLInputElement>(
      '[data-action="custom-complement"]' +
      '[data-premise-position="minor"]' +
      '[data-field="subjectComplemented"]',
    )?.checked).toBe(true);
  });

  it("rejects oversized and unreadable backup files without changing data", async () => {
    let reads = 0;
    const transfer: TextFileTransfer = {
      readText: async () => {
        reads += 1;
        throw new Error("read failed");
      },
      downloadText: () => undefined,
    };
    const container = document.createElement("div");
    mountApp(container, new MemoryStorage(), transfer);
    const choose = (file: File): void => {
      const input = container.querySelector<HTMLInputElement>(
        '[data-action="import-data-backup-file"]',
      )!;
      Object.defineProperty(input, "files", {
        configurable: true,
        value: { item: () => file },
      });
      input.dispatchEvent(new Event("change"));
    };
    const large = new File(["x"], "large.json");
    Object.defineProperty(large, "size", { value: 1_048_577 });
    choose(large);
    expect(reads).toBe(0);
    expect(container.textContent).toContain("ファイルが大きすぎます");
    choose(new File(["{}"], "broken.json"));
    await Promise.resolve();
    await Promise.resolve();
    expect(reads).toBe(1);
    expect(container.textContent).toContain("ファイルを読み込めませんでした");
  });

describe("mounted application interaction", () => {
  it("round trips through management with stable focus and game state", () => {
    const container = mount();
    button(container, "next").click();
    expect(phase(container)).toBe("first-premise");
    const manage = container.querySelector<HTMLButtonElement>(
      '[data-action="open-custom-term-management"]',
    )!;
    manage.click();
    expect(container.querySelector('[data-screen="custom-term-management"]'))
      .not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector(
      '[data-screen-heading="custom-term-management"]',
    ));
    expect(container.querySelector('[data-action="next"]')).toBeNull();
    closeTermManagement(container);
    expect(phase(container)).toBe("first-premise");
    expect(document.activeElement).toBe(container.querySelector(
      '[data-action="open-custom-term-management"]',
    ));
  });
  it("preserves phase and counters while switching language", () => {
    const container = mount();
    button(container, "next").click();
    const before = [...container.querySelectorAll("circle")].map(
      (circle) => [circle.getAttribute("cx"), circle.getAttribute("cy")],
    );

    select(container, "locale", "en");
    expect(phase(container)).toBe("first-premise");
    expect(document.documentElement.lang).toBe("en");
    expect(container.textContent).toContain("All animals are mortal.");
    expect(container.querySelector('[data-diagram-kind="triliteral"]')).not.toBeNull();
    expect([...container.querySelectorAll("circle")].map(
      (circle) => [circle.getAttribute("cx"), circle.getAttribute("cy")],
    )).toEqual(before);

    select(container, "locale", "ja");
    expect(phase(container)).toBe("first-premise");
    expect(document.documentElement.lang).toBe("ja");
    expect(container.textContent).toContain("すべての動物は死すべきものである。");
  });

  it("selects Darii, resets phase, and derives I", () => {
    const container = mount();
    button(container, "next").click();
    select(container, "problem", "darii-aii1");

    expect(phase(container)).toBe("problem");
    expect(container.textContent).toContain("すべての詩人は作家である。");
    expect(container.textContent).toContain("S学生");
    expect(container.textContent).toContain("M詩人");
    expect(container.textContent).toContain("P作家");
    advanceToConclusion(container);
    expect(container.textContent).toContain("ある学生は作家である。");
    expect(container.textContent).toContain("ある S は P である。");
  });

  it("derives E for Cesare", () => {
    const container = mount();
    select(container, "problem", "cesare-eae2");
    advanceToConclusion(container);
    expect(container.textContent).toContain("いかなる雀も哺乳類ではない。");
    expect(container.textContent).toContain("いかなる S も P ではない。");
  });

  it("shows an empty conclusion diagram for invalid premises", () => {
    const container = mount();
    select(container, "problem", "invalid-undistributed-middle");
    advanceToConclusion(container);

    expect(container.textContent).toContain(
      "これらの前提から確定した結論は得られません。",
    );
    expect(container.querySelectorAll("[data-counter-kind]")).toHaveLength(0);
    expect(container.querySelector(".logic-game__concrete-conclusion")).toBeNull();
    expect(container.querySelector(".logic-game__abstract-conclusion")).toBeNull();
  });

  it("changes problem from conclusion and returns to problem", () => {
    const container = mount();
    advanceToConclusion(container);
    select(container, "problem", "ferio-eio1");
    expect(phase(container)).toBe("problem");
    expect(container.textContent).toContain("いかなる鳥も哺乳類ではない。");
  });

  it("reset preserves selected English Darii", () => {
    const container = mount();
    select(container, "locale", "en");
    select(container, "problem", "darii-aii1");
    button(container, "next").click();
    button(container, "next").click();
    button(container, "reset").click();

    expect(phase(container)).toBe("problem");
    expect(document.documentElement.lang).toBe("en");
    expect(
      container.querySelector<HTMLSelectElement>('[data-action="problem"]')
        ?.value,
    ).toBe("darii-aii1");
    expect(container.textContent).toContain("All poets are writers.");
  });

  it("maintains next, previous, reset, and conclusion behavior", () => {
    const container = mount();
    advanceToConclusion(container);
    expect(phase(container)).toBe("conclusion");
    expect(button(container, "next").disabled).toBe(true);
    expect(container.querySelectorAll("[data-counter-kind]")).toHaveLength(2);
    button(container, "previous").click();
    expect(phase(container)).toBe("combined-premises");
    button(container, "previous").click();
    expect(phase(container)).toBe("first-premise");
    button(container, "reset").click();
    expect(phase(container)).toBe("problem");
  });

  it("does not accumulate event handlers after repeated changes", () => {
    const container = mount();
    select(container, "locale", "en");
    select(container, "problem", "darii-aii1");
    select(container, "locale", "ja");
    button(container, "next").click();
    expect(phase(container)).toBe("first-premise");
  });

  it("keeps every phase free of unsafe SVG content", () => {
    const container = mount();
    for (let index = 0; index < 4; index += 1) {
      expect(container.querySelector("script,foreignObject")).toBeNull();
      expect(container.querySelector(
        "svg [onclick],svg [onload],svg [href]",
      )).toBeNull();
      expect(container.innerHTML).not.toContain("NaN");
      expect(container.innerHTML).not.toContain("undefined");
      if (index < 3) button(container, "next").click();
    }
  });

  it("shows read-only term roles and advances without an assignment quiz", () => {
    const container = mount();
    expect(container.querySelector('[data-action="assignment-mode"]')).toBeNull();
    expect(container.querySelector('[data-action="quiz-term"]')).toBeNull();
    expect(container.querySelector('[data-action="check-assignment"]')).toBeNull();
    expect(container.querySelectorAll(".logic-game__assignment dt")).toHaveLength(3);
    expect(container.textContent).toContain("図で使用する項");
    expect(button(container, "next").disabled).toBe(false);
    button(container, "next").click();
    expect(phase(container)).toBe("first-premise");
  });

  it("creates and completes a custom Barbara problem", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    expect(phase(container)).toBe("problem");
    expect(container.querySelector('[data-action="problem"]')).toBeNull();
    expect(container.querySelectorAll(".logic-game__custom-problem fieldset"))
      .toHaveLength(2);
    expect(button(container, "next").disabled).toBe(true);

    createCustom(container);
    expect(container.textContent).toContain("すべての項目を選択してください。");
    fillCustomBarbara(container);
    createCustom(container);
    expect(container.textContent).toContain("自由問題を作成しました。");
    expect(container.textContent).toContain("すべての動物は死すべきものである。");
    expect(container.textContent).toContain("S人間");
    expect(container.textContent).toContain("M動物");
    expect(container.textContent).toContain("P死すべきもの");
    expect(button(container, "next").disabled).toBe(false);
    advanceToConclusion(container);
    expect(container.textContent).toContain("すべての人間は死すべきものである。");
    expect(container.querySelectorAll("[data-counter-kind]")).toHaveLength(2);
  });

  it("creates a structurally valid invalid custom problem", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    selectCustom(container, "custom-form", "major", "A");
    selectCustom(container, "custom-term", "major", "cat", "subjectTermId");
    selectCustom(container, "custom-term", "major", "animal", "predicateTermId");
    selectCustom(container, "custom-form", "minor", "A");
    selectCustom(container, "custom-term", "minor", "dog", "subjectTermId");
    selectCustom(container, "custom-term", "minor", "animal", "predicateTermId");
    createCustom(container);
    advanceToConclusion(container);
    expect(container.textContent).toContain(
      "これらの前提から確定した結論は得られません。",
    );
    expect(container.querySelectorAll("[data-counter-kind]")).toHaveLength(0);
  });

  it("derives by form without judging factually false premises", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    selectCustom(container, "custom-form", "major", "A");
    selectCustom(container, "custom-term", "major", "cat", "subjectTermId");
    selectCustom(container, "custom-term", "major", "animal", "predicateTermId");
    selectCustom(container, "custom-form", "minor", "A");
    selectCustom(container, "custom-term", "minor", "human", "subjectTermId");
    selectCustom(container, "custom-term", "minor", "cat", "predicateTermId");
    createCustom(container);
    advanceToConclusion(container);

    expect(container.textContent).toContain("すべての人間は動物である。");
    expect(container.querySelector('[data-action="conclusion-answer"]')).toBeNull();
    expect(container.textContent).not.toContain("前提が事実として誤っている");
  });

  it("invalidates editing, clears input, and restores draft across sources", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    createCustom(container);
    selectCustom(container, "custom-form", "major", "E");
    expect(container.textContent).not.toContain("自由問題を作成しました。");
    expect(container.querySelector(".logic-game__problem")).toBeNull();
    expect(button(container, "next").disabled).toBe(true);

    select(container, "problem-source", "built-in");
    expect(container.querySelector('[data-action="problem"]')).not.toBeNull();
    select(container, "problem-source", "custom");
    expect(container.querySelector<HTMLSelectElement>(
      '[data-action="custom-form"][data-premise-position="major"]',
    )?.value).toBe("E");
    container.querySelector<HTMLButtonElement>(
      '[data-action="clear-custom-problem"]',
    )!.click();
    expect([...container.querySelectorAll<HTMLSelectElement>(
      '[data-action^="custom-"]',
    )].filter((control) => control.tagName === "SELECT")
      .every(({ value }) => value === "")).toBe(true);
  });

  it("preserves custom values across locale and shows a derived result", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    select(container, "locale", "en");
    expect(container.querySelector<HTMLSelectElement>(
      '[data-action="custom-term"][data-premise-position="major"]' +
      '[data-field="subjectTermId"]',
    )?.value).toBe("animal");
    expect(container.textContent).toContain("Create a Custom Problem");
    createCustom(container);
    advanceToConclusion(container);
    expect(container.querySelector('[data-action="conclusion-answer"]')).toBeNull();
    expect(container.querySelector('[data-conclusion-experience="derived-result"]'))
      .not.toBeNull();
    expect(container.textContent).toContain("All humans are mortal.");
    button(container, "reset").click();
    expect(phase(container)).toBe("problem");
    expect(container.textContent).toContain("The custom problem has been created.");
  });

  it("applies quiz mode to a custom problem and switches modes before conclusion", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    createCustom(container);
    select(container, "conclusion-answer-mode", "quiz");
    advanceToConclusion(container);

    expect(phase(container)).toBe("combined-premises");
    expect(container.querySelector('[data-action="conclusion-answer"]')).not.toBeNull();
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    answerConclusion(container, "E");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("もう一度考えてください。");

    const modeSelector = container.querySelector<HTMLSelectElement>(
      '[data-action="conclusion-answer-mode"]',
    )!;
    modeSelector.focus();
    select(container, "conclusion-answer-mode", "automatic");
    expect(document.activeElement?.getAttribute("data-action"))
      .toBe("conclusion-answer-mode");
    expect(container.querySelector('[data-action="conclusion-answer"]')).toBeNull();
    expect(button(container, "next").disabled).toBe(false);

    select(container, "conclusion-answer-mode", "quiz");
    expect(container.querySelector('[data-action="conclusion-answer"]')).not.toBeNull();
    expect(container.textContent).not.toContain("もう一度考えてください。");
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    submitConclusion(container, "A");
    expect(container.textContent).toContain("正解です。");
    expect(phase(container)).toBe("combined-premises");
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    expect(button(container, "next").disabled).toBe(false);
    button(container, "next").click();
    expect(phase(container)).toBe("conclusion");
    expect(container.textContent).toContain("すべての人間は死すべきものである。");
  });

  it("enters a custom quiz conclusion after completing manual premise placements", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    createCustom(container);
    select(container, "counter-placement-mode", "manual");
    button(container, "next").click();
    activateCounterTarget(container, "triliteral:cell:SMp");
    activateCounterTarget(container, "triliteral:cell:sMp");
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:boundary:S:SMP:sMP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    button(container, "next").click();
    chooseCounterTool(container, "emptiness");
    for (const cell of ["SmP", "Smp"]) {
      activateCounterTarget(container, `triliteral:cell:${cell}`);
    }
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:cell:SMP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();

    expect(container.querySelector('[data-action="conclusion-answer"]')).toBeNull();
    expect(button(container, "next").disabled).toBe(false);
    select(container, "conclusion-answer-mode", "quiz");
    expect(button(container, "next").disabled).toBe(true);
    expect(phase(container)).toBe("combined-premises");
    expect(container.querySelectorAll('[data-action="counter-target"]'))
      .toHaveLength(18);
    submitConclusion(container, "E");
    expect(button(container, "next").disabled).toBe(true);
    submitConclusion(container, "A");
    expect(phase(container)).toBe("combined-premises");
    expect(button(container, "next").disabled).toBe(false);
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    button(container, "next").click();
    expect(container.querySelectorAll('[data-action="counter-target"]'))
      .toHaveLength(8);
  });

  it("adds consecutive custom terms, saves them, and restores on remount", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    addPhilosopher(container);
    expect(container.textContent).toContain("登録数：1件");
    expect(container.querySelector('[data-custom-term-id]')).toBeNull();
    expect(container.querySelector(
      '[data-action="custom-term"] option[value="custom-term-1"]',
    )?.textContent).toBe("哲学者");
    expect(JSON.parse(storage.values.get(CUSTOM_TERM_STORAGE_KEY)!))
      .toMatchObject({
        version: 2,
        terms: [{ id: "custom-term-1" }],
      });

    openTermManagement(container);
    inputCustomTerm(container, "jaNounPhrase", "思想家");
    inputCustomTerm(container, "enSubjectPlural", "thinkers");
    inputCustomTerm(container, "enPredicatePhrase", "thinkers");
    container.querySelector<HTMLButtonElement>(
      '[data-action="submit-custom-term"]',
    )!.click();
    expect(container.querySelector(
      '[data-custom-term-id="custom-term-2"]',
    )).not.toBeNull();

    const restored = mount(storage);
    select(restored, "problem-source", "custom");
    openTermManagement(restored);
    expect(restored.querySelectorAll(".logic-game__custom-term-list li"))
      .toHaveLength(2);
  });

  it("shows one locale-specific custom-term error and focuses its field", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    openTermManagement(container);
    const submit = () => container.querySelector<HTMLButtonElement>(
      '[data-action="submit-custom-term"]',
    )!.click();
    const field = (name: string) => container.querySelector<HTMLInputElement>(
      `[data-action="custom-term-input"][data-field="${name}"]`,
    )!;

    submit();
    expect(container.querySelectorAll(".logic-game__custom-term-feedback"))
      .toHaveLength(1);
    expect(container.textContent).toContain("日本語名詞句を入力してください。");
    expect(container.textContent).not.toContain("すべてのラベルを入力してください。");
    expect(field("jaNounPhrase").getAttribute("aria-invalid")).toBe("true");
    expect(field("enSubjectPlural").hasAttribute("aria-invalid")).toBe(false);
    expect(field("enPredicatePhrase").hasAttribute("aria-invalid")).toBe(false);
    expect(document.activeElement).toBe(field("jaNounPhrase"));

    select(container, "locale", "en");
    submit();
    expect(container.textContent).toContain(
      "Enter both the English subject plural and predicate phrase.",
    );
    expect(field("jaNounPhrase").hasAttribute("aria-invalid")).toBe(false);
    expect(field("enSubjectPlural").getAttribute("aria-invalid")).toBe("true");
    expect(field("enPredicatePhrase").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(field("enSubjectPlural"));

    inputCustomTerm(container, "enSubjectPlural", "philosophers");
    submit();
    expect(container.querySelectorAll(".logic-game__custom-term-feedback"))
      .toHaveLength(1);
    expect(container.textContent).toContain(
      "Enter both English fields or leave both blank.",
    );
    expect(field("enSubjectPlural").hasAttribute("aria-invalid")).toBe(false);
    expect(field("enPredicatePhrase").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(field("enPredicatePhrase"));
    expect(field("enPredicatePhrase").getAttribute("aria-describedby"))
      .toContain("custom-term-feedback");
  });

  it("edits, cancels, localizes, and deletes a custom term", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    addPhilosopher(container);
    openTermManagement(container);
    container.querySelector<HTMLButtonElement>(
      '[data-action="edit-custom-term"][data-term-id="custom-term-1"]',
    )!.click();
    expect(document.activeElement).toBe(container.querySelector(
      '[data-action="custom-term-input"][data-field="jaNounPhrase"]',
    ));
    inputCustomTerm(container, "jaNounPhrase", "思想家");
    container.querySelector<HTMLButtonElement>(
      '[data-action="cancel-custom-term-edit"]',
    )!.click();
    expect(container.querySelector(
      '[data-custom-term-id="custom-term-1"]',
    )?.textContent).toContain("哲学者");

    container.querySelector<HTMLButtonElement>(
      '[data-action="edit-custom-term"][data-term-id="custom-term-1"]',
    )!.click();
    inputCustomTerm(container, "jaNounPhrase", "思想家");
    container.querySelector<HTMLButtonElement>(
      '[data-action="submit-custom-term"]',
    )!.click();
    expect(container.querySelector(
      '[data-custom-term-id="custom-term-1"]',
    )?.textContent).toContain("思想家");
    select(container, "locale", "en");
    closeTermManagement(container);
    expect(container.querySelector(
      '[data-action="custom-term"] option[value="custom-term-1"]',
    )?.textContent).toBe("philosophers");

    openTermManagement(container);
    container.querySelector<HTMLButtonElement>(
      '[data-action="delete-custom-term"][data-term-id="custom-term-1"]',
    )!.click();
    expect(container.querySelector(
      '[data-custom-term-id="custom-term-1"]',
    )).toBeNull();
    expect(storage.values.get(CUSTOM_TERM_STORAGE_KEY))
      .not.toContain("custom-term-1");
  });

  it("uses a custom term in a problem result, then safely invalidates deletion", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    addPhilosopher(container);
    selectCustom(container, "custom-form", "major", "A");
    selectCustom(container, "custom-term", "major", "human", "subjectTermId");
    selectCustom(container, "custom-term", "major", "animal", "predicateTermId");
    selectCustom(container, "custom-form", "minor", "A");
    selectCustom(
      container,
      "custom-term",
      "minor",
      "custom-term-1",
      "subjectTermId",
    );
    selectCustom(container, "custom-term", "minor", "human", "predicateTermId");
    createCustom(container);
    expect(container.textContent).toContain("すべての哲学者は人間である。");
    advanceToConclusion(container);
    expect(container.textContent).toContain("すべての哲学者は動物である。");
    button(container, "reset").click();
    openTermManagement(container);
    container.querySelector<HTMLButtonElement>(
      '[data-action="delete-custom-term"][data-term-id="custom-term-1"]',
    )!.click();
    closeTermManagement(container);
    expect(phase(container)).toBe("problem");
    expect(button(container, "next").disabled).toBe(true);
    expect(container.querySelector<HTMLSelectElement>(
      '[data-action="custom-term"][data-premise-position="minor"]' +
      '[data-field="subjectTermId"]',
    )?.value).toBe("");
    expect(container.querySelector(".logic-game__problem")).toBeNull();
  });

  it("survives malformed storage and write failures", () => {
    const malformed = new MemoryStorage();
    malformed.values.set(CUSTOM_TERM_STORAGE_KEY, "{");
    const loaded = mount(malformed);
    select(loaded, "problem-source", "custom");
    expect(loaded.textContent).toContain(
      "保存されていたユーザー登録名詞を読み込めませんでした。",
    );
    expect(loaded.textContent).toContain("動物");

    const writeFailure: StringStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("blocked"); },
    };
    const session = mount(writeFailure);
    select(session, "problem-source", "custom");
    addPhilosopher(session);
    expect(session.querySelector(
      '[data-action="custom-term"] option[value="custom-term-1"]',
    )).not.toBeNull();
    openTermManagement(session);
    expect(session.textContent).toContain(
      "ユーザー登録名詞をブラウザへ保存できませんでした。",
    );
  });

  it("completes Barbara by manually placing logical counters", () => {
    const container = mount();
    select(container, "counter-placement-mode", "manual");
    expect(phase(container)).toBe("problem");
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(0);
    button(container, "next").click();
    expect(phase(container)).toBe("first-premise");
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(20);
    expect(button(container, "next").disabled).toBe(true);

    activateCounterTarget(container, "triliteral:cell:SMp");
    activateCounterTarget(container, "triliteral:cell:sMp");
    chooseCounterTool(container, "existence");
    activateCounterTarget(
      container,
      "triliteral:boundary:S:SMP:sMP",
    );
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.textContent).toContain("正しい配置です。");
    expect(button(container, "next").disabled).toBe(false);

    button(container, "next").click();
    expect(phase(container)).toBe("combined-premises");
    expect(container.querySelectorAll(
      '.carroll-diagram [data-counter-kind]',
    )).toHaveLength(3);
    expect(container.querySelectorAll(
      '[data-counter-target-locked="true"]',
    )).toHaveLength(2);
    expect(container.querySelector(
      '[data-action="counter-target"][data-target-key="triliteral:cell:SMp"]',
    )).toBeNull();
    expect(container.querySelector(
      '[data-action="counter-target"][data-target-key="triliteral:boundary:S:SMP:sMP"]',
    )).not.toBeNull();
    chooseCounterTool(container, "emptiness");
    for (const cell of ["SmP", "Smp"]) {
      activateCounterTarget(container, `triliteral:cell:${cell}`);
    }
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:cell:SMP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.textContent).toContain("正しい配置です。");
    button(container, "next").click();

    expect(phase(container)).toBe("conclusion");
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(8);
    chooseCounterTool(container, "emptiness");
    activateCounterTarget(container, "biliteral:cell:Sp");
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "biliteral:cell:SP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.textContent).toContain("正しい配置です。");
  });

  it("reports wrong kind, supports erase, and preserves answers on locale change", () => {
    const container = mount();
    select(container, "counter-placement-mode", "manual");
    button(container, "next").click();
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:cell:SMp");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.textContent).toContain("種類違い: 1");
    const key = "triliteral:cell:SMp";
    select(container, "locale", "en");
    expect(container.querySelector(
      `[data-target-key="${key}"]`,
    )?.getAttribute("aria-label")).toBe("Cell SMp. Existence I placed.");
    chooseCounterTool(container, "erase");
    activateCounterTarget(container, key);
    expect(container.querySelectorAll(
      '.carroll-diagram [data-counter-kind]',
    )).toHaveLength(0);
    expect(container.querySelector(
      ".logic-game__counter-feedback",
    )).toBeNull();
  });

  it("hides Barbara's conclusion until the quiz answer is correct", () => {
    const container = mount();
    select(container, "conclusion-answer-mode", "quiz");
    advanceToConclusion(container);
    expect(container.querySelector(
      '[data-action="conclusion-answer"]',
    )).not.toBeNull();
    expect(container.querySelector(
      ".logic-game__conclusion",
    )).toBeNull();
    expect(container.querySelectorAll(
      '.carroll-diagram [data-counter-kind]',
    )).toHaveLength(6);

    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("結論を選択してください。");
    answerConclusion(container, "E");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("もう一度考えてください。");
    expect(container.querySelector(
      ".logic-game__conclusion",
    )).toBeNull();

    answerConclusion(container, "A");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("正解です。");
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    expect(phase(container)).toBe("combined-premises");
    expect(button(container, "next").disabled).toBe(false);
    expect(container.querySelectorAll(
      '.carroll-diagram [data-counter-kind]',
    )).toHaveLength(6);

    answerConclusion(container, "E");
    expect(container.querySelector(
      ".logic-game__conclusion",
    )).toBeNull();
    expect(container.querySelectorAll(
      '.carroll-diagram [data-counter-kind]',
    )).toHaveLength(6);
    submitConclusion(container, "A");
    button(container, "next").click();
    expect(phase(container)).toBe("conclusion");
    expect(container.textContent).toContain(
      "すべての人間は死すべきものである。",
    );
  });

  it.each([
    ["darii-aii1", "I"],
    ["ferio-eio1", "O"],
    ["cesare-eae2", "E"],
  ] as const)("accepts %s with conclusion %s", (problemId, answer) => {
    const container = mount();
    select(container, "problem", problemId);
    select(container, "conclusion-answer-mode", "quiz");
    advanceToConclusion(container);
    answerConclusion(container, answer);
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("正解です。");
    button(container, "next").click();
    expect(phase(container)).toBe("conclusion");
  });

  it("accepts none only for the invalid built-in problem", () => {
    const container = mount();
    select(container, "problem", "invalid-undistributed-middle");
    select(container, "conclusion-answer-mode", "quiz");
    advanceToConclusion(container);
    answerConclusion(container, "A");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(container.textContent).toContain("もう一度考えてください。");
    answerConclusion(container, "none");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(button(container, "next").disabled).toBe(false);
    expect(container.textContent).not.toContain(
      "これらの前提から確定した結論は得られません。",
    );
    button(container, "next").click();
    expect(container.textContent).toContain(
      "これらの前提から確定した結論は得られません。",
    );
  });

  it("unlocks the manual conclusion diagram after the conclusion quiz", () => {
    const container = mount();
    select(container, "counter-placement-mode", "manual");
    select(container, "conclusion-answer-mode", "quiz");
    button(container, "next").click();
    activateCounterTarget(container, "triliteral:cell:SMp");
    activateCounterTarget(container, "triliteral:cell:sMp");
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:boundary:S:SMP:sMP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    button(container, "next").click();
    chooseCounterTool(container, "emptiness");
    for (const cell of ["SmP", "Smp"]) {
      activateCounterTarget(container, `triliteral:cell:${cell}`);
    }
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "triliteral:cell:SMP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(18);
    expect(button(container, "next").disabled).toBe(true);
    answerConclusion(container, "A");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(button(container, "next").disabled).toBe(false);
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(18);
    button(container, "next").click();
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(8);
    chooseCounterTool(container, "emptiness");
    activateCounterTarget(container, "biliteral:cell:Sp");
    chooseCounterTool(container, "existence");
    activateCounterTarget(container, "biliteral:cell:SP");
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(container.textContent).toContain("正しい配置です。");
  });

  it("saves, remounts, opens, and deletes a custom problem", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    createCustom(container);
    saveCurrentProblem(container, "Saved Barbara");
    expect(container.querySelector(
      '[data-saved-custom-problem-id="custom-problem-1"]',
    )?.textContent).toContain("Saved Barbara");
    expect(container.textContent).toContain("自由問題を保存しました。");
    expect(JSON.parse(storage.values.get(CUSTOM_PROBLEM_STORAGE_KEY)!))
      .toEqual({
        version: 2,
        problems: [{
          id: "custom-problem-1",
          title: "Saved Barbara",
          premises: {
            firstPremise: {
              form: "A",
              subject: { termId: "animal", complemented: false },
              predicate: { termId: "mortal", complemented: false },
            },
            secondPremise: {
              form: "A",
              subject: { termId: "human", complemented: false },
              predicate: { termId: "animal", complemented: false },
            },
          },
        }],
      });

    const restored = mount(storage);
    select(restored, "problem-source", "custom");
    restored.querySelector<HTMLButtonElement>(
      '[data-action="open-saved-custom-problem"]',
    )!.click();
    expect(restored.querySelector<HTMLSelectElement>(
      '[data-action="custom-form"][data-premise-position="major"]',
    )?.value).toBe("A");
    expect(restored.querySelector<HTMLSelectElement>(
      '[data-action="custom-term"][data-premise-position="minor"]' +
      '[data-field="subjectTermId"]',
    )?.value).toBe("human");
    expect(restored.textContent).toContain(
      "すべての動物は死すべきものである。",
    );
    advanceToConclusion(restored);
    expect(restored.textContent).toContain(
      "すべての人間は死すべきものである。",
    );
    button(restored, "reset").click();
    select(restored, "conclusion-answer-mode", "quiz");
    restored.querySelector<HTMLButtonElement>(
      '[data-action="open-saved-custom-problem"]',
    )!.click();
    advanceToConclusion(restored);
    expect(phase(restored)).toBe("combined-premises");
    expect(restored.querySelector('[data-action="conclusion-answer"]'))
      .not.toBeNull();
    button(restored, "reset").click();
    restored.querySelector<HTMLButtonElement>(
      '[data-action="delete-saved-custom-problem"]',
    )!.click();
    expect(restored.querySelector(
      '[data-saved-custom-problem-id]',
    )).toBeNull();
    expect(JSON.parse(storage.values.get(CUSTOM_PROBLEM_STORAGE_KEY)!))
      .toEqual({ version: 2, problems: [] });
  });

  it("creates, infers, saves, and restores a complemented custom subject", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    setCustomComplement(container, "minor", "subjectComplemented", true);
    createCustom(container);
    expect(container.textContent).toContain("すべての S′ は M である。");
    saveCurrentProblem(container, "Prime Barbara");
    const saved = JSON.parse(storage.values.get(CUSTOM_PROBLEM_STORAGE_KEY)!);
    expect(saved.problems[0].premises.secondPremise.subject).toEqual({
      termId: "human",
      complemented: true,
    });

    const restored = mount(storage);
    select(restored, "problem-source", "custom");
    restored.querySelector<HTMLButtonElement>(
      '[data-action="open-saved-custom-problem"]',
    )!.click();
    expect(restored.querySelector<HTMLInputElement>(
      '[data-action="custom-complement"]' +
      '[data-premise-position="minor"]' +
      '[data-field="subjectComplemented"]',
    )?.checked).toBe(true);
    select(restored, "conclusion-answer-mode", "quiz");
    button(restored, "next").click();
    button(restored, "next").click();
    expect(phase(restored)).toBe("combined-premises");
    const answerOptions = [...restored.querySelectorAll<HTMLOptionElement>(
      '[data-action="conclusion-answer"] option',
    )].map(({ textContent }) => textContent);
    expect(answerOptions).toContain("A — すべての人間′は死すべきものである。");
    expect(answerOptions).toHaveLength(6);
    submitConclusion(restored, "A");
    button(restored, "next").click();
    expect(restored.textContent).toContain("すべての人間′は死すべきものである。");
    expect(restored.textContent).toContain("すべての S′ は P である。");
    const svg = restored.querySelector(".carroll-diagram")?.outerHTML ?? "";
    expect(svg).toContain('data-counter-kind="emptiness"><circle cx="280" cy="280"');
    expect(svg).toContain('data-counter-kind="existence" data-source-ids="[&quot;second-premise&quot;]"><circle cx="120" cy="280"');
  });

  it("creates and edits saved problem titles with IME composition", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    fillCustomBarbara(container);
    createCustom(container);
    const original = container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )!;
    original.focus();
    original.dispatchEvent(new CompositionEvent("compositionstart"));
    for (const value of ["t", "た", "たn", "たな"]) {
      original.value = value;
      original.dispatchEvent(new InputEvent("input", { isComposing: true }));
      expect(container.querySelector(
        '[data-action="saved-custom-problem-title"]',
      )).toBe(original);
    }
    original.value = "田中の問題";
    original.setSelectionRange(5, 5);
    original.dispatchEvent(new CompositionEvent("compositionend"));
    const committed = container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )!;
    expect(committed.value).toBe("田中の問題");
    expect(document.activeElement).toBe(committed);
    expect([committed.selectionStart, committed.selectionEnd]).toEqual([5, 5]);
    committed.dispatchEvent(new InputEvent("input"));
    container.querySelector<HTMLButtonElement>(
      '[data-action="save-custom-problem"]',
    )!.click();
    expect(container.querySelector(
      '[data-saved-custom-problem-id="custom-problem-1"]',
    )?.textContent).toContain("田中の問題");

    container.querySelector<HTMLButtonElement>(
      '[data-action="edit-saved-custom-problem"]',
    )!.click();
    const editing = container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )!;
    editing.focus();
    editing.dispatchEvent(new CompositionEvent("compositionstart"));
    editing.value = "亀と動物";
    editing.dispatchEvent(new InputEvent("input", { isComposing: true }));
    expect(container.querySelector(
      '[data-action="saved-custom-problem-title"]',
    )).toBe(editing);
    editing.value = "亀と動物の問題";
    editing.dispatchEvent(new CompositionEvent("compositionend"));
    container.querySelector<HTMLButtonElement>(
      '[data-action="save-custom-problem"]',
    )!.click();
    expect(container.querySelector(
      '[data-saved-custom-problem-id="custom-problem-1"]',
    )?.textContent).toContain("亀と動物の問題");
    expect(JSON.parse(storage.values.get(CUSTOM_PROBLEM_STORAGE_KEY)!))
      .toMatchObject({
        problems: [{ title: "亀と動物の問題" }],
      });

    container.querySelector<HTMLButtonElement>(
      '[data-action="edit-saved-custom-problem"]',
    )!.click();
    const english = container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )!;
    english.value = "Test problem";
    english.dispatchEvent(new InputEvent("input"));
    expect(container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )?.value).toBe("Test problem");
  });

  it("prevents deleting a custom term referenced by a saved problem", () => {
    const storage = new MemoryStorage();
    const container = mount(storage);
    select(container, "problem-source", "custom");
    addPhilosopher(container);
    selectCustom(container, "custom-form", "major", "A");
    selectCustom(
      container,
      "custom-term",
      "major",
      "human",
      "subjectTermId",
    );
    selectCustom(
      container,
      "custom-term",
      "major",
      "animal",
      "predicateTermId",
    );
    selectCustom(container, "custom-form", "minor", "A");
    selectCustom(
      container,
      "custom-term",
      "minor",
      "custom-term-1",
      "subjectTermId",
    );
    selectCustom(
      container,
      "custom-term",
      "minor",
      "human",
      "predicateTermId",
    );
    createCustom(container);
    saveCurrentProblem(container, "Philosophers");
    const storedTermsBefore = storage.values.get(CUSTOM_TERM_STORAGE_KEY);
    openTermManagement(container);
    container.querySelector<HTMLButtonElement>(
      '[data-action="delete-custom-term"][data-term-id="custom-term-1"]',
    )!.click();
    expect(container.querySelector(
      '[data-custom-term-id="custom-term-1"]',
    )).not.toBeNull();
    expect(container.textContent).toContain(
      "保存済みの自由問題で使用されているため削除できません",
    );
    closeTermManagement(container);
    expect(container.querySelector(
      '[data-saved-custom-problem-id="custom-problem-1"]',
    )).not.toBeNull();
    expect(storage.values.get(CUSTOM_TERM_STORAGE_KEY)).toBe(
      storedTermsBefore,
    );
  });

  it("starts safely without saved problems when their catalog is invalid", () => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_PROBLEM_STORAGE_KEY, JSON.stringify({
      version: 1,
      problems: [{
        id: "custom-problem-1",
        title: "Broken reference",
        premises: {
          firstPremise: {
            form: "A",
            subject: { termId: "unknown-term", complemented: false },
            predicate: { termId: "animal", complemented: false },
          },
          secondPremise: {
            form: "A",
            subject: { termId: "human", complemented: false },
            predicate: { termId: "unknown-term", complemented: false },
          },
        },
      }],
    }));
    const container = mount(storage);
    select(container, "problem-source", "custom");
    expect(container.querySelector(
      '[data-saved-custom-problem-id]',
    )).toBeNull();
    expect(container.textContent).toContain(
      "保存されていた自由問題を読み込めませんでした。",
    );
    expect(container.textContent).toContain("動物");
  });

  it("restores control focus and caret while moving focus on phase changes", () => {
    const container = mount();
    const locale = container.querySelector<HTMLSelectElement>(
      '[data-action="locale"]',
    )!;
    locale.focus();
    select(container, "locale", "en");
    expect(document.activeElement).toBe(container.querySelector(
      '[data-action="locale"]',
    ));

    button(container, "next").focus();
    button(container, "next").click();
    expect(document.activeElement).toBe(container.querySelector(
      '[data-phase-heading="first-premise"]',
    ));
    button(container, "previous").click();
    expect(document.activeElement).toBe(container.querySelector(
      '[data-phase-heading="problem"]',
    ));

    select(container, "problem-source", "custom");
    openTermManagement(container);
    const input = container.querySelector<HTMLInputElement>(
      '[data-action="custom-term-input"][data-field="enSubjectPlural"]',
    )!;
    input.value = "philosophers";
    input.focus();
    input.setSelectionRange(3, 7);
    input.dispatchEvent(new Event("input"));
    const replacement = container.querySelector<HTMLInputElement>(
      '[data-action="custom-term-input"][data-field="enSubjectPlural"]',
    )!;
    expect(document.activeElement).toBe(replacement);
    expect([replacement.selectionStart, replacement.selectionEnd]).toEqual([
      3,
      7,
    ]);
  });

  it("keeps the Japanese input node during IME composition", () => {
    const container = mount();
    select(container, "problem-source", "custom");
    openTermManagement(container);
    const input = container.querySelector<HTMLInputElement>(
      '[data-action="custom-term-input"][data-field="jaNounPhrase"]',
    )!;
    input.focus();
    input.dispatchEvent(new CompositionEvent("compositionstart"));
    input.value = "田中";
    input.dispatchEvent(new InputEvent("input", { data: "田中", isComposing: true }));
    expect(container.querySelector(
      '[data-action="custom-term-input"][data-field="jaNounPhrase"]',
    )).toBe(input);
    expect(document.activeElement).toBe(input);
    input.dispatchEvent(new CompositionEvent("compositionend", { data: "田中" }));
    const replacement = container.querySelector<HTMLInputElement>(
      '[data-action="custom-term-input"][data-field="jaNounPhrase"]',
    )!;
    expect(replacement.value).toBe("田中");
    expect(document.activeElement).toBe(replacement);
  });
});

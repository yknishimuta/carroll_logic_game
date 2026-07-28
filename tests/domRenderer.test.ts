// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import { renderGameView, type GameEventHandlers } from "../src/app/domRenderer";
import { createGameViewModel } from "../src/app/viewModel";
import { createInitialAppState } from "../src/app/state";

function createContainer(): HTMLElement {
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  return container;
}

function handlers(): GameEventHandlers {
  return {
    onPrevious: vi.fn(),
    onNext: vi.fn(),
    onReset: vi.fn(),
    onProblemChange: vi.fn(),
    onLocaleChange: vi.fn(),
    onAssignmentModeChange: vi.fn(),
    onQuizTermChange: vi.fn(),
    onQuizAssignmentSubmit: vi.fn(),
    onProblemSourceChange: vi.fn(),
    onCustomPremiseFormChange: vi.fn(),
    onCustomPremiseTermChange: vi.fn(),
    onCustomProblemSubmit: vi.fn(),
    onCustomProblemClear: vi.fn(),
    onCustomTermDraftChange: vi.fn(),
    onCustomTermSubmit: vi.fn(),
    onCustomTermEdit: vi.fn(),
    onCustomTermEditCancel: vi.fn(),
    onCustomTermDelete: vi.fn(),
    onCounterPlacementModeChange: vi.fn(),
    onCounterToolChange: vi.fn(),
    onCounterTargetActivate: vi.fn(),
    onCounterAttemptCheck: vi.fn(),
    onCounterAttemptClear: vi.fn(),
    onConclusionAnswerModeChange: vi.fn(),
    onConclusionAnswerChange: vi.fn(),
    onConclusionAnswerSubmit: vi.fn(),
    onSavedCustomProblemTitleChange: vi.fn(),
    onSavedCustomProblemSubmit: vi.fn(),
    onSavedCustomProblemOpen: vi.fn(),
    onSavedCustomProblemEdit: vi.fn(),
    onSavedCustomProblemEditCancel: vi.fn(),
    onSavedCustomProblemDelete: vi.fn(),
    onDataBackupExport: vi.fn(),
    onDataBackupFileSelected: vi.fn(),
    onDataImportApply: vi.fn(),
    onDataImportCancel: vi.fn(),
  };
}

describe("renderGameView", () => {
  it("renders semantic content, selectors, and namespaced SVG", () => {
    const container = createContainer();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "problem",
        locale: "ja",
        problemId: "barbara-aaa1",
      }),
      handlers(),
    );

    expect(container.querySelector("article.logic-game")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(
      "ルイス・キャロルの論理ゲーム",
    );
    const tutorial = container.querySelector<HTMLAnchorElement>(
      'a[href="./tutorial.html"]',
    );
    expect(tutorial?.target).toBe("_blank");
    expect(tutorial?.rel).toContain("noopener");
    expect(tutorial?.getAttribute("aria-label")).toContain("新しいタブ");
    expect(container.querySelectorAll(".logic-game__problem li")).toHaveLength(2);
    expect(container.querySelectorAll(".logic-game__assignment dt")).toHaveLength(3);
    expect(container.querySelectorAll(".logic-game__abstraction li")).toHaveLength(2);
    expect(container.querySelector("svg")?.namespaceURI).toBe(
      "http://www.w3.org/2000/svg",
    );

    const locale = container.querySelector<HTMLSelectElement>(
      '[data-action="locale"]',
    );
    const problem = container.querySelector<HTMLSelectElement>(
      '[data-action="problem"]',
    );
    expect(locale?.value).toBe("ja");
    expect([...locale?.options ?? []].map(({ value, textContent }) => [
      value,
      textContent,
    ])).toEqual([
      ["ja", "日本語"],
      ["en", "English"],
    ]);
    expect(problem?.value).toBe("barbara-aaa1");
    expect(problem?.options).toHaveLength(6);
    expect(problem?.options[0]?.textContent).toBe("Barbara（AAA-1）");
  });

  it("dispatches select changes once", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "problem",
        locale: "ja",
        problemId: "barbara-aaa1",
      }),
      callbacks,
    );

    const locale = container.querySelector<HTMLSelectElement>(
      '[data-action="locale"]',
    )!;
    locale.value = "en";
    locale.dispatchEvent(new Event("change"));
    const problem = container.querySelector<HTMLSelectElement>(
      '[data-action="problem"]',
    )!;
    problem.value = "darii-aii1";
    problem.dispatchEvent(new Event("change"));

    expect(callbacks.onLocaleChange).toHaveBeenCalledOnce();
    expect(callbacks.onLocaleChange).toHaveBeenCalledWith("en");
    expect(callbacks.onProblemChange).toHaveBeenCalledOnce();
    expect(callbacks.onProblemChange).toHaveBeenCalledWith("darii-aii1");
  });

  it("renders English UI and updates document metadata", () => {
    const container = createContainer();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "first-premise",
        locale: "en",
        problemId: "barbara-aaa1",
      }),
      handlers(),
    );

    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toBe("Lewis Carroll's Logic Game");
    expect(container.querySelector(".logic-game__problem h2")?.textContent).toBe(
      "Premises",
    );
    expect(container.querySelector('[data-action="next"]')?.textContent).toBe(
      "Combine Second Premise",
    );
    expect(container.textContent).toContain(
      "The first premise has been placed on the diagram.",
    );
  });

  it("sets phase, progress, button state, and events", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "problem",
        locale: "ja",
        problemId: "barbara-aaa1",
      }),
      callbacks,
    );

    expect(container.querySelector("article")?.dataset.phase).toBe("problem");
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    const previous = container.querySelector<HTMLButtonElement>(
      '[data-action="previous"]',
    )!;
    const next = container.querySelector<HTMLButtonElement>(
      '[data-action="next"]',
    )!;
    expect(previous.type).toBe("button");
    expect(previous.disabled).toBe(true);
    previous.click();
    next.click();
    expect(callbacks.onPrevious).not.toHaveBeenCalled();
    expect(callbacks.onNext).toHaveBeenCalledOnce();
  });

  it("renders only the no-conclusion message for an invalid conclusion", () => {
    const container = createContainer();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "conclusion",
        locale: "en",
        problemId: "invalid-undistributed-middle",
      }),
      handlers(),
    );

    expect(container.querySelector(".logic-game__no-conclusion")?.textContent).toBe(
      "No determinate conclusion follows from these premises.",
    );
    expect(container.querySelector(".logic-game__concrete-conclusion")).toBeNull();
    expect(container.querySelector(".logic-game__abstract-conclusion")).toBeNull();
  });

  it("removes old language, problem, and conclusion DOM on redraw", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "conclusion",
        locale: "ja",
        problemId: "barbara-aaa1",
      }),
      callbacks,
    );
    renderGameView(
      container,
      createGameViewModel({ ...createInitialAppState(),
        phase: "problem",
        locale: "en",
        problemId: "darii-aii1",
      }),
      callbacks,
    );

    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    expect(container.textContent).toContain("All poets are writers.");
    expect(container.textContent).not.toContain("すべての動物");
    expect(
      container.querySelector<HTMLSelectElement>('[data-action="problem"]')
        ?.value,
    ).toBe("darii-aii1");
  });

  it("renders frozen view models without mutation", () => {
    const container = createContainer();
    const model = Object.freeze(
      createGameViewModel({ ...createInitialAppState(),
        phase: "problem",
        locale: "ja",
        problemId: "barbara-aaa1",
      }),
    );
    renderGameView(container, model, handlers());
    expect(model.phase).toBe("problem");
  });

  it("renders assignment mode and dispatches its validated change", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel(createInitialAppState()),
      callbacks,
    );
    const mode = container.querySelector<HTMLSelectElement>(
      '[data-action="assignment-mode"]',
    )!;
    expect([...mode.options].map(({ value, textContent }) => [
      value, textContent,
    ])).toEqual([
      ["automatic", "自動"],
      ["quiz", "クイズ"],
    ]);
    mode.value = "quiz";
    mode.dispatchEvent(new Event("change"));
    expect(callbacks.onAssignmentModeChange).toHaveBeenCalledOnce();
    expect(callbacks.onAssignmentModeChange).toHaveBeenCalledWith("quiz");
  });

  it("renders quiz controls, validates term values, and hides answers", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel({
        ...createInitialAppState(),
        assignmentMode: "quiz",
      }),
      callbacks,
    );
    const selects = container.querySelectorAll<HTMLSelectElement>(
      '[data-action="quiz-term"]',
    );
    expect(selects).toHaveLength(3);
    expect([...selects].map(({ dataset }) => dataset.role)).toEqual([
      "S", "M", "P",
    ]);
    expect([...selects[0]!.options].map(({ value }) => value)).toEqual([
      "", "animal", "mortal", "human",
    ]);
    expect(container.querySelector(".logic-game__assignment dl")).toBeNull();
    expect(container.querySelector(".logic-game__abstraction")).toBeNull();
    expect(
      container.querySelector<HTMLButtonElement>('[data-action="next"]')
        ?.disabled,
    ).toBe(true);

    selects[0]!.value = "human";
    selects[0]!.dispatchEvent(new Event("change"));
    expect(callbacks.onQuizTermChange).toHaveBeenCalledWith("S", "human");
    selects[0]!.value = "";
    selects[0]!.dispatchEvent(new Event("change"));
    expect(callbacks.onQuizTermChange).toHaveBeenLastCalledWith("S", null);

    const check = container.querySelector<HTMLButtonElement>(
      '[data-action="check-assignment"]',
    )!;
    expect(check.type).toBe("button");
    check.click();
    expect(callbacks.onQuizAssignmentSubmit).toHaveBeenCalledOnce();
  });

  it("renders feedback and reveals answers only when correct", () => {
    const container = createContainer();
    const callbacks = handlers();
    const base = {
      ...createInitialAppState(),
      assignmentMode: "quiz" as const,
      quizSelection: { S: "human", M: "animal", P: "mortal" },
    };
    renderGameView(
      container,
      createGameViewModel({ ...base, quizStatus: "incorrect" }),
      callbacks,
    );
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "割当てが正しくありません",
    );
    expect(container.querySelector(".logic-game__assignment dl")).toBeNull();

    renderGameView(
      container,
      createGameViewModel({ ...base, quizStatus: "correct" }),
      callbacks,
    );
    const feedback = container.querySelector('[role="status"]');
    expect(feedback?.getAttribute("aria-live")).toBe("polite");
    expect(feedback?.textContent).toBe("正しい割当てです。");
    expect(container.querySelectorAll(".logic-game__assignment dt"))
      .toHaveLength(3);
    expect(container.querySelectorAll(".logic-game__abstraction li"))
      .toHaveLength(2);
  });

  it("switches between built-in selector and the custom editor", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel(createInitialAppState()),
      callbacks,
    );
    const source = container.querySelector<HTMLSelectElement>(
      '[data-action="problem-source"]',
    )!;
    expect([...source.options].map(({ value, textContent }) => [
      value, textContent,
    ])).toEqual([
      ["built-in", "組み込み問題"],
      ["custom", "自由問題"],
    ]);
    expect(container.querySelector('[data-action="problem"]')).not.toBeNull();
    expect(container.querySelector(".logic-game__custom-problem")).toBeNull();
    source.value = "custom";
    source.dispatchEvent(new Event("change"));
    expect(callbacks.onProblemSourceChange).toHaveBeenCalledWith("custom");

    renderGameView(
      container,
      createGameViewModel({
        ...createInitialAppState(),
        problemSource: "custom",
      }),
      callbacks,
    );
    expect(container.querySelector('[data-action="problem"]')).toBeNull();
    expect(container.querySelectorAll(
      ".logic-game__custom-problem fieldset",
    )).toHaveLength(2);
    expect(container.querySelectorAll('[data-action="custom-form"]'))
      .toHaveLength(2);
    expect(container.querySelectorAll('[data-action="custom-term"]'))
      .toHaveLength(4);
  });

  it("dispatches custom field, submit, clear, and null changes", () => {
    const container = createContainer();
    const callbacks = handlers();
    renderGameView(
      container,
      createGameViewModel({
        ...createInitialAppState(),
        problemSource: "custom",
      }),
      callbacks,
    );
    const form = container.querySelector<HTMLSelectElement>(
      '[data-action="custom-form"][data-premise-position="major"]',
    )!;
    expect(form.options[0]?.textContent).toBe("形式を選択してください");
    form.value = "A";
    form.dispatchEvent(new Event("change"));
    expect(callbacks.onCustomPremiseFormChange)
      .toHaveBeenCalledWith("major", "A");
    form.value = "";
    form.dispatchEvent(new Event("change"));
    expect(callbacks.onCustomPremiseFormChange)
      .toHaveBeenLastCalledWith("major", null);

    const term = container.querySelector<HTMLSelectElement>(
      '[data-action="custom-term"][data-premise-position="minor"]' +
      '[data-field="subjectTermId"]',
    )!;
    expect(term.options).toHaveLength(16);
    term.value = "human";
    term.dispatchEvent(new Event("change"));
    expect(callbacks.onCustomPremiseTermChange)
      .toHaveBeenCalledWith("minor", "subjectTermId", "human");
    term.value = "";
    term.dispatchEvent(new Event("change"));
    expect(callbacks.onCustomPremiseTermChange)
      .toHaveBeenLastCalledWith("minor", "subjectTermId", null);

    container.querySelector<HTMLButtonElement>(
      '[data-action="create-custom-problem"]',
    )!.click();
    container.querySelector<HTMLButtonElement>(
      '[data-action="clear-custom-problem"]',
    )!.click();
    expect(callbacks.onCustomProblemSubmit).toHaveBeenCalledOnce();
    expect(callbacks.onCustomProblemClear).toHaveBeenCalledOnce();
  });

  it("renders custom feedback accessibly", () => {
    const container = createContainer();
    renderGameView(
      container,
      createGameViewModel({
        ...createInitialAppState(),
        problemSource: "custom",
        customProblemStatus: "incomplete",
      }),
      handlers(),
    );
    const feedback = container.querySelector(
      ".logic-game__custom-problem-feedback",
    );
    expect(feedback?.getAttribute("role")).toBe("status");
    expect(feedback?.getAttribute("aria-live")).toBe("polite");
    expect(feedback?.textContent).toBe("すべての項目を選択してください。");
    expect(container.querySelector(".logic-game__problem")).toBeNull();
    expect(container.querySelector(".logic-game__abstraction")).toBeNull();
  });

  it("renders and dispatches the custom term manager", () => {
    const container = createContainer();
    const callbacks = handlers();
    const philosopher = {
      id: "custom-term-1" as const,
      labels: {
        ja: { nounPhrase: "哲学者" },
        en: {
          subjectPlural: "philosophers",
          predicatePhrase: "philosophers",
        },
      },
    };
    renderGameView(
      container,
      createGameViewModel({
        ...createInitialAppState({ customTerms: [philosopher] }),
        problemSource: "custom",
      }),
      callbacks,
    );
    const inputs = container.querySelectorAll<HTMLInputElement>(
      '[data-action="custom-term-input"]',
    );
    expect(inputs).toHaveLength(3);
    expect([...inputs].map(({ type, maxLength, dataset }) => [
      type, maxLength, dataset.field,
    ])).toEqual([
      ["text", 80, "jaNounPhrase"],
      ["text", 80, "enSubjectPlural"],
      ["text", 80, "enPredicatePhrase"],
    ]);
    inputs[0]!.value = "思想家";
    inputs[0]!.dispatchEvent(new Event("input"));
    expect(callbacks.onCustomTermDraftChange)
      .toHaveBeenCalledWith("jaNounPhrase", "思想家");
    container.querySelector<HTMLButtonElement>(
      '[data-action="submit-custom-term"]',
    )!.click();
    expect(callbacks.onCustomTermSubmit).toHaveBeenCalledOnce();

    const item = container.querySelector(
      '[data-custom-term-id="custom-term-1"]',
    );
    expect(item?.textContent).toContain("哲学者");
    expect(item?.textContent).toContain("philosophers");
    item?.querySelector<HTMLButtonElement>(
      '[data-action="edit-custom-term"]',
    )!.click();
    item?.querySelector<HTMLButtonElement>(
      '[data-action="delete-custom-term"]',
    )!.click();
    expect(callbacks.onCustomTermEdit).toHaveBeenCalledWith("custom-term-1");
    expect(callbacks.onCustomTermDelete).toHaveBeenCalledWith("custom-term-1");
    expect(container.querySelectorAll(
      '[data-action="custom-term"] option[value="custom-term-1"]',
    ).length).toBeGreaterThan(0);
  });

  it("renders edit cancellation, feedback, warnings, and empty list", () => {
    const container = createContainer();
    const state = {
      ...createInitialAppState(),
      problemSource: "custom" as const,
      customTermPersistenceStatus: "save-error" as const,
      customTermEditor: {
        mode: "edit" as const,
        editingTermId: "custom-term-1" as const,
        draft: {
          jaNounPhrase: "哲学者",
          enSubjectPlural: "philosophers",
          enPredicatePhrase: "philosophers",
        },
        status: "duplicate-term" as const,
      },
    };
    const callbacks = handlers();
    renderGameView(container, createGameViewModel(state), callbacks);
    expect(container.querySelector(".logic-game__custom-term-empty")?.textContent)
      .toBe("ユーザー名詞はまだありません。");
    expect(container.querySelector(
      ".logic-game__custom-term-feedback",
    )?.getAttribute("aria-live")).toBe("polite");
    expect(container.querySelector(".logic-game__custom-term-warning")
      ?.textContent).toContain("保存できませんでした");
    container.querySelector<HTMLButtonElement>(
      '[data-action="cancel-custom-term-edit"]',
    )!.click();
    expect(callbacks.onCustomTermEditCancel).toHaveBeenCalledOnce();
  });

  it("renders and connects native manual counter controls", () => {
    const container = createContainer();
    const initial = createInitialAppState();
    const state = {
      ...initial,
      phase: "first-premise" as const,
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual" as const,
      },
    };
    const callbacks = handlers();
    renderGameView(container, createGameViewModel(state), callbacks);
    const mode = container.querySelector<HTMLSelectElement>(
      '[data-action="counter-placement-mode"]',
    )!;
    expect(mode.value).toBe("manual");
    expect(mode.options).toHaveLength(2);
    expect(container.querySelectorAll(
      'button[data-action="counter-target"]',
    )).toHaveLength(20);
    expect(container.querySelector(
      ".logic-game__interactive-diagram .logic-game__svg-container",
    )).not.toBeNull();
    const tools = container.querySelector('[role="group"]')!;
    expect(tools.getAttribute("aria-label")).toBe("使用する駒");
    expect(tools.querySelectorAll("button")).toHaveLength(3);
    const existence = tools.querySelector<HTMLButtonElement>(
      '[data-tool="existence"]',
    )!;
    expect(existence.getAttribute("aria-pressed")).toBe("false");
    existence.click();
    expect(callbacks.onCounterToolChange).toHaveBeenCalledWith("existence");
    const target = container.querySelector<HTMLButtonElement>(
      '[data-target-key="triliteral:cell:SMP"]',
    )!;
    expect(target.type).toBe("button");
    expect(target.style.left).toBe("40%");
    target.click();
    expect(callbacks.onCounterTargetActivate).toHaveBeenCalledWith(
      "triliteral:cell:SMP",
    );
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-counter-attempt"]',
    )!.click();
    expect(callbacks.onCounterAttemptCheck).toHaveBeenCalledOnce();
    expect(container.querySelector<HTMLButtonElement>(
      '[data-action="clear-counter-attempt"]',
    )!.disabled).toBe(true);
  });

  it("renders the conclusion mode and a locked conclusion quiz", () => {
    const container = createContainer();
    const initial = createInitialAppState();
    const state = {
      ...initial,
      phase: "conclusion" as const,
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual" as const,
      },
      conclusionQuiz: {
        mode: "quiz" as const,
        selectedAnswer: null,
        check: { kind: "incomplete" as const },
      },
    };
    const callbacks = handlers();
    renderGameView(container, createGameViewModel(state), callbacks);
    const mode = container.querySelector<HTMLSelectElement>(
      '[data-action="conclusion-answer-mode"]',
    )!;
    expect(mode.value).toBe("quiz");
    mode.value = "automatic";
    mode.dispatchEvent(new Event("change"));
    expect(callbacks.onConclusionAnswerModeChange).toHaveBeenCalledWith(
      "automatic",
    );
    const answer = container.querySelector<HTMLSelectElement>(
      '[data-action="conclusion-answer"]',
    )!;
    expect([...answer.options].map(({ value }) => value)).toEqual([
      "",
      "A",
      "E",
      "I",
      "O",
      "none",
    ]);
    answer.value = "A";
    answer.dispatchEvent(new Event("change"));
    expect(callbacks.onConclusionAnswerChange).toHaveBeenCalledWith("A");
    answer.value = "";
    answer.dispatchEvent(new Event("change"));
    expect(callbacks.onConclusionAnswerChange).toHaveBeenLastCalledWith(null);
    container.querySelector<HTMLButtonElement>(
      '[data-action="check-conclusion-answer"]',
    )!.click();
    expect(callbacks.onConclusionAnswerSubmit).toHaveBeenCalledOnce();
    expect(container.querySelector(
      ".logic-game__conclusion-quiz-feedback",
    )?.getAttribute("aria-live")).toBe("polite");
    expect(container.querySelector(".logic-game__conclusion")).toBeNull();
    expect(container.querySelector(
      '[data-action="counter-target"]',
    )).toBeNull();
    expect(container.querySelector(
      '[data-action="counter-tool"]',
    )).toBeNull();
  });

  it("reveals conclusion and manual controls after a correct answer", () => {
    const container = createContainer();
    const initial = createInitialAppState();
    renderGameView(container, createGameViewModel({
      ...initial,
      phase: "conclusion",
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual",
      },
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: "A",
        check: { kind: "correct" },
      },
    }), handlers());
    expect(container.querySelector(
      ".logic-game__concrete-conclusion",
    )?.textContent).toContain("すべての人間は死すべきものである。");
    expect(container.querySelectorAll(
      '[data-action="counter-target"]',
    )).toHaveLength(8);
  });

  it("renders and connects the saved custom problem manager", () => {
    const container = createContainer();
    const initial = createInitialAppState();
    const problem = {
      id: "custom-problem-1" as const,
      title: "Saved Barbara",
      premises: {
        firstPremise: {
          form: "A" as const,
          subject: "animal",
          predicate: "mortal",
        },
        secondPremise: {
          form: "A" as const,
          subject: "human",
          predicate: "animal",
        },
      },
    };
    const callbacks = handlers();
    renderGameView(container, createGameViewModel({
      ...initial,
      problemSource: "custom",
      savedCustomProblems: [problem],
    }), callbacks);
    const input = container.querySelector<HTMLInputElement>(
      '[data-action="saved-custom-problem-title"]',
    )!;
    expect(input.type).toBe("text");
    expect(input.maxLength).toBe(100);
    input.value = "New name";
    input.dispatchEvent(new Event("input"));
    expect(callbacks.onSavedCustomProblemTitleChange).toHaveBeenCalledWith(
      "New name",
    );
    container.querySelector<HTMLButtonElement>(
      '[data-action="save-custom-problem"]',
    )!.click();
    expect(callbacks.onSavedCustomProblemSubmit).toHaveBeenCalledOnce();
    const item = container.querySelector(
      '[data-saved-custom-problem-id="custom-problem-1"]',
    )!;
    expect(item.textContent).toContain("Saved Barbara");
    expect(item.textContent).toContain(
      "すべての動物は死すべきものである。",
    );
    item.querySelector<HTMLButtonElement>(
      '[data-action="open-saved-custom-problem"]',
    )!.click();
    item.querySelector<HTMLButtonElement>(
      '[data-action="edit-saved-custom-problem"]',
    )!.click();
    item.querySelector<HTMLButtonElement>(
      '[data-action="delete-saved-custom-problem"]',
    )!.click();
    expect(callbacks.onSavedCustomProblemOpen).toHaveBeenCalledWith(
      "custom-problem-1",
    );
    expect(callbacks.onSavedCustomProblemEdit).toHaveBeenCalledWith(
      "custom-problem-1",
    );
    expect(callbacks.onSavedCustomProblemDelete).toHaveBeenCalledWith(
      "custom-problem-1",
    );
  });

  it("renders and connects the data backup controls and ready preview", () => {
    const container = createContainer();
    const callbacks = handlers();
    const initial = createInitialAppState();
    renderGameView(container, createGameViewModel({
      ...initial,
      dataImport: {
        status: "ready",
        fileName: "backup.json",
        pending: {
          fileName: "backup.json",
          content: { customTerms: [], savedCustomProblems: [] },
          customTermCount: 3,
          savedCustomProblemCount: 5,
        },
      },
    }), callbacks);
    const input = container.querySelector<HTMLInputElement>(
      '[data-action="import-data-backup-file"]',
    )!;
    expect(input.type).toBe("file");
    expect(input.accept).toBe("application/json,.json");
    expect(input.multiple).toBe(false);
    const file = new File(["{}"], "backup.json", { type: "application/json" });
    Object.defineProperty(input, "files", { value: { item: () => file } });
    input.dispatchEvent(new Event("change"));
    expect(callbacks.onDataBackupFileSelected).toHaveBeenCalledWith(file);
    container.querySelector<HTMLButtonElement>(
      '[data-action="export-data-backup"]',
    )!.click();
    container.querySelector<HTMLButtonElement>(
      '[data-action="apply-data-import"]',
    )!.click();
    container.querySelector<HTMLButtonElement>(
      '[data-action="cancel-data-import"]',
    )!.click();
    expect(callbacks.onDataBackupExport).toHaveBeenCalledOnce();
    expect(callbacks.onDataImportApply).toHaveBeenCalledOnce();
    expect(callbacks.onDataImportCancel).toHaveBeenCalledOnce();
    expect(container.querySelector(".logic-game__data-import-preview")?.textContent)
      .toContain("backup.json");
    expect(container.textContent).toContain("ユーザー名詞3");
    expect(container.textContent).not.toContain("custom-term-1");
  });
});

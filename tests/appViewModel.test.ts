import { describe, expect, it } from "vitest";
import {
  BUILT_IN_PROBLEMS,
  type BuiltInProblemId,
} from "../src/data/problems";
import type { Locale } from "../src/domain/locale";
import {
  createInitialAppState,
  type GamePhase,
} from "../src/app/state";
import { createGameViewModel } from "../src/app/viewModel";

function state(
  phase: GamePhase,
  locale: Locale = "ja",
  problemId: BuiltInProblemId = "barbara-aaa1",
) {
  const initial = createInitialAppState();
  return {
    ...initial,
    phase,
    locale,
    problemId,
    conclusionQuiz: phase === "conclusion"
      ? { mode: "automatic" as const, selectedAnswer: null, check: { kind: "not-checked" as const } }
      : initial.conclusionQuiz,
  };
}

function count(svg: string, fragment: string): number {
  return svg.split(fragment).length - 1;
}

function logicalSvgSignature(svg: string) {
  return {
    emptiness: count(svg, 'data-counter-kind="emptiness"'),
    existence: count(svg, 'data-counter-kind="existence"'),
    circles: [...svg.matchAll(/<circle cx="(\d+)" cy="(\d+)"/g)].map(
      ([, x, y]) => [x, y],
    ),
    sources: [...svg.matchAll(/data-source-ids="([^"]+)"/g)].map(
      ([, sources]) => sources,
    ),
  };
}

describe("Barbara view models", () => {
  it("provides localized accessibility landmark labels without changing logic", () => {
    const ja = createGameViewModel(createInitialAppState());
    const en = createGameViewModel({
      ...createInitialAppState(),
      locale: "en",
    });
    expect(ja.accessibility).toEqual({
      skipToMain: "メインコンテンツへ移動",
      settingsHeading: "設定",
      progressNavigationLabel: "進行状況",
      mainRegionLabel: "問題の内容",
    });
    expect(en.accessibility).toEqual({
      skipToMain: "Skip to main content",
      settingsHeading: "Settings",
      progressNavigationLabel: "Progress",
      mainRegionLabel: "Problem content",
    });
    expect(en.termAssignment.map(({ role }) => role)).toEqual(
      ja.termAssignment.map(({ role }) => role),
    );
  });
  it("preserves the initial Japanese content", () => {
    const model = createGameViewModel(state("problem"));
    expect(model.concretePremises).toEqual([
      "すべての動物は死すべきものである。",
      "すべての人間は動物である。",
    ]);
    expect(model.termAssignment).toEqual([
      { role: "S", label: "人間" },
      { role: "M", label: "動物" },
      { role: "P", label: "死すべきもの" },
    ]);
    expect(model.abstractPremises).toEqual([
      "すべての M は P である。",
      "すべての S は M である。",
    ]);
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
  });

  it("formats English premises, terms, and conclusion", () => {
    const problem = createGameViewModel(state("problem", "en"));
    const conclusion = createGameViewModel(state("conclusion", "en"));

    expect(problem.concretePremises).toEqual([
      "All animals are mortal.",
      "All humans are animals.",
    ]);
    expect(problem.termAssignment).toEqual([
      { role: "S", label: "humans" },
      { role: "M", label: "animals" },
      { role: "P", label: "mortal beings" },
    ]);
    expect(problem.abstractPremises).toEqual([
      "All M are P.",
      "All S are M.",
    ]);
    expect(conclusion.concreteConclusion).toBe("All humans are mortal.");
    expect(conclusion.abstractConclusion).toBe("All S are P.");
  });

  it("keeps the established phase diagrams", () => {
    const first = createGameViewModel(state("first-premise"));
    const combined = createGameViewModel(state("combined-premises"));
    const conclusion = createGameViewModel(state("conclusion"));

    expect(count(first.diagram.svg, 'data-counter-kind="emptiness"')).toBe(2);
    expect(count(first.diagram.svg, 'data-counter-kind="existence"')).toBe(1);
    expect(first.diagram.svg).toContain('<circle cx="160" cy="200" r="14"');
    expect(count(combined.diagram.svg, 'data-counter-kind="emptiness"')).toBe(4);
    expect(count(combined.diagram.svg, 'data-counter-kind="existence"')).toBe(2);
    expect(conclusion.diagram.kind).toBe("biliteral");
    expect(conclusion.diagram.svg).toContain(
      'data-counter-kind="emptiness"><circle cx="280" cy="120"',
    );
    expect(conclusion.diagram.svg).toContain(
      'data-counter-kind="existence" data-source-ids="[&quot;second-premise&quot;]"><circle cx="120" cy="120"',
    );
  });
});

describe("catalog-driven view models", () => {
  const phases = [
    "problem",
    "first-premise",
    "combined-premises",
    "conclusion",
  ] as const;

  it.each(
    BUILT_IN_PROBLEMS.flatMap(({ id }) =>
      phases.map((phase) => [id, phase] as const),
    ),
  )("creates %s at %s", (problemId, phase) => {
    const model = createGameViewModel(state(phase, "ja", problemId));
    expect(model.phase).toBe(phase);
    expect(model.problemSelector.selectedValue).toBe(problemId);
    expect(model.diagram.kind).toBe(
      phase === "conclusion" ? "biliteral" : "triliteral",
    );
  });

  it.each(BUILT_IN_PROBLEMS.slice(0, 5))(
    "shows inferred conclusion for $id",
    ({ id }) => {
      const model = createGameViewModel(state("conclusion", "ja", id));
      expect(model.concreteConclusion).not.toBeNull();
      expect(model.abstractConclusion).not.toBeNull();
      expect(model.noConclusionMessage).toBeNull();
    },
  );

  it("shows an empty conclusion diagram for the invalid problem", () => {
    const model = createGameViewModel(
      state("conclusion", "ja", "invalid-undistributed-middle"),
    );
    expect(model.concreteConclusion).toBeNull();
    expect(model.abstractConclusion).toBeNull();
    expect(model.noConclusionMessage).toBe(
      "これらの前提から確定した結論は得られません。",
    );
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
  });

  it("creates ordered localized problem selectors", () => {
    const ja = createGameViewModel(state("problem"));
    const en = createGameViewModel(state("problem", "en"));
    expect(ja.problemSelector.options.map(({ value }) => value)).toEqual(
      BUILT_IN_PROBLEMS.map(({ id }) => id),
    );
    expect(ja.problemSelector.options[0]?.label).toBe("Barbara（AAA-1）");
    expect(en.problemSelector.options[0]?.label).toBe("Barbara (AAA-1)");
    expect(ja.languageSelector.options).toEqual([
      { value: "ja", label: "日本語" },
      { value: "en", label: "English" },
    ]);
  });

  it.each(BUILT_IN_PROBLEMS)(
    "keeps logical SVG data invariant across locale for $id",
    ({ id }) => {
      for (const phase of phases) {
        const ja = createGameViewModel(state(phase, "ja", id));
        const en = createGameViewModel(state(phase, "en", id));
        expect(en.diagram.kind).toBe(ja.diagram.kind);
        expect(logicalSvgSignature(en.diagram.svg)).toEqual(
          logicalSvgSignature(ja.diagram.svg),
        );
      }
    },
  );

  it("localizes SVG accessibility text", () => {
    const ja = createGameViewModel(state("problem", "ja"));
    const en = createGameViewModel(state("problem", "en"));
    expect(ja.diagram.svg).toContain('aria-label="駒を置く前の三文字図"');
    expect(en.diagram.svg).toContain('aria-label="Empty triliteral diagram"');
    expect(ja.diagram.svg).toContain("<desc>二つの前提を配置する前の空の図です。</desc>");
    expect(en.diagram.svg).toContain(
      "<desc>The diagram before either premise is placed.</desc>",
    );
  });

  it("is non-destructive and deterministic", () => {
    const frozen = Object.freeze(state("combined-premises", "en", "darii-aii1"));
    expect(createGameViewModel(frozen)).toEqual(createGameViewModel(frozen));
    expect(frozen.phase).toBe("combined-premises");
  });
});

describe("term role display view models", () => {
  it("shows computed S, M, and P without quiz controls", () => {
    const model = createGameViewModel(createInitialAppState());
    expect(model.assignmentPanel.kind).toBe("resolved");
    expect(model.termAssignment.map(({ role }) => role)).toEqual(["S", "M", "P"]);
    expect(model.assignmentHeading).toBe("図で使用する項");
    expect(model.assignmentDescription)
      .toBe("この問題では、次の対応で図を表示します。");
    expect(model.navigation.nextDisabled).toBe(false);
    expect("assignmentModeSelector" in model).toBe(false);
  });
});

describe("custom problem view models", () => {
  const premises = {
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
  };
  const draft = {
    majorPremise: {
      form: "A" as const,
      subjectTermId: "animal" as const,
      predicateTermId: "mortal" as const,
    },
    minorPremise: {
      form: "A" as const,
      subjectTermId: "human" as const,
      predicateTermId: "animal" as const,
    },
  };
  const ready = {
    ...createInitialAppState(),
    problemSource: "custom" as const,
    customProblemDraft: draft,
    customPremises: premises,
    customProblemStatus: "ready" as const,
  };

  it("supports automatic and quiz conclusions for both problem sources", () => {
    const builtAutomatic = createGameViewModel({
      ...createInitialAppState(), phase: "conclusion",
    });
    const builtQuiz = createGameViewModel({
      ...createInitialAppState(),
      phase: "combined-premises",
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: null,
        check: { kind: "not-checked" },
      },
    });
    const customAutomatic = createGameViewModel({
      ...ready, phase: "conclusion",
    });
    const customQuiz = createGameViewModel({
      ...ready,
      phase: "combined-premises",
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: null,
        check: { kind: "not-checked" },
      },
    });

    for (const model of [builtAutomatic, customAutomatic]) {
      expect(model.conclusionAnswerModeSelector.selectedValue).toBe("automatic");
      expect(model.conclusionQuiz).toBeNull();
      expect(model.concreteConclusion).not.toBeNull();
      expect(model.derivedConclusion).not.toBeNull();
    }
    for (const model of [builtQuiz, customQuiz]) {
      expect(model.conclusionAnswerModeSelector.selectedValue).toBe("quiz");
      expect(model.conclusionQuiz).not.toBeNull();
      expect(model.concreteConclusion).toBeNull();
      expect(model.derivedConclusion).toBeNull();
      expect(model.diagram.kind).toBe("triliteral");
    }
  });

  it("shows an empty editor and disables progress before creation", () => {
    const model = createGameViewModel({
      ...createInitialAppState(),
      problemSource: "custom",
    });
    expect(model.problemSourceSelector.selectedValue).toBe("custom");
    expect(model.problemSelector).not.toBeNull();
    expect(model.customProblemEditor?.premises).toHaveLength(2);
    expect(model.customProblemEditor?.premises[0]?.formSelector.options)
      .toEqual([
        { value: "A", label: "A — すべてのSはPである" },
        { value: "E", label: "E — いかなるSもPではない" },
        { value: "I", label: "I — あるSはPである" },
        { value: "O", label: "O — あるSはPではない" },
      ]);
    expect(model.customProblemEditor?.premises[0]?.subjectSelector.options)
      .toHaveLength(15);
    expect(model.concretePremises).toBeNull();
    expect(model.assignmentPanel.kind).toBe("unavailable");
    expect(model.abstractPremises).toBeNull();
    expect(model.navigation.nextDisabled).toBe(true);
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
  });

  it.each([
    ["incomplete", "すべての項目を選択してください。", "Complete all fields."],
    [
      "same-term-within-major-premise",
      "第一前提では、主語と述語に異なる名詞を選択してください。",
      "Select different subject and predicate terms in the major premise.",
    ],
    [
      "same-term-within-minor-premise",
      "第二前提では、主語と述語に異なる名詞を選択してください。",
      "Select different subject and predicate terms in the minor premise.",
    ],
    [
      "expected-three-distinct-terms",
      "二つの前提全体には、異なる三つの名詞が必要です。",
      "The two premises must contain exactly three distinct terms.",
    ],
  ] as const)("localizes custom feedback %s", (status, jaText, enText) => {
    expect(createGameViewModel({
      ...ready,
      customPremises: null,
      customProblemStatus: status,
    }).customProblemEditor?.feedback?.message).toBe(jaText);
    expect(createGameViewModel({
      ...ready,
      locale: "en",
      customPremises: null,
      customProblemStatus: status,
    }).customProblemEditor?.feedback?.message).toBe(enText);
  });

  it("computes a ready Barbara custom problem in both languages", () => {
    const ja = createGameViewModel(ready);
    const en = createGameViewModel({ ...ready, locale: "en" });
    expect(ja.customProblemEditor?.feedback).toEqual({
      kind: "success",
      message: "自由問題を作成しました。",
    });
    expect(ja.concretePremises).toEqual([
      "すべての動物は死すべきものである。",
      "すべての人間は動物である。",
    ]);
    expect(en.concretePremises).toEqual([
      "All animals are mortal.",
      "All humans are animals.",
    ]);
    expect(ja.termAssignment).toEqual([
      { role: "S", label: "人間" },
      { role: "M", label: "動物" },
      { role: "P", label: "死すべきもの" },
    ]);
    expect(ja.navigation.nextDisabled).toBe(false);
  });

  it.each([
    "problem",
    "first-premise",
    "combined-premises",
    "conclusion",
  ] as const)("creates custom Barbara phase %s", (phase) => {
    const model = createGameViewModel({ ...ready, phase });
    expect(model.phase).toBe(phase);
    expect(model.diagram.kind).toBe(
      phase === "conclusion" ? "biliteral" : "triliteral",
    );
    if (phase === "conclusion") {
      expect(model.concreteConclusion).toBe(
        "すべての人間は死すべきものである。",
      );
    }
  });

  it("shows computed term roles without blocking a created custom problem", () => {
    const model = createGameViewModel(ready);
    expect(model.assignmentPanel.kind).toBe("resolved");
    expect(model.navigation.nextDisabled).toBe(false);
  });

  it("shows no conclusion for a structurally valid invalid custom problem", () => {
    const model = createGameViewModel({
      ...ready,
      phase: "conclusion",
      customPremises: {
        firstPremise: { form: "A", subject: "cat", predicate: "animal" },
        secondPremise: { form: "A", subject: "dog", predicate: "animal" },
      },
    });
    expect(model.concreteConclusion).toBeNull();
    expect(model.abstractConclusion).toBeNull();
    expect(model.noConclusionMessage).toBe(
      "これらの前提から確定した結論は得られません。",
    );
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
  });
});

describe("custom term view models", () => {
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
  const customState = {
    ...createInitialAppState({ customTerms: [philosopher] }),
    problemSource: "custom" as const,
    screen: "custom-term-management" as const,
  };

  it("creates screen-specific custom-term summaries", () => {
    const game = createGameViewModel({ ...customState, screen: "game" });
    expect(game.activeScreen).toBe("game");
    expect(game.customTermSummary).toMatchObject({
      countText: "登録数：1件",
      manageLabel: "ユーザー登録名詞を管理",
    });
    expect(game.customTermManager).toBeNull();
    const management = createGameViewModel(customState);
    expect(management.activeScreen).toBe("custom-term-management");
    expect(management.customTermManagement).toEqual({
      heading: "ユーザー登録名詞の管理",
      countText: "登録済み：1 / 100件",
      backLabel: "ゲームへ戻る",
    });
    expect(management.customTermManager?.items).toHaveLength(1);
  });

  it("shows the manager only on the management screen", () => {
    const model = createGameViewModel(customState);
    expect(model.customTermManager).not.toBeNull();
    expect(model.customTermManager?.items).toMatchObject([
      {
        id: "custom-term-1",
        displayName: "哲学者",
        jaNounPhrase: "哲学者",
        enSubjectPlural: "philosophers",
        enPredicatePhrase: "philosophers",
        editLabel: "編集",
        deleteLabel: "削除",
      },
    ]);
    expect(createGameViewModel({
      ...customState,
      screen: "game",
    }).customTermManager).toBeNull();
    expect(createGameViewModel({
      ...customState,
      phase: "first-premise",
      customProblemStatus: "ready",
      customPremises: {
        firstPremise: { form: "A", subject: "animal", predicate: "mortal" },
        secondPremise: { form: "A", subject: "human", predicate: "animal" },
      },
    }).customTermManager).not.toBeNull();
    expect(model.activeScreen).toBe("custom-term-management");
    expect(model.customTermManagement.countText).toBe("登録済み：1 / 100件");
  });

  it("appends localized custom options after built-ins", () => {
    const ja = createGameViewModel(customState);
    const en = createGameViewModel({ ...customState, locale: "en" });
    expect(ja.customProblemEditor?.premises[0]?.subjectSelector.options)
      .toHaveLength(16);
    expect(ja.customProblemEditor?.premises[0]?.subjectSelector.options.at(-1))
      .toEqual({ value: "custom-term-1", label: "哲学者" });
    expect(en.customProblemEditor?.premises[0]?.subjectSelector.options.at(-1))
      .toEqual({ value: "custom-term-1", label: "philosophers" });
  });

  it.each([
    ["japanese-required", "日本語名詞句を入力してください。"],
    ["term-text-too-long", "各入力は80文字以内にしてください。"],
    ["duplicate-term", "同じ名詞が既に登録されています。"],
    ["term-limit-reached", "ユーザー登録名詞は100件まで追加できます。"],
    ["created", "ユーザー登録名詞を追加しました。"],
    ["updated", "ユーザー登録名詞を更新しました。"],
    ["deleted", "ユーザー登録名詞を削除しました。"],
  ] as const)("shows custom term status %s", (status, message) => {
    const model = createGameViewModel({
      ...customState,
      customTermEditor: {
        ...customState.customTermEditor,
        status,
      },
    });
    expect(model.customTermManager?.feedback?.message).toBe(message);
  });

  it.each([
    ["ja", "japanese-required", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, ["jaNounPhrase"], "jaNounPhrase"],
    ["en", "english-required", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, ["enSubjectPlural", "enPredicatePhrase"], "enSubjectPlural"],
    ["ja", "incomplete-english", { jaNounPhrase: "哲学者", enSubjectPlural: "philosophers", enPredicatePhrase: "" }, ["enPredicatePhrase"], "enPredicatePhrase"],
    ["en", "at-least-one-language-required", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, [], "enSubjectPlural"],
  ] as const)("resolves custom-term validation fields for %s", (
    locale, status, draft, invalidFields, focusField,
  ) => {
    const manager = createGameViewModel({
      ...customState,
      locale,
      customTermEditor: { mode: status === "at-least-one-language-required"
        ? "edit" : "create", editingTermId: status === "at-least-one-language-required"
          ? "custom-term-1" : null, draft, status },
    }).customTermManager;
    expect(manager?.validation).toMatchObject({ invalidFields, focusField });
    expect(manager?.feedback?.message).toBe(manager?.validation?.message);
  });

  it("shows edit state and persistence warnings in both languages", () => {
    const edited = createGameViewModel({
      ...customState,
      customTermPersistenceStatus: "save-error",
      customTermEditor: {
        mode: "edit",
        editingTermId: "custom-term-1",
        draft: {
          jaNounPhrase: "哲学者",
          enSubjectPlural: "philosophers",
          enPredicatePhrase: "philosophers",
        },
        status: "editing",
      },
    });
    expect(edited.customTermManager?.submitLabel).toBe("変更を保存");
    expect(edited.customTermManager?.cancelLabel).toBe("編集を取り消す");
    expect(edited.customTermManager?.persistenceWarning).toContain(
      "ブラウザへ保存できませんでした",
    );
    expect(createGameViewModel({
      ...customState,
      locale: "en",
      customTermPersistenceStatus: "load-error",
    }).customTermManager?.persistenceWarning).toContain(
      "could not be loaded",
    );
  });

  it("formats and computes a custom-term syllogism and quiz", () => {
    const premises = {
      firstPremise: {
        form: "A" as const,
        subject: "custom-term-1",
        predicate: "human",
      },
      secondPremise: {
        form: "A" as const,
        subject: "animal",
        predicate: "human",
      },
    };
    const state = {
      ...customState,
      customProblemDraft: {
        majorPremise: {
          form: "A" as const,
          subjectTermId: "custom-term-1",
          predicateTermId: "human",
        },
        minorPremise: {
          form: "A" as const,
          subjectTermId: "animal",
          predicateTermId: "human",
        },
      },
      customPremises: premises,
      customProblemStatus: "ready" as const,
    };
    const ja = createGameViewModel(state);
    const en = createGameViewModel({ ...state, locale: "en" });
    expect(ja.concretePremises).toEqual([
      "すべての哲学者は人間である。",
      "すべての動物は人間である。",
    ]);
    expect(en.concretePremises).toEqual([
      "All philosophers are humans.",
      "All animals are humans.",
    ]);
    expect(ja.assignmentPanel.kind).toBe("resolved");
  });

  it("reflects edited labels while keeping logical SVG data", () => {
    const before = createGameViewModel(customState);
    const after = createGameViewModel({
      ...customState,
      customTerms: [{
        ...philosopher,
        labels: {
          ...philosopher.labels,
          ja: { nounPhrase: "思想家" },
        },
      }],
    });
    expect(after.customTermManager?.items[0]?.id).toBe("custom-term-1");
    expect(after.customTermManager?.items[0]?.displayName).toBe("思想家");
    expect(logicalSvgSignature(after.diagram.svg)).toEqual(
      logicalSvgSignature(before.diagram.svg),
    );
  });

  it("builds manual triliteral and biliteral practice models", () => {
    const base = {
      ...createInitialAppState(),
      counterPractice: {
        ...createInitialAppState().counterPractice,
        mode: "manual" as const,
      },
    };
    const problem = createGameViewModel(base);
    expect(problem.counterPlacementModeSelector.selectedValue).toBe("manual");
    expect(problem.counterPracticePanel).toBeNull();
    expect(count(problem.diagram.svg, "data-counter-kind=")).toBe(0);

    const first = createGameViewModel({ ...base, phase: "first-premise" });
    expect(first.counterPracticePanel?.targets).toHaveLength(20);
    expect(first.counterPracticePanel?.tools.map(({ value }) => value)).toEqual(
      ["emptiness", "existence", "erase"],
    );
    expect(first.counterPracticePanel?.targets[0]).toMatchObject({
      key: "triliteral:cell:SMP",
      leftPercent: 40,
      topPercent: 40,
    });
    expect(first.navigation.nextDisabled).toBe(true);

    const conclusion = createGameViewModel({ ...base, phase: "conclusion" });
    expect(conclusion.diagram.kind).toBe("biliteral");
    expect(conclusion.counterPracticePanel?.targets).toHaveLength(8);
  });

  it("renders user counters and localized validation feedback", () => {
    const state = createInitialAppState();
    const manual = {
      ...state,
      phase: "first-premise" as const,
      locale: "en" as const,
      counterPractice: {
        ...state.counterPractice,
        mode: "manual" as const,
        selectedTool: "existence" as const,
        firstPremise: {
          placements: [{
            kind: "existence" as const,
            anchor: { type: "cell" as const, cell: "SMP" as const },
          }],
          check: {
            kind: "incorrect" as const,
            summary: {
              missingCount: 2,
              extraCount: 1,
              wrongKindCount: 0,
            },
          },
        },
      },
    };
    const model = createGameViewModel(manual);
    expect(count(model.diagram.svg, 'data-counter-kind="existence"')).toBe(1);
    expect(model.counterPracticePanel?.tools.find(({ selected }) => selected)
      ?.value).toBe("existence");
    expect(model.counterPracticePanel?.targets[0]?.label).toBe(
      "Cell SMP. Existence I placed.",
    );
    expect(model.counterPracticePanel?.feedback?.message).toBe(
      "The placement is not correct. Missing: 2, Extra: 1, Wrong kind: 0.",
    );
  });

  it("hides all conclusion information before a quiz answer", () => {
    const initial = createInitialAppState();
    const model = createGameViewModel({
      ...initial,
      phase: "combined-premises",
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: null,
        check: { kind: "not-checked" },
      },
    });
    expect(model.conclusionQuiz?.options.map(({ value }) => value)).toEqual(
      ["A", "E", "I", "O", "none"],
    );
    expect(model.conclusionQuiz?.options.map(({ label }) => label)).toEqual([
      "A — すべての人間は死すべきものである。",
      "E — いかなる人間も死すべきものではない。",
      "I — ある人間は死すべきものである。",
      "O — ある人間は死すべきものではない。",
      "確定した結論なし",
    ]);
    expect(model.concreteConclusion).toBeNull();
    expect(model.abstractConclusion).toBeNull();
    expect(model.noConclusionMessage).toBeNull();
    expect(model.counterPracticePanel).toBeNull();
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(6);
    expect(model.navigation.nextDisabled).toBe(true);
  });

  it("generates English candidates and enables navigation after a correct answer", () => {
    const initial = createInitialAppState();
    const model = createGameViewModel({
      ...initial,
      phase: "combined-premises",
      locale: "en",
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: "A",
        check: { kind: "correct" },
      },
    });
    expect(model.conclusionQuiz?.options.map(({ label }) => label)).toEqual([
      "A — All humans are mortal.",
      "E — No humans are mortal.",
      "I — Some humans are mortal.",
      "O — Some humans are not mortal.",
      "No determinate conclusion",
    ]);
    expect(model.conclusionQuiz?.feedback?.message).toBe("Correct.");
    expect(model.concreteConclusion).toBeNull();
    expect(model.abstractConclusion).toBeNull();
    expect(model.navigation.nextDisabled).toBe(false);
    expect(model.diagram.kind).toBe("triliteral");
  });

  it("unlocks manual conclusion practice only after a correct answer", () => {
    const initial = createInitialAppState();
    const model = createGameViewModel({
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
    });
    expect(model.counterPracticePanel?.targets).toHaveLength(8);
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
    expect(model.concreteConclusion).toBe(
      "すべての人間は死すべきものである。",
    );
  });

  it("reveals only the no-conclusion message after none is correct", () => {
    const initial = createInitialAppState();
    const model = createGameViewModel({
      ...initial,
      phase: "conclusion",
      problemId: "invalid-undistributed-middle",
      conclusionQuiz: {
        mode: "quiz",
        selectedAnswer: "none",
        check: { kind: "correct" },
      },
    });
    expect(model.noConclusionMessage).toBe(
      "これらの前提から確定した結論は得られません。",
    );
    expect(model.concreteConclusion).toBeNull();
    expect(model.abstractConclusion).toBeNull();
    expect(count(model.diagram.svg, "data-counter-kind=")).toBe(0);
  });

  it("uses custom-term labels in localized derived results", () => {
    const premises = {
      firstPremise: {
        form: "A" as const,
        subject: "human",
        predicate: "animal",
      },
      secondPremise: {
        form: "A" as const,
        subject: "custom-term-1",
        predicate: "human",
      },
    };
    const base = {
      ...customState,
      phase: "conclusion" as const,
      customProblemStatus: "ready" as const,
      customPremises: premises,
      conclusionQuiz: {
        mode: "automatic" as const,
        selectedAnswer: null,
        check: { kind: "not-checked" as const },
      },
    };
    expect(createGameViewModel(base).conclusionQuiz).toBeNull();
    expect(createGameViewModel(base).concreteConclusion).toBe(
      "すべての哲学者は動物である。",
    );
    expect(createGameViewModel(base).derivedConclusion?.factualDisclaimer)
      .toContain("現実に正しいかどうかは判定しません");
    expect(createGameViewModel({
      ...base,
      locale: "en",
    }).concreteConclusion).toBe("All philosophers are animals.");
  });

  it("builds a localized saved custom problem manager", () => {
    const savedProblem = {
      id: "custom-problem-1" as const,
      title: "哲学者の問題",
      premises: {
        firstPremise: {
          form: "A" as const,
          subject: "human",
          predicate: "animal",
        },
        secondPremise: {
          form: "A" as const,
          subject: "custom-term-1",
          predicate: "human",
        },
      },
    };
    const ja = createGameViewModel({
      ...customState,
      savedCustomProblems: [savedProblem],
    });
    expect(ja.savedCustomProblemManager).toMatchObject({
      mode: "create",
      titleValue: "",
      submitLabel: "現在の問題を保存",
      emptyListMessage: null,
    });
    expect(ja.savedCustomProblemManager?.items[0]).toMatchObject({
      id: "custom-problem-1",
      title: "哲学者の問題",
      concretePremises: [
        "すべての人間は動物である。",
        "すべての哲学者は人間である。",
      ],
    });
    const en = createGameViewModel({
      ...customState,
      locale: "en",
      savedCustomProblems: [savedProblem],
      savedCustomProblemEditor: {
        mode: "edit",
        editingProblemId: "custom-problem-1",
        draft: { title: "哲学者の問題" },
        status: "editing",
      },
    });
    expect(en.savedCustomProblemManager?.submitLabel).toBe("Save Changes");
    expect(en.savedCustomProblemManager?.cancelLabel).toBe("Cancel Editing");
    expect(en.savedCustomProblemManager?.items[0]?.concretePremises).toEqual([
      "All humans are animals.",
      "All philosophers are humans.",
    ]);
    expect(createGameViewModel({
      ...customState,
      phase: "first-premise",
      savedCustomProblems: [savedProblem],
    }).savedCustomProblemManager).toBeNull();
  });

  it("builds backup status and preview only during the problem phase", () => {
    const ready = {
      ...customState,
      dataImport: {
        status: "ready" as const,
        fileName: "backup.json",
        pending: {
          fileName: "backup.json",
          content: { customTerms: [], savedCustomProblems: [] },
          customTermCount: 3,
          savedCustomProblemCount: 5,
        },
      },
      dataExportStatus: "exported" as const,
    };
    const model = createGameViewModel(ready);
    expect(model.dataBackup).toMatchObject({
      heading: "データのバックアップ",
      accept: "application/json,.json",
      exportStatusMessage: "データを書き出しました。",
      preview: {
        fileName: "backup.json",
        customTermCount: 3,
        savedProblemCount: 5,
      },
    });
    expect(JSON.stringify(model.dataBackup)).not.toContain("custom-term-");
    expect(createGameViewModel({ ...ready, phase: "first-premise" }).dataBackup)
      .toBeNull();
    expect(createGameViewModel({
      ...ready,
      locale: "en",
      dataImport: { status: "invalid-json", fileName: "bad.json", pending: null },
    }).dataBackup?.importStatusMessage).toBe("The file is not valid JSON.");
  });
});

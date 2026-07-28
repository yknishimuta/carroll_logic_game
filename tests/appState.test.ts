import { describe, expect, it } from "vitest";
import {
  createInitialAppState,
  reduceAppState,
  type AppState,
} from "../src/app/state";

const initial: AppState = createInitialAppState();

describe("application state", () => {
  it("starts with Japanese Barbara at problem", () => {
    expect(createInitialAppState()).toEqual(initial);
  });

  it("moves forward and backward while preserving selection", () => {
    const first = reduceAppState(initial, { type: "next" });
    const second = reduceAppState(first, { type: "next" });
    const third = reduceAppState(second, { type: "next" });
    const boundary = reduceAppState(third, { type: "next" });

    expect(first).toEqual({ ...initial, phase: "first-premise" });
    expect(second).toEqual({ ...initial, phase: "combined-premises" });
    expect(third).toEqual({ ...initial, phase: "conclusion" });
    expect(boundary).toEqual(third);
    expect(reduceAppState(third, { type: "previous" }).phase).toBe(
      "combined-premises",
    );
    expect(reduceAppState(initial, { type: "previous" })).toEqual(initial);
  });

  it.each([
    "problem",
    "first-premise",
    "combined-premises",
    "conclusion",
  ] as const)("resets %s but preserves locale and problem", (phase) => {
    expect(
      reduceAppState(
        {
          ...initial,
          phase,
          locale: "en",
          problemId: "darii-aii1",
        },
        { type: "reset" },
      ),
    ).toEqual({
      ...initial,
      phase: "problem",
      locale: "en",
      problemId: "darii-aii1",
    });
  });

  it("changes only locale even from conclusion", () => {
    expect(
      reduceAppState(
        { ...initial, phase: "conclusion" },
        { type: "set-locale", locale: "en" },
      ),
    ).toEqual({
      ...initial,
      phase: "conclusion",
      locale: "en",
      problemId: "barbara-aaa1",
    });
  });

  it("changes problem, returns to problem, and preserves locale", () => {
    expect(
      reduceAppState(
        { ...initial, phase: "conclusion", locale: "en" },
        { type: "select-problem", problemId: "cesare-eae2" },
      ),
    ).toEqual({
      ...initial,
      phase: "problem",
      locale: "en",
      problemId: "cesare-eae2",
    });
  });

  it("is non-destructive and deterministic", () => {
    const state: AppState = Object.freeze({
      ...initial,
      phase: "first-premise",
      locale: "ja",
      problemId: "barbara-aaa1",
    });
    const action = Object.freeze({
      type: "set-locale" as const,
      locale: "en" as const,
    });
    const first = reduceAppState(state, action);
    const second = reduceAppState(state, action);

    expect(first).toEqual(second);
    expect(state).toEqual({
      ...initial,
      phase: "first-premise",
      locale: "ja",
      problemId: "barbara-aaa1",
    });
  });

  it("changes mode and clears quiz progress", () => {
    expect(
      reduceAppState(
        {
          ...initial,
          phase: "conclusion",
          quizSelection: { S: "human", M: "animal", P: "mortal" },
          quizStatus: "correct",
        },
        { type: "set-assignment-mode", mode: "quiz" },
      ),
    ).toEqual({
      ...initial,
      assignmentMode: "quiz",
    });
  });

  it("selects each role in quiz mode and resets submitted status", () => {
    let state: AppState = { ...initial, assignmentMode: "quiz" };
    state = reduceAppState(state, {
      type: "select-quiz-term",
      role: "S",
      termId: "human",
    });
    state = reduceAppState(
      { ...state, quizStatus: "incorrect" },
      { type: "select-quiz-term", role: "M", termId: "animal" },
    );
    state = reduceAppState(
      { ...state, quizStatus: "correct" },
      { type: "select-quiz-term", role: "P", termId: "mortal" },
    );
    expect(state.quizSelection).toEqual({
      S: "human",
      M: "animal",
      P: "mortal",
    });
    expect(state.quizStatus).toBe("not-submitted");
  });

  it.each([
    [{ ok: true } as const, "correct"],
    [{ ok: false, reason: "incomplete" } as const, "incomplete"],
    [{ ok: false, reason: "duplicate-term" } as const, "duplicate-term"],
    [{ ok: false, reason: "incorrect" } as const, "incorrect"],
  ] as const)("maps validation %j to %s", (validation, status) => {
    const state = reduceAppState(
      { ...initial, assignmentMode: "quiz" },
      { type: "submit-quiz-assignment", validation },
    );
    expect(state.quizStatus).toBe(status);
  });

  it.each([
    "not-submitted",
    "incomplete",
    "duplicate-term",
    "incorrect",
  ] as const)("blocks quiz next while status is %s", (quizStatus) => {
    const state = { ...initial, assignmentMode: "quiz" as const, quizStatus };
    expect(reduceAppState(state, { type: "next" })).toEqual(state);
  });

  it("allows quiz next only after a correct answer", () => {
    const state = {
      ...initial,
      assignmentMode: "quiz" as const,
      quizStatus: "correct" as const,
    };
    expect(reduceAppState(state, { type: "next" }).phase).toBe(
      "first-premise",
    );
  });

  it("ignores quiz actions in automatic mode", () => {
    expect(
      reduceAppState(initial, {
        type: "select-quiz-term",
        role: "S",
        termId: "human",
      }),
    ).toBe(initial);
    expect(
      reduceAppState(initial, {
        type: "submit-quiz-assignment",
        validation: { ok: true },
      }),
    ).toBe(initial);
  });

  it("clears answers on problem change and reset but not locale change", () => {
    const answered: AppState = {
      ...initial,
      phase: "conclusion",
      locale: "ja",
      assignmentMode: "quiz",
      quizSelection: { S: "human", M: "animal", P: "mortal" },
      quizStatus: "correct",
    };
    const localized = reduceAppState(answered, {
      type: "set-locale",
      locale: "en",
    });
    expect(localized).toEqual({ ...answered, locale: "en" });

    for (const result of [
      reduceAppState(answered, {
        type: "select-problem",
        problemId: "darii-aii1",
      }),
      reduceAppState(answered, { type: "reset" }),
    ]) {
      expect(result.assignmentMode).toBe("quiz");
      expect(result.quizSelection).toEqual({ S: null, M: null, P: null });
      expect(result.quizStatus).toBe("not-submitted");
      expect(result.phase).toBe("problem");
    }
  });

  it("starts with the built-in source and an empty custom draft", () => {
    expect(initial.problemSource).toBe("built-in");
    expect(initial.customProblemDraft).toEqual({
      majorPremise: {
        form: null,
        subjectTermId: null,
        predicateTermId: null,
      },
      minorPremise: {
        form: null,
        subjectTermId: null,
        predicateTermId: null,
      },
    });
    expect(initial.customPremises).toBeNull();
    expect(initial.customProblemStatus).toBe("editing");
  });

  it("switches sources while preserving custom input and clearing quiz state", () => {
    const custom = {
      ...initial,
      phase: "conclusion" as const,
      customProblemDraft: {
        ...initial.customProblemDraft,
        majorPremise: {
          form: "A" as const,
          subjectTermId: "animal" as const,
          predicateTermId: null,
        },
      },
      quizSelection: { S: "human", M: null, P: null },
      quizStatus: "incorrect" as const,
    };
    const selected = reduceAppState(custom, {
      type: "set-problem-source",
      source: "custom",
    });
    expect(selected.problemSource).toBe("custom");
    expect(selected.phase).toBe("problem");
    expect(selected.customProblemDraft).toEqual(custom.customProblemDraft);
    expect(selected.quizSelection).toEqual({ S: null, M: null, P: null });
    expect(selected.quizStatus).toBe("not-submitted");
  });

  it("updates custom fields only in custom source", () => {
    expect(reduceAppState(initial, {
      type: "update-custom-premise-form",
      position: "major",
      form: "A",
    })).toBe(initial);
    let state = reduceAppState(initial, {
      type: "set-problem-source",
      source: "custom",
    });
    state = reduceAppState(state, {
      type: "update-custom-premise-form",
      position: "major",
      form: "A",
    });
    state = reduceAppState(state, {
      type: "update-custom-premise-term",
      position: "minor",
      field: "subjectTermId",
      termId: "human",
    });
    expect(state.customProblemDraft.majorPremise.form).toBe("A");
    expect(state.customProblemDraft.minorPremise.subjectTermId).toBe("human");
    expect(state.customProblemStatus).toBe("editing");
  });

  it("stores successful custom premises and blocks or allows next", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: "animal", predicate: "mortal" },
      secondPremise: { form: "A" as const, subject: "human", predicate: "animal" },
    };
    const editing = {
      ...initial,
      problemSource: "custom" as const,
    };
    expect(reduceAppState(editing, { type: "next" })).toEqual(editing);
    const ready = reduceAppState(editing, {
      type: "submit-custom-problem",
      validation: {
        ok: true,
        premises,
        assignment: { S: "human", M: "animal", P: "mortal" },
      },
    });
    expect(ready.customPremises).toEqual(premises);
    expect(ready.customProblemStatus).toBe("ready");
    expect(reduceAppState(ready, { type: "next" }).phase).toBe(
      "first-premise",
    );
    const quiz = { ...ready, assignmentMode: "quiz" as const };
    expect(reduceAppState(quiz, { type: "next" }).phase).toBe("problem");
    expect(reduceAppState(
      { ...quiz, quizStatus: "correct" },
      { type: "next" },
    ).phase).toBe("first-premise");
  });

  it.each([
    "incomplete",
    "same-term-within-major-premise",
    "same-term-within-minor-premise",
    "expected-three-distinct-terms",
    "expected-one-common-term",
    "could-not-determine-major-term",
    "could-not-determine-minor-term",
  ] as const)("stores custom failure %s", (reason) => {
    const state = reduceAppState(
      { ...initial, problemSource: "custom" },
      {
        type: "submit-custom-problem",
        validation: { ok: false, reason },
      },
    );
    expect(state.customPremises).toBeNull();
    expect(state.customProblemStatus).toBe(reason);
  });

  it("invalidates a created problem after editing and clears explicitly", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: "animal", predicate: "mortal" },
      secondPremise: { form: "A" as const, subject: "human", predicate: "animal" },
    };
    const ready: AppState = {
      ...initial,
      problemSource: "custom",
      customPremises: premises,
      customProblemStatus: "ready",
      quizSelection: { S: "human", M: "animal", P: "mortal" },
      quizStatus: "correct",
    };
    const edited = reduceAppState(ready, {
      type: "update-custom-premise-form",
      position: "major",
      form: "E",
    });
    expect(edited.customPremises).toBeNull();
    expect(edited.customProblemStatus).toBe("editing");
    expect(edited.quizStatus).toBe("not-submitted");
    const cleared = reduceAppState(ready, { type: "clear-custom-problem" });
    expect(cleared.customProblemDraft).toEqual(initial.customProblemDraft);
    expect(cleared.customPremises).toBeNull();
  });

  it("preserves a created custom problem across source changes, locale, and reset", () => {
    const preserved: AppState = {
      ...initial,
      problemSource: "custom",
      customPremises: {
        firstPremise: { form: "A", subject: "animal", predicate: "mortal" },
        secondPremise: { form: "A", subject: "human", predicate: "animal" },
      },
      customProblemStatus: "ready",
    };
    const builtIn = reduceAppState(preserved, {
      type: "set-problem-source",
      source: "built-in",
    });
    const custom = reduceAppState(builtIn, {
      type: "set-problem-source",
      source: "custom",
    });
    expect(custom.customPremises).toEqual(preserved.customPremises);
    expect(reduceAppState(custom, {
      type: "set-locale",
      locale: "en",
    }).customPremises).toEqual(preserved.customPremises);
    expect(reduceAppState(
      { ...custom, phase: "conclusion" },
      { type: "reset" },
    ).customProblemStatus).toBe("ready");
  });

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

  it("accepts initial custom terms and initializes the editor", () => {
    const state = createInitialAppState({
      customTerms: [philosopher],
      customTermPersistenceStatus: "load-error",
    });
    expect(state.customTerms).toEqual([philosopher]);
    expect(state.customTerms).not.toBe([philosopher]);
    expect(state.customTermEditor).toEqual({
      mode: "create",
      editingTermId: null,
      draft: {
        jaNounPhrase: "",
        enSubjectPlural: "",
        enPredicatePhrase: "",
      },
      status: "editing",
    });
    expect(state.customTermPersistenceStatus).toBe("load-error");
  });

  it("updates term drafts and records validation failure", () => {
    const withDraft = reduceAppState(initial, {
      type: "update-custom-term-draft",
      field: "jaNounPhrase",
      value: "哲学者",
    });
    expect(withDraft.customTermEditor.draft.jaNounPhrase).toBe("哲学者");
    const failed = reduceAppState(withDraft, {
      type: "submit-custom-term",
      result: { ok: false, reason: "incomplete" },
    });
    expect(failed.customTerms).toEqual([]);
    expect(failed.customTermEditor.draft.jaNounPhrase).toBe("哲学者");
    expect(failed.customTermEditor.status).toBe("incomplete");
  });

  it("stores create and update results while keeping term references", () => {
    const created = reduceAppState(initial, {
      type: "submit-custom-term",
      result: {
        ok: true,
        operation: "create",
        term: philosopher,
        terms: [philosopher],
      },
    });
    expect(created.customTerms).toEqual([philosopher]);
    expect(created.customTermEditor.status).toBe("created");
    const editing = reduceAppState(created, {
      type: "start-edit-custom-term",
      termId: "custom-term-1",
    });
    expect(editing.customTermEditor).toMatchObject({
      mode: "edit",
      editingTermId: "custom-term-1",
      draft: {
        jaNounPhrase: "哲学者",
        enSubjectPlural: "philosophers",
        enPredicatePhrase: "philosophers",
      },
    });
    const updatedTerm = {
      ...philosopher,
      labels: {
        ...philosopher.labels,
        ja: { nounPhrase: "思想家" },
      },
    };
    const stateWithReferences = {
      ...editing,
      phase: "conclusion" as const,
      problemSource: "custom" as const,
      customProblemDraft: {
        majorPremise: {
          form: "A" as const,
          subjectTermId: "custom-term-1",
          predicateTermId: "human",
        },
        minorPremise: {
          form: "A" as const,
          subjectTermId: "human",
          predicateTermId: "animal",
        },
      },
      customPremises: {
        firstPremise: {
          form: "A" as const,
          subject: "custom-term-1",
          predicate: "human",
        },
        secondPremise: {
          form: "A" as const,
          subject: "human",
          predicate: "animal",
        },
      },
      customProblemStatus: "ready" as const,
      assignmentMode: "quiz" as const,
      quizSelection: {
        S: "custom-term-1",
        M: "human",
        P: "animal",
      },
      quizStatus: "correct" as const,
    };
    const updated = reduceAppState(stateWithReferences, {
      type: "submit-custom-term",
      result: {
        ok: true,
        operation: "update",
        term: updatedTerm,
        terms: [updatedTerm],
      },
    });
    expect(updated.customTerms[0]?.labels.ja.nounPhrase).toBe("思想家");
    expect(updated.customPremises).toBe(stateWithReferences.customPremises);
    expect(updated.quizSelection).toEqual(stateWithReferences.quizSelection);
    expect(updated.phase).toBe("conclusion");
    expect(reduceAppState(updated, {
      type: "cancel-edit-custom-term",
    }).customTermEditor.mode).toBe("create");
  });

  it("clears only references to a deleted in-use term", () => {
    const state: AppState = {
      ...initial,
      phase: "conclusion",
      problemSource: "custom",
      customTerms: [
        philosopher,
        {
          ...philosopher,
          id: "custom-term-2",
          labels: {
            ja: { nounPhrase: "思想家" },
            en: { subjectPlural: "thinkers", predicatePhrase: "thinkers" },
          },
        },
      ],
      customProblemDraft: {
        majorPremise: {
          form: "A",
          subjectTermId: "custom-term-1",
          predicateTermId: "human",
        },
        minorPremise: {
          form: "A",
          subjectTermId: "human",
          predicateTermId: "animal",
        },
      },
      customPremises: {
        firstPremise: {
          form: "A",
          subject: "custom-term-1",
          predicate: "human",
        },
        secondPremise: { form: "A", subject: "human", predicate: "animal" },
      },
      customProblemStatus: "ready",
      assignmentMode: "quiz",
      quizSelection: { S: "custom-term-1", M: "human", P: "animal" },
      quizStatus: "correct",
    };
    const deleted = reduceAppState(state, {
      type: "delete-custom-term",
      termId: "custom-term-1",
    });
    expect(deleted.customTerms.map(({ id }) => id)).toEqual([
      "custom-term-2",
    ]);
    expect(deleted.customProblemDraft.majorPremise.subjectTermId).toBeNull();
    expect(deleted.customProblemDraft.majorPremise.predicateTermId).toBe(
      "human",
    );
    expect(deleted.customPremises).toBeNull();
    expect(deleted.customProblemStatus).toBe("editing");
    expect(deleted.phase).toBe("problem");
    expect(deleted.quizSelection.S).toBeNull();
    expect(deleted.quizStatus).toBe("not-submitted");
  });

  it("does not invalidate a problem for an unrelated deletion", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: "animal", predicate: "mortal" },
      secondPremise: { form: "A" as const, subject: "human", predicate: "animal" },
    };
    const state: AppState = {
      ...initial,
      phase: "conclusion",
      customTerms: [philosopher],
      customPremises: premises,
      customProblemStatus: "ready",
    };
    const deleted = reduceAppState(state, {
      type: "delete-custom-term",
      termId: "custom-term-1",
    });
    expect(deleted.customPremises).toBe(premises);
    expect(deleted.phase).toBe("conclusion");
  });

  it("updates only persistence status and preserves terms across navigation", () => {
    const state = { ...initial, customTerms: [philosopher] };
    const failed = reduceAppState(state, {
      type: "set-custom-term-persistence-status",
      status: "save-error",
    });
    expect(failed).toEqual({
      ...state,
      customTermPersistenceStatus: "save-error",
    });
    expect(reduceAppState(failed, {
      type: "set-locale",
      locale: "en",
    }).customTerms).toEqual([philosopher]);
    expect(reduceAppState(failed, { type: "reset" }).customTerms)
      .toEqual([philosopher]);
  });

  it("initializes and resets manual counter practice independently", () => {
    const manual = reduceAppState(initial, {
      type: "set-counter-placement-mode",
      mode: "manual",
    });
    expect(manual.phase).toBe("problem");
    expect(manual.counterPractice).toEqual({
      mode: "manual",
      selectedTool: "emptiness",
      firstPremise: { placements: [], check: { kind: "not-checked" } },
      combinedPremises: { placements: [], check: { kind: "not-checked" } },
      conclusion: { placements: [], check: { kind: "not-checked" } },
    });
    expect(manual.locale).toBe(initial.locale);
    expect(manual.problemId).toBe(initial.problemId);
  });

  it("applies the selected tool only to the current manual phase", () => {
    let state = reduceAppState(initial, {
      type: "set-counter-placement-mode",
      mode: "manual",
    });
    state = reduceAppState(state, { type: "next" });
    state = reduceAppState(state, {
      type: "set-counter-tool",
      tool: "existence",
    });
    state = reduceAppState(state, {
      type: "apply-triliteral-counter-tool",
      phase: "first-premise",
      anchor: { type: "cell", cell: "SMP" },
    });
    expect(state.counterPractice.firstPremise.placements).toEqual([{
      kind: "existence",
      anchor: { type: "cell", cell: "SMP" },
    }]);
    expect(state.counterPractice.combinedPremises.placements).toEqual([]);
    expect(reduceAppState(state, {
      type: "apply-triliteral-counter-tool",
      phase: "combined-premises",
      anchor: { type: "cell", cell: "SMp" },
    })).toBe(state);
  });

  it("blocks manual progression until the current attempt is correct", () => {
    const problem = reduceAppState(initial, {
      type: "set-counter-placement-mode",
      mode: "manual",
    });
    const first = reduceAppState(problem, { type: "next" });
    expect(first.phase).toBe("first-premise");
    expect(reduceAppState(first, { type: "next" })).toBe(first);
    const incorrect = reduceAppState(first, {
      type: "submit-counter-attempt",
      phase: "first-premise",
      validation: {
        ok: false,
        summary: { missingCount: 1, extraCount: 0, wrongKindCount: 0 },
      },
    });
    expect(incorrect.counterPractice.firstPremise.check).toEqual({
      kind: "incorrect",
      summary: { missingCount: 1, extraCount: 0, wrongKindCount: 0 },
    });
    const correct = reduceAppState(incorrect, {
      type: "submit-counter-attempt",
      phase: "first-premise",
      validation: { ok: true },
    });
    expect(reduceAppState(correct, { type: "next" }).phase).toBe(
      "combined-premises",
    );
  });

  it("keeps attempts across locale and previous but clears logical changes", () => {
    let state = reduceAppState(initial, {
      type: "set-counter-placement-mode",
      mode: "manual",
    });
    state = reduceAppState(state, { type: "next" });
    state = reduceAppState(state, {
      type: "apply-triliteral-counter-tool",
      phase: "first-premise",
      anchor: { type: "cell", cell: "SMp" },
    });
    expect(reduceAppState(state, {
      type: "set-locale",
      locale: "en",
    }).counterPractice).toEqual(state.counterPractice);
    expect(reduceAppState(state, {
      type: "previous",
    }).counterPractice).toEqual(state.counterPractice);
    expect(reduceAppState(state, {
      type: "select-problem",
      problemId: "darii-aii1",
    }).counterPractice.firstPremise.placements).toEqual([]);
  });

  it("initializes and restarts conclusion quiz while preserving settings", () => {
    const manual = {
      ...initial,
      locale: "en" as const,
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual" as const,
        firstPremise: {
          placements: [{
            kind: "emptiness" as const,
            anchor: { type: "cell" as const, cell: "SMp" as const },
          }],
          check: { kind: "correct" as const },
        },
      },
    };
    const quiz = reduceAppState(manual, {
      type: "set-conclusion-answer-mode",
      mode: "quiz",
    });
    expect(quiz.phase).toBe("problem");
    expect(quiz.locale).toBe("en");
    expect(quiz.counterPractice.mode).toBe("manual");
    expect(quiz.counterPractice.firstPremise.placements).toEqual([]);
    expect(quiz.conclusionQuiz).toEqual({
      mode: "quiz",
      selectedAnswer: null,
      check: { kind: "not-checked" },
    });
  });

  it("selects and checks a conclusion only in quiz conclusion phase", () => {
    const quiz = {
      ...initial,
      phase: "conclusion" as const,
      conclusionQuiz: {
        mode: "quiz" as const,
        selectedAnswer: null,
        check: { kind: "not-checked" as const },
      },
    };
    const selected = reduceAppState(quiz, {
      type: "select-conclusion-answer",
      answer: "A",
    });
    expect(selected.conclusionQuiz.selectedAnswer).toBe("A");
    expect(reduceAppState(selected, {
      type: "submit-conclusion-answer",
      validation: { ok: false, reason: "incorrect" },
    }).conclusionQuiz.check).toEqual({ kind: "incorrect" });
    const correct = reduceAppState(selected, {
      type: "submit-conclusion-answer",
      validation: { ok: true },
    });
    expect(correct.conclusionQuiz.check).toEqual({ kind: "correct" });
    expect(reduceAppState(correct, {
      type: "select-conclusion-answer",
      answer: "E",
    }).conclusionQuiz.check).toEqual({ kind: "not-checked" });
    expect(reduceAppState({
      ...quiz,
      phase: "combined-premises",
    }, {
      type: "select-conclusion-answer",
      answer: "A",
    })).toEqual({ ...quiz, phase: "combined-premises" });
  });

  it("locks manual conclusion counters until the conclusion is correct", () => {
    const locked = {
      ...initial,
      phase: "conclusion" as const,
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual" as const,
      },
      conclusionQuiz: {
        mode: "quiz" as const,
        selectedAnswer: "A" as const,
        check: { kind: "incorrect" as const },
      },
    };
    const action = {
      type: "apply-biliteral-counter-tool" as const,
      phase: "conclusion" as const,
      anchor: { type: "cell" as const, cell: "SP" as const },
    };
    expect(reduceAppState(locked, action)).toBe(locked);
    const unlocked = {
      ...locked,
      conclusionQuiz: {
        ...locked.conclusionQuiz,
        check: { kind: "correct" as const },
      },
    };
    expect(reduceAppState(unlocked, action).counterPractice.conclusion.placements)
      .toEqual([{
        kind: "emptiness",
        anchor: { type: "cell", cell: "SP" },
      }]);
  });

  it("preserves conclusion answers for locale and previous, resets for problem changes", () => {
    const answered = {
      ...initial,
      phase: "conclusion" as const,
      conclusionQuiz: {
        mode: "quiz" as const,
        selectedAnswer: "A" as const,
        check: { kind: "correct" as const },
      },
    };
    expect(reduceAppState(answered, {
      type: "set-locale",
      locale: "en",
    }).conclusionQuiz).toEqual(answered.conclusionQuiz);
    expect(reduceAppState(answered, {
      type: "previous",
    }).conclusionQuiz).toEqual(answered.conclusionQuiz);
    expect(reduceAppState(answered, {
      type: "select-problem",
      problemId: "darii-aii1",
    }).conclusionQuiz).toEqual({
      mode: "quiz",
      selectedAnswer: null,
      check: { kind: "not-checked" },
    });
  });

  it("loads, opens, edits, and deletes saved custom problems", () => {
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
    let state = createInitialAppState({ savedCustomProblems: [problem] });
    expect(state.savedCustomProblems).toEqual([problem]);
    state = reduceAppState(state, {
      type: "open-saved-custom-problem",
      problemId: "custom-problem-1",
    });
    expect(state.problemSource).toBe("custom");
    expect(state.customProblemStatus).toBe("ready");
    expect(state.customProblemDraft.majorPremise).toEqual({
      form: "A",
      subjectTermId: "animal",
      predicateTermId: "mortal",
    });
    state = reduceAppState(state, {
      type: "start-edit-saved-custom-problem",
      problemId: "custom-problem-1",
    });
    expect(state.savedCustomProblemEditor).toMatchObject({
      mode: "edit",
      editingProblemId: "custom-problem-1",
      draft: { title: "Saved Barbara" },
    });
    const canceled = reduceAppState(state, {
      type: "cancel-edit-saved-custom-problem",
    });
    expect(canceled.savedCustomProblemEditor.mode).toBe("create");
    expect(canceled.customPremises).toBe(problem.premises);
    const deleted = reduceAppState(canceled, {
      type: "delete-saved-custom-problem",
      problemId: "custom-problem-1",
    });
    expect(deleted.savedCustomProblems).toEqual([]);
    expect(deleted.customPremises).toBe(problem.premises);
  });

  it("handles saved problem title and create results without resetting answers", () => {
    const titled = reduceAppState(initial, {
      type: "update-saved-custom-problem-title",
      value: "Draft name",
    });
    expect(titled.savedCustomProblemEditor.draft.title).toBe("Draft name");
    const problem = {
      id: "custom-problem-1" as const,
      title: "Draft name",
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
    const answered = {
      ...titled,
      conclusionQuiz: {
        mode: "quiz" as const,
        selectedAnswer: "A" as const,
        check: { kind: "correct" as const },
      },
    };
    const saved = reduceAppState(answered, {
      type: "submit-saved-custom-problem",
      result: {
        ok: true,
        operation: "create",
        problem,
        problems: [problem],
      },
    });
    expect(saved.savedCustomProblems).toEqual([problem]);
    expect(saved.savedCustomProblemEditor.status).toBe("created");
    expect(saved.conclusionQuiz).toEqual(answered.conclusionQuiz);
  });

  it("rejects deleting a term used by a saved problem without other changes", () => {
    const state = {
      ...initial,
      phase: "conclusion" as const,
      customTerms: [philosopher],
    };
    const rejected = reduceAppState(state, {
      type: "reject-custom-term-deletion",
      reason: "term-in-use-by-saved-problem",
    });
    expect(rejected.customTermEditor.status).toBe(
      "term-in-use-by-saved-problem",
    );
    expect({ ...rejected, customTermEditor: state.customTermEditor }).toEqual(
      state,
    );
  });

  it("prepares, cancels, and atomically applies imported user data", () => {
    const content = {
      customTerms: [philosopher],
      savedCustomProblems: [{
        id: "custom-problem-1" as const,
        title: "Imported",
        premises: {
          firstPremise: { form: "A" as const, subject: "human", predicate: "animal" },
          secondPremise: { form: "A" as const, subject: "custom-term-1", predicate: "human" },
        },
      }],
    };
    const reading = reduceAppState(initial, {
      type: "begin-data-import",
      fileName: "backup.json",
    });
    expect(reading.dataImport).toEqual({
      status: "reading",
      fileName: "backup.json",
      pending: null,
    });
    const ready = reduceAppState(reading, {
      type: "complete-data-import-preparation",
      fileName: "backup.json",
      result: {
        ok: true,
        content,
        summary: { customTermCount: 1, savedCustomProblemCount: 1 },
      },
    });
    expect(ready.dataImport.pending).toMatchObject({
      fileName: "backup.json",
      customTermCount: 1,
      savedCustomProblemCount: 1,
    });
    expect(reduceAppState(ready, { type: "cancel-data-import" }).customTerms)
      .toEqual(initial.customTerms);
    const applied = reduceAppState({
      ...ready,
      locale: "en",
      problemSource: "custom",
      phase: "conclusion",
      assignmentMode: "quiz",
      counterPractice: { ...ready.counterPractice, mode: "manual" },
      conclusionQuiz: { ...ready.conclusionQuiz, mode: "quiz" },
    }, { type: "apply-pending-data-import" });
    expect(applied.customTerms).toEqual([philosopher]);
    expect(applied.savedCustomProblems).toEqual(content.savedCustomProblems);
    expect(applied).toMatchObject({
      locale: "en",
      phase: "problem",
      problemSource: "built-in",
      assignmentMode: "quiz",
      customPremises: null,
      customProblemStatus: "editing",
    });
    expect(applied.counterPractice.mode).toBe("manual");
    expect(applied.conclusionQuiz.mode).toBe("quiz");
    expect(applied.dataImport.status).toBe("applied");
  });

  it("keeps imported memory data when one persistence write fails", () => {
    const state = {
      ...initial,
      customTerms: [philosopher],
      dataImport: {
        status: "applied" as const,
        fileName: "backup.json",
        pending: null,
      },
    };
    const result = reduceAppState(state, {
      type: "complete-import-persistence",
      customTermsSaved: true,
      savedCustomProblemsSaved: false,
    });
    expect(result.customTerms).toEqual([philosopher]);
    expect(result.dataImport.status).toBe("applied-with-save-error");
    expect(result.customTermPersistenceStatus).toBe("ready");
    expect(result.savedCustomProblemPersistenceStatus).toBe("save-error");
  });
});

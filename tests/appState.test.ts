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

  it("does not require a term-assignment quiz before advancing", () => {
    expect(reduceAppState(initial, { type: "next" }).phase)
      .toBe("first-premise");
    expect("assignmentMode" in initial).toBe(false);
    expect("quizSelection" in initial).toBe(false);
    expect("quizStatus" in initial).toBe(false);
  });

  it("starts with the built-in source and an empty custom draft", () => {
    expect(initial.problemSource).toBe("built-in");
    expect(initial.conclusionQuiz).toEqual({
      mode: "automatic",
      answers: [],
      check: { kind: "not-checked" },
    });
    expect(initial.customProblemDraft).toEqual({
      majorPremise: {
        form: null,
        subjectTermId: null, subjectComplemented: false,
        predicateTermId: null, predicateComplemented: false,
      },
      minorPremise: {
        form: null,
        subjectTermId: null, subjectComplemented: false,
        predicateTermId: null, predicateComplemented: false,
      },
    });
    expect(initial.customPremises).toBeNull();
    expect(initial.customProblemStatus).toBe("editing");
  });

  it("switches sources while preserving custom input", () => {
    const custom = {
      ...initial,
      phase: "conclusion" as const,
      customProblemDraft: {
        ...initial.customProblemDraft,
        majorPremise: {
          form: "A" as const,
          subjectTermId: "animal" as const, subjectComplemented: false,
          predicateTermId: null, predicateComplemented: false,
        },
      },
    };
    const selected = reduceAppState(custom, {
      type: "set-problem-source",
      source: "custom",
    });
    expect(selected.problemSource).toBe("custom");
    expect(selected.phase).toBe("problem");
    expect(selected.customProblemDraft).toEqual(custom.customProblemDraft);
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
    state = reduceAppState(state, {
      type: "update-custom-premise-complement",
      position: "minor",
      field: "subjectComplemented",
      complemented: true,
    });
    expect(state.customProblemDraft.minorPremise.subjectComplemented).toBe(true);
    expect(state.customProblemDraft.minorPremise.predicateComplemented).toBe(false);
    expect(state.customProblemStatus).toBe("editing");
  });

  it("stores successful custom premises and blocks or allows next", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: { termId: "animal", complemented: false }, predicate: { termId: "mortal", complemented: false } },
      secondPremise: { form: "A" as const, subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
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
      firstPremise: { form: "A" as const, subject: { termId: "animal", complemented: false }, predicate: { termId: "mortal", complemented: false } },
      secondPremise: { form: "A" as const, subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
    };
    const ready: AppState = {
      ...initial,
      problemSource: "custom",
      customPremises: premises,
      acceptedCustomPremises: premises,
      customProblemStatus: "ready",
    };
    const edited = reduceAppState(ready, {
      type: "update-custom-premise-form",
      position: "major",
      form: "E",
    });
    expect(edited.customPremises).toBeNull();
    expect(edited.acceptedCustomPremises).toEqual(premises);
    expect(edited.customProblemStatus).toBe("editing");
    const reset = reduceAppState(edited, { type: "reset" });
    expect(reset.customProblemDraft).toEqual({
      majorPremise: {
        form: "A",
        subjectTermId: "animal",
        subjectComplemented: false,
        predicateTermId: "mortal",
        predicateComplemented: false,
      },
      minorPremise: {
        form: "A",
        subjectTermId: "human",
        subjectComplemented: false,
        predicateTermId: "animal",
        predicateComplemented: false,
      },
    });
    expect(reset.customProblemStatus).toBe("ready");
    const cleared = reduceAppState(ready, { type: "clear-custom-problem" });
    expect(cleared.customProblemDraft).toEqual(initial.customProblemDraft);
    expect(cleared.customPremises).toBeNull();
  });

  it("restores the accepted problem after every premise form or complement edit", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: { termId: "animal", complemented: false }, predicate: { termId: "mortal", complemented: false } },
      secondPremise: { form: "A" as const, subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
    };
    const acceptedDraft = {
      majorPremise: {
        form: "A" as const,
        subjectTermId: "animal" as const,
        subjectComplemented: false,
        predicateTermId: "mortal" as const,
        predicateComplemented: false,
      },
      minorPremise: {
        form: "A" as const,
        subjectTermId: "human" as const,
        subjectComplemented: false,
        predicateTermId: "animal" as const,
        predicateComplemented: false,
      },
    };
    const ready: AppState = {
      ...initial,
      phase: "conclusion",
      problemSource: "custom",
      customPremises: premises,
      acceptedCustomPremises: premises,
      customProblemStatus: "ready",
    };
    for (const position of ["major", "minor"] as const) {
      for (const form of ["A", "E", "I", "O"] as const) {
        const edited = reduceAppState(ready, {
          type: "update-custom-premise-form",
          position,
          form,
        });
        expect(edited.phase, `${position} ${form} edit phase`).toBe("problem");
        expect(edited.customPremises, `${position} ${form} active premises`).toBeNull();
        const reset = reduceAppState(edited, { type: "reset" });
        expect(reset.customProblemStatus, `${position} ${form} reset status`).toBe("ready");
        expect(reset.customPremises, `${position} ${form} reset premises`).toEqual(premises);
        expect(reset.customProblemDraft, `${position} ${form} reset draft`)
          .toEqual(acceptedDraft);
      }
      for (const field of ["subjectComplemented", "predicateComplemented"] as const) {
        const edited = reduceAppState(ready, {
          type: "update-custom-premise-complement",
          position,
          field,
          complemented: true,
        });
        const reset = reduceAppState(edited, { type: "reset" });
        expect(reset.customPremises, `${position} ${field} reset premises`).toEqual(premises);
        expect(reset.customProblemStatus, `${position} ${field} reset status`).toBe("ready");
      }
    }
    const termEdited = reduceAppState(ready, {
      type: "update-custom-premise-term",
      position: "major",
      field: "subjectTermId",
      termId: "cat",
    });
    const termReset = reduceAppState(termEdited, { type: "reset" });
    expect(termReset.customProblemDraft).toEqual(acceptedDraft);
    expect(termReset.customPremises).toEqual(premises);
  });

  it("preserves a created custom problem across source changes, locale, and reset", () => {
    const preserved: AppState = {
      ...initial,
      problemSource: "custom",
      customPremises: {
        firstPremise: { form: "A", subject: { termId: "animal", complemented: false }, predicate: { termId: "mortal", complemented: false } },
        secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
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

  it("switches screens without changing game or editor state", () => {
    const state = {
      ...createInitialAppState(),
      phase: "conclusion" as const,
      problemSource: "custom" as const,
      customTermEditor: {
        mode: "edit" as const,
        editingTermId: "custom-term-1" as const,
        draft: { jaNounPhrase: "入力途中", enSubjectPlural: "",
          enPredicatePhrase: "" },
        status: "editing" as const,
      },
    };
    expect(state.screen).toBe("game");
    const opened = reduceAppState(state, {
      type: "open-custom-term-management",
    });
    expect(opened.screen).toBe("custom-term-management");
    expect({ ...opened, screen: state.screen }).toEqual(state);
    const closed = reduceAppState(opened, {
      type: "close-custom-term-management",
    });
    expect(closed).toEqual(state);
    expect(closed.customTermEditor).toBe(state.customTermEditor);
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
      result: { ok: false, reason: "japanese-required" },
    });
    expect(failed.customTerms).toEqual([]);
    expect(failed.customTermEditor.draft.jaNounPhrase).toBe("哲学者");
    expect(failed.customTermEditor.status).toBe("japanese-required");
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
          subjectTermId: "custom-term-1", subjectComplemented: false,
          predicateTermId: "human", predicateComplemented: false,
        },
        minorPremise: {
          form: "A" as const,
          subjectTermId: "human", subjectComplemented: false,
          predicateTermId: "animal", predicateComplemented: false,
        },
      },
      customPremises: {
        firstPremise: {
          form: "A" as const,
          subject: { termId: "custom-term-1", complemented: false },
          predicate: { termId: "human", complemented: false },
        },
        secondPremise: {
          form: "A" as const,
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: false },
        },
      },
      customProblemStatus: "ready" as const,
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
    expect(updated.customTerms[0]?.labels.ja?.nounPhrase).toBe("思想家");
    expect(updated.customPremises).toBe(stateWithReferences.customPremises);
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
          subjectTermId: "custom-term-1", subjectComplemented: false,
          predicateTermId: "human", predicateComplemented: false,
        },
        minorPremise: {
          form: "A",
          subjectTermId: "human", subjectComplemented: false,
          predicateTermId: "animal", predicateComplemented: false,
        },
      },
      customPremises: {
        firstPremise: {
          form: "A",
          subject: { termId: "custom-term-1", complemented: false },
          predicate: { termId: "human", complemented: false },
        },
        secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
      },
      customProblemStatus: "ready",
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
  });

  it("does not invalidate a problem for an unrelated deletion", () => {
    const premises = {
      firstPremise: { form: "A" as const, subject: { termId: "animal", complemented: false }, predicate: { termId: "mortal", complemented: false } },
      secondPremise: { form: "A" as const, subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
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

  it("inherits first-premise counters, locks O, keeps I editable, and resets to the inherited board", () => {
    const inherited = [
      { kind: "emptiness" as const, anchor: { type: "cell" as const, cell: "SMp" as const } },
      { kind: "emptiness" as const, anchor: { type: "cell" as const, cell: "sMp" as const } },
      {
        kind: "existence" as const,
        anchor: {
          type: "boundary" as const,
          partitionRole: "S" as const,
          cells: ["SMP", "sMP"] as const,
        },
      },
    ];
    const first = {
      ...initial,
      phase: "first-premise" as const,
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual" as const,
        firstPremise: { placements: inherited, check: { kind: "correct" as const } },
      },
    };
    const combined = reduceAppState(first, {
      type: "next",
      firstPremisePlacements: inherited,
    });
    expect(combined.phase).toBe("combined-premises");
    expect(combined.counterPractice.combinedPremises.placements).toEqual(inherited);

    for (const tool of ["emptiness", "existence", "erase"] as const) {
      const selected = reduceAppState(combined, { type: "set-counter-tool", tool });
      expect(reduceAppState(selected, {
        type: "apply-triliteral-counter-tool",
        phase: "combined-premises",
        anchor: { type: "cell", cell: "SMp" },
      })).toBe(selected);
    }

    const erase = reduceAppState(combined, { type: "set-counter-tool", tool: "erase" });
    const withoutI = reduceAppState(erase, {
      type: "apply-triliteral-counter-tool",
      phase: "combined-premises",
      anchor: inherited[2]!.anchor,
    });
    expect(withoutI.counterPractice.combinedPremises.placements).toHaveLength(2);
    const reset = reduceAppState(withoutI, {
      type: "clear-counter-attempt",
      phase: "combined-premises",
    });
    expect(reset.counterPractice.combinedPremises.placements).toEqual(inherited);
  });

  it.each([
    {
      name: "O only",
      placement: {
        kind: "emptiness" as const,
        anchor: { type: "cell" as const, cell: "SMp" as const },
      },
      editable: false,
    },
    {
      name: "I only",
      placement: {
        kind: "existence" as const,
        anchor: { type: "cell" as const, cell: "SMP" as const },
      },
      editable: true,
    },
  ])("inherits $name first-premise boards with the expected editability", ({
    placement,
    editable,
  }) => {
    const inherited = [placement];
    const combined = reduceAppState({
      ...initial,
      phase: "first-premise",
      counterPractice: {
        ...initial.counterPractice,
        mode: "manual",
        selectedTool: "erase",
        firstPremise: { placements: inherited, check: { kind: "correct" } },
      },
    }, { type: "next", firstPremisePlacements: inherited });
    const changed = reduceAppState(combined, {
      type: "apply-triliteral-counter-tool",
      phase: "combined-premises",
      anchor: placement.anchor,
    });
    expect(changed.counterPractice.combinedPremises.placements).toHaveLength(
      editable ? 0 : 1,
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

  it("selects and checks a conclusion in quiz mode for either problem source", () => {
    const quiz = {
      ...initial,
      phase: "combined-premises" as const,
      conclusionQuiz: {
        mode: "quiz" as const,
        answers: [],
        check: { kind: "not-checked" as const },
      },
    };
    const selected = reduceAppState(quiz, {
      type: "select-conclusion-answer", questionIndex: 0, answer: "A",
    });
    expect(selected.conclusionQuiz.answers[0]).toBe("A");
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
      type: "select-conclusion-answer", questionIndex: 0, answer: "E",
    }).conclusionQuiz.check).toEqual({ kind: "not-checked" });
    expect(reduceAppState({
      ...quiz,
      phase: "conclusion",
    }, {
      type: "select-conclusion-answer", questionIndex: 0, answer: "A",
    })).toEqual({ ...quiz, phase: "conclusion" });
    expect(reduceAppState({ ...quiz, problemSource: "custom" }, {
      type: "select-conclusion-answer", questionIndex: 0, answer: "A",
    }).conclusionQuiz.answers[0]).toBe("A");
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
        answers: ["A"] as const,
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

    const customQuiz = { ...locked, problemSource: "custom" as const };
    expect(reduceAppState(customQuiz, action)).toBe(customQuiz);
    const automatic = {
      ...locked,
      problemSource: "custom" as const,
      conclusionQuiz: { ...locked.conclusionQuiz, mode: "automatic" as const },
    };
    expect(reduceAppState(automatic, action).counterPractice.conclusion.placements)
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
        answers: ["A"] as const,
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
      answers: [],
      check: { kind: "not-checked" },
    });
  });

  it("changes conclusion mode without changing game state and resets its answer", () => {
    const answered = {
      ...initial,
      phase: "combined-premises" as const,
      conclusionQuiz: {
        mode: "quiz" as const,
        answers: ["E"] as const,
        check: { kind: "incorrect" as const },
      },
    };
    const changed = reduceAppState(answered, {
      type: "set-conclusion-answer-mode",
      mode: "automatic",
    });
    expect(changed.conclusionQuiz).toEqual({
      mode: "automatic",
      answers: [],
      check: { kind: "not-checked" },
    });
    expect({ ...changed, conclusionQuiz: answered.conclusionQuiz })
      .toEqual(answered);
    expect(answered.conclusionQuiz.answers[0]).toBe("E");
  });

  it("enters conclusion automatically or only after a correct quiz answer", () => {
    const combined = { ...initial, phase: "combined-premises" as const };
    expect(reduceAppState(combined, { type: "next" }).phase).toBe("conclusion");
    const quiz = reduceAppState(combined, {
      type: "set-conclusion-answer-mode",
      mode: "quiz",
    });
    expect(reduceAppState(quiz, { type: "next" }).phase)
      .toBe("combined-premises");
    const incorrect = {
      ...quiz,
      conclusionQuiz: {
        ...quiz.conclusionQuiz,
        check: { kind: "incorrect" as const },
      },
    };
    expect(reduceAppState(incorrect, { type: "next" }).phase)
      .toBe("combined-premises");
    const correct = {
      ...quiz,
      conclusionQuiz: {
        ...quiz.conclusionQuiz,
        check: { kind: "correct" as const },
      },
    };
    expect(reduceAppState(correct, { type: "next" }).phase)
      .toBe("conclusion");
    const automaticConclusion = { ...initial, phase: "conclusion" as const };
    expect(reduceAppState(automaticConclusion, {
      type: "select-conclusion-answer", questionIndex: 0, answer: "A",
    })).toBe(automaticConclusion);
    expect(reduceAppState(automaticConclusion, {
      type: "submit-conclusion-answer",
      validation: { ok: true },
    })).toBe(automaticConclusion);
  });

  it("ignores conclusion answers until manual combined placement is correct", () => {
    const unfinished = {
      ...initial,
      phase: "combined-premises" as const,
      counterPractice: { ...initial.counterPractice, mode: "manual" as const },
      conclusionQuiz: {
        mode: "quiz" as const,
        answers: [],
        check: { kind: "not-checked" as const },
      },
    };
    expect(reduceAppState(unfinished, {
      type: "select-conclusion-answer", questionIndex: 0, answer: "A",
    })).toBe(unfinished);
  });

  it("loads, opens, edits, and deletes saved custom problems", () => {
    const problem = {
      id: "custom-problem-1" as const,
      title: "Saved Barbara",
      premises: {
        firstPremise: {
          form: "A" as const,
          subject: { termId: "animal", complemented: false },
          predicate: { termId: "mortal", complemented: false },
        },
        secondPremise: {
          form: "A" as const,
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: false },
        },
      },
    };
    let state = createInitialAppState({ savedCustomProblems: [problem] });
    expect(state.savedCustomProblems).toEqual([problem]);
    state = reduceAppState(state, {
      type: "set-conclusion-answer-mode",
      mode: "quiz",
    });
    state = reduceAppState(state, {
      type: "open-saved-custom-problem",
      problemId: "custom-problem-1",
    });
    expect(state.problemSource).toBe("custom");
    expect(state.conclusionQuiz).toEqual({
      mode: "quiz",
      answers: [],
      check: { kind: "not-checked" },
    });
    expect(state.customProblemStatus).toBe("ready");
    expect(state.customProblemDraft.majorPremise).toEqual({
      form: "A",
      subjectTermId: "animal", subjectComplemented: false,
      predicateTermId: "mortal", predicateComplemented: false,
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
          subject: { termId: "animal", complemented: false },
          predicate: { termId: "mortal", complemented: false },
        },
        secondPremise: {
          form: "A" as const,
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: false },
        },
      },
    };
    const answered = {
      ...titled,
      conclusionQuiz: {
        mode: "quiz" as const,
        answers: ["A"] as const,
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
          firstPremise: { form: "A" as const, subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
          secondPremise: { form: "A" as const, subject: { termId: "custom-term-1", complemented: false }, predicate: { termId: "human", complemented: false } },
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
      counterPractice: { ...ready.counterPractice, mode: "manual" },
    }, { type: "apply-pending-data-import" });
    expect(applied.customTerms).toEqual([philosopher]);
    expect(applied.savedCustomProblems).toEqual(content.savedCustomProblems);
    expect(applied).toMatchObject({
      locale: "en",
      phase: "problem",
      problemSource: "built-in",
      customPremises: null,
      customProblemStatus: "editing",
    });
    expect(applied.counterPractice.mode).toBe("manual");
    expect(applied.dataImport.status).toBe("applied");
  });

  it("keeps current memory data when backup persistence fails", () => {
    const state = {
      ...initial,
      customTerms: [philosopher],
      dataImport: {
        status: "ready" as const,
        fileName: "backup.json",
        pending: {
          fileName: "backup.json",
          content: { customTerms: [], savedCustomProblems: [] },
          customTermCount: 0,
          savedCustomProblemCount: 0,
        },
      },
    };
    const result = reduceAppState(state, {
      type: "reject-data-import-persistence",
    });
    expect(result.customTerms).toEqual([philosopher]);
    expect(result.dataImport.status).toBe("save-error");
    expect(result.dataImport.pending).not.toBeNull();
  });
});

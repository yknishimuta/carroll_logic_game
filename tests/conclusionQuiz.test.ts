import { describe, expect, it } from "vitest";
import {
  canEnterConclusion,
  createInitialConclusionQuizState,
  deriveConclusionQuizQuestions,
  isConclusionQuizAnswer,
  isConclusionAnswerMode,
  isConclusionDiagramUnlocked,
  isCombinedPremisesReady,
  shouldShowConclusionQuiz,
  selectConclusionQuizAnswer,
  validateConclusionQuizAnswers,
} from "../src/app/conclusionQuiz";
import { computeProblem } from "../src/app/problemComputation";
import { getBuiltInProblem } from "../src/data/problems";

describe("conclusion quiz", () => {
  it("validates modes and centralizes diagram unlocking", () => {
    expect(isConclusionAnswerMode("automatic")).toBe(true);
    expect(isConclusionAnswerMode("quiz")).toBe(true);
    expect(isConclusionAnswerMode("other")).toBe(false);
    expect(isConclusionDiagramUnlocked("automatic", { kind: "not-checked" }))
      .toBe(true);
    expect(isConclusionDiagramUnlocked("quiz", { kind: "incorrect" }))
      .toBe(false);
    expect(isConclusionDiagramUnlocked("quiz", { kind: "correct" }))
      .toBe(true);
  });

  it.each([
    [false, "automatic", "not-checked", false],
    [true, "automatic", "not-checked", true],
    [false, "quiz", "not-checked", false],
    [true, "quiz", "not-checked", false],
    [true, "quiz", "incorrect", false],
    [true, "quiz", "correct", true],
  ] as const)(
    "enters conclusion ready=%s mode=%s check=%s as %s",
    (combinedPremisesReady, conclusionMode, kind, expected) => {
      expect(canEnterConclusion({
        combinedPremisesReady,
        conclusionMode,
        conclusionCheck: kind === "incorrect"
          ? { kind: "incorrect" }
          : kind === "correct" ? { kind: "correct" } : { kind: "not-checked" },
      })).toBe(expected);
    },
  );

  it("shows a combined-premises quiz only after placement is ready", () => {
    expect(isCombinedPremisesReady("automatic", { kind: "not-checked" }))
      .toBe(true);
    expect(isCombinedPremisesReady("manual", { kind: "not-checked" }))
      .toBe(false);
    expect(isCombinedPremisesReady("manual", { kind: "correct" }))
      .toBe(true);
    expect(shouldShowConclusionQuiz("combined-premises", "quiz", true))
      .toBe(true);
    expect(shouldShowConclusionQuiz("conclusion", "quiz", true)).toBe(false);
  });
  it.each([
    ["A", true],
    ["E", true],
    ["I", true],
    ["O", true],
    ["none", true],
    ["", false],
    ["X", false],
  ])("validates conclusion choice %s", (value, expected) => {
    expect(isConclusionQuizAnswer(value)).toBe(expected);
  });

  it("creates independent initial states", () => {
    const first = createInitialConclusionQuizState();
    const second = createInitialConclusionQuizState();
    expect(first).toEqual({
      mode: "automatic",
      answers: [],
      check: { kind: "not-checked" },
    });
    expect(first).not.toBe(second);
    expect(first.check).not.toBe(second.check);
  });

  it("derives one signed question for Barbara from CompleteConclusion", () => {
    const problem = getBuiltInProblem("barbara-aaa1");
    const computation = computeProblem(problem);
    const questions = deriveConclusionQuizQuestions(
      computation.completeConclusion,
    );
    expect(questions).toEqual([{
      proposition: {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      expectedAnswer: "A",
    }]);
    expect(validateConclusionQuizAnswers(["A"], questions))
      .toEqual({ ok: true });
    expect(validateConclusionQuizAnswers(["I"], questions))
      .toEqual({ ok: false, reason: "incorrect" });
  });

  it("uses one no-conclusion question for null", () => {
    const questions = deriveConclusionQuizQuestions(null);
    expect(questions).toEqual([{ proposition: null, expectedAnswer: "none" }]);
    expect(validateConclusionQuizAnswers(["none"], questions))
      .toEqual({ ok: true });
  });

  it("rejects a non-null complete conclusion without propositions", () => {
    expect(() => deriveConclusionQuizQuestions({
      biliteralState: { emptyCells: [], existentials: [] },
      propositions: [],
    })).toThrow(/must contain a proposition/);
  });

  it("requires every CompleteConclusion question to be answered", () => {
    const completeConclusion = computeProblem({
      id: "multiple",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "y", complemented: true },
          predicate: { termId: "m", complemented: true },
        },
        secondPremise: {
          form: "A",
          subject: { termId: "x", complemented: false },
          predicate: { termId: "m", complemented: false },
        },
      },
    }).completeConclusion;
    const questions = deriveConclusionQuizQuestions(completeConclusion);
    expect(questions).toHaveLength(2);
    expect(validateConclusionQuizAnswers(["A"], questions))
      .toEqual({ ok: false, reason: "incomplete" });
    expect(validateConclusionQuizAnswers(["A", "A"], questions))
      .toEqual({ ok: true });
  });

  it("resets the check after changing an answer without mutation", () => {
    const frozen = Object.freeze({
      mode: "quiz" as const,
      answers: ["A"] as const,
      check: Object.freeze({ kind: "correct" as const }),
    });
    expect(selectConclusionQuizAnswer(frozen, 0, "E")).toEqual({
      mode: "quiz",
      answers: ["E"],
      check: { kind: "not-checked" },
    });
    expect(frozen.answers[0]).toBe("A");
  });

  it("does not disclose the expected answer in failures and is deterministic", () => {
    const questions = deriveConclusionQuizQuestions(
      computeProblem(getBuiltInProblem("barbara-aaa1")).completeConclusion,
    );
    const first = validateConclusionQuizAnswers(["E"], questions);
    const second = validateConclusionQuizAnswers(["E"], questions);
    expect(first).toEqual(second);
    expect(Object.keys(first)).toEqual(["ok", "reason"]);
    expect(questions[0]?.expectedAnswer).toBe("A");
  });
});

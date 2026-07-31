import { describe, expect, it } from "vitest";
import {
  canEnterConclusion,
  createInitialConclusionQuizState,
  deriveExpectedConclusionAnswer,
  isConclusionAnswerChoice,
  isConclusionAnswerMode,
  isConclusionDiagramUnlocked,
  isCombinedPremisesReady,
  shouldShowConclusionQuiz,
  selectConclusionAnswer,
  validateConclusionAnswer,
} from "../src/app/conclusionQuiz";
import { computeProblem } from "../src/app/problemComputation";
import { getBuiltInProblem } from "../src/data/problems";
import type { PropositionForm } from "../src/domain/proposition";

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
    expect(isConclusionAnswerChoice(value)).toBe(expected);
  });

  it("creates independent initial states", () => {
    const first = createInitialConclusionQuizState();
    const second = createInitialConclusionQuizState();
    expect(first).toEqual({
      mode: "automatic",
      selectedAnswer: null,
      check: { kind: "not-checked" },
    });
    expect(first).not.toBe(second);
    expect(first.check).not.toBe(second.check);
  });

  it.each([
    [[], "none"],
    [["A"], "A"],
    [["E"], "E"],
    [["I"], "I"],
    [["O"], "O"],
  ] as const)("derives %j as %s", (forms, expected) => {
    expect(deriveExpectedConclusionAnswer(forms)).toBe(expected);
  });

  it("rejects multiple and duplicate complete conclusions", () => {
    expect(() => deriveExpectedConclusionAnswer(["I", "O"])).toThrow(
      /I, O/,
    );
    expect(() => deriveExpectedConclusionAnswer(["A", "A"])).toThrow(
      /A, A/,
    );
  });

  it("rejects a runtime-invalid proposition form", () => {
    expect(() => deriveExpectedConclusionAnswer(
      ["X"] as unknown as readonly PropositionForm[],
    )).toThrow(/X/);
  });

  it.each([
    [null, ["A"], { ok: false, reason: "incomplete" }],
    ["A", ["A"], { ok: true }],
    ["E", ["E"], { ok: true }],
    ["I", ["I"], { ok: true }],
    ["O", ["O"], { ok: true }],
    ["none", [], { ok: true }],
    ["E", ["A"], { ok: false, reason: "incorrect" }],
    ["none", ["I"], { ok: false, reason: "incorrect" }],
    ["A", [], { ok: false, reason: "incorrect" }],
  ] as const)("validates answer %s against %j", (answer, forms, expected) => {
    expect(validateConclusionAnswer(answer, forms)).toEqual(expected);
  });

  it("uses Barbara's reduced conclusionForms rather than entailedForms", () => {
    const problem = getBuiltInProblem("barbara-aaa1");
    const computation = computeProblem(problem);
    expect(computation.entailedForms).toEqual(["A", "I"]);
    expect(computation.conclusionForms).toEqual(["A"]);
    expect(validateConclusionAnswer("A", computation.conclusionForms))
      .toEqual({ ok: true });
    expect(validateConclusionAnswer("I", computation.conclusionForms))
      .toEqual({ ok: false, reason: "incorrect" });
  });

  it("resets the check after changing an answer without mutation", () => {
    const frozen = Object.freeze({
      mode: "quiz" as const,
      selectedAnswer: "A" as const,
      check: Object.freeze({ kind: "correct" as const }),
    });
    expect(selectConclusionAnswer(frozen, "E")).toEqual({
      mode: "quiz",
      selectedAnswer: "E",
      check: { kind: "not-checked" },
    });
    expect(frozen.selectedAnswer).toBe("A");
  });

  it("does not disclose the expected answer in failures and is deterministic", () => {
    const forms = Object.freeze(["A"] as const);
    const first = validateConclusionAnswer("E", forms);
    const second = validateConclusionAnswer("E", forms);
    expect(first).toEqual(second);
    expect(Object.keys(first)).toEqual(["ok", "reason"]);
    expect(forms).toEqual(["A"]);
  });
});

import { describe, expect, it } from "vitest";
import { deriveConclusionQuizQuestions } from "../src/app/conclusionQuiz";
import { computeProblem } from "../src/app/problemComputation";
import { getBuiltInProblem } from "../src/data/problems";

describe("semantic and presentation conclusion architecture", () => {
  it("keeps Celarent semantic, presentation, diagram, quiz, and concrete output independent", () => {
    const computation = computeProblem(getBuiltInProblem("celarent-eae1"));
    expect(computation.completeConclusion?.propositions).toEqual([{
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    }]);
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
    expect(computation.completeConclusion?.biliteralState).toEqual({
      emptyCells: ["SP"],
      existentials: [{ sourceId: "second-premise", possibleCells: ["Sp"] }],
    });
    expect(computation.conclusionPlacements).toEqual({
      emptinessCounters: [{
        kind: "emptiness",
        anchor: { type: "cell", cell: "SP" },
      }],
      existenceCounters: [{
        kind: "existence",
        sourceIds: ["second-premise"],
        anchor: { type: "cell", cell: "Sp" },
      }],
    });
    expect(deriveConclusionQuizQuestions(
      computation.conclusionPresentation,
    )).toEqual([{
      proposition: {
        form: "E",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      expectedAnswer: "E",
    }]);
    expect(computation.concreteConclusions).toEqual([{
      form: "E",
      subject: { termId: "snake", complemented: false },
      predicate: { termId: "warm-blooded", complemented: false },
    }]);
  });

  it("keeps No. 25's required prime throughout presentation and quiz", () => {
    const computation = computeProblem({
      id: "carroll-viii-i-6-25",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "pet", complemented: false },
          predicate: { termId: "mortal", complemented: false },
        },
        secondPremise: {
          form: "E",
          subject: { termId: "human", complemented: false },
          predicate: { termId: "pet", complemented: true },
        },
      },
    });
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    }]);
    expect(deriveConclusionQuizQuestions(
      computation.conclusionPresentation,
    )[0]?.expectedAnswer).toBe("E");
    expect(computation.concreteConclusions[0]?.predicate.complemented).toBe(true);
  });

  it("keeps every No. 10 presentation proposition in concrete output and quiz", () => {
    const computation = computeProblem({
      id: "carroll-viii-i-4-10",
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
    });
    expect(computation.completeConclusion?.propositions).toHaveLength(2);
    expect(computation.conclusionPresentation?.propositions).toHaveLength(2);
    expect(computation.concreteConclusions).toHaveLength(2);
    expect(deriveConclusionQuizQuestions(
      computation.conclusionPresentation,
    ).map(({ expectedAnswer }) => expectedAnswer)).toEqual(["A", "O"]);
    expect(computation.conclusionPlacements.emptinessCounters).toHaveLength(1);
    expect(computation.conclusionPlacements.existenceCounters).toHaveLength(2);
  });

  it.each([
    ["barbara-aaa1", "A"],
    ["celarent-eae1", "E"],
    ["darii-aii1", "I"],
    ["ferio-eio1", "O"],
  ] as const)("routes %s through its presentation form %s", (id, form) => {
    const computation = computeProblem(getBuiltInProblem(id));
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form,
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
  });

  it("uses null for both semantic and presentation no-conclusion results", () => {
    const computation = computeProblem(
      getBuiltInProblem("invalid-undistributed-middle"),
    );
    expect(computation.completeConclusion).toBeNull();
    expect(computation.conclusionPresentation).toBeNull();
    expect(computation.concreteConclusions).toEqual([]);
    expect(deriveConclusionQuizQuestions(null)).toEqual([{
      proposition: null,
      expectedAnswer: "none",
    }]);
  });
});

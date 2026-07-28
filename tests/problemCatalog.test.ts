import { describe, expect, it } from "vitest";
import {
  BUILT_IN_PROBLEMS,
  getBuiltInProblem,
  isBuiltInProblemId,
} from "../src/data/problems";
import { getBuiltInTerm } from "../src/data/terms";
import { computeProblem } from "../src/app/problemComputation";
import { assignTermRoles } from "../src/logic/termAssignment";

describe("built-in problem catalog", () => {
  it("contains six unique IDs in selector order", () => {
    const ids = BUILT_IN_PROBLEMS.map(({ id }) => id);
    expect(ids).toEqual([
      "barbara-aaa1",
      "celarent-eae1",
      "darii-aii1",
      "ferio-eio1",
      "cesare-eae2",
      "invalid-undistributed-middle",
    ]);
    expect(new Set(ids).size).toBe(6);
  });

  it("provides Japanese and English titles", () => {
    for (const problem of BUILT_IN_PROBLEMS) {
      expect(problem.title.ja, problem.id).not.toBe("");
      expect(problem.title.en, problem.id).not.toBe("");
    }
  });

  it("references only known terms", () => {
    for (const { premises } of BUILT_IN_PROBLEMS) {
      for (const premise of [premises.firstPremise, premises.secondPremise]) {
        expect(getBuiltInTerm(premise.subject).id).toBe(premise.subject);
        expect(getBuiltInTerm(premise.predicate).id).toBe(premise.predicate);
      }
    }
  });

  it("assigns three terms and computes every problem", () => {
    for (const problem of BUILT_IN_PROBLEMS) {
      const assignment = assignTermRoles(problem.premises);
      const computation = computeProblem(problem);
      expect(new Set([assignment.S, assignment.M, assignment.P]).size).toBe(3);
      expect(computation.combinedPlacements).toBeDefined();
    }
  });

  it.each(BUILT_IN_PROBLEMS)(
    "infers the catalog expectation for $id",
    (problem) => {
      const result = computeProblem(problem);
      const expected =
        problem.expectedConclusionForm === null
          ? []
          : [problem.expectedConclusionForm];
      expect(result.conclusionForms).toEqual(expected);
    },
  );

  it("infers E for the second-figure Cesare problem", () => {
    expect(
      computeProblem(getBuiltInProblem("cesare-eae2")).conclusionForms,
    ).toEqual(["E"]);
  });

  it("infers no conclusion for the undistributed-middle problem", () => {
    expect(
      computeProblem(
        getBuiltInProblem("invalid-undistributed-middle"),
      ).conclusionForms,
    ).toEqual([]);
  });

  it("guards and retrieves problem IDs", () => {
    expect(isBuiltInProblemId("barbara-aaa1")).toBe(true);
    expect(isBuiltInProblemId("unknown")).toBe(false);
    expect(getBuiltInProblem("darii-aii1").title.en).toBe("Darii (AII-1)");
  });

  it("reports an unknown ID at runtime", () => {
    expect(() =>
      getBuiltInProblem("unknown" as "barbara-aaa1"),
    ).toThrow('Unknown built-in problem: "unknown".');
  });
});

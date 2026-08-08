import { describe, expect, it } from "vitest";
import {
  BUILT_IN_PROBLEMS,
  getBuiltInProblem,
  isBuiltInProblemId,
} from "../src/data/problems";
import { getBuiltInTerm } from "../src/data/terms";
import { computeProblem } from "../src/app/problemComputation";
import { inferAllEntailedSignedPropositions } from "../src/logic/conclusionInference";
import type { PropositionForm } from "../src/domain/proposition";

const EXPECTED_TRADITIONAL_FORMS: Readonly<Record<string, PropositionForm | null>> = {
  "barbara-aaa1": "A",
  "celarent-eae1": "E",
  "darii-aii1": "I",
  "ferio-eio1": "O",
  "cesare-eae2": "E",
  "invalid-undistributed-middle": null,
};
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
        expect(getBuiltInTerm(premise.subject.termId).id).toBe(premise.subject.termId);
        expect(getBuiltInTerm(premise.predicate.termId).id).toBe(premise.predicate.termId);
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
      const expectedConclusionForm = EXPECTED_TRADITIONAL_FORMS[problem.id];
      if (expectedConclusionForm === undefined) {
        throw new Error(`Missing traditional expectation for ${problem.id}.`);
      }
      if (expectedConclusionForm === null) {
        expect(result.completeConclusion).toBeNull();
        expect(result.concreteConclusions).toEqual([]);
      } else {
        expect(result.completeConclusion).not.toBeNull();
        expect(inferAllEntailedSignedPropositions(
          result.completeConclusion!.biliteralState,
        )).toContainEqual({
          form: expectedConclusionForm,
          subject: { role: "S", complemented: false },
          predicate: { role: "P", complemented: false },
        });
        expect(result.completeConclusion!.propositions.length).toBeGreaterThan(0);
        expect(result.concreteConclusions).toHaveLength(
          result.completeConclusion!.propositions.length,
        );
      }
    },
  );

  it("infers E for the second-figure Cesare problem", () => {
    const result = computeProblem(getBuiltInProblem("cesare-eae2"));
    expect(inferAllEntailedSignedPropositions(
      result.completeConclusion!.biliteralState,
    )).toContainEqual({
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    });
  });

  it("infers no conclusion for the undistributed-middle problem", () => {
    expect(computeProblem(
      getBuiltInProblem("invalid-undistributed-middle"),
    ).completeConclusion).toBeNull();
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

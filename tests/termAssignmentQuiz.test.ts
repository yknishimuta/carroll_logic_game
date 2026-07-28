import { describe, expect, it } from "vitest";
import {
  createEmptyTermAssignmentQuizSelection,
  getProblemTermIds,
  isAssignmentMode,
  validateTermAssignmentQuiz,
} from "../src/app/termAssignmentQuiz";
import { BUILT_IN_PROBLEMS } from "../src/data/problems";
import type { ConcreteSyllogism } from "../src/domain/syllogism";
import type { TermAssignment } from "../src/domain/term";

const barbara: TermAssignment = {
  S: "human",
  M: "animal",
  P: "mortal",
};

describe("term assignment quiz", () => {
  it("recognizes assignment modes", () => {
    expect(isAssignmentMode("automatic")).toBe(true);
    expect(isAssignmentMode("quiz")).toBe(true);
    expect(isAssignmentMode("manual")).toBe(false);
  });

  it("creates a fresh empty selection", () => {
    const first = createEmptyTermAssignmentQuizSelection();
    const second = createEmptyTermAssignmentQuizSelection();
    expect(first).toEqual({ S: null, M: null, P: null });
    expect(first).not.toBe(second);
  });

  it("returns Barbara terms in first-occurrence order", () => {
    expect(getProblemTermIds(BUILT_IN_PROBLEMS[0].premises)).toEqual([
      "animal",
      "mortal",
      "human",
    ]);
  });

  it.each(BUILT_IN_PROBLEMS)(
    "returns three distinct terms for $id",
    ({ premises }) => {
      const terms = getProblemTermIds(premises);
      expect(terms).toHaveLength(3);
      expect(new Set(terms).size).toBe(3);
    },
  );

  it("rejects a premise set without exactly three terms", () => {
    const invalid: ConcreteSyllogism = {
      firstPremise: { form: "A", subject: "a", predicate: "b" },
      secondPremise: { form: "A", subject: "a", predicate: "b" },
    };
    expect(() => getProblemTermIds(invalid)).toThrow(/found 2/);
  });

  it("accepts six explicit correct assignments", () => {
    const cases: readonly TermAssignment[] = [
      { S: "human", M: "animal", P: "mortal" },
      { S: "snake", M: "reptile", P: "warm-blooded" },
      { S: "student", M: "poet", P: "writer" },
      { S: "pet", M: "bird", P: "mammal" },
      { S: "sparrow", M: "bird", P: "mammal" },
      { S: "dog", M: "animal", P: "cat" },
    ];
    for (const assignment of cases) {
      const expected = {
        S: assignment.S,
        M: assignment.M,
        P: assignment.P,
      };
      expect(validateTermAssignmentQuiz(assignment, expected)).toEqual({
        ok: true,
      });
    }
  });

  it.each(["S", "M", "P"] as const)(
    "reports incomplete when %s is unselected",
    (role) => {
      expect(validateTermAssignmentQuiz({ ...barbara, [role]: null }, barbara))
        .toEqual({ ok: false, reason: "incomplete" });
    },
  );

  it.each([
    { S: "animal", M: "animal", P: "mortal" },
    { S: "human", M: "mortal", P: "mortal" },
    { S: "human", M: "animal", P: "human" },
    { S: "animal", M: "animal", P: "animal" },
  ])("reports duplicate terms", (selection) => {
    expect(validateTermAssignmentQuiz(selection, barbara)).toEqual({
      ok: false,
      reason: "duplicate-term",
    });
  });

  it("reports incorrect without disclosing the answer", () => {
    const result = validateTermAssignmentQuiz(
      { S: "animal", M: "human", P: "mortal" },
      barbara,
    );
    expect(result).toEqual({ ok: false, reason: "incorrect" });
    expect(JSON.stringify(result)).not.toContain("human");
  });

  it("prioritizes incomplete and is non-destructive and deterministic", () => {
    const selection = Object.freeze({ S: null, M: "animal", P: "animal" });
    const expected = Object.freeze(barbara);
    expect(validateTermAssignmentQuiz(selection, expected)).toEqual({
      ok: false,
      reason: "incomplete",
    });
    expect(validateTermAssignmentQuiz(selection, expected)).toEqual(
      validateTermAssignmentQuiz(selection, expected),
    );
  });
});

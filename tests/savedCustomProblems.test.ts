import { describe, expect, it } from "vitest";
import type { SavedCustomProblemDefinition } from "../src/domain/savedCustomProblem";
import { isCustomProblemId } from "../src/domain/savedCustomProblem";
import {
  createCustomProblemDraftFromSavedProblem,
  createEmptySavedCustomProblemDraft,
  createNextCustomProblemId,
  createSavedCustomProblem,
  deleteSavedCustomProblem,
  findSavedCustomProblemsUsingTerm,
  savedCustomProblemUsesTerm,
  updateSavedCustomProblem,
  updateSavedCustomProblemDraft,
  validateSavedCustomProblem,
  validateSavedCustomProblemCatalog,
} from "../src/app/savedCustomProblems";

const barbaraPremises = {
  firstPremise: { form: "A" as const, subject: "animal", predicate: "mortal" },
  secondPremise: { form: "A" as const, subject: "human", predicate: "animal" },
};
const barbara: SavedCustomProblemDefinition = {
  id: "custom-problem-1",
  title: "Barbara",
  premises: barbaraPremises,
};

describe("saved custom problems", () => {
  it.each([
    ["custom-problem-1", true],
    ["custom-problem-999", true],
    ["custom-problem-0", false],
    ["custom-problem-01", false],
    ["custom-problem--1", false],
    ["custom-problem-a", false],
    ["custom-1", false],
    ["", false],
  ])("validates problem ID %s", (value, expected) => {
    expect(isCustomProblemId(value)).toBe(expected);
  });

  it("creates and updates independent title drafts without trimming", () => {
    const first = createEmptySavedCustomProblemDraft();
    const second = createEmptySavedCustomProblemDraft();
    expect(first).toEqual({ title: "" });
    expect(first).not.toBe(second);
    expect(updateSavedCustomProblemDraft(first, "  Name  ")).toEqual({
      title: "  Name  ",
    });
    expect(first.title).toBe("");
  });

  it.each([
    ["", "incomplete-title"],
    ["   ", "incomplete-title"],
    ["x".repeat(101), "title-too-long"],
  ] as const)("rejects title %j", (title, reason) => {
    expect(validateSavedCustomProblem(
      { title },
      barbaraPremises,
      [],
    )).toEqual({ ok: false, reason });
  });

  it("accepts 100 characters, trims, and requires ready premises", () => {
    expect(validateSavedCustomProblem(
      { title: ` ${"x".repeat(100)} ` },
      barbaraPremises,
      [],
    )).toEqual({ ok: true, normalizedTitle: "x".repeat(100) });
    expect(validateSavedCustomProblem({ title: "Name" }, null, []))
      .toEqual({ ok: false, reason: "problem-not-ready" });
  });

  it("rejects normalized duplicate titles but excludes the edited item", () => {
    expect(validateSavedCustomProblem(
      { title: " BARBARA " },
      barbaraPremises,
      [barbara],
    )).toEqual({ ok: false, reason: "duplicate-title" });
    expect(validateSavedCustomProblem(
      { title: " Barbara " },
      barbaraPremises,
      [barbara],
      "custom-problem-1",
    )).toEqual({ ok: true, normalizedTitle: "Barbara" });
  });

  it("enforces the creation limit but permits editing at the limit", () => {
    const problems = Array.from({ length: 100 }, (_, index) => ({
      ...barbara,
      id: `custom-problem-${index + 1}` as const,
      title: `Problem ${index + 1}`,
    }));
    expect(validateSavedCustomProblem(
      { title: "New" },
      barbaraPremises,
      problems,
    )).toEqual({ ok: false, reason: "problem-limit-reached" });
    expect(validateSavedCustomProblem(
      { title: "Problem 1" },
      barbaraPremises,
      problems,
      "custom-problem-1",
    )).toEqual({ ok: true, normalizedTitle: "Problem 1" });
  });

  it.each([
    [[], "custom-problem-1"],
    [[barbara], "custom-problem-2"],
    [[
      { ...barbara, id: "custom-problem-3" },
      barbara,
    ], "custom-problem-4"],
  ] as const)("generates the next stable ID", (problems, expected) => {
    expect(createNextCustomProblemId(problems)).toBe(expected);
  });

  it("creates, updates, and deletes without mutating order or inputs", () => {
    const created = createSavedCustomProblem(
      { title: "  Barbara copy  " },
      barbaraPremises,
      [barbara],
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.problem).toEqual({
      id: "custom-problem-2",
      title: "Barbara copy",
      premises: barbaraPremises,
    });
    const newPremises = {
      firstPremise: { form: "E" as const, subject: "bird", predicate: "mammal" },
      secondPremise: { form: "I" as const, subject: "pet", predicate: "bird" },
    };
    const updated = updateSavedCustomProblem(
      "custom-problem-2",
      { title: "Ferio" },
      newPremises,
      created.problems,
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.problems.map(({ id }) => id)).toEqual([
      "custom-problem-1",
      "custom-problem-2",
    ]);
    expect(updated.problem.premises).toBe(newPremises);
    expect(deleteSavedCustomProblem(
      "custom-problem-1",
      updated.problems,
    )).toEqual([updated.problem]);
    expect(() => deleteSavedCustomProblem(
      "custom-problem-99",
      updated.problems,
    )).toThrow(/custom-problem-99/);
    expect(updateSavedCustomProblem(
      "custom-problem-99",
      { title: "Unknown" },
      barbaraPremises,
      updated.problems,
    )).toEqual({ ok: false, reason: "unknown-saved-custom-problem" });
  });

  it("copies saved premises into a new form draft", () => {
    const draft = createCustomProblemDraftFromSavedProblem(barbara);
    expect(draft).toEqual({
      majorPremise: {
        form: "A",
        subjectTermId: "animal",
        predicateTermId: "mortal",
      },
      minorPremise: {
        form: "A",
        subjectTermId: "human",
        predicateTermId: "animal",
      },
    });
    expect(draft.majorPremise).not.toBe(barbara.premises.firstPremise);
  });

  it("finds term references in all four positions and definition order", () => {
    expect(savedCustomProblemUsesTerm(barbara, "animal")).toBe(true);
    expect(savedCustomProblemUsesTerm(barbara, "mortal")).toBe(true);
    expect(savedCustomProblemUsesTerm(barbara, "human")).toBe(true);
    expect(savedCustomProblemUsesTerm(barbara, "cat")).toBe(false);
    expect(findSavedCustomProblemsUsingTerm("animal", [
      barbara,
      { ...barbara, id: "custom-problem-2", title: "Second" },
    ])).toEqual(["custom-problem-1", "custom-problem-2"]);
  });

  it("validates catalog IDs, titles, terms, and premise structure", () => {
    expect(validateSavedCustomProblemCatalog(
      [barbara, { ...barbara, title: "Other" }],
      [],
    )).toEqual({ ok: false, reason: "duplicate-id" });
    expect(validateSavedCustomProblemCatalog(
      [barbara, { ...barbara, id: "custom-problem-2", title: " barbara " }],
      [],
    )).toEqual({ ok: false, reason: "duplicate-title" });
    expect(validateSavedCustomProblemCatalog([{
      ...barbara,
      premises: {
        ...barbara.premises,
        firstPremise: {
          ...barbara.premises.firstPremise,
          subject: "unknown",
        },
      },
    }], [])).toEqual({ ok: false, reason: "unknown-term" });
    expect(validateSavedCustomProblemCatalog([{
      ...barbara,
      premises: {
        firstPremise: { form: "A", subject: "animal", predicate: "mortal" },
        secondPremise: { form: "A", subject: "cat", predicate: "dog" },
      },
    }], [])).toEqual({ ok: false, reason: "invalid-premises" });
  });

  it("accepts a structurally valid but logically invalid syllogism", () => {
    expect(validateSavedCustomProblemCatalog([{
      id: "custom-problem-1",
      title: "Undistributed middle",
      premises: {
        firstPremise: { form: "A", subject: "cat", predicate: "animal" },
        secondPremise: { form: "A", subject: "dog", predicate: "animal" },
      },
    }], [])).toEqual({ ok: true });
  });
});

import { describe, expect, it } from "vitest";
import {
  createEmptyCustomPremiseDraft,
  createEmptyCustomProblemDraft,
  isCustomPremisePosition,
  isCustomTermField,
  isProblemSource,
  updateCustomPremiseForm,
  updateCustomPremiseTerm,
  validateCustomProblemDraft,
  type CustomProblemDraft,
} from "../src/app/customProblem";
import { computeProblem } from "../src/app/problemComputation";

const barbara: CustomProblemDraft = {
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
};

describe("custom problem drafts", () => {
  it("guards application-level form values", () => {
    expect(isProblemSource("built-in")).toBe(true);
    expect(isProblemSource("custom")).toBe(true);
    expect(isProblemSource("other")).toBe(false);
    expect(isCustomPremisePosition("major")).toBe(true);
    expect(isCustomPremisePosition("minor")).toBe(true);
    expect(isCustomPremisePosition("first")).toBe(false);
    expect(isCustomTermField("subjectTermId")).toBe(true);
    expect(isCustomTermField("predicateTermId")).toBe(true);
    expect(isCustomTermField("form")).toBe(false);
  });

  it("creates fresh empty premise and problem values", () => {
    expect(createEmptyCustomPremiseDraft()).toEqual({
      form: null,
      subjectTermId: null,
      predicateTermId: null,
    });
    const first = createEmptyCustomProblemDraft();
    const second = createEmptyCustomProblemDraft();
    expect(first.majorPremise).not.toBe(first.minorPremise);
    expect(first).not.toBe(second);
    expect(first.majorPremise).not.toBe(second.majorPremise);
  });

  it("updates only the selected field and premise", () => {
    const empty = createEmptyCustomProblemDraft();
    const withForm = updateCustomPremiseForm(empty, "major", "E");
    const withSubject = updateCustomPremiseTerm(
      withForm,
      "major",
      "subjectTermId",
      "mammal",
    );
    const withPredicate = updateCustomPremiseTerm(
      withSubject,
      "minor",
      "predicateTermId",
      "bird",
    );
    expect(withPredicate).toEqual({
      majorPremise: {
        form: "E",
        subjectTermId: "mammal",
        predicateTermId: null,
      },
      minorPremise: {
        form: null,
        subjectTermId: null,
        predicateTermId: "bird",
      },
    });
    expect(empty).toEqual(createEmptyCustomProblemDraft());
    expect(withForm.minorPremise).toBe(empty.minorPremise);
  });

  it("updates a frozen draft without mutation", () => {
    const draft = Object.freeze({
      majorPremise: Object.freeze({ ...barbara.majorPremise }),
      minorPremise: Object.freeze({ ...barbara.minorPremise }),
    });
    expect(updateCustomPremiseForm(draft, "minor", "I").minorPremise.form)
      .toBe("I");
    expect(draft.minorPremise.form).toBe("A");
  });
});

describe("custom problem validation", () => {
  it.each([
    ["majorPremise", "form"],
    ["majorPremise", "subjectTermId"],
    ["majorPremise", "predicateTermId"],
    ["minorPremise", "form"],
    ["minorPremise", "subjectTermId"],
    ["minorPremise", "predicateTermId"],
  ] as const)("reports incomplete for %s.%s", (premise, field) => {
    const draft = {
      ...barbara,
      [premise]: { ...barbara[premise], [field]: null },
    };
    expect(validateCustomProblemDraft(draft)).toEqual({
      ok: false,
      reason: "incomplete",
    });
  });

  it("reports same terms in each premise", () => {
    expect(validateCustomProblemDraft({
      ...barbara,
      majorPremise: {
        form: "A",
        subjectTermId: "animal",
        predicateTermId: "animal",
      },
    })).toEqual({
      ok: false,
      reason: "same-term-within-major-premise",
    });
    expect(validateCustomProblemDraft({
      ...barbara,
      minorPremise: {
        form: "A",
        subjectTermId: "human",
        predicateTermId: "human",
      },
    })).toEqual({
      ok: false,
      reason: "same-term-within-minor-premise",
    });
  });

  it.each([
    [
      {
        majorPremise: { form: "A", subjectTermId: "cat", predicateTermId: "animal" },
        minorPremise: { form: "A", subjectTermId: "animal", predicateTermId: "cat" },
      },
      "expected-one-common-term",
    ],
    [
      {
        majorPremise: { form: "A", subjectTermId: "cat", predicateTermId: "animal" },
        minorPremise: { form: "A", subjectTermId: "dog", predicateTermId: "bird" },
      },
      "expected-one-common-term",
    ],
  ] as const)("rejects invalid term structure", (draft, reason) => {
    expect(validateCustomProblemDraft(draft)).toEqual({ ok: false, reason });
  });

  it.each([
    ["Barbara", barbara, { S: "human", M: "animal", P: "mortal" }],
    [
      "Figure 2",
      {
        majorPremise: { form: "E", subjectTermId: "mammal", predicateTermId: "bird" },
        minorPremise: { form: "A", subjectTermId: "sparrow", predicateTermId: "bird" },
      },
      { S: "sparrow", M: "bird", P: "mammal" },
    ],
    [
      "Figure 3",
      {
        majorPremise: { form: "A", subjectTermId: "bird", predicateTermId: "mammal" },
        minorPremise: { form: "I", subjectTermId: "bird", predicateTermId: "pet" },
      },
      { S: "pet", M: "bird", P: "mammal" },
    ],
    [
      "Figure 4",
      {
        majorPremise: { form: "E", subjectTermId: "mammal", predicateTermId: "bird" },
        minorPremise: { form: "I", subjectTermId: "bird", predicateTermId: "pet" },
      },
      { S: "pet", M: "bird", P: "mammal" },
    ],
  ] as const)("assigns explicit roles for %s", (_name, draft, assignment) => {
    const result = validateCustomProblemDraft(draft);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.assignment).toEqual(assignment);
  });

  it("accepts a structurally valid but logically invalid problem", () => {
    const result = validateCustomProblemDraft({
      majorPremise: {
        form: "A",
        subjectTermId: "cat",
        predicateTermId: "animal",
      },
      minorPremise: {
        form: "A",
        subjectTermId: "dog",
        predicateTermId: "animal",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.assignment).toEqual({ S: "dog", M: "animal", P: "cat" });
    expect(computeProblem({ id: "custom", premises: result.premises })
      .conclusionForms).toEqual([]);
  });

  it.each(["A", "E", "I", "O"] as const)(
    "preserves proposition form %s",
    (form) => {
      const result = validateCustomProblemDraft({
        ...barbara,
        majorPremise: { ...barbara.majorPremise, form },
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.premises.firstPremise.form).toBe(form);
    },
  );

  it("is deterministic", () => {
    expect(validateCustomProblemDraft(barbara)).toEqual(
      validateCustomProblemDraft(barbara),
    );
  });

  it("preserves custom term IDs as subject and predicate", () => {
    const result = validateCustomProblemDraft({
      majorPremise: {
        form: "A",
        subjectTermId: "human",
        predicateTermId: "animal",
      },
      minorPremise: {
        form: "A",
        subjectTermId: "custom-term-1",
        predicateTermId: "human",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.premises.secondPremise.subject).toBe("custom-term-1");
    expect(result.assignment).toEqual({
      S: "custom-term-1",
      M: "human",
      P: "animal",
    });
  });
});

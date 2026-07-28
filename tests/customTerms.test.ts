import { describe, expect, it } from "vitest";
import { BUILT_IN_TERMS } from "../src/data/terms";
import {
  createCustomTerm,
  createEmptyCustomTermDraft,
  createNextCustomTermId,
  deleteCustomTerm,
  isCustomTermDraftField,
  updateCustomTerm,
  updateCustomTermDraft,
  validateCustomTermDraft,
} from "../src/app/customTerms";
import {
  isCustomTermId,
  type CustomTermDefinition,
  type CustomTermId,
} from "../src/domain/customTerm";

function term(
  id: CustomTermId,
  ja = "哲学者",
  subject = "philosophers",
  predicate = "philosophers",
): CustomTermDefinition {
  return {
    id,
    labels: {
      ja: { nounPhrase: ja },
      en: { subjectPlural: subject, predicatePhrase: predicate },
    },
  };
}

const draft = {
  jaNounPhrase: "哲学者",
  enSubjectPlural: "philosophers",
  enPredicatePhrase: "philosophers",
};

describe("custom term identity and drafts", () => {
  it.each([
    ["custom-term-1", true],
    ["custom-term-2", true],
    ["custom-term-999", true],
    ["custom-term-0", false],
    ["custom-term--1", false],
    ["custom-term-01", false],
    ["custom-term-a", false],
    ["custom-1", false],
    ["", false],
  ] as const)("guards %s", (value, expected) => {
    expect(isCustomTermId(value)).toBe(expected);
  });

  it("creates fresh drafts and updates one field without trimming", () => {
    const first = createEmptyCustomTermDraft();
    const second = createEmptyCustomTermDraft();
    expect(first).toEqual({
      jaNounPhrase: "",
      enSubjectPlural: "",
      enPredicatePhrase: "",
    });
    expect(first).not.toBe(second);
    const updated = updateCustomTermDraft(
      Object.freeze(draft),
      "jaNounPhrase",
      "  思想家  ",
    );
    expect(updated).toEqual({ ...draft, jaNounPhrase: "  思想家  " });
    expect(draft.jaNounPhrase).toBe("哲学者");
    expect(isCustomTermDraftField("jaNounPhrase")).toBe(true);
    expect(isCustomTermDraftField("other")).toBe(false);
  });

  it.each([
    { ...draft, jaNounPhrase: " " },
    { ...draft, enSubjectPlural: "" },
    { ...draft, enPredicatePhrase: "\t" },
  ])("rejects incomplete labels", (candidate) => {
    expect(validateCustomTermDraft(candidate, [])).toEqual({
      ok: false,
      reason: "incomplete",
    });
  });

  it.each([
    "jaNounPhrase",
    "enSubjectPlural",
    "enPredicatePhrase",
  ] as const)("enforces 80 characters for %s", (field) => {
    expect(validateCustomTermDraft(
      { ...draft, [field]: "x".repeat(80) },
      [],
    ).ok).toBe(true);
    expect(validateCustomTermDraft(
      { ...draft, [field]: "x".repeat(81) },
      [],
    )).toEqual({ ok: false, reason: "label-too-long" });
  });
});

describe("custom term validation and CRUD", () => {
  it("trims labels and rejects built-in and case-insensitive duplicates", () => {
    expect(validateCustomTermDraft(
      {
        jaNounPhrase: " 動物 ",
        enSubjectPlural: " ANIMALS ",
        enPredicatePhrase: "Animals",
      },
      BUILT_IN_TERMS,
    )).toEqual({ ok: false, reason: "duplicate-term" });
    expect(validateCustomTermDraft(
      {
        jaNounPhrase: "哲学者",
        enSubjectPlural: "PHILOSOPHERS",
        enPredicatePhrase: "Philosophers",
      },
      [term("custom-term-1")],
    )).toEqual({ ok: false, reason: "duplicate-term" });
    expect(validateCustomTermDraft(
      {
        jaNounPhrase: " 哲学者 ",
        enSubjectPlural: " philosophers ",
        enPredicatePhrase: " philosophers ",
      },
      [],
    )).toEqual({ ok: true, labels: draft });
  });

  it("excludes the edited term from duplicate and count checks", () => {
    const terms = Array.from({ length: 100 }, (_, index) =>
      term(
        `custom-term-${index + 1}`,
        `項${index + 1}`,
        `terms ${index + 1}`,
        `term ${index + 1}`,
      )
    );
    expect(validateCustomTermDraft(
      {
        jaNounPhrase: "項1",
        enSubjectPlural: "terms 1",
        enPredicatePhrase: "term 1",
      },
      terms,
      "custom-term-1",
    ).ok).toBe(true);
    expect(validateCustomTermDraft(draft, terms)).toEqual({
      ok: false,
      reason: "term-limit-reached",
    });
  });

  it.each([
    [[], "custom-term-1"],
    [[term("custom-term-1")], "custom-term-2"],
    [[term("custom-term-3"), term("custom-term-1")], "custom-term-4"],
  ] as const)("generates the next maximum ID", (terms, expected) => {
    expect(createNextCustomTermId(terms)).toBe(expected);
  });

  it("creates, updates, and deletes non-destructively", () => {
    const original = Object.freeze([Object.freeze(term("custom-term-1"))]);
    const created = createCustomTerm(
      {
        jaNounPhrase: " 思想家 ",
        enSubjectPlural: " thinkers ",
        enPredicatePhrase: " thinkers ",
      },
      BUILT_IN_TERMS,
      original,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.term).toEqual(term(
      "custom-term-2",
      "思想家",
      "thinkers",
      "thinkers",
    ));
    const updated = updateCustomTerm(
      "custom-term-1",
      { ...draft, jaNounPhrase: "哲人" },
      BUILT_IN_TERMS,
      created.terms,
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.terms.map(({ id }) => id)).toEqual([
      "custom-term-1",
      "custom-term-2",
    ]);
    expect(updated.terms[0]?.labels.ja.nounPhrase).toBe("哲人");
    expect(deleteCustomTerm("custom-term-1", updated.terms)).toEqual([
      created.term,
    ]);
    expect(original).toHaveLength(1);
  });

  it("reports unknown edit and deletion", () => {
    expect(updateCustomTerm(
      "custom-term-2",
      draft,
      BUILT_IN_TERMS,
      [term("custom-term-1")],
    )).toEqual({ ok: false, reason: "unknown-custom-term" });
    expect(() => deleteCustomTerm(
      "custom-term-2",
      [term("custom-term-1")],
    )).toThrow('Unknown custom term: "custom-term-2".');
  });

  it("is deterministic", () => {
    expect(createCustomTerm(draft, BUILT_IN_TERMS, [])).toEqual(
      createCustomTerm(draft, BUILT_IN_TERMS, []),
    );
  });
});

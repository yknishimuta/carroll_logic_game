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
  ja = "研究者",
  subject = "researchers",
  predicate = "researchers",
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
  jaNounPhrase: "研究者",
  enSubjectPlural: "researchers",
  enPredicatePhrase: "researchers",
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
    expect(draft.jaNounPhrase).toBe("研究者");
    expect(isCustomTermDraftField("jaNounPhrase")).toBe(true);
    expect(isCustomTermDraftField("other")).toBe(false);
  });

  it("requires the current locale and keeps English all-or-none", () => {
    expect(validateCustomTermDraft({ ...draft, jaNounPhrase: " " }, []))
      .toEqual({ ok: false, reason: "japanese-required" });
    for (const candidate of [
      { ...draft, enSubjectPlural: "" },
      { ...draft, enPredicatePhrase: "\t" },
    ]) expect(validateCustomTermDraft(candidate, [])).toEqual({
      ok: false, reason: "incomplete-english",
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
    )).toEqual({ ok: false, reason: "term-text-too-long" });
  });
});

describe("custom term validation and CRUD", () => {
  it.each([
    ["ja", "create", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, "japanese-required"],
    ["ja", "create", { jaNounPhrase: "研究者", enSubjectPlural: "researchers", enPredicatePhrase: "" }, "incomplete-english"],
    ["ja", "create", { jaNounPhrase: "研究者", enSubjectPlural: "", enPredicatePhrase: "researchers" }, "incomplete-english"],
    ["en", "create", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, "english-required"],
    ["en", "create", { jaNounPhrase: "", enSubjectPlural: "researchers", enPredicatePhrase: "" }, "incomplete-english"],
    ["ja", "update", { jaNounPhrase: "", enSubjectPlural: "", enPredicatePhrase: "" }, "at-least-one-language-required"],
  ] as const)("returns specific %s %s validation", (currentLocale, operation,
    candidate, reason) => {
    expect(validateCustomTermDraft(candidate, [], {
      operation, currentLocale,
      ...(operation === "update" ? { editingTermId: "custom-term-1" as const } : {}),
    })).toEqual({ ok: false, reason });
  });

  it.each([
    ["ja", { jaNounPhrase: "研究者", enSubjectPlural: "", enPredicatePhrase: "" }],
    ["ja", { jaNounPhrase: "研究者", enSubjectPlural: "researchers", enPredicatePhrase: "researchers" }],
    ["en", { jaNounPhrase: "", enSubjectPlural: "researchers", enPredicatePhrase: "researchers" }],
  ] as const)("accepts complete create input for %s", (currentLocale, candidate) => {
    expect(validateCustomTermDraft(candidate, [], {
      operation: "create", currentLocale,
    }).ok).toBe(true);
  });

  it.each([
    { jaNounPhrase: "研究者", enSubjectPlural: "", enPredicatePhrase: "" },
    { jaNounPhrase: "", enSubjectPlural: "researchers", enPredicatePhrase: "researchers" },
  ])("accepts a complete single language during update", (candidate) => {
    expect(validateCustomTermDraft(candidate, [], {
      operation: "update", currentLocale: "ja", editingTermId: "custom-term-1",
    }).ok).toBe(true);
  });
  it("creates Japanese-only, English-only, and bilingual terms by locale", () => {
    const jaOnly = createCustomTerm({ jaNounPhrase: "研究者",
      enSubjectPlural: "", enPredicatePhrase: "" }, BUILT_IN_TERMS, [], "ja");
    expect(jaOnly.ok && jaOnly.term.labels).toEqual({
      ja: { nounPhrase: "研究者" }, en: null,
    });
    const enOnly = createCustomTerm({ jaNounPhrase: "",
      enSubjectPlural: "logicians", enPredicatePhrase: "logical" },
    BUILT_IN_TERMS, [], "en");
    expect(enOnly.ok && enOnly.term.labels).toEqual({ ja: null, en: {
      subjectPlural: "logicians", predicatePhrase: "logical",
    } });
    expect(createCustomTerm({ jaNounPhrase: "", enSubjectPlural: "",
      enPredicatePhrase: "" }, BUILT_IN_TERMS, [], "en")).toEqual({
      ok: false, reason: "english-required",
    });
  });

  it("allows translation addition and removal on update", () => {
    const original: CustomTermDefinition = { id: "custom-term-1", labels: {
      ja: { nounPhrase: "研究者" }, en: null,
    } };
    const added = updateCustomTerm(original.id, { jaNounPhrase: "研究者",
      enSubjectPlural: "researchers", enPredicatePhrase: "researchers" },
    BUILT_IN_TERMS, [original], "en");
    expect(added.ok && added.term.id).toBe(original.id);
    if (!added.ok) return;
    const removed = updateCustomTerm(original.id, { jaNounPhrase: "研究者",
      enSubjectPlural: "", enPredicatePhrase: "" }, BUILT_IN_TERMS,
    added.terms, "en");
    expect(removed.ok && removed.term.labels.en).toBeNull();
  });
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
        jaNounPhrase: "研究者",
        enSubjectPlural: "RESEARCHERS",
        enPredicatePhrase: "Researchers",
      },
      [term("custom-term-1")],
    )).toEqual({ ok: false, reason: "duplicate-term" });
    expect(validateCustomTermDraft(
      {
        jaNounPhrase: " 研究者 ",
        enSubjectPlural: " researchers ",
        enPredicatePhrase: " researchers ",
      },
      [],
    )).toEqual({ ok: true, labels: {
      ja: { nounPhrase: "研究者" },
      en: { subjectPlural: "researchers", predicatePhrase: "researchers" },
    } });
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
    expect(updated.terms[0]?.labels.ja?.nounPhrase).toBe("哲人");
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

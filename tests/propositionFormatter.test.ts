import { describe, expect, it } from "vitest";
import { isPropositionForm } from "../src/domain/proposition";
import { getBuiltInTerm } from "../src/data/terms";
import {
  formatAbstractProposition,
  formatConcreteProposition,
} from "../src/i18n/propositionFormatter";
import { resolveCustomTermForDisplay } from "../src/app/termDisplay";

it("guards proposition forms", () => {
  for (const value of ["A", "E", "I", "O"]) {
    expect(isPropositionForm(value)).toBe(true);
  }
  for (const value of ["", "a", "X"]) {
    expect(isPropositionForm(value)).toBe(false);
  }
});

describe("formatConcreteProposition", () => {
  it.each([
    ["A", "animal", "mortal", "すべての動物は死すべきものである。"],
    ["E", "bird", "mammal", "いかなる鳥も哺乳類ではない。"],
    ["I", "student", "poet", "ある学生は詩人である。"],
    ["O", "pet", "mammal", "あるペットは哺乳類ではない。"],
  ] as const)("formats Japanese %s", (form, subject, predicate, expected) => {
    expect(
      formatConcreteProposition(
        { form, subject, predicate },
        "ja",
        getBuiltInTerm,
      ),
    ).toBe(expected);
  });

  it.each([
    ["A", "animal", "mortal", "All animals are mortal."],
    ["E", "bird", "mammal", "No birds are mammals."],
    ["I", "student", "poet", "Some students are poets."],
    ["O", "pet", "mammal", "Some pets are not mammals."],
  ] as const)("formats English %s", (form, subject, predicate, expected) => {
    expect(
      formatConcreteProposition(
        { form, subject, predicate },
        "en",
        getBuiltInTerm,
      ),
    ).toBe(expected);
  });

  it("uses adjective predicate phrases", () => {
    expect(
      formatConcreteProposition(
        { form: "A", subject: "human", predicate: "warm-blooded" },
        "en",
        getBuiltInTerm,
      ),
    ).toBe("All humans are warm-blooded.");
  });

  it("keeps English subject and predicate forms in Japanese fallback", () => {
    const fallback = resolveCustomTermForDisplay({ id: "custom-term-1", labels: {
      ja: null,
      en: { subjectPlural: "mortal beings", predicatePhrase: "mortal" },
    } });
    const resolver = (id: string) => id === fallback.id ? fallback : getBuiltInTerm(id);
    expect(formatConcreteProposition({ form: "A", subject: fallback.id,
      predicate: "animal" }, "ja", resolver))
      .toBe("すべてのmortal beingsは動物である。");
    expect(formatConcreteProposition({ form: "A", subject: "human",
      predicate: fallback.id }, "ja", resolver))
      .toBe("すべての人間はmortalである。");
  });

  it("formats mixed custom and built-in terms through the resolver", () => {
    const resolver = (termId: string) => {
      if (termId === "custom-term-1") {
        return {
          id: termId,
          labels: {
            ja: { nounPhrase: "哲学者" },
            en: {
              subjectPlural: "philosophers",
              predicatePhrase: "philosophers",
            },
          },
        };
      }
      return getBuiltInTerm(termId);
    };
    expect(formatConcreteProposition(
      { form: "A", subject: "custom-term-1", predicate: "human" },
      "ja",
      resolver,
    )).toBe("すべての哲学者は人間である。");
    expect(formatConcreteProposition(
      { form: "I", subject: "human", predicate: "custom-term-1" },
      "ja",
      resolver,
    )).toBe("ある人間は哲学者である。");
    expect(formatConcreteProposition(
      { form: "A", subject: "custom-term-1", predicate: "human" },
      "en",
      resolver,
    )).toBe("All philosophers are humans.");
    expect(formatConcreteProposition(
      { form: "A", subject: "human", predicate: "custom-term-1" },
      "en",
      resolver,
    )).toBe("All humans are philosophers.");
    expect(() => formatConcreteProposition(
      { form: "A", subject: "unknown", predicate: "human" },
      "en",
      resolver,
    )).toThrow('Unknown built-in term: "unknown".');
  });
});

describe("formatAbstractProposition", () => {
  it.each([
    ["ja", "A", "M", "P", "すべての M は P である。"],
    ["ja", "E", "P", "M", "いかなる P も M ではない。"],
    ["ja", "I", "S", "M", "ある S は M である。"],
    ["ja", "O", "M", "S", "ある M は S ではない。"],
    ["en", "A", "M", "P", "All M are P."],
    ["en", "E", "P", "M", "No P are M."],
    ["en", "I", "S", "M", "Some S are M."],
    ["en", "O", "M", "S", "Some M are not S."],
  ] as const)(
    "formats %s abstract %s without reordering",
    (locale, form, subject, predicate, expected) => {
      expect(
        formatAbstractProposition(
          { form, subject, predicate },
          locale,
        ),
      ).toBe(expected);
    },
  );

  it("is non-destructive and deterministic", () => {
    const proposition = Object.freeze({
      form: "A" as const,
      subject: "S" as const,
      predicate: "P" as const,
    });
    expect(formatAbstractProposition(proposition, "en")).toBe(
      formatAbstractProposition(proposition, "en"),
    );
    expect(proposition).toEqual({ form: "A", subject: "S", predicate: "P" });
  });
});

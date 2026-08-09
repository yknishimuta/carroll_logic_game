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
        {
          form,
          subject: { termId: subject, complemented: false },
          predicate: { termId: predicate, complemented: false },
        },
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
        {
          form,
          subject: { termId: subject, complemented: false },
          predicate: { termId: predicate, complemented: false },
        },
        "en",
        getBuiltInTerm,
      ),
    ).toBe(expected);
  });

  it("uses adjective predicate phrases", () => {
    expect(
      formatConcreteProposition(
        { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "warm-blooded", complemented: false } },
        "en",
        getBuiltInTerm,
      ),
    ).toBe("All humans are warm-blooded.");
  });

  it.each([
    ["A", "philosopher", "logical-person", "All philosophers are logical people."],
    ["E", "bridge", "picturesque-thing", "No bridges are picturesque things."],
    ["I", "book", "exciting-book", "Some books are exciting books."],
    ["I", "duck", "graceful-creature", "Some ducks are graceful creatures."],
  ] as const)("formats expanded English vocabulary", (form, subject, predicate, expected) => {
    expect(formatConcreteProposition({
      form,
      subject: { termId: subject, complemented: false },
      predicate: { termId: predicate, complemented: false },
    }, "en", getBuiltInTerm)).toBe(expected);
  });

  it("keeps English subject and predicate forms in Japanese fallback", () => {
    const fallback = resolveCustomTermForDisplay({ id: "custom-term-1", labels: {
      ja: null,
      en: { subjectPlural: "mortal beings", predicatePhrase: "mortal" },
    } });
    const resolver = (id: string) => id === fallback.id ? fallback : getBuiltInTerm(id);
    expect(formatConcreteProposition({ form: "A", subject: { termId: fallback.id, complemented: false },
      predicate: { termId: "animal", complemented: false } }, "ja", resolver))
      .toBe("すべてのmortal beingsは動物である。");
    expect(formatConcreteProposition({ form: "A", subject: { termId: "human", complemented: false },
      predicate: { termId: fallback.id, complemented: false } }, "ja", resolver))
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
      { form: "A", subject: { termId: "custom-term-1", complemented: false }, predicate: { termId: "human", complemented: false } },
      "ja",
      resolver,
    )).toBe("すべての哲学者は人間である。");
    expect(formatConcreteProposition(
      { form: "I", subject: { termId: "human", complemented: false }, predicate: { termId: "custom-term-1", complemented: false } },
      "ja",
      resolver,
    )).toBe("ある人間は哲学者である。");
    expect(formatConcreteProposition(
      { form: "A", subject: { termId: "custom-term-1", complemented: false }, predicate: { termId: "human", complemented: false } },
      "en",
      resolver,
    )).toBe("All philosophers are humans.");
    expect(formatConcreteProposition(
      { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "custom-term-1", complemented: false } },
      "en",
      resolver,
    )).toBe("All humans are philosophers.");
    expect(() => formatConcreteProposition(
      { form: "A", subject: { termId: "unknown", complemented: false }, predicate: { termId: "human", complemented: false } },
      "en",
      resolver,
    )).toThrow('Unknown built-in term: "unknown".');
  });

  it("formats complemented concrete terms with Unicode prime", () => {
    const ja = formatConcreteProposition({
      form: "A",
      subject: { termId: "animal", complemented: true },
      predicate: { termId: "human", complemented: false },
    }, "ja", getBuiltInTerm);
    const en = formatConcreteProposition({
      form: "A",
      subject: { termId: "animal", complemented: true },
      predicate: { termId: "human", complemented: false },
    }, "en", getBuiltInTerm);
    expect(ja).toContain("動物′");
    expect(en).toContain("animals′");
    expect(`${ja}${en}`).not.toContain("'");
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
          {
            form,
            subject: { role: subject, complemented: false },
            predicate: { role: predicate, complemented: false },
          },
          locale,
        ),
      ).toBe(expected);
    },
  );

  it("is non-destructive and deterministic", () => {
    const proposition = Object.freeze({
      form: "A" as const,
      subject: { role: "S", complemented: false } as const,
      predicate: { role: "P", complemented: false } as const,
    });
    expect(formatAbstractProposition(proposition, "en")).toBe(
      formatAbstractProposition(proposition, "en"),
    );
    expect(proposition).toEqual({ form: "A", subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: false } });
  });

  it("formats S′, M′, and P′ with Unicode prime", () => {
    for (const role of ["S", "M", "P"] as const) {
      const text = formatAbstractProposition({
        form: "I",
        subject: { role, complemented: true },
        predicate: { role: role === "P" ? "S" : "P", complemented: false },
      }, "en");
      expect(text).toContain(`${role}′`);
      expect(text).not.toContain(`${role}'`);
    }
  });
});

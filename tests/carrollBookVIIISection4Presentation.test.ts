import { describe, expect, it } from "vitest";
import { buildConclusionPresentation } from "../src/app/conclusionPresentation";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_4 } from "./fixtures/carrollBookVIIISection4";
import { propositionId } from "./helpers/abstractSyllogismUniverse";
import { oracleConclusionIsEntailed } from "./helpers/semanticOracle";

const SOURCE_PRESENTATION_DIVERGENCES = [
  { number: 2, type: "O-instead-of-I-prime" },
  { number: 3, type: "O-instead-of-I-prime" },
  { number: 5, type: "O-instead-of-I-prime" },
  { number: 7, type: "O-instead-of-I-prime" },
  { number: 8, type: "O-instead-of-I-prime" },
  { number: 10, type: "optimized-multiple-basis" },
  { number: 12, type: "traditional-E-instead-of-source-A" },
  { number: 16, type: "optimized-multiple-basis" },
  { number: 19, type: "O-instead-of-I-prime" },
  { number: 21, type: "O-instead-of-I-prime" },
  { number: 24, type: "traditional-E-instead-of-source-A" },
  { number: 25, type: "O-instead-of-I-prime" },
  { number: 27, type: "optimized-multiple-basis" },
  { number: 28, type: "O-instead-of-I-prime" },
  { number: 30, type: "O-instead-of-I-prime" },
  { number: 35, type: "traditional-E-instead-of-source-A" },
  { number: 36, type: "O-instead-of-I-prime" },
  { number: 37, type: "O-instead-of-I-prime" },
  { number: 39, type: "O-instead-of-I-prime" },
] as const;

describe("Book VIII §4 source-backed presentation golden", () => {
  it("covers every source answer exactly once with its locator", () => {
    expect(CARROLL_BOOK_VIII_SECTION_4).toHaveLength(42);
    expect(CARROLL_BOOK_VIII_SECTION_4.filter(
      ({ expected }) => expected.kind === "conclusion",
    )).toHaveLength(34);
    expect(CARROLL_BOOK_VIII_SECTION_4.filter(
      ({ expected }) => expected.kind === "no-conclusion",
    )).toHaveLength(8);
    const locators = CARROLL_BOOK_VIII_SECTION_4.map(({ answerSource }) =>
      `${answerSource.work}:${answerSource.edition}:${answerSource.year}:${answerSource.book}:${answerSource.chapter}:${answerSource.section}:${answerSource.example}:${answerSource.printedPages.join("-")}`
    );
    expect(new Set(locators).size).toBe(42);
    expect(CARROLL_BOOK_VIII_SECTION_4.map(({ number }) => number)).toEqual(
      Array.from({ length: 42 }, (_, index) => index + 1),
    );
    expect(CARROLL_BOOK_VIII_SECTION_4.every(({ answerSource }) =>
      answerSource.chapter === 2 &&
      answerSource.printedPages[0] === 127 &&
      answerSource.printedPages[1] === 128
    )).toBe(true);
  });

  it("keeps exact matches and a reviewed list of source-policy divergences", () => {
    const mismatches: number[] = [];
    for (const testCase of CARROLL_BOOK_VIII_SECTION_4) {
      const result = inferSyllogismConclusion(
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      if (!result.ok) throw new Error(result.reason);
      const presentation = buildConclusionPresentation(
        result.completeConclusion,
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      const expected = testCase.expected.kind === "conclusion"
        ? testCase.expected.conclusions
        : null;
      if (JSON.stringify(presentation?.propositions ?? null) !== JSON.stringify(expected)) {
        mismatches.push(testCase.number);
      }
    }
    expect(mismatches).toEqual(
      SOURCE_PRESENTATION_DIVERGENCES.map(({ number }) => number),
    );
    expect(42 - mismatches.length).toBe(23);
    expect(new Set(SOURCE_PRESENTATION_DIVERGENCES.map(({ type }) => type))).toEqual(
      new Set([
        "O-instead-of-I-prime",
        "optimized-multiple-basis",
        "traditional-E-instead-of-source-A",
      ]),
    );
  });

  it("retains uncomplemented, complemented, and multiple source forms structurally", () => {
    const conclusionAt = (number: number) => {
      const expected = CARROLL_BOOK_VIII_SECTION_4[number - 1]?.expected;
      if (expected?.kind !== "conclusion") throw new Error(`Missing §4 No. ${number}.`);
      return expected.conclusions;
    };
    expect(conclusionAt(15)).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
    expect(conclusionAt(1)).toEqual([{
      form: "E",
      subject: { role: "S", complemented: true },
      predicate: { role: "P", complemented: true },
    }]);
    expect(conclusionAt(10)).toEqual([
      {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      {
        form: "A",
        subject: { role: "P", complemented: true },
        predicate: { role: "S", complemented: true },
      },
    ]);
  });

  it("keeps every presented proposition sound, deterministic, unique, and middle-free", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_4) {
      const result = inferSyllogismConclusion(testCase.premises, DEFAULT_LOGIC_SETTINGS);
      if (!result.ok) throw new Error(result.reason);
      const first = buildConclusionPresentation(
        result.completeConclusion,
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      const second = buildConclusionPresentation(
        result.completeConclusion,
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      expect(second).toEqual(first);
      const propositions = first?.propositions ?? [];
      expect(new Set(propositions.map(propositionId)).size).toBe(propositions.length);
      for (const proposition of propositions) {
        expect(proposition.subject.role).not.toBe("M");
        expect(proposition.predicate.role).not.toBe("M");
        expect(oracleConclusionIsEntailed(
          testCase.premises,
          proposition,
          DEFAULT_LOGIC_SETTINGS,
        )).toBe(true);
      }
    }
  });
});

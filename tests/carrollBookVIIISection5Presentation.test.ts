import { describe, expect, it } from "vitest";
import { computeProblem } from "../src/app/problemComputation";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { CARROLL_BOOK_VIII_SECTION_5 } from "./fixtures/carrollBookVIIISection5";
import { propositionId } from "./helpers/abstractSyllogismUniverse";
import { oracleConclusionIsEntailed } from "./helpers/semanticOracle";

const SOURCE_PRESENTATION_DIVERGENCES = {
  "O-instead-of-I-prime": [
    5, 7, 10, 16, 17, 19, 25, 29, 42, 45, 47, 49, 56, 60, 62, 64, 66,
    68, 73, 76, 77, 81, 91, 98,
  ],
  "source-orientation": [6, 14],
  "traditional-E-instead-of-source-A": [
    13, 18, 32, 35, 38, 41, 52, 59, 69, 72, 78, 85, 86, 101,
  ],
  "optimized-multiple-basis": [55, 87],
} as const;

const SOURCE_PRESENTATION_DIVERGENCE_NUMBERS = Object.values(
  SOURCE_PRESENTATION_DIVERGENCES,
).flat().sort((left, right) => left - right);

describe("Book VIII §5 source-backed presentation golden", () => {
  it("covers every source answer exactly once with its locator", () => {
    expect(CARROLL_BOOK_VIII_SECTION_5).toHaveLength(101);
    expect(CARROLL_BOOK_VIII_SECTION_5.map(({ number }) => number)).toEqual(
      Array.from({ length: 101 }, (_, index) => index + 1),
    );
    const locators = CARROLL_BOOK_VIII_SECTION_5.map(({ answerSource }) =>
      `${answerSource.work}:${answerSource.edition}:${answerSource.year}:${answerSource.book}:${answerSource.chapter}:${answerSource.section}:${answerSource.example}:${answerSource.printedPages.join("-")}`
    );
    expect(new Set(locators).size).toBe(101);
    expect(CARROLL_BOOK_VIII_SECTION_5.every(({ answerSource }) =>
      answerSource.chapter === 2 &&
      answerSource.printedPages[0] === 128 &&
      answerSource.printedPages[1] === 130
    )).toBe(true);
  });

  it("keeps exact matches and a reviewed list of source-policy divergences", () => {
    const mismatches: number[] = [];
    for (const testCase of CARROLL_BOOK_VIII_SECTION_5) {
      const computation = computeProblem(
        { id: `carroll-viii-5-${testCase.number}`, premises: testCase.concretePremises },
        DEFAULT_LOGIC_SETTINGS,
      );
      const expected = testCase.expected.kind === "conclusion"
        ? testCase.expected.propositions
        : null;
      const actual = computation.conclusionPresentation?.propositions ?? null;
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        mismatches.push(testCase.number);
      }
    }
    expect(mismatches).toEqual(SOURCE_PRESENTATION_DIVERGENCE_NUMBERS);
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(0, 12).filter(
      ({ number }) => mismatches.includes(number),
    )).toHaveLength(4);
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(12, 24).filter(
      ({ number }) => mismatches.includes(number),
    )).toHaveLength(6);
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(24).filter(
      ({ number }) => mismatches.includes(number),
    )).toHaveLength(32);
    expect(101 - mismatches.length).toBe(59);
  });

  it("retains Carroll's reverse-equivalent source orientation", () => {
    const expected = CARROLL_BOOK_VIII_SECTION_5[13]?.expected;
    if (expected?.kind !== "conclusion") throw new Error("Missing §5 No. 14.");
    expect(expected.propositions).toEqual([{
      form: "E",
      subject: { role: "P", complemented: false },
      predicate: { role: "S", complemented: false },
    }]);
  });

  it("keeps every presented proposition sound, deterministic, unique, and middle-free", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_5) {
      const first = computeProblem(
        { id: `carroll-viii-5-${testCase.number}`, premises: testCase.concretePremises },
        DEFAULT_LOGIC_SETTINGS,
      ).conclusionPresentation;
      const second = computeProblem(
        { id: `another-${testCase.number}`, premises: testCase.concretePremises },
        DEFAULT_LOGIC_SETTINGS,
      ).conclusionPresentation;
      expect(second).toEqual(first);
      const propositions = first?.propositions ?? [];
      expect(new Set(propositions.map(propositionId)).size).toBe(propositions.length);
      for (const proposition of propositions) {
        expect(proposition.subject.role).not.toBe("M");
        expect(proposition.predicate.role).not.toBe("M");
        expect(oracleConclusionIsEntailed(
          testCase.abstractPremises,
          proposition,
          DEFAULT_LOGIC_SETTINGS,
        )).toBe(true);
      }
    }
  });
});

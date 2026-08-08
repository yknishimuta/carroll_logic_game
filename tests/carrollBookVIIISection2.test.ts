import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { syllogismToConstraints } from "../src/logic/constraintMerge";
import { createTriliteralCounterPlacements } from "../src/logic/counterPlacements";
import { CARROLL_BOOK_VIII_SECTION_2 } from "./fixtures/carrollBookVIIISection2";
import {
  normalizeCarrollTriliteralDiagram,
  normalizedCarrollExpectedDiagram,
} from "./helpers/carrollBookVIII";

describe("Lewis Carroll Book VIII §2 golden corpus", () => {
  it("contains every numbered example from 1 through 32 exactly once", () => {
    const numbers = CARROLL_BOOK_VIII_SECTION_2.map(({ number }) => number);
    expect(numbers).toEqual(Array.from({ length: 32 }, (_, index) => index + 1));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("keeps non-empty source transcriptions and Unicode primes", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_2) {
      expect(testCase.sourceText.every((line) => line.length > 0)).toBe(true);
      expect(testCase.sourceText.join(" ")).not.toContain("'");
      expect(testCase.expected.emptyCells.length + testCase.expected.existence.length)
        .toBeGreaterThan(0);
    }
  });

  for (const testCase of CARROLL_BOOK_VIII_SECTION_2) {
    it(`Book VIII §2 No. ${testCase.number} matches Carroll's triliteral answer`, () => {
      const state = syllogismToConstraints(
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      const actual = normalizeCarrollTriliteralDiagram(
        createTriliteralCounterPlacements(state),
      );
      expect(actual).toEqual(
        normalizedCarrollExpectedDiagram(testCase.expected),
      );
    });
  }
});

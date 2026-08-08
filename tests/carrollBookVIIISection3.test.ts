import { describe, expect, it } from "vitest";
import { projectToBiliteralDiagram } from "../src/logic/biliteralProjection";
import { CARROLL_BOOK_VIII_SECTION_3 } from "./fixtures/carrollBookVIIISection3";
import {
  normalizeCarrollBiliteralInformation,
  normalizedCarrollExpectedBiliteralInformation,
} from "./helpers/carrollBookVIII";

describe("Lewis Carroll Book VIII §3 golden corpus", () => {
  it("contains exactly the twenty numbered source diagrams", () => {
    const numbers = CARROLL_BOOK_VIII_SECTION_3.map(({ number }) => number);
    expect(numbers).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("keeps complete immutable source and answer metadata with Unicode primes", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_3) {
      expect(testCase.sourceDiagram).toBeDefined();
      expect(testCase.expectedBiliteralInformation).toBeDefined();
      expect(testCase.sourceAnswerText.length).toBeGreaterThan(0);
      expect(testCase.sourceAnswerText).not.toContain("'");
      expect(testCase.source).toMatchObject({
        book: 8,
        chapter: 1,
        section: 3,
        example: testCase.number,
      });
    }
  });

  for (const testCase of CARROLL_BOOK_VIII_SECTION_3) {
    it(`Book VIII §3 No. ${testCase.number} matches Carroll's interpretation`, () => {
      const actual = normalizeCarrollBiliteralInformation(
        projectToBiliteralDiagram(testCase.sourceDiagram),
      );
      expect(actual).toEqual(
        normalizedCarrollExpectedBiliteralInformation(
          testCase.expectedBiliteralInformation,
        ),
      );
    });
  }
});

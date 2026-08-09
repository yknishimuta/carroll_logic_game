import { describe, expect, it } from "vitest";
import { buildConclusionPresentation } from "../src/app/conclusionPresentation";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_6 } from "./fixtures/carrollBookVIIISection6";

describe("Book VIII §6 limited source-backed presentation golden", () => {
  it("presents Carroll's explicit correction for No. 22", () => {
    const testCase = CARROLL_BOOK_VIII_SECTION_6[21];
    expect(testCase?.number).toBe(22);
    expect(testCase?.answerSource).toEqual({
      work: "Symbolic Logic, Part I: Elementary",
      edition: 4,
      year: 1897,
      book: 8,
      chapter: 2,
      section: 6,
      example: 22,
      printedPages: [130, 131],
    });
    if (testCase?.expected.kind !== "wrong") {
      throw new Error("Book VIII §6 No. 22 must retain its explicit correction.");
    }
    const result = inferSyllogismConclusion(
      testCase.premises,
      DEFAULT_LOGIC_SETTINGS,
    );
    if (!result.ok) throw new Error(result.reason);
    expect(buildConclusionPresentation(
      result.completeConclusion,
      testCase.premises,
      DEFAULT_LOGIC_SETTINGS,
    )?.propositions).toEqual([testCase.expected.correctConclusion]);
    expect(testCase.expected.correctConclusion).toEqual({
      form: "I",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    });
  });
});

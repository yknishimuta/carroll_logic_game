import { describe, expect, it } from "vitest";
import type { SyllogismConclusion } from "../src/domain/conclusion";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { abstractTerm } from "../src/domain/term";
import {
  inferSyllogismConclusion,
} from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_4 } from "./fixtures/carrollBookVIIISection4";
import {
  carrollConclusionEvidence,
  isCarrollConclusionEntailedByBiliteralState,
} from "./helpers/carrollBookVIII";
import { oracleConclusionIsEntailed } from "./helpers/semanticOracle";

const SIGNED_CONCLUSION_CANDIDATES: readonly SyllogismConclusion[] = (
  [["S", "P"], ["P", "S"]] as const
).flatMap(([subjectRole, predicateRole]) =>
  ([false, true] as const).flatMap((subjectComplemented) =>
    ([false, true] as const).flatMap((predicateComplemented) =>
      (["A", "E", "I", "O"] as const).map((form) => ({
        form,
        subject: abstractTerm(subjectRole, subjectComplemented),
        predicate: abstractTerm(predicateRole, predicateComplemented),
      }))
    )
  )
);

function oracleConclusions(
  premises: (typeof CARROLL_BOOK_VIII_SECTION_4)[number]["premises"],
): readonly SyllogismConclusion[] {
  return SIGNED_CONCLUSION_CANDIDATES.filter((candidate) =>
    oracleConclusionIsEntailed(
      premises,
      candidate,
      DEFAULT_LOGIC_SETTINGS,
    ) === true
  );
}

function productionConclusionEvidence(production: Extract<
  ReturnType<typeof inferSyllogismConclusion>,
  { readonly ok: true }
>): readonly string[] {
  return [...new Set((production.completeConclusion?.propositions ?? []).flatMap(
    carrollConclusionEvidence,
  ))].sort();
}

describe("Lewis Carroll Book VIII §4 golden corpus", () => {
  it("contains every explicitly answered example from 1 through 42 exactly once", () => {
    const numbers = CARROLL_BOOK_VIII_SECTION_4.map(({ number }) => number);
    expect(numbers).toEqual(Array.from({ length: 42 }, (_, index) => index + 1));
    expect(new Set(numbers).size).toBe(numbers.length);
  });

  it("keeps non-empty source transcriptions, answers, and Unicode primes", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_4) {
      expect(testCase.sourceText.every((line) => line.length > 0)).toBe(true);
      expect(testCase.sourceText.join(" ")).not.toContain("'");
      expect(testCase.expected.sourceAnswerText.length).toBeGreaterThan(0);
      if (testCase.expected.kind === "conclusion") {
        expect(testCase.expected.conclusions.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves every part of Carroll's complete answers", () => {
    const incompleteCanonicalCases = CARROLL_BOOK_VIII_SECTION_4.flatMap(
      (testCase) => {
        if (testCase.expected.kind === "no-conclusion") return [];
        const production = inferSyllogismConclusion(
          testCase.premises,
          DEFAULT_LOGIC_SETTINGS,
        );
        if (!production.ok || production.completeConclusion === null) {
          return [testCase.number];
        }
        const expectedEvidence = [...new Set(
          testCase.expected.conclusions.flatMap(carrollConclusionEvidence),
        )].sort();
        const productionEvidence = productionConclusionEvidence(production);
        return expectedEvidence.length === productionEvidence.length &&
            expectedEvidence.every((value, index) =>
              value === productionEvidence[index]
            )
          ? []
          : [testCase.number];
      },
    );
    expect(incompleteCanonicalCases).toEqual([]);
  });

  for (const testCase of CARROLL_BOOK_VIII_SECTION_4) {
    it(`Book VIII §4 No. ${testCase.number} matches Carroll's answer`, () => {
      const production = inferSyllogismConclusion(
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      expect(production.ok).toBe(true);
      if (!production.ok) return;

      const oracle = oracleConclusions(testCase.premises);
      if (testCase.expected.kind === "no-conclusion") {
        expect(production.completeConclusion).toBeNull();
        expect(oracle).toEqual([]);
        return;
      }

      for (const expectedConclusion of testCase.expected.conclusions) {
        expect(isCarrollConclusionEntailedByBiliteralState(
          production.biliteralState,
          expectedConclusion,
        )).toBe(true);
        expect(oracle).toContainEqual(expectedConclusion);
      }

      expect(production.completeConclusion).not.toBeNull();
      for (const conclusion of production.completeConclusion?.propositions ?? []) {
        expect(isCarrollConclusionEntailedByBiliteralState(
          production.biliteralState,
          conclusion,
        )).toBe(true);
        expect(oracle).toContainEqual(conclusion);
      }
      const expectedEvidence = [...new Set(
        testCase.expected.conclusions.flatMap(carrollConclusionEvidence),
      )].sort();
      expect(productionConclusionEvidence(production)).toEqual(
        expectedEvidence,
      );
    });
  }
});

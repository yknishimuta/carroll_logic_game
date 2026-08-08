import { describe, expect, it } from "vitest";
import type { SyllogismConclusion } from "../src/domain/conclusion";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import { abstractTerm } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_6 } from "./fixtures/carrollBookVIIISection6";
import {
  carrollConclusionEvidence,
  normalizeCarrollBiliteralInformation,
} from "./helpers/carrollBookVIII";
import {
  oracleConclusionIsEntailed,
  oracleSatisfyingModels,
} from "./helpers/semanticOracle";

const SIGNED_RETINEND_CANDIDATES: readonly SyllogismConclusion[] = (
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

function biliteralEvidence(
  state: Parameters<typeof normalizeCarrollBiliteralInformation>[0],
): readonly string[] {
  const information = normalizeCarrollBiliteralInformation(state);
  return [
    ...information.emptyCells.map((cell) => `empty:${cell}`),
    ...information.occupiedCells.map((cell) => `existence:${cell}`),
  ].sort();
}

function oracleConclusions(
  premises: (typeof CARROLL_BOOK_VIII_SECTION_6)[number]["premises"],
): readonly SyllogismConclusion[] {
  return SIGNED_RETINEND_CANDIDATES.filter((candidate) =>
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

describe("Lewis Carroll Book VIII §6 golden corpus", () => {
  it("contains exactly Nos. 1–40 once", () => {
    const numbers = CARROLL_BOOK_VIII_SECTION_6.map(({ number }) => number);
    expect(numbers).toEqual(Array.from({ length: 40 }, (_, index) => index + 1));
    expect(new Set(numbers).size).toBe(40);
  });

  it("keeps three non-empty source propositions with Unicode primes", () => {
    for (const testCase of CARROLL_BOOK_VIII_SECTION_6) {
      expect(testCase.sourceText).toHaveLength(3);
      expect(testCase.sourceText.every((line) => line.length > 0)).toBe(true);
      expect(testCase.sourceText.join(" ")).not.toContain("'");
      expect(testCase.proposedConclusion).toBeDefined();
      expect(testCase.expected).toBeDefined();
    }
  });

  it("records Carroll's assessment totals and fallacy case numbers", () => {
    const casesByKind = (kind: (typeof CARROLL_BOOK_VIII_SECTION_6)[number]["expected"]["kind"]) =>
      CARROLL_BOOK_VIII_SECTION_6.filter(({ expected }) => expected.kind === kind);
    expect(casesByKind("right")).toHaveLength(32);
    expect(casesByKind("wrong").map(({ number }) => number)).toEqual([22]);
    expect(casesByKind("no-conclusion").map(({ number }) => number)).toEqual([
      2, 6, 7, 16, 28, 34, 38,
    ]);
    expect(casesByKind("incomplete")).toHaveLength(0);

    const noConclusionCases = casesByKind("no-conclusion");
    expect(noConclusionCases.flatMap(({ number, expected }) =>
      expected.kind === "no-conclusion" &&
          expected.fallacy === "like-eliminands-not-asserted-to-exist"
        ? [number]
        : []
    )).toEqual([2, 6, 16, 28, 38]);
    expect(noConclusionCases.flatMap(({ number, expected }) =>
      expected.kind === "no-conclusion" &&
          expected.fallacy === "unlike-eliminands-with-entity-premiss"
        ? [number]
        : []
    )).toEqual([7, 34]);
  });

  for (const testCase of CARROLL_BOOK_VIII_SECTION_6) {
    it(`Book VIII §6 No. ${testCase.number} matches Carroll's assessment`, () => {
      const production = inferSyllogismConclusion(
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      );
      expect(production.ok).toBe(true);
      if (!production.ok) return;

      expect(oracleSatisfyingModels(
        testCase.premises,
        DEFAULT_LOGIC_SETTINGS,
      ).length).toBeGreaterThan(0);
      const actualEvidence = biliteralEvidence(production.biliteralState);
      const proposedEvidence = carrollConclusionEvidence(
        testCase.proposedConclusion,
      );
      const oracle = oracleConclusions(testCase.premises);

      switch (testCase.expected.kind) {
        case "right":
          expect(actualEvidence).toEqual(proposedEvidence);
          expect(oracle).toContainEqual(testCase.proposedConclusion);
          expect(production.completeConclusion).not.toBeNull();
          for (const conclusion of production.completeConclusion?.propositions ?? []) {
            expect(oracle).toContainEqual(conclusion);
          }
          expect(productionConclusionEvidence(production))
            .toEqual(proposedEvidence);
          break;
        case "wrong":
          expect(actualEvidence).not.toEqual(proposedEvidence);
          expect(actualEvidence).toEqual(
            carrollConclusionEvidence(testCase.expected.correctConclusion),
          );
          expect(oracle).not.toContainEqual(testCase.proposedConclusion);
          expect(oracle).toContainEqual(testCase.expected.correctConclusion);
          expect(production.completeConclusion).not.toBeNull();
          expect(productionConclusionEvidence(production)).toEqual(
            carrollConclusionEvidence(testCase.expected.correctConclusion),
          );
          break;
        case "no-conclusion":
          expect(actualEvidence).toEqual([]);
          expect(production.completeConclusion).toBeNull();
          expect(oracle).toEqual([]);
          break;
        case "incomplete":
          expect(actualEvidence).not.toEqual(proposedEvidence);
          for (const omitted of testCase.expected.omittedInformation) {
            expect(actualEvidence).toEqual(expect.arrayContaining(
              [...carrollConclusionEvidence(omitted)],
            ));
          }
          break;
      }
    });
  }

  it("treats No. 1 as the right prime-bearing syllogism", () => {
    const testCase = CARROLL_BOOK_VIII_SECTION_6[0];
    expect(testCase?.number).toBe(1);
    const production = inferSyllogismConclusion(
      testCase!.premises,
      DEFAULT_LOGIC_SETTINGS,
    );
    expect(production.ok).toBe(true);
    if (!production.ok) return;
    expect(biliteralEvidence(production.biliteralState)).toEqual(
      carrollConclusionEvidence(testCase!.proposedConclusion),
    );
  });

  it("rejects No. 22's proposal and obtains Some x are y", () => {
    const testCase = CARROLL_BOOK_VIII_SECTION_6[21];
    expect(testCase?.number).toBe(22);
    expect(testCase?.expected.kind).toBe("wrong");
    if (testCase?.expected.kind !== "wrong") return;
    const production = inferSyllogismConclusion(
      testCase.premises,
      DEFAULT_LOGIC_SETTINGS,
    );
    expect(production.ok).toBe(true);
    if (!production.ok) return;
    expect(biliteralEvidence(production.biliteralState)).toEqual(
      carrollConclusionEvidence(testCase.expected.correctConclusion),
    );
  });
});

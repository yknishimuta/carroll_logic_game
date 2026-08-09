import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import type { TermDefinition } from "../src/domain/term";
import { abstractProposition, abstractSyllogism } from "../src/logic/abstraction";
import { assignTermRoles } from "../src/logic/termAssignment";
import {
  computeProblem,
} from "../src/app/problemComputation";
import { concreteProposition } from "../src/logic/abstraction";
import { formatConcreteProposition } from "../src/i18n/propositionFormatter";
import { CARROLL_BOOK_VIII_SECTION_5 } from "./fixtures/carrollBookVIIISection5";
import {
  premiseRetinendClosure,
  propositionSetRetinendClosure,
} from "./helpers/completeConclusionOracle";

describe("Lewis Carroll Book VIII §5 golden corpus", () => {
  it("contains exactly Nos. 1–101 with complete source and verification metadata", () => {
    const numbers = CARROLL_BOOK_VIII_SECTION_5.map(({ number }) => number);
    expect(CARROLL_BOOK_VIII_SECTION_5).toHaveLength(101);
    expect(numbers).toEqual(Array.from({ length: 101 }, (_, index) => index + 1));
    expect(new Set(numbers).size).toBe(numbers.length);
    for (const testCase of CARROLL_BOOK_VIII_SECTION_5) {
      expect(testCase.sourcePremises).toHaveLength(2);
      expect(testCase.sourcePremises.every((value) => value.length > 0)).toBe(true);
      expect(testCase.sourceAnswerText.length).toBeGreaterThan(0);
      expect(testCase.verification.answerChecked).toBe(true);
      expect(new Set(Object.values(testCase.assignment)).size).toBe(3);
      expect(testCase.expected.kind === "no-conclusion" || testCase.expected.propositions.length > 0).toBe(true);
    }
    expect(CARROLL_BOOK_VIII_SECTION_5.filter(({ verification }) => verification.workedSolutionChecked).map(({ number }) => number))
      .toEqual(Array.from({ length: 24 }, (_, index) => index + 1));
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(0, 12).every(({ verification }) => verification.method === "diagram")).toBe(true);
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(12, 24).every(({ verification }) => verification.method === "subscript")).toBe(true);
    expect(CARROLL_BOOK_VIII_SECTION_5.slice(24).every(({ verification }) =>
      verification.method === null && verification.abstractionDoubleChecked
    )).toBe(true);
  });

  for (const testCase of CARROLL_BOOK_VIII_SECTION_5) {
    it(`Book VIII §5 No. ${testCase.number} [abstraction]`, () => {
      expect(assignTermRoles(testCase.concretePremises)).toEqual(testCase.assignment);
      expect(abstractSyllogism(testCase.concretePremises)).toEqual(testCase.abstractPremises);
    });

    it(`Book VIII §5 No. ${testCase.number} [complete conclusion]`, () => {
      const computation = computeProblem({ id: `carroll-viii-5-${testCase.number}`, premises: testCase.concretePremises }, DEFAULT_LOGIC_SETTINGS);
      expect(computation.abstractPremises).toEqual(testCase.abstractPremises);
      const premiseClosure = premiseRetinendClosure(testCase.abstractPremises, DEFAULT_LOGIC_SETTINGS);
      expect(premiseClosure).not.toBeNull();
      if (testCase.expected.kind === "no-conclusion") {
        expect(computation.completeConclusion).toBeNull();
        expect(premiseClosure).toEqual([]);
        return;
      }
      expect(computation.completeConclusion).not.toBeNull();
      expect(propositionSetRetinendClosure(
        computation.completeConclusion?.propositions ?? [],
        DEFAULT_LOGIC_SETTINGS,
      )).toEqual(propositionSetRetinendClosure(
        testCase.expected.propositions,
        DEFAULT_LOGIC_SETTINGS,
      ));
    });

    it(`Book VIII §5 No. ${testCase.number} [concrete round-trip]`, () => {
      const computation = computeProblem({ id: `carroll-viii-5-${testCase.number}`, premises: testCase.concretePremises }, DEFAULT_LOGIC_SETTINGS);
      const presentedRoundTrip = computation.concreteConclusions.map((value) =>
        abstractProposition(value, testCase.assignment)
      );
      expect(presentedRoundTrip).toEqual(
        computation.conclusionPresentation?.propositions ?? [],
      );
      const semanticRoundTrip = (computation.completeConclusion?.propositions ?? [])
        .map((value) => concreteProposition(value, testCase.assignment))
        .map((value) => abstractProposition(value, testCase.assignment));
      expect(semanticRoundTrip).toEqual(
        computation.completeConclusion?.propositions ?? [],
      );
      expect(propositionSetRetinendClosure(semanticRoundTrip, DEFAULT_LOGIC_SETTINGS)).toEqual(
        propositionSetRetinendClosure(
          testCase.expectedConcreteConclusions.map((value) =>
            abstractProposition(value, testCase.assignment)
          ),
          DEFAULT_LOGIC_SETTINGS,
        ),
      );
    });
  }

  it.each([1, 2, 9, 25, 31, 55] as const)("Book VIII §5 No. %i [English formatter spot-check]", (number) => {
    const testCase = CARROLL_BOOK_VIII_SECTION_5[number - 1]!;
    const terms = new Map(Object.entries(testCase.assignment).map(([role, id]) => {
      const label = testCase.dictionary[role as "S" | "M" | "P"];
      return [id, {
        id,
        labels: {
          ja: { nounPhrase: label },
          en: { subjectPlural: label, predicatePhrase: label },
        },
      } satisfies TermDefinition] as const;
    }));
    const resolver = (id: string): TermDefinition => {
      const term = terms.get(id);
      if (term === undefined) throw new Error(`Unknown §5 term ${id}.`);
      return term;
    };
    for (const conclusion of testCase.expectedConcreteConclusions) {
      const formatted = formatConcreteProposition(conclusion, "en", resolver);
      expect(formatted.endsWith(".")).toBe(true);
      if (conclusion.subject.complemented || conclusion.predicate.complemented) {
        expect(formatted).toContain("′");
      }
    }
  });
});

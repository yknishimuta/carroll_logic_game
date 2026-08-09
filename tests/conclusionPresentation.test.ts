import { describe, expect, it } from "vitest";
import {
  buildCanonicalCompletePresentation,
  buildConclusionPresentation,
  comparePresentationBases,
} from "../src/app/conclusionPresentation";
import { computeProblem } from "../src/app/problemComputation";
import { getBuiltInProblem } from "../src/data/problems";
import type { CompleteConclusion } from "../src/domain/conclusion";
import { DEFAULT_LOGIC_SETTINGS } from "../src/domain/logicSettings";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import type { AbstractProposition } from "../src/domain/proposition";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import {
  ABSTRACT_PREMISE_PAIRS,
  propositionId,
} from "./helpers/abstractSyllogismUniverse";
import { propositionSetRetinendClosure } from "./helpers/completeConclusionOracle";
import { oracleConclusionIsEntailed } from "./helpers/semanticOracle";

const CLASSIC_BARABARA: AbstractSyllogism = {
  firstPremise: {
    form: "A",
    subject: { role: "M", complemented: false },
    predicate: { role: "P", complemented: false },
  },
  secondPremise: {
    form: "A",
    subject: { role: "S", complemented: false },
    predicate: { role: "M", complemented: false },
  },
};

function computeBuiltIn(id: Parameters<typeof getBuiltInProblem>[0]) {
  return computeProblem(getBuiltInProblem(id));
}

describe("ConclusionPresentation policy", () => {
  it("uses null only for no conclusion", () => {
    expect(buildConclusionPresentation(
      null,
      CLASSIC_BARABARA,
      DEFAULT_LOGIC_SETTINGS,
    )).toBeNull();
    const computation = computeBuiltIn("invalid-undistributed-middle");
    expect(computation.completeConclusion).toBeNull();
    expect(computation.conclusionPresentation).toBeNull();
  });

  it.each([
    ["barbara-aaa1", "A"],
    ["celarent-eae1", "E"],
    ["darii-aii1", "I"],
    ["ferio-eio1", "O"],
    ["cesare-eae2", "E"],
  ] as const)(
    "presents the traditional uncomplemented S-to-P conclusion for %s",
    (id, form) => {
      const computation = computeBuiltIn(id);
      expect(computation.conclusionPresentation?.propositions).toEqual([{
        form,
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      }]);
    },
  );

  it("keeps the complete semantic basis while presenting Celarent conventionally", () => {
    const computation = computeBuiltIn("celarent-eae1");
    expect(computation.completeConclusion?.biliteralState).toEqual({
      emptyCells: ["SP"],
      existentials: [
        { sourceId: "second-premise", possibleCells: ["Sp"] },
      ],
    });
    expect(computation.completeConclusion?.propositions).toEqual([{
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    }]);
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
    expect(computation.concreteConclusions).toEqual([{
      form: "E",
      subject: { termId: "snake", complemented: false },
      predicate: { termId: "warm-blooded", complemented: false },
    }]);
    expect(computation.conclusionPlacements).toEqual({
      emptinessCounters: [
        { kind: "emptiness", anchor: { type: "cell", cell: "SP" } },
      ],
      existenceCounters: [{
        kind: "existence",
        sourceIds: ["second-premise"],
        anchor: { type: "cell", cell: "Sp" },
      }],
    });
  });

  it("applies the same Celarent policy to a custom problem without a mood ID", () => {
    const computation = computeProblem({
      id: "custom-problem",
      premises: {
        firstPremise: {
          form: "E",
          subject: { termId: "animal", complemented: false },
          predicate: { termId: "mortal", complemented: false },
        },
        secondPremise: {
          form: "A",
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: false },
        },
      },
    });
    expect(computation.abstractPremises).toEqual({
      firstPremise: {
        form: "E",
        subject: { role: "M", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "M", complemented: false },
      },
    });
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
  });

  it("preserves No. 25's required complemented predicate", () => {
    const computation = computeProblem({
      id: "carroll-viii-i-6-25",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "pet", complemented: false },
          predicate: { termId: "mortal", complemented: false },
        },
        secondPremise: {
          form: "E",
          subject: { termId: "human", complemented: false },
          predicate: { termId: "pet", complemented: true },
        },
      },
    });
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "E",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    }]);
  });

  it("keeps No. 10 semantically complete with the optimal two-proposition basis", () => {
    const computation = computeProblem({
      id: "carroll-viii-i-4-10",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "y", complemented: true },
          predicate: { termId: "m", complemented: true },
        },
        secondPremise: {
          form: "A",
          subject: { termId: "x", complemented: false },
          predicate: { termId: "m", complemented: false },
        },
      },
    });
    expect(computation.conclusionPresentation?.propositions).toEqual([
      {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      {
        form: "O",
        subject: { role: "S", complemented: true },
        predicate: { role: "P", complemented: false },
      },
    ]);
    expect(propositionSetRetinendClosure(
      computation.conclusionPresentation?.propositions ?? [],
      DEFAULT_LOGIC_SETTINGS,
    )).toEqual(propositionSetRetinendClosure(
      computation.completeConclusion?.propositions ?? [],
      DEFAULT_LOGIC_SETTINGS,
    ));
  });

  it("normalizes Sp existence to O(S,P), not I(S,P′)", () => {
    const completeConclusion: CompleteConclusion = {
      biliteralState: {
        emptyCells: [],
        existentials: [{ sourceId: "test", possibleCells: ["Sp"] }],
      },
      propositions: [{
        form: "I",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: true },
      }],
    };
    expect(buildCanonicalCompletePresentation(
      completeConclusion,
      DEFAULT_LOGIC_SETTINGS,
    ).propositions).toEqual([{
      form: "O",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
  });

  it.each([
    [
      { emptyCells: ["SP"], existentials: [] },
      { form: "E", subject: { role: "P", complemented: false }, predicate: { role: "S", complemented: false } },
      { form: "E", subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: false } },
    ],
    [
      { emptyCells: [], existentials: [{ sourceId: "test", possibleCells: ["SP"] }] },
      { form: "I", subject: { role: "P", complemented: false }, predicate: { role: "S", complemented: false } },
      { form: "I", subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: false } },
    ],
    [
      { emptyCells: ["Sp"], existentials: [] },
      { form: "E", subject: { role: "P", complemented: true }, predicate: { role: "S", complemented: false } },
      { form: "E", subject: { role: "S", complemented: false }, predicate: { role: "P", complemented: true } },
    ],
  ] as const)("normalizes symmetric and one-prime conclusions to S-to-P", (state, semantic, expected) => {
    expect(buildCanonicalCompletePresentation({
      biliteralState: state,
      propositions: [semantic],
    }, DEFAULT_LOGIC_SETTINGS).propositions).toEqual([expected]);
  });

  it("uses the Stage 4 policy for a complemented custom problem", () => {
    const computation = computeProblem({
      id: "custom-complemented-o",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "animal", complemented: false },
          predicate: { termId: "mortal", complemented: true },
        },
        secondPremise: {
          form: "I",
          subject: { termId: "human", complemented: false },
          predicate: { termId: "animal", complemented: false },
        },
      },
    });
    expect(computation.conclusionPresentation?.propositions).toEqual([{
      form: "O",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: false },
    }]);
    expect(propositionSetRetinendClosure(
      computation.conclusionPresentation?.propositions ?? [],
      DEFAULT_LOGIC_SETTINGS,
    )).toEqual(propositionSetRetinendClosure(
      computation.completeConclusion?.propositions ?? [],
      DEFAULT_LOGIC_SETTINGS,
    ));
  });

  it("compares bases by the documented lexicographic priority", () => {
    const p = (
      form: AbstractProposition["form"],
      subjectRole: "S" | "P",
      subjectComplemented = false,
      predicateComplemented = false,
    ): AbstractProposition => ({
      form,
      subject: { role: subjectRole, complemented: subjectComplemented },
      predicate: {
        role: subjectRole === "S" ? "P" : "S",
        complemented: predicateComplemented,
      },
    });
    expect(comparePresentationBases([p("A", "S", true, true)], [p("A", "S"), p("E", "S")])).toBeLessThan(0);
    expect(comparePresentationBases([p("I", "S")], [p("I", "S", false, true)])).toBeLessThan(0);
    expect(comparePresentationBases([p("E", "S")], [p("E", "P")])).toBeLessThan(0);
    expect(comparePresentationBases([p("E", "S", false, true)], [p("E", "S", true, false)])).toBeLessThan(0);
    expect(comparePresentationBases([p("A", "S")], [p("E", "S")])).toBeLessThan(0);
  });
});

describe.each([
  ["Carroll", DEFAULT_LOGIC_SETTINGS],
  ["modern", { existentialImport: "modern" }],
] as const satisfies readonly (readonly [string, LogicSettings])[])(
  "Stage 4 exhaustive properties in %s mode",
  (_label, settings) => {
    it("is sound, complete, duplicate-free, deterministic, and retinend-only", () => {
      for (const premises of ABSTRACT_PREMISE_PAIRS) {
        const occurrences = [
          premises.firstPremise.subject,
          premises.firstPremise.predicate,
          premises.secondPremise.subject,
          premises.secondPremise.predicate,
        ];
        if (occurrences.every(({ complemented }) => !complemented)) continue;

        const result = inferSyllogismConclusion(premises, settings);
        if (!result.ok) throw new Error(result.reason);
        const first = buildConclusionPresentation(
          result.completeConclusion,
          premises,
          settings,
        );
        const second = buildConclusionPresentation(
          result.completeConclusion,
          premises,
          settings,
        );
        expect(second).toEqual(first);
        if (result.completeConclusion === null) {
          expect(first).toBeNull();
          continue;
        }
        if (first === null) throw new Error("Presentation unexpectedly missing.");

        expect(propositionSetRetinendClosure(first.propositions, settings)).toEqual(
          propositionSetRetinendClosure(
            result.completeConclusion.propositions,
            settings,
          ),
        );
        expect(new Set(first.propositions.map(propositionId)).size).toBe(
          first.propositions.length,
        );
        for (const proposition of first.propositions) {
          expect(proposition.subject.role).not.toBe("M");
          expect(proposition.predicate.role).not.toBe("M");
          expect(oracleConclusionIsEntailed(premises, proposition, settings)).toBe(true);
        }
      }
    });
  },
);

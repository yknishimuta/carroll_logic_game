import { describe, expect, it } from "vitest";
import type { SyllogismConclusion } from "../src/domain/conclusion";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import { abstractTerm } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_4 } from "./fixtures/carrollBookVIIISection4";
import { CARROLL_BOOK_VIII_SECTION_6 } from "./fixtures/carrollBookVIIISection6";
import {
  ABSTRACT_PREMISE_PAIRS,
  MP_VARIANTS,
  premisePairId,
  propositionId,
  SIGNED_RETINEND_CANDIDATES,
  SM_VARIANTS,
} from "./helpers/abstractSyllogismUniverse";
import {
  premiseRetinendClosure,
  propositionSetRetinendClosure,
  setDifference,
} from "./helpers/completeConclusionOracle";
import { oracleConclusionIsEntailed } from "./helpers/semanticOracle";

interface InvariantStatistics {
  readonly premisePairs: number;
  readonly satisfiable: number;
  readonly inconsistent: number;
  readonly noConclusion: number;
  readonly singleConclusion: number;
  readonly multipleConclusion: number;
  readonly propositionCountDistribution: Readonly<Record<number, number>>;
  readonly maximumPropositionCount: number;
  readonly maximumExample: string | null;
}

const CARROLL = { existentialImport: "carroll" as const };
const SETTINGS = [
  CARROLL,
  { existentialImport: "modern" as const },
];
const EXPECTED_STATISTICS: Readonly<Record<
  LogicSettings["existentialImport"],
  InvariantStatistics
>> = {
  carroll: {
    premisePairs: 1024,
    satisfiable: 1024,
    inconsistent: 0,
    noConclusion: 584,
    singleConclusion: 432,
    multipleConclusion: 8,
    propositionCountDistribution: { 0: 584, 1: 432, 2: 8 },
    maximumPropositionCount: 2,
    maximumExample: "A:P>M + A:S>M′ => A:S>P′ + A:P>S′",
  },
  modern: {
    premisePairs: 1024,
    satisfiable: 1024,
    inconsistent: 0,
    noConclusion: 640,
    singleConclusion: 384,
    multipleConclusion: 0,
    propositionCountDistribution: { 0: 640, 1: 384 },
    maximumPropositionCount: 1,
    maximumExample: "A:M>P + A:S>M => A:S>P",
  },
};

function analyzeMode(settings: LogicSettings): {
  readonly statistics: InvariantStatistics;
  readonly failures: readonly string[];
} {
  let satisfiable = 0;
  let inconsistent = 0;
  let noConclusion = 0;
  let singleConclusion = 0;
  let multipleConclusion = 0;
  let maximumPropositionCount = 0;
  let maximumExample: string | null = null;
  const propositionCountDistribution: Record<number, number> = {};
  const failures: string[] = [];
  const candidateIds = new Set(SIGNED_RETINEND_CANDIDATES.map(propositionId));

  for (const premises of ABSTRACT_PREMISE_PAIRS) {
    const label = premisePairId(premises);
    const premiseClosure = premiseRetinendClosure(premises, settings);
    const first = inferSyllogismConclusion(premises, settings);
    const second = inferSyllogismConclusion(premises, settings);

    if (premiseClosure === null) {
      inconsistent += 1;
      if (first.ok) {
        failures.push(`${label}: oracle=inconsistent; production=ok`);
      }
      continue;
    }

    satisfiable += 1;
    if (!first.ok || !second.ok) {
      failures.push(`${label}: oracle=satisfiable; production=failure`);
      continue;
    }
    const complete = first.completeConclusion;
    const repeated = second.completeConclusion;

    if (premiseClosure.length === 0) {
      noConclusion += 1;
      propositionCountDistribution[0] =
        (propositionCountDistribution[0] ?? 0) + 1;
      if (complete !== null) {
        failures.push(`${label}: oracle closure empty; production=${complete.propositions.map(propositionId).join(",")}`);
      }
      if (repeated !== null) {
        failures.push(`${label}: repeated inference created a conclusion`);
      }
      continue;
    }

    if (complete === null || repeated === null) {
      failures.push(`${label}: oracle closure non-empty; production=null`);
      continue;
    }
    const propositions = complete.propositions;
    const propositionIds = propositions.map(propositionId);
    const count = propositions.length;
    propositionCountDistribution[count] =
      (propositionCountDistribution[count] ?? 0) + 1;
    if (count === 1) singleConclusion += 1;
    if (count > 1) multipleConclusion += 1;
    if (count > maximumPropositionCount) {
      maximumPropositionCount = count;
      maximumExample = `${label} => ${propositionIds.join(" + ")}`;
    }

    if (count === 0) {
      failures.push(`${label}: non-null CompleteConclusion is empty`);
      continue;
    }
    if (new Set(propositionIds).size !== propositionIds.length) {
      failures.push(`${label}: structural duplicate in ${propositionIds.join(",")}`);
    }
    if (propositionIds.some((id) => !candidateIds.has(id))) {
      failures.push(`${label}: proposition outside signed candidate universe`);
    }
    if (propositions.some(({ subject, predicate }) =>
      subject.role === "M" || predicate.role === "M"
    )) {
      failures.push(`${label}: middle term remains in ${propositionIds.join(",")}`);
    }
    for (const proposition of propositions) {
      if (oracleConclusionIsEntailed(premises, proposition, settings) !== true) {
        failures.push(`${label}: unsound ${propositionId(proposition)}`);
      }
    }

    const completeClosure = propositionSetRetinendClosure(
      propositions,
      settings,
    );
    const missing = setDifference(premiseClosure, completeClosure);
    const extra = setDifference(completeClosure, premiseClosure);
    if (missing.length > 0 || extra.length > 0) {
      failures.push(`${label}: propositions=${propositionIds.join("+")}; missing=${missing.join(",")}; extra=${extra.join(",")}`);
    }

    for (let index = 0; index < propositions.length; index += 1) {
      const without = propositions.filter((_, candidateIndex) =>
        candidateIndex !== index
      );
      const reducedClosure = propositionSetRetinendClosure(without, settings);
      if (
        reducedClosure.length === completeClosure.length &&
        reducedClosure.every((value, valueIndex) =>
          value === completeClosure[valueIndex]
        )
      ) {
        failures.push(`${label}: redundant=${propositionIds[index]}; full=${propositionIds.join("+")}`);
      }
    }

    const repeatedIds = repeated.propositions.map(propositionId);
    if (
      repeatedIds.length !== propositionIds.length ||
      repeatedIds.some((value, index) => value !== propositionIds[index])
    ) {
      failures.push(`${label}: non-deterministic ${propositionIds.join("+")} vs ${repeatedIds.join("+")}`);
    }
  }

  return {
    statistics: {
      premisePairs: ABSTRACT_PREMISE_PAIRS.length,
      satisfiable,
      inconsistent,
      noConclusion,
      singleConclusion,
      multipleConclusion,
      propositionCountDistribution,
      maximumPropositionCount,
      maximumExample,
    },
    failures,
  };
}

function expectRepresentativeInvariants(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): void {
  const premiseClosure = premiseRetinendClosure(premises, settings);
  expect(premiseClosure).not.toBeNull();
  const result = inferSyllogismConclusion(premises, settings);
  expect(result.ok).toBe(true);
  if (!result.ok || premiseClosure === null) return;
  const propositions = result.completeConclusion?.propositions ?? [];
  expect(propositionSetRetinendClosure(propositions, settings))
    .toEqual(premiseClosure);
  for (const proposition of propositions) {
    expect(oracleConclusionIsEntailed(premises, proposition, settings))
      .toBe(true);
  }
}

describe("CompleteConclusion invariants", () => {
  it("generates exactly 32 unique candidates and 1024 premise pairs", () => {
    expect(MP_VARIANTS).toHaveLength(32);
    expect(SM_VARIANTS).toHaveLength(32);
    expect(ABSTRACT_PREMISE_PAIRS).toHaveLength(1024);
    expect(SIGNED_RETINEND_CANDIDATES).toHaveLength(32);
    expect(new Set(SIGNED_RETINEND_CANDIDATES.map(propositionId)).size).toBe(32);
  });

  it.each(SETTINGS)(
    "is sound, complete, irredundant, middle-free, and deterministic in $existentialImport mode",
    (settings) => {
      const analysis = analyzeMode(settings);
      expect(analysis.failures).toEqual([]);
      expect(analysis.statistics).toEqual(
        EXPECTED_STATISTICS[settings.existentialImport],
      );
    },
  );

  it("keeps both independent propositions in Book VIII §4 No. 10", () => {
    const testCase = CARROLL_BOOK_VIII_SECTION_4.find(({ number }) =>
      number === 10
    );
    if (testCase === undefined) throw new Error("§4 No. 10 is missing.");
    expectRepresentativeInvariants(testCase.premises, CARROLL);
    const result = inferSyllogismConclusion(testCase.premises, CARROLL);
    if (!result.ok || result.completeConclusion === null) return;
    expect(result.completeConclusion.propositions.map(propositionId)).toEqual([
      "A:S>P",
      "A:P′>S′",
    ]);
    const fullClosure = propositionSetRetinendClosure(
      result.completeConclusion.propositions,
      CARROLL,
    );
    for (let index = 0; index < 2; index += 1) {
      expect(propositionSetRetinendClosure(
        result.completeConclusion.propositions.filter((_, current) =>
          current !== index
        ),
        CARROLL,
      )).not.toEqual(fullClosure);
    }
  });

  it("keeps Book VIII §6 No. 25 sound and complete", () => {
    const testCase = CARROLL_BOOK_VIII_SECTION_6.find(({ number }) =>
      number === 25
    );
    if (testCase === undefined) throw new Error("§6 No. 25 is missing.");
    expectRepresentativeInvariants(testCase.premises, CARROLL);
    const result = inferSyllogismConclusion(testCase.premises, CARROLL);
    if (!result.ok) return;
    expect(result.completeConclusion?.propositions).toEqual([{
      form: "E",
      subject: abstractTerm("S"),
      predicate: abstractTerm("P", true),
    }]);
  });

  it("keeps Barbara minimal and invalid premises conclusion-free", () => {
    const barbara: AbstractSyllogism = {
      firstPremise: {
        form: "A",
        subject: abstractTerm("M"),
        predicate: abstractTerm("P"),
      },
      secondPremise: {
        form: "A",
        subject: abstractTerm("S"),
        predicate: abstractTerm("M"),
      },
    };
    expectRepresentativeInvariants(barbara, CARROLL);
    const result = inferSyllogismConclusion(barbara, CARROLL);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.completeConclusion?.propositions).toHaveLength(1);

    const invalid: AbstractSyllogism = {
      firstPremise: {
        form: "A",
        subject: abstractTerm("P"),
        predicate: abstractTerm("M"),
      },
      secondPremise: {
        form: "A",
        subject: abstractTerm("S"),
        predicate: abstractTerm("M"),
      },
    };
    expect(premiseRetinendClosure(invalid, CARROLL)).toEqual([]);
    const invalidResult = inferSyllogismConclusion(invalid, CARROLL);
    expect(invalidResult.ok).toBe(true);
    if (invalidResult.ok) expect(invalidResult.completeConclusion).toBeNull();
  });

  it("distinguishes contradictory premises from no conclusion", () => {
    const contradictory: AbstractSyllogism = {
      firstPremise: {
        form: "A",
        subject: abstractTerm("M"),
        predicate: abstractTerm("P"),
      },
      secondPremise: {
        form: "E",
        subject: abstractTerm("M"),
        predicate: abstractTerm("P"),
      },
    };
    expect(premiseRetinendClosure(contradictory, CARROLL)).toBeNull();
    expect(inferSyllogismConclusion(contradictory, CARROLL)).toMatchObject({
      ok: false,
      stage: "constraint-merge",
    });
  });
});

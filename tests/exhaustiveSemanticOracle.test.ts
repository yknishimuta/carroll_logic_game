import { describe, expect, it } from "vitest";
import type { SyllogismConclusion } from "../src/domain/conclusion";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractTermOccurrence } from "../src/domain/term";
import {
  inferSyllogismConclusion,
  isConclusionEntailed,
} from "../src/logic/conclusionInference";
import {
  formatSemanticModel,
  oracleFindCountermodel,
  oraclePropositionIsTrue,
  oracleSatisfyingModels,
} from "./helpers/semanticOracle";
import {
  ABSTRACT_PREMISE_PAIRS,
  MP_VARIANTS,
  premisePairId,
  propositionId,
  SIGNED_RETINEND_CANDIDATES,
  SM_VARIANTS,
} from "./helpers/abstractSyllogismUniverse";

function conclusionRequirements(
  conclusion: SyllogismConclusion,
  settings: LogicSettings,
): readonly string[] {
  const cells = ["SP", "Sp", "sP", "sp"] as const;
  const matches = (
    cell: (typeof cells)[number],
    occurrence: AbstractTermOccurrence,
  ): boolean => {
    const base = occurrence.role === "S" ? cell[0] === "S" : cell[1] === "P";
    return occurrence.complemented ? !base : base;
  };
  const positive = cells.find((cell) =>
    matches(cell, conclusion.subject) && matches(cell, conclusion.predicate)
  );
  const negative = cells.find((cell) =>
    matches(cell, conclusion.subject) && !matches(cell, conclusion.predicate)
  );
  if (positive === undefined || negative === undefined) {
    throw new Error("Oracle conclusion cells could not be determined.");
  }
  switch (conclusion.form) {
    case "A":
      return settings.existentialImport === "carroll"
        ? [`empty:${negative}`, `existence:${positive}`].sort()
        : [`empty:${negative}`];
    case "E":
      return [`empty:${positive}`];
    case "I":
      return [`existence:${positive}`];
    case "O":
      return [`existence:${negative}`];
  }
}

function isStrictRequirementSubset(
  candidate: readonly string[],
  other: readonly string[],
): boolean {
  return candidate.length < other.length &&
    candidate.every((requirement) => other.includes(requirement));
}

interface DifferentialSummary {
  readonly mode: LogicSettings["existentialImport"];
  readonly satisfiablePairs: number;
  readonly inconsistentPairs: number;
  readonly candidateComparisons: number;
}

function compareMode(settings: LogicSettings): {
  readonly summary: DifferentialSummary;
  readonly rawMismatches: readonly string[];
  readonly inferenceMismatches: readonly string[];
} {
  let satisfiablePairs = 0;
  let inconsistentPairs = 0;
  let candidateComparisons = 0;
  const rawMismatches: string[] = [];
  const inferenceMismatches: string[] = [];

  for (const premises of ABSTRACT_PREMISE_PAIRS) {
    const label = premisePairId(premises);
    const satisfyingModels = oracleSatisfyingModels(premises, settings);
    const production = inferSyllogismConclusion(premises, settings);

    if (satisfyingModels.length === 0) {
      inconsistentPairs += 1;
      if (production.ok) {
        inferenceMismatches.push(
          `mode=${settings.existentialImport}; premises=${label}; oracle=inconsistent; production=ok`,
        );
      }
      continue;
    }

    satisfiablePairs += 1;
    if (!production.ok) {
      inferenceMismatches.push(
        `mode=${settings.existentialImport}; premises=${label}; oracle=satisfiable; production=${production.stage}:${production.reason}`,
      );
      continue;
    }

    const oracleEntailedCandidates: SyllogismConclusion[] = [];
    for (const candidate of SIGNED_RETINEND_CANDIDATES) {
      candidateComparisons += 1;
      const oracle = satisfyingModels.every((model) =>
        oraclePropositionIsTrue(model, candidate, settings)
      );
      const actual = isConclusionEntailed(
        production.biliteralState,
        candidate,
        settings,
      );
      if (oracle) oracleEntailedCandidates.push(candidate);
      if (oracle === actual) continue;

      const countermodel = actual && !oracle
        ? oracleFindCountermodel(premises, candidate, settings)
        : null;
      rawMismatches.push(
        [
          `mode=${settings.existentialImport}`,
          `premises=${label}`,
          `candidate=${propositionId(candidate)}`,
          `oracle=${oracle}`,
          `production=${actual}`,
          countermodel === null
            ? null
            : `countermodel=${formatSemanticModel(countermodel)}`,
        ].filter((part): part is string => part !== null).join("; "),
      );
    }

    const maximalOracleRequirements = oracleEntailedCandidates
      .map((candidate) => conclusionRequirements(candidate, settings))
      .filter((requirements, index, allRequirements) =>
        !allRequirements.some((other, otherIndex) =>
          otherIndex !== index &&
          isStrictRequirementSubset(requirements, other)
        )
      );

    if (production.completeConclusion === null) {
      if (maximalOracleRequirements.length > 0) {
        inferenceMismatches.push(
          `mode=${settings.existentialImport}; premises=${label}; oracle has a complete signed conclusion; production canonical=null`,
        );
      }
    } else {
      for (const conclusion of production.completeConclusion.propositions) {
        if (!satisfyingModels.every((model) =>
          oraclePropositionIsTrue(model, conclusion, settings)
        )) {
          inferenceMismatches.push(
            `mode=${settings.existentialImport}; premises=${label}; production complete proposition=${propositionId(conclusion)} is not oracle-entailed`,
          );
        }
      }
      const productionRequirements = [...new Set(
        production.completeConclusion.propositions.flatMap((conclusion) =>
          conclusionRequirements(conclusion, settings)
        ),
      )].sort();
      const oracleRequirements = [...new Set(
        maximalOracleRequirements.flatMap((requirements) => requirements),
      )].sort();
      if (
        productionRequirements.length !== oracleRequirements.length ||
        productionRequirements.some((value, index) =>
          value !== oracleRequirements[index]
        )
      ) {
        inferenceMismatches.push(
          `mode=${settings.existentialImport}; premises=${label}; production complete requirements=${productionRequirements.join("+")}; oracle complete=${oracleRequirements.join("+")}`,
        );
      }
    }
  }

  return {
    summary: {
      mode: settings.existentialImport,
      satisfiablePairs,
      inconsistentPairs,
      candidateComparisons,
    },
    rawMismatches,
    inferenceMismatches,
  };
}

describe("exhaustive complemented abstract-premise differential oracle", () => {
  it("generates exactly 32 M/P variants, 32 S/M variants, and 1024 pairs", () => {
    expect(MP_VARIANTS).toHaveLength(32);
    expect(SM_VARIANTS).toHaveLength(32);
    expect(ABSTRACT_PREMISE_PAIRS).toHaveLength(1024);
    expect(new Set(MP_VARIANTS.map(propositionId)).size).toBe(32);
    expect(new Set(SM_VARIANTS.map(propositionId)).size).toBe(32);
  });

  const SETTINGS = [
    { existentialImport: "carroll" as const },
    { existentialImport: "modern" as const },
  ];

  it.each(SETTINGS)(
    "Stage A matches raw entailment in $existentialImport mode",
    (settings) => {
      expect(compareMode(settings).rawMismatches).toEqual([]);
    },
  );

  it.each(SETTINGS)(
    "Stage B preserves an oracle-valid signed production conclusion in $existentialImport mode",
    (settings) => {
      expect(compareMode(settings).inferenceMismatches).toEqual([]);
    },
  );

  it.each(SETTINGS)("records exhaustive totals in $existentialImport mode", (settings) => {
    const result = compareMode(settings);
    expect(result.summary).toEqual({
      mode: settings.existentialImport,
      satisfiablePairs: 1024,
      inconsistentPairs: 0,
      candidateComparisons: 32768,
    });
  });
});

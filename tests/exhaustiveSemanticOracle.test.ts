import { describe, expect, it } from "vitest";
import type { SyllogismConclusion } from "../src/domain/conclusion";
import type { LogicSettings } from "../src/domain/logicSettings";
import type {
  AbstractProposition,
  PropositionForm,
} from "../src/domain/proposition";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import {
  abstractTerm,
  type AbstractTermOccurrence,
  type TermRole,
} from "../src/domain/term";
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

const FORMS = ["A", "E", "I", "O"] as const;
const COMPLEMENTED = [false, true] as const;

function generateRelationVariants(
  firstRole: TermRole,
  secondRole: TermRole,
): readonly AbstractProposition[] {
  const orientations = [
    [firstRole, secondRole],
    [secondRole, firstRole],
  ] as const;
  return FORMS.flatMap((form) =>
    orientations.flatMap(([subjectRole, predicateRole]) =>
      COMPLEMENTED.flatMap((subjectComplemented) =>
        COMPLEMENTED.map((predicateComplemented) => ({
          form,
          subject: abstractTerm(subjectRole, subjectComplemented),
          predicate: abstractTerm(predicateRole, predicateComplemented),
        }))
      )
    )
  );
}

const MP_VARIANTS = generateRelationVariants("M", "P");
const SM_VARIANTS = generateRelationVariants("S", "M");
const PREMISE_PAIRS: readonly AbstractSyllogism[] = MP_VARIANTS.flatMap(
  (firstPremise) => SM_VARIANTS.map((secondPremise) => ({
    firstPremise,
    secondPremise,
  })),
);

const CONCLUSION_CANDIDATES: readonly SyllogismConclusion[] = FORMS.flatMap(
  (form) => COMPLEMENTED.flatMap((subjectComplemented) =>
    COMPLEMENTED.map((predicateComplemented) => ({
      form,
      subject: abstractTerm("S", subjectComplemented),
      predicate: abstractTerm("P", predicateComplemented),
    }))
  ),
);

function occurrenceText(occurrence: AbstractTermOccurrence): string {
  return `${occurrence.role}${occurrence.complemented ? "′" : ""}`;
}

function propositionText(proposition: AbstractProposition): string {
  return `${proposition.form}(${occurrenceText(proposition.subject)},${occurrenceText(proposition.predicate)})`;
}

function pairText(premises: AbstractSyllogism): string {
  return `${propositionText(premises.firstPremise)} + ${propositionText(premises.secondPremise)}`;
}

interface DifferentialSummary {
  readonly mode: LogicSettings["existentialImport"];
  readonly satisfiablePairs: number;
  readonly inconsistentPairs: number;
  readonly candidateComparisons: number;
}

function compareMode(settings: LogicSettings): {
  readonly summary: DifferentialSummary;
  readonly mismatches: readonly string[];
} {
  let satisfiablePairs = 0;
  let inconsistentPairs = 0;
  let candidateComparisons = 0;
  const mismatches: string[] = [];

  for (const premises of PREMISE_PAIRS) {
    const label = pairText(premises);
    const satisfyingModels = oracleSatisfyingModels(premises, settings);
    const production = inferSyllogismConclusion(premises, settings);

    if (satisfyingModels.length === 0) {
      inconsistentPairs += 1;
      if (production.ok) {
        mismatches.push(
          `mode=${settings.existentialImport}; premises=${label}; oracle=inconsistent; production=ok`,
        );
      }
      continue;
    }

    satisfiablePairs += 1;
    if (!production.ok) {
      mismatches.push(
        `mode=${settings.existentialImport}; premises=${label}; oracle=satisfiable; production=${production.stage}:${production.reason}`,
      );
      continue;
    }

    let oracleHasConclusion = false;
    for (const candidate of CONCLUSION_CANDIDATES) {
      candidateComparisons += 1;
      const oracle = satisfyingModels.every((model) =>
        oraclePropositionIsTrue(model, candidate, settings)
      );
      const actual = isConclusionEntailed(
        production.biliteralState,
        candidate,
        settings,
      );
      oracleHasConclusion ||= oracle;
      if (oracle === actual) continue;

      const countermodel = actual && !oracle
        ? oracleFindCountermodel(premises, candidate, settings)
        : null;
      mismatches.push(
        [
          `mode=${settings.existentialImport}`,
          `premises=${label}`,
          `candidate=${propositionText(candidate)}`,
          `oracle=${oracle}`,
          `production=${actual}`,
          countermodel === null
            ? null
            : `countermodel=${formatSemanticModel(countermodel)}`,
        ].filter((part): part is string => part !== null).join("; "),
      );
    }

    if (production.conclusion === null) {
      if (oracleHasConclusion) {
        mismatches.push(
          `mode=${settings.existentialImport}; premises=${label}; oracle has an S/P conclusion; production canonical=null`,
        );
      }
    } else if (!satisfyingModels.every((model) =>
      oraclePropositionIsTrue(model, production.conclusion!, settings)
    )) {
      mismatches.push(
        `mode=${settings.existentialImport}; premises=${label}; production canonical=${propositionText(production.conclusion)} is not oracle-entailed`,
      );
    }
  }

  return {
    summary: {
      mode: settings.existentialImport,
      satisfiablePairs,
      inconsistentPairs,
      candidateComparisons,
    },
    mismatches,
  };
}

describe("exhaustive complemented abstract-premise differential oracle", () => {
  it("generates exactly 32 M/P variants, 32 S/M variants, and 1024 pairs", () => {
    expect(MP_VARIANTS).toHaveLength(32);
    expect(SM_VARIANTS).toHaveLength(32);
    expect(PREMISE_PAIRS).toHaveLength(1024);
    expect(new Set(MP_VARIANTS.map(propositionText)).size).toBe(32);
    expect(new Set(SM_VARIANTS.map(propositionText)).size).toBe(32);
  });

  it.each([
    { existentialImport: "carroll" as const },
    { existentialImport: "modern" as const },
  ])("matches the independent oracle in $existentialImport mode", (settings) => {
    const result = compareMode(settings);
    expect(result.mismatches).toEqual([]);
    expect(result.summary).toEqual({
      mode: settings.existentialImport,
      satisfiablePairs: 1024,
      inconsistentPairs: 0,
      candidateComparisons: 16384,
    });
  });
});

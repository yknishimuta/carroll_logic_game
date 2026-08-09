import { describe, expect, it } from "vitest";
import { buildConclusionPresentation } from "../src/app/conclusionPresentation";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { AbstractProposition } from "../src/domain/proposition";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import { abstractTerm } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import {
  ABSTRACT_PREMISE_PAIRS,
  MP_VARIANTS,
  premisePairId,
  propositionId,
  SIGNED_RETINEND_CANDIDATES,
  SM_VARIANTS,
} from "./helpers/abstractSyllogismUniverse";
import {
  ALL_RETAINED_MODEL_MASKS,
  ALL_SEMANTIC_MODELS,
  oraclePropositionIsTrue,
  oracleRetainedModelMask,
  oracleRetainedPropositionIsTrue,
} from "./helpers/semanticOracle";

const FORM_ORDER = ["A", "E", "I", "O"] as const;
const FULL_RETAINED_MODELS = (1 << ALL_RETAINED_MODEL_MASKS.length) - 1;

interface ClassificationSummary {
  inconsistent: number;
  noConclusion: number;
  traditional: number;
  canonicalComplete: number;
  traditionalForms: Record<(typeof FORM_ORDER)[number], number>;
}

function createSummary(): ClassificationSummary {
  return {
    inconsistent: 0,
    noConclusion: 0,
    traditional: 0,
    canonicalComplete: 0,
    traditionalForms: { A: 0, E: 0, I: 0, O: 0 },
  };
}

function truthMask(
  proposition: AbstractProposition,
  settings: LogicSettings,
): bigint {
  return ALL_SEMANTIC_MODELS.reduce(
    (mask, model, index) =>
      oraclePropositionIsTrue(model, proposition, settings)
        ? mask | (1n << BigInt(index))
        : mask,
    0n,
  );
}

function retainedTruthMask(
  proposition: AbstractProposition,
  settings: LogicSettings,
): number {
  return ALL_RETAINED_MODEL_MASKS.reduce(
    (mask, retainedModel) =>
      oracleRetainedPropositionIsTrue(retainedModel, proposition, settings)
        ? mask | (1 << retainedModel)
        : mask,
    0,
  );
}

function compareStrings(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function complementCount(proposition: AbstractProposition): number {
  return Number(proposition.subject.complemented) +
    Number(proposition.predicate.complemented);
}

function structuralKey(proposition: AbstractProposition): string {
  return [
    proposition.subject.role,
    Number(proposition.subject.complemented),
    proposition.predicate.role,
    Number(proposition.predicate.complemented),
    proposition.form,
  ].join(":");
}

function comparePropositions(
  left: AbstractProposition,
  right: AbstractProposition,
): number {
  const comparisons = [
    complementCount(left) - complementCount(right),
    Number(left.subject.role === "P") - Number(right.subject.role === "P"),
    Number(left.subject.complemented) - Number(right.subject.complemented),
    FORM_ORDER.indexOf(left.form) - FORM_ORDER.indexOf(right.form),
  ];
  for (const comparison of comparisons) {
    if (comparison !== 0) return comparison;
  }
  return compareStrings(structuralKey(left), structuralKey(right));
}

function orderedBasis(
  propositions: readonly AbstractProposition[],
): readonly AbstractProposition[] {
  return [...propositions].sort(comparePropositions);
}

function compareBases(
  left: readonly AbstractProposition[],
  right: readonly AbstractProposition[],
): number {
  const comparisons = [
    left.length - right.length,
    left.reduce((sum, proposition) => sum + complementCount(proposition), 0) -
      right.reduce((sum, proposition) => sum + complementCount(proposition), 0),
    left.filter(({ subject }) => subject.role === "P").length -
      right.filter(({ subject }) => subject.role === "P").length,
    left.filter(({ subject }) => subject.complemented).length -
      right.filter(({ subject }) => subject.complemented).length,
  ];
  for (const comparison of comparisons) {
    if (comparison !== 0) return comparison;
  }
  const orderedLeft = orderedBasis(left);
  const orderedRight = orderedBasis(right);
  for (let index = 0; index < orderedLeft.length; index += 1) {
    const leftProposition = orderedLeft[index];
    const rightProposition = orderedRight[index];
    if (leftProposition === undefined || rightProposition === undefined) break;
    const comparison = FORM_ORDER.indexOf(leftProposition.form) -
      FORM_ORDER.indexOf(rightProposition.form);
    if (comparison !== 0) return comparison;
  }
  return compareStrings(
    orderedLeft.map(structuralKey).join("|"),
    orderedRight.map(structuralKey).join("|"),
  );
}

function isTraditionalPremisePair(premises: AbstractSyllogism): boolean {
  return [
    premises.firstPremise.subject,
    premises.firstPremise.predicate,
    premises.secondPremise.subject,
    premises.secondPremise.predicate,
  ].every(({ complemented }) => !complemented);
}

function expectedCanonicalBasis(
  entailedCandidates: readonly AbstractProposition[],
  candidateRetainedMasks: ReadonlyMap<string, number>,
  targetRetainedModels: number,
): readonly AbstractProposition[] | null {
  const modelsToExclude = FULL_RETAINED_MODELS & ~targetRetainedModels;
  if (modelsToExclude === 0) return null;
  const bestByCoverage = new Map<number, readonly AbstractProposition[]>([[0, []]]);
  for (const proposition of entailedCandidates) {
    const allowedModels = candidateRetainedMasks.get(propositionId(proposition));
    if (allowedModels === undefined) throw new Error("Missing retained truth mask.");
    const coverage = modelsToExclude & ~allowedModels;
    if (coverage === 0) continue;
    for (const [covered, basis] of [...bestByCoverage]) {
      const nextCoverage = covered | coverage;
      const nextBasis = orderedBasis([...basis, proposition]);
      const current = bestByCoverage.get(nextCoverage);
      if (current === undefined || compareBases(nextBasis, current) < 0) {
        bestByCoverage.set(nextCoverage, nextBasis);
      }
    }
  }
  return bestByCoverage.get(modelsToExclude) ?? null;
}

function basisRetainedModels(
  propositions: readonly AbstractProposition[],
  candidateRetainedMasks: ReadonlyMap<string, number>,
): number {
  return propositions.reduce((models, proposition) => {
    const candidateModels = candidateRetainedMasks.get(propositionId(proposition));
    if (candidateModels === undefined) throw new Error("Missing retained truth mask.");
    return models & candidateModels;
  }, FULL_RETAINED_MODELS);
}

function formatBasis(propositions: readonly AbstractProposition[] | null): string {
  return propositions === null ? "null" : propositions.map(propositionId).join(",");
}

function compareMode(settings: LogicSettings): {
  readonly summary: ClassificationSummary;
  readonly failures: readonly string[];
} {
  const propositionTruthMasks = new Map<string, bigint>();
  const candidateRetainedMasks = new Map<string, number>();
  const allPropositions = [...MP_VARIANTS, ...SM_VARIANTS, ...SIGNED_RETINEND_CANDIDATES];
  for (const proposition of allPropositions) {
    const id = propositionId(proposition);
    if (!propositionTruthMasks.has(id)) {
      propositionTruthMasks.set(id, truthMask(proposition, settings));
    }
  }
  for (const proposition of SIGNED_RETINEND_CANDIDATES) {
    candidateRetainedMasks.set(
      propositionId(proposition),
      retainedTruthMask(proposition, settings),
    );
  }

  const summary = createSummary();
  const failures: string[] = [];
  for (const premises of ABSTRACT_PREMISE_PAIRS) {
    const firstMask = propositionTruthMasks.get(propositionId(premises.firstPremise));
    const secondMask = propositionTruthMasks.get(propositionId(premises.secondPremise));
    if (firstMask === undefined || secondMask === undefined) {
      throw new Error("Missing premise truth mask.");
    }
    const satisfyingMask = firstMask & secondMask;
    const result = inferSyllogismConclusion(premises, settings);
    const label = premisePairId(premises);
    if (satisfyingMask === 0n) {
      summary.inconsistent += 1;
      if (result.ok) failures.push(`${label}; classification=inconsistent; production=ok`);
      continue;
    }
    if (!result.ok) {
      failures.push(`${label}; classification=consistent; production=${result.stage}:${result.reason}`);
      continue;
    }

    const entailedCandidates = SIGNED_RETINEND_CANDIDATES.filter((candidate) => {
      const candidateMask = propositionTruthMasks.get(propositionId(candidate));
      if (candidateMask === undefined) throw new Error("Missing candidate truth mask.");
      return (satisfyingMask & ~candidateMask) === 0n;
    });
    const targetRetainedModels = entailedCandidates.reduce(
      (models, candidate) => {
        const candidateModels = candidateRetainedMasks.get(propositionId(candidate));
        if (candidateModels === undefined) throw new Error("Missing candidate models.");
        return models & candidateModels;
      },
      FULL_RETAINED_MODELS,
    );
    const firstPresentation = buildConclusionPresentation(
      result.completeConclusion,
      premises,
      settings,
    );
    const secondPresentation = buildConclusionPresentation(
      result.completeConclusion,
      premises,
      settings,
    );
    const actual = firstPresentation?.propositions ?? null;
    const projectedModelCount = new Set(
      ALL_SEMANTIC_MODELS.flatMap((model, index) =>
        (satisfyingMask & (1n << BigInt(index))) !== 0n
          ? [oracleRetainedModelMask(model)]
          : []
      ),
    ).size;
    const context = `mode=${settings.existentialImport}; premises=${label}; models=${projectedModelCount}`;

    if (targetRetainedModels === FULL_RETAINED_MODELS) {
      summary.noConclusion += 1;
      if (result.completeConclusion !== null || firstPresentation !== null) {
        failures.push(`${context}; classification=no-conclusion; actual=${formatBasis(actual)}`);
      }
      continue;
    }
    if (result.completeConclusion === null || actual === null) {
      failures.push(`${context}; classification=conclusion; actual=${formatBasis(actual)}`);
      continue;
    }

    if (JSON.stringify(firstPresentation) !== JSON.stringify(secondPresentation)) {
      failures.push(`${context}; invariant=determinism; first=${formatBasis(actual)}; second=${formatBasis(secondPresentation?.propositions ?? null)}`);
    }
    if (new Set(actual.map(propositionId)).size !== actual.length) {
      failures.push(`${context}; invariant=duplicate-free; actual=${formatBasis(actual)}`);
    }
    for (const proposition of actual) {
      if (proposition.subject.role === "M" || proposition.predicate.role === "M") {
        failures.push(`${context}; invariant=retinend-only; actual=${formatBasis(actual)}`);
      }
      const candidateMask = propositionTruthMasks.get(propositionId(proposition));
      if (candidateMask === undefined || (satisfyingMask & ~candidateMask) !== 0n) {
        failures.push(`${context}; invariant=soundness; proposition=${propositionId(proposition)}`);
      }
    }

    if (isTraditionalPremisePair(premises)) {
      const expected = FORM_ORDER.map((form): AbstractProposition => ({
        form,
        subject: abstractTerm("S"),
        predicate: abstractTerm("P"),
      })).find((candidate) => {
        const candidateMask = propositionTruthMasks.get(propositionId(candidate));
        return candidateMask !== undefined && (satisfyingMask & ~candidateMask) === 0n;
      });
      if (expected !== undefined) {
        summary.traditional += 1;
        summary.traditionalForms[expected.form] += 1;
        if (actual.map(propositionId).join("|") !== propositionId(expected)) {
          failures.push(`${context}; classification=traditional; expected=${formatBasis([expected])}; actual=${formatBasis(actual)}`);
        }
        continue;
      }
    }

    summary.canonicalComplete += 1;
    const expected = expectedCanonicalBasis(
      entailedCandidates,
      candidateRetainedMasks,
      targetRetainedModels,
    );
    if (expected === null) {
      failures.push(`${context}; classification=canonical; optimal basis missing`);
      continue;
    }
    if (basisRetainedModels(actual, candidateRetainedMasks) !== targetRetainedModels) {
      failures.push(`${context}; invariant=completeness; expected-models=${targetRetainedModels}; actual-models=${basisRetainedModels(actual, candidateRetainedMasks)}`);
    }
    if (
      actual.map(propositionId).join("|") !==
      expected.map(propositionId).join("|")
    ) {
      failures.push(`${context}; invariant=normal-form; expected=${formatBasis(expected)}; actual=${formatBasis(actual)}`);
    }
  }
  return { summary, failures };
}

describe("ConclusionPresentation exhaustive independent invariants", () => {
  it("enumerates 32 × 32 ordered premise pairs", () => {
    expect(MP_VARIANTS).toHaveLength(32);
    expect(SM_VARIANTS).toHaveLength(32);
    expect(ABSTRACT_PREMISE_PAIRS).toHaveLength(1024);
  });

  it.each([
    { existentialImport: "carroll" as const },
    { existentialImport: "modern" as const },
  ])("matches the independent oracle and exact normal form in $existentialImport mode", (settings) => {
    const result = compareMode(settings);
    expect(result.failures).toEqual([]);
    expect(
      result.summary.inconsistent + result.summary.noConclusion +
        result.summary.traditional + result.summary.canonicalComplete,
    ).toBe(1024);
  });
});

import type { LogicSettings } from "../../src/domain/logicSettings";
import type { AbstractProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import {
  ALL_SEMANTIC_MODELS,
  oraclePropositionIsTrue,
  oracleSatisfyingModels,
  type SemanticModel,
} from "./semanticOracle";
import {
  propositionId,
  SIGNED_RETINEND_CANDIDATES,
} from "./abstractSyllogismUniverse";

function closureFromModels(
  models: readonly SemanticModel[],
  settings: LogicSettings,
): readonly string[] {
  if (models.length === 0) {
    throw new Error("Semantic closure is undefined for inconsistent premises.");
  }
  return SIGNED_RETINEND_CANDIDATES.filter((candidate) =>
    models.every((model) => oraclePropositionIsTrue(model, candidate, settings))
  ).map(propositionId).sort();
}

export function premiseRetinendClosure(
  premises: AbstractSyllogism,
  settings: LogicSettings,
): readonly string[] | null {
  const models = oracleSatisfyingModels(premises, settings);
  return models.length === 0 ? null : closureFromModels(models, settings);
}

export function propositionSetRetinendClosure(
  propositions: readonly AbstractProposition[],
  settings: LogicSettings,
): readonly string[] {
  const models = ALL_SEMANTIC_MODELS.filter((model) =>
    propositions.every((proposition) =>
      oraclePropositionIsTrue(model, proposition, settings)
    )
  );
  return closureFromModels(models, settings);
}

export function setDifference(
  left: readonly string[],
  right: readonly string[],
): readonly string[] {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

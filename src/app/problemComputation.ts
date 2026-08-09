import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import type { LogicSettings } from "../domain/logicSettings";
import { DEFAULT_LOGIC_SETTINGS } from "../domain/logicSettings";
import type { ConcreteProposition } from "../domain/proposition";
import type {
  AbstractSyllogism,
  ConcreteSyllogism,
} from "../domain/syllogism";
import type { TermAssignment } from "../domain/term";
import type { TriliteralDiagramState } from "../domain/diagram";
import type { CompleteConclusion } from "../domain/conclusion";
import {
  buildConclusionPresentation,
  type ConclusionPresentation,
} from "./conclusionPresentation";
import {
  abstractSyllogism,
  concreteProposition,
} from "../logic/abstraction";
import { createConclusionCounterPlacements } from "../logic/conclusionDisplay";
import { inferSyllogismConclusion } from "../logic/conclusionInference";
import { mergeConstraints } from "../logic/constraintMerge";
import { createTriliteralCounterPlacements } from "../logic/counterPlacements";
import { propositionToConstraints } from "../logic/propositionConstraints";
import { assignTermRoles } from "../logic/termAssignment";

export interface ProblemComputation {
  readonly problem: ComputableProblem;
  readonly assignment: TermAssignment;
  readonly abstractPremises: AbstractSyllogism;
  readonly completeConclusion: CompleteConclusion | null;
  readonly conclusionPresentation: ConclusionPresentation | null;
  readonly concreteConclusions: readonly ConcreteProposition[];
  readonly firstPremiseState: TriliteralDiagramState;
  readonly combinedState: TriliteralDiagramState;
  readonly firstPremisePlacements: TriliteralCounterPlacements;
  readonly combinedPlacements: TriliteralCounterPlacements;
  readonly conclusionPlacements: BiliteralCounterPlacements;
}

export interface ComputableProblem {
  readonly id: string;
  readonly premises: ConcreteSyllogism;
}

export function computeProblem(
  problem: ComputableProblem,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): ProblemComputation {
  const assignment = assignTermRoles(problem.premises);
  const abstractPremises = abstractSyllogism(problem.premises);
  const firstPremiseState = mergeConstraints([
    propositionToConstraints(
      abstractPremises.firstPremise,
      "first-premise",
      settings,
    ),
  ]);
  const firstPlacements = createTriliteralCounterPlacements(
    firstPremiseState,
  );
  if (!firstPlacements.ok) {
    throw new Error(
      `Failed to place first premise for problem "${problem.id}": ${firstPlacements.reason}.`,
    );
  }

  const inference = inferSyllogismConclusion(abstractPremises, settings);
  if (!inference.ok) {
    throw new Error(
      `Failed to infer problem "${problem.id}": ${inference.reason}.`,
    );
  }
  const combinedPlacements = createTriliteralCounterPlacements(
    inference.triliteralState,
  );
  if (!combinedPlacements.ok) {
    throw new Error(
      `Failed to place combined premises for problem "${problem.id}": ${combinedPlacements.reason}.`,
    );
  }
  const completeConclusion = inference.completeConclusion;
  const conclusionPresentation = buildConclusionPresentation(
    completeConclusion,
    abstractPremises,
    settings,
  );
  const conclusionPlacements = createConclusionCounterPlacements(
    completeConclusion?.biliteralState ?? { emptyCells: [], existentials: [] },
  );
  if (!conclusionPlacements.ok) {
    throw new Error(
      `Failed to place conclusion for problem "${problem.id}": ${conclusionPlacements.reason}.`,
    );
  }

  const concreteConclusions = (conclusionPresentation?.propositions ?? [])
    .map((conclusion) => concreteProposition(conclusion, assignment));

  return {
    problem,
    assignment,
    abstractPremises,
    completeConclusion,
    conclusionPresentation,
    concreteConclusions,
    firstPremiseState,
    combinedState: inference.triliteralState,
    firstPremisePlacements: firstPlacements.placements,
    combinedPlacements: combinedPlacements.placements,
    conclusionPlacements: conclusionPlacements.placements,
  };
}

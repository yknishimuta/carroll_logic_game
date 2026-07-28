import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import type { LogicSettings } from "../domain/logicSettings";
import { DEFAULT_LOGIC_SETTINGS } from "../domain/logicSettings";
import type {
  AbstractProposition,
  ConcreteProposition,
  PropositionForm,
} from "../domain/proposition";
import type {
  AbstractSyllogism,
  ConcreteSyllogism,
} from "../domain/syllogism";
import type { TermAssignment } from "../domain/term";
import type { TriliteralDiagramState } from "../domain/diagram";
import { abstractSyllogism } from "../logic/abstraction";
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
  readonly abstractConclusion: AbstractProposition | null;
  readonly concreteConclusion: ConcreteProposition | null;
  readonly firstPremiseState: TriliteralDiagramState;
  readonly combinedState: TriliteralDiagramState;
  readonly firstPremisePlacements: TriliteralCounterPlacements;
  readonly combinedPlacements: TriliteralCounterPlacements;
  readonly conclusionPlacements: BiliteralCounterPlacements;
  readonly entailedForms: readonly PropositionForm[];
  readonly conclusionForms: readonly PropositionForm[];
}

export interface ComputableProblem {
  readonly id: string;
  readonly premises: ConcreteSyllogism;
}

export function createConcreteConclusion(
  form: PropositionForm,
  assignment: TermAssignment,
): ConcreteProposition {
  return {
    form,
    subject: assignment.S,
    predicate: assignment.P,
  };
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
  const conclusionPlacements = createConclusionCounterPlacements(
    inference.biliteralState,
    inference.entailedForms,
  );
  if (!conclusionPlacements.ok) {
    throw new Error(
      `Failed to place conclusion for problem "${problem.id}": ${conclusionPlacements.reason}.`,
    );
  }

  if (inference.conclusionForms.length > 1) {
    throw new Error(`Problem "${problem.id}" has multiple complete conclusions.`);
  }
  const conclusionForm = inference.conclusionForms[0];
  const abstractConclusion =
    conclusionForm === undefined
      ? null
      : { form: conclusionForm, subject: "S" as const, predicate: "P" as const };
  const concreteConclusion =
    conclusionForm === undefined
      ? null
      : createConcreteConclusion(conclusionForm, assignment);

  return {
    problem,
    assignment,
    abstractPremises,
    abstractConclusion,
    concreteConclusion,
    firstPremiseState,
    combinedState: inference.triliteralState,
    firstPremisePlacements: firstPlacements.placements,
    combinedPlacements: combinedPlacements.placements,
    conclusionPlacements: conclusionPlacements.placements,
    entailedForms: inference.entailedForms,
    conclusionForms: inference.conclusionForms,
  };
}

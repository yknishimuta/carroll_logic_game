import type {
  DiagramCellId,
  DiagramConstraints,
  ExistentialConstraint,
} from "../domain/diagram";
import {
  DEFAULT_LOGIC_SETTINGS,
  type LogicSettings,
} from "../domain/logicSettings";
import type { AbstractSyllogism } from "../domain/syllogism";
import { propositionToConstraints } from "./propositionConstraints";

function uniqueCells(
  cells: readonly DiagramCellId[],
): readonly DiagramCellId[] {
  return [...new Set(cells)];
}

export function mergeConstraints(
  constraints: readonly DiagramConstraints[],
): DiagramConstraints {
  const emptyCells = uniqueCells(
    constraints.flatMap((constraint) => constraint.emptyCells),
  );
  const emptyCellSet = new Set<DiagramCellId>(emptyCells);
  const existentials: readonly ExistentialConstraint[] = constraints
    .flatMap((constraint) => constraint.existentials)
    .map((existential) => ({
      sourceId: existential.sourceId,
      possibleCells: uniqueCells(
        existential.possibleCells.filter(
          (candidate) => !emptyCellSet.has(candidate),
        ),
      ),
    }));

  if (
    existentials.some(
      (existential) => existential.possibleCells.length === 0,
    )
  ) {
    throw new Error(
      "The constraints are contradictory: an existence claim has no possible cell.",
    );
  }

  return {
    emptyCells,
    existentials,
  };
}

export function syllogismToConstraints(
  syllogism: AbstractSyllogism,
  settings: LogicSettings = DEFAULT_LOGIC_SETTINGS,
): DiagramConstraints {
  return mergeConstraints([
    propositionToConstraints(
      syllogism.firstPremise,
      "first-premise",
      settings,
    ),
    propositionToConstraints(
      syllogism.secondPremise,
      "second-premise",
      settings,
    ),
  ]);
}

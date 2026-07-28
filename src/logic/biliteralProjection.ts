import {
  BILITERAL_CELLS,
  type BiliteralCell,
  type BiliteralDiagramState,
} from "../domain/conclusion";
import type {
  DiagramCellId,
  TriliteralDiagramState,
} from "../domain/diagram";

export function projectTriliteralCell(
  cell: DiagramCellId,
): BiliteralCell {
  switch (cell) {
    case "SMP":
    case "SmP":
      return "SP";
    case "SMp":
    case "Smp":
      return "Sp";
    case "sMP":
    case "smP":
      return "sP";
    case "sMp":
    case "smp":
      return "sp";
  }
}

export function triliteralCellsForBiliteralCell(
  cell: BiliteralCell,
): readonly DiagramCellId[] {
  switch (cell) {
    case "SP":
      return ["SMP", "SmP"];
    case "Sp":
      return ["SMp", "Smp"];
    case "sP":
      return ["sMP", "smP"];
    case "sp":
      return ["sMp", "smp"];
  }
}

function projectPossibleCells(
  cells: readonly DiagramCellId[],
): readonly BiliteralCell[] {
  const projected = new Set(cells.map(projectTriliteralCell));
  return BILITERAL_CELLS.filter((cell) => projected.has(cell));
}

export function projectToBiliteralDiagram(
  state: TriliteralDiagramState,
): BiliteralDiagramState {
  const emptyCellSet = new Set(state.emptyCells);
  const emptyCells = BILITERAL_CELLS.filter((cell) =>
    triliteralCellsForBiliteralCell(cell).every((sourceCell) =>
      emptyCellSet.has(sourceCell),
    ),
  );
  const existentials = state.existentials.map((existential) => ({
    sourceId: existential.sourceId,
    possibleCells: projectPossibleCells(existential.possibleCells),
  }));

  if (
    existentials.some(
      (existential) => existential.possibleCells.length === 0,
    )
  ) {
    throw new Error(
      "Cannot project an existential constraint with no possible cell.",
    );
  }

  return {
    emptyCells,
    existentials,
  };
}

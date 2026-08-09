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

export function normalizeBiliteralDiagramState(
  state: BiliteralDiagramState,
): BiliteralDiagramState {
  const emptyCellSet = new Set(state.emptyCells);
  let changed = false;
  const existentials = state.existentials.map((existential) => {
    const possibleCells = existential.possibleCells.filter((cell) =>
      !emptyCellSet.has(cell)
    );
    const existentialChanged =
      possibleCells.length !== existential.possibleCells.length;
    if (existentialChanged) changed = true;
    if (possibleCells.length === 0) {
      throw new Error(
        "Cannot retain an existential constraint whose possible cells are empty.",
      );
    }
    return existentialChanged
      ? { ...existential, possibleCells }
      : existential;
  });

  return changed ? { emptyCells: state.emptyCells, existentials } : state;
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

  return normalizeBiliteralDiagramState({
    emptyCells,
    existentials,
  });
}

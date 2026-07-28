export const DIAGRAM_CELL_IDS = [
  "SMP",
  "SMp",
  "SmP",
  "Smp",
  "sMP",
  "sMp",
  "smP",
  "smp",
] as const;

export type DiagramCellId = (typeof DIAGRAM_CELL_IDS)[number];

export type ConstraintSourceId = string;

export interface ExistentialConstraint {
  readonly sourceId: ConstraintSourceId;
  readonly possibleCells: readonly DiagramCellId[];
}

export interface DiagramConstraints {
  readonly emptyCells: readonly DiagramCellId[];
  readonly existentials: readonly ExistentialConstraint[];
}

export type TriliteralDiagramState = DiagramConstraints;

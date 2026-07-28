import type { BiliteralCell } from "../domain/conclusion";
import type {
  BiliteralCounterAnchor,
  TriliteralCounterAnchor,
} from "../domain/counterPlacement";
import type { DiagramCellId } from "../domain/diagram";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface RectGeometry {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LineGeometry {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface ViewBoxGeometry {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

export interface TriliteralDiagramLayout {
  readonly viewBox: ViewBoxGeometry;
  readonly outerRect: RectGeometry;
  readonly innerRect: RectGeometry;
  readonly dividerLines: readonly LineGeometry[];
  readonly counterRadius: number;
}

export interface BiliteralDiagramLayout {
  readonly viewBox: ViewBoxGeometry;
  readonly outerRect: RectGeometry;
  readonly dividerLines: readonly LineGeometry[];
  readonly counterRadius: number;
}

function createViewBox(): ViewBoxGeometry {
  return { minX: 0, minY: 0, width: 400, height: 400 };
}

function createOuterRect(): RectGeometry {
  return { x: 40, y: 40, width: 320, height: 320 };
}

function createDividerLines(): readonly LineGeometry[] {
  return [
    { x1: 200, y1: 40, x2: 200, y2: 360 },
    { x1: 40, y1: 200, x2: 360, y2: 200 },
  ];
}

export function createTriliteralDiagramLayout(): TriliteralDiagramLayout {
  return {
    viewBox: createViewBox(),
    outerRect: createOuterRect(),
    innerRect: { x: 120, y: 120, width: 160, height: 160 },
    dividerLines: createDividerLines(),
    counterRadius: 14,
  };
}

export function createBiliteralDiagramLayout(): BiliteralDiagramLayout {
  return {
    viewBox: createViewBox(),
    outerRect: createOuterRect(),
    dividerLines: createDividerLines(),
    counterRadius: 14,
  };
}

export function triliteralCellCenter(cell: DiagramCellId): Point {
  switch (cell) {
    case "SMP":
      return { x: 160, y: 160 };
    case "SMp":
      return { x: 240, y: 160 };
    case "SmP":
      return { x: 80, y: 80 };
    case "Smp":
      return { x: 320, y: 80 };
    case "sMP":
      return { x: 160, y: 240 };
    case "sMp":
      return { x: 240, y: 240 };
    case "smP":
      return { x: 80, y: 320 };
    case "smp":
      return { x: 320, y: 320 };
  }
}

export function biliteralCellCenter(cell: BiliteralCell): Point {
  switch (cell) {
    case "SP":
      return { x: 120, y: 120 };
    case "Sp":
      return { x: 280, y: 120 };
    case "sP":
      return { x: 120, y: 280 };
    case "sp":
      return { x: 280, y: 280 };
  }
}

function sameCells<T extends string>(
  actual: readonly [T, T],
  first: T,
  second: T,
): boolean {
  return (
    (actual[0] === first && actual[1] === second) ||
    (actual[0] === second && actual[1] === first)
  );
}

function triliteralBoundaryPosition(
  anchor: Extract<TriliteralCounterAnchor, { readonly type: "boundary" }>,
): Point | null {
  const { cells, partitionRole } = anchor;

  if (partitionRole === "M") {
    if (sameCells(cells, "SMP", "SmP")) return { x: 120, y: 120 };
    if (sameCells(cells, "SMp", "Smp")) return { x: 280, y: 120 };
    if (sameCells(cells, "sMP", "smP")) return { x: 120, y: 280 };
    if (sameCells(cells, "sMp", "smp")) return { x: 280, y: 280 };
  }

  if (partitionRole === "S") {
    if (sameCells(cells, "SMP", "sMP")) return { x: 160, y: 200 };
    if (sameCells(cells, "SMp", "sMp")) return { x: 240, y: 200 };
    if (sameCells(cells, "SmP", "smP")) return { x: 80, y: 200 };
    if (sameCells(cells, "Smp", "smp")) return { x: 320, y: 200 };
  }

  if (partitionRole === "P") {
    if (sameCells(cells, "SMP", "SMp")) return { x: 200, y: 160 };
    if (sameCells(cells, "sMP", "sMp")) return { x: 200, y: 240 };
    if (sameCells(cells, "SmP", "Smp")) return { x: 200, y: 80 };
    if (sameCells(cells, "smP", "smp")) return { x: 200, y: 320 };
  }

  return null;
}

function biliteralBoundaryPosition(
  anchor: Extract<BiliteralCounterAnchor, { readonly type: "boundary" }>,
): Point | null {
  const { cells, partitionRole } = anchor;

  if (partitionRole === "S") {
    if (sameCells(cells, "SP", "sP")) return { x: 120, y: 200 };
    if (sameCells(cells, "Sp", "sp")) return { x: 280, y: 200 };
  }

  if (partitionRole === "P") {
    if (sameCells(cells, "SP", "Sp")) return { x: 200, y: 120 };
    if (sameCells(cells, "sP", "sp")) return { x: 200, y: 280 };
  }

  return null;
}

export function resolveTriliteralCounterPosition(
  anchor: TriliteralCounterAnchor,
): Point {
  if (anchor.type === "cell") {
    return triliteralCellCenter(anchor.cell);
  }

  const position = triliteralBoundaryPosition(anchor);
  if (position === null) {
    throw new Error(
      `Invalid triliteral boundary ${anchor.cells.join("/")} for partition role ${anchor.partitionRole}.`,
    );
  }
  return position;
}

export function resolveBiliteralCounterPosition(
  anchor: BiliteralCounterAnchor,
): Point {
  if (anchor.type === "cell") {
    return biliteralCellCenter(anchor.cell);
  }

  const position = biliteralBoundaryPosition(anchor);
  if (position === null) {
    throw new Error(
      `Invalid biliteral boundary ${anchor.cells.join("/")} for partition role ${anchor.partitionRole}.`,
    );
  }
  return position;
}

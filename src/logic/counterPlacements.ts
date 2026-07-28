import {
  BILITERAL_CELLS,
  type BiliteralCell,
  type BiliteralDiagramState,
} from "../domain/conclusion";
import type {
  BiliteralCounterAnchor,
  BiliteralCounterPlacementResult,
  BiliteralExistenceCounterPlacement,
  TriliteralCounterAnchor,
  TriliteralCounterPlacementResult,
  TriliteralExistenceCounterPlacement,
} from "../domain/counterPlacement";
import {
  DIAGRAM_CELL_IDS,
  type DiagramCellId,
  type TriliteralDiagramState,
} from "../domain/diagram";
import type { TermRole } from "../domain/term";

const TRILITERAL_ROLES = ["S", "M", "P"] as const;
const BILITERAL_ROLES = ["S", "P"] as const;

function triliteralMembership(
  cell: DiagramCellId,
  role: TermRole,
): boolean {
  return cell.includes(role);
}

function biliteralMembership(
  cell: BiliteralCell,
  role: "S" | "P",
): boolean {
  return cell.includes(role);
}

function triliteralBoundaryAnchor(
  cells: readonly [DiagramCellId, DiagramCellId],
): TriliteralCounterAnchor | null {
  const differingRoles = TRILITERAL_ROLES.filter(
    (role) =>
      triliteralMembership(cells[0], role) !==
      triliteralMembership(cells[1], role),
  );

  return differingRoles.length === 1
    ? {
        type: "boundary",
        cells,
        partitionRole: differingRoles[0]!,
      }
    : null;
}

function biliteralBoundaryAnchor(
  cells: readonly [BiliteralCell, BiliteralCell],
): BiliteralCounterAnchor | null {
  const differingRoles = BILITERAL_ROLES.filter(
    (role) =>
      biliteralMembership(cells[0], role) !==
      biliteralMembership(cells[1], role),
  );

  return differingRoles.length === 1
    ? {
        type: "boundary",
        cells,
        partitionRole: differingRoles[0]!,
      }
    : null;
}

function triliteralAnchorKey(anchor: TriliteralCounterAnchor): string {
  return anchor.type === "cell"
    ? `cell:${anchor.cell}`
    : `boundary:${anchor.partitionRole}:${anchor.cells.join(":")}`;
}

function biliteralAnchorKey(anchor: BiliteralCounterAnchor): string {
  return anchor.type === "cell"
    ? `cell:${anchor.cell}`
    : `boundary:${anchor.partitionRole}:${anchor.cells.join(":")}`;
}

function addTriliteralPlacement(
  placements: TriliteralExistenceCounterPlacement[],
  placementIndexes: Map<string, number>,
  sourceId: string,
  anchor: TriliteralCounterAnchor,
): void {
  const key = triliteralAnchorKey(anchor);
  const existingIndex = placementIndexes.get(key);

  if (existingIndex === undefined) {
    placementIndexes.set(key, placements.length);
    placements.push({ kind: "existence", sourceIds: [sourceId], anchor });
    return;
  }

  const existing = placements[existingIndex]!;
  if (!existing.sourceIds.includes(sourceId)) {
    placements[existingIndex] = {
      ...existing,
      sourceIds: [...existing.sourceIds, sourceId],
    };
  }
}

function addBiliteralPlacement(
  placements: BiliteralExistenceCounterPlacement[],
  placementIndexes: Map<string, number>,
  sourceId: string,
  anchor: BiliteralCounterAnchor,
): void {
  const key = biliteralAnchorKey(anchor);
  const existingIndex = placementIndexes.get(key);

  if (existingIndex === undefined) {
    placementIndexes.set(key, placements.length);
    placements.push({ kind: "existence", sourceIds: [sourceId], anchor });
    return;
  }

  const existing = placements[existingIndex]!;
  if (!existing.sourceIds.includes(sourceId)) {
    placements[existingIndex] = {
      ...existing,
      sourceIds: [...existing.sourceIds, sourceId],
    };
  }
}

export function createTriliteralCounterPlacements(
  state: TriliteralDiagramState,
): TriliteralCounterPlacementResult {
  const emptyCellSet = new Set(state.emptyCells);
  const emptinessCounters = DIAGRAM_CELL_IDS.filter((cell) =>
    emptyCellSet.has(cell),
  ).map((cell) => ({
    kind: "emptiness" as const,
    anchor: { type: "cell" as const, cell },
  }));
  const existenceCounters: TriliteralExistenceCounterPlacement[] = [];
  const placementIndexes = new Map<string, number>();

  for (const existential of state.existentials) {
    const candidateSet = new Set(existential.possibleCells);
    const candidates = DIAGRAM_CELL_IDS.filter((cell) =>
      candidateSet.has(cell),
    );

    if (candidates.length === 0) {
      return {
        ok: false,
        reason: "existential-has-no-candidates",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    if (candidates.length > 2) {
      return {
        ok: false,
        reason: "existential-has-too-many-candidates",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    if (candidates.length === 1) {
      addTriliteralPlacement(
        existenceCounters,
        placementIndexes,
        existential.sourceId,
        { type: "cell", cell: candidates[0]! },
      );
      continue;
    }

    const pair: readonly [DiagramCellId, DiagramCellId] = [
      candidates[0]!,
      candidates[1]!,
    ];
    const anchor = triliteralBoundaryAnchor(pair);

    if (anchor === null) {
      return {
        ok: false,
        reason: "existential-candidates-are-not-adjacent",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    addTriliteralPlacement(
      existenceCounters,
      placementIndexes,
      existential.sourceId,
      anchor,
    );
  }

  return {
    ok: true,
    placements: {
      emptinessCounters,
      existenceCounters,
    },
  };
}

export function createBiliteralCounterPlacements(
  state: BiliteralDiagramState,
): BiliteralCounterPlacementResult {
  const emptyCellSet = new Set(state.emptyCells);
  const emptinessCounters = BILITERAL_CELLS.filter((cell) =>
    emptyCellSet.has(cell),
  ).map((cell) => ({
    kind: "emptiness" as const,
    anchor: { type: "cell" as const, cell },
  }));
  const existenceCounters: BiliteralExistenceCounterPlacement[] = [];
  const placementIndexes = new Map<string, number>();

  for (const existential of state.existentials) {
    const candidateSet = new Set(existential.possibleCells);
    const candidates = BILITERAL_CELLS.filter((cell) =>
      candidateSet.has(cell),
    );

    if (candidates.length === 0) {
      return {
        ok: false,
        reason: "existential-has-no-candidates",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    if (candidates.length > 2) {
      return {
        ok: false,
        reason: "existential-has-too-many-candidates",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    if (candidates.length === 1) {
      addBiliteralPlacement(
        existenceCounters,
        placementIndexes,
        existential.sourceId,
        { type: "cell", cell: candidates[0]! },
      );
      continue;
    }

    const pair: readonly [BiliteralCell, BiliteralCell] = [
      candidates[0]!,
      candidates[1]!,
    ];
    const anchor = biliteralBoundaryAnchor(pair);

    if (anchor === null) {
      return {
        ok: false,
        reason: "existential-candidates-are-not-adjacent",
        sourceId: existential.sourceId,
        possibleCells: candidates,
      };
    }

    addBiliteralPlacement(
      existenceCounters,
      placementIndexes,
      existential.sourceId,
      anchor,
    );
  }

  return {
    ok: true,
    placements: {
      emptinessCounters,
      existenceCounters,
    },
  };
}

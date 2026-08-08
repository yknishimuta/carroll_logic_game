import type {
  BiliteralCell,
  BiliteralDiagramState,
} from "./conclusion";
import type {
  ConstraintSourceId,
  DiagramCellId,
} from "./diagram";
import type { TermRole } from "./term";

export type CounterKind = "emptiness" | "existence";

export type BiliteralPartitionRole = Exclude<TermRole, "M">;

export type TriliteralCounterAnchor =
  | {
      readonly type: "cell";
      readonly cell: DiagramCellId;
    }
  | {
      readonly type: "boundary";
      readonly cells: readonly [DiagramCellId, DiagramCellId];
      readonly partitionRole: TermRole;
    };

export type BiliteralCounterAnchor =
  | {
      readonly type: "cell";
      readonly cell: BiliteralCell;
    }
  | {
      readonly type: "boundary";
      readonly cells: readonly [BiliteralCell, BiliteralCell];
      readonly partitionRole: BiliteralPartitionRole;
    };

export interface TriliteralEmptinessCounterPlacement {
  readonly kind: "emptiness";
  readonly anchor: TriliteralCounterAnchor;
}

export interface BiliteralEmptinessCounterPlacement {
  readonly kind: "emptiness";
  readonly anchor: BiliteralCounterAnchor;
}

export interface TriliteralExistenceCounterPlacement {
  readonly kind: "existence";
  readonly sourceIds: readonly ConstraintSourceId[];
  readonly anchor: TriliteralCounterAnchor;
}

export interface BiliteralExistenceCounterPlacement {
  readonly kind: "existence";
  readonly sourceIds: readonly ConstraintSourceId[];
  readonly anchor: BiliteralCounterAnchor;
}

export interface TriliteralCounterPlacements {
  readonly emptinessCounters:
    readonly TriliteralEmptinessCounterPlacement[];
  readonly existenceCounters:
    readonly TriliteralExistenceCounterPlacement[];
}

export interface BiliteralCounterPlacements {
  readonly emptinessCounters:
    readonly BiliteralEmptinessCounterPlacement[];
  readonly existenceCounters:
    readonly BiliteralExistenceCounterPlacement[];
}

export type CounterPlacementFailureReason =
  | "existential-has-no-candidates"
  | "existential-has-too-many-candidates"
  | "existential-candidates-are-not-adjacent";

export type TriliteralCounterPlacementResult =
  | {
      readonly ok: true;
      readonly placements: TriliteralCounterPlacements;
    }
  | {
      readonly ok: false;
      readonly reason: CounterPlacementFailureReason;
      readonly sourceId: ConstraintSourceId;
      readonly possibleCells: readonly DiagramCellId[];
    };

export type BiliteralCounterPlacementResult =
  | {
      readonly ok: true;
      readonly placements: BiliteralCounterPlacements;
    }
  | {
      readonly ok: false;
      readonly reason: CounterPlacementFailureReason;
      readonly sourceId: ConstraintSourceId;
      readonly possibleCells: readonly BiliteralCell[];
    };

export type ConclusionCounterPlacementResult =
  | {
      readonly ok: true;
      readonly displayState: BiliteralDiagramState;
      readonly placements: BiliteralCounterPlacements;
    }
  | {
      readonly ok: false;
      readonly stage: "counter-placement";
      readonly reason: CounterPlacementFailureReason;
      readonly sourceId: ConstraintSourceId;
      readonly possibleCells: readonly BiliteralCell[];
    };

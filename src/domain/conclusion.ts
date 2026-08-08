import type {
  ConstraintSourceId,
  TriliteralDiagramState,
} from "./diagram";
import type { PropositionForm } from "./proposition";
import type { AbstractTermOccurrence } from "./term";

export const BILITERAL_CELLS = ["SP", "Sp", "sP", "sp"] as const;

export type BiliteralCell = (typeof BILITERAL_CELLS)[number];

export interface BiliteralExistentialConstraint {
  readonly sourceId: ConstraintSourceId;
  readonly possibleCells: readonly BiliteralCell[];
}

export interface BiliteralDiagramState {
  readonly emptyCells: readonly BiliteralCell[];
  readonly existentials: readonly BiliteralExistentialConstraint[];
}

export interface SyllogismConclusion {
  readonly form: PropositionForm;
  readonly subject: AbstractTermOccurrence;
  readonly predicate: AbstractTermOccurrence;
}

/**
 * A deterministic, non-redundant proposition set semantically equivalent to
 * all certain retinend information in the projected biliteral state.
 */
export interface CompleteConclusion {
  readonly biliteralState: BiliteralDiagramState;
  readonly propositions: readonly SyllogismConclusion[];
}

export type SyllogismConclusionResult =
  | {
      readonly ok: true;
      readonly triliteralState: TriliteralDiagramState;
      readonly biliteralState: BiliteralDiagramState;
      readonly completeConclusion: CompleteConclusion | null;
    }
  | {
      readonly ok: false;
      readonly stage: "proposition-compilation" | "constraint-merge";
      readonly reason: string;
    };

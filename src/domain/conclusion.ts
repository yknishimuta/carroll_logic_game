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

export type SyllogismConclusionResult =
  | {
      readonly ok: true;
      readonly triliteralState: TriliteralDiagramState;
      readonly biliteralState: BiliteralDiagramState;
      readonly entailedForms: readonly PropositionForm[];
      readonly conclusionForms: readonly PropositionForm[];
    }
  | {
      readonly ok: false;
      readonly stage: "proposition-compilation" | "constraint-merge";
      readonly reason: string;
    };

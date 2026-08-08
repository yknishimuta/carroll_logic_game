import type {
  AbstractTermOccurrence,
  ConcreteTermOccurrence,
} from "./term";

export type PropositionForm = "A" | "E" | "I" | "O";

export function isPropositionForm(value: string): value is PropositionForm {
  return value === "A" || value === "E" || value === "I" || value === "O";
}

export interface ConcreteProposition {
  readonly form: PropositionForm;
  readonly subject: ConcreteTermOccurrence;
  readonly predicate: ConcreteTermOccurrence;
}

export interface AbstractProposition {
  readonly form: PropositionForm;
  readonly subject: AbstractTermOccurrence;
  readonly predicate: AbstractTermOccurrence;
}

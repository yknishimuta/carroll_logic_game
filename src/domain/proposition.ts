import type { TermId, TermRole } from "./term";

export type PropositionForm = "A" | "E" | "I" | "O";

export function isPropositionForm(value: string): value is PropositionForm {
  return value === "A" || value === "E" || value === "I" || value === "O";
}

export interface ConcreteProposition {
  readonly form: PropositionForm;
  readonly subject: TermId;
  readonly predicate: TermId;
}

export interface AbstractProposition {
  readonly form: PropositionForm;
  readonly subject: TermRole;
  readonly predicate: TermRole;
}

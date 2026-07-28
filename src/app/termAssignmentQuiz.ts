import type { ConcreteSyllogism } from "../domain/syllogism";
import type {
  TermAssignment,
  TermId,
} from "../domain/term";

export type AssignmentMode = "automatic" | "quiz";

export function isAssignmentMode(value: string): value is AssignmentMode {
  return value === "automatic" || value === "quiz";
}

export interface TermAssignmentQuizSelection {
  readonly S: TermId | null;
  readonly M: TermId | null;
  readonly P: TermId | null;
}

export function createEmptyTermAssignmentQuizSelection():
TermAssignmentQuizSelection {
  return { S: null, M: null, P: null };
}

export function getProblemTermIds(
  premises: ConcreteSyllogism,
): readonly TermId[] {
  const encountered = [
    premises.firstPremise.subject,
    premises.firstPremise.predicate,
    premises.secondPremise.subject,
    premises.secondPremise.predicate,
  ];
  const distinct = encountered.filter(
    (termId, index) => encountered.indexOf(termId) === index,
  );
  if (distinct.length !== 3) {
    throw new Error(
      `A term-assignment quiz requires exactly 3 distinct terms; found ${distinct.length}.`,
    );
  }
  return distinct;
}

export type TermAssignmentQuizFailureReason =
  | "incomplete"
  | "duplicate-term"
  | "incorrect";

export type TermAssignmentQuizValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: TermAssignmentQuizFailureReason;
    };

export function validateTermAssignmentQuiz(
  selection: TermAssignmentQuizSelection,
  expected: TermAssignment,
): TermAssignmentQuizValidationResult {
  const { S, M, P } = selection;
  if (S === null || M === null || P === null) {
    return { ok: false, reason: "incomplete" };
  }
  if (S === M || M === P || S === P) {
    return { ok: false, reason: "duplicate-term" };
  }
  if (S !== expected.S || M !== expected.M || P !== expected.P) {
    return { ok: false, reason: "incorrect" };
  }
  return { ok: true };
}

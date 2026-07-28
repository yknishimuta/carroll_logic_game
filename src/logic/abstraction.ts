import type {
  AbstractProposition,
  ConcreteProposition,
} from "../domain/proposition";
import type {
  AbstractSyllogism,
  ConcreteSyllogism,
} from "../domain/syllogism";
import type { TermAssignment, TermRole } from "../domain/term";
import { assignTermRoles } from "./termAssignment";

function roleForTerm(
  term: string,
  assignment: TermAssignment,
): TermRole {
  if (term === assignment.S) {
    return "S";
  }

  if (term === assignment.M) {
    return "M";
  }

  if (term === assignment.P) {
    return "P";
  }

  throw new Error(`Term "${term}" is not present in the term assignment.`);
}

export function abstractProposition(
  proposition: ConcreteProposition,
  assignment: TermAssignment,
): AbstractProposition {
  return {
    form: proposition.form,
    subject: roleForTerm(proposition.subject, assignment),
    predicate: roleForTerm(proposition.predicate, assignment),
  };
}

export function abstractSyllogism(
  syllogism: ConcreteSyllogism,
): AbstractSyllogism {
  const assignment = assignTermRoles(syllogism);

  return {
    firstPremise: abstractProposition(
      syllogism.firstPremise,
      assignment,
    ),
    secondPremise: abstractProposition(
      syllogism.secondPremise,
      assignment,
    ),
  };
}

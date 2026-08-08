import type {
  AbstractProposition,
  ConcreteProposition,
} from "../domain/proposition";
import type {
  AbstractSyllogism,
  ConcreteSyllogism,
} from "../domain/syllogism";
import type {
  AbstractTermOccurrence,
  ConcreteTermOccurrence,
  TermAssignment,
  TermRole,
} from "../domain/term";
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

function abstractOccurrence(
  occurrence: ConcreteTermOccurrence,
  assignment: TermAssignment,
): AbstractTermOccurrence {
  return {
    role: roleForTerm(occurrence.termId, assignment),
    complemented: occurrence.complemented,
  };
}

export function abstractProposition(
  proposition: ConcreteProposition,
  assignment: TermAssignment,
): AbstractProposition {
  return {
    form: proposition.form,
    subject: abstractOccurrence(proposition.subject, assignment),
    predicate: abstractOccurrence(proposition.predicate, assignment),
  };
}


export function conclusionTermOccurrences(
  premises: AbstractSyllogism,
): {
  readonly subject: AbstractTermOccurrence;
  readonly predicate: AbstractTermOccurrence;
} {
  const subject = [premises.secondPremise.subject, premises.secondPremise.predicate]
    .find(({ role }) => role !== "M");
  const predicate = [premises.firstPremise.subject, premises.firstPremise.predicate]
    .find(({ role }) => role !== "M");
  if (subject?.role !== "S" || predicate?.role !== "P") {
    throw new Error("The conclusion term occurrences could not be determined.");
  }
  return { subject, predicate };
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

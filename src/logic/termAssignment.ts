import type { ConcreteSyllogism } from "../domain/syllogism";
import type { TermAssignment, TermId } from "../domain/term";

function validateTerm(term: TermId): void {
  if (term.length === 0) {
    throw new Error("Term identifiers must not be empty.");
  }
}

export function assignTermRoles(
  syllogism: ConcreteSyllogism,
): TermAssignment {
  const { firstPremise, secondPremise } = syllogism;
  const firstTerms = [firstPremise.subject.termId, firstPremise.predicate.termId] as const;
  const secondTerms = [secondPremise.subject.termId, secondPremise.predicate.termId] as const;

  for (const term of [...firstTerms, ...secondTerms]) {
    validateTerm(term);
  }

  if (firstPremise.subject.termId === firstPremise.predicate.termId) {
    throw new Error("The first premise must contain two distinct terms.");
  }

  if (secondPremise.subject.termId === secondPremise.predicate.termId) {
    throw new Error("The second premise must contain two distinct terms.");
  }

  const sharedTerms = firstTerms.filter((term) => secondTerms.includes(term));

  if (sharedTerms.length !== 1) {
    throw new Error(
      "A syllogism must have exactly one term shared by both premises.",
    );
  }

  const middle = sharedTerms[0];
  const predicate = firstTerms.find((term) => term !== middle);
  const subject = secondTerms.find((term) => term !== middle);

  if (middle === undefined || predicate === undefined || subject === undefined) {
    throw new Error("The syllogism terms could not be assigned.");
  }

  if (subject === predicate) {
    throw new Error("A syllogism must contain three distinct terms.");
  }

  return {
    S: subject,
    M: middle,
    P: predicate,
  };
}

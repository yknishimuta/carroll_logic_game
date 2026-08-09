import type { AbstractProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import type {
  AbstractTermOccurrence,
  TermRole,
} from "../../src/domain/term";

export function toggleOccurrenceComplement(
  occurrence: AbstractTermOccurrence,
): AbstractTermOccurrence {
  return { role: occurrence.role, complemented: !occurrence.complemented };
}

export function swapEOrIArguments(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "E" && proposition.form !== "I") return null;
  return {
    form: proposition.form,
    subject: proposition.predicate,
    predicate: proposition.subject,
  };
}

export function rewriteOAsIComplement(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "O") return null;
  return {
    form: "I",
    subject: proposition.subject,
    predicate: toggleOccurrenceComplement(proposition.predicate),
  };
}

export function rewriteIComplementAsO(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "I") return null;
  return {
    form: "O",
    subject: proposition.subject,
    predicate: toggleOccurrenceComplement(proposition.predicate),
  };
}

export function rewriteModernAAsEComplement(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "A") return null;
  return {
    form: "E",
    subject: proposition.subject,
    predicate: toggleOccurrenceComplement(proposition.predicate),
  };
}

export function rewriteModernEComplementAsA(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "E") return null;
  return {
    form: "A",
    subject: proposition.subject,
    predicate: toggleOccurrenceComplement(proposition.predicate),
  };
}

export function contraposeModernA(
  proposition: AbstractProposition,
): AbstractProposition | null {
  if (proposition.form !== "A") return null;
  return {
    form: "A",
    subject: toggleOccurrenceComplement(proposition.predicate),
    predicate: toggleOccurrenceComplement(proposition.subject),
  };
}

export function complementRoleEverywhere(
  premises: AbstractSyllogism,
  role: TermRole,
): AbstractSyllogism {
  return {
    firstPremise: complementRoleInProposition(premises.firstPremise, role),
    secondPremise: complementRoleInProposition(premises.secondPremise, role),
  };
}

export function complementRoleInProposition(
  proposition: AbstractProposition,
  role: TermRole,
): AbstractProposition {
  return {
    form: proposition.form,
    subject: proposition.subject.role === role
      ? toggleOccurrenceComplement(proposition.subject)
      : proposition.subject,
    predicate: proposition.predicate.role === role
      ? toggleOccurrenceComplement(proposition.predicate)
      : proposition.predicate,
  };
}

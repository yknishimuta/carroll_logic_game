import type { SyllogismConclusion } from "../../src/domain/conclusion";
import type { AbstractProposition } from "../../src/domain/proposition";
import type { AbstractSyllogism } from "../../src/domain/syllogism";
import {
  abstractTerm,
  type AbstractTermOccurrence,
  type TermRole,
} from "../../src/domain/term";

const FORMS = ["A", "E", "I", "O"] as const;
const COMPLEMENTED = [false, true] as const;

export function generateRelationVariants(
  firstRole: TermRole,
  secondRole: TermRole,
): readonly AbstractProposition[] {
  const orientations = [
    [firstRole, secondRole],
    [secondRole, firstRole],
  ] as const;
  return FORMS.flatMap((form) =>
    orientations.flatMap(([subjectRole, predicateRole]) =>
      COMPLEMENTED.flatMap((subjectComplemented) =>
        COMPLEMENTED.map((predicateComplemented) => ({
          form,
          subject: abstractTerm(subjectRole, subjectComplemented),
          predicate: abstractTerm(predicateRole, predicateComplemented),
        }))
      )
    )
  );
}

export const MP_VARIANTS = generateRelationVariants("M", "P");
export const SM_VARIANTS = generateRelationVariants("S", "M");
export const ABSTRACT_PREMISE_PAIRS: readonly AbstractSyllogism[] =
  MP_VARIANTS.flatMap((firstPremise) =>
    SM_VARIANTS.map((secondPremise) => ({ firstPremise, secondPremise }))
  );

export const SIGNED_RETINEND_CANDIDATES: readonly SyllogismConclusion[] = (
  [["S", "P"], ["P", "S"]] as const
).flatMap(([subjectRole, predicateRole]) =>
  FORMS.flatMap((form) =>
    COMPLEMENTED.flatMap((subjectComplemented) =>
      COMPLEMENTED.map((predicateComplemented) => ({
        form,
        subject: abstractTerm(subjectRole, subjectComplemented),
        predicate: abstractTerm(predicateRole, predicateComplemented),
      }))
    )
  )
);

function occurrenceText(occurrence: AbstractTermOccurrence): string {
  return `${occurrence.role}${occurrence.complemented ? "′" : ""}`;
}

export function propositionId(proposition: AbstractProposition): string {
  return `${proposition.form}:${occurrenceText(proposition.subject)}>${occurrenceText(proposition.predicate)}`;
}

export function premisePairId(premises: AbstractSyllogism): string {
  return `${propositionId(premises.firstPremise)} + ${propositionId(premises.secondPremise)}`;
}

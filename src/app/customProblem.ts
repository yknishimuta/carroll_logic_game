import type {
  ConcreteProposition,
  PropositionForm,
} from "../domain/proposition";
import type { ConcreteSyllogism } from "../domain/syllogism";
import type { TermAssignment, TermId } from "../domain/term";
import { assignTermRoles } from "../logic/termAssignment";

export type ProblemSource = "built-in" | "custom";

export function isProblemSource(value: string): value is ProblemSource {
  return value === "built-in" || value === "custom";
}

export type CustomPremisePosition = "major" | "minor";
export type CustomTermField = "subjectTermId" | "predicateTermId";
export type CustomComplementField = "subjectComplemented" | "predicateComplemented";

export function isCustomPremisePosition(
  value: string,
): value is CustomPremisePosition {
  return value === "major" || value === "minor";
}

export function isCustomTermField(value: string): value is CustomTermField {
  return value === "subjectTermId" || value === "predicateTermId";
}

export function isCustomComplementField(
  value: string,
): value is CustomComplementField {
  return value === "subjectComplemented" || value === "predicateComplemented";
}

export interface CustomPremiseDraft {
  readonly form: PropositionForm | null;
  readonly subjectTermId: TermId | null;
  readonly subjectComplemented: boolean;
  readonly predicateTermId: TermId | null;
  readonly predicateComplemented: boolean;
}

export interface CustomProblemDraft {
  readonly majorPremise: CustomPremiseDraft;
  readonly minorPremise: CustomPremiseDraft;
}

export function createEmptyCustomPremiseDraft(): CustomPremiseDraft {
  return {
    form: null,
    subjectTermId: null,
    subjectComplemented: false,
    predicateTermId: null,
    predicateComplemented: false,
  };
}

export function createEmptyCustomProblemDraft(): CustomProblemDraft {
  return {
    majorPremise: createEmptyCustomPremiseDraft(),
    minorPremise: createEmptyCustomPremiseDraft(),
  };
}

export function createCustomProblemDraftFromPremises(
  premises: ConcreteSyllogism,
): CustomProblemDraft {
  const copy = (premise: ConcreteProposition): CustomPremiseDraft => ({
    form: premise.form,
    subjectTermId: premise.subject.termId,
    subjectComplemented: premise.subject.complemented,
    predicateTermId: premise.predicate.termId,
    predicateComplemented: premise.predicate.complemented,
  });
  return {
    majorPremise: copy(premises.firstPremise),
    minorPremise: copy(premises.secondPremise),
  };
}

export function updateCustomPremiseForm(
  draft: CustomProblemDraft,
  position: CustomPremisePosition,
  form: PropositionForm | null,
): CustomProblemDraft {
  const key = position === "major" ? "majorPremise" : "minorPremise";
  return { ...draft, [key]: { ...draft[key], form } };
}

export function updateCustomPremiseTerm(
  draft: CustomProblemDraft,
  position: CustomPremisePosition,
  field: CustomTermField,
  termId: TermId | null,
): CustomProblemDraft {
  const key = position === "major" ? "majorPremise" : "minorPremise";
  const complementField = field === "subjectTermId"
    ? "subjectComplemented"
    : "predicateComplemented";
  return {
    ...draft,
    [key]: {
      ...draft[key],
      [field]: termId,
      ...(termId === null ? { [complementField]: false } : {}),
    },
  };
}

export function updateCustomPremiseComplement(
  draft: CustomProblemDraft,
  position: CustomPremisePosition,
  field: CustomComplementField,
  complemented: boolean,
): CustomProblemDraft {
  const key = position === "major" ? "majorPremise" : "minorPremise";
  return { ...draft, [key]: { ...draft[key], [field]: complemented } };
}

export type CustomProblemValidationFailureReason =
  | "incomplete"
  | "same-term-within-major-premise"
  | "same-term-within-minor-premise"
  | "expected-three-distinct-terms"
  | "expected-one-common-term"
  | "could-not-determine-major-term"
  | "could-not-determine-minor-term";

export type CustomProblemValidationResult =
  | {
      readonly ok: true;
      readonly premises: ConcreteSyllogism;
      readonly assignment: TermAssignment;
    }
  | {
      readonly ok: false;
      readonly reason: CustomProblemValidationFailureReason;
    };

function completeProposition(
  draft: CustomPremiseDraft,
): ConcreteProposition | null {
  if (
    draft.form === null ||
    draft.subjectTermId === null ||
    draft.predicateTermId === null
  ) {
    return null;
  }
  return {
    form: draft.form,
    subject: {
      termId: draft.subjectTermId,
      complemented: draft.subjectComplemented,
    },
    predicate: {
      termId: draft.predicateTermId,
      complemented: draft.predicateComplemented,
    },
  };
}

function assignmentFailureReason(
  error: unknown,
): CustomProblemValidationFailureReason {
  if (!(error instanceof Error)) {
    throw error;
  }
  switch (error.message) {
    case "The first premise must contain two distinct terms.":
      return "same-term-within-major-premise";
    case "The second premise must contain two distinct terms.":
      return "same-term-within-minor-premise";
    case "A syllogism must have exactly one term shared by both premises.":
      return "expected-one-common-term";
    case "A syllogism must contain three distinct terms.":
      return "expected-three-distinct-terms";
    case "The syllogism terms could not be assigned.":
      return "could-not-determine-major-term";
    default:
      throw error;
  }
}

export function validateCustomProblemDraft(
  draft: CustomProblemDraft,
): CustomProblemValidationResult {
  const firstPremise = completeProposition(draft.majorPremise);
  const secondPremise = completeProposition(draft.minorPremise);
  if (firstPremise === null || secondPremise === null) {
    return { ok: false, reason: "incomplete" };
  }
  const premises = { firstPremise, secondPremise };
  try {
    return {
      ok: true,
      premises,
      assignment: assignTermRoles(premises),
    };
  } catch (error: unknown) {
    return { ok: false, reason: assignmentFailureReason(error) };
  }
}

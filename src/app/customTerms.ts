import {
  CUSTOM_TERM_LABEL_MAX_LENGTH,
  CUSTOM_TERM_LIMIT,
  isCustomTermId,
  type CustomTermDefinition,
  type CustomTermId,
} from "../domain/customTerm";
import type { TermDefinition } from "../domain/term";

export interface CustomTermDraft {
  readonly jaNounPhrase: string;
  readonly enSubjectPlural: string;
  readonly enPredicatePhrase: string;
}

export type CustomTermDraftField =
  | "jaNounPhrase"
  | "enSubjectPlural"
  | "enPredicatePhrase";

export function isCustomTermDraftField(
  value: string,
): value is CustomTermDraftField {
  return value === "jaNounPhrase" ||
    value === "enSubjectPlural" ||
    value === "enPredicatePhrase";
}

export function createEmptyCustomTermDraft(): CustomTermDraft {
  return {
    jaNounPhrase: "",
    enSubjectPlural: "",
    enPredicatePhrase: "",
  };
}

export function updateCustomTermDraft(
  draft: CustomTermDraft,
  field: CustomTermDraftField,
  value: string,
): CustomTermDraft {
  return { ...draft, [field]: value };
}

export type CustomTermValidationFailureReason =
  | "incomplete"
  | "label-too-long"
  | "duplicate-term"
  | "term-limit-reached";

export interface NormalizedCustomTermLabels {
  readonly jaNounPhrase: string;
  readonly enSubjectPlural: string;
  readonly enPredicatePhrase: string;
}

export type CustomTermValidationResult =
  | { readonly ok: true; readonly labels: NormalizedCustomTermLabels }
  | { readonly ok: false; readonly reason: CustomTermValidationFailureReason };

function labelsForComparison(term: TermDefinition): NormalizedCustomTermLabels {
  return {
    jaNounPhrase: term.labels.ja.nounPhrase.trim(),
    enSubjectPlural: term.labels.en.subjectPlural.trim().toLowerCase(),
    enPredicatePhrase: term.labels.en.predicatePhrase.trim().toLowerCase(),
  };
}

export function validateCustomTermDraft(
  draft: CustomTermDraft,
  existingTerms: readonly TermDefinition[],
  editingTermId?: CustomTermId,
): CustomTermValidationResult {
  const labels = {
    jaNounPhrase: draft.jaNounPhrase.trim(),
    enSubjectPlural: draft.enSubjectPlural.trim(),
    enPredicatePhrase: draft.enPredicatePhrase.trim(),
  };
  if (Object.values(labels).some((label) => label.length === 0)) {
    return { ok: false, reason: "incomplete" };
  }
  if (
    Object.values(labels).some(
      (label) => label.length > CUSTOM_TERM_LABEL_MAX_LENGTH,
    )
  ) {
    return { ok: false, reason: "label-too-long" };
  }
  const comparable = {
    ...labels,
    enSubjectPlural: labels.enSubjectPlural.toLowerCase(),
    enPredicatePhrase: labels.enPredicatePhrase.toLowerCase(),
  };
  if (
    existingTerms.some((term) =>
      term.id !== editingTermId &&
      JSON.stringify(labelsForComparison(term)) === JSON.stringify(comparable)
    )
  ) {
    return { ok: false, reason: "duplicate-term" };
  }
  if (
    editingTermId === undefined &&
    existingTerms.filter(({ id }) => isCustomTermId(id)).length >=
      CUSTOM_TERM_LIMIT
  ) {
    return { ok: false, reason: "term-limit-reached" };
  }
  return { ok: true, labels };
}

export function createNextCustomTermId(
  customTerms: readonly CustomTermDefinition[],
): CustomTermId {
  let maximum = 0;
  for (const { id } of customTerms) {
    if (!isCustomTermId(id)) {
      throw new Error(`Invalid custom term ID: "${id}".`);
    }
    maximum = Math.max(maximum, Number(id.slice("custom-term-".length)));
  }
  return `custom-term-${maximum + 1}`;
}

function definition(
  id: CustomTermId,
  labels: NormalizedCustomTermLabels,
): CustomTermDefinition {
  return {
    id,
    labels: {
      ja: { nounPhrase: labels.jaNounPhrase },
      en: {
        subjectPlural: labels.enSubjectPlural,
        predicatePhrase: labels.enPredicatePhrase,
      },
    },
  };
}

export type CreateCustomTermResult =
  | {
      readonly ok: true;
      readonly operation: "create";
      readonly term: CustomTermDefinition;
      readonly terms: readonly CustomTermDefinition[];
    }
  | { readonly ok: false; readonly reason: CustomTermValidationFailureReason };

export function createCustomTerm(
  draft: CustomTermDraft,
  builtInTerms: readonly TermDefinition[],
  customTerms: readonly CustomTermDefinition[],
): CreateCustomTermResult {
  const validation = validateCustomTermDraft(
    draft,
    [...builtInTerms, ...customTerms],
  );
  if (!validation.ok) return validation;
  const term = definition(
    createNextCustomTermId(customTerms),
    validation.labels,
  );
  return {
    ok: true,
    operation: "create",
    term,
    terms: [...customTerms, term],
  };
}

export type UpdateCustomTermResult =
  | {
      readonly ok: true;
      readonly operation: "update";
      readonly term: CustomTermDefinition;
      readonly terms: readonly CustomTermDefinition[];
    }
  | {
      readonly ok: false;
      readonly reason:
        | CustomTermValidationFailureReason
        | "unknown-custom-term";
    };

export function updateCustomTerm(
  termId: CustomTermId,
  draft: CustomTermDraft,
  builtInTerms: readonly TermDefinition[],
  customTerms: readonly CustomTermDefinition[],
): UpdateCustomTermResult {
  const index = customTerms.findIndex(({ id }) => id === termId);
  if (index < 0) return { ok: false, reason: "unknown-custom-term" };
  const validation = validateCustomTermDraft(
    draft,
    [...builtInTerms, ...customTerms],
    termId,
  );
  if (!validation.ok) return validation;
  const term = definition(termId, validation.labels);
  return {
    ok: true,
    operation: "update",
    term,
    terms: customTerms.map((current, currentIndex) =>
      currentIndex === index ? term : current
    ),
  };
}

export function deleteCustomTerm(
  termId: CustomTermId,
  customTerms: readonly CustomTermDefinition[],
): readonly CustomTermDefinition[] {
  if (!customTerms.some(({ id }) => id === termId)) {
    throw new Error(`Unknown custom term: "${termId}".`);
  }
  return customTerms.filter(({ id }) => id !== termId);
}

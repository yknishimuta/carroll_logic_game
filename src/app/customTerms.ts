import {
  CUSTOM_TERM_LABEL_MAX_LENGTH,
  CUSTOM_TERM_LIMIT,
  isCustomTermId,
  type CustomTermDefinition,
  type CustomTermId,
} from "../domain/customTerm";
import type { TermDefinition } from "../domain/term";
import type { Locale } from "../domain/locale";

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
  | "japanese-required"
  | "english-required"
  | "incomplete-english"
  | "at-least-one-language-required"
  | "term-text-too-long"
  | "duplicate-term"
  | "term-limit-reached";

export interface NormalizedCustomTermLabels {
  readonly ja: { readonly nounPhrase: string } | null;
  readonly en: {
    readonly subjectPlural: string;
    readonly predicatePhrase: string;
  } | null;
}

export type CustomTermValidationResult =
  | { readonly ok: true; readonly labels: NormalizedCustomTermLabels }
  | { readonly ok: false; readonly reason: CustomTermValidationFailureReason };

export function normalizeCustomTermDraft(
  draft: CustomTermDraft,
): NormalizedCustomTermLabels {
  const jaNounPhrase = draft.jaNounPhrase.trim();
  const enSubjectPlural = draft.enSubjectPlural.trim();
  const enPredicatePhrase = draft.enPredicatePhrase.trim();
  return {
    ja: jaNounPhrase === "" ? null : { nounPhrase: jaNounPhrase },
    en: enSubjectPlural === "" && enPredicatePhrase === "" ? null : {
      subjectPlural: enSubjectPlural,
      predicatePhrase: enPredicatePhrase,
    },
  };
}

export type AvailableTermDefinition = TermDefinition | CustomTermDefinition;

export function validateCustomTermDraft(
  draft: CustomTermDraft,
  existingTerms: readonly AvailableTermDefinition[],
  context: {
    readonly operation: "create" | "update";
    readonly currentLocale: Locale;
    readonly editingTermId?: CustomTermId;
  } | CustomTermId = { operation: "create", currentLocale: "ja" },
): CustomTermValidationResult {
  const validationContext = typeof context === "string"
    ? { operation: "update" as const, currentLocale: "ja" as const,
      editingTermId: context }
    : context;
  const labels = normalizeCustomTermDraft(draft);
  const subjectPresent = draft.enSubjectPlural.trim() !== "";
  const predicatePresent = draft.enPredicatePhrase.trim() !== "";
  if (subjectPresent !== predicatePresent) {
    return { ok: false, reason: "incomplete-english" };
  }
  if (labels.ja === null && labels.en === null) {
    return { ok: false, reason: validationContext.operation === "update"
      ? "at-least-one-language-required"
      : validationContext.currentLocale === "ja"
        ? "japanese-required"
        : "english-required" };
  }
  if (validationContext.operation === "create" &&
    ((validationContext.currentLocale === "ja" && labels.ja === null) ||
      (validationContext.currentLocale === "en" && labels.en === null))) {
    return { ok: false, reason: validationContext.currentLocale === "ja"
      ? "japanese-required" : "english-required" };
  }
  if (
    [labels.ja?.nounPhrase, labels.en?.subjectPlural, labels.en?.predicatePhrase]
      .filter((label): label is string => label !== undefined).some(
      (label) => label.length > CUSTOM_TERM_LABEL_MAX_LENGTH,
    )
  ) {
    return { ok: false, reason: "term-text-too-long" };
  }
  if (
    existingTerms.some((term) => {
      if (term.id === validationContext.editingTermId) return false;
      const duplicateJa = labels.ja !== null && term.labels.ja !== null &&
        term.labels.ja.nounPhrase.trim() === labels.ja.nounPhrase;
      const duplicateEn = labels.en !== null && term.labels.en !== null &&
        term.labels.en.subjectPlural.trim().toLowerCase() === labels.en.subjectPlural.toLowerCase() &&
        term.labels.en.predicatePhrase.trim().toLowerCase() === labels.en.predicatePhrase.toLowerCase();
      return duplicateJa || duplicateEn;
    })
  ) {
    return { ok: false, reason: "duplicate-term" };
  }
  if (
    validationContext.operation === "create" &&
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
      ja: labels.ja,
      en: labels.en,
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
  currentLocale: Locale = "ja",
): CreateCustomTermResult {
  const validation = validateCustomTermDraft(
    draft,
    [...builtInTerms, ...customTerms],
    { operation: "create", currentLocale },
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
  currentLocale: Locale = "ja",
): UpdateCustomTermResult {
  const index = customTerms.findIndex(({ id }) => id === termId);
  if (index < 0) return { ok: false, reason: "unknown-custom-term" };
  const validation = validateCustomTermDraft(
    draft,
    [...builtInTerms, ...customTerms],
    { operation: "update", currentLocale, editingTermId: termId },
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

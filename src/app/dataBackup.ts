import type { DataBackupContent, DataBackupParseFailureReason } from "../storage/dataBackupFormat";
import { parseDataBackupJson } from "../storage/dataBackupFormat";
import { createAvailableTermCatalog } from "./termCatalog";
import { validateSavedCustomProblemCatalog } from "./savedCustomProblems";
import { BUILT_IN_TERMS } from "../data/terms";
import { validateCustomTermDraft } from "./customTerms";

export type ValidateImportedDataResult =
  | { readonly ok: true; readonly content: DataBackupContent }
  | {
      readonly ok: false;
      readonly reason: "invalid-term-catalog" | "invalid-problem-catalog";
    };

export type PrepareDataImportResult =
  | {
      readonly ok: true;
      readonly content: DataBackupContent;
      readonly summary: {
        readonly customTermCount: number;
        readonly savedCustomProblemCount: number;
      };
    }
  | {
      readonly ok: false;
      readonly reason:
        | DataBackupParseFailureReason
        | "invalid-term-catalog"
        | "invalid-problem-catalog";
    };

export function validateImportedData(
  content: DataBackupContent,
): ValidateImportedDataResult {
  try {
    createAvailableTermCatalog(content.customTerms);
  } catch {
    return { ok: false, reason: "invalid-term-catalog" };
  }
  for (const term of content.customTerms) {
    const result = validateCustomTermDraft({
      jaNounPhrase: term.labels.ja.nounPhrase,
      enSubjectPlural: term.labels.en.subjectPlural,
      enPredicatePhrase: term.labels.en.predicatePhrase,
    }, [...BUILT_IN_TERMS, ...content.customTerms], term.id);
    if (!result.ok) {
      return { ok: false, reason: "invalid-term-catalog" };
    }
  }
  const problems = validateSavedCustomProblemCatalog(
    content.savedCustomProblems,
    content.customTerms,
  );
  return problems.ok
    ? { ok: true, content }
    : { ok: false, reason: "invalid-problem-catalog" };
}

export function prepareDataImport(jsonText: string): PrepareDataImportResult {
  const parsed = parseDataBackupJson(jsonText);
  if (!parsed.ok) return parsed;
  const validated = validateImportedData(parsed.content);
  if (!validated.ok) return validated;
  return {
    ok: true,
    content: validated.content,
    summary: {
      customTermCount: validated.content.customTerms.length,
      savedCustomProblemCount: validated.content.savedCustomProblems.length,
    },
  };
}

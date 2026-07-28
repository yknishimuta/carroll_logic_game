import { BUILT_IN_TERMS } from "../data/terms";
import type { CustomTermDefinition } from "../domain/customTerm";
import {
  SAVED_CUSTOM_PROBLEM_LIMIT,
  SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH,
  isCustomProblemId,
  type CustomProblemId,
  type SavedCustomProblemDefinition,
} from "../domain/savedCustomProblem";
import type { ConcreteSyllogism } from "../domain/syllogism";
import type { TermId } from "../domain/term";
import {
  validateCustomProblemDraft,
  type CustomProblemDraft,
} from "./customProblem";

export interface SavedCustomProblemDraft {
  readonly title: string;
}

export function createEmptySavedCustomProblemDraft():
  SavedCustomProblemDraft {
  return { title: "" };
}

export function updateSavedCustomProblemDraft(
  draft: SavedCustomProblemDraft,
  title: string,
): SavedCustomProblemDraft {
  return { ...draft, title };
}

export type SavedCustomProblemValidationFailureReason =
  | "incomplete-title"
  | "title-too-long"
  | "duplicate-title"
  | "problem-not-ready"
  | "problem-limit-reached";

export type SavedCustomProblemValidationResult =
  | { readonly ok: true; readonly normalizedTitle: string }
  | {
      readonly ok: false;
      readonly reason: SavedCustomProblemValidationFailureReason;
    };

export function validateSavedCustomProblem(
  draft: SavedCustomProblemDraft,
  premises: ConcreteSyllogism | null,
  existingProblems: readonly SavedCustomProblemDefinition[],
  editingProblemId?: CustomProblemId,
): SavedCustomProblemValidationResult {
  const normalizedTitle = draft.title.trim();
  if (normalizedTitle.length === 0) {
    return { ok: false, reason: "incomplete-title" };
  }
  if (normalizedTitle.length > SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH) {
    return { ok: false, reason: "title-too-long" };
  }
  if (premises === null) {
    return { ok: false, reason: "problem-not-ready" };
  }
  const comparable = normalizedTitle.toLowerCase();
  if (existingProblems.some(({ id, title }) =>
    id !== editingProblemId && title.trim().toLowerCase() === comparable
  )) {
    return { ok: false, reason: "duplicate-title" };
  }
  if (
    editingProblemId === undefined &&
    existingProblems.length >= SAVED_CUSTOM_PROBLEM_LIMIT
  ) {
    return { ok: false, reason: "problem-limit-reached" };
  }
  return { ok: true, normalizedTitle };
}

export function createNextCustomProblemId(
  problems: readonly SavedCustomProblemDefinition[],
): CustomProblemId {
  let maximum = 0;
  for (const { id } of problems) {
    if (!isCustomProblemId(id)) {
      throw new Error(`Invalid saved custom problem ID: "${id}".`);
    }
    maximum = Math.max(maximum, Number(id.slice("custom-problem-".length)));
  }
  return `custom-problem-${maximum + 1}`;
}

export type CreateSavedCustomProblemResult =
  | {
      readonly ok: true;
      readonly operation: "create";
      readonly problem: SavedCustomProblemDefinition;
      readonly problems: readonly SavedCustomProblemDefinition[];
    }
  | {
      readonly ok: false;
      readonly reason: SavedCustomProblemValidationFailureReason;
    };

export function createSavedCustomProblem(
  draft: SavedCustomProblemDraft,
  premises: ConcreteSyllogism | null,
  existingProblems: readonly SavedCustomProblemDefinition[],
): CreateSavedCustomProblemResult {
  const validation = validateSavedCustomProblem(
    draft,
    premises,
    existingProblems,
  );
  if (!validation.ok) return validation;
  const problem: SavedCustomProblemDefinition = {
    id: createNextCustomProblemId(existingProblems),
    title: validation.normalizedTitle,
    premises: premises!,
  };
  return {
    ok: true,
    operation: "create",
    problem,
    problems: [...existingProblems, problem],
  };
}

export type UpdateSavedCustomProblemResult =
  | {
      readonly ok: true;
      readonly operation: "update";
      readonly problem: SavedCustomProblemDefinition;
      readonly problems: readonly SavedCustomProblemDefinition[];
    }
  | {
      readonly ok: false;
      readonly reason:
        | SavedCustomProblemValidationFailureReason
        | "unknown-saved-custom-problem";
    };

export function updateSavedCustomProblem(
  problemId: CustomProblemId,
  draft: SavedCustomProblemDraft,
  premises: ConcreteSyllogism | null,
  existingProblems: readonly SavedCustomProblemDefinition[],
): UpdateSavedCustomProblemResult {
  const index = existingProblems.findIndex(({ id }) => id === problemId);
  if (index < 0) {
    return { ok: false, reason: "unknown-saved-custom-problem" };
  }
  const validation = validateSavedCustomProblem(
    draft,
    premises,
    existingProblems,
    problemId,
  );
  if (!validation.ok) return validation;
  const problem: SavedCustomProblemDefinition = {
    id: problemId,
    title: validation.normalizedTitle,
    premises: premises!,
  };
  return {
    ok: true,
    operation: "update",
    problem,
    problems: existingProblems.map((current, currentIndex) =>
      currentIndex === index ? problem : current
    ),
  };
}

export function deleteSavedCustomProblem(
  problemId: CustomProblemId,
  problems: readonly SavedCustomProblemDefinition[],
): readonly SavedCustomProblemDefinition[] {
  if (!problems.some(({ id }) => id === problemId)) {
    throw new Error(`Unknown saved custom problem: "${problemId}".`);
  }
  return problems.filter(({ id }) => id !== problemId);
}

export function createCustomProblemDraftFromSavedProblem(
  problem: SavedCustomProblemDefinition,
): CustomProblemDraft {
  const copy = (premise: ConcreteSyllogism["firstPremise"]) => ({
    form: premise.form,
    subjectTermId: premise.subject,
    predicateTermId: premise.predicate,
  });
  return {
    majorPremise: copy(problem.premises.firstPremise),
    minorPremise: copy(problem.premises.secondPremise),
  };
}

export function savedCustomProblemUsesTerm(
  problem: SavedCustomProblemDefinition,
  termId: TermId,
): boolean {
  return [
    problem.premises.firstPremise.subject,
    problem.premises.firstPremise.predicate,
    problem.premises.secondPremise.subject,
    problem.premises.secondPremise.predicate,
  ].includes(termId);
}

export function findSavedCustomProblemsUsingTerm(
  termId: TermId,
  problems: readonly SavedCustomProblemDefinition[],
): readonly CustomProblemId[] {
  return problems
    .filter((problem) => savedCustomProblemUsesTerm(problem, termId))
    .map(({ id }) => id);
}

export type SavedCustomProblemCatalogValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason:
        | "duplicate-id"
        | "duplicate-title"
        | "unknown-term"
        | "invalid-premises";
    };

export function validateSavedCustomProblemCatalog(
  problems: readonly SavedCustomProblemDefinition[],
  customTerms: readonly CustomTermDefinition[],
): SavedCustomProblemCatalogValidationResult {
  const ids = problems.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) {
    return { ok: false, reason: "duplicate-id" };
  }
  const titles = problems.map(({ title }) => title.trim().toLowerCase());
  if (new Set(titles).size !== titles.length) {
    return { ok: false, reason: "duplicate-title" };
  }
  const termIds = new Set<string>([
    ...BUILT_IN_TERMS.map(({ id }) => id),
    ...customTerms.map(({ id }) => id),
  ]);
  for (const problem of problems) {
    if (
      [
        problem.premises.firstPremise.subject,
        problem.premises.firstPremise.predicate,
        problem.premises.secondPremise.subject,
        problem.premises.secondPremise.predicate,
      ].some((termId) => !termIds.has(termId))
    ) return { ok: false, reason: "unknown-term" };
    const validation = validateCustomProblemDraft(
      createCustomProblemDraftFromSavedProblem(problem),
    );
    if (!validation.ok) {
      return { ok: false, reason: "invalid-premises" };
    }
  }
  return { ok: true };
}

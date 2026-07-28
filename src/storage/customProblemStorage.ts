import {
  SAVED_CUSTOM_PROBLEM_LIMIT,
  SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH,
  isCustomProblemId,
  type SavedCustomProblemDefinition,
} from "../domain/savedCustomProblem";
import { isPropositionForm } from "../domain/proposition";
import type { ConcreteProposition } from "../domain/proposition";
import type { StringStorage } from "./stringStorage";

export const CUSTOM_PROBLEM_STORAGE_KEY =
  "carroll-logic-game.custom-problems.v1";

export type CustomProblemStorageLoadFailureReason =
  | "storage-unavailable"
  | "invalid-json"
  | "unsupported-version"
  | "invalid-data";

export type LoadSavedCustomProblemsResult =
  | {
      readonly ok: true;
      readonly problems: readonly SavedCustomProblemDefinition[];
    }
  | {
      readonly ok: false;
      readonly reason: CustomProblemStorageLoadFailureReason;
    };

export type SaveSavedCustomProblemsResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "storage-unavailable" | "write-failed";
    };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function proposition(value: unknown): ConcreteProposition | null {
  const candidate = record(value);
  if (
    typeof candidate?.form !== "string" ||
    !isPropositionForm(candidate.form) ||
    typeof candidate.subject !== "string" ||
    typeof candidate.predicate !== "string"
  ) return null;
  return {
    form: candidate.form,
    subject: candidate.subject,
    predicate: candidate.predicate,
  };
}

function savedProblem(value: unknown): SavedCustomProblemDefinition | null {
  const candidate = record(value);
  const premises = record(candidate?.premises);
  const firstPremise = proposition(premises?.firstPremise);
  const secondPremise = proposition(premises?.secondPremise);
  if (
    typeof candidate?.id !== "string" ||
    !isCustomProblemId(candidate.id) ||
    typeof candidate.title !== "string" ||
    candidate.title.trim().length === 0 ||
    candidate.title.trim().length > SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH ||
    firstPremise === null ||
    secondPremise === null
  ) return null;
  return {
    id: candidate.id,
    title: candidate.title.trim(),
    premises: { firstPremise, secondPremise },
  };
}

export type DecodeSavedCustomProblemArrayResult =
  | {
      readonly ok: true;
      readonly problems: readonly SavedCustomProblemDefinition[];
    }
  | { readonly ok: false };

export function decodeSavedCustomProblemArray(
  value: unknown,
): DecodeSavedCustomProblemArrayResult {
  if (!Array.isArray(value) || value.length > SAVED_CUSTOM_PROBLEM_LIMIT) {
    return { ok: false };
  }
  const problems: SavedCustomProblemDefinition[] = [];
  for (const candidate of value) {
    const problem = savedProblem(candidate);
    if (problem === null) return { ok: false };
    problems.push(problem);
  }
  const ids = problems.map(({ id }) => id);
  const titles = problems.map(({ title }) => title.toLowerCase());
  return new Set(ids).size === ids.length &&
      new Set(titles).size === titles.length
    ? { ok: true, problems }
    : { ok: false };
}

export function loadSavedCustomProblems(
  storage: StringStorage,
): LoadSavedCustomProblemsResult {
  let stored: string | null;
  try {
    stored = storage.getItem(CUSTOM_PROBLEM_STORAGE_KEY);
  } catch {
    return { ok: false, reason: "storage-unavailable" };
  }
  if (stored === null) return { ok: true, problems: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored) as unknown;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
  const root = record(parsed);
  if (root === null || root.version !== 1) {
    return { ok: false, reason: "unsupported-version" };
  }
  const decoded = decodeSavedCustomProblemArray(root.problems);
  return decoded.ok
    ? { ok: true, problems: decoded.problems }
    : { ok: false, reason: "invalid-data" };
}

export function saveSavedCustomProblems(
  storage: StringStorage,
  problems: readonly SavedCustomProblemDefinition[],
): SaveSavedCustomProblemsResult {
  try {
    storage.setItem(
      CUSTOM_PROBLEM_STORAGE_KEY,
      JSON.stringify({ version: 1, problems }),
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

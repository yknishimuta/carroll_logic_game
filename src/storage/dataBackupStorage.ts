import type { DataBackupContent } from "./dataBackupFormat";
import {
  CUSTOM_TERM_STORAGE_KEY,
  saveCustomTerms,
} from "./customTermStorage";
import {
  CUSTOM_PROBLEM_STORAGE_KEY,
  saveSavedCustomProblems,
} from "./customProblemStorage";
import type { StringStorage } from "./stringStorage";

export type ReplaceBackupStorageResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "write-failed" | "rollback-failed" };

function restoreValue(
  storage: StringStorage,
  key: string,
  value: string | null,
): void {
  if (value === null) storage.removeItem(key);
  else storage.setItem(key, value);
}

export function replaceBackupStorage(
  storage: StringStorage,
  content: DataBackupContent,
): ReplaceBackupStorageResult {
  let previousTerms: string | null;
  let previousProblems: string | null;
  try {
    previousTerms = storage.getItem(CUSTOM_TERM_STORAGE_KEY);
    previousProblems = storage.getItem(CUSTOM_PROBLEM_STORAGE_KEY);
  } catch {
    return { ok: false, reason: "write-failed" };
  }
  const termsSaved = saveCustomTerms(storage, content.customTerms).ok;
  const problemsSaved = termsSaved &&
    saveSavedCustomProblems(storage, content.savedCustomProblems).ok;
  if (termsSaved && problemsSaved) return { ok: true };
  try {
    restoreValue(storage, CUSTOM_TERM_STORAGE_KEY, previousTerms);
    restoreValue(storage, CUSTOM_PROBLEM_STORAGE_KEY, previousProblems);
  } catch {
    return { ok: false, reason: "rollback-failed" };
  }
  return { ok: false, reason: "write-failed" };
}

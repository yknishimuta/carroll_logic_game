import type { CustomTermDefinition } from "../domain/customTerm";
import type { SavedCustomProblemDefinition } from "../domain/savedCustomProblem";
import { decodeCustomTermArray } from "./customTermStorage";
import { decodeSavedCustomProblemArray } from "./customProblemStorage";

export const DATA_BACKUP_FORMAT = "carroll-logic-game-data";
export const DATA_BACKUP_VERSION = 2;
export const DATA_BACKUP_FILENAME = "carroll-logic-game-data-v2.json";
export const DATA_BACKUP_MIME_TYPE = "application/json";
export const DATA_BACKUP_MAX_FILE_BYTES = 1_048_576;

export interface DataBackupContent {
  readonly customTerms: readonly CustomTermDefinition[];
  readonly savedCustomProblems: readonly SavedCustomProblemDefinition[];
}

export interface DataBackupV2 extends DataBackupContent {
  readonly format: typeof DATA_BACKUP_FORMAT;
  readonly version: 2;
}

export type DataBackupParseFailureReason =
  | "invalid-json"
  | "unsupported-format"
  | "unsupported-version"
  | "invalid-data";

export type ParseDataBackupResult =
  | { readonly ok: true; readonly content: DataBackupContent }
  | { readonly ok: false; readonly reason: DataBackupParseFailureReason };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function createDataBackupJson(content: DataBackupContent): string {
  const backup: DataBackupV2 = {
    format: DATA_BACKUP_FORMAT,
    version: DATA_BACKUP_VERSION,
    customTerms: content.customTerms,
    savedCustomProblems: content.savedCustomProblems,
  };
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function parseDataBackupJson(jsonText: string): ParseDataBackupResult {
  let value: unknown;
  try {
    value = JSON.parse(jsonText) as unknown;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
  const root = record(value);
  if (root === null || root.format !== DATA_BACKUP_FORMAT) {
    return { ok: false, reason: "unsupported-format" };
  }
  if (root.version !== 1 && root.version !== DATA_BACKUP_VERSION) {
    return { ok: false, reason: "unsupported-version" };
  }
  const terms = decodeCustomTermArray(root.customTerms, root.version);
  const problems = decodeSavedCustomProblemArray(root.savedCustomProblems);
  return terms.ok && problems.ok
    ? {
        ok: true,
        content: {
          customTerms: terms.terms,
          savedCustomProblems: problems.problems,
        },
      }
    : { ok: false, reason: "invalid-data" };
}

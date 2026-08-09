import type { CustomTermDefinition } from "../domain/customTerm";
import type { SavedCustomProblemDefinition } from "../domain/savedCustomProblem";
import { decodeCustomTermArray } from "./customTermStorage";
import { decodeSavedCustomProblemArray } from "./customProblemStorage";

export const DATA_BACKUP_FORMAT = "carroll-logic-game-backup";
export const DATA_BACKUP_SCHEMA_VERSION = 1;
export const DATA_BACKUP_MIME_TYPE = "application/json";
export const DATA_BACKUP_MAX_FILE_BYTES = 1_048_576;

export interface DataBackupContent {
  readonly customTerms: readonly CustomTermDefinition[];
  readonly savedCustomProblems: readonly SavedCustomProblemDefinition[];
}

export interface DataBackupV1 {
  readonly format: typeof DATA_BACKUP_FORMAT;
  readonly schemaVersion: 1;
  readonly exportedAt: string;
  readonly data: {
    readonly customTerms: readonly CustomTermDefinition[];
    readonly customProblems: readonly SavedCustomProblemDefinition[];
  };
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

function validExportedAt(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value;
}

export function createDataBackupFilename(date: Date = new Date()): string {
  return `carroll-logic-game-backup-${date.toISOString().slice(0, 10)}.json`;
}

export function createDataBackupJson(
  content: DataBackupContent,
  exportedAt: Date = new Date(),
): string {
  const backup: DataBackupV1 = {
    format: DATA_BACKUP_FORMAT,
    schemaVersion: DATA_BACKUP_SCHEMA_VERSION,
    exportedAt: exportedAt.toISOString(),
    data: {
      customTerms: content.customTerms,
      customProblems: content.savedCustomProblems,
    },
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
  if (root.schemaVersion !== DATA_BACKUP_SCHEMA_VERSION) {
    return { ok: false, reason: "unsupported-version" };
  }
  const data = record(root.data);
  if (data === null || !validExportedAt(root.exportedAt)) {
    return { ok: false, reason: "invalid-data" };
  }
  const terms = decodeCustomTermArray(data.customTerms, 2);
  const problems = decodeSavedCustomProblemArray(data.customProblems);
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

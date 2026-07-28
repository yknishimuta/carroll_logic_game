import {
  CUSTOM_TERM_LABEL_MAX_LENGTH,
  CUSTOM_TERM_LIMIT,
  isCustomTermId,
  type CustomTermDefinition,
} from "../domain/customTerm";
import type { StringStorage } from "./stringStorage";
export type { StringStorage } from "./stringStorage";

export const CUSTOM_TERM_STORAGE_KEY =
  "carroll-logic-game.custom-terms.v1";

export type CustomTermStorageLoadFailureReason =
  | "storage-unavailable"
  | "invalid-json"
  | "unsupported-version"
  | "invalid-data";

export type LoadCustomTermsResult =
  | { readonly ok: true; readonly terms: readonly CustomTermDefinition[] }
  | {
      readonly ok: false;
      readonly reason: CustomTermStorageLoadFailureReason;
    };

export type SaveCustomTermsResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "storage-unavailable" | "write-failed" };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseTerm(value: unknown): CustomTermDefinition | null {
  const term = record(value);
  const labels = record(term?.labels);
  const ja = record(labels?.ja);
  const en = record(labels?.en);
  if (
    typeof term?.id !== "string" ||
    !isCustomTermId(term.id) ||
    typeof ja?.nounPhrase !== "string" ||
    typeof en?.subjectPlural !== "string" ||
    typeof en?.predicatePhrase !== "string"
  ) return null;
  const values = [
    ja.nounPhrase.trim(),
    en.subjectPlural.trim(),
    en.predicatePhrase.trim(),
  ];
  if (
    values.some(
      (label) =>
        label.length === 0 ||
        label.length > CUSTOM_TERM_LABEL_MAX_LENGTH,
    )
  ) return null;
  return {
    id: term.id,
    labels: {
      ja: { nounPhrase: values[0]! },
      en: {
        subjectPlural: values[1]!,
        predicatePhrase: values[2]!,
      },
    },
  };
}

export type DecodeCustomTermArrayResult =
  | { readonly ok: true; readonly terms: readonly CustomTermDefinition[] }
  | { readonly ok: false };

export function decodeCustomTermArray(
  value: unknown,
): DecodeCustomTermArrayResult {
  if (!Array.isArray(value) || value.length > CUSTOM_TERM_LIMIT) {
    return { ok: false };
  }
  const terms: CustomTermDefinition[] = [];
  for (const candidate of value) {
    const term = parseTerm(candidate);
    if (term === null) return { ok: false };
    terms.push(term);
  }
  const ids = terms.map(({ id }) => id);
  const labels = terms.map((term) => JSON.stringify({
    ja: term.labels.ja.nounPhrase,
    subject: term.labels.en.subjectPlural.toLowerCase(),
    predicate: term.labels.en.predicatePhrase.toLowerCase(),
  }));
  return new Set(ids).size === ids.length &&
      new Set(labels).size === labels.length
    ? { ok: true, terms }
    : { ok: false };
}

export function loadCustomTerms(
  storage: StringStorage,
): LoadCustomTermsResult {
  let stored: string | null;
  try {
    stored = storage.getItem(CUSTOM_TERM_STORAGE_KEY);
  } catch {
    return { ok: false, reason: "storage-unavailable" };
  }
  if (stored === null) return { ok: true, terms: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored) as unknown;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
  const root = record(parsed);
  if (root === null || root.version !== 1) {
    return {
      ok: false,
      reason: root !== null && "version" in root
        ? "unsupported-version"
        : "unsupported-version",
    };
  }
  const decoded = decodeCustomTermArray(root.terms);
  return decoded.ok
    ? { ok: true, terms: decoded.terms }
    : { ok: false, reason: "invalid-data" };
}

export function saveCustomTerms(
  storage: StringStorage,
  terms: readonly CustomTermDefinition[],
): SaveCustomTermsResult {
  try {
    storage.setItem(
      CUSTOM_TERM_STORAGE_KEY,
      JSON.stringify({ version: 1, terms }),
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

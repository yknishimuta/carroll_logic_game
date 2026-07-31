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

function parseTerm(value: unknown, version: 1 | 2): CustomTermDefinition | null {
  const term = record(value);
  const labels = record(term?.labels);
  if (labels === null || !("ja" in labels) || !("en" in labels)) return null;
  const ja = labels?.ja === null && version === 2 ? null : record(labels?.ja);
  const en = labels?.en === null && version === 2 ? null : record(labels?.en);
  if (
    typeof term?.id !== "string" ||
    !isCustomTermId(term.id) ||
    (version === 1 && (ja === null || en === null)) ||
    (ja !== null && typeof ja.nounPhrase !== "string") ||
    (en !== null && (typeof en.subjectPlural !== "string" ||
      typeof en.predicatePhrase !== "string")) ||
    (ja === null && en === null)
  ) return null;
  const values = [ja?.nounPhrase, en?.subjectPlural, en?.predicatePhrase]
    .filter((label): label is string => label !== undefined)
    .map((label) => label.trim());
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
      ja: ja === null ? null : { nounPhrase: (ja.nounPhrase as string).trim() },
      en: en === null ? null : {
        subjectPlural: (en.subjectPlural as string).trim(),
        predicatePhrase: (en.predicatePhrase as string).trim(),
      },
    },
  };
}

export type DecodeCustomTermArrayResult =
  | { readonly ok: true; readonly terms: readonly CustomTermDefinition[] }
  | { readonly ok: false };

export function decodeCustomTermArray(
  value: unknown,
  version: 1 | 2 = 2,
): DecodeCustomTermArrayResult {
  if (!Array.isArray(value) || value.length > CUSTOM_TERM_LIMIT) {
    return { ok: false };
  }
  const terms: CustomTermDefinition[] = [];
  for (const candidate of value) {
    const term = parseTerm(candidate, version);
    if (term === null) return { ok: false };
    terms.push(term);
  }
  const ids = terms.map(({ id }) => id);
  if (new Set(ids).size !== ids.length) return { ok: false };
  for (let index = 0; index < terms.length; index += 1) {
    const term = terms[index]!;
    if (terms.slice(0, index).some((other) =>
      (term.labels.ja !== null && other.labels.ja !== null &&
        term.labels.ja.nounPhrase === other.labels.ja.nounPhrase) ||
      (term.labels.en !== null && other.labels.en !== null &&
        term.labels.en.subjectPlural.toLowerCase() === other.labels.en.subjectPlural.toLowerCase() &&
        term.labels.en.predicatePhrase.toLowerCase() === other.labels.en.predicatePhrase.toLowerCase())
    )) return { ok: false };
  }
  return { ok: true, terms };
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
  if (root === null || (root.version !== 1 && root.version !== 2)) {
    return {
      ok: false,
      reason: root !== null && "version" in root
        ? "unsupported-version"
        : "unsupported-version",
    };
  }
  const decoded = decodeCustomTermArray(root.terms, root.version);
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
      JSON.stringify({ version: 2, terms }),
    );
    return { ok: true };
  } catch {
    return { ok: false, reason: "write-failed" };
  }
}

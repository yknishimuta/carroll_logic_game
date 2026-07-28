import type { EnglishTermLabel, JapaneseTermLabel } from "./term";

export type CustomTermId = `custom-term-${number}`;

export interface CustomTermDefinition {
  readonly id: CustomTermId;
  readonly labels: {
    readonly ja: JapaneseTermLabel | null;
    readonly en: EnglishTermLabel | null;
  };
}

export const CUSTOM_TERM_LABEL_MAX_LENGTH = 80;
export const CUSTOM_TERM_LIMIT = 100;

export function isCustomTermId(value: string): value is CustomTermId {
  const match = /^custom-term-([1-9]\d*)$/.exec(value);
  if (match === null) return false;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number >= 1;
}

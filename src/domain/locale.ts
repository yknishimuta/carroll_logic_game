export type Locale = "ja" | "en";

export interface LocalizedText {
  readonly ja: string;
  readonly en: string;
}

export function isLocale(value: string): value is Locale {
  return value === "ja" || value === "en";
}

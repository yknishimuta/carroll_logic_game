import type { Locale } from "../domain/locale";
import type { CustomTermDefinition } from "../domain/customTerm";
import type { TermDefinition } from "../domain/term";

export interface ResolvedTermText {
  readonly requestedLocale: Locale;
  readonly sourceLocale: Locale;
  readonly isFallback: boolean;
  readonly displayName: string;
  readonly subjectText: string;
  readonly predicateText: string;
}

export interface DisplayTermDefinition extends TermDefinition {
  readonly resolvedText: {
    readonly ja: ResolvedTermText;
    readonly en: ResolvedTermText;
  };
}

export function resolveCustomTermText(
  term: CustomTermDefinition,
  requestedLocale: Locale,
): ResolvedTermText {
  if (requestedLocale === "ja" && term.labels.ja !== null) {
    const requested = term.labels.ja;
    return { requestedLocale, sourceLocale: "ja", isFallback: false,
      displayName: requested.nounPhrase, subjectText: requested.nounPhrase,
      predicateText: requested.nounPhrase };
  }
  if (requestedLocale === "en" && term.labels.en !== null) {
    const requested = term.labels.en;
    return { requestedLocale, sourceLocale: "en", isFallback: false,
      displayName: requested.subjectPlural, subjectText: requested.subjectPlural,
      predicateText: requested.predicatePhrase };
  }
  if (term.labels.ja !== null) {
    const text = term.labels.ja.nounPhrase;
    return { requestedLocale, sourceLocale: "ja", isFallback: true,
      displayName: text, subjectText: text, predicateText: text };
  }
  if (term.labels.en !== null) {
    return { requestedLocale, sourceLocale: "en", isFallback: true,
      displayName: term.labels.en.subjectPlural,
      subjectText: term.labels.en.subjectPlural,
      predicateText: term.labels.en.predicatePhrase };
  }
  throw new Error(`Custom term has no labels: "${term.id}".`);
}

export function resolveCustomTermForDisplay(
  term: CustomTermDefinition,
): DisplayTermDefinition {
  const ja = resolveCustomTermText(term, "ja");
  const en = resolveCustomTermText(term, "en");
  return {
    id: term.id,
    labels: {
      ja: { nounPhrase: ja.displayName },
      en: { subjectPlural: en.subjectText, predicatePhrase: en.predicateText },
    },
    resolvedText: { ja, en },
  };
}

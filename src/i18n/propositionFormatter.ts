import type { Locale } from "../domain/locale";
import type {
  AbstractProposition,
  ConcreteProposition,
} from "../domain/proposition";
import type { TermDefinition, TermId } from "../domain/term";

export type TermResolver = (termId: TermId) => TermDefinition;

function usageText(
  term: TermDefinition,
  locale: Locale,
  usage: "subject" | "predicate",
): string {
  if ("resolvedText" in term) {
    const resolved = term.resolvedText as Record<Locale, {
      readonly subjectText: string;
      readonly predicateText: string;
    }>;
    return usage === "subject"
      ? resolved[locale].subjectText
      : resolved[locale].predicateText;
  }
  return locale === "ja"
    ? term.labels.ja.nounPhrase
    : usage === "subject"
      ? term.labels.en.subjectPlural
      : term.labels.en.predicatePhrase;
}

export function formatConcreteProposition(
  proposition: ConcreteProposition,
  locale: Locale,
  resolveTerm: TermResolver,
): string {
  const subject = resolveTerm(proposition.subject);
  const predicate = resolveTerm(proposition.predicate);

  if (locale === "ja") {
    const subjectText = usageText(subject, locale, "subject");
    const predicateText = usageText(predicate, locale, "predicate");
    switch (proposition.form) {
      case "A": return `すべての${subjectText}は${predicateText}である。`;
      case "E": return `いかなる${subjectText}も${predicateText}ではない。`;
      case "I": return `ある${subjectText}は${predicateText}である。`;
      case "O": return `ある${subjectText}は${predicateText}ではない。`;
    }
  }

  const subjectText = usageText(subject, locale, "subject");
  const predicateText = usageText(predicate, locale, "predicate");
  switch (proposition.form) {
    case "A": return `All ${subjectText} are ${predicateText}.`;
    case "E": return `No ${subjectText} are ${predicateText}.`;
    case "I": return `Some ${subjectText} are ${predicateText}.`;
    case "O": return `Some ${subjectText} are not ${predicateText}.`;
  }
}

export function formatAbstractProposition(
  proposition: AbstractProposition,
  locale: Locale,
): string {
  const { subject, predicate } = proposition;

  if (locale === "ja") {
    switch (proposition.form) {
      case "A": return `すべての ${subject} は ${predicate} である。`;
      case "E": return `いかなる ${subject} も ${predicate} ではない。`;
      case "I": return `ある ${subject} は ${predicate} である。`;
      case "O": return `ある ${subject} は ${predicate} ではない。`;
    }
  }

  switch (proposition.form) {
    case "A": return `All ${subject} are ${predicate}.`;
    case "E": return `No ${subject} are ${predicate}.`;
    case "I": return `Some ${subject} are ${predicate}.`;
    case "O": return `Some ${subject} are not ${predicate}.`;
  }
}

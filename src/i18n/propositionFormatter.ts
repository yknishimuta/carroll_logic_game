import type { Locale } from "../domain/locale";
import type {
  AbstractProposition,
  ConcreteProposition,
} from "../domain/proposition";
import type { TermDefinition, TermId } from "../domain/term";

export type TermResolver = (termId: TermId) => TermDefinition;

export function formatConcreteProposition(
  proposition: ConcreteProposition,
  locale: Locale,
  resolveTerm: TermResolver,
): string {
  const subject = resolveTerm(proposition.subject);
  const predicate = resolveTerm(proposition.predicate);

  if (locale === "ja") {
    const subjectText = subject.labels.ja.nounPhrase;
    const predicateText = predicate.labels.ja.nounPhrase;
    switch (proposition.form) {
      case "A": return `すべての${subjectText}は${predicateText}である。`;
      case "E": return `いかなる${subjectText}も${predicateText}ではない。`;
      case "I": return `ある${subjectText}は${predicateText}である。`;
      case "O": return `ある${subjectText}は${predicateText}ではない。`;
    }
  }

  const subjectText = subject.labels.en.subjectPlural;
  const predicateText = predicate.labels.en.predicatePhrase;
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

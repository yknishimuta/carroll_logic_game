export type TermId = string;

export type TermRole = "S" | "M" | "P";

export interface ConcreteTermOccurrence {
  readonly termId: TermId;
  readonly complemented: boolean;
}

export interface AbstractTermOccurrence {
  readonly role: TermRole;
  readonly complemented: boolean;
}

export function concreteTerm(
  termId: TermId,
  complemented = false,
): ConcreteTermOccurrence {
  return { termId, complemented };
}

export function abstractTerm(
  role: TermRole,
  complemented = false,
): AbstractTermOccurrence {
  return { role, complemented };
}

export function isTermRole(value: string): value is TermRole {
  return value === "S" || value === "M" || value === "P";
}

export interface TermAssignment {
  readonly S: TermId;
  readonly M: TermId;
  readonly P: TermId;
}

export interface JapaneseTermLabel {
  readonly nounPhrase: string;
}

export interface EnglishTermLabel {
  readonly subjectPlural: string;
  readonly predicatePhrase: string;
}

export interface TermDefinition {
  readonly id: TermId;
  readonly labels: {
    readonly ja: JapaneseTermLabel;
    readonly en: EnglishTermLabel;
  };
}

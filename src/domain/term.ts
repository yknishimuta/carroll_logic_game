export type TermId = string;

export type TermRole = "S" | "M" | "P";

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

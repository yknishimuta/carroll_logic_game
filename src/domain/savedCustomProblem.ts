import type { ConcreteSyllogism } from "./syllogism";

export type CustomProblemId = `custom-problem-${number}`;

export interface SavedCustomProblemDefinition {
  readonly id: CustomProblemId;
  readonly title: string;
  readonly premises: ConcreteSyllogism;
}

export const SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH = 100;
export const SAVED_CUSTOM_PROBLEM_LIMIT = 100;

export function isCustomProblemId(value: string): value is CustomProblemId {
  const match = /^custom-problem-([1-9]\d*)$/.exec(value);
  if (match === null) return false;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number >= 1;
}

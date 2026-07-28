import {
  isPropositionForm,
  type PropositionForm,
} from "../domain/proposition";

export type ConclusionAnswerMode = "automatic" | "quiz";
export type ConclusionAnswerChoice = PropositionForm | "none";

export function isConclusionAnswerMode(
  value: string,
): value is ConclusionAnswerMode {
  return value === "automatic" || value === "quiz";
}

export function isConclusionAnswerChoice(
  value: string,
): value is ConclusionAnswerChoice {
  return value === "none" || isPropositionForm(value);
}

export function deriveExpectedConclusionAnswer(
  conclusionForms: readonly PropositionForm[],
): ConclusionAnswerChoice {
  for (const form of conclusionForms) {
    if (!isPropositionForm(form)) {
      throw new Error(`Unknown complete conclusion form: ${String(form)}.`);
    }
  }
  if (conclusionForms.length > 1) {
    throw new Error(
      `Expected at most one complete conclusion form, but received: ${conclusionForms.join(", ")}.`,
    );
  }
  return conclusionForms[0] ?? "none";
}

export type ConclusionQuizValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "incomplete" | "incorrect";
    };

export function validateConclusionAnswer(
  selected: ConclusionAnswerChoice | null,
  conclusionForms: readonly PropositionForm[],
): ConclusionQuizValidationResult {
  if (selected === null) return { ok: false, reason: "incomplete" };
  return selected === deriveExpectedConclusionAnswer(conclusionForms)
    ? { ok: true }
    : { ok: false, reason: "incorrect" };
}

export type ConclusionQuizCheckState =
  | { readonly kind: "not-checked" }
  | { readonly kind: "incomplete" }
  | { readonly kind: "incorrect" }
  | { readonly kind: "correct" };

export interface ConclusionQuizState {
  readonly mode: ConclusionAnswerMode;
  readonly selectedAnswer: ConclusionAnswerChoice | null;
  readonly check: ConclusionQuizCheckState;
}

export function createInitialConclusionQuizState(
  mode: ConclusionAnswerMode = "automatic",
): ConclusionQuizState {
  return {
    mode,
    selectedAnswer: null,
    check: { kind: "not-checked" },
  };
}

export function selectConclusionAnswer(
  state: ConclusionQuizState,
  answer: ConclusionAnswerChoice | null,
): ConclusionQuizState {
  return {
    mode: state.mode,
    selectedAnswer: answer,
    check: { kind: "not-checked" },
  };
}

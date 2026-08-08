import type {
  CompleteConclusion,
  SyllogismConclusion,
} from "../domain/conclusion";
import {
  isPropositionForm,
  type PropositionForm,
} from "../domain/proposition";
import type {
  CounterAttemptCheckState,
  CounterPlacementMode,
} from "./counterPractice";
import type { GamePhase } from "./state";

export type ConclusionQuizAnswer = PropositionForm | "none";
export type ConclusionAnswerMode = "automatic" | "quiz";

export interface ConclusionQuizQuestion {
  readonly proposition: SyllogismConclusion | null;
  readonly expectedAnswer: ConclusionQuizAnswer;
}

export function deriveConclusionQuizQuestions(
  completeConclusion: CompleteConclusion | null,
): readonly ConclusionQuizQuestion[] {
  if (completeConclusion === null) {
    return [{ proposition: null, expectedAnswer: "none" }];
  }
  if (completeConclusion.propositions.length === 0) {
    throw new Error("A complete conclusion must contain a proposition.");
  }
  return completeConclusion.propositions.map((proposition) => ({
    proposition,
    expectedAnswer: proposition.form,
  }));
}

export function isConclusionAnswerMode(
  value: string,
): value is ConclusionAnswerMode {
  return value === "automatic" || value === "quiz";
}

export function isConclusionQuizAnswer(
  value: string,
): value is ConclusionQuizAnswer {
  return value === "none" || isPropositionForm(value);
}

export type ConclusionQuizValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly reason: "incomplete" | "incorrect";
    };

export function validateConclusionQuizAnswers(
  answers: readonly (ConclusionQuizAnswer | null)[],
  questions: readonly ConclusionQuizQuestion[],
): ConclusionQuizValidationResult {
  if (
    answers.length !== questions.length ||
    answers.some((answer) => answer === null)
  ) return { ok: false, reason: "incomplete" };
  return questions.every((question, index) =>
      answers[index] === question.expectedAnswer
    )
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
  readonly answers: readonly (ConclusionQuizAnswer | null)[];
  readonly check: ConclusionQuizCheckState;
}

export function createInitialConclusionQuizState(
  mode: ConclusionAnswerMode = "automatic",
): ConclusionQuizState {
  return {
    mode,
    answers: [],
    check: { kind: "not-checked" },
  };
}

export function selectConclusionQuizAnswer(
  state: ConclusionQuizState,
  questionIndex: number,
  answer: ConclusionQuizAnswer | null,
): ConclusionQuizState {
  const answers = [...state.answers];
  answers[questionIndex] = answer;
  return {
    mode: state.mode,
    answers,
    check: { kind: "not-checked" },
  };
}

export function isConclusionDiagramUnlocked(
  mode: ConclusionAnswerMode,
  check: ConclusionQuizCheckState,
): boolean {
  return mode === "automatic" || check.kind === "correct";
}

export function isCombinedPremisesReady(
  counterMode: CounterPlacementMode,
  combinedCheck: CounterAttemptCheckState,
): boolean {
  return counterMode === "automatic" || combinedCheck.kind === "correct";
}

export function shouldShowConclusionQuiz(
  phase: GamePhase,
  mode: ConclusionAnswerMode,
  combinedPremisesReady: boolean,
): boolean {
  return phase === "combined-premises" &&
    mode === "quiz" &&
    combinedPremisesReady;
}

export function canEnterConclusion(input: {
  readonly combinedPremisesReady: boolean;
  readonly conclusionMode: ConclusionAnswerMode;
  readonly conclusionCheck: ConclusionQuizCheckState;
}): boolean {
  if (!input.combinedPremisesReady) return false;
  return input.conclusionMode === "automatic" ||
    input.conclusionCheck.kind === "correct";
}

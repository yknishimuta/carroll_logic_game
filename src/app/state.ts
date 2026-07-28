import type { BuiltInProblemId } from "../data/problems";
import type {
  CustomTermDefinition,
  CustomTermId,
} from "../domain/customTerm";
import type { Locale } from "../domain/locale";
import type { PropositionForm } from "../domain/proposition";
import type { ConcreteSyllogism } from "../domain/syllogism";
import type { TermId, TermRole } from "../domain/term";
import type {
  CustomProblemId,
  SavedCustomProblemDefinition,
} from "../domain/savedCustomProblem";
import type {
  BiliteralCounterAnchor,
  TriliteralCounterAnchor,
} from "../domain/counterPlacement";
import {
  createEmptyTermAssignmentQuizSelection,
  type AssignmentMode,
  type TermAssignmentQuizSelection,
  type TermAssignmentQuizValidationResult,
} from "./termAssignmentQuiz";
import {
  createEmptyCustomProblemDraft,
  updateCustomPremiseForm,
  updateCustomPremiseTerm,
  type CustomPremisePosition,
  type CustomProblemDraft,
  type CustomProblemValidationFailureReason,
  type CustomProblemValidationResult,
  type CustomTermField,
  type ProblemSource,
} from "./customProblem";
import {
  createEmptyCustomTermDraft,
  deleteCustomTerm,
  updateCustomTermDraft,
  type CreateCustomTermResult,
  type CustomTermDraft,
  type CustomTermDraftField,
  type CustomTermValidationFailureReason,
  type UpdateCustomTermResult,
} from "./customTerms";
import {
  applyBiliteralCounterTool,
  applyTriliteralCounterTool,
  createInitialCounterPracticeState,
  type CounterAttemptValidationResult,
  type CounterPlacementMode,
  type CounterPracticeState,
  type CounterTool,
} from "./counterPractice";
import {
  createInitialConclusionQuizState,
  selectConclusionAnswer,
  type ConclusionAnswerChoice,
  type ConclusionAnswerMode,
  type ConclusionQuizState,
  type ConclusionQuizValidationResult,
} from "./conclusionQuiz";
import {
  createCustomProblemDraftFromSavedProblem,
  createEmptySavedCustomProblemDraft,
  deleteSavedCustomProblem,
  updateSavedCustomProblemDraft,
  type CreateSavedCustomProblemResult,
  type SavedCustomProblemDraft,
  type SavedCustomProblemValidationFailureReason,
  type UpdateSavedCustomProblemResult,
} from "./savedCustomProblems";
import type { DataBackupContent } from "../storage/dataBackupFormat";
import type { PrepareDataImportResult } from "./dataBackup";

export type GamePhase =
  | "problem"
  | "first-premise"
  | "combined-premises"
  | "conclusion";

export type TermAssignmentQuizStatus =
  | "not-submitted"
  | "incomplete"
  | "duplicate-term"
  | "incorrect"
  | "correct";

export type CustomProblemStatus =
  | "editing"
  | CustomProblemValidationFailureReason
  | "ready";

export type CustomTermEditorMode = "create" | "edit";
export type CustomTermEditorStatus =
  | "editing"
  | CustomTermValidationFailureReason
  | "unknown-custom-term"
  | "term-in-use-by-saved-problem"
  | "created"
  | "updated"
  | "deleted";
export type CustomTermPersistenceStatus =
  | "ready"
  | "load-error"
  | "save-error";

export type SavedCustomProblemEditorStatus =
  | "editing"
  | SavedCustomProblemValidationFailureReason
  | "created"
  | "updated"
  | "deleted";
export type SavedCustomProblemPersistenceStatus =
  | "ready"
  | "load-error"
  | "save-error";

export interface SavedCustomProblemEditorState {
  readonly mode: "create" | "edit";
  readonly editingProblemId: CustomProblemId | null;
  readonly draft: SavedCustomProblemDraft;
  readonly status: SavedCustomProblemEditorStatus;
}

export interface CustomTermEditorState {
  readonly mode: CustomTermEditorMode;
  readonly editingTermId: CustomTermId | null;
  readonly draft: CustomTermDraft;
  readonly status: CustomTermEditorStatus;
}

export type DataImportStatus =
  | "idle" | "reading" | "ready" | "file-too-large" | "read-error"
  | "invalid-json" | "unsupported-format" | "unsupported-version"
  | "invalid-data" | "invalid-term-catalog" | "invalid-problem-catalog"
  | "applied" | "applied-with-save-error";
export type DataExportStatus = "idle" | "exported" | "export-error";
export interface PendingDataImport {
  readonly fileName: string;
  readonly content: DataBackupContent;
  readonly customTermCount: number;
  readonly savedCustomProblemCount: number;
}
export interface DataImportState {
  readonly status: DataImportStatus;
  readonly fileName: string | null;
  readonly pending: PendingDataImport | null;
}

export interface AppState {
  readonly phase: GamePhase;
  readonly locale: Locale;
  readonly problemId: BuiltInProblemId;
  readonly problemSource: ProblemSource;
  readonly customProblemDraft: CustomProblemDraft;
  readonly customPremises: ConcreteSyllogism | null;
  readonly customProblemStatus: CustomProblemStatus;
  readonly assignmentMode: AssignmentMode;
  readonly quizSelection: TermAssignmentQuizSelection;
  readonly quizStatus: TermAssignmentQuizStatus;
  readonly customTerms: readonly CustomTermDefinition[];
  readonly customTermEditor: CustomTermEditorState;
  readonly customTermPersistenceStatus: CustomTermPersistenceStatus;
  readonly counterPractice: CounterPracticeState;
  readonly conclusionQuiz: ConclusionQuizState;
  readonly savedCustomProblems: readonly SavedCustomProblemDefinition[];
  readonly savedCustomProblemEditor: SavedCustomProblemEditorState;
  readonly savedCustomProblemPersistenceStatus:
    SavedCustomProblemPersistenceStatus;
  readonly dataImport: DataImportState;
  readonly dataExportStatus: DataExportStatus;
}

export interface InitialAppStateOptions {
  readonly customTerms?: readonly CustomTermDefinition[];
  readonly customTermPersistenceStatus?: CustomTermPersistenceStatus;
  readonly savedCustomProblems?: readonly SavedCustomProblemDefinition[];
  readonly savedCustomProblemPersistenceStatus?:
    SavedCustomProblemPersistenceStatus;
}

export type AppAction =
  | { readonly type: "next" }
  | { readonly type: "previous" }
  | { readonly type: "reset" }
  | { readonly type: "select-problem"; readonly problemId: BuiltInProblemId }
  | { readonly type: "set-locale"; readonly locale: Locale }
  | { readonly type: "set-problem-source"; readonly source: ProblemSource }
  | {
      readonly type: "update-custom-premise-form";
      readonly position: CustomPremisePosition;
      readonly form: PropositionForm | null;
    }
  | {
      readonly type: "update-custom-premise-term";
      readonly position: CustomPremisePosition;
      readonly field: CustomTermField;
      readonly termId: TermId | null;
    }
  | {
      readonly type: "submit-custom-problem";
      readonly validation: CustomProblemValidationResult;
    }
  | { readonly type: "clear-custom-problem" }
  | { readonly type: "set-assignment-mode"; readonly mode: AssignmentMode }
  | {
      readonly type: "select-quiz-term";
      readonly role: TermRole;
      readonly termId: TermId | null;
    }
  | {
      readonly type: "submit-quiz-assignment";
      readonly validation: TermAssignmentQuizValidationResult;
    }
  | {
      readonly type: "update-custom-term-draft";
      readonly field: CustomTermDraftField;
      readonly value: string;
    }
  | {
      readonly type: "submit-custom-term";
      readonly result: CreateCustomTermResult | UpdateCustomTermResult;
    }
  | {
      readonly type: "start-edit-custom-term";
      readonly termId: CustomTermId;
    }
  | { readonly type: "cancel-edit-custom-term" }
  | {
      readonly type: "delete-custom-term";
      readonly termId: CustomTermId;
    }
  | {
      readonly type: "set-custom-term-persistence-status";
      readonly status: CustomTermPersistenceStatus;
    }
  | {
      readonly type: "set-counter-placement-mode";
      readonly mode: CounterPlacementMode;
    }
  | { readonly type: "set-counter-tool"; readonly tool: CounterTool }
  | {
      readonly type: "apply-triliteral-counter-tool";
      readonly phase: "first-premise" | "combined-premises";
      readonly anchor: TriliteralCounterAnchor;
    }
  | {
      readonly type: "apply-biliteral-counter-tool";
      readonly phase: "conclusion";
      readonly anchor: BiliteralCounterAnchor;
    }
  | {
      readonly type: "submit-counter-attempt";
      readonly phase:
        | "first-premise"
        | "combined-premises"
        | "conclusion";
      readonly validation: CounterAttemptValidationResult;
    }
  | {
      readonly type: "clear-counter-attempt";
      readonly phase:
        | "first-premise"
        | "combined-premises"
        | "conclusion";
    }
  | {
      readonly type: "set-conclusion-answer-mode";
      readonly mode: ConclusionAnswerMode;
    }
  | {
      readonly type: "select-conclusion-answer";
      readonly answer: ConclusionAnswerChoice | null;
    }
  | {
      readonly type: "submit-conclusion-answer";
      readonly validation: ConclusionQuizValidationResult;
    }
  | {
      readonly type: "update-saved-custom-problem-title";
      readonly value: string;
    }
  | {
      readonly type: "submit-saved-custom-problem";
      readonly result:
        | CreateSavedCustomProblemResult
        | UpdateSavedCustomProblemResult;
    }
  | {
      readonly type: "open-saved-custom-problem";
      readonly problemId: CustomProblemId;
    }
  | {
      readonly type: "start-edit-saved-custom-problem";
      readonly problemId: CustomProblemId;
    }
  | { readonly type: "cancel-edit-saved-custom-problem" }
  | {
      readonly type: "delete-saved-custom-problem";
      readonly problemId: CustomProblemId;
    }
  | {
      readonly type: "set-saved-custom-problem-persistence-status";
      readonly status: SavedCustomProblemPersistenceStatus;
    }
  | {
      readonly type: "reject-custom-term-deletion";
      readonly reason: "term-in-use-by-saved-problem";
    }
  | { readonly type: "begin-data-import"; readonly fileName: string }
  | { readonly type: "reject-data-import-file-size"; readonly fileName: string }
  | { readonly type: "reject-data-import-read"; readonly fileName: string }
  | {
      readonly type: "complete-data-import-preparation";
      readonly fileName: string;
      readonly result: PrepareDataImportResult;
    }
  | { readonly type: "cancel-data-import" }
  | { readonly type: "apply-pending-data-import" }
  | {
      readonly type: "complete-import-persistence";
      readonly customTermsSaved: boolean;
      readonly savedCustomProblemsSaved: boolean;
    }
  | {
      readonly type: "set-data-export-status";
      readonly status: DataExportStatus;
    };

const PHASES = [
  "problem",
  "first-premise",
  "combined-premises",
  "conclusion",
] as const;

function emptyQuizState(): Pick<AppState, "quizSelection" | "quizStatus"> {
  return {
    quizSelection: createEmptyTermAssignmentQuizSelection(),
    quizStatus: "not-submitted",
  };
}

function emptyCustomTermEditor(
  status: CustomTermEditorStatus = "editing",
): CustomTermEditorState {
  return {
    mode: "create",
    editingTermId: null,
    draft: createEmptyCustomTermDraft(),
    status,
  };
}

function emptySavedCustomProblemEditor(
  status: SavedCustomProblemEditorStatus = "editing",
): SavedCustomProblemEditorState {
  return {
    mode: "create",
    editingProblemId: null,
    draft: createEmptySavedCustomProblemDraft(),
    status,
  };
}

export function createInitialAppState(
  options: InitialAppStateOptions = {},
): AppState {
  return {
    phase: "problem",
    locale: "ja",
    problemId: "barbara-aaa1",
    problemSource: "built-in",
    customProblemDraft: createEmptyCustomProblemDraft(),
    customPremises: null,
    customProblemStatus: "editing",
    assignmentMode: "automatic",
    ...emptyQuizState(),
    customTerms: options.customTerms === undefined
      ? []
      : [...options.customTerms],
    customTermEditor: emptyCustomTermEditor(),
    customTermPersistenceStatus:
      options.customTermPersistenceStatus ?? "ready",
    counterPractice: createInitialCounterPracticeState(),
    conclusionQuiz: createInitialConclusionQuizState(),
    savedCustomProblems: options.savedCustomProblems === undefined
      ? []
      : [...options.savedCustomProblems],
    savedCustomProblemEditor: emptySavedCustomProblemEditor(),
    savedCustomProblemPersistenceStatus:
      options.savedCustomProblemPersistenceStatus ?? "ready",
    dataImport: { status: "idle", fileName: null, pending: null },
    dataExportStatus: "idle",
  };
}

function resetCounterPractice(state: AppState): CounterPracticeState {
  return createInitialCounterPracticeState(state.counterPractice.mode);
}

function resetConclusionQuiz(state: AppState): ConclusionQuizState {
  return createInitialConclusionQuizState(state.conclusionQuiz.mode);
}

function draftWithoutTerm(
  draft: CustomProblemDraft,
  termId: CustomTermId,
): CustomProblemDraft {
  const clear = (
    premise: CustomProblemDraft["majorPremise"],
  ): CustomProblemDraft["majorPremise"] => ({
    ...premise,
    subjectTermId:
      premise.subjectTermId === termId ? null : premise.subjectTermId,
    predicateTermId:
      premise.predicateTermId === termId ? null : premise.predicateTermId,
  });
  return {
    majorPremise: clear(draft.majorPremise),
    minorPremise: clear(draft.minorPremise),
  };
}

function premisesUseTerm(
  premises: ConcreteSyllogism | null,
  termId: CustomTermId,
): boolean {
  return premises !== null && [
    premises.firstPremise.subject,
    premises.firstPremise.predicate,
    premises.secondPremise.subject,
    premises.secondPremise.predicate,
  ].includes(termId);
}

export function reduceAppState(
  state: AppState,
  action: AppAction,
): AppState {
  switch (action.type) {
    case "reset":
      return {
        ...state,
        phase: "problem",
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "select-problem":
      return {
        ...state,
        phase: "problem",
        problemId: action.problemId,
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "set-problem-source":
      return {
        ...state,
        phase: "problem",
        problemSource: action.source,
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "set-locale":
      return { ...state, locale: action.locale };
    case "update-custom-premise-form":
      if (state.problemSource === "built-in") return state;
      return {
        ...state,
        phase: "problem",
        customProblemDraft: updateCustomPremiseForm(
          state.customProblemDraft,
          action.position,
          action.form,
        ),
        customPremises: null,
        customProblemStatus: "editing",
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "update-custom-premise-term":
      if (state.problemSource === "built-in") return state;
      return {
        ...state,
        phase: "problem",
        customProblemDraft: updateCustomPremiseTerm(
          state.customProblemDraft,
          action.position,
          action.field,
          action.termId,
        ),
        customPremises: null,
        customProblemStatus: "editing",
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "submit-custom-problem":
      if (state.problemSource === "built-in") return state;
      return {
        ...state,
        phase: "problem",
        customPremises: action.validation.ok
          ? action.validation.premises
          : null,
        customProblemStatus: action.validation.ok
          ? "ready"
          : action.validation.reason,
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "clear-custom-problem":
      return {
        ...state,
        phase: "problem",
        customProblemDraft: createEmptyCustomProblemDraft(),
        customPremises: null,
        customProblemStatus: "editing",
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "set-assignment-mode":
      return {
        ...state,
        phase: "problem",
        assignmentMode: action.mode,
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "select-quiz-term":
      if (state.assignmentMode === "automatic") {
        return state;
      }
      return {
        ...state,
        quizSelection: {
          ...state.quizSelection,
          [action.role]: action.termId,
        },
        quizStatus: "not-submitted",
      };
    case "submit-quiz-assignment":
      if (state.assignmentMode === "automatic") {
        return state;
      }
      return {
        ...state,
        quizStatus: action.validation.ok
          ? "correct"
          : action.validation.reason,
      };
    case "update-custom-term-draft":
      return {
        ...state,
        customTermEditor: {
          ...state.customTermEditor,
          draft: updateCustomTermDraft(
            state.customTermEditor.draft,
            action.field,
            action.value,
          ),
          status: "editing",
        },
      };
    case "submit-custom-term":
      if (!action.result.ok) {
        return {
          ...state,
          customTermEditor: {
            ...state.customTermEditor,
            status: action.result.reason,
          },
        };
      }
      return {
        ...state,
        customTerms: action.result.terms,
        customTermEditor: emptyCustomTermEditor(
          action.result.operation === "create" ? "created" : "updated",
        ),
      };
    case "start-edit-custom-term": {
      const term = state.customTerms.find(({ id }) => id === action.termId);
      if (term === undefined) {
        throw new Error(`Unknown custom term: "${action.termId}".`);
      }
      return {
        ...state,
        customTermEditor: {
          mode: "edit",
          editingTermId: term.id,
          draft: {
            jaNounPhrase: term.labels.ja.nounPhrase,
            enSubjectPlural: term.labels.en.subjectPlural,
            enPredicatePhrase: term.labels.en.predicatePhrase,
          },
          status: "editing",
        },
      };
    }
    case "cancel-edit-custom-term":
      return { ...state, customTermEditor: emptyCustomTermEditor() };
    case "delete-custom-term": {
      const used = premisesUseTerm(state.customPremises, action.termId);
      const draft = draftWithoutTerm(
        state.customProblemDraft,
        action.termId,
      );
      const selection = {
        S: state.quizSelection.S === action.termId
          ? null
          : state.quizSelection.S,
        M: state.quizSelection.M === action.termId
          ? null
          : state.quizSelection.M,
        P: state.quizSelection.P === action.termId
          ? null
          : state.quizSelection.P,
      };
      return {
        ...state,
        phase: used ? "problem" : state.phase,
        customTerms: deleteCustomTerm(action.termId, state.customTerms),
        customTermEditor:
          state.customTermEditor.editingTermId === action.termId
            ? emptyCustomTermEditor("deleted")
            : { ...state.customTermEditor, status: "deleted" },
        customProblemDraft: draft,
        customPremises: used ? null : state.customPremises,
        customProblemStatus: used ? "editing" : state.customProblemStatus,
        quizSelection: selection,
        quizStatus: "not-submitted",
        counterPractice: used
          ? resetCounterPractice(state)
          : state.counterPractice,
        conclusionQuiz: used
          ? resetConclusionQuiz(state)
          : state.conclusionQuiz,
      };
    }
    case "set-custom-term-persistence-status":
      return { ...state, customTermPersistenceStatus: action.status };
    case "reject-custom-term-deletion":
      return {
        ...state,
        customTermEditor: {
          ...state.customTermEditor,
          status: action.reason,
        },
      };
    case "begin-data-import":
      return {
        ...state,
        dataImport: {
          status: "reading",
          fileName: action.fileName,
          pending: null,
        },
      };
    case "reject-data-import-file-size":
      return {
        ...state,
        dataImport: {
          status: "file-too-large",
          fileName: action.fileName,
          pending: null,
        },
      };
    case "reject-data-import-read":
      return {
        ...state,
        dataImport: {
          status: "read-error",
          fileName: action.fileName,
          pending: null,
        },
      };
    case "complete-data-import-preparation":
      return {
        ...state,
        dataImport: action.result.ok
          ? {
              status: "ready",
              fileName: action.fileName,
              pending: {
                fileName: action.fileName,
                content: action.result.content,
                customTermCount: action.result.summary.customTermCount,
                savedCustomProblemCount:
                  action.result.summary.savedCustomProblemCount,
              },
            }
          : {
              status: action.result.reason,
              fileName: action.fileName,
              pending: null,
            },
      };
    case "cancel-data-import":
      return {
        ...state,
        dataImport: { status: "idle", fileName: null, pending: null },
      };
    case "apply-pending-data-import": {
      const pending = state.dataImport.pending;
      if (state.dataImport.status !== "ready" || pending === null) return state;
      return {
        ...state,
        phase: "problem",
        problemSource: "built-in",
        customTerms: [...pending.content.customTerms],
        savedCustomProblems: [...pending.content.savedCustomProblems],
        customProblemDraft: createEmptyCustomProblemDraft(),
        customPremises: null,
        customProblemStatus: "editing",
        customTermEditor: emptyCustomTermEditor(),
        savedCustomProblemEditor: emptySavedCustomProblemEditor(),
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
        dataImport: {
          status: "applied",
          fileName: state.dataImport.fileName,
          pending: null,
        },
      };
    }
    case "complete-import-persistence":
      return {
        ...state,
        dataImport: {
          ...state.dataImport,
          status: action.customTermsSaved && action.savedCustomProblemsSaved
            ? "applied"
            : "applied-with-save-error",
        },
        customTermPersistenceStatus: action.customTermsSaved
          ? "ready"
          : "save-error",
        savedCustomProblemPersistenceStatus:
          action.savedCustomProblemsSaved ? "ready" : "save-error",
      };
    case "set-data-export-status":
      return { ...state, dataExportStatus: action.status };
    case "set-counter-placement-mode":
      return {
        ...state,
        phase: "problem",
        counterPractice: createInitialCounterPracticeState(action.mode),
        conclusionQuiz: resetConclusionQuiz(state),
      };
    case "set-counter-tool":
      if (state.counterPractice.mode !== "manual") return state;
      return {
        ...state,
        counterPractice: {
          ...state.counterPractice,
          selectedTool: action.tool,
        },
      };
    case "apply-triliteral-counter-tool": {
      if (
        state.counterPractice.mode !== "manual" ||
        state.phase !== action.phase
      ) return state;
      const field = action.phase === "first-premise"
        ? "firstPremise"
        : "combinedPremises";
      const current = state.counterPractice[field];
      const placements = applyTriliteralCounterTool(
        current.placements,
        action.anchor,
        state.counterPractice.selectedTool,
      );
      if (placements === current.placements) return state;
      return {
        ...state,
        counterPractice: {
          ...state.counterPractice,
          [field]: {
            placements,
            check: { kind: "not-checked" },
          },
        },
      };
    }
    case "apply-biliteral-counter-tool":
      if (
        state.counterPractice.mode !== "manual" ||
        state.phase !== action.phase ||
        (
          state.conclusionQuiz.mode === "quiz" &&
          state.conclusionQuiz.check.kind !== "correct"
        )
      ) return state;
      {
        const placements = applyBiliteralCounterTool(
          state.counterPractice.conclusion.placements,
          action.anchor,
          state.counterPractice.selectedTool,
        );
        if (
          placements === state.counterPractice.conclusion.placements
        ) return state;
        return {
        ...state,
        counterPractice: {
          ...state.counterPractice,
          conclusion: {
            placements,
            check: { kind: "not-checked" },
          },
        },
      };
      }
    case "submit-counter-attempt": {
      if (
        state.counterPractice.mode !== "manual" ||
        state.phase !== action.phase ||
        (
          action.phase === "conclusion" &&
          state.conclusionQuiz.mode === "quiz" &&
          state.conclusionQuiz.check.kind !== "correct"
        )
      ) return state;
      const field = action.phase === "first-premise"
        ? "firstPremise"
        : action.phase === "combined-premises"
          ? "combinedPremises"
          : "conclusion";
      return {
        ...state,
        counterPractice: {
          ...state.counterPractice,
          [field]: {
            ...state.counterPractice[field],
            check: action.validation.ok
              ? { kind: "correct" }
              : {
                  kind: "incorrect",
                  summary: action.validation.summary,
                },
          },
        },
      };
    }
    case "clear-counter-attempt": {
      if (
        state.counterPractice.mode !== "manual" ||
        state.phase !== action.phase ||
        (
          action.phase === "conclusion" &&
          state.conclusionQuiz.mode === "quiz" &&
          state.conclusionQuiz.check.kind !== "correct"
        )
      ) return state;
      const field = action.phase === "first-premise"
        ? "firstPremise"
        : action.phase === "combined-premises"
          ? "combinedPremises"
          : "conclusion";
      return {
        ...state,
        counterPractice: {
          ...state.counterPractice,
          [field]: {
            placements: [],
            check: { kind: "not-checked" },
          },
        },
      };
    }
    case "set-conclusion-answer-mode":
      return {
        ...state,
        phase: "problem",
        conclusionQuiz: createInitialConclusionQuizState(action.mode),
        counterPractice: resetCounterPractice(state),
      };
    case "select-conclusion-answer":
      if (
        state.conclusionQuiz.mode !== "quiz" ||
        state.phase !== "conclusion"
      ) return state;
      return {
        ...state,
        conclusionQuiz: selectConclusionAnswer(
          state.conclusionQuiz,
          action.answer,
        ),
      };
    case "submit-conclusion-answer":
      if (
        state.conclusionQuiz.mode !== "quiz" ||
        state.phase !== "conclusion"
      ) return state;
      return {
        ...state,
        conclusionQuiz: {
          ...state.conclusionQuiz,
          check: action.validation.ok
            ? { kind: "correct" }
            : { kind: action.validation.reason },
        },
      };
    case "update-saved-custom-problem-title":
      return {
        ...state,
        savedCustomProblemEditor: {
          ...state.savedCustomProblemEditor,
          draft: updateSavedCustomProblemDraft(
            state.savedCustomProblemEditor.draft,
            action.value,
          ),
          status: "editing",
        },
      };
    case "submit-saved-custom-problem":
      if (!action.result.ok) {
        if (action.result.reason === "unknown-saved-custom-problem") {
          throw new Error("Unknown saved custom problem during update.");
        }
        return {
          ...state,
          savedCustomProblemEditor: {
            ...state.savedCustomProblemEditor,
            status: action.result.reason,
          },
        };
      }
      return {
        ...state,
        phase: action.result.operation === "update"
          ? "problem"
          : state.phase,
        savedCustomProblems: action.result.problems,
        savedCustomProblemEditor: emptySavedCustomProblemEditor(
          action.result.operation === "create" ? "created" : "updated",
        ),
      };
    case "open-saved-custom-problem":
    case "start-edit-saved-custom-problem": {
      const problem = state.savedCustomProblems.find(
        ({ id }) => id === action.problemId,
      );
      if (problem === undefined) {
        throw new Error(`Unknown saved custom problem: "${action.problemId}".`);
      }
      return {
        ...state,
        phase: "problem",
        problemSource: "custom",
        customProblemDraft: createCustomProblemDraftFromSavedProblem(problem),
        customPremises: problem.premises,
        customProblemStatus: "ready",
        ...emptyQuizState(),
        counterPractice: resetCounterPractice(state),
        conclusionQuiz: resetConclusionQuiz(state),
        savedCustomProblemEditor:
          action.type === "start-edit-saved-custom-problem"
            ? {
                mode: "edit",
                editingProblemId: problem.id,
                draft: { title: problem.title },
                status: "editing",
              }
            : emptySavedCustomProblemEditor(),
      };
    }
    case "cancel-edit-saved-custom-problem":
      return {
        ...state,
        savedCustomProblemEditor: emptySavedCustomProblemEditor(),
      };
    case "delete-saved-custom-problem":
      return {
        ...state,
        savedCustomProblems: deleteSavedCustomProblem(
          action.problemId,
          state.savedCustomProblems,
        ),
        savedCustomProblemEditor:
          state.savedCustomProblemEditor.editingProblemId === action.problemId
            ? emptySavedCustomProblemEditor("deleted")
            : {
                ...state.savedCustomProblemEditor,
                status: "deleted",
              },
      };
    case "set-saved-custom-problem-persistence-status":
      return {
        ...state,
        savedCustomProblemPersistenceStatus: action.status,
      };
    case "next":
      if (
        state.phase === "problem" &&
        (
          (
            state.problemSource === "custom" &&
            (
              state.customPremises === null ||
              state.customProblemStatus !== "ready"
            )
          ) ||
          (
            state.assignmentMode === "quiz" &&
            state.quizStatus !== "correct"
          )
        )
      ) {
        return state;
      }
      if (
        state.counterPractice.mode === "manual" &&
        (
          (
            state.phase === "first-premise" &&
            state.counterPractice.firstPremise.check.kind !== "correct"
          ) ||
          (
            state.phase === "combined-premises" &&
            state.counterPractice.combinedPremises.check.kind !== "correct"
          )
        )
      ) return state;
      break;
    case "previous":
      break;
  }

  const currentIndex = PHASES.indexOf(state.phase);
  const offset = action.type === "next" ? 1 : -1;
  const nextIndex = Math.min(
    PHASES.length - 1,
    Math.max(0, currentIndex + offset),
  );
  return { ...state, phase: PHASES[nextIndex]! };
}

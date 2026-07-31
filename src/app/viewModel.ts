import {
  BUILT_IN_PROBLEMS,
  getBuiltInProblem,
} from "../data/problems";
import { getTermDisplayName } from "../data/terms";
import {
  renderBiliteralDiagramSvg,
  renderTriliteralDiagramSvg,
} from "../diagram/svgRenderer";
import type {
  BiliteralCounterAnchor,
  CounterKind,
  TriliteralCounterAnchor,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import type { Locale } from "../domain/locale";
import type { CustomTermId } from "../domain/customTerm";
import {
  SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH,
  type CustomProblemId,
} from "../domain/savedCustomProblem";
import type { ConcreteSyllogism } from "../domain/syllogism";
import type { TermId, TermRole } from "../domain/term";
import {
  formatAbstractProposition,
  formatConcreteProposition,
} from "../i18n/propositionFormatter";
import { getUiMessages, type UiMessages } from "../i18n/types";
import type { CustomPremisePosition } from "./customProblem";
import {
  createConcreteConclusion,
  computeProblem,
  type ProblemComputation,
} from "./problemComputation";
import type {
  AppState,
  CustomProblemStatus,
  GamePhase,
} from "./state";
import { getProblemTermIds } from "./termAssignmentQuiz";
import {
  createAvailableTermCatalog,
  resolveAvailableTerm,
} from "./termCatalog";
import type {
  CustomTermDraft,
  CustomTermDraftField,
  CustomTermValidationFailureReason,
} from "./customTerms";
import { resolveCustomTermText } from "./termDisplay";
import {
  createBiliteralAttemptPlacements,
  createBiliteralCounterTargets,
  createTriliteralAttemptPlacements,
  createTriliteralCounterTargets,
  type CounterAttemptCheckState,
  type CounterTool,
} from "./counterPractice";
import type {
  ConclusionAnswerChoice,
} from "./conclusionQuiz";
import type { SavedCustomProblemEditorStatus } from "./state";

export interface SelectOptionViewModel {
  readonly value: string;
  readonly label: string;
}

export interface SelectorViewModel {
  readonly label: string;
  readonly selectedValue: string;
  readonly placeholder?: string;
  readonly options: readonly SelectOptionViewModel[];
}

export interface TermAssignmentItemViewModel {
  readonly role: TermRole;
  readonly label: string;
}

export interface TermRoleSelectorViewModel {
  readonly role: TermRole;
  readonly label: string;
  readonly selectedTermId: TermId | null;
  readonly placeholder: string;
  readonly options: readonly SelectOptionViewModel[];
}

export interface QuizFeedbackViewModel {
  readonly kind: "incomplete" | "duplicate-term" | "incorrect" | "correct";
  readonly message: string;
}

export type TermAssignmentPanelViewModel =
  | {
      readonly kind: "resolved";
      readonly items: readonly TermAssignmentItemViewModel[];
      readonly abstractPremises: readonly [string, string];
    }
  | {
      readonly kind: "quiz";
      readonly instruction: string;
      readonly roleSelectors: readonly TermRoleSelectorViewModel[];
      readonly checkButtonLabel: string;
      readonly checkButtonDisabled: false;
      readonly feedback: QuizFeedbackViewModel | null;
      readonly resolvedItems: readonly TermAssignmentItemViewModel[] | null;
      readonly abstractPremises: readonly [string, string] | null;
    }
  | { readonly kind: "unavailable" };

export interface CustomPremiseEditorViewModel {
  readonly position: CustomPremisePosition;
  readonly heading: string;
  readonly formSelector: SelectorViewModel;
  readonly subjectSelector: SelectorViewModel;
  readonly predicateSelector: SelectorViewModel;
}

export interface CustomProblemEditorViewModel {
  readonly title: string;
  readonly instruction: string;
  readonly premises: readonly [
    CustomPremiseEditorViewModel,
    CustomPremiseEditorViewModel,
  ];
  readonly createButtonLabel: string;
  readonly clearButtonLabel: string;
  readonly feedback: {
    readonly kind: "error" | "success";
    readonly message: string;
  } | null;
}

export interface CustomTermListItemViewModel {
  readonly id: CustomTermId;
  readonly displayName: string;
  readonly jaNounPhrase: string;
  readonly enSubjectPlural: string;
  readonly enPredicatePhrase: string;
  readonly sourceLocale: Locale;
  readonly isFallback: boolean;
  readonly fallbackLabel: string | null;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

export interface CustomTermManagerViewModel {
  readonly heading: string;
  readonly description: string;
  readonly mode: "create" | "edit";
  readonly fields: {
    readonly jaNounPhrase: string;
    readonly enSubjectPlural: string;
    readonly enPredicatePhrase: string;
  };
  readonly draft: CustomTermDraft;
  readonly groups: readonly [{
    readonly locale: Locale;
    readonly heading: string;
    readonly optional: boolean;
    readonly helpText: string | null;
  }, {
    readonly locale: Locale;
    readonly heading: string;
    readonly optional: boolean;
    readonly helpText: string | null;
  }];
  readonly requiredLabel: string;
  readonly optionalLabel: string;
  readonly submitLabel: string;
  readonly cancelLabel: string | null;
  readonly items: readonly CustomTermListItemViewModel[];
  readonly emptyListMessage: string | null;
  readonly feedback: {
    readonly kind: "success" | "error";
    readonly message: string;
  } | null;
  readonly validation: CustomTermValidationViewModel | null;
  readonly persistenceWarning: string | null;
}

export interface CustomTermValidationViewModel {
  readonly message: string;
  readonly invalidFields: readonly CustomTermDraftField[];
  readonly focusField: CustomTermDraftField | null;
}

export interface SavedCustomProblemListItemViewModel {
  readonly id: CustomProblemId;
  readonly title: string;
  readonly concretePremises: readonly [string, string];
  readonly openLabel: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

export interface SavedCustomProblemManagerViewModel {
  readonly heading: string;
  readonly description: string;
  readonly mode: "create" | "edit";
  readonly titleLabel: string;
  readonly titlePlaceholder: string;
  readonly titleValue: string;
  readonly titleMaxLength: number;
  readonly submitLabel: string;
  readonly cancelLabel: string | null;
  readonly items: readonly SavedCustomProblemListItemViewModel[];
  readonly emptyListMessage: string | null;
  readonly feedback: {
    readonly kind: "success" | "error";
    readonly message: string;
  } | null;
  readonly persistenceWarning: string | null;
}

export interface DataBackupViewModel {
  readonly heading: string;
  readonly description: string;
  readonly exportHeading: string;
  readonly exportDescription: string;
  readonly exportButtonLabel: string;
  readonly importHeading: string;
  readonly importDescription: string;
  readonly fileInputLabel: string;
  readonly acceptedFileDescription: string;
  readonly accept: string;
  readonly importStatusMessage: string | null;
  readonly importStatusKind: "info" | "success" | "error" | null;
  readonly preview: {
    readonly heading: string;
    readonly selectedFileLabel: string;
    readonly fileName: string;
    readonly customTermCountLabel: string;
    readonly customTermCount: number;
    readonly savedProblemCountLabel: string;
    readonly savedProblemCount: number;
    readonly replaceWarning: string;
    readonly applyButtonLabel: string;
    readonly cancelButtonLabel: string;
  } | null;
  readonly exportStatusMessage: string | null;
}

export interface NavigationViewModel {
  readonly previousDisabled: boolean;
  readonly nextDisabled: boolean;
  readonly previousLabel: string;
  readonly resetLabel: string;
  readonly nextLabel: string;
  readonly controlsAriaLabel: string;
}

export interface DiagramViewModel {
  readonly kind: "triliteral" | "biliteral";
  readonly svg: string;
  readonly caption: string;
}

export interface CounterTargetViewModel {
  readonly key: string;
  readonly label: string;
  readonly leftPercent: number;
  readonly topPercent: number;
  readonly occupiedKind: CounterKind | null;
}

export interface CounterToolOptionViewModel {
  readonly value: CounterTool;
  readonly label: string;
  readonly selected: boolean;
}

export interface CounterPracticeViewModel {
  readonly instruction: string;
  readonly toolHeading: string;
  readonly tools: readonly CounterToolOptionViewModel[];
  readonly targets: readonly CounterTargetViewModel[];
  readonly checkButtonLabel: string;
  readonly clearButtonLabel: string;
  readonly clearButtonDisabled: boolean;
  readonly feedback: {
    readonly kind: "correct" | "incorrect";
    readonly message: string;
  } | null;
}

export interface ConclusionAnswerOptionViewModel {
  readonly value: ConclusionAnswerChoice;
  readonly label: string;
}

export interface ConclusionQuizViewModel {
  readonly heading: string;
  readonly instruction: string;
  readonly selectorLabel: string;
  readonly selectPlaceholder: string;
  readonly selectedAnswer: ConclusionAnswerChoice | null;
  readonly options: readonly ConclusionAnswerOptionViewModel[];
  readonly checkButtonLabel: string;
  readonly feedback: {
    readonly kind: "incomplete" | "incorrect" | "correct";
    readonly message: string;
  } | null;
}

export interface ProgressStepViewModel {
  readonly phase: GamePhase;
  readonly label: string;
}

export interface GameViewModel {
  readonly accessibility: {
    readonly skipToMain: string;
    readonly settingsHeading: string;
    readonly progressNavigationLabel: string;
    readonly mainRegionLabel: string;
  };
  readonly locale: Locale;
  readonly documentTitle: string;
  readonly title: string;
  readonly tutorialLink: {
    readonly href: "./tutorial.html";
    readonly label: string;
    readonly opensInNewTabLabel: string;
  };
  readonly phase: GamePhase;
  readonly phaseLabel: string;
  readonly instruction: string;
  readonly languageSelector: SelectorViewModel;
  readonly problemSourceSelector: SelectorViewModel;
  readonly problemSelector: SelectorViewModel;
  readonly assignmentModeSelector: SelectorViewModel;
  readonly counterPlacementModeSelector: SelectorViewModel;
  readonly conclusionAnswerModeSelector: SelectorViewModel;
  readonly customProblemEditor: CustomProblemEditorViewModel | null;
  readonly customTermManager: CustomTermManagerViewModel | null;
  readonly savedCustomProblemManager:
    SavedCustomProblemManagerViewModel | null;
  readonly dataBackup: DataBackupViewModel | null;
  readonly premiseHeading: string;
  readonly assignmentHeading: string;
  readonly abstractionHeading: string;
  readonly conclusionHeading: string;
  readonly premiseLabels: readonly [string, string];
  readonly concreteConclusionLabel: string;
  readonly abstractConclusionLabel: string;
  readonly progressAriaLabel: string;
  readonly progressSteps: readonly ProgressStepViewModel[];
  readonly concretePremises: readonly [string, string] | null;
  readonly termFallbackNotice: string | null;
  readonly termAssignment: readonly TermAssignmentItemViewModel[];
  readonly abstractPremises: readonly [string, string] | null;
  readonly assignmentPanel: TermAssignmentPanelViewModel;
  readonly concreteConclusion: string | null;
  readonly abstractConclusion: string | null;
  readonly noConclusionMessage: string | null;
  readonly diagram: DiagramViewModel;
  readonly counterPracticePanel: CounterPracticeViewModel | null;
  readonly conclusionQuiz: ConclusionQuizViewModel | null;
  readonly navigation: NavigationViewModel;
}

function emptyTriliteralPlacements(): TriliteralCounterPlacements {
  return { emptinessCounters: [], existenceCounters: [] };
}

function phaseText(phase: GamePhase, messages: UiMessages): {
  readonly label: string;
  readonly instruction: string;
} {
  switch (phase) {
    case "problem": return { label: messages.phases.problem, instruction: messages.instructions.problem };
    case "first-premise": return { label: messages.phases.firstPremise, instruction: messages.instructions.firstPremise };
    case "combined-premises": return { label: messages.phases.combinedPremises, instruction: messages.instructions.combinedPremises };
    case "conclusion": return { label: messages.phases.conclusion, instruction: messages.instructions.conclusion };
  }
}

function feedbackMessage(
  status: Exclude<CustomProblemStatus, "editing" | "ready">,
  messages: UiMessages,
): string {
  switch (status) {
    case "incomplete": return messages.customProblem.feedback.incomplete;
    case "same-term-within-major-premise": return messages.customProblem.feedback.sameTermWithinMajorPremise;
    case "same-term-within-minor-premise": return messages.customProblem.feedback.sameTermWithinMinorPremise;
    case "expected-three-distinct-terms": return messages.customProblem.feedback.expectedThreeDistinctTerms;
    case "expected-one-common-term": return messages.customProblem.feedback.expectedOneCommonTerm;
    case "could-not-determine-major-term": return messages.customProblem.feedback.couldNotDetermineMajorTerm;
    case "could-not-determine-minor-term": return messages.customProblem.feedback.couldNotDetermineMinorTerm;
  }
}

function createCustomEditor(
  state: AppState,
  messages: UiMessages,
  catalog: ReturnType<typeof createAvailableTermCatalog>,
): CustomProblemEditorViewModel {
  const termOptions = catalog.map((term) => {
    const custom = state.customTerms.find(({ id }) => id === term.id);
    const resolved = custom === undefined
      ? null
      : resolveCustomTermText(custom, state.locale);
    return {
      value: term.id,
      label: resolved?.isFallback
        ? `${resolved.displayName}${state.locale === "ja" ? "［" : " ["}${messages.customTerms.untranslatedOption}${state.locale === "ja" ? "］" : "]"}`
        : getTermDisplayName(term, state.locale),
    };
  });
  const formOptions = (["A", "E", "I", "O"] as const).map((form) => ({
    value: form,
    label: messages.customProblem.formOptions[form],
  }));
  const editor = (
    position: CustomPremisePosition,
    heading: string,
    premise: AppState["customProblemDraft"]["majorPremise"],
  ): CustomPremiseEditorViewModel => ({
    position,
    heading,
    formSelector: {
      label: messages.customProblem.formLabel,
      selectedValue: premise.form ?? "",
      placeholder: messages.customProblem.selectFormPlaceholder,
      options: formOptions,
    },
    subjectSelector: {
      label: messages.customProblem.subjectLabel,
      selectedValue: premise.subjectTermId ?? "",
      placeholder: messages.customProblem.selectTermPlaceholder,
      options: termOptions,
    },
    predicateSelector: {
      label: messages.customProblem.predicateLabel,
      selectedValue: premise.predicateTermId ?? "",
      placeholder: messages.customProblem.selectTermPlaceholder,
      options: termOptions,
    },
  });
  const feedback = state.customProblemStatus === "editing"
    ? null
    : state.customProblemStatus === "ready"
      ? { kind: "success" as const, message: messages.customProblem.readyMessage }
      : {
          kind: "error" as const,
          message: feedbackMessage(state.customProblemStatus, messages),
        };
  return {
    title: messages.customProblem.title,
    instruction: messages.customProblem.instruction,
    premises: [
      editor("major", messages.customProblem.majorPremiseHeading, state.customProblemDraft.majorPremise),
      editor("minor", messages.customProblem.minorPremiseHeading, state.customProblemDraft.minorPremise),
    ],
    createButtonLabel: messages.customProblem.createButton,
    clearButtonLabel: messages.customProblem.clearButton,
    feedback,
  };
}

function createCustomTermManager(
  state: AppState,
  messages: UiMessages,
): CustomTermManagerViewModel {
  const status = state.customTermEditor.status;
  const validationReason: CustomTermValidationFailureReason | null =
    status === "japanese-required" || status === "english-required" ||
      status === "incomplete-english" ||
      status === "at-least-one-language-required" ||
      status === "term-text-too-long" || status === "duplicate-term" ||
      status === "term-limit-reached"
      ? status : null;
  const validationMessage = validationReason === null ? null
    : validationReason === "japanese-required"
      ? messages.customTerms.feedback.japaneseRequired
      : validationReason === "english-required"
        ? messages.customTerms.feedback.englishRequired
        : validationReason === "incomplete-english"
          ? messages.customTerms.feedback.incompleteEnglish
          : validationReason === "at-least-one-language-required"
            ? messages.customTerms.feedback.atLeastOneLanguageRequired
            : validationReason === "term-text-too-long"
              ? messages.customTerms.feedback.termTextTooLong
              : validationReason === "duplicate-term"
                ? messages.customTerms.feedback.duplicateTerm
                : messages.customTerms.feedback.termLimitReached;
  const invalidFields: readonly CustomTermDraftField[] =
    validationReason === "japanese-required" ? ["jaNounPhrase"]
      : validationReason === "english-required"
        ? ["enSubjectPlural", "enPredicatePhrase"]
        : validationReason === "incomplete-english"
          ? [
              state.customTermEditor.draft.enSubjectPlural.trim() === ""
                ? "enSubjectPlural" as const : null,
              state.customTermEditor.draft.enPredicatePhrase.trim() === ""
                ? "enPredicatePhrase" as const : null,
            ].filter((field): field is "enSubjectPlural" | "enPredicatePhrase" =>
              field !== null)
          : validationReason === "term-text-too-long"
            ? (["jaNounPhrase", "enSubjectPlural", "enPredicatePhrase"] as const)
              .filter((field) => state.customTermEditor.draft[field].trim().length > 80)
            : [];
  const currentFirstField: CustomTermDraftField = state.locale === "ja"
    ? "jaNounPhrase" : "enSubjectPlural";
  const validation: CustomTermValidationViewModel | null =
    validationMessage === null ? null : {
      message: validationMessage,
      invalidFields,
      focusField: invalidFields[0] ?? (
        validationReason === "at-least-one-language-required" ||
          validationReason === "duplicate-term"
          ? currentFirstField : null
      ),
    };
  const feedback = status === "editing"
    ? null
    : {
        kind: (
          status === "created" ||
          status === "updated" ||
          status === "deleted"
        ) ? "success" as const : "error" as const,
        message: validationMessage ?? (
          status === "unknown-custom-term"
            ? messages.customTerms.feedback.unknownCustomTerm
            : status === "term-in-use-by-saved-problem"
              ? messages.customTerms.feedback.termInUseBySavedProblem
              : status === "created"
                ? messages.customTerms.feedback.created
                : status === "updated"
                  ? messages.customTerms.feedback.updated
                  : messages.customTerms.feedback.deleted
        ),
      };
  return {
    heading: messages.customTerms.heading,
    description: messages.customTerms.description,
    mode: state.customTermEditor.mode,
    fields: messages.customTerms.fields,
    draft: state.customTermEditor.draft,
    groups: state.locale === "ja"
      ? [{ locale: "ja", heading: messages.customTerms.currentLanguage,
          optional: false, helpText: null },
        { locale: "en", heading: messages.customTerms.otherLanguage,
          optional: true, helpText: `${messages.customTerms.englishOptional} ${messages.customTerms.fallbackExplanation} ${messages.customTerms.noAutomationExplanation}` }]
      : [{ locale: "en", heading: messages.customTerms.currentLanguage,
          optional: false, helpText: null },
        { locale: "ja", heading: messages.customTerms.otherLanguage,
          optional: true, helpText: `${messages.customTerms.japaneseOptional} ${messages.customTerms.fallbackExplanation} ${messages.customTerms.noAutomationExplanation}` }],
    requiredLabel: messages.customTerms.required,
    optionalLabel: messages.customTerms.optional,
    submitLabel: state.customTermEditor.mode === "create"
      ? messages.customTerms.actions.create
      : messages.customTerms.actions.update,
    cancelLabel: state.customTermEditor.mode === "edit"
      ? messages.customTerms.actions.cancelEdit
      : null,
    items: state.customTerms.map((term) => {
      const resolved = resolveCustomTermText(term, state.locale);
      return {
      id: term.id,
      displayName: resolved.displayName,
      jaNounPhrase: term.labels.ja?.nounPhrase ?? "",
      enSubjectPlural: term.labels.en?.subjectPlural ?? "",
      enPredicatePhrase: term.labels.en?.predicatePhrase ?? "",
      sourceLocale: resolved.sourceLocale,
      isFallback: resolved.isFallback,
      fallbackLabel: resolved.isFallback
        ? `${state.locale === "ja" ? messages.customTerms.japaneseMissing : messages.customTerms.englishMissing} — ${resolved.sourceLocale === "ja" ? messages.customTerms.showingJapanese : messages.customTerms.showingEnglish}`
        : null,
      editLabel: messages.customTerms.actions.edit,
      deleteLabel: messages.customTerms.actions.delete,
    };}),
    emptyListMessage: state.customTerms.length === 0
      ? messages.customTerms.emptyList
      : null,
    feedback,
    validation,
    persistenceWarning:
      state.customTermPersistenceStatus === "load-error"
        ? messages.customTerms.persistence.loadError
        : state.customTermPersistenceStatus === "save-error"
          ? messages.customTerms.persistence.saveError
          : null,
  };
}

function savedProblemFeedback(
  status: Exclude<SavedCustomProblemEditorStatus, "editing">,
  messages: UiMessages,
): string {
  switch (status) {
    case "incomplete-title":
      return messages.savedCustomProblems.feedback.incompleteTitle;
    case "title-too-long":
      return messages.savedCustomProblems.feedback.titleTooLong;
    case "duplicate-title":
      return messages.savedCustomProblems.feedback.duplicateTitle;
    case "problem-not-ready":
      return messages.savedCustomProblems.feedback.problemNotReady;
    case "problem-limit-reached":
      return messages.savedCustomProblems.feedback.problemLimitReached;
    case "created":
    case "updated":
    case "deleted":
      return messages.savedCustomProblems.feedback[status];
  }
}

function createSavedCustomProblemManager(
  state: AppState,
  messages: UiMessages,
  resolveTerm: (termId: TermId) => ReturnType<typeof resolveAvailableTerm>,
): SavedCustomProblemManagerViewModel {
  const editor = state.savedCustomProblemEditor;
  const status = editor.status;
  return {
    heading: messages.savedCustomProblems.heading,
    description: messages.savedCustomProblems.description,
    mode: editor.mode,
    titleLabel: messages.savedCustomProblems.titleLabel,
    titlePlaceholder: messages.savedCustomProblems.titlePlaceholder,
    titleValue: editor.draft.title,
    titleMaxLength: SAVED_CUSTOM_PROBLEM_TITLE_MAX_LENGTH,
    submitLabel: editor.mode === "create"
      ? messages.savedCustomProblems.actions.create
      : messages.savedCustomProblems.actions.update,
    cancelLabel: editor.mode === "edit"
      ? messages.savedCustomProblems.actions.cancelEdit
      : null,
    items: state.savedCustomProblems.map((problem) => ({
      id: problem.id,
      title: problem.title,
      concretePremises: [
        formatConcreteProposition(
          problem.premises.firstPremise,
          state.locale,
          resolveTerm,
        ),
        formatConcreteProposition(
          problem.premises.secondPremise,
          state.locale,
          resolveTerm,
        ),
      ],
      openLabel: messages.savedCustomProblems.actions.open,
      editLabel: messages.savedCustomProblems.actions.edit,
      deleteLabel: messages.savedCustomProblems.actions.delete,
    })),
    emptyListMessage: state.savedCustomProblems.length === 0
      ? messages.savedCustomProblems.emptyList
      : null,
    feedback: status === "editing"
      ? null
      : {
          kind: (
              status === "created" ||
              status === "updated" ||
              status === "deleted"
            )
            ? "success"
            : "error",
          message: savedProblemFeedback(status, messages),
        },
    persistenceWarning:
      state.savedCustomProblemPersistenceStatus === "load-error"
        ? messages.savedCustomProblems.persistence.loadError
        : state.savedCustomProblemPersistenceStatus === "save-error"
          ? messages.savedCustomProblems.persistence.saveError
          : null,
  };
}

function createDataBackupViewModel(
  state: AppState,
  messages: UiMessages,
): DataBackupViewModel {
  const feedback = messages.dataBackup.importFeedback;
  const statusMessages: Partial<Record<AppState["dataImport"]["status"], string>> = {
    reading: feedback.reading,
    "file-too-large": feedback.fileTooLarge,
    "read-error": feedback.readError,
    "invalid-json": feedback.invalidJson,
    "unsupported-format": feedback.unsupportedFormat,
    "unsupported-version": feedback.unsupportedVersion,
    "invalid-data": feedback.invalidData,
    "invalid-term-catalog": feedback.invalidTermCatalog,
    "invalid-problem-catalog": feedback.invalidProblemCatalog,
    applied: feedback.applied,
    "applied-with-save-error": feedback.appliedWithSaveError,
  };
  const status = state.dataImport.status;
  const pending = state.dataImport.pending;
  return {
    heading: messages.dataBackup.heading,
    description: messages.dataBackup.description,
    exportHeading: messages.dataBackup.exportHeading,
    exportDescription: messages.dataBackup.exportDescription,
    exportButtonLabel: messages.dataBackup.exportAction,
    importHeading: messages.dataBackup.importHeading,
    importDescription: messages.dataBackup.importDescription,
    fileInputLabel: messages.dataBackup.importFileLabel,
    acceptedFileDescription: messages.dataBackup.acceptedFileDescription,
    accept: "application/json,.json",
    importStatusMessage: statusMessages[status] ?? null,
    importStatusKind: status === "reading"
      ? "info"
      : status === "applied"
        ? "success"
        : status === "idle" || status === "ready"
          ? null
          : "error",
    preview: status === "ready" && pending !== null
      ? {
          heading: messages.dataBackup.previewHeading,
          selectedFileLabel: messages.dataBackup.selectedFileLabel,
          fileName: pending.fileName,
          customTermCountLabel: messages.dataBackup.customTermCountLabel,
          customTermCount: pending.customTermCount,
          savedProblemCountLabel: messages.dataBackup.savedProblemCountLabel,
          savedProblemCount: pending.savedCustomProblemCount,
          replaceWarning: messages.dataBackup.replaceWarning,
          applyButtonLabel: messages.dataBackup.actions.applyImport,
          cancelButtonLabel: messages.dataBackup.actions.cancelImport,
        }
      : null,
    exportStatusMessage: state.dataExportStatus === "exported"
      ? messages.dataBackup.exportFeedback.success
      : state.dataExportStatus === "export-error"
        ? messages.dataBackup.exportFeedback.error
        : null,
  };
}

function navigation(
  state: AppState,
  messages: UiMessages,
  ready: boolean,
): NavigationViewModel {
  const shared = {
    previousLabel: messages.navigation.previous,
    resetLabel: messages.navigation.reset,
    controlsAriaLabel: messages.controlsAriaLabel,
  };
  switch (state.phase) {
    case "problem":
      return {
        ...shared,
        previousDisabled: true,
        nextDisabled:
          !ready ||
          (state.assignmentMode === "quiz" && state.quizStatus !== "correct"),
        nextLabel: messages.navigation.nextFirstPremise,
      };
    case "first-premise":
      return {
        ...shared,
        previousDisabled: false,
        nextDisabled:
          state.counterPractice.mode === "manual" &&
          state.counterPractice.firstPremise.check.kind !== "correct",
        nextLabel: messages.navigation.nextCombinedPremises,
      };
    case "combined-premises":
      return {
        ...shared,
        previousDisabled: false,
        nextDisabled:
          state.counterPractice.mode === "manual" &&
          state.counterPractice.combinedPremises.check.kind !== "correct",
        nextLabel: messages.navigation.nextConclusion,
      };
    case "conclusion":
      return { ...shared, previousDisabled: false, nextDisabled: true, nextLabel: messages.navigation.completed };
  }
}

function occupiedKind<A>(
  placements: readonly { readonly kind: CounterKind; readonly anchor: A }[],
  anchor: A,
  key: (anchor: A) => string,
): CounterKind | null {
  return placements.find((placement) => key(placement.anchor) === key(anchor))
    ?.kind ?? null;
}

function triKey(anchor: TriliteralCounterAnchor): string {
  if (anchor.type === "cell") return `cell:${anchor.cell}`;
  return `boundary:${anchor.partitionRole}:${[...anchor.cells].sort().join(":")}`;
}

function biKey(anchor: BiliteralCounterAnchor): string {
  if (anchor.type === "cell") return `cell:${anchor.cell}`;
  return `boundary:${anchor.partitionRole}:${[...anchor.cells].sort().join(":")}`;
}

function targetLabel(
  locale: Locale,
  messages: UiMessages,
  anchor: TriliteralCounterAnchor | BiliteralCounterAnchor,
  kind: CounterKind | null,
): string {
  const occupied = kind === null
    ? messages.counterPractice.targets.unoccupied
    : kind === "emptiness"
      ? messages.counterPractice.targets.occupiedEmptiness
      : messages.counterPractice.targets.occupiedExistence;
  if (anchor.type === "cell") {
    return locale === "ja"
      ? `${messages.counterPractice.targets.cell} ${anchor.cell}。${occupied}。`
      : `${messages.counterPractice.targets.cell} ${anchor.cell}. ${occupied}.`;
  }
  return locale === "ja"
    ? `${anchor.cells[0]}と${anchor.cells[1]}の間の${anchor.partitionRole}${messages.counterPractice.targets.boundaryBetween}。${occupied}。`
    : `${anchor.partitionRole} ${messages.counterPractice.targets.boundaryBetween} ${anchor.cells[0]} and ${anchor.cells[1]}. ${occupied}.`;
}

function counterFeedback(
  check: CounterAttemptCheckState,
  messages: UiMessages,
): CounterPracticeViewModel["feedback"] {
  if (check.kind === "not-checked") return null;
  if (check.kind === "correct") {
    return { kind: "correct", message: messages.counterPractice.feedback.correct };
  }
  const { missingCount, extraCount, wrongKindCount } = check.summary;
  return {
    kind: "incorrect",
    message:
      `${messages.counterPractice.feedback.incorrect} ${messages.counterPractice.feedback.missing}: ${missingCount}, ${messages.counterPractice.feedback.extra}: ${extraCount}, ${messages.counterPractice.feedback.wrongKind}: ${wrongKindCount}.`,
  };
}

function counterPanel(
  state: AppState,
  messages: UiMessages,
): CounterPracticeViewModel | null {
  if (
    state.counterPractice.mode !== "manual" ||
    state.phase === "problem" ||
    (
      state.phase === "conclusion" &&
      state.conclusionQuiz.mode === "quiz" &&
      state.conclusionQuiz.check.kind !== "correct"
    )
  ) {
    return null;
  }
  const tools = (["emptiness", "existence", "erase"] as const).map(
    (value) => ({
      value,
      label: messages.counterPractice.tools[value],
      selected: state.counterPractice.selectedTool === value,
    }),
  );
  const targets = state.phase === "conclusion"
    ? createBiliteralCounterTargets().map((target) => {
        const kind = occupiedKind(
          state.counterPractice.conclusion.placements,
          target.anchor,
          biKey,
        );
        return {
          key: target.key,
          label: targetLabel(state.locale, messages, target.anchor, kind),
          leftPercent: target.position.x / 4,
          topPercent: target.position.y / 4,
          occupiedKind: kind,
        };
      })
    : createTriliteralCounterTargets().map((target) => {
        const placements = state.phase === "first-premise"
          ? state.counterPractice.firstPremise.placements
          : state.counterPractice.combinedPremises.placements;
        const kind = occupiedKind(placements, target.anchor, triKey);
        return {
          key: target.key,
          label: targetLabel(state.locale, messages, target.anchor, kind),
          leftPercent: target.position.x / 4,
          topPercent: target.position.y / 4,
          occupiedKind: kind,
        };
      });
  const instruction = state.phase === "first-premise"
    ? messages.counterPractice.instructions.firstPremise
    : state.phase === "combined-premises"
      ? messages.counterPractice.instructions.combinedPremises
      : messages.counterPractice.instructions.conclusion;
  const check = state.phase === "first-premise"
    ? state.counterPractice.firstPremise.check
    : state.phase === "combined-premises"
      ? state.counterPractice.combinedPremises.check
      : state.counterPractice.conclusion.check;
  const placementCount = state.phase === "first-premise"
    ? state.counterPractice.firstPremise.placements.length
    : state.phase === "combined-premises"
      ? state.counterPractice.combinedPremises.placements.length
      : state.counterPractice.conclusion.placements.length;
  return {
    instruction,
    toolHeading: messages.counterPractice.toolsHeading,
    tools,
    targets,
    checkButtonLabel: messages.counterPractice.actions.check,
    clearButtonLabel: messages.counterPractice.actions.clear,
    clearButtonDisabled: placementCount === 0,
    feedback: counterFeedback(check, messages),
  };
}

function conclusionQuizViewModel(
  state: AppState,
  messages: UiMessages,
  computation: ProblemComputation | null,
  resolveTerm: (termId: TermId) => ReturnType<typeof resolveAvailableTerm>,
): ConclusionQuizViewModel | null {
  if (
    state.conclusionQuiz.mode !== "quiz" ||
    state.phase !== "conclusion" ||
    computation === null
  ) return null;
  const forms = ["A", "E", "I", "O"] as const;
  const options: readonly ConclusionAnswerOptionViewModel[] = [
    ...forms.map((form) => ({
      value: form,
      label: `${messages.conclusionQuiz.options[form]} — ${
        formatConcreteProposition(
          createConcreteConclusion(form, computation.assignment),
          state.locale,
          resolveTerm,
        )
      }`,
    })),
    { value: "none", label: messages.conclusionQuiz.options.none },
  ];
  const check = state.conclusionQuiz.check;
  return {
    heading: messages.conclusionQuiz.heading,
    instruction: messages.conclusionQuiz.instruction,
    selectorLabel: messages.conclusionQuiz.selectorLabel,
    selectPlaceholder: messages.conclusionQuiz.selectPlaceholder,
    selectedAnswer: state.conclusionQuiz.selectedAnswer,
    options,
    checkButtonLabel: messages.conclusionQuiz.checkButton,
    feedback: check.kind === "not-checked"
      ? null
      : {
          kind: check.kind,
          message: messages.conclusionQuiz.feedback[check.kind],
        },
  };
}

function assignmentPanel(
  state: AppState,
  messages: UiMessages,
  premises: ConcreteSyllogism | null,
  computation: ProblemComputation | null,
  items: readonly TermAssignmentItemViewModel[],
  abstractPremises: readonly [string, string] | null,
  resolveTerm: (termId: TermId) => ReturnType<typeof resolveAvailableTerm>,
): TermAssignmentPanelViewModel {
  if (
    premises === null ||
    computation === null ||
    abstractPremises === null
  ) return { kind: "unavailable" };
  if (state.assignmentMode !== "quiz" || state.phase !== "problem") {
    return { kind: "resolved", items, abstractPremises };
  }
  const feedback = state.quizStatus === "not-submitted"
    ? null
    : {
        kind: state.quizStatus,
        message: state.quizStatus === "duplicate-term"
          ? messages.assignmentQuiz.feedback.duplicateTerm
          : messages.assignmentQuiz.feedback[state.quizStatus],
      };
  const options = getProblemTermIds(premises).map((termId) => {
    const custom = state.customTerms.find(({ id }) => id === termId);
    const resolved = custom === undefined ? null : resolveCustomTermText(custom, state.locale);
    return {
      value: termId,
      label: resolved?.isFallback
        ? `${resolved.displayName}${state.locale === "ja" ? "［" : " ["}${messages.customTerms.untranslatedOption}${state.locale === "ja" ? "］" : "]"}`
        : getTermDisplayName(resolveTerm(termId), state.locale),
    };
  });
  const correct = state.quizStatus === "correct";
  return {
    kind: "quiz",
    instruction: messages.assignmentQuiz.instruction,
    roleSelectors: (["S", "M", "P"] as const).map((role) => ({
      role,
      label: role,
      selectedTermId: state.quizSelection[role],
      placeholder: messages.assignmentQuiz.selectPlaceholder,
      options,
    })),
    checkButtonLabel: messages.assignmentQuiz.checkButton,
    checkButtonDisabled: false,
    feedback,
    resolvedItems: correct ? items : null,
    abstractPremises: correct ? abstractPremises : null,
  };
}

export function createGameViewModel(state: AppState): GameViewModel {
  const messages = getUiMessages(state.locale);
  const catalog = createAvailableTermCatalog(state.customTerms);
  const resolveTerm = (termId: TermId) =>
    resolveAvailableTerm(termId, state.customTerms);
  const text = phaseText(state.phase, messages);
  const builtIn = getBuiltInProblem(state.problemId);
  const premises = state.problemSource === "built-in"
    ? builtIn.premises
    : state.customProblemStatus === "ready"
      ? state.customPremises
      : null;
  const computation = premises === null
    ? null
    : computeProblem({
        id: state.problemSource === "built-in" ? builtIn.id : "custom",
        premises,
      });
  const concretePremises = premises === null ? null : [
    formatConcreteProposition(premises.firstPremise, state.locale, resolveTerm),
    formatConcreteProposition(premises.secondPremise, state.locale, resolveTerm),
  ] as const;
  const termAssignment = computation === null ? [] : (["S", "M", "P"] as const)
    .map((role) => ({
      role,
      label: getTermDisplayName(
        resolveTerm(computation.assignment[role]),
        state.locale,
      ),
    }));
  const abstractPremises = computation === null ? null : [
    formatAbstractProposition(computation.abstractPremises.firstPremise, state.locale),
    formatAbstractProposition(computation.abstractPremises.secondPremise, state.locale),
  ] as const;
  const ready = premises !== null && computation !== null;
  const panel = assignmentPanel(
    state,
    messages,
    premises,
    computation,
    termAssignment,
    abstractPremises,
    resolveTerm,
  );
  const manual = state.counterPractice.mode === "manual";
  const conclusionDisclosed =
    state.conclusionQuiz.mode === "automatic" ||
    state.conclusionQuiz.check.kind === "correct";
  const diagram = state.phase === "problem" || computation === null
    ? {
        kind: "triliteral" as const,
        svg: renderTriliteralDiagramSvg(emptyTriliteralPlacements(), {
          accessibleLabel: messages.diagrams.problemAccessibleLabel,
          description: messages.diagrams.problemDescription,
        }),
        caption: messages.diagrams.problemCaption,
      }
    : state.phase === "first-premise"
      ? {
          kind: "triliteral" as const,
          svg: renderTriliteralDiagramSvg(manual
            ? createTriliteralAttemptPlacements(
                state.counterPractice.firstPremise.placements,
              )
            : computation.firstPremisePlacements, {
            accessibleLabel: messages.diagrams.firstPremiseAccessibleLabel,
            description: messages.diagrams.firstPremiseDescription,
          }),
          caption: messages.diagrams.firstPremiseCaption,
        }
      : state.phase === "combined-premises"
        ? {
            kind: "triliteral" as const,
            svg: renderTriliteralDiagramSvg(manual
              ? createTriliteralAttemptPlacements(
                  state.counterPractice.combinedPremises.placements,
                )
              : computation.combinedPlacements, {
              accessibleLabel: messages.diagrams.combinedPremisesAccessibleLabel,
              description: messages.diagrams.combinedPremisesDescription,
            }),
            caption: messages.diagrams.combinedPremisesCaption,
          }
        : !conclusionDisclosed
          ? {
              kind: "biliteral" as const,
              svg: renderBiliteralDiagramSvg({
                emptinessCounters: [],
                existenceCounters: [],
              }, {
                accessibleLabel:
                  messages.conclusionQuiz.lockedDiagramAccessibleLabel,
                description:
                  messages.conclusionQuiz.lockedDiagramDescription,
              }),
              caption: messages.conclusionQuiz.lockedDiagramCaption,
            }
          : {
            kind: "biliteral" as const,
            svg: renderBiliteralDiagramSvg(manual
              ? createBiliteralAttemptPlacements(
                  state.counterPractice.conclusion.placements,
                )
              : computation.conclusionPlacements, {
              accessibleLabel: messages.diagrams.conclusionAccessibleLabel,
              description: messages.diagrams.conclusionDescription,
            }),
            caption: messages.diagrams.conclusionCaption,
          };
  const concreteConclusion = !conclusionDisclosed ||
    computation?.concreteConclusion === null ||
    computation === null
    ? null
    : formatConcreteProposition(
        computation.concreteConclusion,
        state.locale,
        resolveTerm,
      );
  const abstractConclusion = !conclusionDisclosed ||
    computation?.abstractConclusion === null ||
    computation === null
    ? null
    : formatAbstractProposition(computation.abstractConclusion, state.locale);

  return {
    accessibility: messages.accessibility,
    locale: state.locale,
    documentTitle: messages.documentTitle,
    title: messages.appTitle,
    tutorialLink: {
      href: "./tutorial.html",
      label: messages.tutorialLink.label,
      opensInNewTabLabel: messages.tutorialLink.opensInNewTabLabel,
    },
    phase: state.phase,
    phaseLabel: text.label,
    instruction: text.instruction,
    languageSelector: {
      label: messages.languageSelectorLabel,
      selectedValue: state.locale,
      options: [
        { value: "ja", label: "日本語" },
        { value: "en", label: "English" },
      ],
    },
    problemSourceSelector: {
      label: messages.problemSource.selectorLabel,
      selectedValue: state.problemSource,
      options: [
        { value: "built-in", label: messages.problemSource.builtIn },
        { value: "custom", label: messages.problemSource.custom },
      ],
    },
    problemSelector: {
      label: messages.problemSelectorLabel,
      selectedValue: state.problemId,
      options: BUILT_IN_PROBLEMS.map(({ id, title }) => ({
        value: id,
        label: title[state.locale],
      })),
    },
    assignmentModeSelector: {
      label: messages.assignmentMode.selectorLabel,
      selectedValue: state.assignmentMode,
      options: [
        { value: "automatic", label: messages.assignmentMode.automatic },
        { value: "quiz", label: messages.assignmentMode.quiz },
      ],
    },
    counterPlacementModeSelector: {
      label: messages.counterPractice.modeSelectorLabel,
      selectedValue: state.counterPractice.mode,
      options: [
        {
          value: "automatic",
          label: messages.counterPractice.modes.automatic,
        },
        { value: "manual", label: messages.counterPractice.modes.manual },
      ],
    },
    conclusionAnswerModeSelector: {
      label: messages.conclusionQuiz.modeSelectorLabel,
      selectedValue: state.conclusionQuiz.mode,
      options: [
        {
          value: "automatic",
          label: messages.conclusionQuiz.modes.automatic,
        },
        { value: "quiz", label: messages.conclusionQuiz.modes.quiz },
      ],
    },
    customProblemEditor:
      state.problemSource === "custom" && state.phase === "problem"
        ? createCustomEditor(state, messages, catalog)
        : null,
    customTermManager:
      state.problemSource === "custom" && state.phase === "problem"
        ? createCustomTermManager(state, messages)
        : null,
    savedCustomProblemManager:
      state.problemSource === "custom" && state.phase === "problem"
        ? createSavedCustomProblemManager(state, messages, resolveTerm)
        : null,
    dataBackup: state.phase === "problem"
      ? createDataBackupViewModel(state, messages)
      : null,
    premiseHeading: messages.premiseHeading,
    assignmentHeading: messages.assignmentHeading,
    abstractionHeading: messages.abstractionHeading,
    conclusionHeading: messages.conclusionHeading,
    premiseLabels: [messages.firstPremiseLabel, messages.secondPremiseLabel],
    concreteConclusionLabel: messages.concreteConclusionLabel,
    abstractConclusionLabel: messages.abstractConclusionLabel,
    progressAriaLabel: messages.progressAriaLabel,
    progressSteps: [
      { phase: "problem", label: messages.phases.problem },
      { phase: "first-premise", label: messages.phases.firstPremise },
      { phase: "combined-premises", label: messages.phases.combinedPremises },
      { phase: "conclusion", label: messages.phases.conclusion },
    ],
    concretePremises,
    termFallbackNotice: premises !== null && getProblemTermIds(premises).some(
      (id) => {
        const custom = state.customTerms.find((term) => term.id === id);
        return custom !== undefined && resolveCustomTermText(custom, state.locale).isFallback;
      },
    ) ? messages.customTerms.problemFallbackNotice : null,
    termAssignment,
    abstractPremises,
    assignmentPanel: panel,
    concreteConclusion,
    abstractConclusion,
    noConclusionMessage:
      conclusionDisclosed &&
        computation !== null &&
        computation.concreteConclusion === null
        ? messages.noConclusion
        : null,
    diagram,
    counterPracticePanel: counterPanel(state, messages),
    conclusionQuiz: conclusionQuizViewModel(
      state,
      messages,
      computation,
      resolveTerm,
    ),
    navigation: navigation(state, messages, ready),
  };
}

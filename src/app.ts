import { renderGameView } from "./app/domRenderer";
import {
  createInitialAppState,
  reduceAppState,
  type AppAction,
} from "./app/state";
import { createGameViewModel } from "./app/viewModel";
import { getBuiltInProblem } from "./data/problems";
import { computeProblem } from "./app/problemComputation";
import { validateCustomProblemDraft } from "./app/customProblem";
import { BUILT_IN_TERMS } from "./data/terms";
import {
  createCustomTerm,
  updateCustomTerm,
} from "./app/customTerms";
import {
  loadCustomTerms,
  saveCustomTerms,
} from "./storage/customTermStorage";
import type { StringStorage } from "./storage/stringStorage";
import {
  findBiliteralCounterTarget,
  findTriliteralCounterTarget,
  createUserTriliteralCounterPlacements,
  validateBiliteralCounterAttempt,
  validateTriliteralCounterAttempt,
} from "./app/counterPractice";
import {
  deriveConclusionQuizQuestions,
  validateConclusionQuizAnswers,
} from "./app/conclusionQuiz";
import {
  createSavedCustomProblem,
  findSavedCustomProblemsUsingTerm,
  updateSavedCustomProblem,
  validateSavedCustomProblemCatalog,
} from "./app/savedCustomProblems";
import {
  loadSavedCustomProblems,
  saveSavedCustomProblems,
} from "./storage/customProblemStorage";
import {
  DATA_BACKUP_MAX_FILE_BYTES,
  DATA_BACKUP_MIME_TYPE,
  createDataBackupFilename,
  createDataBackupJson,
} from "./storage/dataBackupFormat";
import { replaceBackupStorage } from "./storage/dataBackupStorage";
import { prepareDataImport, validateImportedData } from "./app/dataBackup";
import {
  createBrowserTextFileTransfer,
  type TextFileTransfer,
} from "./app/browserFileTransfer";
import {
  captureFocus,
  focusPhaseHeading,
  restoreFocus,
  restoreFocusByKey,
} from "./app/focusManagement";

export function mountApp(
  container: HTMLElement,
  storage?: StringStorage | null,
  fileTransfer: TextFileTransfer = createBrowserTextFileTransfer(),
): void {
  let availableStorage: StringStorage | null = storage ?? null;
  if (storage === undefined) {
    try {
      availableStorage = window.localStorage;
    } catch {
      availableStorage = null;
    }
  }
  const loaded = availableStorage === null
    ? { ok: false as const, reason: "storage-unavailable" as const }
    : loadCustomTerms(availableStorage);
  const loadedProblems = availableStorage === null
    ? { ok: false as const, reason: "storage-unavailable" as const }
    : loadSavedCustomProblems(availableStorage);
  const loadedTerms = loaded.ok ? loaded.terms : [];
  const problemCatalogValidation = loadedProblems.ok
    ? validateSavedCustomProblemCatalog(
        loadedProblems.problems,
        loadedTerms,
      )
    : { ok: false as const, reason: "invalid-premises" as const };
  const savedProblemsReady =
    loadedProblems.ok && problemCatalogValidation.ok;
  let state = createInitialAppState({
    customTerms: loadedTerms,
    customTermPersistenceStatus: loaded.ok ? "ready" : "load-error",
    savedCustomProblems: savedProblemsReady ? loadedProblems.problems : [],
    savedCustomProblemPersistenceStatus:
      savedProblemsReady ? "ready" : "load-error",
  });
  let importRequestId = 0;

  const render = (): void => {
    const currentComputation = () => {
      const premises = state.problemSource === "built-in"
        ? getBuiltInProblem(state.problemId).premises
        : state.customPremises;
      if (premises === null) {
        throw new Error("Cannot compute counters before creating a problem.");
      }
      return computeProblem({
        id: state.problemSource === "built-in" ? state.problemId : "custom",
        premises,
      });
    };
    const dispatch = (action: AppAction): void => {
      const focus = captureFocus(container);
      const previousPhase = state.phase;
      state = reduceAppState(state, action);
      const shouldSave =
        (
          action.type === "submit-custom-term" &&
          action.result.ok
        ) ||
        action.type === "delete-custom-term";
      if (shouldSave) {
        const saved = availableStorage === null
          ? { ok: false as const, reason: "storage-unavailable" as const }
          : saveCustomTerms(availableStorage, state.customTerms);
        state = reduceAppState(state, {
          type: "set-custom-term-persistence-status",
          status: saved.ok ? "ready" : "save-error",
        });
      }
      const shouldSaveProblems =
        (
          action.type === "submit-saved-custom-problem" &&
          action.result.ok
        ) ||
        action.type === "delete-saved-custom-problem";
      if (shouldSaveProblems) {
        const saved = availableStorage === null
          ? { ok: false as const, reason: "storage-unavailable" as const }
          : saveSavedCustomProblems(
              availableStorage,
              state.savedCustomProblems,
            );
        state = reduceAppState(state, {
          type: "set-saved-custom-problem-persistence-status",
          status: saved.ok ? "ready" : "save-error",
        });
      }
      render();
      const changesContext = previousPhase !== state.phase || [
        "next",
        "previous",
        "reset",
        "select-problem",
        "set-problem-source",
        "open-saved-custom-problem",
        "start-edit-saved-custom-problem",
        "apply-pending-data-import",
      ].includes(action.type);
      if (action.type === "open-custom-term-management") {
        container.querySelector<HTMLElement>(
          '[data-screen-heading="custom-term-management"]',
        )?.focus({ preventScroll: true });
      } else if (action.type === "close-custom-term-management") {
        restoreFocusByKey(container, "open-custom-term-management");
      } else if (action.type === "start-edit-custom-term") {
        restoreFocusByKey(
          container,
          `custom-term-input:${state.locale === "ja" ? "jaNounPhrase" : "enSubjectPlural"}`,
        );
      } else if (changesContext) {
        focusPhaseHeading(container);
      } else if (action.type === "submit-custom-term" && !action.result.ok) {
        const field = createGameViewModel(state).customTermManager
          ?.validation?.focusField;
        if (field !== undefined && field !== null) {
          restoreFocusByKey(container, `custom-term-input:${field}`);
        }
      } else if (action.type === "cancel-data-import") {
        restoreFocusByKey(container, "import-data-backup-file");
      } else if (focus !== null && !restoreFocus(container, focus)) {
        focusPhaseHeading(container);
      }
    };

    renderGameView(container, createGameViewModel(state), {
      onCustomTermManagementOpen: () =>
        dispatch({ type: "open-custom-term-management" }),
      onCustomTermManagementClose: () =>
        dispatch({ type: "close-custom-term-management" }),
      onPrevious: () => dispatch({ type: "previous" }),
      onNext: () => {
        if (
          state.counterPractice.mode === "manual" &&
          state.phase === "first-premise" &&
          state.counterPractice.firstPremise.check.kind === "correct"
        ) {
          dispatch({
            type: "next",
            firstPremisePlacements: createUserTriliteralCounterPlacements(
              currentComputation().firstPremisePlacements,
            ),
          });
          return;
        }
        dispatch({ type: "next" });
      },
      onReset: () => dispatch({ type: "reset" }),
      onProblemChange: (problemId) =>
        dispatch({ type: "select-problem", problemId }),
      onProblemSourceChange: (source) =>
        dispatch({ type: "set-problem-source", source }),
      onLocaleChange: (locale) =>
        dispatch({ type: "set-locale", locale }),
      onCounterPlacementModeChange: (mode) =>
        dispatch({ type: "set-counter-placement-mode", mode }),
      onConclusionAnswerModeChange: (mode) =>
        dispatch({ type: "set-conclusion-answer-mode", mode }),
      onConclusionAnswerChange: (questionIndex, answer) =>
        dispatch({
          type: "select-conclusion-answer",
          questionIndex,
          answer,
        }),
      onConclusionAnswerSubmit: () => {
        const computation = currentComputation();
        dispatch({
          type: "submit-conclusion-answer",
          validation: validateConclusionQuizAnswers(
            state.conclusionQuiz.answers,
            deriveConclusionQuizQuestions(computation.conclusionPresentation),
          ),
        });
      },
      onCounterToolChange: (tool) =>
        dispatch({ type: "set-counter-tool", tool }),
      onCounterTargetActivate: (targetKey) => {
        if (
          state.counterPractice.mode !== "manual" ||
          state.phase === "problem"
        ) {
          throw new Error("Counter target activated outside manual practice.");
        }
        if (state.phase === "conclusion") {
          dispatch({
            type: "apply-biliteral-counter-tool",
            phase: "conclusion",
            anchor: findBiliteralCounterTarget(targetKey).anchor,
          });
          return;
        }
        dispatch({
          type: "apply-triliteral-counter-tool",
          phase: state.phase,
          anchor: findTriliteralCounterTarget(targetKey).anchor,
        });
      },
      onCounterAttemptCheck: () => {
        const computation = currentComputation();
        if (state.phase === "first-premise") {
          dispatch({
            type: "submit-counter-attempt",
            phase: state.phase,
            validation: validateTriliteralCounterAttempt(
              state.counterPractice.firstPremise.placements,
              computation.firstPremisePlacements,
            ),
          });
        } else if (state.phase === "combined-premises") {
          dispatch({
            type: "submit-counter-attempt",
            phase: state.phase,
            validation: validateTriliteralCounterAttempt(
              state.counterPractice.combinedPremises.placements,
              computation.combinedPlacements,
            ),
          });
        } else if (state.phase === "conclusion") {
          dispatch({
            type: "submit-counter-attempt",
            phase: state.phase,
            validation: validateBiliteralCounterAttempt(
              state.counterPractice.conclusion.placements,
              computation.conclusionPlacements,
            ),
          });
        } else {
          throw new Error("Counter attempt checked during the problem phase.");
        }
      },
      onCounterAttemptClear: () => {
        if (state.phase === "problem") {
          throw new Error("Counter attempt cleared during the problem phase.");
        }
        dispatch({ type: "clear-counter-attempt", phase: state.phase });
      },
      onCustomPremiseFormChange: (position, form) =>
        dispatch({ type: "update-custom-premise-form", position, form }),
      onCustomPremiseTermChange: (position, field, termId) =>
        dispatch({
          type: "update-custom-premise-term",
          position,
          field,
          termId,
        }),
      onCustomPremiseComplementChange: (position, field, complemented) =>
        dispatch({
          type: "update-custom-premise-complement",
          position,
          field,
          complemented,
        }),
      onCustomProblemSubmit: () =>
        dispatch({
          type: "submit-custom-problem",
          validation: validateCustomProblemDraft(state.customProblemDraft),
        }),
      onCustomProblemClear: () =>
        dispatch({ type: "clear-custom-problem" }),
      onCustomTermDraftChange: (field, value) =>
        dispatch({ type: "update-custom-term-draft", field, value }),
      onCustomTermSubmit: () => {
        const editor = state.customTermEditor;
        const result = editor.mode === "create"
          ? createCustomTerm(
              editor.draft,
              BUILT_IN_TERMS,
            state.customTerms,
            state.locale,
            )
          : editor.editingTermId === null
            ? (() => {
                throw new Error("Custom term edit mode has no term ID.");
              })()
            : updateCustomTerm(
                editor.editingTermId,
                editor.draft,
                BUILT_IN_TERMS,
              state.customTerms,
              state.locale,
              );
        dispatch({ type: "submit-custom-term", result });
      },
      onCustomTermEdit: (termId) =>
        dispatch({ type: "start-edit-custom-term", termId }),
      onCustomTermEditCancel: () =>
        dispatch({ type: "cancel-edit-custom-term" }),
      onCustomTermDelete: (termId) =>
        findSavedCustomProblemsUsingTerm(
            termId,
            state.savedCustomProblems,
          ).length > 0
          ? dispatch({
              type: "reject-custom-term-deletion",
              reason: "term-in-use-by-saved-problem",
            })
          : dispatch({ type: "delete-custom-term", termId }),
      onSavedCustomProblemTitleChange: (value) =>
        dispatch({ type: "update-saved-custom-problem-title", value }),
      onSavedCustomProblemSubmit: () => {
        const editor = state.savedCustomProblemEditor;
        const result = editor.mode === "create"
          ? createSavedCustomProblem(
              editor.draft,
              state.customPremises,
              state.savedCustomProblems,
            )
          : editor.editingProblemId === null
            ? (() => {
                throw new Error(
                  "Saved custom problem edit mode has no problem ID.",
                );
              })()
            : updateSavedCustomProblem(
                editor.editingProblemId,
                editor.draft,
                state.customPremises,
                state.savedCustomProblems,
              );
        dispatch({ type: "submit-saved-custom-problem", result });
      },
      onSavedCustomProblemOpen: (problemId) =>
        dispatch({ type: "open-saved-custom-problem", problemId }),
      onSavedCustomProblemEdit: (problemId) =>
        dispatch({ type: "start-edit-saved-custom-problem", problemId }),
      onSavedCustomProblemEditCancel: () =>
        dispatch({ type: "cancel-edit-saved-custom-problem" }),
      onSavedCustomProblemDelete: (problemId) =>
        dispatch({ type: "delete-saved-custom-problem", problemId }),
      onDataBackupExport: () => {
        try {
          const catalog = validateImportedData({
            customTerms: state.customTerms,
            savedCustomProblems: state.savedCustomProblems,
          });
          if (!catalog.ok) {
            throw new Error(`Invalid saved problem catalog: ${catalog.reason}.`);
          }
          fileTransfer.downloadText(
            createDataBackupFilename(),
            createDataBackupJson({
              customTerms: state.customTerms,
              savedCustomProblems: state.savedCustomProblems,
            }),
            DATA_BACKUP_MIME_TYPE,
          );
          dispatch({ type: "set-data-export-status", status: "exported" });
        } catch {
          dispatch({ type: "set-data-export-status", status: "export-error" });
        }
      },
      onDataBackupFileSelected: (file) => {
        const requestId = ++importRequestId;
        if (file === null) {
          dispatch({ type: "cancel-data-import" });
          return;
        }
        if (file.size > DATA_BACKUP_MAX_FILE_BYTES) {
          dispatch({
            type: "reject-data-import-file-size",
            fileName: file.name,
          });
          return;
        }
        dispatch({ type: "begin-data-import", fileName: file.name });
        void fileTransfer.readText(file).then(
          (text) => {
            if (requestId !== importRequestId) return;
            dispatch({
              type: "complete-data-import-preparation",
              fileName: file.name,
              result: prepareDataImport(text),
            });
          },
          () => {
            if (requestId !== importRequestId) return;
            dispatch({
              type: "reject-data-import-read",
              fileName: file.name,
            });
          },
        );
      },
      onDataImportApply: () => {
        const pending = state.dataImport.pending;
        if (state.dataImport.status !== "ready" || pending === null) return;
        const replaced = availableStorage === null
          ? { ok: false as const }
          : replaceBackupStorage(availableStorage, pending.content);
        dispatch(replaced.ok
          ? { type: "apply-pending-data-import" }
          : { type: "reject-data-import-persistence" });
      },
      onDataImportCancel: () => {
        ++importRequestId;
        dispatch({ type: "cancel-data-import" });
      },
    });
  };

  render();
}

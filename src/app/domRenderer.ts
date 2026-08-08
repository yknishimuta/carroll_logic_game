import {
  isBuiltInProblemId,
  type BuiltInProblemId,
} from "../data/problems";
import {
  CUSTOM_TERM_LABEL_MAX_LENGTH,
  isCustomTermId,
  type CustomTermId,
} from "../domain/customTerm";
import { isLocale, type Locale } from "../domain/locale";
import {
  isPropositionForm,
  type PropositionForm,
} from "../domain/proposition";
import type { TermId } from "../domain/term";
import {
  isCustomPremisePosition,
  isCustomComplementField,
  isCustomTermField,
  isProblemSource,
  type CustomPremisePosition,
  type CustomTermField,
  type CustomComplementField,
  type ProblemSource,
} from "./customProblem";
import type { GameViewModel } from "./viewModel";
import {
  isCustomTermDraftField,
  type CustomTermDraftField,
} from "./customTerms";
import {
  isCounterPlacementMode,
  isCounterTool,
  type CounterPlacementMode,
  type CounterTool,
} from "./counterPractice";
import {
  isConclusionAnswerChoice,
  isConclusionAnswerMode,
  type ConclusionAnswerChoice,
  type ConclusionAnswerMode,
} from "./conclusionQuiz";
import {
  isCustomProblemId,
  type CustomProblemId,
} from "../domain/savedCustomProblem";
import { parseSafeSvgElement } from "./svgDom";
import { bindCompositionAwareTextInput } from "./compositionAwareTextInput";

export interface GameEventHandlers {
  readonly onCustomTermManagementOpen: () => void;
  readonly onCustomTermManagementClose: () => void;
  readonly onPrevious: () => void;
  readonly onNext: () => void;
  readonly onReset: () => void;
  readonly onProblemChange: (problemId: BuiltInProblemId) => void;
  readonly onLocaleChange: (locale: Locale) => void;
  readonly onProblemSourceChange: (source: ProblemSource) => void;
  readonly onCustomPremiseFormChange: (
    position: CustomPremisePosition,
    form: PropositionForm | null,
  ) => void;
  readonly onCustomPremiseTermChange: (
    position: CustomPremisePosition,
    field: CustomTermField,
    termId: TermId | null,
  ) => void;
  readonly onCustomPremiseComplementChange: (
    position: CustomPremisePosition,
    field: CustomComplementField,
    complemented: boolean,
  ) => void;
  readonly onCustomProblemSubmit: () => void;
  readonly onCustomProblemClear: () => void;
  readonly onCustomTermDraftChange: (
    field: CustomTermDraftField,
    value: string,
  ) => void;
  readonly onCustomTermSubmit: () => void;
  readonly onCustomTermEdit: (termId: CustomTermId) => void;
  readonly onCustomTermEditCancel: () => void;
  readonly onCustomTermDelete: (termId: CustomTermId) => void;
  readonly onCounterPlacementModeChange:
    (mode: CounterPlacementMode) => void;
  readonly onConclusionAnswerModeChange:
    (mode: ConclusionAnswerMode) => void;
  readonly onCounterToolChange: (tool: CounterTool) => void;
  readonly onCounterTargetActivate: (targetKey: string) => void;
  readonly onCounterAttemptCheck: () => void;
  readonly onCounterAttemptClear: () => void;
  readonly onConclusionAnswerChange:
    (answer: ConclusionAnswerChoice | null) => void;
  readonly onConclusionAnswerSubmit: () => void;
  readonly onSavedCustomProblemTitleChange: (value: string) => void;
  readonly onSavedCustomProblemSubmit: () => void;
  readonly onSavedCustomProblemOpen: (problemId: CustomProblemId) => void;
  readonly onSavedCustomProblemEdit: (problemId: CustomProblemId) => void;
  readonly onSavedCustomProblemEditCancel: () => void;
  readonly onSavedCustomProblemDelete: (problemId: CustomProblemId) => void;
  readonly onDataBackupExport: () => void;
  readonly onDataBackupFileSelected: (file: File | null) => void;
  readonly onDataImportApply: () => void;
  readonly onDataImportCancel: () => void;
}

function createDataBackupSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement | null {
  const backup = model.dataBackup;
  if (backup === null) return null;
  const section = element("section", "logic-game__data-backup");
  section.append(heading("h2", backup.heading));
  const description = element("p");
  description.textContent = backup.description;
  const actions = element("div", "logic-game__data-backup-actions");
  const exportPanel = element(
    "section",
    "logic-game__data-backup-action logic-game__data-backup-action--export",
  );
  const exportHeading = element("h3");
  exportHeading.textContent = backup.exportHeading;
  exportPanel.append(exportHeading);
  const exportDescription = element("p");
  exportDescription.textContent = backup.exportDescription;
  const exportButton = element("button");
  exportButton.className = "logic-game__data-backup-primary-action";
  exportButton.type = "button";
  exportButton.dataset.action = "export-data-backup";
  exportButton.textContent = backup.exportButtonLabel;
  exportButton.addEventListener("click", handlers.onDataBackupExport);
  exportPanel.append(exportDescription, exportButton);
  const importPanel = element(
    "section",
    "logic-game__data-backup-action logic-game__data-backup-action--import",
  );
  const importHeading = element("h3");
  importHeading.textContent = backup.importHeading;
  importPanel.append(importHeading);
  const importDescription = element("p");
  importDescription.textContent = backup.importDescription;
  const fileLabel = element("label");
  fileLabel.className = "logic-game__data-backup-file-label";
  const fileLabelText = element("span");
  fileLabelText.textContent = backup.fileInputLabel;
  const input = element("input");
  input.type = "file";
  input.accept = backup.accept;
  input.dataset.action = "import-data-backup-file";
  input.addEventListener("change", () =>
    handlers.onDataBackupFileSelected(input.files?.item(0) ?? null)
  );
  fileLabel.append(fileLabelText, input);
  const accepted = element("p");
  accepted.className = "logic-game__data-backup-file-help";
  accepted.textContent = backup.acceptedFileDescription;
  importPanel.append(importDescription, fileLabel, accepted);
  actions.append(exportPanel, importPanel);
  section.append(description, actions);
  if (backup.exportStatusMessage !== null) {
    const status = element("p", "logic-game__data-export-status");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = backup.exportStatusMessage;
    exportPanel.append(status);
  }
  if (backup.importStatusMessage !== null) {
    const status = element(
      "p",
      `logic-game__data-import-status logic-game__data-import-status--${backup.importStatusKind ?? "info"}`,
    );
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.textContent = backup.importStatusMessage;
    importPanel.append(status);
  }
  if (backup.preview !== null) {
    const preview = element("div", "logic-game__data-import-preview");
    const previewHeading = element("h3");
    previewHeading.textContent = backup.preview.heading;
    preview.append(previewHeading);
    const details = element("dl");
    const values: readonly [string, string][] = [
      [backup.preview.selectedFileLabel, backup.preview.fileName],
      [backup.preview.customTermCountLabel, String(backup.preview.customTermCount)],
      [backup.preview.savedProblemCountLabel, String(backup.preview.savedProblemCount)],
    ];
    values.forEach(([term, value]) => {
      const dt = element("dt");
      dt.textContent = term;
      const dd = element("dd");
      dd.textContent = value;
      details.append(dt, dd);
    });
    const warning = element("p", "logic-game__warning");
    warning.textContent = backup.preview.replaceWarning;
    const apply = element("button", "logic-game__danger-action");
    apply.type = "button";
    apply.dataset.action = "apply-data-import";
    apply.textContent = backup.preview.applyButtonLabel;
    apply.addEventListener("click", handlers.onDataImportApply);
    const cancel = element("button");
    cancel.type = "button";
    cancel.dataset.action = "cancel-data-import";
    cancel.textContent = backup.preview.cancelButtonLabel;
    cancel.addEventListener("click", handlers.onDataImportCancel);
    preview.append(details, warning, apply, cancel);
    importPanel.append(preview);
  }
  return section;
}

function element<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const result = document.createElement(tagName);
  if (className !== undefined) {
    result.className = className;
  }
  return result;
}

function heading(
  level: "h1" | "h2",
  text: string,
  className?: string,
): HTMLHeadingElement {
  const result = element(level, className);
  result.textContent = text;
  return result;
}

function createProgress(model: GameViewModel): HTMLElement {
  const nav = element("nav", "logic-game__progress");
  nav.setAttribute("aria-label", model.progressAriaLabel);
  const list = element("ol");
  const currentIndex = model.progressSteps.findIndex(
    ({ phase }) => phase === model.phase,
  );

  model.progressSteps.forEach(({ phase, label }, index) => {
    const item = element("li");
    item.textContent = label;
    item.dataset.phase = phase;
    item.className =
      index < currentIndex
        ? "is-complete"
        : index === currentIndex
          ? "is-current"
          : "is-upcoming";
    if (index === currentIndex) {
      item.setAttribute("aria-current", "step");
    }
    list.append(item);
  });

  nav.append(list);
  return nav;
}

function createSelector(
  action:
    | "locale"
    | "problem"
    | "problem-source"
    | "counter-placement-mode"
    | "conclusion-answer-mode",
  model: GameViewModel["languageSelector"],
  onChange: (value: string) => void,
): HTMLLabelElement {
  const label = element("label");
  const labelText = element("span");
  labelText.textContent = model.label;
  const select = element("select");
  select.dataset.action = action;
  select.setAttribute("aria-label", model.label);
  select.disabled = model.disabled ?? false;

  model.options.forEach(({ value, label: optionLabel }) => {
    const option = element("option");
    option.value = value;
    option.textContent = optionLabel;
    select.append(option);
  });
  select.value = model.selectedValue;
  select.addEventListener("change", () => onChange(select.value));
  label.append(labelText, select);
  if (model.description !== undefined) {
    const description = element("span", "logic-game__selector-description");
    description.id = `${action}-description`;
    description.textContent = model.description;
    select.setAttribute("aria-describedby", description.id);
    label.append(description);
  }
  return label;
}

function createSettings(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement {
  const section = element("section", "logic-game__settings");
  section.setAttribute("aria-labelledby", "settings-heading");
  const settingsHeading = heading("h2", model.accessibility.settingsHeading);
  settingsHeading.id = "settings-heading";
  section.append(
    settingsHeading,
    createSelector("locale", model.languageSelector, (value) => {
      if (!isLocale(value)) {
        throw new Error(`Unknown locale selected: "${value}".`);
      }
      handlers.onLocaleChange(value);
    }),
    createSelector(
      "problem-source",
      model.problemSourceSelector,
      (value) => {
        if (!isProblemSource(value)) {
          throw new Error(`Unknown problem source selected: "${value}".`);
        }
        handlers.onProblemSourceChange(value);
      },
    ),
    createSelector(
      "counter-placement-mode",
      model.counterPlacementModeSelector,
      (value) => {
        if (!isCounterPlacementMode(value)) {
          throw new Error(`Unknown counter placement mode: "${value}".`);
        }
        handlers.onCounterPlacementModeChange(value);
      },
    ),
    createSelector(
      "conclusion-answer-mode",
      model.conclusionAnswerModeSelector,
      (value) => {
        if (!isConclusionAnswerMode(value)) {
          throw new Error(`Unknown conclusion answer mode: "${value}".`);
        }
        handlers.onConclusionAnswerModeChange(value);
      },
    ),
  );
  if (model.problemSourceSelector.selectedValue === "built-in") {
    section.insertBefore(
      createSelector("problem", model.problemSelector, (value) => {
        if (!isBuiltInProblemId(value)) {
          throw new Error(`Unknown problem selected: "${value}".`);
        }
        handlers.onProblemChange(value);
      }),
      section.querySelector('[data-action="counter-placement-mode"]')
        ?.parentElement ?? null,
    );
  }
  return section;
}

function createConclusionQuizSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement | null {
  const quiz = model.conclusionQuiz;
  if (quiz === null) return null;
  const section = element("section", "logic-game__conclusion-quiz");
  section.dataset.conclusionExperience = "quiz";
  section.dataset.conclusionQuizLocation = "combined-premises";
  section.append(heading("h2", quiz.heading));
  const fieldset = element("fieldset");
  const legend = element("legend");
  legend.textContent = quiz.selectorLabel;
  const instruction = element("p");
  instruction.textContent = quiz.instruction;
  const label = element("label");
  const labelText = element("span");
  labelText.textContent = quiz.selectPlaceholder;
  const select = element("select");
  select.dataset.action = "conclusion-answer";
  const placeholder = element("option");
  placeholder.value = "";
  placeholder.textContent = quiz.selectPlaceholder;
  select.append(placeholder);
  quiz.options.forEach(({ value, label: optionLabel }) => {
    const option = element("option");
    option.value = value;
    option.textContent = optionLabel;
    select.append(option);
  });
  select.value = quiz.selectedAnswer ?? "";
  if (quiz.feedback !== null && quiz.feedback.kind !== "correct") {
    select.setAttribute("aria-invalid", "true");
    select.setAttribute("aria-describedby", "conclusion-quiz-feedback");
  }
  select.addEventListener("change", () => {
    const value = select.value;
    if (value !== "" && !isConclusionAnswerChoice(value)) {
      throw new Error(`Unknown conclusion answer: "${value}".`);
    }
    handlers.onConclusionAnswerChange(value === "" ? null : value);
  });
  label.append(labelText, select);
  const check = element("button");
  check.type = "button";
  check.dataset.action = "check-conclusion-answer";
  check.textContent = quiz.checkButtonLabel;
  check.addEventListener("click", handlers.onConclusionAnswerSubmit);
  fieldset.append(legend, instruction, label, check);
  section.append(fieldset);
  if (quiz.feedback !== null) {
    const feedback = element(
      "p",
      `logic-game__conclusion-quiz-feedback logic-game__conclusion-quiz-feedback--${quiz.feedback.kind}`,
    );
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.id = "conclusion-quiz-feedback";
    feedback.textContent = quiz.feedback.message;
    fieldset.append(feedback);
  }
  return section;
}

function createSavedCustomProblemManagerSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement | null {
  const manager = model.savedCustomProblemManager;
  if (manager === null) return null;
  const section = element("section", "logic-game__saved-custom-problems");
  section.append(heading("h2", manager.heading));
  const description = element("p");
  description.textContent = manager.description;
  const editorFields = element("fieldset");
  const editorLegend = element("legend");
  editorLegend.textContent = manager.heading;
  editorFields.append(editorLegend);
  const label = element("label");
  const labelText = element("span");
  labelText.textContent = manager.titleLabel;
  const input = element("input");
  input.type = "text";
  input.maxLength = manager.titleMaxLength;
  input.placeholder = manager.titlePlaceholder;
  input.dataset.action = "saved-custom-problem-title";
  input.value = manager.titleValue;
  if (manager.feedback?.kind === "error") {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute(
      "aria-describedby",
      "saved-custom-problem-feedback",
    );
  }
  bindCompositionAwareTextInput(
    input,
    handlers.onSavedCustomProblemTitleChange,
  );
  label.append(labelText, input);
  const submit = element("button");
  submit.type = "button";
  submit.dataset.action = "save-custom-problem";
  submit.textContent = manager.submitLabel;
  submit.addEventListener("click", handlers.onSavedCustomProblemSubmit);
  editorFields.append(label, submit);
  section.append(description, editorFields);
  if (manager.cancelLabel !== null) {
    const cancel = element("button");
    cancel.type = "button";
    cancel.dataset.action = "cancel-saved-custom-problem-edit";
    cancel.textContent = manager.cancelLabel;
    cancel.addEventListener(
      "click",
      handlers.onSavedCustomProblemEditCancel,
    );
    editorFields.append(cancel);
  }
  if (manager.emptyListMessage !== null) {
    const empty = element("p", "logic-game__saved-custom-problem-empty");
    empty.textContent = manager.emptyListMessage;
    section.append(empty);
  } else {
    const list = element("ul", "logic-game__saved-custom-problem-list");
    manager.items.forEach((item) => {
      const listItem = element("li");
      listItem.dataset.savedCustomProblemId = item.id;
      const title = element("h3");
      title.textContent = item.title;
      const premises = element("ol");
      item.concretePremises.forEach((premise) => {
        const premiseItem = element("li");
        premiseItem.textContent = premise;
        premises.append(premiseItem);
      });
      listItem.append(title, premises);
      const addAction = (
        action:
          | "open-saved-custom-problem"
          | "edit-saved-custom-problem"
          | "delete-saved-custom-problem",
        text: string,
        handler: (problemId: CustomProblemId) => void,
      ): void => {
        const button = element("button");
        button.type = "button";
        button.dataset.action = action;
        button.dataset.problemId = item.id;
        button.textContent = text;
        button.addEventListener("click", () => {
          const value = button.dataset.problemId;
          if (
            value === undefined ||
            !isCustomProblemId(value) ||
            !manager.items.some(({ id }) => id === value)
          ) {
            throw new Error(`Unknown saved custom problem ID: "${value ?? ""}".`);
          }
          handler(value);
        });
        listItem.append(button);
      };
      addAction(
        "open-saved-custom-problem",
        item.openLabel,
        handlers.onSavedCustomProblemOpen,
      );
      addAction(
        "edit-saved-custom-problem",
        item.editLabel,
        handlers.onSavedCustomProblemEdit,
      );
      addAction(
        "delete-saved-custom-problem",
        item.deleteLabel,
        handlers.onSavedCustomProblemDelete,
      );
      list.append(listItem);
    });
    section.append(list);
  }
  if (manager.feedback !== null) {
    const feedback = element(
      "p",
      `logic-game__saved-custom-problem-feedback logic-game__saved-custom-problem-feedback--${manager.feedback.kind}`,
    );
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.id = "saved-custom-problem-feedback";
    feedback.textContent = manager.feedback.message;
    section.append(feedback);
  }
  if (manager.persistenceWarning !== null) {
    const warning = element("p", "logic-game__saved-custom-problem-warning");
    warning.setAttribute("role", "status");
    warning.textContent = manager.persistenceWarning;
    section.append(warning);
  }
  return section;
}

function createProblemSection(model: GameViewModel): HTMLElement | null {
  if (model.concretePremises === null) return null;
  const section = element("section", "logic-game__problem");
  section.append(heading("h2", model.premiseHeading));
  if (model.termFallbackNotice !== null) {
    const notice = element("p", "logic-game__term-fallback-notice");
    notice.setAttribute("role", "status");
    notice.textContent = model.termFallbackNotice;
    section.append(notice);
  }
  const list = element("ol");
  model.concretePremises.forEach((premise, index) => {
    const item = element("li");
    const label = element("strong");
    label.textContent = `${model.premiseLabels[index]!}: `;
    item.append(label, document.createTextNode(premise));
    list.append(item);
  });
  section.append(list);
  return section;
}

function appendOptions(
  select: HTMLSelectElement,
  model: GameViewModel["languageSelector"],
): void {
  if (model.placeholder !== undefined) {
    const placeholder = element("option");
    placeholder.value = "";
    placeholder.textContent = model.placeholder;
    select.append(placeholder);
  }
  model.options.forEach(({ value, label }) => {
    const option = element("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  select.value = model.selectedValue;
}

function createCustomProblemSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement | null {
  const editor = model.customProblemEditor;
  if (editor === null) return null;
  const section = element("section", "logic-game__custom-problem");
  section.append(heading("h2", editor.title));
  const instruction = element("p");
  instruction.textContent = editor.instruction;
  section.append(instruction);

  editor.premises.forEach((premise) => {
    const fieldset = element("fieldset");
    fieldset.dataset.premisePosition = premise.position;
    const legend = element("legend");
    legend.textContent = premise.heading;
    fieldset.append(legend);
    const definitions = [
      ["custom-form", undefined, premise.formSelector, undefined],
      ["custom-term", "subjectTermId", premise.subjectSelector, premise.subjectComplement],
      ["custom-term", "predicateTermId", premise.predicateSelector, premise.predicateComplement],
    ] as const;
    definitions.forEach(([action, field, selector, complement]) => {
      const label = element("label");
      const span = element("span");
      span.textContent = selector.label;
      const select = element("select");
      select.dataset.action = action;
      select.dataset.premisePosition = premise.position;
      if (field !== undefined) select.dataset.field = field;
      appendOptions(select, selector);
      if (editor.feedback?.kind === "error") {
        select.setAttribute("aria-invalid", "true");
        select.setAttribute("aria-describedby", "custom-problem-feedback");
      }
      select.addEventListener("change", () => {
        const position = select.dataset.premisePosition;
        if (
          position === undefined ||
          !isCustomPremisePosition(position)
        ) {
          throw new Error(`Unknown custom premise position: "${position ?? ""}".`);
        }
        if (action === "custom-form") {
          const value = select.value;
          if (value !== "" && !isPropositionForm(value)) {
            throw new Error(`Unknown proposition form: "${value}".`);
          }
          handlers.onCustomPremiseFormChange(
            position,
            value === "" ? null : value,
          );
          return;
        }
        const fieldValue = select.dataset.field;
        if (fieldValue === undefined || !isCustomTermField(fieldValue)) {
          throw new Error(`Unknown custom premise field: "${fieldValue ?? ""}".`);
        }
        const value = select.value;
        if (
          value !== "" &&
          !selector.options.some(({ value: optionValue }) =>
            optionValue === value
          )
        ) {
          throw new Error(`Unknown available term selected: "${value}".`);
        }
        handlers.onCustomPremiseTermChange(
          position,
          fieldValue,
          value === "" ? null : value,
        );
      });
      label.append(span, select);
      fieldset.append(label);
      if (field !== undefined && complement !== undefined) {
        const complementLabel = element("label", "logic-game__complement-control");
        const checkbox = element("input");
        checkbox.type = "checkbox";
        checkbox.checked = complement.checked;
        checkbox.disabled = complement.disabled;
        checkbox.dataset.action = "custom-complement";
        checkbox.dataset.premisePosition = premise.position;
        checkbox.dataset.field = field === "subjectTermId"
          ? "subjectComplemented"
          : "predicateComplemented";
        const complementText = element("span");
        complementText.textContent = complement.label;
        checkbox.addEventListener("change", () => {
          const position = checkbox.dataset.premisePosition;
          const complementField = checkbox.dataset.field;
          if (position === undefined || !isCustomPremisePosition(position)) {
            throw new Error(`Unknown custom premise position: "${position ?? ""}".`);
          }
          if (complementField === undefined || !isCustomComplementField(complementField)) {
            throw new Error(`Unknown custom complement field: "${complementField ?? ""}".`);
          }
          handlers.onCustomPremiseComplementChange(
            position,
            complementField,
            checkbox.checked,
          );
        });
        complementLabel.append(checkbox, complementText);
        fieldset.append(complementLabel);
      }
    });
    section.append(fieldset);
  });
  const actions = element("div", "logic-game__custom-problem-actions");
  const submit = element("button");
  submit.type = "button";
  submit.dataset.action = "create-custom-problem";
  submit.textContent = editor.createButtonLabel;
  submit.addEventListener("click", handlers.onCustomProblemSubmit);
  const clear = element("button");
  clear.type = "button";
  clear.dataset.action = "clear-custom-problem";
  clear.textContent = editor.clearButtonLabel;
  clear.addEventListener("click", handlers.onCustomProblemClear);
  actions.append(submit, clear);
  section.append(actions);
  if (editor.feedback !== null) {
    const feedback = element(
      "p",
      `logic-game__custom-problem-feedback logic-game__custom-problem-feedback--${editor.feedback.kind}`,
    );
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.id = "custom-problem-feedback";
    feedback.textContent = editor.feedback.message;
    section.append(feedback);
  }
  return section;
}

function customTermButton(
  action: "edit-custom-term" | "delete-custom-term",
  termId: CustomTermId,
  label: string,
  termName: string,
  handler: (termId: CustomTermId) => void,
): HTMLButtonElement {
  const button = element("button");
  button.type = "button";
  button.dataset.action = action;
  button.dataset.termId = termId;
  button.textContent = label;
  button.setAttribute("aria-label", `${label}: ${termName}`);
  button.addEventListener("click", () => {
    const value = button.dataset.termId;
    if (value === undefined || !isCustomTermId(value)) {
      throw new Error(`Unknown custom term ID: "${value ?? ""}".`);
    }
    handler(value);
  });
  return button;
}

function createCustomTermManagerSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement | null {
  const manager = model.customTermManager;
  if (manager === null) return null;
  const section = element("section", "logic-game__custom-terms");
  const formHeading = element("h3");
  formHeading.textContent = manager.newTermHeading;
  section.append(formHeading);
  const description = element("p");
  description.textContent = manager.description;
  const form = element("div", "logic-game__custom-term-form");
  if (manager.validation !== null &&
    manager.validation.invalidFields.length === 0) {
    form.setAttribute("aria-describedby", "custom-term-feedback");
  }
  const fieldsByLocale = {
    ja: [["jaNounPhrase", manager.fields.jaNounPhrase]],
    en: [["enSubjectPlural", manager.fields.enSubjectPlural],
      ["enPredicatePhrase", manager.fields.enPredicatePhrase]],
  } as const;
  manager.groups.forEach((group, groupIndex) => {
    const fieldset = element("fieldset", group.optional
      ? "logic-game__custom-term-group logic-game__custom-term-group--optional"
      : "logic-game__custom-term-group logic-game__custom-term-group--current");
    const legend = element("legend");
    legend.textContent = `${group.heading} — ${group.locale === "ja" ? "日本語" : "English"} · ${group.optional ? manager.optionalLabel : manager.requiredLabel}`;
    fieldset.append(legend);
    const helpId = `custom-term-group-help-${group.locale}`;
    if (group.helpText !== null) {
      const help = element("p", "logic-game__custom-term-help");
      help.id = helpId;
      help.textContent = group.helpText;
      fieldset.append(help);
    }
    fieldsByLocale[group.locale].forEach(([field, labelText]) => {
    const label = element("label");
    const span = element("span");
    span.textContent = labelText;
    const input = element("input");
    input.type = "text";
    input.maxLength = CUSTOM_TERM_LABEL_MAX_LENGTH;
    input.dataset.action = "custom-term-input";
    input.dataset.field = field;
    input.value = manager.draft[field];
    const describedBy = group.helpText === null ? [] : [helpId];
    if (manager.validation?.invalidFields.includes(field) === true) {
      input.setAttribute("aria-invalid", "true");
      describedBy.push("custom-term-feedback");
    }
    if (describedBy.length > 0) {
      input.setAttribute("aria-describedby", describedBy.join(" "));
    }
    const updateDraft = (): void => {
      const value = input.dataset.field;
      if (value === undefined || !isCustomTermDraftField(value)) {
        throw new Error(`Unknown custom term draft field: "${value ?? ""}".`);
      }
      handlers.onCustomTermDraftChange(value, input.value);
    };
    bindCompositionAwareTextInput(input, updateDraft);
    label.append(span, input);
    fieldset.append(label);
    });
    form.append(fieldset);
    if (groupIndex === manager.groups.length - 1) return;
  });
  const submit = element("button");
  submit.type = "button";
  submit.dataset.action = "submit-custom-term";
  submit.textContent = manager.submitLabel;
  submit.addEventListener("click", handlers.onCustomTermSubmit);
  form.append(submit);
  if (manager.cancelLabel !== null) {
    const cancel = element("button");
    cancel.type = "button";
    cancel.dataset.action = "cancel-custom-term-edit";
    cancel.textContent = manager.cancelLabel;
    cancel.addEventListener("click", handlers.onCustomTermEditCancel);
    form.append(cancel);
  }
  section.append(description, form);

  const listHeading = element("h3");
  listHeading.textContent = manager.registeredHeading;
  section.append(listHeading);
  if (manager.emptyListMessage !== null) {
    const empty = element("p", "logic-game__custom-term-empty");
    empty.textContent = manager.emptyListMessage;
    section.append(empty);
  } else {
    const list = element("ul", "logic-game__custom-term-list");
    manager.items.forEach((item) => {
      const listItem = element("li");
      listItem.dataset.customTermId = item.id;
      const title = element("strong");
      title.textContent = item.displayName;
      title.lang = item.sourceLocale;
      if (item.fallbackLabel !== null) {
        const fallback = element("span", "logic-game__fallback-badge");
        fallback.textContent = item.fallbackLabel;
        listItem.append(title, fallback);
      } else {
        listItem.append(title);
      }
      const details = element("dl");
      for (const [label, value] of [
        [manager.fields.jaNounPhrase, item.jaNounPhrase],
        [manager.fields.enSubjectPlural, item.enSubjectPlural],
        [manager.fields.enPredicatePhrase, item.enPredicatePhrase],
      ] as const) {
        const term = element("dt");
        term.textContent = label;
        const descriptionValue = element("dd");
        descriptionValue.textContent = value;
        details.append(term, descriptionValue);
      }
      listItem.append(
        details,
        customTermButton(
          "edit-custom-term",
          item.id,
          item.editLabel,
          item.displayName,
          handlers.onCustomTermEdit,
        ),
        customTermButton(
          "delete-custom-term",
          item.id,
          item.deleteLabel,
          item.displayName,
          handlers.onCustomTermDelete,
        ),
      );
      list.append(listItem);
    });
    section.append(list);
  }
  if (manager.feedback !== null) {
    const feedback = element(
      "p",
      `logic-game__custom-term-feedback logic-game__custom-term-feedback--${manager.feedback.kind}`,
    );
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.id = "custom-term-feedback";
    feedback.textContent = manager.feedback.message;
    section.append(feedback);
  }
  if (manager.persistenceWarning !== null) {
    const warning = element("p", "logic-game__custom-term-warning");
    warning.setAttribute("role", "status");
    warning.textContent = manager.persistenceWarning;
    section.append(warning);
  }
  return section;
}

function appendResolvedAssignment(
  section: HTMLElement,
  items: GameViewModel["termAssignment"],
): void {
  const list = element("dl");
  items.forEach(({ role, label }) => {
    const term = element("dt");
    term.textContent = role;
    const description = element("dd");
    description.textContent = label;
    list.append(term, description);
  });
  section.append(list);
}

function createAssignmentSection(
  model: GameViewModel,
): HTMLElement {
  const section = element("section", "logic-game__assignment");
  section.append(heading("h2", model.assignmentHeading));
  const description = element("p");
  description.textContent = model.assignmentDescription;
  section.append(description);
  if (model.assignmentPanel.kind === "resolved") {
    appendResolvedAssignment(section, model.assignmentPanel.items);
  }
  return section;
}

function createAbstractionSection(model: GameViewModel): HTMLElement | null {
  const premises = model.assignmentPanel.kind === "resolved"
    ? model.assignmentPanel.abstractPremises
    : null;
  if (premises === null) {
    return null;
  }
  const section = element("section", "logic-game__abstraction");
  section.append(heading("h2", model.abstractionHeading));
  const list = element("ol");
  premises.forEach((premise) => {
    const item = element("li");
    item.textContent = premise;
    list.append(item);
  });
  section.append(list);
  return section;
}

function createDiagramSection(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement {
  const section = element("section", "logic-game__diagram");
  section.append(heading("h2", model.phaseLabel));

  const instruction = element("p", "logic-game__instruction");
  instruction.textContent = model.instruction;

  const figure = element("figure");
  const svgContainer = element("div", "logic-game__svg-container");
  svgContainer.append(parseSafeSvgElement(model.diagram.svg));
  const panel = model.counterPracticePanel;
  if (panel !== null) {
    instruction.textContent = panel.instruction;
    const interactive = element(
      "div",
      "logic-game__interactive-diagram",
    );
    const overlay = element(
      "div",
      "logic-game__counter-target-overlay",
    );
    panel.targets.forEach((target) => {
      if (target.locked) {
        const locked = element(
          "span",
          "logic-game__counter-target logic-game__counter-target--locked",
        );
        locked.dataset.counterTargetLocked = "true";
        locked.setAttribute("aria-hidden", "true");
        locked.style.left = `${target.leftPercent}%`;
        locked.style.top = `${target.topPercent}%`;
        overlay.append(locked);
        return;
      }
      const button = element("button", "logic-game__counter-target");
      button.type = "button";
      button.dataset.action = "counter-target";
      button.dataset.targetKey = target.key;
      button.setAttribute("aria-label", target.label);
      button.style.left = `${target.leftPercent}%`;
      button.style.top = `${target.topPercent}%`;
      button.addEventListener("click", () => {
        const key = button.dataset.targetKey;
        if (
          key === undefined ||
          !panel.targets.some((candidate) => candidate.key === key)
        ) {
          throw new Error(`Unknown counter target: "${key ?? ""}".`);
        }
        handlers.onCounterTargetActivate(key);
      });
      overlay.append(button);
    });
    interactive.append(svgContainer, overlay);
    figure.append(interactive);
  } else {
    figure.append(svgContainer);
  }
  const caption = element("figcaption");
  caption.textContent = model.diagram.caption;
  figure.append(caption);
  section.append(instruction, figure);
  if (panel !== null) {
    const tools = element("div", "logic-game__counter-tools");
    tools.setAttribute("role", "group");
    tools.setAttribute("aria-label", panel.toolHeading);
    panel.tools.forEach((tool) => {
      const button = element("button");
      button.type = "button";
      button.dataset.action = "counter-tool";
      button.dataset.tool = tool.value;
      button.setAttribute("aria-pressed", String(tool.selected));
      button.textContent = tool.label;
      button.addEventListener("click", () => {
        const value = button.dataset.tool;
        if (value === undefined || !isCounterTool(value)) {
          throw new Error(`Unknown counter tool: "${value ?? ""}".`);
        }
        handlers.onCounterToolChange(value);
      });
      tools.append(button);
    });
    const actions = element("div", "logic-game__counter-actions");
    const check = element("button");
    check.type = "button";
    check.dataset.action = "check-counter-attempt";
    check.textContent = panel.checkButtonLabel;
    check.addEventListener("click", handlers.onCounterAttemptCheck);
    const clear = element("button");
    clear.type = "button";
    clear.dataset.action = "clear-counter-attempt";
    clear.textContent = panel.clearButtonLabel;
    clear.disabled = panel.clearButtonDisabled;
    if (!clear.disabled) {
      clear.addEventListener("click", handlers.onCounterAttemptClear);
    }
    actions.append(check, clear);
    section.append(tools, actions);
    if (panel.feedback !== null) {
      const feedback = element(
        "p",
        `logic-game__counter-feedback logic-game__counter-feedback--${panel.feedback.kind}`,
      );
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      feedback.textContent = panel.feedback.message;
      section.append(feedback);
    }
  }
  return section;
}

function createConclusionSection(
  model: GameViewModel,
): HTMLElement | null {
  if (model.phase !== "conclusion") {
    return null;
  }
  if (
    model.concreteConclusion === null &&
    model.abstractConclusion === null &&
    model.noConclusionMessage === null
  ) return null;

  const section = element("section", "logic-game__conclusion");
  if (model.derivedConclusion !== null) {
    section.dataset.conclusionExperience = "derived-result";
  }
  section.append(heading(
    "h2",
    model.derivedConclusion?.heading ?? model.conclusionHeading,
  ));

  if (model.noConclusionMessage !== null) {
    const message = element("p", "logic-game__no-conclusion");
    message.textContent = model.noConclusionMessage;
    section.append(message);
    if (model.derivedConclusion !== null) {
      const explanation = element("p");
      explanation.textContent = model.derivedConclusion.explanation;
      section.append(explanation);
    }
    return section;
  }

  if (
    model.concreteConclusion === null ||
    model.abstractConclusion === null
  ) {
    throw new Error("Conclusion view model is incomplete.");
  }

  const concrete = element("p", "logic-game__concrete-conclusion");
  const concreteLabel = element("strong");
  concreteLabel.textContent = `${model.concreteConclusionLabel}: `;
  concrete.append(
    concreteLabel,
    document.createTextNode(model.concreteConclusion),
  );
  const abstract = element("p", "logic-game__abstract-conclusion");
  const abstractLabel = element("strong");
  abstractLabel.textContent = `${model.abstractConclusionLabel}: `;
  abstract.append(
    abstractLabel,
    document.createTextNode(model.abstractConclusion),
  );
  section.append(concrete, abstract);
  if (model.derivedConclusion !== null) {
    const explanation = element("p");
    explanation.textContent = model.derivedConclusion.explanation;
    section.append(explanation);
  }
  return section;
}

function createButton(
  action: "previous" | "next" | "reset",
  label: string,
  disabled: boolean,
  handler: () => void,
): HTMLButtonElement {
  const button = element("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = label;
  button.disabled = disabled;
  if (!disabled) {
    button.addEventListener("click", handler);
  }
  return button;
}

function createControls(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement {
  const nav = element("nav", "logic-game__controls");
  nav.setAttribute("aria-label", model.navigation.controlsAriaLabel);
  nav.append(
    createButton(
      "previous",
      model.navigation.previousLabel,
      model.navigation.previousDisabled,
      handlers.onPrevious,
    ),
    createButton(
      "next",
      model.navigation.nextLabel,
      model.navigation.nextDisabled,
      handlers.onNext,
    ),
    createButton(
      "reset",
      model.navigation.resetLabel,
      false,
      handlers.onReset,
    ),
  );
  return nav;
}

function createCustomTermSummary(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement {
  const section = element("section", "logic-game__custom-term-summary");
  section.append(heading("h2", model.customTermSummary.heading));
  const count = element("p");
  count.textContent = model.customTermSummary.countText;
  const description = element("p");
  description.textContent = model.customTermSummary.description;
  const manage = element("button");
  manage.type = "button";
  manage.dataset.action = "open-custom-term-management";
  manage.textContent = model.customTermSummary.manageLabel;
  manage.addEventListener("click", handlers.onCustomTermManagementOpen);
  section.append(count, description, manage);
  if (model.customTermSummary.loadWarning !== null) {
    const warning = element("p", "logic-game__custom-term-warning");
    warning.setAttribute("role", "status");
    warning.textContent = model.customTermSummary.loadWarning;
    section.append(warning);
  }
  return section;
}

function createCustomTermManagementScreen(
  model: GameViewModel,
  handlers: GameEventHandlers,
): HTMLElement {
  const main = element("main", "logic-game__main logic-game__term-management");
  main.id = "main-content";
  main.tabIndex = -1;
  main.dataset.screen = "custom-term-management";
  const title = heading("h2", model.customTermManagement.heading);
  title.tabIndex = -1;
  title.dataset.screenHeading = "custom-term-management";
  const count = element("p", "logic-game__term-management-count");
  count.textContent = model.customTermManagement.countText;
  const back = element("button", "logic-game__term-management-back");
  back.type = "button";
  back.dataset.action = "close-custom-term-management";
  back.textContent = model.customTermManagement.backLabel;
  back.addEventListener("click", handlers.onCustomTermManagementClose);
  const locale = createSelector("locale", model.languageSelector, (value) => {
    if (!isLocale(value)) throw new Error(`Unknown locale selected: "${value}".`);
    handlers.onLocaleChange(value);
  });
  main.append(title, count, back, locale);
  const manager = createCustomTermManagerSection(model, handlers);
  if (manager !== null) main.append(manager);
  return main;
}

export function renderGameView(
  container: HTMLElement,
  model: GameViewModel,
  handlers: GameEventHandlers,
): void {
  document.documentElement.lang = model.locale;
  document.title = model.documentTitle;

  const article = element("article", "logic-game");
  article.dataset.phase = model.phase;
  article.dataset.activeScreen = model.activeScreen;

  const skipLink = element(
    "a",
    "skip-link skip-link--inline logic-game__header-link",
  );
  skipLink.href = "#main-content";
  skipLink.textContent = model.accessibility.skipToMain;
  skipLink.dataset.focusKey = "skip-link";
  const header = element("header", "logic-game__header");
  header.append(heading("h1", model.title));
  const headerActions = element("div", "logic-game__header-actions");
  const tutorialLink = element(
    "a",
    "logic-game__tutorial-link logic-game__header-link",
  );
  tutorialLink.href = model.tutorialLink.href;
  tutorialLink.target = "_blank";
  tutorialLink.rel = "noopener";
  tutorialLink.setAttribute(
    "aria-label",
    `${model.tutorialLink.label}（${model.tutorialLink.opensInNewTabLabel}）`,
  );
  tutorialLink.textContent = model.tutorialLink.label;
  if (model.activeScreen === "custom-term-management") {
    const headerBack = element(
      "button",
      "logic-game__header-back logic-game__header-link",
    );
    headerBack.type = "button";
    headerBack.dataset.action = "close-custom-term-management";
    headerBack.dataset.role = "header";
    headerBack.textContent = model.customTermManagement.backLabel;
    headerBack.addEventListener(
      "click",
      handlers.onCustomTermManagementClose,
    );
    headerActions.append(headerBack, tutorialLink);
  } else {
    headerActions.append(skipLink, tutorialLink);
  }
  header.append(headerActions);

  if (model.activeScreen === "custom-term-management") {
    article.append(
      header,
      createCustomTermManagementScreen(model, handlers),
    );
    assignFocusKeys(article);
    container.replaceChildren(article);
    return;
  }

  const progress = createProgress(model);
  progress.setAttribute(
    "aria-label",
    model.accessibility.progressNavigationLabel,
  );
  const main = element("main", "logic-game__main");
  main.dataset.screen = "game";
  main.id = "main-content";
  main.tabIndex = -1;
  main.setAttribute("aria-label", model.accessibility.mainRegionLabel);
  const phaseHeading = heading("h2", model.phaseLabel, "logic-game__phase-heading");
  phaseHeading.tabIndex = -1;
  phaseHeading.dataset.phaseHeading = model.phase;
  main.append(phaseHeading);

  article.append(
    header,
    createSettings(model, handlers),
    createCustomTermSummary(model, handlers),
    progress,
  );
  const customProblem = createCustomProblemSection(model, handlers);
  if (customProblem !== null) main.append(customProblem);
  const savedCustomProblems = createSavedCustomProblemManagerSection(
    model,
    handlers,
  );
  if (savedCustomProblems !== null) main.append(savedCustomProblems);
  const problem = createProblemSection(model);
  if (problem !== null) main.append(problem);
  main.append(createAssignmentSection(model));
  const abstraction = createAbstractionSection(model);
  if (abstraction !== null) {
    main.append(abstraction);
  }
  main.append(createDiagramSection(model, handlers));

  const conclusionQuiz = createConclusionQuizSection(model, handlers);
  if (conclusionQuiz !== null) main.append(conclusionQuiz);

  const conclusion = createConclusionSection(model);
  if (conclusion !== null) {
    main.append(conclusion);
  }

  main.append(createControls(model, handlers));
  const dataBackup = createDataBackupSection(model, handlers);
  if (dataBackup !== null) main.append(dataBackup);
  article.append(main);
  assignFocusKeys(article);
  container.replaceChildren(article);
}

function assignFocusKeys(root: HTMLElement): void {
  const controls = root.querySelectorAll<HTMLElement>(
    "button[data-action], select[data-action], input[data-action]",
  );
  controls.forEach((control) => {
    const action = control.dataset.action;
    if (action === undefined) return;
    const parts = [
      action,
      control.dataset.role,
      control.dataset.premisePosition,
      control.dataset.field,
      control.dataset.tool,
      control.dataset.targetKey,
      control.dataset.termId,
      control.dataset.problemId,
    ].filter((value): value is string => value !== undefined);
    control.dataset.focusKey = parts.join(":");
  });
  const keys = [...root.querySelectorAll<HTMLElement>("[data-focus-key]")]
    .map((element) => element.dataset.focusKey);
  if (new Set(keys).size !== keys.length) {
    throw new Error("Duplicate focus key generated while rendering.");
  }
}

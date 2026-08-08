import type { Locale } from "../domain/locale";
import { EN_MESSAGES } from "./en";
import { JA_MESSAGES } from "./ja";

export interface UiMessages {
  readonly accessibility: {
    readonly skipToMain: string;
    readonly settingsHeading: string;
    readonly progressNavigationLabel: string;
    readonly mainRegionLabel: string;
  };
  readonly tutorialLink: {
    readonly label: string;
    readonly opensInNewTabLabel: string;
  };
  readonly documentTitle: string;
  readonly appTitle: string;
  readonly languageSelectorLabel: string;
  readonly problemSelectorLabel: string;
  readonly premiseHeading: string;
  readonly assignmentHeading: string;
  readonly assignmentDescription: string;
  readonly abstractionHeading: string;
  readonly conclusionHeading: string;
  readonly firstPremiseLabel: string;
  readonly secondPremiseLabel: string;
  readonly concreteConclusionLabel: string;
  readonly abstractConclusionLabel: string;
  readonly concreteConclusionsLabel: string;
  readonly abstractConclusionsLabel: string;
  readonly noConclusion: string;
  readonly progressAriaLabel: string;
  readonly controlsAriaLabel: string;
  readonly problemSource: {
    readonly selectorLabel: string;
    readonly builtIn: string;
    readonly custom: string;
  };
  readonly customProblem: {
    readonly title: string;
    readonly instruction: string;
    readonly majorPremiseHeading: string;
    readonly minorPremiseHeading: string;
    readonly formLabel: string;
    readonly subjectLabel: string;
    readonly predicateLabel: string;
    readonly complementLabel: string;
    readonly selectFormPlaceholder: string;
    readonly selectTermPlaceholder: string;
    readonly createButton: string;
    readonly clearButton: string;
    readonly readyMessage: string;
    readonly feedback: {
      readonly incomplete: string;
      readonly sameTermWithinMajorPremise: string;
      readonly sameTermWithinMinorPremise: string;
      readonly expectedThreeDistinctTerms: string;
      readonly expectedOneCommonTerm: string;
      readonly couldNotDetermineMajorTerm: string;
      readonly couldNotDetermineMinorTerm: string;
    };
    readonly formOptions: {
      readonly A: string;
      readonly E: string;
      readonly I: string;
      readonly O: string;
    };
  };
  readonly customTerms: {
    readonly heading: string;
    readonly summaryCount: (count: number) => string;
    readonly summaryDescription: string;
    readonly manageAction: string;
    readonly managementHeading: string;
    readonly managementCount: (count: number, limit: number) => string;
    readonly backToGame: string;
    readonly registeredHeading: string;
    readonly newTermHeading: string;
    readonly description: string;
    readonly fields: {
      readonly jaNounPhrase: string;
      readonly enSubjectPlural: string;
      readonly enPredicatePhrase: string;
    };
    readonly currentLanguage: string;
    readonly otherLanguage: string;
    readonly optional: string;
    readonly required: string;
    readonly englishOptional: string;
    readonly japaneseOptional: string;
    readonly fallbackExplanation: string;
    readonly englishMissing: string;
    readonly japaneseMissing: string;
    readonly showingJapanese: string;
    readonly showingEnglish: string;
    readonly untranslatedOption: string;
    readonly problemFallbackNotice: string;
    readonly actions: {
      readonly create: string;
      readonly update: string;
      readonly cancelEdit: string;
      readonly edit: string;
      readonly delete: string;
    };
    readonly emptyList: string;
    readonly feedback: {
      readonly japaneseRequired: string;
      readonly englishRequired: string;
      readonly incompleteEnglish: string;
      readonly atLeastOneLanguageRequired: string;
      readonly termTextTooLong: string;
      readonly duplicateTerm: string;
      readonly termLimitReached: string;
      readonly unknownCustomTerm: string;
      readonly termInUseBySavedProblem: string;
      readonly created: string;
      readonly updated: string;
      readonly deleted: string;
    };
    readonly persistence: {
      readonly loadError: string;
      readonly saveError: string;
    };
  };
  readonly savedCustomProblems: {
    readonly heading: string;
    readonly description: string;
    readonly titleLabel: string;
    readonly titlePlaceholder: string;
    readonly actions: {
      readonly create: string;
      readonly update: string;
      readonly cancelEdit: string;
      readonly open: string;
      readonly edit: string;
      readonly delete: string;
    };
    readonly emptyList: string;
    readonly feedback: {
      readonly incompleteTitle: string;
      readonly titleTooLong: string;
      readonly duplicateTitle: string;
      readonly problemNotReady: string;
      readonly problemLimitReached: string;
      readonly created: string;
      readonly updated: string;
      readonly deleted: string;
    };
    readonly persistence: {
      readonly loadError: string;
      readonly saveError: string;
    };
  };
  readonly dataBackup: {
    readonly heading: string;
    readonly description: string;
    readonly exportHeading: string;
    readonly exportDescription: string;
    readonly exportAction: string;
    readonly importHeading: string;
    readonly importDescription: string;
    readonly importFileLabel: string;
    readonly acceptedFileDescription: string;
    readonly previewHeading: string;
    readonly selectedFileLabel: string;
    readonly customTermCountLabel: string;
    readonly savedProblemCountLabel: string;
    readonly replaceWarning: string;
    readonly actions: {
      readonly applyImport: string;
      readonly cancelImport: string;
    };
    readonly exportFeedback: {
      readonly success: string;
      readonly error: string;
    };
    readonly importFeedback: {
      readonly reading: string;
      readonly fileTooLarge: string;
      readonly readError: string;
      readonly invalidJson: string;
      readonly unsupportedFormat: string;
      readonly unsupportedVersion: string;
      readonly invalidData: string;
      readonly invalidTermCatalog: string;
      readonly invalidProblemCatalog: string;
      readonly applied: string;
      readonly appliedWithSaveError: string;
    };
  };
  readonly counterPractice: {
    readonly modeSelectorLabel: string;
    readonly modes: {
      readonly automatic: string;
      readonly manual: string;
    };
    readonly toolsHeading: string;
    readonly tools: {
      readonly emptiness: string;
      readonly existence: string;
      readonly erase: string;
    };
    readonly instructions: {
      readonly firstPremise: string;
      readonly combinedPremises: string;
      readonly conclusion: string;
    };
    readonly actions: {
      readonly check: string;
      readonly clear: string;
    };
    readonly feedback: {
      readonly correct: string;
      readonly incorrect: string;
      readonly missing: string;
      readonly extra: string;
      readonly wrongKind: string;
    };
    readonly targets: {
      readonly cell: string;
      readonly boundaryBetween: string;
      readonly occupiedEmptiness: string;
      readonly occupiedExistence: string;
      readonly unoccupied: string;
    };
  };
  readonly conclusionQuiz: {
    readonly heading: string;
    readonly instruction: string;
    readonly selectorLabel: string;
    readonly selectPlaceholder: string;
    readonly options: {
      readonly A: string;
      readonly E: string;
      readonly I: string;
      readonly O: string;
      readonly none: string;
    };
    readonly checkButton: string;
    readonly feedback: {
      readonly incomplete: string;
      readonly incorrect: string;
      readonly correct: string;
    };
    readonly lockedDiagramCaption: string;
    readonly lockedDiagramAccessibleLabel: string;
    readonly lockedDiagramDescription: string;
  };
  readonly conclusionMode: {
    readonly selectorLabel: string;
    readonly modes: {
      readonly automatic: string;
      readonly quiz: string;
    };
  };
  readonly derivedConclusion: {
    readonly heading: string;
    readonly explanation: string;
    readonly multipleIntroduction: string;
    readonly multipleExplanation: string;
  };
  readonly phases: {
    readonly problem: string;
    readonly firstPremise: string;
    readonly combinedPremises: string;
    readonly conclusion: string;
  };
  readonly instructions: {
    readonly problem: string;
    readonly firstPremise: string;
    readonly combinedPremises: string;
    readonly conclusion: string;
  };
  readonly navigation: {
    readonly previous: string;
    readonly reset: string;
    readonly nextFirstPremise: string;
    readonly nextCombinedPremises: string;
    readonly nextConclusion: string;
    readonly completed: string;
  };
  readonly diagrams: {
    readonly problemCaption: string;
    readonly firstPremiseCaption: string;
    readonly combinedPremisesCaption: string;
    readonly conclusionCaption: string;
    readonly problemAccessibleLabel: string;
    readonly firstPremiseAccessibleLabel: string;
    readonly combinedPremisesAccessibleLabel: string;
    readonly conclusionAccessibleLabel: string;
    readonly problemDescription: string;
    readonly firstPremiseDescription: string;
    readonly combinedPremisesDescription: string;
    readonly conclusionDescription: string;
  };
}

export function getUiMessages(locale: Locale): UiMessages {
  switch (locale) {
    case "ja":
      return JA_MESSAGES;
    case "en":
      return EN_MESSAGES;
  }
}

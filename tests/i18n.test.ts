import { describe, expect, it } from "vitest";
import { isLocale } from "../src/domain/locale";
import { EN_MESSAGES } from "../src/i18n/en";
import { JA_MESSAGES } from "../src/i18n/ja";
import { getUiMessages } from "../src/i18n/types";

function expectNonEmptyStrings(value: unknown): void {
  if (typeof value === "string") {
    expect(value).not.toBe("");
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) {
      expectNonEmptyStrings(nested);
    }
  }
}

describe("UI messages", () => {
  it("provides distinct accessibility landmark text", () => {
    for (const key of [
      "skipToMain",
      "settingsHeading",
      "progressNavigationLabel",
      "mainRegionLabel",
    ] as const) {
      expect(JA_MESSAGES.accessibility[key]).not.toBe("");
      expect(EN_MESSAGES.accessibility[key]).not.toBe("");
      expect(JA_MESSAGES.accessibility[key]).not.toBe(
        EN_MESSAGES.accessibility[key],
      );
    }
  });
  it("retrieves both typed dictionaries", () => {
    expect(getUiMessages("ja")).toBe(JA_MESSAGES);
    expect(getUiMessages("en")).toBe(EN_MESSAGES);
  });

  it("contains no empty display strings", () => {
    expectNonEmptyStrings(JA_MESSAGES);
    expectNonEmptyStrings(EN_MESSAGES);
  });

  it("distinguishes major Japanese and English messages", () => {
    expect(JA_MESSAGES.appTitle).not.toBe(EN_MESSAGES.appTitle);
    expect(JA_MESSAGES.premiseHeading).not.toBe(EN_MESSAGES.premiseHeading);
    expect(JA_MESSAGES.conclusionHeading).not.toBe(
      EN_MESSAGES.conclusionHeading,
    );
    expect(JA_MESSAGES.navigation.previous).not.toBe(
      EN_MESSAGES.navigation.previous,
    );
  });

  it("provides localized assignment-mode and quiz messages", () => {
    expect(JA_MESSAGES.assignmentMode).toEqual({
      selectorLabel: "項の割当て方法",
      automatic: "自動",
      quiz: "クイズ",
    });
    expect(EN_MESSAGES.assignmentMode).toEqual({
      selectorLabel: "Term Assignment",
      automatic: "Automatic",
      quiz: "Quiz",
    });
    expect(Object.values(JA_MESSAGES.assignmentQuiz.feedback)).toHaveLength(4);
    expect(Object.values(EN_MESSAGES.assignmentQuiz.feedback)).toHaveLength(4);
    expect(JA_MESSAGES.assignmentQuiz.instruction).not.toBe(
      EN_MESSAGES.assignmentQuiz.instruction,
    );
    expect(JA_MESSAGES.assignmentQuiz.checkButton).not.toBe(
      EN_MESSAGES.assignmentQuiz.checkButton,
    );
  });

  it("provides localized custom-problem messages and all form labels", () => {
    expect(JA_MESSAGES.problemSource).toEqual({
      selectorLabel: "問題の種類",
      builtIn: "組み込み問題",
      custom: "自由問題",
    });
    expect(EN_MESSAGES.problemSource).toEqual({
      selectorLabel: "Problem Type",
      builtIn: "Built-in Problem",
      custom: "Custom Problem",
    });
    expect(Object.keys(JA_MESSAGES.customProblem.feedback)).toHaveLength(7);
    expect(Object.keys(EN_MESSAGES.customProblem.feedback)).toHaveLength(7);
    expect(Object.keys(JA_MESSAGES.customProblem.formOptions)).toEqual([
      "A", "E", "I", "O",
    ]);
    expectNonEmptyStrings(JA_MESSAGES.customProblem);
    expectNonEmptyStrings(EN_MESSAGES.customProblem);
    expect(JA_MESSAGES.customProblem.title).not.toBe(
      EN_MESSAGES.customProblem.title,
    );
  });

  it("provides complete localized custom-term management messages", () => {
    expectNonEmptyStrings(JA_MESSAGES.customTerms);
    expectNonEmptyStrings(EN_MESSAGES.customTerms);
    expect(Object.keys(JA_MESSAGES.customTerms.feedback)).toEqual([
      "japaneseRequired",
      "englishRequired",
      "incompleteEnglish",
      "atLeastOneLanguageRequired",
      "termTextTooLong",
      "duplicateTerm",
      "termLimitReached",
      "unknownCustomTerm",
      "termInUseBySavedProblem",
      "created",
      "updated",
      "deleted",
    ]);
    expect(JA_MESSAGES.customTerms.heading).toBe("ユーザー名詞");
    expect(EN_MESSAGES.customTerms.heading).toBe("Custom Terms");
    expect(JA_MESSAGES.customTerms.persistence.saveError).not.toBe(
      EN_MESSAGES.customTerms.persistence.saveError,
    );
    expect(JSON.stringify(JA_MESSAGES.customTerms.feedback))
      .not.toContain("すべてのラベル");
    expect(JSON.stringify(JA_MESSAGES.customTerms.feedback))
      .not.toContain("ラベル");
    expect(JSON.stringify(EN_MESSAGES.customTerms.feedback).toLowerCase())
      .not.toContain("label");
    expect(JA_MESSAGES.customTerms.feedback).toMatchObject({
      japaneseRequired: "日本語名詞句を入力してください。",
      englishRequired: "英語の主語複数形と述語句を入力してください。",
      incompleteEnglish: "英語の主語複数形と述語句は、両方入力するか、両方空欄にしてください。",
      atLeastOneLanguageRequired: "日本語名詞句、または英語の主語複数形と述語句を入力してください。",
      termTextTooLong: "各入力は80文字以内にしてください。",
    });
  });

  it("guards locale codes", () => {
    expect(isLocale("ja")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ja-JP")).toBe(false);
    expect(isLocale("fr")).toBe(false);
  });

  it("does not mutate dictionaries during retrieval", () => {
    const before = JSON.stringify({ JA_MESSAGES, EN_MESSAGES });
    getUiMessages("ja");
    getUiMessages("en");
    expect(JSON.stringify({ JA_MESSAGES, EN_MESSAGES })).toBe(before);
  });
});

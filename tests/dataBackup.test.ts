import { describe, expect, it } from "vitest";
import { prepareDataImport, validateImportedData } from "../src/app/dataBackup";
import {
  DATA_BACKUP_FORMAT,
  createDataBackupJson,
  type DataBackupContent,
} from "../src/storage/dataBackupFormat";
import { CUSTOM_TERM_LIMIT } from "../src/domain/customTerm";
import { SAVED_CUSTOM_PROBLEM_LIMIT } from "../src/domain/savedCustomProblem";

const invalidSyllogism: DataBackupContent = {
  customTerms: [],
  savedCustomProblems: [{
    id: "custom-problem-1",
    title: "Undistributed middle",
    premises: {
      firstPremise: { form: "A", subject: { termId: "cat", complemented: false }, predicate: { termId: "animal", complemented: false } },
      secondPremise: { form: "A", subject: { termId: "dog", complemented: false }, predicate: { termId: "animal", complemented: false } },
    },
  }],
};

describe("data backup semantic validation", () => {
  it("accepts a structurally valid syllogism with no conclusion", () => {
    expect(validateImportedData(invalidSyllogism)).toEqual({
      ok: true,
      content: invalidSyllogism,
    });
  });

  it("accepts an imported custom term reference and reports counts", () => {
    const content: DataBackupContent = {
      customTerms: [{
        id: "custom-term-1",
        labels: {
          ja: { nounPhrase: "研究者" },
          en: {
            subjectPlural: "researchers",
            predicatePhrase: "researchers",
          },
        },
      }],
      savedCustomProblems: [{
        id: "custom-problem-1",
        title: "Philosophers",
        premises: {
          firstPremise: { form: "A", subject: { termId: "custom-term-1", complemented: false }, predicate: { termId: "human", complemented: false } },
          secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
        },
      }],
    };
    expect(prepareDataImport(createDataBackupJson(content))).toEqual({
      ok: true,
      content,
      summary: { customTermCount: 1, savedCustomProblemCount: 1 },
    });
  });

  it.each([
    [{
      customTerms: [],
      savedCustomProblems: [{
        id: "custom-problem-1",
        title: "Unknown",
        premises: {
          firstPremise: { form: "A", subject: { termId: "missing", complemented: false }, predicate: { termId: "human", complemented: false } },
          secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
        },
      }],
    }, "invalid-problem-catalog"],
    [{
      customTerms: [],
      savedCustomProblems: [{
        id: "custom-problem-1",
        title: "Only two terms",
        premises: {
          firstPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
          secondPremise: { form: "A", subject: { termId: "animal", complemented: false }, predicate: { termId: "human", complemented: false } },
        },
      }],
    }, "invalid-problem-catalog"],
  ] as const)("rejects invalid semantic catalogs", (content, reason) => {
    expect(validateImportedData(content)).toEqual({ ok: false, reason });
  });

  it("preserves parse failure reasons", () => {
    expect(prepareDataImport("{")).toEqual({ ok: false, reason: "invalid-json" });
    expect(prepareDataImport(JSON.stringify({
      format: `${DATA_BACKUP_FORMAT}-other`,
      schemaVersion: 1,
      exportedAt: "2026-08-09T09:00:00.000Z",
      data: { customTerms: [], customProblems: [] },
    }))).toEqual({ ok: false, reason: "unsupported-format" });
  });

  it("rejects dangling term references without accepting a partial catalog", () => {
    expect(validateImportedData({
      customTerms: [],
      savedCustomProblems: [{
        id: "custom-problem-1",
        title: "Dangling",
        premises: {
          firstPremise: { form: "A", subject: { termId: "custom-term-999", complemented: false }, predicate: { termId: "human", complemented: false } },
          secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
        },
      }],
    })).toEqual({ ok: false, reason: "invalid-problem-catalog" });
  });

  it("rejects duplicate problem IDs and case-insensitive duplicate titles", () => {
    const base = invalidSyllogism.savedCustomProblems[0]!;
    for (const duplicate of [
      { ...base, title: "Different" },
      { ...base, id: "custom-problem-2" as const, title: base.title.toUpperCase() },
    ]) {
      const result = prepareDataImport(createDataBackupJson({
        customTerms: [],
        savedCustomProblems: [base, duplicate],
      }));
      expect(result).toEqual({ ok: false, reason: "invalid-data" });
    }
  });

  it("rejects catalogs exceeding the existing storage limits", () => {
    const terms = Array.from({ length: CUSTOM_TERM_LIMIT + 1 }, (_, index) => ({
      id: `custom-term-${index + 1}` as const,
      labels: {
        ja: { nounPhrase: `名詞${index + 1}` },
        en: {
          subjectPlural: `terms ${index + 1}`,
          predicatePhrase: `terms ${index + 1}`,
        },
      },
    }));
    expect(prepareDataImport(createDataBackupJson({
      customTerms: terms,
      savedCustomProblems: [],
    }))).toEqual({ ok: false, reason: "invalid-data" });

    const base = invalidSyllogism.savedCustomProblems[0]!;
    const problems = Array.from(
      { length: SAVED_CUSTOM_PROBLEM_LIMIT + 1 },
      (_, index) => ({
        ...base,
        id: `custom-problem-${index + 1}` as const,
        title: `Problem ${index + 1}`,
      }),
    );
    expect(prepareDataImport(createDataBackupJson({
      customTerms: [],
      savedCustomProblems: problems,
    }))).toEqual({ ok: false, reason: "invalid-data" });
  });
});

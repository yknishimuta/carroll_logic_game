import { describe, expect, it } from "vitest";
import { prepareDataImport, validateImportedData } from "../src/app/dataBackup";
import {
  DATA_BACKUP_FORMAT,
  createDataBackupJson,
  type DataBackupContent,
} from "../src/storage/dataBackupFormat";

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
          ja: { nounPhrase: "哲学者" },
          en: {
            subjectPlural: "philosophers",
            predicatePhrase: "philosophers",
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
      version: 1,
      customTerms: [],
      savedCustomProblems: [],
    }))).toEqual({ ok: false, reason: "unsupported-format" });
  });
});

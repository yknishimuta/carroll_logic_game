import { describe, expect, it } from "vitest";
import {
  DATA_BACKUP_FORMAT,
  DATA_BACKUP_VERSION,
  createDataBackupJson,
  parseDataBackupJson,
  type DataBackupContent,
} from "../src/storage/dataBackupFormat";

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
    title: "哲学者の問題",
    premises: {
      firstPremise: {
        form: "A",
        subject: "custom-term-1",
        predicate: "human",
      },
      secondPremise: {
        form: "A",
        subject: "human",
        predicate: "animal",
      },
    },
  }],
};

describe("data backup format", () => {
  it("exports deterministic indented version 1 JSON with one trailing newline", () => {
    const json = createDataBackupJson({ customTerms: [], savedCustomProblems: [] });
    expect(json).toBe(
      `{\n  "format": "${DATA_BACKUP_FORMAT}",\n  "version": ${DATA_BACKUP_VERSION},\n  "customTerms": [],\n  "savedCustomProblems": []\n}\n`,
    );
    expect(createDataBackupJson({ customTerms: [], savedCustomProblems: [] }))
      .toBe(json);
  });

  it("round trips terms and problems without UI state", () => {
    const json = createDataBackupJson(content);
    expect(parseDataBackupJson(json)).toEqual({ ok: true, content });
    for (const forbidden of [
      "locale", "phase", "problemSource", "assignmentMode",
      "counterPractice", "conclusionQuiz", "SVG", "expectedConclusionForm",
    ]) expect(json).not.toContain(forbidden);
  });

  it.each([
    ["{", "invalid-json"],
    [JSON.stringify({ version: 1 }), "unsupported-format"],
    [JSON.stringify({ format: "other", version: 1 }), "unsupported-format"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT }), "unsupported-version"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT, version: "1" }), "unsupported-version"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT, version: 3 }), "unsupported-version"],
  ] as const)("rejects %s as %s", (json, reason) => {
    expect(parseDataBackupJson(json)).toEqual({ ok: false, reason });
  });

  it.each([
    null,
    [],
    { ...JSON.parse(createDataBackupJson(content)), customTerms: "bad" },
    {
      ...JSON.parse(createDataBackupJson(content)),
      customTerms: [content.customTerms[0], content.customTerms[0]],
    },
    { ...JSON.parse(createDataBackupJson(content)), savedCustomProblems: 1 },
    {
      ...JSON.parse(createDataBackupJson(content)),
      savedCustomProblems: [{
        ...content.savedCustomProblems[0],
        premises: {
          ...content.savedCustomProblems[0]!.premises,
          firstPremise: {
            ...content.savedCustomProblems[0]!.premises.firstPremise,
            form: "X",
          },
        },
      }],
    },
  ])("rejects structurally invalid data %#", (value) => {
    const json = JSON.stringify(value);
    const result = parseDataBackupJson(json);
    expect(result.ok).toBe(false);
  });

  it("does not mutate frozen input", () => {
    const frozen = Object.freeze({
      customTerms: Object.freeze(content.customTerms),
      savedCustomProblems: Object.freeze(content.savedCustomProblems),
    });
    createDataBackupJson(frozen);
    expect(frozen.customTerms).toBe(content.customTerms);
  });
});

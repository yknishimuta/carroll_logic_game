import { describe, expect, it } from "vitest";
import {
  DATA_BACKUP_FORMAT,
  DATA_BACKUP_SCHEMA_VERSION,
  createDataBackupFilename,
  createDataBackupJson,
  parseDataBackupJson,
  type DataBackupContent,
} from "../src/storage/dataBackupFormat";

const exportedAt = new Date("2026-08-09T09:00:00.000Z");
const content: DataBackupContent = {
  customTerms: [{
    id: "custom-term-1",
    labels: {
      ja: { nounPhrase: "哲学者′" },
      en: { subjectPlural: "philosophers", predicatePhrase: "philosophers" },
    },
  }],
  savedCustomProblems: [{
    id: "custom-problem-1",
    title: "哲学者―人間",
    premises: {
      firstPremise: {
        form: "A",
        subject: { termId: "custom-term-1", complemented: true },
        predicate: { termId: "human", complemented: false },
      },
      secondPremise: {
        form: "A",
        subject: { termId: "human", complemented: false },
        predicate: { termId: "animal", complemented: false },
      },
    },
  }],
};

function backupValue(value: DataBackupContent = content): Record<string, unknown> {
  return JSON.parse(createDataBackupJson(value, exportedAt)) as Record<string, unknown>;
}

describe("data backup format", () => {
  it("exports readable schema version 1 JSON with timestamp and domain data", () => {
    expect(createDataBackupJson({ customTerms: [], savedCustomProblems: [] }, exportedAt)).toBe(
      `{
  "format": "${DATA_BACKUP_FORMAT}",
  "schemaVersion": ${DATA_BACKUP_SCHEMA_VERSION},
  "exportedAt": "2026-08-09T09:00:00.000Z",
  "data": {
    "customTerms": [],
    "customProblems": []
  }
}
`,
    );
    expect(createDataBackupFilename(exportedAt)).toBe(
      "carroll-logic-game-backup-2026-08-09.json",
    );
  });

  it("round trips Unicode and structured complemented occurrences", () => {
    const json = createDataBackupJson(content, exportedAt);
    expect(parseDataBackupJson(json)).toEqual({ ok: true, content });
    expect(json).toContain("哲学者′");
    expect(json).toContain('"complemented": true');
    for (const forbidden of [
      "locale", "phase", "problemSource", "assignmentMode",
      "counterPractice", "conclusionQuiz", "SVG", "expectedConclusionForm",
    ]) expect(json).not.toContain(forbidden);
  });

  it.each([
    ["{", "invalid-json"],
    [JSON.stringify({ schemaVersion: 1 }), "unsupported-format"],
    [JSON.stringify({ format: "other", schemaVersion: 1 }), "unsupported-format"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT }), "unsupported-version"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT, schemaVersion: 0 }), "unsupported-version"],
    [JSON.stringify({ format: DATA_BACKUP_FORMAT, schemaVersion: 2 }), "unsupported-version"],
  ] as const)("rejects unsupported envelopes as %s", (json, reason) => {
    expect(parseDataBackupJson(json)).toEqual({ ok: false, reason });
  });

  it.each([
    null,
    [],
    { ...backupValue(), exportedAt: "yesterday" },
    { ...backupValue(), data: null },
    { ...backupValue(), data: { customTerms: [], customProblems: "bad" } },
    { ...backupValue(), data: { customProblems: [] } },
    {
      ...backupValue(),
      data: { customTerms: [content.customTerms[0], content.customTerms[0]], customProblems: [] },
    },
    {
      ...backupValue(),
      data: {
        customTerms: [],
        customProblems: [{
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
    },
  ])("rejects structurally invalid data %#", (value) => {
    expect(parseDataBackupJson(JSON.stringify(value)).ok).toBe(false);
  });

  it("supports an empty backup and does not mutate frozen input", () => {
    const frozen = Object.freeze({
      customTerms: Object.freeze(content.customTerms),
      savedCustomProblems: Object.freeze(content.savedCustomProblems),
    });
    createDataBackupJson(frozen, exportedAt);
    expect(frozen.customTerms).toBe(content.customTerms);
    const empty = { customTerms: [], savedCustomProblems: [] } as const;
    expect(parseDataBackupJson(createDataBackupJson(empty, exportedAt)))
      .toEqual({ ok: true, content: empty });
  });
});

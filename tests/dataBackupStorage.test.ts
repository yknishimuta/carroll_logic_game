import { describe, expect, it } from "vitest";
import type { DataBackupContent } from "../src/storage/dataBackupFormat";
import { replaceBackupStorage } from "../src/storage/dataBackupStorage";
import {
  CUSTOM_TERM_STORAGE_KEY,
  loadCustomTerms,
  saveCustomTerms,
} from "../src/storage/customTermStorage";
import {
  CUSTOM_PROBLEM_STORAGE_KEY,
  loadSavedCustomProblems,
  saveSavedCustomProblems,
} from "../src/storage/customProblemStorage";
import type { StringStorage } from "../src/storage/stringStorage";

class MemoryStorage implements StringStorage {
  readonly values = new Map<string, string>();
  failNextProblemWrite = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (key === CUSTOM_PROBLEM_STORAGE_KEY && this.failNextProblemWrite) {
      this.failNextProblemWrite = false;
      throw new Error("simulated write failure");
    }
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
}

const original: DataBackupContent = {
  customTerms: [{
    id: "custom-term-1",
    labels: {
      ja: { nounPhrase: "哲学者" },
      en: { subjectPlural: "philosophers", predicatePhrase: "philosophers" },
    },
  }],
  savedCustomProblems: [{
    id: "custom-problem-1",
    title: "Original",
    premises: {
      firstPremise: { form: "A", subject: { termId: "custom-term-1", complemented: true }, predicate: { termId: "human", complemented: false } },
      secondPremise: { form: "A", subject: { termId: "human", complemented: false }, predicate: { termId: "animal", complemented: false } },
    },
  }],
};

const replacement: DataBackupContent = {
  customTerms: [{
    id: "custom-term-37",
    labels: {
      ja: { nounPhrase: "論理学者′" },
      en: { subjectPlural: "logicians", predicatePhrase: "logicians" },
    },
  }],
  savedCustomProblems: [{
    id: "custom-problem-7",
    title: "復元―問題",
    premises: {
      firstPremise: { form: "E", subject: { termId: "custom-term-37", complemented: false }, predicate: { termId: "human", complemented: true } },
      secondPremise: { form: "I", subject: { termId: "animal", complemented: false }, predicate: { termId: "custom-term-37", complemented: false } },
    },
  }],
};

function seed(storage: StringStorage, content: DataBackupContent): void {
  expect(saveCustomTerms(storage, content.customTerms).ok).toBe(true);
  expect(saveSavedCustomProblems(storage, content.savedCustomProblems).ok).toBe(true);
}

describe("atomic backup storage replacement", () => {
  it("completely replaces both persisted catalogs and preserves structure", () => {
    const storage = new MemoryStorage();
    seed(storage, original);
    expect(replaceBackupStorage(storage, replacement)).toEqual({ ok: true });
    expect(loadCustomTerms(storage)).toEqual({ ok: true, terms: replacement.customTerms });
    expect(loadSavedCustomProblems(storage)).toEqual({ ok: true, problems: replacement.savedCustomProblems });
  });

  it("accepts an empty replacement and clears both catalogs", () => {
    const storage = new MemoryStorage();
    seed(storage, original);
    expect(replaceBackupStorage(storage, { customTerms: [], savedCustomProblems: [] }))
      .toEqual({ ok: true });
    expect(loadCustomTerms(storage)).toEqual({ ok: true, terms: [] });
    expect(loadSavedCustomProblems(storage)).toEqual({ ok: true, problems: [] });
  });

  it("rolls back the term write when the problem write fails", () => {
    const storage = new MemoryStorage();
    seed(storage, original);
    const before = new Map(storage.values);
    storage.failNextProblemWrite = true;
    expect(replaceBackupStorage(storage, replacement)).toEqual({
      ok: false,
      reason: "write-failed",
    });
    expect(storage.values).toEqual(before);
    expect(loadCustomTerms(storage)).toEqual({ ok: true, terms: original.customTerms });
    expect(loadSavedCustomProblems(storage)).toEqual({ ok: true, problems: original.savedCustomProblems });
  });

  it("removes a newly created term key during rollback when storage was empty", () => {
    const storage = new MemoryStorage();
    storage.failNextProblemWrite = true;
    expect(replaceBackupStorage(storage, replacement).ok).toBe(false);
    expect(storage.values.has(CUSTOM_TERM_STORAGE_KEY)).toBe(false);
    expect(storage.values.has(CUSTOM_PROBLEM_STORAGE_KEY)).toBe(false);
  });
});

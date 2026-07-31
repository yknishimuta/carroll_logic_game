import { describe, expect, it } from "vitest";
import type { CustomTermDefinition } from "../src/domain/customTerm";
import {
  CUSTOM_TERM_STORAGE_KEY,
  loadCustomTerms,
  saveCustomTerms,
  type StringStorage,
} from "../src/storage/customTermStorage";

class MemoryStorage implements StringStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const philosopher: CustomTermDefinition = {
  id: "custom-term-1",
  labels: {
    ja: { nounPhrase: "哲学者" },
    en: {
      subjectPlural: "philosophers",
      predicatePhrase: "philosophers",
    },
  },
};

describe("custom term storage", () => {
  it("loads v1 bilingual data and v2 monolingual data", () => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_TERM_STORAGE_KEY, JSON.stringify({
      version: 1, terms: [philosopher],
    }));
    expect(loadCustomTerms(storage)).toEqual({ ok: true, terms: [philosopher] });
    const monolingual: CustomTermDefinition[] = [
      { id: "custom-term-1", labels: { ja: { nounPhrase: "哲学者" }, en: null } },
      { id: "custom-term-2", labels: { ja: null, en: {
        subjectPlural: "mortal beings", predicatePhrase: "mortal",
      } } },
    ];
    storage.values.set(CUSTOM_TERM_STORAGE_KEY, JSON.stringify({
      version: 2, terms: monolingual,
    }));
    expect(loadCustomTerms(storage)).toEqual({ ok: true, terms: monolingual });
  });

  it.each([
    { id: "custom-term-1", labels: { ja: null, en: null } },
    { id: "custom-term-1", labels: { ja: null, en: { subjectPlural: "x" } } },
    { id: "custom-term-1", labels: { ja: { nounPhrase: "" }, en: null } },
  ])("rejects invalid v2 nullable labels", (term) => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_TERM_STORAGE_KEY, JSON.stringify({
      version: 2, terms: [term],
    }));
    expect(loadCustomTerms(storage)).toEqual({ ok: false, reason: "invalid-data" });
  });
  it("loads an empty catalog when no value exists", () => {
    expect(loadCustomTerms(new MemoryStorage())).toEqual({
      ok: true,
      terms: [],
    });
  });

  it("round trips ordered terms using only the fixed key", () => {
    const storage = new MemoryStorage();
    const second: CustomTermDefinition = {
      ...philosopher,
      id: "custom-term-2",
      labels: {
        ja: { nounPhrase: "思想家" },
        en: { subjectPlural: "thinkers", predicatePhrase: "thinkers" },
      },
    };
    const frozen = Object.freeze([Object.freeze(philosopher), second]);
    expect(saveCustomTerms(storage, frozen)).toEqual({ ok: true });
    expect([...storage.values.keys()]).toEqual([CUSTOM_TERM_STORAGE_KEY]);
    expect(JSON.parse(storage.values.get(CUSTOM_TERM_STORAGE_KEY)!))
      .toEqual({ version: 2, terms: [philosopher, second] });
    expect(loadCustomTerms(storage)).toEqual({
      ok: true,
      terms: [philosopher, second],
    });
    expect(storage.values.get(CUSTOM_TERM_STORAGE_KEY)).not.toContain("phase");
    expect(storage.values.get(CUSTOM_TERM_STORAGE_KEY)).not.toContain("locale");
    expect(storage.values.get(CUSTOM_TERM_STORAGE_KEY)).not.toContain("quiz");
  });

  it.each([
    ["{", "invalid-json"],
    [JSON.stringify({ terms: [] }), "unsupported-version"],
    [JSON.stringify({ version: 3, terms: [] }), "unsupported-version"],
    [JSON.stringify({ version: 1, terms: {} }), "invalid-data"],
    [JSON.stringify({ version: 1, terms: [{ ...philosopher, id: "bad" }] }), "invalid-data"],
    [JSON.stringify({ version: 1, terms: [philosopher, philosopher] }), "invalid-data"],
    [JSON.stringify({ version: 1, terms: [{ id: "custom-term-1", labels: {} }] }), "invalid-data"],
    [JSON.stringify({
      version: 1,
      terms: [{
        ...philosopher,
        labels: { ...philosopher.labels, ja: { nounPhrase: " " } },
      }],
    }), "invalid-data"],
    [JSON.stringify({
      version: 1,
      terms: [{
        ...philosopher,
        labels: {
          ...philosopher.labels,
          ja: { nounPhrase: "x".repeat(81) },
        },
      }],
    }), "invalid-data"],
    [JSON.stringify({
      version: 1,
      terms: Array.from({ length: 101 }, (_, index) => ({
        ...philosopher,
        id: `custom-term-${index + 1}`,
      })),
    }), "invalid-data"],
    ["null", "unsupported-version"],
    ["[]", "unsupported-version"],
  ])("rejects invalid stored data", (value, reason) => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_TERM_STORAGE_KEY, value);
    expect(loadCustomTerms(storage)).toEqual({ ok: false, reason });
  });

  it("handles read and write failures", () => {
    const readFailure: StringStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => undefined,
    };
    const writeFailure: StringStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("full"); },
    };
    expect(loadCustomTerms(readFailure)).toEqual({
      ok: false,
      reason: "storage-unavailable",
    });
    expect(saveCustomTerms(writeFailure, [philosopher])).toEqual({
      ok: false,
      reason: "write-failed",
    });
  });
});

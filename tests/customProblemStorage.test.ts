import { describe, expect, it } from "vitest";
import type { SavedCustomProblemDefinition } from "../src/domain/savedCustomProblem";
import {
  CUSTOM_PROBLEM_STORAGE_KEY,
  loadSavedCustomProblems,
  saveSavedCustomProblems,
} from "../src/storage/customProblemStorage";
import type { StringStorage } from "../src/storage/stringStorage";

class MemoryStorage implements StringStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

const problem: SavedCustomProblemDefinition = {
  id: "custom-problem-1",
  title: "Barbara",
  premises: {
    firstPremise: { form: "A", subject: "animal", predicate: "mortal" },
    secondPremise: { form: "A", subject: "human", predicate: "animal" },
  },
};

describe("saved custom problem storage", () => {
  it("loads no stored value as an empty catalog", () => {
    expect(loadSavedCustomProblems(new MemoryStorage())).toEqual({
      ok: true,
      problems: [],
    });
  });

  it("round trips ordered problems using only its fixed key", () => {
    const storage = new MemoryStorage();
    const second = {
      ...problem,
      id: "custom-problem-2" as const,
      title: "Second",
    };
    const frozen = Object.freeze([Object.freeze(problem), second]);
    expect(saveSavedCustomProblems(storage, frozen)).toEqual({ ok: true });
    expect([...storage.values.keys()]).toEqual([CUSTOM_PROBLEM_STORAGE_KEY]);
    expect(loadSavedCustomProblems(storage)).toEqual({
      ok: true,
      problems: [problem, second],
    });
    const raw = storage.values.get(CUSTOM_PROBLEM_STORAGE_KEY)!;
    expect(JSON.parse(raw)).toEqual({
      version: 1,
      problems: [problem, second],
    });
    for (const forbidden of [
      "assignment",
      "conclusion",
      "svg",
      "phase",
      "locale",
      "quiz",
    ]) expect(raw.toLowerCase()).not.toContain(forbidden);
  });

  it.each([
    ["{", "invalid-json"],
    [JSON.stringify({ problems: [] }), "unsupported-version"],
    [JSON.stringify({ version: 2, problems: [] }), "unsupported-version"],
    [JSON.stringify({ version: 1, problems: {} }), "invalid-data"],
    [JSON.stringify({ version: 1, problems: [{ ...problem, id: "bad" }] }), "invalid-data"],
    [JSON.stringify({ version: 1, problems: [problem, problem] }), "invalid-data"],
    [JSON.stringify({ version: 1, problems: [{ ...problem, title: " " }] }), "invalid-data"],
    [JSON.stringify({ version: 1, problems: [{ ...problem, title: "x".repeat(101) }] }), "invalid-data"],
    [JSON.stringify({ version: 1, problems: [{ ...problem, premises: null }] }), "invalid-data"],
    [JSON.stringify({
      version: 1,
      problems: [{
        ...problem,
        premises: {
          ...problem.premises,
          firstPremise: { ...problem.premises.firstPremise, form: "X" },
        },
      }],
    }), "invalid-data"],
    [JSON.stringify({
      version: 1,
      problems: [{
        ...problem,
        premises: {
          ...problem.premises,
          firstPremise: { ...problem.premises.firstPremise, subject: 1 },
        },
      }],
    }), "invalid-data"],
    ["null", "unsupported-version"],
  ])("rejects invalid stored data", (raw, reason) => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_PROBLEM_STORAGE_KEY, raw);
    expect(loadSavedCustomProblems(storage)).toEqual({ ok: false, reason });
  });

  it("rejects 101 items and normalized duplicate titles", () => {
    const storage = new MemoryStorage();
    storage.values.set(CUSTOM_PROBLEM_STORAGE_KEY, JSON.stringify({
      version: 1,
      problems: Array.from({ length: 101 }, (_, index) => ({
        ...problem,
        id: `custom-problem-${index + 1}`,
        title: `Problem ${index + 1}`,
      })),
    }));
    expect(loadSavedCustomProblems(storage)).toEqual({
      ok: false,
      reason: "invalid-data",
    });
    storage.values.set(CUSTOM_PROBLEM_STORAGE_KEY, JSON.stringify({
      version: 1,
      problems: [
        problem,
        { ...problem, id: "custom-problem-2", title: " barbara " },
      ],
    }));
    expect(loadSavedCustomProblems(storage)).toEqual({
      ok: false,
      reason: "invalid-data",
    });
  });

  it("maps storage exceptions to stable failures", () => {
    expect(loadSavedCustomProblems({
      getItem: () => { throw new Error("blocked"); },
      setItem: () => undefined,
    })).toEqual({ ok: false, reason: "storage-unavailable" });
    expect(saveSavedCustomProblems({
      getItem: () => null,
      setItem: () => { throw new Error("full"); },
    }, [problem])).toEqual({ ok: false, reason: "write-failed" });
  });
});

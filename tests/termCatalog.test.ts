import { describe, expect, it } from "vitest";
import {
  BUILT_IN_TERMS,
  getBuiltInTerm,
  getTermDisplayName,
  isBuiltInTermId,
} from "../src/data/terms";
import {
  createAvailableTermCatalog,
  isAvailableTermId,
  resolveAvailableTerm,
} from "../src/app/termCatalog";
import type { CustomTermDefinition } from "../src/domain/customTerm";

const customTerms: readonly CustomTermDefinition[] = [
  {
    id: "custom-term-1",
    labels: {
      ja: { nounPhrase: "哲学者" },
      en: {
        subjectPlural: "philosophers",
        predicatePhrase: "philosophers",
      },
    },
  },
];

describe("built-in term catalog", () => {
  it("contains 15 unique term IDs", () => {
    const ids = BUILT_IN_TERMS.map(({ id }) => id);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
  });

  it("provides every required label for every term", () => {
    for (const term of BUILT_IN_TERMS) {
      expect(term.labels.ja.nounPhrase, term.id).not.toBe("");
      expect(term.labels.en.subjectPlural, term.id).not.toBe("");
      expect(term.labels.en.predicatePhrase, term.id).not.toBe("");
    }
  });

  it("retrieves known terms", () => {
    expect(getBuiltInTerm("mortal")).toEqual({
      id: "mortal",
      labels: {
        ja: { nounPhrase: "死すべきもの" },
        en: {
          subjectPlural: "mortal beings",
          predicatePhrase: "mortal",
        },
      },
    });
  });

  it("reports unknown IDs", () => {
    expect(() => getBuiltInTerm("unknown-term")).toThrow(
      'Unknown built-in term: "unknown-term".',
    );
  });

  it("uses noun phrases in Japanese and subject plurals in English", () => {
    const mortal = getBuiltInTerm("mortal");
    expect(getTermDisplayName(mortal, "ja")).toBe("死すべきもの");
    expect(getTermDisplayName(mortal, "en")).toBe("mortal beings");
  });

  it("does not mutate catalog data while reading", () => {
    const before = JSON.stringify(BUILT_IN_TERMS);
    getTermDisplayName(getBuiltInTerm("animal"), "en");
    getBuiltInTerm("human");
    expect(JSON.stringify(BUILT_IN_TERMS)).toBe(before);
  });

  it("guards every catalog ID without changing catalog order", () => {
    const ids = BUILT_IN_TERMS.map(({ id }) => id);
    expect(ids.every(isBuiltInTermId)).toBe(true);
    expect(isBuiltInTermId("")).toBe(false);
    expect(isBuiltInTermId("unknown")).toBe(false);
    expect(BUILT_IN_TERMS.map(({ id }) => id)).toEqual(ids);
  });
});

describe("available term catalog", () => {
  it("appends custom terms after the built-in order", () => {
    expect(createAvailableTermCatalog(customTerms).map(({ id }) => id))
      .toEqual([
        ...BUILT_IN_TERMS.map(({ id }) => id),
        "custom-term-1",
      ]);
  });

  it("resolves built-in and custom IDs and guards availability", () => {
    expect(resolveAvailableTerm("animal", customTerms).id).toBe("animal");
    expect(resolveAvailableTerm("custom-term-1", customTerms))
      .toEqual(customTerms[0]);
    expect(isAvailableTermId("animal", customTerms)).toBe(true);
    expect(isAvailableTermId("custom-term-1", customTerms)).toBe(true);
    expect(isAvailableTermId("unknown", customTerms)).toBe(false);
    expect(() => resolveAvailableTerm("unknown", customTerms))
      .toThrow('Unknown available term: "unknown".');
  });

  it("rejects duplicate IDs without changing inputs", () => {
    const duplicate = {
      ...customTerms[0]!,
      id: "animal" as "custom-term-1",
    };
    const frozen = Object.freeze([Object.freeze(duplicate)]);
    expect(() => createAvailableTermCatalog(frozen)).toThrow(
      "duplicate IDs",
    );
    expect(frozen).toHaveLength(1);
    expect(() => createAvailableTermCatalog([
      customTerms[0]!,
      customTerms[0]!,
    ])).toThrow("duplicate IDs");
  });
});

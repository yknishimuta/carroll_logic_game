import { describe, expect, it } from "vitest";
import {
  EN_TUTORIAL_CONTENT,
  JA_TUTORIAL_CONTENT,
} from "../src/tutorial/content";
import { createTutorialViewModel } from "../src/tutorial/model";
import {
  TUTORIAL_SOURCE_ENTRIES,
  TUTORIAL_SOURCE_WORKS,
} from "../src/tutorial/sourceReferences";

function rules() {
  return JA_TUTORIAL_CONTENT.sections.flatMap((section) => section.ruleSources);
}

describe("tutorial source registry", () => {
  it("has unique source IDs, non-empty locators, and valid works", () => {
    const ids = TUTORIAL_SOURCE_ENTRIES.map(({ id }) => id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TUTORIAL_SOURCE_ENTRIES.every(({ locator }) => locator.trim() !== ""))
      .toBe(true);
    const workIds = new Set(TUTORIAL_SOURCE_WORKS.map(({ id }) => id));
    expect(TUTORIAL_SOURCE_ENTRIES.every(({ work }) => workIds.has(work)))
      .toBe(true);
  });

  it("uses every registry entry and resolves every direct or derived reference", () => {
    const registryIds = new Set(TUTORIAL_SOURCE_ENTRIES.map(({ id }) => id));
    const referenced = new Set<string>();
    for (const rule of rules()) {
      for (const reference of rule.sourceReferences) {
        if (reference.relation === "application") {
          expect(reference.sourceId).toBeNull();
        } else {
          expect(registryIds.has(reference.sourceId)).toBe(true);
          referenced.add(reference.sourceId);
        }
      }
    }
    expect(referenced).toEqual(registryIds);
  });

  it("classifies all required rules without guessing sources for app behavior", () => {
    const byId = new Map(rules().map((rule) => [rule.id, rule]));
    for (const id of [
      "complement-terms",
      "eight-triliteral-regions", "empty-counter", "existence-counter",
      "all-double-proposition", "aeio-placement", "third-term-split", "boundary-existence-meaning",
      "boundary-i-resolution", "eliminate-middle",
      "project-empty", "barbara-stages",
      "multiple-complete-conclusions", "complete-vs-incomplete-conclusion",
      "manual-placement-ui",
    ]) {
      expect(byId.has(id), id).toBe(true);
    }
    expect(byId.get("lowercase-cell-shorthand")?.sourceReferences).toEqual([
      { relation: "application", sourceId: null },
    ]);
    expect(byId.get("manual-placement-ui")?.sourceReferences).toEqual([
      { relation: "application", sourceId: null },
    ]);
    expect(byId.get("manual-placement-ui")?.label).toContain("20／8");
  });

  it("keeps Japanese and English rule IDs and relations aligned", () => {
    const shape = (content: typeof JA_TUTORIAL_CONTENT) =>
      content.sections.flatMap((section) =>
        section.ruleSources.map((rule) => ({
          id: rule.id,
          references: rule.sourceReferences,
        }))
      );
    expect(shape(EN_TUTORIAL_CONTENT)).toEqual(shape(JA_TUTORIAL_CONTENT));
  });

  it("creates plain locator text and omits application-only references", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    expect(ja.bibliographyLabel).toBe("参照文献：");
    expect(ja.locatorExplanation).toContain("各節末の「原著の関連箇所」");
    expect(ja.relatedPassagesLabel).toBe("原著の関連箇所：");
    expect(en.bibliographyLabel).toBe("Reference:");
    expect(en.locatorExplanation).toContain("Related passages in the original");
    expect(en.relatedPassagesLabel).toBe("Related passages in the original:");
    expect(en.sections.map(({ locators }) => locators))
      .toEqual(ja.sections.map(({ locators }) => locators));
    expect(ja.sections.flatMap(({ locators }) => locators))
      .toContain("(I.III.III.2)");
    const propositionLocators = ja.sections.find(
      ({ id }) => id === "proposition-rules",
    )?.locators;
    expect(propositionLocators).toContain("(I.II.III.3)");
    expect(propositionLocators).toEqual(expect.arrayContaining([
      "(I.III.III.2)", "(I.III.III.3)", "(I.IV.II)",
    ]));
    expect(ja.sections.flatMap(({ locators }) => locators).every(
      (locator) => /^\(I\.[IVX0-9.]+\)$/.test(locator),
    )).toBe(true);
    expect(ja.sections.find(({ id }) => id === "syllogism-basics")?.locators)
      .toEqual([]);
    expect(ja.sections.find(({ id }) => id === "biliteral-diagram")?.locators)
      .toEqual(expect.arrayContaining(["(I.V.II.2)", "(I.V.II.3)"]));
  });

  it("deduplicates locators within each section without changing the registry", () => {
    const ja = createTutorialViewModel("ja");
    expect(ja.sections.every(({ locators }) =>
      new Set(locators).size === locators.length
    )).toBe(true);
    expect(TUTORIAL_SOURCE_ENTRIES.map(({ locator }) => locator))
      .toContain("I.III.III.2");
    expect(TUTORIAL_SOURCE_ENTRIES).toContainEqual(expect.objectContaining({
      id: "symbolic-logic-i-ii-iii-3",
      locator: "I.II.III.3",
      page: 17,
    }));
    expect(TUTORIAL_SOURCE_ENTRIES).toContainEqual(expect.objectContaining({
      id: "symbolic-logic-i-v-ii-3",
      locator: "I.V.II.3",
      page: 66,
    }));
  });

  it("does not mutate the source registry or content", () => {
    const before = JSON.stringify({
      sources: TUTORIAL_SOURCE_ENTRIES,
      content: JA_TUTORIAL_CONTENT,
    });
    createTutorialViewModel("ja");
    createTutorialViewModel("en");
    expect(JSON.stringify({
      sources: TUTORIAL_SOURCE_ENTRIES,
      content: JA_TUTORIAL_CONTENT,
    })).toBe(before);
  });
});

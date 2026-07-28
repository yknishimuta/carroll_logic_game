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
      "complement-terms", "lowercase-cell-shorthand",
      "eight-triliteral-regions", "empty-counter", "existence-counter",
      "aeio-placement", "third-term-split", "boundary-existence-meaning",
      "boundary-i-resolution", "combine-premises", "eliminate-middle",
      "project-empty", "project-existence", "barbara-stages",
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

  it("creates localized direct, derived, and application citations", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    const jaCitations = ja.sections.flatMap((section) =>
      section.ruleSources.flatMap((rule) => rule.citations)
    );
    const enCitations = en.sections.flatMap((section) =>
      section.ruleSources.flatMap((rule) => rule.citations)
    );
    expect(jaCitations.find(({ relation }) => relation === "direct")?.label)
      .toContain("Symbolic Logic I.");
    expect(jaCitations.find(({ relation }) => relation === "derived")?.label)
      .toContain("に基づく整理");
    expect(jaCitations.find(({ relation }) => relation === "application")?.label)
      .toBe("（本アプリの操作仕様）");
    expect(enCitations.find(({ relation }) => relation === "direct")?.label)
      .toContain("Source: Symbolic Logic I.");
    expect(enCitations.find(({ relation }) => relation === "derived")?.label)
      .toContain("Derived from Symbolic Logic I.");
    expect(enCitations.find(({ relation }) => relation === "application")?.label)
      .toBe("(Application behavior)");
  });

  it("lists each used source once and preserves IDs and locators across locales", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    expect(new Set(ja.sourceEntries.map(({ id }) => id)).size)
      .toBe(ja.sourceEntries.length);
    expect(en.sourceEntries.map(({ id, locator }) => [id, locator]))
      .toEqual(ja.sourceEntries.map(({ id, locator }) => [id, locator]));
    expect(en.sourceEntries[0]?.edition).not.toBe(ja.sourceEntries[0]?.edition);
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

import { describe, expect, it } from "vitest";
import type { CustomTermDefinition } from "../src/domain/customTerm";
import { resolveCustomTermText } from "../src/app/termDisplay";

const bilingual: CustomTermDefinition = { id: "custom-term-1", labels: {
  ja: { nounPhrase: "哲学者" },
  en: { subjectPlural: "mortal beings", predicatePhrase: "mortal" },
} };

describe("custom term display resolution", () => {
  it.each([
    [bilingual, "ja", "ja", false, "哲学者", "哲学者", "哲学者"],
    [bilingual, "en", "en", false, "mortal beings", "mortal beings", "mortal"],
    [{ ...bilingual, labels: { ja: bilingual.labels.ja, en: null } }, "en", "ja", true, "哲学者", "哲学者", "哲学者"],
    [{ ...bilingual, labels: { ja: null, en: bilingual.labels.en } }, "ja", "en", true, "mortal beings", "mortal beings", "mortal"],
  ] as const)("resolves labels without mutation", (term, locale, sourceLocale,
    isFallback, displayName, subjectText, predicateText) => {
    const before = JSON.stringify(term);
    const first = resolveCustomTermText(term, locale);
    expect(first).toEqual({ requestedLocale: locale, sourceLocale, isFallback,
      displayName, subjectText, predicateText });
    expect(resolveCustomTermText(term, locale)).toEqual(first);
    expect(JSON.stringify(term)).toBe(before);
  });
});

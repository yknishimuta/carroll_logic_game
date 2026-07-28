import type { Locale } from "../domain/locale";
import type { TermDefinition, TermId } from "../domain/term";

export const BUILT_IN_TERMS = [
  { id: "human", labels: { ja: { nounPhrase: "人間" }, en: { subjectPlural: "humans", predicatePhrase: "humans" } } },
  { id: "animal", labels: { ja: { nounPhrase: "動物" }, en: { subjectPlural: "animals", predicatePhrase: "animals" } } },
  { id: "mortal", labels: { ja: { nounPhrase: "死すべきもの" }, en: { subjectPlural: "mortal beings", predicatePhrase: "mortal" } } },
  { id: "reptile", labels: { ja: { nounPhrase: "爬虫類" }, en: { subjectPlural: "reptiles", predicatePhrase: "reptiles" } } },
  { id: "warm-blooded", labels: { ja: { nounPhrase: "温血動物" }, en: { subjectPlural: "warm-blooded beings", predicatePhrase: "warm-blooded" } } },
  { id: "snake", labels: { ja: { nounPhrase: "蛇" }, en: { subjectPlural: "snakes", predicatePhrase: "snakes" } } },
  { id: "poet", labels: { ja: { nounPhrase: "詩人" }, en: { subjectPlural: "poets", predicatePhrase: "poets" } } },
  { id: "writer", labels: { ja: { nounPhrase: "作家" }, en: { subjectPlural: "writers", predicatePhrase: "writers" } } },
  { id: "student", labels: { ja: { nounPhrase: "学生" }, en: { subjectPlural: "students", predicatePhrase: "students" } } },
  { id: "bird", labels: { ja: { nounPhrase: "鳥" }, en: { subjectPlural: "birds", predicatePhrase: "birds" } } },
  { id: "mammal", labels: { ja: { nounPhrase: "哺乳類" }, en: { subjectPlural: "mammals", predicatePhrase: "mammals" } } },
  { id: "pet", labels: { ja: { nounPhrase: "ペット" }, en: { subjectPlural: "pets", predicatePhrase: "pets" } } },
  { id: "cat", labels: { ja: { nounPhrase: "猫" }, en: { subjectPlural: "cats", predicatePhrase: "cats" } } },
  { id: "dog", labels: { ja: { nounPhrase: "犬" }, en: { subjectPlural: "dogs", predicatePhrase: "dogs" } } },
  { id: "sparrow", labels: { ja: { nounPhrase: "雀" }, en: { subjectPlural: "sparrows", predicatePhrase: "sparrows" } } },
] as const satisfies readonly TermDefinition[];

export type BuiltInTermId = (typeof BUILT_IN_TERMS)[number]["id"];

export function isBuiltInTermId(value: string): value is BuiltInTermId {
  return BUILT_IN_TERMS.some(({ id }) => id === value);
}

export function getBuiltInTerm(termId: TermId): TermDefinition {
  const term = BUILT_IN_TERMS.find(({ id }) => id === termId);
  if (term === undefined) {
    throw new Error(`Unknown built-in term: "${termId}".`);
  }
  return term;
}

export function getTermDisplayName(
  term: TermDefinition,
  locale: Locale,
): string {
  return locale === "ja"
    ? term.labels.ja.nounPhrase
    : term.labels.en.subjectPlural;
}

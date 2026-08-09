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
  { id: "chicken", labels: { ja: { nounPhrase: "鶏" }, en: { subjectPlural: "chickens", predicatePhrase: "chickens" } } },
  { id: "star", labels: { ja: { nounPhrase: "星" }, en: { subjectPlural: "stars", predicatePhrase: "stars" } } },
  { id: "diligent-student", labels: { ja: { nounPhrase: "勤勉な学生" }, en: { subjectPlural: "diligent students", predicatePhrase: "diligent students" } } },
  { id: "rose", labels: { ja: { nounPhrase: "バラ" }, en: { subjectPlural: "roses", predicatePhrase: "roses" } } },
  { id: "ignorant-student", labels: { ja: { nounPhrase: "無知な学生" }, en: { subjectPlural: "ignorant students", predicatePhrase: "ignorant students" } } },
  { id: "soldier", labels: { ja: { nounPhrase: "兵士" }, en: { subjectPlural: "soldiers", predicatePhrase: "soldiers" } } },
  { id: "river", labels: { ja: { nounPhrase: "川" }, en: { subjectPlural: "rivers", predicatePhrase: "rivers" } } },
  { id: "brave-person", labels: { ja: { nounPhrase: "勇敢な人" }, en: { subjectPlural: "brave people", predicatePhrase: "brave people" } } },
  { id: "metal", labels: { ja: { nounPhrase: "金属" }, en: { subjectPlural: "metals", predicatePhrase: "metals" } } },
  { id: "child", labels: { ja: { nounPhrase: "子ども" }, en: { subjectPlural: "children", predicatePhrase: "children" } } },
  { id: "patient-person", labels: { ja: { nounPhrase: "忍耐強い人" }, en: { subjectPlural: "patient people", predicatePhrase: "patient people" } } },
  { id: "philosopher", labels: { ja: { nounPhrase: "哲学者" }, en: { subjectPlural: "philosophers", predicatePhrase: "philosophers" } } },
  { id: "logical-person", labels: { ja: { nounPhrase: "論理的な人" }, en: { subjectPlural: "logical people", predicatePhrase: "logical people" } } },
  { id: "musical-instrument", labels: { ja: { nounPhrase: "楽器" }, en: { subjectPlural: "musical instruments", predicatePhrase: "musical instruments" } } },
  { id: "island", labels: { ja: { nounPhrase: "島" }, en: { subjectPlural: "islands", predicatePhrase: "islands" } } },
  { id: "judge", labels: { ja: { nounPhrase: "裁判官" }, en: { subjectPlural: "judges", predicatePhrase: "judges" } } },
  { id: "tree", labels: { ja: { nounPhrase: "木" }, en: { subjectPlural: "trees", predicatePhrase: "trees" } } },
  { id: "bridge", labels: { ja: { nounPhrase: "橋" }, en: { subjectPlural: "bridges", predicatePhrase: "bridges" } } },
  { id: "picturesque-thing", labels: { ja: { nounPhrase: "絵になるもの" }, en: { subjectPlural: "picturesque things", predicatePhrase: "picturesque things" } } },
  { id: "book", labels: { ja: { nounPhrase: "本" }, en: { subjectPlural: "books", predicatePhrase: "books" } } },
  { id: "exciting-book", labels: { ja: { nounPhrase: "刺激的な本" }, en: { subjectPlural: "exciting books", predicatePhrase: "exciting books" } } },
  { id: "dream", labels: { ja: { nounPhrase: "夢" }, en: { subjectPlural: "dreams", predicatePhrase: "dreams" } } },
  { id: "egg", labels: { ja: { nounPhrase: "卵" }, en: { subjectPlural: "eggs", predicatePhrase: "eggs" } } },
  { id: "planet", labels: { ja: { nounPhrase: "惑星" }, en: { subjectPlural: "planets", predicatePhrase: "planets" } } },
  { id: "canary", labels: { ja: { nounPhrase: "カナリア" }, en: { subjectPlural: "canaries", predicatePhrase: "canaries" } } },
  { id: "oyster", labels: { ja: { nounPhrase: "カキ" }, en: { subjectPlural: "oysters", predicatePhrase: "oysters" } } },
  { id: "pig", labels: { ja: { nounPhrase: "豚" }, en: { subjectPlural: "pigs", predicatePhrase: "pigs" } } },
  { id: "lamb", labels: { ja: { nounPhrase: "子羊" }, en: { subjectPlural: "lambs", predicatePhrase: "lambs" } } },
  { id: "duck", labels: { ja: { nounPhrase: "アヒル" }, en: { subjectPlural: "ducks", predicatePhrase: "ducks" } } },
  { id: "graceful-creature", labels: { ja: { nounPhrase: "優雅な生き物" }, en: { subjectPlural: "graceful creatures", predicatePhrase: "graceful creatures" } } },
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

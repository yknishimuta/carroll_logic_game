export type TutorialSourceRelation = "direct" | "derived" | "application";

export type TutorialSourceId =
  | "symbolic-logic-i-iii-i"
  | "symbolic-logic-i-iii-ii"
  | "symbolic-logic-i-iii-iii-2"
  | "symbolic-logic-i-iii-iii-3"
  | "symbolic-logic-i-iv-i"
  | "symbolic-logic-i-iv-ii"
  | "symbolic-logic-i-iv-iii"
  | "symbolic-logic-i-iv-iv"
  | "symbolic-logic-i-v-i"
  | "symbolic-logic-i-v-ii-2";

export type TutorialSourceWork = "symbolic-logic-part-i";

export type TutorialSourceReference =
  | {
      readonly relation: "direct" | "derived";
      readonly sourceId: TutorialSourceId;
    }
  | {
      readonly relation: "application";
      readonly sourceId: null;
    };

export interface TutorialSourceEntry {
  readonly id: TutorialSourceId;
  readonly work: TutorialSourceWork;
  readonly locator: string;
  readonly page: number | null;
  readonly labels: {
    readonly ja: string;
    readonly en: string;
  };
  readonly notes: {
    readonly ja: string | null;
    readonly en: string | null;
  };
}

export interface TutorialSourceWorkEntry {
  readonly id: TutorialSourceWork;
  readonly title: string;
  readonly edition: {
    readonly ja: string;
    readonly en: string;
  };
}

export const TUTORIAL_SOURCE_WORKS:
  readonly TutorialSourceWorkEntry[] = [{
    id: "symbolic-logic-part-i",
    title: "Symbolic Logic, Part I: Elementary",
    edition: {
      ja: "第4版、Macmillan、1897年（Project Gutenberg EBook #28696）",
      en: "Fourth Edition, Macmillan, 1897 (Project Gutenberg EBook #28696)",
    },
  }];

export const TUTORIAL_SOURCE_ENTRIES:
  readonly TutorialSourceEntry[] = [
    {
      id: "symbolic-logic-i-iii-i",
      work: "symbolic-logic-part-i",
      locator: "I.III.I",
      page: 22,
      labels: {
        ja: "Part I・Book III・Chapter I",
        en: "Part I, Book III, Chapter I",
      },
      notes: {
        ja: "対象領域をx／x′、y／y′へ分け、各セルを割り当てる説明。",
        en: "Divides the universe into x/x′ and y/y′ and assigns their cells.",
      },
    },
    {
      id: "symbolic-logic-i-iii-ii",
      work: "symbolic-logic-part-i",
      locator: "I.III.II",
      page: 26,
      labels: {
        ja: "Part I・Book III・Chapter II",
        en: "Part I, Book III, Chapter II",
      },
      notes: {
        ja: "存在、空、二セル間の境界に置く存在駒の意味。",
        en: "Defines occupied, empty, and boundary existence counters.",
      },
    },
    {
      id: "symbolic-logic-i-iii-iii-2",
      work: "symbolic-logic-part-i",
      locator: "I.III.III.2",
      page: 28,
      labels: {
        ja: "Part I・Book III・Chapter III §2",
        en: "Part I, Book III, Chapter III §2",
      },
      notes: {
        ja: "存在命題を二文字図へ表す規則。",
        en: "Represents propositions of existence on the biliteral diagram.",
      },
    },
    {
      id: "symbolic-logic-i-iii-iii-3",
      work: "symbolic-logic-part-i",
      locator: "I.III.III.3",
      page: 30,
      labels: {
        ja: "Part I・Book III・Chapter III §3",
        en: "Part I, Book III, Chapter III §3",
      },
      notes: {
        ja: "関係命題とAll命題の二重命題としての表現。",
        en: "Represents propositions of relation and All as a double proposition.",
      },
    },
    {
      id: "symbolic-logic-i-iv-i",
      work: "symbolic-logic-part-i",
      locator: "I.IV.I",
      page: 39,
      labels: {
        ja: "Part I・Book IV・Chapter I",
        en: "Part I, Book IV, Chapter I",
      },
      notes: {
        ja: "二文字図を第三項m／m′で分けた三文字図の8セル。",
        en: "Subdivides the biliteral diagram by m/m′ into eight cells.",
      },
    },
    {
      id: "symbolic-logic-i-iv-ii",
      work: "symbolic-logic-part-i",
      locator: "I.IV.II",
      page: 43,
      labels: {
        ja: "Part I・Book IV・Chapter II",
        en: "Part I, Book IV, Chapter II",
      },
      notes: {
        ja: "二項命題を三文字図上の二セルへ表す規則。",
        en: "Represents two-term propositions across cells of the triliteral diagram.",
      },
    },
    {
      id: "symbolic-logic-i-iv-iii",
      work: "symbolic-logic-part-i",
      locator: "I.IV.III",
      page: 50,
      labels: {
        ja: "Part I・Book IV・Chapter III",
        en: "Part I, Book IV, Chapter III",
      },
      notes: {
        ja: "二前提を同じ図へ統合し、片側が空の境界Iを確定する例。",
        en: "Combines two premises and resolves a boundary I when one side is empty.",
      },
    },
    {
      id: "symbolic-logic-i-iv-iv",
      work: "symbolic-logic-part-i",
      locator: "I.IV.IV",
      page: 53,
      labels: {
        ja: "Part I・Book IV・Chapter IV",
        en: "Part I, Book IV, Chapter IV",
      },
      notes: {
        ja: "三文字図から中項を除いた二文字図へ情報を移す規則。",
        en: "Transfers information from a triliteral diagram to a biliteral diagram.",
      },
    },
    {
      id: "symbolic-logic-i-v-i",
      work: "symbolic-logic-part-i",
      locator: "I.V.I",
      page: 56,
      labels: {
        ja: "Part I・Book V・Chapter I",
        en: "Part I, Book V, Chapter I",
      },
      notes: {
        ja: "前提、結論、消去項（Eliminands）の定義。",
        en: "Defines premises, conclusions, and eliminands.",
      },
    },
    {
      id: "symbolic-logic-i-v-ii-2",
      work: "symbolic-logic-part-i",
      locator: "I.V.II.2",
      page: 60,
      labels: {
        ja: "Part I・Book V・Chapter II §2",
        en: "Part I, Book V, Chapter II §2",
      },
      notes: {
        ja: "二前提から結論を求める三段論法問題の規則。",
        en: "Rules for deriving a conclusion from a pair of premises.",
      },
    },
  ];

export function getTutorialSourceEntry(
  sourceId: TutorialSourceId,
): TutorialSourceEntry {
  const entry = TUTORIAL_SOURCE_ENTRIES.find(({ id }) => id === sourceId);
  if (entry === undefined) {
    throw new Error(`Unknown tutorial source ID: "${sourceId}".`);
  }
  return entry;
}

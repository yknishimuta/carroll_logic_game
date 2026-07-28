import { getBuiltInProblem } from "../data/problems";
import {
  renderBiliteralDiagramSvg,
  renderTriliteralDiagramSvg,
} from "../diagram/svgRenderer";
import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../domain/counterPlacement";
import type { Locale } from "../domain/locale";
import { computeProblem } from "../app/problemComputation";
import {
  getTutorialContent,
  type TutorialTable,
} from "./content";
import {
  formatTutorialSourcePage,
  getTutorialSourceEntry,
  getTutorialSourceWork,
  tutorialSourceAnchorId,
  type TutorialSourceId,
  type TutorialSourceReference,
  type TutorialSourceRelation,
} from "./sourceReferences";

export interface TutorialDiagramViewModel {
  readonly id: string;
  readonly heading: string;
  readonly description: string;
  readonly svg: string;
  readonly kind: "triliteral" | "biliteral";
  readonly placements:
    | TriliteralCounterPlacements
    | BiliteralCounterPlacements;
}

export interface TutorialCitationViewModel {
  readonly href: string | null;
  readonly label: string;
  readonly relation: TutorialSourceRelation;
}

export interface TutorialRuleSourceViewModel {
  readonly id: string;
  readonly label: string;
  readonly citations: readonly TutorialCitationViewModel[];
}

export interface TutorialSectionViewModel {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly lists?: readonly (readonly string[])[];
  readonly diagrams: readonly TutorialDiagramViewModel[];
  readonly tables?: readonly TutorialTable[];
  readonly ruleSources: readonly TutorialRuleSourceViewModel[];
}

export interface TutorialSourceEntryViewModel {
  readonly id: string;
  readonly workTitle: string;
  readonly edition: string;
  readonly locator: string;
  readonly locationLabel: string;
  readonly pageLabel: string | null;
  readonly note: string | null;
}

export interface TutorialViewModel {
  readonly locale: Locale;
  readonly title: string;
  readonly documentTitle: string;
  readonly skipLinkLabel: string;
  readonly backToGameLabel: string;
  readonly languageLabel: string;
  readonly tableOfContentsLabel: string;
  readonly notice: string;
  readonly sections: readonly TutorialSectionViewModel[];
  readonly sourceReferencesHeading: string;
  readonly sourceReferencesDescription: string;
  readonly sourceEntries: readonly TutorialSourceEntryViewModel[];
}

const emptyTriliteral: TriliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};

const emptyBiliteral: BiliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};

const boundaryExample: TriliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [{
    kind: "existence",
    sourceIds: ["tutorial-boundary"],
    anchor: {
      type: "boundary",
      cells: ["SMP", "sMP"],
      partitionRole: "S",
    },
  }],
};

const resolvedExample: TriliteralCounterPlacements = {
  emptinessCounters: [{
    kind: "emptiness",
    anchor: { type: "cell", cell: "sMP" },
  }],
  existenceCounters: [{
    kind: "existence",
    sourceIds: ["tutorial-resolved"],
    anchor: { type: "cell", cell: "SMP" },
  }],
};

type DiagramText = Readonly<Record<
  "empty" | "boundary" | "resolved" | "projection" | "first" | "combined" | "conclusion",
  readonly [string, string]
>>;

function diagramText(locale: Locale): DiagramText {
  return locale === "ja" ? {
    empty: ["空の三文字図", "S・M・Pで分かれた8領域。駒はまだありません。"],
    boundary: ["未確定の境界I", "IはSMPとsMPのどちらか一方に存在します。"],
    resolved: ["片側が空になった後", "sMPがOで空になったため、IはSMPへ確定します。"],
    projection: ["空の二文字結論図", "M／M′をまとめると、SとPによる4領域になります。"],
    first: ["Barbara：第一前提", "All M are Pを表す既存の第一前提計算結果です。"],
    combined: ["Barbara：統合前提", "二つの前提を反映した既存の統合計算結果です。"],
    conclusion: ["Barbara：結論", "Mを消去した既存の結論計算結果です。"],
  } : {
    empty: ["Empty triliteral diagram", "Eight regions divided by S, M, and P, with no counters yet."],
    boundary: ["Unresolved boundary I", "I exists in either SMP or sMP, but not yet a determined side."],
    resolved: ["After one side becomes empty", "Because sMP has O, the I is fixed in SMP."],
    projection: ["Empty biliteral conclusion diagram", "After merging M/M′, S and P form four regions."],
    first: ["Barbara: first premise", "The existing computation for the first premise All M are P."],
    combined: ["Barbara: combined premises", "The existing computation after combining both premises."],
    conclusion: ["Barbara: conclusion", "The existing conclusion computation after eliminating M."],
  };
}

function createDiagram(
  id: string,
  text: readonly [string, string],
  kind: "triliteral" | "biliteral",
  placements: TriliteralCounterPlacements | BiliteralCounterPlacements,
): TutorialDiagramViewModel {
  const svg = kind === "triliteral"
    ? renderTriliteralDiagramSvg(placements as TriliteralCounterPlacements, {
        accessibleLabel: text[0],
        description: text[1],
      })
    : renderBiliteralDiagramSvg(placements as BiliteralCounterPlacements, {
        accessibleLabel: text[0],
        description: text[1],
      });
  return { id, heading: text[0], description: text[1], svg, kind, placements };
}

function createCitation(
  reference: TutorialSourceReference,
  locale: Locale,
): TutorialCitationViewModel {
  if (reference.relation === "application") {
    return {
      href: null,
      label: locale === "ja"
        ? "（本アプリの操作仕様）"
        : "(Application behavior)",
      relation: reference.relation,
    };
  }
  const entry = getTutorialSourceEntry(reference.sourceId);
  const label = locale === "ja"
    ? reference.relation === "direct"
      ? `（Symbolic Logic ${entry.locator}）`
      : `（Symbolic Logic ${entry.locator}に基づく整理）`
    : reference.relation === "direct"
      ? `(Source: Symbolic Logic ${entry.locator})`
      : `(Derived from Symbolic Logic ${entry.locator})`;
  return {
    href: `#${tutorialSourceAnchorId(entry.id)}`,
    label,
    relation: reference.relation,
  };
}

export function createTutorialViewModel(locale: Locale): TutorialViewModel {
  const content = getTutorialContent(locale);
  const text = diagramText(locale);
  const barbara = computeProblem(getBuiltInProblem("barbara-aaa1"));
  const usedSourceIds = new Set<TutorialSourceId>();
  const diagrams = new Map<string, readonly TutorialDiagramViewModel[]>([
    ["eight-regions", [
      createDiagram("empty-triliteral", text.empty, "triliteral", emptyTriliteral),
    ]],
    ["boundary-existence", [
      createDiagram("boundary-unresolved", text.boundary, "triliteral", boundaryExample),
      createDiagram("boundary-resolved", text.resolved, "triliteral", resolvedExample),
    ]],
    ["eliminate-middle", [
      createDiagram("empty-biliteral", text.projection, "biliteral", emptyBiliteral),
    ]],
    ["barbara", [
      createDiagram("barbara-first", text.first, "triliteral", barbara.firstPremisePlacements),
      createDiagram("barbara-combined", text.combined, "triliteral", barbara.combinedPlacements),
      createDiagram("barbara-conclusion", text.conclusion, "biliteral", barbara.conclusionPlacements),
    ]],
  ]);
  const sections = content.sections.map((section) => ({
    ...section,
    diagrams: diagrams.get(section.id) ?? [],
    ruleSources: section.ruleSources.map((rule) => {
      rule.sourceReferences.forEach((reference) => {
        if (reference.sourceId !== null) usedSourceIds.add(reference.sourceId);
      });
      return {
        id: rule.id,
        label: rule.label,
        citations: rule.sourceReferences.map((reference) =>
          createCitation(reference, locale)
        ),
      };
    }),
  }));
  const sourceEntries = [...usedSourceIds].map((sourceId) => {
    const entry = getTutorialSourceEntry(sourceId);
    const work = getTutorialSourceWork(entry.work);
    return {
      id: tutorialSourceAnchorId(entry.id),
      workTitle: work.title,
      edition: work.edition[locale],
      locator: entry.locator,
      locationLabel: entry.labels[locale],
      pageLabel: formatTutorialSourcePage(entry.page, locale),
      note: entry.notes[locale],
    };
  });
  return {
    locale,
    title: content.title,
    documentTitle: content.documentTitle,
    skipLinkLabel: content.skipLink,
    backToGameLabel: content.backToGame,
    languageLabel: content.languageLabel,
    tableOfContentsLabel: content.contentsLabel,
    notice: content.notice,
    sections,
    sourceReferencesHeading: locale === "ja"
      ? "原著参照"
      : "Source References",
    sourceReferencesDescription: locale === "ja"
      ? "章節番号を主たる位置情報とし、確認できた印刷ページを補助情報として示します。"
      : "Chapter locators are primary; verified printed pages are supplementary.",
    sourceEntries,
  };
}

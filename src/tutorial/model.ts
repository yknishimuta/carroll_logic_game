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
  type TutorialBlock,
  type TutorialContent,
  type TutorialTable,
} from "./content";
import {
  getTutorialSourceEntry,
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

export type TutorialViewBlock =
  | Exclude<TutorialBlock, { readonly kind: "diagram" }>
  | { readonly kind: "diagram"; readonly diagram: TutorialDiagramViewModel };

export interface TutorialSectionViewModel {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly lists?: readonly (readonly string[])[];
  readonly diagrams: readonly TutorialDiagramViewModel[];
  readonly tables?: readonly TutorialTable[];
  readonly blocks?: readonly TutorialViewBlock[];
  readonly locators: readonly string[];
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
  readonly bibliography: TutorialContent["bibliography"];
  readonly bibliographyLabel: string;
  readonly locatorExplanation: string;
  readonly relatedPassagesLabel: string;
  readonly sections: readonly TutorialSectionViewModel[];
}

const emptyTriliteral: TriliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};

const emptyBiliteral: BiliteralCounterPlacements = {
  emptinessCounters: [],
  existenceCounters: [],
};

// The tutorial's existing Barbara figure intentionally illustrates the
// canonical A conclusion only. The game diagram uses the complete projected
// biliteral state and may therefore display additional existence information.
const barbaraTutorialConclusion: BiliteralCounterPlacements = {
  emptinessCounters: [{
    kind: "emptiness",
    anchor: { type: "cell", cell: "Sp" },
  }],
  existenceCounters: [{
    kind: "existence",
    sourceIds: ["second-premise"],
    anchor: { type: "cell", cell: "SP" },
  }],
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

const boundaryWithOExample: TriliteralCounterPlacements = {
  emptinessCounters: [{
    kind: "emptiness",
    anchor: { type: "cell", cell: "SMP" },
  }],
  existenceCounters: boundaryExample.existenceCounters,
};

const resolvedExample: TriliteralCounterPlacements = {
  emptinessCounters: [{
    kind: "emptiness",
    anchor: { type: "cell", cell: "SMP" },
  }],
  existenceCounters: [{
    kind: "existence",
    sourceIds: ["tutorial-resolved"],
    anchor: { type: "cell", cell: "sMP" },
  }],
};

type DiagramText = Readonly<Record<
  "empty" | "boundary" | "additional" | "resolved" | "projection" | "first" | "combined" | "conclusion",
  readonly [string, string]
>>;

function diagramText(locale: Locale): DiagramText {
  return locale === "ja" ? {
    empty: ["空の三文字図", "S／S′、M／M′、P／P′の三つの二分によって作られる8領域です。駒はまだ置かれていません。"],
    boundary: ["初期状態", "I駒はSMPとsMPの境界上にあります。"],
    additional: ["追加情報", "SMPにO駒が置かれ、SMPが空であることが分かります。"],
    resolved: ["確定後", "存在する対象はsMPにあると確定し、I駒はsMPのセル内にあります。"],
    projection: ["空の二文字図", "小項Sと大項Pの関係を表す4領域です。駒はまだ置かれていません。"],
    first: ["Barbara：第一前提", "All M are Pを表す既存の第一前提計算結果です。"],
    combined: ["Barbara：統合前提", "二つの前提を反映した既存の統合計算結果です。"],
    conclusion: ["Barbara：結論", "Mを消去した既存の結論計算結果です。"],
  } : {
    empty: ["Empty triliteral diagram", "Eight regions formed by the three divisions S/S′, M/M′, and P/P′. No counters have been placed yet."],
    boundary: ["Initial state", "The I-counter is on the boundary between SMP and sMP."],
    additional: ["Additional information", "An O-counter is placed in SMP, so SMP is known to be empty."],
    resolved: ["Resolved state", "The existing object is resolved to sMP, and the I-counter is inside the sMP cell."],
    projection: ["Empty biliteral diagram", "Four regions showing the relation between the minor term S and the major term P. No counters have been placed yet."],
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

export function createTutorialViewModel(locale: Locale): TutorialViewModel {
  const content = getTutorialContent(locale);
  const text = diagramText(locale);
  const barbara = computeProblem(getBuiltInProblem("barbara-aaa1"));
  const diagrams = new Map<string, readonly TutorialDiagramViewModel[]>([
    ["eight-regions", [
      createDiagram("empty-triliteral", text.empty, "triliteral", emptyTriliteral),
    ]],
    ["biliteral-diagram", [
      createDiagram("empty-biliteral-basics", text.projection, "biliteral", emptyBiliteral),
    ]],
    ["boundary-existence", [
      createDiagram("boundary-unresolved", text.boundary, "triliteral", boundaryExample),
      createDiagram("boundary-with-o", text.additional, "triliteral", boundaryWithOExample),
      createDiagram("boundary-resolved", text.resolved, "triliteral", resolvedExample),
    ]],
    ["barbara", [
      createDiagram("barbara-first", text.first, "triliteral", barbara.firstPremisePlacements),
      createDiagram("barbara-combined", text.combined, "triliteral", barbara.combinedPlacements),
      createDiagram("barbara-conclusion", text.conclusion, "biliteral", barbaraTutorialConclusion),
    ]],
  ]);
  const sections = content.sections.map((section) => {
    const { blocks: contentBlocks, ...sectionWithoutBlocks } = section;
    const sectionDiagrams = diagrams.get(section.id) ?? [];
    const blocks = contentBlocks?.map((block): TutorialViewBlock => {
      if (block.kind !== "diagram") return block;
      const diagram = sectionDiagrams.find(({ id }) => id === block.diagramId);
      if (diagram === undefined) {
        throw new Error(`Missing tutorial diagram: ${block.diagramId}`);
      }
      return { kind: "diagram", diagram };
    });
    const blockDiagramIds = new Set(
      contentBlocks?.flatMap((block) => block.kind === "diagram" ? [block.diagramId] : []) ?? [],
    );
    return {
    ...sectionWithoutBlocks,
    heading: section.heading.replace(/^\d+\.\s+/, ""),
    ...(blocks === undefined ? {} : { blocks }),
    diagrams: sectionDiagrams.filter(({ id }) => !blockDiagramIds.has(id)),
    locators: [...new Set(section.ruleSources.flatMap((rule) =>
      rule.sourceReferences.flatMap((reference) =>
        reference.sourceId === null
          ? []
          : [`(${getTutorialSourceEntry(reference.sourceId).locator})`]
      )
    ))],
  }});
  return {
    locale,
    title: content.title,
    documentTitle: content.documentTitle,
    skipLinkLabel: content.skipLink,
    backToGameLabel: content.backToGame,
    languageLabel: content.languageLabel,
    tableOfContentsLabel: content.contentsLabel,
    notice: content.notice,
    bibliography: content.bibliography,
    bibliographyLabel: locale === "ja" ? "参照文献：" : "Reference:",
    locatorExplanation: locale === "ja"
      ? "各節末の「原著の関連箇所」は、その説明に対応する原著の箇所を示します。"
      : "The “Related passages in the original” shown at the end of each section indicate passages corresponding to that explanation.",
    relatedPassagesLabel: locale === "ja"
      ? "原著の関連箇所："
      : "Related passages in the original:",
    sections,
  };
}

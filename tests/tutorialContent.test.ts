import { describe, expect, it } from "vitest";
import {
  EN_TUTORIAL_CONTENT,
  JA_TUTORIAL_CONTENT,
} from "../src/tutorial/content";
import { abstractTerm } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
const expectedIds = [
  "syllogism-basics", "syllogism-figures-and-moods", "eight-regions", "biliteral-diagram", "counters", "proposition-rules",
  "boundary-existence", "barbara",
  "manual-operation", "common-mistakes", "quick-reference",
];

function getSection(locale: "ja" | "en", id: string) {
  const content = locale === "ja" ? JA_TUTORIAL_CONTENT : EN_TUTORIAL_CONTENT;
  const section = content.sections.find((item) => item.id === id);
  if (section === undefined) throw new Error(`Missing tutorial section: ${id}`);
  return section;
}

describe("tutorial content", () => {
  it("has the same eleven ordered sections in Japanese and English", () => {
    const bibliography = {
      author: "Lewis Carroll, ",
      title: "Symbolic Logic, Part I: Elementary",
      publication: ", 4th ed., Macmillan, 1897.",
    };
    expect(JA_TUTORIAL_CONTENT.bibliography).toEqual(bibliography);
    expect(EN_TUTORIAL_CONTENT.bibliography).toEqual(bibliography);
    expect(JA_TUTORIAL_CONTENT.sections.map(({ id }) => id)).toEqual(expectedIds);
    expect(EN_TUTORIAL_CONTENT.sections.map(({ id }) => id)).toEqual(expectedIds);
    expect(JA_TUTORIAL_CONTENT.sections).toHaveLength(11);
    expect(EN_TUTORIAL_CONTENT.sections).toHaveLength(11);
    expect(JA_TUTORIAL_CONTENT.sections.some(({ id }) => id === "combine-premises")).toBe(false);
    expect(EN_TUTORIAL_CONTENT.sections.some(({ id }) => id === "combine-premises")).toBe(false);
    expect(JSON.stringify(JA_TUTORIAL_CONTENT)).not.toContain("二つの前提を統合する");
    expect(JSON.stringify(EN_TUTORIAL_CONTENT)).not.toContain("Combining two premises");
    expect(JA_TUTORIAL_CONTENT.sections.some(({ id }) => id === "eliminate-middle")).toBe(false);
    expect(EN_TUTORIAL_CONTENT.sections.some(({ id }) => id === "eliminate-middle")).toBe(false);
  });

  it("merges prime notation and eight regions without teaching cell shorthand", () => {
    const eightJa = getSection("ja", "eight-regions");
    const eightEn = getSection("en", "eight-regions");
    expect(eightJa.heading).toBe("三文字図と領域");
    expect(eightEn.heading).toBe("Triliteral Diagrams and Regions");
    expect(JA_TUTORIAL_CONTENT.sections.some(({ id }) => id === "terms-and-primes")).toBe(false);
    expect(eightJa.tables).toBeUndefined();
    expect(eightEn.tables).toBeUndefined();
    expect(eightJa.blocks?.some((block) => block.kind === "table")).toBe(false);
    expect(eightEn.blocks?.some((block) => block.kind === "table")).toBe(false);
    for (const text of ["X′はXでないものすべて", "S′は「Sの反対語」ではない", "対象領域", "三つの二分", "SまたはS′", "MまたはM′", "PまたはP′", "2 × 2 × 2 = 8", "二つの前提", "二文字図"]) {
      expect(JSON.stringify(eightJa)).toContain(text);
    }
    for (const text of ["everything that is not X", "not an antonym", "universe of discourse", "2 × 2 × 2 = 8"]) {
      expect(JSON.stringify(eightEn)).toContain(text);
    }
    const forbidden = ["三文字図のセル略記", "Triliteral Cell Abbreviations", "早見表", "lowercase s, m, and p", "SmP"];
    for (const text of forbidden) {
      expect(JSON.stringify(eightJa)).not.toContain(text);
      expect(JSON.stringify(eightEn)).not.toContain(text);
    }
    expect(eightJa.blocks?.filter((block) => block.kind === "diagram").map((block) => block.kind === "diagram" ? block.diagramId : null)).toEqual(["empty-triliteral"]);
    const biliteralJa = getSection("ja", "biliteral-diagram");
    const biliteralEn = getSection("en", "biliteral-diagram");
    expect(biliteralJa.heading).toBe("二文字図と結論の読み取り");
    expect(biliteralEn.heading).toBe("The Biliteral Diagram and Reading the Conclusion");
    expect(biliteralJa.blocks?.filter((block) => block.kind === "diagram")).toHaveLength(1);
    expect(biliteralJa.tables).toBeUndefined();
    expect(biliteralEn.tables).toBeUndefined();
    expect(biliteralJa.blocks?.filter((block) => block.kind === "table")).toHaveLength(1);
    expect(biliteralEn.blocks?.filter((block) => block.kind === "table")).toHaveLength(1);
    expect(biliteralJa.blocks?.map(({ kind }) => kind)).toEqual(biliteralEn.blocks?.map(({ kind }) => kind));
    const biliteralText = JSON.stringify(biliteralJa);
    for (const text of ["小項Sと大項Pの関係", "MとM′の区別をまとめ", "この操作を「Mの消去」と呼びます", "M／M′の区別を無視", "対応する二つの三文字図のセル", "一つの二文字図のセル", "区別を結論では使わない", "8領域の三文字図から4領域", "SでありPである二つの領域", "SP（SでありPである）", "対応する二つの三文字図のセルが両方とも空"]) {
      expect(biliteralText).toContain(text);
    }
    expect(biliteralText).toContain("両方とも空");
    for (const forbidden of ["二文字図の四つの領域", "三文字図から二文字図への対応", "略記", "集合表記", "存在が確定していれば"]) {
      expect(biliteralText).not.toContain(forbidden);
      expect(JSON.stringify(biliteralEn)).not.toContain(forbidden);
    }
    const jaTableBlock = biliteralJa.blocks?.find((block) => block.kind === "table");
    const enTableBlock = biliteralEn.blocks?.find((block) => block.kind === "table");
    expect(jaTableBlock?.kind === "table" ? jaTableBlock.table : undefined).toEqual({
      caption: "中項Mを消去する対応",
      headers: ["三文字図", "二文字結論図"],
      rows: [["SMP と SmP", "SP"], ["SMp と Smp", "Sp"], ["sMP と smP", "sP"], ["sMp と smp", "sp"]],
    });
    expect(enTableBlock?.kind === "table" ? enTableBlock.table.rows : undefined).toEqual([
      ["SMP and SmP", "SP"], ["SMp and Smp", "Sp"], ["sMP and smP", "sP"], ["sMp and smp", "sp"],
    ]);
    expect(JSON.stringify(biliteralEn)).not.toContain("Abbreviation");
    expect(JSON.stringify(biliteralEn)).not.toContain("Set notation");
    for (const text of [
      "完全な結論が複数の命題になる場合",
      "二文字図に複数の独立した情報が確定している場合、完全な結論が二つ以上の命題からなることがあります。",
      "前提から導ける命題をすべて列挙するという意味ではありません",
      "二命題を合わせて一つの完全な結論を表します",
      "前提",
      "完全な結論",
      "すべての S は M である。",
      "すべての P は M′ である。",
      "すべての S は P′ である。",
      "すべての P は S′ である。",
    ]) expect(biliteralText).toContain(text);
    const biliteralEnText = JSON.stringify(biliteralEn);
    for (const text of [
      "When a Complete Conclusion Needs Multiple Propositions",
      "When multiple independent pieces of information are determined in the biliteral diagram",
      "does not mean that every proposition implied by the premises is listed",
      "together they express one complete conclusion",
      "Premises",
      "Complete conclusion",
      "All S are M.",
      "All P are M′.",
      "All S are P′.",
      "All P are S′.",
    ]) expect(biliteralEnText).toContain(text);
    const jaLists = biliteralJa.blocks?.filter((block) => block.kind === "list") ?? [];
    const enLists = biliteralEn.blocks?.filter((block) => block.kind === "list") ?? [];
    expect(jaLists.map((block) => block.kind === "list" ? [block.ordered, block.items.length] : null))
      .toEqual(enLists.map((block) => block.kind === "list" ? [block.ordered, block.items.length] : null));
    expect(jaLists.filter((block) => block.kind === "list" && block.items.length === 2))
      .toHaveLength(2);
    expect(enLists.filter((block) => block.kind === "list" && block.items.length === 2))
      .toHaveLength(2);
    const flow = biliteralJa.blocks?.find((block) =>
      block.kind === "list" && block.ordered && block.items.length === 4
    );
    expect(flow?.kind === "list" ? flow.items : []).toHaveLength(4);
    expect(flow?.kind === "list" ? flow.items[1] : undefined)
      .toBe("第二前提を同じ三文字図へ加え、二つの前提を組み合わせる");
    const enFlow = biliteralEn.blocks?.find((block) =>
      block.kind === "list" && block.ordered && block.items.length === 4
    );
    expect(enFlow?.kind === "list" ? enFlow.items : []).toHaveLength(4);
    expect(biliteralJa.ruleSources.map(({ id }) => id)).toEqual([
      "eliminate-middle", "project-empty", "multiple-complete-conclusions",
      "complete-vs-incomplete-conclusion",
    ]);
    expect(biliteralEn.ruleSources.map(({ id }) => id)).toEqual([
      "eliminate-middle", "project-empty", "multiple-complete-conclusions",
      "complete-vs-incomplete-conclusion",
    ]);
    const blocks = biliteralJa.blocks ?? [];
    const definitionIndex = blocks.findIndex((block) => block.kind === "paragraph" && block.text.includes("この操作を「Mの消去」"));
    const diagramIndex = blocks.findIndex((block) => block.kind === "diagram");
    const tableIndex = blocks.findIndex((block) => block.kind === "table");
    const emptyRuleIndex = blocks.findIndex((block) => block.kind === "paragraph" && block.text.includes("両方とも空"));
    const flowIndex = blocks.findIndex((block) =>
      block.kind === "list" && block.ordered && block.items.length === 4
    );
    expect(definitionIndex).toBeLessThan(diagramIndex);
    expect(diagramIndex).toBeLessThan(tableIndex);
    expect(tableIndex).toBeLessThan(emptyRuleIndex);
    expect(emptyRuleIndex).toBeLessThan(flowIndex);
    expect(JA_TUTORIAL_CONTENT.sections.flatMap(({ blocks: sectionBlocks }) => sectionBlocks ?? [])
      .filter((block) => block.kind === "diagram" && block.diagramId === "empty-biliteral-basics")).toHaveLength(1);
    expect(JA_TUTORIAL_CONTENT.sections.flatMap(({ blocks: sectionBlocks }) => sectionBlocks ?? [])
      .filter((block) => block.kind === "table" && block.table.caption === "中項Mを消去する対応")).toHaveLength(1);
    expect(JSON.stringify(JA_TUTORIAL_CONTENT)).not.toContain("Mを消去して結論図を作る");
    expect(getSection("ja", "proposition-rules").tables?.[0]?.rows).toHaveLength(4);
  });

  it("explains O and I counters without identifying separate existence requirements", () => {
    const ja = getSection("ja", "counters");
    const en = getSection("en", "counters");
    expect(ja.id).toBe("counters");
    expect(en.id).toBe("counters");
    expect(ja.heading).toBe("4. O駒とI駒");
    expect(en.heading).toBe("4. O and I counters");
    expect(ja.paragraphs).toHaveLength(5);
    expect(en.paragraphs).toHaveLength(5);
    expect(ja.paragraphs.map(() => "paragraph")).toEqual(en.paragraphs.map(() => "paragraph"));
    for (const text of [
      "その領域が空", "対象が一つも存在しない", "少なくとも一つの対象",
      "正確なセルが決まっている場合はセル内", "二つのセルのどちらにあるかまでしか分からない場合",
      "その境界上", "両方のセルに対象が存在することを意味するのではありません",
      "どちらか一方のセル", "まだ確定していない", "別々の前提から生じる存在要求",
      "同じ対象についてのものとは限りません", "複数の存在要求",
      "一つのI駒にまとめて表示", "同一の対象を表すという意味ではありません",
    ]) expect(ja.paragraphs.join(" ")).toContain(text);
    for (const text of [
      "region is empty", "no object", "at least one object", "exact cell is determined",
      "boundary between them", "does not mean that objects exist in both cells",
      "one of the two cells", "Existence requirements arising from different premises",
      "do not necessarily concern the same object", "several existence requirements",
      "single I-counter", "one and the same object",
    ]) expect(en.paragraphs.join(" ")).toContain(text);
    expect(ja.paragraphs.join(" ")).not.toContain("I命題");
    expect(en.paragraphs.join(" ")).not.toContain("I-proposition");
    for (const forbidden of ["境界上のI駒は両セルに存在する", "別々の前提のI命題は同じ対象である", "一つに表示されたI駒は一つの対象である"]) {
      expect(ja.paragraphs.join(" ")).not.toContain(forbidden);
    }
    expect(ja.ruleSources.map(({ id }) => id)).toEqual([
      "empty-counter", "existence-counter", "boundary-existence-meaning", "counter-display-consolidation",
    ]);
    expect(ja.ruleSources.at(-1)?.sourceReferences).toEqual([{ relation: "application", sourceId: null }]);
    expect(en.ruleSources.map(({ id }) => id)).toEqual(ja.ruleSources.map(({ id }) => id));
    expect(getSection("ja", "proposition-rules").id).toBe("proposition-rules");
    expect(getSection("ja", "boundary-existence").id).toBe("boundary-existence");
  });

  it("explains each proposition placement before the retained four-row table", () => {
    const ja = getSection("ja", "proposition-rules");
    const en = getSection("en", "proposition-rules");
    expect(JA_TUTORIAL_CONTENT.sections.indexOf(ja)).toBe(5);
    expect(EN_TUTORIAL_CONTENT.sections.indexOf(en)).toBe(5);
    expect(ja.id).toBe("proposition-rules");
    expect(en.id).toBe("proposition-rules");
    expect(ja.paragraphs).toEqual([]);
    expect(en.paragraphs).toEqual([]);
    const jaBlocks = ja.blocks ?? [];
    const enBlocks = en.blocks ?? [];
    const jaText = jaBlocks.flatMap((block) =>
      block.kind === "paragraph" || block.kind === "subheading"
        ? [block.text]
        : block.kind === "list" ? block.items : []
    ).join(" ");
    const enText = enBlocks.flatMap((block) =>
      block.kind === "paragraph" || block.kind === "subheading"
        ? [block.text]
        : block.kind === "list" ? block.items : []
    ).join(" ");
    expect(jaText).toContain("All（すべて）で始まる命題について");
    expect(jaText).toContain("二重命題（Double Proposition）");
    expect(jaText).toContain("Some M are P");
    expect(jaText).toContain("No M are P′");
    expect(jaText).toContain("存在を示すI駒と、空であることを示すO駒の両方");
    expect(jaText).toContain("全称肯定（All M are P）：");
    expect(jaText).toContain("No M are P′から、M ∩ P′は空なので、SMpとsMpにO駒");
    expect(jaText).toContain("Some M are Pから、M ∩ Pには少なくとも一つの対象");
    expect(jaText).toContain("SMPとsMPの境界上にI駒");
    for (const unchanged of [
      "全称否定（No M are P）：",
      "特称肯定（Some M are P）：",
      "特称否定（Some M are not P）：",
    ]) expect(jaText).toContain(unchanged);
    expect(enText).toContain("About Propositions Beginning with All");
    expect(enText).toContain("Double Proposition");
    expect(enText).toContain("Some M are P");
    expect(enText).toContain("No M are P′");
    expect(enText).toContain("I-counter");
    expect(enText).toContain("O-counters");
    const jaList = jaBlocks.find((block) => block.kind === "list");
    const enList = enBlocks.find((block) => block.kind === "list");
    expect(jaList?.kind === "list" ? jaList.items : null)
      .toEqual(["Some M are P", "No M are P′"]);
    expect(enList?.kind === "list" ? enList.items : null)
      .toEqual(["Some M are P", "No M are P′"]);
    const jaTable = ja.tables?.[0];
    const enTable = en.tables?.[0];
    expect(jaTable?.caption).toBe("命題形式と領域の対応");
    expect(enTable?.caption).toBe("Correspondence Between Proposition Forms and Regions");
    expect(JSON.stringify(ja)).not.toContain("キャロル方式の四命題");
    expect(JSON.stringify(en)).not.toContain("Four proposition forms");
    expect(jaTable?.rows).toEqual([
      ["A", "全称肯定 / All M are P", "O駒：SMp、sMp", "I駒：SMP／sMP境界"],
      ["E", "全称否定 / No M are P", "O駒：SMP、sMP", "なし"],
      ["I", "特称肯定 / Some M are P", "なし", "I駒：SMP／sMP境界"],
      ["O", "特称否定 / Some M are not P", "なし", "I駒：SMp／sMp境界"],
    ]);
    expect(enTable?.rows).toHaveLength(4);
    expect(enTable?.headers).toHaveLength(jaTable?.headers.length ?? 0);
    expect(enTable?.rows.every((row) => row.length === jaTable?.headers.length)).toBe(true);
    expect(ja.ruleSources[0]).toEqual({
      id: "all-double-proposition",
      label: "Allで始まる関係命題の二重命題としての構造",
      sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-ii-iii-3" }],
    });
    expect(ja.ruleSources.at(-1)).toEqual({
      id: "lowercase-cell-shorthand",
      label: "セルIDでプライムを小文字として表す",
      sourceReferences: [{ relation: "application", sourceId: null }],
    });
    expect(en.ruleSources.map(({ id }) => id)).toEqual(ja.ruleSources.map(({ id }) => id));
    expect(getSection("ja", "boundary-existence").id).toBe("boundary-existence");
  });

  it("explains how a boundary I is resolved using the SMP/sMP example", () => {
    const ja = getSection("ja", "boundary-existence");
    const en = getSection("en", "boundary-existence");
    expect(ja.id).toBe("boundary-existence");
    expect(en.id).toBe("boundary-existence");
    expect(ja.heading).toBe("6. 境界上のI駒");
    expect(en.heading).toBe("6. Boundary I counters");
    const jaText = ja.paragraphs.join(" ");
    const enText = en.paragraphs.join(" ");
    for (const text of [
      "境界上のI駒", "隣接する二つのセルのどちらか一方", "どちらであるかがまだ分からない",
      "一方のセルにO駒", "そのセルが空", "もう一方のセル内へ確定",
      "両方のセルがまだ空でない可能性", "I駒は境界上のまま",
      "根拠なく一方のセルへ確定", "別の境界へ移したり", "O駒が置かれた空のセル",
      "SMPとsMPの境界上", "SMPにO駒", "存在する対象はsMP", "sMPのセル内へ確定",
    ]) expect(jaText).toContain(text);
    for (const forbidden of ["A／B", "AへO", "B領域", "Bセル"]) {
      expect(jaText).not.toContain(forbidden);
    }
    for (const text of [
      "boundary can be resolved", "two adjacent cells", "not yet known which one",
      "O-counter is later placed", "known to be empty", "resolved into that cell",
      "both cells remain possible", "remains on the boundary", "without a logical reason",
      "different boundary", "cell marked empty", "boundary between SMP and sMP",
      "O-counter is later placed in SMP", "resolved into the sMP cell",
    ]) expect(enText).toContain(text);
    for (const forbidden of ["A/B", "A region", "B region", "cells A and B"]) {
      expect(enText).not.toContain(forbidden);
    }
    expect(ja.ruleSources).toEqual([{
      id: "boundary-i-resolution",
      label: "片側が空になった境界Iの確定",
      sourceReferences: [{ relation: "direct", sourceId: "symbolic-logic-i-iv-iii" }],
    }]);
    expect(en.ruleSources.map(({ id }) => id)).toEqual(["boundary-i-resolution"]);
  });

  it("explains Barbara step by step through the game", () => {
    const ja = getSection("ja", "barbara");
    const en = getSection("en", "barbara");
    expect(ja.id).toBe("barbara");
    expect(en.id).toBe("barbara");
    expect(ja.heading).toBe("7. ゲームによるBarbaraの説明");
    expect(en.heading).toBe("7. Barbara Explained Through the Game");
    expect(ja.heading).not.toContain("Barbaraの完全例");
    expect(en.heading).not.toContain("Complete Barbara example");
    const jaParagraphs = ja.blocks?.flatMap((block) =>
      block.kind === "paragraph" ? [block.text] : []
    ) ?? [];
    const enParagraphs = en.blocks?.flatMap((block) =>
      block.kind === "paragraph" ? [block.text] : []
    ) ?? [];
    expect(jaParagraphs.slice(0, 3)).toEqual([
      "第一前提：すべての動物は死すべきものである。",
      "第二前提：すべての人間は動物である。",
      "結論：すべての人間は死すべきものである。",
    ]);
    const jaText = jaParagraphs.join(" ");
    for (const text of [
      "S＝人間、M＝動物、P＝死すべきもの", "All M are P", "全称肯定命題",
      "O駒がSMpとsMp", "I駒がSMPとsMPの境界（S／S′境界）", "M ∩ P′は空",
      "M ∩ Pに存在する対象", "Sに属するかS′に属するかはまだ確定していない",
      "All S are M", "SmPとSmpが空", "SMPとSMpの境界（P／P′境界）",
      "SMpは第一前提によってすでに空", "I駒はSMPのセル内へ確定",
      "O駒はSMp・sMp・SmP・Smp", "I駒はSMPとsMPの境界上", "SMPのセル内",
      "中項Mを消去してM／M′の区別をまとめる", "SpにO駒", "SPにI駒",
      "「すべての人間は死すべきものである」という結論",
    ]) expect(jaText).toContain(text);
    expect(jaText).not.toContain("I命題");
    const enText = enParagraphs.join(" ");
    for (const text of [
      "First premise: All animals are mortal", "Second premise: All humans are animals",
      "Conclusion: All humans are mortal", "S = humans, M = animals, and P = mortal things",
      "All M are P", "universal affirmative proposition", "SMp and sMp",
      "boundary between SMP and sMP", "S/S′ boundary", "M ∩ P′ is empty",
      "All S are M", "SmP and Smp empty", "boundary between SMP and SMp",
      "P/P′ boundary", "resolved into the SMP cell", "SMp, sMp, SmP, and Smp",
      "I-counter inside the SMP cell", "merging the distinction between M and M′",
      "O-counter in Sp", "I-counter in SP", "All humans are mortal",
    ]) expect(enText).toContain(text);
    expect(ja.ruleSources.map(({ id }) => id)).toEqual(["barbara-stages"]);
    expect(en.ruleSources.map(({ id }) => id)).toEqual(["barbara-stages"]);

    const jaTableBlock = ja.blocks?.find((block) => block.kind === "table");
    const enTableBlock = en.blocks?.find((block) => block.kind === "table");
    const jaTable = jaTableBlock?.kind === "table" ? jaTableBlock.table : null;
    const enTable = enTableBlock?.kind === "table" ? enTableBlock.table : null;
    expect(jaTable).toEqual({
      caption: "結論の命題形式と二文字図",
      headers: ["命題形式", "集合としての条件", "二文字図での対応"],
      rows: [
        ["全称肯定（A）All S are P", "S ∩ P′ = ∅、かつキャロル方式では S ∩ P ≠ ∅", "SpにO駒、SPにI駒"],
        ["全称否定（E）No S are P", "S ∩ P = ∅", "SPにO駒"],
        ["特称肯定（I）Some S are P", "S ∩ P ≠ ∅", "SPにI駒"],
        ["特称否定（O）Some S are not P", "S ∩ P′ ≠ ∅", "SpにI駒"],
      ],
    });
    expect(enTable?.caption).toBe("Conclusion Forms and the Biliteral Diagram");
    expect(enTable?.headers).toEqual([
      "Proposition form", "Set condition", "Biliteral diagram",
    ]);
    expect(enTable?.rows).toHaveLength(4);
    const blocks = ja.blocks ?? [];
    const projectionIndex = blocks.findIndex((block) =>
      block.kind === "paragraph" && block.text.includes("二文字図ではSpにO駒、SPにI駒")
    );
    const tableIndex = blocks.findIndex((block) => block.kind === "table");
    const comparisonIndex = blocks.findIndex((block) =>
      block.kind === "paragraph" && block.text.startsWith("この表に照らすと")
    );
    const conclusionIndex = blocks.findIndex((block) =>
      block.kind === "paragraph" && block.text.includes("S＝人間、P＝死すべきもの")
    );
    expect(projectionIndex).toBeLessThan(tableIndex);
    expect(tableIndex).toBeLessThan(comparisonIndex);
    expect(comparisonIndex).toBeLessThan(conclusionIndex);
    expect(jaParagraphs.filter((text) => text.includes("という結論が得られます")))
      .toHaveLength(1);
    const biliteral = getSection("ja", "biliteral-diagram");
    expect(biliteral.blocks?.some((block) =>
      block.kind === "table" && block.table.caption === "結論の命題形式と二文字図"
    )).toBe(false);
  });

  it("lists the same eight common mistakes in Japanese and English", () => {
    const ja = getSection("ja", "common-mistakes");
    const en = getSection("en", "common-mistakes");
    expect(ja.id).toBe("common-mistakes");
    expect(en.id).toBe("common-mistakes");
    expect(ja.heading).toBe("9. よくある間違い");
    expect(en.heading).toBe("9. Common mistakes");
    expect(ja.paragraphs).toEqual(["次の間違いにご注意ください。"]);
    expect(en.paragraphs).toEqual(["Watch out for the following common mistakes."]);
    expect(ja.lists).toEqual([[
      "S′を反対語と思う → Sではないもの全体です。",
      "境界にあるI駒を両方の領域にある存在と思う → どちらか一方です。",
      "境界にあるI駒を根拠なく移す → 片側にO駒が置かれ、そのセルが空だと分かったときだけ、もう片側へ確定できます。",
      "空条件に対してO駒を一つだけ置く → 第三項によって分かれた両方のセルへ置きます。",
      "二つのI駒を同一対象と思う → 別々の存在要求かもしれません。",
      "三文字図の片方のO駒だけで、二文字図で結論をO駒にする → 対応する二つの三文字図のセルが両方ともO駒である必要があります。",
      "O駒を命題全体の偽と思う → O駒は、そのセルが空であることを示します。",
      "I駒を数字1と読む → 存在を表す英字Iです。",
    ]]);
    expect(en.lists?.[0]).toHaveLength(8);
    expect(en.lists?.[0]?.map((item) => item.split(" → ")[0])).toEqual([
      "Treating S′ as the opposite of S",
      "Treating an I-counter on a boundary as existence in both regions",
      "Moving an I-counter off a boundary without justification",
      "Placing only one O-counter for an emptiness condition",
      "Treating two I-counters as referring to the same object",
      "Using only one O-counter in the triliteral diagram to place an O-counter in the biliteral conclusion",
      "Treating an O-counter as meaning that the whole proposition is false",
      "Reading an I-counter as the digit 1",
    ]);
    const jaText = ja.lists?.[0]?.join(" ") ?? "";
    for (const text of ["S′", "Sではないもの全体", "どちらか一方", "根拠なく移す", "もう片側へ確定", "第三項", "両方のセル", "別々の存在要求", "三文字図", "二文字図", "両方ともO駒", "命題全体の偽", "セルが空", "数字1", "英字I", "存在"]) {
      expect(jaText).toContain(text);
    }
    expect(jaText).not.toContain("I命題");
    expect(en.lists?.[0]?.join(" ")).not.toContain("I-proposition");
    expect(ja.ruleSources.map(({ id }) => id)).toEqual(["common-error-corrections"]);
    expect(en.ruleSources.map(({ id }) => id)).toEqual(["common-error-corrections"]);
  });

  it("explains complements, counters, boundaries, combination, and projection", () => {
    const ja = JSON.stringify(JA_TUTORIAL_CONTENT);
    const en = JSON.stringify(EN_TUTORIAL_CONTENT);
    for (const word of ["反対語", "対象領域", "両方のセル", "両方空"]) {
      expect(ja).toContain(word);
    }
    for (const word of ["antonym", "universe of discourse", "both cells"]) {
      expect(en).toContain(word);
    }
    const byId = (id: string) => JA_TUTORIAL_CONTENT.sections.find((section) => section.id === id);
    expect(byId("proposition-rules")?.tables?.[0]?.rows.map((r) => r[0]))
      .toEqual(["A", "E", "I", "O"]);
    expect(byId("common-mistakes")?.lists?.[0]).toHaveLength(8);
    expect(byId("quick-reference")?.tables?.[0]?.rows.map((r) => r[0]))
      .toEqual(["記号", "駒", "境界", "結論図"]);
  });

  it("adds matching figure and mood instruction as section two", () => {
    const ja = JA_TUTORIAL_CONTENT.sections[1];
    const en = EN_TUTORIAL_CONTENT.sections[1];
    expect(ja?.id).toBe("syllogism-figures-and-moods");
    expect(en?.id).toBe(ja?.id);
    expect(ja?.heading).toBe("三段論法の格と命題形式");
    expect(en?.heading).toBe("Figures and Proposition Forms of Syllogisms");
    const jaTables = ja?.blocks?.filter((block) => block.kind === "table").map((block) => block.table);
    const enTables = en?.blocks?.filter((block) => block.kind === "table").map((block) => block.table);
    expect(jaTables).toHaveLength(3);
    expect(enTables?.map((table) => table.rows.length)).toEqual([4, 4, 5]);
    expect(jaTables?.[0]?.rows).toEqual([
      ["第一格", "M―P", "S―M", "S―P"], ["第二格", "P―M", "S―M", "S―P"],
      ["第三格", "M―P", "M―S", "S―P"], ["第四格", "P―M", "M―S", "S―P"],
    ]);
    expect(jaTables?.[1]?.rows.map((row) => row[1])).toEqual(["全称肯定", "全称否定", "特称肯定", "特称否定"]);
    expect(enTables?.[1]?.rows.map((row) => row[1])).toEqual(["Universal affirmative", "Universal negative", "Particular affirmative", "Particular negative"]);
    expect(jaTables?.[2]?.rows.map((row) => row.slice(0, 2))).toEqual([
      ["Barbara", "AAA-1"], ["Celarent", "EAE-1"], ["Darii", "AII-1"], ["Ferio", "EIO-1"], ["Cesare", "EAE-2"],
    ]);
    const jaText = JSON.stringify(ja);
    const enText = JSON.stringify(en);
    for (const text of ["4³ × 4 = 256", "式", "格", "組み込み問題"]) expect(jaText).toContain(text);
    for (const text of ["4³ × 4 = 256", "mood", "figure", "built-in problems"]) expect(enText).toContain(text);
    expect(JA_TUTORIAL_CONTENT.sections[2]?.id).toBe("eight-regions");
  });

  it("introduces syllogisms and the roles of S, M, and P first", () => {
    const ja = JA_TUTORIAL_CONTENT.sections[0];
    const en = EN_TUTORIAL_CONTENT.sections[0];
    expect(ja?.id).toBe("syllogism-basics");
    expect(ja?.heading).toBe("三段論法と項");
    expect(en?.heading).toBe("Syllogisms and Terms");
    const jaText = JSON.stringify(ja);
    const enText = JSON.stringify(en);
    for (const word of [
      "項", "小項", "大項", "中項", "命題形式", "妥当",
      "二つの前提に現れ、結論には現れない",
    ]) {
      expect(jaText).toContain(word);
    }
    for (const word of [
      "minor term", "major term", "middle term", "proposition form", "valid",
      "factually true",
    ]) {
      expect(enText).toContain(word);
    }
    expect(ja?.tables).toBeUndefined();
    expect(en?.tables).toBeUndefined();
    expect(ja?.blocks?.some((block) => block.kind === "table")).toBe(false);
    expect(en?.blocks?.some((block) => block.kind === "table")).toBe(false);
    expect(jaText).not.toContain("三段論法の例と抽象形");
    expect(enText).not.toContain("Syllogism example and abstract form");
    const jaTexts = ja?.blocks?.map((block) => block.kind === "paragraph" ? block.text : "");
    const enTexts = en?.blocks?.map((block) => block.kind === "paragraph" ? block.text : "");
    expect(jaTexts).toEqual([
      "三段論法は、二つの前提を組み合わせて一つの結論を導く推論です。例えば、次のような前提と結論を考えます。",
      "前提1　すべての動物は死すべきものである。", "前提2　すべての人間は動物である。", "結論　すべての人間は死すべきものである。",
      "これらの文は、次のように分析できます。",
      "前提1の主語は「動物」で、述語は「死すべきもの」です。前提2の主語は「人間」で、述語は「動物」です。結論の主語は「人間」で、述語は「死すべきもの」です。",
      "このような文の主語や述語となる語句を「項」と呼びます。",
      "結論の主語となる「人間」を小項と呼び、Sで表します。結論の述語となる「死すべきもの」を大項と呼び、Pで表します。二つの前提に現れ、結論には現れない「動物」を中項と呼び、Mで表します。",
      "この推論は、次のような抽象形で表せます。",
      "前提1　すべてのMはPである（All M are P）", "前提2　すべてのSはMである（All S are M）", "結論　すべてのSはPである（All S are P）",
      "「すべてのXはYである」のような文の型を、命題形式と呼びます。",
      "この抽象形のS・M・Pにどのような項を当てはめても、二つの前提が真であるならば、結論も必ず真になります。このような推論形式を「妥当である」といいます。",
      "三段論法の妥当性は、文が現実に正しいかどうかではなく、項の配置と命題形式によって決まります。",
    ]);
    expect(enTexts).toHaveLength(jaTexts?.length ?? 0);
    expect(enTexts?.slice(1, 4)).toEqual(["Premise 1: All animals are mortal.", "Premise 2: All humans are animals.", "Conclusion: All humans are mortal."]);
    expect(enTexts?.slice(9, 12)).toEqual(["Premise 1: All M are P.", "Premise 2: All S are M.", "Conclusion: All S are P."]);
    expect(enTexts?.[12]).toContain("proposition form");
    expect(enTexts?.[14]).toContain("factually true");
    expect(JA_TUTORIAL_CONTENT.sections[1]?.blocks?.filter((block) => block.kind === "table"))
      .toHaveLength(3);
    expect(jaText).not.toContain("主語にはS、述語にはP");
    expect(jaText).not.toContain("どのような名詞を割り当てても、この推論は正しい");
    expect(enText).not.toMatch(/S (?:stands for|means|is short for) (?:the )?subject/i);
    expect(enText).not.toMatch(/P (?:stands for|means|is short for) (?:the )?predicate/i);
  });

  it("is deterministic and does not advertise a modern-logic switch", () => {
    expect(JSON.stringify(JA_TUTORIAL_CONTENT)).toBe(JSON.stringify(JA_TUTORIAL_CONTENT));
    expect(JSON.stringify(EN_TUTORIAL_CONTENT).toLowerCase()).not.toContain("switch to modern");
  });

  it("uses a production-verified Carroll example for multiple complete conclusions", () => {
    const result = inferSyllogismConclusion({
      firstPremise: {
        form: "A",
        subject: abstractTerm("P"),
        predicate: abstractTerm("M", true),
      },
      secondPremise: {
        form: "A",
        subject: abstractTerm("S"),
        predicate: abstractTerm("M"),
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.completeConclusion?.propositions).toEqual([
      { form: "A", subject: abstractTerm("S"), predicate: abstractTerm("P", true) },
      { form: "A", subject: abstractTerm("P"), predicate: abstractTerm("S", true) },
    ]);
  });
});

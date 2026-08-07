import { describe, expect, it } from "vitest";
import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../src/domain/counterPlacement";
import { createTutorialViewModel } from "../src/tutorial/model";
import type { TutorialViewModel } from "../src/tutorial/model";

function cells(placements: TriliteralCounterPlacements | BiliteralCounterPlacements) {
  return placements.emptinessCounters.map(({ anchor }) =>
    anchor.type === "cell" ? anchor.cell : "boundary"
  );
}

function allDiagrams(model: TutorialViewModel) {
  return model.sections.flatMap((section) => [
    ...section.diagrams,
    ...section.blocks?.flatMap((block) => block.kind === "diagram" ? [block.diagram] : []) ?? [],
  ]);
}

describe("tutorial model", () => {
  it("uses the expected Barbara placements from the production computation", () => {
    const model = createTutorialViewModel("ja");
    const diagrams = allDiagrams(model);
    const barbara = model.sections.find(({ id }) => id === "barbara");
    const barbaraDiagrams = [
      ...barbara?.diagrams ?? [],
      ...barbara?.blocks?.flatMap((block) =>
        block.kind === "diagram" ? [block.diagram] : []
      ) ?? [],
    ];
    expect(barbaraDiagrams.map(({ id }) => id)).toEqual([
      "barbara-first", "barbara-combined", "barbara-conclusion",
    ]);
    expect(barbaraDiagrams).toHaveLength(3);
    const first = diagrams.find(({ id }) => id === "barbara-first")!;
    const combined = diagrams.find(({ id }) => id === "barbara-combined")!;
    const conclusion = diagrams.find(({ id }) => id === "barbara-conclusion")!;
    expect(cells(first.placements).sort()).toEqual(["SMp", "sMp"]);
    expect(first.placements.existenceCounters[0]?.anchor).toEqual({
      type: "boundary", cells: ["SMP", "sMP"], partitionRole: "S",
    });
    expect(cells(combined.placements).sort()).toEqual(["SMp", "Smp", "SmP", "sMp"].sort());
    expect(combined.placements.existenceCounters.map(({ anchor }) => anchor.type))
      .toEqual(["boundary", "cell"]);
    expect(combined.placements.existenceCounters).toHaveLength(2);
    expect(cells(conclusion.placements)).toEqual(["Sp"]);
    expect(conclusion.placements.existenceCounters[0]?.anchor).toEqual({
      type: "cell", cell: "SP",
    });
    expect(conclusion.placements.existenceCounters).toHaveLength(1);
  });

  it("provides unresolved and resolved boundary examples using logical anchors", () => {
    const diagrams = allDiagrams(createTutorialViewModel("ja"));
    const unresolved = diagrams.find(({ id }) => id === "boundary-unresolved")!;
    const additional = diagrams.find(({ id }) => id === "boundary-with-o")!;
    const resolved = diagrams.find(({ id }) => id === "boundary-resolved")!;
    expect(unresolved.placements.emptinessCounters).toEqual([]);
    expect(unresolved.placements.existenceCounters[0]?.anchor).toEqual({
      type: "boundary", cells: ["SMP", "sMP"], partitionRole: "S",
    });
    expect(cells(additional.placements)).toEqual(["SMP"]);
    expect(additional.placements.existenceCounters[0]?.anchor).toEqual({
      type: "boundary", cells: ["SMP", "sMP"], partitionRole: "S",
    });
    expect(cells(resolved.placements)).toEqual(["SMP"]);
    expect(resolved.placements.existenceCounters[0]?.anchor).toEqual({
      type: "cell", cell: "sMP",
    });
    expect(resolved.placements.existenceCounters.some(({ anchor }) => anchor.type === "boundary"))
      .toBe(false);
    expect(unresolved.heading).toBe("初期状態");
    expect(additional.heading).toBe("追加情報");
    expect(resolved.heading).toBe("確定後");
  });

  it("renders safe localized SVG without changing placements", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    const jaDiagrams = allDiagrams(ja);
    const enDiagrams = allDiagrams(en);
    expect(jaDiagrams).toHaveLength(8);
    expect(ja.sections.some(({ id }) => id === "combine-premises")).toBe(false);
    expect(en.sections.some(({ id }) => id === "combine-premises")).toBe(false);
    expect(ja.sections.find(({ id }) => id === "syllogism-figures-and-moods")?.diagrams)
      .toEqual([]);
    jaDiagrams.forEach(({ svg }) => {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).not.toMatch(/<script|foreignObject|(?:href|src)=["']https?:/);
    });
    expect(enDiagrams.map((d) => d.placements)).toEqual(jaDiagrams.map((d) => d.placements));
    expect(enDiagrams[0]?.svg).not.toBe(jaDiagrams[0]?.svg);
  });

  it("reuses an empty accessible biliteral diagram for the overview", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    const jaBlock = ja.sections.find(({ id }) => id === "biliteral-diagram")?.blocks
      ?.find((block) => block.kind === "diagram");
    const enBlock = en.sections.find(({ id }) => id === "biliteral-diagram")?.blocks
      ?.find((block) => block.kind === "diagram");
    if (jaBlock?.kind !== "diagram" || enBlock?.kind !== "diagram") {
      throw new Error("Missing biliteral overview diagram");
    }
    expect(jaBlock.diagram.kind).toBe("biliteral");
    expect(jaBlock.diagram.placements).toEqual({ emptinessCounters: [], existenceCounters: [] });
    expect(jaBlock.diagram.heading).toBe("空の二文字図");
    expect(jaBlock.diagram.description).toBe("小項Sと大項Pの関係を表す4領域です。駒はまだ置かれていません。");
    expect(jaBlock.diagram.svg).toContain('data-diagram-kind="biliteral"');
    expect(jaBlock.diagram.svg).toMatch(/>S<|>S<\/text>/);
    expect(jaBlock.diagram.svg).toContain("S′");
    expect(jaBlock.diagram.svg).toMatch(/>P<|>P<\/text>/);
    expect(jaBlock.diagram.svg).toContain("P′");
    expect(jaBlock.diagram.svg).not.toMatch(/>M(?:′)?<\/text>/);
    expect(enBlock.diagram.heading).toBe("Empty biliteral diagram");
    expect(enBlock.diagram.description).toBe("Four regions showing the relation between the minor term S and the major term P. No counters have been placed yet.");
    expect(enBlock.diagram.placements).toEqual(jaBlock.diagram.placements);
    const withoutAccessibleText = (svg: string) => svg
      .replace(/ aria-label="[^"]*"/, "")
      .replace(/<title[^>]*>.*?<\/title>|<desc[^>]*>.*?<\/desc>/g, "");
    const jaSvgGeometry = withoutAccessibleText(jaBlock.diagram.svg);
    const enSvgGeometry = withoutAccessibleText(enBlock.diagram.svg);
    expect(enSvgGeometry).toBe(jaSvgGeometry);
    const jaDiagrams = allDiagrams(ja);
    expect(ja.sections.some(({ id }) => id === "eliminate-middle")).toBe(false);
    expect(jaDiagrams.filter(({ id }) => id === "empty-biliteral-basics")).toHaveLength(1);
    expect(jaDiagrams.some(({ id }) => id === "empty-biliteral")).toBe(false);
    expect(createTutorialViewModel("ja")).toEqual(ja);
  });

  it("reuses the empty accessible triliteral diagram in the merged section", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    const find = (model: TutorialViewModel) => model.sections
      .find(({ id }) => id === "eight-regions")?.blocks
      ?.find((block) => block.kind === "diagram");
    const jaBlock = find(ja);
    const enBlock = find(en);
    if (jaBlock?.kind !== "diagram" || enBlock?.kind !== "diagram") {
      throw new Error("Missing empty triliteral diagram");
    }
    expect(jaBlock.diagram.kind).toBe("triliteral");
    expect(jaBlock.diagram.placements).toEqual({ emptinessCounters: [], existenceCounters: [] });
    expect(jaBlock.diagram.heading).toBe("空の三文字図");
    expect(jaBlock.diagram.description).toBe("S／S′、M／M′、P／P′の三つの二分によって作られる8領域です。駒はまだ置かれていません。");
    expect(jaBlock.diagram.svg).toContain('data-diagram-kind="triliteral"');
    expect(jaBlock.diagram.svg).toContain('data-label-role="M" x="180" y="140"');
    expect(jaBlock.diagram.svg).toContain('data-label-role="m" x="180" y="100"');
    for (const label of ["S", "S′", "M", "M′", "P", "P′"]) expect(jaBlock.diagram.svg).toContain(label);
    expect(enBlock.diagram.heading).toBe("Empty triliteral diagram");
    expect(enBlock.diagram.description).toBe("Eight regions formed by the three divisions S/S′, M/M′, and P/P′. No counters have been placed yet.");
    expect(enBlock.diagram.placements).toEqual(jaBlock.diagram.placements);
    expect(enBlock.diagram.svg).toContain('data-label-role="M" x="180" y="140"');
    expect(enBlock.diagram.svg).toContain('data-label-role="m" x="180" y="100"');
  });
});

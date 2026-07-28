import { describe, expect, it } from "vitest";
import type {
  BiliteralCounterPlacements,
  TriliteralCounterPlacements,
} from "../src/domain/counterPlacement";
import { createTutorialViewModel } from "../src/tutorial/model";

function cells(placements: TriliteralCounterPlacements | BiliteralCounterPlacements) {
  return placements.emptinessCounters.map(({ anchor }) =>
    anchor.type === "cell" ? anchor.cell : "boundary"
  );
}

describe("tutorial model", () => {
  it("uses the expected Barbara placements from the production computation", () => {
    const diagrams = createTutorialViewModel("ja").sections.flatMap((s) => s.diagrams);
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
    expect(cells(conclusion.placements)).toEqual(["Sp"]);
    expect(conclusion.placements.existenceCounters[0]?.anchor).toEqual({
      type: "cell", cell: "SP",
    });
  });

  it("provides unresolved and resolved boundary examples using logical anchors", () => {
    const diagrams = createTutorialViewModel("ja").sections.flatMap((s) => s.diagrams);
    const unresolved = diagrams.find(({ id }) => id === "boundary-unresolved")!;
    const resolved = diagrams.find(({ id }) => id === "boundary-resolved")!;
    expect(unresolved.placements.existenceCounters[0]?.anchor.type).toBe("boundary");
    expect(cells(resolved.placements)).toEqual(["sMP"]);
    expect(resolved.placements.existenceCounters[0]?.anchor).toEqual({
      type: "cell", cell: "SMP",
    });
  });

  it("renders safe localized SVG without changing placements", () => {
    const ja = createTutorialViewModel("ja");
    const en = createTutorialViewModel("en");
    const jaDiagrams = ja.sections.flatMap((s) => s.diagrams);
    const enDiagrams = en.sections.flatMap((s) => s.diagrams);
    expect(jaDiagrams).toHaveLength(7);
    jaDiagrams.forEach(({ svg }) => {
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).not.toMatch(/<script|foreignObject|(?:href|src)=["']https?:/);
    });
    expect(enDiagrams.map((d) => d.placements)).toEqual(jaDiagrams.map((d) => d.placements));
    expect(enDiagrams[0]?.svg).not.toBe(jaDiagrams[0]?.svg);
  });
});

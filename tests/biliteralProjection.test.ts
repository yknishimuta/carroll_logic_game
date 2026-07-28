import { describe, expect, it } from "vitest";
import { BILITERAL_CELLS } from "../src/domain/conclusion";
import type { TriliteralDiagramState } from "../src/domain/diagram";
import {
  projectToBiliteralDiagram,
  projectTriliteralCell,
  triliteralCellsForBiliteralCell,
} from "../src/logic/biliteralProjection";

describe("biliteral cell mapping", () => {
  it("defines all biliteral cells in deterministic order", () => {
    expect(BILITERAL_CELLS).toEqual(["SP", "Sp", "sP", "sp"]);
  });

  it.each([
    ["SMP", "SP"],
    ["SMp", "Sp"],
    ["SmP", "SP"],
    ["Smp", "Sp"],
    ["sMP", "sP"],
    ["sMp", "sp"],
    ["smP", "sP"],
    ["smp", "sp"],
  ] as const)("projects %s to %s", (source, expected) => {
    expect(projectTriliteralCell(source)).toBe(expected);
  });

  it.each([
    ["SP", ["SMP", "SmP"]],
    ["Sp", ["SMp", "Smp"]],
    ["sP", ["sMP", "smP"]],
    ["sp", ["sMp", "smp"]],
  ] as const)("returns both source cells for %s", (cell, expected) => {
    expect(triliteralCellsForBiliteralCell(cell)).toEqual(expected);
  });
});

describe("projectToBiliteralDiagram", () => {
  it("marks a biliteral cell empty only when both source cells are empty", () => {
    expect(
      projectToBiliteralDiagram({
        emptyCells: ["SMP", "SmP"],
        existentials: [],
      }).emptyCells,
    ).toEqual(["SP"]);

    expect(
      projectToBiliteralDiagram({
        emptyCells: ["SMP"],
        existentials: [],
      }).emptyCells,
    ).toEqual([]);
  });

  it("projects multiple empty cells in deterministic order", () => {
    expect(
      projectToBiliteralDiagram({
        emptyCells: ["smp", "Smp", "sMp", "SMp"],
        existentials: [],
      }).emptyCells,
    ).toEqual(["Sp", "sp"]);
  });

  it("deduplicates candidates that project to the same cell", () => {
    expect(
      projectToBiliteralDiagram({
        emptyCells: [],
        existentials: [
          {
            sourceId: "existence-1",
            possibleCells: ["SMP", "SmP"],
          },
        ],
      }).existentials,
    ).toEqual([
      {
        sourceId: "existence-1",
        possibleCells: ["SP"],
      },
    ]);
  });

  it("preserves candidates spanning different biliteral cells", () => {
    expect(
      projectToBiliteralDiagram({
        emptyCells: [],
        existentials: [
          {
            sourceId: "existence-1",
            possibleCells: ["sMP", "SMP"],
          },
        ],
      }).existentials,
    ).toEqual([
      {
        sourceId: "existence-1",
        possibleCells: ["SP", "sP"],
      },
    ]);
  });

  it("keeps separate sources as separate existence constraints", () => {
    expect(
      projectToBiliteralDiagram({
        emptyCells: [],
        existentials: [
          { sourceId: "first", possibleCells: ["SMP"] },
          { sourceId: "second", possibleCells: ["SmP"] },
        ],
      }).existentials,
    ).toEqual([
      { sourceId: "first", possibleCells: ["SP"] },
      { sourceId: "second", possibleCells: ["SP"] },
    ]);
  });

  it("rejects an existential constraint with no candidates", () => {
    expect(() =>
      projectToBiliteralDiagram({
        emptyCells: [],
        existentials: [
          { sourceId: "invalid", possibleCells: [] },
        ],
      }),
    ).toThrow("no possible cell");
  });

  it("does not mutate frozen input and is deterministic", () => {
    const state: TriliteralDiagramState = Object.freeze({
      emptyCells: Object.freeze(["SMp", "Smp"] as const),
      existentials: Object.freeze([
        Object.freeze({
          sourceId: "frozen",
          possibleCells: Object.freeze(["SMP", "SmP"] as const),
        }),
      ]),
    });

    const first = projectToBiliteralDiagram(state);
    const second = projectToBiliteralDiagram(state);

    expect(first).toEqual({
      emptyCells: ["Sp"],
      existentials: [
        { sourceId: "frozen", possibleCells: ["SP"] },
      ],
    });
    expect(second).toEqual(first);
    expect(state.existentials[0]?.possibleCells).toEqual(["SMP", "SmP"]);
  });
});

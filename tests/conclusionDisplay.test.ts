import { describe, expect, it } from "vitest";
import type { BiliteralDiagramState } from "../src/domain/conclusion";
import {
  createConclusionCounterPlacements,
  createConclusionDisplayState,
} from "../src/logic/conclusionDisplay";

const projectedState: BiliteralDiagramState = {
  emptyCells: ["SP", "Sp"],
  existentials: [
    { sourceId: "unrelated-p", possibleCells: ["SP", "sP"] },
    { sourceId: "certain-i-1", possibleCells: ["SP"] },
    { sourceId: "certain-i-2", possibleCells: ["SP"] },
    { sourceId: "certain-o", possibleCells: ["Sp"] },
    { sourceId: "outside-s", possibleCells: ["sP"] },
    { sourceId: "outside-both", possibleCells: ["sp"] },
  ],
};

describe("createConclusionDisplayState", () => {
  it("extracts only Barbara Carroll conclusion information", () => {
    expect(
      createConclusionDisplayState(projectedState, ["A", "I"]),
    ).toEqual({
      ok: true,
      state: {
        emptyCells: ["Sp"],
        existentials: [
          { sourceId: "certain-i-1", possibleCells: ["SP"] },
          { sourceId: "certain-i-2", possibleCells: ["SP"] },
        ],
      },
    });
  });

  it("extracts Barbara modern without existence", () => {
    expect(createConclusionDisplayState(projectedState, ["A"])).toEqual({
      ok: true,
      state: {
        emptyCells: ["Sp"],
        existentials: [],
      },
    });
  });

  it("extracts Celarent Carroll and modern information", () => {
    expect(
      createConclusionDisplayState(projectedState, ["E", "O"]),
    ).toEqual({
      ok: true,
      state: {
        emptyCells: ["SP"],
        existentials: [
          { sourceId: "certain-o", possibleCells: ["Sp"] },
        ],
      },
    });
    expect(createConclusionDisplayState(projectedState, ["E"])).toEqual({
      ok: true,
      state: {
        emptyCells: ["SP"],
        existentials: [],
      },
    });
  });

  it("extracts only the certain existence for Darii and Ferio", () => {
    expect(createConclusionDisplayState(projectedState, ["I"])).toEqual({
      ok: true,
      state: {
        emptyCells: [],
        existentials: [
          { sourceId: "certain-i-1", possibleCells: ["SP"] },
          { sourceId: "certain-i-2", possibleCells: ["SP"] },
        ],
      },
    });
    expect(createConclusionDisplayState(projectedState, ["O"])).toEqual({
      ok: true,
      state: {
        emptyCells: [],
        existentials: [
          { sourceId: "certain-o", possibleCells: ["Sp"] },
        ],
      },
    });
  });

  it("returns an empty successful state for no conclusion", () => {
    expect(createConclusionDisplayState(projectedState, [])).toEqual({
      ok: true,
      state: { emptyCells: [], existentials: [] },
    });
  });

  it.each([
    ["A", { emptyCells: [], existentials: [] }],
    ["E", { emptyCells: [], existentials: [] }],
    ["I", { emptyCells: [], existentials: [] }],
    ["O", { emptyCells: [], existentials: [] }],
  ] as const)("rejects unsupported entailed form %s", (form, state) => {
    expect(createConclusionDisplayState(state, [form])).toEqual({
      ok: false,
      reason: "entailed-form-not-supported-by-state",
      form,
    });
  });

  it("is non-destructive and deterministic with frozen inputs", () => {
    const state: BiliteralDiagramState = Object.freeze({
      emptyCells: Object.freeze(["Sp"] as const),
      existentials: Object.freeze([
        Object.freeze({
          sourceId: "frozen",
          possibleCells: Object.freeze(["SP"] as const),
        }),
      ]),
    });
    const forms = Object.freeze(["A", "I"] as const);

    const first = createConclusionDisplayState(state, forms);
    const second = createConclusionDisplayState(state, forms);

    expect(first).toEqual(second);
    expect(state.existentials[0]?.possibleCells).toEqual(["SP"]);
    expect(forms).toEqual(["A", "I"]);
  });
});

describe("createConclusionCounterPlacements", () => {
  it("aggregates sources only at the placement stage", () => {
    const result = createConclusionCounterPlacements(
      projectedState,
      ["A", "I"],
    );

    expect(result).toEqual({
      ok: true,
      displayState: {
        emptyCells: ["Sp"],
        existentials: [
          { sourceId: "certain-i-1", possibleCells: ["SP"] },
          { sourceId: "certain-i-2", possibleCells: ["SP"] },
        ],
      },
      placements: {
        emptinessCounters: [
          { kind: "emptiness", anchor: { type: "cell", cell: "Sp" } },
        ],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ["certain-i-1", "certain-i-2"],
            anchor: { type: "cell", cell: "SP" },
          },
        ],
      },
    });
  });
});

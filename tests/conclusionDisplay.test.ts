import { describe, expect, it } from "vitest";
import type { BiliteralDiagramState } from "../src/domain/conclusion";
import { conclusionCells } from "../src/logic/conclusionCells";
import {
  createConclusionCounterPlacements,
  createConclusionDisplayState,
} from "../src/logic/conclusionDisplay";

describe("signed conclusion cell semantics", () => {
  it.each([
    [false, false, "SP", "Sp"],
    [false, true, "Sp", "SP"],
    [true, false, "sP", "sp"],
    [true, true, "sp", "sP"],
  ] as const)(
    "maps S complemented=%s and P complemented=%s to positive=%s and negative=%s",
    (subjectComplemented, predicateComplemented, positive, negative) => {
      expect(conclusionCells(
        { role: "S", complemented: subjectComplemented },
        { role: "P", complemented: predicateComplemented },
      )).toEqual({ positive, negative });
    },
  );
});

describe("state-based conclusion display", () => {
  it.each([
    [
      "Barbara",
      {
        emptyCells: ["Sp"],
        existentials: [
          { sourceId: "major", possibleCells: ["SP", "sP"] },
          { sourceId: "minor", possibleCells: ["SP"] },
        ],
      },
      { empty: ["Sp"], occupied: 2 },
    ],
    [
      "modern Barbara",
      { emptyCells: ["Sp"], existentials: [] },
      { empty: ["Sp"], occupied: 0 },
    ],
    [
      "Celarent",
      {
        emptyCells: ["SP"],
        existentials: [{ sourceId: "minor", possibleCells: ["Sp"] }],
      },
      { empty: ["SP"], occupied: 1 },
    ],
    [
      "Darii",
      {
        emptyCells: [],
        existentials: [
          { sourceId: "major", possibleCells: ["SP", "sP"] },
          { sourceId: "minor", possibleCells: ["SP"] },
        ],
      },
      { empty: [], occupied: 2 },
    ],
    [
      "Ferio",
      {
        emptyCells: [],
        existentials: [{ sourceId: "minor", possibleCells: ["Sp"] }],
      },
      { empty: [], occupied: 1 },
    ],
  ] as const)("preserves all projected %s information", (_name, state, expected) => {
    const result = createConclusionCounterPlacements(state);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.placements.emptinessCounters.map(({ anchor }) =>
      anchor.type === "cell" ? anchor.cell : null
    )).toEqual(expected.empty);
    expect(result.placements.existenceCounters).toHaveLength(expected.occupied);
  });

  it("creates an empty display for no conclusion", () => {
    expect(createConclusionCounterPlacements({
      emptyCells: [],
      existentials: [],
    })).toEqual({
      ok: true,
      displayState: { emptyCells: [], existentials: [] },
      placements: { emptinessCounters: [], existenceCounters: [] },
    });
  });

  it("is deterministic and non-destructive with frozen input", () => {
    const state: BiliteralDiagramState = Object.freeze({
      emptyCells: Object.freeze(["Sp"] as const),
      existentials: Object.freeze([Object.freeze({
        sourceId: "frozen",
        possibleCells: Object.freeze(["SP", "sP"] as const),
      })]),
    });
    expect(createConclusionCounterPlacements(state)).toEqual(
      createConclusionCounterPlacements(state),
    );
    expect(state.existentials[0]?.possibleCells).toEqual(["SP", "sP"]);
  });

  it.each([
    ["no candidates", { sourceId: "none", possibleCells: [] }, "existential-has-no-candidates"],
    ["too many candidates", { sourceId: "many", possibleCells: ["SP", "Sp", "sP"] }, "existential-has-too-many-candidates"],
    ["non-adjacent candidates", { sourceId: "diagonal", possibleCells: ["SP", "sp"] }, "existential-candidates-are-not-adjacent"],
  ] as const)("reports %s from the generic placement conversion", (_name, existential, reason) => {
    expect(createConclusionCounterPlacements({
      emptyCells: [],
      existentials: [existential],
    })).toMatchObject({ ok: false, stage: "counter-placement", reason });
  });

  it("uses the complete biliteral state without form-based filtering", () => {
    const state: BiliteralDiagramState = {
      emptyCells: ["SP", "sp"],
      existentials: [
        { sourceId: "certain", possibleCells: ["Sp"] },
        { sourceId: "boundary", possibleCells: ["SP", "Sp"] },
      ],
    };

    expect(createConclusionDisplayState(state)).toBe(state);
    expect(createConclusionCounterPlacements(state)).toEqual({
      ok: true,
      displayState: state,
      placements: {
        emptinessCounters: [
          { kind: "emptiness", anchor: { type: "cell", cell: "SP" } },
          { kind: "emptiness", anchor: { type: "cell", cell: "sp" } },
        ],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ["certain"],
            anchor: { type: "cell", cell: "Sp" },
          },
          {
            kind: "existence",
            sourceIds: ["boundary"],
            anchor: {
              type: "boundary",
              cells: ["SP", "Sp"],
              partitionRole: "P",
            },
          },
        ],
      },
    });
  });

  it("places No S are P′ emptiness at Sp without a legacy E form", () => {
    const result = createConclusionCounterPlacements({
      emptyCells: ["Sp"],
      existentials: [],
    });
    expect(result.ok && result.placements.emptinessCounters).toEqual([{
      kind: "emptiness",
      anchor: { type: "cell", cell: "Sp" },
    }]);
  });

  it("consolidates co-located existence sources only for display", () => {
    const state: BiliteralDiagramState = {
      emptyCells: [],
      existentials: [
        { sourceId: "second", possibleCells: ["SP"] },
        { sourceId: "first", possibleCells: ["SP"] },
      ],
    };
    const result = createConclusionCounterPlacements(state);
    expect(result).toEqual({
      ok: true,
      displayState: state,
      placements: {
        emptinessCounters: [],
        existenceCounters: [{
          kind: "existence",
          sourceIds: ["second", "first"],
          anchor: { type: "cell", cell: "SP" },
        }],
      },
    });
    expect(state.existentials).toHaveLength(2);
  });

  it("keeps logical anchors stable when provenance and input order change", () => {
    const anchors = (state: BiliteralDiagramState) => {
      const result = createConclusionCounterPlacements(state);
      if (!result.ok) throw new Error(result.reason);
      return result.placements.existenceCounters.map(({ anchor }) => anchor)
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
    };
    expect(anchors({
      emptyCells: [],
      existentials: [
        { sourceId: "a", possibleCells: ["Sp"] },
        { sourceId: "b", possibleCells: ["SP", "Sp"] },
      ],
    })).toEqual(anchors({
      emptyCells: [],
      existentials: [
        { sourceId: "changed", possibleCells: ["Sp", "SP"] },
        { sourceId: "other", possibleCells: ["Sp"] },
      ],
    }));
  });
});

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

  it("uses sP and sp for a complemented conclusion subject", () => {
    const state: BiliteralDiagramState = {
      emptyCells: ["sp"],
      existentials: [{ sourceId: "prime-subject", possibleCells: ["sP"] }],
    };
    expect(createConclusionDisplayState(
      state,
      ["A", "I"],
      { role: "S", complemented: true },
      { role: "P", complemented: false },
    )).toEqual({ ok: true, state });
  });

  it("uses Sp and SP for a complemented conclusion predicate", () => {
    const state: BiliteralDiagramState = {
      emptyCells: ["SP"],
      existentials: [{ sourceId: "prime-predicate", possibleCells: ["Sp"] }],
    };
    expect(createConclusionDisplayState(
      state,
      ["A", "I"],
      { role: "S", complemented: false },
      { role: "P", complemented: true },
    )).toEqual({ ok: true, state });
  });

  it("places E emptiness in Sp for a complemented predicate", () => {
    const result = createConclusionCounterPlacements(
      { emptyCells: ["Sp"], existentials: [] },
      ["E"],
      { role: "S", complemented: false },
      { role: "P", complemented: true },
    );
    expect(result).toEqual({
      ok: true,
      displayState: { emptyCells: ["Sp"], existentials: [] },
      placements: {
        emptinessCounters: [{
          kind: "emptiness",
          anchor: { type: "cell", cell: "Sp" },
        }],
        existenceCounters: [],
      },
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
  it.each([
    [false, false, "SP", "Sp"],
    [false, true, "Sp", "SP"],
    [true, false, "sP", "sp"],
    [true, true, "sp", "sP"],
  ] as const)(
    "maps every form for signed terms S complemented=%s and P complemented=%s",
    (subjectComplemented, predicateComplemented, positive, negative) => {
      const subject = { role: "S" as const, complemented: subjectComplemented };
      const predicate = { role: "P" as const, complemented: predicateComplemented };
      const existence = (cell: typeof positive, sourceId: string) => ({
        sourceId,
        possibleCells: [cell],
      });
      const placementCells = (
        result: ReturnType<typeof createConclusionCounterPlacements>,
      ) => result.ok
        ? {
            empty: result.placements.emptinessCounters.map(({ anchor }) =>
              anchor.type === "cell" ? anchor.cell : null
            ),
            occupied: result.placements.existenceCounters.map(({ anchor }) =>
              anchor.type === "cell" ? anchor.cell : null
            ),
          }
        : null;

      expect(placementCells(createConclusionCounterPlacements(
        { emptyCells: [negative], existentials: [existence(positive, "a")] },
        ["A", "I"],
        subject,
        predicate,
      ))).toEqual({ empty: [negative], occupied: [positive] });
      expect(placementCells(createConclusionCounterPlacements(
        { emptyCells: [positive], existentials: [] },
        ["E"],
        subject,
        predicate,
      ))).toEqual({ empty: [positive], occupied: [] });
      expect(placementCells(createConclusionCounterPlacements(
        { emptyCells: [], existentials: [existence(positive, "i")] },
        ["I"],
        subject,
        predicate,
      ))).toEqual({ empty: [], occupied: [positive] });
      expect(placementCells(createConclusionCounterPlacements(
        { emptyCells: [], existentials: [existence(negative, "o")] },
        ["O"],
        subject,
        predicate,
      ))).toEqual({ empty: [], occupied: [negative] });
    },
  );

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

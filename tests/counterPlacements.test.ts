import { describe, expect, it } from "vitest";
import type { BiliteralDiagramState } from "../src/domain/conclusion";
import type { TriliteralDiagramState } from "../src/domain/diagram";
import {
  createBiliteralCounterPlacements,
  createTriliteralCounterPlacements,
} from "../src/logic/counterPlacements";

describe("emptiness counter placements", () => {
  it("creates triliteral cell counters in canonical order", () => {
    expect(
      createTriliteralCounterPlacements({
        emptyCells: ["smp", "SMP", "SmP"],
        existentials: [],
      }),
    ).toEqual({
      ok: true,
      placements: {
        emptinessCounters: [
          { kind: "emptiness", anchor: { type: "cell", cell: "SMP" } },
          { kind: "emptiness", anchor: { type: "cell", cell: "SmP" } },
          { kind: "emptiness", anchor: { type: "cell", cell: "smp" } },
        ],
        existenceCounters: [],
      },
    });
  });

  it("creates biliteral cell counters in canonical order", () => {
    expect(
      createBiliteralCounterPlacements({
        emptyCells: ["sp", "SP", "Sp"],
        existentials: [],
      }),
    ).toEqual({
      ok: true,
      placements: {
        emptinessCounters: [
          { kind: "emptiness", anchor: { type: "cell", cell: "SP" } },
          { kind: "emptiness", anchor: { type: "cell", cell: "Sp" } },
          { kind: "emptiness", anchor: { type: "cell", cell: "sp" } },
        ],
        existenceCounters: [],
      },
    });
  });
});

describe("existence counter anchors", () => {
  it("places a certain existence inside its cell and keeps sourceId", () => {
    const result = createTriliteralCounterPlacements({
      emptyCells: [],
      existentials: [
        { sourceId: "certain", possibleCells: ["SmP"] },
      ],
    });

    expect(result).toEqual({
      ok: true,
      placements: {
        emptinessCounters: [],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ["certain"],
            anchor: { type: "cell", cell: "SmP" },
          },
        ],
      },
    });
  });

  it.each([
    [["SMP", "sMP"], "S"],
    [["SMP", "SmP"], "M"],
    [["SMP", "SMp"], "P"],
  ] as const)(
    "places triliteral candidates %j on the %s boundary",
    (possibleCells, partitionRole) => {
      const result = createTriliteralCounterPlacements({
        emptyCells: [],
        existentials: [{ sourceId: "boundary", possibleCells }],
      });

      expect(result).toEqual({
        ok: true,
        placements: {
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: ["boundary"],
              anchor: {
                type: "boundary",
                cells: possibleCells,
                partitionRole,
              },
            },
          ],
        },
      });
    },
  );

  it.each([
    [["SP", "sP"], "S"],
    [["SP", "Sp"], "P"],
  ] as const)(
    "places biliteral candidates %j on the %s boundary",
    (possibleCells, partitionRole) => {
      const result = createBiliteralCounterPlacements({
        emptyCells: [],
        existentials: [{ sourceId: "boundary", possibleCells }],
      });

      expect(result).toEqual({
        ok: true,
        placements: {
          emptinessCounters: [],
          existenceCounters: [
            {
              kind: "existence",
              sourceIds: ["boundary"],
              anchor: {
                type: "boundary",
                cells: possibleCells,
                partitionRole,
              },
            },
          ],
        },
      });
    },
  );

  it("normalizes reversed and duplicate candidates", () => {
    expect(
      createTriliteralCounterPlacements({
        emptyCells: [],
        existentials: [
          {
            sourceId: "reversed",
            possibleCells: ["sMP", "SMP"],
          },
          {
            sourceId: "duplicate",
            possibleCells: ["SmP", "SmP"],
          },
        ],
      }),
    ).toEqual({
      ok: true,
      placements: {
        emptinessCounters: [],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ["reversed"],
            anchor: {
              type: "boundary",
              cells: ["SMP", "sMP"],
              partitionRole: "S",
            },
          },
          {
            kind: "existence",
            sourceIds: ["duplicate"],
            anchor: { type: "cell", cell: "SmP" },
          },
        ],
      },
    });
  });
});

describe("invalid existence candidates", () => {
  it.each([
    [
      "triliteral empty",
      () =>
        createTriliteralCounterPlacements({
          emptyCells: [],
          existentials: [{ sourceId: "bad", possibleCells: [] }],
        }),
      "existential-has-no-candidates",
      [],
    ],
    [
      "triliteral too many",
      () =>
        createTriliteralCounterPlacements({
          emptyCells: [],
          existentials: [
            {
              sourceId: "bad",
              possibleCells: ["SMP", "SMp", "SmP"],
            },
          ],
        }),
      "existential-has-too-many-candidates",
      ["SMP", "SMp", "SmP"],
    ],
    [
      "triliteral non-adjacent",
      () =>
        createTriliteralCounterPlacements({
          emptyCells: [],
          existentials: [
            { sourceId: "bad", possibleCells: ["SMP", "smP"] },
          ],
        }),
      "existential-candidates-are-not-adjacent",
      ["SMP", "smP"],
    ],
    [
      "biliteral empty",
      () =>
        createBiliteralCounterPlacements({
          emptyCells: [],
          existentials: [{ sourceId: "bad", possibleCells: [] }],
        }),
      "existential-has-no-candidates",
      [],
    ],
    [
      "biliteral too many",
      () =>
        createBiliteralCounterPlacements({
          emptyCells: [],
          existentials: [
            { sourceId: "bad", possibleCells: ["SP", "Sp", "sP"] },
          ],
        }),
      "existential-has-too-many-candidates",
      ["SP", "Sp", "sP"],
    ],
    [
      "biliteral non-adjacent",
      () =>
        createBiliteralCounterPlacements({
          emptyCells: [],
          existentials: [
            { sourceId: "bad", possibleCells: ["SP", "sp"] },
          ],
        }),
      "existential-candidates-are-not-adjacent",
      ["SP", "sp"],
    ],
  ] as const)("%s returns %s", (_name, create, reason, possibleCells) => {
    expect(create()).toEqual({
      ok: false,
      reason,
      sourceId: "bad",
      possibleCells,
    });
  });
});

describe("visual aggregation", () => {
  it("merges identical anchors while preserving unique source order", () => {
    const result = createBiliteralCounterPlacements({
      emptyCells: [],
      existentials: [
        { sourceId: "first", possibleCells: ["SP"] },
        { sourceId: "second", possibleCells: ["SP"] },
        { sourceId: "first", possibleCells: ["SP"] },
        { sourceId: "other", possibleCells: ["Sp"] },
      ],
    });

    expect(result).toEqual({
      ok: true,
      placements: {
        emptinessCounters: [],
        existenceCounters: [
          {
            kind: "existence",
            sourceIds: ["first", "second"],
            anchor: { type: "cell", cell: "SP" },
          },
          {
            kind: "existence",
            sourceIds: ["other"],
            anchor: { type: "cell", cell: "Sp" },
          },
        ],
      },
    });
  });

  it("is non-destructive and deterministic for frozen input", () => {
    const state: TriliteralDiagramState = Object.freeze({
      emptyCells: Object.freeze(["smp", "SMP"] as const),
      existentials: Object.freeze([
        Object.freeze({
          sourceId: "frozen",
          possibleCells: Object.freeze(["sMP", "SMP"] as const),
        }),
      ]),
    });

    const first = createTriliteralCounterPlacements(state);
    const second = createTriliteralCounterPlacements(state);

    expect(first).toEqual(second);
    expect(state.emptyCells).toEqual(["smp", "SMP"]);
    expect(state.existentials[0]?.possibleCells).toEqual(["sMP", "SMP"]);
  });
});

import { describe, expect, it } from "vitest";
import type { LineGeometry } from "../src/diagram/layout";
import {
  biliteralCellCenter,
  createBiliteralDiagramLayout,
  createTriliteralDiagramLayout,
  resolveBiliteralCounterPosition,
  resolveTriliteralCounterPosition,
  triliteralCellCenter,
} from "../src/diagram/layout";

describe("diagram layout defaults", () => {
  it("creates the expected triliteral layout", () => {
    expect(createTriliteralDiagramLayout()).toEqual({
      viewBox: { minX: 0, minY: 0, width: 400, height: 400 },
      outerRect: { x: 40, y: 40, width: 320, height: 320 },
      innerRect: { x: 120, y: 120, width: 160, height: 160 },
      dividerLines: [
        { x1: 200, y1: 40, x2: 200, y2: 360 },
        { x1: 40, y1: 200, x2: 360, y2: 200 },
      ],
      counterRadius: 14,
    });
  });

  it("creates the expected biliteral layout", () => {
    expect(createBiliteralDiagramLayout()).toEqual({
      viewBox: { minX: 0, minY: 0, width: 400, height: 400 },
      outerRect: { x: 40, y: 40, width: 320, height: 320 },
      dividerLines: [
        { x1: 200, y1: 40, x2: 200, y2: 360 },
        { x1: 40, y1: 200, x2: 360, y2: 200 },
      ],
      counterRadius: 14,
    });
  });

  it("returns fresh layouts and divider arrays", () => {
    const first = createTriliteralDiagramLayout();
    const second = createTriliteralDiagramLayout();
    const mutableFirstLines = first.dividerLines as LineGeometry[];

    mutableFirstLines.push({ x1: 0, y1: 0, x2: 1, y2: 1 });

    expect(first).not.toBe(second);
    expect(first.viewBox).not.toBe(second.viewBox);
    expect(first.dividerLines).not.toBe(second.dividerLines);
    expect(first.dividerLines).toHaveLength(3);
    expect(second.dividerLines).toHaveLength(2);
  });
});

describe("cell centers", () => {
  it.each([
    ["SMP", { x: 160, y: 160 }],
    ["SMp", { x: 240, y: 160 }],
    ["SmP", { x: 80, y: 80 }],
    ["Smp", { x: 320, y: 80 }],
    ["sMP", { x: 160, y: 240 }],
    ["sMp", { x: 240, y: 240 }],
    ["smP", { x: 80, y: 320 }],
    ["smp", { x: 320, y: 320 }],
  ] as const)("places triliteral cell %s", (cell, expected) => {
    expect(triliteralCellCenter(cell)).toEqual(expected);
    expect(triliteralCellCenter(cell)).not.toBe(
      triliteralCellCenter(cell),
    );
  });

  it.each([
    ["SP", { x: 120, y: 120 }],
    ["Sp", { x: 280, y: 120 }],
    ["sP", { x: 120, y: 280 }],
    ["sp", { x: 280, y: 280 }],
  ] as const)("places biliteral cell %s", (cell, expected) => {
    expect(biliteralCellCenter(cell)).toEqual(expected);
  });
});

describe("triliteral boundary positions", () => {
  it.each([
    [["SMP", "SmP"], "M", { x: 120, y: 120 }],
    [["SMp", "Smp"], "M", { x: 280, y: 120 }],
    [["sMP", "smP"], "M", { x: 120, y: 280 }],
    [["sMp", "smp"], "M", { x: 280, y: 280 }],
    [["SMP", "sMP"], "S", { x: 160, y: 200 }],
    [["SMp", "sMp"], "S", { x: 240, y: 200 }],
    [["SmP", "smP"], "S", { x: 80, y: 200 }],
    [["Smp", "smp"], "S", { x: 320, y: 200 }],
    [["SMP", "SMp"], "P", { x: 200, y: 160 }],
    [["sMP", "sMp"], "P", { x: 200, y: 240 }],
    [["SmP", "Smp"], "P", { x: 200, y: 80 }],
    [["smP", "smp"], "P", { x: 200, y: 320 }],
  ] as const)(
    "resolves %j across %s",
    (cells, partitionRole, expected) => {
      expect(
        resolveTriliteralCounterPosition({
          type: "boundary",
          cells,
          partitionRole,
        }),
      ).toEqual(expected);
    },
  );

  it("is independent of boundary cell order", () => {
    const forward = resolveTriliteralCounterPosition({
      type: "boundary",
      cells: ["SMP", "sMP"],
      partitionRole: "S",
    });
    const reverse = resolveTriliteralCounterPosition({
      type: "boundary",
      cells: ["sMP", "SMP"],
      partitionRole: "S",
    });

    expect(reverse).toEqual(forward);
  });

  it("rejects a mismatched partition role", () => {
    expect(() =>
      resolveTriliteralCounterPosition({
        type: "boundary",
        cells: ["SMP", "sMP"],
        partitionRole: "M",
      }),
    ).toThrow("SMP/sMP");
    expect(() =>
      resolveTriliteralCounterPosition({
        type: "boundary",
        cells: ["SMP", "sMP"],
        partitionRole: "M",
      }),
    ).toThrow("M");
  });

  it("rejects non-adjacent cells", () => {
    expect(() =>
      resolveTriliteralCounterPosition({
        type: "boundary",
        cells: ["SMP", "smp"],
        partitionRole: "S",
      }),
    ).toThrow("SMP/smp");
  });
});

describe("biliteral boundary positions", () => {
  it.each([
    [["SP", "sP"], "S", { x: 120, y: 200 }],
    [["Sp", "sp"], "S", { x: 280, y: 200 }],
    [["SP", "Sp"], "P", { x: 200, y: 120 }],
    [["sP", "sp"], "P", { x: 200, y: 280 }],
  ] as const)(
    "resolves %j across %s",
    (cells, partitionRole, expected) => {
      expect(
        resolveBiliteralCounterPosition({
          type: "boundary",
          cells,
          partitionRole,
        }),
      ).toEqual(expected);
    },
  );

  it("rejects invalid biliteral boundaries", () => {
    expect(() =>
      resolveBiliteralCounterPosition({
        type: "boundary",
        cells: ["SP", "sp"],
        partitionRole: "S",
      }),
    ).toThrow("SP/sp");
    expect(() =>
      resolveBiliteralCounterPosition({
        type: "boundary",
        cells: ["SP", "Sp"],
        partitionRole: "S",
      }),
    ).toThrow("S");
  });

  it("resolves frozen anchors without mutation and deterministically", () => {
    const anchor = Object.freeze({
      type: "boundary" as const,
      cells: Object.freeze(["SP", "sP"] as const),
      partitionRole: "S" as const,
    });

    expect(resolveBiliteralCounterPosition(anchor)).toEqual({
      x: 120,
      y: 200,
    });
    expect(resolveBiliteralCounterPosition(anchor)).toEqual({
      x: 120,
      y: 200,
    });
    expect(anchor.cells).toEqual(["SP", "sP"]);
  });
});

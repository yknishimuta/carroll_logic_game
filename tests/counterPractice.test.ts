import { describe, expect, it } from "vitest";
import type {
  BiliteralCounterPlacements,
  TriliteralCounterAnchor,
  TriliteralCounterPlacements,
} from "../src/domain/counterPlacement";
import {
  applyBiliteralCounterTool,
  applyTriliteralCounterTool,
  createBiliteralAttemptPlacements,
  createBiliteralCounterTargets,
  createInitialCounterPracticeState,
  createTriliteralAttemptPlacements,
  createTriliteralCounterTargets,
  findBiliteralCounterTarget,
  findTriliteralCounterTarget,
  isCounterPlacementMode,
  isCounterTool,
  validateBiliteralCounterAttempt,
  validateTriliteralCounterAttempt,
  type UserBiliteralCounterPlacement,
  type UserTriliteralCounterPlacement,
} from "../src/app/counterPractice";

const smp = { type: "cell" as const, cell: "SMP" as const };
const smpBoundary: TriliteralCounterAnchor = {
  type: "boundary",
  partitionRole: "S",
  cells: ["SMP", "sMP"],
};

describe("counter practice", () => {
  it.each([
    ["automatic", true],
    ["manual", true],
    ["quiz", false],
    ["", false],
  ])("validates counter placement mode %s", (value, expected) => {
    expect(isCounterPlacementMode(value)).toBe(expected);
  });

  it.each([
    ["emptiness", true],
    ["existence", true],
    ["erase", true],
    ["O", false],
    ["", false],
  ])("validates counter tool %s", (value, expected) => {
    expect(isCounterTool(value)).toBe(expected);
  });

  it("creates independent initial state values", () => {
    const first = createInitialCounterPracticeState();
    const second = createInitialCounterPracticeState();
    expect(first).toEqual({
      mode: "automatic",
      selectedTool: "emptiness",
      firstPremise: { placements: [], check: { kind: "not-checked" } },
      combinedPremises: { placements: [], check: { kind: "not-checked" } },
      conclusion: { placements: [], check: { kind: "not-checked" } },
    });
    expect(first).not.toBe(second);
    expect(first.firstPremise.placements).not.toBe(
      second.firstPremise.placements,
    );
  });

  it("places, replaces, and erases a triliteral counter", () => {
    const withO = applyTriliteralCounterTool([], smp, "emptiness");
    expect(withO).toEqual([{ kind: "emptiness", anchor: smp }]);
    const withI = applyTriliteralCounterTool(withO, smp, "existence");
    expect(withI).toEqual([{ kind: "existence", anchor: smp }]);
    expect(applyTriliteralCounterTool(withI, smp, "erase")).toEqual([]);
    expect(applyTriliteralCounterTool([], smp, "erase")).toEqual([]);
  });

  it("treats reverse boundary cell order as the same anchor", () => {
    const placed = applyTriliteralCounterTool(
      [{ kind: "emptiness", anchor: smpBoundary }],
      {
        type: "boundary",
        partitionRole: "S",
        cells: ["sMP", "SMP"],
      },
      "existence",
    );
    expect(placed).toHaveLength(1);
    expect(placed[0]?.kind).toBe("existence");
  });

  it("sorts cell anchors before boundaries deterministically", () => {
    const boundaryFirst: readonly UserTriliteralCounterPlacement[] = [
      { kind: "existence", anchor: smpBoundary },
      { kind: "emptiness", anchor: smp },
      { kind: "emptiness", anchor: { type: "cell", cell: "SMp" } },
    ];
    const result = boundaryFirst.reduce(
      (placements, placement) =>
        applyTriliteralCounterTool(
          placements,
          placement.anchor,
          placement.kind,
        ),
      [] as readonly UserTriliteralCounterPlacement[],
    );
    expect(result.map(({ anchor }) => anchor.type === "cell"
      ? anchor.cell
      : anchor.partitionRole)).toEqual(["SMP", "SMp", "S"]);
  });

  it("places, replaces, and erases a biliteral boundary counter", () => {
    const anchor = {
      type: "boundary" as const,
      partitionRole: "P" as const,
      cells: ["SP", "Sp"] as const,
    };
    const withO = applyBiliteralCounterTool([], anchor, "emptiness");
    const withI = applyBiliteralCounterTool(withO, {
      ...anchor,
      cells: ["Sp", "SP"],
    }, "existence");
    expect(withI).toEqual([{
      kind: "existence",
      anchor: { ...anchor, cells: ["Sp", "SP"] },
    }]);
    expect(applyBiliteralCounterTool(withI, anchor, "erase")).toEqual([]);
  });

  it("accepts a complete match regardless of order and source IDs", () => {
    const expected: TriliteralCounterPlacements = {
      emptinessCounters: [
        { kind: "emptiness", anchor: { type: "cell", cell: "SMp" } },
        { kind: "emptiness", anchor: { type: "cell", cell: "sMp" } },
      ],
      existenceCounters: [{
        kind: "existence",
        anchor: smpBoundary,
        sourceIds: ["first-premise", "another-source"],
      }],
    };
    const attempt: readonly UserTriliteralCounterPlacement[] = [
      { kind: "existence", anchor: { ...smpBoundary, cells: ["sMP", "SMP"] } },
      { kind: "emptiness", anchor: { type: "cell", cell: "sMp" } },
      { kind: "emptiness", anchor: { type: "cell", cell: "SMp" } },
    ];
    expect(validateTriliteralCounterAttempt(attempt, expected)).toEqual({
      ok: true,
    });
  });

  it("counts missing, extra, and wrong kind independently", () => {
    const expected: TriliteralCounterPlacements = {
      emptinessCounters: [
        { kind: "emptiness", anchor: { type: "cell", cell: "SMp" } },
        { kind: "emptiness", anchor: { type: "cell", cell: "sMp" } },
      ],
      existenceCounters: [{
        kind: "existence",
        anchor: smpBoundary,
        sourceIds: ["first"],
      }],
    };
    const attempt: readonly UserTriliteralCounterPlacement[] = [
      { kind: "existence", anchor: { type: "cell", cell: "SMp" } },
      { kind: "existence", anchor: { type: "cell", cell: "smp" } },
    ];
    expect(validateTriliteralCounterAttempt(attempt, expected)).toEqual({
      ok: false,
      summary: { missingCount: 2, extraCount: 1, wrongKindCount: 1 },
    });
  });

  it("accepts an empty expected conclusion and counts extra counters", () => {
    const expected: BiliteralCounterPlacements = {
      emptinessCounters: [],
      existenceCounters: [],
    };
    expect(validateBiliteralCounterAttempt([], expected)).toEqual({ ok: true });
    expect(validateBiliteralCounterAttempt([{
      kind: "existence",
      anchor: { type: "cell", cell: "SP" },
    }], expected)).toEqual({
      ok: false,
      summary: { missingCount: 0, extraCount: 1, wrongKindCount: 0 },
    });
  });

  it("rejects duplicate answer anchors with the anchor in the error", () => {
    const duplicate: readonly UserBiliteralCounterPlacement[] = [
      { kind: "emptiness", anchor: { type: "cell", cell: "SP" } },
      { kind: "existence", anchor: { type: "cell", cell: "SP" } },
    ];
    expect(() => validateBiliteralCounterAttempt(duplicate, {
      emptinessCounters: [],
      existenceCounters: [],
    })).toThrow(/cell:SP/);
  });

  it("converts user counters for the SVG renderer without source IDs", () => {
    expect(createTriliteralAttemptPlacements([
      { kind: "existence", anchor: smpBoundary },
      { kind: "emptiness", anchor: smp },
    ])).toEqual({
      emptinessCounters: [{ kind: "emptiness", anchor: smp }],
      existenceCounters: [{
        kind: "existence",
        anchor: smpBoundary,
        sourceIds: [],
      }],
    });
    expect(createBiliteralAttemptPlacements([{
      kind: "existence",
      anchor: { type: "cell", cell: "SP" },
    }]).existenceCounters[0]?.sourceIds).toEqual([]);
  });

  it("creates the 20 unique triliteral targets in logical order", () => {
    const targets = createTriliteralCounterTargets();
    expect(targets).toHaveLength(20);
    expect(targets.filter(({ anchor }) => anchor.type === "cell")).toHaveLength(8);
    expect(targets.filter(({ anchor }) => anchor.type === "boundary")).toHaveLength(12);
    expect(new Set(targets.map(({ key }) => key)).size).toBe(20);
    expect(targets[0]).toMatchObject({
      key: "triliteral:cell:SMP",
      position: { x: 160, y: 160 },
    });
    expect(targets[8]).toMatchObject({
      key: "triliteral:boundary:S:SMP:sMP",
      position: { x: 160, y: 200 },
    });
  });

  it("creates the 8 unique biliteral targets", () => {
    const targets = createBiliteralCounterTargets();
    expect(targets).toHaveLength(8);
    expect(targets.filter(({ anchor }) => anchor.type === "cell")).toHaveLength(4);
    expect(targets.filter(({ anchor }) => anchor.type === "boundary")).toHaveLength(4);
    expect(new Set(targets.map(({ key }) => key)).size).toBe(8);
    expect(targets[0]).toMatchObject({
      key: "biliteral:cell:SP",
      position: { x: 120, y: 120 },
    });
  });

  it("finds known targets and reports unknown keys", () => {
    expect(findTriliteralCounterTarget("triliteral:cell:SMP").anchor)
      .toEqual(smp);
    expect(findBiliteralCounterTarget("biliteral:cell:SP").anchor)
      .toEqual({ type: "cell", cell: "SP" });
    expect(() => findTriliteralCounterTarget("bad-key")).toThrow(/bad-key/);
    expect(() => findBiliteralCounterTarget("bad-key")).toThrow(/bad-key/);
  });

  it("does not mutate frozen inputs and is deterministic", () => {
    const input = Object.freeze([
      Object.freeze({ kind: "emptiness" as const, anchor: Object.freeze(smp) }),
    ]);
    const first = applyTriliteralCounterTool(input, smpBoundary, "existence");
    const second = applyTriliteralCounterTool(input, smpBoundary, "existence");
    expect(first).toEqual(second);
    expect(input).toEqual([{ kind: "emptiness", anchor: smp }]);
  });
});

import { describe, expect, it } from "vitest";
import type { BiliteralDiagramState } from "../src/domain/conclusion";
import {
  inferConclusionForms,
  isConclusionEntailed,
  removeRedundantConclusionForms,
} from "../src/logic/conclusionInference";

const emptyState: BiliteralDiagramState = {
  emptyCells: [],
  existentials: [],
};

function conclusion(form: "A" | "E" | "I" | "O") {
  return {
    form,
    subjectRole: "S" as const,
    predicateRole: "P" as const,
  };
}

describe("isConclusionEntailed", () => {
  it("entails I only from an existence constrained to SP", () => {
    expect(
      isConclusionEntailed(
        {
          emptyCells: [],
          existentials: [
            { sourceId: "i", possibleCells: ["SP"] },
          ],
        },
        conclusion("I"),
      ),
    ).toBe(true);
    expect(
      isConclusionEntailed(
        {
          emptyCells: [],
          existentials: [
            { sourceId: "i", possibleCells: ["SP", "sP"] },
          ],
        },
        conclusion("I"),
      ),
    ).toBe(false);
  });

  it("entails O only from an existence constrained to Sp", () => {
    expect(
      isConclusionEntailed(
        {
          emptyCells: [],
          existentials: [
            { sourceId: "o", possibleCells: ["Sp"] },
          ],
        },
        conclusion("O"),
      ),
    ).toBe(true);
    expect(
      isConclusionEntailed(
        {
          emptyCells: [],
          existentials: [
            { sourceId: "o", possibleCells: ["Sp", "sp"] },
          ],
        },
        conclusion("O"),
      ),
    ).toBe(false);
  });

  it("entails E exactly when SP is empty", () => {
    expect(
      isConclusionEntailed(
        { emptyCells: ["SP"], existentials: [] },
        conclusion("E"),
      ),
    ).toBe(true);
    expect(isConclusionEntailed(emptyState, conclusion("E"))).toBe(false);
  });

  it("requires Sp empty and SP existence for Carroll A", () => {
    expect(
      isConclusionEntailed(
        {
          emptyCells: ["Sp"],
          existentials: [
            { sourceId: "a", possibleCells: ["SP"] },
          ],
        },
        conclusion("A"),
      ),
    ).toBe(true);
    expect(
      isConclusionEntailed(
        { emptyCells: ["Sp"], existentials: [] },
        conclusion("A"),
      ),
    ).toBe(false);
  });

  it("requires only Sp empty for modern A", () => {
    expect(
      isConclusionEntailed(
        { emptyCells: ["Sp"], existentials: [] },
        conclusion("A"),
        { existentialImport: "modern" },
      ),
    ).toBe(true);
  });
});

describe("inferConclusionForms", () => {
  it("returns all entailed forms in A, E, I, O order", () => {
    expect(
      inferConclusionForms({
        emptyCells: ["Sp", "SP"],
        existentials: [
          { sourceId: "i", possibleCells: ["SP"] },
          { sourceId: "o", possibleCells: ["Sp"] },
        ],
      }),
    ).toEqual(["A", "E", "I", "O"]);
  });

  it("is deterministic with frozen input", () => {
    const state: BiliteralDiagramState = Object.freeze({
      emptyCells: Object.freeze(["Sp"] as const),
      existentials: Object.freeze([
        Object.freeze({
          sourceId: "i",
          possibleCells: Object.freeze(["SP"] as const),
        }),
      ]),
    });

    expect(inferConclusionForms(state)).toEqual(["A", "I"]);
    expect(inferConclusionForms(state)).toEqual(["A", "I"]);
  });
});

describe("removeRedundantConclusionForms", () => {
  it.each([
    [["A", "I"], ["A"]],
    [["E", "O"], ["E"]],
    [["I", "O"], ["I", "O"]],
    [["A", "E", "I", "O"], ["A", "E"]],
    [[], []],
    [["O", "A", "I", "O", "E"], ["A", "E"]],
  ] as const)("simplifies %j to %j", (forms, expected) => {
    const frozen = Object.freeze([...forms]);

    expect(removeRedundantConclusionForms(frozen)).toEqual(expected);
    expect(frozen).toEqual(forms);
  });
});

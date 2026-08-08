import { describe, expect, it } from "vitest";
import { mergeConstraints, syllogismToConstraints } from "../src/logic/constraintMerge";

describe("mergeConstraints", () => {
  it("unites empty cells and narrows existence candidates", () => {
    expect(
      mergeConstraints([
        {
          emptyCells: ["SMP"],
          existentials: [],
        },
        {
          emptyCells: ["SMp"],
          existentials: [
            {
              sourceId: "second",
              possibleCells: ["SMP", "SmP"],
            },
          ],
        },
      ]),
    ).toEqual({
      emptyCells: ["SMP", "SMp"],
      existentials: [
        {
          sourceId: "second",
          possibleCells: ["SmP"],
        },
      ],
    });
  });

  it("deduplicates empty cells and candidate cells", () => {
    expect(
      mergeConstraints([
        {
          emptyCells: ["SMP"],
          existentials: [
            {
              sourceId: "first",
              possibleCells: ["SmP", "SmP"],
            },
          ],
        },
        {
          emptyCells: ["SMP"],
          existentials: [],
        },
      ]),
    ).toEqual({
      emptyCells: ["SMP"],
      existentials: [
        {
          sourceId: "first",
          possibleCells: ["SmP"],
        },
      ],
    });
  });

  it("rejects an existence claim excluded by empty-cell constraints", () => {
    expect(() =>
      mergeConstraints([
        {
          emptyCells: ["SMP", "SmP"],
          existentials: [],
        },
        {
          emptyCells: [],
          existentials: [
            {
              sourceId: "second",
              possibleCells: ["SMP", "SmP"],
            },
          ],
        },
      ]),
    ).toThrow("contradictory");
  });
});

describe("syllogismToConstraints", () => {
  it("integrates the constraints from both premises", () => {
    expect(
      syllogismToConstraints({
        firstPremise: {
          form: "A",
          subject: { role: "M", complemented: false },
          predicate: { role: "P", complemented: false },
        },
        secondPremise: {
          form: "A",
          subject: { role: "S", complemented: false },
          predicate: { role: "M", complemented: false },
        },
      }),
    ).toEqual({
      emptyCells: ["SMp", "sMp", "SmP", "Smp"],
      existentials: [
        {
          sourceId: "first-premise",
          possibleCells: ["SMP", "sMP"],
        },
        {
          sourceId: "second-premise",
          possibleCells: ["SMP"],
        },
      ],
    });
  });

  it("uses a universal premise to narrow a particular premise", () => {
    expect(
      syllogismToConstraints({
        firstPremise: {
          form: "A",
          subject: { role: "M", complemented: false },
          predicate: { role: "P", complemented: false },
        },
        secondPremise: {
          form: "I",
          subject: { role: "S", complemented: false },
          predicate: { role: "M", complemented: false },
        },
      }),
    ).toEqual({
      emptyCells: ["SMp", "sMp"],
      existentials: [
        {
          sourceId: "first-premise",
          possibleCells: ["SMP", "sMP"],
        },
        {
          sourceId: "second-premise",
          possibleCells: ["SMP"],
        },
      ],
    });
  });
});

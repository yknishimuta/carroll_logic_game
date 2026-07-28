import { describe, expect, it } from "vitest";
import { propositionToConstraints } from "../src/logic/propositionConstraints";

describe("propositionToConstraints", () => {
  it("converts All S are P into empty S and non-P cells", () => {
    expect(
      propositionToConstraints({
        form: "A",
        subject: "S",
        predicate: "P",
      }),
    ).toEqual({
      emptyCells: ["SMp", "Smp"],
      existentials: [
        {
          sourceId: "proposition",
          possibleCells: ["SMP", "SmP"],
        },
      ],
    });
  });

  it("converts No S are P into empty S and P cells", () => {
    expect(
      propositionToConstraints({
        form: "E",
        subject: "S",
        predicate: "P",
      }),
    ).toEqual({
      emptyCells: ["SMP", "SmP"],
      existentials: [],
    });
  });

  it("converts Some S are P into two candidates across M", () => {
    expect(
      propositionToConstraints({
        form: "I",
        subject: "S",
        predicate: "P",
      }),
    ).toEqual({
      emptyCells: [],
      existentials: [
        {
          sourceId: "proposition",
          possibleCells: ["SMP", "SmP"],
        },
      ],
    });
  });

  it("converts Some S are not P into two candidates across M", () => {
    expect(
      propositionToConstraints({
        form: "O",
        subject: "S",
        predicate: "P",
      }),
    ).toEqual({
      emptyCells: [],
      existentials: [
        {
          sourceId: "proposition",
          possibleCells: ["SMp", "Smp"],
        },
      ],
    });
  });

  it("works for term pairs other than S and P", () => {
    expect(
      propositionToConstraints({
        form: "A",
        subject: "M",
        predicate: "P",
      }),
    ).toEqual({
      emptyCells: ["SMp", "sMp"],
      existentials: [
        {
          sourceId: "proposition",
          possibleCells: ["SMP", "sMP"],
        },
      ],
    });
  });

  it("omits existential import from A in modern mode", () => {
    expect(
      propositionToConstraints(
        {
          form: "A",
          subject: "S",
          predicate: "P",
        },
        "test-source",
        { existentialImport: "modern" },
      ),
    ).toEqual({
      emptyCells: ["SMp", "Smp"],
      existentials: [],
    });
  });

  it("rejects a proposition using the same term twice", () => {
    expect(() =>
      propositionToConstraints({
        form: "A",
        subject: "M",
        predicate: "M",
      }),
    ).toThrow("distinct subject and predicate");
  });
});

import { describe, expect, it } from "vitest";
import { propositionToConstraints } from "../src/logic/propositionConstraints";

describe("propositionToConstraints", () => {
  it("converts All S are P into empty S and non-P cells", () => {
    expect(
      propositionToConstraints({
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
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
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
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
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
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
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
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
        subject: { role: "M", complemented: false },
        predicate: { role: "P", complemented: false },
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
          subject: { role: "S", complemented: false },
          predicate: { role: "P", complemented: false },
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
        subject: { role: "M", complemented: false },
        predicate: { role: "M", complemented: false },
      }),
    ).toThrow("distinct subject and predicate");
  });

  it("converts All S are P′ by reversing predicate membership", () => {
    expect(propositionToConstraints({
      form: "A",
      subject: { role: "S", complemented: false },
      predicate: { role: "P", complemented: true },
    })).toEqual({
      emptyCells: ["SMP", "SmP"],
      existentials: [{
        sourceId: "proposition",
        possibleCells: ["SMp", "Smp"],
      }],
    });
  });

  it("reverses membership for a complemented subject", () => {
    expect(propositionToConstraints({
      form: "I",
      subject: { role: "S", complemented: true },
      predicate: { role: "P", complemented: false },
    })).toEqual({
      emptyCells: [],
      existentials: [{
        sourceId: "proposition",
        possibleCells: ["sMP", "smP"],
      }],
    });
  });
});

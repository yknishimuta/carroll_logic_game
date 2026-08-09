import { describe, expect, it } from "vitest";
import type { BiliteralDiagramState } from "../src/domain/conclusion";
import {
  inferCompleteConclusion,
  inferSyllogismConclusion,
  isConclusionEntailed,
} from "../src/logic/conclusionInference";
import { CARROLL_BOOK_VIII_SECTION_4 } from "./fixtures/carrollBookVIIISection4";

const emptyState: BiliteralDiagramState = {
  emptyCells: [],
  existentials: [],
};

function conclusion(form: "A" | "E" | "I" | "O") {
  return {
    form,
    subject: { role: "S" as const, complemented: false },
    predicate: { role: "P" as const, complemented: false },
  };
}

describe("isConclusionEntailed", () => {
  it.each([
    [false, false, "SP"],
    [false, true, "Sp"],
    [true, false, "sP"],
    [true, true, "sp"],
  ] as const)(
    "evaluates E with subject complemented=%s and predicate complemented=%s from %s",
    (subjectComplemented, predicateComplemented, emptyCell) => {
      expect(isConclusionEntailed(
        { emptyCells: [emptyCell], existentials: [] },
        {
          form: "E",
          subject: { role: "S", complemented: subjectComplemented },
          predicate: { role: "P", complemented: predicateComplemented },
        },
      )).toBe(true);
    },
  );

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

describe("CompleteConclusion", () => {
  const barbara = {
    firstPremise: { form: "A" as const, subject: { role: "M" as const, complemented: false }, predicate: { role: "P" as const, complemented: false } },
    secondPremise: { form: "A" as const, subject: { role: "S" as const, complemented: false }, predicate: { role: "M" as const, complemented: false } },
  };
  const section4Number10 = CARROLL_BOOK_VIII_SECTION_4.find(
    (testCase) => testCase.number === 10,
  );
  if (section4Number10 === undefined) {
    throw new Error("Book VIII §4 No. 10 fixture is missing.");
  }

  it("uses null as the only no-conclusion representation", () => {
    expect(inferCompleteConclusion(emptyState)).toBeNull();
  });

  it("keeps Barbara's middle-term boundary only in the triliteral state", () => {
    const result = inferSyllogismConclusion(barbara);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.triliteralState.existentials).toEqual([
      { sourceId: "first-premise", possibleCells: ["SMP", "sMP"] },
      { sourceId: "second-premise", possibleCells: ["SMP"] },
    ]);
    expect(result.biliteralState).toEqual({
      emptyCells: ["Sp"],
      existentials: [
        { sourceId: "first-premise", possibleCells: ["SP", "sP"] },
        { sourceId: "second-premise", possibleCells: ["SP"] },
      ],
    });
    expect(result.completeConclusion).toEqual({
      biliteralState: {
        emptyCells: ["Sp"],
        existentials: [
          { sourceId: "second-premise", possibleCells: ["SP"] },
        ],
      },
      propositions: [{
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      }],
    });
  });

  it("preserves the two signed propositions in Book VIII §4 No. 10", () => {
    const result = inferSyllogismConclusion(section4Number10.premises);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.completeConclusion?.propositions).toEqual([
      {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      {
        form: "A",
        subject: { role: "P", complemented: true },
        predicate: { role: "S", complemented: true },
      },
    ]);
  });

  it("retains the reverse P-to-S conclusion orientation", () => {
    const result = inferSyllogismConclusion(section4Number10.premises);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.completeConclusion?.propositions).toContainEqual({
      form: "A",
      subject: { role: "P", complemented: true },
      predicate: { role: "S", complemented: true },
    });
  });

  it("covers separate empty and existence information without collapsing it", () => {
    const state: BiliteralDiagramState = {
      emptyCells: ["Sp"],
      existentials: [
        { sourceId: "sp", possibleCells: ["SP"] },
        { sourceId: "lower", possibleCells: ["sp"] },
      ],
    };

    const complete = inferCompleteConclusion(state);
    expect(complete?.biliteralState).toBe(state);
    expect(complete?.propositions).toEqual([
      {
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      },
      {
        form: "A",
        subject: { role: "P", complemented: true },
        predicate: { role: "S", complemented: true },
      },
    ]);
  });
});

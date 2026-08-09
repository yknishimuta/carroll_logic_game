import { describe, expect, it } from "vitest";
import { computeProblem } from "../src/app/problemComputation";
import { validateBiliteralCounterAttempt } from "../src/app/counterPractice";
import { getBuiltInProblem } from "../src/data/problems";

describe("ProblemComputation complete conclusions", () => {
  it("uses only Barbara's certain retinend information for conclusion placements", () => {
    const computation = computeProblem(getBuiltInProblem("barbara-aaa1"));
    expect(computation.completeConclusion?.biliteralState).toEqual({
      emptyCells: ["Sp"],
      existentials: [{ sourceId: "second-premise", possibleCells: ["SP"] }],
    });
    expect(computation.conclusionPlacements).toEqual({
      emptinessCounters: [{ kind: "emptiness", anchor: { type: "cell", cell: "Sp" } }],
      existenceCounters: [{
        kind: "existence",
        sourceIds: ["second-premise"],
        anchor: { type: "cell", cell: "SP" },
      }],
    });
  });
  it("preserves both signed conclusions for Book VIII §4 No. 10", () => {
    const computation = computeProblem({
      id: "carroll-viii-i-4-10",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "y", complemented: true },
          predicate: { termId: "m", complemented: true },
        },
        secondPremise: {
          form: "A",
          subject: { termId: "x", complemented: false },
          predicate: { termId: "m", complemented: false },
        },
      },
    });

    expect(computation.completeConclusion).not.toBeNull();
    expect(computation.completeConclusion?.propositions).toEqual([
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
    expect(computation.concreteConclusions).toEqual([
      {
        form: "A",
        subject: { termId: "x", complemented: false },
        predicate: { termId: "y", complemented: false },
      },
      {
        form: "A",
        subject: { termId: "y", complemented: true },
        predicate: { termId: "x", complemented: true },
      },
    ]);
    expect(computation.completeConclusion?.propositions).toHaveLength(
      computation.concreteConclusions.length,
    );
    expect(computation.conclusionPlacements).toEqual({
      emptinessCounters: [{
        kind: "emptiness",
        anchor: { type: "cell", cell: "Sp" },
      }],
      existenceCounters: [
        {
          kind: "existence",
          sourceIds: ["first-premise"],
          anchor: { type: "cell", cell: "sp" },
        },
        {
          kind: "existence",
          sourceIds: ["second-premise"],
          anchor: { type: "cell", cell: "SP" },
        },
      ],
    });

    const completeAttempt = [
      ...computation.conclusionPlacements.emptinessCounters,
      ...computation.conclusionPlacements.existenceCounters,
    ].map(({ kind, anchor }) => ({ kind, anchor }));
    expect(validateBiliteralCounterAttempt(
      completeAttempt,
      computation.conclusionPlacements,
    )).toEqual({ ok: true });
    expect(validateBiliteralCounterAttempt(
      completeAttempt.slice(0, 2),
      computation.conclusionPlacements,
    )).toEqual({
      ok: false,
      summary: { missingCount: 1, extraCount: 0, wrongKindCount: 0 },
    });
  });

  it("distinguishes no conclusion from a multi-proposition conclusion", () => {
    const noConclusion = computeProblem(
      getBuiltInProblem("invalid-undistributed-middle"),
    );
    expect(noConclusion.completeConclusion).toBeNull();
    expect(noConclusion.concreteConclusions).toEqual([]);

    const multiple = computeProblem({
      id: "carroll-viii-i-4-10",
      premises: {
        firstPremise: {
          form: "A",
          subject: { termId: "y", complemented: true },
          predicate: { termId: "m", complemented: true },
        },
        secondPremise: {
          form: "A",
          subject: { termId: "x", complemented: false },
          predicate: { termId: "m", complemented: false },
        },
      },
    });
    expect(multiple.completeConclusion).not.toBeNull();
    expect(multiple.completeConclusion?.propositions).toHaveLength(2);
  });
});

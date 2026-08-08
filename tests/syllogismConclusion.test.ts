import { describe, expect, it } from "vitest";
import type { LogicSettings } from "../src/domain/logicSettings";
import type { PropositionForm } from "../src/domain/proposition";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import type { TermRole } from "../src/domain/term";
import {
  inferAllEntailedSignedPropositions,
  inferSyllogismConclusion,
} from "../src/logic/conclusionInference";

const carroll: LogicSettings = { existentialImport: "carroll" };
const modern: LogicSettings = { existentialImport: "modern" };

function premises(
  firstForm: PropositionForm,
  firstSubject: TermRole,
  firstPredicate: TermRole,
  secondForm: PropositionForm,
  secondSubject: TermRole,
  secondPredicate: TermRole,
): AbstractSyllogism {
  return {
    firstPremise: {
      form: firstForm,
      subject: { role: firstSubject, complemented: false },
      predicate: { role: firstPredicate, complemented: false },
    },
    secondPremise: {
      form: secondForm,
      subject: { role: secondSubject, complemented: false },
      predicate: { role: secondPredicate, complemented: false },
    },
  };
}

function expectForms(
  syllogism: AbstractSyllogism,
  settings: LogicSettings,
  entailedForms: readonly PropositionForm[],
): void {
  const result = inferSyllogismConclusion(syllogism, settings);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }

  expect(inferAllEntailedSignedPropositions(
    result.biliteralState,
    settings,
  ).filter(({ subject, predicate }) =>
    subject.role === "S" && !subject.complemented &&
    predicate.role === "P" && !predicate.complemented
  ).map(({ form }) => form)).toEqual(entailedForms);
  expect(result.completeConclusion === null).toBe(entailedForms.length === 0);
}

describe("valid first-figure syllogisms", () => {
  it("infers Barbara AAA-1 in Carroll and modern modes", () => {
    const barbara = premises("A", "M", "P", "A", "S", "M");
    const carrollResult = inferSyllogismConclusion(barbara, carroll);

    expect(carrollResult.ok).toBe(true);
    if (carrollResult.ok) {
      expect(carrollResult.triliteralState.emptyCells).toEqual([
        "SMp",
        "sMp",
        "SmP",
        "Smp",
      ]);
      expect(carrollResult.triliteralState.existentials).toEqual([
        {
          sourceId: "first-premise",
          possibleCells: ["SMP", "sMP"],
        },
        {
          sourceId: "second-premise",
          possibleCells: ["SMP"],
        },
      ]);
      expect(carrollResult.biliteralState.emptyCells).toEqual(["Sp"]);
      expect(carrollResult.completeConclusion?.propositions).toContainEqual({
        form: "A",
        subject: { role: "S", complemented: false },
        predicate: { role: "P", complemented: false },
      });
    }

    expectForms(barbara, modern, ["A"]);
  });

  it("infers Celarent EAE-1 in Carroll and modern modes", () => {
    const celarent = premises("E", "M", "P", "A", "S", "M");

    expectForms(celarent, carroll, ["E", "O"]);
    expectForms(celarent, modern, ["E"]);
  });

  it("infers Darii AII-1", () => {
    expectForms(
      premises("A", "M", "P", "I", "S", "M"),
      carroll,
      ["I"],
    );
  });

  it("infers Ferio EIO-1", () => {
    expectForms(
      premises("E", "M", "P", "I", "S", "M"),
      carroll,
      ["O"],
    );
  });
});

describe("invalid syllogisms", () => {
  it("does not infer a conclusion with an undistributed middle", () => {
    expectForms(
      premises("A", "P", "M", "A", "S", "M"),
      carroll,
      [],
    );
  });

  it("does not merge witnesses from two particular premises", () => {
    const result = inferSyllogismConclusion(
      premises("I", "M", "P", "I", "S", "M"),
      carroll,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.completeConclusion).toBeNull();
      expect(result.biliteralState.existentials).toHaveLength(2);
      expect(result.biliteralState.existentials.map(({ sourceId }) => sourceId))
        .toEqual(["first-premise", "second-premise"]);
    }
  });

  it("reports contradictory premise constraints", () => {
    const result = inferSyllogismConclusion(
      premises("A", "M", "P", "E", "M", "P"),
      carroll,
    );

    expect(result).toMatchObject({
      ok: false,
      stage: "constraint-merge",
    });
  });
});

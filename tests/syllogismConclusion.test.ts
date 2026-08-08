import { describe, expect, it } from "vitest";
import type { LogicSettings } from "../src/domain/logicSettings";
import type {
  AbstractProposition,
  PropositionForm,
} from "../src/domain/proposition";
import type { AbstractSyllogism } from "../src/domain/syllogism";
import type { TermRole } from "../src/domain/term";
import { inferSyllogismConclusion } from "../src/logic/conclusionInference";
import { oracleEntailedForms } from "./helpers/semanticOracle";

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
  conclusionForms: readonly PropositionForm[],
): void {
  const result = inferSyllogismConclusion(syllogism, settings);

  expect(result.ok).toBe(true);
  if (!result.ok) {
    return;
  }

  expect(result.entailedForms).toEqual(entailedForms);
  expect(result.conclusionForms).toEqual(conclusionForms);
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
      expect(carrollResult.entailedForms).toEqual(["A", "I"]);
      expect(carrollResult.conclusionForms).toEqual(["A"]);
    }

    expectForms(barbara, modern, ["A"], ["A"]);
  });

  it("infers Celarent EAE-1 in Carroll and modern modes", () => {
    const celarent = premises("E", "M", "P", "A", "S", "M");

    expectForms(celarent, carroll, ["E", "O"], ["E"]);
    expectForms(celarent, modern, ["E"], ["E"]);
  });

  it("infers Darii AII-1", () => {
    expectForms(
      premises("A", "M", "P", "I", "S", "M"),
      carroll,
      ["I"],
      ["I"],
    );
  });

  it("infers Ferio EIO-1", () => {
    expectForms(
      premises("E", "M", "P", "I", "S", "M"),
      carroll,
      ["O"],
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
      expect(result.entailedForms).toEqual([]);
      expect(result.conclusionForms).toEqual([]);
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

describe("independent semantic verification", () => {
  const forms = ["A", "E", "I", "O"] as const;
  const figures: readonly [
    readonly [TermRole, TermRole],
    readonly [TermRole, TermRole],
  ][] = [
    [["M", "P"], ["S", "M"]],
    [["P", "M"], ["S", "M"]],
    [["M", "P"], ["M", "S"]],
    [["P", "M"], ["M", "S"]],
  ];
  const settingsCases = [carroll, modern] as const;

  it("matches all 128 form, figure, and settings combinations", () => {
    let checkedCases = 0;

    for (const settings of settingsCases) {
      for (const figure of figures) {
        for (const firstForm of forms) {
          for (const secondForm of forms) {
            const first: AbstractProposition = {
              form: firstForm,
              subject: { role: figure[0][0], complemented: false },
              predicate: { role: figure[0][1], complemented: false },
            };
            const second: AbstractProposition = {
              form: secondForm,
              subject: { role: figure[1][0], complemented: false },
              predicate: { role: figure[1][1], complemented: false },
            };
            const syllogism: AbstractSyllogism = {
              firstPremise: first,
              secondPremise: second,
            };
            const expected = oracleEntailedForms(syllogism, settings);
            const actual = inferSyllogismConclusion(syllogism, settings);

            checkedCases += 1;

            if (expected === null) {
              expect(actual.ok, JSON.stringify({ settings, figure, firstForm, secondForm }))
                .toBe(false);
            } else {
              expect(actual.ok, JSON.stringify({ settings, figure, firstForm, secondForm }))
                .toBe(true);
              if (actual.ok) {
                expect(
                  actual.entailedForms,
                  JSON.stringify({ settings, figure, firstForm, secondForm }),
                ).toEqual(expected);
              }
            }
          }
        }
      }
    }

    expect(checkedCases).toBe(128);
  });
});
